-- Assisted bank observations and explicit signed N:N matching. Imports never post money.
BEGIN;
CREATE OR REPLACE FUNCTION fin_import(actor users, operation uuid, p jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
<<import_scope>>
DECLARE batch uuid:=gen_random_uuid(); account uuid:=(p->>'accountId')::uuid; branch uuid:=(p->>'branchId')::uuid;
 existing fin_import_batches; observation fin_bank_transactions; row jsonb; ordinal integer:=0; imported integer:=0;
 fingerprint text; external text; amount bigint; day date;
BEGIN
 PERFORM fin_account(actor,account,branch,'reconcile');
 PERFORM ec_require(fin_global_account(actor,account),'GLOBAL_ACCOUNT_ACCESS_REQUIRED');
 PERFORM ec_require(p->>'format' IN('CSV','OFX') AND p->>'fileHash' ~ '^[a-f0-9]{64}$' AND jsonb_typeof(p->'rows')='array' AND jsonb_array_length(p->'rows') BETWEEN 1 AND 1000,'IMPORT_LIMIT');
 SELECT * INTO existing FROM fin_import_batches WHERE tenant_id=actor.tenant_id AND account_id=account AND file_hash=p->>'fileHash';
 IF existing.id IS NOT NULL THEN RETURN jsonb_build_object('batchId',existing.id,'importedCount',0,'alreadyImported',true);END IF;
 INSERT INTO fin_import_batches(id,tenant_id,account_id,operation_id,file_hash,format) VALUES(batch,actor.tenant_id,account,operation,p->>'fileHash',p->>'format');
 FOR row IN SELECT value FROM jsonb_array_elements(p->'rows') LOOP
  ordinal:=ordinal+1;amount:=fin_amount(row->'amountCents',true);day:=(row->>'date')::date;external:=NULLIF(btrim(row->>'externalId'),'');
  PERFORM ec_require(amount<>0 AND day IS NOT NULL AND length(COALESCE(row->>'description',''))<=1000 AND length(COALESCE(external,''))<=240,'INVALID_BANK_ROW');
  fingerprint:=encode(sha256(convert_to(jsonb_build_array(day,amount::text,COALESCE(row->>'description',''))::text,'UTF8')),'hex');
  IF external IS NOT NULL THEN
   SELECT * INTO observation FROM fin_bank_transactions WHERE tenant_id=actor.tenant_id AND account_id=account AND external_id=external;
   IF observation.id IS NOT NULL THEN
    PERFORM ec_require(observation.amount_cents=amount AND observation.booked_date=day,'BANK_IDENTITY_CONFLICT');CONTINUE;
   END IF;
  END IF;
  INSERT INTO fin_bank_transactions(tenant_id,batch_id,account_id,external_id,fingerprint,row_number,booked_date,amount_cents,description,possible_duplicate)
  VALUES(actor.tenant_id,batch,account,external,fingerprint,ordinal,day,amount,COALESCE(row->>'description',''),
   external IS NULL AND EXISTS(SELECT 1 FROM fin_bank_transactions b WHERE b.tenant_id=actor.tenant_id AND b.account_id=account AND b.fingerprint=import_scope.fingerprint));
  imported:=imported+1;
 END LOOP;
 RETURN jsonb_build_object('batchId',batch,'importedCount',imported,'alreadyImported',false);
END $$;
CREATE OR REPLACE FUNCTION fin_match(actor users, operation uuid, p jsonb, created_settlement uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE account uuid:=(p->>'accountId')::uuid; branch uuid:=(p->>'branchId')::uuid; match uuid:=gen_random_uuid(); edge jsonb;
 bank fin_bank_transactions; line fin_journal_lines; amount bigint; bank_used numeric; line_used numeric;
BEGIN
 PERFORM fin_account(actor,account,branch,'reconcile');PERFORM ec_require(fin_global_account(actor,account),'GLOBAL_ACCOUNT_ACCESS_REQUIRED');
 PERFORM ec_require(jsonb_typeof(p->'edges')='array' AND jsonb_array_length(p->'edges') BETWEEN 1 AND 1000,'MATCH_LIMIT');
 INSERT INTO fin_matches(id,tenant_id,account_id,operation_id) VALUES(match,actor.tenant_id,account,operation);
 FOR edge IN SELECT value FROM jsonb_array_elements(p->'edges') ORDER BY value->>'bankId',value->>'lineId' LOOP
  SELECT * INTO bank FROM fin_bank_transactions WHERE id=(edge->>'bankId')::uuid AND tenant_id=actor.tenant_id AND account_id=account;
  SELECT * INTO line FROM fin_journal_lines WHERE id=(edge->>'lineId')::uuid AND tenant_id=actor.tenant_id AND account_id=account;
  PERFORM ec_require(bank.id IS NOT NULL AND line.id IS NOT NULL AND line.branch_id=branch,'MATCH_SCOPE_DENIED');
  PERFORM fin_account(actor,account,line.branch_id,'reconcile');
  PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_journals j WHERE j.tenant_id=line.tenant_id AND j.reverses_id=line.journal_id),'REVERSED_MOVEMENT');
  amount:=fin_amount(edge->'amountCents',true);
  PERFORM ec_require(amount<>0 AND sign(amount)=sign(bank.amount_cents) AND sign(amount)=sign(line.debit_cents-line.credit_cents),'MATCH_SIGN_CONFLICT');
  SELECT COALESCE(sum(abs(e.amount_cents::numeric)),0) INTO bank_used FROM fin_match_edges e WHERE e.tenant_id=actor.tenant_id AND e.bank_id=bank.id AND NOT EXISTS(SELECT 1 FROM fin_unmatches u WHERE u.tenant_id=e.tenant_id AND u.match_id=e.match_id);
  SELECT COALESCE(sum(abs(e.amount_cents::numeric)),0) INTO line_used FROM fin_match_edges e WHERE e.tenant_id=actor.tenant_id AND e.line_id=line.id AND NOT EXISTS(SELECT 1 FROM fin_unmatches u WHERE u.tenant_id=e.tenant_id AND u.match_id=e.match_id);
  PERFORM ec_require(bank_used+abs(amount::numeric)<=abs(bank.amount_cents::numeric) AND line_used+abs(amount::numeric)<=abs(line.debit_cents::numeric-line.credit_cents),'MATCH_CAPACITY');
  IF created_settlement IS NOT NULL THEN PERFORM ec_require(line.settlement_id=created_settlement,'MATCH_PROVENANCE_CONFLICT');END IF;
  INSERT INTO fin_match_edges(tenant_id,match_id,bank_id,line_id,amount_cents,created_settlement_id)
  VALUES(actor.tenant_id,match,bank.id,line.id,amount,created_settlement);
 END LOOP;
 RETURN jsonb_build_object('matchId',match);
END $$;
CREATE OR REPLACE FUNCTION fin_bank_command(actor users, operation uuid, action text, p jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result jsonb; created jsonb; match fin_matches; entry jsonb; edges jsonb:='[]'; line uuid; settlement uuid; direction text;
BEGIN
 IF action='C17' THEN RETURN fin_import(actor,operation,p);
 ELSIF action='C18' THEN RETURN fin_match(actor,operation,p);
 ELSIF action IN('C19','C20') THEN
  IF action='C20' THEN
   direction:=p#>>'{title,direction}';
   PERFORM fin_access(actor,CASE direction WHEN 'PAY' THEN 'CONTAS_PAGAR' WHEN 'RECEIVE' THEN 'CONTAS_RECEBER' END,'manage');
   created:=fin_new_document(actor,operation,p->'title','BANK');
   SELECT jsonb_agg(jsonb_build_object('titleId',v->>'titleId','expectedVersion','1','principalCents',v->>'originalCents','discountCents','0','interestCents','0','penaltyCents','0','feeCents','0')) INTO entry FROM jsonb_array_elements(created->'titles') v;
   result:=fin_settle(actor,operation,(p->'settlement')||jsonb_build_object('direction',direction,'lines',entry));
  ELSE result:=fin_settle(actor,operation,p->'settlement');END IF;
  settlement:=(result->>'settlementId')::uuid;
  FOR entry IN SELECT value FROM jsonb_array_elements(p->'edges') LOOP
   SELECT l.id INTO line FROM fin_journal_lines l JOIN fin_journals j ON j.tenant_id=l.tenant_id AND j.id=l.journal_id
   WHERE l.tenant_id=actor.tenant_id AND l.settlement_id=settlement AND l.account_id=(p->>'accountId')::uuid
   AND l.branch_id=(p->>'branchId')::uuid AND j.source_key='settlement:'||settlement
   ORDER BY l.id LIMIT 1;
   -- Automatic mapping is only unambiguous for a single liquidity line.
   PERFORM ec_require((SELECT count(*) FROM fin_journal_lines l WHERE l.tenant_id=actor.tenant_id AND l.settlement_id=settlement AND l.account_id IS NOT NULL)=1,'EXPLICIT_MATCH_ALLOCATION_REQUIRED');
   edges:=edges||jsonb_build_array(entry||jsonb_build_object('lineId',line));
  END LOOP;
  RETURN result||COALESCE(created,'{}')||fin_match(actor,operation,p||jsonb_build_object('edges',edges),settlement);
 ELSIF action='C21' THEN
  SELECT * INTO match FROM fin_matches WHERE tenant_id=actor.tenant_id AND id=(p->>'matchId')::uuid;
  PERFORM ec_require(match.id IS NOT NULL,'MATCH_DENIED');
  PERFORM fin_account(actor,match.account_id,(p->>'branchId')::uuid,'reconcile');PERFORM ec_require(fin_global_account(actor,match.account_id),'GLOBAL_ACCOUNT_ACCESS_REQUIRED');
  PERFORM ec_require(length(btrim(p->>'reason')) BETWEEN 3 AND 1000,'REASON_REQUIRED');
  PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_match_edges e JOIN fin_journal_lines l ON l.id=e.line_id AND l.tenant_id=e.tenant_id WHERE e.tenant_id=actor.tenant_id AND e.match_id=match.id AND NOT ec_branch(actor,l.branch_id)),'BRANCH_DENIED');
  INSERT INTO fin_unmatches(tenant_id,match_id,operation_id,reason) VALUES(actor.tenant_id,match.id,operation,p->>'reason');
  IF COALESCE((p->>'reverseCreatedSettlement')::boolean,false) THEN
   FOR settlement IN SELECT DISTINCT created_settlement_id FROM fin_match_edges WHERE tenant_id=actor.tenant_id AND match_id=match.id AND created_settlement_id IS NOT NULL LOOP
    SELECT s.direction INTO direction FROM fin_settlements s WHERE s.tenant_id=actor.tenant_id AND s.id=settlement;
    PERFORM fin_access(actor,CASE direction WHEN 'PAY' THEN 'CONTAS_PAGAR' ELSE 'CONTAS_RECEBER' END,'manage');
    PERFORM fin_reverse(actor,operation,jsonb_build_object('direction',direction,'settlementId',settlement,'effectiveDate',p->>'effectiveDate','reason',p->>'reason'));
   END LOOP;
   PERFORM ec_require(FOUND,'NO_CREATED_SETTLEMENT');
  END IF;
  RETURN jsonb_build_object('matchId',match.id,'unmatched',true);
 END IF;
 RAISE EXCEPTION 'UNKNOWN_FINANCIAL_COMMAND' USING ERRCODE='P0001';
END $$;
COMMIT;

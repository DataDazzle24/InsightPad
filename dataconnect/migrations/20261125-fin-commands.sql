BEGIN;
CREATE OR REPLACE FUNCTION fin_new_document(actor users, operation uuid, p jsonb, origin text DEFAULT 'MANUAL') RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE document uuid:=gen_random_uuid(); title uuid; legacy uuid; category uuid; center uuid; branch uuid;
 total bigint; count integer; installment integer; amount bigint; direction text; due date; competence date;
 parts bigint[]; capacities bigint[]; classification_ids uuid[]:='{}'; remaining bigint[]:='{}';
 classification jsonb; classified numeric:=0; class_id uuid; ordinal integer:=0; i integer; result jsonb:='[]';
BEGIN
 branch:=(p->>'branchId')::uuid; PERFORM fin_branch(actor,branch);
 direction:=p->>'direction'; PERFORM ec_require(direction IN('PAY','RECEIVE'),'VALIDATION_ERROR');
 total:=fin_amount(p->'amountCents');count:=COALESCE((p->>'installmentCount')::integer,1);
 PERFORM ec_require(count BETWEEN 1 AND 120 AND total>=count,'ZERO_INSTALLMENT');
 due:=(p->>'dueDate')::date;competence:=(p->>'competenceDate')::date;
 PERFORM fin_period(actor.tenant_id,branch,competence);
 PERFORM ec_require(due IS NOT NULL AND (p->>'issueDate')::date IS NOT NULL AND length(btrim(p->>'description')) BETWEEN 1 AND 180,'VALIDATION_ERROR');
 PERFORM ec_require(NOT(p ? 'customerId') OR EXISTS(SELECT 1 FROM customers WHERE id=(p->>'customerId')::uuid AND tenant_id=actor.tenant_id AND active AND deleted_at IS NULL),'PARTY_DENIED');
 PERFORM ec_require(NOT(p ? 'supplierId') OR EXISTS(SELECT 1 FROM suppliers WHERE id=(p->>'supplierId')::uuid AND tenant_id=actor.tenant_id AND active AND deleted_at IS NULL),'PARTY_DENIED');
 INSERT INTO fin_documents(id,tenant_id,branch_id,direction,description,source_key,source_type,issue_date,competence_date,nominal_cents,customer_id,supplier_id,created_by,notes)
 VALUES(document,actor.tenant_id,branch,direction,btrim(p->>'description'),origin||':'||operation::text,origin,(p->>'issueDate')::date,competence,total,
 NULLIF(p->>'customerId','')::uuid,NULLIF(p->>'supplierId','')::uuid,actor.id,COALESCE(p->>'notes',''));
 PERFORM ec_require(jsonb_typeof(COALESCE(p->'classifications','[]'))='array' AND jsonb_array_length(COALESCE(p->'classifications','[]'))<=100,'ALLOCATION_LIMIT');
 FOR classification IN SELECT value FROM jsonb_array_elements(COALESCE(p->'classifications','[]')) LOOP
  category:=(classification->>'categoryId')::uuid;center:=NULLIF(classification->>'centerId','')::uuid;
  PERFORM ec_require(EXISTS(SELECT 1 FROM financial_categories c WHERE c.tenant_id=actor.tenant_id AND c.id=category AND c.active)
  AND NOT EXISTS(SELECT 1 FROM fin_category_details c WHERE c.tenant_id=actor.tenant_id AND c.parent_id=category),'CATEGORY_LEAF_REQUIRED');
  IF center IS NOT NULL THEN PERFORM ec_require(EXISTS(SELECT 1 FROM fin_centers c WHERE c.tenant_id=actor.tenant_id AND c.id=center AND c.active AND (c.branch_id IS NULL OR c.branch_id=branch)),'CENTER_DENIED');END IF;
  amount:=fin_amount(classification->'amountCents');PERFORM ec_require(amount>0,'INVALID_ALLOCATION');classified:=classified+amount;
  ordinal:=ordinal+1;class_id:=gen_random_uuid();classification_ids:=array_append(classification_ids,class_id);remaining:=array_append(remaining,amount);
  INSERT INTO fin_classifications(id,tenant_id,document_id,category_id,center_id,amount_cents,ordinal) VALUES(class_id,actor.tenant_id,document,category,center,amount,ordinal);
 END LOOP;
 PERFORM ec_require(ordinal=0 OR classified=total,'ALLOCATION_MARGINS');
 parts:=array_fill(total/count,ARRAY[count]);
 FOR installment IN 1..count LOOP
  amount:=parts[installment]+CASE WHEN installment>count-mod(total,count) THEN 1 ELSE 0 END;
  title:=gen_random_uuid();legacy:=gen_random_uuid();
  IF direction='PAY' THEN
   INSERT INTO accounts_payable(id,tenant_id,branch_id,supplier_id,description,amount_cents,due_date,created_by_uid,created_at,updated_at)
   VALUES(legacy,actor.tenant_id,branch,NULLIF(p->>'supplierId','')::uuid,btrim(p->>'description'),amount,fin_date(due,COALESCE(p->>'frequency','MONTHLY'),installment-1),actor.id,now(),now());
  ELSE
   INSERT INTO accounts_receivable(id,tenant_id,branch_id,customer_id,description,amount_cents,due_date,created_by_uid,created_at,updated_at,source,idempotency_key)
   VALUES(legacy,actor.tenant_id,branch,NULLIF(p->>'customerId','')::uuid,btrim(p->>'description'),amount,fin_date(due,COALESCE(p->>'frequency','MONTHLY'),installment-1),actor.id,now(),now(),origin,'fin:'||title::text);
  END IF;
  INSERT INTO fin_titles(id,tenant_id,document_id,direction,payable_id,receivable_id,installment,forecast_date)
  VALUES(title,actor.tenant_id,document,direction,CASE WHEN direction='PAY' THEN legacy END,CASE WHEN direction='RECEIVE' THEN legacy END,installment,NULLIF(p->>'forecastDate','')::date);
  IF ordinal>0 THEN
   IF installment=count THEN capacities:=remaining;ELSE capacities:=fin_allocate(amount,remaining);END IF;
   FOR i IN 1..ordinal LOOP
    PERFORM ec_require(capacities[i]<=remaining[i],'ALLOCATION_CAPACITY');remaining[i]:=remaining[i]-capacities[i];
    INSERT INTO fin_title_capacities(tenant_id,title_id,classification_id,amount_cents) VALUES(actor.tenant_id,title,classification_ids[i],capacities[i]);
   END LOOP;
  END IF;
  result:=result||jsonb_build_array(jsonb_build_object('titleId',title,'legacyId',legacy,'version','1','originalCents',amount::text));
 END LOOP;
 IF origin IN('AGREEMENT','RECURRENCE_ESTIMATE') THEN
  NULL; -- Substituted principal/estimate is not a second economic event.
 ELSIF ordinal=0 THEN
  INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,quality)
  VALUES(actor.tenant_id,branch,'document:'||document,'DOCUMENT',competence,CASE direction WHEN 'PAY' THEN -total ELSE total END,document,'MISSING_CLASSIFICATION');
 ELSE
  INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,category_id,center_id,document_id,quality)
  SELECT actor.tenant_id,branch,'document:'||document||':'||c.id,'DOCUMENT',competence,CASE direction WHEN 'PAY' THEN -c.amount_cents ELSE c.amount_cents END,c.category_id,c.center_id,document,'KNOWN'
  FROM fin_classifications c WHERE c.tenant_id=actor.tenant_id AND c.document_id=document;
 END IF;
 RETURN jsonb_build_object('documentId',document,'titles',result);
END $$;

CREATE OR REPLACE FUNCTION fin_principal(actor users, operation uuid, title uuid, allocation uuid, amount bigint, kind text, day date, reverses uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE event uuid:=gen_random_uuid(); capacity record; weights bigint[]:='{}'; ids uuid[]:='{}'; distribution bigint[]; i integer;
BEGIN
 INSERT INTO fin_principal_events(id,tenant_id,title_id,operation_id,allocation_id,amount_cents,event_type,effective_date,reverses_id)
 VALUES(event,actor.tenant_id,title,operation,allocation,amount,kind,day,reverses);
 IF reverses IS NOT NULL THEN
  INSERT INTO fin_principal_dimensions(tenant_id,event_id,classification_id,amount_cents)
  SELECT tenant_id,event,classification_id,-amount_cents FROM fin_principal_dimensions WHERE tenant_id=actor.tenant_id AND event_id=reverses;
 ELSE
  FOR capacity IN SELECT c.classification_id,(c.amount_cents-COALESCE(sum(d.amount_cents),0))::bigint remaining
   FROM fin_title_capacities c JOIN fin_active_classifications current_class ON current_class.tenant_id=c.tenant_id AND current_class.id=c.classification_id LEFT JOIN fin_principal_events e ON e.title_id=c.title_id AND e.tenant_id=c.tenant_id AND e.id<>event
   LEFT JOIN fin_principal_dimensions d ON d.event_id=e.id AND d.tenant_id=e.tenant_id AND d.classification_id=c.classification_id
   WHERE c.tenant_id=actor.tenant_id AND c.title_id=title GROUP BY c.classification_id,c.amount_cents ORDER BY c.classification_id LOOP
   PERFORM ec_require(capacity.remaining>=0,'ALLOCATION_CAPACITY');
   ids:=array_append(ids,capacity.classification_id);weights:=array_append(weights,capacity.remaining);
  END LOOP;
  IF cardinality(ids)>0 THEN
   distribution:=fin_allocate(amount,weights);
   FOR i IN 1..cardinality(ids) LOOP
    PERFORM ec_require(distribution[i]<=weights[i],'ALLOCATION_CAPACITY');
    INSERT INTO fin_principal_dimensions(tenant_id,event_id,classification_id,amount_cents) VALUES(actor.tenant_id,event,ids[i],distribution[i]);
   END LOOP;
  END IF;
 END IF;
 UPDATE fin_titles SET version=version+1 WHERE id=title AND tenant_id=actor.tenant_id;
 RETURN event;
END $$;

CREATE OR REPLACE FUNCTION fin_post_cash(tenant uuid, journal uuid, branch uuid, account uuid, amount bigint, control text, settlement uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 IF amount=0 THEN RETURN; END IF;
 INSERT INTO fin_journal_lines(tenant_id,journal_id,branch_id,account_id,debit_cents,credit_cents,settlement_id)
 VALUES(tenant,journal,branch,account,GREATEST(amount,0),GREATEST(-amount,0),settlement);
 INSERT INTO fin_journal_lines(tenant_id,journal_id,branch_id,control_key,debit_cents,credit_cents,settlement_id)
 VALUES(tenant,journal,branch,control,GREATEST(-amount,0),GREATEST(amount,0),settlement);
END $$;

CREATE OR REPLACE FUNCTION fin_settle(actor users, operation uuid, p jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE direction text:=p->>'direction'; account uuid:=(p->>'accountId')::uuid; method payment_methods;
 settlement uuid:=gen_random_uuid(); journal uuid:=gen_random_uuid(); day date:=(p->>'effectiveDate')::date;
 line jsonb; state fin_title_state; principal bigint; discount bigint; interest bigint; penalty bigint; fee bigint; cash bigint;
 allocation uuid; total numeric:=0; any_cash boolean:=false; fee_mode text:=p->>'feeMode'; source fin_economic_events;
BEGIN
 PERFORM fin_access(actor,CASE direction WHEN 'PAY' THEN 'CONTAS_PAGAR' WHEN 'RECEIVE' THEN 'CONTAS_RECEBER' END,'manage');
 PERFORM ec_require(jsonb_typeof(p->'lines')='array' AND jsonb_array_length(p->'lines') BETWEEN 1 AND 100,'BATCH_LIMIT');
 PERFORM ec_require((SELECT count(DISTINCT value->>'titleId') FROM jsonb_array_elements(p->'lines'))=jsonb_array_length(p->'lines'),'DUPLICATE_TITLE');
 PERFORM ec_require(direction IN('PAY','RECEIVE') AND (direction='PAY' AND fee_mode IN('ADDED','SEPARATE') OR direction='RECEIVE' AND fee_mode IN('RETAINED','SEPARATE')),'INVALID_FEE_MODE');
 SELECT * INTO method FROM payment_methods WHERE id=(p->>'methodId')::uuid AND tenant_id=actor.tenant_id AND active FOR SHARE;
 PERFORM ec_require(method.id IS NOT NULL,'PAYMENT_METHOD_REQUIRED');
 -- Numerário is integrated through the existing Caixa policy, never a bank-only bypass.
 PERFORM ec_require(method.code<>'CASH' AND NOT method.requires_change,'CASH_BRIDGE_REQUIRED');
 PERFORM ec_require(EXISTS(SELECT 1 FROM financial_accounts WHERE tenant_id=actor.tenant_id AND id=account AND account_type NOT IN('CASH','CASH_SESSION')),'CASH_BRIDGE_REQUIRED');
 PERFORM 1 FROM fin_titles t WHERE t.tenant_id=actor.tenant_id AND t.id IN(SELECT (value->>'titleId')::uuid FROM jsonb_array_elements(p->'lines')) ORDER BY t.id FOR UPDATE;
 INSERT INTO fin_settlements(id,tenant_id,operation_id,direction,account_id,method_id,effective_date,reference,reason,fee_mode,created_by)
 VALUES(settlement,actor.tenant_id,operation,direction,account,method.id,day,COALESCE(p->>'reference',''),COALESCE(p->>'reason',''),fee_mode,actor.id);
 FOR line IN SELECT value FROM jsonb_array_elements(p->'lines') ORDER BY value->>'titleId' LOOP
  SELECT * INTO state FROM fin_title_state WHERE id=(line->>'titleId')::uuid AND tenant_id=actor.tenant_id;
  PERFORM ec_require(state.id IS NOT NULL AND state.direction=direction,'TITLE_DENIED');
  PERFORM fin_account(actor,account,state.branch_id,'post'); PERFORM fin_period(actor.tenant_id,state.branch_id,day);
  PERFORM ec_require(state.version::text=line->>'expectedVersion','VERSION_CONFLICT');
  PERFORM ec_require(state.blocked_reason IS NULL AND state.source_type<>'RECURRENCE_ESTIMATE' AND state.legacy_status NOT IN('CANCELLED','CANCELED'),'TITLE_BLOCKED');
  PERFORM ec_require(day>(SELECT cutoff_date FROM fin_account_cuts WHERE tenant_id=actor.tenant_id AND account_id=account),'BEFORE_ACCOUNT_CUT');
  principal:=fin_amount(line->'principalCents');discount:=fin_amount(line->'discountCents');interest:=fin_amount(line->'interestCents');penalty:=fin_amount(line->'penaltyCents');fee:=fin_amount(line->'feeCents');
  PERFORM ec_require(principal>0 AND principal<=state.residual_cents,'PRINCIPAL_RANGE');PERFORM ec_require(discount<=principal,'DISCOUNT_RANGE');
  IF discount>0 OR interest>0 OR penalty>0 THEN
   PERFORM fin_access(actor,CASE direction WHEN 'PAY' THEN 'CONTAS_PAGAR' ELSE 'CONTAS_RECEBER' END,'manage');
   PERFORM ec_require(length(btrim(p->>'reason')) BETWEEN 3 AND 1000,'REASON_REQUIRED');
  END IF;
  cash:=(principal::numeric-discount+interest+penalty+CASE WHEN fee_mode='SEPARATE' THEN 0 WHEN direction='PAY' THEN fee ELSE -fee END)::bigint;
  PERFORM ec_require(cash>=0,'NEGATIVE_CASH_LINE'); allocation:=gen_random_uuid();
  INSERT INTO fin_allocations(id,tenant_id,settlement_id,title_id,principal_cents,discount_cents,interest_cents,penalty_cents,fee_cents,cash_cents)
  VALUES(allocation,actor.tenant_id,settlement,state.id,principal,discount,interest,penalty,fee,cash);
  PERFORM fin_principal(actor,operation,state.id,allocation,principal,'SETTLEMENT',day);
  IF cash>0 OR fee_mode='SEPARATE' AND fee>0 THEN
   IF NOT any_cash THEN
    INSERT INTO fin_journals(id,tenant_id,operation_id,source_key,effective_date,description)
    VALUES(journal,actor.tenant_id,operation,'settlement:'||settlement,day,CASE direction WHEN 'PAY' THEN 'Pagamento' ELSE 'Recebimento' END); any_cash:=true;
   END IF;
   PERFORM fin_post_cash(actor.tenant_id,journal,state.branch_id,account,CASE direction WHEN 'PAY' THEN -cash ELSE cash END,'TITLE_CLEARING',settlement);
   IF fee_mode='SEPARATE' AND fee>0 THEN PERFORM fin_post_cash(actor.tenant_id,journal,state.branch_id,account,-fee,'BANK_FEE',settlement);END IF;
  END IF;
  INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,quality)
  SELECT actor.tenant_id,state.branch_id,'settlement:'||settlement||':'||allocation||':'||x.kind,x.kind,day,x.value,state.document_id,'MISSING_CLASSIFICATION'
  FROM (VALUES('INTEREST',CASE direction WHEN 'PAY' THEN -interest ELSE interest END),('PENALTY',CASE direction WHEN 'PAY' THEN -penalty ELSE penalty END),
   ('DISCOUNT',CASE direction WHEN 'PAY' THEN discount ELSE -discount END),('FEE',-fee)) x(kind,value) WHERE x.value<>0;
  total:=total+cash+CASE WHEN fee_mode='SEPARATE' THEN CASE WHEN direction='PAY' THEN fee ELSE -fee END ELSE 0 END;
 END LOOP;
 RETURN jsonb_build_object('settlementId',settlement,'cashCents',total::text,'journalId',CASE WHEN any_cash THEN journal END);
END $$;

CREATE OR REPLACE FUNCTION fin_reverse(actor users, operation uuid, p jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE settlement fin_settlements; journal fin_journals; inverse uuid; allocation fin_allocations; event fin_principal_events; economic fin_economic_events;
 branch uuid; day date:=(p->>'effectiveDate')::date; reversal uuid:=gen_random_uuid();
BEGIN
 SELECT * INTO settlement FROM fin_settlements WHERE tenant_id=actor.tenant_id AND id=(p->>'settlementId')::uuid FOR UPDATE;
 PERFORM ec_require(settlement.id IS NOT NULL AND settlement.direction=p->>'direction','SETTLEMENT_DENIED');
 PERFORM ec_require(length(btrim(p->>'reason')) BETWEEN 3 AND 1000,'REASON_REQUIRED');
 PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_external_refunds r WHERE r.tenant_id=actor.tenant_id AND r.settlement_id=settlement.id),'EXTERNAL_REFUND_EXISTS');
 PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_reversals WHERE tenant_id=actor.tenant_id AND settlement_id=settlement.id),'ALREADY_REVERSED');
 PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_match_edges e JOIN fin_journal_lines l ON l.id=e.line_id AND l.tenant_id=e.tenant_id
 WHERE l.tenant_id=actor.tenant_id AND l.settlement_id=settlement.id AND NOT EXISTS(SELECT 1 FROM fin_unmatches u WHERE u.tenant_id=e.tenant_id AND u.match_id=e.match_id)),'ACTIVE_RECONCILIATION');
 FOR branch IN SELECT DISTINCT d.branch_id FROM fin_allocations a JOIN fin_titles t ON t.id=a.title_id AND t.tenant_id=a.tenant_id JOIN fin_documents d ON d.id=t.document_id AND d.tenant_id=t.tenant_id WHERE a.tenant_id=actor.tenant_id AND a.settlement_id=settlement.id ORDER BY d.branch_id LOOP
  PERFORM fin_account(actor,settlement.account_id,branch,'post');PERFORM fin_period(actor.tenant_id,branch,day);
 END LOOP;
 INSERT INTO fin_reversals(id,tenant_id,settlement_id,operation_id,effective_date,reason,created_by) VALUES(reversal,actor.tenant_id,settlement.id,operation,day,p->>'reason',actor.id);
 FOR allocation IN SELECT * FROM fin_allocations WHERE tenant_id=actor.tenant_id AND settlement_id=settlement.id ORDER BY title_id LOOP
  SELECT * INTO STRICT event FROM fin_principal_events WHERE tenant_id=actor.tenant_id AND allocation_id=allocation.id AND event_type='SETTLEMENT';
  PERFORM fin_principal(actor,operation,allocation.title_id,allocation.id,-event.amount_cents,'REVERSAL',day,event.id);
 END LOOP;
 FOR journal IN SELECT * FROM fin_journals WHERE tenant_id=actor.tenant_id AND source_key='settlement:'||settlement.id LOOP
  inverse:=gen_random_uuid();
  INSERT INTO fin_journals(id,tenant_id,operation_id,source_key,effective_date,description,reverses_id) VALUES(inverse,actor.tenant_id,operation,'reverse:'||journal.id,day,'Estorno de registro: '||(p->>'reason'),journal.id);
  INSERT INTO fin_journal_lines(tenant_id,journal_id,branch_id,account_id,control_key,debit_cents,credit_cents,settlement_id)
  SELECT tenant_id,inverse,branch_id,account_id,control_key,credit_cents,debit_cents,settlement_id FROM fin_journal_lines WHERE tenant_id=actor.tenant_id AND journal_id=journal.id;
 END LOOP;
 FOR economic IN SELECT * FROM fin_economic_events WHERE tenant_id=actor.tenant_id AND source_key LIKE 'settlement:'||settlement.id||':%' LOOP
  INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,category_id,center_id,quality,reverses_id)
  VALUES(economic.tenant_id,economic.branch_id,'reverse:'||economic.id,'REVERSAL',day,-economic.amount_cents,economic.document_id,economic.category_id,economic.center_id,economic.quality,economic.id);
 END LOOP;
 RETURN jsonb_build_object('reversalId',reversal,'settlementId',settlement.id);
END $$;

CREATE OR REPLACE FUNCTION fin_apply(actor users, operation uuid, action text, p jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
<<apply_scope>>
DECLARE result jsonb; id uuid; branch uuid; account uuid; destination uuid; journal uuid; amount bigint; fee bigint; day date;
 state fin_title_state; item jsonb; category financial_categories; version bigint; period date; snapshot jsonb; closed boolean; revision bigint;
BEGIN
 IF action IN('C01','C02') THEN
  result:=fin_new_document(actor,operation,p);
  IF action='C02' THEN
   SELECT jsonb_agg(jsonb_build_object('titleId',v->>'titleId','expectedVersion','1','principalCents',v->>'originalCents','discountCents','0','interestCents','0','penaltyCents','0','feeCents','0')) INTO item FROM jsonb_array_elements(result->'titles') v;
   result:=result||fin_settle(actor,operation,(p->'settlement')||jsonb_build_object('direction',p->>'direction','lines',item));
  END IF;RETURN result;
 ELSIF action IN('C07','C08') THEN
  PERFORM ec_require(action=CASE WHEN p->>'direction'='PAY' THEN 'C07' ELSE 'C08' END,'DIRECTION_MISMATCH');RETURN fin_settle(actor,operation,p);
 ELSIF action IN('C05','C25') THEN RETURN fin_revise_document(actor,operation,action,p);
 ELSIF action='C03' THEN RETURN fin_title_amend(actor,operation,p);
 ELSIF action='C09' THEN RETURN fin_reverse(actor,operation,p);
 ELSIF action='C10' THEN RETURN fin_external_refund(actor,operation,p);
 ELSIF action IN('C32','C33') THEN RETURN fin_owner_or_cash(actor,operation,action,p);
 ELSIF action IN('C37','C38') THEN RETURN fin_config_extra(actor,action,p);
 ELSIF action='C39' THEN RETURN fin_origin_config(actor,p);
 ELSIF action='C40' THEN RETURN fin_adopt_legacy(actor,operation,p);
 ELSIF action='C36' THEN
  RAISE EXCEPTION 'ATTACHMENT_STORAGE_REQUIRED' USING ERRCODE='P0001';
 ELSIF action IN('C04','C06','C28') THEN
  SELECT * INTO state FROM fin_title_state s WHERE s.tenant_id=actor.tenant_id AND s.id=(p->>'titleId')::uuid;
  PERFORM ec_require(state.id IS NOT NULL AND state.direction=p->>'direction','TITLE_DENIED');PERFORM fin_branch(actor,state.branch_id);
  PERFORM ec_require(state.version::text=p->>'expectedVersion' AND state.blocked_reason IS NULL,'VERSION_CONFLICT');
  PERFORM ec_require(length(btrim(p->>'reason')) BETWEEN 3 AND 1000,'REASON_REQUIRED');
  IF action='C04' THEN
   PERFORM ec_require((p->>'forecastDate')::date IS NOT NULL,'INVALID_DATE');
   UPDATE fin_titles t SET forecast_date=(p->>'forecastDate')::date,version=t.version+1 WHERE t.id=state.id AND t.tenant_id=actor.tenant_id;
  ELSE
   day:=(p->>'effectiveDate')::date;PERFORM fin_period(actor.tenant_id,state.branch_id,day);
   amount:=CASE WHEN action='C06' THEN state.residual_cents ELSE fin_amount(p->'amountCents') END;
   PERFORM ec_require(amount>0 AND amount<=state.residual_cents,'PRINCIPAL_RANGE');
   PERFORM ec_require(action<>'C28' OR state.direction='RECEIVE','DIRECTION_MISMATCH');
   id:=fin_principal(actor,operation,state.id,NULL,amount,CASE WHEN action='C06' THEN 'CANCEL' ELSE 'LOSS' END,day);
   INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,quality)
   VALUES(actor.tenant_id,state.branch_id,'principal:'||id,CASE WHEN action='C06' THEN 'CANCEL' ELSE 'LOSS' END,day,CASE state.direction WHEN 'PAY' THEN amount ELSE -amount END,state.document_id,'MISSING_CLASSIFICATION');
  END IF;
  RETURN jsonb_build_object('titleId',state.id,'version',(state.version+1)::text);
 ELSIF action='C11' THEN
  branch:=(p->>'branchId')::uuid;account:=(p->>'fromAccountId')::uuid;destination:=(p->>'toAccountId')::uuid;
  PERFORM ec_require(account<>destination,'SAME_ACCOUNT');PERFORM fin_account(actor,account,branch,'post');PERFORM fin_account(actor,destination,branch,'post');
  PERFORM ec_require(NOT EXISTS(SELECT 1 FROM financial_accounts a WHERE a.tenant_id=actor.tenant_id AND a.id IN(account,destination) AND a.account_type IN('CASH','CASH_SESSION')),'CASH_BRIDGE_REQUIRED');
  day:=(p->>'effectiveDate')::date;PERFORM fin_period(actor.tenant_id,branch,day);
  PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_account_cuts WHERE tenant_id=actor.tenant_id AND account_id IN(account,destination) AND cutoff_date>=day),'BEFORE_ACCOUNT_CUT');
  amount:=fin_amount(p->'amountCents');fee:=fin_amount(p->'feeCents');PERFORM ec_require(amount>0,'INVALID_CENTS');
  journal:=gen_random_uuid();id:=gen_random_uuid();
  INSERT INTO fin_journals(id,tenant_id,operation_id,source_key,effective_date,description) VALUES(journal,actor.tenant_id,operation,'transfer:'||id,day,'Transferência entre contas');
  PERFORM fin_post_cash(actor.tenant_id,journal,branch,account,-(amount::numeric+fee)::bigint,'TRANSFER_CLEARING');
  PERFORM fin_post_cash(actor.tenant_id,journal,branch,destination,amount,'TRANSFER_CLEARING');
  INSERT INTO fin_transfers(id,tenant_id,operation_id,from_account,to_account,branch_id,amount_cents,fee_cents,effective_date,reference,journal_id)
  VALUES(id,actor.tenant_id,operation,account,destination,branch,amount,fee,day,COALESCE(p->>'reference',''),journal);
  IF fee>0 THEN INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,quality) VALUES(actor.tenant_id,branch,'transfer-fee:'||id,'FEE',day,-fee,'MISSING_CLASSIFICATION');END IF;
  RETURN jsonb_build_object('transferId',id,'journalId',journal);
 ELSIF action='C12' THEN
  branch:=(p->>'branchId')::uuid;PERFORM fin_branch(actor,branch);day:=(p->>'cutoffDate')::date;
  PERFORM ec_require(p->>'accountType' IN('BANK','WALLET','TRANSIT','CASH'),'ACCOUNT_TYPE_REQUIRED');
  PERFORM ec_require(length(btrim(p->>'name')) BETWEEN 1 AND 120 AND day IS NOT NULL AND p->>'currency'='BRL','VALIDATION_ERROR');
  amount:=fin_amount(p->'openingBalanceCents',true);id:=gen_random_uuid();
  INSERT INTO financial_accounts(id,tenant_id,branch_id,name,account_type,opening_balance_cents,created_at,updated_at)
  VALUES(id,actor.tenant_id,CASE WHEN COALESCE((p->>'shared')::boolean,false) THEN NULL ELSE branch END,p->>'name',p->>'accountType',amount,now(),now());
  INSERT INTO fin_account_cuts(tenant_id,account_id,cutoff_date,currency,verified_by) VALUES(actor.tenant_id,id,day,'BRL',actor.id);
  -- This grant is an explicit part of the account-opening review, not an implicit admin bypass.
  PERFORM ec_require(jsonb_typeof(p->'grants')='array' AND jsonb_array_length(p->'grants') BETWEEN 1 AND 100,'ACCOUNT_GRANTS_REQUIRED');
  FOR item IN SELECT value FROM jsonb_array_elements(p->'grants') LOOP
   PERFORM fin_branch(actor,(item->>'branchId')::uuid);
   PERFORM ec_require(EXISTS(SELECT 1 FROM users u WHERE u.tenant_id=actor.tenant_id AND u.id=item->>'userId' AND u.active AND u.deleted_at IS NULL),'ACCOUNT_DENIED');
   PERFORM ec_require(COALESCE((p->>'shared')::boolean,false) OR (item->>'branchId')::uuid=branch,'BRANCH_DENIED');
   INSERT INTO fin_account_grants(tenant_id,account_id,user_id,branch_id,can_post,can_reconcile,can_global_balance)
   VALUES(actor.tenant_id,id,item->>'userId',(item->>'branchId')::uuid,COALESCE((item->>'canPost')::boolean,false),COALESCE((item->>'canReconcile')::boolean,false),COALESCE((item->>'canGlobalBalance')::boolean,false));
  END LOOP;
  RETURN jsonb_build_object('accountId',id,'version','1');
 ELSIF action='C13' THEN
  account:=(p->>'accountId')::uuid;branch:=(p->>'branchId')::uuid;PERFORM fin_account(actor,account,branch,'post');
  UPDATE financial_accounts a SET active=false,updated_at=now() WHERE a.id=account AND a.tenant_id=actor.tenant_id;
  RETURN jsonb_build_object('accountId',account);
 ELSIF action IN('C14','C15') THEN
  id:=NULLIF(p->>'id','')::uuid;
  PERFORM ec_require(length(btrim(p->>'name')) BETWEEN 1 AND 120,'VALIDATION_ERROR');
  IF action='C14' THEN
   IF id IS NULL THEN
    id:=gen_random_uuid();
    INSERT INTO financial_categories(id,tenant_id,name,direction,created_at,updated_at) VALUES(id,actor.tenant_id,p->>'name',p->>'direction',now(),now());
    INSERT INTO fin_category_details(tenant_id,category_id,code,parent_id,nature) VALUES(actor.tenant_id,id,p->>'code',NULLIF(p->>'parentId','')::uuid,p->>'nature');
   ELSE
    SELECT * INTO category FROM financial_categories c WHERE c.id=apply_scope.id AND c.tenant_id=actor.tenant_id FOR UPDATE;
    PERFORM ec_require(category.id IS NOT NULL,'CATEGORY_DENIED');
    PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_classifications c WHERE c.tenant_id=actor.tenant_id AND c.category_id=category.id),'USED_CLASSIFICATION_IMMUTABLE');
    UPDATE financial_categories c SET name=p->>'name',active=COALESCE((p->>'active')::boolean,c.active),updated_at=now() WHERE c.id=category.id AND c.tenant_id=actor.tenant_id;
   END IF;
  ELSE
   IF NULLIF(p->>'branchId','') IS NOT NULL THEN PERFORM fin_branch(actor,(p->>'branchId')::uuid);END IF;
   IF id IS NULL THEN
    id:=gen_random_uuid();INSERT INTO fin_centers(id,tenant_id,name,purpose,branch_id) VALUES(id,actor.tenant_id,p->>'name',COALESCE(p->>'purpose',''),NULLIF(p->>'branchId','')::uuid);
   ELSE
    UPDATE fin_centers c SET name=p->>'name',purpose=COALESCE(p->>'purpose',c.purpose),active=COALESCE((p->>'active')::boolean,c.active),version=c.version+1
    WHERE c.id=apply_scope.id AND c.tenant_id=actor.tenant_id AND c.version::text=p->>'expectedVersion';PERFORM ec_require(FOUND,'VERSION_CONFLICT');
   END IF;
  END IF;
  RETURN jsonb_build_object('id',id);
 ELSIF action='C16' THEN
  PERFORM ec_require(jsonb_typeof(p->'lines')='array' AND jsonb_array_length(p->'lines') BETWEEN 1 AND 1000 AND (p->>'effectiveFrom')::date IS NOT NULL,'VALIDATION_ERROR');
  id:=gen_random_uuid();SELECT COALESCE(max(m.revision),0)+1 INTO revision FROM fin_dre_maps m WHERE m.tenant_id=actor.tenant_id;
  INSERT INTO fin_dre_maps(id,tenant_id,revision,effective_from,published_by,source_categories)
  VALUES(id,actor.tenant_id,revision,(p->>'effectiveFrom')::date,actor.id,
   COALESCE((SELECT jsonb_object_agg(c.event_type,c.category_id) FROM fin_event_categories c WHERE c.tenant_id=actor.tenant_id),'{}'));
  FOR item IN SELECT value FROM jsonb_array_elements(p->'lines') LOOP
   INSERT INTO fin_dre_map_lines(tenant_id,map_id,category_id,dre_line) VALUES(actor.tenant_id,id,(item->>'categoryId')::uuid,item->>'dreLine');
  END LOOP;
  RETURN jsonb_build_object('mapId',id,'revision',revision::text);
 ELSIF action IN('C34','C35') THEN
  branch:=(p->>'branchId')::uuid;PERFORM fin_branch(actor,branch);period:=date_trunc('month',(p->>'period')::date::timestamp)::date;
  PERFORM ec_require(period IS NOT NULL AND length(btrim(p->>'reason')) BETWEEN 3 AND 1000,'REASON_REQUIRED');
  INSERT INTO fin_period_guards(tenant_id,branch_id,period) VALUES(actor.tenant_id,branch,period) ON CONFLICT DO NOTHING;
  SELECT g.closed,g.revision INTO closed,revision FROM fin_period_guards g WHERE g.tenant_id=actor.tenant_id AND g.branch_id=branch AND g.period=apply_scope.period FOR UPDATE;
  PERFORM ec_require((action='C34' AND NOT closed) OR (action='C35' AND closed),'PERIOD_STATE_CONFLICT');
  IF action='C34' THEN
   PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_operations o WHERE o.tenant_id=actor.tenant_id AND o.id<>operation AND o.status='PREPARED'),'UNRESOLVED_OPERATIONS');
   PERFORM ec_require(NOT EXISTS(SELECT 1 FROM cash_sessions s WHERE s.tenant_id=actor.tenant_id AND s.branch_id=branch AND s.difference_cents IS DISTINCT FROM 0 AND s.difference_cents IS NOT NULL AND s.opened_at>=(period::timestamp AT TIME ZONE (SELECT t.timezone FROM tenants t WHERE t.id=actor.tenant_id)) AND s.opened_at<((period+interval '1 month')::timestamp AT TIME ZONE (SELECT t.timezone FROM tenants t WHERE t.id=actor.tenant_id))),'CASH_DIFFERENCE_PENDING');
   PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_migration_issues i WHERE i.tenant_id=actor.tenant_id),'MIGRATION_ISSUES_PENDING');
  END IF;
  SELECT jsonb_build_object('recordedThrough',now(),'journalCount',count(*),'liquidityCents',COALESCE(sum(l.debit_cents::numeric-l.credit_cents) FILTER(WHERE l.account_id IS NOT NULL),0)::text) INTO snapshot
  FROM fin_journals j JOIN fin_journal_lines l ON l.journal_id=j.id AND l.tenant_id=j.tenant_id
  WHERE j.tenant_id=actor.tenant_id AND l.branch_id=branch AND j.effective_date>=period AND j.effective_date<period+interval '1 month';
  revision:=revision+1;id:=gen_random_uuid();
  INSERT INTO fin_closures(id,tenant_id,branch_id,period,revision,action,snapshot,reason,created_by) VALUES(id,actor.tenant_id,branch,period,revision,CASE action WHEN 'C34' THEN 'CLOSE' ELSE 'REOPEN' END,snapshot,p->>'reason',actor.id);
  UPDATE fin_period_guards g SET closed=action='C34',revision=apply_scope.revision WHERE g.tenant_id=actor.tenant_id AND g.branch_id=branch AND g.period=apply_scope.period;
  RETURN jsonb_build_object('closureId',id,'revision',revision::text,'snapshot',snapshot);
 END IF;
 IF action IN('C17','C18','C19','C20','C21') THEN RETURN fin_bank_command(actor,operation,action,p); END IF;
 IF action IN('C22','C23','C24','C26','C27','C29','C30','C31') THEN RETURN fin_collections(actor,operation,action,p); END IF;
 RAISE EXCEPTION 'UNKNOWN_FINANCIAL_COMMAND' USING ERRCODE='P0001';
END $$;

CREATE OR REPLACE FUNCTION fin_execute(uid text, token text, operation uuid, expected_hash text, cancel boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql AS $$
<<execute_scope>>
DECLARE actor users; saved fin_operations; result jsonb; error_code text; detail text;
BEGIN
 actor:=fin_actor(uid,token);
 PERFORM pg_advisory_xact_lock(hashtextextended('fin-operation:'||operation::text,0));
 SELECT * INTO saved FROM fin_operations WHERE id=operation FOR UPDATE;
 IF saved.id IS NULL AND cancel AND expected_hash='' THEN
  INSERT INTO fin_operation_abandonments(operation_id,tenant_id,actor_uid) VALUES(operation,actor.tenant_id,actor.id) ON CONFLICT DO NOTHING;
  PERFORM ec_require(EXISTS(SELECT 1 FROM fin_operation_abandonments a WHERE a.operation_id=operation AND a.tenant_id=actor.tenant_id AND a.actor_uid=actor.id),'OPERATION_DENIED');
  RETURN jsonb_build_object('status','CANCELLED','operationId',operation);
 END IF;
 PERFORM ec_require(saved.id IS NOT NULL AND saved.tenant_id=actor.tenant_id AND saved.actor_uid=actor.id,'OPERATION_DENIED');
 PERFORM fin_access(actor,saved.page_key,'manage');
 PERFORM ec_require((saved.payload_hash=expected_hash OR cancel AND expected_hash=''),'IDEMPOTENCY_CONFLICT');
 IF saved.status<>'PREPARED' THEN RETURN saved.result; END IF;
 -- Match the existing Caixa lock order for counting a session.
 IF saved.action='C33' THEN
  PERFORM 1 FROM cash_sessions c WHERE c.tenant_id=actor.tenant_id AND c.id=(saved.intent#>>'{payload,sessionId}')::uuid FOR UPDATE;
 END IF;
 PERFORM fin_lock(actor.tenant_id);
 IF cancel THEN result:=jsonb_build_object('status','CANCELLED','operationId',operation);
 ELSE
  BEGIN
   result:=fin_json(fin_apply(actor,operation,saved.action,saved.intent->'payload'))||jsonb_build_object('status','COMMITTED','operationId',operation,'payloadHash',expected_hash,'serverTime',now());
   -- Force deferred financial guards inside the exception/savepoint boundary.
   SET CONSTRAINTS ALL IMMEDIATE;
   SET CONSTRAINTS ALL DEFERRED;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
   GET STACKED DIAGNOSTICS error_code=MESSAGE_TEXT,detail=PG_EXCEPTION_DETAIL;
   result:=jsonb_build_object('status','REJECTED','operationId',operation,'error',jsonb_build_object('code',error_code));
  WHEN data_exception OR integrity_constraint_violation THEN
   result:=jsonb_build_object('status','REJECTED','operationId',operation,'error',jsonb_build_object('code','VALIDATION_ERROR'));
  END;
 END IF;
 UPDATE fin_operations SET status=execute_scope.result->>'status',result=execute_scope.result,finished_at=now() WHERE id=operation;
 INSERT INTO audit_logs(tenant_id,user_id,module,page_key,action,entity_name,entity_id,summary,success,origin,after_data,created_at)
 VALUES(actor.tenant_id,actor.id,'Financeiro',saved.page_key,saved.action,'FinancialOperation',operation::text,'Operação financeira '||lower(result->>'status'),result->>'status'='COMMITTED','SQL_CONNECT',jsonb_build_object('operationId',operation,'payloadHash',expected_hash,'status',result->>'status'),now());
 RETURN result;
END $$;
COMMIT;

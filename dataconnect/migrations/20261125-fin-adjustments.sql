BEGIN;

CREATE TABLE IF NOT EXISTS fin_external_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  settlement_id uuid NOT NULL,
  account_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  journal_id uuid NOT NULL,
  external_reference text NOT NULL CHECK(length(btrim(external_reference)) BETWEEN 1 AND 180),
  amount_cents bigint NOT NULL CHECK(amount_cents>0),
  reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000),
  effective_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,account_id,external_reference),
  UNIQUE(tenant_id,operation_id),
  FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id),
  FOREIGN KEY(tenant_id,settlement_id) REFERENCES fin_settlements(tenant_id,id),
  FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id),
  FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id),
  FOREIGN KEY(tenant_id,journal_id) REFERENCES fin_journals(tenant_id,id)
);

CREATE TABLE IF NOT EXISTS fin_title_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  previous_version bigint NOT NULL,
  before_value jsonb NOT NULL,
  after_value jsonb NOT NULL,
  reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,title_id,previous_version),
  FOREIGN KEY(tenant_id,title_id) REFERENCES fin_titles(tenant_id,id),
  FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id)
);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='fin_immutable_fact' AND tgrelid='fin_title_changes'::regclass) THEN
  CREATE TRIGGER fin_immutable_fact BEFORE UPDATE OR DELETE ON fin_title_changes FOR EACH ROW EXECUTE FUNCTION fin_immutable();
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='fin_immutable_fact' AND tgrelid='fin_external_refunds'::regclass) THEN
  CREATE TRIGGER fin_immutable_fact BEFORE UPDATE OR DELETE ON fin_external_refunds FOR EACH ROW EXECUTE FUNCTION fin_immutable();
 END IF;
END $$;

CREATE OR REPLACE FUNCTION fin_external_refund(actor users, operation uuid, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE original fin_settlements;
 account uuid:=(payload->>'accountId')::uuid;
 branch uuid:=(payload->>'branchId')::uuid;
 amount bigint:=fin_amount(payload->'amountCents');
 day date:=(payload->>'effectiveDate')::date;
 journal uuid:=gen_random_uuid();
 refund uuid:=gen_random_uuid();
 original_cash numeric;
 refunded numeric;
BEGIN
 SELECT s.* INTO original FROM fin_settlements s
 WHERE s.tenant_id=actor.tenant_id AND s.id=(payload->>'settlementId')::uuid;
 PERFORM ec_require(original.id IS NOT NULL AND original.direction=payload->>'direction','SETTLEMENT_DENIED');
 PERFORM fin_account(actor,account,branch,'post');
 PERFORM fin_account(actor,original.account_id,branch,'view');
 PERFORM fin_period(actor.tenant_id,branch,day);
 PERFORM ec_require(day>=original.effective_date AND day>(SELECT cutoff_date FROM fin_account_cuts WHERE tenant_id=actor.tenant_id AND account_id=account),'BEFORE_ACCOUNT_CUT');
 PERFORM ec_require(EXISTS(SELECT 1 FROM financial_accounts a WHERE a.tenant_id=actor.tenant_id AND a.id=account AND a.account_type IN('BANK','WALLET','TRANSIT')),'CASH_BRIDGE_REQUIRED');
 PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_reversals r WHERE r.tenant_id=actor.tenant_id AND r.settlement_id=original.id),'ALREADY_REVERSED');
 SELECT COALESCE(sum(CASE original.direction WHEN 'RECEIVE' THEN l.debit_cents::numeric ELSE l.credit_cents::numeric END),0)
 INTO original_cash
 FROM fin_journal_lines l JOIN fin_journals j ON j.tenant_id=l.tenant_id AND j.id=l.journal_id
 WHERE l.tenant_id=actor.tenant_id AND l.settlement_id=original.id AND l.branch_id=branch
 AND l.account_id=original.account_id AND j.source_key='settlement:'||original.id;
 SELECT COALESCE(sum(r.amount_cents::numeric),0) INTO refunded FROM fin_external_refunds r
 WHERE r.tenant_id=actor.tenant_id AND r.settlement_id=original.id AND r.branch_id=branch;
 PERFORM ec_require(amount>0 AND refunded+amount<=original_cash,'REFUND_CAPACITY');
 INSERT INTO fin_journals(id,tenant_id,operation_id,source_key,effective_date,description)
 VALUES(journal,actor.tenant_id,operation,'external-refund:'||refund,day,'Devolução externa confirmada');
 PERFORM fin_post_cash(actor.tenant_id,journal,branch,account,CASE WHEN original.direction='RECEIVE' THEN -amount ELSE amount END,'EXTERNAL_REFUND');
 INSERT INTO fin_external_refunds(id,tenant_id,operation_id,settlement_id,account_id,branch_id,journal_id,external_reference,amount_cents,reason,effective_date)
 VALUES(refund,actor.tenant_id,operation,original.id,account,branch,journal,payload->>'reference',amount,payload->>'reason',day);
 RETURN jsonb_build_object('refundId',refund,'settlementId',original.id,'amountCents',amount::text);
END $$;

CREATE OR REPLACE FUNCTION fin_title_amend(actor users, operation uuid, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE state fin_title_state;
 next_due date:=(payload->>'dueDate')::date;
 next_forecast date:=NULLIF(payload->>'forecastDate','')::date;
BEGIN
 SELECT s.* INTO state FROM fin_title_state s WHERE s.tenant_id=actor.tenant_id AND s.id=(payload->>'titleId')::uuid;
 PERFORM ec_require(state.id IS NOT NULL AND state.direction=payload->>'direction','TITLE_DENIED');
 PERFORM fin_branch(actor,state.branch_id);
 PERFORM ec_require(state.source_type='MANUAL' AND state.blocked_reason IS NULL AND state.legacy_status='OPEN','TITLE_SOURCE_LOCKED');
 PERFORM ec_require(state.version::text=payload->>'expectedVersion','VERSION_CONFLICT');
 PERFORM ec_require(NOT EXISTS(SELECT 1 FROM fin_principal_events e WHERE e.tenant_id=actor.tenant_id AND e.title_id=state.id),'TITLE_HAS_HISTORY');
 PERFORM fin_period(actor.tenant_id,state.branch_id,state.competence_date);
 PERFORM ec_require(next_due BETWEEN date '1900-01-01' AND date '9999-12-31','INVALID_DATE');
 IF state.direction='PAY' THEN
  UPDATE accounts_payable SET due_date=next_due,updated_at=now() WHERE tenant_id=actor.tenant_id AND id=state.payable_id;
 ELSE
  UPDATE accounts_receivable SET due_date=next_due,updated_at=now() WHERE tenant_id=actor.tenant_id AND id=state.receivable_id;
 END IF;
 UPDATE fin_titles t SET forecast_date=next_forecast,version=t.version+1 WHERE t.tenant_id=actor.tenant_id AND t.id=state.id;
 INSERT INTO fin_title_changes(tenant_id,title_id,operation_id,previous_version,before_value,after_value,reason)
 VALUES(actor.tenant_id,state.id,operation,state.version,
 jsonb_build_object('dueDate',state.due_date,'forecastDate',state.forecast_date),jsonb_build_object('dueDate',next_due,'forecastDate',next_forecast),payload->>'reason');
 RETURN jsonb_build_object('titleId',state.id,'version',(state.version+1)::text);
END $$;

CREATE OR REPLACE FUNCTION fin_owner_or_cash(actor users, operation uuid, action text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE branch uuid;
 account uuid;
 movement uuid:=gen_random_uuid();
 journal uuid;
 amount bigint;
 expected bigint;
 session_row cash_sessions;
 nature fin_owner_natures;
 source cash_movements;
 day date;
 entry_direction text;
 beneficiary text;
BEGIN
 IF action='C33' THEN
  PERFORM fin_access(actor,'CAIXA','manage');
  SELECT s.* INTO session_row FROM cash_sessions s WHERE s.tenant_id=actor.tenant_id AND s.id=(payload->>'sessionId')::uuid;
  PERFORM ec_require(session_row.id IS NOT NULL,'CASH_SESSION_DENIED');
  PERFORM fin_branch(actor,session_row.branch_id);
  SELECT (session_row.opening_amount_cents::numeric+COALESCE(sum(m.amount_cents::numeric),0))::bigint INTO expected
  FROM cash_movements m WHERE m.tenant_id=actor.tenant_id AND m.session_id=session_row.id AND m.movement_type<>'OPENING';
  PERFORM ec_require(expected=fin_amount(payload->'expectedCents',true),'VERSION_CONFLICT');
  amount:=fin_amount(payload->'countedCents');
  INSERT INTO fin_cash_counts(id,tenant_id,cash_session_id,operation_id,expected_cents,counted_cents,reason,created_by)
  VALUES(movement,actor.tenant_id,session_row.id,operation,expected,amount,payload->>'reason',actor.id);
  RETURN jsonb_build_object('countId',movement,'differenceCents',(amount::numeric-expected)::text);
 END IF;

 branch:=(payload->>'branchId')::uuid;
 account:=(payload->>'accountId')::uuid;
 PERFORM fin_account(actor,account,branch,'post');
 day:=(payload->>'effectiveDate')::date;
 amount:=fin_amount(payload->'amountCents');
 entry_direction:=payload->>'direction';
 beneficiary:=payload->>'beneficiaryUid';
 SELECT n.* INTO nature FROM fin_owner_natures n
 JOIN financial_categories c ON c.tenant_id=n.tenant_id AND c.id=n.category_id AND c.active
 WHERE n.tenant_id=actor.tenant_id AND n.id=(payload->>'natureId')::uuid AND n.active;
 PERFORM ec_require(nature.id IS NOT NULL,'OWNER_NATURE_REQUIRED');
 PERFORM ec_require(EXISTS(
  SELECT 1 FROM fin_dre_map_lines l WHERE l.tenant_id=actor.tenant_id AND l.category_id=nature.category_id
  AND l.map_id=(SELECT m.id FROM fin_dre_maps m WHERE m.tenant_id=actor.tenant_id AND m.effective_from<=day ORDER BY m.revision DESC LIMIT 1)
 ),'DRE_MAPPING_REQUIRED');
 PERFORM ec_require(EXISTS(SELECT 1 FROM users u WHERE u.tenant_id=actor.tenant_id AND u.id=beneficiary AND u.active AND u.deleted_at IS NULL),'BENEFICIARY_REQUIRED');
 PERFORM fin_period(actor.tenant_id,branch,day);
 PERFORM ec_require(day>(SELECT cutoff_date FROM fin_account_cuts WHERE tenant_id=actor.tenant_id AND account_id=account),'BEFORE_ACCOUNT_CUT');
 IF NULLIF(payload->>'cashMovementId','') IS NOT NULL THEN
  PERFORM fin_access(actor,'CAIXA','manage');
  SELECT c.* INTO source FROM cash_movements c JOIN cash_sessions s ON s.tenant_id=c.tenant_id AND s.id=c.session_id
  WHERE c.tenant_id=actor.tenant_id AND c.id=(payload->>'cashMovementId')::uuid AND s.branch_id=branch;
  PERFORM ec_require(source.id IS NOT NULL AND source.movement_type='WITHDRAWAL' AND source.amount_cents=-amount AND entry_direction='OUT','CASH_MOVEMENT_DENIED');
  SELECT j.id INTO journal FROM fin_journals j JOIN fin_journal_lines l ON l.tenant_id=j.tenant_id AND l.journal_id=j.id
  WHERE j.tenant_id=actor.tenant_id AND l.source_cash_id=source.id AND l.account_id=account AND j.effective_date=day LIMIT 1;
  PERFORM ec_require(journal IS NOT NULL,'CASH_BRIDGE_REQUIRED');
 ELSE
  PERFORM ec_require(EXISTS(SELECT 1 FROM financial_accounts a WHERE a.tenant_id=actor.tenant_id AND a.id=account AND a.account_type IN('BANK','WALLET','TRANSIT')),'CASH_BRIDGE_REQUIRED');
  PERFORM ec_require(entry_direction IN('IN','OUT') AND amount>0,'VALIDATION_ERROR');
  journal:=gen_random_uuid();
  INSERT INTO fin_journals(id,tenant_id,operation_id,source_key,effective_date,description)
  VALUES(journal,actor.tenant_id,operation,'owner:'||movement,day,CASE WHEN entry_direction='IN' THEN 'Aporte de sócio' ELSE 'Retirada de sócio' END);
  PERFORM fin_post_cash(actor.tenant_id,journal,branch,account,CASE WHEN entry_direction='IN' THEN amount ELSE -amount END,'OWNER');
 END IF;
 INSERT INTO fin_owner_movements(id,tenant_id,branch_id,operation_id,beneficiary_uid,nature_id,amount_cents,direction,effective_date,account_id,reason,source_cash_id,journal_id)
 VALUES(movement,actor.tenant_id,branch,operation,beneficiary,nature.id,amount,entry_direction,day,account,payload->>'reason',source.id,journal);
 INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,category_id,quality)
 VALUES(actor.tenant_id,branch,'owner:'||movement,'OWNER',day,CASE WHEN entry_direction='IN' THEN amount ELSE -amount END,nature.category_id,'KNOWN');
 RETURN jsonb_build_object('movementId',movement,'journalId',journal);
END $$;

CREATE OR REPLACE FUNCTION fin_config_extra(actor users, action text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE result_id uuid:=gen_random_uuid();
BEGIN
 IF action='C37' THEN
  PERFORM ec_require(length(btrim(payload->>'name')) BETWEEN 1 AND 120,'VALIDATION_ERROR');
  INSERT INTO fin_terms(id,tenant_id,name,installment_count,frequency,first_offset_days)
  VALUES(result_id,actor.tenant_id,btrim(payload->>'name'),(payload->>'installmentCount')::int,payload->>'frequency',(payload->>'firstOffsetDays')::int);
 ELSIF action='C38' THEN
  PERFORM ec_require(length(btrim(payload->>'name')) BETWEEN 1 AND 120,'VALIDATION_ERROR');
  INSERT INTO fin_owner_natures(id,tenant_id,name,category_id,nature)
  SELECT result_id,actor.tenant_id,btrim(payload->>'name'),c.id,payload->>'nature' FROM financial_categories c
  WHERE c.tenant_id=actor.tenant_id AND c.id=(payload->>'categoryId')::uuid AND c.active;
  PERFORM ec_require(FOUND,'CATEGORY_DENIED');
 ELSE
  RAISE EXCEPTION 'UNKNOWN_FINANCIAL_COMMAND' USING ERRCODE='P0001';
 END IF;
 RETURN jsonb_build_object('id',result_id);
END $$;
COMMIT;

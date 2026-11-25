-- Exact calculation, structural guards and authenticated operation protocol.
BEGIN;
CREATE OR REPLACE FUNCTION fin_amount(value jsonb, signed boolean DEFAULT false) RETURNS bigint LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE text_value text; parsed numeric;
BEGIN
 text_value:=value#>>'{}';
 PERFORM ec_require(jsonb_typeof(value)='string' AND text_value ~ CASE WHEN signed THEN '^(0|-?[1-9][0-9]*)$' ELSE '^(0|[1-9][0-9]*)$' END,'INVALID_CENTS');
 parsed:=text_value::numeric;
 PERFORM ec_require(parsed BETWEEN CASE WHEN signed THEN -9223372036854775807::numeric ELSE 0 END AND 9223372036854775807::numeric,'MONEY_RANGE');
 RETURN parsed::bigint;
END $$;
CREATE OR REPLACE FUNCTION fin_json(value jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE result jsonb; item record;
BEGIN
 IF jsonb_typeof(value)='array' THEN
  SELECT COALESCE(jsonb_agg(fin_json(v) ORDER BY n),'[]') INTO result FROM jsonb_array_elements(value) WITH ORDINALITY x(v,n); RETURN result;
 ELSIF jsonb_typeof(value)='object' THEN
  result:='{}';
  FOR item IN SELECT * FROM jsonb_each(value) LOOP
   result:=result||jsonb_build_object(item.key,CASE WHEN item.key ~ '(_cents$|Cents$|(^|_)version$|Version$|^revision$)' AND jsonb_typeof(item.value)='number' THEN to_jsonb(item.value#>>'{}') ELSE fin_json(item.value) END);
  END LOOP; RETURN result;
 END IF;
 RETURN value;
END $$;
CREATE OR REPLACE FUNCTION fin_allocate(total bigint, weights bigint[]) RETURNS bigint[] LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE denominator numeric; result bigint[]; residues numeric[]; remaining bigint; chosen integer; i integer;
BEGIN
 PERFORM ec_require(total>=0 AND cardinality(weights)>0 AND NOT EXISTS(SELECT 1 FROM unnest(weights) w WHERE w<0 OR w IS NULL),'INVALID_ALLOCATION');
 SELECT sum(w) INTO denominator FROM unnest(weights) w;
 PERFORM ec_require(denominator>0,'EMPTY_ALLOCATION');
 SELECT array_agg(floor(total::numeric*w/denominator)::bigint ORDER BY n),array_agg(mod(total::numeric*w,denominator) ORDER BY n)
 INTO result,residues FROM unnest(weights) WITH ORDINALITY x(w,n);
 SELECT total-sum(w)::bigint INTO remaining FROM unnest(result) w;
 WHILE remaining>0 LOOP
  chosen:=1;
  FOR i IN 2..cardinality(weights) LOOP IF residues[i]>residues[chosen] THEN chosen:=i; END IF; END LOOP;
  result[chosen]:=result[chosen]+1; residues[chosen]:=-1; remaining:=remaining-1;
 END LOOP;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION fin_date(anchor date, frequency text, occurrence integer) RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE first_day date;
BEGIN
 PERFORM ec_require(anchor IS NOT NULL AND occurrence BETWEEN 0 AND 1200 AND frequency IN('MONTHLY','FORTNIGHTLY','WEEKLY','DAILY'),'DATE_RANGE');
 IF frequency='MONTHLY' THEN
  first_day:=(date_trunc('month',anchor::timestamp)+make_interval(months=>occurrence))::date;
  RETURN first_day+LEAST(extract(day FROM anchor)::int,extract(day FROM first_day+interval '1 month - 1 day')::int)-1;
 END IF;
 RETURN anchor+occurrence*CASE frequency WHEN 'FORTNIGHTLY' THEN 15 WHEN 'WEEKLY' THEN 7 ELSE 1 END;
END $$;
CREATE OR REPLACE FUNCTION fin_lock(tenant uuid, shared boolean DEFAULT false) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 IF shared THEN PERFORM pg_advisory_xact_lock_shared(hashtextextended('finance:'||tenant::text,0));
 ELSE PERFORM pg_advisory_xact_lock(hashtextextended('finance:'||tenant::text,0)); END IF;
END $$;
CREATE OR REPLACE FUNCTION fin_page(action text, input jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $$
 SELECT CASE
 WHEN action IN('C01','C02','C03','C04','C05','C06','C07','C08','C09','C10','C26','C27','C28','C29','C30','C31','C36','C40') THEN CASE WHEN input->>'direction'='PAY' THEN 'CONTAS_PAGAR' WHEN input->>'direction'='RECEIVE' THEN 'CONTAS_RECEBER' END
 WHEN action IN('C11','C12','C13','C32') THEN 'FIN_CONTAS'
 WHEN action IN('C14','C15','C16','C22','C23','C24','C25','C37','C38','C39') THEN 'FIN_CONFIGURACOES'
 WHEN action IN('C17','C18','C19','C20','C21','C33') THEN 'FIN_CONCILIACAO'
 WHEN action IN('C34','C35') THEN 'FIN_RELATORIOS' END
$$;
CREATE OR REPLACE FUNCTION fin_actor(uid text, token text) RETURNS users LANGUAGE plpgsql AS $$
DECLARE actor users;
BEGIN
 PERFORM 1 FROM users u JOIN tenants t ON t.id=u.tenant_id JOIN roles r ON r.id=u.role_id AND r.tenant_id=u.tenant_id
 JOIN user_device_sessions s ON s.user_id=u.id AND s.tenant_id=u.tenant_id WHERE u.id=uid FOR SHARE OF u,t,r,s;
 actor:=ec_actor(uid,token); RETURN actor;
END $$;
CREATE OR REPLACE FUNCTION fin_access(actor users, page text, capability text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 PERFORM 1 FROM role_page_permissions p WHERE p.tenant_id=actor.tenant_id AND p.role_id=actor.role_id FOR SHARE;
 PERFORM 1 FROM user_page_permissions p WHERE p.tenant_id=actor.tenant_id AND p.user_id=actor.id FOR SHARE;
 PERFORM ec_require(page IS NOT NULL AND ec_can(actor,page,capability),'ACCESS_DENIED');
END $$;
CREATE OR REPLACE FUNCTION fin_branch(actor users, branch uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 PERFORM ec_require(ec_branch(actor,branch),'BRANCH_DENIED');
END $$;
CREATE OR REPLACE FUNCTION fin_account(actor users, account uuid, branch uuid, capability text DEFAULT 'view') RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 PERFORM fin_branch(actor,branch);
 PERFORM 1 FROM fin_account_grants g WHERE g.tenant_id=actor.tenant_id AND g.user_id=actor.id AND g.account_id=account FOR SHARE;
 PERFORM ec_require(EXISTS(SELECT 1 FROM financial_accounts a JOIN fin_account_grants g ON g.account_id=a.id AND g.tenant_id=a.tenant_id
 WHERE a.id=account AND a.tenant_id=actor.tenant_id AND (a.active OR capability='view') AND g.user_id=actor.id AND g.branch_id=branch
 AND CASE capability WHEN 'view' THEN true WHEN 'post' THEN g.can_post WHEN 'reconcile' THEN g.can_reconcile ELSE false END),'ACCOUNT_DENIED');
 IF capability<>'view' THEN
  PERFORM ec_require(EXISTS(SELECT 1 FROM fin_account_cuts c WHERE c.tenant_id=actor.tenant_id AND c.account_id=account),'ACCOUNT_CUT_REQUIRED');
 END IF;
END $$;
CREATE OR REPLACE FUNCTION fin_period(tenant uuid, branch uuid, day date) RETURNS void LANGUAGE plpgsql AS $$
DECLARE closed boolean;
BEGIN
 PERFORM ec_require(day IS NOT NULL AND day BETWEEN date '1900-01-01' AND date '9999-12-31','INVALID_DATE');
 PERFORM fin_lock(tenant);
 INSERT INTO fin_period_guards(tenant_id,branch_id,period) VALUES(tenant,branch,date_trunc('month',day::timestamp)::date) ON CONFLICT DO NOTHING;
 SELECT g.closed INTO closed FROM fin_period_guards g WHERE g.tenant_id=tenant AND g.branch_id=branch AND g.period=date_trunc('month',day::timestamp)::date FOR UPDATE;
 PERFORM ec_require(NOT closed,'PERIOD_CLOSED');
END $$;
CREATE OR REPLACE VIEW fin_title_state AS
 SELECT t.*,d.branch_id,d.description,d.source_type,d.source_key,d.customer_id,d.supplier_id,d.competence_date,
 COALESCE(p.amount_cents,r.amount_cents) original_cents,COALESCE(p.due_date,r.due_date) due_date,
 COALESCE(p.status,r.status) legacy_status,COALESCE(p.category_id,r.category_id) category_id,
 COALESCE(p.account_id,r.account_id) account_id,
 COALESCE(principal.consumed,0)::bigint principal_cents,
 (COALESCE(p.amount_cents,r.amount_cents)::numeric-COALESCE(principal.consumed,0))::bigint residual_cents
 FROM fin_titles t JOIN fin_documents d ON d.id=t.document_id AND d.tenant_id=t.tenant_id
 LEFT JOIN accounts_payable p ON p.id=t.payable_id AND p.tenant_id=t.tenant_id
 LEFT JOIN accounts_receivable r ON r.id=t.receivable_id AND r.tenant_id=t.tenant_id
 LEFT JOIN LATERAL(SELECT sum(e.amount_cents) consumed FROM fin_principal_events e WHERE e.title_id=t.id AND e.tenant_id=t.tenant_id) principal ON true;

CREATE OR REPLACE FUNCTION fin_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 RAISE EXCEPTION 'IMMUTABLE_FINANCIAL_FACT' USING ERRCODE='P0001';
END $$;
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['fin_principal_events','fin_principal_dimensions','fin_settlements','fin_allocations','fin_journals','fin_journal_lines','fin_economic_events','fin_reversals','fin_transfers','fin_import_batches','fin_bank_transactions','fin_matches','fin_match_edges','fin_unmatches','fin_closures','fin_dre_maps','fin_dre_map_lines'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='fin_immutable_fact' AND tgrelid=tab::regclass) THEN
   EXECUTE format('CREATE TRIGGER fin_immutable_fact BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fin_immutable()',tab);
  END IF;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION fin_journal_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE journal uuid; tenant uuid; balanced boolean; branch uuid; day date;
BEGIN
 IF TG_TABLE_NAME='fin_journals' THEN journal:=NEW.id; ELSE journal:=NEW.journal_id; END IF;
 tenant:=NEW.tenant_id;
 SELECT count(*)>=2 AND sum(debit_cents::numeric-credit_cents)=0 INTO balanced FROM fin_journal_lines WHERE tenant_id=tenant AND journal_id=journal;
 PERFORM ec_require(balanced,'UNBALANCED_JOURNAL');
 SELECT effective_date INTO day FROM fin_journals WHERE tenant_id=tenant AND id=journal;
 FOR branch IN SELECT DISTINCT branch_id FROM fin_journal_lines WHERE tenant_id=tenant AND journal_id=journal ORDER BY branch_id LOOP
  PERFORM fin_period(tenant,branch,day);
 END LOOP;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS fin_balanced_header ON fin_journals;
CREATE CONSTRAINT TRIGGER fin_balanced_header AFTER INSERT ON fin_journals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fin_journal_guard();
DROP TRIGGER IF EXISTS fin_balanced_lines ON fin_journal_lines;
CREATE CONSTRAINT TRIGGER fin_balanced_lines AFTER INSERT ON fin_journal_lines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fin_journal_guard();
CREATE OR REPLACE FUNCTION fin_principal_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE state fin_title_state;
BEGIN
 SELECT * INTO state FROM fin_title_state WHERE tenant_id=NEW.tenant_id AND id=NEW.title_id;
 PERFORM ec_require(state.id IS NOT NULL AND state.residual_cents BETWEEN 0 AND state.original_cents,'PRINCIPAL_RANGE');
 PERFORM fin_period(NEW.tenant_id,state.branch_id,NEW.effective_date);
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS fin_principal_capacity ON fin_principal_events;
CREATE CONSTRAINT TRIGGER fin_principal_capacity AFTER INSERT ON fin_principal_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fin_principal_guard();

CREATE OR REPLACE FUNCTION fin_prepare(uid text, token text, command jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE actor users; operation uuid; hash text; existing fin_operations; page text;
BEGIN
 actor:=fin_actor(uid,token);
 PERFORM ec_require(jsonb_typeof(command)='object' AND octet_length(command::text)<=262144,'REQUEST_LIMIT');
 operation:=(command->>'operationId')::uuid; page:=fin_page(command->>'action',command->'payload');
 PERFORM ec_require(operation IS NOT NULL AND jsonb_typeof(command->'payload')='object','VALIDATION_ERROR');
 PERFORM fin_access(actor,page,'manage');
 PERFORM pg_advisory_xact_lock(hashtextextended('fin-operation:'||operation::text,0));
 IF EXISTS(SELECT 1 FROM fin_operation_abandonments a WHERE a.operation_id=operation) THEN
  PERFORM ec_require(EXISTS(SELECT 1 FROM fin_operation_abandonments a WHERE a.operation_id=operation AND a.tenant_id=actor.tenant_id AND a.actor_uid=actor.id),'OPERATION_DENIED');
  RETURN jsonb_build_object('status','CANCELLED','operationId',operation);
 END IF;
 hash:=encode(sha256(convert_to(command::text,'UTF8')),'hex');
 SELECT * INTO existing FROM fin_operations WHERE id=operation FOR UPDATE;
 IF existing.id IS NOT NULL THEN
  PERFORM ec_require(existing.tenant_id=actor.tenant_id AND existing.actor_uid=actor.id AND existing.payload_hash=hash,'IDEMPOTENCY_CONFLICT');
  RETURN jsonb_build_object('status',existing.status,'operationId',operation,'payloadHash',hash,'result',existing.result);
 END IF;
 INSERT INTO fin_operations(id,tenant_id,actor_uid,action,page_key,payload_hash,intent,status)
 VALUES(operation,actor.tenant_id,actor.id,command->>'action',page,hash,command,'PREPARED');
 RETURN jsonb_build_object('status','PREPARED','operationId',operation,'payloadHash',hash);
END $$;
COMMIT;

-- Read source facts by their original IDs. No historical cash movement is inferred.
BEGIN;

CREATE TABLE IF NOT EXISTS fin_event_categories (
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  event_type text NOT NULL,
  category_id uuid NOT NULL,
  PRIMARY KEY(tenant_id,event_type),
  FOREIGN KEY(tenant_id,category_id) REFERENCES financial_categories(tenant_id,id)
);

CREATE TABLE IF NOT EXISTS fin_origin_accounts (
  tenant_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  origin text NOT NULL CHECK(origin IN('DRAWER','POS','EC')),
  method_id uuid,
  account_id uuid NOT NULL,
  starts_on date NOT NULL,
  configured_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT(tenant_id,branch_id,origin,method_id),
  FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id),
  FOREIGN KEY(tenant_id,method_id) REFERENCES payment_methods(tenant_id,id),
  FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id),
  FOREIGN KEY(tenant_id,configured_by) REFERENCES users(tenant_id,id),
  CHECK((origin='DRAWER')=(method_id IS NULL))
);

CREATE OR REPLACE FUNCTION fin_origin_config(actor users, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE mode text:=payload->>'kind';
 branch uuid;
 account uuid;
 category uuid;
 origin_key text;
 method uuid;
 first_day date;
BEGIN
 IF mode='EVENT_CATEGORY' THEN
  category:=(payload->>'categoryId')::uuid;
  PERFORM ec_require(payload->>'eventType' IN('SALE_REVENUE','SALE_COST','FEE','INTEREST','PENALTY','DISCOUNT','LOSS','RECOVERY'),'INVALID_EVENT');
  PERFORM ec_require(EXISTS(SELECT 1 FROM financial_categories c WHERE c.tenant_id=actor.tenant_id AND c.id=category AND c.active),'CATEGORY_DENIED');
  INSERT INTO fin_event_categories(tenant_id,event_type,category_id)
  VALUES(actor.tenant_id,payload->>'eventType',category)
  ON CONFLICT(tenant_id,event_type) DO UPDATE SET category_id=EXCLUDED.category_id;
  RETURN jsonb_build_object('categoryId',category,'eventType',payload->>'eventType');
 END IF;
 PERFORM ec_require(mode='SOURCE_ACCOUNT','VALIDATION_ERROR');
 PERFORM fin_access(actor,'FIN_CONTAS','manage');
 branch:=(payload->>'branchId')::uuid;
 account:=(payload->>'accountId')::uuid;
 origin_key:=payload->>'origin';
 method:=NULLIF(payload->>'methodId','')::uuid;
 first_day:=(payload->>'startsOn')::date;
 PERFORM fin_account(actor,account,branch,'post');
 PERFORM ec_require(first_day>(SELECT c.cutoff_date FROM fin_account_cuts c WHERE c.tenant_id=actor.tenant_id AND c.account_id=account)
 AND first_day>=(now() AT TIME ZONE (SELECT t.timezone FROM tenants t WHERE t.id=actor.tenant_id))::date,'SOURCE_CUT_REQUIRED');
 IF origin_key='DRAWER' THEN
  PERFORM fin_access(actor,'CAIXA','manage');
  PERFORM ec_require(EXISTS(SELECT 1 FROM financial_accounts a WHERE a.tenant_id=actor.tenant_id AND a.id=account AND a.account_type='CASH'),'CASH_ACCOUNT_REQUIRED');
 ELSE
  -- Only a confirmed immediate payment belongs to cash. Card/provider receivables are separate.
  PERFORM ec_require(EXISTS(SELECT 1 FROM payment_methods m WHERE m.tenant_id=actor.tenant_id AND m.id=method AND m.active AND m.code='PIX'),'IMMEDIATE_PAYMENT_REQUIRED');
  PERFORM ec_require(EXISTS(SELECT 1 FROM financial_accounts a WHERE a.tenant_id=actor.tenant_id AND a.id=account AND a.account_type IN('BANK','WALLET')),'BANK_ACCOUNT_REQUIRED');
 END IF;
 INSERT INTO fin_origin_accounts(tenant_id,branch_id,origin,method_id,account_id,starts_on,configured_by)
 VALUES(actor.tenant_id,branch,origin_key,method,account,first_day,actor.id);
 RETURN jsonb_build_object('accountId',account,'startsOn',first_day);
END $$;

CREATE OR REPLACE FUNCTION fin_source_cash()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tenant uuid:=NEW.tenant_id;
 branch uuid;
 method uuid;
 origin_key text;
 amount bigint;
 effect_key text;
 effective_day date;
 mapping fin_origin_accounts;
 journal uuid;
 sale_row sales;
 document_row ec_documents;
 session_row cash_sessions;
 source_cash uuid;
 source_payment uuid;
BEGIN
 IF TG_TABLE_NAME='cash_movements' THEN
  IF NEW.movement_type='OPENING' THEN RETURN NULL; END IF;
  SELECT s.* INTO session_row FROM cash_sessions s WHERE s.tenant_id=tenant AND s.id=NEW.session_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  branch:=session_row.branch_id;
  origin_key:='DRAWER';
  amount:=NEW.amount_cents;
  effective_day:=(session_row.opened_at AT TIME ZONE (SELECT t.timezone FROM tenants t WHERE t.id=tenant))::date;
  effect_key:='drawer:'||NEW.id;
  source_cash:=NEW.id;
 ELSIF TG_TABLE_NAME='sale_payments' THEN
  -- Cancellation of the sale does not attest an external Pix refund.
  SELECT s.* INTO sale_row FROM sales s WHERE s.tenant_id=tenant AND s.id=NEW.sale_id AND s.source='POS' AND s.status='COMPLETED';
  IF NOT FOUND OR NEW.status<>'CONFIRMED' THEN RETURN NULL; END IF;
  branch:=sale_row.branch_id;
  method:=NEW.payment_method_id;
  origin_key:='POS';
  amount:=NEW.amount_cents;
  effective_day:=(sale_row.sold_at AT TIME ZONE (SELECT t.timezone FROM tenants t WHERE t.id=tenant))::date;
  effect_key:='pos-payment:'||NEW.id;
  source_payment:=NEW.id;
 ELSE
  SELECT d.* INTO document_row FROM ec_documents d WHERE d.tenant_id=tenant AND d.id=NEW.document_id;
  IF NOT FOUND OR NEW.cash_session_id IS NOT NULL AND EXISTS(
   SELECT 1 FROM payment_methods m WHERE m.tenant_id=tenant AND m.id=NEW.payment_method_id AND m.code='CASH'
  ) THEN RETURN NULL; END IF;
  branch:=document_row.branch_id;
  method:=NEW.payment_method_id;
  origin_key:='EC';
  IF TG_TABLE_NAME='ec_receipts' THEN
   amount:=NEW.amount_cents;
   effective_day:=(NEW.received_at AT TIME ZONE document_row.timezone_snapshot)::date;
   effect_key:='ec-receipt:'||NEW.id;
  ELSE
   amount:=-NEW.amount_cents;
   effective_day:=(NEW.refunded_at AT TIME ZONE document_row.timezone_snapshot)::date;
   effect_key:='ec-refund:'||NEW.id;
  END IF;
 END IF;
 SELECT m.* INTO mapping FROM fin_origin_accounts m
 JOIN financial_accounts a ON a.tenant_id=m.tenant_id AND a.id=m.account_id AND a.active
 WHERE m.tenant_id=tenant AND m.branch_id=branch AND m.origin=origin_key AND m.method_id IS NOT DISTINCT FROM method
 AND m.starts_on<=effective_day;
 IF NOT FOUND OR amount=0 THEN RETURN NULL; END IF;
 PERFORM fin_lock(tenant);
 IF EXISTS(SELECT 1 FROM fin_period_guards g WHERE g.tenant_id=tenant AND g.branch_id=branch
 AND g.period=date_trunc('month',effective_day::timestamp)::date AND g.closed) THEN
  INSERT INTO fin_migration_issues(tenant_id,source_table,source_id,issue)
  VALUES(tenant,TG_TABLE_NAME,NEW.id,'SOURCE_EFFECT_IN_CLOSED_PERIOD') ON CONFLICT DO NOTHING;
  RETURN NULL;
 END IF;
 INSERT INTO fin_journals(tenant_id,source_key,effective_date,description)
 VALUES(tenant,effect_key,effective_day,CASE origin_key WHEN 'DRAWER' THEN 'Movimento do caixa' WHEN 'EC' THEN 'Encomenda ou comanda' ELSE 'Pagamento no PDV' END)
 ON CONFLICT(tenant_id,source_key) DO NOTHING RETURNING id INTO journal;
 IF journal IS NULL THEN RETURN NULL; END IF;
 INSERT INTO fin_journal_lines(tenant_id,journal_id,branch_id,account_id,debit_cents,credit_cents,source_cash_id,source_payment_id)
 VALUES(tenant,journal,branch,mapping.account_id,GREATEST(amount,0),GREATEST(-amount,0),source_cash,source_payment);
 INSERT INTO fin_journal_lines(tenant_id,journal_id,branch_id,control_key,debit_cents,credit_cents)
 VALUES(tenant,journal,branch,CASE origin_key WHEN 'EC' THEN 'CUSTOMER_ADVANCE' ELSE 'SOURCE_CLEARING' END,GREATEST(-amount,0),GREATEST(amount,0));
 RETURN NULL;
END $$;

-- Defer to the original transaction boundary. EC receipt links and source writes
-- can complete before this runs, and an unmapped origin continues its own flow.
DO $$ DECLARE source_name text; BEGIN
 FOREACH source_name IN ARRAY ARRAY['cash_movements','sale_payments','ec_receipts','ec_refunds'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='fin_observe_source_cash' AND tgrelid=source_name::regclass) THEN
   EXECUTE format('CREATE CONSTRAINT TRIGGER fin_observe_source_cash AFTER INSERT ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fin_source_cash()',source_name);
  END IF;
 END LOOP;
END $$;

-- Sales already embody the economic event, including sales created when EC closes.
-- Read their amount and actual item cost snapshots from the source instead of
-- copying the sale payments or customer advances into revenue.
CREATE OR REPLACE VIEW fin_sale_economics AS
SELECT s.tenant_id,s.id sale_id,s.branch_id, (s.sold_at AT TIME ZONE t.timezone)::date competence_date,
       e.event_type,e.amount_cents,e.quality
FROM sales s JOIN tenants t ON t.id=s.tenant_id
LEFT JOIN LATERAL (
 SELECT count(*) C, count(*) FILTER(WHERE item.unit_cost_cents<=0) missing,
        sum(round(item.quantity*item.unit_cost_cents)) amount
 FROM sale_items item WHERE item.tenant_id=s.tenant_id AND item.sale_id=s.id
) cost ON true
CROSS JOIN LATERAL (VALUES
 ('SALE_REVENUE',s.total_cents::numeric,'KNOWN'),
 ('SALE_COST',CASE WHEN cost.c>0 AND cost.missing=0 THEN -cost.amount END,
 CASE WHEN cost.c>0 AND cost.missing=0 THEN 'KNOWN' ELSE 'MISSING_COST' END)
) e(event_type,amount_cents,quality)
WHERE s.status IN('COMPLETED','CANCELLED')
UNION ALL
SELECT s.tenant_id,s.id,s.branch_id,(s.cancelled_at AT TIME ZONE t.timezone)::date,
       e.event_type,-e.amount_cents,e.quality
FROM sales s JOIN tenants t ON t.id=s.tenant_id
LEFT JOIN LATERAL (
 SELECT count(*) c, count(*) FILTER(WHERE item.unit_cost_cents<=0) missing,
        sum(round(item.quantity*item.unit_cost_cents)) amount
 FROM sale_items item WHERE item.tenant_id=s.tenant_id AND item.sale_id=s.id
)cost ON true
CROSS JOIN LATERAL (VALUES
 ('SALE_REVENUE',s.total_cents::numeric,'KNOWN'),
 ('SALE_COST',CASE WHEN cost.c>0 AND cost.missing=0 THEN -cost.amount END,
 CASE WHEN cost.c>0 AND cost.missing=0 THEN 'KNOWN' ELSE 'MISSING_COST' END)
)e(event_type,amount_cents,quality)
WHERE s.status='CANCELLED' AND s.cancelled_at IS NOT NULL;

COMMIT;

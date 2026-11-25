-- Financeiro, ADR-001 alternative A. Native-managed additive schema.
-- No backfill, accounts, grants, opening balances or invented historical facts.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';

-- Composite keys make tenant isolation structural for every new relationship.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['branches','customers','suppliers','users','financial_accounts','financial_categories','accounts_payable','accounts_receivable','payment_methods','cash_sessions','cash_movements','sales','sale_payments','ec_documents','ec_receipts'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fin_tenant_id_'||t AND conrelid=t::regclass) THEN
   EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I UNIQUE(tenant_id,id)',t,'fin_tenant_id_'||t);
  END IF;
 END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS fin_account_cuts (
 tenant_id uuid NOT NULL REFERENCES tenants(id), account_id uuid NOT NULL,
 cutoff_date date NOT NULL, currency text NOT NULL CHECK(currency='BRL'),
 verified_by text NOT NULL, verified_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 PRIMARY KEY(tenant_id,account_id), FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id),
 FOREIGN KEY(tenant_id,verified_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_account_grants (
 tenant_id uuid NOT NULL REFERENCES tenants(id), account_id uuid NOT NULL, user_id text NOT NULL,
 branch_id uuid NOT NULL, can_post boolean NOT NULL DEFAULT false,
 can_reconcile boolean NOT NULL DEFAULT false, can_global_balance boolean NOT NULL DEFAULT false,
 PRIMARY KEY(tenant_id,account_id,user_id,branch_id),
 FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id),
 FOREIGN KEY(tenant_id,user_id) REFERENCES users(tenant_id,id),
 FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_centers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120), purpose text NOT NULL DEFAULT '',
 branch_id uuid, active boolean NOT NULL DEFAULT true, version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,name), FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_category_details (
 tenant_id uuid NOT NULL, category_id uuid NOT NULL, code text NOT NULL,
 parent_id uuid, nature text NOT NULL CHECK(nature IN('REVENUE','EXPENSE','ASSET','LIABILITY','EQUITY','COST','DEDUCTION','FINANCE')),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), PRIMARY KEY(tenant_id,category_id), UNIQUE(tenant_id,code),
 FOREIGN KEY(tenant_id,category_id) REFERENCES financial_categories(tenant_id,id),
 FOREIGN KEY(tenant_id,parent_id) REFERENCES financial_categories(tenant_id,id), CHECK(parent_id IS DISTINCT FROM category_id)
);
CREATE TABLE IF NOT EXISTS fin_dre_maps (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 revision bigint NOT NULL CHECK(revision>0), effective_from date NOT NULL,
 published_by text NOT NULL, published_at timestamptz NOT NULL DEFAULT now(),
 source_categories jsonb NOT NULL DEFAULT '{}'::jsonb,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,revision), FOREIGN KEY(tenant_id,published_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_dre_map_lines (
 tenant_id uuid NOT NULL, map_id uuid NOT NULL, category_id uuid NOT NULL,
 dre_line text NOT NULL CHECK(dre_line IN('GROSS_REVENUE','DEDUCTIONS','COGS','OPERATING_EXPENSE','FINANCIAL_RESULT','NON_DRE')),
 PRIMARY KEY(tenant_id,map_id,category_id), FOREIGN KEY(tenant_id,map_id) REFERENCES fin_dre_maps(tenant_id,id),
 FOREIGN KEY(tenant_id,category_id) REFERENCES financial_categories(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_terms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), name text NOT NULL,
 installment_count integer NOT NULL CHECK(installment_count BETWEEN 1 AND 120),
 frequency text NOT NULL CHECK(frequency IN('MONTHLY','FORTNIGHTLY','WEEKLY','DAILY')),
 first_offset_days integer NOT NULL CHECK(first_offset_days BETWEEN 0 AND 3660),
 active boolean NOT NULL DEFAULT true, version bigint NOT NULL DEFAULT 1 CHECK(version>0), UNIQUE(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), branch_id uuid NOT NULL,
 direction text NOT NULL CHECK(direction IN('PAY','RECEIVE')), description text NOT NULL CHECK(length(btrim(description)) BETWEEN 1 AND 180),
 source_key text NOT NULL CHECK(length(source_key) BETWEEN 1 AND 240), source_type text NOT NULL,
 issue_date date NOT NULL, competence_date date NOT NULL, nominal_cents bigint NOT NULL CHECK(nominal_cents>0),
 customer_id uuid, supplier_id uuid, currency text NOT NULL DEFAULT 'BRL' CHECK(currency='BRL'),
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), notes text NOT NULL DEFAULT '',
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,source_key),
 FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id),
 FOREIGN KEY(tenant_id,customer_id) REFERENCES customers(tenant_id,id),
 FOREIGN KEY(tenant_id,supplier_id) REFERENCES suppliers(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),
 CHECK(NOT(customer_id IS NOT NULL AND supplier_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS fin_titles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, document_id uuid NOT NULL,
 direction text NOT NULL CHECK(direction IN('PAY','RECEIVE')), payable_id uuid, receivable_id uuid,
 installment integer NOT NULL CHECK(installment>0), forecast_date date,
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), blocked_reason text,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,payable_id), UNIQUE(tenant_id,receivable_id), UNIQUE(tenant_id,document_id,installment),
 FOREIGN KEY(tenant_id,document_id) REFERENCES fin_documents(tenant_id,id),
 FOREIGN KEY(tenant_id,payable_id) REFERENCES accounts_payable(tenant_id,id),
 FOREIGN KEY(tenant_id,receivable_id) REFERENCES accounts_receivable(tenant_id,id),
 CHECK((direction='PAY' AND payable_id IS NOT NULL AND receivable_id IS NULL) OR (direction='RECEIVE' AND receivable_id IS NOT NULL AND payable_id IS NULL))
);
CREATE TABLE IF NOT EXISTS fin_classifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, document_id uuid NOT NULL,
 category_id uuid NOT NULL, center_id uuid, amount_cents bigint NOT NULL CHECK(amount_cents>0),
 ordinal integer NOT NULL CHECK(ordinal>0), UNIQUE(tenant_id,id), UNIQUE(tenant_id,document_id,ordinal),
 FOREIGN KEY(tenant_id,document_id) REFERENCES fin_documents(tenant_id,id),
 FOREIGN KEY(tenant_id,category_id) REFERENCES financial_categories(tenant_id,id), FOREIGN KEY(tenant_id,center_id) REFERENCES fin_centers(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_title_capacities (
 tenant_id uuid NOT NULL, title_id uuid NOT NULL, classification_id uuid NOT NULL,
 amount_cents bigint NOT NULL CHECK(amount_cents>=0), PRIMARY KEY(tenant_id,title_id,classification_id),
 FOREIGN KEY(tenant_id,title_id) REFERENCES fin_titles(tenant_id,id), FOREIGN KEY(tenant_id,classification_id) REFERENCES fin_classifications(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_operations (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id), actor_uid text NOT NULL,
 action text NOT NULL, page_key text NOT NULL, payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 intent jsonb NOT NULL CHECK(jsonb_typeof(intent)='object'),
 status text NOT NULL CHECK(status IN('PREPARED','COMMITTED','REJECTED','CANCELLED')),
 result jsonb, created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 UNIQUE(tenant_id,id), FOREIGN KEY(tenant_id,actor_uid) REFERENCES users(tenant_id,id),
 CHECK((status='PREPARED' AND result IS NULL AND finished_at IS NULL) OR (status<>'PREPARED' AND result IS NOT NULL AND finished_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS fin_operation_abandonments (
 operation_id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL REFERENCES tenants(id),
 actor_uid text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(tenant_id,actor_uid) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_settlements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, operation_id uuid NOT NULL,
 direction text NOT NULL CHECK(direction IN('PAY','RECEIVE')), account_id uuid NOT NULL, method_id uuid NOT NULL,
 effective_date date NOT NULL, reference text NOT NULL DEFAULT '', reason text NOT NULL DEFAULT '',
 fee_mode text NOT NULL CHECK(fee_mode IN('RETAINED','ADDED','SEPARATE')),
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,operation_id), FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id),
 FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id), FOREIGN KEY(tenant_id,method_id) REFERENCES payment_methods(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, settlement_id uuid NOT NULL, title_id uuid NOT NULL,
 principal_cents bigint NOT NULL CHECK(principal_cents>0), discount_cents bigint NOT NULL CHECK(discount_cents>=0 AND discount_cents<=principal_cents),
 interest_cents bigint NOT NULL CHECK(interest_cents>=0), penalty_cents bigint NOT NULL CHECK(penalty_cents>=0), fee_cents bigint NOT NULL CHECK(fee_cents>=0),
 cash_cents bigint NOT NULL CHECK(cash_cents>=0), UNIQUE(tenant_id,id), UNIQUE(tenant_id,settlement_id,title_id),
 FOREIGN KEY(tenant_id,settlement_id) REFERENCES fin_settlements(tenant_id,id), FOREIGN KEY(tenant_id,title_id) REFERENCES fin_titles(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_principal_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, title_id uuid NOT NULL, operation_id uuid NOT NULL,
 allocation_id uuid, amount_cents bigint NOT NULL CHECK(amount_cents<>0),
 event_type text NOT NULL CHECK(event_type IN('SETTLEMENT','REVERSAL','LOSS','RECOVERY','CANCEL','AGREEMENT')),
 reverses_id uuid, effective_date date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,reverses_id),
 FOREIGN KEY(tenant_id,title_id) REFERENCES fin_titles(tenant_id,id), FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id),
 FOREIGN KEY(tenant_id,allocation_id) REFERENCES fin_allocations(tenant_id,id), FOREIGN KEY(tenant_id,reverses_id) REFERENCES fin_principal_events(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_principal_dimensions (
 tenant_id uuid NOT NULL, event_id uuid NOT NULL, classification_id uuid NOT NULL, amount_cents bigint NOT NULL,
 PRIMARY KEY(tenant_id,event_id,classification_id), FOREIGN KEY(tenant_id,event_id) REFERENCES fin_principal_events(tenant_id,id),
 FOREIGN KEY(tenant_id,classification_id) REFERENCES fin_classifications(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_journals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 operation_id uuid, source_key text NOT NULL, effective_date date NOT NULL,
 description text NOT NULL, reverses_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,source_key), UNIQUE(tenant_id,reverses_id),
 FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id), FOREIGN KEY(tenant_id,reverses_id) REFERENCES fin_journals(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_journal_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, journal_id uuid NOT NULL, branch_id uuid NOT NULL,
 account_id uuid, control_key text, debit_cents bigint NOT NULL CHECK(debit_cents>=0), credit_cents bigint NOT NULL CHECK(credit_cents>=0),
 settlement_id uuid, source_cash_id uuid, source_payment_id uuid,
 UNIQUE(tenant_id,id), FOREIGN KEY(tenant_id,journal_id) REFERENCES fin_journals(tenant_id,id),
 FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id), FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id),
 FOREIGN KEY(tenant_id,settlement_id) REFERENCES fin_settlements(tenant_id,id),
 FOREIGN KEY(tenant_id,source_cash_id) REFERENCES cash_movements(tenant_id,id), FOREIGN KEY(tenant_id,source_payment_id) REFERENCES sale_payments(tenant_id,id),
 CHECK((account_id IS NULL)<>(control_key IS NULL)), CHECK((debit_cents>0 AND credit_cents=0) OR (credit_cents>0 AND debit_cents=0))
);
CREATE TABLE IF NOT EXISTS fin_economic_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), branch_id uuid NOT NULL,
 source_key text NOT NULL, event_type text NOT NULL, competence_date date NOT NULL,
 amount_cents bigint, category_id uuid, center_id uuid, document_id uuid, sale_id uuid,
 quality text NOT NULL CHECK(quality IN('KNOWN','MISSING_COST','MISSING_CLASSIFICATION','UNVERIFIED_HISTORY')),
 reverses_id uuid, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,source_key), UNIQUE(tenant_id,reverses_id),
 FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id), FOREIGN KEY(tenant_id,category_id) REFERENCES financial_categories(tenant_id,id),
 FOREIGN KEY(tenant_id,center_id) REFERENCES fin_centers(tenant_id,id), FOREIGN KEY(tenant_id,document_id) REFERENCES fin_documents(tenant_id,id),
 FOREIGN KEY(tenant_id,sale_id) REFERENCES sales(tenant_id,id), FOREIGN KEY(tenant_id,reverses_id) REFERENCES fin_economic_events(tenant_id,id),
 CHECK(amount_cents IS NOT NULL OR quality='MISSING_COST')
);
CREATE TABLE IF NOT EXISTS fin_reversals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, settlement_id uuid NOT NULL,
 operation_id uuid NOT NULL, effective_date date NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000),
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,settlement_id),
 FOREIGN KEY(tenant_id,settlement_id) REFERENCES fin_settlements(tenant_id,id), FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_transfers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, operation_id uuid NOT NULL,
 from_account uuid NOT NULL, to_account uuid NOT NULL, branch_id uuid NOT NULL,
 amount_cents bigint NOT NULL CHECK(amount_cents>0), fee_cents bigint NOT NULL CHECK(fee_cents>=0), effective_date date NOT NULL,
 reference text NOT NULL DEFAULT '', journal_id uuid NOT NULL, UNIQUE(tenant_id,id), UNIQUE(tenant_id,operation_id), CHECK(from_account<>to_account),
 FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id), FOREIGN KEY(tenant_id,from_account) REFERENCES financial_accounts(tenant_id,id),
 FOREIGN KEY(tenant_id,to_account) REFERENCES financial_accounts(tenant_id,id), FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id),
 FOREIGN KEY(tenant_id,journal_id) REFERENCES fin_journals(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_import_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, account_id uuid NOT NULL, operation_id uuid NOT NULL,
 file_hash text NOT NULL CHECK(file_hash ~ '^[a-f0-9]{64}$'), format text NOT NULL CHECK(format IN('CSV','OFX')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,account_id,file_hash),
 FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id), FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_bank_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, batch_id uuid NOT NULL, account_id uuid NOT NULL,
 external_id text, fingerprint text NOT NULL, row_number integer NOT NULL CHECK(row_number>0),
 booked_date date NOT NULL, amount_cents bigint NOT NULL CHECK(amount_cents<>0), description text NOT NULL,
 possible_duplicate boolean NOT NULL DEFAULT false, UNIQUE(tenant_id,id), UNIQUE(tenant_id,batch_id,row_number), UNIQUE(tenant_id,account_id,external_id),
 FOREIGN KEY(tenant_id,batch_id) REFERENCES fin_import_batches(tenant_id,id), FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_matches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, account_id uuid NOT NULL, operation_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id), FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_match_edges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, match_id uuid NOT NULL, bank_id uuid NOT NULL,
 line_id uuid NOT NULL, amount_cents bigint NOT NULL CHECK(amount_cents<>0), created_settlement_id uuid,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,match_id,bank_id,line_id),
 FOREIGN KEY(tenant_id,match_id) REFERENCES fin_matches(tenant_id,id), FOREIGN KEY(tenant_id,bank_id) REFERENCES fin_bank_transactions(tenant_id,id),
 FOREIGN KEY(tenant_id,line_id) REFERENCES fin_journal_lines(tenant_id,id), FOREIGN KEY(tenant_id,created_settlement_id) REFERENCES fin_settlements(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_unmatches (
 tenant_id uuid NOT NULL, match_id uuid NOT NULL, operation_id uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,match_id), FOREIGN KEY(tenant_id,match_id) REFERENCES fin_matches(tenant_id,id),
 FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_period_guards (
 tenant_id uuid NOT NULL, branch_id uuid NOT NULL, period date NOT NULL CHECK(extract(day FROM period)=1),
 closed boolean NOT NULL DEFAULT false, revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
 PRIMARY KEY(tenant_id,branch_id,period), FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_closures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, branch_id uuid NOT NULL,
 period date NOT NULL, revision bigint NOT NULL CHECK(revision>0), action text NOT NULL CHECK(action IN('CLOSE','REOPEN')),
 snapshot jsonb NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000), created_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,branch_id,period,revision),
 FOREIGN KEY(tenant_id,branch_id,period) REFERENCES fin_period_guards(tenant_id,branch_id,period), FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_migration_issues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 source_table text NOT NULL, source_id text NOT NULL, issue text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,source_table,source_id,issue)
);
CREATE INDEX IF NOT EXISTS fin_titles_document_idx ON fin_titles(tenant_id,document_id);
CREATE INDEX IF NOT EXISTS fin_principal_title_idx ON fin_principal_events(tenant_id,title_id,effective_date,created_at);
CREATE INDEX IF NOT EXISTS fin_ledger_account_idx ON fin_journal_lines(tenant_id,account_id,branch_id,journal_id);
CREATE INDEX IF NOT EXISTS fin_journal_date_idx ON fin_journals(tenant_id,effective_date,id);
CREATE INDEX IF NOT EXISTS fin_economic_date_idx ON fin_economic_events(tenant_id,competence_date,branch_id);
CREATE INDEX IF NOT EXISTS fin_operations_actor_idx ON fin_operations(tenant_id,actor_uid,status,created_at);
CREATE INDEX IF NOT EXISTS fin_bank_account_idx ON fin_bank_transactions(tenant_id,account_id,booked_date,id);
COMMIT;

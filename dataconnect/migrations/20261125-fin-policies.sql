-- Versioned policy/configuration, recurring identities and collections history.
BEGIN;
CREATE TABLE IF NOT EXISTS fin_recurrences (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), branch_id uuid NOT NULL,
 active boolean NOT NULL DEFAULT true, current_version bigint NOT NULL CHECK(current_version>0),
 next_occurrence integer NOT NULL DEFAULT 0 CHECK(next_occurrence>=0), UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_recurrence_versions (
 tenant_id uuid NOT NULL, recurrence_id uuid NOT NULL, version bigint NOT NULL CHECK(version>0),
 anchor_date date NOT NULL, frequency text NOT NULL CHECK(frequency IN('MONTHLY','FORTNIGHTLY','WEEKLY','DAILY')),
 end_date date, occurrence_limit integer CHECK(occurrence_limit BETWEEN 1 AND 1200),
 estimated boolean NOT NULL, template jsonb NOT NULL CHECK(jsonb_typeof(template)='object'),
 effective_occurrence integer NOT NULL CHECK(effective_occurrence>=0),
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,recurrence_id,version), FOREIGN KEY(tenant_id,recurrence_id) REFERENCES fin_recurrences(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id), CHECK(end_date IS NULL OR end_date>=anchor_date)
);
CREATE TABLE IF NOT EXISTS fin_occurrences (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, recurrence_id uuid NOT NULL,
 version bigint NOT NULL, occurrence integer NOT NULL CHECK(occurrence>=0), nominal_date date NOT NULL,
 document_id uuid NOT NULL, estimated boolean NOT NULL,
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,recurrence_id,occurrence), UNIQUE(tenant_id,document_id),
 FOREIGN KEY(tenant_id,recurrence_id,version) REFERENCES fin_recurrence_versions(tenant_id,recurrence_id,version),
 FOREIGN KEY(tenant_id,document_id) REFERENCES fin_documents(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, title_id uuid NOT NULL,
 forecast_date date, note text NOT NULL CHECK(length(btrim(note)) BETWEEN 3 AND 2000),
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), FOREIGN KEY(tenant_id,title_id) REFERENCES fin_titles(tenant_id,id), FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_agreements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, operation_id uuid NOT NULL,
 destination_document uuid NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000),
 discount_cents bigint NOT NULL CHECK(discount_cents>=0), interest_cents bigint NOT NULL CHECK(interest_cents>=0),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,operation_id),
 FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id), FOREIGN KEY(tenant_id,destination_document) REFERENCES fin_documents(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_agreement_sources (
 tenant_id uuid NOT NULL, agreement_id uuid NOT NULL, title_id uuid NOT NULL, principal_cents bigint NOT NULL CHECK(principal_cents>0),
 PRIMARY KEY(tenant_id,agreement_id,title_id), FOREIGN KEY(tenant_id,agreement_id) REFERENCES fin_agreements(tenant_id,id), FOREIGN KEY(tenant_id,title_id) REFERENCES fin_titles(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_credit_policies (
 tenant_id uuid NOT NULL, customer_id uuid NOT NULL, limit_cents bigint NOT NULL CHECK(limit_cents>=0),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), configured_by text NOT NULL, configured_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,customer_id), FOREIGN KEY(tenant_id,customer_id) REFERENCES customers(tenant_id,id), FOREIGN KEY(tenant_id,configured_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_credit_authorizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, customer_id uuid NOT NULL, branch_id uuid NOT NULL,
 operation_id uuid NOT NULL, document_id uuid NOT NULL, amount_cents bigint NOT NULL CHECK(amount_cents>0),
 authorized_by text NOT NULL, overdue_reason text, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,document_id), UNIQUE(tenant_id,operation_id),
 FOREIGN KEY(tenant_id,customer_id) REFERENCES customers(tenant_id,id), FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id),
 FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id), FOREIGN KEY(tenant_id,document_id) REFERENCES fin_documents(tenant_id,id), FOREIGN KEY(tenant_id,authorized_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_owner_natures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, name text NOT NULL,
 category_id uuid NOT NULL, nature text NOT NULL CHECK(nature IN('CAPITAL','ADVANCE','REMUNERATION','DISTRIBUTION','REIMBURSEMENT')),
 active boolean NOT NULL DEFAULT true, version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,name), FOREIGN KEY(tenant_id,category_id) REFERENCES financial_categories(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_owner_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, branch_id uuid NOT NULL, operation_id uuid NOT NULL,
 beneficiary_uid text NOT NULL, nature_id uuid NOT NULL, amount_cents bigint NOT NULL CHECK(amount_cents>0),
 direction text NOT NULL CHECK(direction IN('IN','OUT')), effective_date date NOT NULL, account_id uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000), source_cash_id uuid,
 journal_id uuid, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,operation_id), UNIQUE(tenant_id,source_cash_id),
 FOREIGN KEY(tenant_id,branch_id) REFERENCES branches(tenant_id,id), FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id),
 FOREIGN KEY(tenant_id,beneficiary_uid) REFERENCES users(tenant_id,id), FOREIGN KEY(tenant_id,nature_id) REFERENCES fin_owner_natures(tenant_id,id),
 FOREIGN KEY(tenant_id,account_id) REFERENCES financial_accounts(tenant_id,id), FOREIGN KEY(tenant_id,source_cash_id) REFERENCES cash_movements(tenant_id,id),
 FOREIGN KEY(tenant_id,journal_id) REFERENCES fin_journals(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_cash_counts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, cash_session_id uuid NOT NULL, operation_id uuid NOT NULL,
 expected_cents bigint NOT NULL, counted_cents bigint NOT NULL CHECK(counted_cents>=0),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1000), created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,operation_id), FOREIGN KEY(tenant_id,cash_session_id) REFERENCES cash_sessions(tenant_id,id),
 FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id), FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_config_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 config_key text NOT NULL CHECK(config_key IN('ATTACHMENTS','PROTECTION_LIMITS','CARD_TERMS')),
 revision bigint NOT NULL CHECK(revision>0), value jsonb NOT NULL, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,config_key,revision), FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS fin_attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, document_id uuid NOT NULL,
 operation_id uuid NOT NULL, config_id uuid NOT NULL, object_key text NOT NULL, mime text NOT NULL,
 expected_size bigint NOT NULL CHECK(expected_size>0), expected_sha256 text NOT NULL CHECK(expected_sha256 ~ '^[a-f0-9]{64}$'),
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,object_key),
 FOREIGN KEY(tenant_id,document_id) REFERENCES fin_documents(tenant_id,id), FOREIGN KEY(tenant_id,operation_id) REFERENCES fin_operations(tenant_id,id),
 FOREIGN KEY(tenant_id,config_id) REFERENCES fin_config_versions(tenant_id,id), FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['fin_recurrence_versions','fin_contacts','fin_agreements','fin_agreement_sources','fin_credit_authorizations','fin_owner_movements','fin_cash_counts','fin_config_versions','fin_attachments'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='fin_immutable_fact' AND tgrelid=tab::regclass) THEN
   EXECUTE format('CREATE TRIGGER fin_immutable_fact BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fin_immutable()',tab);
  END IF;
 END LOOP;
END $$;
COMMIT;

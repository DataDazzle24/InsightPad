-- Additive Encomendas/Comandas schema. Apply only after approved schema diff.
-- Existing rows are neither rewritten nor deleted. No grants or remote actions.
BEGIN;

CREATE TABLE IF NOT EXISTS ec_documents (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  kind text NOT NULL,
  code text NOT NULL,
  customer_id uuid,
  identification text NOT NULL,
  status text NOT NULL,
  fulfillment_mode text,
  due_at timestamptz,
  timezone_snapshot text NOT NULL,
  delivery_address jsonb,
  delivery_fee_cents bigint NOT NULL,
  notes text NOT NULL,
  reservation_strategy text NOT NULL,
  reservation_state text NOT NULL,
  subtotal_cents bigint NOT NULL,
  total_cents bigint NOT NULL,
  received_net_cents bigint NOT NULL,
  sale_id uuid,
  merged_into_id uuid,
  opened_by_uid text NOT NULL,
  opened_cash_session_id uuid,
  completed_at timestamptz,
  cancelled_at timestamptz,
  incorporated_at timestamptz,
  reason text,
  version bigint NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_items (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  original_document_id uuid NOT NULL,
  source_item_id uuid,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  sku text,
  unit text NOT NULL,
  quantity numeric(18,3) NOT NULL,
  unit_list_price_cents bigint NOT NULL,
  unit_price_cents bigint NOT NULL,
  line_total_cents bigint NOT NULL,
  specifications text NOT NULL,
  preparation_state text NOT NULL,
  participant_id uuid,
  status text NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_components (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  item_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity_per_parent numeric(18,3) NOT NULL,
  unit_cost_cents bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_participants (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  name text NOT NULL,
  display_order integer NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_receipts (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  original_document_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  document_total_cents bigint,
  balance_before_cents bigint,
  balance_after_cents bigint,
  returned_cents bigint NOT NULL,
  tendered_cents bigint NOT NULL,
  change_cents bigint NOT NULL,
  payment_method_id uuid NOT NULL,
  reference text NOT NULL,
  cash_session_id uuid,
  operator_uid text NOT NULL,
  operation_id uuid NOT NULL,
  received_at timestamptz NOT NULL
);
-- Nullable for older receipts: never reconstruct a historical balance from today's total.
ALTER TABLE ec_receipts ADD COLUMN IF NOT EXISTS document_total_cents bigint;
ALTER TABLE ec_receipts ADD COLUMN IF NOT EXISTS balance_before_cents bigint;
ALTER TABLE ec_receipts ADD COLUMN IF NOT EXISTS balance_after_cents bigint;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_receipt_balance_snapshot' AND conrelid='ec_receipts'::regclass) THEN
 ALTER TABLE ec_receipts ADD CONSTRAINT ec_receipt_balance_snapshot CHECK(
 (document_total_cents IS NULL AND balance_before_cents IS NULL AND balance_after_cents IS NULL)
 OR (document_total_cents IS NOT NULL AND balance_before_cents IS NOT NULL AND balance_after_cents IS NOT NULL
 AND document_total_cents>=balance_before_cents AND balance_before_cents>=amount_cents AND balance_after_cents=balance_before_cents-amount_cents));
END IF; END $$;
CREATE TABLE IF NOT EXISTS ec_allocations (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  item_id uuid,
  participant_id uuid,
  share_id uuid,
  amount_cents bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_split_plans (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  item_id uuid,
  mode text NOT NULL,
  base_version bigint NOT NULL,
  total_cents bigint NOT NULL,
  parts integer NOT NULL,
  status text NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_split_shares (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  participant_id uuid,
  share_index integer NOT NULL,
  amount_cents bigint NOT NULL,
  paid_cents bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_reservations (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  item_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric(18,3) NOT NULL,
  status text NOT NULL,
  operation_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  closed_at timestamptz
);
CREATE TABLE IF NOT EXISTS ec_dispositions (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  item_id uuid NOT NULL,
  quantity numeric(18,3) NOT NULL,
  preparation_state text NOT NULL,
  disposition text NOT NULL,
  reason text NOT NULL,
  actor_uid text NOT NULL,
  stock_movement_id uuid,
  operation_id uuid NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_events (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  related_document_id uuid,
  event_type text NOT NULL,
  actor_uid text NOT NULL,
  operation_id uuid NOT NULL,
  before_version bigint NOT NULL,
  after_version bigint NOT NULL,
  details jsonb NOT NULL,
  occurred_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_operations (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  actor_uid text NOT NULL,
  operation_type text NOT NULL,
  payload_hash text NOT NULL,
  document_id uuid,
  secondary_document_id uuid,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_refunds (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  payment_method_id uuid NOT NULL,
  reference text NOT NULL,
  reason text NOT NULL,
  cash_session_id uuid,
  operator_uid text NOT NULL,
  operation_id uuid NOT NULL,
  refunded_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_sale_receipt_links (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  original_document_id uuid NOT NULL,
  sale_id uuid NOT NULL,
  sale_payment_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  amount_cents bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_lineage (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  origin_document_id uuid NOT NULL,
  destination_document_id uuid NOT NULL,
  source_item_id uuid,
  destination_item_id uuid,
  quantity numeric(18,3),
  action text NOT NULL,
  operation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_sequences (
  id uuid NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  kind text NOT NULL,
  next_value bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS ec_allocation_parts (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, document_id uuid NOT NULL, allocation_id uuid NOT NULL,
 item_id uuid NOT NULL, amount_cents bigint NOT NULL CHECK(amount_cents>0), operation_id uuid NOT NULL, created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ec_allocation_parts_tenant_id_id_uidx ON ec_allocation_parts(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_documents_tenant_id_id_uidx ON ec_documents(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_items_tenant_id_id_uidx ON ec_items(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_components_tenant_id_id_uidx ON ec_components(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_participants_tenant_id_id_uidx ON ec_participants(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_receipts_tenant_id_id_uidx ON ec_receipts(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_allocations_tenant_id_id_uidx ON ec_allocations(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_split_plans_tenant_id_id_uidx ON ec_split_plans(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_split_shares_tenant_id_id_uidx ON ec_split_shares(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_reservations_tenant_id_id_uidx ON ec_reservations(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_dispositions_tenant_id_id_uidx ON ec_dispositions(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_events_tenant_id_id_uidx ON ec_events(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_operations_tenant_id_id_uidx ON ec_operations(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_refunds_tenant_id_id_uidx ON ec_refunds(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_sale_receipt_links_tenant_id_id_uidx ON ec_sale_receipt_links(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_lineage_tenant_id_id_uidx ON ec_lineage(tenant_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS ec_sequences_tenant_id_id_uidx ON ec_sequences(tenant_id,id);
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_doc_kind' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_doc_kind CHECK(kind IN('ENCOMENDA','COMANDA')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_doc_state' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_doc_state CHECK((kind='ENCOMENDA' AND status IN('PENDING','PREPARING','READY','COMPLETED','CANCELLED')) OR (kind='COMANDA' AND status IN('OPEN','CLOSED','CANCELLED','INCORPORATED'))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_doc_values' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_doc_values CHECK(delivery_fee_cents>=0 AND subtotal_cents>=0 AND total_cents=subtotal_cents+delivery_fee_cents AND received_net_cents>=0 AND version>0); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_doc_order' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_doc_order CHECK(kind<>'ENCOMENDA' OR (customer_id IS NOT NULL AND due_at IS NOT NULL AND fulfillment_mode IN('PICKUP','DELIVERY') AND (fulfillment_mode='DELIVERY' AND delivery_address IS NOT NULL OR fulfillment_mode='PICKUP' AND delivery_fee_cents=0 AND delivery_address IS NULL))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_doc_merge' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_doc_merge CHECK(merged_into_id IS NULL OR merged_into_id<>id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_doc_code' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_doc_code UNIQUE(tenant_id,kind,code); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_doc_sale' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_doc_sale UNIQUE(sale_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_items_values' AND conrelid='ec_items'::regclass) THEN ALTER TABLE ec_items ADD CONSTRAINT ec_items_values CHECK(quantity>0 AND unit_price_cents>=0 AND unit_list_price_cents>=0 AND line_total_cents>=0 AND preparation_state IN('NOTED','PREPARING','PREPARED','SERVED') AND status IN('ACTIVE','REMOVED','TRANSFERRED')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_component_values' AND conrelid='ec_components'::regclass) THEN ALTER TABLE ec_components ADD CONSTRAINT ec_component_values CHECK(quantity_per_parent>0 AND unit_cost_cents>=0); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_receipts_values' AND conrelid='ec_receipts'::regclass) THEN ALTER TABLE ec_receipts ADD CONSTRAINT ec_receipts_values CHECK(amount_cents>0 AND returned_cents BETWEEN 0 AND amount_cents AND tendered_cents>=amount_cents AND change_cents=tendered_cents-amount_cents); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_allocations_values' AND conrelid='ec_allocations'::regclass) THEN ALTER TABLE ec_allocations ADD CONSTRAINT ec_allocations_values CHECK(amount_cents>0 AND (item_id IS NOT NULL OR share_id IS NOT NULL)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_split_values' AND conrelid='ec_split_plans'::regclass) THEN ALTER TABLE ec_split_plans ADD CONSTRAINT ec_split_values CHECK(total_cents>0 AND parts BETWEEN 1 AND 12 AND mode IN('EQUAL','ITEM','PERSON','SHARED_ITEM') AND status IN('ACTIVE','PAID','SUPERSEDED')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_share_values' AND conrelid='ec_split_shares'::regclass) THEN ALTER TABLE ec_split_shares ADD CONSTRAINT ec_share_values CHECK(amount_cents>=0 AND paid_cents BETWEEN 0 AND amount_cents AND share_index>=0); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_reservation_values' AND conrelid='ec_reservations'::regclass) THEN ALTER TABLE ec_reservations ADD CONSTRAINT ec_reservation_values CHECK(quantity>0 AND status IN('ACTIVE','CONSUMED','RELEASED')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_disposition_values' AND conrelid='ec_dispositions'::regclass) THEN ALTER TABLE ec_dispositions ADD CONSTRAINT ec_disposition_values CHECK(quantity>0 AND disposition IN('RELEASE_RESERVATION','LOSS','RETURN_TO_AVAILABLE')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_refund_values' AND conrelid='ec_refunds'::regclass) THEN ALTER TABLE ec_refunds ADD CONSTRAINT ec_refund_values CHECK(amount_cents>0 AND length(btrim(reference)) BETWEEN 1 AND 180 AND length(btrim(reason)) BETWEEN 1 AND 500); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_link_receipt' AND conrelid='ec_sale_receipt_links'::regclass) THEN ALTER TABLE ec_sale_receipt_links ADD CONSTRAINT ec_link_receipt UNIQUE(receipt_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_link_payment' AND conrelid='ec_sale_receipt_links'::regclass) THEN ALTER TABLE ec_sale_receipt_links ADD CONSTRAINT ec_link_payment UNIQUE(sale_payment_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_seq_kind' AND conrelid='ec_sequences'::regclass) THEN ALTER TABLE ec_sequences ADD CONSTRAINT ec_seq_kind UNIQUE(tenant_id,kind); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_seq_value' AND conrelid='ec_sequences'::regclass) THEN ALTER TABLE ec_sequences ADD CONSTRAINT ec_seq_value CHECK(next_value>0); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_documents_tenant_fk' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_documents_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_items_tenant_fk' AND conrelid='ec_items'::regclass) THEN ALTER TABLE ec_items ADD CONSTRAINT ec_items_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_items_document_fk' AND conrelid='ec_items'::regclass) THEN ALTER TABLE ec_items ADD CONSTRAINT ec_items_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_components_tenant_fk' AND conrelid='ec_components'::regclass) THEN ALTER TABLE ec_components ADD CONSTRAINT ec_components_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_components_document_fk' AND conrelid='ec_components'::regclass) THEN ALTER TABLE ec_components ADD CONSTRAINT ec_components_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_participants_tenant_fk' AND conrelid='ec_participants'::regclass) THEN ALTER TABLE ec_participants ADD CONSTRAINT ec_participants_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_participants_document_fk' AND conrelid='ec_participants'::regclass) THEN ALTER TABLE ec_participants ADD CONSTRAINT ec_participants_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_receipts_tenant_fk' AND conrelid='ec_receipts'::regclass) THEN ALTER TABLE ec_receipts ADD CONSTRAINT ec_receipts_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_receipts_document_fk' AND conrelid='ec_receipts'::regclass) THEN ALTER TABLE ec_receipts ADD CONSTRAINT ec_receipts_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_allocations_tenant_fk' AND conrelid='ec_allocations'::regclass) THEN ALTER TABLE ec_allocations ADD CONSTRAINT ec_allocations_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_allocations_document_fk' AND conrelid='ec_allocations'::regclass) THEN ALTER TABLE ec_allocations ADD CONSTRAINT ec_allocations_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_split_plans_tenant_fk' AND conrelid='ec_split_plans'::regclass) THEN ALTER TABLE ec_split_plans ADD CONSTRAINT ec_split_plans_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_split_plans_document_fk' AND conrelid='ec_split_plans'::regclass) THEN ALTER TABLE ec_split_plans ADD CONSTRAINT ec_split_plans_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_split_shares_tenant_fk' AND conrelid='ec_split_shares'::regclass) THEN ALTER TABLE ec_split_shares ADD CONSTRAINT ec_split_shares_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_split_shares_document_fk' AND conrelid='ec_split_shares'::regclass) THEN ALTER TABLE ec_split_shares ADD CONSTRAINT ec_split_shares_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_reservations_tenant_fk' AND conrelid='ec_reservations'::regclass) THEN ALTER TABLE ec_reservations ADD CONSTRAINT ec_reservations_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_reservations_document_fk' AND conrelid='ec_reservations'::regclass) THEN ALTER TABLE ec_reservations ADD CONSTRAINT ec_reservations_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_dispositions_tenant_fk' AND conrelid='ec_dispositions'::regclass) THEN ALTER TABLE ec_dispositions ADD CONSTRAINT ec_dispositions_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_dispositions_document_fk' AND conrelid='ec_dispositions'::regclass) THEN ALTER TABLE ec_dispositions ADD CONSTRAINT ec_dispositions_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_events_tenant_fk' AND conrelid='ec_events'::regclass) THEN ALTER TABLE ec_events ADD CONSTRAINT ec_events_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_events_document_fk' AND conrelid='ec_events'::regclass) THEN ALTER TABLE ec_events ADD CONSTRAINT ec_events_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_operations_tenant_fk' AND conrelid='ec_operations'::regclass) THEN ALTER TABLE ec_operations ADD CONSTRAINT ec_operations_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_refunds_tenant_fk' AND conrelid='ec_refunds'::regclass) THEN ALTER TABLE ec_refunds ADD CONSTRAINT ec_refunds_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_refunds_document_fk' AND conrelid='ec_refunds'::regclass) THEN ALTER TABLE ec_refunds ADD CONSTRAINT ec_refunds_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_sale_receipt_links_tenant_fk' AND conrelid='ec_sale_receipt_links'::regclass) THEN ALTER TABLE ec_sale_receipt_links ADD CONSTRAINT ec_sale_receipt_links_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_sale_receipt_links_document_fk' AND conrelid='ec_sale_receipt_links'::regclass) THEN ALTER TABLE ec_sale_receipt_links ADD CONSTRAINT ec_sale_receipt_links_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_lineage_tenant_fk' AND conrelid='ec_lineage'::regclass) THEN ALTER TABLE ec_lineage ADD CONSTRAINT ec_lineage_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_sequences_tenant_fk' AND conrelid='ec_sequences'::regclass) THEN ALTER TABLE ec_sequences ADD CONSTRAINT ec_sequences_tenant_fk FOREIGN KEY(tenant_id) REFERENCES tenants(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_documents_branch_id_fk' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_documents_branch_id_fk FOREIGN KEY(branch_id) REFERENCES branches(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_documents_customer_id_fk' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_documents_customer_id_fk FOREIGN KEY(customer_id) REFERENCES customers(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_documents_sale_id_fk' AND conrelid='ec_documents'::regclass) THEN ALTER TABLE ec_documents ADD CONSTRAINT ec_documents_sale_id_fk FOREIGN KEY(sale_id) REFERENCES sales(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_items_product_id_fk' AND conrelid='ec_items'::regclass) THEN ALTER TABLE ec_items ADD CONSTRAINT ec_items_product_id_fk FOREIGN KEY(product_id) REFERENCES products(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_components_product_id_fk' AND conrelid='ec_components'::regclass) THEN ALTER TABLE ec_components ADD CONSTRAINT ec_components_product_id_fk FOREIGN KEY(product_id) REFERENCES products(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_receipts_payment_method_id_fk' AND conrelid='ec_receipts'::regclass) THEN ALTER TABLE ec_receipts ADD CONSTRAINT ec_receipts_payment_method_id_fk FOREIGN KEY(payment_method_id) REFERENCES payment_methods(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_receipts_cash_session_id_fk' AND conrelid='ec_receipts'::regclass) THEN ALTER TABLE ec_receipts ADD CONSTRAINT ec_receipts_cash_session_id_fk FOREIGN KEY(cash_session_id) REFERENCES cash_sessions(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_refunds_payment_method_id_fk' AND conrelid='ec_refunds'::regclass) THEN ALTER TABLE ec_refunds ADD CONSTRAINT ec_refunds_payment_method_id_fk FOREIGN KEY(payment_method_id) REFERENCES payment_methods(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_refunds_cash_session_id_fk' AND conrelid='ec_refunds'::regclass) THEN ALTER TABLE ec_refunds ADD CONSTRAINT ec_refunds_cash_session_id_fk FOREIGN KEY(cash_session_id) REFERENCES cash_sessions(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_reservations_branch_id_fk' AND conrelid='ec_reservations'::regclass) THEN ALTER TABLE ec_reservations ADD CONSTRAINT ec_reservations_branch_id_fk FOREIGN KEY(branch_id) REFERENCES branches(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_reservations_product_id_fk' AND conrelid='ec_reservations'::regclass) THEN ALTER TABLE ec_reservations ADD CONSTRAINT ec_reservations_product_id_fk FOREIGN KEY(product_id) REFERENCES products(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_items_participant_id_fk' AND conrelid='ec_items'::regclass) THEN ALTER TABLE ec_items ADD CONSTRAINT ec_items_participant_id_fk FOREIGN KEY(tenant_id,participant_id) REFERENCES ec_participants(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_components_item_id_fk' AND conrelid='ec_components'::regclass) THEN ALTER TABLE ec_components ADD CONSTRAINT ec_components_item_id_fk FOREIGN KEY(tenant_id,item_id) REFERENCES ec_items(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_reservations_item_id_fk' AND conrelid='ec_reservations'::regclass) THEN ALTER TABLE ec_reservations ADD CONSTRAINT ec_reservations_item_id_fk FOREIGN KEY(tenant_id,item_id) REFERENCES ec_items(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_dispositions_item_id_fk' AND conrelid='ec_dispositions'::regclass) THEN ALTER TABLE ec_dispositions ADD CONSTRAINT ec_dispositions_item_id_fk FOREIGN KEY(tenant_id,item_id) REFERENCES ec_items(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_allocations_receipt_id_fk' AND conrelid='ec_allocations'::regclass) THEN ALTER TABLE ec_allocations ADD CONSTRAINT ec_allocations_receipt_id_fk FOREIGN KEY(tenant_id,receipt_id) REFERENCES ec_receipts(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_allocations_item_id_fk' AND conrelid='ec_allocations'::regclass) THEN ALTER TABLE ec_allocations ADD CONSTRAINT ec_allocations_item_id_fk FOREIGN KEY(tenant_id,item_id) REFERENCES ec_items(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_allocations_participant_id_fk' AND conrelid='ec_allocations'::regclass) THEN ALTER TABLE ec_allocations ADD CONSTRAINT ec_allocations_participant_id_fk FOREIGN KEY(tenant_id,participant_id) REFERENCES ec_participants(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_allocations_share_id_fk' AND conrelid='ec_allocations'::regclass) THEN ALTER TABLE ec_allocations ADD CONSTRAINT ec_allocations_share_id_fk FOREIGN KEY(tenant_id,share_id) REFERENCES ec_split_shares(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_split_plans_item_id_fk' AND conrelid='ec_split_plans'::regclass) THEN ALTER TABLE ec_split_plans ADD CONSTRAINT ec_split_plans_item_id_fk FOREIGN KEY(tenant_id,item_id) REFERENCES ec_items(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_split_shares_plan_id_fk' AND conrelid='ec_split_shares'::regclass) THEN ALTER TABLE ec_split_shares ADD CONSTRAINT ec_split_shares_plan_id_fk FOREIGN KEY(tenant_id,plan_id) REFERENCES ec_split_plans(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_refunds_receipt_id_fk' AND conrelid='ec_refunds'::regclass) THEN ALTER TABLE ec_refunds ADD CONSTRAINT ec_refunds_receipt_id_fk FOREIGN KEY(tenant_id,receipt_id) REFERENCES ec_receipts(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_sale_receipt_links_receipt_id_fk' AND conrelid='ec_sale_receipt_links'::regclass) THEN ALTER TABLE ec_sale_receipt_links ADD CONSTRAINT ec_sale_receipt_links_receipt_id_fk FOREIGN KEY(tenant_id,receipt_id) REFERENCES ec_receipts(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_lineage_origin_document_id_fk' AND conrelid='ec_lineage'::regclass) THEN ALTER TABLE ec_lineage ADD CONSTRAINT ec_lineage_origin_document_id_fk FOREIGN KEY(tenant_id,origin_document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_lineage_destination_document_id_fk' AND conrelid='ec_lineage'::regclass) THEN ALTER TABLE ec_lineage ADD CONSTRAINT ec_lineage_destination_document_id_fk FOREIGN KEY(tenant_id,destination_document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
CREATE INDEX IF NOT EXISTS ec_documents_orders_idx ON ec_documents(tenant_id,branch_id,kind,status,due_at,id);
CREATE INDEX IF NOT EXISTS ec_documents_history_idx ON ec_documents(tenant_id,branch_id,kind,status,created_at,id);
CREATE INDEX IF NOT EXISTS ec_items_document_idx ON ec_items(tenant_id,document_id,status,id);
CREATE INDEX IF NOT EXISTS ec_reservations_stock_idx ON ec_reservations(tenant_id,branch_id,product_id,status);
CREATE INDEX IF NOT EXISTS ec_receipts_document_idx ON ec_receipts(tenant_id,document_id,received_at,id);
CREATE INDEX IF NOT EXISTS ec_events_document_idx ON ec_events(tenant_id,document_id,occurred_at,id);
CREATE INDEX IF NOT EXISTS ec_operations_actor_idx ON ec_operations(tenant_id,actor_uid,created_at,id);
INSERT INTO app_pages(id,page_key,display_name,module,route,icon,display_order,requires_login,active,created_at,updated_at)
SELECT gen_random_uuid(),v.key,v.name,'Vendas',v.route,v.icon,v.n,true,true,now(),now()
FROM (VALUES('COMANDAS','Comandas','/vendas/comandas','receipt_long',12),('ENCOMENDAS','Encomendas','/vendas/encomendas','shopping_bag',13))v(key,name,route,icon,n)
WHERE NOT EXISTS(SELECT 1 FROM app_pages p WHERE p.page_key=v.key);
-- No permission rows are granted by this migration.
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_part_document_fk') THEN ALTER TABLE ec_allocation_parts ADD CONSTRAINT ec_part_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES ec_documents(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_part_allocation_fk') THEN ALTER TABLE ec_allocation_parts ADD CONSTRAINT ec_part_allocation_fk FOREIGN KEY(tenant_id,allocation_id) REFERENCES ec_allocations(tenant_id,id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ec_part_item_fk') THEN ALTER TABLE ec_allocation_parts ADD CONSTRAINT ec_part_item_fk FOREIGN KEY(tenant_id,item_id) REFERENCES ec_items(tenant_id,id); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS ec_active_reservation_uidx ON ec_reservations(tenant_id,item_id,product_id) WHERE status='ACTIVE';
COMMIT;

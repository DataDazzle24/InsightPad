-- Legacy inventory is read-only. Adoption targets a reviewed manual open title,
-- preserves the original CP/CR ID and never reconstructs cash or settlement.
BEGIN;
CREATE OR REPLACE VIEW fin_legacy_title_inventory AS
SELECT p.id,p.tenant_id,p.branch_id,'PAY'::text direction,'LEGACY'::text source_type,
 p.description,p.amount_cents original_cents,p.due_date,p.status legacy_status,p.active,
 p.paid_at IS NOT NULL OR p.paid_amount_cents IS NOT NULL has_settlement_evidence,
 p.created_at,p.supplier_id,NULL::uuid customer_id
FROM accounts_payable p WHERE NOT EXISTS(
 SELECT 1 FROM fin_titles t WHERE t.tenant_id=p.tenant_id AND t.payable_id=p.id
)
UNION ALL
SELECT r.id,r.tenant_id,r.branch_id,'RECEIVE',r.source,r.description,r.amount_cents,r.due_date,r.status,r.active,
 r.received_at IS NOT NULL OR r.received_amount_cents IS NOT NULL,
 r.created_at,NULL::uuid,r.customer_id
FROM accounts_receivable r WHERE NOT EXISTS(
 SELECT 1 FROM fin_titles t WHERE t.tenant_id=r.tenant_id AND t.receivable_id=r.id
);

CREATE OR REPLACE FUNCTION fin_adopt_legacy(actor users, operation uuid, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE legacy fin_legacy_title_inventory;
 doc uuid:=gen_random_uuid();
 title uuid:=gen_random_uuid();
 competence date:=(payload->>'competenceDate')::date;
 issue date:=(payload->>'issueDate')::date;
BEGIN
 SELECT l.* INTO legacy FROM fin_legacy_title_inventory l WHERE l.tenant_id=actor.tenant_id
 AND l.direction=payload->>'direction' AND l.id=(payload->>'legacyId')::uuid;
 PERFORM ec_require(legacy.id IS NOT NULL,'TITLE_DENIED');
 PERFORM fin_branch(actor,legacy.branch_id);
 PERFORM ec_require(legacy.active AND legacy.legacy_status='OPEN' AND NOT legacy.has_settlement_evidence AND legacy.original_cents>0
  AND legacy.source_type IN('LEGACY','MANUAL'),'LEGACY_HISTORY_UNVERIFIED');
 PERFORM ec_require(legacy.original_cents=fin_amount(payload->'originalCents') AND legacy.due_date=(payload->>'dueDate')::date
  AND issue IS NOT NULL AND length(btrim(payload->>'reason')) BETWEEN 3 AND 1000,'LEGACY_REVIEW_REQUIRED');
 PERFORM fin_period(actor.tenant_id,legacy.branch_id,competence);
 INSERT INTO fin_documents(id,tenant_id,branch_id,direction,description,source_key,source_type,issue_date,competence_date,nominal_cents,
  customer_id,supplier_id,created_by,notes)
 VALUES(doc,actor.tenant_id,legacy.branch_id,legacy.direction,legacy.description,'legacy:'||legacy.direction||':'||legacy.id,
 'VERIFIED_LEGACY',issue,competence,legacy.original_cents,legacy.customer_id,legacy.supplier_id,actor.id,btrim(payload->>'reason'));
 INSERT INTO fin_titles(id,tenant_id,document_id,direction,payable_id,receivable_id,installment)
 VALUES(title,actor.tenant_id,doc,legacy.direction,CASE WHEN legacy.direction='PAY' THEN legacy.id END,
  CASE WHEN legacy.direction='RECEIVE' THEN legacy.id END,1);
 INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,quality)
 VALUES(actor.tenant_id,legacy.branch_id,'legacy-document:'||doc,'DOCUMENT',competence,
  CASE legacy.direction WHEN 'PAY' THEN -legacy.original_cents ELSE legacy.original_cents END,doc,'MISSING_CLASSIFICATION');
 RETURN jsonb_build_object('documentId',doc,'titleId',title,'legacyId',legacy.id);
END $$;
COMMIT;

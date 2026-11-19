BEGIN;
-- A paid share's financial allocation remains immutable. Child mappings reconcile
-- that existing money with items; they are never counted as a new receipt.
CREATE OR REPLACE VIEW ec_effective_allocations AS
 SELECT a.id,a.tenant_id,a.document_id,a.receipt_id,a.item_id,a.participant_id,a.share_id,a.amount_cents FROM ec_allocations a
 UNION ALL
 SELECT p.id,p.tenant_id,p.document_id,a.receipt_id,p.item_id,a.participant_id,a.share_id,p.amount_cents
 FROM ec_allocation_parts p JOIN ec_allocations a ON a.id=p.allocation_id AND a.tenant_id=p.tenant_id;

CREATE OR REPLACE FUNCTION ec_reconcile(document uuid,receipt uuid,entries jsonb,operation uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE d ec_documents; r ec_receipts; entry jsonb; parent ec_allocations; amount bigint; left_amount bigint; portion bigint; available bigint; item ec_items;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document;
 SELECT * INTO r FROM ec_receipts WHERE id=receipt AND document_id=d.id AND tenant_id=d.tenant_id;
 PERFORM ec_require(r.id IS NOT NULL AND jsonb_typeof(entries)='array' AND jsonb_array_length(entries) BETWEEN 1 AND 200,'VALIDATION_ERROR');
 FOR entry IN SELECT value FROM jsonb_array_elements(entries) LOOP
  amount:=(entry->>'amountCents')::bigint;
  SELECT * INTO item FROM ec_items WHERE id=(entry->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE';
  PERFORM ec_require(item.id IS NOT NULL AND amount>0,'VALIDATION_ERROR');
  PERFORM ec_require(amount+COALESCE((SELECT sum(a.amount_cents) FROM ec_effective_allocations a WHERE a.item_id=item.id),0)<=item.line_total_cents,'AMOUNT_EXCEEDS_BALANCE');
  left_amount:=amount;
  FOR parent IN SELECT * FROM ec_allocations a WHERE a.receipt_id=r.id AND a.item_id IS NULL AND a.share_id IS NOT NULL ORDER BY a.id FOR UPDATE LOOP
   SELECT parent.amount_cents-COALESCE(sum(p.amount_cents),0)::bigint INTO available FROM ec_allocation_parts p WHERE p.allocation_id=parent.id;
   portion:=LEAST(available,left_amount);
   IF portion>0 THEN INSERT INTO ec_allocation_parts(id,tenant_id,document_id,allocation_id,item_id,amount_cents,operation_id,created_at) VALUES(gen_random_uuid(),d.tenant_id,d.id,parent.id,item.id,portion,operation,now());left_amount:=left_amount-portion;END IF;
   EXIT WHEN left_amount=0;
  END LOOP;
  IF left_amount>0 THEN PERFORM ec_allocate(d.id,r.id,jsonb_build_array(jsonb_build_object('itemId',item.id,'amountCents',left_amount::text)));END IF;
 END LOOP;
END $$;
COMMIT;

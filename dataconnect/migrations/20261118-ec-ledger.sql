-- Transactional document helpers; called only by the authenticated command.
BEGIN;
CREATE OR REPLACE FUNCTION ec_add_item(actor users, document uuid, item jsonb) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE d ec_documents; p products; price bigint; qty numeric; iid uuid:=gen_random_uuid(); component record;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document AND tenant_id=actor.tenant_id;
 SELECT * INTO p FROM products WHERE id=(item->>'productId')::uuid AND tenant_id=actor.tenant_id AND active AND deleted_at IS NULL FOR SHARE;
 PERFORM ec_require(p.id IS NOT NULL,'VALIDATION_ERROR');
 qty:=(item->>'quantity')::numeric;
 PERFORM ec_require(qty>0 AND qty<=999 AND qty=round(qty,3) AND (p.weighted_product OR qty=trunc(qty)),'VALIDATION_ERROR');
 SELECT COALESCE(min(promotional_price_cents),p.sale_price_cents) INTO price FROM promotions WHERE tenant_id=p.tenant_id AND product_id=p.id AND active AND deleted_at IS NULL AND now()>=starts_at AND now()<ends_at;
 IF item ? 'unitPriceCents' AND (item->>'unitPriceCents')::bigint<>price THEN
  PERFORM ec_require(ec_can(actor,'CAIXA','manage'),'APPROVAL_REQUIRED'); price:=(item->>'unitPriceCents')::bigint;
 END IF;
 PERFORM ec_require(price>=0 AND length(COALESCE(item->>'specifications',''))<=2000,'VALIDATION_ERROR');
 IF NULLIF(item->>'participantId','') IS NOT NULL THEN
  PERFORM ec_require(EXISTS(SELECT 1 FROM ec_participants WHERE id=(item->>'participantId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id),'VALIDATION_ERROR');
 END IF;
 PERFORM ec_require(COALESCE(item->>'preparationState','NOTED') IN('NOTED','PREPARING','PREPARED','SERVED'),'VALIDATION_ERROR');
 INSERT INTO ec_items(id,tenant_id,document_id,original_document_id,product_id,product_name,sku,unit,quantity,unit_list_price_cents,unit_price_cents,line_total_cents,specifications,preparation_state,participant_id,status,created_at)
 VALUES(iid,d.tenant_id,d.id,d.id,p.id,p.name,p.internal_code,CASE WHEN p.weighted_product THEN 'kg' ELSE 'UN' END,qty,p.sale_price_cents,price,round(qty*price)::bigint,COALESCE(item->>'specifications',''),COALESCE(item->>'preparationState','NOTED'),NULLIF(item->>'participantId','')::uuid,'ACTIVE',now());
 IF p.bundle_product THEN
  PERFORM ec_require(EXISTS(SELECT 1 FROM product_components WHERE parent_product_id=p.id AND tenant_id=p.tenant_id),'VALIDATION_ERROR');
  FOR component IN SELECT pc.*,c.cost_price_cents,c.bundle_product,c.active,c.deleted_at,c.weighted_product FROM product_components pc JOIN products c ON c.id=pc.component_product_id AND c.tenant_id=pc.tenant_id WHERE pc.parent_product_id=p.id AND pc.tenant_id=p.tenant_id ORDER BY pc.component_product_id FOR SHARE OF pc,c LOOP
   PERFORM ec_require(component.active AND component.deleted_at IS NULL AND NOT component.bundle_product AND component.quantity>0 AND component.quantity*qty=round(component.quantity*qty,3) AND (component.weighted_product OR component.quantity*qty=trunc(component.quantity*qty)),'VALIDATION_ERROR');
   INSERT INTO ec_components(id,tenant_id,document_id,item_id,product_id,quantity_per_parent,unit_cost_cents) VALUES(gen_random_uuid(),d.tenant_id,d.id,iid,component.component_product_id,component.quantity,component.cost_price_cents);
  END LOOP;
 ELSE
  INSERT INTO ec_components(id,tenant_id,document_id,item_id,product_id,quantity_per_parent,unit_cost_cents) VALUES(gen_random_uuid(),d.tenant_id,d.id,iid,p.id,1,p.cost_price_cents);
 END IF;
 RETURN iid;
END $$;

CREATE OR REPLACE FUNCTION ec_cash(actor users, branch uuid, requested uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE session cash_sessions; required boolean;
BEGIN
 PERFORM ec_require(ec_can(actor,'CAIXA','access'),'ACCESS_DENIED');
 SELECT COALESCE(require_open_session,true) INTO required FROM pos_policies WHERE tenant_id=actor.tenant_id;
 required:=COALESCE(required,true);
 IF requested IS NOT NULL THEN
  SELECT * INTO session FROM cash_sessions WHERE id=requested AND tenant_id=actor.tenant_id AND branch_id=branch AND opened_by_uid=actor.id AND status='OPEN' FOR UPDATE;
  PERFORM ec_require(session.id IS NOT NULL,'CASH_SESSION_CLOSED');
 ELSE
  SELECT * INTO session FROM cash_sessions WHERE tenant_id=actor.tenant_id AND branch_id=branch AND opened_by_uid=actor.id AND status='OPEN' ORDER BY id LIMIT 1 FOR UPDATE;
 END IF;
 PERFORM ec_require(NOT required OR session.id IS NOT NULL,'CASH_SESSION_REQUIRED'); RETURN session.id;
END $$;

CREATE OR REPLACE FUNCTION ec_allocate(document uuid, receipt uuid, entries jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE d ec_documents; r ec_receipts; entry jsonb; amount bigint; item ec_items; share ec_split_shares; allocated bigint;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document;
 SELECT * INTO r FROM ec_receipts WHERE id=receipt AND document_id=d.id AND tenant_id=d.tenant_id FOR UPDATE;
 PERFORM ec_require(r.id IS NOT NULL AND jsonb_typeof(entries)='array' AND jsonb_array_length(entries) BETWEEN 1 AND 200,'VALIDATION_ERROR');
 FOR entry IN SELECT value FROM jsonb_array_elements(entries) LOOP
  amount:=(entry->>'amountCents')::bigint; PERFORM ec_require(amount>0,'VALIDATION_ERROR');
  SELECT COALESCE(sum(amount_cents),0)::bigint INTO allocated FROM ec_allocations WHERE receipt_id=r.id;
  PERFORM ec_require(allocated+amount<=r.amount_cents-r.returned_cents,'AMOUNT_EXCEEDS_BALANCE');
  item:=NULL;share:=NULL;
  IF NULLIF(entry->>'itemId','') IS NOT NULL THEN
   SELECT * INTO item FROM ec_items WHERE id=(entry->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE';
   PERFORM ec_require(item.id IS NOT NULL,'VALIDATION_ERROR');
   SELECT COALESCE(sum(amount_cents),0)::bigint INTO allocated FROM ec_effective_allocations WHERE item_id=item.id;
   PERFORM ec_require(allocated+amount<=item.line_total_cents,'AMOUNT_EXCEEDS_BALANCE');
   PERFORM ec_require(NULLIF(entry->>'participantId','') IS NULL OR item.participant_id=(entry->>'participantId')::uuid,'VALIDATION_ERROR');
  END IF;
  IF NULLIF(entry->>'shareId','') IS NOT NULL THEN
   SELECT s.* INTO share FROM ec_split_shares s JOIN ec_split_plans p ON p.id=s.plan_id AND p.tenant_id=s.tenant_id
   WHERE s.id=(entry->>'shareId')::uuid AND s.document_id=d.id AND s.tenant_id=d.tenant_id AND p.status='ACTIVE' FOR UPDATE OF s;
   PERFORM ec_require(share.id IS NOT NULL AND share.paid_cents+amount<=share.amount_cents,'AMOUNT_EXCEEDS_BALANCE');
   PERFORM ec_require((SELECT item_id IS NULL OR item_id=item.id FROM ec_split_plans WHERE id=share.plan_id),'VALIDATION_ERROR');
   PERFORM ec_require(share.participant_id IS NULL OR item.id IS NOT NULL AND share.participant_id=item.participant_id,'VALIDATION_ERROR');
   UPDATE ec_split_shares SET paid_cents=paid_cents+amount WHERE id=share.id;
  END IF;
  PERFORM ec_require(item.id IS NOT NULL OR share.id IS NOT NULL,'VALIDATION_ERROR');
  INSERT INTO ec_allocations(id,tenant_id,document_id,receipt_id,item_id,participant_id,share_id,amount_cents) VALUES(gen_random_uuid(),d.tenant_id,d.id,r.id,item.id,NULLIF(entry->>'participantId','')::uuid,share.id,amount);
 END LOOP;
 UPDATE ec_split_plans p SET status='PAID' WHERE p.document_id=d.id AND p.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM ec_split_shares s WHERE s.plan_id=p.id AND s.paid_cents<s.amount_cents);
END $$;

CREATE OR REPLACE FUNCTION ec_receive(actor users, document uuid, payment jsonb, operation uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE d ec_documents; method payment_methods; amount bigint; tendered bigint; cash uuid; receipt uuid:=gen_random_uuid();
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document AND tenant_id=actor.tenant_id;
 PERFORM ec_require((SELECT count(*) FROM ec_receipts WHERE document_id=d.id)<1000,'DOCUMENT_LIMIT_REACHED');
 amount:=(payment->>'amountCents')::bigint;
 SELECT * INTO method FROM payment_methods WHERE id=(payment->>'paymentMethodId')::uuid AND tenant_id=d.tenant_id AND active AND code<>'IFOOD_CHANNEL' FOR SHARE;
 PERFORM ec_require(method.id IS NOT NULL AND amount>0 AND length(COALESCE(payment->>'reference',''))<=180,'VALIDATION_ERROR');
 PERFORM ec_require(amount<=d.total_cents-d.received_net_cents,'AMOUNT_EXCEEDS_BALANCE');
 tendered:=COALESCE((payment->>'tenderedCents')::bigint,amount);
 PERFORM ec_require(tendered>=amount AND (method.requires_change OR tendered=amount),'VALIDATION_ERROR');
 cash:=ec_cash(actor,d.branch_id,NULLIF(payment->>'cashSessionId','')::uuid);
 PERFORM ec_require(NOT method.requires_change OR cash IS NOT NULL,'CASH_SESSION_REQUIRED');
 INSERT INTO ec_receipts(id,tenant_id,document_id,original_document_id,amount_cents,returned_cents,tendered_cents,change_cents,payment_method_id,reference,cash_session_id,operator_uid,operation_id,received_at) VALUES(receipt,d.tenant_id,d.id,d.id,amount,0,tendered,tendered-amount,method.id,COALESCE(payment->>'reference',''),cash,actor.id,operation,now());
 IF method.requires_change AND cash IS NOT NULL THEN
  INSERT INTO cash_movements(id,operation_key,payload_hash,tenant_id,session_id,movement_type,amount_cents,description,created_by_uid,created_at)
  VALUES(gen_random_uuid(),concat(d.tenant_id,':EC:RECEIPT:',receipt),encode(sha256(convert_to(payment::text,'UTF8')),'hex'),d.tenant_id,cash,'EC_RECEIPT',amount,left('Recebimento '||d.code,180),actor.id,now());
 END IF;
 IF payment ? 'allocations' THEN PERFORM ec_allocate(d.id,receipt,payment->'allocations'); END IF;
 PERFORM ec_retotal(d.id); RETURN receipt;
END $$;

CREATE OR REPLACE FUNCTION ec_post_stock(document uuid, item uuid, quantity numeric, loss boolean, actor text, operation uuid, sale uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE d ec_documents; component record; movement uuid; first_movement uuid; type_id uuid;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document;
 type_id:=md5(d.tenant_id::text||CASE WHEN loss THEN ':EC_LOSS' ELSE ':EC_SALE' END)::uuid;
 INSERT INTO stock_movement_types(id,tenant_id,code,name,direction,active,created_at,updated_at)
 VALUES(type_id,d.tenant_id,CASE WHEN loss THEN 'EC_LOSS' ELSE 'EC_SALE' END,CASE WHEN loss THEN 'Perda de comanda' ELSE 'Venda de encomenda/comanda' END,'OUT',true,now(),now()) ON CONFLICT(id) DO NOTHING;
 FOR component IN SELECT * FROM ec_components WHERE item_id=item AND tenant_id=d.tenant_id ORDER BY product_id LOOP
  PERFORM ec_lock_stock(d.tenant_id,d.branch_id,component.product_id);
  PERFORM ec_require(EXISTS(SELECT 1 FROM stock_balances b WHERE b.tenant_id=d.tenant_id AND b.branch_id=d.branch_id AND b.product_id=component.product_id AND b.quantity>=ec_post_stock.quantity*component.quantity_per_parent),'INSUFFICIENT_STOCK');
  movement:=gen_random_uuid(); IF first_movement IS NULL THEN first_movement:=movement; END IF;
  INSERT INTO stock_movements(id,tenant_id,branch_id,product_id,movement_type_id,sale_id,client_operation_id,quantity,unit_gross_cents,unit_cost_cents,occurred_at,status,created_by_uid,created_at)
  VALUES(movement,d.tenant_id,d.branch_id,component.product_id,type_id,sale,operation::text,quantity*component.quantity_per_parent,component.unit_cost_cents,component.unit_cost_cents,now(),'POSTED',actor,now());
  UPDATE stock_balances SET quantity=stock_balances.quantity-ec_post_stock.quantity*component.quantity_per_parent,version=version+1,updated_at=now() WHERE tenant_id=d.tenant_id AND branch_id=d.branch_id AND product_id=component.product_id;
 END LOOP;
 RETURN first_movement;
END $$;

CREATE OR REPLACE FUNCTION ec_finish(actor users, document uuid, operation uuid, cash_request uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE d ec_documents; cash uuid; sale uuid:=gen_random_uuid(); item ec_items; receipt ec_receipts; payment uuid; item_cost bigint;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document AND tenant_id=actor.tenant_id;
 PERFORM ec_require(d.total_cents>0 AND d.total_cents=d.received_net_cents,'PAYMENT_REQUIRED');
 PERFORM ec_require(d.reservation_state='RESERVED' AND (d.kind='COMANDA' OR d.status='READY'),'RESERVATION_REQUIRED');
 PERFORM ec_reserve(d.id,operation); -- revalidates components against current physical stock
 cash:=ec_cash(actor,d.branch_id,cash_request);
 INSERT INTO sales(id,tenant_id,branch_id,customer_id,cash_session_id,client_operation_id,operation_key,payload_hash,source,external_reference,status,subtotal_cents,discount_cents,surcharge_cents,total_cents,change_cents,sold_at,created_by_uid,created_at,updated_at)
 VALUES(sale,d.tenant_id,d.branch_id,d.customer_id,cash,operation::text,concat(d.tenant_id,':EC:SALE:',d.id),encode(sha256(convert_to(d.id::text,'UTF8')),'hex'),CASE WHEN d.kind='ENCOMENDA' THEN 'ORDER' ELSE 'TAB' END,d.code,'COMPLETED',d.subtotal_cents,0,d.delivery_fee_cents,d.total_cents,0,now(),actor.id,now(),now());
 UPDATE ec_reservations SET status='CONSUMED',closed_at=now() WHERE document_id=d.id AND status='ACTIVE';
 FOR item IN SELECT * FROM ec_items WHERE document_id=d.id AND status='ACTIVE' ORDER BY id LOOP
  SELECT COALESCE(sum(quantity_per_parent*unit_cost_cents),0)::bigint INTO item_cost FROM ec_components WHERE item_id=item.id;
  INSERT INTO sale_items(id,tenant_id,sale_id,product_id,quantity,unit_list_price_cents,unit_sale_price_cents,unit_cost_cents,discount_cents,total_cents,status,created_at,updated_at)
  VALUES(gen_random_uuid(),d.tenant_id,sale,item.product_id,item.quantity,item.unit_list_price_cents,item.unit_price_cents,item_cost,0,item.line_total_cents,'ACTIVE',now(),now());
  PERFORM ec_post_stock(d.id,item.id,item.quantity,false,actor.id,operation,sale);
 END LOOP;
 FOR receipt IN SELECT * FROM ec_receipts WHERE document_id=d.id ORDER BY received_at,id LOOP
  PERFORM ec_require(receipt.returned_cents=0,'VALIDATION_ERROR');
  payment:=gen_random_uuid();
  INSERT INTO sale_payments(id,tenant_id,sale_id,payment_method_id,amount_cents,sequence,external_reference,status,created_at)
  VALUES(payment,d.tenant_id,sale,receipt.payment_method_id,receipt.amount_cents,1,left(receipt.reference,160),'CONFIRMED',receipt.received_at);
  INSERT INTO ec_sale_receipt_links(id,tenant_id,document_id,original_document_id,sale_id,sale_payment_id,receipt_id,amount_cents) VALUES(gen_random_uuid(),d.tenant_id,d.id,receipt.original_document_id,sale,payment,receipt.id,receipt.amount_cents);
 END LOOP;
 UPDATE ec_documents SET status=CASE WHEN kind='ENCOMENDA' THEN 'COMPLETED' ELSE 'CLOSED' END,sale_id=sale,completed_at=now(),reservation_state='CONSUMED' WHERE id=d.id;
 RETURN sale;
END $$;
COMMIT;

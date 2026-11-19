BEGIN;
-- Reuse the existing PosApproval queue and its distinct authenticated Caixa
-- manager. Bind a refund to the entire proposed payload and document version,
-- never to a name supplied by the requester or to the amount alone.
CREATE OR REPLACE FUNCTION ec_refund_hash(document uuid,version bigint,payload jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $$
 SELECT encode(sha256(convert_to(jsonb_build_object('documentId',document,'version',version::text,'payload',payload-'approvalId')::text,'UTF8')),'hex')
$$;

CREATE OR REPLACE FUNCTION ec_request_refund_approval(actor users,d ec_documents,p jsonb,operation uuid) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE cash uuid; amount bigint:=(p->>'amountCents')::bigint; approval_id uuid:=gen_random_uuid(); expected bigint;
BEGIN
 PERFORM ec_require(ec_can(actor,CASE WHEN d.kind='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END,'manage') AND ec_can(actor,'CAIXA','access'),'ACCESS_DENIED');
 PERFORM ec_require(d.status='CANCELLED' AND amount>0 AND amount<=d.received_net_cents AND length(btrim(p->>'reference')) BETWEEN 1 AND 180 AND length(btrim(p->>'reason')) BETWEEN 1 AND 500,'VALIDATION_ERROR');
 PERFORM ec_require(EXISTS(SELECT 1 FROM payment_methods WHERE id=(p->>'paymentMethodId')::uuid AND tenant_id=d.tenant_id AND active AND requires_change AND code<>'IFOOD_CHANNEL'),'VALIDATION_ERROR');
 PERFORM ec_require(NOT ec_can(actor,'CAIXA','manage') AND amount>COALESCE((SELECT operator_withdrawal_limit_cents FROM pos_policies WHERE tenant_id=d.tenant_id),0),'VALIDATION_ERROR');
 cash:=ec_cash(actor,d.branch_id,NULLIF(p->>'cashSessionId','')::uuid);PERFORM ec_require(cash IS NOT NULL,'CASH_SESSION_REQUIRED');
 SELECT cs.opening_amount_cents+COALESCE((SELECT sum(cm.amount_cents) FROM cash_movements cm WHERE cm.session_id=cs.id AND cm.movement_type<>'OPENING'),0) INTO expected FROM cash_sessions cs WHERE cs.id=cash;
 PERFORM ec_require(expected>=amount,'CASH_BALANCE_REQUIRED');
 INSERT INTO pos_approvals(id,tenant_id,branch_id,requested_by_uid,operation_key,payload_hash,kind,cash_session_id,cash_amount_cents,cash_expected_cents,cash_description,subtotal_cents,discount_cents,surcharge_cents,status,expires_at,created_at)
 VALUES(approval_id,d.tenant_id,d.branch_id,actor.id,concat(d.tenant_id,':EC:REFUND_APPROVAL:',operation),ec_refund_hash(d.id,d.version+1,p),'WITHDRAWAL',cash,amount,expected,left('Devolução '||d.code||' · '||btrim(p->>'reason')||' · '||btrim(p->>'reference'),500),0,0,0,'PENDING',now()+interval '30 minutes',now());
 RETURN jsonb_build_object('approvalId',approval_id,'approvalStatus','PENDING','amountCents',amount::text,'cashSessionId',cash,'payloadHash',ec_refund_hash(d.id,d.version+1,p));
END $$;

CREATE OR REPLACE FUNCTION ec_refund_authorizer(actor users,d ec_documents,p jsonb,cash uuid) RETURNS text LANGUAGE plpgsql AS $$
DECLARE approval pos_approvals; manager users;
BEGIN
 IF ec_can(actor,'CAIXA','manage') OR (p->>'amountCents')::bigint<=COALESCE((SELECT operator_withdrawal_limit_cents FROM pos_policies WHERE tenant_id=d.tenant_id),0) THEN RETURN actor.id;END IF;
 SELECT * INTO approval FROM pos_approvals WHERE id=NULLIF(p->>'approvalId','')::uuid AND tenant_id=d.tenant_id AND branch_id=d.branch_id
 AND requested_by_uid=actor.id AND kind='WITHDRAWAL' AND cash_session_id=cash AND cash_amount_cents=(p->>'amountCents')::bigint
 AND payload_hash=ec_refund_hash(d.id,d.version,p) AND operation_key LIKE d.tenant_id||':EC:REFUND_APPROVAL:%'
 AND status='APPROVED' AND expires_at>now() AND approved_by_uid<>actor.id FOR UPDATE;
 PERFORM ec_require(approval.id IS NOT NULL,'FINANCIAL_APPROVAL_REQUIRED');
 SELECT u.* INTO manager FROM users u JOIN roles r ON r.id=u.role_id AND r.tenant_id=u.tenant_id AND r.active AND r.deleted_at IS NULL
 WHERE u.id=approval.approved_by_uid AND u.tenant_id=d.tenant_id AND u.active AND u.deleted_at IS NULL AND (u.blocked_until IS NULL OR u.blocked_until<=now());
 PERFORM ec_require(manager.id IS NOT NULL AND ec_can(manager,'CAIXA','manage') AND ec_branch(manager,d.branch_id),'FINANCIAL_APPROVAL_REQUIRED');
 UPDATE pos_approvals SET status='USED' WHERE id=approval.id;
 RETURN manager.id;
END $$;

CREATE OR REPLACE FUNCTION ec_has_unallocated(document uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM ec_receipts r WHERE r.document_id=document AND r.amount_cents-r.returned_cents>
 COALESCE((SELECT sum(a.amount_cents) FROM ec_effective_allocations a WHERE a.receipt_id=r.id AND a.item_id IS NOT NULL),0))
$$;

CREATE OR REPLACE FUNCTION ec_remove(actor users,document uuid,payload jsonb,operation uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE d ec_documents; item ec_items; qty numeric; disposition text; movement uuid; removed_cents bigint;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document AND tenant_id=actor.tenant_id;
 SELECT * INTO item FROM ec_items WHERE id=(payload->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE';
 PERFORM ec_require(item.id IS NOT NULL,'NOT_FOUND');
 PERFORM ec_require(NOT ec_has_unallocated(d.id),'ALLOCATION_REQUIRED');
 PERFORM ec_require(NOT EXISTS(SELECT 1 FROM ec_effective_allocations WHERE item_id=item.id),'ITEM_ALREADY_PAID');
 qty:=(payload->>'quantity')::numeric;
 PERFORM ec_require(qty>0 AND qty<=item.quantity AND qty=round(qty,3) AND (item.unit='kg' OR qty=trunc(qty)) AND length(btrim(payload->>'reason')) BETWEEN 1 AND 500,'VALIDATION_ERROR');
 IF item.preparation_state='NOTED' THEN disposition:='RELEASE_RESERVATION';
 ELSE
  PERFORM ec_require(ec_sensitive(actor,'COMANDAS'),'APPROVAL_REQUIRED');
  disposition:=payload->>'disposition';
  PERFORM ec_require(disposition IN('RETURN_TO_AVAILABLE','LOSS'),'VALIDATION_ERROR');
 END IF;
 UPDATE ec_reservations SET status='RELEASED',closed_at=now() WHERE document_id=d.id AND status='ACTIVE';
 IF disposition='LOSS' THEN movement:=ec_post_stock(d.id,item.id,qty,true,actor.id,operation); END IF;
 removed_cents:=CASE WHEN qty=item.quantity THEN item.line_total_cents ELSE LEAST(item.line_total_cents,round(qty*item.unit_price_cents)::bigint) END;
 UPDATE ec_items SET quantity=CASE WHEN quantity=qty THEN quantity ELSE quantity-qty END,
 status=CASE WHEN quantity=qty THEN 'REMOVED' ELSE status END,
 line_total_cents=CASE WHEN quantity=qty THEN 0 ELSE item.line_total_cents-removed_cents END WHERE id=item.id;
 INSERT INTO ec_dispositions(id,tenant_id,document_id,item_id,quantity,preparation_state,disposition,reason,actor_uid,stock_movement_id,operation_id,created_at)
 VALUES(gen_random_uuid(),d.tenant_id,d.id,item.id,qty,item.preparation_state,disposition,btrim(payload->>'reason'),actor.id,movement,operation,now());
 PERFORM ec_retotal(d.id);PERFORM ec_reserve(d.id,operation);
 UPDATE ec_split_plans SET status='SUPERSEDED' WHERE document_id=d.id AND status='ACTIVE';
END $$;

CREATE OR REPLACE FUNCTION ec_advanced(actor users,document uuid,command jsonb,operation uuid) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE d ec_documents; other ec_documents; item ec_items; copied ec_items; r ec_receipts; share record; p jsonb:=command->'payload'; action text:=command->>'action';
 page text; entry jsonb; chosen uuid[]:='{}'; participant_map jsonb:='{}'; qty numeric; participant uuid; plan uuid; target bigint; parts integer; base bigint; remainder bigint; idx integer; allocated bigint;
 amount bigint; remaining bigint; portion bigint; cash uuid; method payment_methods; movement uuid; transferred_cents bigint; previous_other_version bigint; source_product uuid; authorizer text;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document AND tenant_id=actor.tenant_id;
 page:=CASE WHEN d.kind='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END;
 CASE action
 WHEN 'ALLOCATE_RECEIPT' THEN
  PERFORM ec_require(ec_can(actor,page,'update'),'ACCESS_DENIED'); PERFORM ec_reconcile(d.id,(p->>'receiptId')::uuid,p->'allocations',operation);
 WHEN 'CREATE_SPLIT' THEN
  PERFORM ec_require(d.kind='COMANDA' AND ec_can(actor,page,'create'),'ACCESS_DENIED');
  PERFORM ec_require(p->>'mode' IN('EQUAL','ITEM','PERSON','SHARED_ITEM'),'VALIDATION_ERROR');
  target:=d.total_cents-d.received_net_cents;
  parts:=(p->>'parts')::integer;
  IF p->>'mode' IN('ITEM','SHARED_ITEM') THEN
   PERFORM ec_require(NOT ec_has_unallocated(d.id),'ALLOCATION_REQUIRED');
   SELECT * INTO item FROM ec_items WHERE id=(p->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE';
   PERFORM ec_require(item.id IS NOT NULL,'NOT_FOUND');
   SELECT item.line_total_cents-COALESCE(sum(amount_cents),0)::bigint INTO target FROM ec_effective_allocations WHERE item_id=item.id;
  ELSIF p->>'mode'='PERSON' THEN
   PERFORM ec_require(NOT ec_has_unallocated(d.id),'ALLOCATION_REQUIRED');
   PERFORM ec_require(EXISTS(SELECT 1 FROM ec_participants WHERE id=(p->>'participantId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id),'VALIDATION_ERROR');
   SELECT COALESCE(sum(i.line_total_cents-COALESCE((SELECT sum(amount_cents) FROM ec_effective_allocations WHERE item_id=i.id),0)),0)::bigint INTO target FROM ec_items i WHERE i.document_id=d.id AND i.status='ACTIVE' AND i.participant_id=(p->>'participantId')::uuid;
  END IF;
  PERFORM ec_require(target>0 AND target<=d.total_cents-d.received_net_cents AND parts BETWEEN CASE WHEN p->>'mode'='SHARED_ITEM' THEN 2 ELSE 1 END AND 12 AND parts<=target,'VALIDATION_ERROR');
  UPDATE ec_split_plans SET status='SUPERSEDED' WHERE document_id=d.id AND status='ACTIVE';
  plan:=gen_random_uuid();
  INSERT INTO ec_split_plans(id,tenant_id,document_id,item_id,mode,base_version,total_cents,parts,status)
  VALUES(plan,d.tenant_id,d.id,item.id,p->>'mode',d.version+1,target,parts,'ACTIVE');
  base:=target/parts;remainder:=target%parts;
  FOR idx IN 0..parts-1 LOOP
   INSERT INTO ec_split_shares(id,tenant_id,document_id,plan_id,participant_id,share_index,amount_cents,paid_cents)
   VALUES(gen_random_uuid(),d.tenant_id,d.id,plan,NULLIF(p->>'participantId','')::uuid,idx,base+CASE WHEN idx>=parts-remainder THEN 1 ELSE 0 END,0);
  END LOOP;
  RETURN jsonb_build_object('planId',plan,'totalCents',target::text,'parts',parts);
 WHEN 'REMOVE_ITEM' THEN
  SELECT * INTO item FROM ec_items WHERE id=(p->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id;
  PERFORM ec_require(d.kind='COMANDA' AND ec_can(actor,page,'delete'),'ACCESS_DENIED');PERFORM ec_remove(actor,d.id,p,operation);
  RETURN jsonb_build_object('itemId',item.id,'preparationState',item.preparation_state,'quantity',p->>'quantity','disposition',(SELECT disposition FROM ec_dispositions WHERE operation_id=operation AND document_id=d.id),'authorizerUid',CASE WHEN item.preparation_state<>'NOTED' THEN actor.id END);
 WHEN 'TRANSFER_ITEMS','MERGE' THEN
  PERFORM ec_require(d.kind='COMANDA' AND ec_can(actor,page,'update'),'ACCESS_DENIED');
  SELECT * INTO other FROM ec_documents WHERE id=(command->>'secondaryDocumentId')::uuid AND tenant_id=d.tenant_id AND kind='COMANDA';
  PERFORM ec_require(other.id IS NOT NULL AND other.id<>d.id AND other.branch_id=d.branch_id AND other.status='OPEN' AND ec_branch(actor,other.branch_id),'INVALID_TRANSFER_TARGET');
  PERFORM ec_require(other.version=(command->>'secondaryExpectedVersion')::bigint,'VERSION_CONFLICT',jsonb_build_object('currentVersion',other.version::text));
  previous_other_version:=other.version;
  -- Both documents were locked, and the shared branch lock precedes all balances.
  FOR source_product IN SELECT DISTINCT product_id FROM ec_components WHERE document_id IN(d.id,other.id) ORDER BY product_id LOOP PERFORM ec_lock_stock(d.tenant_id,d.branch_id,source_product); END LOOP;
  IF action='MERGE' THEN
   PERFORM ec_require((SELECT count(*) FROM ec_receipts WHERE document_id IN(d.id,other.id))<=1000 AND (SELECT count(*) FROM ec_items WHERE document_id IN(d.id,other.id) AND status='ACTIVE')<=200 AND (SELECT count(*) FROM ec_participants WHERE document_id IN(d.id,other.id))<=50,'DOCUMENT_LIMIT_REACHED');
   PERFORM ec_require(ec_sensitive(actor,page),'APPROVAL_REQUIRED');
   UPDATE ec_participants SET document_id=other.id WHERE document_id=d.id;
   UPDATE ec_components c SET document_id=other.id FROM ec_items i WHERE c.item_id=i.id AND i.document_id=d.id AND i.status='ACTIVE';
   UPDATE ec_items SET document_id=other.id WHERE document_id=d.id AND status='ACTIVE';
   UPDATE ec_receipts SET document_id=other.id WHERE document_id=d.id;
   UPDATE ec_allocations SET document_id=other.id WHERE document_id=d.id;
   UPDATE ec_allocation_parts SET document_id=other.id WHERE document_id=d.id;
   UPDATE ec_split_shares SET document_id=other.id WHERE document_id=d.id;
   UPDATE ec_split_plans SET document_id=other.id WHERE document_id=d.id;
   UPDATE ec_documents SET status='INCORPORATED',incorporated_at=now(),merged_into_id=other.id,reservation_state='RELEASED' WHERE id=d.id;
   UPDATE ec_reservations SET status='RELEASED',closed_at=now() WHERE document_id=d.id AND status='ACTIVE';
   INSERT INTO ec_lineage(id,tenant_id,origin_document_id,destination_document_id,action,operation_id,occurred_at) VALUES(gen_random_uuid(),d.tenant_id,d.id,other.id,'MERGE',operation,now());
  ELSE
   PERFORM ec_require(NOT ec_has_unallocated(d.id),'ALLOCATION_REQUIRED');
   PERFORM ec_require(jsonb_typeof(p->'items')='array' AND jsonb_array_length(p->'items') BETWEEN 1 AND 200,'VALIDATION_ERROR');
   FOR entry IN SELECT value FROM jsonb_array_elements(p->'items') LOOP
    SELECT * INTO item FROM ec_items WHERE id=(entry->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE';
    PERFORM ec_require(item.id IS NOT NULL AND NOT item.id=ANY(chosen),'NOT_FOUND');chosen:=array_append(chosen,item.id);
    PERFORM ec_require(NOT EXISTS(SELECT 1 FROM ec_effective_allocations WHERE item_id=item.id),'ITEM_ALREADY_PAID');
    qty:=(entry->>'quantity')::numeric;
    PERFORM ec_require(qty>0 AND qty<=item.quantity AND qty=round(qty,3) AND (item.unit='kg' OR qty=trunc(qty)),'VALIDATION_ERROR');
    participant:=NULL;
    IF item.participant_id IS NOT NULL THEN
     participant:=NULLIF(participant_map->>item.participant_id::text,'')::uuid;
     IF participant IS NULL THEN
      PERFORM ec_require((SELECT count(*) FROM ec_participants WHERE document_id=other.id)<50,'DOCUMENT_LIMIT_REACHED');
      participant:=gen_random_uuid();
      INSERT INTO ec_participants(id,tenant_id,document_id,name,display_order) SELECT participant,tenant_id,other.id,name,display_order FROM ec_participants WHERE id=item.participant_id AND document_id=d.id;
      participant_map:=participant_map||jsonb_build_object(item.participant_id::text,participant);
     END IF;
    END IF;
    PERFORM ec_require((SELECT count(*) FROM ec_items WHERE document_id=other.id AND status='ACTIVE')<200,'DOCUMENT_LIMIT_REACHED');
    copied:=item;copied.id:=gen_random_uuid();copied.document_id:=other.id;copied.source_item_id:=item.id;copied.participant_id:=participant;copied.quantity:=qty;transferred_cents:=CASE WHEN qty=item.quantity THEN item.line_total_cents ELSE LEAST(item.line_total_cents,round(qty*item.unit_price_cents)::bigint) END;copied.line_total_cents:=transferred_cents;
    INSERT INTO ec_items SELECT copied.*;
    INSERT INTO ec_components(id,tenant_id,document_id,item_id,product_id,quantity_per_parent,unit_cost_cents) SELECT gen_random_uuid(),tenant_id,other.id,copied.id,product_id,quantity_per_parent,unit_cost_cents FROM ec_components WHERE item_id=item.id;
    UPDATE ec_items SET quantity=CASE WHEN quantity=qty THEN quantity ELSE quantity-qty END,status=CASE WHEN quantity=qty THEN 'TRANSFERRED' ELSE status END,line_total_cents=CASE WHEN quantity=qty THEN 0 ELSE item.line_total_cents-transferred_cents END WHERE id=item.id;
    INSERT INTO ec_lineage(id,tenant_id,origin_document_id,destination_document_id,source_item_id,destination_item_id,quantity,action,operation_id,occurred_at) VALUES(gen_random_uuid(),d.tenant_id,d.id,other.id,item.id,copied.id,qty,'ITEM_TRANSFER',operation,now());
   END LOOP;
   PERFORM ec_retotal(d.id);PERFORM ec_reserve(d.id,operation);
  END IF;
  PERFORM ec_retotal(other.id);PERFORM ec_reserve(other.id,operation);
  UPDATE ec_split_plans SET status='SUPERSEDED' WHERE document_id IN(d.id,other.id) AND status='ACTIVE';
  UPDATE ec_documents SET version=version+1,updated_at=now() WHERE id=other.id;
  PERFORM ec_event(other.id,d.id,action,actor.id,operation,previous_other_version,jsonb_build_object('originCode',d.code));
  RETURN jsonb_build_object('relatedDocumentId',other.id,'relatedVersion',(other.version+1)::text,'sourceCode',d.code,'targetCode',other.code);
 WHEN 'CANCEL_SALE' THEN
  PERFORM ec_require(ec_can(actor,'GESTAO_VENDAS','delete') AND ec_sensitive(actor,page),'APPROVAL_REQUIRED');
  PERFORM ec_require(length(btrim(p->>'reason')) BETWEEN 5 AND 500 AND d.sale_id IS NOT NULL,'VALIDATION_ERROR');
  PERFORM 1 FROM sales WHERE id=d.sale_id AND tenant_id=d.tenant_id AND status='COMPLETED' AND source IN('ORDER','TAB') FOR UPDATE;
  PERFORM ec_require(FOUND,'DOCUMENT_TERMINAL');
  UPDATE sales SET status='CANCELLED',cancelled_at=now(),cancellation_reason=left(btrim(p->>'reason'),255),updated_at=now() WHERE id=d.sale_id AND tenant_id=d.tenant_id;
  UPDATE sale_items SET status='CANCELLED',updated_at=now() WHERE sale_id=d.sale_id AND tenant_id=d.tenant_id AND status='ACTIVE';
  UPDATE sale_payments SET status='CANCELLED' WHERE sale_id=d.sale_id AND tenant_id=d.tenant_id AND status='CONFIRMED';
  -- Restore sold components only; prior losses have no sale_id and stay losses.
  FOR share IN SELECT product_id,sum(quantity) quantity FROM stock_movements WHERE sale_id=d.sale_id AND tenant_id=d.tenant_id AND status='POSTED' GROUP BY product_id ORDER BY product_id LOOP
   PERFORM ec_lock_stock(d.tenant_id,d.branch_id,share.product_id);
   UPDATE stock_balances SET quantity=quantity+share.quantity,version=version+1,updated_at=now() WHERE tenant_id=d.tenant_id AND branch_id=d.branch_id AND product_id=share.product_id;
  END LOOP;
  UPDATE stock_movements SET status='REVERSED',reversed_at=now() WHERE sale_id=d.sale_id AND tenant_id=d.tenant_id AND status='POSTED';
  UPDATE ec_documents SET status='CANCELLED',cancelled_at=now(),reason=btrim(p->>'reason'),reservation_state='RELEASED' WHERE id=d.id;
  RETURN jsonb_build_object('cancelledSaleId',d.sale_id,'refundPendingCents',d.received_net_cents::text,'refundExecuted',false);
 WHEN 'CANCEL' THEN
  PERFORM ec_require(ec_can(actor,page,'delete'),'ACCESS_DENIED');
  PERFORM ec_require(length(btrim(p->>'reason')) BETWEEN 1 AND 500,'VALIDATION_ERROR');
  IF d.received_net_cents>0 OR EXISTS(SELECT 1 FROM ec_items WHERE document_id=d.id AND status='ACTIVE' AND preparation_state<>'NOTED') THEN PERFORM ec_require(ec_sensitive(actor,page),'APPROVAL_REQUIRED');END IF;
  UPDATE ec_reservations SET status='RELEASED',closed_at=now() WHERE document_id=d.id AND status='ACTIVE';
  IF d.kind='COMANDA' THEN
   FOR item IN SELECT * FROM ec_items WHERE document_id=d.id AND status='ACTIVE' AND preparation_state IN('PREPARED','SERVED') ORDER BY id LOOP
    movement:=ec_post_stock(d.id,item.id,item.quantity,true,actor.id,operation);
    INSERT INTO ec_dispositions(id,tenant_id,document_id,item_id,quantity,preparation_state,disposition,reason,actor_uid,stock_movement_id,operation_id,created_at) VALUES(gen_random_uuid(),d.tenant_id,d.id,item.id,item.quantity,item.preparation_state,'LOSS',btrim(p->>'reason'),actor.id,movement,operation,now());
   END LOOP;
  END IF;
  UPDATE ec_documents SET status='CANCELLED',cancelled_at=now(),reason=btrim(p->>'reason'),reservation_state='RELEASED' WHERE id=d.id;
  RETURN jsonb_build_object('refundPendingCents',d.received_net_cents::text,'refundExecuted',false);
 WHEN 'REQUEST_REFUND_APPROVAL' THEN
  RETURN ec_request_refund_approval(actor,d,p,operation);
 WHEN 'REFUND' THEN
  PERFORM ec_require(ec_sensitive(actor,page),'APPROVAL_REQUIRED');
  amount:=(p->>'amountCents')::bigint;
  PERFORM ec_require(d.status='CANCELLED' AND amount>0 AND amount<=d.received_net_cents,'AMOUNT_EXCEEDS_BALANCE');
  PERFORM ec_require(length(btrim(p->>'reference')) BETWEEN 1 AND 180 AND length(btrim(p->>'reason')) BETWEEN 1 AND 500,'VALIDATION_ERROR');
  SELECT * INTO method FROM payment_methods WHERE id=(p->>'paymentMethodId')::uuid AND tenant_id=d.tenant_id AND active AND code<>'IFOOD_CHANNEL';
  PERFORM ec_require(method.id IS NOT NULL,'VALIDATION_ERROR');cash:=ec_cash(actor,d.branch_id,NULLIF(p->>'cashSessionId','')::uuid);
  PERFORM ec_require(NOT method.requires_change OR cash IS NOT NULL,'CASH_SESSION_REQUIRED');
  authorizer:=CASE WHEN method.requires_change THEN ec_refund_authorizer(actor,d,p,cash) ELSE actor.id END;
  IF method.requires_change AND cash IS NOT NULL THEN
   PERFORM ec_require((SELECT cs.opening_amount_cents+COALESCE((SELECT sum(cm.amount_cents) FROM cash_movements cm WHERE cm.session_id=cs.id AND cm.movement_type<>'OPENING'),0) FROM cash_sessions cs WHERE cs.id=cash)>=amount,'CASH_BALANCE_REQUIRED');
   INSERT INTO cash_movements(id,operation_key,payload_hash,tenant_id,session_id,movement_type,amount_cents,description,created_by_uid,created_at)
   VALUES(gen_random_uuid(),concat(d.tenant_id,':EC:REFUND:',operation),encode(sha256(convert_to(p::text,'UTF8')),'hex'),d.tenant_id,cash,'EC_REFUND',-amount,left('Devolução '||d.code,180),actor.id,now());
  END IF;
  remaining:=amount;
  FOR r IN SELECT * FROM ec_receipts WHERE document_id=d.id AND amount_cents>returned_cents ORDER BY received_at,id FOR UPDATE LOOP
   portion:=LEAST(remaining,r.amount_cents-r.returned_cents);
   INSERT INTO ec_refunds(id,tenant_id,document_id,receipt_id,amount_cents,payment_method_id,reference,reason,cash_session_id,operator_uid,operation_id,refunded_at)
   VALUES(gen_random_uuid(),d.tenant_id,d.id,r.id,portion,method.id,btrim(p->>'reference'),btrim(p->>'reason'),cash,actor.id,operation,now());
   UPDATE ec_receipts SET returned_cents=returned_cents+portion WHERE id=r.id; remaining:=remaining-portion;EXIT WHEN remaining=0;
  END LOOP;
  PERFORM ec_require(remaining=0,'VALIDATION_ERROR');PERFORM ec_retotal(d.id);
  RETURN jsonb_build_object('refundedCents',amount::text,'cashSessionId',cash,'authorizerUid',authorizer,'approvalId',p->>'approvalId');
 ELSE PERFORM ec_require(false,'VALIDATION_ERROR');
 END CASE;
 RETURN '{}';
END $$;
COMMIT;

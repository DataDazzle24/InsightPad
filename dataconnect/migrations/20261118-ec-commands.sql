BEGIN;

CREATE OR REPLACE FUNCTION ec_edit_items(actor users, document uuid, items jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE d ec_documents; line jsonb; old ec_items; p products; qty numeric; retained uuid[]:='{}'; iid uuid;
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document AND tenant_id=actor.tenant_id;
 PERFORM ec_require(jsonb_typeof(items)='array' AND jsonb_array_length(items) BETWEEN 1 AND 200,'VALIDATION_ERROR');
 FOR line IN SELECT value FROM jsonb_array_elements(items) LOOP
  old:=NULL;
  IF NULLIF(line->>'id','') IS NOT NULL THEN SELECT * INTO old FROM ec_items WHERE id=(line->>'id')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE'; PERFORM ec_require(old.id IS NOT NULL,'VALIDATION_ERROR'); END IF;
  IF old.id IS NOT NULL THEN
   PERFORM ec_require(old.product_id=(line->>'productId')::uuid AND NOT old.id=ANY(retained),'VALIDATION_ERROR');
   qty:=(line->>'quantity')::numeric;
   SELECT * INTO STRICT p FROM products WHERE id=old.product_id AND tenant_id=d.tenant_id;
   PERFORM ec_require(qty>0 AND qty<=999 AND qty=round(qty,3) AND (old.unit='kg' OR qty=trunc(qty)) AND (qty=old.quantity OR p.active AND p.deleted_at IS NULL),'VALIDATION_ERROR');
   PERFORM ec_require(NOT EXISTS(SELECT 1 FROM ec_effective_allocations WHERE item_id=old.id) OR qty=old.quantity,'ITEM_ALREADY_PAID');
   PERFORM ec_require(length(COALESCE(line->>'specifications',''))<=2000,'VALIDATION_ERROR');
   UPDATE ec_items SET quantity=qty,line_total_cents=round(qty*unit_price_cents)::bigint,specifications=COALESCE(line->>'specifications','') WHERE id=old.id;
   retained:=array_append(retained,old.id);
  ELSE iid:=ec_add_item(actor,d.id,line); retained:=array_append(retained,iid); END IF;
 END LOOP;
 PERFORM ec_require(NOT EXISTS(SELECT 1 FROM ec_effective_allocations a JOIN ec_items i ON i.id=a.item_id WHERE i.document_id=d.id AND NOT i.id=ANY(retained)),'ITEM_ALREADY_PAID');
 UPDATE ec_items SET status='REMOVED' WHERE document_id=d.id AND status='ACTIVE' AND NOT id=ANY(retained);
 PERFORM ec_retotal(d.id);
END $$;

-- D07 approved: authenticated module management is required for sensitive actions.
-- ec_can includes canAccess and the existing user-over-role precedence.
CREATE OR REPLACE FUNCTION ec_sensitive(actor users,page text) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT ec_can(actor,page,'manage') $$;

CREATE OR REPLACE FUNCTION ec_apply(actor users, operation uuid, command jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE action text:=command->>'action'; p jsonb:=COALESCE(command->'payload','{}'); d ec_documents; other ec_documents;
 v_kind text:=command->>'kind'; page text; line jsonb; participant jsonb; before_version bigint; old_due timestamptz;
 result jsonb:='{}'; previous_items jsonb; previous_receipts jsonb; previous_participants jsonb; previous_plans jsonb; demand_changed boolean:=false; receipt uuid; sale uuid; item ec_items; next_code bigint; tz text;
BEGIN
 IF action IN('CREATE_ORDER','OPEN_COMMAND') THEN
  v_kind:=CASE WHEN action='CREATE_ORDER' THEN 'ENCOMENDA' ELSE 'COMANDA' END;
  page:=CASE WHEN v_kind='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END;
  PERFORM ec_require(ec_can(actor,page,'create'),'ACCESS_DENIED');
  PERFORM ec_require(ec_branch(actor,(p->>'branchId')::uuid),'BRANCH_DENIED');
  PERFORM 1 FROM branches WHERE id=(p->>'branchId')::uuid AND tenant_id=actor.tenant_id FOR UPDATE;
  SELECT timezone INTO tz FROM tenants WHERE id=actor.tenant_id;
  INSERT INTO ec_sequences(id,tenant_id,kind,next_value) VALUES(gen_random_uuid(),actor.tenant_id,v_kind,1)
  ON CONFLICT(tenant_id,kind) DO UPDATE SET next_value=ec_sequences.next_value+1 RETURNING next_value INTO next_code;
  d.id:=gen_random_uuid();d.tenant_id:=actor.tenant_id;d.branch_id:=(p->>'branchId')::uuid;d.kind:=v_kind;
  d.code:=CASE WHEN v_kind='ENCOMENDA' THEN 'ENC-' ELSE 'CMD-' END||lpad(next_code::text,GREATEST(4,length(next_code::text)),'0');
  d.customer_id:=NULLIF(p->>'customerId','')::uuid;d.identification:=btrim(COALESCE(p->>'identification',''));
  d.status:=CASE WHEN v_kind='ENCOMENDA' THEN 'PENDING' ELSE 'OPEN' END;
  d.fulfillment_mode:=CASE WHEN v_kind='ENCOMENDA' THEN COALESCE(p->>'fulfillmentMode','PICKUP') END;
  d.timezone_snapshot:=tz;d.due_at:=CASE WHEN v_kind='ENCOMENDA' THEN (p->>'dueAtLocal')::timestamp AT TIME ZONE tz END;
  d.delivery_address:=CASE WHEN d.fulfillment_mode='DELIVERY' THEN p->'deliveryAddress' END;
  d.delivery_fee_cents:=CASE WHEN d.fulfillment_mode='DELIVERY' THEN COALESCE((p->>'deliveryFeeCents')::bigint,0) ELSE 0 END;
  SELECT id INTO d.opened_cash_session_id FROM cash_sessions WHERE tenant_id=d.tenant_id AND branch_id=d.branch_id AND opened_by_uid=actor.id AND status='OPEN' ORDER BY id LIMIT 1;
  d.notes:=COALESCE(p->>'notes','');d.reservation_strategy:=COALESCE(p->>'reservationStrategy','NOW');d.reservation_state:='NONE';
  d.subtotal_cents:=0;d.total_cents:=d.delivery_fee_cents;d.received_net_cents:=0;d.opened_by_uid:=actor.id;d.version:=1;d.created_at:=now();d.updated_at:=now();
  PERFORM ec_require(length(d.identification)<=160 AND length(d.notes)<=2000 AND d.reservation_strategy IN('NOW','WAIT'),'VALIDATION_ERROR');
  PERFORM ec_require(v_kind='ENCOMENDA' OR length(d.identification)>0,'VALIDATION_ERROR');
  PERFORM ec_require(d.customer_id IS NULL AND v_kind='COMANDA' OR EXISTS(SELECT 1 FROM customers WHERE id=d.customer_id AND tenant_id=d.tenant_id AND active AND deleted_at IS NULL),'VALIDATION_ERROR');
  PERFORM ec_require(v_kind='COMANDA' OR d.due_at IS NOT NULL AND d.fulfillment_mode IN('PICKUP','DELIVERY') AND (d.fulfillment_mode='PICKUP' OR ec_address_ok(d.delivery_address)),'VALIDATION_ERROR');
  INSERT INTO ec_documents SELECT d.*;
  PERFORM ec_require(jsonb_typeof(COALESCE(p->'participants','[]'))='array' AND jsonb_array_length(COALESCE(p->'participants','[]'))<=50,'VALIDATION_ERROR');
  FOR participant IN SELECT value FROM jsonb_array_elements(COALESCE(p->'participants','[]')) LOOP
   PERFORM ec_require(length(btrim(participant#>>'{}')) BETWEEN 1 AND 120,'VALIDATION_ERROR');
   INSERT INTO ec_participants(id,tenant_id,document_id,name,display_order) VALUES(gen_random_uuid(),d.tenant_id,d.id,btrim(participant#>>'{}'),(SELECT count(*) FROM ec_participants WHERE document_id=d.id));
  END LOOP;
  IF v_kind='ENCOMENDA' THEN
   PERFORM ec_edit_items(actor,d.id,p->'items');
   IF d.reservation_strategy='NOW' THEN PERFORM ec_reserve(d.id,operation); ELSE UPDATE ec_documents SET reservation_state='WAITING' WHERE id=d.id; END IF;
   IF COALESCE((p#>>'{payment,amountCents}')::bigint,0)>0 THEN receipt:=ec_receive(actor,d.id,p->'payment',operation); END IF;
  END IF;
  PERFORM ec_event(d.id,NULL,action,actor.id,operation,0,jsonb_build_object('items',ec_item_snapshot(d.id),'receiptId',receipt,'customerId',d.customer_id,'branchId',d.branch_id));
 ELSE
  SELECT * INTO d FROM ec_documents WHERE id=(command->>'documentId')::uuid AND tenant_id=actor.tenant_id;
  PERFORM ec_require(d.id IS NOT NULL AND ec_branch(actor,d.branch_id),'NOT_FOUND');
  PERFORM ec_require(v_kind=d.kind,'VALIDATION_ERROR');
  page:=CASE WHEN d.kind='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END;
  PERFORM ec_require(ec_can(actor,page,'access'),'ACCESS_DENIED');
  -- Branch order matches existing PostSale and Stock operations. Two-document
  -- commands take both branch/document locks in UUID order, not UI order.
  PERFORM 1 FROM branches b WHERE b.tenant_id=actor.tenant_id AND b.id IN(d.branch_id,NULLIF(p->>'branchId','')::uuid) ORDER BY b.id FOR UPDATE;
  PERFORM 1 FROM ec_documents doc WHERE doc.tenant_id=actor.tenant_id AND doc.id IN(d.id,NULLIF(command->>'secondaryDocumentId','')::uuid) ORDER BY doc.id FOR UPDATE;
  SELECT * INTO STRICT d FROM ec_documents WHERE id=d.id AND tenant_id=actor.tenant_id;
  before_version:=d.version;
  IF action='MERGE' THEN SELECT COALESCE(jsonb_agg(id),'[]') INTO previous_receipts FROM ec_receipts WHERE document_id=d.id;SELECT COALESCE(jsonb_agg(id),'[]') INTO previous_participants FROM ec_participants WHERE document_id=d.id;SELECT COALESCE(jsonb_agg(id),'[]') INTO previous_plans FROM ec_split_plans WHERE document_id=d.id;END IF;
  IF action IN('EDIT_ORDER','ADD_ITEM','REMOVE_ITEM','TRANSFER_ITEMS','MERGE','ASSIGN_ITEM','PREPARE_ITEM') THEN previous_items:=ec_item_snapshot(d.id);END IF;
  PERFORM ec_require(d.version=(command->>'expectedVersion')::bigint,'VERSION_CONFLICT',jsonb_build_object('currentVersion',d.version::text));
  IF action='CANCEL_SALE' THEN PERFORM ec_require(d.status IN('CLOSED','COMPLETED'),'DOCUMENT_TERMINAL');
  ELSIF action IN('REFUND','REQUEST_REFUND_APPROVAL') THEN PERFORM ec_require(d.status='CANCELLED','DOCUMENT_TERMINAL');
  ELSE PERFORM ec_require(d.status IN('PENDING','PREPARING','READY','OPEN'),'DOCUMENT_TERMINAL'); END IF;
  CASE action
  WHEN 'EDIT_ORDER' THEN
   PERFORM ec_require(d.kind='ENCOMENDA' AND ec_can(actor,page,'update'),'ACCESS_DENIED');
   old_due:=d.due_at;
   demand_changed:=(p ? 'branchId' AND (p->>'branchId')::uuid<>d.branch_id) OR (p ? 'items' AND (
     jsonb_array_length(p->'items')<>(SELECT count(*) FROM ec_items WHERE document_id=d.id AND status='ACTIVE')
     OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'items') v LEFT JOIN ec_items i ON i.id=NULLIF(v->>'id','')::uuid AND i.document_id=d.id AND i.status='ACTIVE'
       WHERE i.id IS NULL OR i.product_id IS DISTINCT FROM (v->>'productId')::uuid OR i.quantity IS DISTINCT FROM (v->>'quantity')::numeric)));

   IF p ? 'branchId' AND (p->>'branchId')::uuid<>d.branch_id THEN
    PERFORM ec_require(d.received_net_cents=0,'BRANCH_DENIED');
    PERFORM ec_require(ec_branch(actor,(p->>'branchId')::uuid),'BRANCH_DENIED');
    UPDATE ec_reservations SET status='RELEASED',closed_at=now() WHERE document_id=d.id AND status='ACTIVE';
   END IF;
   IF NULLIF(p->>'customerId','') IS NOT NULL THEN PERFORM ec_require(EXISTS(SELECT 1 FROM customers WHERE id=(p->>'customerId')::uuid AND tenant_id=d.tenant_id AND active AND deleted_at IS NULL),'VALIDATION_ERROR');END IF;
   UPDATE ec_documents SET customer_id=COALESCE(NULLIF(p->>'customerId','')::uuid,customer_id),fulfillment_mode=COALESCE(p->>'fulfillmentMode',fulfillment_mode),delivery_address=CASE WHEN p->>'fulfillmentMode'='PICKUP' THEN NULL WHEN p ? 'deliveryAddress' THEN p->'deliveryAddress' ELSE delivery_address END,total_cents=subtotal_cents+CASE WHEN p->>'fulfillmentMode'='PICKUP' THEN 0 ELSE COALESCE((p->>'deliveryFeeCents')::bigint,delivery_fee_cents) END,delivery_fee_cents=CASE WHEN p->>'fulfillmentMode'='PICKUP' THEN 0 ELSE COALESCE((p->>'deliveryFeeCents')::bigint,delivery_fee_cents) END,branch_id=COALESCE(NULLIF(p->>'branchId','')::uuid,branch_id),notes=COALESCE(p->>'notes',notes),due_at=COALESCE((p->>'dueAtLocal')::timestamp AT TIME ZONE timezone_snapshot,due_at)
   WHERE id=d.id;
   PERFORM ec_require((SELECT fulfillment_mode='PICKUP' OR ec_address_ok(delivery_address) FROM ec_documents WHERE id=d.id),'VALIDATION_ERROR');
   IF p ? 'items' THEN PERFORM ec_edit_items(actor,d.id,p->'items'); END IF;
   PERFORM ec_retotal(d.id);
   IF demand_changed AND d.reservation_state='RESERVED' THEN PERFORM ec_reserve(d.id,operation); END IF;
   IF d.status='READY' AND demand_changed THEN UPDATE ec_documents SET status='PENDING' WHERE id=d.id; END IF;
   result:=jsonb_build_object('previousDueAt',old_due,'readyReviewRequired',d.status='READY' AND demand_changed);
  WHEN 'RESCHEDULE' THEN
   PERFORM ec_require(d.kind='ENCOMENDA' AND ec_can(actor,page,'update'),'ACCESS_DENIED');
   result:=jsonb_build_object('previousDueAt',d.due_at,'newDueAt',(p->>'dueAtLocal')::timestamp AT TIME ZONE d.timezone_snapshot);
   PERFORM ec_require(p->>'dueAtLocal' IS NOT NULL,'VALIDATION_ERROR');
   UPDATE ec_documents SET due_at=(p->>'dueAtLocal')::timestamp AT TIME ZONE timezone_snapshot WHERE id=d.id;
  WHEN 'RESERVE' THEN
   PERFORM ec_require(ec_can(actor,page,'update'),'ACCESS_DENIED'); PERFORM ec_reserve(d.id,operation);
  WHEN 'START_PREPARATION' THEN
   PERFORM ec_require(d.kind='ENCOMENDA' AND d.status='PENDING' AND ec_can(actor,page,'update'),'ACCESS_DENIED'); UPDATE ec_documents SET status='PREPARING' WHERE id=d.id;
  WHEN 'MARK_READY' THEN
   PERFORM ec_require(d.kind='ENCOMENDA' AND d.status IN('PENDING','PREPARING') AND ec_can(actor,page,'update'),'ACCESS_DENIED');
   PERFORM ec_require(d.reservation_state='RESERVED','RESERVATION_REQUIRED'); PERFORM ec_reserve(d.id,operation); UPDATE ec_documents SET status='READY' WHERE id=d.id;
  WHEN 'ADD_ITEM' THEN
   PERFORM ec_require(d.kind='COMANDA' AND ec_can(actor,page,'create'),'ACCESS_DENIED');
   PERFORM ec_require((SELECT count(*) FROM ec_items WHERE document_id=d.id AND status='ACTIVE')<200,'VALIDATION_ERROR');
   PERFORM ec_add_item(actor,d.id,p); PERFORM ec_retotal(d.id);PERFORM ec_reserve(d.id,operation);
   UPDATE ec_split_plans SET status='SUPERSEDED' WHERE document_id=d.id AND status='ACTIVE';
  WHEN 'ASSIGN_ITEM' THEN
   PERFORM ec_require(d.kind='COMANDA' AND ec_can(actor,page,'update'),'ACCESS_DENIED');
   PERFORM ec_require(NULLIF(p->>'participantId','') IS NULL OR EXISTS(SELECT 1 FROM ec_participants WHERE id=(p->>'participantId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id),'VALIDATION_ERROR');
   UPDATE ec_items SET participant_id=NULLIF(p->>'participantId','')::uuid WHERE id=(p->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE';
   PERFORM ec_require(FOUND,'NOT_FOUND');
  WHEN 'PREPARE_ITEM' THEN
   PERFORM ec_require(d.kind='COMANDA' AND ec_can(actor,page,'update'),'ACCESS_DENIED');
   SELECT * INTO item FROM ec_items WHERE id=(p->>'itemId')::uuid AND document_id=d.id AND tenant_id=d.tenant_id AND status='ACTIVE';
   PERFORM ec_require(item.id IS NOT NULL AND p->>'state' IN('NOTED','PREPARING','PREPARED','SERVED'),'VALIDATION_ERROR');
   PERFORM ec_require(array_position(ARRAY['NOTED','PREPARING','PREPARED','SERVED'],p->>'state')>=array_position(ARRAY['NOTED','PREPARING','PREPARED','SERVED'],item.preparation_state),'APPROVAL_REQUIRED');
   UPDATE ec_items SET preparation_state=p->>'state' WHERE id=item.id;
  WHEN 'RECEIVE' THEN
   PERFORM ec_require(ec_can(actor,page,'create'),'ACCESS_DENIED');receipt:=ec_receive(actor,d.id,p,operation);
  WHEN 'COMPLETE' THEN
   PERFORM ec_require(ec_can(actor,page,'create'),'ACCESS_DENIED');sale:=ec_finish(actor,d.id,operation,NULLIF(p->>'cashSessionId','')::uuid);
  WHEN 'RECEIVE_AND_COMPLETE' THEN
   PERFORM ec_require(ec_can(actor,page,'create'),'ACCESS_DENIED');
   PERFORM ec_require((p#>>'{payment,amountCents}')::bigint=d.total_cents-d.received_net_cents,'VALIDATION_ERROR');
   receipt:=ec_receive(actor,d.id,p->'payment',operation);sale:=ec_finish(actor,d.id,operation,NULLIF(p#>>'{payment,cashSessionId}','')::uuid);
  WHEN 'MOVE_TABLE' THEN
   PERFORM ec_require(d.kind='COMANDA' AND ec_can(actor,page,'update'),'ACCESS_DENIED');
   PERFORM ec_require(length(btrim(p->>'identification')) BETWEEN 1 AND 160,'VALIDATION_ERROR');
   result:=jsonb_build_object('previous',d.identification,'current',btrim(p->>'identification'));
   UPDATE ec_documents SET identification=btrim(p->>'identification') WHERE id=d.id;
  ELSE
   -- Advanced commands are implemented in a separate helper, preserving the same
   -- transaction, lock, version and receipt boundary as simple commands.
   result:=ec_advanced(actor,d.id,command,operation);
  END CASE;
  UPDATE ec_documents SET version=version+1,updated_at=now() WHERE id=d.id;
  result:=result||CASE WHEN previous_items IS NOT NULL THEN jsonb_build_object('previousItems',previous_items,'currentItems',ec_item_snapshot(d.id)) ELSE '{}'::jsonb END;
  IF previous_receipts IS NOT NULL THEN result:=result||jsonb_build_object('previousReceiptIds',previous_receipts,'previousParticipantIds',previous_participants,'previousPlanIds',previous_plans);END IF;
  IF sale IS NOT NULL THEN result:=result||jsonb_build_object('saleId',sale,'saleTotalCents',(SELECT total_cents::text FROM ec_documents WHERE id=d.id));END IF;
  IF action='REQUEST_REFUND_APPROVAL' THEN result:=result||jsonb_build_object('proposal',p);END IF;
  IF action IN('REMOVE_ITEM','MERGE','CANCEL','CANCEL_SALE','REFUND','REQUEST_REFUND_APPROVAL') THEN result:=result||jsonb_build_object('actorUid',actor.id,'authorizerUid',COALESCE(result->>'authorizerUid',actor.id));END IF;
  IF p ? 'reason' THEN result:=result||jsonb_build_object('reason',left(p->>'reason',500));END IF;
  IF receipt IS NOT NULL THEN result:=result||jsonb_build_object('receiptId',receipt,'receivedCents',(SELECT amount_cents::text FROM ec_receipts WHERE id=receipt));END IF;
  PERFORM ec_event(d.id,NULLIF(result->>'relatedDocumentId','')::uuid,action,actor.id,operation,before_version,result);
 END IF;
 SELECT * INTO STRICT d FROM ec_documents WHERE id=d.id;
 RETURN jsonb_build_object('documentId',d.id,'version',d.version::text,'saleId',d.sale_id,'receiptId',receipt,'effects',result,'kind',d.kind);
END $$;

CREATE OR REPLACE FUNCTION ec_command(uid text, token text, command jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE actor users; operation uuid; existing ec_operations; hash text; result jsonb; details text; error_code text; page text; document ec_documents;
BEGIN
 PERFORM 1 FROM users u JOIN tenants t ON t.id=u.tenant_id JOIN roles r ON r.id=u.role_id AND r.tenant_id=u.tenant_id JOIN user_device_sessions s ON s.user_id=u.id AND s.tenant_id=u.tenant_id WHERE u.id=uid FOR SHARE OF u,t,r,s;
 actor:=ec_actor(uid,token);
 PERFORM ec_require(jsonb_typeof(command)='object' AND octet_length(command::text)<=262144,'VALIDATION_ERROR');
 operation:=(command->>'operationId')::uuid;
 PERFORM ec_require(operation IS NOT NULL AND command->>'kind' IN('ENCOMENDA','COMANDA'),'VALIDATION_ERROR');
 page:=CASE WHEN command->>'kind'='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END;
 PERFORM ec_require(ec_can(actor,page,'access'),'ACCESS_DENIED');
 PERFORM pg_advisory_xact_lock(hashtextextended(operation::text,0));
 hash:=encode(sha256(convert_to(command::text,'UTF8')),'hex');
 SELECT * INTO existing FROM ec_operations WHERE id=operation;
 IF existing.id IS NOT NULL THEN
  PERFORM ec_require(existing.tenant_id=actor.tenant_id AND existing.actor_uid=actor.id AND existing.payload_hash=hash AND existing.operation_type=concat(command->>'kind',':',command->>'action'),'IDEMPOTENCY_CONFLICT');
  IF existing.document_id IS NOT NULL THEN SELECT * INTO document FROM ec_documents WHERE id=existing.document_id AND tenant_id=actor.tenant_id;PERFORM ec_require(document.id IS NOT NULL AND ec_branch(actor,document.branch_id),'BRANCH_DENIED'); END IF;
  RETURN existing.result;
 END IF;
 BEGIN
  result:=ec_apply(actor,operation,command)||jsonb_build_object('status','COMMITTED','operationId',operation,'serverTime',now());
 EXCEPTION
  WHEN SQLSTATE 'P0001' THEN
   GET STACKED DIAGNOSTICS error_code=MESSAGE_TEXT,details=PG_EXCEPTION_DETAIL;
   result:=jsonb_build_object('status','REJECTED','operationId',operation,'kind',command->>'kind','error',jsonb_build_object('code',error_code,'details',COALESCE(NULLIF(details,'')::jsonb,'{}')));
  WHEN data_exception OR integrity_constraint_violation THEN
   result:=jsonb_build_object('status','REJECTED','operationId',operation,'kind',command->>'kind','error',jsonb_build_object('code','VALIDATION_ERROR'));
 END;
 INSERT INTO ec_operations(id,tenant_id,actor_uid,operation_type,payload_hash,document_id,secondary_document_id,result,created_at)
 VALUES(operation,actor.tenant_id,actor.id,concat(command->>'kind',':',command->>'action'),hash,COALESCE(NULLIF(result->>'documentId','')::uuid,(SELECT id FROM ec_documents WHERE id=NULLIF(command->>'documentId','')::uuid AND tenant_id=actor.tenant_id)),NULLIF(command->>'secondaryDocumentId','')::uuid,result,now());
 RETURN result;
END $$;
COMMIT;

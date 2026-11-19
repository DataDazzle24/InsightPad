BEGIN;
-- Advisory action metadata for the UI. Every command independently revalidates
-- these conditions under locks; this read never grants a capability.
CREATE OR REPLACE FUNCTION ec_actions(actor users,d ec_documents) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE page text:=CASE WHEN d.kind='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END;
 action text; capability text; reason text; result jsonb:='{}'; terminal boolean:=d.status IN('COMPLETED','CLOSED','CANCELLED','INCORPORATED');
BEGIN
 FOR action,capability IN SELECT * FROM (VALUES
 ('EDIT_ORDER','update'),('RESCHEDULE','update'),('RESERVE','update'),('START_PREPARATION','update'),('MARK_READY','update'),
 ('ADD_ITEM','create'),('ASSIGN_ITEM','update'),('PREPARE_ITEM','update'),('REMOVE_ITEM','delete'),('MOVE_TABLE','update'),
 ('TRANSFER_ITEMS','update'),('MERGE','update'),('ALLOCATE_RECEIPT','update'),('CREATE_SPLIT','create'),
 ('RECEIVE','create'),('COMPLETE','create'),('RECEIVE_AND_COMPLETE','create'),('CANCEL','delete'),('REFUND','manage'),('REQUEST_REFUND_APPROVAL','manage'),('CANCEL_SALE','manage')) x(action,capability) LOOP
  reason:=NULL;
  IF NOT ec_can(actor,page,capability) THEN reason:='ACCESS_DENIED';
  ELSIF action IN('REFUND','REQUEST_REFUND_APPROVAL') THEN
   IF d.status<>'CANCELLED' OR d.received_net_cents<=0 THEN reason:='DOCUMENT_TERMINAL';END IF;
  ELSIF action='CANCEL_SALE' THEN
   IF d.status NOT IN('CLOSED','COMPLETED') OR d.sale_id IS NULL THEN reason:='DOCUMENT_TERMINAL';
   ELSIF NOT ec_can(actor,'GESTAO_VENDAS','delete') THEN reason:='ACCESS_DENIED';END IF;
  ELSIF terminal THEN reason:='DOCUMENT_TERMINAL';END IF;
  IF reason IS NULL AND action IN('EDIT_ORDER','RESCHEDULE','START_PREPARATION','MARK_READY') AND d.kind<>'ENCOMENDA' THEN reason:='ACCESS_DENIED';END IF;
  IF reason IS NULL AND action IN('ADD_ITEM','ASSIGN_ITEM','PREPARE_ITEM','REMOVE_ITEM','MOVE_TABLE','TRANSFER_ITEMS','MERGE','CREATE_SPLIT') AND d.kind<>'COMANDA' THEN reason:='ACCESS_DENIED';END IF;
  IF reason IS NULL AND action='START_PREPARATION' AND d.status<>'PENDING' THEN reason:='INVALID_STATE';END IF;
  IF reason IS NULL AND action='MARK_READY' AND (d.status NOT IN('PENDING','PREPARING') OR d.reservation_state<>'RESERVED') THEN reason:='RESERVATION_REQUIRED';END IF;
  IF reason IS NULL AND action IN('RECEIVE','RECEIVE_AND_COMPLETE','CREATE_SPLIT') AND d.total_cents<=d.received_net_cents THEN reason:='NO_BALANCE';END IF;
  IF reason IS NULL AND action IN('COMPLETE','RECEIVE_AND_COMPLETE') THEN
   IF d.total_cents<=0 THEN reason:='EMPTY_DOCUMENT';
   ELSIF d.reservation_state<>'RESERVED' THEN reason:='RESERVATION_REQUIRED';
   ELSIF d.kind='ENCOMENDA' AND d.status<>'READY' THEN reason:='ORDER_NOT_READY';
   ELSIF action='COMPLETE' AND d.total_cents<>d.received_net_cents THEN reason:='PAYMENT_REQUIRED';END IF;
  END IF;
  IF reason IS NULL AND action IN('MERGE','REFUND','REQUEST_REFUND_APPROVAL','CANCEL_SALE') AND NOT ec_sensitive(actor,page) THEN reason:='APPROVAL_REQUIRED';END IF;
  IF reason IS NULL AND action='CANCEL' AND (d.received_net_cents>0 OR EXISTS(SELECT 1 FROM ec_items WHERE document_id=d.id AND status='ACTIVE' AND preparation_state<>'NOTED')) AND NOT ec_sensitive(actor,page) THEN reason:='APPROVAL_REQUIRED';END IF;
  IF reason IS NULL AND action='TRANSFER_ITEMS' AND ec_has_unallocated(d.id) THEN reason:='ALLOCATION_REQUIRED';END IF;
  IF reason IS NULL AND action IN('RECEIVE','RECEIVE_AND_COMPLETE','COMPLETE','REFUND','REQUEST_REFUND_APPROVAL') THEN
   IF NOT ec_can(actor,'CAIXA','access') THEN reason:='ACCESS_DENIED';
   ELSIF COALESCE((SELECT require_open_session FROM pos_policies WHERE tenant_id=d.tenant_id),true)
    AND NOT EXISTS(SELECT 1 FROM cash_sessions WHERE tenant_id=d.tenant_id AND branch_id=d.branch_id AND opened_by_uid=actor.id AND status='OPEN') THEN reason:='CASH_SESSION_REQUIRED';END IF;
  END IF;
  result:=result||jsonb_build_object(action,jsonb_build_object('allowed',reason IS NULL,'reason',reason));
 END LOOP;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION ec_item_actions(actor users,d ec_documents,item ec_items) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE reason text; edit boolean:=d.kind='COMANDA' AND d.status='OPEN' AND item.status='ACTIVE' AND ec_can(actor,'COMANDAS','update');
BEGIN
 IF d.kind<>'COMANDA' OR d.status<>'OPEN' OR item.status<>'ACTIVE' THEN reason:='DOCUMENT_TERMINAL';
 ELSIF NOT ec_can(actor,'COMANDAS','delete') THEN reason:='ACCESS_DENIED';
 ELSIF EXISTS(SELECT 1 FROM ec_effective_allocations WHERE item_id=item.id) THEN reason:='ITEM_ALREADY_PAID';
 ELSIF ec_has_unallocated(d.id) THEN reason:='ALLOCATION_REQUIRED';
 ELSIF item.preparation_state<>'NOTED' AND NOT ec_sensitive(actor,'COMANDAS') THEN reason:='APPROVAL_REQUIRED';END IF;
 RETURN jsonb_build_object('REMOVE_ITEM',jsonb_build_object('allowed',reason IS NULL,'reason',reason),
 'PREPARE_ITEM',jsonb_build_object('allowed',edit,'reason',CASE WHEN NOT edit THEN 'ACCESS_DENIED' END),
 'ASSIGN_ITEM',jsonb_build_object('allowed',edit,'reason',CASE WHEN NOT edit THEN 'ACCESS_DENIED' END));
END $$;

CREATE OR REPLACE FUNCTION ec_receipt_scope(document uuid,tenant uuid) RETURNS SETOF uuid LANGUAGE sql STABLE AS $$
 SELECT r.id FROM ec_receipts r WHERE r.tenant_id=tenant AND (r.document_id=document OR r.id IN(
 SELECT value::uuid FROM jsonb_array_elements_text(COALESCE((SELECT e.details->'previousReceiptIds' FROM ec_events e WHERE e.document_id=document AND e.tenant_id=tenant AND e.event_type='MERGE' ORDER BY e.occurred_at DESC,e.id DESC LIMIT 1),'[]'))))
$$;

CREATE OR REPLACE FUNCTION ec_read(uid text, token text, request jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE actor users; mode text:=COALESCE(request->>'mode','LIST'); v_kind text:=request->>'kind'; page text;
 d ec_documents; result jsonb; operation ec_operations; size integer; skip integer; tz text;
BEGIN
 PERFORM ec_require(jsonb_typeof(request)='object' AND octet_length(request::text)<=CASE WHEN mode='RESULT' THEN 263168 ELSE 32768 END AND length(COALESCE(request->>'productTerm',''))<=180 AND length(COALESCE(request->>'customerTerm',''))<=180,'VALIDATION_ERROR');
 actor:=ec_actor(uid,token);
 IF mode='RESULT' THEN
  SELECT * INTO operation FROM ec_operations WHERE id=(request->>'operationId')::uuid AND tenant_id=actor.tenant_id AND actor_uid=actor.id;
  IF operation.id IS NULL THEN RETURN jsonb_build_object('status','UNKNOWN'); END IF;
  v_kind:=COALESCE(operation.result->>'kind',v_kind);
  IF operation.document_id IS NOT NULL THEN SELECT * INTO d FROM ec_documents WHERE id=operation.document_id AND tenant_id=actor.tenant_id; v_kind:=d.kind; END IF;
  PERFORM ec_require(v_kind IN('ENCOMENDA','COMANDA') AND ec_can(actor,CASE WHEN v_kind='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END,'access'),'ACCESS_DENIED');
  PERFORM ec_require(d.id IS NULL OR ec_branch(actor,d.branch_id),'BRANCH_DENIED');
  IF request ? 'expectedCommand' AND encode(sha256(convert_to((request->'expectedCommand')::text,'UTF8')),'hex')<>operation.payload_hash THEN
   RETURN jsonb_build_object('status','REJECTED','operationId',operation.id,'error',jsonb_build_object('code','IDEMPOTENCY_CONFLICT'));
  END IF;
  RETURN operation.result;
 END IF;
 PERFORM ec_require(v_kind IN('ENCOMENDA','COMANDA'),'VALIDATION_ERROR');
 page:=CASE WHEN v_kind='ENCOMENDA' THEN 'ENCOMENDAS' ELSE 'COMANDAS' END;
 PERFORM ec_require(ec_can(actor,page,'access'),'ACCESS_DENIED');
 SELECT timezone INTO tz FROM tenants WHERE id=actor.tenant_id;
 IF mode IN('DETAIL','EVENTS','RECEIPTS','AVAILABILITY') THEN
  SELECT * INTO d FROM ec_documents doc WHERE doc.id=(request->>'documentId')::uuid AND doc.tenant_id=actor.tenant_id AND doc.kind=v_kind;
  PERFORM ec_require(d.id IS NOT NULL AND ec_branch(actor,d.branch_id),'NOT_FOUND');
 END IF;
 size:=LEAST(GREATEST(COALESCE((request->>'pageSize')::integer,25),1),100);
 skip:=GREATEST(COALESCE((request->>'offset')::integer,0),0);
 PERFORM ec_require(skip<=1000000 AND length(COALESCE(request->>'term',''))<=180,'VALIDATION_ERROR');
 PERFORM ec_require(NULLIF(request->>'from','') IS NULL OR NULLIF(request->>'to','') IS NULL OR (request->>'from')::date<=(request->>'to')::date,'VALIDATION_ERROR');
 IF mode='LOOKUPS' THEN
  RETURN jsonb_build_object('serverNow',now(),'timezone',tz,'cashPolicy',jsonb_build_object('canManage',ec_can(actor,'CAIXA','manage'),'withdrawalLimitCents',COALESCE((SELECT operator_withdrawal_limit_cents::text FROM pos_policies WHERE tenant_id=actor.tenant_id),'0')),
   'branches',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',b.id,'name',b.name) ORDER BY b.name,b.id),'[]') FROM branches b WHERE ec_branch(actor,b.id)),
   'customers',(SELECT COALESCE(jsonb_agg(to_jsonb(c)),'[]') FROM (SELECT id,name,street,street_number,district,city,state_code,postal_code FROM customers WHERE tenant_id=actor.tenant_id AND active AND deleted_at IS NULL AND name ILIKE '%'||COALESCE(request->>'customerTerm','')||'%' ORDER BY name,id LIMIT 50)c),
   'products',(SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(p))),'[]') FROM (SELECT p.id,p.name,p.internal_code,p.weighted_product,p.bundle_product,p.sale_price_cents,COALESCE((SELECT min(promotional_price_cents) FROM promotions q WHERE q.tenant_id=p.tenant_id AND q.product_id=p.id AND q.active AND q.deleted_at IS NULL AND now()>=q.starts_at AND now()<q.ends_at),p.sale_price_cents) effective_price_cents FROM products p WHERE p.tenant_id=actor.tenant_id AND p.active AND p.deleted_at IS NULL AND (p.name ILIKE '%'||COALESCE(request->>'productTerm','')||'%' OR p.internal_code ILIKE '%'||COALESCE(request->>'productTerm','')||'%') ORDER BY p.name,p.id LIMIT 50)p),
   'catalogPageSize',50,
   'paymentMethods',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'requires_change',p.requires_change)),'[]') FROM payment_methods p WHERE p.tenant_id=actor.tenant_id AND p.active AND p.code<>'IFOOD_CHANNEL'),
   'cashSessions',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',s.id,'branch_id',s.branch_id,'opened_at',s.opened_at)),'[]') FROM cash_sessions s WHERE s.tenant_id=actor.tenant_id AND s.opened_by_uid=actor.id AND s.status='OPEN' AND ec_can(actor,'CAIXA','access') AND ec_branch(actor,s.branch_id)));
 END IF;
 IF mode IN('EVENTS','RECEIPTS') THEN
  IF mode='EVENTS' THEN SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(ec_json(to_jsonb(x))),'[]'),'offset',skip,'pageSize',size,'total',(SELECT count(*) FROM ec_events WHERE document_id=d.id)) INTO result FROM (SELECT e.*,u.name actor_name FROM ec_events e LEFT JOIN users u ON u.id=e.actor_uid AND u.tenant_id=e.tenant_id WHERE e.document_id=d.id AND e.tenant_id=d.tenant_id ORDER BY e.occurred_at,e.id LIMIT size OFFSET skip)x;
  ELSE SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(ec_json(to_jsonb(x))),'[]'),'offset',skip,'pageSize',size,'total',(SELECT count(*) FROM ec_receipts WHERE id IN(SELECT ec_receipt_scope(d.id,d.tenant_id)))) INTO result FROM (SELECT r.*,m.name method_name,u.name operator_name FROM ec_receipts r JOIN payment_methods m ON m.id=r.payment_method_id AND m.tenant_id=r.tenant_id LEFT JOIN users u ON u.id=r.operator_uid AND u.tenant_id=r.tenant_id WHERE r.id IN(SELECT ec_receipt_scope(d.id,d.tenant_id)) ORDER BY r.received_at,r.id LIMIT size OFFSET skip)x; END IF;
  RETURN result;
 END IF;
 IF mode='AVAILABILITY' THEN
  RETURN jsonb_build_object('advisory',true,'rows',(SELECT COALESCE(jsonb_agg(jsonb_build_object('product_id',q.product_id,'name',p.name,'required',q.quantity::text,'physical',COALESCE(b.quantity,0)::text,'reserved',ec_reserved(d.tenant_id,d.branch_id,q.product_id)::text,'available',(COALESCE(b.quantity,0)-ec_reserved(d.tenant_id,d.branch_id,q.product_id,d.id))::text)),'[]') FROM (SELECT c.product_id,sum(i.quantity*c.quantity_per_parent) quantity FROM ec_items i JOIN ec_components c ON c.item_id=i.id WHERE i.document_id=d.id AND i.status='ACTIVE' GROUP BY c.product_id)q JOIN products p ON p.id=q.product_id AND p.tenant_id=d.tenant_id LEFT JOIN stock_balances b ON b.tenant_id=d.tenant_id AND b.branch_id=d.branch_id AND b.product_id=q.product_id));
 END IF;
 IF mode='CALENDAR' THEN PERFORM ec_require((request->>'calendarTo')::date-(request->>'calendarFrom')::date BETWEEN 0 AND 41,'VALIDATION_ERROR');END IF;
 IF mode='DETAIL' THEN
  RETURN jsonb_build_object('document',ec_json(to_jsonb(d)),'serverNow',now(),'timezone',d.timezone_snapshot,
   'customerName',(SELECT name FROM customers WHERE id=d.customer_id AND tenant_id=d.tenant_id),'branchName',(SELECT name FROM branches WHERE id=d.branch_id AND tenant_id=d.tenant_id),'operatorName',(SELECT name FROM users WHERE id=d.opened_by_uid AND tenant_id=d.tenant_id),
   'items',CASE WHEN d.status='INCORPORATED' THEN (SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(i))||jsonb_build_object('quantity',v->>'quantity','line_total_cents',v->>'lineTotalCents','status',v->>'status','participant_id',v->>'participantId','preparation_state',v->>'preparation')),'[]') FROM jsonb_array_elements(COALESCE((SELECT details->'previousItems' FROM ec_events WHERE document_id=d.id AND tenant_id=d.tenant_id AND event_type='MERGE' ORDER BY occurred_at DESC,id DESC LIMIT 1),'[]')) v JOIN ec_items i ON i.id=(v->>'id')::uuid AND i.tenant_id=d.tenant_id) ELSE (SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(i))||jsonb_build_object('actions',ec_item_actions(actor,d,i)) ORDER BY i.created_at,i.id),'[]') FROM ec_items i WHERE i.document_id=d.id) END,
   'participants',(SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.display_order,p.id),'[]') FROM ec_participants p WHERE p.tenant_id=d.tenant_id AND (p.document_id=d.id OR p.id IN(SELECT value::uuid FROM jsonb_array_elements_text(COALESCE((SELECT details->'previousParticipantIds' FROM ec_events WHERE document_id=d.id AND tenant_id=d.tenant_id AND event_type='MERGE' ORDER BY occurred_at DESC,id DESC LIMIT 1),'[]'))))),
   'allocations',(SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(a))),'[]') FROM ec_effective_allocations a WHERE a.document_id=d.id),
   'plans',(SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(p))||jsonb_build_object('shares',(SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(s)) ORDER BY s.share_index),'[]') FROM ec_split_shares s WHERE s.plan_id=p.id))),'[]') FROM ec_split_plans p WHERE p.document_id=d.id),
   'refundPendingCents',(CASE WHEN d.status='CANCELLED' THEN d.received_net_cents ELSE 0 END)::text,
   'actions',ec_actions(actor,d),
   'refundApprovals',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',p.id,'status',p.status,'amountCents',p.cash_amount_cents::text,'expiresAt',p.expires_at,'approvedByUid',p.approved_by_uid) ORDER BY p.created_at DESC),'[]') FROM pos_approvals p WHERE p.tenant_id=d.tenant_id AND p.branch_id=d.branch_id AND p.requested_by_uid=actor.id AND p.operation_key LIKE d.tenant_id||':EC:REFUND_APPROVAL:%' AND p.payload_hash=ec_refund_hash(d.id,d.version,COALESCE((SELECT e.details->'proposal' FROM ec_events e WHERE e.document_id=d.id AND e.details->>'approvalId'=p.id::text AND e.event_type='REQUEST_REFUND_APPROVAL' ORDER BY e.occurred_at DESC,e.id DESC LIMIT 1),'{}'))),
   'allowedActions',jsonb_build_object('create',ec_can(actor,page,'create'),'update',ec_can(actor,page,'update'),'delete',ec_can(actor,page,'delete'),'manage',ec_can(actor,page,'manage'),'cash',ec_can(actor,'CAIXA','access')),
   'reservationValid',d.reservation_state='RESERVED','terminal',d.status IN('COMPLETED','CLOSED','CANCELLED','INCORPORATED'));
 END IF;
 PERFORM ec_require(mode IN('LIST','CALENDAR','TARGETS'),'VALIDATION_ERROR');
 WITH general AS MATERIALIZED (
  SELECT doc.*,c.name customer_name,b.name branch_name,(SELECT u.name FROM users u WHERE u.id=doc.opened_by_uid AND u.tenant_id=doc.tenant_id) operator_name,COALESCE(CASE WHEN doc.status='CANCELLED' THEN doc.cancelled_at WHEN doc.status='INCORPORATED' THEN doc.incorporated_at ELSE doc.completed_at END,doc.created_at) historical_at
  FROM ec_documents doc JOIN branches b ON b.id=doc.branch_id AND b.tenant_id=doc.tenant_id LEFT JOIN customers c ON c.id=doc.customer_id AND c.tenant_id=doc.tenant_id
  WHERE doc.tenant_id=actor.tenant_id AND doc.kind=v_kind AND ec_branch(actor,doc.branch_id)
  AND (NULLIF(request->>'branchId','') IS NULL OR doc.branch_id=(request->>'branchId')::uuid)
  AND (COALESCE(request->>'view','OPEN')<>'HISTORY' AND doc.status IN('OPEN','PENDING','PREPARING','READY') OR request->>'view'='HISTORY' AND doc.status IN('CLOSED','COMPLETED','CANCELLED','INCORPORATED'))
  AND (COALESCE(request->>'term','')='' OR concat_ws(' ',doc.code,doc.identification,c.name) ILIKE '%'||(request->>'term')||'%')
  AND (NULLIF(request->>'status','') IS NULL OR doc.status=request->>'status')
  AND (NULLIF(request->>'fulfillmentMode','') IS NULL OR doc.fulfillment_mode=request->>'fulfillmentMode')
  AND (NOT COALESCE((request->>'refundOnly')::boolean,false) OR doc.status='CANCELLED' AND doc.received_net_cents>0)
  AND (NULLIF(request->>'from','') IS NULL OR CASE WHEN request->>'view'='HISTORY' THEN COALESCE(CASE WHEN doc.status='CANCELLED' THEN doc.cancelled_at WHEN doc.status='INCORPORATED' THEN doc.incorporated_at ELSE doc.completed_at END,doc.created_at) ELSE COALESCE(doc.due_at,doc.created_at) END >= ((request->>'from')::date::timestamp AT TIME ZONE tz))
  AND (NULLIF(request->>'to','') IS NULL OR CASE WHEN request->>'view'='HISTORY' THEN COALESCE(CASE WHEN doc.status='CANCELLED' THEN doc.cancelled_at WHEN doc.status='INCORPORATED' THEN doc.incorporated_at ELSE doc.completed_at END,doc.created_at) ELSE COALESCE(doc.due_at,doc.created_at) END < (((request->>'to')::date+1)::timestamp AT TIME ZONE tz))
 ), quick AS MATERIALIZED (
  SELECT * FROM general g WHERE (COALESCE(request->>'quick','all')<>'late' OR g.due_at<now()) AND (COALESCE(request->>'quick','all')<>'ready' OR g.status='READY')
  AND (NOT COALESCE((request->>'paidOnly')::boolean,false) OR g.total_cents>0 AND g.total_cents=g.received_net_cents)
 ), selected AS MATERIALIZED (
  SELECT * FROM quick q WHERE (NULLIF(request->>'table','') IS NULL OR q.identification=request->>'table')
  AND (NULLIF(request->>'code','') IS NULL OR q.id=(request->>'code')::uuid)
  AND (NULLIF(request->>'day','') IS NULL OR (q.due_at AT TIME ZONE tz)::date=(request->>'day')::date)
  AND (mode<>'CALENDAR' OR q.due_at>=((request->>'calendarFrom')::date::timestamp AT TIME ZONE tz) AND q.due_at<(((request->>'calendarTo')::date+1)::timestamp AT TIME ZONE tz))
 ), sliced AS (
  SELECT * FROM selected ORDER BY CASE WHEN v_kind='ENCOMENDA' AND due_at<now() THEN 0 ELSE 1 END,
  CASE WHEN v_kind='COMANDA' AND total_cents>0 AND total_cents=received_net_cents THEN 1 ELSE 0 END,
  CASE WHEN request->>'view'='HISTORY' THEN historical_at END DESC, due_at,code,id LIMIT size OFFSET skip
 ) SELECT jsonb_build_object('rows',(SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(s))),'[]') FROM sliced s),'total',(SELECT count(*) FROM selected),'offset',skip,'pageSize',size,'serverNow',now(),'timezone',tz,
  'counts',jsonb_build_object('all',(SELECT count(*) FROM general),'late',(SELECT count(*) FROM general WHERE due_at<now()),'ready',(SELECT count(*) FROM general WHERE status='READY'),'paid',(SELECT count(*) FROM general WHERE total_cents>0 AND total_cents=received_net_cents),'balanceCents',(SELECT COALESCE(sum(total_cents-received_net_cents),0)::text FROM general)),
  'calendarDays',CASE WHEN mode='CALENDAR' THEN (SELECT COALESCE(jsonb_agg(jsonb_build_object('date',x.day,'total',x.total,'events',(SELECT COALESCE(jsonb_agg(ec_json(to_jsonb(e))),'[]') FROM (SELECT id,code,customer_name,due_at,status FROM selected WHERE (due_at AT TIME ZONE tz)::date=x.day ORDER BY due_at,id LIMIT 2)e)) ORDER BY x.day),'[]') FROM (SELECT (due_at AT TIME ZONE tz)::date AS day,count(*) total FROM selected WHERE due_at IS NOT NULL GROUP BY (due_at AT TIME ZONE tz)::date)x) ELSE '[]'::jsonb END,
  'tables',(SELECT COALESCE(jsonb_agg(identification ORDER BY identification),'[]') FROM (SELECT DISTINCT identification FROM quick WHERE v_kind='COMANDA')t),
  'codes',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'code',code,'name',identification) ORDER BY code,id),'[]') FROM quick WHERE v_kind='COMANDA')) INTO result;
 RETURN result;
END $$;
COMMIT;

-- Additive authoritative helpers. Invoker security; no credentials or grants.
-- Apply after the schema migration, in the same reviewed DEV release plan.
BEGIN;

CREATE OR REPLACE FUNCTION ec_require(ok boolean, code text, detail jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%',code USING ERRCODE='P0001',DETAIL=detail::text; END IF;
END $$;

CREATE OR REPLACE FUNCTION ec_actor(uid text, token text) RETURNS users LANGUAGE plpgsql AS $$
DECLARE actor users;
BEGIN
 SELECT u.* INTO actor FROM users u
 JOIN tenants t ON t.id=u.tenant_id AND t.active AND t.deleted_at IS NULL
 JOIN roles r ON r.id=u.role_id AND r.tenant_id=u.tenant_id AND r.active AND r.deleted_at IS NULL
 JOIN user_device_sessions s ON s.user_id=u.id AND s.tenant_id=u.tenant_id
 WHERE u.id=uid AND u.active AND u.deleted_at IS NULL AND (u.blocked_until IS NULL OR u.blocked_until<=now())
 AND token ~ '^[a-f0-9]{64}$' AND s.session_token=encode(sha256(convert_to(token,'UTF8')),'hex')
 AND s.last_seen_at>now()-interval '15 minutes' AND s.claimed_at>now()-interval '12 hours';
 PERFORM ec_require(actor.id IS NOT NULL,'SESSION_REQUIRED'); RETURN actor;
END $$;

CREATE OR REPLACE FUNCTION ec_can(actor users, page text, capability text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT COALESCE((SELECT COALESCE(up.can_access,rp.can_access,false) AND CASE capability
 WHEN 'access' THEN true WHEN 'create' THEN COALESCE(up.can_create,rp.can_create,false)
 WHEN 'update' THEN COALESCE(up.can_update,rp.can_update,false)
 WHEN 'delete' THEN COALESCE(up.can_delete,rp.can_delete,false)
 WHEN 'export' THEN COALESCE(up.can_export,rp.can_export,false)
 WHEN 'manage' THEN COALESCE(up.can_manage,rp.can_manage,false) ELSE false END
 FROM app_pages p LEFT JOIN user_page_permissions up ON up.page_id=p.id AND up.user_id=actor.id AND up.tenant_id=actor.tenant_id
 LEFT JOIN role_page_permissions rp ON rp.page_id=p.id AND rp.role_id=actor.role_id AND rp.tenant_id=actor.tenant_id
 WHERE p.page_key=page AND p.active),false)
$$;

CREATE OR REPLACE FUNCTION ec_branch(actor users, branch uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM branches b WHERE b.id=branch AND b.tenant_id=actor.tenant_id AND b.active AND b.deleted_at IS NULL
 AND (NOT EXISTS(SELECT 1 FROM user_branches ub WHERE ub.user_id=actor.id)
 OR EXISTS(SELECT 1 FROM user_branches ub WHERE ub.user_id=actor.id AND ub.tenant_id=actor.tenant_id AND ub.branch_id=b.id AND ub.active)))
$$;

CREATE OR REPLACE FUNCTION ec_address_ok(address jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
 SELECT CASE WHEN jsonb_typeof(address)='object' THEN
 jsonb_typeof(address->'street')='string' AND length(btrim(address->>'street')) BETWEEN 1 AND 160
 AND NOT EXISTS(SELECT 1 FROM jsonb_each(address) x WHERE x.key NOT IN('street','streetNumber','district','city','state','postalCode','complement')
 OR jsonb_typeof(x.value)<>'string' OR length(x.value#>>'{}')>500) ELSE false END
$$;

-- All wire amounts/quantities/versions are strings: JSON parsing must not lose Int64.
CREATE OR REPLACE FUNCTION ec_json(value jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 SELECT COALESCE(jsonb_object_agg(key,CASE WHEN key ~ '(_cents$|^quantity$|^quantity_per_parent$|(^|_)version$|^next_value$)'
 AND jsonb_typeof(val)='number' THEN to_jsonb(val#>>'{}') ELSE val END),'{}'::jsonb)
 FROM jsonb_each(value) AS x(key,val)
$$;

CREATE OR REPLACE FUNCTION ec_lock_stock(tenant uuid, branch uuid, product uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity,average_cost_cents,version,updated_at)
 VALUES(tenant,branch,product,0,0,0,now()) ON CONFLICT(branch_id,product_id) DO NOTHING;
 PERFORM 1 FROM stock_balances b WHERE b.tenant_id=tenant AND b.branch_id=branch AND b.product_id=product FOR UPDATE;
 PERFORM ec_require(FOUND,'VALIDATION_ERROR');
END $$;

CREATE OR REPLACE FUNCTION ec_reserved(tenant uuid, branch uuid, product uuid, excluding uuid DEFAULT NULL)
RETURNS numeric LANGUAGE sql STABLE AS $$
 SELECT COALESCE((SELECT sum(r.quantity) FROM ec_reservations r WHERE r.tenant_id=tenant AND r.branch_id=branch
 AND r.product_id=product AND r.status='ACTIVE' AND (excluding IS NULL OR r.document_id<>excluding)),0)
 +COALESCE((SELECT sum(r.quantity) FROM sales_channel_stock_reservations r WHERE r.tenant_id=tenant AND r.branch_id=branch
 AND r.product_id=product AND r.status='RESERVED'),0)
$$;

-- Reservation writers take the same physical balance row lock as legacy writers.
-- Creation of an absent balance is protected by its existing unique key.
CREATE OR REPLACE FUNCTION ec_reservation_lock() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM ec_lock_stock(NEW.tenant_id,NEW.branch_id,NEW.product_id); RETURN NEW;
END $$;

-- Deferred validation sees the final state of legacy sale CTEs (reservation POSTED
-- and physical debit), avoiding a transient double count during conversion.
CREATE OR REPLACE FUNCTION ec_stock_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE physical numeric; protected numeric; reserved numeric;
BEGIN
 SELECT b.quantity INTO physical FROM stock_balances b WHERE b.tenant_id=NEW.tenant_id AND b.branch_id=NEW.branch_id AND b.product_id=NEW.product_id FOR UPDATE;
 SELECT COALESCE(sum(r.quantity),0) INTO protected FROM ec_reservations r
 WHERE r.tenant_id=NEW.tenant_id AND r.branch_id=NEW.branch_id AND r.product_id=NEW.product_id AND r.status='ACTIVE';
 reserved:=ec_reserved(NEW.tenant_id,NEW.branch_id,NEW.product_id);
 -- Preserve legacy negative-stock rules only when there is no protected EC demand.
 PERFORM ec_require(protected=0 OR COALESCE(physical,0)>=reserved,'INSUFFICIENT_STOCK');
 RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS ec_lock_reservation ON ec_reservations;
CREATE TRIGGER ec_lock_reservation BEFORE INSERT OR UPDATE ON ec_reservations FOR EACH ROW EXECUTE FUNCTION ec_reservation_lock();
DROP TRIGGER IF EXISTS ec_lock_channel_reservation ON sales_channel_stock_reservations;
CREATE TRIGGER ec_lock_channel_reservation BEFORE INSERT OR UPDATE ON sales_channel_stock_reservations FOR EACH ROW EXECUTE FUNCTION ec_reservation_lock();
DROP TRIGGER IF EXISTS ec_guard_balance ON stock_balances;
CREATE CONSTRAINT TRIGGER ec_guard_balance AFTER INSERT OR UPDATE ON stock_balances DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ec_stock_guard();
DROP TRIGGER IF EXISTS ec_guard_reservation ON ec_reservations;
CREATE CONSTRAINT TRIGGER ec_guard_reservation AFTER INSERT OR UPDATE ON ec_reservations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ec_stock_guard();
DROP TRIGGER IF EXISTS ec_guard_channel ON sales_channel_stock_reservations;
CREATE CONSTRAINT TRIGGER ec_guard_channel AFTER INSERT OR UPDATE ON sales_channel_stock_reservations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ec_stock_guard();

CREATE OR REPLACE FUNCTION ec_retotal(document uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE subtotal bigint; received bigint;
BEGIN
 SELECT COALESCE(sum(line_total_cents),0)::bigint INTO subtotal FROM ec_items WHERE document_id=document AND status='ACTIVE';
 SELECT COALESCE(sum(amount_cents-returned_cents),0)::bigint INTO received FROM ec_receipts WHERE document_id=document;
 UPDATE ec_documents SET subtotal_cents=subtotal,total_cents=subtotal+delivery_fee_cents,received_net_cents=received WHERE id=document;
 PERFORM ec_require((SELECT total_cents>=received_net_cents FROM ec_documents WHERE id=document),'TOTAL_BELOW_RECEIVED');
END $$;

CREATE OR REPLACE FUNCTION ec_reserve(document uuid, operation uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE d ec_documents; demand record; available numeric; shortages jsonb:='[]';
BEGIN
 SELECT * INTO STRICT d FROM ec_documents WHERE id=document;
 FOR demand IN SELECT c.product_id,sum(i.quantity*c.quantity_per_parent) quantity FROM ec_items i JOIN ec_components c ON c.item_id=i.id AND c.tenant_id=i.tenant_id
 WHERE i.document_id=d.id AND i.status='ACTIVE' GROUP BY c.product_id ORDER BY c.product_id LOOP
  PERFORM ec_lock_stock(d.tenant_id,d.branch_id,demand.product_id);
  SELECT b.quantity-ec_reserved(d.tenant_id,d.branch_id,demand.product_id,d.id) INTO available FROM stock_balances b WHERE b.tenant_id=d.tenant_id AND b.branch_id=d.branch_id AND b.product_id=demand.product_id;
  IF available<demand.quantity THEN shortages:=shortages||jsonb_build_array(jsonb_build_object('productId',demand.product_id,'productName',(SELECT name FROM products WHERE id=demand.product_id AND tenant_id=d.tenant_id),'required',demand.quantity::text,'available',available::text,'missing',(demand.quantity-available)::text)); END IF;
 END LOOP;
 PERFORM ec_require(jsonb_array_length(shortages)=0,'INSUFFICIENT_STOCK',jsonb_build_object('shortages',shortages));
 UPDATE ec_reservations SET status='RELEASED',closed_at=now() WHERE document_id=d.id AND status='ACTIVE';
 INSERT INTO ec_reservations(id,tenant_id,document_id,item_id,branch_id,product_id,quantity,status,operation_id,created_at)
 SELECT gen_random_uuid(),i.tenant_id,d.id,i.id,d.branch_id,c.product_id,i.quantity*c.quantity_per_parent,'ACTIVE',operation,now()
 FROM ec_items i JOIN ec_components c ON c.item_id=i.id AND c.tenant_id=i.tenant_id WHERE i.document_id=d.id AND i.status='ACTIVE';
 UPDATE ec_documents SET reservation_state='RESERVED' WHERE id=d.id;
END $$;

CREATE OR REPLACE FUNCTION ec_event(document uuid,related uuid,kind text,actor text,operation uuid,before_version bigint,details jsonb DEFAULT '{}') RETURNS void LANGUAGE sql AS $$
 INSERT INTO ec_events(id,tenant_id,document_id,related_document_id,event_type,actor_uid,operation_id,before_version,after_version,details,occurred_at)
 SELECT gen_random_uuid(),tenant_id,id,$2,$3,$4,$5,$6,version,$7,now() FROM ec_documents WHERE id=$1
$$;

CREATE OR REPLACE FUNCTION ec_item_snapshot(document uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'productId',product_id,'quantity',quantity::text,
 'unitPriceCents',unit_price_cents::text,'lineTotalCents',line_total_cents::text,'status',status,
 'participantId',participant_id,'preparation',preparation_state) ORDER BY created_at,id),'[]')
 FROM ec_items WHERE document_id=document
$$;

CREATE OR REPLACE FUNCTION ec_document_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d ec_documents;
BEGIN
 SELECT * INTO d FROM ec_documents WHERE id=NEW.id;
 PERFORM ec_require(d.received_net_cents<=d.total_cents,'TOTAL_BELOW_RECEIVED');
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS ec_guard_document_total ON ec_documents;
CREATE CONSTRAINT TRIGGER ec_guard_document_total AFTER INSERT OR UPDATE ON ec_documents DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ec_document_guard();

COMMIT;

-- Native wrapper for SQL Connect's scalar _execute compilation. The original
-- permission upsert and its audit remain one transaction with invoker rights.
BEGIN;

CREATE OR REPLACE FUNCTION platform_set_role_permission(actor_uid text, payload jsonb, session_secret text)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_catalog AS $$
DECLARE actor users; applied integer;
BEGIN
 SELECT u.* INTO actor FROM users u
 JOIN tenants t ON t.id=u.tenant_id AND t.active AND t.deleted_at IS NULL
 JOIN roles r ON r.id=u.role_id AND r.tenant_id=u.tenant_id AND r.active AND r.deleted_at IS NULL
 JOIN user_device_sessions s ON s.user_id=u.id AND s.tenant_id=u.tenant_id
 WHERE u.id=actor_uid AND u.active AND u.deleted_at IS NULL
 AND (u.blocked_until IS NULL OR u.blocked_until<=now())
 AND session_secret ~ '^[a-f0-9]{64}$'
 AND s.session_token=encode(sha256(convert_to(session_secret,'UTF8')),'hex')
 AND s.last_seen_at>now()-interval '15 minutes' AND s.claimed_at>now()-interval '12 hours'
 FOR SHARE OF s,u,t,r;
 IF actor.id IS NULL THEN RAISE EXCEPTION 'SESSION_REQUIRED' USING ERRCODE='P0001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM roles r WHERE r.id=actor.role_id AND r.tenant_id=actor.tenant_id
  AND r.active AND r.deleted_at IS NULL AND r.system_role AND r.name='Administrador da Plataforma')
 THEN RAISE EXCEPTION 'ACCESS_DENIED' USING ERRCODE='P0001'; END IF;

 WITH i AS (SELECT COALESCE(payload,'{}'::jsonb) j,actor.id actor_id),
 valid AS (SELECT r.id role_id,r.tenant_id,(i.j->>'pageId')::uuid page_id,i.j,i.actor_id FROM roles r CROSS JOIN i
  JOIN app_pages p ON p.id=(i.j->>'pageId')::uuid AND p.active
  WHERE r.id=(i.j->>'roleId')::uuid AND r.active AND r.deleted_at IS NULL),
 changed AS (INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_update,can_delete,can_export,can_manage,created_at,updated_at)
  SELECT role_id,page_id,tenant_id,COALESCE((j->>'canAccess')::boolean,false),COALESCE((j->>'canCreate')::boolean,false),
   COALESCE((j->>'canUpdate')::boolean,false),COALESCE((j->>'canDelete')::boolean,false),COALESCE((j->>'canExport')::boolean,false),
   COALESCE((j->>'canManage')::boolean,false),now(),now() FROM valid
  ON CONFLICT(role_id,page_id) DO UPDATE SET can_access=EXCLUDED.can_access,can_create=EXCLUDED.can_create,
   can_update=EXCLUDED.can_update,can_delete=EXCLUDED.can_delete,can_export=EXCLUDED.can_export,
   can_manage=EXCLUDED.can_manage,updated_at=now()
  RETURNING role_id,page_id,tenant_id,can_access,can_create,can_update,can_delete,can_export,can_manage)
 INSERT INTO audit_logs(id,tenant_id,user_id,module,page_key,action,entity_name,entity_id,summary,success,origin,after_data,created_at)
 SELECT gen_random_uuid(),c.tenant_id,v.actor_id,'Plataforma','PLATFORM_ADMIN','UPDATE_PERMISSION','Role',c.role_id::text,
  'Permissão do perfil atualizada',true,'SQL_CONNECT',
  jsonb_build_object('pageId',c.page_id,'canAccess',c.can_access,'canCreate',c.can_create,'canUpdate',c.can_update,
   'canDelete',c.can_delete,'canExport',c.can_export,'canManage',c.can_manage),now()
 FROM changed c JOIN valid v ON v.role_id=c.role_id AND v.page_id=c.page_id;
 GET DIAGNOSTICS applied=ROW_COUNT;
 RETURN applied;
END $$;

COMMIT;

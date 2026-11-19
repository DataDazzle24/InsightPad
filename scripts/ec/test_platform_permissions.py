"""Real SQL Connect + PG18 regression for the permission matrix; synthetic data only."""
import json,pathlib,sys,unittest,uuid
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from runtime_support import Runtime,IDS,ROOT

class PermissionRuntimeTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.runtime=Runtime(additional_mutations=['SetPlatformRolePermission'],additional_queries=['GetCurrentUserAccess']);cls.r=cls.runtime.__enter__()
  cls.r.sql((ROOT/'dataconnect/migrations/20261119-platform-role-permission.sql').read_text())
 @classmethod
 def tearDownClass(cls):cls.runtime.__exit__(None,None,None)
 def setUp(self):
  self.r.reset();self.target_tenant=str(uuid.uuid5(uuid.NAMESPACE_DNS,'permission.synthetic.tenant'));self.target_role=str(uuid.uuid5(uuid.NAMESPACE_DNS,'permission.synthetic.role'))
  self.r.sql("UPDATE roles SET name='Administrador da Plataforma',system_role=true WHERE id='"+IDS['role']+"';"+
   "INSERT INTO tenants(id,legal_name,timezone,currency_code,created_at,updated_at) VALUES('"+self.target_tenant+"','Synthetic permission target','America/Sao_Paulo','BRL',now(),now());"+
   "INSERT INTO roles(id,tenant_id,name,system_role,hierarchy_level,created_at,updated_at) VALUES('"+self.target_role+"','"+self.target_tenant+"','Synthetic administrator',false,100,now(),now());"+
   "INSERT INTO users(id,tenant_id,role_id,name,email,created_at,updated_at) VALUES('permission-target','"+self.target_tenant+"','"+self.target_role+"','Synthetic target','target@example.invalid',now(),now());"+
   "INSERT INTO user_device_sessions(user_id,tenant_id,session_token,device_id,claimed_at,last_seen_at) VALUES('permission-target','"+self.target_tenant+"',encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex'),'synthetic',now(),now());")
 def scalar(self,sql):return self.r.sql(sql)
 def page(self,key):return self.scalar("SELECT id FROM app_pages WHERE page_key='"+key+"';")
 def payload(self,key='COMANDAS',**flags):return {'roleId':self.target_role,'pageId':self.page(key),'canAccess':True,'canCreate':False,'canUpdate':False,'canDelete':False,'canExport':False,'canManage':False,**flags}
 def request(self,payload=None,**options):return self.r.operation('SetPlatformRolePermission',{'payload':payload or self.payload()},True,**options)
 def accepted(self,payload=None):
  result=self.request(payload);self.assertFalse(result.get('errors'),result);self.assertEqual(result['data']['_execute'],1);return result
 def unchanged(self):self.assertEqual(self.scalar("SELECT (SELECT count(*) FROM role_page_permissions WHERE role_id='"+self.target_role+"')||':'||(SELECT count(*) FROM audit_logs WHERE action='UPDATE_PERMISSION');"),'0:0')
 def test_new_permission_and_audit_are_created_for_each_new_page(self):
  for key in ['COMANDAS','ENCOMENDAS']:
   self.accepted(self.payload(key));page=self.page(key)
   permission=json.loads(self.scalar("SELECT row_to_json(p) FROM role_page_permissions p WHERE role_id='"+self.target_role+"' AND page_id='"+page+"';"))
   self.assertTrue(permission['can_access']);self.assertFalse(permission['can_manage']);self.assertEqual(permission['tenant_id'],self.target_tenant)
   audit=json.loads(self.scalar("SELECT row_to_json(a) FROM audit_logs a WHERE after_data->>'pageId'='"+page+"';"));self.assertEqual(audit['user_id'],'actor');self.assertEqual(audit['tenant_id'],self.target_tenant);self.assertEqual(audit['entity_id'],self.target_role)
 def test_existing_permission_updates_without_duplicate_rows(self):
  self.accepted();self.accepted(self.payload(canCreate=True,canUpdate=True));self.assertEqual(self.scalar("SELECT count(*)||':'||bool_and(can_create AND can_update)::text FROM role_page_permissions WHERE role_id='"+self.target_role+"';"),'1:true');self.assertEqual(self.scalar("SELECT count(*) FROM audit_logs WHERE action='UPDATE_PERMISSION';"),'2')
 def test_access_can_be_revoked_and_other_permissions_are_preserved(self):
  before=self.scalar("SELECT jsonb_agg(to_jsonb(p) ORDER BY role_id,page_id) FROM role_page_permissions p;");self.accepted();self.accepted(self.payload(canAccess=False))
  self.assertEqual(self.scalar("SELECT can_access FROM role_page_permissions WHERE role_id='"+self.target_role+"';"),'f');self.assertEqual(self.scalar("SELECT jsonb_agg(to_jsonb(p) ORDER BY role_id,page_id) FROM role_page_permissions p WHERE role_id<>'"+self.target_role+"';"),before)
 def test_non_platform_admin_cannot_grant_by_forging_payload(self):
  payload=self.payload(actorId='actor',tenantId=IDS['tenant'],isPlatformAdmin=True)
  result=self.request(payload,actor='permission-target',token='b'*64);self.assertTrue(result.get('errors'));self.unchanged()
 def test_role_name_alone_does_not_authorize(self):
  self.r.sql("UPDATE roles SET system_role=false WHERE id='"+IDS['role']+"';");result=self.request();self.assertTrue(result.get('errors'));self.unchanged()
 def test_missing_wrong_and_displaced_sessions_cannot_write(self):
  for token in ['',None,'f'*64]:
   result=self.request(token=token);self.assertTrue(result.get('errors'));self.unchanged()
 def test_expired_and_inactive_actor_sessions_cannot_write(self):
  self.r.sql("UPDATE user_device_sessions SET last_seen_at=now()-interval '16 minutes' WHERE user_id='actor';");self.assertTrue(self.request().get('errors'));self.unchanged()
  self.r.sql("UPDATE user_device_sessions SET last_seen_at=now() WHERE user_id='actor';UPDATE users SET active=false WHERE id='actor';");self.assertTrue(self.request().get('errors'));self.unchanged()
 def test_inactive_page_and_role_return_zero_without_audit(self):
  self.r.sql("UPDATE app_pages SET active=false WHERE page_key='COMANDAS';");result=self.request();self.assertFalse(result.get('errors'));self.assertEqual(result['data']['_execute'],0);self.unchanged()
  self.r.sql("UPDATE app_pages SET active=true WHERE page_key='COMANDAS';UPDATE roles SET active=false WHERE id='"+self.target_role+"';");result=self.request();self.assertFalse(result.get('errors'));self.assertEqual(result['data']['_execute'],0);self.unchanged()
 def test_audit_failure_rolls_back_permission(self):
  self.r.sql("ALTER TABLE audit_logs ADD CONSTRAINT synthetic_permission_audit_failure CHECK(action<>'UPDATE_PERMISSION');")
  try:self.assertTrue(self.request().get('errors'));self.unchanged()
  finally:self.r.sql('ALTER TABLE audit_logs DROP CONSTRAINT synthetic_permission_audit_failure;')
 def test_direct_native_function_still_requires_session(self):
  payload=json.dumps(self.payload())
  with self.assertRaisesRegex(RuntimeError,'SESSION_REQUIRED'):self.r.sql("SELECT platform_set_role_permission('actor','"+payload+"'::jsonb,'invalid');")
  self.unchanged()
 def test_target_tenant_is_derived_from_role_and_native_function_is_invoker(self):
  self.accepted(self.payload(tenantId=IDS['tenant']));self.assertEqual(self.scalar("SELECT tenant_id FROM role_page_permissions WHERE role_id='"+self.target_role+"';"),self.target_tenant);self.assertEqual(self.scalar("SELECT prosecdef FROM pg_proc WHERE proname='platform_set_role_permission';"),'f')
 def test_grant_is_visible_in_actual_access_query_and_ec_read(self):
  denied=self.r.operation('EcRead',{'input':{'kind':'COMANDA','mode':'LIST'}},actor='permission-target',token='b'*64);self.assertTrue(denied.get('errors'))
  self.accepted();access=self.r.post('/v1/projects/demo-insightpad-ec/locations/southamerica-east1/services/insightpad/connectors/app:executeQuery',{'operationName':'GetCurrentUserAccess','variables':{}},actor='permission-target');self.assertFalse(access.get('errors'),access)
  permissions=access['data']['user']['role']['rolePagePermissions_on_role'];self.assertTrue(any(p['page']['pageKey']=='COMANDAS' and p['canAccess'] for p in permissions))
  allowed=self.r.operation('EcRead',{'input':{'kind':'COMANDA','mode':'LIST'}},actor='permission-target',token='b'*64);self.assertFalse(allowed.get('errors'),allowed)

if __name__=='__main__':unittest.main(verbosity=2)

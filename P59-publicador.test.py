"""Offline guards and complete simulated P59; no Google credentials or writes."""
import contextlib,copy,hashlib,importlib.util,io,json,pathlib,shutil,tempfile,unittest
from unittest.mock import Mock,patch
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('fix',HERE/'P59-publicar.py');f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f);p=f.p

class GuardTests(unittest.TestCase):
 def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.r=f.Release(self.root)
 def test_contract_only_changes_the_permission_mutation_file(self):
  contracts=f.contracts();before=contracts['base'];after=contracts['candidate'];self.assertEqual(before['schemas/main'],after['schemas/main']);changed=[k for k,v in before['connectors/app'].items() if v!=after['connectors/app'][k]];self.assertEqual(changed,['mutations.gql'])
 def test_no_schema_or_arbitrary_connector_patch(self):
  self.r.body={'approved':True}
  with patch.object(p.Release,'api',side_effect=AssertionError('No network')):
   for path,body in [('/schemas/main',self.r.body),('/connectors/app',{'other':True}),('/connectors/other',self.r.body)]:
    with self.assertRaises(RuntimeError):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+path,'PATCH',body,{'updateMask':'source'})
 def test_connector_publish_requires_function_and_native_contract(self):
  self.r.body={'approved':True}
  with patch.object(p.Release,'api',side_effect=AssertionError('No network')):
   with self.assertRaisesRegex(RuntimeError,'não verificados'):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/connectors/app','PATCH',self.r.body,{'updateMask':'source'})
 def test_validate_only_connector_never_records_mutation(self):
  self.r.body={'approved':True};self.r.access_token=lambda:'offline'
  response=Mock();response.__enter__=lambda s:io.StringIO('{}');response.__exit__=lambda *a:None;opener=Mock();opener.open.return_value=response
  with patch.object(p.urllib.request,'build_opener',return_value=opener):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/connectors/app','PATCH',self.r.body,{'validateOnly':'true','updateMask':'source'},validation=True)
  self.assertFalse(self.r.record['remoteMutationAttempted']);self.assertIn('validateOnly=true',opener.open.call_args.args[0].full_url)
 def test_only_exact_function_sql_can_be_written_once(self):
  self.r.native='approved';self.r.record['SQLFunctionIntentRecorded']=True
  with patch.object(p.Release,'sql',return_value=[]) as sql:
   with self.assertRaises(RuntimeError):self.r.sql(['DELETE FROM users'],False)
   self.r.sql(['approved'],False);self.assertEqual(sql.call_count,1)
   self.r.record['nativeFunctionInstalled']=True
   with self.assertRaises(RuntimeError):self.r.sql(['approved'],False)
 def test_write_intent_is_mandatory(self):
  self.r.native='approved'
  with patch.object(p.Release,'sql',side_effect=AssertionError('No SQL')):
   with self.assertRaises(RuntimeError):self.r.sql(['approved'],False)
 def test_changed_function_file_is_refused(self):
  path=self.root/'dataconnect/migrations';path.mkdir(parents=True);(path/f.MIGRATION).write_text('changed')
  with self.assertRaisesRegex(RuntimeError,'SQL diferente'):f.migration_body(self.root)
 def test_existing_ec_contract_must_match(self):
  self.r.sql=Mock(return_value=[{'rows':[]}])
  with self.assertRaisesRegex(RuntimeError,'Estrutura EC divergiu'):self.r.check_native('test')
 def test_function_body_owner_and_invoker_privileges_are_checked(self):
  self.r.native='CREATE FUNCTION f() RETURNS void AS $$body$$ LANGUAGE plpgsql;'
  valid={'body_hash':hashlib.md5(b'body').hexdigest(),'prosecdef':False,'proconfig':['search_path=public, pg_catalog'],'return_type':'integer','owner':p.OWNER,'service_can_execute':True}
  for key,value in [('prosecdef',True),('owner','other'),('service_can_execute',False),('body_hash','other')]:
   row={**valid,key:value};self.r.function_metadata=Mock(return_value=[row])
   with self.assertRaises(RuntimeError):self.r.check_function()
  self.r.function_metadata=Mock(return_value=[valid]);self.r.check_function();self.assertTrue(self.r.record['nativeFunctionVerified'])
 def test_previous_intent_blocks_blind_rerun(self):
  old=self.root/'P59-old';old.mkdir();(old/'P59-publicacao.json').write_text('{"remoteMutationAttempted":true}')
  with patch.object(f,'ROOT',self.root):
   with self.assertRaisesRegex(RuntimeError,'já registrou mutação'):f.prior_writes()
 def test_missing_existing_service_rights_stops_without_grants(self):
  self.r.db_service_user='existing';self.r.sql=Mock(return_value=[{'rows':[{'allowed':False}]}])
  with self.assertRaisesRegex(RuntimeError,'nenhum grant automático'):self.r.check_service_rights()
  self.assertFalse(self.r.record['remoteMutationAttempted']);self.assertEqual(self.r.sql.call_count,1)

class FlowTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.r=f.Release(self.root);self.events=[]
  self.work=self.root/'work';self.work.mkdir();self.content='approved mutation';self.contract={'schemas/main':{'schema.gql':'unchanged'},'connectors/app':{'mutations.gql':p.digest(self.content.encode())}}
  self.first={'node22':{'path':shutil.which('node')},'publicVersionBefore':{'commit':f.BASE},'previousRelease':{'name':'projects/'+p.P+'/sites/'+p.P+'/channels/live/releases/1795095245898000','version':'projects/'+p.P+'/sites/'+p.P+'/versions/f476efc58747f630'},'servingConfigSHA256':'config'}
  self.snapshot={'schemas-main':{'source':'unchanged','datasources':[{'postgresql':{'schemaValidation':'NONE'}}]},'x-policy':{'etag':'same'}}
  self.r.preflight=Mock(side_effect=lambda label:(copy.deepcopy(self.first),copy.deepcopy(self.snapshot)));self.r.permissions=Mock();self.r.cloud_sql=Mock();self.r.db_service_user='existing';self.r.poll=lambda result:result
  def command(args,**kw):
   if args[:3]==['git','init','-q']:
    source=pathlib.Path(args[3]);(source/'dataconnect/app').mkdir(parents=True);(source/'dataconnect/app/mutations.gql').write_text(self.content);(source/'dataconnect/migrations').mkdir();(source/'dataconnect/migrations'/f.MIGRATION).write_bytes((HERE/'P59-approved-function.sql').read_bytes())
   return f.SHA if 'rev-parse' in args else ''
  self.r.command=command
 def execute(self,fail_sql=False,fail_validation=False):
  outer=self
  def sql(r,statements,read_only=True,owner=True):
   text=statements[0]
   if not read_only:
    self.assertEqual(statements,[r.native]);self.assertTrue(json.loads(r.path.read_text())['SQLFunctionIntentRecorded']);outer.events.append('SQL-function')
    if fail_sql:raise RuntimeError('Synthetic SQL failure')
    return []
   if text==f.m.CATALOG:return [{'rows':f.m.native_contract()}]
   if text==f.m.COLUMNS:return []
   if text==f.m.ACL:return [{'rows':[{'roles':'same'}]}]
   if 'has_table_privilege' in text:return [{'rows':[{'allowed':True}]}]
   if 'current_database() AS db' in text:return [{'rows':[{'db':p.DATABASE,'usr':p.OPERATOR,'owner':True}]}]
   if 'platform_set_role_permission' in text:
    rows=[]
    if r.record.get('nativeFunctionInstalled'):rows=[{'body_hash':hashlib.md5(r.native.split('$$')[1].encode()).hexdigest(),'prosecdef':False,'proconfig':['search_path=public, pg_catalog'],'return_type':'integer','owner':p.OWNER,'service_can_execute':True}]
    return [{'rows':rows}]
   raise AssertionError('Unexpected SQL')
  def api(r,host,path,method='GET',body=None,query=None,**kw):
   if kw.get('validation'):outer.events.append('validate-connector');return {'validationError':{'error':{'status':'INVALID_ARGUMENT'}}} if fail_validation else {}
   outer.events.append('publish-connector');return {}
  with patch.object(p,'verify_ci',return_value={'passed':True}),patch.object(f,'contracts',return_value={'base':self.contract,'candidate':self.contract}),patch.object(f.tempfile,'mkdtemp',return_value=str(self.work)),patch.object(p.Release,'sql',sql),patch.object(p.Release,'api',api),contextlib.redirect_stdout(io.StringIO()):f.publish(self.r)
 def test_complete_flow_has_one_function_write_and_one_connector_update(self):
  self.execute();self.assertEqual(self.events,['SQL-function','validate-connector','publish-connector']);self.assertTrue(self.r.record['publicationComplete']);self.assertTrue(self.r.record['hostingUnchanged']);self.assertFalse(self.r.record['permissionsAutomaticallyGranted']);self.assertFalse(self.r.record['hostingPublished']);self.assertFalse(self.r.record['schemaPublished'])
 def test_failed_sql_does_not_publish_connector(self):
  with self.assertRaisesRegex(RuntimeError,'Synthetic SQL failure'):self.execute(fail_sql=True)
  self.assertEqual(self.events,['SQL-function']);self.assertFalse(self.r.record['connectorPublished'])
 def test_failed_validation_preserves_hosting_and_does_not_publish_connector(self):
  with self.assertRaisesRegex(RuntimeError,'Validação do connector'):self.execute(fail_validation=True)
  self.assertEqual(self.events,['SQL-function','validate-connector']);self.assertFalse(self.r.record['connectorPublished']);self.assertFalse(self.r.record['hostingPublished'])

if __name__=='__main__':unittest.main(verbosity=2)

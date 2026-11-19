"""Offline publication safety tests. No cloud mutations or credentials."""
import copy,datetime as dt,importlib.util,io,json,pathlib,shutil,subprocess,tempfile,unittest,urllib.error
from contextlib import redirect_stdout
from unittest.mock import Mock,patch
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('publisher',HERE/'P58-publicar.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p);H=p.H
NODE=shutil.which('node')
def parse(sql):
 r=subprocess.run([NODE,str(HERE/'P58-sql.cjs')],input=json.dumps({'mode':'parse','sql':sql}),capture_output=True,text=True,timeout=30);assert r.returncode==0,r.stdout;return json.loads(r.stdout)['result']

class DiffTests(unittest.TestCase):
 def check(self,sql,**changes):
  d={'sql':sql,'destructive':False,**changes};p.validate_diff([d],[parse(sql)],{'ec_documents'})
 def test_additive_official_diff(self):self.check('CREATE TABLE public.ec_documents(id uuid PRIMARY KEY);')
 def test_omitted_protobuf_false_is_still_validated_by_ast(self):p.validate_diff([{'sql':'CREATE TABLE ec_documents(id uuid);'}],[parse('CREATE TABLE ec_documents(id uuid);')],{'ec_documents'})
 def test_destructive_flag_rejected(self):
  with self.assertRaises(RuntimeError):self.check('CREATE TABLE ec_documents(id uuid);',destructive=True)
 def test_legacy_table_rejected(self):
  with self.assertRaises(RuntimeError):self.check('CREATE TABLE users(id uuid);')
 def test_prod_schema_rejected(self):
  with self.assertRaises(RuntimeError):self.check('CREATE TABLE other.ec_documents(id uuid);')
 def test_embedded_dml_rejected(self):
  with self.assertRaises(RuntimeError):self.check('CREATE TABLE ec_documents(id uuid); DELETE FROM users;')
 def test_embedded_transaction_rejected(self):
  with self.assertRaises(RuntimeError):self.check('CREATE TABLE ec_documents(id uuid); COMMIT;')
 def test_destructive_alter_rejected(self):
  with self.assertRaises(RuntimeError):self.check('CREATE TABLE ec_documents(id uuid); ALTER TABLE ec_documents DROP COLUMN id;')
 def test_new_ec_column_is_allowed(self):self.check('CREATE TABLE ec_documents(id uuid); ALTER TABLE ec_documents ADD COLUMN x bigint;')
 def test_missing_expected_table_rejected(self):
  with self.assertRaises(RuntimeError):p.validate_diff([{'sql':'x'}],[parse('CREATE TABLE ec_documents(id uuid);')],{'ec_documents','ec_items'})
 def test_comments_and_quoted_semicolons_are_not_split_as_sql(self):self.check("CREATE TABLE ec_documents(id uuid,notes text DEFAULT 'a;b'); -- DELETE FROM users")
 def test_native_transaction_is_one_outer_transaction(self):
  self.assertEqual(p.native_body('-- header\nBEGIN; SELECT 1; COMMIT;\n'),'SELECT 1; ')
  for s in ['SELECT 1','BEGIN;SELECT 1','SELECT 1;COMMIT;']:
   with self.assertRaises(RuntimeError):p.native_body(s)

class ApiTests(unittest.TestCase):
 def setUp(self):self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.r=p.Release(pathlib.Path(self.temp.name))
 def test_refuses_prod_before_requesting_token(self):
  self.r.access_token=Mock(side_effect=AssertionError('No token'))
  with self.assertRaises(RuntimeError):self.r.api('firebasedataconnect.googleapis.com','/v1/projects/insightpad-dd/locations/southamerica-east1/services/insightpad/schemas/main')
 def test_refuses_similar_service_prefix(self):
  with self.assertRaises(RuntimeError):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'-other/schemas/main')
 def test_never_writes_sql_users_or_iam(self):
  for host,path in [('sqladmin.googleapis.com','/sql/v1beta4/projects/'+p.P+'/instances/insightpad-fdc/users'),('iam.googleapis.com','/v1/roles/cloudsql.admin')]:
   with self.assertRaises(RuntimeError):self.r.api(host,path,'POST',{})
 def test_validation_cannot_hide_a_real_mutation(self):
  with self.assertRaises(RuntimeError):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',{},validation=True)
  self.assertFalse(self.r.record['remoteMutationAttempted'])
 def test_schema_intent_is_saved_before_uncertain_request(self):
  self.r.access_token=lambda:'offline-secret'
  opener=Mock();opener.open.side_effect=urllib.error.URLError('Synthetic timeout')
  with patch.object(p.urllib.request,'build_opener',return_value=opener):
   with self.assertRaises(RuntimeError):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',{})
  saved=json.loads(self.r.path.read_text());self.assertTrue(saved['remoteMutationAttempted']);self.assertTrue(saved['remoteOutcomeUncertain']);self.assertNotIn('offline-secret',self.r.path.read_text());self.assertEqual(opener.open.call_count,1)
 def metadata(self,backup=True,user=True,pitr=True):
  now=dt.datetime.now(dt.timezone.utc)
  return [dict(project=p.P,region=p.R,databaseVersion='POSTGRES_17',connectionName=p.P+':'+p.R+':insightpad-fdc',state='RUNNABLE',settings={'databaseFlags':[{'name':'cloudsql.iam_authentication','value':'on'}],'backupConfiguration':{'pointInTimeRecoveryEnabled':pitr}},ipAddresses=[{'type':'PRIMARY'}]),{'items':([{'name':p.OPERATOR,'type':'CLOUD_IAM_USER'}] if user else [])+[{'name':'service-'+p.N+'@gcp-sa-firebasedataconnect.iam','type':'CLOUD_IAM_SERVICE_ACCOUNT'}]},{'items':[{'id':'123','instance':'insightpad-fdc','status':'SUCCESSFUL','endTime':(now-dt.timedelta(hours=2 if backup else 25)).isoformat()}]}]
 def test_existing_sql_access_and_backup_are_read_only(self):
  self.r.api=Mock(side_effect=self.metadata());self.r.cloud_sql();self.assertFalse(self.r.record['remoteMutationAttempted']);self.assertEqual(self.r.sql_config['user'],p.OPERATOR)
 def test_missing_iam_user_never_triggers_creation(self):
  self.r.api=Mock(side_effect=self.metadata(user=False))
  with self.assertRaisesRegex(RuntimeError,'usuário IAM SQL'):self.r.cloud_sql()
  self.assertFalse(self.r.record['remoteMutationAttempted'])
 def test_old_backup_or_missing_pitr_blocks_migration(self):
  for kw in [{'backup':False},{'pitr':False}]:
   self.r.api=Mock(side_effect=self.metadata(**kw))
   with self.assertRaisesRegex(RuntimeError,'Backup'):self.r.cloud_sql()
 def test_prior_journal_blocks_a_second_publication(self):
  root=pathlib.Path(self.temp.name);old=root/'P58-old';old.mkdir();(old/'P58-publicacao.json').write_text('{"remoteMutationAttempted":true}')
  with patch.object(p,'ROOT',root),patch.object(p,'main',side_effect=AssertionError('Must not restart')),redirect_stdout(io.StringIO()):self.assertEqual(p.run_locked(),2)
 def test_sql_bridge_refuses_another_target_without_network(self):
  r=subprocess.run([NODE,str(HERE/'P58-sql.cjs')],input=json.dumps({'mode':'sql','sql':['SELECT 1'],'readOnly':True,'owner':True,'instance':'insightpad-dd:southamerica-east1:insightpad-fdc','database':'fdcdb','user':p.OPERATOR}),capture_output=True,text=True,timeout=30);self.assertNotEqual(r.returncode,0);self.assertEqual(json.loads(r.stdout)['code'],'TARGET_DENIED')
 def test_auth_denial_accepts_real_rpc_and_graphql_shapes(self):
  for value in [{'code':16,'message':'unauthenticated: this operation requires a signed-in user'},{'errors':[{'message':'@auth rejected the request','extensions':{'code':'UNAUTHENTICATED'}}]},{'error':{'status':'UNAUTHENTICATED'}}]:self.assertTrue(p.authentication_denied(value))
  self.assertFalse(p.authentication_denied({'error':{'status':'PERMISSION_DENIED','message':'Missing IAM permission'}}))

class HostingTests(unittest.TestCase):
 def client(self):
  c=Mock();c.version='sites/'+p.P+'/versions/current';c.live.return_value=c.version;return c
 def test_hash_check_never_accepts_only_version_marker(self):
  c=self.client();files={'/version.json':{'rawSHA256':H.digest(b'v')},'/a.js':{'rawSHA256':H.digest(b'j')}};report={}
  with self.assertRaises(RuntimeError):H.wait_public(c,files,report,lambda:None,read=lambda path,n:(b'v' if path.endswith('.json') else b'HTML',{}),clock=lambda:0,pause=lambda t:None,attempt_limit=2)
  self.assertEqual(len(report['publicReadAttempts']),2)
 def test_candidate_hash_upload_is_deduplicated(self):
  parts,paths=H.bounded_uploads({'/a':{'data':b'x'},'/b':{'data':b'x'}});self.assertEqual(len(parts),1);self.assertEqual(paths['/a'],paths['/b'])
 def test_redirect_outside_dev_is_refused(self):
  with self.assertRaises(RuntimeError):H.canonical_destination('https://insightpad-dd.web.app/','https://'+H.HOST+'/index.html','n')
 def test_concurrent_release_stops_verification(self):
  c=self.client();c.live.return_value='sites/'+p.P+'/versions/other'
  with self.assertRaises(RuntimeError):H.wait_public(c,{'/a':{'rawSHA256':H.digest(b'x')}},{},lambda:None,read=lambda *a:None)
 def test_serving_config_changes_are_refused(self):
  state={'operationLabel':'p58-test','servingConfigSHA256':H.config_hash({'rewrites':[]})};c=H.Hosting('offline',state,lambda:None);c.version='sites/'+p.P+'/versions/test'
  with self.assertRaises(RuntimeError):c.api('/v1beta1/'+c.version,'PATCH',{'status':'FINALIZED','config':{'rewrites':[{'glob':'**','path':'/other'}]}},{'updateMask':'status,config'})

class OrchestrationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.folder=pathlib.Path(self.temp.name);self.r=p.Release(self.folder);self.events=[];self.applied=False
  self.ec={'ec_documents'};self.base={'old_table'}
  self.source=self.folder/'source';(self.source/'dataconnect/schema').mkdir(parents=True);(self.source/'dataconnect/app').mkdir();(self.source/'dataconnect/migrations').mkdir()
  schema='\n'.join(f'type Old{i} @table(name: "old{i}") {{ id: UUID! }}' for i in range(53))+'\n# Encomendas e Comandas:\n'+'\n'.join(f'type Ec{i} @table(name: "ec_{i}") {{ id: UUID! }}' for i in range(17))
  self.base={'old'+str(i) for i in range(53)};self.ec={'ec_'+str(i) for i in range(17)}
  (self.source/'dataconnect/schema/schema.gql').write_text(schema);(self.source/'dataconnect/app/queries.gql').write_text('query EcRead {\n  user\n}')
  for name in p.MIGRATIONS:(self.source/'dataconnect/migrations'/name).write_text('BEGIN; SELECT 1; COMMIT;')
  self.version='sites/'+p.P+'/versions/new';self.live='projects/'+p.P+'/sites/'+p.P+'/versions/07318b898d5f5729';self.config={'cleanUrls':True,'rewrites':[{'glob':'**','path':'/index.html'}],'headers':[{'glob':'**','headers':{'Content-Security-Policy':'self','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff'}}]}
  self.first={'publicVersionBefore':{'commit':p.BASE},'previousRelease':{'name':'projects/'+p.P+'/sites/'+p.P+'/channels/live/releases/1794868621178000','version':self.live}}
  self.snapshot={'previous-version':{'config':self.config},'schemas-main':{'datasources':[{'postgresql':{'database':'fdcdb'}}]},'x-policy':{'etag':'same'}}
  def preflight(label):
   first=copy.deepcopy(self.first)
   if label=='final':first['previousRelease']['version']=self.live
   return first,copy.deepcopy(self.snapshot)
  self.r.preflight=preflight;self.r.permissions=lambda:None;self.r.cloud_sql=lambda:None;self.r.db_service_user='service-test';self.r.poll=lambda v:v
  self.r.source=self.source;self.r.parse=parse
  def sql(statements,read_only=True,owner=True):
   if not read_only:
    self.events.append('SQL');self.applied=True;return []
   text=statements[0]
   if 'current_database() AS db' in text:return [{'rows':[{'db':p.DATABASE,'usr':p.OPERATOR,'owner':True}]}]
   if 'SELECT tablename' in text:return [{'rows':[{'tablename':x} for x in self.base|(self.ec if self.applied else set())]}]
   if 'pg_roles' in text:return [{'rows':[{'roles':'same'}]}]
   if 'SELECT proname' in text:return [{'rows':[{'proname':n} for n in ['ec_command','ec_read','ec_sensitive','ec_stock_guard']]}]
   if 'allowed' in text:return [{'rows':[{'allowed':True}]}]
   return [{'rows':[{'column':'unchanged'}]}]
  self.r.sql=sql
  def api(host,path,method='GET',body=None,query=None,validation=False,expected_denial=False):
   if validation:
    if self.applied:return {}
    return {'validationError':{'error':{'details':[{'@type':'IncompatibleSqlSchemaError','diffs':[{'sql':f'CREATE TABLE {name}(id uuid);'} for name in sorted(self.ec)]}]}}}
   if path.endswith(':executeGraphqlRead'):
    return {'code':16,'message':'unauthenticated'} if expected_denial else {'data':{'response':{'data':{'database':p.DATABASE,'ecTables':17}}}}
   self.events.append('schema' if path.endswith('/schemas/main') else 'connector');return {}
  self.r.api=api
  self.files={'/index.html':{'data':b'html','rawSHA256':H.digest(b'html')},'/version.json':{'data':b'version','rawSHA256':H.digest(b'version')},'/a.js':{'data':b'js','rawSHA256':H.digest(b'js')}}
  self.compressed,self.mapping=H.bounded_uploads(self.files)
  outer=self
  class Hosting:
   version=''
   def __init__(self,*args):self.version=''
   def live(self):return outer.live
   def api(self,path,method='GET',body=None,query=None):
    if path.endswith('/versions'):outer.events.append('Hosting');return {'name':outer.version}
    if path.endswith(':populateFiles'):return {'uploadRequiredHashes':[]}
    if path.endswith('/releases'):outer.events.append('release');outer.live=outer.version;return {'name':'release','releaseTime':'now'}
    return {'status':'FINALIZED'}
   def files(self,version):
    values={'/__/firebase/init.js':'a','/__/firebase/init.json':'b'}
    if version==outer.version:values.update(outer.mapping)
    return [{'path':k,'hash':v,'status':'ACTIVE'} for k,v in values.items()]
  self.Hosting=Hosting
 def execute(self):
  self.r.access_token=lambda:'offline-token'
  with patch.object(p,'verify_ci',return_value={'passed':True}),patch.object(p,'prepare',return_value=None),patch.object(p,'build',return_value=(self.files,self.compressed,self.mapping)),patch.object(H,'Hosting',self.Hosting),patch.object(H,'fetch_public',side_effect=lambda path,cfg,nonce:(self.files.get(path,self.files['/index.html'])['data'],{'Content-Type':'application/javascript' if path.endswith('.js') else 'text/html','Content-Security-Policy':'self','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'},[])),redirect_stdout(io.StringIO()):p.main(self.r)
 def test_complete_sequence_before_exposing_frontend(self):
  self.execute();self.assertEqual(self.events,['SQL']*8+['schema','connector','Hosting','release']);self.assertTrue(self.r.record['publicationComplete']);self.assertFalse(self.r.record['IAMChanged']);self.assertFalse(self.r.record['financialSmokesExecuted'])
 def test_native_failure_never_publishes_schema_connector_or_hosting(self):
  sql=self.r.sql
  def fail(statements,read_only=True,owner=True):
   if not read_only and self.applied:raise RuntimeError('Synthetic native failure')
   return sql(statements,read_only,owner)
  self.r.sql=fail
  with self.assertRaisesRegex(RuntimeError,'native failure'):self.execute()
  self.assertEqual(self.events,['SQL']);self.assertFalse(self.r.record['hostingPublished']);self.assertFalse(self.r.record['connectorPublished'])

if __name__=='__main__':unittest.main(verbosity=2)

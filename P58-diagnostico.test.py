"""Offline checks for the partial-release diagnostic; no cloud credentials."""
import copy,importlib.util,pathlib,tempfile,unittest
from unittest.mock import Mock,patch
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('diagnostic',HERE/'P58-diagnosticar-schema.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d);p=d.p

class DiagnosticTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.r=d.Diagnostic(self.root)
  self.source=self.root/'source';(self.source/'dataconnect/schema').mkdir(parents=True);(self.source/'dataconnect/migrations').mkdir();(self.source/'dataconnect/schema/schema.gql').write_text('type X { id: UUID! }')
  migrations=[]
  for name in p.MIGRATIONS:
   body='BEGIN; SELECT 1; COMMIT;';(self.source/'dataconnect/migrations'/name).write_text(body);migrations.append({'file':name,'sha256':p.digest(body.encode())})
  self.old={'project':p.P,'candidate':p.SHA,'base':p.BASE,'officialDDLApplied':True,'existingSQLPrivilegesVerified':True,'migrationsApplied':migrations,'schemaPublished':False,'connectorPublished':False,'hostingPublished':False,'publicationComplete':False,'stopped':'Ainda há divergência oficial de schema após SQL','storage':{'workspace':str(self.root)},'previousRelease':{'version':'old'},'servingConfigSHA256':'config'}
  self.schema={'name':p.SERVICE+'/schemas/main','source':{'files':[]},'datasources':[{'postgresql':{'database':p.DATABASE,'cloudSql':{'instance':'projects/'+p.P+'/locations/'+p.R+'/instances/'+p.INSTANCE},'schemaMigration':'SAFE'}}]}
  self.first={'previousRelease':self.old['previousRelease'],'publicVersionBefore':{'commit':p.BASE},'servingConfigSHA256':'config'}
  self.r.preflight=Mock(return_value=(self.first,{'schemas-main':self.schema}));self.r.command=Mock(side_effect=[p.SHA+'\n',''])
 def test_report_preserves_official_diff_without_applying_it(self):
  error={'error':{'status':'FAILED_PRECONDITION','details':[{'@type':'IncompatibleSqlSchemaError','diffs':[{'sql':'ALTER TABLE ec_items ALTER COLUMN quantity TYPE numeric;','destructive':True}]}]}}
  self.r.api=Mock(side_effect=[{'validationError':error},copy.deepcopy(self.schema)]);d.diagnose(self.r,self.old)
  self.assertTrue(self.r.record['diagnosticComplete']);self.assertFalse(self.r.record['validationPassed']);self.assertEqual(self.r.record['officialValidationError'],error);self.assertFalse(self.r.record['remoteMutationAttempted']);self.assertEqual(self.r.api.call_count,2);self.assertEqual(self.r.api.call_args_list[0].kwargs,{'validation':True});self.assertEqual(self.r.api.call_args_list[0].args[4],{'validateOnly':'true','updateMask':'source,datasources'})
 def test_validation_now_passing_does_not_publish(self):
  self.r.api=Mock(side_effect=[{},copy.deepcopy(self.schema)]);d.diagnose(self.r,self.old);self.assertTrue(self.r.record['validationPassed']);self.assertFalse(self.r.record['schemaPublished']);self.assertFalse(self.r.record['connectorPublished']);self.assertFalse(self.r.record['hostingPublished'])
 def test_all_real_mutations_rejected_before_api(self):
  with patch.object(p.Release,'api',side_effect=AssertionError('No network')):
   for host,path,method,query in [('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',{}),('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/connectors/app','GET',None),('sqladmin.googleapis.com','/sql/v1beta4/projects/'+p.P+'/instances/'+p.INSTANCE,'GET',None),('firebasedataconnect.googleapis.com','/v1/projects/insightpad-dd/schemas/main','GET',None)]:
    with self.assertRaises(RuntimeError):self.r.api(host,path,method,{},query,validation=True)
 def test_validate_only_guard_preserves_query(self):
  query={'validateOnly':'true','updateMask':'source,datasources'}
  with patch.object(p.Release,'api',return_value={}) as api:self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',{},query,validation=True)
  self.assertEqual(api.call_args.args[4],query);self.assertTrue(api.call_args.kwargs['validation'])
 def test_sql_execution_is_always_blocked(self):
  for read_only in [True,False]:
   with self.assertRaisesRegex(RuntimeError,'não executa SQL'):self.r.sql(['SELECT 1'],read_only)
 def test_incomplete_migrations_or_published_connector_refused(self):
  for field,value in [('migrationsApplied',self.old['migrationsApplied'][:-1]),('connectorPublished',True),('candidate','wrong'),('project','insightpad-dd')]:
   original=copy.deepcopy(self.old);original[field]=value
   with self.assertRaises(RuntimeError):d.check_original(original)
 def test_changed_sql_source_blocks_before_cloud_access(self):
  (self.source/'dataconnect/migrations'/p.MIGRATIONS[0]).write_text('Changed')
  with self.assertRaisesRegex(RuntimeError,'SQL local divergiu'):d.diagnose(self.r,self.old)
  self.r.preflight.assert_not_called()
 def test_changed_live_release_blocks_validation(self):
  self.first['previousRelease']={'version':'other'};self.r.api=Mock()
  with self.assertRaisesRegex(RuntimeError,'Hosting mudou'):d.diagnose(self.r,self.old)
  self.r.api.assert_not_called()
 def test_changed_schema_during_diagnostic_blocks_completion(self):
  self.r.api=Mock(side_effect=[{},{}])
  with self.assertRaisesRegex(RuntimeError,'Schema mudou'):d.diagnose(self.r,self.old)
  self.assertNotIn('diagnosticComplete',self.r.record)
 def test_redacts_token_and_rejects_private_key(self):
  self.assertEqual(d.safe_error({'message':'token=secret'},'secret'),{'message':'token=[redacted]'})
  with self.assertRaisesRegex(RuntimeError,'sensível'):d.safe_error({'private_key':'none'},'')
 def test_datasource_cannot_target_production(self):
  self.schema['datasources'][0]['postgresql']['cloudSql']['instance']='projects/insightpad-dd/locations/'+p.R+'/instances/'+p.INSTANCE
  with self.assertRaisesRegex(RuntimeError,'Datasource fora de DEV'):d.schema_request(self.source,self.schema)

if __name__=='__main__':unittest.main(verbosity=2)

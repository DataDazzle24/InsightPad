"""Offline partial-release recovery checks, including real PostgreSQL AST parsing."""
import copy,importlib.util,json,pathlib,shutil,subprocess,tempfile,unittest
from unittest.mock import Mock,patch
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('resume',HERE/'P58-retomar.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);p=m.p
NODE=shutil.which('node')
def parse(sql):
 result=subprocess.run([NODE,str(HERE/'P58-sql.cjs')],input=json.dumps({'mode':'parse','sql':sql}),text=True,capture_output=True,timeout=30)
 assert result.returncode==0,result.stdout
 return json.loads(result.stdout)['result']

class DiffTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.expected=m.native_contract();cls.fixture=json.loads((HERE/'P58-protection-diff.fixture.json').read_text())
 def error(self,sql,destructive=True):
  value=copy.deepcopy(self.fixture);next(d for d in value['error']['details'] if d['@type'].endswith('IncompatibleSqlSchemaError'))['diffs']=[{'sql':sql,'destructive':destructive}];return value
 def check(self,sql,**kw):return m.validate_protection_only(self.error(sql,**kw),parse,self.expected)
 def test_actual_35_diffs_preserve_95_protections_without_executing_sql(self):
  value=m.validate_protection_only(self.fixture,parse,self.expected);self.assertEqual(value['diffCount'],35);self.assertEqual(value['protectedObjects'],95);self.assertEqual(value['executedDiffs'],0)
 def test_drop_approved_constraint_is_classified_only(self):self.assertEqual(self.check('ALTER TABLE public.ec_documents DROP CONSTRAINT ec_doc_kind')['protectedObjects'],1)
 def test_drop_approved_index_is_classified_only(self):self.assertEqual(self.check('DROP INDEX public.ec_documents_tenant_id_id_uidx')['protectedObjects'],1)
 def test_required_addition_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('ALTER TABLE public.ec_documents ADD COLUMN missing text',destructive=False)
 def test_missing_table_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('CREATE TABLE public.ec_documents(id uuid)',destructive=False)
 def test_drop_table_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('DROP TABLE public.ec_documents')
 def test_type_change_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('ALTER TABLE public.ec_items ALTER COLUMN quantity TYPE integer')
 def test_drop_column_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('ALTER TABLE public.ec_documents DROP COLUMN id')
 def test_legacy_constraint_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('ALTER TABLE public.users DROP CONSTRAINT users_pkey')
 def test_other_schema_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('DROP INDEX other.ec_documents_tenant_id_id_uidx')
 def test_unknown_index_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('DROP INDEX public.ec_invented_index')
 def test_unknown_constraint_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('ALTER TABLE public.ec_documents DROP CONSTRAINT ec_invented_constraint')
 def test_cascade_never_selects_none(self):
  for sql in ['DROP INDEX public.ec_documents_tenant_id_id_uidx CASCADE','ALTER TABLE public.ec_documents DROP CONSTRAINT ec_doc_kind CASCADE']:
   with self.assertRaises(RuntimeError):self.check(sql)
 def test_embedded_dml_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('DROP INDEX public.ec_documents_tenant_id_id_uidx; DELETE FROM users')
 def test_duplicate_drop_never_selects_none(self):
  with self.assertRaises(RuntimeError):self.check('ALTER TABLE public.ec_documents DROP CONSTRAINT ec_doc_kind,DROP CONSTRAINT ec_doc_kind')
 def test_inaccessible_database_never_selects_none(self):
  error=copy.deepcopy(self.fixture);error['error']['details'][0]['violations'][0]['type']='INACCESSIBLE_SCHEMA'
  with self.assertRaises(RuntimeError):m.validate_protection_only(error,parse,self.expected)
 def test_connector_incompatibility_never_selects_none(self):
  error=copy.deepcopy(self.fixture);error['error']['details'][0]['violations'].append({'type':'INCOMPATIBLE_CONNECTOR'})
  with self.assertRaises(RuntimeError):m.validate_protection_only(error,parse,self.expected)
 def test_arbitrary_validation_error_never_selects_none(self):
  error=copy.deepcopy(self.fixture);error['error']['status']='INVALID_ARGUMENT'
  with self.assertRaises(RuntimeError):m.validate_protection_only(error,parse,self.expected)
 def test_unknown_error_detail_never_selects_none(self):
  error=copy.deepcopy(self.fixture);error['error']['details'].append({'@type':'GraphqlError'})
  with self.assertRaises(RuntimeError):m.validate_protection_only(error,parse,self.expected)

class ResumeTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.r=m.Resume(self.root)
 def test_no_sql_writes_even_after_contract_verified(self):
  self.r.record['nativeContractVerified']=True
  with patch.object(p.Release,'sql',side_effect=AssertionError('No SQL')):
   with self.assertRaisesRegex(RuntimeError,'não permite escrita'):self.r.sql(['DROP TABLE users'],False)
 def test_read_queries_remain_read_only(self):
  with patch.object(p.Release,'sql',return_value=[]) as sql:self.r.sql(['SELECT 1'])
  self.assertIs(sql.call_args.args[1],True)
 def test_none_without_native_attestation_stops_before_request(self):
  body={'datasources':[{'postgresql':{'schemaValidation':'NONE'}}]}
  with patch.object(p.Release,'api',side_effect=AssertionError('No request')):
   with self.assertRaisesRegex(RuntimeError,'NONE exige'):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',body,{'validateOnly':'true'},validation=True)
 def test_none_without_protection_diff_stops_before_request(self):
  self.r.record['nativeContractVerified']=True
  with patch.object(p.Release,'api',side_effect=AssertionError('No request')):
   with self.assertRaisesRegex(RuntimeError,'NONE exige'):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',{'datasources':[{'postgresql':{'schemaValidation':'NONE'}}]},validation=True)
 def test_native_metadata_mismatch_is_not_published(self):
  self.r.expected=m.native_contract();self.r.sql=Mock(return_value=[{'rows':[]}])
  with self.assertRaisesRegex(RuntimeError,'Contrato SQL nativo divergiu'):self.r.check_native('test')
  self.assertNotIn('nativeContractVerified',self.r.record);self.assertFalse(self.r.record['remoteMutationAttempted'])
 def test_native_metadata_exact_match_is_recorded(self):
  self.r.expected=m.native_contract();self.r.sql=Mock(return_value=[{'rows':copy.deepcopy(self.r.expected)}]);self.r.check_native('test');self.assertTrue(self.r.record['nativeContractVerified']);self.assertEqual(self.r.record['nativeContractChecks'],['test'])
 def test_schema_body_cannot_be_changed_after_validation(self):
  self.r.record.update(nativeContractVerified=True,protectionOnlyDiffVerified=True);self.r.check_native=Mock();self.r.schema_body={'expected':True}
  with patch.object(p.Release,'api',side_effect=AssertionError('No request')):
   with self.assertRaisesRegex(RuntimeError,'Corpo de publicação divergiu'):self.r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',{'changed':True})
 def test_ephemeral_datasource_stops(self):
  with patch.object(p.Release,'preflight',return_value=({}, {'schemas-main':{'datasources':[{'postgresql':{'ephemeral':True}}]}})):
   with self.assertRaisesRegex(RuntimeError,'efêmero'):self.r.preflight('after-schema')
 def test_native_snapshot_checked_after_backend_publication(self):
  self.r.expected=[];self.r.check_native=Mock()
  with patch.object(p.Release,'preflight',return_value=({}, {'schemas-main':{'datasources':[{'postgresql':{'ephemeral':False}}]}})):self.r.preflight('after-schema')
  self.r.check_native.assert_called_once_with('after-schema')
 def test_any_other_resume_mutation_blocks_new_attempt(self):
  old=self.root/'P58R-old';old.mkdir();(old/'P58R-publicacao.json').write_text('{"remoteMutationAttempted":true}')
  with patch.object(p,'ROOT',self.root):
   with self.assertRaisesRegex(RuntimeError,'outra intenção'):m.prior_resumes()
 def test_original_partial_mutation_is_recognized_without_deleting_it(self):
  old=self.root/m.d.OPERATION;old.mkdir();receipt=old/'P58-publicacao.json';receipt.write_text('{"remoteMutationAttempted":true}')
  with patch.object(p,'ROOT',self.root):m.prior_resumes()
  self.assertTrue(receipt.is_file())
 def test_reference_contains_all_critical_shared_guards(self):
  rows=m.native_contract();names={v['name'] for v in rows if v['kind']=='trigger'}
  self.assertEqual(names,{'stock_balances.ec_guard_balance','sales_channel_stock_reservations.ec_guard_channel','sales_channel_stock_reservations.ec_lock_channel_reservation','ec_reservations.ec_guard_reservation','ec_reservations.ec_lock_reservation','ec_documents.ec_guard_document_total'})
  self.assertTrue(all(not v['definition']['securityDefiner'] for v in rows if v['kind']=='function'))

class FlowTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.r=m.Resume(self.root)
  source=self.root/'workspace/source';(source/'dataconnect/schema').mkdir(parents=True);(source/'dataconnect/app').mkdir();(source/'dataconnect/migrations').mkdir()
  self.names=['old'+str(i) for i in range(53)]+['ec_'+str(i) for i in range(17)]
  (source/'dataconnect/schema/schema.gql').write_text('\n'.join('type T'+str(i)+' @table(name: "'+name+'") { id: UUID! }' for i,name in enumerate(self.names)))
  migrations=[]
  for name in p.MIGRATIONS:
   (source/'dataconnect/migrations'/name).write_text('BEGIN; SELECT 1; COMMIT;');migrations.append({'file':name,'sha256':p.digest(b'BEGIN; SELECT 1; COMMIT;')})
  self.old=self.root/m.d.OPERATION/'P58-publicacao.json';self.old.parent.mkdir();(self.old.parent/'legacy-structure-private.json').write_text('[]')
  self.first={'previousRelease':{'version':'previous'},'publicVersionBefore':{'commit':p.BASE},'servingConfigSHA256':'config','node22':{'path':NODE}}
  self.snapshot={'schemas-main':{'datasources':[{'postgresql':{'database':p.DATABASE,'cloudSql':{'instance':'projects/'+p.P+'/locations/'+p.R+'/instances/'+p.INSTANCE},'ephemeral':False}}]},'previous-version':{'config':{}}}
  self.files={'/a.js':{'data':b'js','rawSHA256':p.digest(b'js')}};self.compressed,self.mapping=m.H.bounded_uploads(self.files)
  self.original={'project':p.P,'candidate':p.SHA,'base':p.BASE,'officialDDLApplied':True,'existingSQLPrivilegesVerified':True,'migrationsApplied':migrations,'schemaPublished':False,'connectorPublished':False,'hostingPublished':False,'publicationComplete':False,'stopped':'Ainda há divergência oficial de schema após SQL','storage':{'workspace':str(source.parent)},'previousRelease':self.first['previousRelease'],'servingConfigSHA256':'config','publicFiles':1,'rawBytes':2,'gzipBytes':sum(map(len,self.compressed.values()))}
  self.fixture=json.loads((HERE/'P58-protection-diff.fixture.json').read_text());self.r.command=Mock(side_effect=[p.SHA+'\n','']);self.r.permissions=Mock();self.r.cloud_sql=Mock();self.r.db_service_user='existing';self.seen=[];self.metadata=m.native_contract()
 def sql(self,r,statements,read_only=True,owner=True):
  self.assertIs(read_only,True);sql=statements[0];self.seen.append(sql)
  if sql==m.CATALOG:return [{'rows':self.metadata}]
  if sql==m.COLUMNS:return []
  if sql==m.ACL:return [{'rows':[{'roles':'same'}]}]
  if 'current_database() AS db' in sql:return [{'rows':[{'db':p.DATABASE,'usr':p.OPERATOR,'owner':True}]}]
  if 'SELECT tablename' in sql:return [{'rows':[{'tablename':n} for n in self.names]}]
  if 'has_table_privilege' in sql:return [{'rows':[{'allowed':True}]}]
  raise AssertionError('Unexpected SQL')
 def execute(self):
  outer=self
  def api(r,host,path,method='GET',body=None,query=None,**kw):return {'validationError':outer.fixture} if body['datasources'][0]['postgresql']['schemaValidation']=='COMPATIBLE' else {}
  def sql(r,statements,read_only=True,owner=True):return outer.sql(r,statements,read_only,owner)
  with patch.object(p,'ROOT',self.root),patch.object(p,'verify_ci',return_value={'passed':True}),patch.object(p.Release,'preflight',return_value=(self.first,self.snapshot)),patch.object(p.Release,'sql',sql),patch.object(p.Release,'api',api),patch.object(m.H,'inspect_dist',return_value=(self.files,2)),patch.object(m.H,'check_storage'),patch.object(p,'publish_ready') as publish:
   try:m.resume(self.r,self.original,self.old)
   finally:self.publish_called=publish.called
 def test_full_resume_preparation_selects_none_only_for_actual_native_drops(self):
  self.execute();self.assertTrue(self.publish_called);self.assertEqual(self.r.schema_body['datasources'][0]['postgresql']['schemaValidation'],'NONE');self.assertEqual(self.r.record['preservedNativeProtections']['protectedObjects'],95);self.assertFalse(self.r.record['SQLMigrationsReexecuted']);self.assertFalse(self.r.record['newBuildExecuted'])
 def test_different_native_catalog_blocks_before_publication(self):
  self.metadata=[]
  with self.assertRaisesRegex(RuntimeError,'Contrato SQL nativo divergiu'):self.execute()
  self.assertFalse(self.publish_called)
 def test_required_database_change_blocks_instead_of_skipping_validation(self):
  next(v for v in self.fixture['error']['details'] if v['@type'].endswith('IncompatibleSqlSchemaError'))['diffs']=[{'sql':'ALTER TABLE public.ec_items ADD COLUMN missing text','destructive':False}]
  with self.assertRaises(RuntimeError):self.execute()
  self.assertFalse(self.publish_called);self.assertNotIn('protectionOnlyDiffVerified',self.r.record)

if __name__=='__main__':unittest.main(verbosity=2)

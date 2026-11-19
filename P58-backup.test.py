"""Backup pricing, scope, retention and one-request safety. Offline only."""
import copy,datetime as dt,importlib.util,io,json,pathlib,tempfile,unittest,urllib.error
from unittest.mock import Mock,patch
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('backup',HERE/'P58-backup.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
NOW=dt.datetime.now(dt.timezone.utc)
def sku(unit='GiBy.mo',price='0.08',region=None):
 amount=b.D(price);whole=int(amount);nano=int((amount-whole)*1000000000)
 return {'name':'services/cloudsql/skus/backup','description':'Cloud SQL Backup Storage Sao Paulo','serviceRegions':[region or b.R],'pricingInfo':[{'effectiveTime':(NOW-dt.timedelta(days=1)).isoformat(),'pricingExpression':{'usageUnit':unit,'tieredRates':[{'startUsageAmount':0,'unitPrice':{'currencyCode':'USD','units':str(whole),'nanos':nano}}]}}]}

class PricingTests(unittest.TestCase):
 def test_current_official_storage_rate_is_conservative(self):
  q=b.quote_candidates([sku()],10,NOW);self.assertGreater(b.D(q['incrementalEstimateUSD']),b.D('0.22'));self.assertLess(b.D(q['incrementalEstimateUSD']),b.LIMIT);self.assertEqual(q['cumulativeCapUSD'],5);self.assertFalse(q['cumulativeCapReset'])
 def test_hourly_storage_unit(self):self.assertEqual(b.D(b.quote_candidates([sku('GiBy.h','0.0001')],10,NOW)['incrementalEstimateUSD']),b.D('0.1920'))
 def test_future_rate_is_not_used(self):
  s=sku();future=copy.deepcopy(s['pricingInfo'][0]);future['effectiveTime']=(NOW+dt.timedelta(days=1)).isoformat();future['pricingExpression']['tieredRates'][0]['unitPrice']['units']='100';s['pricingInfo'].append(future);self.assertLess(b.D(b.quote_candidates([s],10,NOW)['incrementalEstimateUSD']),b.LIMIT)
 def test_worst_matching_rate_is_used(self):
  q=b.quote_candidates([sku(price='0.08'),sku(price='0.12')],10,NOW);self.assertEqual(q['selectedConservativeSKU']['unitPriceUSD'],'0.12')
 def test_other_region_does_not_quote_sao_paulo(self):
  with self.assertRaises(RuntimeError):b.quote_candidates([sku(region='us-central1')],10,NOW)
 def test_global_rate_is_eligible(self):self.assertEqual(len(b.quote_candidates([sku(region='global')],10,NOW)['matchingSKUs']),1)
 def test_foreign_currency_is_not_treated_as_usd(self):
  s=sku();s['pricingInfo'][0]['pricingExpression']['tieredRates'][0]['unitPrice']['currencyCode']='BRL'
  with self.assertRaises(RuntimeError):b.quote_candidates([s],10,NOW)
 def test_no_matching_or_unsupported_rate_stops(self):
  for values in [[],[sku('requests')]]:
   with self.assertRaises(RuntimeError):b.quote_candidates(values,10,NOW)
 def test_backup_name_stays_in_dev_and_accepts_project_number(self):
  self.assertEqual(b.checked_backup_name('projects/'+b.N+'/backups/snapshot'), 'projects/'+b.P+'/backups/snapshot')
  with self.assertRaises(RuntimeError):b.checked_backup_name('projects/insightpad-dd/backups/snapshot')

class SafetyTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.worker=b.Backup(pathlib.Path(self.temp.name),True);self.worker.access_token=lambda:'offline-secret';self.worker.record['pricingVerified']=True;self.worker.record['cost']={'incrementalEstimateUSD':'0.25'}
  self.body={'instance':b.I,'description':self.worker.record['operationLabel']+' '+b.SHA,'location':b.R,'ttlDays':'7'}
 def create(self,**kw):return self.worker.api('sqladmin.googleapis.com','/sql/v1beta4/projects/'+b.P+'/backups','POST',kw.get('body',self.body))
 def test_requires_explicit_execution_authorization(self):
  self.worker.authorized=False
  with self.assertRaises(RuntimeError):self.create()
  self.assertFalse(self.worker.record['backupMutationAttempted'])
 def test_no_unpriced_backup(self):
  self.worker.record['pricingVerified']=False
  with self.assertRaises(RuntimeError):self.create()
 def test_price_limit_cannot_be_bypassed(self):
  self.worker.record['cost']['incrementalEstimateUSD']='0.51'
  with self.assertRaises(RuntimeError):self.create()
  self.assertFalse(self.worker.record['backupMutationAttempted'])
 def test_wrong_instance_and_retention_are_rejected(self):
  for change in [{'instance':'prod-db'},{'ttlDays':'365'},{'location':'us-central1'}]:
   with self.assertRaises(RuntimeError):self.create(body={**self.body,**change})
 def test_production_path_never_gets_token(self):
  self.worker.access_token=Mock(side_effect=AssertionError('No token'))
  with self.assertRaises(RuntimeError):self.worker.api('sqladmin.googleapis.com','/sql/v1beta4/projects/insightpad-dd/backups','POST',self.body)
 def test_never_patches_instance_settings_or_deletes_backups(self):
  for path,method in [('/sql/v1beta4/projects/'+b.P+'/instances/'+b.I,'PATCH'),('/sql/v1beta4/projects/'+b.P+'/backups/existing','DELETE')]:
   with self.assertRaises(RuntimeError):self.worker.api('sqladmin.googleapis.com',path,method,{})
 def test_timeout_saves_one_intent_and_never_resends(self):
  opener=Mock();opener.open.side_effect=urllib.error.URLError('Synthetic lost response')
  with patch.object(b.urllib.request,'build_opener',return_value=opener):
   with self.assertRaises(RuntimeError):self.create()
   with self.assertRaises(RuntimeError):self.create()
  self.assertEqual(opener.open.call_count,1);record=json.loads(self.worker.path.read_text());self.assertTrue(record['backupMutationAttempted']);self.assertTrue(record['backupOutcomeUncertain']);self.assertNotIn('offline-secret',self.worker.path.read_text())
 def test_quote_above_limit_is_recorded_before_stopping(self):
  def api(host,path,**kw):return {'services':[{'name':'services/cloudsql','displayName':'Cloud SQL'}]} if path=='/v1/services' else {'skus':[sku(price='1.00')]}
  self.worker.api=api
  with self.assertRaisesRegex(RuntimeError,r'US\$0,50'):self.worker.quote(10)
  self.assertGreater(b.D(self.worker.record['cost']['incrementalEstimateUSD']),b.LIMIT);self.assertFalse(self.worker.record['backupMutationAttempted'])
 def verification(self,**change):
  intent=dt.datetime.now(dt.timezone.utc);self.worker.record['backupIntentUTC']=intent.isoformat()
  resource={'name':'projects/'+b.P+'/backups/one','state':'SUCCESSFUL','description':self.body['description'],'backupRun':'projects/'+b.P+'/instances/'+b.I+'/backupRuns/123','expiryTime':(intent+dt.timedelta(days=7)).isoformat(),'maxChargeableBytes':str(10*b.GIB),**change}
  legacy={'id':'123','instance':b.I,'status':'SUCCESSFUL','endTime':intent.isoformat()}
  self.worker.api=Mock(side_effect=[resource,legacy]);self.worker.verify_new_backup({'backupContext':{'name':resource['name'],'backupId':'123'}})
 def test_server_retention_and_legacy_backup_are_reconfirmed(self):
  self.verification();self.assertTrue(self.worker.record['backupReady']);self.assertFalse(self.worker.record['backup']['restoreExecuted']);self.assertEqual(self.worker.api.call_count,2)
 def test_missing_or_excessive_expiration_does_not_allow_publication(self):
  for expiry in ['',(NOW+dt.timedelta(days=365)).isoformat()]:
   with self.assertRaises(RuntimeError):self.verification(expiryTime=expiry)
   self.assertFalse(self.worker.record['backupReady'])
 def test_backup_from_another_instance_is_rejected(self):
  with self.assertRaises(RuntimeError):self.verification(backupRun='projects/'+b.P+'/instances/other/backupRuns/123')
 def test_size_above_approved_bound_blocks_migration(self):
  with self.assertRaises(RuntimeError):self.verification(maxChargeableBytes=str(11*b.GIB))
  self.assertFalse(self.worker.record['backupReady'])
 def test_cannot_publish_without_completed_backup(self):
  with self.assertRaises(RuntimeError):b.publish(self.worker)
 def test_existing_publication_intent_blocks_another_backup(self):
  root=pathlib.Path(self.temp.name);prior=root/'P58-old';prior.mkdir();(prior/'P58-publicacao.json').write_text('{"remoteMutationAttempted":true}')
  with patch.object(b,'ROOT',root):
   with self.assertRaises(RuntimeError):b.prior_publication_wrote()
 def test_known_completed_operation_is_not_submitted_again(self):
  self.worker.api=Mock(side_effect=AssertionError('No request required'))
  value={'name':'operation-1','status':'DONE','targetProject':b.P,'backupContext':{'backupId':'123'}};self.assertEqual(self.worker.poll_backup(value),value);self.assertTrue(self.worker.record['backupCreated']);self.worker.api.assert_not_called()

class SequenceTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.worker=b.Backup(pathlib.Path(self.temp.name),True);self.worker.access_token=lambda:'offline-secret';self.events=[]
  self.worker.preflight=lambda stage:({'publicVersionBefore':{'commit':b.p.BASE},'previousRelease':{'version':'projects/'+b.P+'/sites/'+b.P+'/versions/07318b898d5f5729','name':'projects/'+b.P+'/sites/'+b.P+'/channels/live/releases/1794868621178000'}},{});self.worker.permissions=lambda:None
  self.worker.sql=Mock(return_value=[{'rows':[{'db':b.p.DATABASE,'usr':b.p.OPERATOR,'owner':True}]}])
  def quote(gib):self.worker.record.update(pricingVerified=True,cost={'incrementalEstimateUSD':'0.25'});return self.worker.record['cost']
  self.worker.quote=Mock(side_effect=quote);actual_api=self.worker.api
  self.name='projects/'+b.P+'/backups/one';self.op={'name':'operation-1','status':'DONE','targetProject':b.P,'backupContext':{'backupId':'123','name':self.name}}
  class Response(io.BytesIO):
   def __enter__(response):return response
   def __exit__(response,*args):response.close()
  class Opener:
   def open(opener,request,timeout):self.events.append(request.get_method());return Response(json.dumps(self.op).encode())
  self.opener=Opener()
  def api(host,path,method='GET',body=None,**kw):
   if method=='POST' and host=='sqladmin.googleapis.com':return actual_api(host,path,method,body,**kw)
   if host=='iam.googleapis.com':return {'includedPermissions':['cloudsql.backupRuns.create']}
   if host=='cloudresourcemanager.googleapis.com':return {'permissions':['cloudsql.backupRuns.create']}
   if path.endswith('/instances/'+b.I):return {'connectionName':b.P+':'+b.R+':'+b.I,'state':'RUNNABLE','settings':{'dataDiskSizeGb':'10','backupConfiguration':{'backupTier':'STANDARD','enabled':False,'pointInTimeRecoveryEnabled':False}}}
   if path.endswith('/backupRuns'):return {'items':[]}
   if path.endswith('/operations/operation-1'):return self.op
   if path.endswith('/backups/one'):
    intent=dt.datetime.fromisoformat(self.worker.record['backupIntentUTC'])
    return {'state':'SUCCESSFUL','description':self.worker.record['operationLabel']+' '+b.SHA,'backupRun':'projects/'+b.P+'/instances/'+b.I+'/backupRuns/123','expiryTime':(intent+dt.timedelta(days=7)).isoformat(),'maxChargeableBytes':str(10*b.GIB)}
   if path.endswith('/backupRuns/123'):return {'id':'123','instance':b.I,'status':'SUCCESSFUL','endTime':dt.datetime.now(dt.timezone.utc).isoformat()}
   raise AssertionError('Unexpected '+path)
  self.worker.api=api
 def prepare(self):
  with patch.object(b,'prior_publication_wrote'),patch.object(b.p,'verify_ci',return_value={'passed':True}),patch.object(b.p,'prepare'),patch.object(b.urllib.request,'build_opener',return_value=self.opener):b.prepare_backup(self.worker)
 def test_one_completed_backup_and_configuration_unchanged(self):
  self.prepare();self.assertEqual(self.events,['POST']);self.assertTrue(self.worker.record['backupReady']);self.assertTrue(self.worker.record['backupConfigurationPreserved']);self.assertEqual(self.worker.record['backupConfigurationBefore']['enabled'],False)
 def test_resume_reads_existing_operation_without_a_second_backup(self):
  self.prepare();self.prepare();self.assertEqual(self.events,['POST']);self.worker.quote.assert_called_once();self.worker.sql.assert_called_once()
 def test_missing_sql_access_prevents_any_backup_charge(self):
  self.worker.sql.side_effect=RuntimeError('SQL denied')
  with self.assertRaisesRegex(RuntimeError,'SQL denied'):self.prepare()
  self.assertEqual(self.events,[]);self.assertFalse(self.worker.record['backupMutationAttempted'])
 def test_publication_only_after_backup_ready_and_receipt_is_preserved(self):
  self.prepare();result={'publicationComplete':True,'receipt':'private-receipt','candidate':b.SHA};lines='1/8 Readonly preflight\n=== INICIO P58 ===\n'+json.dumps(result)+'\n=== FIM P58 ===\n';process=Mock(stdout=io.StringIO(lines));process.wait.return_value=0
  with patch.object(b,'prior_publication_wrote'),patch.object(b.subprocess,'Popen',return_value=process) as child:self.assertEqual(b.publish(self.worker),0)
  self.assertTrue(self.worker.record['publicationComplete']);self.assertEqual(self.worker.record['publicationReceipt'],'private-receipt');self.assertTrue(child.call_args.args[0][-1].endswith('P58-publicar.py'))

if __name__=='__main__':unittest.main(verbosity=2)

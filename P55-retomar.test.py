import contextlib,copy,importlib.util,io,json,pathlib,tempfile,unittest
from unittest.mock import Mock,patch
path=pathlib.Path(__file__).with_name('P55-retomar.py');spec=importlib.util.spec_from_file_location('resume',path);r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
class Tests(unittest.TestCase):
 def files(self):return {'/version.json':{'rawSHA256':r.p.digest(b'version')},'/assets/test.js':{'rawSHA256':r.p.digest(b'js')}}
 def wait(self,read,live=None,limit=3):
  record={};client=Mock();client.live.return_value=live or r.VERSION;pause=Mock()
  with contextlib.redirect_stdout(io.StringIO()):r.wait_public(client,self.files(),record,lambda:None,read=read,clock=lambda:0,pause=pause,attempt_limit=limit)
  return record,pause
 def test_convergence_after_stale_public_response(self):
  read=Mock(side_effect=[(b'old-version',{}),(b'version',{}),(b'js',{})]);record,pause=self.wait(read)
  self.assertEqual(len(record['publicReadAttempts']),2);self.assertEqual(record['publicFilesVerified'],2);pause.assert_called_once_with(5)
  self.assertNotEqual(read.call_args_list[0].args[1],read.call_args_list[1].args[1])
 def test_hash_mismatch_never_bypassed(self):
  read=Mock(return_value=(b'html',{}))
  with self.assertRaisesRegex(RuntimeError,'não convergiu'):self.wait(read)
  self.assertEqual(read.call_count,3)
 def test_asset_mismatch_recorded_then_success(self):
  read=Mock(side_effect=[(b'version',{}),(b'HTML fallback',{}),(b'version',{}),(b'js',{})]);record,_=self.wait(read)
  self.assertEqual(record['publicReadAttempts'][0]['mismatch']['path'],'/assets/test.js');self.assertEqual(record['publicReadAttempts'][0]['mismatch']['bytes'],13)
 def test_concurrent_live_change_stops_reads(self):
  read=Mock()
  with self.assertRaisesRegex(RuntimeError,'Live mudou'):self.wait(read,live=r.PRIOR)
  read.assert_not_called()
 def test_concurrent_change_at_completion_stops(self):
  client=Mock();client.live.side_effect=[r.VERSION,r.PRIOR]
  with self.assertRaisesRegex(RuntimeError,'Live mudou ao concluir'):r.wait_public(client,self.files(),{},lambda:None,read=Mock(side_effect=[(b'version',{}),(b'js',{})]),clock=lambda:0,pause=Mock())
 def test_mutation_whitelist_rejects_create_populate_patch(self):
  client=r.ReleaseOnly('fake',{},lambda:None)
  for path,method in [(r.p.PREFIX+'/versions','POST'),('/v1beta1/'+r.VERSION+':populateFiles','POST'),('/v1beta1/'+r.VERSION,'PATCH')]:
   with self.assertRaisesRegex(RuntimeError,'somente release'):client.api(path,method,{},None)
 def test_upload_always_rejected(self):
  with self.assertRaisesRegex(RuntimeError,'Upload proibido'):r.ReleaseOnly('fake',{},lambda:None).upload('https://example.com','x',b'x')
 def test_release_other_version_rejected(self):
  with self.assertRaisesRegex(RuntimeError,'somente release'):r.ReleaseOnly('fake',{},lambda:None).api(r.p.PREFIX+'/channels/live/releases','POST',{'message':'test'},{'versionName':'sites/'+r.p.P+'/versions/other'})
 def test_only_two_release_targets_delegate(self):
  with patch.object(r.p.Hosting,'api',return_value={}) as api:
   for target in (r.VERSION,r.PRIOR):r.ReleaseOnly('fake',{},lambda:None).api(r.p.PREFIX+'/channels/live/releases','POST',{'message':'test'},{'versionName':target})
   self.assertEqual(api.call_count,2)
 def receipt(self):return {'project':r.p.P,'candidate':r.p.SHA,'version':r.VERSION,'previousVersion':r.PRIOR,'rollbackConfirmed':True,'hostingPublished':False,'artifactManifestSHA256':r.MANIFEST_SHA,'rollbackRelease':{'name':r.ROLLBACK_RELEASE}}
 def test_known_rollback_receipt_required(self):
  original=self.receipt();r.validate_original(original)
  for key,value in [('project','insightpad-dd'),('candidate','other'),('version',r.PRIOR),('rollbackConfirmed',False),('hostingPublished',True),('artifactManifestSHA256','bad'),('rollbackRelease',{'name':'other'})]:
   changed=copy.deepcopy(original);changed[key]=value
   with self.assertRaises(RuntimeError):r.validate_original(changed)
 def test_prior_resume_mutation_stops_before_network(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);out=root/'P55R-old';out.mkdir();(out/'P55R-publicacao.json').write_text(json.dumps({'remoteMutationAttempted':True}))
   with patch.object(r.p,'ROOT',root),patch.object(r.p,'verify_frozen_ci',side_effect=AssertionError('network forbidden')),contextlib.redirect_stdout(io.StringIO()):self.assertEqual(r.main(),2)
 def test_read_failure_stops_without_retrying_mutations(self):
  with self.assertRaisesRegex(RuntimeError,'network'):self.wait(Mock(side_effect=RuntimeError('network')))
class LifecycleTests(unittest.TestCase):
 def scenario(self,fail=False,concurrent=False):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);original=root/'P55-20261116T120210Z-ac521d';original.mkdir();source=root/'source';source.mkdir()
   files={k:{'data':v,'rawSHA256':r.p.digest(v),'rawBytes':len(v)} for k,v in {'/version.json':b'version','/index.html':b'index'}.items()}
   manifest=json.dumps({'files':{k:{a:b for a,b in v.items() if a!='data'} for k,v in files.items()}}).encode();(original/'artifact-manifest-private.json').write_bytes(manifest)
   receipt=Tests().receipt();receipt.update(sourceRoot=str(source),remoteMutationAttempted=True,artifactManifestSHA256=r.p.digest(manifest));(original/'P55-publicacao.json').write_text(json.dumps(receipt))
   config={'headers':[{'glob':'**','headers':{'Content-Security-Policy':'test','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff'}}]}
   state={'live':r.PRIOR,'release':r.ROLLBACK_RELEASE};posts=[]
   class Client:
    def __init__(self,*args):self.version='';self.token=''
    def live(self):return state['live']
    def api(self,path,method='GET',body=None,query=None):
     if method=='GET':return {'status':'FINALIZED','config':config,'labels':{'insightpad-candidate':r.p.SHA,'insightpad-operation':'p55-20261116t120210z-ac521d'}}
     posts.append((path,method,query));state['live']=query['versionName'];state['release']='projects/test/release/'+str(len(posts));return {'name':state['release'],'releaseTime':'test'}
   def fake_exec(code,ns):
    ns.update(record={'readyForFrontendPreparation':True,'readyForRollbackResourceCheck':True,'nineControlsConfirmed':True,'publicVersionBefore':{'project':r.p.P,'commit':r.p.BASE_SHA},'previousRelease':{'name':state['release'],'version':state['live'],'releaseTime':'test'}},snapshots={'previous-version':{'config':config},'x-policy':{'unchanged':True}},report=root/'preflight.json')
   def wait(*args):
    if concurrent:state['release']='projects/test/release/concurrent'
    if fail:raise RuntimeError('forced public mismatch')
    args[2]['publicFilesVerified']=2
   headers={'Content-Security-Policy':'test','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}
   commands=[Mock(returncode=0,stdout=r.p.SHA),Mock(returncode=0,stdout='')]
   with contextlib.ExitStack() as stack:
    for obj,name,value in [(r.p,'ROOT',root),(r,'ORIGINAL',original),(r,'MANIFEST_SHA',r.p.digest(manifest)),(r,'CONFIG_SHA',r.p.config_hash(config)),(r,'ReleaseOnly',Client)]:stack.enter_context(patch.object(obj,name,value))
    stack.enter_context(patch('builtins.exec',side_effect=fake_exec));stack.enter_context(patch.object(r.p,'verify_frozen_ci',return_value={'passed':True}));stack.enter_context(patch.object(r,'token',return_value='test-token'));stack.enter_context(patch.object(r.p,'inspect_dist',return_value=(files,12)));stack.enter_context(patch.object(r.p,'compare_inventory',return_value=4));stack.enter_context(patch.object(r.subprocess,'run',side_effect=commands));stack.enter_context(patch.object(r,'wait_public',side_effect=wait));stack.enter_context(patch.object(r.p,'public_bytes',return_value=(b'index',headers)));stack.enter_context(contextlib.redirect_stdout(io.StringIO()))
    result=r.main()
   report=json.loads(next(root.glob('P55R-*/P55R-publicacao.json')).read_text())
   return result,report,posts
 def test_success_releases_existing_version_exactly_once(self):
  code,report,posts=self.scenario();self.assertEqual(code,0);self.assertTrue(report['publicationComplete']);self.assertTrue(report['publicArtifactVerified']);self.assertEqual(len(posts),1);self.assertEqual(posts[0][2],{'versionName':r.VERSION});self.assertFalse(report['newVersionCreated']);self.assertEqual(report['uploadedFiles'],0)
 def test_failed_verification_rolls_back_only_own_release(self):
  code,report,posts=self.scenario(fail=True);self.assertEqual(code,1);self.assertTrue(report['rollbackConfirmed']);self.assertFalse(report['publicationComplete']);self.assertEqual([x[2]['versionName'] for x in posts],[r.VERSION,r.PRIOR])
 def test_concurrent_release_of_same_version_is_preserved(self):
  code,report,posts=self.scenario(fail=True,concurrent=True);self.assertEqual(code,1);self.assertEqual(len(posts),1);self.assertIn('Release concorrente',report['rollbackError'])

if __name__=='__main__':unittest.main()

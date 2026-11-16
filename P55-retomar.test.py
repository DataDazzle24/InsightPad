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
if __name__=='__main__':unittest.main()

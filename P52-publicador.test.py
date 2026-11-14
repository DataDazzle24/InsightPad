"""Offline regression for the controlled DEV Hosting publisher; no cloud calls."""
import importlib.util, io, json, pathlib, tempfile, unittest
from contextlib import redirect_stdout
from unittest.mock import patch

path=pathlib.Path(__file__).with_name('P52-publicar-estoque-registros.py')
spec=importlib.util.spec_from_file_location('publisher',path)
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)

class Response:
 def __enter__(self):return self
 def __exit__(self,*args):pass
 def read(self):return b'{}'
class Opener:
 def __init__(self):self.requests=[]
 def open(self,request,timeout):self.requests.append(request);return Response()

class GuardTests(unittest.TestCase):
 def setUp(self):
  self.report={'operationLabel':'p52-test','servingConfigSHA256':p.config_hash({'rewrites':[]})}
  self.client=p.Hosting('offline-test-token',self.report,lambda:None)
  self.client.opener=Opener()
 def test_rejects_other_project_and_nonwhitelisted_mutation(self):
  for path,method,body in [('/v1beta1/projects/insightpad-dd/sites/insightpad-dd','GET',None),(p.PREFIX,'DELETE',None),(p.PREFIX+'/versions','POST',{'status':'CREATED'})]:
   with self.assertRaises(RuntimeError):self.client.api(path,method,body)
  self.assertEqual(self.client.opener.requests,[])
 def test_allows_only_candidate_labeled_creation(self):
  self.client.api(p.PREFIX+'/versions','POST',{'status':'CREATED','labels':{'insightpad-candidate':p.SHA,'insightpad-operation':'p52-test'}})
  self.assertTrue(self.report['remoteMutationAttempted']);self.assertEqual(len(self.client.opener.requests),1)
 def test_rejects_changed_serving_configuration(self):
  self.client.version='sites/'+p.P+'/versions/offline';self.client.file_map={}
  with self.assertRaises(RuntimeError):self.client.api('/v1beta1/'+self.client.version,'PATCH',{'status':'FINALIZED','config':{'rewrites':[{'glob':'**','path':'/bad.html'}]}},{'updateMask':'status,config'})
  self.assertEqual(self.client.opener.requests,[])
 def test_release_cannot_target_unrelated_version(self):
  self.client.version='sites/'+p.P+'/versions/offline';self.report['previousVersion']='sites/'+p.P+'/versions/previous'
  with self.assertRaises(RuntimeError):self.client.api(p.PREFIX+'/channels/live/releases','POST',{'message':'test'},{'versionName':'sites/'+p.P+'/versions/unrelated'})
  self.assertEqual(self.client.opener.requests,[])
 def test_redirect_never_leaves_dev_origin(self):
  for location in ['https://example.invalid/','//insightpad-dd.web.app/','https://insightpad-dd-dev.web.app/bad']:
   with self.assertRaises(RuntimeError):p.canonical_destination(location,'https://'+p.HOST+'/index.html','test')
 def test_bounded_uploads_and_hash_dedup(self):
  hashes,mapping=p.bounded_uploads({'/a':{'data':b'same'},'/b':{'data':b'same'}})
  self.assertEqual(len(hashes),1);self.assertEqual(mapping['/a'],mapping['/b'])
  with self.assertRaises(RuntimeError):p.bounded_uploads({str(i):{'data':b'x'} for i in range(101)})
 def test_prior_remote_mutation_prevents_fresh_publication(self):
  with tempfile.TemporaryDirectory(prefix='p52-test-') as folder:
   root=pathlib.Path(folder);receipt=root/'P52-old';receipt.mkdir();(receipt/'P52-publicacao.json').write_text(json.dumps({'remoteMutationAttempted':True,'version':'sites/'+p.P+'/versions/prior'}))
   with patch.object(p,'ROOT',root),patch.object(p,'verify_frozen_ci',side_effect=AssertionError('Must stop before CI/network')),redirect_stdout(io.StringIO()):self.assertEqual(p.main(),2)
 def test_preflight_digest_matches_distributed_file(self):
  self.assertEqual(p.PREFLIGHT_SHA,p.digest(path.with_name('P52-preflight.py').read_bytes()))

class CiGateTests(unittest.TestCase):
 def setUp(self):
  spec=importlib.util.spec_from_file_location('ci_gate',path.with_name('P52-executar.py'));self.g=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.g)
 def test_failed_ci_never_launches_publisher(self):
  with patch.object(self.g,'get_run',return_value={'head_sha':self.g.SHA,'status':'completed','conclusion':'failure'}),patch.object(self.g.subprocess,'run') as launch:
   with self.assertRaises(RuntimeError):self.g.main()
   launch.assert_not_called()
 def test_other_commit_never_launches_publisher(self):
  with patch.object(self.g,'get_run',return_value={'head_sha':'another','status':'completed','conclusion':'success'}),patch.object(self.g.subprocess,'run') as launch:
   with self.assertRaises(RuntimeError):self.g.main()
   launch.assert_not_called()
 def test_pending_then_success_launches_once(self):
  with patch.object(self.g,'get_run',side_effect=[{'head_sha':self.g.SHA,'status':'in_progress'},{'head_sha':self.g.SHA,'status':'completed','conclusion':'success'}]),patch.object(self.g.time,'sleep'),patch.object(self.g.subprocess,'run') as launch,redirect_stdout(io.StringIO()):
   launch.return_value.returncode=0;self.assertEqual(self.g.main(),0);launch.assert_called_once()

if __name__=='__main__':unittest.main()

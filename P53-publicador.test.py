"""Offline regression for the controlled DEV Hosting publisher; no cloud calls."""
import importlib.util, io, json, pathlib, tempfile, unittest
from contextlib import redirect_stdout
from unittest.mock import patch

path=pathlib.Path(__file__).with_name('P53-publicar-canais.py')
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
  self.report={'operationLabel':'p53-test','servingConfigSHA256':p.config_hash({'rewrites':[]})}
  self.client=p.Hosting('offline-test-token',self.report,lambda:None)
  self.client.opener=Opener()
 def test_rejects_other_project_and_nonwhitelisted_mutation(self):
  for path,method,body in [('/v1beta1/projects/insightpad-dd/sites/insightpad-dd','GET',None),(p.PREFIX,'DELETE',None),(p.PREFIX+'/versions','POST',{'status':'CREATED'})]:
   with self.assertRaises(RuntimeError):self.client.api(path,method,body)
  self.assertEqual(self.client.opener.requests,[])
 def test_allows_only_candidate_labeled_creation(self):
  self.client.api(p.PREFIX+'/versions','POST',{'status':'CREATED','labels':{'insightpad-candidate':p.SHA,'insightpad-operation':'p53-test'}})
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
  with tempfile.TemporaryDirectory(prefix='p53-test-') as folder:
   root=pathlib.Path(folder);receipt=root/'P53-old';receipt.mkdir();(receipt/'P53-publicacao.json').write_text(json.dumps({'remoteMutationAttempted':True,'version':'sites/'+p.P+'/versions/prior'}))
   with patch.object(p,'ROOT',root),patch.object(p,'verify_frozen_ci',side_effect=AssertionError('Must stop before CI/network')),redirect_stdout(io.StringIO()):self.assertEqual(p.main(),2)
 def test_preflight_digest_matches_distributed_file(self):
  self.assertEqual(p.PREFLIGHT_SHA,p.digest(path.with_name('P53-preflight.py').read_bytes()))

class CiTests(unittest.TestCase):
 def pages(self,state='Success',sha=None,failed=False,missing=False):
  names=['Conferir SHA do candidato','Compilar contratos e conferir SDKs gerados','Frontend (lint, testes, tipos e build)','Functions (tipos, testes e build)','Aplicação QA com Auth e API mockados','Conferir preservação da fonte recuperada','PostgreSQL 18 descartável (aborto e locks, sem rede)','Renovação de sessão pelo compilador Data Connect isolado','Cobertura integrada QA existente']
  if missing:names[0]='Not the required step'
  names+=['other-'+str(i) for i in range(18)]
  marker=sha or p.SHA
  return [(f'>Status</span><span>{state}</span>'+marker).encode(),(marker+''.join(f'<check-step data-name="{name}" data-conclusion="'+('failure' if failed and i==26 else 'success')+'"></check-step>' for i,name in enumerate(names))).encode()]
 def verify(self,**args):
  pages=iter(self.pages(**args))
  class CiResponse:
   status=200
   def __init__(self,data):self.data=data
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def read(self,*args):return self.data
  class CiOpener:
   def open(self,*args,**kwargs):return CiResponse(next(pages))
  with patch.object(p.urllib.request,'build_opener',return_value=CiOpener()):return p.verify_frozen_ci()
 def test_exact_candidate_and_all_steps_pass(self):
  result=self.verify();self.assertEqual(result['candidate'],p.SHA);self.assertEqual(result['steps'],27);self.assertTrue(result['passed'])
 def test_pending_or_failed_run_rejected(self):
  for state in ['In progress','Failure']:
   with self.assertRaises(RuntimeError):self.verify(state=state)
 def test_different_candidate_rejected(self):
  with self.assertRaises(RuntimeError):self.verify(sha='another-commit')
 def test_failed_or_missing_mandatory_step_rejected(self):
  for args in [{'failed':True},{'missing':True}]:
   with self.assertRaises(RuntimeError):self.verify(**args)

if __name__=='__main__':unittest.main()

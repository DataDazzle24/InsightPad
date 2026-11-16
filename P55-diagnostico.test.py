import contextlib, hashlib, importlib.util, io, json, pathlib, tempfile, unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('diag',pathlib.Path(__file__).with_name('P55-diagnostico.py'));diag=importlib.util.module_from_spec(spec);spec.loader.exec_module(diag)
class Response:
 status=200
 headers={}
 def __init__(self,data):self.data=data
 def __enter__(self):return self
 def __exit__(self,*args):pass
 def read(self,limit):return self.data
class Tests(unittest.TestCase):
 def test_get_only_no_public_credentials_and_collisions(self):
  with tempfile.TemporaryDirectory() as d:
   home=pathlib.Path(d);root=home/'InsightPad_DEV_Barras_Globais_1fff0fe'/diag.OPERATION;root.mkdir(parents=True)
   source=home/'source';local=source/'frontend/dist'/diag.ASSET.lstrip('/');local.parent.mkdir(parents=True);local.write_bytes(b'candidate-js')
   manifest=json.dumps({'files':{diag.ASSET:{'rawSHA256':diag.sha(local.read_bytes())}}}).encode()
   (root/'artifact-manifest-private.json').write_bytes(manifest)
   (root/'P55-publicacao.json').write_text(json.dumps({'project':diag.PROJECT,'candidate':diag.CANDIDATE,'version':diag.CREATED,'previousVersion':diag.PRIOR,'rollbackConfirmed':True,'artifactManifestSHA256':diag.sha(manifest),'sourceRoot':str(source)}))
   calls=[]
   def opened(request,timeout):
    calls.append(request);self.assertEqual(request.get_method(),'GET')
    url=request.full_url
    if 'firebasehosting.googleapis.com' in url:
     self.assertEqual(request.get_header('Authorization'),'Bearer fake-test-token')
     if '/channels/live/releases' in url:value={'releases':[{'version':{'name':diag.PRIOR}}]}
     else:value={'files':[{'path':diag.ASSET,'hash':'old' if diag.PRIOR in url else 'new','status':'ACTIVE'}]}
     return Response(json.dumps(value).encode())
    self.assertIsNone(request.get_header('Authorization'))
    return Response(json.dumps({'project':diag.PROJECT,'commit':'9230247'}).encode() if '/version.json?' in url else b'prior-js')
   def command(args):return diag.PROJECT if args[-1]=='project' else 'datadazzletecnologia@gmail.com' if args[-1]=='account' else 'fake-test-token'
   output=io.StringIO()
   with patch.object(pathlib.Path,'home',return_value=home),patch.object(diag,'command',side_effect=command),patch.object(diag.OPENER,'open',side_effect=opened),contextlib.redirect_stdout(output):diag.main()
   result=json.loads(output.getvalue().split('=== INICIO P55 DIAGNOSTICO ===')[1].split('=== FIM')[0])
   self.assertEqual(len(calls),5);self.assertTrue(result['rollbackStillLive']);self.assertFalse(result['servedMatchesCandidate']);self.assertEqual(result['samePathsWithDifferentHashes'],[diag.ASSET]);self.assertNotIn('fake-test-token',output.getvalue())
 def test_wrong_project_stops_before_network(self):
  with patch.object(diag,'command',return_value='insightpad-dd'),patch.object(diag.OPENER,'open') as opened:
   with self.assertRaisesRegex(RuntimeError,'Projeto ativo'):diag.main()
   opened.assert_not_called()
 def test_wrong_account_stops_before_network(self):
  with patch.object(diag,'command',side_effect=[diag.PROJECT,'other@example.com']),patch.object(diag.OPENER,'open') as opened:
   with self.assertRaisesRegex(RuntimeError,'Conta ativa'):diag.main()
   opened.assert_not_called()
 def test_api_paths_and_public_origin_restricted(self):
  for url,token in [('https://firebasehosting.googleapis.com/v1beta1/projects/insightpad-dd/sites/insightpad-dd/channels/live/releases','secret'),('https://example.com/version.json',None),('https://insightpad-dd-dev.web.app/version.json','secret')]:
   with patch.object(diag.OPENER,'open') as opened:
    with self.assertRaises(RuntimeError):diag.read(url,token)
    opened.assert_not_called()
if __name__=='__main__':unittest.main()

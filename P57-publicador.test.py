"""Offline regression for the controlled DEV Hosting publisher; no cloud calls."""
import importlib.util, io, json, pathlib, tempfile, unittest
from contextlib import redirect_stdout
from unittest.mock import patch

path=pathlib.Path(__file__).with_name('P57-publicar-ajustes-finos.py')
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
  self.report={'operationLabel':'p57-test','servingConfigSHA256':p.config_hash({'rewrites':[]})}
  self.client=p.Hosting('offline-test-token',self.report,lambda:None)
  self.client.opener=Opener()
 def test_rejects_other_project_and_nonwhitelisted_mutation(self):
  for path,method,body in [('/v1beta1/projects/insightpad-dd/sites/insightpad-dd','GET',None),(p.PREFIX,'DELETE',None),(p.PREFIX+'/versions','POST',{'status':'CREATED'})]:
   with self.assertRaises(RuntimeError):self.client.api(path,method,body)
  self.assertEqual(self.client.opener.requests,[])
 def test_allows_only_candidate_labeled_creation(self):
  self.client.api(p.PREFIX+'/versions','POST',{'status':'CREATED','labels':{'insightpad-candidate':p.SHA,'insightpad-operation':'p57-test'}})
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
  with tempfile.TemporaryDirectory(prefix='p57-test-') as folder:
   root=pathlib.Path(folder);receipt=root/'P57-old';receipt.mkdir();(receipt/'P57-publicacao.json').write_text(json.dumps({'remoteMutationAttempted':True,'version':'sites/'+p.P+'/versions/prior'}))
   with patch.object(p,'ROOT',root),patch.object(p,'verify_frozen_ci',side_effect=AssertionError('Must stop before CI/network')),redirect_stdout(io.StringIO()):self.assertEqual(p.main(),2)
 def test_preflight_digest_matches_distributed_file(self):
  self.assertEqual(p.PREFLIGHT_SHA,p.digest(path.with_name('P57-preflight.py').read_bytes()))

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


class PlataformaTests(unittest.TestCase):
 def fixture(self,root):
  source=pathlib.Path(root)/'source';public=source/'frontend/public';dist=pathlib.Path(root)/'dist';dist.mkdir()
  for name in ['brand/login-flow-dark.svg','brand/login-flow-light.svg','brand/insight-pad-interface.png','brand/insight-pad-logo-compact.png','fonts/interface/DejaVuSans.ttf','fonts/interface/LICENSE.txt']:
   asset=public/name;asset.parent.mkdir(parents=True,exist_ok=True);asset.write_bytes(b'offline unit fixture')
   target=dist/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(asset.read_bytes())
  (dist/'assets').mkdir();(dist/'index.html').write_text('<html>normal offline fixture</html>')
  (dist/'version.json').write_text(json.dumps({'project':p.P,'commit':p.SHA}))
  (dist/'assets/app.css').write_text('ip-ui ip-login-v2 --dv-donut-font ip-pos-route ip-pos-modal --pdv-panel [data-cadastros] .cad-page .cad-module --cad-dialog .work-stock .work-sales stock-operation-modal--create .work-orders .work-connections .work-platform --pla-panel margin-inline-start:6px .ip-shell --rail-target --drawer-height .menus-card .menus-submenu --menu-blue --menu-green .dv-floating-tooltip .has-applied-filter .ip-analysis-report')
  (dist/'assets/app.js').write_text('ip-ui ip-login-v2 --dv-submenu-offset ip-pos-route ip-pos-modal onContinueWithoutOpening Conferir abertura cad-form-notice work-stock work-sales pedido-scroll channels-main-scroll work-platform data-platform-view platform-saving ip-shell user-drawer__heading user-drawer__body aria-haspopup menus-submenu menus-card__face--filled menus-card--pressed menus-card__icon has-applied-filter Selecionar / adicionar quantidade Voltar para Vendas')
  return dist,source
 def test_accepts_only_published_platform_baseline(self):
  p.verify_live_base({'project':p.P,'commit':p.BASE_SHA})
  self.assertEqual(p.BASE_SHA,'fd8f10c8575982ace35613e58363adb0ea28522c')
 def test_rejects_already_served_candidate_or_concurrent_source(self):
  for value in [{'project':p.P,'commit':p.SHA},{'project':p.P,'commit':'another-sha'},{'project':'insightpad-dd','commit':p.BASE_SHA}]:
   with self.assertRaises(RuntimeError):p.verify_live_base(value)
 def test_checks_all_platform_routes(self):
  self.assertEqual(p.PLATFORM_ROUTES,('/modulos/plataforma','/plataforma/empresas-ambientes','/plataforma/cobrancas-baixas','/plataforma/gestao-usuarios/usuarios','/plataforma/gestao-usuarios/perfis-permissoes'))
 def test_artifact_requires_platform_and_existing_module_markers(self):
  with tempfile.TemporaryDirectory(prefix='p57-artifact-') as folder:
   dist,source=self.fixture(folder);files,size=p.inspect_dist(dist,source)
   self.assertEqual(len(files),10);self.assertGreater(size,0)
 def test_artifact_rejects_missing_platform_style(self):
  with tempfile.TemporaryDirectory(prefix='p57-artifact-') as folder:
   dist,source=self.fixture(folder);css=dist/'assets/app.css';css.write_text(css.read_text().replace('.work-platform',''))
   with self.assertRaisesRegex(RuntimeError,'Plataforma aprovada'):p.inspect_dist(dist,source)
 def test_artifact_rejects_another_version_marker(self):
  with tempfile.TemporaryDirectory(prefix='p57-artifact-') as folder:
   dist,source=self.fixture(folder);(dist/'version.json').write_text(json.dumps({'project':p.P,'commit':p.BASE_SHA}))
   with self.assertRaisesRegex(RuntimeError,'Marcador de versão'):p.inspect_dist(dist,source)
 def test_timeout_keeps_intent_and_unknown_outcome_without_retry(self):
  class TimeoutOpener:
   calls=0
   def open(self,*args,**kwargs):
    self.calls+=1;raise p.urllib.error.URLError('offline timeout')
  report={'operationLabel':'p57-test'};saved=[];client=p.Hosting('offline-test-token',report,lambda:saved.append(dict(report)));client.opener=TimeoutOpener()
  with self.assertRaisesRegex(RuntimeError,'operação remota pode ter ocorrido'):
   client.api(p.PREFIX+'/versions','POST',{'status':'CREATED','labels':{'insightpad-candidate':p.SHA,'insightpad-operation':'p57-test'}})
  self.assertTrue(saved[0]['remoteMutationAttempted']);self.assertIn('lastIntent',saved[0]);self.assertTrue(report['remoteOutcomeUncertain']);self.assertEqual(client.opener.calls,1)

 def test_artifact_rejects_missing_global_bar_styles(self):
  with tempfile.TemporaryDirectory(prefix='p57-artifact-') as folder:
   dist,source=self.fixture(folder);f=dist/'assets/app.css';f.write_text(f.read_text().replace('.ip-shell',''))
   with self.assertRaisesRegex(RuntimeError,'Barras globais aprovadas'):p.inspect_dist(dist,source)
 def test_artifact_rejects_missing_drawer_markup(self):
  with tempfile.TemporaryDirectory(prefix='p57-artifact-') as folder:
   dist,source=self.fixture(folder);f=dist/'assets/app.js';f.write_text(f.read_text().replace('user-drawer__heading',''))
   with self.assertRaisesRegex(RuntimeError,'Barras globais aprovadas'):p.inspect_dist(dist,source)
 def test_checks_home_modules_and_operational_dashboard(self):
  self.assertEqual(p.GLOBAL_SHELL_ROUTES,('/','/modulos/vendas','/modulos/financeiro','/modulos/cadastros','/modulos/dashboards','/modulos/canais','/modulos/plataforma','/dashboards/operacional'))


class MenusTests(unittest.TestCase):
 def test_exact_p56_live_release_required(self):
  value={'previousRelease':{'name':'projects/'+p.P+'/sites/'+p.P+'/channels/live/releases/1794847044243000','version':'projects/'+p.P+'/sites/'+p.P+'/versions/3e12d2d1c8a295f8'}}
  p.verify_live_release(value)
  for key,new in [('name','another-release'),('version','sites/'+p.P+'/versions/concurrent')]:
   changed=json.loads(json.dumps(value));changed['previousRelease'][key]=new
   with self.assertRaisesRegex(RuntimeError,'Release live diferente'):p.verify_live_release(changed)
 def test_missing_menu_styles_rejected(self):
  with tempfile.TemporaryDirectory() as folder:
   dist,source=PlataformaTests().fixture(folder);f=dist/'assets/app.css';f.write_text(f.read_text().replace('--menu-blue',''))
   with self.assertRaisesRegex(RuntimeError,'Menus aprovados'):p.inspect_dist(dist,source)
 def test_missing_menu_component_rejected(self):
  with tempfile.TemporaryDirectory() as folder:
   dist,source=PlataformaTests().fixture(folder);f=dist/'assets/app.js';f.write_text(f.read_text().replace('menus-card--pressed',''))
   with self.assertRaisesRegex(RuntimeError,'Menus aprovados'):p.inspect_dist(dist,source)
 def client(self):
  from unittest.mock import Mock
  client=Mock();client.version='sites/'+p.P+'/versions/created';client.live.return_value=client.version;return client
 def files(self):return {'/version.json':{'rawSHA256':p.digest(b'version')},'/asset.js':{'rawSHA256':p.digest(b'js')}}
 def test_transient_stale_response_retries_only_reads_and_keeps_all_hashes(self):
  from unittest.mock import Mock
  client=self.client();read=Mock(side_effect=[(b'previous',{}),(b'version',{}),(b'js',{})]);record={};pause=Mock()
  with redirect_stdout(io.StringIO()):p.wait_public(client,self.files(),record,lambda:None,read=read,clock=lambda:0,pause=pause)
  self.assertEqual(record['publicFilesVerified'],2);self.assertEqual(len(record['publicReadAttempts']),2);pause.assert_called_once_with(5);client.api.assert_not_called();self.assertNotEqual(read.call_args_list[0].args[1],read.call_args_list[1].args[1])
 def test_persistent_hash_mismatch_stops_at_attempt_limit(self):
  from unittest.mock import Mock
  read=Mock(return_value=(b'html fallback',{}));record={}
  with redirect_stdout(io.StringIO()),self.assertRaisesRegex(RuntimeError,'não convergiu'):p.wait_public(self.client(),self.files(),record,lambda:None,read=read,clock=lambda:0,pause=Mock(),attempt_limit=3)
  self.assertEqual(len(record['publicReadAttempts']),3);self.assertEqual(read.call_count,3)
 def test_version_marker_matching_does_not_skip_other_assets(self):
  from unittest.mock import Mock
  read=Mock(side_effect=[(b'version',{}),(b'wrong js',{})]);record={}
  with redirect_stdout(io.StringIO()),self.assertRaises(RuntimeError):p.wait_public(self.client(),self.files(),record,lambda:None,read=read,clock=lambda:0,pause=Mock(),attempt_limit=1)
  self.assertEqual(record['publicReadAttempts'][0]['mismatch']['path'],'/asset.js')
 def test_concurrent_live_version_stops_before_public_reads(self):
  from unittest.mock import Mock
  client=self.client();client.live.return_value='sites/'+p.P+'/versions/other';read=Mock()
  with self.assertRaisesRegex(RuntimeError,'Live mudou'):p.wait_public(client,self.files(),{},lambda:None,read=read)
  read.assert_not_called()
 def test_concurrent_change_at_completion_rejected(self):
  from unittest.mock import Mock
  client=self.client();client.live.side_effect=[client.version,'sites/'+p.P+'/versions/other']
  with self.assertRaisesRegex(RuntimeError,'Live mudou ao concluir'):p.wait_public(client,self.files(),{},lambda:None,read=Mock(side_effect=[(b'version',{}),(b'js',{})]),clock=lambda:0)
 def test_read_deadline_is_bounded(self):
  from unittest.mock import Mock
  record={};read=Mock()
  with redirect_stdout(io.StringIO()),self.assertRaises(RuntimeError):p.wait_public(self.client(),self.files(),record,lambda:None,read=read,clock=Mock(side_effect=[0,121,122]),pause=Mock(),attempt_limit=1,seconds=120)
  read.assert_not_called();self.assertIn('prazo',record['publicReadAttempts'][0]['mismatch']['reason'])

class AjustesFinosTests(unittest.TestCase):
 def test_requires_each_fine_adjustment_marker(self):
  for name,marker in [('app.css','.dv-floating-tooltip'),('app.css','.has-applied-filter'),('app.css','.ip-analysis-report'),('app.js','has-applied-filter'),('app.js','Selecionar / adicionar quantidade'),('app.js','Voltar para Vendas')]:
   with self.subTest(marker=marker),tempfile.TemporaryDirectory() as folder:
    dist,source=PlataformaTests().fixture(folder);f=dist/'assets'/name;f.write_text(f.read_text().replace(marker,''))
    with self.assertRaisesRegex(RuntimeError,'Ajustes finos aprovados'):p.inspect_dist(dist,source)
 def test_rejects_fine_adjustment_qa_fixture_in_normal_bundle(self):
  with tempfile.TemporaryDirectory() as folder:
   dist,source=PlataformaTests().fixture(folder);f=dist/'assets/app.js';f.write_text(f.read_text()+' KIT TECLADO QA')
   with self.assertRaisesRegex(RuntimeError,'QA/mock/segredo'):p.inspect_dist(dist,source)
 def test_ci_ids_and_baseline_are_the_reviewed_operation(self):
  result=CiTests().verify()
  self.assertEqual((result['run'],result['job']),('43962429515','133633266188'))
  self.assertEqual(p.SHA,'72f9b629337ae2c0e799863f3ef4ab01c8b71326')
  self.assertEqual(p.BASE_SHA,'fd8f10c8575982ace35613e58363adb0ea28522c')

if __name__=='__main__':unittest.main()

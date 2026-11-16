"""Retoma versão P55 já FINALIZED; somente release Hosting DEV e leituras."""
import contextlib, copy, datetime as dt, fcntl, importlib.util, io, json, pathlib, subprocess, sys, time, uuid
path=pathlib.Path(__file__).resolve().with_name('P55-publicar-barras-globais.py')
spec=importlib.util.spec_from_file_location('p55',path);p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
PRIOR='projects/'+p.P+'/sites/'+p.P+'/versions/d0e096eb322b6f1e'
VERSION='projects/'+p.P+'/sites/'+p.P+'/versions/ab7824c420c92a5d'
ROLLBACK_RELEASE=p.PREFIX.removeprefix('/v1beta1/')+'/channels/live/releases/1794830729892000'
ORIGINAL=p.ROOT/'P55-20261116T120210Z-ac521d'
MANIFEST_SHA='fdfd3e7273203aeea810ca84b9b6c0aed564c93d902bd6fbe767620dfcea2d7a'
CONFIG_SHA='181631570eb25187481a9570d79211250b25dd95fd4eaf1dbe68fc656aa97c2c'
class ReleaseOnly(p.Hosting):
 def api(self,path,method='GET',body=None,query=None):
  if method!='GET':
   p.require(method=='POST' and path==p.PREFIX+'/channels/live/releases' and set(body or {})=={'message'} and set(query or {})=={'versionName'} and query['versionName'] in {PRIOR,VERSION},'Retomada permite somente release da versão existente ou reversão')
  return super().api(path,method,body,query)
 def upload(self,*args,**kwargs):raise RuntimeError('Upload proibido na retomada')
def token():
 r=subprocess.run(['gcloud','auth','print-access-token','--project='+p.P],capture_output=True,text=True,timeout=45)
 p.require(r.returncode==0 and r.stdout.strip(),'Token de leitura/publicação indisponível');return r.stdout.strip()
def validate_original(receipt):
 p.require(receipt.get('candidate')==p.SHA and receipt.get('project')==p.P and receipt.get('version')==VERSION and receipt.get('previousVersion')==PRIOR,'Recibo original divergente')
 p.require(receipt.get('rollbackConfirmed') is True and receipt.get('hostingPublished') is False and receipt.get('artifactManifestSHA256')==MANIFEST_SHA,'Reversão/manifesto original divergente')
 p.require(receipt.get('rollbackRelease',{}).get('name')==ROLLBACK_RELEASE,'Release de reversão divergente')
def wait_public(client,files,record,save,read=p.public_bytes,clock=time.monotonic,pause=time.sleep,attempt_limit=8,seconds=120):
 deadline=clock()+seconds
 for attempt in range(1,attempt_limit+1):
  p.require(p.same_version(client.live(),VERSION),'Live mudou durante verificação; preservar publicação concorrente')
  nonce=uuid.uuid4().hex;verified=0;mismatch=None
  paths=['/version.json']+[x for x in sorted(files) if x!='/version.json']
  for item in paths:
   if clock()>deadline:mismatch={'path':item,'reason':'prazo de verificação atingido'};break
   raw,headers=read(item,nonce)
   if p.digest(raw)!=files[item]['rawSHA256']:
    mismatch={'path':item,'expectedSHA256':files[item]['rawSHA256'],'observedSHA256':p.digest(raw),'bytes':len(raw),'headers':headers};break
   verified+=1
  record.setdefault('publicReadAttempts',[]).append({'attempt':attempt,'verifiedFiles':verified,'mismatch':mismatch});save()
  if mismatch is None:
   p.require(p.same_version(client.live(),VERSION),'Live mudou ao concluir verificação')
   record['publicFilesVerified']=verified;return
  print('Conferência pública '+str(attempt)+'/'+str(attempt_limit)+': divergência registrada; repetindo somente leituras.',flush=True)
  if attempt<attempt_limit and clock()<deadline:pause(min(5,max(0,deadline-clock())))
 raise RuntimeError('Conteúdo servido não convergiu aos hashes dentro do limite; consultar publicReadAttempts')
def main():
 p.ROOT.mkdir(mode=0o700,exist_ok=True)
 for old in p.ROOT.glob('P55R-*/P55R-publicacao.json'):
  value=json.loads(old.read_text())
  if value.get('remoteMutationAttempted'):
   print('Retomada anterior tem mutação; não repetir. Recibo: '+str(old));print(old.read_text());return 2
 for old in p.prior_receipts():
  if old.parent!=ORIGINAL:p.require(not json.loads(old.read_text()).get('remoteMutationAttempted'),'Outra operação P55 tem mutação; consultar recibos antes de retomar')
 original=json.loads((ORIGINAL/'P55-publicacao.json').read_text());validate_original(original)
 out=p.ROOT/('P55R-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:6]);out.mkdir(mode=0o700)
 report=out/'P55R-publicacao.json'
 record={'phase':'P55R_BARRAS_GLOBAIS_EXISTING_VERSION','project':p.P,'candidate':p.SHA,'CORE':'CORE não gravada','originalOperation':str(ORIGINAL),'previousVersion':PRIOR,'version':VERSION,'remoteMutationAttempted':False,'hostingPublished':False,'publicationComplete':False,'publicArtifactVerified':False,'newVersionCreated':False,'uploadedFiles':0,'newBuildExecuted':False,'functionsPublished':False,'connectorPublished':False,'schemaChanged':False,'migrationExecuted':False,'IAMChanged':False,'authenticatedSmokesExecuted':False,'startedUTC':dt.datetime.now(dt.timezone.utc).isoformat(),'cost':{'capUSD':5,'additionalFlatReserveUSD':0,'measuredGoogleCloudUSD':None}}
 def save():
  tmp=report.with_suffix('.tmp');tmp.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');tmp.replace(report)
 def preflight(stage,resource_only=False):
  script=path.with_name('P55-preflight.py');p.require(p.digest(script.read_bytes())==p.PREFLIGHT_SHA,'Preflight divergente')
  ns={'__name__':'__main__','RESOURCE_ONLY_PREFLIGHT':resource_only}
  with contextlib.redirect_stdout(io.StringIO()):exec(compile(script.read_text(),str(script),'exec'),ns)
  result=ns['record'];record['preflight-'+stage]={'report':str(ns['report']),'nineControlsConfirmed':result.get('nineControlsConfirmed')};save()
  p.require(result.get('readyForRollbackResourceCheck' if resource_only else 'readyForFrontendPreparation'),'Preflight '+stage+' bloqueado')
  return result,ns['snapshots']
 client=None;attempted=False
 try:
  save();record['CI']=p.verify_frozen_ci();save()
  first,snapshot=preflight('initial');p.verify_live_base(first.get('publicVersionBefore',{}))
  p.require(first['previousRelease']['name']==ROLLBACK_RELEASE and p.same_version(first['previousRelease']['version'],PRIOR),'Release concorrente detectada; preservar')
  config=copy.deepcopy(snapshot['previous-version']['config']);p.require(p.config_hash(config)==CONFIG_SHA,'Serving config divergente')
  record['servingConfigSHA256']=CONFIG_SHA;p.PUBLIC_CONFIG.update(config)
  raw=(ORIGINAL/'artifact-manifest-private.json').read_bytes();p.require(p.digest(raw)==MANIFEST_SHA,'Manifesto preservado divergiu')
  manifest=json.loads(raw);source=pathlib.Path(original['sourceRoot'])
  r=subprocess.run(['git','-C',str(source),'rev-parse','HEAD'],capture_output=True,text=True,timeout=20);p.require(r.returncode==0 and r.stdout.strip()==p.SHA,'Checkout não corresponde ao candidato')
  r=subprocess.run(['git','-C',str(source),'status','--porcelain'],capture_output=True,text=True,timeout=20);p.require(r.returncode==0 and not r.stdout.strip(),'Checkout alterado')
  files,total=p.inspect_dist(source/'frontend/dist',source);p.bounded_uploads(files)
  p.require({name:{k:v for k,v in value.items() if k!='data'} for name,value in files.items()}==manifest['files'],'Artefato local não corresponde ao manifesto')
  record.update(publicFiles=len(files),rawBytes=total,artifactManifestSHA256=MANIFEST_SHA)
  client=ReleaseOnly(token(),record,save);client.version=VERSION
  existing=client.api('/v1beta1/'+VERSION)
  p.require(existing.get('status')=='FINALIZED' and p.same_config(existing.get('config',{}),config),'Versão preparada/configuração divergente')
  p.require(existing.get('labels',{}).get('insightpad-candidate')==p.SHA and existing.get('labels',{}).get('insightpad-operation')=='p55-20261116t120210z-ac521d','Rótulos da versão divergentes')
  record['remoteFilesMatched']=p.compare_inventory(client,files,PRIOR);save()
  fresh,state=preflight('before-release')
  p.require(fresh['previousRelease']==first['previousRelease'] and state['previous-version']['config']==config,'Release/configuração mudou')
  p.require(all(state.get(k)==v for k,v in snapshot.items() if k.endswith('-policy')),'Políticas mudaram')
  p.require(p.same_version(client.live(),PRIOR),'Release concorrente detectada')
  client.token=token();attempted=True;record['releaseAttempted']=True;save()
  release=client.api(p.PREFIX+'/channels/live/releases','POST',{'message':'Resume existing reviewed Bars '+p.SHA+'; no build/upload; bounded public hash verification.'},{'versionName':VERSION})
  record['release']={k:release.get(k) for k in ('name','releaseTime')};save()
  wait_public(client,files,record,save)
  record['hostingPublished']=True;save()
  nonce=uuid.uuid4().hex
  routes=['/login','/estoque','/vendas/registros','/integracoes/canais/pedidos','/integracoes/canais/conexoes','/modulos/cadastros','/cadastros/categorias','/cadastros/subcategorias','/cadastros/produtos','/cadastros/clientes','/cadastros/fornecedores','/cadastros/filiais','/vendas/frente-de-caixa']+list(p.PLATFORM_ROUTES)+list(p.GLOBAL_SHELL_ROUTES)
  for route in routes:
   raw,headers=p.public_bytes(route,nonce);p.require(p.digest(raw)==files['/index.html']['rawSHA256'],'Entrada de rota divergente: '+route)
   wanted={k.lower():v for rule in config.get('headers',[]) if rule.get('glob')=='**' for k,v in rule.get('headers',{}).items()}
   p.require(all(headers.get(k)==wanted.get(k.lower()) for k in ['Content-Security-Policy','X-Frame-Options','X-Content-Type-Options']),'Headers públicos divergentes')
   p.require('no-store' in (headers.get('Cache-Control') or '').lower(),'HTML sem proteção de cache')
  after,post=preflight('after-release')
  p.require(p.same_version(after['previousRelease']['version'],VERSION) and p.same_config(post['previous-version']['config'],config),'Live/config divergente')
  p.require(all(post.get(k)==v for k,v in snapshot.items() if k.endswith('-policy')),'Políticas/etags divergiram')
  p.require(client.api('/v1beta1/'+PRIOR).get('status')=='FINALIZED','Reversão anterior indisponível')
  record.update(publicArtifactVerified=True,publicationComplete=True,nineControlsConfirmed=True,backendUnchanged=True,servingConfigPreserved=True,nominalPoliciesAndEtagsUnchanged=True,rollbackVersionAvailable=True,publicRoutesVerified=len(routes),url='https://'+p.P+'.web.app/',remaining='Aceite autenticado B01–B06, sessão/perfis/tema/atalhos/alertas e impressão. CORE não gravada.')
 except Exception as error:
  record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__;save()
  if attempted and client:
   try:
    live=client.live();record['observedLiveAfterFailure']=live;save()
    if p.same_version(live,VERSION):
     fresh,state=preflight('before-rollback',True)
     p.require(p.same_version(fresh['previousRelease']['version'],VERSION) and fresh['previousRelease']['name']==record.get('release',{}).get('name'),'Release concorrente ou resultado incerto; não reverter automaticamente')
     p.require(client.api('/v1beta1/'+PRIOR).get('status')=='FINALIZED','Versão anterior indisponível')
     client.token=token();record['rollbackAttempted']=True;save()
     undo=client.api(p.PREFIX+'/channels/live/releases','POST',{'message':'Rollback resumed Bars after failed bounded verification; previous Hosting only.'},{'versionName':PRIOR})
     record['rollbackRelease']={k:undo.get(k) for k in ('name','releaseTime')};record['rollbackConfirmed']=p.same_version(client.live(),PRIOR);record['hostingPublished']=not record['rollbackConfirmed']
    else:record['rollbackSkipped']='Versão concorrente preservada'
   except Exception as err:record['rollbackError']=str(err) if isinstance(err,RuntimeError) else type(err).__name__
 finally:
  if client:client.token=''
  record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();record['receipt']=str(report);save()
  print('=== INICIO P55R ===');print(report.read_text());print('=== FIM P55R ===')
 return 0 if record.get('publicationComplete') else 1
def run():
 p.ROOT.mkdir(mode=0o700,exist_ok=True)
 with (p.ROOT/'P55-operation.lock').open('a') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:print('Operação P55/P55R já em execução; parar.');return 2
  return main()
if __name__=='__main__':
 import os
 os.umask(0o077);sys.exit(run())

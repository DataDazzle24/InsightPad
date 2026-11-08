import datetime as dt, hashlib, json, os, pathlib, re, shutil, subprocess, urllib.error, urllib.request, uuid

os.umask(0o077)
P, N, R = 'insightpad-dd-dev', '102484114817', 'southamerica-east1'
SHA = '6e727a05fcd987b236ee11646c4c70e4bc88fcf5'
EXPECTED = {
 'schemas/main': {'schema.gql': '005a157ba8442ede0b4c2778e8057407bbd8e148d6bc551c6adc444dfe7aba46'},
 'connectors/app': {
  'bootstrap_sales_channel_orders.gql': '01a4440a265e9868429279da21db2144ff195eed4f220657e6fbd2464c5df9f0',
  'bootstrap_sales_channels.gql': 'a11d19381fb6c5f6dd9d6aa81fffdb1862f529956f70a0038fbdd2dd7c348cb6',
  'bootstrap_sales_channels_v2.gql': 'e5984a8c9b00d8b3bdeac1abbe5d0534c1a501544aaaabcf4dd5f8205bab3d34',
  'mutations.gql': '007e4834476ff6d943ad044b28d46edac276d27954edb55a01aa15a63198f110',
  'queries.gql': '19fe3a7701182a23f56aac1b1faa175b44b5c44dc35322c8c3d0af2a10a80611',
  'recover_platform_admin.gql': '2696d380b78b80e4570c881185c3d396839764db9dae883caaea04f3f56279f4'}}
PERMISSIONS = ['firebasehosting.sites.get', 'firebasehosting.sites.update']
ROOT = pathlib.Path.home() / 'InsightPad_DEV_Cadastros_6e727a0'
OUT = ROOT / ('P51-preflight-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:6])
OUT.mkdir(parents=True, mode=0o700)
report = OUT / 'P51-preflight.json'
record = {'phase':'P51_CADASTROS_PREFLIGHT_READONLY', 'CORE':'CORE não gravada', 'project':P, 'candidate':SHA,
 'startedUTC':dt.datetime.now(dt.timezone.utc).isoformat(), 'remoteMutations':False, 'scriptRevision':'P51-pdv-v2-exact-P49-baseline',
 'hostingPublished':False, 'readyForFrontendPreparation':False, 'checks':{},
 'authorization':{'source':'pedido expresso de publicação DEV da Cadastros UI nesta conversa','scope':'Cadastros UI; somente frontend DEV, contratos reais e contenções preservados','candidate':SHA}}
snapshots = {}; token = ''

def save():
 report.write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n')
def require(condition, message):
 if not condition: raise RuntimeError(message)
def command(args, timeout=45):
 try: result = subprocess.run(args, text=True, capture_output=True, timeout=timeout)
 except FileNotFoundError: raise RuntimeError('Executável indisponível: '+args[0]) from None
 except subprocess.TimeoutExpired: raise RuntimeError('Timeout somente leitura: '+' '.join(args[:3])) from None
 require(result.returncode == 0, 'Falha CLI '+str(result.returncode)+': '+' '.join(args[:3]))
 return result.stdout
def cloud(args):
 return json.loads(command(['gcloud',*args,'--project='+P,'--format=json']))
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs): return None
opener = urllib.request.build_opener(NoRedirect)

def read_json_transport(request, host):
 attempts=3 if host=='firebasedataconnect.googleapis.com' and request.get_method()=='GET' else 1
 for attempt in range(attempts):
  try:
   with opener.open(request,timeout=30) as response:return json.load(response)
  except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as error:
   transient=not isinstance(error,urllib.error.HTTPError) or error.code in {429,500,502,503,504}
   if not transient or attempt+1==attempts:raise
   import sys,time
   print('Leitura Data Connect: nova tentativa '+str(attempt+2)+'/3; sem mutação.',file=sys.stderr,flush=True)
   time.sleep((1,3)[attempt])

def get_json(host, path, body=None):
 allowed = (host=='firebasehosting.googleapis.com' and path.startswith('/v1beta1/projects/'+P+'/sites/'+P)) or (host=='firebasedataconnect.googleapis.com' and path.startswith('/v1/projects/'+P+'/locations/'+R+'/services/insightpad/'))
 allowed = allowed or (host=='iam.googleapis.com' and path=='/v1/roles/firebasehosting.admin' and body is None)
 allowed = allowed or (host=='cloudresourcemanager.googleapis.com' and path=='/v1/projects/'+P+':testIamPermissions' and body=={'permissions':PERMISSIONS})
 require(allowed,'Recurso fora do preflight DEV')
 request=urllib.request.Request('https://'+host+path, data=None if body is None else json.dumps(body).encode(),
  headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}, method='GET' if body is None else 'POST')
 try:
  return read_json_transport(request, host)
 except urllib.error.HTTPError as error:
  detail={'host':host,'HTTP':error.code}
  try:
   value=json.loads(error.read(16384)).get('error',{});message=str(value.get('message',''))
   if token:message=message.replace(token,'[redacted]')
   message=re.sub(r'(?i)Bearer\s+\S+|ya29\.\S+|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[redacted]',message)
   if re.search(r'(?i)access_token|refresh_token|private_key|BEGIN .*PRIVATE KEY',message):message='Mensagem com credencial omitida'
   detail.update(status=value.get('status'),message=message[:500])
  except Exception:detail['message']='Diagnóstico JSON indisponível'
  record['apiError']=detail
  raise RuntimeError('Consulta '+host+' HTTP '+str(error.code)) from None
 except (urllib.error.URLError,TimeoutError): raise RuntimeError('Conexão somente leitura indisponível: '+host) from None

try:
 save()
 accounts=json.loads(command(['gcloud','auth','list','--filter=status:ACTIVE','--project='+P,'--format=json(account)']))
 require(accounts==[{'account':'datadazzletecnologia@gmail.com'}], 'Conta ativa diferente do operador confirmado')
 record['operator']=accounts[0]['account']
 project=cloud(['projects','describe',P])
 require(project.get('projectId')==P and str(project.get('projectNumber'))==N and project.get('lifecycleState')=='ACTIVE','Projeto divergente ou inativo')
 record['checks']['projectIdentity']=True
 token=command(['gcloud','auth','print-access-token','--project='+P]).strip()
 require(bool(token),'Sem autenticação CLI válida')
 record['gcloudVersion']=command(['gcloud','version']).splitlines()[0]
 role=get_json('iam.googleapis.com','/v1/roles/firebasehosting.admin')
 require(role.get('name')=='roles/firebasehosting.admin' and set(PERMISSIONS)<=set(role.get('includedPermissions',[])),'Nomes de permissão não correspondem à definição oficial atual')
 snapshots['hosting-role-definition']=role
 record['permissionNamesValidated']=True;record['permissionsTestRequested']=list(PERMISSIONS)
 rights=get_json('cloudresourcemanager.googleapis.com','/v1/projects/'+P+':testIamPermissions',{'permissions':PERMISSIONS})
 needed=set(PERMISSIONS)
 record['missingHostingPermissions']=sorted(needed-set(rights.get('permissions',[])))
 require(not record['missingHostingPermissions'],'Permissão Hosting necessária ausente; nenhuma concessão executada')
 sa='insightpad-ifood-adapter@'+P+'.iam.gserviceaccount.com'
 adapter=cloud(['iam','service-accounts','describe',sa])
 require(adapter.get('disabled') is True and adapter.get('uniqueId')=='116713237817148235149','Contenção do adapter divergente')
 record['checks']['adapterDisabled']=True
 for job in ['firebase-schedule-reconcileIfood-southamerica-east1','firebase-schedule-purgeIfoodPayloads-southamerica-east1']:
  state=cloud(['scheduler','jobs','describe',job,'--location='+R]); snapshots[job]=state
  require(state.get('state')=='PAUSED','Scheduler não está contido: '+job);record['checks'][job]=True
 for service,member in [('ifoodwebhook','allUsers'),('ifoodcancellationreasons','allUsers'),('ifoodavailablemerchants','allUsers'),('ifoodmerchantoperations','allUsers'),('reconcileifood','serviceAccount:'+sa),('purgeifoodpayloads','serviceAccount:'+sa)]:
  policy=cloud(['run','services','get-iam-policy',service,'--region='+R]);snapshots[service+'-policy']=policy
  require(policy.get('etag') and not any(b.get('role')=='roles/run.invoker' and set(b.get('members',[])) & {member,'allUsers','allAuthenticatedUsers'} for b in policy.get('bindings',[])),'Contenção do serviço divergente: '+service)
  record['checks'][service]=True
 inherited=cloud(['projects','get-iam-policy',P]);snapshots['project-policy']=inherited
 inv=[b for b in inherited.get('bindings',[]) if b.get('role')=='roles/run.invoker']
 require(sorted({m for b in inv for m in b.get('members',[])})==['serviceAccount:'+N+'-compute@developer.gserviceaccount.com'] and not any(b.get('condition') for b in inv),'Invoker herdado divergiu')
 record['nineControlsConfirmed']=True
 for suffix,expected in EXPECTED.items():
  obj=get_json('firebasedataconnect.googleapis.com','/v1/projects/'+P+'/locations/'+R+'/services/insightpad/'+suffix);snapshots[suffix.replace('/','-')]=obj
  files=obj.get('source',{}).get('files',[])
  actual={f['path']:hashlib.sha256(f['content'].encode()).hexdigest() for f in files}
  require(len(actual)==len(files) and actual==expected and not obj.get('reconciling'),'Backend divergiu do contrato aprovado: '+suffix)
  if suffix=='schemas/main':
   ds=obj.get('datasources',[]);require(len(ds)==1,'Datasource inesperado')
   pg=ds[0].get('postgresql',{})
   require(pg.get('database')=='fdcdb' and pg.get('schema','public')=='public' and not pg.get('ephemeral',False) and pg.get('cloudSql',{}).get('instance') in {f'projects/{p}/locations/{R}/instances/insightpad-fdc' for p in (P,N)},'Datasource fora do alvo')
  record['checks'][suffix+'-compatible']=True
 prefix='/v1beta1/projects/'+P+'/sites/'+P
 site=get_json('firebasehosting.googleapis.com',prefix);snapshots['site']=site
 require(site.get('name') in {'projects/'+p+'/sites/'+P for p in (P,N)},'Site fora do projeto DEV')
 live=get_json('firebasehosting.googleapis.com',prefix+'/channels/live');snapshots['live']=live
 release=live.get('release',{});version=release.get('version',{}).get('name','')
 require(bool(re.fullmatch(r'(?:projects/(?:'+P+'|'+N+r')/)?sites/'+P+r'/versions/[A-Za-z0-9-]+',version)),'Versão live não identificada')
 previous=get_json('firebasehosting.googleapis.com','/v1beta1/'+version);snapshots['previous-version']=previous
 require(previous.get('status')=='FINALIZED','Release anterior não está FINALIZED')
 config=previous.get('config',{});hooks=[w for w in config.get('rewrites',[]) if w.get('glob')=='/api/ifood/webhook']
 require(len(hooks)==1 and hooks[0].get('run',{}).get('serviceId')=='ifoodwebhook' and hooks[0]['run'].get('region',R)==R and bool(hooks[0]['run'].get('tag')),'Rewrite/pin iFood não corresponde à publicação contida')
 require(any(w.get('glob')=='**' and w.get('path')=='/index.html' for w in config.get('rewrites',[])),'Fallback SPA inesperado')
 record['previousRelease']={'name':release.get('name'),'releaseTime':release.get('releaseTime'),'version':version}
 record['servingConfigSHA256']=hashlib.sha256(json.dumps(config,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 record['checks']['pinnedRewritePresent']=True
 if not globals().get('RESOURCE_ONLY_PREFLIGHT',False):
  for path in ['/version.json','/__/firebase/init.json']:
   try:
    req=urllib.request.Request('https://'+P+'.web.app'+path+'?insightpad_preflight='+uuid.uuid4().hex,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'})
    with opener.open(req,timeout=30) as response: public=json.load(response)
   except (urllib.error.URLError,TimeoutError,ValueError): raise RuntimeError('Leitura pública de DEV indisponível: '+path) from None
   if path=='/version.json':
    record['publicVersionBefore']={key:public.get(key) for key in ('project','commit','builtUTC')}
    require(public.get('project')==P and public.get('commit') in {SHA,'9c50ee250c54ed9b2ab6a2b4656aedff1fb9a63a'},'Frontend live fora da baseline P50R ou do candidato; preservar e inspecionar publicVersionBefore')
   else:
    require(public.get('projectId')==P and public.get('authDomain')==P+'.firebaseapp.com','Configuração pública fora de DEV')
    require(all(isinstance(public.get(k),str) and public[k] for k in ['apiKey','appId','authDomain','messagingSenderId','projectId','storageBucket']),'Configuração pública incompleta')
    snapshots['public-client-config']=public;record['checks']['realPublicClientConfig']=True
 if not globals().get('RESOURCE_ONLY_PREFLIGHT',False):
  candidates=[pathlib.Path.home()/'InsightPad_DEC035_OP_20261028T165248Z/tools-node22/node_modules/node/bin/node']
  if shutil.which('node'):candidates.append(pathlib.Path(shutil.which('node')))
  for executable in candidates:
   if executable.is_file():
    version22=command([str(executable),'--version']).strip()
    if version22.startswith('v22.'):record['node22']={'path':str(executable),'version':version22};break
  require('node22' in record,'Node22 reutilizável não localizado; nenhuma instalação executada')
  record['existingCheckouts']=[]
  recognized=[]
  for parent,pattern in [
   ('InsightPad_DEV_Dashboards_v6_8efbd9d','P49-*/source'),
   ('InsightPad_DEV_Dashboards_a440615','P48-*/source'),
   ('InsightPad_DEV_Login_b753891','P47-*/source'),
   ('InsightPad_DEV_UI_faa6d4b','P45-*/source')]:
   folder=pathlib.Path.home()/parent
   if folder.is_dir():recognized.extend(sorted(folder.glob(pattern),reverse=True)[:8])
  recognized.extend(pathlib.Path.home()/name for name in ['InsightPad_DEC038_core_3f5ba5b','InsightPad_DEC038_f962'])
  for source in recognized:
   if (source/'.git').exists() and (source/'frontend/package-lock.json').is_file():
    record['existingCheckouts'].append({'path':str(source),'HEAD':command(['git','-C',str(source),'rev-parse','HEAD']).strip(),'dirty':bool(command(['git','-C',str(source),'status','--porcelain','--untracked-files=no']).strip())})
  require(record['existingCheckouts'],'Checkout existente não localizado; nenhum arquivo sobrescrito')
 record['readyForFrontendPreparation']=not globals().get('RESOURCE_ONLY_PREFLIGHT',False)
 record['readyForRollbackResourceCheck']=bool(globals().get('RESOURCE_ONLY_PREFLIGHT',False))
except Exception as error:
 record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__
finally:
 token=''
 (OUT/'snapshot-private.json').write_text(json.dumps(snapshots,ensure_ascii=False,indent=2)+'\n')
 record['privateSnapshot']=str(OUT/'snapshot-private.json')
 record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();save()
 print('=== INICIO P51_PREFLIGHT ===');print(report.read_text());print('=== FIM P51_PREFLIGHT ===')
 print('Devolva somente o JSON P51_PREFLIGHT. Não envie snapshot-private.json, tokens ou credenciais.')

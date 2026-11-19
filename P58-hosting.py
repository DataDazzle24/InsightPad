"""Reviewed Hosting transport reused from P58; no legacy entry point or deploy."""
import time, copy, datetime as dt, gzip, hashlib, json, os, pathlib, re, shutil, subprocess, urllib.error, urllib.parse, urllib.request, uuid, tempfile
P,N='insightpad-dd-dev','102484114817'
SHA='bb2def3336171b440df8038c4112abd9f05b7172'
BASE_SHA='72f9b629337ae2c0e799863f3ef4ab01c8b71326'
ROOT=pathlib.Path.home()/'InsightPad_DEV_Encomendas_Comandas_bb2def3'
PREFIX='/v1beta1/projects/'+P+'/sites/'+P
SOURCE='https://github.com/DataDazzle24/InsightPad.git'
BUNDLE_SHA=None
HOST=P+'.web.app'
def require(value, message):
 if not value: raise RuntimeError(message)

def digest(value): return hashlib.sha256(value).hexdigest()

def config_hash(value): return digest(json.dumps(value,sort_keys=True,separators=(',',':')).encode())

def same_config(actual, expected):
 def normalize(value):
  result=copy.deepcopy(value)
  for rule in result.get('headers',[]):
   headers=rule.get('headers',{})
   require(len({k.lower() for k in headers})==len(headers),'Header HTTP duplicado')
   rule['headers']={k.lower():v for k,v in headers.items()}
  return result
 actual,expected=normalize(actual),normalize(expected)
 return all(actual.get(k)==v for k,v in expected.items()) and all(actual[k] in (None,{},[],'') or (k=='appAssociation' and actual[k]=='AUTO') for k in actual.keys()-expected.keys())

def version_ok(value): return bool(re.fullmatch(r'(?:projects/(?:'+P+'|'+N+r')/)?sites/'+P+r'/versions/[A-Za-z0-9-]+',value))

def same_version(a,b): return re.sub(r'^projects/[^/]+/','',a)==re.sub(r'^projects/[^/]+/','',b)

class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs): return None

class Hosting:
 def __init__(self, token, report, save):
  self.token,self.report,self.save=token,report,save
  self.version='';self.file_map=None;self.opener=urllib.request.build_opener(NoRedirect)
 def http_error(self,error,stage):
  detail={'stage':stage,'HTTP':error.code}
  try:
   value=json.loads(error.read(16384)).get('error',{});message=str(value.get('message',''))
   if self.token:message=message.replace(self.token,'[redacted]')
   message=re.sub(r'(?i)Bearer\s+\S+|ya29\.\S+|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[redacted]',message)
   message=re.sub(r'(https?://[^\s?]+)\?[^\s]+',r'\1?[redacted query]',message)
   if re.search(r'(?i)access_token|refresh_token|private_key|BEGIN .*PRIVATE KEY',message):message='Mensagem com credencial omitida'
   detail.update(status=value.get('status'),message=message[:500])
  except Exception:detail['message']='Diagnóstico JSON indisponível'
  self.report['apiError']=detail;self.save()
  return RuntimeError(stage+' HTTP '+str(error.code))
 def api(self,path,method='GET',body=None,query=None):
  require('?' not in path and '#' not in path and '//' not in path and not any(p in {'.','..'} for p in urllib.parse.unquote(path).split('/')),'Caminho API inválido')
  allowed_read = path==PREFIX or path.startswith(PREFIX+'/')
  if not allowed_read:
   allowed_read=any(path.startswith('/v1beta1/'+prefix+'/') for prefix in ['sites/'+P,'projects/'+N+'/sites/'+P])
  require(allowed_read,'Recurso Hosting fora de DEV')
  if method!='GET':
   expected_create={'status':'CREATED','labels':{'insightpad-candidate':SHA,'insightpad-operation':self.report.get('operationLabel')}}
   allowed=(method=='POST' and path==PREFIX+'/versions' and body==expected_create and not query)
   allowed=allowed or (bool(self.version) and self.file_map is not None and method=='POST' and path=='/v1beta1/'+self.version+':populateFiles' and body=={'files':self.file_map} and not query)
   allowed=allowed or (bool(self.version) and method=='PATCH' and path=='/v1beta1/'+self.version and set(body)=={'status','config'} and body['status']=='FINALIZED' and config_hash(body['config'])==self.report.get('servingConfigSHA256') and query=={'updateMask':'status,config'})
   target=(query or {}).get('versionName','')
   allowed=allowed or (method=='POST' and path==PREFIX+'/channels/live/releases' and set(body)=={'message'} and (target==self.version or target==self.report.get('previousVersion')) and version_ok(target) and set(query)=={'versionName'})
   require(allowed,'Mutação não autorizada pelo publicador Hosting')
   self.report['remoteMutationAttempted']=True
   self.report['lastIntent']={'method':method,'path':path,'versionName':target or None};self.save()
  url='https://firebasehosting.googleapis.com'+path
  if query:url+='?'+urllib.parse.urlencode(query)
  request=urllib.request.Request(url,data=None if body is None else json.dumps(body).encode(),headers={'Authorization':'Bearer '+self.token,'Content-Type':'application/json'},method=method)
  try:
   with self.opener.open(request,timeout=45) as response:
    raw=response.read();return json.loads(raw) if raw else {}
  except urllib.error.HTTPError as error: raise self.http_error(error,'Hosting '+method) from None
  except (urllib.error.URLError,TimeoutError):
   if method!='GET':self.report['remoteOutcomeUncertain']=True;self.save()
   raise RuntimeError('Timeout/conexão Hosting: consultar o recibo antes de repetir; operação remota pode ter ocorrido') from None
 def live(self):
  live=self.api(PREFIX+'/channels/live');version=live.get('release',{}).get('version',{}).get('name','')
  require(version_ok(version),'Versão live inválida');return version
 def files(self,version):
  require(version_ok(version),'Versão fora do site DEV')
  files=[];page=None;seen=set()
  while True:
   query={'pageSize':1000}
   if page:query['pageToken']=page
   value=self.api('/v1beta1/'+version+'/files',query=query)
   files.extend(value.get('files',[]));require(len(files)<=1000,'Inventário excede o limite operacional')
   page=value.get('nextPageToken')
   if not page:break
   require(page not in seen,'Paginação Hosting repetiu token');seen.add(page)
  return files
 def upload(self,url,sha,data):
  parsed=urllib.parse.urlsplit(url);vid=self.version.rsplit('/',1)[-1]
  require(parsed.scheme=='https' and parsed.hostname=='upload-firebasehosting.googleapis.com' and not parsed.query and not parsed.fragment and not parsed.username and not parsed.password and parsed.port in (None,443),'Destino de upload inesperado')
  require(bool(re.fullmatch(r'/upload/(?:projects/(?:'+P+'|'+N+r')/)?sites/'+P+'/versions/'+re.escape(vid)+r'/files/?',parsed.path)),'Upload fora da versão/site')
  require(digest(data)==sha,'Conteúdo de upload divergente')
  destination=urllib.parse.urlunsplit(parsed._replace(path=parsed.path.rstrip('/')+'/'+sha))
  self.report['lastUploadIntent']={'sha256':sha,'bytes':len(data)};self.save()
  try:
   request=urllib.request.Request(destination,data=data,headers={'Authorization':'Bearer '+self.token,'Content-Type':'application/octet-stream'},method='POST')
   with self.opener.open(request,timeout=45) as response: require(response.status==200,'Upload não confirmado');response.read()
  except urllib.error.HTTPError as error: raise self.http_error(error,'Upload Hosting') from None
  except (urllib.error.URLError,TimeoutError):
   self.report['remoteOutcomeUncertain']=True;self.save();raise RuntimeError('Upload incerto; não criar outra versão nem repetir sem conferir recibo') from None
  self.report['uploadedFiles']+=1;self.report['uploadedBytes']+=len(data);self.report.pop('lastUploadIntent',None);self.save()

def canonical_destination(location,current,nonce):
 target=urllib.parse.urlsplit(urllib.parse.urljoin(current,location))
 require(target.scheme=='https' and target.hostname==HOST and target.port in (None,443) and not target.username and not target.password and not target.fragment,'Redirecionamento fora da origem DEV')
 require(target.path=='/','Destino cleanUrls diferente da raiz observada')
 require(not target.query or target.query==urllib.parse.urlencode({'visual':nonce}),'Query inesperada no redirecionamento')
 return target.path

def fetch_public(path,config,nonce,opener=None):
 require(path.startswith('/') and not path.startswith('//') and '?' not in path and '#' not in path,'Caminho público inválido')
 if opener is None:
  class NoRedirect(urllib.request.HTTPRedirectHandler):
   def redirect_request(self,*args,**kwargs):return None
  opener=urllib.request.build_opener(NoRedirect)
 current=path;seen=set();redirects=[]
 for step in range(3):
  require(current not in seen,'Ciclo no redirecionamento público');seen.add(current)
  url='https://'+HOST+urllib.parse.quote(current,safe='/')
  if current!='/index.html':url+='?'+urllib.parse.urlencode({'visual':nonce})
  request=urllib.request.Request(url,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'})
  try:
   with opener.open(request,timeout=30) as response:
    require(response.status==200,'Status público inesperado')
    require(response.headers.get('Content-Encoding','identity').lower() in {'identity',''},'Codificação pública inesperada')
    raw=response.read(20*1024**2+1);require(len(raw)<=20*1024**2,'Resposta pública excedeu limite')
    headers={k:response.headers.get(k) for k in ['Content-Security-Policy','X-Frame-Options','X-Content-Type-Options','Cache-Control','Content-Type','ETag','Age','X-Cache']}
    return raw,headers,redirects
  except urllib.error.HTTPError as error:
   require(path=='/index.html' and config.get('cleanUrls') is True and step==0 and error.code in {301,308},'HTTP '+str(error.code)+' inesperado em '+current)
   location=error.headers.get('Location','');require(bool(location),'Redirecionamento sem destino')
   destination=canonical_destination(location,url,nonce)
   redirects.append({'HTTP':error.code,'from':current,'to':destination});current=destination
  except (urllib.error.URLError,TimeoutError):raise RuntimeError('Leitura pública indisponível em '+current) from None
 raise RuntimeError('Redirecionamentos excederam limite')

def inspect_dist(dist,source):
 public=source/'frontend/public';allowed={p.relative_to(public).as_posix():digest(p.read_bytes()) for p in public.rglob('*') if p.is_file()}
 files={};total=0;css=b'';js=b''
 for p in sorted(dist.rglob('*')):
  if not p.is_file():continue
  require(not p.is_symlink() and p.resolve().is_relative_to(dist.resolve()),'Link fora do artefato público')
  rel=p.relative_to(dist).as_posix();data=p.read_bytes();suffix=p.suffix.lower()
  require(not any(part.startswith('.') for part in pathlib.PurePosixPath(rel).parts),'Arquivo oculto no build')
  valid=rel in {'index.html','version.json'} or (rel in allowed and digest(data)==allowed[rel])
  valid=valid or (rel.startswith('assets/') and suffix in {'.js','.css','.woff2','.woff','.ttf','.svg','.png','.jpg','.mp3'})
  require(valid,'Arquivo não autorizado no Hosting: '+rel)
  if suffix in {'.html','.js','.css','.json'}:
   for marker in [b'__insightpadQa',b'qa-controls',b'qa/application.html',b'QA completo com fixtures',b'KIT TECLADO QA',b'-----BEGIN PRIVATE KEY-----']:
    require(marker not in data,'QA/mock/segredo indevido no artefato normal: '+rel)
  if suffix=='.css':css+=data
  if suffix=='.js':js+=data
  total+=len(data);files['/'+rel]={'rawSHA256':digest(data),'rawBytes':len(data),'data':data}
 require(0<len(files)<=1000 and total<=100*1024**2,'Tamanho/inventário Hosting fora do limite')
 require(set('/'+x for x in allowed)<=set(files),'Asset público original ausente')
 require(b'ip-ui' in css and b'ip-ui' in js and b'ip-login-v2' in css and b'ip-login-v2' in js,'Login v2 não identificado no build normal')
 require(b'--dv-submenu-offset' in js and b'--dv-donut-font' in css,'Refinamento v6 não identificado no artefato normal')
 require(b'channel-alert-readiness' not in js and b'channel-alert-readiness' not in css and b'channel-alert-slot' not in js and b'channel-alert-slot' not in css,'Controle aposentado do rodapé ainda presente no artefato')
 require(b'ip-pos-route' in css and b'ip-pos-route' in js and b'ip-pos-modal' in css and b'--pdv-panel' in css and b'onContinueWithoutOpening' in js and b'Conferir abertura' in js,'PDV preservado não identificado no artefato normal')
 require(b'[data-cadastros]' in css and b'.cad-page' in css and b'.cad-module' in css and b'--cad-dialog' in css and b'cad-form-notice' in js,'Cadastros preservado não identificado no artefato normal')
 require(b'.work-stock' in css and b'.work-sales' in css and b'stock-operation-modal--create' in css and b'work-stock' in js and b'work-sales' in js,'Estoque/Registros preservados não identificados no build normal')
 require(b'.work-orders' in css and b'.work-connections' in css and b'pedido-scroll' in js and b'channels-main-scroll' in js,'Canais preservado não identificado no build normal')
 require(b'.work-platform' in css and b'--pla-panel' in css and b'margin-inline-start:6px' in css and b'work-platform' in js and b'data-platform-view' in js and b'platform-saving' in js,'Plataforma aprovada não identificada no build normal')
 require(b'.ip-shell' in css and b'--rail-target' in css and b'--drawer-height' in css and b'ip-shell' in js and b'user-drawer__heading' in js and b'user-drawer__body' in js and b'aria-haspopup' in js,'Barras globais aprovadas não identificadas no build normal')
 require(all(marker in css for marker in [b'.menus-submenu',b'.menus-card',b'--menu-blue',b'--menu-green']) and all(marker in js for marker in [b'menus-submenu',b'menus-card__face--filled',b'menus-card--pressed',b'menus-card__icon']),'Menus aprovados não identificados no artefato normal')
 require(all(marker in css for marker in [b'.dv-floating-tooltip',b'.has-applied-filter',b'.ip-analysis-report']) and all(marker in js for marker in [b'has-applied-filter','Selecionar / adicionar quantidade'.encode(),'Voltar para Vendas'.encode()]),'Ajustes finos aprovados não identificados no artefato normal')
 require(b'ip-ec' in css and b'EcCommand' in js and b'EcRead' in js,'Encomendas/Comandas ausentes do build normal')
 require('/brand/insight-pad-logo-compact.png' in files,'Marca compacta da barra ausente')
 require('/brand/login-flow-dark.svg' in files and '/brand/login-flow-light.svg' in files,'SVGs de login ausentes')
 require(all(x in files for x in ['/index.html','/version.json','/brand/insight-pad-interface.png','/fonts/interface/DejaVuSans.ttf','/fonts/interface/LICENSE.txt']),'Artefato visual incompleto')
 value=json.loads(files['/version.json']['data']);require(value.get('project')==P and value.get('commit')==SHA,'Marcador de versão fora do alvo')
 return files,total

def ensure_candidate(source,bundle,command,environment):
 if bundle.is_file():require(digest(bundle.read_bytes())==BUNDLE_SHA,'Bundle aprovado com hash divergente')
 try:command(['git','-C',str(source),'cat-file','-e',SHA+'^{commit}'],label='candidate-local')
 except RuntimeError:
  if bundle.is_file():
   command(['git','-C',str(source),'bundle','verify',str(bundle)],label='verify-approved-bundle')
   command(['git','-C',str(source),'fetch',str(bundle),'HEAD'],env=environment,label='import-approved-bundle',timeout=180)
  else:
   command(['git','-C',str(source),'fetch','--no-tags',SOURCE,SHA],env=environment,label='fetch-exact-approved-candidate',timeout=180)

def prepare_workspace(donor,record,save):
 # Measure this Cloud Shell now; no assumption about a historical /tmp or Docker.
 tmp=pathlib.Path('/tmp').resolve()
 require(tmp.is_dir(),'Diretório /tmp indisponível; nenhuma limpeza ou mutação remota')
 dependencies=donor/'frontend/node_modules'
 size=sum(p.stat().st_size for p in dependencies.rglob('*') if p.is_file() and not p.is_symlink()) if dependencies.is_dir() else 0
 required=max(size+768*1024**2,3*1024**3)
 storage={'homeFreeBytes':shutil.disk_usage(ROOT).free,'tmpFreeBytes':shutil.disk_usage(tmp).free,
  'homeDevice':ROOT.stat().st_dev,'tmpDevice':tmp.stat().st_dev,
  'tmpRoot':str(tmp),'donorDependencyBytes':size,'tmpMinimumBytes':required,
  'homeMinimumBytes':64*1024**2,'noCleanupPerformed':True,'receiptLocation':str(ROOT),
  'budget':'Historical planning reserves are not measured spend; cap USD5 unchanged. No automatic per-release surcharge. Actual billing not measured.'}
 record['storage']=storage;save()
 require(storage['homeFreeBytes']>=storage['homeMinimumBytes'],'HOME sem reserva de 64 MiB para recibos; não limpar arquivos alheios')
 require(storage['tmpFreeBytes']>=required,'/tmp sem espaço suficiente para checkout/dependências/build; não limpar arquivos alheios')
 work=pathlib.Path(tempfile.mkdtemp(prefix='InsightPad_P58_Encomendas_Comandas_',dir=str(tmp)))
 work.chmod(0o700)
 (work/'owner-private.json').write_text(json.dumps({'operation':record['operationLabel'],'candidate':SHA,'receiptRoot':str(ROOT),'private':True}))
 storage.update({'workspace':str(work),'privateMode':oct(work.stat().st_mode & 0o777),'preserveWorkspace':True});save()
 return work

def check_storage(work,needed,record,save,stage):
 evidence={'stage':stage,'workspaceFreeBytes':shutil.disk_usage(work).free,
  'workspaceMinimumBytes':needed,'homeFreeBytes':shutil.disk_usage(ROOT).free}
 record['storage'].setdefault('checks',[]).append(evidence);save()
 require(evidence['workspaceFreeBytes']>=needed,'Espaço insuficiente em /tmp em '+stage+'; não limpar arquivos alheios')
 require(evidence['homeFreeBytes']>=16*1024**2,'HOME sem reserva para recibos em '+stage+'; interromper antes da próxima mutação')

def bounded_uploads(files):
 require(0<len(files)<=100,'Inventário excede100 arquivos; preservar escopo antes de publicar')
 require(sum(len(f['data']) for f in files.values())<=10*1024**2,'Artefato excede10MiB; não ampliar escopo automaticamente')
 by_hash={};mapping={}
 for path,f in files.items():
  data=gzip.compress(f['data'],mtime=0);h=digest(data);by_hash[h]=data;mapping[path]=h
 require(sum(map(len,by_hash.values()))<=5*1024**2,'Upload comprimido excede5MiB; não ampliar escopo automaticamente')
 return by_hash,mapping

def wait_public(client,files,record,save,read=None,clock=time.monotonic,pause=time.sleep,attempt_limit=8,seconds=120):
 require(callable(read),'Transporte público explícito ausente')
 deadline=clock()+seconds
 for attempt in range(1,attempt_limit+1):
  require(same_version(client.live(),client.version),'Live mudou durante verificação; preservar publicação concorrente')
  nonce=uuid.uuid4().hex;verified=0;mismatch=None
  paths=['/version.json']+[x for x in sorted(files) if x!='/version.json']
  for item in paths:
   if clock()>deadline:mismatch={'path':item,'reason':'prazo de verificação atingido'};break
   raw,headers=read(item,nonce)
   if digest(raw)!=files[item]['rawSHA256']:
    mismatch={'path':item,'expectedSHA256':files[item]['rawSHA256'],'observedSHA256':digest(raw),'bytes':len(raw),'headers':headers};break
   verified+=1
  record.setdefault('publicReadAttempts',[]).append({'attempt':attempt,'verifiedFiles':verified,'mismatch':mismatch});save()
  if mismatch is None:
   require(same_version(client.live(),client.version),'Live mudou ao concluir verificação')
   record['publicFilesVerified']=verified;return
  print('Conferência pública '+str(attempt)+'/'+str(attempt_limit)+': divergência registrada; repetindo somente leituras.',flush=True)
  if attempt<attempt_limit and clock()<deadline:pause(min(5,max(0,deadline-clock())))
 raise RuntimeError('Conteúdo servido não convergiu aos hashes dentro do limite; consultar publicReadAttempts')

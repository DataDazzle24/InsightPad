"""Operação exclusiva de Hosting DEV. Executar na Cloud Shell autenticada de Arthur."""
import contextlib, copy, datetime as dt, gzip, hashlib, io, json, os, pathlib, re, shutil, subprocess, sys, urllib.error, urllib.parse, urllib.request, uuid, tempfile

P, N = 'insightpad-dd-dev', '102484114817'
SHA = '6e727a05fcd987b236ee11646c4c70e4bc88fcf5'
BUNDLE_SHA = None  # No bundle is provided; fetch only the exact approved Git object.
PREFLIGHT_SHA = '44295c877e9d7553a5849a8c58470394b6cbd1de05a75ef31eab27cc5847e228'
ROOT = pathlib.Path.home()/'InsightPad_DEV_Cadastros_6e727a0'
PREFIX = '/v1beta1/projects/'+P+'/sites/'+P
SOURCE = 'https://github.com/DataDazzle24/InsightPad.git'

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

HOST=P+'.web.app'
PUBLIC_CONFIG={}
CLEAN_REDIRECTS=[]

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
    headers={k:response.headers.get(k) for k in ['Content-Security-Policy','X-Frame-Options','X-Content-Type-Options','Cache-Control']}
    return raw,headers,redirects
  except urllib.error.HTTPError as error:
   require(path=='/index.html' and config.get('cleanUrls') is True and step==0 and error.code in {301,308},'HTTP '+str(error.code)+' inesperado em '+current)
   location=error.headers.get('Location','');require(bool(location),'Redirecionamento sem destino')
   destination=canonical_destination(location,url,nonce)
   redirects.append({'HTTP':error.code,'from':current,'to':destination});current=destination
  except (urllib.error.URLError,TimeoutError):raise RuntimeError('Leitura pública indisponível em '+current) from None
 raise RuntimeError('Redirecionamentos excederam limite')

def compare_inventory(client,files,previous):
 managed={
  '/__/firebase/init.js':'89a500475db1fe2b1d315c45b9bd08cd85cffe1bdca17325133ac57080e103ce',
  '/__/firebase/init.json':'9be5c645e6fcec34bf91c8125a73c25bee59f8040a6ec7ed3685cfde089a4dfb'}
 require(not (set(files)&set(managed)),'Arquivo reservado incluído no artefato local')
 remote=client.files(client.version)
 paths={item.get('path'):item.get('hash') for item in remote}
 require(len(paths)==len(remote),'Inventário remoto contém caminhos duplicados')
 require(set(paths)==set(files)|set(managed),'Inventário remoto não corresponde ao frontend e aos dois arquivos Firebase observados')
 expected={path:digest(gzip.compress(value['data'],mtime=0)) for path,value in files.items()}
 require({path:paths[path] for path in files}==expected,'Hashes remotos não correspondem ao artefato P51')
 require({path:paths[path] for path in managed}==managed,'Arquivos reservados Firebase diferem do inventário observado')
 require(all(item.get('status')=='ACTIVE' for item in remote),'Arquivo remoto não está ACTIVE')
 prior_files=client.files(previous)
 prior={item.get('path'):item for item in prior_files}
 require(len(prior)==len(prior_files),'Inventário da versão anterior contém duplicatas')
 require(all(prior.get(path,{}).get('hash')==value and prior.get(path,{}).get('status')=='ACTIVE' for path,value in managed.items()),'Configuração Firebase reservada difere da versão anterior')
 return len(remote)


def verify_frozen_ci():
 from html.parser import HTMLParser
 run='42512777678'; job='128829349457'
 base='https://github.com/DataDazzle24/InsightPad/actions/runs/'+run
 class Steps(HTMLParser):
  def __init__(self):super().__init__();self.values=[]
  def handle_starttag(self,tag,attributes):
   if tag=='check-step':
    value=dict(attributes);self.values.append((value.get('data-name'),value.get('data-conclusion')))
 pages=[]
 for url in [base,base+'/job/'+job]:
  request=urllib.request.Request(url+'?insightpad_ci='+uuid.uuid4().hex,headers={'User-Agent':'InsightPad-DEV-release-preflight','Cache-Control':'no-cache'})
  with urllib.request.build_opener(NoRedirect).open(request,timeout=30) as response:
   require(response.status==200,'Página do CI indisponível')
   data=response.read(3*1024**2+1);require(len(data)<=3*1024**2,'Página do CI excede limite');pages.append(data.decode())
 state=re.search(r'>Status</span>\s*<span[^>]*>([^<]+)</span>',pages[0])
 require(state and state.group(1).strip()=='Success','CI congelado não está aprovado; não executar suites novamente')
 require(SHA in pages[0] and SHA in pages[1],'CI não corresponde ao candidato')
 parser=Steps();parser.feed(pages[1])
 require(len(parser.values)>=27 and all(result=='success' for _,result in parser.values),'Etapa obrigatória do CI não aprovada')
 required={'Conferir SHA do candidato','Compilar contratos e conferir SDKs gerados','Frontend (lint, testes, tipos e build)','Functions (tipos, testes e build)','Aplicação QA com Auth e API mockados','Conferir preservação da fonte recuperada','PostgreSQL 18 descartável (aborto e locks, sem rede)','Renovação de sessão pelo compilador Data Connect isolado','Cobertura integrada QA existente'}
 require(required<={name for name,_ in parser.values},'Checks obrigatórios ausentes do CI')
 return {'run':run,'job':job,'candidate':SHA,'passed':True,'steps':len(parser.values)}


def public_bytes(path, nonce):
 raw,headers,chain=fetch_public(path,PUBLIC_CONFIG,nonce)
 CLEAN_REDIRECTS.extend(chain)
 return raw,headers

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
   for marker in [b'__insightpadQa',b'qa-controls',b'qa/application.html',b'QA completo com fixtures',b'-----BEGIN PRIVATE KEY-----']:
    require(marker not in data,'QA/mock/segredo indevido no artefato normal: '+rel)
  if suffix=='.css':css+=data
  if suffix=='.js':js+=data
  total+=len(data);files['/'+rel]={'rawSHA256':digest(data),'rawBytes':len(data),'data':data}
 require(0<len(files)<=1000 and total<=100*1024**2,'Tamanho/inventário Hosting fora do limite')
 require(set('/'+x for x in allowed)<=set(files),'Asset público original ausente')
 require(b'ip-ui' in css and b'ip-ui' in js and b'ip-login-v2' in css and b'ip-login-v2' in js,'Login v2 não identificado no build normal')
 require(b'--dv-submenu-offset' in js and b'--dv-donut-font' in css,'Refinamento v6 não identificado no artefato normal')
 require(b'channel-alert-readiness' not in js and b'channel-alert-readiness' not in css and b'channel-alert-slot' not in js and b'channel-alert-slot' not in css,'Controle aposentado do rodapé ainda presente no artefato')
 require(b'ip-pos-route' in css and b'ip-pos-route' in js and b'ip-pos-modal' in css and b'--pdv-panel' in css and b'onContinueWithoutOpening' in js and b'Conferir abertura' in js,'Cadastros UI não identificada no artefato normal')
 require(b'[data-cadastros]' in css and b'.cad-page' in css and b'.cad-module' in css and b'--cad-dialog' in css and b'cad-form-notice' in js,'Cadastros UI não identificada no artefato normal')
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


def prior_receipts():
 # Preserve the original P50 journal and block retries after ANY prior write.
 return sorted(ROOT.glob('P51-*/P51-publicacao.json'))

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
 work=pathlib.Path(tempfile.mkdtemp(prefix='InsightPad_P51_6e727a0_',dir=str(tmp)))
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

def main():
 os.umask(0o077);ROOT.mkdir(mode=0o700,exist_ok=True)
 for prior in prior_receipts():
  value=json.loads(prior.read_text())
  if value.get('remoteMutationAttempted'):
   print('Já existe recibo com mutação. NÃO reenviando publicação: '+str(prior))
   print(prior.read_text());return 2
 out=ROOT/('P51-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:6]);out.mkdir(mode=0o700)
 report=out/'P51-publicacao.json'
 record={'phase':'P51_CADASTROS_HOSTING_DEV','CORE':'CORE não gravada','project':P,'candidate':SHA,
  'startedUTC':dt.datetime.now(dt.timezone.utc).isoformat(),'remoteMutationAttempted':False,'hostingPublished':False,'publisherRevision':'P51-v2-cadastros-cap5-bounded-artifact-no-flat-reserve','publisherFile':str(pathlib.Path(__file__).resolve()),'publisherSHA256':digest(pathlib.Path(__file__).read_bytes()),
  'functionsPublished':False,'connectorPublished':False,'schemaChanged':False,'migrationExecuted':False,'IAMChanged':False,
  'authenticatedSmokesExecuted':False,'publicArtifactVerified':False,'uploadedFiles':0,'uploadedBytes':0,'operationLabel':out.name.lower(),
  'cost':{'capUSD':5,'priorPlanningEnvelopeUSD':5.00,'additionalFlatReserveUSD':0,'incrementalCostUSD':None,'planningTotalUSD':5.00,'measuredGoogleCloudUSD':None,'limit':'Estimativa, não trava de cobrança; apenas versões/arquivos do Hosting já existente. Sem Cloud Build ou recurso adicional.'}}
 def save():
  temporary=report.with_suffix('.tmp');temporary.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');temporary.replace(report)
 def command(args,cwd=None,env=None,label='comando',stdin=None,timeout=180):
  result=subprocess.run(args,cwd=cwd,env=env,input=stdin,text=True,capture_output=True,timeout=timeout)
  # Never persist output from auth print-access-token.
  if label!='token':(out/(label+'.log')).write_text(result.stdout+'\n'+result.stderr)
  require(result.returncode==0,label+' falhou (exit '+str(result.returncode)+'); diagnóstico privado em '+str(out/(label+'.log')))
  return result.stdout
 def preflight(stage):
  path=pathlib.Path(__file__).resolve().with_name('P51-preflight.py')
  require(path.is_file() and digest(path.read_bytes())==PREFLIGHT_SHA,'Preflight P51 ausente ou hash divergente')
  namespace={'__name__':'__main__','RESOURCE_ONLY_PREFLIGHT':stage=='before-rollback'}
  with contextlib.redirect_stdout(io.StringIO()):exec(compile(path.read_text(),str(path),'exec'),namespace)
  value=namespace['record'];ready=value.get('readyForRollbackResourceCheck') if stage=='before-rollback' else value.get('readyForFrontendPreparation')
  record['preflight-'+stage]={'report':str(namespace['report']),'ready':ready,'nineControlsConfirmed':value.get('nineControlsConfirmed')};save()
  require(ready,value.get('stopped','Preflight bloqueado'))
  return value,namespace['snapshots']
 client=None;release_attempted=False;files={};config={};previous=''
 try:
  save();record['CI']=verify_frozen_ci();save();print('1/5 Conferindo identidade, backend, release e contenções (somente leitura).',flush=True)
  first,snapshot=preflight('initial');previous=first['previousRelease']['version'];config=copy.deepcopy(snapshot['previous-version'].get('config',{}))
  require(same_version(previous,'projects/insightpad-dd-dev/sites/insightpad-dd-dev/versions/6b49361abe1815f7') and config_hash(config)=='181631570eb25187481a9570d79211250b25dd95fd4eaf1dbe68fc656aa97c2c','Hosting divergiu da baseline P50R 9c50ee2 confirmada; preservar alteração concorrente')
  require(first.get('publicVersionBefore',{}).get('commit')!=SHA,'O candidato já está servido. Conferir a release existente, sem republicar cegamente')
  require(first.get('publicVersionBefore',{}).get('commit')=='9c50ee250c54ed9b2ab6a2b4656aedff1fb9a63a','Frontend anterior divergente; não sobrescrever')
  PUBLIC_CONFIG.update(config)
  baseline_nonce=uuid.uuid4().hex
  old_index,_,old_chain=fetch_public('/index.html',config,baseline_nonce)
  old_login,_,_=fetch_public('/login',config,baseline_nonce)
  require(digest(old_index)==digest(old_login),'Entrada canônica anterior divergiu de /login')
  record['baselineCleanUrls']={'enabled':config.get('cleanUrls'),'redirects':old_chain,'indexMatchesLogin':True}
  record['previousVersion']=previous;record['previousRelease']=first['previousRelease'];record['servingConfigSHA256']=config_hash(config)
  record['retention']={'previousVersionDeleteRequested':False,'priorReleaseRetainAtLeastUntilUTC':(dt.datetime.now(dt.timezone.utc)+dt.timedelta(days=7)).isoformat(),'currentVersion':'Enquanto live; não remover proteção utilizável'}
  token=command(['gcloud','auth','print-access-token','--project='+P],label='token').strip();client=Hosting(token,record,save)
  require(same_version(client.live(),previous),'Release mudou durante preflight')
  print('2/5 Preparando checkout isolado e build normal do frontend DEV.',flush=True)
  donors=[pathlib.Path(x['path']) for x in first['existingCheckouts'] if (pathlib.Path(x['path'])/'frontend/package-lock.json').is_file()]
  donor=next((p for p in donors if digest((p/'frontend/package-lock.json').read_bytes())=='06a3d7360db9ee61fa02c9cddffd29727d91f9f7fe766a4eae0c4452f61f971c' and digest((p/'frontend/package.json').read_bytes())=='ff9132a7d28b683a87a80deb2f95ad2e4098e19e3545e9229aa03b03c9027a3e'),donors[0] if donors else None)
  require(donor is not None,'Fonte Git existente indisponível')
  bundle=pathlib.Path(__file__).resolve().with_name('candidato-6e727a0.bundle')
  work=prepare_workspace(donor,record,save)
  source=work/'source';environment=dict(os.environ,GIT_TERMINAL_PROMPT='0',GCM_INTERACTIVE='never')
  command(['git','clone','--shared','--no-checkout',str(donor),str(source)],env=environment,label='clone-local')
  ensure_candidate(source,bundle,command,environment)
  command(['git','-C',str(source),'checkout','--detach',SHA],label='checkout-isolated')
  require(command(['git','-C',str(source),'rev-parse','HEAD'],label='checkout-head').strip()==SHA,'SHA incorreto')
  require(not command(['git','-C',str(source),'status','--porcelain'],label='checkout-status').strip(),'Checkout isolado sujo')
  record['source']={'commit':SHA,'tree':command(['git','-C',str(source),'rev-parse','HEAD^{tree}'],label='checkout-tree').strip(),'dirty':False,'repository':SOURCE,'checkout':'isolated detached clone'}
  cfg=json.loads((source/'firebase.json').read_text());projects=json.loads((source/'.firebaserc').read_text())
  require(cfg['hosting']['site']==P and cfg['hosting']['public']=='frontend/dist' and projects['projects']['default']==P,'Configuração frontend não aponta para DEV')
  # Real backend sources must be identical to the frozen candidate, not inferred from old receipts.
  for suffix,folder in [('schemas/main','schema'),('connectors/app','app')]:
   actual={p.relative_to(source/'dataconnect'/folder).as_posix():digest(p.read_bytes()) for p in (source/'dataconnect'/folder).rglob('*') if p.is_file() and p.suffix in {'.gql','.graphql'}}
   remote={f['path']:digest(f['content'].encode()) for f in snapshot[suffix.replace('/','-')]['source']['files']}
   require(actual==remote,'Contrato local não coincide com o backend servido')
  node=pathlib.Path(first['node22']['path']);env={k:v for k,v in os.environ.items() if not k.startswith(('VITE_','QA_'))}
  env.update({'PATH':str(node.parent)+os.pathsep+env.get('PATH',''),'NODE_ENV':'production','GIT_TERMINAL_PROMPT':'0'})
  front=source/'frontend';lock=front/'package-lock.json';before_lock=digest(lock.read_bytes())
  temporary=work/'temp';temporary.mkdir(mode=0o700)
  env.update({'TMPDIR':str(temporary),'npm_config_cache':str(work/'npm-cache')})
  npm_candidates=[pathlib.Path.home()/'InsightPad_DEC035_OP_20261028T165248Z/tools-node22/node_modules/npm/bin/npm-cli.js']
  if shutil.which('npm'):npm_candidates.append(pathlib.Path(shutil.which('npm')).resolve())
  tools=next((path for path in npm_candidates if path.is_file()),None)
  require(tools is not None,'npm existente do toolchain não localizado')
  reuse=(donor/'frontend/node_modules').is_dir() and digest((donor/'frontend/package-lock.json').read_bytes())==before_lock and (donor/'frontend/package.json').read_bytes()==(front/'package.json').read_bytes()
  if reuse:
   size=sum(p.stat().st_size for p in (donor/'frontend/node_modules').rglob('*') if p.is_file() and not p.is_symlink())
   check_storage(work,size+512*1024**2,record,save,'before-dependency-copy')
   shutil.copytree(donor/'frontend/node_modules',front/'node_modules',symlinks=True)
   sdk=front/'node_modules/@insightpad/dataconnect'
   if sdk.is_symlink():sdk.unlink()
   elif sdk.exists():shutil.rmtree(sdk)
   sdk.parent.mkdir(parents=True,exist_ok=True);sdk.symlink_to('../../src/dataconnect-generated',target_is_directory=True)
   try:command([str(node),str(tools),'ls','--depth=0','--json','--ignore-scripts','--no-audit'],cwd=front,env=env,label='verify-reused-dependencies')
   except RuntimeError:
    shutil.rmtree(front/'node_modules');reuse=False
  if not reuse:
   check_storage(work,3*1024**3,record,save,'before-locked-install')
   command([str(node),str(tools),'ci','--include=dev','--no-audit','--no-fund'],cwd=front,env=env,label='install-locked-frontend',timeout=600)
  require(digest(lock.read_bytes())==before_lock,'Lockfile mudou; parar')
  record['dependenciesReused']=reuse
  client_config=snapshot['public-client-config']
  writer="import {writeDevConfig} from './scripts/ci-dev-config.mjs';let data='';for await (const part of process.stdin)data+=part;const r=writeDevConfig(process.cwd(),JSON.parse(data));console.log(r.sha256)"
  fingerprint=command([str(node),'--input-type=module','-e',writer],cwd=source,env=env,stdin=json.dumps(client_config),label='real-public-dev-config').strip()
  record['normalBuild']={'entry':'frontend/index.html','mode':'development','NODE_ENV':'production','project':P,'QA':False,'node':first['node22']['version'],'clientConfigFingerprint':fingerprint}
  command([str(node),str(front/'node_modules/typescript/bin/tsc'),'-b'],cwd=front,env=env,label='frontend-types',timeout=300)
  command([str(node),str(front/'node_modules/vite/bin/vite.js'),'build','--mode','development','--config',str(front/'vite.config.ts')],cwd=front,env=env,label='frontend-normal-build',timeout=300)
  dist=front/'dist';public={'project':P,'commit':SHA,'builtUTC':dt.datetime.now(dt.timezone.utc).isoformat()}
  (dist/'version.json').write_text(json.dumps(public,separators=(',',':'))+'\n')
  require(not command(['git','-C',str(source),'status','--porcelain'],label='final-checkout-status').strip(),'Fonte mudou durante build')
  files,total=inspect_dist(dist,source);record.update({'sourceRoot':str(source),'publicFiles':len(files),'rawBytes':total,'publicVersion':public})
  manifest={'candidate':SHA,'project':P,'normalBuild':record['normalBuild'],'files':{p:{k:v for k,v in f.items() if k!='data'} for p,f in files.items()}}
  (out/'artifact-manifest-private.json').write_text(json.dumps(manifest,indent=2))
  record['artifactManifestSHA256']=digest((out/'artifact-manifest-private.json').read_bytes());save()
  by_hash,mapping=bounded_uploads(files)
  record['artifactBounds']={'maxFiles':100,'rawMaxBytes':10*1024**2,'gzipUniqueMaxBytes':5*1024**2,'gzipUniqueBytes':sum(map(len,by_hash.values())),'measuredBilling':False};save()
  check_storage(work,total*2+64*1024**2,record,save,'before-hosting-mutation')
  current,fresh=preflight('before-upload')
  require(same_version(current['previousRelease']['version'],previous) and fresh['previous-version']['config']==config,'Release/configuração mudou; preservar alteração concorrente')
  print('3/5 Criando uma versão do Hosting DEV e enviando somente o artefato normal.',flush=True)
  client.token=command(['gcloud','auth','print-access-token','--project='+P],label='token').strip()
  created=client.api(PREFIX+'/versions','POST',{'status':'CREATED','labels':{'insightpad-candidate':SHA,'insightpad-operation':record['operationLabel']}})
  version=created.get('name','');require(version_ok(version),'Versão criada fora de DEV');client.version=version;record['version']=version;save()
  staging=work/'upload-private';staging.mkdir(mode=0o700)
  for h,data in by_hash.items():(staging/h).write_bytes(data)
  client.file_map=mapping
  result=client.api('/v1beta1/'+version+':populateFiles','POST',{'files':mapping})
  required=set(result.get('uploadRequiredHashes',[]));require(required<=set(by_hash),'Upload requisitou hash não manifestado')
  for index,h in enumerate(sorted(required),1):
   print('Upload '+str(index)+'/'+str(len(required)),flush=True);client.upload(result.get('uploadUrl',''),h,by_hash[h])
  finalized=client.api('/v1beta1/'+version,'PATCH',{'status':'FINALIZED','config':config},{'updateMask':'status,config'})
  require(finalized.get('status')=='FINALIZED' and same_config(finalized.get('config',{}),config),'Configuração ou finalização divergiu; não publicar')
  record['remoteFilesMatched']=compare_inventory(client,files,previous);record['managedHostingFilesMatched']=2;save()
  last,fresh=preflight('before-release')
  require(same_version(last['previousRelease']['version'],previous) and fresh['previous-version']['config']==config,'Publicação concorrente detectada')
  require(all(fresh.get(name)==value for name,value in snapshot.items() if name.endswith('-policy')),'Política mudou durante preparação; preservar alteração concorrente')
  require(client.api('/v1beta1/'+previous).get('status')=='FINALIZED','Versão anterior indisponível para reversão')
  print('4/5 Publicando a versão e conferindo o conteúdo efetivamente servido.',flush=True)
  client.token=command(['gcloud','auth','print-access-token','--project='+P],label='token').strip()
  release_attempted=True;record['releaseAttempted']=True;save()
  release=client.api(PREFIX+'/channels/live/releases','POST',{'message':'Reviewed visual-only frontend '+SHA+'; backend/Functions/rewrites unchanged.'},{'versionName':version})
  record['release']={'name':release.get('name'),'releaseTime':release.get('releaseTime'),'version':release.get('version',{}).get('name')};save()
  require(same_version(client.live(),version),'Nova versão não confirmada como live')
  record['hostingPublished']=True;save()
  require(same_config(client.api('/v1beta1/'+version).get('config',{}),config),'Configuração live mudou')
  nonce=uuid.uuid4().hex;verified=0
  for path,f in files.items():
   raw,headers=public_bytes(path,nonce);require(digest(raw)==f['rawSHA256'],'Conteúdo público divergente: '+path);verified+=1
  record['publicFilesVerified']=verified;record['cleanUrlsRedirects']=list(CLEAN_REDIRECTS)
  raw,headers=public_bytes('/login',nonce);require(digest(raw)==files['/index.html']['rawSHA256'],'Entrada /login não corresponde ao build')
  wanted={key.lower():value for rule in config.get('headers',[]) if rule.get('glob')=='**' for key,value in rule.get('headers',{}).items()}
  require(all(headers.get(k)==wanted.get(k.lower()) for k in ['Content-Security-Policy','X-Frame-Options','X-Content-Type-Options']),'Headers públicos divergentes')
  require('no-store' in (headers.get('Cache-Control') or '').lower(),'HTML sem proteção de cache esperada')
  for route_path in ['/modulos/cadastros','/cadastros/categorias','/cadastros/subcategorias','/cadastros/produtos','/cadastros/clientes','/cadastros/fornecedores','/cadastros/filiais','/vendas/frente-de-caixa']:
   route,route_headers=public_bytes(route_path,nonce);require(digest(route)==files['/index.html']['rawSHA256'],'Entrada da rota não corresponde ao build: '+route_path)
  record['publicCadastroRoutesHTTPVerified']=7
  record['publicArtifactVerified']=True;record['publicLoginHTTPVerified']=True;record['publicPdvHTTPVerified']=True;save()
  print('5/5 Revalidando contenções, backend e reversão disponível; sem smokes financeiros.',flush=True)
  after,post=preflight('after-release')
  require(same_version(after['previousRelease']['version'],version) and same_config(post['previous-version']['config'],config),'Release/configuração pós-publicação divergiu')
  require(client.api('/v1beta1/'+previous).get('status')=='FINALIZED','Proteção anterior não está disponível')
  record['nineControlsConfirmed']=True;record['backendUnchanged']=True;record['rollbackVersionAvailable']=True
  record['nominalPoliciesAndEtagsUnchanged']=all(post.get(name)==value for name,value in snapshot.items() if name.endswith('-policy'))
  require(record['nominalPoliciesAndEtagsUnchanged'],'Política ou etag divergiu após publicação; conferir alteração concorrente')
  record['servingConfigPreserved']=True
  record['url']='https://'+P+'.web.app/modulos/cadastros';record['loginURL']='https://'+P+'.web.app/login';record['publicationComplete']=True
  record['remaining']='Smokes autenticados de login/sessão e Cadastros UI (submenu, seis listagens, temas, tabelas, filtros e modais) no navegador existente; sem novas movimentações financeiras/estoque fora dos casos autorizados. CORE não gravada. iFood continua contido.'
  record['rollbackProcedure']={'site':P,'onlyIfCurrentLiveIs':version,'targetVersion':previous,'method':'POST','path':PREFIX+'/channels/live/releases','query':{'versionName':previous},'body':{'message':'Rollback visual '+SHA+'; restoring prior Hosting version only.'},'requires':'Revalidar backend/contencões e release corrente; não alterar Functions, tags, IAM ou banco.'}
 except Exception as error:
  record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__;save()
  if release_attempted and client and client.version:
   try:
    live=client.live();record['observedLiveAfterFailure']=live;save()
    if same_version(live,client.version):
     # Revert only our release after fresh read-only verification, never a concurrent release.
     verified,state=preflight('before-rollback')
     require(same_version(verified['previousRelease']['version'],client.version),'Release concorrente: não reverter')
     require(client.api('/v1beta1/'+previous).get('status')=='FINALIZED','Proteção anterior indisponível; não inventar recuperação')
     client.token=command(['gcloud','auth','print-access-token','--project='+P],label='token').strip()
     record['rollbackAttempted']=True;save()
     undo=client.api(PREFIX+'/channels/live/releases','POST',{'message':'Rollback visual '+SHA+' after failed verification; previous Hosting only.'},{'versionName':previous})
     record['rollbackRelease']={'name':undo.get('name'),'releaseTime':undo.get('releaseTime')}
     record['rollbackConfirmed']=same_version(client.live(),previous);record['rollbackVerification']='Hosting API live-version only; browser restoration not inferred';record['hostingPublished']=not record['rollbackConfirmed']
     require(record['rollbackConfirmed'],'Resultado da reversão não confirmado')
    else:record['rollbackSkipped']='Live já não aponta para a versão deste roteiro; preservar publicação concorrente'
   except Exception as rollback_error:record['rollbackError']=str(rollback_error) if isinstance(rollback_error,RuntimeError) else type(rollback_error).__name__
 finally:
  if client:client.token=''
  record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();record['receipt']=str(report);save()
  delta={'CORE':'CORE não gravada','preserveHistory':True,'authorization':{'source':'pedido expresso de publicação DEV da Cadastros UI nesta conversa','candidate':SHA,'scope':'Cadastros UI; somente frontend DEV, contratos reais e contenções preservados'},'execution':record}
  (out/'CORE-delta-publicacao.json').write_text(json.dumps(delta,ensure_ascii=False,indent=2)+'\n')
  print('=== INICIO P51 ===');print(report.read_text());print('=== FIM P51 ===')
  print('Devolva somente o JSON P51; mantenha logs, fonte, snapshots e tokens privados na Cloud Shell.')
 return 0 if record.get('publicationComplete') else 1

def run_locked():
 import fcntl
 os.umask(0o077);ROOT.mkdir(mode=0o700,exist_ok=True)
 with (ROOT/'P51-operation.lock').open('a') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:
   print('P51 já está em execução nesta Cloud Shell. Nenhuma segunda publicação iniciada.');return 2
  return main()

if __name__=='__main__':sys.exit(run_locked())

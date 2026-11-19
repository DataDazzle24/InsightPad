"""Coordinated DEV release. No IAM grants, new SQL users, Functions or PROD."""
import contextlib,copy,datetime as dt,fcntl,hashlib,importlib.util,io,json,os,pathlib,re,shutil,subprocess,sys,time,urllib.error,urllib.parse,urllib.request,uuid

HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('hosting',HERE/'P58-hosting.py');H=importlib.util.module_from_spec(spec);spec.loader.exec_module(H)
P,N,R=H.P,H.N,'southamerica-east1';SHA=H.SHA;BASE=H.BASE_SHA;ROOT=H.ROOT
SERVICE=f'projects/{P}/locations/{R}/services/insightpad'
OPERATOR='datadazzletecnologia@gmail.com';INSTANCE='insightpad-fdc';DATABASE='fdcdb';OWNER='firebaseowner_fdcdb_public'
RUN,JOB='44444333875','135292677985'
MIGRATIONS=['20261118-encomendas-comandas.sql','20261118-ec-functions.sql','20261118-ec-ledger.sql','20261118-ec-allocation-parts.sql','20261118-ec-advanced.sql','20261118-ec-commands.sql','20261118-ec-queries.sql']
require=H.require;digest=H.digest

def validate_diff(diffs,trees,allowed):
 require(diffs and len(diffs)<=200,'Diff oficial vazio ou excessivo antes da primeira migração')
 require(len(diffs)==len(trees),'Diff/parser divergentes');created=set()
 for diff,tree in zip(diffs,trees):
  require(diff.get('destructive',False) is False,'Diff oficial destrutivo ou sem classificação')
  require(bool(tree.get('stmts')),'Diff sem instrução SQL')
  for raw in tree['stmts']:
   stmt=raw['stmt'];require(len(stmt)==1,'AST SQL ambígua');kind,value=next(iter(stmt.items()))
   require(kind in {'CreateStmt','IndexStmt','AlterTableStmt'},'SQL fora de adição de tabelas EC: '+kind)
   table=value.get('relation',{});name=table.get('relname')
   require(name in allowed and table.get('schemaname','public')=='public' and not table.get('catalogname'),'Diff tenta alterar relação fora das17 tabelas EC')
   if kind=='CreateStmt':require(name not in created,'CREATE duplicado');created.add(name)
   if kind=='AlterTableStmt':require(all(c.get('AlterTableCmd',{}).get('subtype') in {'AT_AddColumn','AT_AddConstraint'} for c in value.get('cmds',[])),'ALTER não aditivo')
 require(created==set(allowed),'Diff não cria exatamente as17 tabelas aprovadas')

def native_body(text):
 start=re.match(r'\A\s*(?:--[^\n]*\n\s*)*BEGIN;\s*',text)
 end=re.search(r'\bCOMMIT;\s*\Z',text)
 require(start and end and end.start()>start.end(),'SQL versionado sem transação externa reconhecida')
 return text[start.end():end.start()]

def incompatible(body):
 details=body.get('error',{}).get('details',[])
 require(not any(v.get('type')=='INACCESSIBLE_SCHEMA' or v.get('type')=='INCOMPATIBLE_CONNECTOR' for d in details for v in d.get('violations',[])),'Schema inacessível ou connector legado incompatível')
 matches=[d for d in details if 'IncompatibleSqlSchemaError' in d.get('@type','')]
 require(len(matches)==1,'Resposta não contém um diff oficial reconhecido')
 return matches[0].get('diffs',[])

def source_files(source,folder):
 return [{'path':p.relative_to(source/'dataconnect'/folder).as_posix(),'content':p.read_text()} for p in sorted((source/'dataconnect'/folder).rglob('*.gql'))]

def authentication_denied(value):
 if isinstance(value,dict):
  if value.get('code') in {16,'UNAUTHENTICATED'} or value.get('status')=='UNAUTHENTICATED':return True
  if re.search(r'\bunauthenticated\b|@auth.*reject|requires a signed-in user',str(value.get('message','')),re.I):return True
  return any(authentication_denied(v) for v in value.values() if isinstance(v,(dict,list)))
 if isinstance(value,list):return any(authentication_denied(v) for v in value)
 return False

def backup_completed_at(backup):
 try:
  value=dt.datetime.fromisoformat(backup.get('endTime','').replace('Z','+00:00'))
  return value if value.tzinfo is not None else None
 except (ValueError,TypeError,AttributeError):return None

def backup_belongs_to_target(backup):
 # The list/get URI already identifies the exact instance; instance is optional
 # in protobuf JSON. A conflicting field, when supplied, must still be rejected.
 return backup.get('instance') in {None,'',INSTANCE,'projects/'+P+'/instances/'+INSTANCE,'projects/'+N+'/instances/'+INSTANCE}

def usable_backup(backup,now):
 when=backup_completed_at(backup)
 return backup.get('status')=='SUCCESSFUL' and backup_belongs_to_target(backup) and when is not None and dt.timedelta(0)<=now-when<=dt.timedelta(hours=24)

def publication_mode(arguments):
 require(arguments in ([],['--publish-without-backup']),'Opção de publicação não reconhecida')
 return arguments==['--publish-without-backup']

class Release:
 def __init__(self,out,*,without_backup=False):
  require(not without_backup or P=='insightpad-dd-dev','Dispensa de backup restrita ao projeto DEV')
  self.without_backup=without_backup
  self.out=out;self.path=out/'P58-publicacao.json';self.token='';self.token_at=0;self.backend_stage='base';self.sql_config=None
  self.record={'phase':'P58_ENCOMENDAS_COMANDAS_DEV','project':P,'candidate':SHA,'base':BASE,'CORE':'CORE não gravada','startedUTC':dt.datetime.now(dt.timezone.utc).isoformat(),'authorization':'pedido do código de publicação nesta conversa após apresentação do plano schema/SQL/connector/Hosting','remoteMutationAttempted':False,'schemaPublished':False,'connectorPublished':False,'hostingPublished':False,'functionsPublished':False,'IAMChanged':False,'SQLUsersCreated':False,'financialSmokesExecuted':False,'firebaseUserSmokesExecuted':False,'publicationComplete':False,'uploadedFiles':0,'uploadedBytes':0,'operationLabel':out.name.lower(),'cost':{'capUSD':5,'additionalFlatReserveUSD':0,'measuredGoogleCloudUSD':None,'newPaidResources':False}}
  if without_backup:
   self.record.update(backupRequirementWaived=True,backupCreated=False,authorization='Pedido expresso de19/11/2026 após falha do catálogo: seguir apenas com publicação do código, novas funcionalidades e adições/ajustes de banco. Execução explícita de --publish-without-backup em DEV.',recoveryRisk='Backup recente dispensado por orientação do usuário; sem backup/PITR confirmado, recuperação do banco não é garantida. Não restaurar nem remover ledger/guards automaticamente.')
 def save(self):
  p=self.path.with_suffix('.tmp')
  with p.open('w') as handle:handle.write(json.dumps(self.record,ensure_ascii=False,indent=2)+'\n');handle.flush();os.fsync(handle.fileno())
  p.replace(self.path)
  descriptor=os.open(self.out,os.O_RDONLY|os.O_DIRECTORY)
  try:os.fsync(descriptor)
  finally:os.close(descriptor)
 def command(self,args,cwd=None,env=None,label='command',stdin=None,timeout=180):
  try:r=subprocess.run([str(a) for a in args],cwd=cwd,env=env,input=stdin,text=True,capture_output=True,timeout=timeout)
  except subprocess.TimeoutExpired:raise RuntimeError('Timeout em '+label+'; consultar recibo antes de repetir') from None
  if label!='token':(self.out/(label+'.log')).write_text(r.stdout+'\n'+r.stderr)
  require(r.returncode==0,label+' falhou; diagnóstico privado em '+str(self.out/(label+'.log')))
  return r.stdout
 def access_token(self):
  if time.monotonic()-self.token_at>300 or not self.token:self.token=self.command(['gcloud','auth','print-access-token','--project='+P],label='token').strip();self.token_at=time.monotonic()
  return self.token
 def api(self,host,path,method='GET',body=None,query=None,validation=False,expected_denial=False):
  require(host in {'firebasedataconnect.googleapis.com','sqladmin.googleapis.com','cloudresourcemanager.googleapis.com','iam.googleapis.com'},'Host não aprovado')
  if host=='firebasedataconnect.googleapis.com':require(path=='/v1/'+SERVICE or path.startswith('/v1/'+SERVICE+'/') or path=='/v1/'+SERVICE+':executeGraphqlRead' or re.fullmatch('/v1/projects/(?:'+P+'|'+N+')/locations/'+R+'/operations/[A-Za-z0-9_-]+',path),'Data Connect fora do alvo')
  elif host=='sqladmin.googleapis.com':require(path.startswith('/sql/v1beta4/projects/'+P+'/instances/'+INSTANCE),'Instância SQL fora do alvo');require(method=='GET','SQL Admin é somente leitura neste roteiro')
  elif host=='iam.googleapis.com':require(method=='GET' and path in {'/v1/roles/firebasedataconnect.admin','/v1/roles/cloudsql.admin','/v1/roles/cloudsql.client','/v1/roles/cloudsql.instanceUser'},'Consulta IAM fora do escopo')
  else:require(path=='/v1/projects/'+P+':testIamPermissions' and method=='POST','IAM somente testIamPermissions')
  if validation:require(host=='firebasedataconnect.googleapis.com' and method=='PATCH' and path=='/v1/'+SERVICE+'/schemas/main' and (query or {}).get('validateOnly')=='true','validateOnly fora do contrato')
  if expected_denial:require(path=='/v1/'+SERVICE+':executeGraphqlRead' and method=='POST','Recusa esperada fora do smoke de leitura')
  mutate=host=='firebasedataconnect.googleapis.com' and method!='GET' and not validation and not path.endswith(':executeGraphqlRead')
  if mutate:
   require(method=='PATCH' and path in {'/v1/'+SERVICE+'/schemas/main','/v1/'+SERVICE+'/connectors/app'},'Mutação Data Connect não aprovada')
   self.record['remoteMutationAttempted']=True;self.record['lastIntent']={'host':host,'method':method,'path':path};self.save()
  url='https://'+host+path+('?' + urllib.parse.urlencode(query) if query else '')
  req=urllib.request.Request(url,data=None if body is None else json.dumps(body).encode(),headers={'Authorization':'Bearer '+self.access_token(),'Content-Type':'application/json'},method=method)
  try:
   with urllib.request.build_opener(H.NoRedirect).open(req,timeout=45) as r:return json.load(r)
  except urllib.error.HTTPError as error:
   try:detail=json.loads(error.read(2*1024**2))
   except Exception:detail={}
   if expected_denial and error.code in {401,403} and authentication_denied(detail):return detail
   if validation and error.code==400:return {'validationError':detail}
   self.record['apiError']={'host':host,'path':path,'HTTP':error.code,'status':detail.get('error',{}).get('status')};self.save();raise RuntimeError('Acesso/API '+host+' HTTP '+str(error.code)) from None
  except (urllib.error.URLError,TimeoutError):
   if mutate:self.record['remoteOutcomeUncertain']=True;self.save()
   raise RuntimeError('Conexão/API indisponível em '+host+'; não repetir mutação cegamente') from None
 def poll(self,result):
  name=result.get('name','');require(re.fullmatch('projects/(?:'+P+'|'+N+')/locations/'+R+'/(?:services/insightpad/)?operations/[A-Za-z0-9_-]+',name),'LRO fora do projeto DEV')
  self.record['lastOperation']=name;self.save();started=time.monotonic();deadline=started+300;last_notice=0
  while not result.get('done'):
   require(time.monotonic()<deadline,'LRO ainda não concluída em300s; preservar journal e consultar operação')
   if time.monotonic()-started-last_notice>=30:last_notice=int(time.monotonic()-started);print('Operação Data Connect em andamento: '+str(last_notice)+'/300s; aguardando sem reenviar.',flush=True)
   time.sleep(3);result=self.api('firebasedataconnect.googleapis.com','/v1/'+name)
  require(not result.get('error'),'Operação Data Connect falhou; detalhes na operação registrada');return result
 def preflight(self,label):
  ns={'__name__':'__main__','BACKEND_STAGE':self.backend_stage}
  with contextlib.redirect_stdout(io.StringIO()):exec(compile((HERE/'P58-preflight.py').read_text(),'P58-preflight.py','exec'),ns)
  value,snap=ns['record'],ns['snapshots'];self.record['preflight-'+label]={'report':str(ns['report']),'ready':value.get('readyForFrontendPreparation'),'nineControlsConfirmed':value.get('nineControlsConfirmed')};self.save()
  require(value.get('readyForFrontendPreparation'),value.get('stopped','Preflight bloqueado'))
  return value,snap
 def sql(self,sql,read_only=True,owner=True):
  request={**self.sql_config,'mode':'sql','sql':sql,'readOnly':read_only,'owner':owner,'token':self.access_token()}
  # Token lives only in pipe memory. SQL results are metadata, never customer dumps.
  r=subprocess.run([str(self.node),str(self.tools/'P58-sql.cjs')],input=json.dumps(request),env=self.env,capture_output=True,text=True,timeout=180)
  try:value=json.loads(r.stdout)
  except Exception:raise RuntimeError('Ponte SQL sem resposta reconhecida; saída não exposta') from None
  require(r.returncode==0 and value.get('ok'),'SQL bloqueado/falhou: '+str(value.get('code','CONNECTION_FAILED'))+'; nenhum grant automático')
  return value['result']
 def parse(self,sql):
  r=subprocess.run([str(self.node),str(self.tools/'P58-sql.cjs')],input=json.dumps({'mode':'parse','sql':sql}),capture_output=True,text=True,timeout=30)
  v=json.loads(r.stdout);require(r.returncode==0 and v.get('ok'),'Parser PostgreSQL recusou o diff');return v['result']
 def cloud_sql(self):
  instance=self.api('sqladmin.googleapis.com','/sql/v1beta4/projects/'+P+'/instances/'+INSTANCE)
  require(instance.get('project')==P and instance.get('region')==R and instance.get('connectionName')==P+':'+R+':'+INSTANCE and instance.get('state')=='RUNNABLE','Identidade/estado Cloud SQL divergente')
  version=instance.get('databaseVersion','');require(re.fullmatch(r'POSTGRES_\d+',version) and int(version.split('_')[1])>=14,'Versão PostgreSQL não compatível');self.record['databaseVersion']=version
  settings=instance.get('settings',{});flags={f['name']:f['value'] for f in settings.get('databaseFlags',[])}
  require(flags.get('cloudsql.iam_authentication')=='on','Login IAM SQL não está habilitado; não alterado pelo roteiro')
  users=self.api('sqladmin.googleapis.com','/sql/v1beta4/projects/'+P+'/instances/'+INSTANCE+'/users').get('items',[])
  require(any(u.get('name')==OPERATOR and u.get('type')=='CLOUD_IAM_USER' for u in users),'Operador ainda não possui usuário IAM SQL existente; nenhuma criação ou senha alterada')
  self.db_service_user='service-'+N+'@gcp-sa-firebasedataconnect.iam'
  require(any(u.get('name')==self.db_service_user and u.get('type')=='CLOUD_IAM_SERVICE_ACCOUNT' for u in users),'Usuário SQL existente do Data Connect não confirmado')
  self.sql_config={'instance':instance['connectionName'],'database':DATABASE,'user':OPERATOR,'ipType':'PUBLIC' if any(i.get('type')=='PRIMARY' for i in instance.get('ipAddresses',[])) else 'PRIVATE'}
  self.record['sqlAccess']={k:v for k,v in self.sql_config.items()}
  if self.without_backup:
   cfg=settings.get('backupConfiguration',{})
   self.record['dataProtection']={'backupRequired':False,'backupRequirementWaived':True,'backupVerified':False,'backupInventoryQueried':False,'newBackupCreated':False,'PITREnabled':cfg.get('pointInTimeRecoveryEnabled') is True,'automaticBackupEnabled':cfg.get('enabled') is True,'restoreExecuted':False,'zeroDataLossRestoreClaimed':False}
   self.save();return
  base='/sql/v1beta4/projects/'+P+'/instances/'+INSTANCE+'/backupRuns'
  backups=[];page=None;seen=set()
  for _ in range(10):
   query={'maxResults':100}
   if page:query['pageToken']=page
   batch=self.api('sqladmin.googleapis.com',base,query=query);backups.extend(batch.get('items',[]));page=batch.get('nextPageToken')
   if not page:break
   require(page not in seen,'Paginação de backups repetiu token');seen.add(page)
  require(not page,'Inventário de backups excedeu o limite; inspecionar antes de migrar')
  now=dt.datetime.now(dt.timezone.utc);cfg=settings.get('backupConfiguration',{})
  recent=sorted(backups,key=lambda b:str(b.get('endTime') or b.get('startTime') or ''),reverse=True)[:10]
  self.record['backupDiagnostics']={'queriedInstance':P+':'+R+':'+INSTANCE,'backupCount':len(backups),'PITREnabled':cfg.get('pointInTimeRecoveryEnabled') is True,'automaticBackupEnabled':cfg.get('enabled') is True,'backupTier':cfg.get('backupTier'),'allocatedDiskGB':settings.get('dataDiskSizeGb'),'recentBackups':[{k:b.get(k) for k in ['id','instance','type','status','startTime','endTime']} for b in recent]};self.save()
  good=[b for b in backups if usable_backup(b,now)]
  require(good,'Nenhum backup SUCCESSFUL concluído nas últimas24h foi confirmado; consultar backupDiagnostics. Nenhuma migração iniciada')
  chosen=max(good,key=backup_completed_at);bid=str(chosen.get('id',''));require(re.fullmatch(r'\d+',bid),'Backup sem ID oficial reconhecido')
  backup=self.api('sqladmin.googleapis.com',base+'/'+bid)
  require(str(backup.get('id'))==bid and usable_backup(backup,dt.datetime.now(dt.timezone.utc)),'Backup selecionado não foi reconfirmado por ID; nenhuma migração iniciada')
  self.record['dataProtection']={'backupID':bid,'status':backup['status'],'startTime':backup.get('startTime'),'endTime':backup.get('endTime'),'backupAgeSeconds':int((dt.datetime.now(dt.timezone.utc)-backup_completed_at(backup)).total_seconds()),'PITREnabled':cfg.get('pointInTimeRecoveryEnabled') is True,'PITRRequiredForThisAdditiveMigration':False,'restoreExecuted':False,'zeroDataLossRestoreClaimed':False,'newBackupCreated':False}
  self.record['dataProtection']['backupVerified']=True;self.save()
 def permissions(self):
  required=['firebasehosting.sites.get','firebasehosting.sites.update','firebasedataconnect.schemas.get','firebasedataconnect.schemas.update','firebasedataconnect.connectors.get','firebasedataconnect.connectors.update','firebasedataconnect.services.get','firebasedataconnect.services.executeGraphqlRead','cloudsql.instances.get','cloudsql.instances.connect','cloudsql.instances.login','cloudsql.users.list']
  if not self.without_backup:required.extend(['cloudsql.backupRuns.list','cloudsql.backupRuns.get'])
  official=set()
  for role in ['firebasedataconnect.admin','cloudsql.admin','cloudsql.client','cloudsql.instanceUser']:official.update(self.api('iam.googleapis.com','/v1/roles/'+role).get('includedPermissions',[]))
  require(set(required[2:])<=official,'Nome de permissão não corresponde às definições oficiais; parar para diagnóstico')
  rights=self.api('cloudresourcemanager.googleapis.com','/v1/projects/'+P+':testIamPermissions','POST',{'permissions':required})
  missing=sorted(set(required)-set(rights.get('permissions',[])));self.record['missingPermissions']=missing;self.save();require(not missing,'Acessos necessários ausentes: '+', '.join(missing))

def same_policies(a,b):return all(b.get(k)==v for k,v in a.items() if k.endswith('-policy'))

def prepare(r,first,snapshot):
 donor=next((pathlib.Path(x['path']) for x in first['existingCheckouts'] if (pathlib.Path(x['path'])/'frontend/node_modules').is_dir()),pathlib.Path(first['existingCheckouts'][0]['path']))
 work=H.prepare_workspace(donor,r.record,r.save);source=work/'source';r.node=pathlib.Path(first['node22']['path'])
 env={k:v for k,v in os.environ.items() if not k.startswith(('VITE_','QA_','PG','GOOGLE_APPLICATION_CREDENTIALS'))};env.update(PATH=str(r.node.parent)+os.pathsep+os.environ.get('PATH',''),GIT_TERMINAL_PROMPT='0',NODE_ENV='production',npm_config_cache=str(work/'npm-cache'),TMPDIR=str(work))
 r.command(['git','clone','--shared','--no-checkout',donor,source],env=env,label='clone')
 H.ensure_candidate(source,HERE/'no-bundle',r.command,env);r.command(['git','-C',source,'checkout','--detach',SHA],label='checkout')
 require(r.command(['git','-C',source,'rev-parse','HEAD'],label='head').strip()==SHA,'SHA divergente')
 r.command(['git','-C',source,'merge-base','--is-ancestor',BASE,SHA],label='preserved-base')
 r.tools=HERE;require((HERE/'node_modules/libpg-query').is_dir(),'Tooling offline ainda não instalado pelo bootstrap')
 npm=pathlib.Path(shutil.which('npm')).resolve();r.npm=npm;r.env=env;r.source=source;r.work=work
 return donor

def build(r,donor,snapshot):
 source=r.source;front=source/'frontend'
 if (donor/'frontend/node_modules').is_dir() and (donor/'frontend/package-lock.json').read_bytes()==(front/'package-lock.json').read_bytes() and (donor/'frontend/package.json').read_bytes()==(front/'package.json').read_bytes():
  shutil.copytree(donor/'frontend/node_modules',front/'node_modules',symlinks=True)
  sdk=front/'node_modules/@insightpad/dataconnect'
  if sdk.is_symlink():sdk.unlink()
  elif sdk.exists():shutil.rmtree(sdk)
  sdk.parent.mkdir(exist_ok=True);sdk.symlink_to('../../src/dataconnect-generated',target_is_directory=True)
 else:r.command([r.node,r.npm,'ci','--include=dev','--no-audit','--no-fund'],cwd=front,env=r.env,label='frontend-dependencies',timeout=600)
 writer="import {writeDevConfig} from './scripts/ci-dev-config.mjs';let data='';for await(const p of process.stdin)data+=p;writeDevConfig(process.cwd(),JSON.parse(data));"
 r.command([r.node,'--input-type=module','-e',writer],cwd=source,env=r.env,stdin=json.dumps(snapshot['public-client-config']),label='real-dev-config')
 r.command([r.node,front/'node_modules/typescript/bin/tsc','-b'],cwd=front,env=r.env,label='types',timeout=300)
 r.command([r.node,front/'node_modules/vite/bin/vite.js','build','--mode','development'],cwd=front,env=r.env,label='normal-frontend',timeout=300)
 (front/'dist/version.json').write_text(json.dumps({'project':P,'commit':SHA,'builtUTC':dt.datetime.now(dt.timezone.utc).isoformat()})+'\n')
 require(not r.command(['git','-C',source,'status','--porcelain'],label='clean-source').strip(),'Fonte modificada durante preparo')
 files,total=H.inspect_dist(front/'dist',source);compressed,mapping=H.bounded_uploads(files)
 r.record.update(publicFiles=len(files),rawBytes=total,gzipBytes=sum(map(len,compressed.values())))
 r.save();return files,compressed,mapping

def verify_ci():
 # Reuse the frozen CI page verifier, including all original gates and new SQL/browser gates.
 from html.parser import HTMLParser
 class Steps(HTMLParser):
  def __init__(self):super().__init__();self.values=[]
  def handle_starttag(self,t,attrs):
   if t=='check-step':a=dict(attrs);self.values.append((a.get('data-name'),a.get('data-conclusion')))
 pages=[]
 for tail in ['', '/job/'+JOB]:
  req=urllib.request.Request('https://github.com/DataDazzle24/InsightPad/actions/runs/'+RUN+tail+'?p58='+uuid.uuid4().hex,headers={'User-Agent':'InsightPad-DEV-release','Cache-Control':'no-cache'})
  with urllib.request.build_opener(H.NoRedirect).open(req,timeout=30) as v:pages.append(v.read(4*1024**2).decode())
 status=re.search(r'>Status</span>\s*<span[^>]*>([^<]+)</span>',pages[0]);require(status and status.group(1).strip()=='Success' and all(SHA in p for p in pages),'CI do SHA exato não confirmado')
 parser=Steps();parser.feed(pages[1]);require(len(parser.values)>=27 and all(v=='success' for _,v in parser.values),'Etapa CI ausente/não aprovada')
 require({'Conferir SHA do candidato','Compilar contratos e conferir SDKs gerados','Frontend (lint, testes, tipos e build)','Functions (tipos, testes e build)','Aplicação QA com Auth e API mockados','Conferir preservação da fonte recuperada','PostgreSQL 18 descartável (aborto e locks, sem rede)','Renovação de sessão pelo compilador Data Connect isolado','Encomendas e Comandas (SQL real isolado, sem DEV)','Encomendas e Comandas (navegador com SQL isolado)','Cobertura integrada QA existente'}<=set(n for n,_ in parser.values),'CI sem os gates obrigatórios anteriores/EC')
 return {'run':RUN,'job':JOB,'candidate':SHA,'passed':True,'steps':len(parser.values)}

def main(r):
 print('1/8 Conferindo CI, identidade, DEV, acessos e nove contenções.',flush=True)
 r.record['CI']=verify_ci();r.save();first,snapshot=r.preflight('initial');require(first['publicVersionBefore']['commit']==BASE,'DEV já mudou; preservar publicação posterior')
 require(first['previousRelease']['version'].endswith('/versions/07318b898d5f5729') and first['previousRelease']['name'].endswith('/releases/1794868621178000'),'Release live diferente do recibo P57; não sobrescrever')
 r.permissions();r.cloud_sql()
 config=copy.deepcopy(snapshot['previous-version']['config']);r.record.update(previousRelease=first['previousRelease'],previousVersion=first['previousRelease']['version'],servingConfigSHA256=H.config_hash(config));r.save()
 print('2/8 Preparando ferramentas isoladas e conferindo o login SQL existente.',flush=True)
 donor=prepare(r,first,snapshot)
 identity=r.sql(["SELECT current_database() AS db,current_user AS usr,pg_has_role(current_user,'firebaseowner_fdcdb_public','MEMBER') AS owner"],owner=False)[0]['rows'][0]
 require(identity=={'db':DATABASE,'usr':OPERATOR,'owner':True},'Conexão/role SQL existente insuficiente; nenhum grant executado')
 schema=(r.source/'dataconnect/schema/schema.gql').read_text();legacy=re.findall(r'@table\(name: "([^"]+)"',schema.split('# Encomendas e Comandas:')[0]);ec=re.findall(r'@table\(name: "([^"]+)"',schema.split('# Encomendas e Comandas:')[1]);require(len(legacy)==53 and len(ec)==17,'Schema local inesperado')
 tables=r.sql(["SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"])[0]['rows'];initial_tables={x['tablename'] for x in tables};require(set(legacy)<=initial_tables and not any(t.startswith('ec_') for t in initial_tables),'Base incompleta ou EC já existente; requer diagnóstico/recovery');r.record['legacyTableCount']=len(initial_tables)
 acl_sql="SELECT md5(COALESCE((SELECT string_agg(rolname||':'||rolinherit::text||':'||rolsuper::text,',' ORDER BY rolname) FROM pg_roles),'')||COALESCE((SELECT string_agg(roleid::text||':'||member::text||':'||admin_option::text,',' ORDER BY roleid,member) FROM pg_auth_members),'')||COALESCE((SELECT string_agg(oid::text||':'||defaclacl::text,',' ORDER BY oid) FROM pg_default_acl),'')) AS roles;"
 acl=r.sql([acl_sql]);r.record['SQLIdentityVerified']=True;r.save()
 ownership=r.sql(["SELECT bool_and(pg_has_role(current_user,c.relowner,'USAGE')) AS allowed FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN('stock_balances','sales_channel_stock_reservations')"])[0]['rows'][0];require(ownership.get('allowed') is True,'Role SQL não possui as tabelas de guardas compartilhadas; nenhuma concessão automática')
 columns_sql="SELECT c.relname,a.attname,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull,pg_get_expr(d.adbin,d.adrelid) AS default_value FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped AND c.relname NOT LIKE 'ec_%' ORDER BY c.relname,a.attnum"
 columns=r.sql([columns_sql]);(r.out/'legacy-structure-private.json').write_text(json.dumps(columns,indent=2))
 print('3/8 Build normal e diff oficial somente aditivo, antes das mutações.',flush=True)
 files,compressed,mapping=build(r,donor,snapshot)
 datasources=copy.deepcopy(snapshot['schemas-main']['datasources']);require(len(datasources)==1,'Datasource adicional inesperado');datasources[0]['postgresql']['schemaValidation']='COMPATIBLE';datasources[0]['postgresql'].pop('schemaMigration',None)
 schema_body={'name':SERVICE+'/schemas/main','source':{'files':source_files(r.source,'schema')},'datasources':datasources}
 result=r.api('firebasedataconnect.googleapis.com','/v1/'+SERVICE+'/schemas/main','PATCH',schema_body,{'validateOnly':'true','updateMask':'source,datasources'},validation=True)
 require('validationError' in result,'Diff inicial não apresentou as17 tabelas esperadas')
 diffs=incompatible(result['validationError']);(r.out/'official-diff-private.json').write_text(json.dumps(diffs,indent=2));trees=[r.parse(d['sql']) for d in diffs];validate_diff(diffs,trees,ec)
 r.record['officialDiff']={'count':len(diffs),'SHA256':digest(json.dumps(diffs,sort_keys=True).encode()),'tables':ec,'destructive':False,'schemaValidation':'COMPATIBLE (preserva objetos nativos)'};r.save()
 fresh,snap=r.preflight('before-database');require(fresh['previousRelease']==first['previousRelease'] and same_policies(snapshot,snap),'Alteração concorrente antes da migração');r.cloud_sql()
 print('4/8 Aplicando o DDL oficial e os sete SQL fixados do candidato DEV.',flush=True)
 r.record['remoteMutationAttempted']=True;r.record['lastIntent']={'stage':'official-DDL','sqlSHA256':[digest(d['sql'].encode()) for d in diffs]};r.save();r.sql([d['sql'] for d in diffs],False);r.record['officialDDLApplied']=True;r.save()
 for name in MIGRATIONS:
  print('SQL '+str(MIGRATIONS.index(name)+1)+'/7: '+name,flush=True)
  sql=(r.source/'dataconnect/migrations'/name).read_text();r.record['lastIntent']={'stage':'native-SQL','file':name,'sha256':digest(sql.encode())};r.save();r.sql([native_body(sql)],False);r.record.setdefault('migrationsApplied',[]).append({'file':name,'sha256':digest(sql.encode())});r.save()
 require(r.sql([acl_sql])==acl,'Roles SQL mudaram; não prosseguir')
 require(r.sql([columns_sql])==columns,'Colunas/tipos/defaults legados mudaram; não publicar o frontend')
 require({x['tablename'] for x in r.sql(["SELECT tablename FROM pg_tables WHERE schemaname='public'"])[0]['rows']}==initial_tables|set(ec),'Tabelas pós-migração divergentes')
 funcs=r.sql(["SELECT proname FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname='public' AND proname IN('ec_command','ec_read','ec_sensitive','ec_stock_guard') AND NOT prosecdef"])[0]['rows'];require({x['proname'] for x in funcs}=={'ec_command','ec_read','ec_sensitive','ec_stock_guard'},'Funções centrais ausentes ou SECURITY DEFINER')
 principal=r.db_service_user
 privileges=r.sql(["SELECT bool_and(has_table_privilege('"+principal+"',quote_ident(schemaname)||'.'||quote_ident(tablename),'SELECT') AND has_table_privilege('"+principal+"',quote_ident(schemaname)||'.'||quote_ident(tablename),'INSERT') AND has_table_privilege('"+principal+"',quote_ident(schemaname)||'.'||quote_ident(tablename),'UPDATE') AND has_table_privilege('"+principal+"',quote_ident(schemaname)||'.'||quote_ident(tablename),'DELETE')) AS allowed FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'ec_%'"])[0]['rows'][0]
 require(privileges.get('allowed') is True,'Privilégios SQL herdados do Data Connect insuficientes; nenhum grant automático');r.record['existingSQLPrivilegesVerified']=True;r.save()
 print('5/8 Publicando schema e connector app; sem setup automático de permissões.',flush=True)
 before_schema,before_schema_snap=r.preflight('before-schema');require(before_schema['previousRelease']==first['previousRelease'] and same_policies(snapshot,before_schema_snap),'Alteração concorrente antes da publicação do schema')
 value=r.api('firebasedataconnect.googleapis.com','/v1/'+SERVICE+'/schemas/main','PATCH',schema_body,{'validateOnly':'true','updateMask':'source,datasources'},validation=True);require('validationError' not in value,'Ainda há divergência oficial de schema após SQL')
 r.poll(r.api('firebasedataconnect.googleapis.com','/v1/'+SERVICE+'/schemas/main','PATCH',schema_body,{'updateMask':'source,datasources'}));r.record['schemaPublished']=True;r.backend_stage='schema';r.save();r.preflight('after-schema')
 connector_body={'name':SERVICE+'/connectors/app','source':{'files':source_files(r.source,'app')}}
 r.poll(r.api('firebasedataconnect.googleapis.com','/v1/'+SERVICE+'/connectors/app','PATCH',connector_body,{'updateMask':'source'}));r.record['connectorPublished']=True;r.backend_stage='candidate';r.save()
 current,current_snap=r.preflight('after-connector');require(current['previousRelease']==first['previousRelease'] and same_policies(snapshot,current_snap) and current_snap['previous-version']['config']==config,'Release/política/config concorrente antes do Hosting')
 require(r.sql([acl_sql])==acl and r.sql([columns_sql])==columns,'Roles ou estrutura legada mudaram durante a publicação do backend')
 # Authenticated administrative read, without user impersonation or business writes.
 q='query P58Catalog @auth(level: NO_ACCESS) { response: _selectFirst(sql: "SELECT jsonb_build_object(\'database\',current_database(),\'ecTables\',(SELECT count(*) FROM pg_tables WHERE schemaname=\'public\' AND tablename LIKE \'ec_%\')) AS data") }'
 admin=r.api('firebasedataconnect.googleapis.com','/v1/'+SERVICE+':executeGraphqlRead','POST',{'query':q,'operationName':'P58Catalog'})
 require(not admin.get('errors') and admin.get('data',{}).get('response',{}).get('data')=={'database':DATABASE,'ecTables':17},'Leitura administrativa do backend não confirmada');r.record['administrativeBackendReadVerified']=True;r.save()
 read_definition=re.search(r'^query EcRead\b[\s\S]*?^}',(r.source/'dataconnect/app/queries.gql').read_text(),re.M).group()
 denied=r.api('firebasedataconnect.googleapis.com','/v1/'+SERVICE+':executeGraphqlRead','POST',{'query':read_definition,'operationName':'EcRead','variables':{'input':{'kind':'COMANDA','mode':'LIST'},'sessionToken':'0'*64},'extensions':{'impersonate':{'unauthenticated':True}}},expected_denial=True)
 require(authentication_denied(denied),'EcRead não confirmou recusa por falta de usuário autenticado');r.record['unauthenticatedReadDenied']=True;r.save()
 print('6/8 Publicando somente os arquivos do Hosting, com a configuração servida preservada.',flush=True)
 client=H.Hosting(r.access_token(),r.record,r.save)
 require(H.same_version(client.live(),r.record['previousVersion']),'Hosting concorrente antes do upload')
 version=client.api(H.PREFIX+'/versions','POST',{'status':'CREATED','labels':{'insightpad-candidate':SHA,'insightpad-operation':r.record['operationLabel']}})['name'];require(H.version_ok(version),'Versão Hosting inválida');client.version=version;r.record['version']=version;r.save();client.file_map=mapping
 response=client.api('/v1beta1/'+version+':populateFiles','POST',{'files':mapping});needed=response.get('uploadRequiredHashes',[]);require(set(needed)<=set(compressed),'Servidor pediu hashes fora do artefato')
 for h in needed:client.upload(response['uploadUrl'],h,compressed[h])
 client.api('/v1beta1/'+version,'PATCH',{'status':'FINALIZED','config':config},{'updateMask':'status,config'})
 remote=client.files(version);prior=client.files(r.record['previousVersion']);managed={x['path']:x['hash'] for x in prior if x.get('path') in {'/__/firebase/init.js','/__/firebase/init.json'}}
 require(len(managed)==2,'Inventário reservado Firebase anterior inesperado');expected={**mapping,**managed};require(len(remote)==len(expected) and {x['path']:x['hash'] for x in remote}==expected and all(x.get('status')=='ACTIVE' for x in remote),'Inventário Hosting completo divergente')
 again,again_snap=r.preflight('before-release');require(again['previousRelease']==first['previousRelease'] and same_policies(snapshot,again_snap) and again_snap['previous-version']['config']==config,'Release/política/config concorrente antes da ativação');require(client.api('/v1beta1/'+r.record['previousVersion']).get('status')=='FINALIZED','Artefato anterior de recuperação indisponível')
 release=client.api(H.PREFIX+'/channels/live/releases','POST',{'message':'Encomendas/Comandas '+SHA+'; schema/SQL/connector matched; existing containment preserved.'},{'versionName':version});r.record['release']={'name':release.get('name'),'releaseTime':release.get('releaseTime')};r.record['hostingPublished']=True;r.save()
 print('7/8 Conferindo bytes, MIME, rotas e SHA efetivamente servidos.',flush=True)
 def read(path,nonce):
  raw,headers,_=H.fetch_public(path,config,nonce)
  if path.endswith('.js'):require('javascript' in (headers.get('Content-Type') or '').lower(),'Asset JS respondeu MIME inesperado')
  if path.endswith('.css'):require('text/css' in (headers.get('Content-Type') or '').lower(),'Asset CSS respondeu MIME inesperado')
  return raw,headers
 H.wait_public(client,files,r.record,r.save,read=read)
 routes=['/','/login','/vendas/comandas','/vendas/encomendas','/vendas/frente-de-caixa','/vendas/registros','/estoque','/modulos/cadastros','/cadastros/produtos','/dashboards/operacional','/modulos/plataforma','/modulos/canais']
 for route in routes:require(digest(read(route,uuid.uuid4().hex)[0])==files['/index.html']['rawSHA256'],'Entrada de rota divergente: '+route)
 _,html_headers=read('/login',uuid.uuid4().hex)
 wanted={k.lower():v for rule in config.get('headers',[]) if rule.get('glob')=='**' for k,v in rule.get('headers',{}).items()}
 for key in ['Content-Security-Policy','X-Frame-Options','X-Content-Type-Options']:require(wanted.get(key.lower()) and html_headers.get(key)==wanted[key.lower()],'Header servido divergente: '+key)
 require('no-store' in (html_headers.get('Cache-Control') or '').lower(),'HTML servido sem no-store');r.record['servedSecurityHeadersVerified']=True
 r.record['publicRoutesVerified']=len(routes);r.record['publicArtifactVerified']=True;r.save()
 print('8/8 Conferindo backend, contenções e recibo final; sem criar vendas de demonstração.',flush=True)
 final,final_snap=r.preflight('final');require(H.same_version(final['previousRelease']['version'],version) and H.same_config(final_snap['previous-version']['config'],config) and same_policies(snapshot,final_snap),'Estado pós-publicação divergente')
 r.record.update(publicationComplete=True,nineControlsConfirmed=True,nominalPoliciesAndEtagsUnchanged=True,servingConfigPreserved=True,url='https://'+P+'.web.app/',remaining='Aceite autenticado Firebase no tenant de teste e nos perfis reais; caixa/estoque/ledger, temas, teclado e impressão. Nenhum smoke financeiro automático. CORE não gravada.',recovery='Preservar journal/SQL/ledger/guards. Não repetir o bootstrap após mutação nem fazer rollback Hosting isolado após documentos. Usar publicacao-e-reversao.md e diagnóstico do recibo.')

def run_locked(*,without_backup=False):
 os.umask(0o077);ROOT.mkdir(mode=0o700,exist_ok=True)
 with (ROOT/'P58.lock').open('a') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:print('P58 já está em execução; segunda operação bloqueada.');return 2
  for path in sorted(ROOT.glob('P58-*/P58-publicacao.json')):
   if json.loads(path.read_text()).get('remoteMutationAttempted'):print('Há operação com mutação registrada. Não repetir; recibo: '+str(path));print(path.read_text());return 2
  out=ROOT/('P58-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:6]);out.mkdir(mode=0o700);r=Release(out,without_backup=without_backup)
  try:r.save();main(r)
  except Exception as error:r.record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__
  finally:
   r.token='';r.record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();r.record['receipt']=str(r.path);r.save();(out/'CORE-handoff-publicacao.json').write_text(json.dumps(r.record,ensure_ascii=False,indent=2)+'\n');print('=== INICIO P58 ===');print(r.path.read_text());print('=== FIM P58 ===');print('Compartilhe somente esse JSON; mantenha logs, snapshots e credenciais privados no Cloud Shell.')
  return 0 if r.record.get('publicationComplete') else 1
if __name__=='__main__':sys.exit(run_locked(without_backup=publication_mode(sys.argv[1:])))

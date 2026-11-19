"""P59: install one invoker function and patch connector app; never deploy Hosting."""
import ast,contextlib,copy,datetime as dt,fcntl,hashlib,importlib.util,io,json,os,pathlib,sys,tempfile,uuid
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('resume',HERE/'P58-retomar.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);p=m.p;require=p.require
SHA='dcb03f18a49bf267eb44a8fecbebeea641c9984a';BASE=p.SHA
MUTATION_SHA='baaa62a0f3a2b02924b6d3889f362e8dd14fb0934f099dc38d2d6b83b775c8c8'
SQL_SHA='704a9008c1a5257f60b62bb72959472f51628cb27ee7c906aa233f89ac550d9f'
MIGRATION='20261119-platform-role-permission.sql'
RUN,JOB='44539384652','135613308412'
GATE='Permissões da plataforma (SQL Connect e PostgreSQL real isolado)'
ROOT=pathlib.Path.home()/'InsightPad_DEV_Correcao_Permissoes_dcb03f1'

def contracts():
 tree=ast.parse((HERE/'P58-preflight.py').read_text())
 values=[ast.literal_eval(node.value) for node in tree.body if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='BACKENDS' for t in node.targets) and isinstance(node.value,ast.Dict)]
 require(len(values)==1,'Contrato P58R não identificado');baseline=values[0]['candidate'];patched=copy.deepcopy(baseline);patched['connectors/app']['mutations.gql']=MUTATION_SHA
 return {'base':baseline,'candidate':patched}

def migration_body(source):
 raw=(source/'dataconnect/migrations'/MIGRATION).read_bytes();require(p.digest(raw)==SQL_SHA,'SQL diferente do candidato aprovado')
 return p.native_body(raw.decode())

class Release(p.Release):
 def __init__(self,out):
  super().__init__(out,without_backup=True);self.path=out/'P59-publicacao.json';self.expected=None;self.body=None;self.native=None
  self.record.update(phase='P59_PERMISSOES_PLATFORM_DEV',candidate=SHA,base=BASE,frontendCommit=BASE,authorization='Correção solicitada pelo usuário para falha ao habilitar Comandas/Encomendas; ciclo DEV vigente, sem backup/tarifas. Uma função SQL e connector app, sem atribuição automática de acesso.',hostingPublished=False,schemaPublished=False,connectorPublished=False,permissionsAutomaticallyGranted=False,SQLMigrationsReexecuted=False)
 def api(self,host,path,method='GET',body=None,query=None,**kw):
  if host=='firebasedataconnect.googleapis.com' and method=='PATCH':
   require(path=='/v1/'+p.SERVICE+'/connectors/app' and body==self.body,'P59 permite atualizar somente o connector fixado; schema proibido')
   require(query==({'validateOnly':'true','updateMask':'source'} if kw.get('validation') else {'updateMask':'source'}),'Parâmetros fora da validação/publicação aprovada')
   if not kw.get('validation'):require(self.record.get('nativeFunctionVerified') is True and self.record.get('nativeContractVerified') is True,'Função/contrato SQL não verificados antes do connector')
  return super().api(host,path,method,body,query,**kw)
 def sql(self,statements,read_only=True,owner=True):
  if not read_only:require(self.native is not None and statements==[self.native] and self.record.get('SQLFunctionIntentRecorded') is True and not self.record.get('nativeFunctionInstalled'),'P59 só permite executar uma vez a função SQL fixada, sem outros comandos')
  return super().sql(statements,read_only,owner)
 def preflight(self,label):
  ns={'__name__':'__main__','BACKEND_STAGE':self.backend_stage,'PINNED_BACKENDS':contracts()}
  with contextlib.redirect_stdout(io.StringIO()):exec(compile((HERE/'P58-preflight.py').read_text(),'P58-preflight.py','exec'),ns)
  value,snapshot=ns['record'],ns['snapshots'];self.record['preflight-'+label]={'report':str(ns['report']),'ready':value.get('readyForFrontendPreparation'),'nineControlsConfirmed':value.get('nineControlsConfirmed')};self.save()
  require(value.get('readyForFrontendPreparation'),value.get('stopped','Preflight bloqueado'));require(value['publicVersionBefore']['commit']==BASE,'Frontend DEV mudou desde P58R')
  return value,snapshot
 def check_native(self,label):
  require(self.sql([m.CATALOG])[0]['rows']==m.native_contract(),'Estrutura EC divergiu da referência P58R; não alterar nem migrar EC')
  self.record['nativeContractVerified']=True;self.record.setdefault('nativeContractChecks',[]).append(label);self.save()
 def function_metadata(self):
  return self.sql(["SELECT md5(f.prosrc) AS body_hash,f.prosecdef,f.proconfig,f.prorettype::regtype::text AS return_type,pg_get_userbyid(f.proowner) AS owner,has_function_privilege('"+self.db_service_user+"',f.oid,'EXECUTE') AS service_can_execute FROM pg_proc f JOIN pg_namespace n ON n.oid=f.pronamespace WHERE n.nspname='public' AND f.proname='platform_set_role_permission' AND oidvectortypes(f.proargtypes)='text, jsonb, text'"])[0]['rows']
 def check_function(self):
  rows=self.function_metadata();raw=self.native.split('$$');require(len(raw)==3,'Corpo nativo ambíguo')
  expected_hash=hashlib.md5(raw[1].encode()).hexdigest()
  require(len(rows)==1 and rows[0]=={'body_hash':expected_hash,'prosecdef':False,'proconfig':['search_path=public, pg_catalog'],'return_type':'integer','owner':p.OWNER,'service_can_execute':True},'Função instalada divergiu ou privilégio EXECUTE existente insuficiente; nenhum grant automático')
  self.record['nativeFunctionVerified']=True;self.record['nativeFunctionBodyMD5']=expected_hash;self.save()
 def check_service_rights(self):
  rights=self.sql(["SELECT bool_and(has_table_privilege('"+self.db_service_user+"','public.'||table_name,privilege)) AS allowed FROM (VALUES ('role_page_permissions','SELECT'),('role_page_permissions','INSERT'),('role_page_permissions','UPDATE'),('audit_logs','INSERT'),('app_pages','SELECT'),('users','SELECT'),('users','UPDATE'),('tenants','SELECT'),('tenants','UPDATE'),('roles','SELECT'),('roles','UPDATE'),('user_device_sessions','SELECT'),('user_device_sessions','UPDATE')) AS needed(table_name,privilege)"])[0]['rows'][0]
  require(rights.get('allowed') is True,'Usuário SQL do Data Connect não tem os privilégios existentes necessários; nenhum grant automático')
  self.record['existingBusinessSQLPrivilegesVerified']=True;self.save()

def prior_writes():
 for path in sorted(ROOT.glob('P59-*/P59-publicacao.json')):require(not json.loads(path.read_text()).get('remoteMutationAttempted'),'P59 já registrou mutação; não repetir. Recibo: '+str(path))

def publish(r):
 print('P59 1/5: conferindo CI do fix, identidade, P58R, acessos e contenções.',flush=True)
 r.record['CI']=p.verify_ci(RUN,JOB,SHA,[GATE]);r.save();first,snapshot=r.preflight('initial')
 expected_release='projects/'+p.P+'/sites/'+p.P+'/channels/live/releases/1795095245898000'
 require(first['previousRelease']['name']==expected_release and first['previousRelease']['version'].endswith('/versions/f476efc58747f630'),'Hosting mudou desde P58R; preservar publicação concorrente')
 r.permissions();r.cloud_sql();r.node=pathlib.Path(first['node22']['path']);r.tools=HERE
 r.env={k:v for k,v in os.environ.items() if not k.startswith(('VITE_','QA_','PG','GOOGLE_APPLICATION_CREDENTIALS'))};r.env.update(PATH=str(r.node.parent)+os.pathsep+os.environ.get('PATH',''),GIT_TERMINAL_PROMPT='0')
 work=pathlib.Path(tempfile.mkdtemp(prefix='InsightPad_P59_source_',dir='/tmp'));work.chmod(0o700);source=work/'source'
 r.command(['git','init','-q',source],label='source-init');r.command(['git','-C',source,'fetch','--quiet','--no-tags',p.H.SOURCE,SHA],env=r.env,label='fetch-pinned-fix',timeout=180);r.command(['git','-C',source,'checkout','--quiet','--detach',SHA],label='source-checkout')
 require(r.command(['git','-C',source,'rev-parse','HEAD'],label='source-head').strip()==SHA and not r.command(['git','-C',source,'status','--porcelain'],label='source-clean').strip(),'Fonte fora do SHA aprovado');r.source=source
 r.native=migration_body(source);files=p.source_files(source,'app');actual={f['path']:p.digest(f['content'].encode()) for f in files};require(actual==contracts()['candidate']['connectors/app'],'Arquivos do connector divergiram do fix')
 r.body={'name':p.SERVICE+'/connectors/app','source':{'files':files}}
 print('P59 2/5: comparando estrutura e privilégios SQL existentes; sem conceder acessos.',flush=True)
 identity=r.sql(["SELECT current_database() AS db,current_user AS usr,pg_has_role(current_user,'firebaseowner_fdcdb_public','MEMBER') AS owner"],owner=False)[0]['rows'][0];require(identity=={'db':p.DATABASE,'usr':p.OPERATOR,'owner':True},'Login/role SQL existente divergente')
 r.check_native('initial');r.check_service_rights();require(not r.function_metadata(),'Função já existe; diagnosticar antes de sobrescrever')
 legacy=r.sql([m.COLUMNS]);acl=r.sql([m.ACL]);schema=copy.deepcopy(snapshot['schemas-main'])
 fresh,fresh_snap=r.preflight('before-SQL');require(fresh['previousRelease']==first['previousRelease'] and p.same_policies(snapshot,fresh_snap),'Estado concorrente antes do SQL')
 print('P59 3/5: instalando somente a função transacional de permissões.',flush=True)
 r.record.update(remoteMutationAttempted=True,SQLFunctionIntentRecorded=True,lastIntent={'stage':'native-permission-function','file':MIGRATION,'sha256':SQL_SHA});r.save()
 r.sql([r.native],False);r.record['nativeFunctionInstalled']=True;r.save();r.check_function();r.check_native('after-SQL')
 require(r.sql([m.COLUMNS])==legacy and r.sql([m.ACL])==acl,'Estrutura legada ou roles/default ACLs mudaram')
 print('P59 4/5: validando e publicando somente connector app.',flush=True)
 result=r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/connectors/app','PATCH',r.body,{'validateOnly':'true','updateMask':'source'},validation=True)
 if 'validationError' in result:
  r.record['connectorValidationError']=m.d.safe_error(result['validationError'],r.token);r.save();raise RuntimeError('Validação do connector falhou; Hosting/schema preservados')
 before,before_snap=r.preflight('before-connector');require(before['previousRelease']==first['previousRelease'] and before_snap['schemas-main']==schema and p.same_policies(snapshot,before_snap),'Estado concorrente antes do connector')
 r.check_function();r.check_native('before-connector')
 r.poll(r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/connectors/app','PATCH',r.body,{'updateMask':'source'}));r.record['connectorPublished']=True;r.backend_stage='candidate';r.save()
 print('P59 5/5: conferindo contrato publicado, estrutura e contenções finais.',flush=True)
 final,final_snap=r.preflight('final');r.check_function();r.check_native('final');r.check_service_rights()
 require(final['previousRelease']==first['previousRelease'] and final_snap['schemas-main']==schema and p.same_policies(snapshot,final_snap) and final['servingConfigSHA256']==first['servingConfigSHA256'],'Hosting/schema/política/config mudou')
 require(r.sql([m.COLUMNS])==legacy and r.sql([m.ACL])==acl,'Estrutura legada/roles/ACLs mudou após connector')
 r.record.update(publicationComplete=True,nineControlsConfirmed=True,hostingUnchanged=True,schemaUnchanged=True,servingConfigPreserved=True,nominalPoliciesAndEtagsUnchanged=True,url='https://'+p.P+'.web.app/plataforma/gestao-usuarios/perfis-permissoes',remaining='No perfil/empresa desejados, habilitar Acessar em Comandas/Encomendas pela matriz e recarregar a sessão. Nenhuma permissão atribuída automaticamente; aceite autenticado DEV ainda pendente. CORE não gravada.')

def run():
 require(sys.argv[1:]==['--publish-permission-fix'],'Execute apenas com --publish-permission-fix')
 os.umask(0o077);ROOT.mkdir(mode=0o700,exist_ok=True);p.ROOT.mkdir(mode=0o700,exist_ok=True)
 with (p.ROOT/'P58.lock').open('a') as shared,(ROOT/'P59.lock').open('a') as lock:
  try:fcntl.flock(shared,fcntl.LOCK_EX|fcntl.LOCK_NB);fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise RuntimeError('Publicação em execução; não iniciar P59 concorrente') from None
  prior_writes();out=ROOT/('P59-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:6]);out.mkdir(mode=0o700);r=Release(out)
  try:r.save();publish(r)
  except Exception as error:r.record['publicationComplete']=False;r.record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__
  finally:
   r.token='';r.record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();r.record['receipt']=str(r.path);r.save();(out/'CORE-handoff-publicacao.json').write_text(r.path.read_text());print('=== INICIO P59 ===');print(r.path.read_text());print('=== FIM P59 ===')
  return 0 if r.record.get('publicationComplete') else 1
if __name__=='__main__':
 try:sys.exit(run())
 except RuntimeError as error:print(str(error),file=sys.stderr);sys.exit(1)

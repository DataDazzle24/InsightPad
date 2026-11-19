"""Read-only diagnosis of the recorded partial P58; never resumes migrations."""
import copy,datetime as dt,fcntl,importlib.util,json,os,pathlib,subprocess,sys,uuid
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('p58',HERE/'P58-publicar.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
require=p.require
OPERATION='P58-20261119T125956Z-51173c'

class Diagnostic(p.Release):
 def api(self,host,path,method='GET',body=None,query=None,**kw):
  target=host=='firebasedataconnect.googleapis.com' and path=='/v1/'+p.SERVICE+'/schemas/main'
  require(target and (method=='GET' or method=='PATCH' and kw.get('validation') is True and query=={'validateOnly':'true','updateMask':'source,datasources'}),'Diagnóstico permite apenas GET do schema ou PATCH validateOnly do mesmo schema')
  return super().api(host,path,method,body,query,**kw)
 def sql(self,*args,**kwargs):raise RuntimeError('Diagnóstico não executa SQL')

def check_original(original):
 require(original.get('project')==p.P and original.get('candidate')==p.SHA and original.get('base')==p.BASE,'Recibo fora do candidato DEV aprovado')
 require(original.get('officialDDLApplied') is True and original.get('existingSQLPrivilegesVerified') is True,'DDL/privilégios não confirmados no recibo; não inferir estado')
 require([v.get('file') for v in original.get('migrationsApplied',[])]==p.MIGRATIONS,'Sete SQL não confirmados no recibo')
 require(all(original.get(k) is False for k in ['schemaPublished','connectorPublished','hostingPublished','publicationComplete']),'Publicação avançou além do estado esperado; não repetir diagnóstico desatualizado')
 require(original.get('stopped')=='Ainda há divergência oficial de schema após SQL','Parada diferente do recibo recebido')

def schema_request(source,schema):
 datasources=copy.deepcopy(schema.get('datasources',[]));require(len(datasources)==1,'Datasource inesperado')
 pg=datasources[0].get('postgresql',{});require(pg.get('database')==p.DATABASE and pg.get('cloudSql',{}).get('instance') in {'projects/'+x+'/locations/'+p.R+'/instances/'+p.INSTANCE for x in [p.P,p.N]},'Datasource fora de DEV')
 pg['schemaValidation']='COMPATIBLE';pg.pop('schemaMigration',None)
 return {'name':p.SERVICE+'/schemas/main','source':{'files':p.source_files(source,'schema')},'datasources':datasources}

def safe_error(error,token):
 text=json.dumps(error,ensure_ascii=False)
 if token:text=text.replace(token,'[redacted]')
 import re
 text=re.sub(r'(?i)Bearer\s+[^"\s]+|ya29\.[^"\s]+|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[redacted]',text)
 require(not re.search(r'(?i)private_key|refresh_token|BEGIN .*PRIVATE KEY',text),'Resposta contém informação sensível; manter diagnóstico privado')
 require(len(text.encode())<=128*1024,'Erro oficial extenso; manter diagnóstico privado')
 return json.loads(text)

def diagnose(d,original):
 check_original(original)
 source=pathlib.Path(original['storage']['workspace'])/'source'
 require(source.is_dir(),'Workspace original não está disponível; preservar recibo e informar a parada')
 head=d.command(['git','-C',source,'rev-parse','HEAD'],label='diagnostic-head').strip();require(head==p.SHA,'Fonte original fora do candidato')
 require(not d.command(['git','-C',source,'status','--porcelain'],label='diagnostic-status').strip(),'Fonte original alterada')
 for migration in original['migrationsApplied']:
  require(p.digest((source/'dataconnect/migrations'/migration['file']).read_bytes())==migration['sha256'],'SQL local divergiu do recibo')
 first,snapshot=d.preflight('diagnostic');require(first['previousRelease']==original['previousRelease'] and first['publicVersionBefore']['commit']==p.BASE,'Hosting mudou após o recibo; preservar publicação concorrente')
 require(first.get('servingConfigSHA256')==original['servingConfigSHA256'],'Configuração Hosting mudou após o recibo')
 schema=snapshot['schemas-main'];body=schema_request(source,schema)
 value=d.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',body,{'validateOnly':'true','updateMask':'source,datasources'},validation=True)
 if 'validationError' in value:
  d.record.update(validationPassed=False,officialValidationError=safe_error(value['validationError'],d.token))
 else:d.record['validationPassed']=True
 after=d.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main')
 require(after==schema,'Schema mudou durante o diagnóstico; não inferir causa nem publicar')
 d.record.update(diagnosticComplete=True,schemaUnchanged=True,databaseWasChangedByOriginalOperation=True,originalOperation=OPERATION,officialDDLAppliedAsRecorded=True,migrationsAppliedAsRecorded=len(original['migrationsApplied']),originalHostingPublished=False,nextAction='Revisar erro/diff oficial e preparar retomada específica. Não repetir P58, não apagar recibos, não reaplicar sete SQL.')

def run():
 require(not sys.argv[1:],'Diagnóstico não aceita opções de publicação')
 os.umask(0o077);p.ROOT.mkdir(mode=0o700,exist_ok=True)
 with (p.ROOT/'P58.lock').open('a') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise RuntimeError('P58 está em execução; aguardar antes do diagnóstico') from None
  old=p.ROOT/OPERATION/'P58-publicacao.json';require(old.is_file(),'Recibo original não localizado; não há retomada automática')
  out=p.ROOT/('P58D-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:6]);out.mkdir(mode=0o700)
  d=Diagnostic(out);d.path=out/'P58D-diagnostico.json';d.record.update(phase='P58D_SCHEMA_DIAGNOSTICO_READONLY',authorization='Diagnóstico somente de leitura da parada do P58 enviado pelo usuário',diagnosticComplete=False)
  try:d.save();diagnose(d,json.loads(old.read_text()))
  except Exception as error:d.record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__
  finally:
   d.token='';d.record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();d.record['receipt']=str(d.path);d.save();print('=== INICIO P58D ===');print(d.path.read_text());print('=== FIM P58D ===')
  return 0 if d.record.get('diagnosticComplete') else 1
if __name__=='__main__':
 try:sys.exit(run())
 except RuntimeError as error:print(str(error),file=sys.stderr);sys.exit(1)

"""Explicit opt-in: one priced, seven-day DEV backup, then unchanged P58 release."""
import copy,datetime as dt,decimal,fcntl,importlib.util,json,os,pathlib,re,subprocess,sys,time,urllib.error,urllib.parse,urllib.request,uuid
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('p58',HERE/'P58-publicar.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
P,N,R,I,SHA,ROOT=p.P,p.N,p.R,p.INSTANCE,p.SHA,p.ROOT
D=decimal.Decimal;LIMIT=D('0.50');DAYS=7;GIB=1024**3
require=p.require

def pages(api,host,path,key,query=None,limit=20):
 values=[];token=None;seen=set()
 for _ in range(limit):
  q=dict(query or {})
  if token:q['pageToken']=token
  result=api(host,path,query=q);values.extend(result.get(key,[]));token=result.get('nextPageToken')
  if not token:return values
  require(token not in seen,'Paginação repetida');seen.add(token)
 raise RuntimeError('Inventário excedeu o limite de leitura')

def quote_candidates(skus,gib,now):
 matches=[]
 for sku in skus:
  desc=sku.get('description','').lower();regions=sku.get('serviceRegions',[])
  if not ('backup' in desc and (R in regions or 'global' in regions)):continue
  if any(x in desc for x in ['sql server','sqlserver','mysql','enhanced','point-in-time','transaction log']):continue
  prices=[]
  for info in sku.get('pricingInfo',[]):
   try:when=dt.datetime.fromisoformat(info['effectiveTime'].replace('Z','+00:00'))
   except (KeyError,ValueError):continue
   if when<=now:prices.append((when,info))
  if not prices:continue
  expr=max(prices,key=lambda v:v[0])[1].get('pricingExpression',{});unit=expr.get('usageUnit');rates=[]
  for tier in expr.get('tieredRates',[]):
   money=tier.get('unitPrice',{});require(money.get('currencyCode')=='USD','Catálogo não retornou tarifa USD')
   value=D(str(money.get('units','0')))+D(str(money.get('nanos',0)))/D(1000000000)
   require(value>=0,'Tarifa negativa inesperada');rates.append(value)
  require(rates,'SKU sem tarifa verificável')
  # Eight days includes a conservative buffer around the seven-day server TTL.
  usage={'GiBy.mo':D(gib)*D(8)/D(28),'GiBy.h':D(gib)*D(8*24),'GiBy.d':D(gib)*D(8),'GiBy.s':D(gib)*D(8*86400)}
  if unit not in usage:continue
  estimate=max(rates)*usage[unit]
  matches.append({'sku':sku.get('name'),'description':sku.get('description'),'usageUnit':unit,'unitPriceUSD':str(max(rates)),'estimateUSD':str(estimate)})
 require(matches,'Tarifa de armazenamento de backup STANDARD em São Paulo/global não identificada')
 worst=max(matches,key=lambda v:D(v['estimateUSD']))
 return {'source':'Cloud Billing Catalog oficial, consultado nesta execução','currency':'USD','allocatedGiBUpperBound':gib,'retentionRequestedDays':DAYS,'conservativePricingDays':8,'incrementalEstimateUSD':worst['estimateUSD'],'incrementalEstimateLimitUSD':str(LIMIT),'selectedConservativeSKU':worst,'matchingSKUs':matches,'actualBillingMeasured':False,'cumulativeCapUSD':5,'cumulativeCapReset':False,'historicalSpendKnown':False,'hardBillingCap':False}

def checked_backup_name(name):
 require(re.fullmatch(r'projects/(?:'+P+'|'+N+r')/backups/[A-Za-z0-9_.-]+',name or ''),'Nome de backup fora de DEV')
 return name.replace('projects/'+N+'/','projects/'+P+'/',1)

class Backup(p.Release):
 def __init__(self,out,authorized=False):
  super().__init__(out);self.path=out/'P58B-backup.json';self.authorized=authorized
  self.record.update(phase='P58B_BACKUP_DEV',backupReady=False,backupCreated=False,backupMutationAttempted=False,publicationComplete=False)
  self.record['authorization']='Execução explícita de --backup-and-publish: um backup DEV com TTL7 e estimativa incremental até US$0,50; teto acumulado US$5 não renovado'
 def api(self,host,path,method='GET',body=None,query=None,**kw):
  special=(host=='cloudbilling.googleapis.com' or host=='sqladmin.googleapis.com' and not path.startswith('/sql/v1beta4/projects/'+P+'/instances/'+I))
  if not special:return super().api(host,path,method,body,query,**kw)
  require('?' not in path and '#' not in path and '..' not in path,'Caminho inválido')
  if host=='cloudbilling.googleapis.com':require(method=='GET' and (path=='/v1/services' or re.fullmatch('/v1/services/[A-Za-z0-9-]+/skus',path)),'Catálogo somente leitura')
  else:
   root='/sql/v1beta4/projects/'+P
   allowed=path==root+'/backups' or re.fullmatch(re.escape(root)+r'/(?:backups|operations)/[A-Za-z0-9_.-]+',path)
   require(allowed,'Backup/operação fora do projeto DEV')
   if method!='GET':
    expected={'instance':I,'description':self.record['operationLabel']+' '+SHA,'location':R,'ttlDays':str(DAYS)}
    require(self.authorized and method=='POST' and path==root+'/backups' and body==expected and self.record.get('pricingVerified') is True and D(self.record.get('cost',{}).get('incrementalEstimateUSD','Infinity'))<=LIMIT and not self.record.get('backupMutationAttempted'),'Criação de backup fora do contrato, acima do limite ou repetida')
    self.record.update(backupMutationAttempted=True,remoteMutationAttempted=True,backupIntentUTC=dt.datetime.now(dt.timezone.utc).isoformat(),lastBackupIntent={'method':method,'path':path,'body':body});self.save()
  url='https://'+host+path+('?' + urllib.parse.urlencode(query) if query else '')
  req=urllib.request.Request(url,data=None if body is None else json.dumps(body).encode(),headers={'Authorization':'Bearer '+self.access_token(),'Content-Type':'application/json'},method=method)
  try:
   with urllib.request.build_opener(p.H.NoRedirect).open(req,timeout=45) as response:return json.load(response)
  except urllib.error.HTTPError as error:
   try:detail=json.loads(error.read(16384)).get('error',{})
   except Exception:detail={}
   if method!='GET' and error.code>=500:self.record['backupOutcomeUncertain']=True
   message=str(detail.get('message','')).replace(self.token,'[redacted]') if self.token else str(detail.get('message',''))
   message=re.sub(r'(?i)Bearer\s+\S+|ya29\.\S+|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[redacted]',message)
   if re.search(r'(?i)access_token|refresh_token|private_key|BEGIN .*PRIVATE KEY',message):message='Mensagem com credencial omitida'
   self.record['apiError']={'host':host,'path':path,'HTTP':error.code,'status':detail.get('status'),'message':message[:500],'reasons':[d.get('reason') for d in detail.get('details',[]) if d.get('reason')]};self.save();raise RuntimeError('API '+host+' HTTP '+str(error.code)+'; nenhuma API/permissão será habilitada automaticamente') from None
  except (urllib.error.URLError,TimeoutError):
   if method!='GET':self.record['backupOutcomeUncertain']=True;self.save()
   raise RuntimeError('Conexão de backup/catálogo indisponível; consultar recibo antes de repetir') from None
 def quote(self,gib):
  services=pages(self.api,'cloudbilling.googleapis.com','/v1/services','services',{'pageSize':5000})
  found=[s for s in services if re.sub(r'\s+','',s.get('displayName','')).lower()=='cloudsql'];require(len(found)==1,'Serviço Cloud SQL não identificado no catálogo oficial')
  name=found[0].get('name','');require(re.fullmatch(r'services/[A-Za-z0-9-]+',name),'Serviço de preços inválido')
  skus=pages(self.api,'cloudbilling.googleapis.com','/v1/'+name+'/skus','skus',{'pageSize':5000,'currencyCode':'USD','fields':'skus(name,description,serviceRegions,pricingInfo),nextPageToken'})
  quote=quote_candidates(skus,gib,dt.datetime.now(dt.timezone.utc));self.record['cost']=quote;self.record['pricingVerified']=True;self.save();require(D(quote['incrementalEstimateUSD'])<=LIMIT,'Estimativa de backup ultrapassa US$0,50; consultar cost. Nenhum backup criado');return quote
 def poll_backup(self,operation):
  name=operation.get('name','');require(re.fullmatch(r'[A-Za-z0-9_-]+',name),'Operação Cloud SQL sem identificador válido')
  require(operation.get('targetProject',P) in {P,N},'Operação de backup fora do projeto')
  self.record['backupOperation']=name;self.save();started=time.monotonic();notice=0
  while operation.get('status')!='DONE':
   require(time.monotonic()-started<1200,'Backup continua em andamento após20min; operação registrada, não criar outro')
   if time.monotonic()-started-notice>=20:notice=int(time.monotonic()-started);print('Backup em andamento: '+str(notice)+'/1200s; aguardando sem reenviar.',flush=True)
   time.sleep(5);operation=self.api('sqladmin.googleapis.com','/sql/v1beta4/projects/'+P+'/operations/'+name)
  require(not operation.get('error'),'Operação de backup falhou; preservar o recibo, sem novo backup automático')
  self.record['backupOperationDone']=True;self.record['backupCreated']=True;self.save();return operation
 def verify_new_backup(self,operation):
  context=operation.get('backupContext',{});name=context.get('name');bid=str(context.get('backupId',''))
  if not name:
   backups=pages(self.api,'sqladmin.googleapis.com','/sql/v1beta4/projects/'+P+'/backups','backups',{'pageSize':500})
   matches=[b for b in backups if b.get('description')==self.record['operationLabel']+' '+SHA]
   require(len(matches)==1,'Backup criado não identificado de forma única; não repetir criação');name=matches[0].get('name')
  name=checked_backup_name(name);backup=self.api('sqladmin.googleapis.com','/sql/v1beta4/'+name)
  require(backup.get('state')=='SUCCESSFUL' and backup.get('description')==self.record['operationLabel']+' '+SHA,'Backup não concluído ou diferente da operação')
  mapping=backup.get('backupRun','');match=re.fullmatch(r'projects/(?:'+P+'|'+N+')/instances/'+I+r'/backupRuns/(\d+)',mapping)
  require(match,'Backup não está vinculado à instância DEV aprovada');bid=match.group(1)
  try:expiry=dt.datetime.fromisoformat(backup['expiryTime'].replace('Z','+00:00'));intent=dt.datetime.fromisoformat(self.record['backupIntentUTC'])
  except (KeyError,ValueError):raise RuntimeError('Expiração automática do backup não confirmada; não prosseguir nem criar outro') from None
  require(dt.timedelta(days=7,minutes=-5)<=expiry-intent<=dt.timedelta(days=7,hours=1),'API não confirmou a retenção pedida de sete dias')
  legacy=self.api('sqladmin.googleapis.com','/sql/v1beta4/projects/'+P+'/instances/'+I+'/backupRuns/'+bid)
  require(p.usable_backup(legacy,dt.datetime.now(dt.timezone.utc)) and str(legacy.get('id'))==bid,'Backup recente não reconfirmado pela API de backupRuns')
  actual=int(backup.get('maxChargeableBytes','0') or 0)
  require(actual<=10*GIB,'Backup excedeu a estimativa de10GiB; preservar e revisar antes da migração')
  self.record.update(backupReady=True,backupCreated=True,backup={'name':name,'id':bid,'status':'SUCCESSFUL','endTime':legacy.get('endTime'),'expiryTime':backup['expiryTime'],'maxChargeableBytes':str(actual) if actual else None,'restoreExecuted':False,'zeroDataLossRestoreClaimed':False});self.save()

def prior_publication_wrote():
 for path in sorted(ROOT.glob('P58-*/P58-publicacao.json')):
  value=json.loads(path.read_text())
  require(not value.get('remoteMutationAttempted'),'P58 já registrou mutação; não criar backup ou repetir publicação: '+str(path))

def prepare_backup(b):
 prior_publication_wrote();b.record['CI']=p.verify_ci();b.save();first,snapshot=b.preflight('backup-initial');require(first['publicVersionBefore']['commit']==p.BASE,'Frontend já mudou; preservar publicação concorrente')
 previous=first.get('previousRelease',{});require(previous.get('version','').endswith('/versions/07318b898d5f5729') and previous.get('name','').endswith('/releases/1794868621178000'),'Release DEV diferente do recibo P57; não criar backup para sobrescrever outra publicação')
 b.permissions()
 role=b.api('iam.googleapis.com','/v1/roles/cloudsql.admin');permission='cloudsql.backupRuns.create';require(permission in role.get('includedPermissions',[]),'Permissão de criação não reconhecida no papel oficial')
 rights=b.api('cloudresourcemanager.googleapis.com','/v1/projects/'+P+':testIamPermissions','POST',{'permissions':[permission]});require(permission in rights.get('permissions',[]),'Permissão de backup ausente; nenhuma concessão executada')
 base='/sql/v1beta4/projects/'+P+'/instances/'+I
 instance=b.api('sqladmin.googleapis.com',base);require(instance.get('connectionName')==P+':'+R+':'+I and instance.get('state')=='RUNNABLE','Instância DEV divergente')
 cfg=copy.deepcopy(instance.get('settings',{}).get('backupConfiguration',{}));require(cfg.get('backupTier','STANDARD')=='STANDARD','Tier de backup diferente do STANDARD; não contratar outro serviço')
 gib=int(instance.get('settings',{}).get('dataDiskSizeGb','0'));require(0<gib<=10,'Disco maior que10GiB; rever estimativa antes de criar backup')
 b.record['backupConfigurationBefore']=cfg;b.record['allocatedGiB']=gib;b.save()
 existing=pages(b.api,'sqladmin.googleapis.com',base+'/backupRuns','items',{'maxResults':100})
 valid=[v for v in existing if p.usable_backup(v,dt.datetime.now(dt.timezone.utc))]
 if valid and not b.record.get('backupMutationAttempted'):
  selected=max(valid,key=p.backup_completed_at);checked=b.api('sqladmin.googleapis.com',base+'/backupRuns/'+str(selected['id']));require(p.usable_backup(checked,dt.datetime.now(dt.timezone.utc)),'Backup existente não reconfirmado');b.record.update(backupReady=True,backupCreated=False,backup={'id':str(checked['id']),'status':'SUCCESSFUL','endTime':checked.get('endTime'),'reusedExisting':True});b.save();return
 if not b.record.get('backupMutationAttempted'):
  print('Orçando um backup STANDARD de sete dias, antes de criar.',flush=True);b.quote(gib)
  print('Conferindo login SQL e role já existentes antes de criar o backup.',flush=True)
  p.prepare(b,first,snapshot)
  b.sql_config={'instance':instance['connectionName'],'database':p.DATABASE,'user':p.OPERATOR,'ipType':'PUBLIC' if any(v.get('type')=='PRIMARY' for v in instance.get('ipAddresses',[])) else 'PRIVATE'}
  identity=b.sql(["SELECT current_database() AS db,current_user AS usr,pg_has_role(current_user,'firebaseowner_fdcdb_public','MEMBER') AS owner"],owner=False)[0]['rows'][0]
  require(identity=={'db':p.DATABASE,'usr':p.OPERATOR,'owner':True},'Login/role SQL existente insuficiente; nenhum backup ou grant criado')
  b.record['SQLExistingAccessVerified']=True;b.save()
  print('Estimativa conservadora do backup: US$'+b.record['cost']['incrementalEstimateUSD']+'; teto acumulado US$5 não renovado.',flush=True)
  operation=b.api('sqladmin.googleapis.com','/sql/v1beta4/projects/'+P+'/backups','POST',{'instance':I,'description':b.record['operationLabel']+' '+SHA,'location':R,'ttlDays':str(DAYS)})
 else:
  require(b.record.get('backupOperation'),'Criação anterior teve resultado incerto sem operação identificada; não criar outro backup')
  operation=b.api('sqladmin.googleapis.com','/sql/v1beta4/projects/'+P+'/operations/'+b.record['backupOperation'])
 final=b.poll_backup(operation);b.verify_new_backup(final)
 after=b.api('sqladmin.googleapis.com',base);require(after.get('settings',{}).get('backupConfiguration',{})==cfg,'Configuração de backup/PITR mudou; não iniciar migração');b.record['backupConfigurationPreserved']=True;b.save()

def publish(b):
 require(b.record.get('backupReady'),'Backup não está pronto');prior_publication_wrote();print('Backup confirmado. Retomando o publicador P58 com preflight fresco.',flush=True)
 log=b.out/'P58-private.log';buffer=[];inside=False
 with log.open('w') as handle:
  proc=subprocess.Popen([sys.executable,str(HERE/'P58-publicar.py')],cwd=HERE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
  for line in proc.stdout:
   handle.write(line);handle.flush()
   if line.strip()=='=== INICIO P58 ===':inside=True;continue
   if line.strip()=='=== FIM P58 ===':inside=False;continue
   if inside:buffer.append(line)
   else:print(line,end='',flush=True)
  code=proc.wait()
 require(buffer,'Publicador não emitiu recibo; consultar log privado antes de repetir')
 result=json.loads(''.join(buffer));b.record['publicationReceipt']=result.get('receipt');b.record['publicationResult']=result;b.record['publicationComplete']=bool(result.get('publicationComplete'));b.save();return code

def run():
 require(sys.argv[1:]==['--create-and-publish'],'Execute com a opção explícita --create-and-publish somente após revisar o bloco de backup e custo')
 os.umask(0o077);ROOT.mkdir(mode=0o700,exist_ok=True)
 with (ROOT/'P58B.lock').open('a') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise RuntimeError('P58B já está em execução; não criar segunda operação')
  prior=[]
  for path in sorted(ROOT.glob('P58B-*/P58B-backup.json')):
   value=json.loads(path.read_text())
   if value.get('backupMutationAttempted'):prior.append((path,value))
  require(len(prior)<=1,'Há mais de uma operação de backup registrada; diagnosticar antes de publicar')
  if prior:
   b=Backup(prior[0][0].parent,True);b.record=prior[0][1]
   if b.record.get('stopped'):b.record.setdefault('attemptHistory',[]).append({'endedUTC':b.record.get('endedUTC'),'stopped':b.record.pop('stopped')})
  else:
   out=ROOT/('P58B-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:6]);out.mkdir(mode=0o700);b=Backup(out,True)
  code=1
  try:
   b.save()
   with (ROOT/'P58.lock').open('a') as publication_lock:
    try:fcntl.flock(publication_lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:raise RuntimeError('Publicador P58 está em execução; não criar backup concorrente') from None
    prepare_backup(b)
   code=publish(b)
  except Exception as error:b.record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__
  finally:
   b.token='';b.record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();b.record['receipt']=str(b.path);b.save()
   result=copy.deepcopy(b.record.get('publicationResult',{}));result.update(phase='P58_BACKUP_E_PUBLICACAO_DEV',project=P,candidate=SHA,backupCreated=b.record.get('backupCreated',False),backupMutationAttempted=b.record.get('backupMutationAttempted',False),remoteMutationAttempted=bool(result.get('remoteMutationAttempted') or b.record.get('backupMutationAttempted')),backupPreparation={k:v for k,v in b.record.items() if k!='publicationResult'},publicationComplete=b.record.get('publicationComplete',False))
   result.setdefault('cost',{}).update(capUSD=5,cumulativeCapReset=False,newPaidResources=bool(b.record.get('backupCreated')),newPaidResourcesScope=['single on-demand backup storage'] if b.record.get('backupCreated') else [],backupStorageMayBeBilled=b.record.get('backupCreated',False),backupIncrementalEstimateUSD=b.record.get('cost',{}).get('incrementalEstimateUSD'),measuredGoogleCloudUSD=None)
   print('=== INICIO P58 ===');print(json.dumps(result,ensure_ascii=False,indent=2));print('=== FIM P58 ===')
  return code if b.record.get('publicationComplete') else 1
if __name__=='__main__':
 try:sys.exit(run())
 except RuntimeError as error:print(str(error),file=sys.stderr);sys.exit(1)

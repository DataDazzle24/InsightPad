"""Resume only the recorded P58 after SQL. No SQL writes or migrations permitted."""
import copy,datetime as dt,fcntl,importlib.util,json,os,pathlib,re,sys,uuid
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('diagnostic',HERE/'P58-diagnosticar-schema.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d);p=d.p;H=p.H;require=p.require
CATALOG=(HERE/'P58-native-contract.sql').read_text()
ACL="SELECT md5(COALESCE((SELECT string_agg(rolname||':'||rolinherit::text||':'||rolsuper::text,',' ORDER BY rolname) FROM pg_roles),'')||COALESCE((SELECT string_agg(roleid::text||':'||member::text||':'||admin_option::text,',' ORDER BY roleid,member) FROM pg_auth_members),'')||COALESCE((SELECT string_agg(oid::text||':'||defaclacl::text,',' ORDER BY oid) FROM pg_default_acl),'')) AS roles;"
COLUMNS="SELECT c.relname,a.attname,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull,pg_get_expr(d.adbin,d.adrelid) AS default_value FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped AND c.relname NOT LIKE 'ec_%' ORDER BY c.relname,a.attnum"

def native_contract():
 value=json.loads((HERE/'P58-native-expected.json').read_text())
 require(value['candidate']==p.SHA and value['catalogSQLSHA256']==p.digest(CATALOG.encode()),'Contrato de referência fora do candidato')
 return value['rows']

def validate_protection_only(error,parse,expected):
 # NONE is never selected for inaccessible DB, missing resources or arbitrary400.
 details=error.get('error',{}).get('details',[])
 require(error.get('error',{}).get('status')=='FAILED_PRECONDITION','Erro não é incompatibilidade de schema')
 allowed={'google.rpc.PreconditionFailure','google.rpc.RequestInfo','google.firebase.dataconnect.v1main.IncompatibleSqlSchemaError'}
 require(all(v.get('@type','').removeprefix('type.googleapis.com/') in allowed for v in details),'Erro oficial contém detalhes não reconhecidos')
 violations=[v for item in details for v in item.get('violations',[])]
 require(len(violations)==1 and violations[0].get('type')=='INCOMPATIBLE_SCHEMA','Erro não se limita a INCOMPATIBLE_SCHEMA')
 diffs=p.incompatible(error);require(diffs and len(diffs)<=100,'Diff vazio/excessivo na retomada')
 constraints={v['name'] for v in expected if v['kind']=='constraint'}
 indexes={v['name'].split('.',1)[1] for v in expected if v['kind']=='index'};seen=set()
 for diff in diffs:
  tree=parse(diff['sql']);require(diff.get('destructive') is True and len(tree.get('stmts',[]))==1,'Diff não é remoção isolada de proteção conhecida')
  stmt=tree['stmts'][0]['stmt'];require(len(stmt)==1,'AST ambígua');kind,node=next(iter(stmt.items()))
  if kind=='DropStmt':
   require(node.get('removeType')=='OBJECT_INDEX' and node.get('behavior','DROP_RESTRICT')=='DROP_RESTRICT' and len(node.get('objects',[]))==1,'DROP fora de índice/restrição segura')
   items=node['objects'][0].get('List',{}).get('items',[]);parts=[x.get('String',{}).get('sval') for x in items]
   require(len(parts)==2 and parts[0]=='public' and parts[1] in indexes,'Índice não pertence ao contrato aprovado');key='index:'+parts[1];require(key not in seen,'Remoção repetida');seen.add(key)
  elif kind=='AlterTableStmt':
   relation=node.get('relation',{});table=relation.get('relname','');require(relation.get('schemaname')=='public' and not relation.get('catalogname') and table.startswith('ec_'),'ALTER fora das tabelas EC')
   require(node.get('cmds'),'ALTER vazio')
   for item in node['cmds']:
    cmd=item.get('AlterTableCmd',{});name=table+'.'+cmd.get('name','')
    require(cmd.get('subtype')=='AT_DropConstraint' and cmd.get('behavior','DROP_RESTRICT')=='DROP_RESTRICT' and name in constraints,'ALTER não se limita à remoção de proteção conhecida');key='constraint:'+name;require(key not in seen,'Remoção repetida');seen.add(key)
  else:raise RuntimeError('Diff contém operação diferente de remover proteção nativa: '+kind)
 return {'diffCount':len(diffs),'protectedObjects':len(seen),'diffSHA256':p.digest(json.dumps(diffs,sort_keys=True).encode()),'executedDiffs':0,'requiredAdditionsOrTypeChanges':0}

class Resume(p.Release):
 def __init__(self,out):
  super().__init__(out,without_backup=True);self.path=out/'P58R-publicacao.json';self.expected=None
  self.record.update(phase='P58R_ENCOMENDAS_COMANDAS_AFTER_SQL',originalOperation=d.OPERATION,SQLMigrationsReexecuted=False,newBuildExecuted=False,publicationComplete=False)
 def sql(self,sql,read_only=True,owner=True):
  require(read_only is True,'Retomada não permite escrita SQL, DDL ou migração')
  return super().sql(sql,read_only,owner)
 def check_native(self,label):
  require(self.expected is not None,'Referência nativa não carregada')
  actual=self.sql([CATALOG])[0]['rows']
  if actual!=self.expected:
   (self.out/('native-mismatch-'+label+'-private.json')).write_text(json.dumps({'expected':self.expected,'actual':actual},indent=2))
   raise RuntimeError('Contrato SQL nativo divergiu em '+label+'; nenhuma remoção/migração será executada')
  self.record.setdefault('nativeContractChecks',[]).append(label);self.record['nativeContractVerified']=True;self.save()
 def api(self,host,path,method='GET',body=None,query=None,**kw):
  if host=='firebasedataconnect.googleapis.com' and method=='PATCH':
   if path.endswith('/schemas/main') and body and body.get('datasources',[{}])[0].get('postgresql',{}).get('schemaValidation')=='NONE':
    require(self.record.get('nativeContractVerified') is True and self.record.get('protectionOnlyDiffVerified') is True,'NONE exige contrato nativo e diff de proteções verificados')
   if not kw.get('validation'):
    require(self.record.get('nativeContractVerified') is True,'Backend sem contrato SQL verificado')
    self.check_native('before-schema-publish' if path.endswith('/schemas/main') else 'before-connector-publish')
    expected=self.schema_body if path.endswith('/schemas/main') else {'name':p.SERVICE+'/connectors/app','source':{'files':p.source_files(self.source,'app')}}
    require(body==expected,'Corpo de publicação divergiu do candidato fixado')
  return super().api(host,path,method,body,query,**kw)
 def preflight(self,label):
  first,snapshot=super().preflight(label)
  pg=snapshot['schemas-main']['datasources'][0]['postgresql']
  require(not pg.get('ephemeral',False) and not pg.get('unlinked',False),'Datasource efêmero/desvinculado proibido')
  if self.expected is not None:self.check_native(label)
  return first,snapshot

def prior_resumes():
 for pattern,file in [('P58-*','P58-publicacao.json'),('P58R-*','P58R-publicacao.json')]:
  for path in sorted(p.ROOT.glob(pattern+'/'+file)):
   if path.parent.name==d.OPERATION:continue
   require(not json.loads(path.read_text()).get('remoteMutationAttempted'),'Há outra intenção de mutação; preservar e diagnosticar: '+str(path))

def resume(r,original,old):
 print('P58R: conferindo recibo parcial, CI, identidade e estado atual de DEV.',flush=True)
 d.check_original(original);prior_resumes();r.record['CI']=p.verify_ci();r.save()
 first,snapshot=r.preflight('resume-initial');require(first['previousRelease']==original['previousRelease'] and first['publicVersionBefore']['commit']==p.BASE and first['servingConfigSHA256']==original['servingConfigSHA256'],'DEV mudou desde a operação original')
 r.permissions();r.cloud_sql()
 source=pathlib.Path(original['storage']['workspace'])/'source';require(source.is_dir(),'Workspace original ausente; não reconstruir nem migrar automaticamente')
 require(r.command(['git','-C',source,'rev-parse','HEAD'],label='resume-head').strip()==p.SHA and not r.command(['git','-C',source,'status','--porcelain'],label='resume-status').strip(),'Fonte original divergente')
 for migration in original['migrationsApplied']:require(p.digest((source/'dataconnect/migrations'/migration['file']).read_bytes())==migration['sha256'],'Hash SQL divergiu do recibo original')
 r.source=source;r.work=source.parent;r.node=pathlib.Path(first['node22']['path']);r.tools=HERE
 r.env={k:v for k,v in os.environ.items() if not k.startswith(('VITE_','QA_','PG','GOOGLE_APPLICATION_CREDENTIALS'))};r.env.update(PATH=str(r.node.parent)+os.pathsep+os.environ.get('PATH',''),GIT_TERMINAL_PROMPT='0')
 require((HERE/'node_modules/libpg-query').is_dir(),'Ferramentas fixadas não instaladas pelo bootstrap')
 identity=r.sql(["SELECT current_database() AS db,current_user AS usr,pg_has_role(current_user,'firebaseowner_fdcdb_public','MEMBER') AS owner"],owner=False)[0]['rows'][0];require(identity=={'db':p.DATABASE,'usr':p.OPERATOR,'owner':True},'Login/role SQL existente divergente')
 columns=json.loads((old.parent/'legacy-structure-private.json').read_text());require(r.sql([COLUMNS])==columns,'Colunas legadas divergiram do snapshot original');acl=r.sql([ACL])
 tables=r.sql(["SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"])[0]['rows'];local=(source/'dataconnect/schema/schema.gql').read_text();names=re.findall(r'@table\(name: "([^"]+)"',local);require(len(names)==70 and {v['tablename'] for v in tables}==set(names),'Conjunto de tabelas não corresponde ao candidato')
 print('P58R: comparando o catálogo SQL com a referência isolada; somente leitura.',flush=True)
 r.expected=native_contract();r.record['nativeReference']={'objects':len(r.expected),'SHA256':p.digest(json.dumps(r.expected,sort_keys=True).encode()),'source':'compiler local e PostgreSQL18 isolado; sete SQL do candidato'};r.check_native('before-validation')
 principal=r.db_service_user
 for privilege in ['SELECT','INSERT','UPDATE','DELETE']:
  right=r.sql(["SELECT bool_and(has_table_privilege('"+principal+"',quote_ident(schemaname)||'.'||quote_ident(tablename),'"+privilege+"')) AS allowed FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'ec_%'"])[0]['rows'][0];require(right.get('allowed') is True,'Privilégio SQL existente ausente: '+privilege)
 files,total=H.inspect_dist(source/'frontend/dist',source);compressed,mapping=H.bounded_uploads(files)
 require(len(files)==original['publicFiles'] and total==original['rawBytes'] and sum(map(len,compressed.values()))==original['gzipBytes'],'Artefato original divergiu do recibo')
 artifact_manifest={name:{'rawSHA256':value['rawSHA256'],'gzipSHA256':mapping[name]} for name,value in files.items()}
 (r.out/'artifact-manifest-private.json').write_text(json.dumps(artifact_manifest,sort_keys=True,indent=2))
 r.record['artifactManifestSHA256']=p.digest(json.dumps(artifact_manifest,sort_keys=True).encode());r.record['artifactVerification']={'sourceHEADVerified':True,'sourceClean':True,'metricsMatchedOriginalReceipt':True,'hashesRecomputedNow':True,'originalPerFileManifestAvailable':False}
 r.record['storage']=copy.deepcopy(original['storage']);H.check_storage(r.work,sum(map(len,compressed.values()))+32*1024**2,r.record,r.save,'resume-before-publication')
 r.record.update(publicFiles=len(files),rawBytes=total,gzipBytes=sum(map(len,compressed.values())),previousRelease=first['previousRelease'],previousVersion=first['previousRelease']['version'],servingConfigSHA256=first['servingConfigSHA256'],officialDDLAppliedAsRecorded=True,migrationsAppliedAsRecorded=original['migrationsApplied'],existingSQLPrivilegesVerified=True,SQLIdentityVerified=True)
 body=d.schema_request(source,snapshot['schemas-main'])
 print('P58R: revalidando o diff oficial e preservando o build já preparado.',flush=True)
 result=r.api('firebasedataconnect.googleapis.com','/v1/'+p.SERVICE+'/schemas/main','PATCH',body,{'validateOnly':'true','updateMask':'source,datasources'},validation=True)
 if 'validationError' in result:
  (r.out/'compatible-validation-private.json').write_text(json.dumps(d.safe_error(result['validationError'],r.token),ensure_ascii=False,indent=2));r.save()
  r.record['preservedNativeProtections']=validate_protection_only(result['validationError'],r.parse,r.expected);r.record['protectionOnlyDiffVerified']=True;body['datasources'][0]['postgresql']['schemaValidation']='NONE';r.record['SQLValidationMode']='NONE after exact native metadata comparison; no SQL changes'
 else:r.record['SQLValidationMode']='COMPATIBLE'
 r.schema_body=body;r.save()
 config=copy.deepcopy(snapshot['previous-version']['config'])
 p.publish_ready(r,first,snapshot,body,ACL,acl,COLUMNS,columns,config,files,compressed,mapping)
 r.record.update(nativeProtectionsPreserved=True,SQLMigrationsReexecuted=False,newBuildExecuted=False);r.save()

def run():
 require(sys.argv[1:]==['--resume-after-sql'],'Retomada exige --resume-after-sql')
 os.umask(0o077);p.ROOT.mkdir(mode=0o700,exist_ok=True)
 with (p.ROOT/'P58.lock').open('a') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise RuntimeError('P58 em execução; não iniciar retomada concorrente') from None
  prior_resumes();old=p.ROOT/d.OPERATION/'P58-publicacao.json';require(old.is_file(),'Recibo original ausente')
  out=p.ROOT/('P58R-'+dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:6]);out.mkdir(mode=0o700);r=Resume(out)
  try:r.save();resume(r,json.loads(old.read_text()),old)
  except Exception as error:r.record['publicationComplete']=False;r.record['stopped']=str(error) if isinstance(error,RuntimeError) else type(error).__name__
  finally:
   r.token='';r.record['endedUTC']=dt.datetime.now(dt.timezone.utc).isoformat();r.record['receipt']=str(r.path);r.save();(out/'CORE-handoff-publicacao.json').write_text(r.path.read_text());print('=== INICIO P58R ===');print(r.path.read_text());print('=== FIM P58R ===')
  return 0 if r.record.get('publicationComplete') else 1
if __name__=='__main__':
 try:sys.exit(run())
 except RuntimeError as error:print(str(error),file=sys.stderr);sys.exit(1)

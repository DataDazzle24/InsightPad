"""Diagnóstico P55 somente leitura; nenhum build, upload ou release."""
import gzip, hashlib, json, pathlib, subprocess, urllib.error, urllib.parse, urllib.request, uuid
PROJECT = 'insightpad-dd-dev'
CANDIDATE = '1fff0fe154ad473ee61437929b93a17843215a0a'
OPERATION = 'P55-20261116T120210Z-ac521d'
ASSET = '/assets/CatalogPages-C1aHOskZ.js'
PRIOR = 'projects/'+PROJECT+'/sites/'+PROJECT+'/versions/d0e096eb322b6f1e'
CREATED = 'projects/'+PROJECT+'/sites/'+PROJECT+'/versions/ab7824c420c92a5d'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs): return None
OPENER = urllib.request.build_opener(NoRedirect)
def require(ok,message):
 if not ok: raise RuntimeError(message)
def sha(data): return hashlib.sha256(data).hexdigest()
def command(args):
 result=subprocess.run(args,text=True,capture_output=True,timeout=45)
 require(result.returncode==0,'Comando de leitura indisponível: '+args[0])
 return result.stdout.strip()
def read(url,token=None):
 parts=urllib.parse.urlsplit(url)
 require(parts.scheme=='https' and not parts.username and not parts.password and parts.port in (None,443),'Origem inválida')
 if token:
  allowed={'/v1beta1/projects/'+PROJECT+'/sites/'+PROJECT+'/channels/live/releases','/v1beta1/'+PRIOR+'/files','/v1beta1/'+CREATED+'/files'}
  require(parts.hostname=='firebasehosting.googleapis.com' and parts.path in allowed,'Leitura API fora do escopo')
 else:
  require(parts.hostname==PROJECT+'.web.app' and parts.path in {'/version.json',ASSET},'Leitura pública fora do escopo')
 headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'}
 if token: headers['Authorization']='Bearer '+token
 with OPENER.open(urllib.request.Request(url,headers=headers,method='GET'),timeout=30) as response:
  require(response.status==200,'Status de leitura inesperado')
  require(response.headers.get('Content-Encoding','identity').lower() in {'','identity'},'Codificação inesperada')
  data=response.read(8*1024**2+1);require(len(data)<=8*1024**2,'Leitura excedeu limite')
  return data,{k:response.headers.get(k) for k in ('Content-Type','Cache-Control','Age','ETag','X-Cache')}
def inventory(version,token):
 files={};page=''
 for _ in range(10):
  query={'pageSize':100}
  if page:query['pageToken']=page
  raw,_=read('https://firebasehosting.googleapis.com/v1beta1/'+version+'/files?'+urllib.parse.urlencode(query),token)
  value=json.loads(raw)
  for f in value.get('files',[]):
   require(f['path'] not in files,'Caminho duplicado no inventário')
   files[f['path']]={'hash':f.get('hash'),'status':f.get('status')}
  page=value.get('nextPageToken','')
  if not page:return files
 raise RuntimeError('Paginação excedeu limite')
def main():
 require(command(['gcloud','config','get-value','project'])==PROJECT,'Projeto ativo deve ser insightpad-dd-dev')
 require(command(['gcloud','config','get-value','account'])=='datadazzletecnologia@gmail.com','Conta ativa diferente da operação P55')
 root=pathlib.Path.home()/'InsightPad_DEV_Barras_Globais_1fff0fe'/OPERATION
 receipt=json.loads((root/'P55-publicacao.json').read_text())
 require(receipt['project']==PROJECT and receipt['candidate']==CANDIDATE,'Recibo fora do escopo')
 require(receipt['version']==CREATED and receipt['previousVersion']==PRIOR and receipt.get('rollbackConfirmed') is True,'Recibo de reversão divergente')
 manifest_bytes=(root/'artifact-manifest-private.json').read_bytes()
 require(sha(manifest_bytes)==receipt['artifactManifestSHA256'],'Manifesto local divergente')
 manifest=json.loads(manifest_bytes);expected=manifest['files'][ASSET]
 local=pathlib.Path(receipt['sourceRoot'])/'frontend/dist'/ASSET.lstrip('/')
 data=local.read_bytes();require(sha(data)==expected['rawSHA256'],'Artefato local divergente do manifesto')
 token=command(['gcloud','auth','print-access-token','--project='+PROJECT])
 require(bool(token),'Token de leitura indisponível')
 try:
  raw,_=read('https://firebasehosting.googleapis.com/v1beta1/projects/'+PROJECT+'/sites/'+PROJECT+'/channels/live/releases?pageSize=1',token)
  live=json.loads(raw).get('releases',[]);require(bool(live),'Release live não encontrada')
  before=inventory(PRIOR,token);candidate=inventory(CREATED,token)
 finally:token=''
 nonce=uuid.uuid4().hex
 raw,_=read('https://'+PROJECT+'.web.app/version.json?diag='+nonce)
 public=json.loads(raw)
 served,headers=read('https://'+PROJECT+'.web.app'+ASSET+'?diag='+nonce)
 collisions=[p for p in sorted(set(before)&set(candidate)) if before[p]['hash']!=candidate[p]['hash']]
 result={'phase':'P55_DIAGNOSTICO_READONLY','remoteMutations':False,'candidate':CANDIDATE,
  'liveVersion':live[0].get('version',{}).get('name'),'rollbackStillLive':live[0].get('version',{}).get('name')==PRIOR,
  'publicVersion':{k:public.get(k) for k in ('project','commit','builtUTC')},
  'recordedFailure':receipt.get('stopped'),'asset':ASSET,'localRawSHA256':sha(data),'servedRawSHA256':sha(served),
  'localBytes':len(data),'servedBytes':len(served),'servedMatchesCandidate':served==data,'responseHeaders':headers,
  'priorInventory':before.get(ASSET),'candidateInventory':candidate.get(ASSET),'localGzipSHA256':sha(gzip.compress(data,mtime=0)),
  'samePathsWithDifferentHashes':collisions,'samePathCount':len(collisions)}
 print('=== INICIO P55 DIAGNOSTICO ===');print(json.dumps(result,indent=2,ensure_ascii=False));print('=== FIM P55 DIAGNOSTICO ===')
if __name__=='__main__':
 try:main()
 except Exception as error:
  print('Diagnóstico interrompido: '+(str(error) if isinstance(error,RuntimeError) else 'HTTP '+str(error.code) if isinstance(error,urllib.error.HTTPError) else type(error).__name__))
  raise SystemExit(1)

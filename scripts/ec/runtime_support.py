"""Real local SQL Connect compiler + disposable PG18. Never a remote datasource."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[2]
IMAGE = 'postgres@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6'
BINARY_SHA = '337ec8a195d6198e83bdeb070b12a64cecbf7aa1ba2c190b6611f78cd128a21a'
DOWNLOAD = 'https://storage.googleapis.com/firemat-preview-drop/emulator/dataconnect-emulator-linux-amd64-v3.4.23'
MIGRATIONS = ['20261118-encomendas-comandas.sql','20261118-ec-functions.sql',
              '20261118-ec-ledger.sql','20261118-ec-allocation-parts.sql',
              '20261118-ec-advanced.sql','20261118-ec-commands.sql','20261118-ec-queries.sql']
IDS = {name:str(uuid.uuid5(uuid.NAMESPACE_DNS,'ec.synthetic.'+name)) for name in
       ['tenant','role','branch','branch2','category','product','product2','bundle','customer','cash','method','cashmethod','stocktype']}
OUT = ROOT/'artifacts/browser-private/ec-runtime'

def definition(source,name):
    result = re.search(r'^(?:mutation|query) '+name+r'\b[\s\S]*?^}',source,re.M)
    assert result, name
    return result.group()

class Runtime:
    def __init__(self):
        self.name='insightpad-ec-test-'+uuid.uuid4().hex[:10]
        self.created=False;self.process=None;self.temp=None;self.calls=[]
        self.source_fingerprint=hashlib.sha256(b''.join((ROOT/path).read_bytes() for path in ['dataconnect/schema/schema.gql','dataconnect/app/queries.gql','dataconnect/app/mutations.gql',*['dataconnect/migrations/'+name for name in MIGRATIONS]])).hexdigest()
        self.opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    def shell(self,args,**kwargs):
        result=subprocess.run(args,capture_output=True,text=True,timeout=45,**kwargs)
        if result.returncode:raise RuntimeError(result.stderr[-6000:])
        return result.stdout.strip()
    def sql(self,statement):
        assert self.name.startswith('insightpad-ec-test-') and self.created
        return self.shell(['docker','exec','-i',self.name,'psql','-XAtq','-h','127.0.0.1','-U','postgres','-d','fdcdb','-v','ON_ERROR_STOP=1'],input=statement)
    def post(self,path,body,actor=None):
        headers={'Content-Type':'application/json'}
        if actor:
            encode=lambda v:base64.urlsafe_b64encode(json.dumps(v).encode()).decode().rstrip('=')
            token=encode({'alg':'none','typ':'JWT'})+'.'+encode({'sub':actor,'user_id':actor,'aud':'demo-insightpad-ec',
                  'iss':'https://securetoken.google.com/demo-insightpad-ec','iat':int(time.time()),'exp':int(time.time())+3600,
                  'firebase':{'sign_in_provider':'custom'}})+'.'
            headers['X-Firebase-Auth-Token']=token
        assert self.base.startswith('http://127.0.0.1:')
        request=urllib.request.Request(self.base+path,data=json.dumps(body).encode(),headers=headers)
        try:
            with self.opener.open(request,timeout=25) as response:return json.load(response)
        except urllib.error.HTTPError as error:return json.load(error)
    def operation(self,name,variables,mutation=False,actor='actor',token='a'*64):
        path='/v1/projects/demo-insightpad-ec/locations/southamerica-east1/services/insightpad/connectors/app:'
        result=self.post(path+('executeMutation' if mutation else 'executeQuery'),{'operationName':name,'variables':{**variables,'sessionToken':token}},actor)
        self.calls.append({'operation':name,'actor':actor,'mutation':mutation,'result':result})
        return result
    def command(self,action,payload=None,document=None,kind='COMANDA',secondary=None,operation_id=None,actor='actor',token='a'*64):
        command={'operationId':operation_id or str(uuid.uuid4()),'kind':kind,'action':action,'payload':payload or {}}
        if document:command.update(documentId=document['documentId'],expectedVersion=document['version'])
        if secondary:command.update(secondaryDocumentId=secondary['documentId'],secondaryExpectedVersion=secondary['version'])
        return command,self.operation('EcCommand',{'command':command},True,actor,token)
    def accepted(self,*args,**kwargs):
        command,response=self.command(*args,**kwargs)
        assert not response.get('errors'), response
        result=response['data']['query']['response']['result']
        assert result['status']=='COMMITTED',result
        return result
    def read(self,kind='COMANDA',**fields):
        response=self.operation('EcRead',{'input':{'kind':kind,**fields}})
        assert not response.get('errors'),response
        return response['data']['response']['result']
    def reset(self):
        self.sql('TRUNCATE tenants,app_pages CASCADE;')
        self.sql((ROOT/'scripts/ec/fixtures.sql').read_text().format(**IDS))
        self.calls=[]
    def __enter__(self):
        OUT.mkdir(parents=True,exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(prefix='ip-ec-')
        try:
            self.start(Path(self.temp.name))
            return self
        except BaseException:
            self.close();raise
    def start(self,temp):
        config=temp/'config';(config/'schema').mkdir(parents=True);(config/'app').mkdir()
        (config/'schema/schema.gql').write_bytes((ROOT/'dataconnect/schema/schema.gql').read_bytes())
        (config/'dataconnect.yaml').write_text('specVersion: "v1"\nserviceId: "insightpad"\nlocation: "southamerica-east1"\nschema:\n  source: "./schema"\n  datasource:\n    postgresql:\n      database: "fdcdb"\n      cloudSql:\n        instanceId: "synthetic-only"\nconnectorDirs: ["./app"]\n')
        (config/'app/connector.yaml').write_text('connectorId: app\n')
        queries=(ROOT/'dataconnect/app/queries.gql').read_text()
        mutations=(ROOT/'dataconnect/app/mutations.gql').read_text()
        (config/'app/operations.gql').write_text('\n\n'.join([definition(queries,'EcRead'),
            *[definition(queries,name) for name in ['SalesChannelProductOptions','StockWorkspace','SearchPosProducts','PosProductBranches','FinancialIndicatorsDashboard','ListSales','SaleDetails','SalesWorkspace']],
            *[definition(mutations,name) for name in ['EcCommand','ApprovePosSale','PostSale','CancelSale','PostStockAdjustment','PostStockTransfer','SaveStockBatch','ReverseStockOperation']]]))
        binary=Path(os.environ.get('FIREBASE_EMULATORS_PATH','/tmp'))/'dataconnect-emulator-3.4.23'
        local=ROOT.parent/'tools/dataconnect-emulator'
        if not binary.is_file():binary=local if local.is_file() else temp/'dataconnect-emulator'
        if not binary.is_file():
            with urllib.request.urlopen(DOWNLOAD,timeout=45) as response:binary.write_bytes(response.read())
            binary.chmod(0o700)
        assert hashlib.sha256(binary.read_bytes()).hexdigest()==BINARY_SHA,'Compiler checksum'
        sock=temp/'sock';sock.mkdir();sock.chmod(0o777)
        self.shell(['docker','run','-d','--rm','--name',self.name,'--network','none','--memory','768m','--tmpfs','/var/lib/postgresql:rw,size=384m',
                    '--volume',str(sock)+':/diag-sock','-e','POSTGRES_HOST_AUTH_METHOD=trust','-e','POSTGRES_DB=fdcdb',IMAGE,'-k','/var/run/postgresql,/diag-sock'])
        self.created=True
        deadline=time.monotonic()+20
        while True:
            try:
                if self.sql('SELECT 1;')=='1':break
            except RuntimeError:pass
            assert time.monotonic()<deadline,'PG18 readiness';time.sleep(.1)
        assert self.sql('SHOW server_version_num;').startswith('180')
        with socket.socket() as listener:listener.bind(('127.0.0.1',0));port=listener.getsockname()[1]
        self.base='http://127.0.0.1:'+str(port)
        self.log=(OUT/'emulator-private.log').open('w')
        self.process=subprocess.Popen([str(binary),'--logtostderr','-v=2','dev','--config_dir='+str(config),'--listen=127.0.0.1:'+str(port)],stdout=self.log,stderr=self.log,
                env=dict(os.environ,GCE_METADATA_HOST='127.0.0.1:9',NO_PROXY='127.0.0.1,localhost'))
        deadline=time.monotonic()+20
        while True:
            try:
                with self.opener.open(self.base+'/emulator/info',timeout=1):break
            except OSError:pass
            assert self.process.poll() is None and time.monotonic()<deadline,'Compiler readiness';time.sleep(.1)
        result=self.post('/emulator/configure',{'connectionString':'postgresql://postgres@/fdcdb?host='+str(sock)+'&sslmode=disable','database':'fdcdb','serviceId':'insightpad'})
        assert not result.get('error'),result
        for name in MIGRATIONS:self.sql((ROOT/'dataconnect/migrations'/name).read_text())
        assert self.sql("SELECT count(*) FROM pg_tables WHERE schemaname='public';")=='70'
        # Applying additive DDL twice is verified before any fixture is inserted.
        for name in MIGRATIONS:self.sql((ROOT/'dataconnect/migrations'/name).read_text())
    def close(self):
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:self.process.kill();self.process.wait()
        if self.created:subprocess.run(['docker','rm','-f',self.name],capture_output=True,timeout=15)
        if hasattr(self,'log'):self.log.close()
        if self.temp:self.temp.cleanup()
    def __exit__(self,*args):self.close()

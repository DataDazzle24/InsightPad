"""Opt-in browser bridge to the disposable SQL engine; QA Auth remains synthetic."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import json
import threading
import urllib.parse
from runtime_support import Runtime,ROOT,OUT,IDS

ALLOWED={'EcRead','EcCommand','ListSales','SaleDetails','SalesWorkspace'}

def seed(runtime):
    runtime.reset()
    for index,name in enumerate(['Mesa 01','Mesa 01','Ana / balcão','Mesa 02','Retirada','Mesa 03']):
        d=runtime.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':name,'participants':['Ana','Bruno']})
        d=runtime.accepted('ADD_ITEM',{'productId':IDS['product'],'quantity':'1'},d)
        if index in (0,4):runtime.accepted('RECEIVE',{'amountCents':'10000','paymentMethodId':IDS['method'],'cashSessionId':IDS['cash']},d)
    local=runtime.sql("SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;")
    dates=runtime.sql("SELECT ((now() AT TIME ZONE 'America/Sao_Paulo')::date-1)::text||'|'||((now() AT TIME ZONE 'America/Sao_Paulo')::date+1)::text;").split('|')
    for index,day in enumerate([dates[0],local,dates[1],dates[1]]):
        d=runtime.accepted('CREATE_ORDER',{'branchId':IDS['branch'],'customerId':IDS['customer'],'dueAtLocal':day+'T12:30','fulfillmentMode':'PICKUP','reservationStrategy':'NOW' if index>1 else 'WAIT','items':[{'productId':IDS['product'],'quantity':'1'}]},kind='ENCOMENDA')
        if index==2:runtime.accepted('MARK_READY',{},d,'ENCOMENDA')

if __name__=='__main__':
    with Runtime() as runtime:
        seed(runtime)
        state={'loseAck':False}
        class Handler(SimpleHTTPRequestHandler):
            def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'artifacts/recovery-qa'),**kwargs)
            def log_message(self,*args):pass
            def send_json(self,value,status=200):
                data=json.dumps(value).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
            def do_GET(self):
                if urllib.parse.urlsplit(self.path).path=='/__ec/info':
                    return self.send_json({'uid':'actor','tenantId':IDS['tenant'],'branchId':IDS['branch'],'ids':IDS,'sourceFingerprint':runtime.source_fingerprint,'scope':'QA Auth mock + real local SQL Connect/PG18; never DEV'})
                if self.path=='/__ec/stats':
                    rows=runtime.sql("SELECT jsonb_build_object('sales',(SELECT count(*) FROM sales),'receivedCents',(SELECT COALESCE(sum(amount_cents),0)::text FROM ec_receipts),'cashCents',(SELECT COALESCE(sum(amount_cents),0)::text FROM cash_movements),'documents',(SELECT count(*) FROM ec_documents),'operations',(SELECT count(*) FROM ec_operations))::text;")
                    return self.send_json(json.loads(rows))
                if self.path=='/__ec/runtime-ready':return self.send_json({'ready':True})
                return super().do_GET()
            def do_POST(self):
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=300000:return self.send_json({'error':'invalid length'},400)
                value=json.loads(self.rfile.read(length))
                if self.path=='/__ec/reset':seed(runtime);return self.send_json({'reset':True})
                if self.path=='/__ec/access':
                    mode=value.get('mode');assert mode in ('full','read','denied')
                    allow=mode!='denied';write=mode=='full'
                    runtime.sql(f"UPDATE role_page_permissions SET can_access={str(allow).lower()},can_create={str(write).lower()},can_update={str(write).lower()},can_delete={str(write).lower()},can_manage={str(write).lower()},can_export={str(write).lower()};")
                    return self.send_json({'mode':mode})
                if self.path=='/__ec/lose-ack':state['loseAck']=True;return self.send_json({'armed':True})
                if self.path=='/__ec/cash-operator':
                    runtime.sql(f"INSERT INTO user_page_permissions(user_id,page_id,tenant_id,can_access,can_manage,created_at,updated_at) SELECT 'actor',id,'{IDS['tenant']}',true,false,now(),now() FROM app_pages WHERE page_key='CAIXA';INSERT INTO users(id,tenant_id,role_id,name,email,created_at,updated_at) VALUES('manager','{IDS['tenant']}','{IDS['role']}','Synthetic approver','manager@example.invalid',now(),now());INSERT INTO user_device_sessions(user_id,tenant_id,session_token,device_id,claimed_at,last_seen_at) VALUES('manager','{IDS['tenant']}',encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex'),'synthetic',now(),now());")
                    return self.send_json({'syntheticCashOperator':True})
                if self.path=='/__ec/approve':
                    # Actual existing approval operation, synthetic second identity.
                    return self.send_json(runtime.operation('ApprovePosSale',{'approvalId':value['id'],'approved':True},True,actor='manager',token='b'*64))
                if self.path!='/__ec/rpc' or value.get('name') not in ALLOWED:return self.send_json({'error':'unsupported'},400)
                variables=value.get('variables',{});name=value['name']
                result=runtime.operation(name,variables,name=='EcCommand',token=variables.get('sessionToken','a'*64))
                if name=='EcCommand' and state['loseAck']:
                    state['loseAck']=False;self.close_connection=True;return
                return self.send_json(result)
        # No externally reachable listener and no port mapping into the container.
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        info={'port':server.server_port,'url':'http://127.0.0.1:'+str(server.server_port),'scope':'synthetic only','container':runtime.name}
        (OUT/'browser-info.json').write_text(json.dumps(info))
        print(json.dumps(info),flush=True)
        try:server.serve_forever()
        except KeyboardInterrupt:pass
        finally:server.server_close()

"""Acceptance against real disposable PG18 + the SQL Connect engine; no DEV writes."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
from decimal import Decimal
import json
from pathlib import Path
import subprocess
import threading
import unittest
import uuid
from runtime_support import Runtime,IDS,ROOT,OUT,MIGRATIONS

class DomainTests(unittest.TestCase):
    runtime:Runtime
    def setUp(self):self.r=self.runtime;self.r.reset()
    def order(self,quantity='2',strategy='NOW',payment=None,extra=None):
        payload={'branchId':IDS['branch'],'customerId':IDS['customer'],'dueAtLocal':'2026-11-20T12:30','fulfillmentMode':'PICKUP','reservationStrategy':strategy,
                 'items':[{'productId':IDS['product'],'quantity':quantity}],**(extra or {})}
        if payment:payload['payment']=payment
        return self.r.accepted('CREATE_ORDER',payload,kind='ENCOMENDA')
    def tab(self,quantity='1',product='product'):
        d=self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'Synthetic table'})
        return self.r.accepted('ADD_ITEM',{'productId':IDS[product],'quantity':quantity},d)
    def payment(self,amount='10000',method='cashmethod',cash=None):
        return {'amountCents':amount,'paymentMethodId':IDS[method],'cashSessionId':cash or IDS['cash']}
    def detail(self,d,kind='COMANDA'):return self.r.read(kind,mode='DETAIL',documentId=d['documentId'])
    def reject(self,action,payload,document=None,kind='COMANDA',code=None,**kwargs):
        _,response=self.r.command(action,payload,document,kind,**kwargs)
        self.assertFalse(response.get('errors'),response)
        result=response['data']['query']['response']['result'];self.assertEqual(result['status'],'REJECTED',result)
        if code:self.assertEqual(result['error']['code'],code,result)
        return result
    def scalar(self,sql):return self.r.sql(sql)
    def user_permission(self,page,**caps):
        values={name:True for name in ['can_access','can_create','can_update','can_delete','can_manage','can_export']};values.update(caps)
        self.r.sql(f"INSERT INTO user_page_permissions(user_id,page_id,tenant_id,{','.join(values)},created_at,updated_at) SELECT 'actor',id,'{IDS['tenant']}',{','.join(str(v).lower() for v in values.values())},now(),now() FROM app_pages WHERE page_key='{page}';")
    def manager(self):
        self.r.sql(f"INSERT INTO users(id,tenant_id,role_id,name,email,created_at,updated_at) VALUES('manager','{IDS['tenant']}','{IDS['role']}','Synthetic approver','manager@example.invalid',now(),now());INSERT INTO user_device_sessions(user_id,tenant_id,session_token,device_id,claimed_at,last_seen_at) VALUES('manager','{IDS['tenant']}',encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex'),'synthetic',now(),now());")
    def test_T01_deposit_finish_one_sale_and_stock_debit(self):
        d=self.order(payment=self.payment('6000'))
        self.assertEqual(self.scalar('SELECT count(*) FROM sales;'),'0')
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'6000')
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'100.000')
        d=self.r.accepted('MARK_READY',{},d,'ENCOMENDA')
        d=self.r.accepted('RECEIVE_AND_COMPLETE',{'payment':self.payment('14000')},d,'ENCOMENDA')
        self.assertEqual(self.scalar('SELECT count(*)||\':\'||sum(total_cents) FROM sales;'),'1:20000')
        self.assertEqual(self.scalar('SELECT count(*)||\':\'||sum(amount_cents) FROM cash_movements;'),'2:20000')
        self.assertEqual(self.scalar('SELECT count(*) FROM ec_sale_receipt_links;'),'2')
        snapshots=json.loads(self.scalar('SELECT jsonb_agg(jsonb_build_array(balance_before_cents,balance_after_cents) ORDER BY received_at,id)::text FROM ec_receipts;'));self.assertEqual(snapshots,[[20000,14000],[14000,0]])
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'98.000')
        self.assertEqual(self.detail(d,'ENCOMENDA')['document']['status'],'COMPLETED')
    def test_T02_receipts_keep_their_original_cash_and_date(self):
        d=self.order(payment=self.payment('6000'))
        self.r.sql("UPDATE ec_receipts SET received_at=now()-interval '1 day';UPDATE cash_movements SET created_at=now()-interval '1 day';UPDATE cash_sessions SET status='CLOSED',opened_at=now()-interval '1 day',closed_at=now();")
        second=str(uuid.uuid4());self.r.sql(f"INSERT INTO cash_sessions(id,tenant_id,branch_id,opened_by_uid,opened_at,opening_amount_cents,status,created_at,updated_at) VALUES('{second}','{IDS['tenant']}','{IDS['branch']}','actor',now(),0,'OPEN',now(),now());")
        d=self.r.accepted('MARK_READY',{},d,'ENCOMENDA');self.r.accepted('RECEIVE_AND_COMPLETE',{'payment':self.payment('14000',cash=second)},d,'ENCOMENDA')
        self.assertEqual(self.scalar(f"SELECT sum(amount_cents) FROM cash_movements WHERE session_id='{IDS['cash']}';"),'6000')
        self.assertEqual(self.scalar(f"SELECT sum(amount_cents) FROM cash_movements WHERE session_id='{second}';"),'14000')
        self.assertEqual(self.scalar("SELECT count(*) FROM ec_receipts WHERE received_at<now()-interval '20 hours';"),'1')
        workspace=self.r.operation('SalesWorkspace',{'branchId':IDS['branch'],'requestKey':str(uuid.uuid4())});self.assertFalse(workspace.get('errors'),workspace);self.assertEqual(str(workspace['data']['_select'][0]['data']['openSession']['expectedAmountCents']),'14000')
    def test_T05_integral_reservation_wait_and_ready(self):
        self.r.sql("UPDATE stock_balances SET quantity=6;UPDATE stock_movements SET quantity=6 WHERE client_operation_id='ec-synthetic-opening';")
        payload={'branchId':IDS['branch'],'customerId':IDS['customer'],'dueAtLocal':'2026-11-20T12:30','fulfillmentMode':'PICKUP','reservationStrategy':'NOW','items':[{'productId':IDS['product'],'quantity':'10'}]}
        failure=self.reject('CREATE_ORDER',payload,kind='ENCOMENDA',code='INSUFFICIENT_STOCK')
        self.assertEqual(Decimal(failure['error']['details']['shortages'][0]['missing']),Decimal('4'))
        self.assertEqual(self.scalar('SELECT count(*) FROM ec_documents;'),'0')
        d=self.order('10','WAIT');self.assertEqual(self.scalar("SELECT count(*) FROM ec_reservations WHERE status='ACTIVE';"),'0')
        self.reject('MARK_READY',{},d,'ENCOMENDA','RESERVATION_REQUIRED')
        self.r.sql("UPDATE stock_balances SET quantity=10;INSERT INTO stock_movements(id,tenant_id,branch_id,product_id,movement_type_id,client_operation_id,quantity,unit_gross_cents,unit_cost_cents,occurred_at,status,created_by_uid,created_at) SELECT gen_random_uuid(),tenant_id,branch_id,product_id,movement_type_id,'ec-synthetic-replenish',4,unit_gross_cents,unit_cost_cents,now(),status,created_by_uid,now() FROM stock_movements WHERE client_operation_id='ec-synthetic-opening';");d=self.r.accepted('RESERVE',{},d,'ENCOMENDA');self.r.accepted('MARK_READY',{},d,'ENCOMENDA')
    def test_T06_combos_and_simple_items_share_components(self):
        d=self.order(extra={'items':[{'productId':IDS['bundle'],'quantity':'3'},{'productId':IDS['product'],'quantity':'2'}]})
        self.assertEqual(self.scalar(f"SELECT sum(quantity) FROM ec_reservations WHERE product_id='{IDS['product']}' AND status='ACTIVE';"),'8.000')
        self.assertEqual(self.scalar(f"SELECT sum(quantity) FROM ec_reservations WHERE product_id='{IDS['product2']}' AND status='ACTIVE';"),'3.000')
        self.assertEqual(self.detail(d,'ENCOMENDA')['document']['total_cents'],'95000')
    def test_T07_own_reservation_and_failed_edit_are_atomic(self):
        self.r.sql("UPDATE stock_balances SET quantity=3;UPDATE stock_movements SET quantity=3 WHERE client_operation_id='ec-synthetic-opening';");d=self.order();item=self.detail(d,'ENCOMENDA')['items'][0]
        payload={'items':[{'id':item['id'],'productId':IDS['product'],'quantity':'3'}]}
        d=self.r.accepted('EDIT_ORDER',payload,d,'ENCOMENDA');before=self.scalar('SELECT jsonb_agg(to_jsonb(r) ORDER BY id)::text FROM ec_reservations r;')
        payload['items'][0]['quantity']='4';self.reject('EDIT_ORDER',payload,d,'ENCOMENDA','INSUFFICIENT_STOCK')
        self.assertEqual(self.detail(d,'ENCOMENDA')['items'][0]['quantity'],'3.000')
        self.assertEqual(self.scalar('SELECT jsonb_agg(to_jsonb(r) ORDER BY id)::text FROM ec_reservations r;'),before)
    def test_T08_two_requests_dispute_the_last_unit(self):
        self.r.sql("UPDATE stock_balances SET quantity=1;UPDATE stock_movements SET quantity=1 WHERE client_operation_id='ec-synthetic-opening';");barrier=threading.Barrier(2)
        def attempt(_):
            barrier.wait();return self.r.command('CREATE_ORDER',{'branchId':IDS['branch'],'customerId':IDS['customer'],'dueAtLocal':'2026-11-20T12:30','fulfillmentMode':'PICKUP','reservationStrategy':'NOW','items':[{'productId':IDS['product'],'quantity':'1'}]},kind='ENCOMENDA')[1]
        with ThreadPoolExecutor(2) as pool:responses=list(pool.map(attempt,range(2)))
        outcomes=[x['data']['query']['response']['result'] for x in responses]
        self.assertEqual(sorted(x['status'] for x in outcomes),['COMMITTED','REJECTED'])
        self.assertEqual(self.scalar("SELECT sum(quantity) FROM ec_reservations WHERE status='ACTIVE';"),'1.000')
    def test_T09_legacy_pos_and_direct_stock_writer_respect_ec(self):
        self.order('100')
        payload={'branchId':IDS['branch'],'cashSessionId':IDS['cash'],'clientOperationId':str(uuid.uuid4()),'discountCents':0,'surchargeCents':0,
                 'items':[{'product_id':IDS['product'],'quantity':1,'requested_price':None}],
                 'payments':[{'payment_method_id':IDS['method'],'amount_cents':10000,'sequence':1,'external_reference':'Synthetic'}]}
        response=self.r.operation('PostSale',{'payload':payload},True)
        self.assertTrue(response.get('errors'),response);self.assertEqual(self.scalar('SELECT count(*) FROM sales;'),'0')
        with self.assertRaises(RuntimeError):self.r.sql(f"UPDATE stock_balances SET quantity=99 WHERE product_id='{IDS['product']}';")
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'100.000')
    def test_T10_catalog_changes_do_not_reprice_or_reexpand(self):
        d=self.order(extra={'items':[{'productId':IDS['bundle'],'quantity':'1'}]})
        detail=self.detail(d,'ENCOMENDA');item=detail['items'][0]
        self.r.sql(f"UPDATE products SET sale_price_cents=50000 WHERE id='{IDS['bundle']}';UPDATE product_components SET quantity=4 WHERE parent_product_id='{IDS['bundle']}' AND component_product_id='{IDS['product']}';")
        d=self.r.accepted('EDIT_ORDER',{'items':[{'id':item['id'],'productId':IDS['bundle'],'quantity':'1','unitPriceCents':'50000'}],'notes':'Synthetic changed note'},d,'ENCOMENDA')
        self.assertEqual(self.detail(d,'ENCOMENDA')['document']['total_cents'],'25000')
        self.assertEqual(self.scalar(f"SELECT sum(quantity) FROM ec_reservations WHERE product_id='{IDS['product']}' AND status='ACTIVE';"),'2.000')
    def test_T09B_shared_availability_reaches_existing_pos_and_stock_queries(self):
        self.order()
        response=self.r.operation('SearchPosProducts',{'branchId':IDS['branch'],'search':'Synthetic cake','limit':30,'offset':0,'requestKey':str(uuid.uuid4())})
        self.assertFalse(response.get('errors'),response)
        product=response['data']['_select'][0];self.assertEqual(Decimal(str(product['stock'])),Decimal(98))
        response=self.r.operation('PosProductBranches',{'productId':IDS['product'],'requestKey':str(uuid.uuid4())})
        self.assertFalse(response.get('errors'),response)
        balance=next(row for row in response['data']['_select'] if row['branchId']==IDS['branch']);self.assertEqual(Decimal(str(balance['quantity'])),Decimal(98))
        response=self.r.operation('StockWorkspace',{'requestKey':str(uuid.uuid4()),'filters':{},'limit':25,'offset':0})
        self.assertFalse(response.get('errors'),response)
        product=next(p for p in response['data']['_select'][0]['data']['products'] if p['id']==IDS['product'])
        balance=next(b for b in product['balances'] if b['branchId']==IDS['branch'])
        self.assertEqual(Decimal(str(balance['availableQuantity'])),Decimal(98))
        response=self.r.operation('SalesWorkspace',{'branchId':IDS['branch'],'requestKey':str(uuid.uuid4())});self.assertFalse(response.get('errors'),response)
        product=next(p for p in response['data']['_select'][0]['data']['products'] if p['id']==IDS['product']);self.assertEqual(Decimal(str(product['stock'])),Decimal(98));self.assertEqual(Decimal(str(product['reservedStock'])),Decimal(2))
        connection=str(uuid.uuid4());self.r.sql(f"INSERT INTO app_pages(id,page_key,display_name,module,route,created_at,updated_at) VALUES(gen_random_uuid(),'CANAIS_VENDA','Synthetic channel','Canais','/synthetic/channel',now(),now());INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,created_at,updated_at) SELECT '{IDS['role']}',id,'{IDS['tenant']}',true,now(),now() FROM app_pages WHERE page_key='CANAIS_VENDA';INSERT INTO sales_channel_connections(id,tenant_id,branch_id,provider,display_name,enabled,created_at,updated_at) VALUES('{connection}','{IDS['tenant']}','{IDS['branch']}','IFOOD','Synthetic disabled',false,now(),now());")
        response=self.r.operation('SalesChannelProductOptions',{'term':'','connectionId':connection,'productId':IDS['product'],'limit':10,'requestKey':str(uuid.uuid4())});self.assertFalse(response.get('errors'),response);self.assertEqual(Decimal(str(response['data']['_select'][0]['availableStock'])),Decimal(98))
    def test_T11_edit_below_paid_is_rejected_and_notes_keep_ready(self):
        d=self.order(payment=self.payment('15000'));d=self.r.accepted('MARK_READY',{},d,'ENCOMENDA');item=self.detail(d,'ENCOMENDA')['items'][0]
        self.reject('EDIT_ORDER',{'items':[{'id':item['id'],'productId':IDS['product'],'quantity':'1'}]},d,'ENCOMENDA','TOTAL_BELOW_RECEIVED')
        before=self.scalar("SELECT count(*) FROM ec_reservations;")
        d=self.r.accepted('EDIT_ORDER',{'notes':'Only metadata','items':[{'id':item['id'],'productId':IDS['product'],'quantity':'2'}]},d,'ENCOMENDA')
        self.assertEqual(self.detail(d,'ENCOMENDA')['document']['status'],'READY');self.assertEqual(self.scalar('SELECT count(*) FROM ec_reservations;'),before)
    def test_T12_reschedule_local_day_history_and_calendar(self):
        d=self.order(extra={'dueAtLocal':'2026-11-20T23:30'})
        initial=self.detail(d,'ENCOMENDA')['document']['due_at'];self.assertTrue(initial.startswith('2026-11-21T02:30'))
        d=self.r.accepted('RESCHEDULE',{'dueAtLocal':'2026-11-21T23:30'},d,'ENCOMENDA')
        result=self.r.read('ENCOMENDA',mode='CALENDAR',calendarFrom='2026-11-01',calendarTo='2026-12-12')
        self.assertEqual(result['calendarDays'][0]['date'],'2026-11-21')
        events=self.r.read('ENCOMENDA',mode='EVENTS',documentId=d['documentId'])['rows'];self.assertEqual(events[-1]['details']['previousDueAt'],initial)
    def test_T13_split_plan_has_exact_persisted_remainders(self):
        d=self.tab();d=self.r.accepted('CREATE_SPLIT',{'mode':'EQUAL','parts':3},d)
        shares=self.detail(d)['plans'][0]['shares'];self.assertEqual([s['amount_cents'] for s in shares],['3333','3333','3334'])
        self.assertEqual(self.scalar("SELECT sum(quantity) FROM ec_reservations WHERE status='ACTIVE';"),'1.000')
    def test_T13B_shared_item_and_person_payments_allocate_without_splitting_stock(self):
        d=self.tab(product='product2');item=self.detail(d)['items'][0]
        d=self.r.accepted('CREATE_SPLIT',{'mode':'SHARED_ITEM','parts':3,'itemId':item['id']},d)
        shares=self.detail(d)['plans'][0]['shares'];self.assertEqual([s['amount_cents'] for s in shares],['933','933','934'])
        for s in shares:d=self.r.accepted('RECEIVE',{**self.payment(s['amount_cents'],method='method'),'allocations':[{'itemId':item['id'],'shareId':s['id'],'amountCents':s['amount_cents']}]},d)
        self.assertEqual(self.detail(d)['document']['received_net_cents'],'2800');self.assertEqual(self.scalar('SELECT count(*) FROM cash_movements;'),'0')
        self.assertEqual(self.scalar("SELECT sum(quantity) FROM ec_reservations WHERE status='ACTIVE';"),'1.000');self.assertEqual(self.scalar('SELECT count(*) FROM ec_items;'),'1')
        p=self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'Person allocation','participants':['Synthetic person']});person=self.detail(p)['participants'][0]['id']
        p=self.r.accepted('ADD_ITEM',{'productId':IDS['product2'],'quantity':'1','participantId':person},p)
        p=self.r.accepted('CREATE_SPLIT',{'mode':'PERSON','parts':1,'participantId':person},p);detail=self.detail(p);share=detail['plans'][0]['shares'][0];line=detail['items'][0]
        self.r.accepted('RECEIVE',{**self.payment('2800',method='method'),'allocations':[{'itemId':line['id'],'participantId':person,'shareId':share['id'],'amountCents':'2800'}]},p)
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM ec_allocations;'),'5600')
    def test_T14_concurrent_receipts_never_exceed_balance(self):
        d=self.tab();barrier=threading.Barrier(2)
        def receive(_):barrier.wait();return self.r.command('RECEIVE',self.payment('6000'),d)[1]
        with ThreadPoolExecutor(2) as pool:responses=list(pool.map(receive,range(2)))
        self.assertEqual(sorted(r['data']['query']['response']['result']['status'] for r in responses),['COMMITTED','REJECTED'])
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM ec_receipts;'),'6000')
    def test_T15_noted_removal_releases_without_physical_debit(self):
        d=self.tab('2');item=self.detail(d)['items'][0]
        self.r.accepted('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Synthetic removal'},d)
        self.assertEqual(self.scalar("SELECT sum(quantity) FROM ec_reservations WHERE status='ACTIVE';"),'1.000')
        self.assertEqual(self.scalar("SELECT count(*) FROM stock_movements WHERE client_operation_id<>'ec-synthetic-opening';"),'0')
    def test_T16_reconciliation_moves_no_money_and_paid_item_is_protected(self):
        d=self.tab();d=self.r.accepted('RECEIVE',self.payment('5000'),d);item=self.detail(d)['items'][0]
        self.reject('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Synthetic'},d,code='ALLOCATION_REQUIRED')
        receipt=self.scalar('SELECT id FROM ec_receipts;');before=self.scalar('SELECT sum(amount_cents) FROM cash_movements;')
        d=self.r.accepted('ALLOCATE_RECEIPT',{'receiptId':receipt,'allocations':[{'itemId':item['id'],'amountCents':'5000'}]},d)
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),before)
        self.reject('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Synthetic'},d,code='ITEM_ALREADY_PAID')
    def test_T17_partial_transfer_preserves_snapshots_and_stock(self):
        d=self.tab('3');item=self.detail(d)['items'][0]
        target=self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'Synthetic destination'})
        before=self.scalar("SELECT sum(quantity) FROM ec_reservations WHERE status='ACTIVE';")
        result=self.r.accepted('TRANSFER_ITEMS',{'items':[{'itemId':item['id'],'quantity':'1'}]},d,secondary=target)
        self.assertEqual(result['effects']['relatedDocumentId'],target['documentId'])
        self.assertEqual(self.scalar("SELECT sum(quantity) FROM ec_reservations WHERE status='ACTIVE';"),before)
        self.assertEqual(self.scalar('SELECT sum(total_cents) FROM ec_documents;'),'30000')
        self.assertEqual(self.scalar("SELECT count(*) FROM stock_movements WHERE client_operation_id<>'ec-synthetic-opening';"),'0');self.assertEqual(self.scalar('SELECT count(*) FROM cash_movements;'),'0')
    def test_T19_paid_open_document_accepts_only_new_balance(self):
        d=self.tab();d=self.r.accepted('RECEIVE',self.payment(),d)
        self.r.sql(f"UPDATE products SET sale_price_cents=1000 WHERE id='{IDS['product2']}';")
        d=self.r.accepted('ADD_ITEM',{'productId':IDS['product2'],'quantity':'1'},d)
        self.assertEqual(self.detail(d)['document']['received_net_cents'],'10000')
        self.r.accepted('RECEIVE_AND_COMPLETE',{'payment':self.payment('1000')},d)
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'11000');self.assertEqual(self.scalar('SELECT sum(total_cents) FROM sales;'),'11000')
        self.assertEqual(self.scalar("SELECT string_agg(balance_before_cents::text,',' ORDER BY received_at,id) FROM ec_receipts;"),'10000,1000')
    def test_T20_exact_concurrent_close_creates_one_sale(self):
        d=self.tab();d=self.r.accepted('RECEIVE',self.payment(),d)
        op=str(uuid.uuid4());barrier=threading.Barrier(2)
        def close(_):barrier.wait();return self.r.command('COMPLETE',{'cashSessionId':IDS['cash']},d,operation_id=op)[1]
        with ThreadPoolExecutor(2) as pool:responses=list(pool.map(close,range(2)))
        a,b=[x['data']['query']['response']['result'] for x in responses];self.assertEqual(a,b)
        self.assertEqual(self.scalar('SELECT count(*) FROM sales;'),'1');self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'10000')
    def test_T21_durable_result_and_exact_replay_after_discarded_ack(self):
        d=self.tab();command,response=self.r.command('RECEIVE',self.payment('5000'),d)
        original=response['data']['query']['response']['result']
        recovered=self.r.read(mode='RESULT',operationId=command['operationId'],expectedCommand=command)
        self.assertEqual(recovered,original)
        replay=self.r.operation('EcCommand',{'command':command},True)['data']['query']['response']['result'];self.assertEqual(replay,original)
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'5000')
    def test_T22_changed_payload_is_not_mistaken_for_old_success(self):
        d=self.tab();command,response=self.r.command('RECEIVE',self.payment('5000'),d)
        self.assertEqual(response['data']['query']['response']['result']['status'],'COMMITTED')
        command['payload']['amountCents']='6000'
        altered=self.r.operation('EcCommand',{'command':command},True);self.assertTrue(altered.get('errors'))
        result=self.r.read(mode='RESULT',operationId=command['operationId'],expectedCommand=command)
        self.assertEqual(result['status'],'REJECTED');self.assertEqual(result['error']['code'],'IDEMPOTENCY_CONFLICT')
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'5000')
    def test_T25_stale_version_cannot_overwrite(self):
        d=self.tab();fresh=self.r.accepted('MOVE_TABLE',{'identification':'New table'},d)
        self.reject('MOVE_TABLE',{'identification':'Stale table'},d,code='VERSION_CONFLICT')
        self.assertEqual(self.detail(fresh)['document']['identification'],'New table')
    def test_T26_revoked_session_is_denied_by_server(self):
        d=self.tab();self.r.sql("UPDATE user_device_sessions SET last_seen_at=now()-interval '16 minutes';")
        response=self.r.operation('EcRead',{'input':{'mode':'DETAIL','kind':'COMANDA','documentId':d['documentId']}});self.assertTrue(response.get('errors'))
        _,response=self.r.command('RECEIVE',self.payment(),d);self.assertTrue(response.get('errors'));self.assertEqual(self.scalar('SELECT count(*) FROM ec_receipts;'),'0')
    def test_T27_user_false_overrides_role_true(self):
        d=self.tab();self.r.sql(f"INSERT INTO user_page_permissions(user_id,page_id,tenant_id,can_access,can_create,can_update,can_delete,can_export,can_manage,created_at,updated_at) SELECT 'actor',id,'{IDS['tenant']}',true,false,false,false,false,false,now(),now() FROM app_pages WHERE page_key='COMANDAS';")
        self.reject('ADD_ITEM',{'productId':IDS['product'],'quantity':'1'},d,code='ACCESS_DENIED')
        self.reject('MOVE_TABLE',{'identification':'Denied'},d,code='ACCESS_DENIED')
        self.assertEqual(self.detail(d)['document']['status'],'OPEN')
    def test_T28_closed_cash_rejects_receipt_but_not_history(self):
        d=self.tab();self.r.sql('UPDATE cash_sessions SET status=\'CLOSED\',closed_at=now();')
        self.reject('RECEIVE',self.payment(),d,code='CASH_SESSION_CLOSED');self.assertEqual(self.detail(d)['document']['received_net_cents'],'0')
    def test_T31_dashboard_counts_completion_once_and_register_has_typed_origin(self):
        d=self.order(payment=self.payment('6000'));day=self.scalar("SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;")
        variables={'from':day,'to':day,'filters':{},'requestKey':str(uuid.uuid4())}
        response=self.r.operation('FinancialIndicatorsDashboard',variables);self.assertFalse(response.get('errors'),response)
        self.assertEqual(response['data']['_select'][0]['data']['cards']['revenueCents'],'0')
        d=self.r.accepted('MARK_READY',{},d,'ENCOMENDA');d=self.r.accepted('RECEIVE_AND_COMPLETE',{'payment':self.payment('14000')},d,'ENCOMENDA')
        response=self.r.operation('FinancialIndicatorsDashboard',{**variables,'requestKey':str(uuid.uuid4())});self.assertFalse(response.get('errors'),response)
        self.assertEqual(response['data']['_select'][0]['data']['cards']['revenueCents'],'20000')
        response=self.r.operation('ListSales',{'filters':{},'limit':25,'offset':0,'requestKey':str(uuid.uuid4())});self.assertFalse(response.get('errors'),response)
        sale=response['data']['_select'][0];self.assertEqual(sale['source'],'ORDER');self.assertEqual(sale['ecDocumentId'],d['documentId']);self.assertEqual(sale['ecDocumentKind'],'ENCOMENDA')
    def test_T16B_paid_equal_share_can_be_reconciled_without_mutating_share(self):
        d=self.tab();d=self.r.accepted('CREATE_SPLIT',{'mode':'EQUAL','parts':3},d);detail=self.detail(d)
        item=detail['items'][0];share=detail['plans'][0]['shares'][0]
        d=self.r.accepted('RECEIVE',{**self.payment('3333'),'allocations':[{'shareId':share['id'],'amountCents':'3333'}]},d)
        snapshot=self.scalar('SELECT jsonb_agg(to_jsonb(a) ORDER BY id)::text FROM ec_allocations a;');receipt=self.scalar('SELECT id FROM ec_receipts;')
        d=self.r.accepted('ALLOCATE_RECEIPT',{'receiptId':receipt,'allocations':[{'itemId':item['id'],'amountCents':'3333'}]},d)
        self.assertEqual(self.scalar('SELECT jsonb_agg(to_jsonb(a) ORDER BY id)::text FROM ec_allocations a;'),snapshot)
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'3333')
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM ec_allocation_parts;'),'3333')
    def test_T29_failure_between_reservation_and_receipt_rolls_back(self):
        self.r.sql("CREATE FUNCTION ec_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_FAILURE' USING ERRCODE='P0001';END $$;CREATE TRIGGER ec_test_failure BEFORE INSERT ON ec_receipts FOR EACH ROW EXECUTE FUNCTION ec_test_failure();")
        try:
            payload={'branchId':IDS['branch'],'customerId':IDS['customer'],'dueAtLocal':'2026-11-20T12:30','fulfillmentMode':'PICKUP','reservationStrategy':'NOW','items':[{'productId':IDS['product'],'quantity':'2'}],'payment':self.payment('6000')}
            self.reject('CREATE_ORDER',payload,kind='ENCOMENDA',code='SYNTHETIC_FAILURE')
            for table in ['ec_documents','ec_items','ec_reservations','ec_receipts','cash_movements','sales']:self.assertEqual(self.scalar('SELECT count(*) FROM '+table+';'),'0',table)
        finally:self.r.sql('DROP TRIGGER ec_test_failure ON ec_receipts;DROP FUNCTION ec_test_failure();')
    def test_T32_delivery_fee_and_change_do_not_create_inventory(self):
        d=self.order('1',extra={'fulfillmentMode':'DELIVERY','deliveryAddress':{'street':'Synthetic only'},'deliveryFeeCents':'1000'},payment={**self.payment('11000'),'tenderedCents':'12000'})
        self.assertEqual(self.scalar('SELECT amount_cents||\':\'||change_cents FROM ec_receipts;'),'11000:1000')
        d=self.r.accepted('MARK_READY',{},d,'ENCOMENDA');self.r.accepted('COMPLETE',{'cashSessionId':IDS['cash']},d,'ENCOMENDA')
        self.assertEqual(self.scalar('SELECT total_cents||\':\'||surcharge_cents FROM sales;'),'11000:1000');self.assertEqual(self.scalar('SELECT count(*) FROM sale_items;'),'1')
        self.assertEqual(self.scalar('SELECT sum(quantity) FROM stock_movements WHERE sale_id IS NOT NULL;'),'1.000')
        day=self.scalar("SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;")
        response=self.r.operation('FinancialIndicatorsDashboard',{'from':day,'to':day,'filters':{},'requestKey':str(uuid.uuid4())});self.assertFalse(response.get('errors'),response)
        data=response['data']['_select'][0]['data'];cards=data['cards'];product=data['products'][0]
        self.assertEqual(cards['revenueCents'],'11000');self.assertEqual(cards['deliveryFeeCents'],'1000')
        self.assertEqual(cards['profitCents'],str(10000-int(cards['costCents'])))
        self.assertEqual(product['revenueCents'],'10000');self.assertEqual(product['profitCents'],cards['profitCents'])
        self.assertEqual(data['daily'][0]['profitCents'],cards['profitCents'])
    def test_T33_large_money_overflow_and_fraction_validation(self):
        self.r.sql(f"UPDATE products SET sale_price_cents=9007199254740993,weighted_product=true WHERE id='{IDS['product']}';")
        d=self.order('1');self.assertEqual(self.detail(d,'ENCOMENDA')['document']['total_cents'],'9007199254740993')
        self.reject('RECEIVE',self.payment('9223372036854775808'),d,'ENCOMENDA','VALIDATION_ERROR')
        self.reject('ADD_ITEM',{'productId':IDS['product2'],'quantity':'1.001'},self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'Integers only'}),code='VALIDATION_ERROR')
    def test_T34_calendar_plus_n_and_pagination_are_complete(self):
        for _ in range(4):self.order('1')
        calendar=self.r.read('ENCOMENDA',mode='CALENDAR',calendarFrom='2026-11-01',calendarTo='2026-12-12')
        self.assertEqual(calendar['calendarDays'][0]['total'],4);self.assertEqual(len(calendar['calendarDays'][0]['events']),2)
        first=self.r.read('ENCOMENDA',day='2026-11-20',pageSize=2,offset=0);second=self.r.read('ENCOMENDA',day='2026-11-20',pageSize=2,offset=2)
        self.assertEqual(first['total'],4);self.assertEqual(len({r['id'] for r in first['rows']+second['rows']}),4)
    def test_T03_cancel_keeps_money_until_separate_refund_once(self):
        d=self.order(payment=self.payment('6000'));d=self.r.accepted('CANCEL',{'reason':'Synthetic cancellation'},d,'ENCOMENDA')
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'6000');self.assertEqual(self.scalar('SELECT count(*) FROM sales;'),'0')
        self.assertEqual(self.scalar("SELECT count(*) FROM ec_reservations WHERE status='ACTIVE';"),'0')
        self.assertEqual(self.detail(d,'ENCOMENDA')['refundPendingCents'],'6000')
        command,response=self.r.command('REFUND',{**self.payment('6000'),'reason':'Synthetic full refund','reference':'SYNTHETIC-RETURN'},d,'ENCOMENDA')
        result=response['data']['query']['response']['result'];self.assertEqual(result['status'],'COMMITTED',response)
        replay=self.r.operation('EcCommand',{'command':command},True);self.assertEqual(replay['data']['query']['response']['result'],result)
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'0');self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM ec_refunds;'),'6000')
        self.assertEqual(self.detail(result,'ENCOMENDA')['refundPendingCents'],'0')
        ledger=self.r.read('ENCOMENDA',mode='REFUNDS',documentId=d['documentId']);self.assertEqual(ledger['total'],1);self.assertEqual(ledger['rows'][0]['amount_cents'],'6000');self.assertEqual(ledger['rows'][0]['authorizer_name'],'Synthetic actor')
        self.reject('REFUND',{**self.payment('6000'),'reason':'Already refunded','reference':'NEW-INVALID'},result,'ENCOMENDA','AMOUNT_EXCEEDS_BALANCE')
    def test_T18_paid_merge_preserves_source_history_and_ledger(self):
        a=self.tab();a=self.r.accepted('RECEIVE',self.payment('3000'),a);b=self.tab(product='product2')
        receipt=self.scalar('SELECT original_document_id||\':\'||operator_uid||\':\'||cash_session_id||\':\'||received_at::text FROM ec_receipts;')
        result=self.r.accepted('MERGE',{},a,secondary=b);source=self.detail(result);target=self.r.read(mode='DETAIL',documentId=b['documentId'])
        self.assertEqual(source['document']['status'],'INCORPORATED');self.assertEqual(len(source['items']),1)
        self.assertEqual(target['document']['total_cents'],'12800');self.assertEqual(target['document']['received_net_cents'],'3000')
        self.assertEqual(self.scalar('SELECT original_document_id||\':\'||operator_uid||\':\'||cash_session_id||\':\'||received_at::text FROM ec_receipts;'),receipt)
        self.assertEqual(self.r.read(mode='RECEIPTS',documentId=a['documentId'])['total'],1)
        self.assertEqual(self.scalar('SELECT count(*) FROM sales;'),'0');self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'3000')
    def test_T17B_transfer_keeps_one_person_for_multiple_items(self):
        d=self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'Same person','participants':['Same synthetic name']});person=self.detail(d)['participants'][0]['id']
        for product in ['product','product2']:d=self.r.accepted('ADD_ITEM',{'productId':IDS[product],'quantity':'1','participantId':person},d)
        target=self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'Target'})
        items=[{'itemId':i['id'],'quantity':'1'} for i in self.detail(d)['items']]
        self.r.accepted('TRANSFER_ITEMS',{'items':items},d,secondary=target);detail=self.r.read(mode='DETAIL',documentId=target['documentId'])
        self.assertEqual(len(detail['participants']),1);self.assertNotEqual(detail['participants'][0]['id'],person)
        self.assertEqual(len({i['participant_id'] for i in detail['items']}),1)
    def test_T30_preparing_release_and_loss_have_distinct_stock_and_audit(self):
        d=self.tab('3');item=self.detail(d)['items'][0];d=self.r.accepted('PREPARE_ITEM',{'itemId':item['id'],'state':'PREPARING'},d)
        self.reject('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Missing disposition'},d,code='VALIDATION_ERROR')
        d=self.r.accepted('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Synthetic reusable','disposition':'RETURN_TO_AVAILABLE'},d)
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'100.000')
        d=self.r.accepted('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Synthetic loss','disposition':'LOSS'},d)
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'99.000')
        events=self.r.read(mode='EVENTS',documentId=d['documentId'])['rows'];event=next(e for e in reversed(events) if e['event_type']=='REMOVE_ITEM')
        self.assertEqual(event['details']['authorizerUid'],'actor');self.assertEqual(event['details']['actorUid'],'actor');self.assertEqual(event['details']['preparationState'],'PREPARING');self.assertEqual(event['details']['quantity'],'1');self.assertEqual(event['details']['disposition'],'LOSS')
        d=self.r.accepted('RECEIVE_AND_COMPLETE',{'payment':self.payment('10000')},d)
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'98.000')
    def test_T30B_paid_item_cannot_be_removed_even_by_manager(self):
        d=self.tab();item=self.detail(d)['items'][0];d=self.r.accepted('RECEIVE',{**self.payment(),'allocations':[{'itemId':item['id'],'amountCents':'10000'}]},d)
        self.reject('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Manager cannot bypass paid item','disposition':'LOSS'},d,code='ITEM_ALREADY_PAID')
    def test_T30C_cancel_prepared_tab_loses_only_prepared_units(self):
        d=self.tab();first=self.detail(d)['items'][0];d=self.r.accepted('PREPARE_ITEM',{'itemId':first['id'],'state':'PREPARED'},d)
        d=self.r.accepted('ADD_ITEM',{'productId':IDS['product2'],'quantity':'1'},d);self.r.accepted('CANCEL',{'reason':'Synthetic whole tab'},d)
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'99.000')
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product2']}';"),'100.000');self.assertEqual(self.scalar('SELECT count(*) FROM ec_dispositions;'),'1')
    def test_T35_refund_respects_cash_policy_and_distinct_payload_bound_approval(self):
        d=self.order(payment=self.payment('6000'));d=self.r.accepted('CANCEL',{'reason':'Synthetic cancellation'},d,'ENCOMENDA');self.user_permission('CAIXA',can_manage=False)
        payload={**self.payment('6000'),'reason':'Synthetic return','reference':'REFUND-ISOLATED'}
        self.reject('REFUND',payload,d,'ENCOMENDA','FINANCIAL_APPROVAL_REQUIRED')
        d=self.r.accepted('REQUEST_REFUND_APPROVAL',payload,d,'ENCOMENDA');approval=d['effects']['approvalId']
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'6000')
        self.assertEqual(self.detail(d,'ENCOMENDA')['refundApprovals'][0]['id'],approval)
        denied=self.r.operation('ApprovePosSale',{'approvalId':approval,'approved':True},True);self.assertTrue(denied.get('errors'),denied)
        self.manager();approved=self.r.operation('ApprovePosSale',{'approvalId':approval,'approved':True},True,actor='manager',token='b'*64);self.assertFalse(approved.get('errors'),approved)
        self.reject('REFUND',{**payload,'approvalId':approval,'reference':'CHANGED'},d,'ENCOMENDA','FINANCIAL_APPROVAL_REQUIRED')
        d=self.r.accepted('REFUND',{**payload,'approvalId':approval},d,'ENCOMENDA')
        self.assertEqual(d['effects']['authorizerUid'],'manager');self.assertEqual(self.scalar('SELECT status FROM pos_approvals;'),'USED');self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'0')
        self.assertEqual(self.r.read('ENCOMENDA',mode='REFUNDS',documentId=d['documentId'])['rows'][0]['authorizer_name'],'Synthetic approver')
    def test_T36_sensitive_permission_and_cash_access_cannot_substitute_each_other(self):
        d=self.tab();item=self.detail(d)['items'][0];d=self.r.accepted('PREPARE_ITEM',{'itemId':item['id'],'state':'PREPARING'},d)
        self.user_permission('COMANDAS',can_manage=False)
        self.reject('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'No module management','disposition':'LOSS'},d,code='APPROVAL_REQUIRED')
        self.assertEqual(self.detail(d)['actions']['MERGE']['reason'],'APPROVAL_REQUIRED')
        self.user_permission('CAIXA',can_access=False)
        self.reject('RECEIVE',self.payment(),d,code='ACCESS_DENIED');self.assertEqual(self.r.read(mode='LOOKUPS')['cashSessions'],[])
    def test_T37_cancel_linked_sale_restores_sold_stock_and_refunds_separately(self):
        d=self.tab('2');item=self.detail(d)['items'][0];d=self.r.accepted('PREPARE_ITEM',{'itemId':item['id'],'state':'PREPARED'},d)
        d=self.r.accepted('REMOVE_ITEM',{'itemId':item['id'],'quantity':'1','reason':'Synthetic loss','disposition':'LOSS'},d)
        d=self.r.accepted('RECEIVE_AND_COMPLETE',{'payment':self.payment()},d);self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'98.000')
        d=self.r.accepted('CANCEL_SALE',{'reason':'Synthetic sale correction'},d)
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}';"),'99.000');self.assertEqual(self.scalar('SELECT status FROM sales;'),'CANCELLED')
        self.assertEqual(self.scalar('SELECT sum(amount_cents) FROM cash_movements;'),'10000');self.assertEqual(self.detail(d)['refundPendingCents'],'10000')
    def test_T38_weighted_transfer_conserves_cents_and_physical_quantity(self):
        self.r.sql(f"UPDATE products SET weighted_product=true,sale_price_cents=1 WHERE id='{IDS['product']}';")
        d=self.tab('1.500');target=self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'Weighted destination'});item=self.detail(d)['items'][0]
        moved=self.r.accepted('TRANSFER_ITEMS',{'items':[{'itemId':item['id'],'quantity':'0.500'}]},d,secondary=target);target['version']=moved['effects']['relatedVersion']
        self.assertEqual(self.scalar("SELECT sum(line_total_cents) FROM ec_items WHERE status='ACTIVE';"),'2');self.assertEqual(self.scalar("SELECT sum(quantity) FROM ec_items WHERE status='ACTIVE';"),'1.500')
        self.assertEqual(self.scalar("SELECT sum(quantity) FROM ec_reservations WHERE status='ACTIVE';"),'1.500')
        self.r.sql(f"UPDATE products SET weighted_product=true WHERE id='{IDS['bundle']}';UPDATE product_components SET quantity=0.333 WHERE component_product_id='{IDS['product']}';")
        self.reject('ADD_ITEM',{'productId':IDS['bundle'],'quantity':'0.500'},target,code='VALIDATION_ERROR')
    def test_T26B_other_tenant_and_branch_are_denied_on_read_and_command(self):
        d=self.tab();other_tenant=str(uuid.uuid4());other_role=str(uuid.uuid4())
        self.r.sql(f"INSERT INTO tenants SELECT (jsonb_populate_record(NULL::tenants,to_jsonb(t)||jsonb_build_object('id','{other_tenant}'))).* FROM tenants t WHERE id='{IDS['tenant']}';INSERT INTO roles SELECT (jsonb_populate_record(NULL::roles,to_jsonb(r)||jsonb_build_object('id','{other_role}','tenant_id','{other_tenant}'))).* FROM roles r WHERE id='{IDS['role']}';INSERT INTO users SELECT (jsonb_populate_record(NULL::users,to_jsonb(u)||jsonb_build_object('id','outsider','tenant_id','{other_tenant}','role_id','{other_role}','email','outsider@example.invalid'))).* FROM users u WHERE id='actor';INSERT INTO user_device_sessions(user_id,tenant_id,session_token,device_id,claimed_at,last_seen_at) VALUES('outsider','{other_tenant}',encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),'synthetic',now(),now());INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_update,can_delete,can_manage,can_export,created_at,updated_at) SELECT '{other_role}',id,'{other_tenant}',true,true,true,true,true,true,now(),now() FROM app_pages;")
        response=self.r.operation('EcRead',{'input':{'kind':'COMANDA','mode':'DETAIL','documentId':d['documentId']}},actor='outsider');self.assertTrue(response.get('errors'),response)
        self.reject('RECEIVE',self.payment(),d,code='NOT_FOUND',actor='outsider');self.assertEqual(self.scalar('SELECT count(*) FROM ec_receipts;'),'0')
        self.r.sql(f"INSERT INTO user_branches(user_id,tenant_id,branch_id,active,created_at) VALUES('actor','{IDS['tenant']}','{IDS['branch2']}',true,now());")
        response=self.r.operation('EcRead',{'input':{'kind':'COMANDA','mode':'DETAIL','documentId':d['documentId']}});self.assertTrue(response.get('errors'),response)
        self.reject('RECEIVE',self.payment(),d,code='NOT_FOUND');self.assertEqual(self.r.read()['rows'],[])
    def test_T09C_channel_reservation_and_conversion_share_physical_guard(self):
        connection=str(uuid.uuid4());order=str(uuid.uuid4());self.r.sql(f"INSERT INTO sales_channel_connections(id,tenant_id,branch_id,provider,display_name,created_at,updated_at) VALUES('{connection}','{IDS['tenant']}','{IDS['branch']}','IFOOD','Synthetic disabled',now(),now());INSERT INTO sales_channel_orders(id,tenant_id,branch_id,connection_id,provider_order_id,display_code,received_at,status_updated_at,created_at,updated_at) VALUES('{order}','{IDS['tenant']}','{IDS['branch']}','{connection}','synthetic-no-provider','LOCAL',now(),now(),now(),now());")
        d=self.order('99')
        insert=f"INSERT INTO sales_channel_stock_reservations(order_id,product_id,tenant_id,branch_id,quantity,status,reserved_at,updated_at) VALUES('{order}','{IDS['product']}','{IDS['tenant']}','{IDS['branch']}',2,'RESERVED',now(),now());"
        with self.assertRaisesRegex(RuntimeError,'INSUFFICIENT_STOCK'):self.r.sql(insert)
        self.r.sql(insert.replace(",2,'RESERVED'",",1,'RESERVED'"));self.assertEqual(self.scalar(f"SELECT ec_reserved('{IDS['tenant']}','{IDS['branch']}','{IDS['product']}');"),'100.000')
        # Existing channel conversion debits physical and posts its own reserve
        # in one transaction. The deferred guard must accept the final state.
        self.r.sql(f"BEGIN;UPDATE stock_balances SET quantity=quantity-1 WHERE product_id='{IDS['product']}' AND branch_id='{IDS['branch']}';UPDATE sales_channel_stock_reservations SET status='POSTED' WHERE order_id='{order}';COMMIT;")
        self.assertEqual(self.scalar(f"SELECT quantity FROM stock_balances WHERE product_id='{IDS['product']}' AND branch_id='{IDS['branch']}';"),'99.000')
        self.assertEqual(self.detail(d,'ENCOMENDA')['document']['reservation_state'],'RESERVED')
    def test_T40_reapply_native_migrations_preserves_existing_money_stock_and_access(self):
        self.order(payment=self.payment('6000'));tab=self.tab(product='product2');self.r.accepted('RECEIVE_AND_COMPLETE',{'payment':self.payment('2800')},tab)
        tables=['tenants','users','roles','app_pages','role_page_permissions','ec_documents','ec_receipts','ec_reservations','ec_events','ec_operations','sales','sale_items','sale_payments','stock_balances','stock_movements','cash_movements','ec_sale_receipt_links']
        query="SELECT jsonb_build_object("+','.join("'"+table+"',(SELECT jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text) FROM "+table+" t)" for table in tables)+")::text;"
        before=self.scalar(query)
        for name in MIGRATIONS:self.r.sql((ROOT/'dataconnect/migrations'/name).read_text())
        self.assertEqual(self.scalar(query),before)
    def test_D02_existing_line_keeps_confirmed_unit_after_catalog_flag_changes(self):
        self.r.sql(f"UPDATE products SET weighted_product=true WHERE id='{IDS['product']}';")
        d=self.order('1.125');item=self.detail(d,'ENCOMENDA')['items'][0]
        self.r.sql(f"UPDATE products SET weighted_product=false WHERE id='{IDS['product']}';")
        d=self.r.accepted('EDIT_ORDER',{'notes':'Keep confirmed kilograms','items':[{'id':item['id'],'productId':IDS['product'],'quantity':'1.125'}]},d,'ENCOMENDA')
        self.assertEqual(self.detail(d,'ENCOMENDA')['items'][0]['unit'],'kg')
        self.reject('ADD_ITEM',{'productId':IDS['product'],'quantity':'1.125'},self.r.accepted('OPEN_COMMAND',{'branchId':IDS['branch'],'identification':'New item uses current unit'}),code='VALIDATION_ERROR')
    def test_T04_refund_reader_groups_two_origins_into_one_cash_outflow(self):
        d=self.order(payment=self.payment('6000'));d=self.r.accepted('RECEIVE',self.payment('4000'),d,'ENCOMENDA');d=self.r.accepted('CANCEL',{'reason':'Synthetic refund ledger'},d,'ENCOMENDA')
        d=self.r.accepted('REFUND',{**self.payment('10000'),'reason':'Two original receipts','reference':'GROUPED-RETURN'},d,'ENCOMENDA')
        ledger=self.r.read('ENCOMENDA',mode='REFUNDS',documentId=d['documentId'],pageSize=1)
        self.assertEqual(ledger['total'],1);self.assertEqual(ledger['rows'][0]['amount_cents'],'10000');self.assertEqual(ledger['rows'][0]['receipt_count'],2)
        self.assertEqual(self.scalar('SELECT count(*) FROM ec_refunds;'),'2');self.assertEqual(self.scalar("SELECT count(*) FROM cash_movements WHERE movement_type='EC_REFUND';"),'1')
    def test_T18B_original_document_retains_share_and_allocation_history_after_merge(self):
        a=self.tab(product='product2');item=self.detail(a)['items'][0]
        a=self.r.accepted('CREATE_SPLIT',{'mode':'SHARED_ITEM','parts':3,'itemId':item['id']},a);original=self.detail(a);share=original['plans'][0]['shares'][0]
        a=self.r.accepted('RECEIVE',{**self.payment('933'),'allocations':[{'itemId':item['id'],'shareId':share['id'],'amountCents':'933'}]},a);b=self.tab()
        self.r.accepted('MERGE',{},a,secondary=b);source=self.r.read(mode='DETAIL',documentId=a['documentId'])
        self.assertEqual(source['plans'][0]['id'],original['plans'][0]['id']);self.assertEqual(source['plans'][0]['shares'][0]['paid_cents'],'933');self.assertEqual(source['allocations'][0]['share_id'],share['id'])

class RecordedResult(unittest.TextTestResult):
    def startTest(self,test):
        super().startTest(test);self.started_id=test.id()
    def stopTest(self,test):
        OUT.mkdir(parents=True,exist_ok=True)
        # Payloads/logs are synthetic, kept in the existing private evidence boundary.
        (OUT/(test._testMethodName+'.json')).write_text(json.dumps({'case':test.id(),'synthetic':True,'backend':'local SQL Connect + PG18','calls':test.runtime.calls},indent=2)+'\n')
        super().stopTest(test)

if __name__=='__main__':
    sources=[ROOT/'dataconnect/schema/schema.gql',ROOT/'dataconnect/app/queries.gql',ROOT/'dataconnect/app/mutations.gql',*[ROOT/'dataconnect/migrations'/name for name in MIGRATIONS]]
    fingerprint=hashlib.sha256(b''.join(p.read_bytes() for p in sources)).hexdigest()
    with Runtime() as runtime:
        DomainTests.runtime=runtime
        result=unittest.TextTestRunner(verbosity=2,resultclass=RecordedResult).run(unittest.defaultTestLoader.loadTestsFromTestCase(DomainTests))
        record={'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'sourceFingerprint':fingerprint,'scope':'Real local engine, synthetic database only; not DEV authenticated acceptance','tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'passed':result.wasSuccessful(),'D02_D05_D07':'Approved by user 2026-11-18; tested policy, no publication inferred'}
        (OUT/'results.json').write_text(json.dumps(record,indent=2)+'\n')
        raise SystemExit(0 if result.wasSuccessful() else 1)

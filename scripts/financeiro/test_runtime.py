"""Contract, transaction and scope proofs. Synthetic, isolated PG18 only."""
import json
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import unittest
import uuid
from runtime import Runtime, IDS


class FinanceRuntimeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r = Runtime().__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.r.close()

    def setUp(self):
        self.r.reset()

    def command(self, action, payload, expected='COMMITTED'):
        command = {'operationId': str(uuid.uuid4()), 'action': action, 'payload': payload}
        prepared = self.r.prepare(command)
        result = self.r.execute(prepared)
        if expected == 'COMMITTED' and result['status'] == 'REJECTED':
            # Reproduce only in the disposable database to expose PG's constraint context.
            payload_sql = json.dumps(payload).replace("'", "''")
            self.r.sql("BEGIN;SELECT fin_apply(ec_actor('actor',repeat('a',64)),'%s','%s','%s'::jsonb);SET CONSTRAINTS ALL IMMEDIATE;ROLLBACK;" % (command['operationId'], action, payload_sql))
        self.assertEqual(result['status'], expected, result)
        return command, prepared, result

    def title(self, direction='RECEIVE', amount='10000', **extra):
        return self.command('C01', {
            'direction': direction, 'branchId': IDS['branch'], 'description': 'Synthetic title',
            'amountCents': amount, 'issueDate': '2026-11-25', 'competenceDate': '2026-11-25',
            'dueDate': '2026-11-30', **extra,
        })[2]

    def account(self, name='Synthetic bank', opening='120000', global_balance=True):
        return self.command('C12', {
            'branchId': IDS['branch'], 'name': name, 'accountType': 'BANK', 'currency': 'BRL',
            'openingBalanceCents': opening, 'cutoffDate': '2026-11-01', 'shared': False,
            'grants': [{'userId': 'actor', 'branchId': IDS['branch'], 'canPost': True,
                        'canReconcile': True, 'canGlobalBalance': global_balance}],
        })[2]['accountId']

    def settle(self, title, account, principal='10000', discount='0', interest='0', fee='0', direction='RECEIVE', expected='COMMITTED'):
        return self.command('C08' if direction == 'RECEIVE' else 'C07', {
            'direction': direction, 'accountId': account, 'methodId': IDS['method'],
            'effectiveDate': '2026-11-25', 'reason': 'Synthetic authorized review',
            'feeMode': 'RETAINED' if direction == 'RECEIVE' else 'ADDED',
            'lines': [{'titleId': title['titleId'], 'expectedVersion': title['version'],
                       'principalCents': principal, 'discountCents': discount, 'interestCents': interest,
                       'penaltyCents': '0', 'feeCents': fee}],
        }, expected)

    def test_real_sdk_operation_and_exact_int64(self):
        title = self.title(amount='9007199254740991')['titles'][0]
        row = self.r.read_fin(mode='TITLES', direction='RECEIVE')['rows'][0]
        self.assertEqual(row['original_cents'], '9007199254740991')
        self.assertEqual(row['id'], title['titleId'])
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journals;'), '0')

    def test_installments_and_matrix_margins(self):
        category_ids = [str(uuid.uuid4()) for _ in range(3)]
        for i, category in enumerate(category_ids):
            self.r.sql(f"INSERT INTO financial_categories(id,tenant_id,name,direction,created_at,updated_at) VALUES('{category}','{IDS['tenant']}','Synthetic {i}','IN',now(),now());")
        result = self.title(amount='3', installmentCount=3,
                            classifications=[{'categoryId': c, 'amountCents': '1'} for c in category_ids])
        self.assertEqual([t['originalCents'] for t in result['titles']], ['1'] * 3)
        self.assertEqual(self.r.sql('SELECT string_agg(n::text,\',\' ORDER BY n) FROM (SELECT sum(amount_cents) n FROM fin_title_capacities GROUP BY classification_id)x;'), '1,1,1')
        self.assertEqual(self.r.sql('SELECT min(amount_cents) FROM fin_title_capacities;'), '0')

    def test_settlement_receipt_replay_and_reverse_dated(self):
        account = self.account()
        title = self.title()['titles'][0]
        command, prepared, result = self.settle(title, account, discount='1000', interest='200', fee='300')
        self.assertEqual(result['cashCents'], '8900')
        self.assertEqual(self.r.execute(prepared), result)
        self.assertEqual(self.r.prepare(command)['result'], result)
        detail = self.r.read_fin(mode='DETAIL', direction='RECEIVE', titleId=title['titleId'])
        self.assertEqual(detail['title']['residual_cents'], '0')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_settlements;'), '1')
        balance = self.r.read_fin(mode='ACCOUNTS', position='2026-11-25')['accounts'][0]
        self.assertEqual(balance['balance_cents'], '128900')
        self.command('C09', {'direction': 'RECEIVE', 'settlementId': result['settlementId'],
                            'effectiveDate': '2026-11-26', 'reason': 'Synthetic correction'})
        self.assertEqual(self.r.read_fin(mode='ACCOUNTS', position='2026-11-25')['accounts'][0]['balance_cents'], '128900')
        self.assertEqual(self.r.read_fin(mode='ACCOUNTS', position='2026-11-26')['accounts'][0]['balance_cents'], '120000')
        self.assertEqual(self.r.read_fin(mode='DETAIL', direction='RECEIVE', titleId=title['titleId'])['title']['residual_cents'], '10000')

    def test_failed_batch_rolls_back_every_effect(self):
        account = self.account()
        title = self.title()['titles'][0]
        _, _, result = self.settle(title, account, principal='10001', expected='REJECTED')
        self.assertEqual(result['error']['code'], 'PRINCIPAL_RANGE')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_settlements;'), '0')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journals;'), '0')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_principal_events;'), '0')

    def test_transfer_fee_and_partial_balance_scope(self):
        source = self.account()
        destination = self.account(name='Synthetic partial', opening='0', global_balance=False)
        self.command('C11', {'branchId': IDS['branch'], 'fromAccountId': source,
                            'toAccountId': destination, 'amountCents': '20000', 'feeCents': '300',
                            'effectiveDate': '2026-11-25'})
        accounts = {a['id']: a for a in self.r.read_fin(mode='ACCOUNTS', position='2026-11-25')['accounts']}
        self.assertEqual(accounts[source]['balance_cents'], '99700')
        self.assertEqual(accounts[destination]['balance_cents'], '20000')
        self.assertEqual(accounts[destination]['balance_scope'], 'PARTIAL_CONTRIBUTION')
        self.assertEqual(self.r.sql('SELECT sum(debit_cents::numeric-credit_cents) FROM fin_journal_lines;'), '0')

    def test_two_concurrent_settlements_cannot_consume_same_principal(self):
        account = self.account()
        title = self.title()['titles'][0]
        payload = {
            'direction': 'RECEIVE', 'accountId': account, 'methodId': IDS['method'],
            'effectiveDate': '2026-11-25', 'feeMode': 'RETAINED',
            'lines': [{'titleId': title['titleId'], 'expectedVersion': title['version'],
                       'principalCents': '7000', 'discountCents': '0', 'interestCents': '0',
                       'penaltyCents': '0', 'feeCents': '0'}],
        }
        operations = [self.r.prepare({'operationId': str(uuid.uuid4()), 'action': 'C08', 'payload': payload}) for _ in range(2)]
        barrier = Barrier(2, timeout=5)

        def concurrent(operation):
            barrier.wait()
            return self.r.execute(operation)

        with ThreadPoolExecutor(2) as executor:
            results = list(executor.map(concurrent, operations))
        self.assertCountEqual([r['status'] for r in results], ['COMMITTED', 'REJECTED'])
        self.assertEqual(self.r.sql("SELECT residual_cents FROM fin_title_state;"), '3000')
        self.assertEqual(self.r.sql("SELECT count(*) FROM fin_settlements;"), '1')

    def test_import_deduplicates_bank_identity_and_matching_does_not_move_cash(self):
        account = self.account()
        title = self.title()['titles'][0]
        self.settle(title, account)
        payload = {'format': 'CSV', 'accountId': account, 'branchId': IDS['branch'], 'fileHash': '1'*64,
                   'rows': [{'date': '2026-11-25', 'amountCents': '10000', 'description': 'Synthetic payment', 'externalId': 'tx1'}]}
        self.assertEqual(self.command('C17', payload)[2]['importedCount'], 1)
        self.assertTrue(self.command('C17', payload)[2]['alreadyImported'])
        observed = self.r.read_fin(mode='RECONCILIATION', accountId=account, candidates=True)
        self.assertEqual(len(observed['rows']), 1)
        self.assertEqual(len(observed['candidates']), 1)
        bank = observed['rows'][0]
        ledger = observed['candidates'][0]
        match = self.command('C18', {'accountId': account, 'branchId': IDS['branch'],
                    'edges': [{'bankId': bank['id'], 'lineId': ledger['id'], 'amountCents': '10000'}]})[2]
        self.assertEqual(self.r.read_fin(mode='RECONCILIATION', accountId=account)['rows'][0]['matched_cents'], '10000')
        self.assertEqual(self.r.read_fin(mode='MATCHES', accountId=account)['rows'][0]['id'], match['matchId'])
        self.command('C21', {'matchId': match['matchId'], 'branchId': IDS['branch'], 'reason': 'Synthetic correction'})
        self.assertEqual(self.r.read_fin(mode='RECONCILIATION', accountId=account)['rows'][0]['matched_cents'], '0')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journals;'), '1')

    def test_credit_limit_and_overdue_approval_are_independent(self):
        customer = IDS['customer']
        self.command('C30', {'direction': 'RECEIVE', 'customerId': customer, 'limitCents': '10000',
                            'expectedVersion': '0', 'reason': 'Synthetic limit configured'})
        past = self.r.sql("SELECT ((now() AT TIME ZONE 'America/Sao_Paulo')::date-1)::text;")
        payload = {'direction': 'RECEIVE', 'customerId': customer, 'title': {
            'branchId': IDS['branch'], 'description': 'Synthetic credit', 'amountCents': '4000',
            'issueDate': past, 'competenceDate': past, 'dueDate': past,
        }}
        self.command('C31', payload)
        denied = self.command('C31', payload, 'REJECTED')[2]
        self.assertEqual(denied['error']['code'], 'OVERDUE_AUTHORIZATION_REQUIRED')
        approved = self.command('C31', {**payload, 'overdueReason': 'Synthetic manager review'})[2]
        self.assertIn('authorizationId', approved)
        denied = self.command('C31', {**payload, 'overdueReason': 'Synthetic manager review'}, 'REJECTED')[2]
        self.assertEqual(denied['error']['code'], 'CREDIT_LIMIT_EXCEEDED')

    def test_recurrence_anchor_and_confirmation_preserve_title_identity(self):
        self.command('C22', {
            'branchId': IDS['branch'], 'anchorDate': '2027-01-31', 'frequency': 'MONTHLY',
            'estimated': True,
            'template': {'description': 'Synthetic estimate', 'direction': 'PAY', 'amountCents': '10000'},
        })
        schedule = self.r.read_fin(mode='SETTINGS')['recurrences'][0]
        occurrence = self.command('C23', {'recurrenceId': schedule['id'], 'occurrence': 0})[2]
        self.assertTrue(self.command('C23', {'recurrenceId': schedule['id'], 'occurrence': 0})[2]['alreadyMaterialized'])
        self.command('C25', {'documentId': occurrence['documentId'], 'expectedVersion': '1',
                            'amountCents': '15000', 'classifications': [], 'reason': 'Verified amount'})
        title_id = occurrence['titles'][0]['titleId']
        self.assertEqual(self.r.read_fin(mode='DETAIL', direction='PAY', titleId=title_id)['title']['original_cents'], '15000')
        self.command('C23', {'recurrenceId': schedule['id'], 'occurrence': 1})
        self.assertEqual(self.r.sql('SELECT max(nominal_date) FROM fin_occurrences;'), '2027-02-28')

    def test_cash_count_excludes_opening_movement_and_does_not_make_journal(self):
        self.r.sql(f"INSERT INTO cash_movements(tenant_id,session_id,movement_type,amount_cents,description,created_by_uid,created_at) VALUES('{IDS['tenant']}','{IDS['cash']}','OPENING',10000,'Synthetic opening','actor',now());")
        row = self.r.read_fin(mode='CASH')['rows'][0]
        result = self.command('C33', {'sessionId': IDS['cash'], 'expectedCents': row['calculated_expected_cents'],
                                    'countedCents': row['calculated_expected_cents'], 'reason': 'Synthetic count'})[2]
        self.assertEqual(result['differenceCents'], '0')
        self.assertEqual(row['calculated_expected_cents'], row['opening_amount_cents'])
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journals;'), '0')

    def test_real_drawer_movement_has_one_financial_effect_after_verified_cut(self):
        today = self.r.sql("SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;")
        account = self.command('C12', {
            'branchId': IDS['branch'], 'name': 'Synthetic cash account', 'accountType': 'CASH', 'currency': 'BRL',
            'openingBalanceCents': '10000', 'cutoffDate': '2026-01-01',
            'grants': [{'userId': 'actor', 'branchId': IDS['branch'], 'canPost': True, 'canGlobalBalance': True}],
        })[2]['accountId']
        self.command('C39', {'kind': 'SOURCE_ACCOUNT', 'branchId': IDS['branch'], 'accountId': account,
                            'origin': 'DRAWER', 'startsOn': today})
        self.r.sql(f"INSERT INTO cash_movements(tenant_id,session_id,movement_type,amount_cents,description,created_by_uid,created_at) VALUES('{IDS['tenant']}','{IDS['cash']}','WITHDRAWAL',-500,'Synthetic withdrawal','actor',now());")
        output = self.r.read_fin(mode='ACCOUNTS', position=today)['accounts'][0]
        self.assertEqual(output['balance_cents'], '9500')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journal_lines WHERE source_cash_id IS NOT NULL;'), '1')

    def test_cross_tenant_title_and_receipt_not_disclosed(self):
        result = self.title()
        title = result['titles'][0]['titleId']
        other_tenant = str(uuid.uuid4())
        other_role = str(uuid.uuid4())
        self.r.sql(f"""
          INSERT INTO tenants(id,legal_name,timezone,currency_code,created_at,updated_at)
          VALUES('{other_tenant}','Synthetic isolated tenant','America/Sao_Paulo','BRL',now(),now());
          INSERT INTO roles(id,tenant_id,name,system_role,hierarchy_level,created_at,updated_at)
          VALUES('{other_role}','{other_tenant}','Synthetic manager',false,100,now(),now());
          INSERT INTO users(id,tenant_id,role_id,name,email,created_at,updated_at)
          VALUES('other-actor','{other_tenant}','{other_role}','Synthetic other actor','other@example.invalid',now(),now());
          INSERT INTO user_device_sessions(user_id,tenant_id,session_token,device_id,claimed_at,last_seen_at)
          VALUES('other-actor','{other_tenant}',encode(sha256(convert_to(repeat('b',64),'UTF8')),'hex'),'synthetic',now(),now());
          INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_manage,can_export,created_at,updated_at)
          SELECT '{other_role}',id,'{other_tenant}',true,true,true,now(),now() FROM app_pages WHERE page_key='CONTAS_RECEBER';
        """)

        def read(input):
            return self.r.operation('FinancialRead', {'input': input}, actor='other-actor', token='b'*64)

        denied = read({'mode':'DETAIL','direction':'RECEIVE','titleId':title})
        self.assertTrue(denied.get('errors'), denied)
        exported = self.r.result(read({'mode':'TITLES','direction':'RECEIVE','export':True}))
        self.assertEqual(exported['rows'], [])
        receipt = self.r.result(read({'mode':'RESULT','operationId':result['operationId']}))
        self.assertEqual(receipt['status'], 'UNKNOWN')

    def test_closed_cutoff_and_inaccessible_account_cannot_receive(self):
        account = self.account()
        title = self.title()['titles'][0]
        self.r.sql(f"UPDATE fin_account_cuts SET cutoff_date='2026-11-25' WHERE account_id='{account}';")
        rejected = self.settle(title, account, expected='REJECTED')[2]
        self.assertEqual(rejected['error']['code'], 'BEFORE_ACCOUNT_CUT')
        self.r.sql(f"UPDATE fin_account_grants SET can_post=false WHERE account_id='{account}';")
        rejected = self.settle(title, account, expected='REJECTED')[2]
        self.assertEqual(rejected['error']['code'], 'ACCOUNT_DENIED')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journals;'), '0')

    def test_unbalanced_journal_rolls_back(self):
        tenant, branch = IDS['tenant'], IDS['branch']
        journal = str(uuid.uuid4())
        with self.assertRaisesRegex(RuntimeError, 'UNBALANCED_JOURNAL'):
            self.r.sql(f"""
                BEGIN;
                INSERT INTO fin_journals(id,tenant_id,source_key,effective_date,description)
                VALUES('{journal}','{tenant}','synthetic-unbalanced','2026-11-25','Synthetic failure');
                INSERT INTO fin_journal_lines(tenant_id,journal_id,branch_id,control_key,debit_cents,credit_cents)
                VALUES('{tenant}','{journal}','{branch}','A',100,0),('{tenant}','{journal}','{branch}','B',0,99);
                COMMIT;
            """)
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journals;'), '0')

    def test_abandonment_blocks_late_prepare_after_lost_ack(self):
        operation_id = str(uuid.uuid4())
        canceled = self.r.execute({'operationId':operation_id,'payloadHash':''}, cancel=True)
        self.assertEqual(canceled['status'], 'CANCELLED')
        result = self.r.prepare({'operationId':operation_id,'action':'C01','payload':{'direction':'RECEIVE'}})
        self.assertEqual(result['status'], 'CANCELLED')
        self.assertEqual(self.r.read_fin(mode='RESULT',operationId=operation_id)['status'], 'CANCELLED')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_titles;'), '0')

    def test_dre_maps_are_versioned_and_missing_classification_stays_visible(self):
        self.title()
        category = self.command('C14', {'name':'Synthetic revenue','direction':'IN','code':'SYN','nature':'REVENUE'})[2]['id']
        mapping = self.command('C16', {'effectiveFrom':'2026-11-01',
                            'lines':[{'categoryId':category,'dreLine':'GROSS_REVENUE'}]})[2]
        dre = self.r.read_fin(mode='DRE', **{'from':'2026-11-01','to':'2026-11-30'})
        self.assertEqual(dre['mapId'], mapping['mapId'])
        self.assertEqual(dre['quality'], 'INCOMPLETE')
        self.assertEqual(dre['gaps'][0]['amount_cents'], '10000')

    def test_verified_legacy_adoption_retains_original_id_and_no_money(self):
        tenant, branch = IDS['tenant'], IDS['branch']
        legacy = str(uuid.uuid4())
        self.r.sql(f"""
          INSERT INTO accounts_payable(id,tenant_id,branch_id,description,amount_cents,due_date,status,active,created_by_uid,created_at,updated_at)
          VALUES('{legacy}','{tenant}','{branch}','Synthetic legacy',50000,'2026-11-30','OPEN',true,'actor',now(),now());
        """)
        inventory = self.r.read_fin(mode='LEGACY',direction='PAY')['rows']
        self.assertEqual(inventory[0]['id'], legacy)
        adopted = self.command('C40', {'direction':'PAY','legacyId':legacy,'originalCents':'50000','dueDate':'2026-11-30',
                                       'competenceDate':'2026-11-25','issueDate':'2026-11-25','reason':'Synthetic source reviewed'})[2]
        self.assertEqual(adopted['legacyId'], legacy)
        self.assertEqual(self.r.sql('SELECT count(*) FROM accounts_payable;'), '1')
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_journals;'), '0')
        self.assertEqual(self.r.read_fin(mode='LEGACY',direction='PAY')['rows'], [])

    def test_close_reopen_and_future_obligation(self):
        self.title(dueDate='2026-12-31')
        self.command('C34', {'branchId': IDS['branch'], 'period': '2026-11-01', 'reason': 'Synthetic closing'})
        self.command('C01', {'direction': 'PAY', 'branchId': IDS['branch'], 'description': 'Forbidden retroactive',
                            'amountCents': '100', 'issueDate': '2026-11-25', 'competenceDate': '2026-11-25',
                            'dueDate': '2026-12-31'}, 'REJECTED')
        self.command('C35', {'branchId': IDS['branch'], 'period': '2026-11-01', 'reason': 'Synthetic reopening'})
        self.assertEqual(self.r.sql('SELECT count(*) FROM fin_closures;'), '2')

    def test_revoked_permission_blocks_prepared_operation(self):
        command = {'operationId': str(uuid.uuid4()), 'action': 'C01', 'payload': {
            'direction': 'RECEIVE', 'branchId': IDS['branch'], 'description': 'Synthetic',
            'amountCents': '100', 'issueDate': '2026-11-25', 'competenceDate': '2026-11-25', 'dueDate': '2026-11-30'}}
        saved = self.r.prepare(command)
        self.r.sql("UPDATE role_page_permissions SET can_manage=false;")
        response = self.r.operation('FinancialExecute', {'operationId': saved['operationId'],
                                    'payloadHash': saved['payloadHash'], 'cancel': False}, True)
        self.assertTrue(response.get('errors'), response)
        self.assertEqual(self.r.sql('SELECT count(*) FROM accounts_receivable;'), '0')

    def test_session_and_snapshot_revalidation(self):
        self.title()
        before = self.r.read_fin(mode='TITLES', direction='RECEIVE')
        self.title()
        response = self.r.operation('FinancialRead', {'input': {'mode': 'TITLES', 'direction': 'RECEIVE', 'revision': before['revision']}})
        self.assertTrue(response.get('errors'), response)
        response = self.r.operation('FinancialRead', {'input': {'mode': 'TITLES', 'direction': 'RECEIVE'}}, token='b' * 64)
        self.assertTrue(response.get('errors'), response)


if __name__ == '__main__':
    unittest.main(verbosity=2)

"""Session contract through the pinned local Data Connect compiler, never DEV."""
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
import traceback
import urllib.request as U
import uuid

os.umask(0o077)
REPO = Path(__file__).resolve().parents[2]
IMAGE = 'postgres@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6'
VERSION = '3.4.23'
BINARY_SHA = '337ec8a195d6198e83bdeb070b12a64cecbf7aa1ba2c190b6611f78cd128a21a'
DOWNLOAD = f'https://storage.googleapis.com/firemat-preview-drop/emulator/dataconnect-emulator-linux-amd64-v{VERSION}'
CORE_OPERATIONS = (
    'CreateCategory',
    'UpdateCategory',
    'ArchiveCategory',
    'CreateSubcategory',
    'UpdateSubcategory',
    'ArchiveSubcategory',
    'RestoreCategory',
    'RestoreSubcategory',
    'CreateCategoriesBatch',
    'CreateSubcategoriesBatch',
    'SaveBranch',
    'SetBranchStatus',
    'SaveSupplier',
    'SetSupplierStatus',
    'SaveCustomer',
    'SetCustomerStatus',
    'SaveProduct',
    'SetProductStatus',
    'SaveProductComponents',
    'SavePromotion',
    'SetPromotionStatus',
    'SetCategoriesStatusBatch',
    'SetSubcategoriesStatusBatch',
    'SetBranchesStatusBatch',
    'SetSuppliersStatusBatch',
    'SetCustomersStatusBatch',
    'SetProductsStatusBatch',
    'EnsureSalesDefaults',
    'PostSale',
    'CancelSale',
    'PostStockAdjustment',
    'PostStockTransfer',
    'SaveStockBatch',
    'ReverseStockOperation',
    'OpenCashSession',
    'RegisterCashMovement',
    'CloseCashSession',
    'UpdatePosPolicy',
    'RequestPosSaleApproval',
    'ApprovePosSale',
    'RequestPosCashApproval',
)
OUT = REPO / 'artifacts/browser-private/session-runtime'
OUT.mkdir(parents=True, exist_ok=True)
record = {'sha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
          'dirty': bool(subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=no'], cwd=REPO)),
          'scope': 'Local emulator, network-none disposable PG18, synthetic identities; not a real authenticated smoke',
          'emulatorVersion': VERSION, 'emulatorSHA256': BINARY_SHA, 'image': IMAGE, 'cases': []}
checks = record['cases']
container = 'insightpad-session-' + uuid.uuid4().hex[:10]
created = False
process = None
opener = U.build_opener(U.ProxyHandler({}))


def command(args, **kwargs):
    result = subprocess.run(args, capture_output=True, text=True, timeout=30, **kwargs)
    if result.returncode:
        (OUT / 'command-error-private.txt').write_text(result.stderr)
        raise RuntimeError('Local command failed; see private diagnostic')
    return result.stdout.strip()


def sql(statement):
    return command(['docker', 'exec', '-i', container, 'psql', '-XAtq', '-h', '127.0.0.1',
                    '-U', 'postgres', '-d', 'fdcdb', '-v', 'ON_ERROR_STOP=1'], input=statement)


def definition(source, name):
    match = re.search(r'^(?:type|mutation|query) ' + name + r'\b[\s\S]*?^}', source, re.M)
    assert match, 'Original definition missing: ' + name
    return match.group()


def post(path, body, authenticated=False):
    headers = {'Content-Type': 'application/json'}
    if authenticated:
        headers['X-Firebase-Auth-Token'] = synthetic_token
    request = U.Request(base + path, data=json.dumps(body).encode(), headers=headers)
    with opener.open(request, timeout=15) as response:
        return json.load(response)


def operation(name, variables, mutation=True):
    result = post(connector + (':executeMutation' if mutation else ':executeQuery'),
                  {'operationName': name, 'variables': variables}, authenticated=True)
    with (OUT / 'responses-private.jsonl').open('a') as stream:
        stream.write(json.dumps({'operation': name, 'result': result}) + '\n')
    return result


def renew(token):
    result = operation('TouchDeviceSession', {'sessionToken': token})
    assert not result.get('errors') and result.get('data', {}).get('_execute') == 1, 'Valid renewal failed'


def denied(token):
    before = sql('SELECT last_seen_at::text FROM user_device_sessions;')
    result = operation('TouchDeviceSession', {'sessionToken': token})
    assert result.get('errors') and result.get('data', {}).get('_execute') is None, 'Invalid renewal accepted'
    assert any('SESSION_REQUIRED' in e.get('message', '') for e in result['errors']), 'Expected session rejection'
    assert sql('SELECT last_seen_at::text FROM user_device_sessions;') == before, 'Rejected renewal changed state'


def claim():
    result = operation('ClaimDeviceSession', {'deviceId': 'synthetic-device-' + uuid.uuid4().hex,
                                             'deviceName': 'Synthetic browser'})
    assert not result.get('errors'), 'Claim failed'
    token = result['data']['query']['issued']['token']
    assert re.fullmatch('[a-f0-9]{64}', token), 'Unexpected issued credential'
    return token


def successful(name, variables, token):
    response = operation(name, {**variables, 'sessionToken': token})
    assert response.get('data') is not None and not response.get('errors'), name + ' failed'
    return response


def core_contracts(token, tenant, role):
    """Compiler regression and independent ledger checks, not individual68 acceptance."""
    branch = '00000000-0000-4000-8000-000000000004'
    second = '00000000-0000-4000-8000-000000000005'
    product = '00000000-0000-4000-8000-000000000012'
    cash = '00000000-0000-4000-8000-000000000060'
    sql(f"INSERT INTO branches(id,tenant_id,name,created_at,updated_at) VALUES('{branch}','{tenant}','Synthetic first',now(),now()),('{second}','{tenant}','Synthetic second',now(),now());"
        "INSERT INTO app_pages(id,page_key,display_name,module,route,created_at,updated_at) SELECT gen_random_uuid(),key,key,'Synthetic','/'||key,now(),now() FROM unnest(ARRAY['CAD_CATEGORIA','CAD_SUBCATEGORIA','CAD_FILIAL','CAD_FORNECEDOR','CAD_CLIENTE','CAD_PRODUTO','CAIXA','GESTAO_VENDAS','ESTOQUE']) key;"
        f"INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_update,can_delete,can_manage,can_export,created_at,updated_at) SELECT '{role}',id,'{tenant}',true,true,true,true,true,true,now(),now() FROM app_pages;")
    source = (REPO / 'dataconnect/app/mutations.gql').read_text()
    compilation = []
    for name in CORE_OPERATIONS:
        signature = definition(source, name).split('\n', 1)[0]
        variables = {}
        for variable, kind in re.findall(r'\$(\w+):\s*(\[[^\]]+\]!?|\w+!?)', signature):
            basic = kind.rstrip('!')
            if basic.startswith('['):
                value = []
            elif basic == 'UUID':
                value = branch if variable in ['branchId', 'sourceBranchId', 'destinationBranchId'] else '00000000-0000-4000-8000-000000000099'
            elif basic in ['Int', 'Int64', 'Float']:
                value = 0
            elif basic == 'Boolean':
                value = False
            elif basic in ['Date', 'Timestamp']:
                value = '2026-10-29' if basic == 'Date' else '2026-10-29T12:00:00Z'
            elif basic == 'Any':
                value = ({'branchId': branch, 'clientOperationId': 'synthetic-noeffect-' + name,
                          'items': [], 'payments': []} if variable == 'payload' else [])
            else:
                value = 'X' if variable == 'name' else ''
            variables[variable] = value
        response = operation(name, {**variables, 'sessionToken': token})
        errors = response.get('errors', [])
        assert response.get('data') is not None, name + ' did not reach execution'
        assert not any(e.get('extensions', {}).get('code') == 'INVALID_ARGUMENT' for e in errors), name + ' probe has invalid GraphQL arguments'
        states = [state for error in errors for state in re.findall(
            r'err_code: ([0-9A-Z]+)', error.get('extensions', {}).get('debugDetails', ''))]
        assert not any(state in ['42601', '0A000'] for state in states), name + ' SQL composition failed'
        compilation.append({'operation': name, 'sqlstates': states,
                            'scope': 'Reached stages compile; invalid/empty business input is not functional acceptance'})
    record['coreCompilation'] = compilation
    checks.append('41 core compiler probes; reached stages have no SQL composition failure, not business acceptance')
    successful('CreateCategory', {'name': 'SYNTHETIC CATEGORY'}, token)
    successful('CreateCategory', {'name': '  synthetic   category  '}, token)
    assert sql("SELECT count(*) FROM categories WHERE name='SYNTHETIC CATEGORY';") == '1'
    category = sql("SELECT id::text FROM categories WHERE name='SYNTHETIC CATEGORY';")
    successful('UpdateCategory', {'id': category, 'name': 'SYNTHETIC RENAMED'}, token)
    assert sql("SELECT name FROM categories WHERE id='" + category + "';") == 'SYNTHETIC RENAMED'
    checks.append('Category create/canonical duplicate/update through real local compiler')
    sql(f"INSERT INTO products(id,tenant_id,category_id,name,sale_price_cents,cost_price_cents,created_at,updated_at) VALUES('{product}','{tenant}','{category}','Synthetic item',1200,800,now(),now());"
        f"INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity,average_cost_cents,version,updated_at) VALUES('{tenant}','{branch}','{product}',10,800,1,now());"
        f"INSERT INTO payment_methods(id,tenant_id,code,name,requires_change,created_at,updated_at) VALUES('{cash}','{tenant}','CASH','Synthetic cash',true,now(),now());")
    # Discard only synthetic cash opened by compilation probes, through its existing close contract.
    for session in sql("SELECT id::text FROM cash_sessions WHERE status='OPEN';").splitlines():
        successful('CloseCashSession', {'sessionId': session, 'countedAmountCents': 0,
                                       'notes': 'Synthetic probe closure', 'operationId': str(uuid.uuid4())}, token)
    successful('OpenCashSession', {'branchId': branch, 'openingAmountCents': 10000, 'notes': 'Synthetic SM06'}, token)
    session = sql("SELECT id::text FROM cash_sessions WHERE status='OPEN';")
    payload = {'clientOperationId': 'synthetic-sale-positive-0001', 'branchId': branch,
               'cashSessionId': session, 'customerId': None, 'replacesSaleId': None,
               'discountCents': 0, 'surchargeCents': 0,
               'items': [{'product_id': product, 'quantity': 1, 'requested_price': 1200}],
               'payments': [{'payment_method_id': cash, 'amount_cents': 2000, 'sequence': 1, 'external_reference': None}]}
    successful('PostSale', {'payload': payload}, token)
    successful('PostSale', {'payload': payload}, token)
    assert sql('SELECT count(*) FROM sales;') == '1'
    assert sql("SELECT total_cents||':'||change_cents FROM sales;") == '1200:800'
    assert sql('SELECT sum(amount_cents) FROM cash_movements;') == '11200'
    assert float(sql('SELECT quantity FROM stock_balances;')) == 9
    checks.append('SM06 numbers: one sale/replay, cash11200, stock9, received2000/change800 cents')
    sale = sql('SELECT id::text FROM sales;')
    successful('CancelSale', {'saleId': sale, 'reason': 'Synthetic cancellation'}, token)
    assert sql('SELECT sum(amount_cents) FROM cash_movements;') == '10000'
    assert float(sql('SELECT quantity FROM stock_balances;')) == 10
    # An already canceled sale may be rejected, but must never refund twice.
    operation('CancelSale', {'saleId': sale, 'reason': 'Synthetic cancellation', 'sessionToken': token})
    assert sql('SELECT sum(amount_cents) FROM cash_movements;') == '10000'
    assert float(sql('SELECT quantity FROM stock_balances;')) == 10
    checks.append('Cancellation/repeat restores cash10000 and stock10 exactly once')
    entry = {'clientOperationId': 'synthetic-stock-positive-0001', 'branchId': branch, 'direction': 'IN',
             'occurredAt': '2026-10-29T12:00:00Z', 'notes': 'Synthetic stock',
             'items': [{'product_id': product, 'quantity': 2, 'unit_gross_cents': 800, 'unit_cost_cents': 800}]}
    successful('SaveStockBatch', {'payload': entry}, token)
    successful('SaveStockBatch', {'payload': entry}, token)
    assert float(sql('SELECT quantity FROM stock_balances;')) == 12
    transfer = {'clientOperationId': 'synthetic-transfer-positive-0001', 'sourceBranchId': branch,
                'destinationBranchId': second, 'notes': 'Synthetic transfer',
                'items': [{'product_id': product, 'quantity': 3}]}
    successful('PostStockTransfer', {'payload': transfer}, token)
    successful('PostStockTransfer', {'payload': transfer}, token)
    assert sql('SELECT count(*) FROM stock_transfers;') == '1'
    assert [float(x) for x in sql('SELECT quantity FROM stock_balances ORDER BY branch_id;').splitlines()] == [9, 3]
    checks.append('Separate entry/transfer with exact replays preserves single effects and balances9/3')
    movement = {'sessionId': session, 'movementType': 'WITHDRAWAL', 'amountCents': 1000,
                'description': 'Synthetic withdrawal', 'operationId': 'synthetic-cash-positive-0001'}
    successful('RegisterCashMovement', movement, token)
    successful('RegisterCashMovement', movement, token)
    assert sql('SELECT sum(amount_cents) FROM cash_movements;') == '9000'
    assert sql("SELECT count(*) FROM cash_movements WHERE movement_type='WITHDRAWAL';") == '1'
    response = operation('RegisterCashMovement', {**movement, 'amountCents': 2000, 'sessionToken': token})
    assert response.get('errors') and sql('SELECT sum(amount_cents) FROM cash_movements;') == '9000'
    checks.append('Cash ACK exact replay has one effect; same operationId with changed payload rejected')
    close = {'sessionId': session, 'countedAmountCents': 9000,
             'notes': 'Synthetic closure', 'operationId': 'synthetic-close-positive-0001'}
    successful('CloseCashSession', close, token)
    successful('CloseCashSession', close, token)
    assert sql("SELECT status||':'||difference_cents FROM cash_sessions WHERE id='" + session + "';") == 'CLOSED:0'
    checks.append('Cash close and exact replay preserve one closure and zero difference')


try:
    with tempfile.TemporaryDirectory(prefix='ipsess-') as temporary:
        temp = Path(temporary)
        config = temp / 'config'
        (config / 'schema').mkdir(parents=True)
        (config / 'app').mkdir()
        schema = (REPO / 'dataconnect/schema/schema.gql').read_text()
        (config / 'schema/schema.gql').write_text(schema)
        (config / 'dataconnect.yaml').write_text(
            'specVersion: "v1"\nserviceId: "insightpad"\nlocation: "southamerica-east1"\n'
            'schema:\n  source: "./schema"\n  datasource:\n    postgresql:\n'
            '      database: "fdcdb"\n      cloudSql:\n        instanceId: "synthetic-only"\n'
            'connectorDirs: ["./app"]\n')
        (config / 'app/connector.yaml').write_text('connectorId: app\n')
        for filename, names in [('queries.gql', ['ValidateDeviceSession']),
                                ('mutations.gql', ['ClaimDeviceSession', 'TouchDeviceSession', 'ReleaseDeviceSession', *CORE_OPERATIONS])]:
            source = (REPO / 'dataconnect/app' / filename).read_text()
            (config / 'app' / filename).write_text('\n\n'.join(definition(source, name) for name in names))
        cache = Path(os.environ.get('FIREBASE_EMULATORS_PATH', str(Path.home() / '.cache/firebase/emulators')))
        binary = cache / ('dataconnect-emulator-' + VERSION)
        if not binary.is_file():
            binary = temp / 'fdc'
            with U.urlopen(DOWNLOAD, timeout=60) as response:
                binary.write_bytes(response.read())
            binary.chmod(0o700)
        assert hashlib.sha256(binary.read_bytes()).hexdigest() == BINARY_SHA, 'Emulator checksum mismatch'
        command(['docker', 'image', 'inspect', IMAGE])  # Reuse the preceding PG18 preparation.
        sock = temp / 'sock'
        sock.mkdir(mode=0o777)
        sock.chmod(0o777)
        assert len(str(sock / '.s.PGSQL.5432')) < 108, 'Unix socket path too long'
        created = True
        try:
            command(['docker', 'run', '-d', '--name', container, '--network', 'none', '--memory', '512m',
                     '--tmpfs', '/var/lib/postgresql:rw,size=256m', '--volume', str(sock) + ':/diag-sock',
                     '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', '-e', 'POSTGRES_DB=fdcdb', IMAGE,
                     '-k', '/var/run/postgresql,/diag-sock'])
            deadline = time.monotonic() + 20
            while True:
                probe = subprocess.run(['docker', 'exec', container, 'psql', '-XAtq', '-h', '127.0.0.1',
                                        '-U', 'postgres', '-d', 'fdcdb', '-c', 'SELECT 1'],
                                       capture_output=True, timeout=2)
                if probe.returncode == 0:
                    break
                assert time.monotonic() < deadline, 'Final PG server not ready'
                time.sleep(.1)
            record['postgresVersion'] = sql('SHOW server_version;')
            with socket.socket() as listener:
                listener.bind(('127.0.0.1', 0))
                port = listener.getsockname()[1]
            base = 'http://127.0.0.1:' + str(port)
            with (OUT / 'emulator-private.log').open('w') as log:
                process = subprocess.Popen([str(binary), '--logtostderr', '-v=2', 'dev',
                                            '--config_dir=' + str(config), '--listen=127.0.0.1:' + str(port)],
                                           stdout=log, stderr=log,
                                           env={'PATH': os.environ['PATH'], 'HOME': str(temp),
                                                'GCE_METADATA_HOST': '127.0.0.1:9', 'NO_PROXY': '127.0.0.1,localhost'})
                deadline = time.monotonic() + 20
                while True:
                    try:
                        with opener.open(base + '/emulator/info', timeout=1):
                            break
                    except OSError:
                        assert process.poll() is None and time.monotonic() < deadline, 'Emulator not ready'
                        time.sleep(.1)
                post('/emulator/configure', {'connectionString': 'postgresql://postgres@/fdcdb?host=' + str(sock)
                                            + '&sslmode=disable', 'database': 'fdcdb', 'serviceId': 'insightpad'})
                assert sql("SELECT count(*) FROM pg_tables WHERE schemaname='public';") == '53'
                tenant, role = '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'
                sql(f"INSERT INTO tenants(id,legal_name,timezone,currency_code,active,created_at,updated_at) VALUES('{tenant}','Synthetic','UTC','BRL',true,now(),now());"
                    f"INSERT INTO roles(id,tenant_id,name,hierarchy_level,system_role,active,created_at,updated_at) VALUES('{role}','{tenant}','Synthetic',100,false,true,now(),now());"
                    f"INSERT INTO users(id,tenant_id,role_id,name,email,onboarding_pending,failed_login_attempts,active,created_at,updated_at) VALUES('actor','{tenant}','{role}','Synthetic','actor@example.invalid',false,0,true,now(),now());")
                encode = lambda obj: base64.urlsafe_b64encode(json.dumps(obj).encode()).decode().rstrip('=')
                synthetic_token = encode({'alg': 'none', 'typ': 'JWT'}) + '.' + encode({
                    'sub': 'actor', 'user_id': 'actor', 'aud': 'demo-insightpad-session',
                    'iss': 'https://securetoken.google.com/demo-insightpad-session',
                    'iat': int(time.time()), 'exp': int(time.time()) + 3600,
                    'firebase': {'sign_in_provider': 'custom'}}) + '.'
                connector = '/v1/projects/demo-insightpad-session/locations/southamerica-east1/services/insightpad/connectors/app'
                token = claim()
                valid = operation('ValidateDeviceSession', {'sessionToken': token, 'requestKey': str(uuid.uuid4())}, False)
                assert not valid.get('errors') and valid['data']['_select'] == [{'valid': True}]
                initial_claim = sql('SELECT claimed_at::text FROM user_device_sessions;')
                sql("UPDATE user_device_sessions SET last_seen_at=now()-interval '5 minutes';")
                renew(token)
                assert sql('SELECT claimed_at::text FROM user_device_sessions;') == initial_claim
                assert sql("SELECT last_seen_at>now()-interval '10 seconds' FROM user_device_sessions;") == 't'
                checks.append('Valid lease renews through the compiler and preserves its absolute deadline')
                core_contracts(token, tenant, role)
                replacement = claim()
                denied(token)
                renew(replacement)
                checks.append('Displaced credential denied; replacement remains valid')
                for table, column, bad, good in [
                    ('user_device_sessions', 'last_seen_at', "now()-interval '16 minutes'", 'now()'),
                    ('user_device_sessions', 'claimed_at', "now()-interval '13 hours'", 'now()'),
                    ('users', 'blocked_until', "now()+interval '1 hour'", 'NULL'),
                    ('users', 'active', 'false', 'true'), ('tenants', 'active', 'false', 'true'),
                    ('roles', 'active', 'false', 'true'), ('users', 'deleted_at', 'now()', 'NULL'),
                    ('tenants', 'deleted_at', 'now()', 'NULL'), ('roles', 'deleted_at', 'now()', 'NULL')]:
                    sql(f'UPDATE {table} SET {column}={bad};')
                    denied(replacement)
                    sql(f'UPDATE {table} SET {column}={good};')
                    checks.append(table + '.' + column + ' denial preserves last_seen_at')
                for label, invalid in [('missing', ''), ('guessed', 'b' * 64),
                                       ('hash instead of secret', hashlib.sha256(replacement.encode()).hexdigest())]:
                    denied(invalid)
                    checks.append(label + ' credential denied')
                original_actor = synthetic_token
                synthetic_token = encode({'alg': 'none', 'typ': 'JWT'}) + '.' + encode({
                    'sub': 'foreign-actor', 'user_id': 'foreign-actor', 'aud': 'demo-insightpad-session',
                    'iss': 'https://securetoken.google.com/demo-insightpad-session',
                    'iat': int(time.time()), 'exp': int(time.time()) + 3600,
                    'firebase': {'sign_in_provider': 'custom'}}) + '.'
                denied(replacement)
                synthetic_token = original_actor
                checks.append('Credential cannot renew a different authenticated actor')
                released = operation('ReleaseDeviceSession', {'sessionToken': replacement})
                assert not released.get('errors') and released['data']['_execute'] == 1
                denied(replacement)
                checks.append('Explicit release prevents renewal')
                record['passed'] = True
        finally:
            if process:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
            if created:
                record['ownedContainerRemoved'] = subprocess.run(
                    ['docker', 'rm', '-fv', container], capture_output=True, timeout=20).returncode == 0
                assert record['ownedContainerRemoved'], 'Owned container cleanup failed'
except Exception:
    (OUT / 'failure-private.txt').write_text(traceback.format_exc())
    record['passed'] = False
finally:
    (OUT / 'result.json').write_text(json.dumps(record, indent=2) + '\n')

if not record.get('passed'):
    raise RuntimeError('Session runtime regression failed; inspect the encrypted private evidence')
print(f"Data Connect {VERSION}: {len(checks)} isolated contract scenarios passed; no real authenticated smoke claimed")

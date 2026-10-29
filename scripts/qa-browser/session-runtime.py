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


try:
    with tempfile.TemporaryDirectory(prefix='ipsess-') as temporary:
        temp = Path(temporary)
        config = temp / 'config'
        (config / 'schema').mkdir(parents=True)
        (config / 'app').mkdir()
        schema = (REPO / 'dataconnect/schema/schema.gql').read_text()
        (config / 'schema/schema.gql').write_text('\n\n'.join(
            definition(schema, name) for name in ['Tenant', 'Role', 'User', 'UserDeviceSession']))
        (config / 'dataconnect.yaml').write_text(
            'specVersion: "v1"\nserviceId: "insightpad"\nlocation: "southamerica-east1"\n'
            'schema:\n  source: "./schema"\n  datasource:\n    postgresql:\n'
            '      database: "fdcdb"\n      cloudSql:\n        instanceId: "synthetic-only"\n'
            'connectorDirs: ["./app"]\n')
        (config / 'app/connector.yaml').write_text('connectorId: app\n')
        for filename, names in [('queries.gql', ['ValidateDeviceSession']),
                                ('mutations.gql', ['ClaimDeviceSession', 'TouchDeviceSession', 'ReleaseDeviceSession'])]:
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
                assert sql("SELECT count(*) FROM pg_tables WHERE schemaname='public';") == '4'
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
print(f"Data Connect {VERSION}: {len(checks)} isolated session scenarios passed; no real authenticated smoke claimed")

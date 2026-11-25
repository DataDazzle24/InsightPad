"""Publish the reviewed Financeiro candidate to DEV through P58/P59."""
import contextlib
import copy
import datetime as dt
import fcntl
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import stat
import sys
import uuid

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('p59', HERE / 'P59-publicar.py')
p59 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p59)
p, H, m = p59.p, p59.p.H, p59.m
require = p.require

SHA = '0e62246abdd30f3643a07d760312d7b8da68ab65'
BASE = p59.SHA
LIVE_BASE = p59.BASE
RUN, JOB = '45679569227', '139436185594'
ROOT = Path.home() / 'InsightPad_DEV_Financeiro_0e62246'
CONNECTION = f'{p.P}:{p.R}:{p.INSTANCE}'
CONNECTOR = f'/v1/{p.SERVICE}/connectors/app'
API = 'firebasedataconnect.googleapis.com'
LIVE_RELEASE = f'projects/{p.P}/sites/{p.P}/channels/live/releases/1795095245898000'
LIVE_VERSION = f'projects/{p.P}/sites/{p.P}/versions/f476efc58747f630'
ARCHIVE = '20261125T193011Z-c2825b56158b.pgdump'
ARCHIVE_SHA = '6432b9fa9ec3457295fe4e1fd3dfb6709cfd1c6369a100787420205c8bf737a0'
BASE_INVENTORY = {
    'database': p.DATABASE, 'payables': 0, 'receivables': 0, 'payablesWithSettlementFields': 0,
    'receivablesWithSettlementFields': 0, 'ifoodReceivables': 0, 'financialAccounts': 0,
    'cashMovements': 5, 'ecReceipts': 0, 'ecRefunds': 0, 'branchMismatches': 0,
    'financeSchemaPresent': False,
}
POSTFLIGHT = {
    'database': p.DATABASE, 'journalImbalances': 0, 'invalidResiduals': 0,
    'unresolvedOperations': 0, 'unresolvedMigrationIssues': 0, 'financialPages': 8,
    'invokerWrappers': 3,
}
MIGRATIONS = ['structure', 'kernel', 'policies', 'commands', 'queries', 'bank',
              'collections', 'adjustments', 'origins', 'revisions', 'legacy', 'navigation']
FIN_ROUTES = ('visao', 'contas-a-pagar', 'contas-a-receber', 'contas-e-movimentacoes',
              'conciliacao', 'fluxo-de-caixa', 'relatorios-e-fechamento', 'configuracoes')
PRESERVED_COLUMNS = m.COLUMNS.replace(
    "AND c.relname NOT LIKE 'ec_%'", "AND left(c.relname,3)<>'ec_' AND left(c.relname,4)<>'fin_'")
EC_ADDITIONS = {
    (kind, f'{table}.fin_tenant_id_{table}')
    for kind in ('constraint', 'index') for table in ('ec_documents', 'ec_receipts')
} | {
    ('constraint', f'{table}.fin_observe_source_cash') for table in ('ec_receipts', 'ec_refunds')
}
GATES = ('Financeiro (SQL Connect e PostgreSQL 18 isolados)', 'Financeiro (navegador com SQL isolado)',
         'Permissões da plataforma (SQL Connect e PostgreSQL real isolado)')
PRE_P58_HOSTING = H.BASE_SHA


def check_recovery(directory):
    info = directory.lstat()
    require(stat.S_ISDIR(info.st_mode) and stat.S_IMODE(info.st_mode) == 0o700
            and info.st_uid == os.getuid(), 'Diretório privado da recuperação deve pertencer ao operador')
    archive = directory / ARCHIVE
    receipt = archive.with_suffix('.json')
    for path in (archive, receipt):
        info = path.lstat()
        require(stat.S_ISREG(info.st_mode) and stat.S_IMODE(info.st_mode) == 0o600
                and info.st_uid == os.getuid(), 'Cópia e recibo precisam ser arquivos privados do operador')
    value = json.loads(receipt.read_text())
    expected = {'project': p.P, 'connection': CONNECTION, 'database': p.DATABASE,
                'archive': ARCHIVE, 'archiveSHA256': ARCHIVE_SHA, 'archiveMode': '0600',
                'scope': 'logical database', 'capturedAtUTC': '20261125T193011Z',
                'recoveryRehearsed': True, 'remoteMutations': False, 'verifiedTables': 70, 'cashMovements': 5}
    require(value == expected, 'Recibo diverge do ensaio confirmado em DEV')
    checksum = hashlib.sha256()
    with archive.open('rb') as handle:
        while chunk := handle.read(1024 * 1024):
            checksum.update(chunk)
    require(checksum.hexdigest() == ARCHIVE_SHA, 'SHA256 da cópia restaurável divergiu')
    return value


def check_query(source, file, column):
    text = (source / 'scripts/financeiro' / file).read_text()
    start = text.index('SELECT jsonb_build_object(')
    end = text.index(f') {column};', start)
    return text[start:end + len(f') {column}')]


def assert_query(query, column, expected, state, *, ignore=()):
    actual = column + ''.join(" - '" + key + "'" for key in ignore)
    expected_literal = json.dumps(expected).replace("'", "''")
    return f"""DO $publish$ DECLARE observed jsonb;
    BEGIN
      SELECT {actual} INTO observed FROM ({query}) AS verification;
      IF observed IS DISTINCT FROM '{expected_literal}'::jsonb THEN
        RAISE EXCEPTION 'Financeiro verification mismatch' USING ERRCODE='{state}';
      END IF;
    END $publish$;"""


def one_value(release, sql, column):
    return release.sql([sql])[0]['rows'][0][column]


def assert_inventory(observed):
    require({k: v for k, v in observed.items() if k not in {'checkedAt', 'postgres'}} == BASE_INVENTORY
            and re.match(r'^18\.', observed['postgres']), 'Inventário DEV diverge do corte conferido')


def fingerprint_query():
    tables = ['cash_movements', 'accounts_payable', 'accounts_receivable', 'financial_accounts',
              'ec_receipts', 'ec_refunds', 'role_page_permissions']
    fields = []
    for table in tables:
        fields.append(f"""'{table}', (SELECT md5(COALESCE(string_agg(digest, '' ORDER BY digest), ''))
          FROM (SELECT md5(to_jsonb(t)::text) digest FROM public.{table} t) r)""")
    return 'SELECT jsonb_build_object(' + ','.join(fields) + ') AS fingerprint'


def rights_query(user):
    return f"""SELECT jsonb_build_object(
      'relations', COALESCE((SELECT bool_and(has_table_privilege('{user}',c.oid,'SELECT') AND
      (c.relkind='v' OR (has_table_privilege('{user}',c.oid,'INSERT') AND has_table_privilege('{user}',c.oid,'UPDATE'))))
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND left(c.relname,4)='fin_' AND c.relkind IN ('r','v')),false),
      'entrypoints', (SELECT count(*) FROM pg_proc f JOIN pg_namespace n ON n.oid=f.pronamespace
      WHERE n.nspname='public' AND f.proname IN ('fin_prepare','fin_execute','fin_read')
        AND NOT f.prosecdef AND pg_get_userbyid(f.proowner)='{p.OWNER}'
        AND has_function_privilege('{user}', f.oid, 'EXECUTE'))
    ) AS privileges"""


def ec_contract_query():
    additions = ','.join(f"('{kind}','{name}')" for kind, name in sorted(EC_ADDITIONS))
    return f"""SELECT jsonb_build_object(
      'legacy', jsonb_agg(to_jsonb(c) ORDER BY kind,name) FILTER (WHERE (kind,name) NOT IN ({additions})),
      'newObjects', count(*) FILTER (WHERE (kind,name) IN ({additions}))
    ) AS contract FROM ({m.CATALOG.strip().removesuffix(';')}) c"""


def migrations(source):
    paths = [f'20261125-fin-{name}.sql' for name in MIGRATIONS]
    root = source / 'dataconnect/migrations'
    require(set(paths) == {path.name for path in root.glob('20261125-fin-*.sql')},
            'Conjunto de migrações do candidato divergiu')
    return [(file, (root / file).read_text()) for file in paths]


class Release(p.Release):
    def __init__(self, out):
        super().__init__(out)
        self.path = out / 'Financeiro-publicacao.json'
        self.backend_hashes = p59.contracts()
        self.backend_hashes['base'] = copy.deepcopy(self.backend_hashes['candidate'])
        self.connector_body = None
        self.record.update(phase='FINANCEIRO_HOSTING_CONNECTOR_SQL_DEV', candidate=SHA, base=BASE,
                           authorization='Financeiro DEV autorizado após validação, conferência e proteção recuperável',
                           sqlCommitted=False, permissionsAutomaticallyGranted=False,
                           activationPending=True)

    def preflight(self, label):
        program = (HERE / 'P58-preflight.py').read_text()
        for field, old, new in [('SHA', LIVE_BASE, SHA), ('BASE_SHA', PRE_P58_HOSTING, LIVE_BASE)]:
            line = f"\n{field} = '{old}'\n"
            require(program.count(line) == 1, 'Revisão do preflight P58 diferente da referência')
            program = program.replace(line, f"\n{field} = '{new}'\n", 1)
        namespace = {'__name__': '__main__', 'BACKEND_STAGE': self.backend_stage,
                     'PINNED_BACKENDS': self.backend_hashes}
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compile(program, 'P58-preflight.py', 'exec'), namespace)
        value, snapshot = namespace['record'], namespace['snapshots']
        self.record['preflight-' + label] = {'report': str(namespace['report']),
                                            'ready': value.get('readyForFrontendPreparation'),
                                            'nineControlsConfirmed': value.get('nineControlsConfirmed')}
        self.save()
        require(value.get('readyForFrontendPreparation'), value.get('stopped', 'Preflight DEV bloqueado'))
        return value, snapshot

    def api(self, host, path, method='GET', body=None, query=None, **options):
        if host == API and method == 'PATCH':
            require(path == CONNECTOR and self.connector_body is not None and body == self.connector_body,
                    'Publicação permite somente a fonte fixada do conector app')
            expected = {'updateMask': 'source'}
            if options.get('validation'):
                expected['validateOnly'] = 'true'
            require(query == expected and self.record['sqlCommitted'], 'Validação/publicação fora da ordem aprovada')
        return super().api(host, path, method, body, query, **options)

    def cloud_sql(self):
        required = ['firebasehosting.sites.get', 'firebasehosting.sites.update', 'firebasedataconnect.schemas.get',
                    'firebasedataconnect.connectors.get', 'firebasedataconnect.connectors.update',
                    'firebasedataconnect.services.executeGraphqlRead', 'cloudsql.instances.get',
                    'cloudsql.instances.connect', 'cloudsql.instances.login', 'cloudsql.users.list']
        response = self.api('cloudresourcemanager.googleapis.com', f'/v1/projects/{p.P}:testIamPermissions',
                            'POST', {'permissions': required})
        missing = sorted(set(required) - set(response.get('permissions', [])))
        self.record['missingPermissions'] = missing
        self.save()
        require(not missing, 'Acessos necessários ausentes: ' + ', '.join(missing))
        path = f'/sql/v1beta4/projects/{p.P}/instances/{p.INSTANCE}'
        instance = self.api('sqladmin.googleapis.com', path)
        flags = {v['name']: v['value'] for v in instance.get('settings', {}).get('databaseFlags', [])}
        require(instance.get('connectionName') == CONNECTION and instance.get('state') == 'RUNNABLE'
                and instance.get('databaseVersion') == 'POSTGRES_18' and flags.get('cloudsql.iam_authentication') == 'on'
                and any(v.get('type') == 'PRIMARY' for v in instance.get('ipAddresses', [])),
                'Destino SQL divergiu da origem do ensaio')
        users = self.api('sqladmin.googleapis.com', path + '/users').get('items', [])
        self.db_service_user = f'service-{p.N}@gcp-sa-firebasedataconnect.iam'
        for user, kind in [(p.OPERATOR, 'CLOUD_IAM_USER'), (self.db_service_user, 'CLOUD_IAM_SERVICE_ACCOUNT')]:
            require(any(v.get('name') == user and v.get('type') == kind for v in users),
                    'Conta SQL IAM existente não confirmada')
        self.sql_config = {'instance': CONNECTION, 'database': p.DATABASE, 'user': p.OPERATOR, 'ipType': 'PUBLIC'}
        self.record['sqlAccess'] = self.sql_config
        self.save()


def configure_tools():
    p.SHA, p.BASE = SHA, BASE
    H.SHA, H.BASE_SHA, H.ROOT = SHA, BASE, ROOT


def check_cloud_state(release, label, first, snapshot, *, hosted=False):
    current, live = release.preflight(label)
    require(live['schemas-main'] == snapshot['schemas-main'] and p.same_policies(snapshot, live)
            and H.same_config(live['previous-version']['config'], snapshot['previous-version']['config']),
            'Schema, contenções ou configuração servida divergiram')
    if hosted:
        require(H.same_version(current['previousRelease']['version'], release.record['version'])
                and current['publicVersionBefore']['commit'] == SHA, 'Artefato live divergiu do candidato')
    else:
        require(current['previousRelease'] == first['previousRelease']
                and current['publicVersionBefore']['commit'] == LIVE_BASE, 'Release concorrente em DEV')


def inspect_candidate(release, files):
    js = b''.join(v['data'] for name, v in files.items() if name.endswith('.js'))
    require(all(marker in js for marker in [b'FinancialPrepare', b'FinancialExecute', b'FinancialRead',
                                            b'/financeiro/conciliacao', b'/financeiro/relatorios-e-fechamento']),
            'Financeiro ausente do build normal')
    release.record['artifactManifestSHA256'] = p.digest(json.dumps(
        {name: item['rawSHA256'] for name, item in files.items()}, sort_keys=True).encode())
    release.save()


def publish_hosting(release, first, snapshot, files, compressed, mapping):
    config = snapshot['previous-version']['config']
    client = H.Hosting(release.access_token(), release.record, release.save)
    previous = release.record['previousVersion']
    require(H.same_version(client.live(), previous), 'Hosting concorrente antes do upload')
    version = client.api(H.PREFIX + '/versions', 'POST',
                         {'status': 'CREATED', 'labels': {'insightpad-candidate': SHA,
                                                          'insightpad-operation': release.record['operationLabel']}})['name']
    require(H.version_ok(version), 'Versão Hosting inválida')
    client.version = version
    client.file_map = mapping
    release.record['version'] = version
    release.save()
    response = client.api('/v1beta1/' + version + ':populateFiles', 'POST', {'files': mapping})
    needed = response.get('uploadRequiredHashes', [])
    require(set(needed) <= set(compressed), 'Hosting solicitou hash fora do artefato')
    for digest in needed:
        client.upload(response['uploadUrl'], digest, compressed[digest])
    client.api('/v1beta1/' + version, 'PATCH', {'status': 'FINALIZED', 'config': config},
               {'updateMask': 'status,config'})
    remote = client.files(version)
    managed = {v['path']: v['hash'] for v in client.files(previous)
               if v['path'] in {'/__/firebase/init.js', '/__/firebase/init.json'}}
    inventory = {**mapping, **managed}
    require(len(managed) == 2 and len(remote) == len(inventory)
            and {v['path']: v['hash'] for v in remote} == inventory
            and all(v.get('status') == 'ACTIVE' for v in remote), 'Inventário Hosting divergiu')
    check_cloud_state(release, 'before-live', first, snapshot)
    require(client.api('/v1beta1/' + previous).get('status') == 'FINALIZED', 'Versão anterior indisponível')
    result = client.api(H.PREFIX + '/channels/live/releases', 'POST', {'message': 'Financeiro ' + SHA},
                        {'versionName': version})
    release.record.update(hostingPublished=True, release={k: result.get(k) for k in ('name', 'releaseTime')})
    release.save()

    def read(path, nonce):
        data, headers, _ = H.fetch_public(path, config, nonce)
        for suffix, mime in [('.js', 'javascript'), ('.css', 'text/css')]:
            if path.endswith(suffix):
                require(mime in (headers.get('Content-Type') or '').lower(), 'MIME inesperado: ' + path)
        return data, headers

    H.wait_public(client, files, release.record, release.save, read=read)
    routes = ['/', '/login', '/modulos/financeiro', '/vendas/comandas', '/vendas/encomendas',
              '/vendas/frente-de-caixa', '/estoque', *('/financeiro/' + route for route in FIN_ROUTES)]
    for route in routes:
        data, _ = read(route, uuid.uuid4().hex)
        require(p.digest(data) == files['/index.html']['rawSHA256'], 'Entrada de rota divergente: ' + route)
    _, headers = read('/login', uuid.uuid4().hex)
    wanted = {name.lower(): value for rule in config.get('headers', []) if rule.get('glob') == '**'
              for name, value in rule.get('headers', {}).items()}
    for key in ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options']:
        require(wanted.get(key.lower()) and headers.get(key) == wanted[key.lower()],
                'Cabeçalho servido divergente: ' + key)
    require('no-store' in (headers.get('Cache-Control') or '').lower(), 'HTML sem no-store')
    release.record.update(publicArtifactVerified=True, publicRoutesVerified=len(routes), servedSecurityHeadersVerified=True)
    release.save()


def publish(release):
    print('1/6 Conferindo CI, cópia restaurada, identidade DEV, acessos e contenções.', flush=True)
    release.record['CI'] = p.verify_ci(RUN, JOB, SHA, GATES)
    release.record['dataProtection'] = check_recovery(Path.home() / '.insightpad-fin-recovery')
    first, snapshot = release.preflight('initial')
    require(first['publicVersionBefore']['commit'] == LIVE_BASE
            and first['previousRelease']['name'] == LIVE_RELEASE
            and H.same_version(first['previousRelease']['version'], LIVE_VERSION),
            'Hosting mudou desde P58R')
    release.record.update(previousVersion=first['previousRelease']['version'],
                          previousRelease=first['previousRelease'], servingConfigSHA256=first['servingConfigSHA256'])
    (release.out / 'previous-connector-private.json').write_text(json.dumps(snapshot['connectors-app']))
    release.save()
    release.cloud_sql()

    print('2/6 Conferindo o corte SQL e construindo o artefato com a configuração real de DEV.', flush=True)
    donor = p.prepare(release, first, snapshot)
    source = release.source
    inventory = check_query(source, 'preflight.sql', 'inventory')
    postflight = check_query(source, 'postflight.sql', 'verification')
    identity = release.sql([f"SELECT current_database() db,current_user usr,pg_has_role(current_user,'{p.OWNER}','MEMBER') owner"],
                           owner=False)[0]['rows'][0]
    require(identity == {'db': p.DATABASE, 'usr': p.OPERATOR, 'owner': True}, 'Login/role SQL divergente')
    before = one_value(release, inventory, 'inventory')
    assert_inventory(before)
    require(one_value(release, "SELECT count(*)::int AS tables FROM pg_tables WHERE schemaname='public'", 'tables')
            == release.record['dataProtection']['verifiedTables'], 'Inventário do schema mudou desde a cópia')
    fingerprint = one_value(release, fingerprint_query(), 'fingerprint')
    legacy, acl, ec_catalog = release.sql([PRESERVED_COLUMNS, m.ACL, m.CATALOG])
    reference = json.loads((HERE / 'P58-native-expected.json').read_text())
    require(reference['candidate'] == LIVE_BASE and reference['catalogSQLSHA256'] == p.digest(m.CATALOG.encode())
            and ec_catalog['rows'] == reference['rows'], 'Contrato nativo de Encomendas e Comandas divergiu')
    files, compressed, mapping = p.build(release, donor, snapshot)
    inspect_candidate(release, files)
    source_files = p.source_files(source, 'app')
    new_hashes = {item['path']: p.digest(item['content'].encode()) for item in source_files}
    original = release.backend_hashes['base']['connectors/app']
    require(new_hashes.keys() == original.keys()
            and {name for name in original if original[name] != new_hashes[name]} == {'mutations.gql', 'queries.gql'},
            'Conector divergiu do escopo')
    release.backend_hashes['candidate']['connectors/app'] = new_hashes
    release.connector_body = {'name': p.SERVICE + '/connectors/app', 'source': {'files': source_files}}

    print('3/6 Aplicando as 12 migrações em uma transação, com verificação antes do commit.', flush=True)
    check_cloud_state(release, 'before-sql', first, snapshot)
    migration_files = migrations(source)
    rights = rights_query(release.db_service_user)
    rights_expected = {'relations': True, 'entrypoints': 3}
    checks = [assert_query(inventory, 'inventory', BASE_INVENTORY, 'P00F1', ignore=('checkedAt', 'postgres')),
              assert_query(fingerprint_query(), 'fingerprint', fingerprint, 'P00F2')]
    after = {**BASE_INVENTORY, 'financeSchemaPresent': True}
    expected_ec = {'legacy': ec_catalog['rows'], 'newObjects': len(EC_ADDITIONS)}
    checks_after = [assert_query(inventory, 'inventory', after, 'P00F3', ignore=('checkedAt', 'postgres')),
                    assert_query(fingerprint_query(), 'fingerprint', fingerprint, 'P00F4'),
                    assert_query(postflight, 'verification', POSTFLIGHT, 'P00F5', ignore=('checkedAt',)),
                    assert_query(rights, 'privileges', rights_expected, 'P00F6'),
                    assert_query(ec_contract_query(), 'contract', expected_ec, 'P00F7')]
    statements = ["LOCK TABLE accounts_payable,accounts_receivable,financial_accounts,cash_movements,"
                  "ec_receipts,ec_refunds,role_page_permissions IN SHARE MODE",
                  *checks, *(p.native_body(text) for _, text in migration_files), 'SET CONSTRAINTS ALL IMMEDIATE',
                  *checks_after]
    release.record.update(remoteMutationAttempted=True, inventoryBefore=before, lastIntent={'stage': 'finance-sql'},
                          sqlFiles=[{'file': name, 'sha256': p.digest(text.encode())} for name, text in migration_files])
    release.save()
    try:
        release.sql(statements, read_only=False)
    except RuntimeError as error:
        guards = {'P00F1': 'inventário antes do SQL', 'P00F2': 'dados legados antes do SQL',
                  'P00F3': 'inventário após o SQL', 'P00F4': 'dados legados após o SQL',
                  'P00F5': 'integridade financeira', 'P00F6': 'privilégios SQL existentes',
                  'P00F7': 'contrato de Encomendas e Comandas'}
        guard = next((label for code, label in guards.items() if code in str(error)), None)
        if guard:
            raise RuntimeError('Transação rejeitada em ' + guard) from None
        raise
    release.record.update(sqlCommitted=True, legacyRowsVerifiedInTransaction=True,
                          existingSqlPrivilegesVerified=True, ecNativeAdditionsVerified=len(EC_ADDITIONS))
    release.save()

    def verify_native():
        require(release.sql([PRESERVED_COLUMNS, m.ACL]) == [legacy, acl], 'Colunas ou ACLs legadas divergiram')
        require(one_value(release, ec_contract_query(), 'contract') == expected_ec,
                'Contrato nativo de Encomendas e Comandas divergiu')
        return one_value(release, postflight, 'verification')

    release.record['sqlPostflight'] = verify_native()
    release.save()
    print('4/6 Validando e publicando o conector app.', flush=True)
    validation = release.api(API, CONNECTOR, 'PATCH', release.connector_body,
                             {'validateOnly': 'true', 'updateMask': 'source'}, validation=True)
    if 'validationError' in validation or 'error' in validation:
        (release.out / 'connector-validation-private.json').write_text(
            json.dumps(m.d.safe_error(validation.get('validationError', validation), release.token)))
        raise RuntimeError('Validação do conector falhou; consultar diagnóstico privado')
    check_cloud_state(release, 'before-connector', first, snapshot)
    release.poll(release.api(API, CONNECTOR, 'PATCH', release.connector_body, {'updateMask': 'source'}))
    release.record['connectorPublished'] = True
    release.backend_stage = 'candidate'
    release.save()
    check_cloud_state(release, 'after-connector', first, snapshot)

    read = re.search(r'^query FinancialRead\b[\s\S]*?^}', (source / 'dataconnect/app/queries.gql').read_text(), re.M).group()
    denied = release.api(API, '/v1/' + p.SERVICE + ':executeGraphqlRead', 'POST',
                         {'query': read, 'operationName': 'FinancialRead',
                          'variables': {'input': {}, 'sessionToken': '0' * 64},
                          'extensions': {'impersonate': {'unauthenticated': True}}}, expected_denial=True)
    require(p.authentication_denied(denied), 'FinancialRead não confirmou recusa sem sessão autenticada')
    release.record['unauthenticatedReadDenied'] = True
    release.save()

    print('5/6 Publicando e conferindo o Hosting DEV.', flush=True)
    publish_hosting(release, first, snapshot, files, compressed, mapping)

    print('6/6 Conferindo o artefato, os contratos e as contenções finais.', flush=True)
    check_cloud_state(release, 'final', first, snapshot, hosted=True)
    release.record['sqlPostflight'] = verify_native()
    release.record.update(publicationComplete=True, nineControlsConfirmed=True, servingConfigPreserved=True,
                          schemaUnchanged=True, url=f'https://{p.P}.web.app/modulos/financeiro',
                          remaining='Aceite com perfil DEV controlado e cortes reais verificados. CORE não gravada.')


def main():
    require(not sys.argv[1:], 'Argumentos inesperados no publicador')
    os.umask(0o077)
    for directory in (ROOT, p.ROOT):
        directory.mkdir(mode=0o700, exist_ok=True)
    configure_tools()
    with (p.ROOT / 'P58.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('Outra publicação DEV está em andamento') from None
        for receipt in ROOT.glob('Financeiro-*/Financeiro-publicacao.json'):
            require(not json.loads(receipt.read_text()).get('remoteMutationAttempted'),
                    'Publicação já registrou mutação. Consulte o recibo antes de retomar: ' + str(receipt))
        stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        out = ROOT / f'Financeiro-{stamp}-{uuid.uuid4().hex[:6]}'
        out.mkdir(mode=0o700)
        release = Release(out)
        try:
            release.save()
            publish(release)
        except (Exception, KeyboardInterrupt) as error:
            release.record.update(publicationComplete=False,
                                  stopped=str(error) if isinstance(error, RuntimeError) else type(error).__name__)
        finally:
            release.token = ''
            release.record.update(endedUTC=dt.datetime.now(dt.timezone.utc).isoformat(), receipt=str(release.path))
            release.save()
            print('=== INICIO FINANCEIRO ===\n' + release.path.read_text() + '=== FIM FINANCEIRO ===', flush=True)
        return 0 if release.record['publicationComplete'] else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

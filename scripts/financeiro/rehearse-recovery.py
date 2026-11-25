"""Capture DEV read-only and rehearse recovery on an isolated local PostgreSQL 18."""
import contextlib
import datetime as dt
import getpass
import hashlib
import json
import os
from pathlib import Path
import platform
import secrets
import select
import subprocess
import sys
import tempfile
import time
import urllib.request

from preflight_cloud_shell import CONNECTION, INSTANCE, OPERATOR, PROJECT

IMAGE = 'postgres@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6'
PROXY_URL = 'https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.18.3/cloud-sql-proxy.linux.amd64'
PROXY_SHA256 = '4c2390ab4761159c57a039bac8cbb3ed264d1b40e1c6de3a0aa78c24d3a35ff5'
OWNER_ROLE = 'firebaseowner_fdcdb_public'
APP_TABLES = {'cash_movements', 'accounts_payable', 'accounts_receivable', 'financial_accounts'}
LOCAL_DB = 'fin_rehearsal'
LOCAL = ['/var/run/postgresql', 'postgres', LOCAL_DB]
SOURCE = [f'/ip-source/{CONNECTION}', OPERATOR, 'fdcdb']

# Hash the multiset of canonical row digests rather than exporting any row.
# The comparison covers all application tables in public.
MANIFEST = r"""
SET LOCAL time zone 'UTC';
SET LOCAL extra_float_digits = 3;
SET LOCAL row_security = off;
SELECT format(
  $query$SELECT json_build_object(
    'table', %L, 'rows', count(*),
    'digest', encode(sha256(convert_to(COALESCE(string_agg(digest, '' ORDER BY digest), ''), 'UTF8')), 'hex')
  ) FROM (SELECT encode(sha256(convert_to(to_jsonb(t)::text, 'UTF8')), 'hex') AS digest FROM %I.%I AS t) AS rows$query$,
  c.relname, n.nspname, c.relname
)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
ORDER BY c.relname
\gexec
"""


class CheckFailed(Exception):
    """A diagnostic that can be printed without exposing a database row."""


def require(condition, message):
    if not condition:
        raise CheckFailed(message)


def run(command, *, timeout=35, input_text=None, label=None):
    label = label or command[0]
    try:
        process = subprocess.run(command, input=input_text, text=True, capture_output=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired):
        raise CheckFailed(f'{label}: indisponível ou tempo limite excedido') from None
    require(process.returncode == 0, f'{label}: terminou com erro ({process.returncode})')
    return process.stdout.strip()


def pg(container, executable, endpoint, *, read_only=False):
    host, user, database = endpoint
    command = ['docker', 'exec', '-i', container]
    if read_only:
        command.extend(['env', 'PGOPTIONS=-c default_transaction_read_only=on -c statement_timeout=60000 -c lock_timeout=5000'])
    return [*command, executable, '-h', host, '-U', user, '-d', database, '-w']


def psql(container, endpoint, *, read_only=False):
    return [*pg(container, 'psql', endpoint, read_only=read_only), '-XqAt', '-v', 'ON_ERROR_STOP=1']


@contextlib.contextmanager
def snapshot(container, source, role):
    command = psql(container, source, read_only=True)
    with tempfile.TemporaryFile() as errors:
        with subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=errors, text=True) as holder:
            try:
                holder.stdin.write("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\n"
                                   "SET LOCAL idle_in_transaction_session_timeout='300s';\n")
                if role:
                    holder.stdin.write(f'SET LOCAL ROLE "{role}";\n')
                holder.stdin.write('SELECT pg_export_snapshot();\n')
                holder.stdin.flush()
                require(select.select([holder.stdout], [], [], 20)[0], 'Exportação do snapshot expirou')
                name = holder.stdout.readline().strip()
                require(name and all(char in '0123456789abcdefABCDEF-' for char in name),
                        'Snapshot consistente não obtido com o usuário SQL existente')
                yield name
            finally:
                # Closing stdin rolls back the read-only transaction. The DB
                # timeout also releases it if this process loses its connection.
                holder.stdin.close()
                try:
                    holder.wait(timeout=6)
                except subprocess.TimeoutExpired:
                    holder.kill()
                    holder.wait(timeout=4)


def manifest(container, endpoint, *, snapshot_id=None, role=None):
    sql = 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\n'
    if snapshot_id:
        sql += f"SET TRANSACTION SNAPSHOT '{snapshot_id}';\n"
    if role:
        sql += f'SET LOCAL ROLE "{role}";\n'
    output = run(psql(container, endpoint, read_only=True), input_text=sql + MANIFEST + '\nROLLBACK;\n',
                 timeout=65, label='Conferência de tabelas')
    rows = [json.loads(line) for line in output.splitlines()]
    require(APP_TABLES <= {row['table'] for row in rows}, 'Inventário incompleto das tabelas do aplicativo')
    return rows


def gpg_base(home):
    return ['gpg', '--homedir', str(home), '--batch', '--no-tty',
            '--pinentry-mode', 'loopback', '--no-symkey-cache']


@contextlib.contextmanager
def passphrase_fd(passphrase):
    reader, writer = os.pipe()
    try:
        os.write(writer, (passphrase + '\n').encode('utf-8'))
    finally:
        os.close(writer)
    try:
        yield reader
    finally:
        os.close(reader)


def pipeline(producer, consumer, *, key_fd, key_in_producer, label, timeout):
    # Neither stdout nor stderr of dump/restore goes into the public receipt.
    with tempfile.TemporaryFile() as errs:
        with subprocess.Popen(producer, stdout=subprocess.PIPE, stderr=errs,
                              pass_fds=(key_fd,) if key_in_producer else ()) as left:
            try:
                with subprocess.Popen(consumer, stdin=left.stdout, stdout=subprocess.DEVNULL,
                                      stderr=errs, pass_fds=() if key_in_producer else (key_fd,)) as right:
                    left.stdout.close()
                    try:
                        right_code = right.wait(timeout=timeout)
                        left_code = left.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        right.kill()
                        raise CheckFailed(f'{label}: tempo limite excedido') from None
                    require(left_code == right_code == 0, f'{label}: falhou (etapas {left_code}/{right_code})')
            finally:
                if left.poll() is None:
                    left.kill()


def rehearse(container, source, role, output, gpg_home, passphrase, *, progress=lambda _message: None):
    maximum = run(psql(container, source, read_only=True), input_text=
                  "SELECT current_setting('server_version_num')::int / 10000 = 18"
                  " AND pg_database_size(current_database()) <= 268435456;",
                  label='Versão e tamanho da origem')
    require(maximum == 't', 'Exige PostgreSQL 18 e banco de até 256 MiB para este ensaio local')
    progress('Capturando snapshot consistente e criptografando a cópia.')
    with snapshot(container, source, role) as snapshot_id:
        original = manifest(container, source, snapshot_id=snapshot_id, role=role)
        dump = [*pg(container, 'pg_dump', source, read_only=True),
                '--format=custom', '--lock-wait-timeout=5s', f'--snapshot={snapshot_id}']
        if role:
            dump.append(f'--role={role}')
        with passphrase_fd(passphrase) as key_fd:
            encrypt = [*gpg_base(gpg_home), '--passphrase-fd', str(key_fd),
                       '--symmetric', '--cipher-algo', 'AES256', '--output', str(output)]
            pipeline(dump, encrypt, key_fd=key_fd, key_in_producer=False, label='Cópia lógica criptografada', timeout=150)

    progress('Restaurando no PostgreSQL local e comparando as tabelas.')
    with passphrase_fd(passphrase) as key_fd:
        decrypt = [*gpg_base(gpg_home), '--passphrase-fd', str(key_fd), '--decrypt', str(output)]
        restore = [*pg(container, 'pg_restore', LOCAL), '--no-owner', '--no-acl', '--exit-on-error', '--single-transaction']
        pipeline(decrypt, restore, key_fd=key_fd, key_in_producer=True, label='Restauração descartável', timeout=120)

    restored = manifest(container, LOCAL)
    require(original == restored, 'Tabelas restauradas divergem do snapshot')
    return {'verifiedTables': len(original), 'cashMovements': next(row['rows'] for row in original if row['table'] == 'cash_movements')}


def cloud_target():
    account = run(['gcloud', 'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'])
    require(account == OPERATOR, 'Selecione a conta utilizada no P59')
    info = json.loads(run(['gcloud', 'sql', 'instances', 'describe', INSTANCE, f'--project={PROJECT}', '--format=json']))
    require((info.get('connectionName'), info.get('databaseVersion'), info.get('state')) ==
            (CONNECTION, 'POSTGRES_18', 'RUNNABLE'), 'Instância DEV PostgreSQL 18 não confirmada')
    require(any(i.get('type') == 'PRIMARY' for i in info.get('ipAddresses', [])),
            'A instância não confirmou o caminho já usado pelo Cloud Shell')


def install_proxy(path):
    require(platform.system() == 'Linux' and platform.machine() == 'x86_64', 'Use o Cloud Shell Linux x86_64')
    with urllib.request.urlopen(PROXY_URL, timeout=40) as response:
        binary = response.read(64 * 1024 * 1024)
    require(hashlib.sha256(binary).hexdigest() == PROXY_SHA256, 'SHA256 do Cloud SQL Auth Proxy divergiu')
    path.write_bytes(binary)
    path.chmod(0o700)


def wait_until(predicate, message, seconds=45):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if predicate():
            return
        time.sleep(0.5)
    raise CheckFailed(message)


def main():
    os.umask(0o077)
    cloud_target()
    print('Origem DEV confirmada. A cópia fica no seu Cloud Shell e a restauração usa PostgreSQL local.', flush=True)
    try:
        with open('/dev/tty', 'r') as terminal:
            require(terminal.isatty(), 'Execute num Cloud Shell interativo')
    except OSError:
        raise CheckFailed('Execute num Cloud Shell interativo') from None
    secret = getpass.getpass('Senha nova da cópia (mínimo 16 caracteres): ')
    require(len(secret) >= 16 and len(secret.encode('utf-8')) <= 256, 'Use uma senha entre 16 e 256 caracteres')
    require(getpass.getpass('Repita a senha: ') == secret, 'As senhas diferem')
    output_dir = Path.home() / '.insightpad-fin-recovery'
    output_dir.mkdir(mode=0o700, exist_ok=True)
    require(not output_dir.is_symlink() and output_dir.stat().st_mode & 0o077 == 0, 'O diretório da cópia precisa ser privado')
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    container = 'insightpad-fin-recovery-' + secrets.token_hex(6)
    protected = output_dir / f'{stamp}-{container[-12:]}.pgdump.gpg'
    receipt_path = protected.with_suffix('.json')
    require(not protected.exists() and not receipt_path.exists(), 'Arquivo de saída já existe')

    with tempfile.TemporaryDirectory(prefix='ipfin-', dir='/tmp') as scratch_path:
        scratch = Path(scratch_path)
        proxy = scratch / 'proxy'
        sockets = scratch / 'sql'
        sockets.mkdir()
        gpg_home = scratch / 'gpg'
        gpg_home.mkdir()
        install_proxy(proxy)
        run(['docker', 'pull', IMAGE], timeout=180, label='Imagem PostgreSQL 18 fixada')
        proxy_error = scratch / 'proxy.log'
        with proxy_error.open('wb') as log, subprocess.Popen(
            [str(proxy), '--gcloud-auth', '--auto-iam-authn', '--unix-socket', str(sockets), CONNECTION],
            stdin=subprocess.DEVNULL, stdout=log, stderr=log,
        ) as bridge:
            try:
                wait_until(lambda: (sockets / CONNECTION / '.s.PGSQL.5432').is_socket(), 'Proxy IAM não iniciou')
                run(['docker', 'run', '-d', '--rm', '--name', container, '--network', 'none', '--memory', '768m',
                     '--tmpfs', '/var/lib/postgresql:rw,size=768m', '--mount', f'type=bind,source={sockets},target=/ip-source,readonly',
                     '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', '-e', f'POSTGRES_DB={LOCAL_DB}', IMAGE],
                    timeout=60, label='PostgreSQL descartável')

                def local_ready():
                    try:
                        return run([*psql(container, LOCAL), '-c', 'SELECT 1'], timeout=3) == '1'
                    except CheckFailed:
                        return False

                wait_until(local_ready, 'PostgreSQL descartável não iniciou')
                proof = rehearse(container, SOURCE, OWNER_ROLE, protected, gpg_home, secret, progress=lambda message: print(message, flush=True))
            except BaseException:
                protected.unlink(missing_ok=True)
                raise
            finally:
                subprocess.run(['docker', 'rm', '-f', container], capture_output=True, timeout=15)
                if bridge.poll() is None:
                    bridge.terminate()
                    try:
                        bridge.wait(timeout=8)
                    except subprocess.TimeoutExpired:
                        bridge.kill()

    digest = hashlib.sha256()
    with protected.open('rb') as archive:
        while chunk := archive.read(1024 * 1024):
            digest.update(chunk)
        os.fsync(archive.fileno())
    output = {'project': PROJECT, 'connection': CONNECTION, 'database': 'fdcdb',
              'archive': protected.name, 'archiveSHA256': digest.hexdigest(), 'encrypted': True, 'scope': 'logical database',
              'capturedAtUTC': stamp, 'recoveryRehearsed': True, 'remoteMutations': False, **proof}
    receipt_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (CheckFailed, OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired, KeyboardInterrupt) as error:
        message = str(error) if isinstance(error, CheckFailed) else 'Conexão, ferramenta local ou entrada indisponível'
        print(f'Ensaio interrompido: {message}. Nenhuma publicação executada.', file=sys.stderr)
        sys.exit(1)

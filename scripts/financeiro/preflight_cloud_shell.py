"""Cloud Shell evidence reader. The only database transaction is BEGIN READ ONLY."""
import json
from pathlib import Path
import re
import subprocess
import sys
import urllib.request

PROJECT = 'insightpad-dd-dev'
REGION = 'southamerica-east1'
INSTANCE = 'insightpad-fdc'
CONNECTION = f'{PROJECT}:{REGION}:{INSTANCE}'
OPERATOR = 'datadazzletecnologia@gmail.com'


def run(args, request=None, timeout=55):
    try:
        result = subprocess.run(args, input=request, text=True, capture_output=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired:
        raise RuntimeError(f'Tempo limite em {args[0]}') from None
    if result.returncode:
        raise RuntimeError(f'Falha em {args[0]} durante o preflight')
    return result.stdout.strip()


def inventory_query(path):
    sql = Path(path).read_text()
    start = re.search(r'^SELECT jsonb_build_object\(', sql, re.MULTILINE)
    end = re.search(r'^ROLLBACK;\s*$', sql, re.MULTILINE)
    if start is None or end is None:
        raise RuntimeError('Formato da consulta de inventário divergiu')
    return sql[start.start():end.start()].strip()


def preflight(bridge, inventory):
    account = run(['gcloud', 'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'])
    if account != OPERATOR:
        raise RuntimeError('Selecione a conta Google utilizada no P59 antes de rodar o preflight')
    target = json.loads(run(['gcloud', 'sql', 'instances', 'describe', INSTANCE, f'--project={PROJECT}', '--format=json']))
    if (target.get('connectionName'), target.get('state'), target.get('databaseVersion')) != (CONNECTION, 'RUNNABLE', 'POSTGRES_18'):
        raise RuntimeError('Projeto, instância ou versão do PostgreSQL divergiram do destino DEV')
    settings = target.get('settings', {})
    if not any(f.get('name') == 'cloudsql.iam_authentication' and f.get('value') == 'on' for f in settings.get('databaseFlags', [])):
        raise RuntimeError('A instância não confirmou login SQL por IAM')

    with urllib.request.urlopen(f'https://{PROJECT}.web.app/version.json', timeout=20) as response:
        version = json.load(response)
    commit = version.get('commit', '')
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        raise RuntimeError('Resposta de version.json não reconhecida')
    backups = json.loads(run(['gcloud', 'sql', 'backups', 'list', f'--instance={INSTANCE}', f'--project={PROJECT}', '--limit=10', '--format=json']))
    backup_configuration = settings.get('backupConfiguration', {})

    print(json.dumps({
        'project': PROJECT,
        'connection': CONNECTION,
        'hostingCommit': commit,
        'automaticBackup': backup_configuration.get('enabled'),
        'pointInTimeRecovery': backup_configuration.get('pointInTimeRecoveryEnabled'),
        'successfulBackupsListed': [
            {'id': item.get('id'), 'type': item.get('type'), 'endTime': item.get('endTime')}
            for item in backups if item.get('status') == 'SUCCESSFUL'
        ],
    }, ensure_ascii=False, indent=2), flush=True)
    token = run(['gcloud', 'auth', 'print-access-token', f'--project={PROJECT}'])
    if not token:
        raise RuntimeError('Token IAM indisponível')

    request = {
        'mode': 'sql',
        'readOnly': True,
        'owner': True,
        'instance': CONNECTION,
        'database': 'fdcdb',
        'user': OPERATOR,
        'ipType': 'PUBLIC' if any(i.get('type') == 'PRIMARY' for i in target.get('ipAddresses', [])) else 'PRIVATE',
        'token': token,
        'sql': ["SET LOCAL statement_timeout = '25s'", inventory_query(inventory)],
    }
    result = json.loads(run(['node', bridge], json.dumps(request), timeout=90))
    summary = result['result'][-1]['rows'][0]['inventory']
    if not result.get('ok') or summary.get('database') != 'fdcdb':
        raise RuntimeError('O inventário não confirmou a conexão esperada')
    print(json.dumps({'inventory': summary, 'remoteMutations': False, 'recoveryRehearsed': False}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        preflight(*sys.argv[1:])
    except (RuntimeError, ValueError, KeyError, OSError, IndexError, TypeError) as error:
        # Keep stderr and request buffers (which can contain auth material) private.
        message = str(error) if type(error) is RuntimeError else 'Resposta inválida ou conexão indisponível'
        print(f'Preflight interrompido: {message}. Nenhuma publicação executada.', file=sys.stderr)
        sys.exit(1)

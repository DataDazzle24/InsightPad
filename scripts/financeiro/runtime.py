"""Financeiro tests use the real connector/compiler and disposable PostgreSQL 18.

This harness has no remote database configuration and never reads Cloud credentials.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/ec'))
from runtime_support import Runtime as EcRuntime, IDS  # noqa: E402

MIGRATIONS = [
    '20261119-platform-role-permission.sql',
    '20261125-fin-structure.sql',
    '20261125-fin-kernel.sql',
    '20261125-fin-policies.sql',
    '20261125-fin-commands.sql',
    '20261125-fin-queries.sql',
    '20261125-fin-bank.sql',
    '20261125-fin-collections.sql',
    '20261125-fin-adjustments.sql',
    '20261125-fin-origins.sql',
    '20261125-fin-revisions.sql',
    '20261125-fin-legacy.sql',
    '20261125-fin-navigation.sql',
]
PAGES = ['FIN_VISAO', 'CONTAS_PAGAR', 'CONTAS_RECEBER', 'FIN_CONTAS',
         'FIN_CONCILIACAO', 'FIN_FLUXO', 'FIN_RELATORIOS', 'FIN_CONFIGURACOES']


class Runtime(EcRuntime):
    def __init__(self):
        super().__init__(additional_mutations=('FinancialPrepare', 'FinancialExecute'),
                         additional_queries=('FinancialRead',))

    def start(self, temp):
        super().start(temp)
        for _ in range(2):
            for name in MIGRATIONS:
                self.sql((ROOT / 'dataconnect/migrations' / name).read_text())

    def reset(self):
        super().reset()
        self.sql("""
        INSERT INTO app_pages(id,page_key,display_name,module,route,created_at,updated_at)
        SELECT gen_random_uuid(),k,k,'Financeiro','/synthetic/'||k,now(),now()
        FROM unnest(ARRAY[%s]) k;
        INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_update,can_delete,can_manage,can_export,created_at,updated_at)
        SELECT '%s',id,'%s',true,true,true,true,true,true,now(),now() FROM app_pages WHERE module='Financeiro';
        """ % (','.join("'" + page + "'" for page in PAGES), IDS['role'], IDS['tenant']))

    @staticmethod
    def result(response, mutation=False):
        assert not response.get('errors'), response
        data = response['data']
        if mutation:
            data = data['query']
        return data['response']['result']

    def prepare(self, command, actor='actor', token='a' * 64):
        return self.result(self.operation('FinancialPrepare', {'command': command}, True, actor, token), True)

    def execute(self, prepared, cancel=False, actor='actor', token='a' * 64):
        return self.result(self.operation('FinancialExecute', {
            'operationId': prepared['operationId'], 'payloadHash': prepared['payloadHash'],
            'cancel': cancel,
        }, True, actor, token), True)

    def read_fin(self, **query):
        return self.result(self.operation('FinancialRead', {'input': query}))

"""Local synthetic identity with real SQL Connect and PostgreSQL finance operations."""
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import uuid

from runtime import ROOT, Runtime, IDS

FINANCE_OPERATIONS = {'FinancialRead', 'FinancialPrepare', 'FinancialExecute'}


def seed(runtime):
    runtime.reset()
    day = runtime.sql("SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;")

    def apply(action, payload):
        prepared = runtime.prepare({'operationId': str(uuid.uuid4()), 'action': action, 'payload': payload})
        result = runtime.execute(prepared)
        assert result['status'] == 'COMMITTED', result
        return result

    account = apply('C12', {
        'branchId': IDS['branch'], 'name': 'Conta sintética de conferência',
        'accountType': 'BANK', 'currency': 'BRL', 'openingBalanceCents': '20000',
        'cutoffDate': '2026-01-01', 'shared': False,
        'grants': [{'userId': 'actor', 'branchId': IDS['branch'], 'canGlobalBalance': True,
                    'canPost': True, 'canReconcile': True}],
    })
    for direction in ('PAY', 'RECEIVE'):
        apply('C01', {'branchId': IDS['branch'], 'direction': direction,
                      'description': 'Título sintético', 'amountCents': '12345',
                      'issueDate': day, 'competenceDate': day, 'dueDate': day})
    return {'uid': 'actor', 'tenantId': IDS['tenant'], 'ids': IDS, 'accountId': account['accountId']}


def main():
    with Runtime() as runtime:
        info = seed(runtime)

        class Handler(SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(ROOT / 'artifacts/recovery-qa'), **kwargs)

            def log_message(self, *args):
                pass

            def respond(self, value, status=200):
                encoded = json.dumps(value).encode()
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(encoded)

            def do_GET(self):
                endpoint = urlsplit(self.path).path
                if endpoint == '/__finance/info':
                    return self.respond(info)
                if endpoint == '/__finance/stats':
                    current = runtime.sql("""SELECT jsonb_build_object(
                      'settlements',(SELECT count(*) FROM fin_settlements),
                      'residualCents',(SELECT sum(residual_cents)::text FROM fin_title_state WHERE direction='RECEIVE'),
                      'movementCents',(SELECT COALESCE(sum(debit_cents-credit_cents),0)::text FROM fin_journal_lines WHERE account_id IS NOT NULL)
                    )::text;""")
                    return self.respond(json.loads(current))
                return super().do_GET()

            def do_POST(self):
                if self.path != '/__finance/rpc':
                    return self.respond({'error': 'unsupported'}, 404)
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 300000:
                    return self.respond({'error': 'invalid length'}, 400)
                request = json.loads(self.rfile.read(length))
                name = request['name']
                if name not in FINANCE_OPERATIONS:
                    return self.respond({'error': 'unsupported operation'}, 403)
                variables = dict(request['variables'])
                token = variables.pop('sessionToken', '')
                result = runtime.operation(name, variables, name != 'FinancialRead', token=token)
                return self.respond(result)

        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        print(json.dumps({'url': f'http://127.0.0.1:{server.server_port}'}), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == '__main__':
    main()

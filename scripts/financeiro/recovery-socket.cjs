// Use the same OAuth2 client and Connector version as P58/P59.
const path = require('node:path');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const { OAuth2Client } = require('google-auth-library');

const instance = 'insightpad-dd-dev:southamerica-east1:insightpad-fdc';

async function main() {
  const directory = process.argv[2];
  if (!directory || !path.isAbsolute(directory)) {
    throw new Error('Expected an absolute socket directory');
  }
  let token = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    token += chunk;
  }
  if (!token || token.length > 16384 || /\s/.test(token)) {
    throw new Error('Invalid credential input');
  }
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token, expiry_date: Date.now() + 3000000 });
  const connector = new Connector({ auth });
  process.once('SIGTERM', () => {
    connector.close();
    process.exit(0);
  });
  await connector.startLocalProxy({
    instanceConnectionName: instance, authType: 'IAM', ipType: 'PUBLIC',
    listenOptions: { path: path.join(directory, '.s.PGSQL.5432') },
  });
}

function report(error) {
  const code = error.code ?? error.response?.status;
  const safeCodes = [401, 403, 404, 429, 'EACCES', 'EADDRINUSE', 'ENAMETOOLONG', 'ENETUNREACH',
    'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'];
  // Never emit the error object. It can contain request headers.
  process.stdout.write(`${safeCodes.includes(code) ? code : 'CONNECTOR_ERROR'}\n`, () => process.exit(1));
}

process.once('uncaughtException', report);
process.once('unhandledRejection', report);
main().catch(report);

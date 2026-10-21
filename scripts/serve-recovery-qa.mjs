import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../artifacts/recovery-qa/', import.meta.url));
const { values } = parseArgs({ options: { port: { type: 'string', default: '4174' }, entry:{type:'string',default:'recovery'} } });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Port must be between 1024 and 65535');
if(!['recovery','application'].includes(values.entry))throw new Error('Entry must be recovery or application');
const entry=`/qa/${values.entry}.html`;
await stat(resolve(root, '.'+entry));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? entry : pathname));
    const canonical = await realpath(file);
    if (!canonical.startsWith(root.replace(/\/$/, '') + sep)) { res.writeHead(403).end(); return; }
    if (!(await stat(canonical)).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[extname(canonical)] || 'application/octet-stream');
    res.writeHead(200).end(req.method === 'HEAD' ? undefined : await readFile(canonical));
  } catch { res.writeHead(404).end(); }
}).listen(port, '127.0.0.1', () => console.log(`QA local: http://127.0.0.1:${port}${entry} (Auth/API mockados; sem deploy)`));

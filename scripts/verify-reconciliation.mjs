import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const source = '80f21c65a0ed3e07b0f9c29bebd07d2479b0735b';
const working = process.argv.includes('--working-tree');
git('merge-base', '--is-ancestor', source, 'HEAD');
const allowed = new Set([
  '.gitignore', '.github/workflows/ci.yml',
  'docs/source-preservation.md', 'docs/reconciled-candidate-review.md',
  'docs/reconciled-findings.md', 'docs/dev-frontend-compatibility.md',
  'frontend/package.json', 'frontend/package-lock.json', 'functions/package.json', 'functions/package-lock.json',
  'functions/test/reconciled-security.test.ts', 'functions/test/sql.test.ts',
  'frontend/src/App.css', 'frontend/src/pages/LoginPage.tsx', 'frontend/src/pages/LoginPage.test.tsx',
  'frontend/src/components/ModalDialog.tsx', 'frontend/qa/recovery.html', 'frontend/qa/recovery.tsx',
  'frontend/qa/review.css', 'frontend/tsconfig.qa.json', 'frontend/vite.qa.config.ts',
  'scripts/ci-dev-config.mjs', 'scripts/ci-dev-config.test.mjs', 'scripts/verify-reconciliation.mjs',
  'scripts/version-manifest.mjs', 'scripts/version-manifest.test.mjs', 'scripts/serve-recovery-qa.mjs',
]);
const changed = git('diff', '--name-only', source, ...(working ? [] : ['HEAD'])).split('\n').filter(Boolean);
if (working) changed.push(...git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean));
const unexpected = changed.filter(path => !allowed.has(path));
if (unexpected.length) throw new Error(`Change outside approved reconciliation: ${unexpected.join(', ')}`);

// CSS is intentionally shared: every recovered line except the two recovery-modal rules must remain.
const originalCss = git('show', `${source}:frontend/src/App.css`);
const candidateCss = working ? readFileSync(resolve(root, 'frontend/src/App.css'), 'utf8') : git('show', 'HEAD:frontend/src/App.css');
for (const line of originalCss.split('\n')) {
  if (!line || line.startsWith('.recovery-backdrop{') || line.startsWith('@media(max-width:800px){.theme-switch')) continue;
  if (!candidateCss.includes(line)) throw new Error('A recovered shared/POS CSS rule was lost');
}
for (const [folder, expectations] of [['frontend', { vite: '8.2.4', '@grpc/grpc-js': '1.13.6', 'brace-expansion': '5.0.12' }], ['functions', { vite: '8.2.4' }]]) {
  const lock = JSON.parse(readFileSync(resolve(root, folder, 'package-lock.json'), 'utf8'));
  for (const [name, version] of Object.entries(expectations)) {
    const packages = Object.entries(lock.packages).filter(([path]) => path.endsWith(`node_modules/${name}`));
    if (!packages.length || packages.some(([, pkg]) => pkg.version !== version)) throw new Error(`${folder}: unexpected ${name} version`);
  }
}
console.log(`Recovered source ${source} is an ancestor; ${new Set(changed).size} scoped changes. Business source, schema, operations, SDKs, cache and legacy hook preserved.`);

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Hash a sorted list of paths + file hashes. Never traverse node_modules or .env.
export function fingerprint(root, paths) {
  const files = [];
  function visit(path) {
    for (const entry of readdirSync(join(root, path), { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) files.push(child);
      else throw new Error(`Unsupported artifact entry: ${child}`);
    }
  }
  for (const path of paths) {
    if (path.endsWith('/')) visit(path.slice(0, -1));
    else files.push(path);
  }
  const entries = [...new Set(files)].sort().map(path => ({
    path, sha256: sha256(readFileSync(join(root, path))),
  }));
  if (!entries.length) throw new Error('Empty artifact/source group');
  return { sha256: sha256(JSON.stringify(entries)), files: entries };
}

export function createManifest(root, project) {
  if (project !== 'insightpad-dd-dev') throw new Error('Only insightpad-dd-dev is permitted');
  if (process.versions.node.split('.')[0] !== '22') throw new Error('Node 22 is required');
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const notVerified = () => ({ value: null, reason: 'Not queried or proven by this local build; requires authenticated DEV evidence.' });
  return {
    formatVersion: 1,
    kind: 'build-candidate',
    project,
    generatedAt: new Date().toISOString(),
    source: {
      commit: git('rev-parse', 'HEAD'),
      tree: git('rev-parse', 'HEAD^{tree}'),
      branch: git('branch', '--show-current') || null,
      dirty: git('status', '--porcelain', '--untracked-files=normal') !== '',
    },
    toolchain: { node: process.version, npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim() },
    inputs: {
      locks: fingerprint(root, ['frontend/package-lock.json', 'functions/package-lock.json']),
      config: fingerprint(root, ['.firebaserc', 'firebase.json', 'dataconnect/dataconnect.yaml', 'dataconnect/app/connector.yaml']),
      schema: fingerprint(root, ['dataconnect/schema/']),
      operations: fingerprint(root, ['dataconnect/app/']),
      clientSdk: fingerprint(root, ['frontend/src/dataconnect-generated/']),
      adminSdk: fingerprint(root, ['functions/src/dataconnect-admin-generated/']),
    },
    artifacts: {
      hosting: fingerprint(root, ['frontend/dist/']),
      functions: fingerprint(root, ['functions/lib/']),
    },
    deployed: {
      hostingVersion: notVerified(), functionsRevisions: notVerified(),
      dataConnectRevision: notVerified(), schemaRevision: notVerified(),
      gitCommit: notVerified(),
    },
    release: { ctoApproval: null, reason: 'CI/build is not a release approval or evidence of deployment.' },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { project: { type: 'string' }, output: { type: 'string', default: 'artifacts/version-manifest.json' } } });
  const output = resolve(repository, values.output);
  // Outputs belong outside deployable directories and must not replace sources.
  if (!relative(join(repository, 'artifacts'), output) || relative(join(repository, 'artifacts'), output).startsWith('..')) {
    throw new Error('Output must be a file inside artifacts/');
  }
  const manifest = createManifest(repository, values.project);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Candidate manifest: ${relative(repository, output)} (source ${manifest.source.commit}, dirty=${manifest.source.dirty})`);
}

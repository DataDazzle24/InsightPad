import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createManifest, fingerprint } from './version-manifest.mjs';

test('candidate records actual inputs/artifacts and never claims a deployment', () => {
  const root = mkdtempSync(join(tmpdir(), 'insightpad-manifest-'));
  const files = ['frontend/package-lock.json', 'functions/package-lock.json', '.firebaserc',
    'firebase.json', 'dataconnect/dataconnect.yaml', 'dataconnect/app/connector.yaml',
    'dataconnect/app/query.gql', 'dataconnect/schema/schema.gql',
    'frontend/src/dataconnect-generated/index.js', 'functions/src/dataconnect-admin-generated/index.js',
    'frontend/dist/index.html', 'functions/lib/index.js'];
  const put = (path, content) => { mkdirSync(join(root, path, '..'), { recursive: true }); writeFileSync(join(root, path), content); };
  try {
    for (const file of files) put(file, `fixture:${file}`);
    execFileSync('git', ['init', '-q'], { cwd: root });
    execFileSync('git', ['add', '.'], { cwd: root });
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], { cwd: root });
    const before = createManifest(root, 'insightpad-dd-dev');
    assert.equal(before.kind, 'build-candidate');
    assert.equal(before.source.dirty, false);
    assert.equal(before.source.commit, execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim());
    for (const evidence of Object.values(before.deployed)) {
      assert.equal(evidence.value, null);
      assert.ok(evidence.reason);
    }
    assert.equal(before.release.ctoApproval, null);
    put('dataconnect/schema/schema.gql', 'changed schema');
    put('frontend/dist/index.html', 'changed build');
    const after = createManifest(root, 'insightpad-dd-dev');
    assert.equal(after.source.dirty, true);
    assert.notEqual(before.inputs.schema.sha256, after.inputs.schema.sha256);
    assert.notEqual(before.artifacts.hosting.sha256, after.artifacts.hosting.sha256);
    assert.equal(before.inputs.operations.sha256, after.inputs.operations.sha256);
    assert.throws(() => createManifest(root, 'insightpad-dd'), /Only insightpad-dd-dev/);
    rmSync(join(root, 'functions/lib'), { recursive: true });
    assert.throws(() => createManifest(root, 'insightpad-dd-dev'), /ENOENT/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('fingerprints are deterministic and exclude secrets/dependencies', () => {
  const root = mkdtempSync(join(tmpdir(), 'insightpad-fingerprint-'));
  try {
    mkdirSync(join(root, 'build/node_modules'), { recursive: true });
    writeFileSync(join(root, 'build/b.js'), 'b');
    writeFileSync(join(root, 'build/a.js'), 'a');
    const before = fingerprint(root, ['build/']);
    writeFileSync(join(root, 'build/.env'), 'do-not-include');
    writeFileSync(join(root, 'build/node_modules/ignored.js'), 'do-not-include');
    assert.deepEqual(fingerprint(root, ['build/']), before);
    assert.deepEqual(before.files.map(f => f.path), ['build/a.js', 'build/b.js']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

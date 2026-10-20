import { strict as assert } from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { validatePublicConfig, writeDevConfig } from './ci-dev-config.mjs';

const fixture = () => ({ projectId: 'insightpad-dd-dev', authDomain: 'insightpad-dd-dev.firebaseapp.com',
  apiKey: 'public-client-fixture', appId: 'fixture', messagingSenderId: '0', storageBucket: 'fixture' });
test('DEV public config rejects other projects, missing fields and line injection', () => {
  assert.equal(Object.keys(validatePublicConfig(fixture())).length, 6);
  for (const value of [{ ...fixture(), projectId: 'insightpad-dd' }, { ...fixture(), apiKey: '' },
    { ...fixture(), appId: 'x\nSECRET=value' }, { ...fixture(), authDomain: 'other.example' }]) {
    assert.throws(() => validatePublicConfig(value));
  }
});
test('config records fingerprint without values and refuses to overwrite local environment', () => {
  const root = mkdtempSync(join(tmpdir(), 'insightpad-public-config-'));
  try {
    const result = writeDevConfig(root, fixture());
    assert.match(result.sha256, /^[a-f0-9]{64}$/);
    assert.equal(JSON.stringify(result).includes('public-client-fixture'), false);
    assert.deepEqual(writeDevConfig(root, fixture()), result);
    writeFileSync(join(root, 'frontend/.env.development.local'), 'local-settings');
    assert.throws(() => writeDevConfig(root, fixture()), /Existing DEV environment/);
    assert.equal(readFileSync(join(root, 'frontend/.env.development.local'), 'utf8'), 'local-settings');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

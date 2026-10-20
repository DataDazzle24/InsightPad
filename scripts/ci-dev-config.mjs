import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const publicConfigUrl = 'https://insightpad-dd-dev.web.app/__/firebase/init.json';
export function validatePublicConfig(value) {
  const mapping = { apiKey: 'VITE_FIREBASE_API_KEY', appId: 'VITE_FIREBASE_APP_ID',
    authDomain: 'VITE_FIREBASE_AUTH_DOMAIN', messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    projectId: 'VITE_FIREBASE_PROJECT_ID', storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET' };
  if (value?.projectId !== 'insightpad-dd-dev' || value?.authDomain !== 'insightpad-dd-dev.firebaseapp.com') {
    throw new Error('Only the public DEV Firebase client configuration is permitted');
  }
  return Object.fromEntries(Object.entries(mapping).map(([key, target]) => {
    const input = value[key];
    if (typeof input !== 'string' || !input || input.length > 512 || /[\r\n\u0000]/.test(input)) {
      throw new Error(`Invalid public client field: ${key}`);
    }
    return [target, input];
  }));
}

export function writeDevConfig(root, config) {
  const fields = validatePublicConfig(config);
  const dotenv = Object.entries(fields).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n';
  const target = join(root, 'frontend/.env.development.local');
  // Do not replace a developer's existing environment with a downloaded file.
  if (existsSync(target) && readFileSync(target, 'utf8') !== dotenv) throw new Error('Existing DEV environment differs; use a clean checkout');
  mkdirSync(dirname(target), { recursive: true });
  if (!existsSync(target)) writeFileSync(target, dotenv, { flag: 'wx', mode: 0o600 });
  const evidence = { kind: 'public-firebase-client-config', project: 'insightpad-dd-dev', source: publicConfigUrl,
    fields: Object.keys(fields).sort(), sha256: createHash('sha256').update(JSON.stringify(fields)).digest('hex') };
  mkdirSync(join(root, 'artifacts'), { recursive: true });
  writeFileSync(join(root, 'artifacts/firebase-client-config.json'), JSON.stringify(evidence, null, 2) + '\n');
  return evidence;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const response = await fetch(publicConfigUrl, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Public DEV configuration unavailable: HTTP ${response.status}`);
  const evidence = writeDevConfig(resolve(dirname(fileURLToPath(import.meta.url)), '..'), await response.json());
  console.log(`Public DEV client configuration prepared; fingerprint ${evidence.sha256}. No Auth or deploy operation.`);
}

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repository = fileURLToPath(new URL('../', import.meta.url));
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();

export default defineConfig({
  plugins: [react(), {
    name:'qa-fixture-boundary',enforce:'pre',
    resolveId(source){
      if(source==='@insightpad/dataconnect')return '\0qa-sdk';
      if(['firebase/data-connect','@firebase/data-connect','firebase/functions'].includes(source)||/(?:^|\/)lib\/firebase$|(?:^|\/)auth\/session-data-connect$/.test(source))return fileURLToPath(new URL('./qa/api.ts',import.meta.url));
    },
    load(id){if(id!=='\0qa-sdk')return;
      const sdk=readFileSync(new URL('./src/dataconnect-generated/esm/index.esm.js',import.meta.url),'utf8');
      const names=[...sdk.matchAll(/export function (\w+)\(/g)].map(m=>m[1]);
      return `import {qaOperation,connectorConfig} from ${JSON.stringify(fileURLToPath(new URL('./qa/api.ts',import.meta.url)))};export {connectorConfig};`+names.map(name=>`export const ${name}=(...args)=>qaOperation('${name[0].toUpperCase()+name.slice(1)}',args.length>1?args[1]:args[0]);`).join('\n');
    },
  }, {
    name: 'qa-without-real-auth',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue;
        const forbidden = Object.keys(item.modules).filter(path => /[/\\](?:firebase|@firebase)[/\\]|[/\\]src[/\\](?:lib[/\\]firebase|auth[/\\]AuthProvider)/.test(path));
        if (forbidden.length) this.error(`QA must not load real Firebase/AuthProvider: ${forbidden.join(', ')}`);
      }
      this.emitFile({ type: 'asset', fileName: 'qa-source.json', source: JSON.stringify({ kind: 'review-harness', entries:['qa/recovery.html','qa/application.html'], commit: sourceSha, auth: 'mock', api:'in-memory fixtures; no real backend', deployApproval: null }, null, 2) });
    },
  }],
  base: './',
  define: { 'import.meta.env.VITE_QA_SOURCE_SHA': JSON.stringify(sourceSha) },
  build: {
    outDir: '../artifacts/recovery-qa', emptyOutDir: true,
    rolldownOptions: { input: {recovery:fileURLToPath(new URL('./qa/recovery.html', import.meta.url)),application:fileURLToPath(new URL('./qa/application.html',import.meta.url))} },
  },
});

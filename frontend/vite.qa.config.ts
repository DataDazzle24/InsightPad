import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repository = fileURLToPath(new URL('../', import.meta.url));
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();

export default defineConfig({
  plugins: [react(), {
    name: 'qa-without-real-auth',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue;
        const forbidden = Object.keys(item.modules).filter(path => /[/\\](?:firebase|@firebase)[/\\]|[/\\]src[/\\](?:lib[/\\]firebase|auth[/\\]AuthProvider)/.test(path));
        if (forbidden.length) this.error(`QA must not load real Firebase/AuthProvider: ${forbidden.join(', ')}`);
      }
      this.emitFile({ type: 'asset', fileName: 'qa-source.json', source: JSON.stringify({ kind: 'review-harness', commit: sourceSha, auth: 'mock', deployApproval: null }, null, 2) });
    },
  }],
  base: './',
  define: { 'import.meta.env.VITE_QA_SOURCE_SHA': JSON.stringify(sourceSha) },
  build: {
    outDir: '../artifacts/recovery-qa', emptyOutDir: true,
    rolldownOptions: { input: fileURLToPath(new URL('./qa/recovery.html', import.meta.url)) },
  },
});

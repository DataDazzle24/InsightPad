import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const lock = (project: string) => JSON.parse(readFileSync(new URL(`../../${project}/package-lock.json`, import.meta.url), 'utf8'));

describe('locked dependency regressions', () => {
  it('pins both source-map consumers and still resolves a valid mapping', () => {
    for (const project of ['frontend', 'functions']) {
      expect(lock(project).packages['node_modules/source-map-js'].version).toBe('1.2.2');
      const projectRequire = createRequire(new URL(`../../${project}/package.json`, import.meta.url));
      const { SourceMapConsumer } = projectRequire('source-map-js');
      const consumer = new SourceMapConsumer({ version: 3, sources: ['input.ts'], names: [], mappings: 'AAAA' });
      expect(consumer.originalPositionFor({ line: 1, column: 0 })).toMatchObject({ source: 'input.ts', line: 1, column: 0 });
      expect(() => new SourceMapConsumer({ version: 3, sections: [{ offset: { line: Number.MAX_SAFE_INTEGER, column: 0 }, map: { version: 3, sources: [], names: [], mappings: '' } }] })).toThrow(/offset line/);
    }
  });

  it('validates mapped subnet prefixes and preserves explicit IPv4 trust boundaries', () => {
    expect(lock('functions').packages['node_modules/proxy-addr'].version).toBe('2.0.8');
    const proxy = require('proxy-addr');
    expect(proxy.compile('::ffff:127.0.0.1/80')('203.0.113.1')).toBe(false);
    const trusted = proxy.compile('10.0.0.0/8');
    expect(trusted('10.0.0.1')).toBe(true);
    expect(trusted('203.0.113.1')).toBe(false);
    expect(require('express')().get('trust proxy')).toBe(false);
  });
});

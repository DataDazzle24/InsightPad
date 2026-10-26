import { expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { database,seed,ids } from './sql-fixture.js';
import { screenSchemaDiff } from '../../scripts/review-schema-diff.mjs';
it('preflight detects scoped legacy collisions in a read-only transaction without changing records',async()=>{
 const db=await database();try{
 await seed(db);await db.exec('ALTER TABLE categories DROP COLUMN name_key; ALTER TABLE subcategories DROP COLUMN name_key');
 await db.query("INSERT INTO categories(tenant_id,name) VALUES($1,' mercearia '),($2,'MERCEARIA')",[ids.tenant,ids.otherTenant]);
 await db.query("INSERT INTO categories(tenant_id,name,active) VALUES($1,'MERCEARIA',false)",[ids.tenant]);
 await db.query("INSERT INTO subcategories(tenant_id,category_id,name) VALUES($1,$2,'SUCO'),($1,$2,' suco ')",[ids.tenant,ids.category]);
 const snapshot=async()=>JSON.stringify((await db.query('SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM categories c')).rows)+JSON.stringify((await db.query('SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM subcategories s')).rows);
 const before=await snapshot();const sql=readFileSync(new URL('../../dataconnect/preflight/name-key.sql',import.meta.url),'utf8');
 const rows=(await db.exec(sql)).flatMap(r=>r.rows);
 expect(rows.find(r=>'read_only' in r)).toMatchObject({read_only:'on',isolation:'repeatable read'});
 const duplicates=rows.filter(r=>'record_ids' in r);expect(duplicates).toHaveLength(2);expect(duplicates.map(r=>Number(r.records))).toEqual([2,2]);
 expect(await snapshot()).toBe(before);
 await db.exec('BEGIN READ ONLY');await expect(db.exec("UPDATE categories SET name='forbidden'")).rejects.toThrow();await db.exec('ROLLBACK');
 }finally{await db.close()}
},30000);
it('screens saved official diffs without SQL execution and flags destructive/backfill/missing changes',()=>{
 expect(screenSchemaDiff('').status).toBe('REVIEW_REQUIRED');
 for(const sql of ['UPDATE categories SET name_key=name','DELETE FROM categories','DROP TABLE categories','ALTER TABLE categories ALTER name_key SET NOT NULL'])expect(screenSchemaDiff(sql).status).toBe('REVIEW_REQUIRED');
 expect(screenSchemaDiff('ALTER TABLE public.categories ADD COLUMN name_key varchar(300); ALTER TABLE public.subcategories ADD COLUMN name_key varchar(300);').status).toBe('ADDITIVE_COLUMNS_RECOGNIZED_REVIEW_STILL_REQUIRED');
});

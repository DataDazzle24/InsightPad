import { beforeAll,beforeEach,afterEach,afterAll,expect,it } from 'vitest';
import { database,seed,operation,ids } from './sql-fixture.js';
let db:Awaited<ReturnType<typeof database>>;
beforeAll(async()=>{db=await database();await seed(db);for(const key of ['CAD_CATEGORIA','CAD_SUBCATEGORIA']){await db.query('INSERT INTO app_pages(id,page_key) VALUES(gen_random_uuid(),$1)',[key]);await db.query('INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_update,can_delete) SELECT $1,id,$2,true,true,true,true FROM app_pages WHERE page_key=$3',[ids.role,ids.tenant,key]);}});
beforeEach(async()=>{await db.exec('BEGIN')});afterEach(async()=>{await db.exec('ROLLBACK')});afterAll(async()=>{await db.close()});
const run=(name:string,...args:unknown[])=>operation(db,name,['actor',...args]);
it('canonical names, Unicode boundary and invalid batches never partially write',async()=>{
 expect((await run('CreateCategory','  café\t  da  manhã  ')).affectedRows).toBe(1);
 expect((await db.query<{name:string}>('SELECT name FROM categories WHERE name_key IS NOT NULL')).rows[0]?.name).toBe('CAFÉ DA MANHÃ');
 expect((await run('CreateCategory','café da manhã')).affectedRows).toBe(0);
 expect((await run('CreateCategory','á'.repeat(120))).affectedRows).toBe(1);
 expect((await run('CreateCategory','a'.repeat(121))).affectedRows).toBe(0);
 expect((await run('CreateCategoriesBatch',['BOA','a'.repeat(121)])).affectedRows).toBe(0);
 expect((await db.query('SELECT id FROM categories WHERE name=\'BOA\'')).rows).toHaveLength(0);
});
it('subcategories are unique per parent and restoration checks collisions',async()=>{
 const parent=(await db.query<{id:string}>('INSERT INTO categories(tenant_id,name) VALUES($1,\'OUTRA\') RETURNING id',[ids.tenant])).rows[0]!.id;
 expect((await run('CreateSubcategory',ids.category,' SUCO  NATURAL ')).affectedRows).toBe(1);
 expect((await run('CreateSubcategory',ids.category,'suco natural')).affectedRows).toBe(0);
 expect((await run('CreateSubcategory',parent,'suco natural')).affectedRows).toBe(1);
 const id=(await db.query<{id:string}>('SELECT id FROM subcategories WHERE category_id=$1',[ids.category])).rows[0]!.id;
 expect((await run('ArchiveSubcategory',id)).affectedRows).toBe(1);
 expect((await run('CreateSubcategory',ids.category,'suco natural')).affectedRows).toBe(1);
 expect((await run('RestoreSubcategory',id)).affectedRows).toBe(0);
 expect((await run('CreateSubcategoriesBatch',[{categoryId:parent,name:'VALIDA'},{categoryId:ids.otherTenant,name:'INVALIDA'}])).affectedRows).toBe(0);
});
it('database key rejects a duplicate even when a writer missed a stale application check',async()=>{
 await run('CreateSubcategory',ids.category,'Nome');
 await expect(db.query('INSERT INTO subcategories(tenant_id,category_id,name,name_key) VALUES($1,$2,\'NOME\',$3)',[ids.tenant,ids.category,ids.tenant+'|'+ids.category+'|NOME'])).rejects.toThrow(/unique/i);
});
it('counts avoid join multiplication and paging/filter totals cover all 300 rows',async()=>{
 await db.exec('DELETE FROM products; DELETE FROM categories');
 await db.query("INSERT INTO categories(id,tenant_id,name) SELECT gen_random_uuid(),$1,'CAT '||lpad(i::text,3,'0') FROM generate_series(1,300)i",[ids.tenant]);
 const first=(await db.query<{id:string}>('SELECT id FROM categories ORDER BY name LIMIT 1')).rows[0]!.id;
 await db.query("INSERT INTO products(tenant_id,category_id,name) SELECT $1,$2,'PROD '||i FROM generate_series(1,2)i",[ids.tenant,first]);
 await db.query("INSERT INTO subcategories(tenant_id,category_id,name) SELECT $1,$2,'SUB '||i FROM generate_series(1,3)i",[ids.tenant,first]);
 const list=async(offset:number,filters:object={})=>await run('ListCategories','','name','asc',100,offset,'test',filters) as Awaited<ReturnType<typeof run>>&{meta:{totalCount:number}};
 const one=await list(0);expect(one.rows).toHaveLength(100);expect(Number(one.meta.totalCount)).toBe(300);expect(one.rows[0]).toMatchObject({productCount:2,subcategoryCount:3});
 expect((await list(100)).rows).toHaveLength(100);expect((await list(200)).rows).toHaveLength(100);
 const withProducts=await list(0,{productPresence:['with']});expect(withProducts.rows).toHaveLength(1);expect(Number(withProducts.meta.totalCount)).toBe(1);
 const none=await list(100,{productPresence:['with']});expect(none.rows).toHaveLength(0);expect(Number(none.meta.totalCount)).toBe(1);
 expect(Number((await list(0,{subcategoryPresence:['without']})).meta.totalCount)).toBe(299);
});
it('revoked role and blocked user cannot read or write the catalog',async()=>{
 await db.query('UPDATE roles SET active=false WHERE id=$1',[ids.role]);
 expect((await run('ListCategories','','','',100,0,'test',{})).rows).toHaveLength(0);
 expect((await run('CreateCategory','NEGADA')).affectedRows).toBe(0);
 await db.query('UPDATE roles SET active=true WHERE id=$1',[ids.role]);await db.exec("UPDATE users SET blocked_until=now()+interval '1 hour' WHERE id='actor'");
 expect((await run('CreateCategory','NEGADA')).affectedRows).toBe(0);
});

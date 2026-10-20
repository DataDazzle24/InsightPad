import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { database, ids, operation, seed } from './sql-fixture.js';

let db: PGlite;
let session: string;
const payment = '00000000-0000-4000-8000-000000000077';
beforeAll(async () => {
  db = await database();
  await seed(db);
  await db.exec("INSERT INTO app_pages(id,page_key,active) VALUES (gen_random_uuid(),'CAIXA',true)");
  await db.query("INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_manage) SELECT $1,id,$2,true,true,true FROM app_pages WHERE page_key='CAIXA'", [ids.role, ids.tenant]);
  await db.query("INSERT INTO payment_methods(id,tenant_id,code,name,requires_change) VALUES ($1,$2,'CASH','Dinheiro',true)", [payment, ids.tenant]);
  await db.query('INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,20)', [ids.tenant, ids.branch, ids.product]);
}, 30_000);
beforeEach(async () => {
  await db.exec('BEGIN');
  await operation(db, 'OpenCashSession', ['actor', ids.branch, 0, '']);
  session = (await db.query<{ id: string }>("SELECT id FROM cash_sessions WHERE opened_by_uid='actor' AND status='OPEN'")).rows[0]!.id;
});
afterEach(async () => { await db.exec('ROLLBACK'); });
afterAll(async () => { await db?.close(); });

const post = () => operation(db, 'PostSale', ['actor', {
  clientOperationId: crypto.randomUUID(), branchId: ids.branch, cashSessionId: session,
  customerId: null, replacesSaleId: null, discountCents: 0, surchargeCents: 0,
  items: [{ product_id: ids.product, quantity: 1, requested_price: 1500 }],
  payments: [{ payment_method_id: payment, amount_cents: 1500, sequence: 1, external_reference: null }],
}]);

describe('SEC-2026-002: reavaliação restrita ao PostSale recuperado', () => {
  it('aceita a mesma venda quando ator, tenant e perfil estão ativos', async () => {
    await post();
    expect((await db.query('SELECT id FROM sales')).rows).toHaveLength(1);
  });
  it.each([
    ['usuário inativo', "UPDATE users SET active=false WHERE id='actor'"],
    ['usuário excluído', "UPDATE users SET deleted_at=now() WHERE id='actor'"],
    ['usuário bloqueado', "UPDATE users SET blocked_until=now()+interval '1 hour' WHERE id='actor'"],
    ['tenant inativo', 'UPDATE tenants SET active=false'],
    ['tenant excluído', 'UPDATE tenants SET deleted_at=now()'],
    ['perfil inativo', 'UPDATE roles SET active=false'],
    ['perfil excluído', 'UPDATE roles SET deleted_at=now()'],
  ])('nega a venda após revogação: %s', async (_name, sql) => {
    await db.exec(sql);
    await expect(post()).rejects.toThrow();
    expect((await db.query('SELECT id FROM sales')).rows).toHaveLength(0);
    expect((await db.query("SELECT id FROM cash_movements WHERE movement_type='SALE'")).rows).toHaveLength(0);
  });
});

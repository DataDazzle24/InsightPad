import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { database, ids, operation, seed } from './sql-fixture.js';
let db: PGlite;
const cash='00000000-0000-4000-8000-000000000060', card='00000000-0000-4000-8000-000000000061';
let session:string;
beforeAll(async()=>{db=await database();await seed(db);
 await db.exec("INSERT INTO app_pages(id,page_key,active) VALUES (gen_random_uuid(),'CAIXA',true),(gen_random_uuid(),'GESTAO_VENDAS',true)");
 await db.query("INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_delete,can_manage) SELECT $1,id,$2,true,true,true,true FROM app_pages WHERE page_key IN('CAIXA','GESTAO_VENDAS')",[ids.role,ids.tenant]);
 await db.query("INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_delete,can_manage) SELECT $1,id,$2,true,true,false,false FROM app_pages WHERE page_key IN('CAIXA','GESTAO_VENDAS')",[ids.operatorRole,ids.tenant]);
 await db.query("INSERT INTO payment_methods(id,tenant_id,code,name,requires_change) VALUES ($1,$3,'CASH','Dinheiro',true),($2,$3,'CARD','Cartão',false)",[cash,card,ids.tenant]);
 await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,20)",[ids.tenant,ids.branch,ids.product]);
},30000);
beforeEach(async()=>{await db.exec('BEGIN');await operation(db,'OpenCashSession',['actor',ids.branch,1000,'']);session=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='actor' AND status='OPEN'")).rows[0]!.id;});
afterEach(async()=>{await db.exec('ROLLBACK');});afterAll(async()=>{await db?.close();});
function payload(overrides:Record<string,unknown>={}){return {clientOperationId:crypto.randomUUID(),branchId:ids.branch,cashSessionId:session,customerId:null,replacesSaleId:null,discountCents:0,surchargeCents:0,items:[{product_id:ids.product,quantity:1,requested_price:1500}],payments:[{payment_method_id:cash,amount_cents:2000,sequence:1,external_reference:null}],...overrides};}
const post=async(p:Record<string,unknown>,user='actor')=>operation(db,'PostSale',[user,p]);
const sales=async()=> (await db.query<Record<string,unknown>>('SELECT * FROM sales ORDER BY created_at,id')).rows;
const balance=async()=> Number((await db.query<{quantity:string}>('SELECT quantity FROM stock_balances WHERE branch_id=$1 AND product_id=$2',[ids.branch,ids.product])).rows[0]!.quantity);
describe('PDV: venda, caixa e isolamento transacionais',()=>{
 it('correção informa estoque atual mais a quantidade estornada da venda original',async()=>{
  await post(payload());const sale=(await sales())[0]!;
  const result=await operation(db,'SaleDetails',['actor',sale.id,'correction']);
  const box=(result.rows[0] as {data:{items:Array<{availableStock:number}>}}).data;
  expect(Number(box.items[0]!.availableStock)).toBe(20);
 });
 it('comprovante retorna os valores efetivamente precificados pelo servidor',async()=>{
  await operation(db,'OpenCashSession',['operator',ids.branch,0,'']);
  const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id;
  const result=await post(payload({cashSessionId:own,items:[{product_id:ids.product,quantity:1,requested_price:1}]}),'operator');
  const receipt=(result as unknown as {receipt:{data:{totalCents:number;items:Array<{unitPriceCents:number}>}}}).receipt.data;
  expect(receipt.totalCents).toBe(1500);expect(receipt.items[0]!.unitPriceCents).toBe(1500);
 });
 it('registra dinheiro líquido do troco na mesma transação da venda',async()=>{await post(payload());expect((await sales())[0]).toMatchObject({total_cents:1500,change_cents:500});expect(await balance()).toBe(19);expect((await db.query<{amount_cents:number}>("SELECT amount_cents FROM cash_movements WHERE movement_type='SALE'")).rows).toEqual([{amount_cents:1500}]);});
 it('responde à repetição sem duplicar venda, estoque ou dinheiro',async()=>{const p=payload();await post(p);await post(p);expect(await sales()).toHaveLength(1);expect(await balance()).toBe(19);expect((await db.query("SELECT id FROM cash_movements WHERE movement_type='SALE'")).rows).toHaveLength(1);});
 it('rejeita reaproveitar a operação com outro conteúdo',async()=>{const p=payload();await post(p);await expect(post({...p,discountCents:100})).rejects.toThrow('POS_REJECTED');expect(await sales()).toHaveLength(1);expect(await balance()).toBe(19);});
 it('corrige e estorna a original atomicamente, aproveitando seu estoque',async()=>{await post(payload({items:[{product_id:ids.product,quantity:20,requested_price:1500}],payments:[{payment_method_id:cash,amount_cents:30000,sequence:1}]}));const old=(await sales())[0]!;await post(payload({replacesSaleId:old.id,items:[{product_id:ids.product,quantity:10,requested_price:1500}],payments:[{payment_method_id:cash,amount_cents:15000,sequence:1}]}));expect((await sales()).map(s=>s.status).sort()).toEqual(['CANCELLED','COMPLETED']);expect(await balance()).toBe(10);expect(Number((await db.query<{amount:string}>("SELECT sum(amount_cents) amount FROM cash_movements WHERE movement_type<>'OPENING'")).rows[0]!.amount)).toBe(15000);});
 it('não cancela nem altera estoque quando a correção é inválida',async()=>{await post(payload());const old=(await sales())[0]!;await expect(post(payload({replacesSaleId:old.id,payments:[]}))).rejects.toThrow();expect((await sales())[0]).toMatchObject({status:'COMPLETED'});expect(await balance()).toBe(19);});
 it('rejeita produtos repetidos, negativos, inexistentes e quantidades fracionadas indevidas',async()=>{for(const items of [[{product_id:ids.product,quantity:-1}], [{product_id:ids.product,quantity:1.2}], [{product_id:ids.product,quantity:1},{product_id:ids.product,quantity:1}], [{product_id:ids.otherTenant,quantity:1}]]) await expect(post(payload({items}))).rejects.toThrow();expect(await sales()).toHaveLength(0);});
 it('troco não pode exceder o dinheiro recebido em pagamento dividido',async()=>{await expect(post(payload({payments:[{payment_method_id:cash,amount_cents:100,sequence:1},{payment_method_id:card,amount_cents:2000,sequence:2}]}))).rejects.toThrow();});
 it('exige o caixa do usuário e permite dois operadores na mesma filial',async()=>{await operation(db,'OpenCashSession',['operator',ids.branch,0,'']);expect((await db.query("SELECT id FROM cash_sessions WHERE status='OPEN'")).rows).toHaveLength(2);await expect(post(payload(),'operator')).rejects.toThrow();await expect(operation(db,'CloseCashSession',['operator',session,0,''])).rejects.toThrow('POS_BRANCH_DENIED');});
 it('exige abertura por padrão e permite configurar exceção somente sem dinheiro',async()=>{await expect(post(payload({cashSessionId:null}))).rejects.toThrow();await operation(db,'UpdatePosPolicy',['actor',false,0,0,false]);await expect(post(payload({cashSessionId:null}))).rejects.toThrow();await post(payload({cashSessionId:null,payments:[{payment_method_id:card,amount_cents:1500,sequence:1}]}));expect(await sales()).toHaveLength(1);});
 it('limites comerciais são aplicados no servidor e só gestão altera a política',async()=>{await operation(db,'OpenCashSession',['operator',ids.branch,0,'']);const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id;await expect(operation(db,'UpdatePosPolicy',['operator',true,50,50,true])).rejects.toThrow();await expect(post(payload({cashSessionId:own,discountCents:100}),'operator')).rejects.toThrow();await operation(db,'UpdatePosPolicy',['actor',true,10,5,false]);await post(payload({cashSessionId:own,discountCents:100}),'operator');expect(await sales()).toHaveLength(1);});
 it('fechamento calcula saldo real e rejeita venda e movimento posteriores',async()=>{await post(payload());await operation(db,'RegisterCashMovement',['actor',session,'WITHDRAWAL',100,'Sangria teste']);await operation(db,'CloseCashSession',['actor',session,2400,'']);expect((await db.query('SELECT status,expected_amount_cents,difference_cents FROM cash_sessions WHERE id=$1',[session])).rows[0]).toEqual({status:'CLOSED',expected_amount_cents:2400,difference_cents:0});await expect(post(payload())).rejects.toThrow();await expect(operation(db,'RegisterCashMovement',['actor',session,'SUPPLY',100,'Teste'])).rejects.toThrow();});
 it('cancelamento reverte dinheiro e estoque uma única vez e não altera caixa fechado',async()=>{await post(payload());const sale=(await sales())[0]!;await operation(db,'CancelSale',['actor',sale.id,'Cancelamento teste']);expect(await balance()).toBe(20);await expect(operation(db,'CancelSale',['actor',sale.id,'Cancelamento teste'])).rejects.toThrow();expect(Number((await db.query<{amount:string}>("SELECT sum(amount_cents) amount FROM cash_movements WHERE movement_type<>'OPENING'")).rows[0]!.amount)).toBe(0);});
 it('não retorna nem aceita filial fora dos vínculos do usuário',async()=>{await db.query("INSERT INTO user_branches(user_id,tenant_id,branch_id,active) VALUES ('actor',$1,$2,true)",[ids.tenant,ids.otherBranch]);await expect(post(payload())).rejects.toThrow('POS_BRANCH_DENIED');const result=await operation(db,'SalesWorkspace',['actor',ids.branch,'scope']);expect(result.rows).toHaveLength(0);expect((await operation(db,'SearchPosProducts',['actor',ids.branch,'',30,0,'scope'])).rows).toHaveLength(0);});
 it('paginação limita produtos e calcula disponibilidade de combo pelos componentes',async()=>{const combo=crypto.randomUUID();await db.query("INSERT INTO products(id,tenant_id,name,bundle_product,sale_price_cents) VALUES ($1,$2,'Combo',true,3000)",[combo,ids.tenant]);await db.query('INSERT INTO product_components(parent_product_id,component_product_id,tenant_id,quantity) VALUES ($1,$2,$3,2)',[combo,ids.product,ids.tenant]);const result=await operation(db,'SearchPosProducts',['actor',ids.branch,'Combo',30,0,'products']);expect(result.rows[0]).toMatchObject({stock:'10'});await post(payload({items:[{product_id:combo,quantity:2,requested_price:3000}],payments:[{payment_method_id:cash,amount_cents:6000,sequence:1}]}));expect(await balance()).toBe(16);});
 it('aprovação gerencial é vinculada à operação, ao operador e ao conteúdo',async()=>{
  await operation(db,'OpenCashSession',['operator',ids.branch,0,'']);
  const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id;
  const p=payload({cashSessionId:own,discountCents:100});
  await operation(db,'RequestPosSaleApproval',['operator',p]);
  const approval=(await db.query<{id:string}>('SELECT id FROM pos_approvals')).rows[0]!.id;
  await expect(post(p,'operator')).rejects.toThrow();
  await expect(operation(db,'ApprovePosSale',['operator',approval,true])).rejects.toThrow();
  await operation(db,'ApprovePosSale',['actor',approval,true]);
  await expect(post({...p,discountCents:200},'operator')).rejects.toThrow();
  await post(p,'operator');await post(p,'operator');
  expect(await sales()).toHaveLength(1);expect((await db.query('SELECT status FROM pos_approvals')).rows[0]).toEqual({status:'USED'});
 });
 it('recusa aprovação vencida ou rejeitada sem registrar venda',async()=>{
  await operation(db,'OpenCashSession',['operator',ids.branch,0,'']);
  const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id;
  const p=payload({cashSessionId:own,discountCents:100});await operation(db,'RequestPosSaleApproval',['operator',p]);
  await db.exec("UPDATE pos_approvals SET status='APPROVED',expires_at=now()-interval '1 second'");
  await expect(post(p,'operator')).rejects.toThrow();expect(await sales()).toHaveLength(0);
 });
 it('aprovação comercial não autoriza preço alterado após a decisão',async()=>{
  await operation(db,'OpenCashSession',['operator',ids.branch,0,'']);
  const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id;
  const p=payload({cashSessionId:own,discountCents:100});await operation(db,'RequestPosSaleApproval',['operator',p]);
  const approval=(await db.query<{id:string}>('SELECT id FROM pos_approvals')).rows[0]!.id;await operation(db,'ApprovePosSale',['actor',approval,true]);
  await db.query('UPDATE products SET sale_price_cents=1600 WHERE id=$1',[ids.product]);
  await expect(post(p,'operator')).rejects.toThrow();expect(await sales()).toHaveLength(0);
 });
 it('negativa explícita de acesso bloqueia gestão e criação por API',async()=>{
  await db.query("INSERT INTO user_page_permissions(user_id,tenant_id,page_id,can_access,can_create,can_manage) SELECT 'actor',$1,id,false,true,true FROM app_pages WHERE page_key='CAIXA'",[ids.tenant]);
  await expect(post(payload())).rejects.toThrow();
  await expect(operation(db,'UpdatePosPolicy',['actor',true,0,0,false])).rejects.toThrow();
 });

 it('sangria exige aprovação acima do limite e repetição não duplica dinheiro',async()=>{
  await operation(db,'OpenCashSession',['operator',ids.branch,1000,'']);
  const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id,op=crypto.randomUUID();
  await expect(operation(db,'RegisterCashMovement',['operator',own,'WITHDRAWAL',100,'Sangria teste',op])).rejects.toThrow();
  await operation(db,'RequestPosCashApproval',['operator',{sessionId:own,movementType:'WITHDRAWAL',amountCents:100,description:'Sangria teste',clientOperationId:op}]);
  const approval=(await db.query<{id:string}>('SELECT id FROM pos_approvals')).rows[0]!.id;
  await operation(db,'ApprovePosSale',['actor',approval,true]);
  await expect(operation(db,'RegisterCashMovement',['operator',own,'WITHDRAWAL',200,'Sangria teste',op])).rejects.toThrow();
  await operation(db,'RegisterCashMovement',['operator',own,'WITHDRAWAL',100,'Sangria teste',op]);
  await operation(db,'RegisterCashMovement',['operator',own,'WITHDRAWAL',100,'Sangria teste',op]);
  expect((await db.query("SELECT amount_cents FROM cash_movements WHERE movement_type='WITHDRAWAL'")).rows).toEqual([{amount_cents:-100}]);
  expect((await db.query('SELECT status FROM pos_approvals')).rows[0]).toEqual({status:'USED'});
 });
 it('operador fecha somente dentro da tolerância ou com aprovação do saldo exato',async()=>{
  await operation(db,'OpenCashSession',['operator',ids.branch,1000,'']);
  const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id,op=crypto.randomUUID();
  await operation(db,'UpdatePosPolicy',['actor',true,0,0,true,50,10]);
  await expect(operation(db,'CloseCashSession',['operator',own,900,'Conferência',op])).rejects.toThrow();
  await operation(db,'RequestPosCashApproval',['operator',{sessionId:own,movementType:'CLOSE',amountCents:900,description:'Conferência',clientOperationId:op}]);
  const approval=(await db.query<{id:string}>('SELECT id FROM pos_approvals')).rows[0]!.id;
  await operation(db,'ApprovePosSale',['actor',approval,true]);
  await operation(db,'CloseCashSession',['operator',own,900,'Conferência',op]);
  await operation(db,'CloseCashSession',['operator',own,900,'Conferência',op]);
  await expect(operation(db,'CloseCashSession',['operator',own,950,'Conferência',op])).rejects.toThrow();
  expect((await db.query('SELECT status,difference_cents FROM cash_sessions WHERE id=$1',[own])).rows[0]).toEqual({status:'CLOSED',difference_cents:-100});
 });
 it('aprovação de fechamento perde validade quando o saldo muda',async()=>{
  await operation(db,'OpenCashSession',['operator',ids.branch,1000,'']);
  const own=(await db.query<{id:string}>("SELECT id FROM cash_sessions WHERE opened_by_uid='operator'")).rows[0]!.id,op=crypto.randomUUID();
  await operation(db,'RequestPosCashApproval',['operator',{sessionId:own,movementType:'CLOSE',amountCents:1000,description:'',clientOperationId:op}]);
  const approval=(await db.query<{id:string}>('SELECT id FROM pos_approvals')).rows[0]!.id;await operation(db,'ApprovePosSale',['actor',approval,true]);
  await post(payload({cashSessionId:own}),'operator');
  await expect(operation(db,'CloseCashSession',['operator',own,1000,'',op])).rejects.toThrow();
 });
 it('política e decisão gerencial geram auditoria e sangria nunca excede dinheiro disponível',async()=>{
  await operation(db,'UpdatePosPolicy',['actor',true,0,0,false,100,0]);
  expect((await db.query("SELECT id FROM audit_logs WHERE entity_name='PosPolicy'")).rows).toHaveLength(1);
  await expect(operation(db,'RegisterCashMovement',['actor',session,'WITHDRAWAL',1001,'Teste',crypto.randomUUID()])).rejects.toThrow();
 });
});

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { database, ids, operation, seed } from "./sql-fixture.js";
import type { PGlite } from "@electric-sql/pglite";

let db: PGlite;
beforeAll(async () => { db = await database(); await seed(db); }, 30000);
beforeEach(async () => { await db.exec("BEGIN"); });
afterEach(async () => { await db.exec("ROLLBACK"); });
afterAll(async () => { await db?.close(); });
const order = async () => (await db.query<Record<string, unknown>>("SELECT * FROM sales_channel_orders WHERE id=$1", [ids.order])).rows[0]!;
const event = (status: string, partnerStatus: string, occurredAt = new Date().toISOString()) => ({ status, partnerStatus, occurredAt, eventId: ids.event, workerId: "worker-123", merchantId: "merchant-1" });

describe("PostgreSQL: lifecycle and scope", () => {
  it("does not complete an order on HTTP acknowledgment of readyToPickup", async () => {
    await operation(db,"SystemRecordSalesChannelCommandResult",[ids.command,"worker-123",{success:true,responseCode:202,partnerStatus:"READY_TO_PICKUP"}]);
    expect(await order()).toMatchObject({status:"ACCEPTED",pending_action:"COMPLETE",command_status:"AWAITING_PARTNER",completed_at:null});
  });
  it("does not cancel an order on cancellation request acknowledgment", async () => {
    await db.exec("UPDATE sales_channel_commands SET action='CANCEL'; UPDATE sales_channel_orders SET pending_action='CANCEL'");
    await operation(db,"SystemRecordSalesChannelCommandResult",[ids.command,"worker-123",{success:true,responseCode:202,partnerStatus:"CANCELLATION_REQUESTED"}]);
    expect(await order()).toMatchObject({status:"ACCEPTED",command_status:"AWAITING_PARTNER",rejected_at:null});
  });
  it("confirms synchronous Picking changes and releases the order immediately", async () => {
    await db.exec("UPDATE sales_channel_commands SET action='UPDATE_ITEM'; UPDATE sales_channel_orders SET pending_action='UPDATE_ITEM'");
    await operation(db,"SystemRecordSalesChannelCommandResult",[ids.command,"worker-123",{success:true,awaitingPartner:false,responseCode:204,partnerStatus:"SEPARATION_STARTED"}]);
    expect(await order()).toMatchObject({status:"ACCEPTED",pending_action:null,command_status:"CONFIRMED",partner_status:"SEPARATION_STARTED"});
    expect((await db.query<{status:string}>("SELECT status FROM sales_channel_commands WHERE id=$1",[ids.command])).rows[0]?.status).toBe("CONFIRMED");
  });
  it("preserves a terminal event received before the command response", async () => {
    await operation(db,"SystemApplySalesChannelOrderEvent",[ids.connection,"order-1",event("COMPLETED","CONCLUDED")]);
    await operation(db,"SystemRecordSalesChannelCommandResult",[ids.command,"worker-123",{success:true,responseCode:202}]);
    expect(await order()).toMatchObject({status:"COMPLETED",command_status:"CONFIRMED",pending_action:null});
    expect((await db.query<{status:string}>("SELECT status FROM sales_channel_commands WHERE id=$1",[ids.command])).rows[0]?.status).toBe("CONFIRMED");
  });
  it("applies a terminal event even if an intermediate event was lost", async () => {
    await db.exec("UPDATE sales_channel_orders SET status='PENDING'");
    await operation(db,"SystemApplySalesChannelOrderEvent",[ids.connection,"order-1",event("COMPLETED","CONCLUDED")]);
    expect((await order()).status).toBe("COMPLETED");
  });
  it("rejects out-of-order and duplicate events", async () => {
    const now = new Date().toISOString();
    await operation(db,"SystemApplySalesChannelOrderEvent",[ids.connection,"order-1",event("ACCEPTED","DISPATCHED",now)]);
    const version = (await order()).version;
    await operation(db,"SystemApplySalesChannelOrderEvent",[ids.connection,"order-1",event("PENDING","PLACED",new Date(Date.now()-60000).toISOString())]);
    await operation(db,"SystemApplySalesChannelOrderEvent",[ids.connection,"order-1",event("ACCEPTED","DISPATCHED",now)]);
    expect(await order()).toMatchObject({partner_status:"DISPATCHED",version});
  });
  it("rejects stale leases and cross-merchant event writes", async () => {
    await operation(db,"SystemApplySalesChannelOrderEvent",[ids.connection,"order-1",{...event("COMPLETED","CONCLUDED"),merchantId:"other-merchant"}]);
    expect((await order()).status).toBe("ACCEPTED");
    await db.exec("UPDATE sales_channel_event_inbox SET lease_until=now()-interval '1 second'");
    await operation(db,"SystemApplySalesChannelOrderEvent",[ids.connection,"order-1",event("COMPLETED","CONCLUDED")]);
    expect((await order()).status).toBe("ACCEPTED");
  });
  it("rejects cross-tenant users and enforces branch assignments", async () => {
    expect((await operation(db,"SystemSalesChannelOrderForActor",["actor",ids.order])).rows).toHaveLength(1);
    expect((await operation(db,"SystemSalesChannelOrderForActor",["other",ids.order])).rows).toHaveLength(0);
    await db.query("INSERT INTO user_branches(user_id,tenant_id,branch_id,active) VALUES ('actor',$1,$2,true)",[ids.tenant,ids.otherBranch]);
    expect((await operation(db,"SystemSalesChannelOrderForActor",["actor",ids.order])).rows).toHaveLength(0);
    const result = await operation(db,"SalesChannelOptions",["actor","request-123"]);
    expect((result.rows[0] as {data:{connections:unknown[]}}).data.connections).toHaveLength(0);
    const operations = await operation(db,"SalesChannelOperations",["actor",null,"request-123"]);
    expect((operations.rows[0] as {data:{summary:{eventFailures:number;queuedCommands:number;syncFailures:number}}}).data.summary).toEqual({eventFailures:0,queuedCommands:0,syncFailures:0});
    const workspace = await operation(db,"SalesChannelWorkspace",["actor","request-123"]);
    expect((workspace.rows[0] as {data:{connections:unknown[];mappings:unknown[]}}).data).toMatchObject({connections:[],mappings:[]});
  });
  it("prevents duplicate actions while awaiting the partner", async () => {
    await db.exec("UPDATE sales_channel_orders SET command_status='AWAITING_PARTNER'");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"COMPLETE","",1,"",null,"",0]);
    expect((await db.query("SELECT * FROM sales_channel_commands")).rows).toHaveLength(1);
  });

  it("queues Grocery separation and validates bag item ownership", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE sales_channel_orders SET status='PENDING',pending_action=NULL,command_status='IDLE'");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);
    const separation = (await db.query<{id:string,action:string}>("SELECT id,action FROM sales_channel_commands")).rows[0]!;
    expect(separation.action).toBe("ACCEPT");
    await db.query("UPDATE sales_channel_commands SET status='PROCESSING',locked_by='worker-123',lease_until=now()+interval '5 minutes' WHERE id=$1",[separation.id]);
    await operation(db,"SystemRecordSalesChannelCommandResult",[separation.id,"worker-123",{success:true,awaitingPartner:false,responseCode:204,partnerStatus:"SEPARATION_STARTED"}]);
    expect(await order()).toMatchObject({status:"ACCEPTED",pending_action:null,command_status:"CONFIRMED",partner_status:"SEPARATION_STARTED"});
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"UPDATE_ITEM","",3,"",null,"",2]);
    expect((await db.query("SELECT * FROM sales_channel_commands WHERE action='UPDATE_ITEM'")).rows).toHaveLength(0);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"UPDATE_ITEM","",3,"",ids.orderItem,"",2]);
    const itemCommand = (await db.query<{id:string,action:string,payload:{externalItemId:string;quantity:number}}>("SELECT id,action,payload FROM sales_channel_commands WHERE action='UPDATE_ITEM'")).rows[0]!;
    expect(itemCommand).toMatchObject({action:"UPDATE_ITEM",payload:{externalItemId:"bag-item-1",quantity:2}});
    await db.query("UPDATE sales_channel_commands SET status='PROCESSING',locked_by='worker-123',lease_until=now()+interval '5 minutes' WHERE id=$1",[itemCommand.id]);
    await operation(db,"SystemRecordSalesChannelCommandResult",[itemCommand.id,"worker-123",{success:true,awaitingPartner:false,responseCode:204}]);
    await operation(db,"SystemRefreshSalesChannelOrderAfterPicking",[itemCommand.id,{merchantId:"merchant-1",providerOrderId:"order-1",subtotalCents:3000,deliveryFeeCents:0,discountCents:0,totalCents:3000,items:[{external_item_id:"bag-item-1",name:"Produto",quantity:2,unit_price_cents:1500,total_cents:3000}]}]);
    expect((await db.query<{quantity:string,total_cents:string}>("SELECT quantity::text,total_cents::text FROM sales_channel_order_items WHERE order_id=$1",[ids.order])).rows[0]).toMatchObject({quantity:"2",total_cents:"3000"});
    expect(await order()).toMatchObject({total_cents:3000,pending_action:null,command_status:"CONFIRMED"});
  });
  it("starts Grocery separation for an order accepted outside InsightPad only once", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE sales_channel_orders SET status='ACCEPTED',partner_status='CONFIRMED',pending_action=NULL,command_status='IDLE',version=1");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);
    const command = (await db.query<{id:string}>("SELECT id FROM sales_channel_commands WHERE action='ACCEPT'")).rows[0]!;
    await db.query("UPDATE sales_channel_commands SET status='CONFIRMED' WHERE id=$1",[command.id]);
    await db.query("UPDATE sales_channel_orders SET pending_action=NULL,command_status='CONFIRMED' WHERE id=$1",[ids.order]);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",2,"",null,"",0]);
    expect((await db.query("SELECT id FROM sales_channel_commands WHERE action='ACCEPT'")).rows).toHaveLength(1);
  });
  it("does not retarget a connection with existing orders or mappings", async () => {
    await operation(db,"UpdateSalesChannelConnection",["actor",ids.connection,"Loja","different-merchant",true,"RESTAURANT"]);
    expect((await db.query<{external_store_id:string}>("SELECT external_store_id FROM sales_channel_connections")).rows[0]?.external_store_id).toBe("merchant-1");
    await operation(db,"UpdateSalesChannelConnection",["actor",ids.connection,"Loja","merchant-1",true,"GROCERY"]);
    expect((await db.query<{catalog_profile:string}>("SELECT catalog_profile FROM sales_channel_connections")).rows[0]?.catalog_profile).toBe("RESTAURANT");
  });

  it("acknowledges only events durably stored with the same payload", async () => {
    const payload = {eventId:"provider-event-1",eventType:"PLACED",payloadHash:"a".repeat(64),payload:{id:"provider-event-1"},containsPersonalData:true};
    const first = await operation(db,"SystemRegisterSalesChannelEvent",[ids.connection,payload]);
    const duplicate = await operation(db,"SystemRegisterSalesChannelEvent",[ids.connection,payload]);
    const conflict = await operation(db,"SystemRegisterSalesChannelEvent",[ids.connection,{...payload,payloadHash:"b".repeat(64)}]);
    expect(Number((first.rows[0] as {count:unknown}).count)).toBe(1);
    expect(Number((duplicate.rows[0] as {count:unknown}).count)).toBe(1);
    expect(Number((conflict.rows[0] as {count:unknown}).count)).toBe(0);
  });

  it("queues catalog work only for an assigned Restaurant or Grocery connection", async () => {
    await db.exec("UPDATE sales_channel_sync_jobs SET status='COMPLETED'");
    await db.query("INSERT INTO user_branches(user_id,tenant_id,branch_id,active) VALUES ('actor',$1,$2,true)",[ids.tenant,ids.otherBranch]);
    await operation(db,"RequestSalesChannelSync",["actor",ids.connection,"FULL","request-branch-blocked"]);
    expect(Number((await db.query("SELECT count(*) count FROM sales_channel_sync_jobs")).rows[0]?.count)).toBe(1);
    await db.exec("DELETE FROM user_branches; UPDATE sales_channel_connections SET catalog_profile='GROCERY'");
    await operation(db,"RequestSalesChannelSync",["actor",ids.connection,"FULL","request-grocery-ok"]);
    expect(Number((await db.query("SELECT count(*) count FROM sales_channel_sync_jobs")).rows[0]?.count)).toBe(2);
    await db.exec("UPDATE sales_channel_sync_jobs SET status='COMPLETED'");
    await db.exec("UPDATE sales_channel_connections SET catalog_profile='RESTAURANT'");
    await operation(db,"RequestSalesChannelSync",["actor",ids.connection,"FULL","request-restaurant-ok"]);
    expect(Number((await db.query("SELECT count(*) count FROM sales_channel_sync_jobs")).rows[0]?.count)).toBe(3);
  });

  it("counts only the latest synchronization outcome as an active failure", async () => {
    await db.exec("UPDATE sales_channel_sync_jobs SET status='ERROR',created_at=now()-interval '1 minute'");
    const failed = await operation(db,"SalesChannelOperations",["actor",ids.connection,"request-failed"]);
    expect(Number((failed.rows[0] as {data:{summary:{syncFailures:unknown}}}).data.summary.syncFailures)).toBe(1);

    await db.query(
      "INSERT INTO sales_channel_sync_jobs(id,tenant_id,connection_id,job_key,provider,job_type,status,created_at) VALUES ($1,$2,$3,'authorization-recovered','IFOOD','FULL','COMPLETED',now())",
      ["00000000-0000-4000-8000-000000000014",ids.tenant,ids.connection],
    );
    const recovered = await operation(db,"SalesChannelOperations",["actor",ids.connection,"request-recovered"]);
    expect(Number((recovered.rows[0] as {data:{summary:{syncFailures:unknown}}}).data.summary.syncFailures)).toBe(0);
  });
});

describe("PostgreSQL: catalog checkpoints", () => {
  it("persists Grocery identifiers and accepts only public HTTPS image URLs", async () => {
    await db.exec("UPDATE app_pages SET page_key='CAD_PRODUTO'");
    const payload = {name:"Produto mercado",categoryId:ids.category,internalCode:"SKU-2",ean:"7890000000001",scaleCode:"BAL-01",imageUrl:"https://cdn.example.com/produto.jpg",salePriceCents:2500,costPriceCents:1000,minimumStock:0,maximumStock:10,weightedProduct:false,bundleProduct:false,allowNegativeStock:false};
    await operation(db,"SaveProduct",["actor",ids.product,payload,[]]);
    expect((await db.query<{scale_code:string,image_url:string}>("SELECT scale_code,image_url FROM products WHERE id=$1",[ids.product])).rows[0]).toEqual({scale_code:"BAL-01",image_url:"https://cdn.example.com/produto.jpg"});
    await operation(db,"SaveProduct",["actor",ids.product,{...payload,imageUrl:"http://inseguro.example.com/produto.jpg"},[]]);
    expect((await db.query<{image_url:string}>("SELECT image_url FROM products WHERE id=$1",[ids.product])).rows[0]?.image_url).toBe("https://cdn.example.com/produto.jpg");
  });
  it("blocks changing the Grocery barcode until the old partner item is deactivated", async () => {
    await db.exec("UPDATE app_pages SET page_key='CAD_PRODUTO'; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE sales_channel_product_mappings SET external_product_id='7890000000000'");
    const payload = {name:"Produto",categoryId:ids.category,internalCode:"SKU-1",ean:"7890000000002",salePriceCents:1500,costPriceCents:1000,minimumStock:0,maximumStock:10,weightedProduct:false,bundleProduct:false,allowNegativeStock:false};
    await operation(db,"SaveProduct",["actor",ids.product,payload,[]]);
    expect((await db.query<{ean:string}>("SELECT ean FROM products WHERE id=$1",[ids.product])).rows[0]?.ean).toBe("7890000000000");
  });
  it("derives a Grocery mapping from EAN or scale code and rejects products without either", async () => {
    await db.exec("DELETE FROM sales_channel_product_mappings; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE products SET ean=NULL,scale_code=NULL");
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"","",true,true]);
    expect((await db.query("SELECT id FROM sales_channel_product_mappings")).rows).toHaveLength(0);
    await db.exec("UPDATE products SET scale_code='BAL-01'");
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"","",true,true]);
    expect((await db.query<{external_product_id:string}>("SELECT external_product_id FROM sales_channel_product_mappings")).rows[0]?.external_product_id).toBe("BAL-01");
  });
  it("deactivates Grocery products on archive and forces full publication on restore", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE app_pages SET page_key='CAD_PRODUTO'; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE sales_channel_product_mappings SET last_synced_at=now(),sync_status='COMPLETED'");
    await operation(db,"SetProductStatus",["actor",ids.product,false]);
    expect((await db.query<{action:string,payload:{barcode:string}}>("SELECT action,payload FROM sales_channel_commands")).rows[0]).toMatchObject({action:"DEACTIVATE_PRODUCT",payload:{barcode:"item-1"}});
    await db.exec("DELETE FROM sales_channel_commands");
    await operation(db,"SetProductStatus",["actor",ids.product,true]);
    expect((await db.query<{last_synced_at:string|null,sync_status:string}>("SELECT last_synced_at,sync_status FROM sales_channel_product_mappings WHERE id=$1",[ids.mapping])).rows[0]).toMatchObject({last_synced_at:null,sync_status:"PENDING"});
  });
  it("queues Grocery deactivation before archiving a published mapping", async () => {
    await db.exec("UPDATE sales_channel_connections SET catalog_profile='GROCERY'");
    await operation(db,"ArchiveSalesChannelProductMapping",["actor",ids.mapping]);
    const command = (await db.query<{id:string,action:string,payload:{barcode:string;name:string}}>("SELECT id,action,payload FROM sales_channel_commands WHERE action='DEACTIVATE_PRODUCT'")).rows[0]!;
    expect(command).toMatchObject({action:"DEACTIVATE_PRODUCT",payload:{barcode:"item-1",name:"Produto"}});
    expect((await db.query<{active:boolean}>("SELECT active FROM sales_channel_product_mappings WHERE id=$1",[ids.mapping])).rows[0]?.active).toBe(false);
    await db.query("UPDATE sales_channel_commands SET status='PROCESSING',locked_by='worker-123',lease_until=now()+interval '5 minutes' WHERE id=$1",[command.id]);
    await operation(db,"SystemRecordSalesChannelCommandResult",[command.id,"worker-123",{success:true,awaitingPartner:false,responseCode:202}]);
    expect((await db.query<{status:string}>("SELECT status FROM sales_channel_commands WHERE id=$1",[command.id])).rows[0]?.status).toBe("CONFIRMED");
  });
  it("protects mapping results with a lease and the original version", async () => {
    const payload = {success:true,jobId:ids.job,workerId:"worker-123",expectedVersion:1,snapshotAt:new Date().toISOString()};
    await operation(db,"SystemRecordSalesChannelMappingResult",[ids.mapping,{...payload,workerId:"other-worker"}]);
    expect((await db.query("SELECT last_synced_at FROM sales_channel_product_mappings")).rows[0]).toMatchObject({last_synced_at:null});
    await operation(db,"SystemRecordSalesChannelMappingResult",[ids.mapping,payload]);
    const result = (await db.query("SELECT version,last_synced_at FROM sales_channel_product_mappings")).rows[0];
    expect(result).toMatchObject({version:2});
    await operation(db,"SystemRecordSalesChannelMappingResult",[ids.mapping,{...payload,success:false}]);
    expect((await db.query("SELECT sync_status FROM sales_channel_product_mappings")).rows[0]).toMatchObject({sync_status:"COMPLETED"});
  });
  it("requeues a continuation without spending a retry attempt", async () => {
    const healthBefore = (await db.query("SELECT last_health_check_at,consecutive_failures FROM sales_channel_connections WHERE id=$1",[ids.connection])).rows[0];
    await operation(db,"SystemRecordSalesChannelSyncResult",[ids.job,"worker-123",{success:true,continuation:true,cursor:ids.mapping,totalItems:30,processedItems:6,failedItems:0}]);
    expect((await db.query("SELECT status,attempts,cursor,processed_items,finished_at FROM sales_channel_sync_jobs")).rows[0]).toMatchObject({status:"QUEUED",attempts:0,cursor:ids.mapping,processed_items:6,finished_at:null});
    expect((await db.query("SELECT last_health_check_at,consecutive_failures FROM sales_channel_connections WHERE id=$1",[ids.connection])).rows[0]).toEqual(healthBefore);
  });
  it("requires job ownership to read product values", async () => {
    expect((await operation(db,"SystemSalesChannelMappingsForSync",[ids.job,"worker-123","request-123"])).rows).toHaveLength(1);
    expect((await operation(db,"SystemSalesChannelMappingsForSync",[ids.job,"other-worker","request-123"])).rows).toHaveLength(0);
  });
});

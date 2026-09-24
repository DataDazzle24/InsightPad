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
  it("closes an unknown Picking result only after reconciliation proves it was applied", async () => {
    const reconciliation="00000000-0000-4000-8000-000000000041";
    await db.query("UPDATE sales_channel_commands SET action='UPDATE_ITEM',status='ERROR',outcome_unknown=true,reconciliation_due_at=now(),payload=jsonb_build_object('externalItemId','bag-item-1','quantity',2) WHERE id=$1",[ids.command]);
    await db.exec("UPDATE sales_channel_orders SET pending_action='UPDATE_ITEM',command_status='RECONCILIATION_REQUIRED'");
    await db.query("INSERT INTO sales_channel_commands(id,tenant_id,connection_id,order_id,command_key,provider,action,payload,status,attempts,scheduled_at,locked_by,lease_until,created_at,updated_at) VALUES ($1,$2,$3,$4,'reconcile-applied','IFOOD','RECONCILE_ORDER',jsonb_build_object('sourceCommandId',$5::text),'PROCESSING',0,now(),'worker-123',now()+interval '5 minutes',now(),now())",[reconciliation,ids.tenant,ids.connection,ids.order,ids.command]);

    const work=await operation(db,"SystemSalesChannelWorkQueue",["worker-123","reconcile-work"]);
    expect((work.rows[0] as {data:{commands:unknown[]}}).data.commands).toEqual([expect.objectContaining({id:reconciliation,sourceAction:"UPDATE_ITEM",sourceOutcomeUnknown:true,sourcePayload:{externalItemId:"bag-item-1",quantity:2}})]);

    await operation(db,"SystemRecordSalesChannelCommandResult",[reconciliation,"worker-123",{success:true,awaitingPartner:false,responseCode:200,partnerStatus:"SEPARATION_STARTED"}]);

    expect(await order()).toMatchObject({pending_action:null,command_status:"CONFIRMED"});
    expect((await db.query<{status:string;outcome_unknown:boolean;last_error:string|null}>("SELECT status,outcome_unknown,last_error FROM sales_channel_commands WHERE id=$1",[ids.command])).rows[0]).toEqual({status:"CONFIRMED",outcome_unknown:false,last_error:null});
  });
  it("releases an unknown Picking result for an explicit retry when reconciliation proves it was not applied", async () => {
    const reconciliation="00000000-0000-4000-8000-000000000042";
    await db.query("UPDATE sales_channel_commands SET action='UPDATE_ITEM',status='ERROR',outcome_unknown=true,reconciliation_due_at=now(),payload=jsonb_build_object('externalItemId','bag-item-1','quantity',2) WHERE id=$1",[ids.command]);
    await db.exec("UPDATE sales_channel_orders SET pending_action='UPDATE_ITEM',command_status='RECONCILIATION_REQUIRED'");
    await db.query("INSERT INTO sales_channel_commands(id,tenant_id,connection_id,order_id,command_key,provider,action,payload,status,attempts,scheduled_at,locked_by,lease_until,created_at,updated_at) VALUES ($1,$2,$3,$4,'reconcile-not-applied','IFOOD','RECONCILE_ORDER',jsonb_build_object('sourceCommandId',$5::text),'PROCESSING',0,now(),'worker-123',now()+interval '5 minutes',now(),now())",[reconciliation,ids.tenant,ids.connection,ids.order,ids.command]);

    await operation(db,"SystemRecordSalesChannelCommandResult",[reconciliation,"worker-123",{success:true,awaitingPartner:false,reconciliationNotApplied:true,error:"Alteração não aplicada",responseCode:200,partnerStatus:"SEPARATION_STARTED"}]);

    expect(await order()).toMatchObject({pending_action:null,command_status:"ERROR"});
    expect((await db.query<{status:string;outcome_unknown:boolean;last_error:string|null}>("SELECT status,outcome_unknown,last_error FROM sales_channel_commands WHERE id=$1",[ids.command])).rows[0]).toEqual({status:"ERROR",outcome_unknown:false,last_error:"Alteração não aplicada"});
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
    const operations = await operation(db,"SalesChannelOperations",["actor",null,50,"request-123"]);
    expect((operations.rows[0] as {data:{summary:{eventFailures:number;queuedCommands:number;syncFailures:number}}}).data.summary).toEqual({eventFailures:0,queuedCommands:0,syncFailures:0});
    const workspace = await operation(db,"SalesChannelWorkspace",["actor","request-123"]);
    expect((workspace.rows[0] as {data:{connections:unknown[];mappings:unknown[]}}).data).toMatchObject({connections:[],mappings:[]});
  });
  it("exports management data in one tenant-scoped query only with export permission", async () => {
    await db.exec("UPDATE role_page_permissions SET can_export=true");
    const allowed = await operation(db,"ExportSalesChannelManagement",["actor","CONNECTIONS","","","",null,null,"export-request"]);
    expect((allowed.rows[0] as {data:{connections:Array<{id:string}>;products:unknown[]}}).data).toMatchObject({
      connections:[expect.objectContaining({id:ids.connection})],
      products:[],
    });
    const denied = await operation(db,"ExportSalesChannelManagement",["other","CONNECTIONS","","","",null,null,"export-denied"]);
    expect(denied.rows).toHaveLength(0);
  });

  it("returns aggregate health metrics without exposing tenant records", async () => {
    const result = await operation(db,"SystemSalesChannelHealthMetrics",["health-request"]);
    expect((result.rows[0] as {data:Record<string, unknown>}).data).toMatchObject({
      activeConnections:1,
      unhealthyConnections:0,
      eventErrors:0,
      commandErrors:0,
      syncErrors:0,
      catalogReceiptsToVerify:0,
      commerceBlocked:0,
      financialPending:0,
    });
  });
  it("prevents duplicate actions while awaiting the partner", async () => {
    await db.exec("UPDATE sales_channel_orders SET command_status='AWAITING_PARTNER'");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"COMPLETE","",1,"",null,"",0]);
    expect((await db.query("SELECT * FROM sales_channel_commands")).rows).toHaveLength(1);
  });

  it("acknowledges an order alert per user and shows it again after the order changes", async () => {
    await db.exec("UPDATE sales_channel_orders SET status='PENDING',command_status='IDLE',pending_action=NULL,version=7");
    const visible = await operation(db,"LatestPendingSalesChannelOrder",["actor","alert-query-1"]);
    expect((visible.rows[0] as {data:{orders:unknown[]}}).data.orders).toHaveLength(1);

    await operation(db,"AcknowledgeSalesChannelOrderAlert",["actor",ids.order,7,"RECEPTION"]);
    const hidden = await operation(db,"LatestPendingSalesChannelOrder",["actor","alert-query-2"]);
    expect((hidden.rows[0] as {data:{orders:unknown[]}}).data.orders).toHaveLength(0);

    await db.exec("UPDATE sales_channel_orders SET version=8");
    const changed = await operation(db,"LatestPendingSalesChannelOrder",["actor","alert-query-3"]);
    expect((changed.rows[0] as {data:{orders:unknown[]}}).data.orders).toHaveLength(1);
  });

  it("records and clears partner attention even when the order snapshot is unchanged", async () => {
    await db.query("UPDATE sales_channel_orders SET idempotency_key=$1,snapshot_hash='same-order',attention_type=NULL,attention_deadline_at=NULL,attention_data=NULL WHERE id=$2",[`${ids.tenant}:IFOOD:order-1`,ids.order]);
    const payload = {
      merchantId:"merchant-1",eventId:ids.event,workerId:"worker-123",providerOrderId:"order-1",displayCode:"1234",reconciledStatus:"ACCEPTED",partnerStatus:"CONFIRMED",
      customerName:"Cliente",orderType:"DELIVERY",paymentMethod:"",deliveryProvider:"IFOOD",deliveryAddress:"Rua teste",notes:"",subtotalCents:1500,deliveryFeeCents:0,discountCents:0,
      additionalFeeCents:0,prepaidCents:0,pendingPaymentCents:0,merchantDiscountCents:0,ifoodDiscountCents:0,totalCents:1500,scheduledAt:"",preparationStartAt:"",
      snapshotHash:"same-order",commerceSourceHash:"same-commerce",receivedAt:new Date().toISOString(),items:[{external_item_id:"bag-item-1",external_product_id:"item-1",ean:"",name:"Produto",quantity:1,unit_price_cents:1500,total_cents:1500,observation:""}],
    };
    await operation(db,"SystemIngestSalesChannelOrder",[ids.connection,{...payload,attentionType:"HANDSHAKE",attentionDeadlineAt:"2026-09-21T12:00:00.000Z",attentionData:{eventType:"HANDSHAKE_DISPUTE"}}]);
    expect(await order()).toMatchObject({attention_type:"HANDSHAKE",attention_data:{eventType:"HANDSHAKE_DISPUTE"}});

    await operation(db,"SystemIngestSalesChannelOrder",[ids.connection,{...payload,clearAttention:true}]);
    expect(await order()).toMatchObject({attention_type:null,attention_deadline_at:null,attention_data:null});
  });

  it("loads sensitive order details only for an authorized branch on demand", async () => {
    await db.query("INSERT INTO sales_channel_order_payments(id,tenant_id,order_id,payment_key,method,prepaid,amount_cents,sequence) VALUES (gen_random_uuid(),$1,$2,'detail-pay','PIX',true,1500,1)",[ids.tenant,ids.order]);
    const allowed = await operation(db,"SalesChannelOrderDetails",["actor",ids.order,"details-request"]);
    expect((allowed.rows[0] as {data:{detailsLoaded:boolean;payments:unknown[]}}).data).toMatchObject({detailsLoaded:true,payments:[expect.objectContaining({method:"PIX"})]});
    const denied = await operation(db,"SalesChannelOrderDetails",["other",ids.order,"details-denied"]);
    expect(denied.rows).toHaveLength(0);
  });

  it("claims at most one command per order at a time", async () => {
    await db.exec("DELETE FROM sales_channel_commands; DELETE FROM sales_channel_event_inbox; DELETE FROM sales_channel_sync_jobs");
    await db.query("INSERT INTO sales_channel_commands(id,tenant_id,connection_id,order_id,command_key,provider,action,status,scheduled_at) VALUES ('00000000-0000-4000-8000-000000000031',$1,$2,$3,'serial-1','IFOOD','ACCEPT','QUEUED',now()),('00000000-0000-4000-8000-000000000032',$1,$2,$3,'serial-2','IFOOD','COMPLETE','QUEUED',now())",[ids.tenant,ids.connection,ids.order]);
    await operation(db,"SystemClaimSalesChannelWork",["IFOOD","worker-serial",10]);
    expect((await db.query<{status:string}>("SELECT status FROM sales_channel_commands ORDER BY id")).rows).toEqual([{status:"PROCESSING"},{status:"QUEUED"}]);
  });

  it("queues Grocery separation and validates bag item ownership", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE sales_channel_orders SET status='PENDING',pending_action=NULL,command_status='IDLE'");
    await db.query("UPDATE sales_channel_order_items SET product_id=$1,mapping_status='MAPPED' WHERE id=$2",[ids.product,ids.orderItem]);
    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,10)",[ids.tenant,ids.branch,ids.product]);
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
  it("blocks Grocery item changes and completion outside an open separation", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE sales_channel_orders SET status='ACCEPTED',partner_status='CONFIRMED',pending_action=NULL,command_status='IDLE',version=1");
    await db.query("INSERT INTO sales_channel_commands(id,tenant_id,connection_id,order_id,command_key,provider,action,status,attempts,scheduled_at,created_at,updated_at) VALUES (gen_random_uuid(),$1,$2,$3,'confirmed-separation-start','IFOOD','ACCEPT','CONFIRMED',1,now(),now(),now())",[ids.tenant,ids.connection,ids.order]);

    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"COMPLETE","",1,"",null,"",0]);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"UPDATE_ITEM","",1,"",ids.orderItem,"",2]);
    expect((await db.query("SELECT id FROM sales_channel_commands WHERE action IN ('COMPLETE','UPDATE_ITEM')")).rows).toHaveLength(0);

    await db.exec("UPDATE sales_channel_orders SET partner_status='SEPARATION_ENDED'");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"UPDATE_ITEM","",1,"",ids.orderItem,"",2]);
    expect((await db.query("SELECT id FROM sales_channel_commands WHERE action='UPDATE_ITEM'")).rows).toHaveLength(0);

    await db.exec("UPDATE sales_channel_orders SET partner_status='SEPARATION_STARTED'");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"COMPLETE","",1,"",null,"",0]);
    expect((await db.query("SELECT id FROM sales_channel_commands WHERE action='COMPLETE'")).rows).toHaveLength(1);
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
    await operation(db,"UpdateSalesChannelConnection",["actor",ids.connection,"Loja","different-merchant",true]);
    expect((await db.query<{external_store_id:string}>("SELECT external_store_id FROM sales_channel_connections")).rows[0]?.external_store_id).toBe("merchant-1");
    await operation(db,"UpdateSalesChannelConnection",["actor",ids.connection,"Loja","merchant-1",true]);
    expect((await db.query<{catalog_profile:string}>("SELECT catalog_profile FROM sales_channel_connections")).rows[0]?.catalog_profile).toBe("RESTAURANT");
  });

  it("connects a merchant atomically with manage permission only", async () => {
    await db.exec("DELETE FROM sales_channel_commands; DELETE FROM sales_channel_event_inbox; DELETE FROM sales_channel_sync_jobs; DELETE FROM sales_channel_order_items; DELETE FROM sales_channel_orders; DELETE FROM sales_channel_product_mappings");
    await db.exec("UPDATE role_page_permissions SET can_update=false,can_manage=true; UPDATE sales_channel_connections SET external_store_id=NULL,status='DRAFT',authorization_status='NOT_CONNECTED',catalog_profile='UNVERIFIED'");
    await operation(db,"ConnectSalesChannelMerchant",["actor",ids.connection,"merchant-selected","authorization-request"]);
    expect((await db.query<{external_store_id:string;status:string;authorization_status:string}>("SELECT external_store_id,status,authorization_status FROM sales_channel_connections WHERE id=$1",[ids.connection])).rows[0]).toEqual({
      external_store_id:"merchant-selected",status:"PENDING_APPROVAL",authorization_status:"PENDING",
    });
    expect((await db.query<{job_type:string;status:string}>("SELECT job_type,status FROM sales_channel_sync_jobs WHERE connection_id=$1",[ids.connection])).rows).toEqual([
      {job_type:"AUTHORIZATION",status:"QUEUED"},
    ]);
  });

  it("denies merchant connection without manage permission", async () => {
    await db.exec("DELETE FROM sales_channel_commands; DELETE FROM sales_channel_event_inbox; DELETE FROM sales_channel_sync_jobs; DELETE FROM sales_channel_order_items; DELETE FROM sales_channel_orders; DELETE FROM sales_channel_product_mappings");
    await db.exec("UPDATE role_page_permissions SET can_update=true,can_manage=false; UPDATE sales_channel_connections SET external_store_id=NULL,status='DRAFT',authorization_status='NOT_CONNECTED',catalog_profile='UNVERIFIED'");
    await operation(db,"ConnectSalesChannelMerchant",["actor",ids.connection,"merchant-selected","authorization-request"]);
    expect((await db.query<{external_store_id:string|null}>("SELECT external_store_id FROM sales_channel_connections WHERE id=$1",[ids.connection])).rows[0]?.external_store_id).toBeNull();
    expect((await db.query("SELECT id FROM sales_channel_sync_jobs WHERE job_type='AUTHORIZATION'")).rows).toHaveLength(0);
  });

  it("does not retarget a merchant connection that already has history", async () => {
    await operation(db,"ConnectSalesChannelMerchant",["actor",ids.connection,"different-merchant","authorization-request"]);
    expect((await db.query<{external_store_id:string}>("SELECT external_store_id FROM sales_channel_connections WHERE id=$1",[ids.connection])).rows[0]?.external_store_id).toBe("merchant-1");
    expect((await db.query("SELECT id FROM sales_channel_sync_jobs WHERE job_type='AUTHORIZATION'")).rows).toHaveLength(0);
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

  it("stores event batches atomically and rejects a conflicting hash", async () => {
    const payload = (id:string,hash:string) => ({eventId:id,eventType:"PLACED",payloadHash:hash,payload:{id},containsPersonalData:true,source:"WEBHOOK"});
    const first = await operation(db,"SystemRegisterSalesChannelEvents",[ids.connection,[payload("batch-1","a".repeat(64)),payload("batch-2","b".repeat(64))]]);
    expect(Number((first.rows[0] as {count:unknown}).count)).toBe(2);
    const conflict = await operation(db,"SystemRegisterSalesChannelEvents",[ids.connection,[payload("batch-1","c".repeat(64)),payload("batch-3","d".repeat(64))]]);
    expect(Number((conflict.rows[0] as {count:unknown}).count)).toBe(0);
    expect((await db.query("SELECT provider_event_id FROM sales_channel_event_inbox WHERE provider_event_id='batch-3'")).rows).toHaveLength(0);
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

  it("validates the financial module on demand before enabling low-cost hourly reconciliation", async () => {
    await db.exec(`DELETE FROM sales_channel_sync_jobs; UPDATE sales_channel_product_mappings SET sync_price=false,sync_stock=false; UPDATE sales_channel_connections SET capabilities='{"financial":"REQUIRES_FINANCIAL_APPROVAL"}'::jsonb,last_financial_sync_at=NULL`);
    await operation(db,"SystemQueueDueSalesChannelSyncJobs",["financial-gate-request"]);
    expect((await db.query("SELECT id FROM sales_channel_sync_jobs WHERE job_type='FINANCIAL'")).rows).toHaveLength(0);

    await operation(db,"RequestSalesChannelSync",["actor",ids.connection,"FINANCIAL","financial-manual-request"]);
    const job=(await db.query<{id:string}>("SELECT id FROM sales_channel_sync_jobs WHERE job_type='FINANCIAL'")).rows[0]!;
    await db.query("UPDATE sales_channel_sync_jobs SET status='PROCESSING',locked_by='worker-123',lease_until=now()+interval '5 minutes' WHERE id=$1",[job.id]);
    await operation(db,"SystemRecordSalesChannelSyncResult",[job.id,"worker-123",{success:true,totalItems:0,processedItems:0,failedItems:0}]);
    const capability = (await db.query<{financial:{state:string;source:string};last_financial_sync_at:Date|null}>("SELECT capabilities->'financial' financial,last_financial_sync_at FROM sales_channel_connections WHERE id=$1",[ids.connection])).rows[0];
    expect(capability).toMatchObject({financial:{state:"VERIFIED",source:"FINANCIAL_SYNC"},last_financial_sync_at:expect.any(Date)});
  });

  it("queues the first financial validation automatically after authorization", async () => {
    const authorizationJob="00000000-0000-4000-8000-000000000071";
    await db.exec("DELETE FROM sales_channel_sync_jobs");
    await db.query("UPDATE sales_channel_connections SET status='PENDING_APPROVAL',authorization_status='PENDING',catalog_profile='UNVERIFIED',capabilities='{}'::jsonb WHERE id=$1",[ids.connection]);
    await db.query("INSERT INTO sales_channel_sync_jobs(id,tenant_id,connection_id,job_key,provider,job_type,status,attempts,scheduled_at,locked_by,lease_until,created_at,updated_at) VALUES ($1,$2,$3,'authorization-initial-financial','IFOOD','AUTHORIZATION','PROCESSING',0,now(),'worker-123',now()+interval '5 minutes',now(),now())",[authorizationJob,ids.tenant,ids.connection]);
    await operation(db,"SystemUpdateSalesChannelConnection",[ids.connection,{externalStoreId:"merchant-1",expectedExternalStoreId:"merchant-1",jobId:authorizationJob,workerId:"worker-123",status:"ACTIVE",authorizationStatus:"AUTHORIZED",catalogProfile:"GROCERY",success:true,capabilities:{financial:{state:"PENDING"}}}]);
    await operation(db,"SystemRecordSalesChannelSyncResult",[authorizationJob,"worker-123",{success:true,totalItems:1,processedItems:1,failedItems:0}]);

    expect((await db.query<{job_type:string;status:string}>("SELECT job_type,status FROM sales_channel_sync_jobs WHERE job_type='FINANCIAL'")).rows).toEqual([{job_type:"FINANCIAL",status:"QUEUED"}]);
  });

  it("counts only the latest synchronization outcome as an active failure", async () => {
    await db.exec("UPDATE sales_channel_sync_jobs SET status='ERROR',created_at=now()-interval '1 minute'");
    const failed = await operation(db,"SalesChannelOperations",["actor",ids.connection,50,"request-failed"]);
    expect(Number((failed.rows[0] as {data:{summary:{syncFailures:unknown}}}).data.summary.syncFailures)).toBe(1);

    await db.query(
      "INSERT INTO sales_channel_sync_jobs(id,tenant_id,connection_id,job_key,provider,job_type,status,created_at) VALUES ($1,$2,$3,'authorization-recovered','IFOOD','FULL','COMPLETED',now())",
      ["00000000-0000-4000-8000-000000000014",ids.tenant,ids.connection],
    );
    const recovered = await operation(db,"SalesChannelOperations",["actor",ids.connection,50,"request-recovered"]);
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
  it("accepts every safe package range exposed by the product interface", async () => {
    await db.exec("UPDATE app_pages SET page_key='CAD_PRODUTO'");
    const payload = {name:"Produto",categoryId:ids.category,internalCode:"SKU-1",ean:"7890000000000",salePriceCents:2500,costPriceCents:1000,minimumStock:0,maximumStock:10,weightedProduct:false,bundleProduct:false,allowNegativeStock:false,sizeType:"ML",size:"1000"};
    await operation(db,"SaveProduct",["actor",ids.product,payload,[]]);
    expect((await db.query<{size_type:string;size:string}>("SELECT size_type,size FROM products WHERE id=$1",[ids.product])).rows[0]).toEqual({size_type:"ML",size:"1000"});
    await operation(db,"SaveProduct",["actor",ids.product,{...payload,sizeType:"UN",size:"5"},[]]);
    expect((await db.query<{size_type:string;size:string}>("SELECT size_type,size FROM products WHERE id=$1",[ids.product])).rows[0]).toEqual({size_type:"UN",size:"5"});
  });
  it("requires a channel-compatible promotional discount above five percent", async () => {
    await db.exec("UPDATE app_pages SET page_key='CAD_PRODUTO'");
    await db.query("UPDATE products SET sale_price_cents=10000 WHERE id=$1",[ids.product]);
    const starts = new Date(Date.now()+60_000).toISOString();
    const ends = new Date(Date.now()+3_600_000).toISOString();
    await operation(db,"SavePromotion",["actor",null,ids.product,9500,starts,ends]);
    expect((await db.query("SELECT id FROM promotions")).rows).toHaveLength(0);
    await operation(db,"SavePromotion",["actor",null,ids.product,9499,starts,ends]);
    expect((await db.query("SELECT id FROM promotions")).rows).toHaveLength(1);
  });
  it("blocks changing the Grocery barcode until the old partner item is deactivated", async () => {
    await db.exec("UPDATE app_pages SET page_key='CAD_PRODUTO'; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE sales_channel_product_mappings SET external_product_id='7890000000000'");
    const payload = {name:"Produto",categoryId:ids.category,internalCode:"SKU-1",ean:"7890000000002",salePriceCents:1500,costPriceCents:1000,minimumStock:0,maximumStock:10,weightedProduct:false,bundleProduct:false,allowNegativeStock:false};
    await operation(db,"SaveProduct",["actor",ids.product,payload,[]]);
    expect((await db.query<{ean:string}>("SELECT ean FROM products WHERE id=$1",[ids.product])).rows[0]?.ean).toBe("7890000000000");
  });
  it("validates Grocery GTIN checksums and accepts a safe scale code fallback", async () => {
    await db.exec("DELETE FROM sales_channel_product_mappings; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE products SET ean=NULL,scale_code=NULL");
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"","",true,true,"PRODUCT",null,"NEW"]);
    expect((await db.query("SELECT id FROM sales_channel_product_mappings")).rows).toHaveLength(0);

    await db.exec("UPDATE products SET ean='7890000000002'");
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"","",true,true,"PRODUCT",null,"NEW"]);
    expect((await db.query("SELECT id FROM sales_channel_product_mappings")).rows).toHaveLength(0);

    await db.exec("UPDATE products SET ean='7890000000000'");
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"","",true,true,"PRODUCT",null,"NEW"]);
    expect((await db.query<{external_product_id:string}>("SELECT external_product_id FROM sales_channel_product_mappings")).rows[0]?.external_product_id).toBe("7890000000000");

    await db.exec("DELETE FROM sales_channel_product_mappings; UPDATE products SET ean=NULL,scale_code='BAL-01'");
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"","",true,true,"PRODUCT",null,"NEW"]);
    expect((await db.query<{external_product_id:string}>("SELECT external_product_id FROM sales_channel_product_mappings")).rows[0]?.external_product_id).toBe("BAL-01");
  });
  it("queues an automatic catalog synchronization when a product is saved", async () => {
    await db.exec("DELETE FROM sales_channel_product_mappings; DELETE FROM sales_channel_sync_jobs");
    await db.query("INSERT INTO sales_channel_sync_jobs(id,tenant_id,connection_id,job_key,provider,job_type,status,scheduled_at,locked_by,lease_until) VALUES (gen_random_uuid(),$1,$2,'sync-already-processing','IFOOD','FULL','PROCESSING',now(),'worker-existing',now()+interval '5 minutes')",[ids.tenant,ids.connection]);
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"existing-item-1","Produto iFood",true,true,"CUSTOM",1890,"EXISTING"]);
    expect((await db.query<{price_mode:string;custom_price_cents:string;remote_product_state:string}>("SELECT price_mode,custom_price_cents::text,remote_product_state FROM sales_channel_product_mappings")).rows).toEqual([{price_mode:"CUSTOM",custom_price_cents:"1890",remote_product_state:"EXISTING"}]);
    expect((await db.query<{job_type:string;status:string}>("SELECT job_type,status FROM sales_channel_sync_jobs ORDER BY status")).rows).toEqual([{job_type:"FULL",status:"PROCESSING"},{job_type:"FULL",status:"QUEUED"}]);
  });
  it("accepts bundle products only after every active component is configured", async () => {
    await db.exec("DELETE FROM sales_channel_product_mappings; UPDATE products SET bundle_product=true");
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"item-combo","Combo",true,true,"PRODUCT",null,"EXISTING"]);
    expect((await db.query("SELECT id FROM sales_channel_product_mappings")).rows).toHaveLength(0);
    const component="00000000-0000-4000-8000-000000000019";
    await db.query("INSERT INTO products(id,tenant_id,category_id,name,internal_code,sale_price_cents) VALUES ($1,$2,$3,'Componente','COMP-1',500)",[component,ids.tenant,ids.category]);
    await db.query("INSERT INTO product_components(tenant_id,parent_product_id,component_product_id,quantity) VALUES ($1,$2,$3,2)",[ids.tenant,ids.product,component]);
    await operation(db,"CreateSalesChannelProductMapping",["actor",ids.connection,ids.product,"item-combo","Combo",true,true,"CUSTOM",3200,"EXISTING"]);
    expect((await db.query<{price_mode:string;custom_price_cents:string}>("SELECT price_mode,custom_price_cents::text FROM sales_channel_product_mappings")).rows).toEqual([{price_mode:"CUSTOM",custom_price_cents:"3200"}]);
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
    const payload = {success:true,jobId:ids.job,workerId:"worker-123",expectedVersion:1,snapshotAt:new Date().toISOString(),confirmationState:"RECEIVED",partnerOperationId:"batch-123"};
    await operation(db,"SystemRecordSalesChannelMappingResult",[ids.mapping,{...payload,workerId:"other-worker"}]);
    expect((await db.query("SELECT last_synced_at FROM sales_channel_product_mappings")).rows[0]).toMatchObject({last_synced_at:null});
    await operation(db,"SystemRecordSalesChannelMappingResult",[ids.mapping,payload]);
    const result = (await db.query("SELECT version,last_synced_at,publication_status,partner_operation_id,partner_accepted_at,partner_confirmed_at,partner_confirmation_due_at FROM sales_channel_product_mappings")).rows[0];
    expect(result).toMatchObject({version:2,publication_status:"RECEIVED",partner_operation_id:"batch-123",partner_accepted_at:expect.any(Date),partner_confirmed_at:null,partner_confirmation_due_at:expect.any(Date)});
    await operation(db,"SystemRecordSalesChannelMappingResult",[ids.mapping,{...payload,success:false}]);
    expect((await db.query("SELECT sync_status FROM sales_channel_product_mappings")).rows[0]).toMatchObject({sync_status:"COMPLETED"});
  });
  it("confirms a received Restaurant batch without resending or creating a sync loop", async () => {
    await db.exec(`
      DELETE FROM sales_channel_sync_jobs;
      UPDATE sales_channel_product_mappings
      SET publication_status='RECEIVED',sync_status='COMPLETED',partner_operation_id='batch-durable',
        partner_accepted_at=now()-interval '31 minutes',partner_confirmation_due_at=now()-interval '1 minute',
        last_synced_at=now(),updated_at=now();
    `);
    await operation(db,"SystemQueueDueSalesChannelSyncJobs",["catalog-confirmation-request"]);
    const queued=(await db.query<{id:string;job_type:string}>("SELECT id,job_type FROM sales_channel_sync_jobs")).rows;
    expect(queued).toEqual([{id:expect.any(String),job_type:"CATALOG_CONFIRMATION"}]);

    await db.query("UPDATE sales_channel_sync_jobs SET status='PROCESSING',locked_by='worker-123',lease_until=now()+interval '5 minutes' WHERE id=$1",[queued[0]!.id]);
    const due=(await operation(db,"SystemSalesChannelMappingsForSync",[queued[0]!.id,"worker-123","catalog-confirmation-read"])).rows[0] as {mappingId:string;version:number;snapshotAt:Date;partnerOperationId:string};
    expect(due).toMatchObject({mappingId:ids.mapping,partnerOperationId:"batch-durable"});
    await operation(db,"SystemRecordSalesChannelMappingResult",[ids.mapping,{success:true,confirmationState:"CONFIRMED",partnerOperationId:"batch-durable",jobId:queued[0]!.id,workerId:"worker-123",expectedVersion:due.version,snapshotAt:due.snapshotAt}]);
    expect((await db.query("SELECT publication_status,partner_confirmed_at,partner_confirmation_due_at FROM sales_channel_product_mappings")).rows[0]).toMatchObject({publication_status:"CONFIRMED",partner_confirmed_at:expect.any(Date),partner_confirmation_due_at:null});

    await db.exec("DELETE FROM sales_channel_sync_jobs");
    await operation(db,"SystemQueueDueSalesChannelSyncJobs",["catalog-no-loop-request"]);
    expect((await db.query("SELECT id FROM sales_channel_sync_jobs")).rows).toHaveLength(0);
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

  it("uses the channel-specific price without changing the product price", async () => {
    await db.query("UPDATE sales_channel_product_mappings SET price_mode='CUSTOM',custom_price_cents=2790,sync_price=true WHERE id=$1",[ids.mapping]);
    const rows=await operation(db,"SystemSalesChannelMappingsForSync",[ids.job,"worker-123","custom-price-request"]);
    expect(rows.rows[0]).toMatchObject({priceMode:"CUSTOM",priceCents:"2790",basePriceCents:"2790",promotionPriceCents:null});
    expect((await db.query<{sale_price_cents:string}>("SELECT sale_price_cents::text FROM products WHERE id=$1",[ids.product])).rows[0]?.sale_price_cents).toBe("1500");
  });
});

describe("PostgreSQL: channel commerce", () => {
  const evidence = () => ({merchantId:"merchant-1",eventId:ids.event,workerId:"worker-123"});
  async function mappedOrder(status: "ACCEPTED" | "COMPLETED" = "ACCEPTED") {
    await db.query("UPDATE products SET cost_price_cents=500,allow_negative_stock=false WHERE id=$1",[ids.product]);
    await db.query("UPDATE sales_channel_order_items SET product_id=$1,mapping_status='MAPPED',external_product_id='item-1',unit_price_cents=1500,total_cents=1500 WHERE id=$2",[ids.product,ids.orderItem]);
    await db.query("UPDATE sales_channel_orders SET status=$1::text,pending_action=NULL,command_status='CONFIRMED',subtotal_cents=1500,total_cents=1500,payment_integrity_status='VALID',completed_at=CASE WHEN $1::text='COMPLETED' THEN now() ELSE NULL END WHERE id=$2",[status,ids.order]);
    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,10)",[ids.tenant,ids.branch,ids.product]);
  }
  async function addOnlinePayment(amountCents = 1500) {
    await db.query("INSERT INTO sales_channel_order_payments(id,tenant_id,order_id,payment_key,method,payment_type,prepaid,amount_cents,sequence) VALUES (gen_random_uuid(),$1,$2,'default-online-payment','PIX','ONLINE',true,$3,1)",[ids.tenant,ids.order,amountCents]);
  }

  it("reserves mapped stock exactly once after partner acceptance", async () => {
    await mappedOrder();
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect((await db.query<{quantity:string;status:string}>("SELECT quantity::text,status FROM sales_channel_stock_reservations")).rows).toEqual([{quantity:"1.000",status:"RESERVED"}]);
    expect(await order()).toMatchObject({commerce_status:"RESERVED",stock_reservation_status:"RESERVED",sale_id:null});
    expect((await db.query("SELECT id FROM sales")).rows).toHaveLength(0);
  });

  it("updates an accepted order snapshot without exposing or losing its reserved stock", async () => {
    await mappedOrder();
    await db.query("UPDATE sales_channel_orders SET idempotency_key=$1 WHERE id=$2",[`${ids.tenant}:IFOOD:order-1`,ids.order]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    await db.query("UPDATE products SET active=false WHERE id=$1",[ids.product]);

    await operation(db,"SystemIngestSalesChannelOrder",[ids.connection,{
      ...evidence(),providerOrderId:"order-1",displayCode:"1234",reconciledStatus:"PENDING",partnerStatus:"PLACED",
      customerName:"Cliente",orderType:"DELIVERY",paymentMethod:"ONLINE",deliveryProvider:"IFOOD",deliveryAddress:"Rua teste",notes:"",
      subtotalCents:3000,deliveryFeeCents:0,discountCents:0,totalCents:3000,scheduledAt:"",preparationStartAt:"",
      snapshotHash:"patched-snapshot",receivedAt:new Date().toISOString(),items:[{
        external_item_id:"bag-item-1",external_product_id:"item-1",ean:"",name:"Produto",quantity:2,unit_price_cents:1500,total_cents:3000,observation:"",
      }],
    }]);

    expect((await db.query<{quantity:string;status:string}>("SELECT quantity::text,status FROM sales_channel_stock_reservations")).rows).toEqual([{quantity:"2.000",status:"RESERVED"}]);
    expect((await db.query<{product_id:string;quantity:string}>("SELECT product_id,quantity::text FROM sales_channel_order_items")).rows).toEqual([{product_id:ids.product,quantity:"2"}]);
    expect(await order()).toMatchObject({status:"ACCEPTED",commerce_status:"RESERVED",stock_reservation_status:"RESERVED"});
  });

  it("creates one sale with official totals, allocated discount and one stock movement", async () => {
    await mappedOrder("COMPLETED");
    await db.query("UPDATE sales_channel_orders SET subtotal_cents=1500,delivery_fee_cents=300,discount_cents=200,total_cents=1600 WHERE id=$1",[ids.order]);
    await addOnlinePayment(1600);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect((await db.query<{source:string;external_reference:string;status:string;subtotal_cents:string;discount_cents:string;surcharge_cents:string;total_cents:string}>("SELECT source,external_reference,status,subtotal_cents::text,discount_cents::text,surcharge_cents::text,total_cents::text FROM sales")).rows).toEqual([{source:"IFOOD",external_reference:"order-1",status:"COMPLETED",subtotal_cents:"1500",discount_cents:"200",surcharge_cents:"300",total_cents:"1600"}]);
    expect((await db.query<{discount_cents:string;total_cents:string;unit_sale_price_cents:string}>("SELECT discount_cents::text,total_cents::text,unit_sale_price_cents::text FROM sale_items")).rows).toEqual([{discount_cents:"200",total_cents:"1300",unit_sale_price_cents:"1300"}]);
    expect((await db.query<{amount_cents:string;external_reference:string}>("SELECT amount_cents::text,external_reference FROM sale_payments")).rows).toEqual([{amount_cents:"1600",external_reference:"iFood:order-1:1"}]);
    expect((await db.query<{quantity:string;status:string}>("SELECT quantity::text,status FROM stock_movements")).rows).toEqual([{quantity:"1.000",status:"POSTED"}]);
    expect((await db.query<{quantity:string}>("SELECT quantity::text FROM stock_balances")).rows[0]?.quantity).toBe("9.000");
    expect(await order()).toMatchObject({commerce_status:"POSTED",stock_reservation_status:"POSTED"});
  });

  it("does not recreate a posted sale when only the operational order snapshot changes", async () => {
    await mappedOrder("COMPLETED");
    await addOnlinePayment();
    await db.query("UPDATE sales_channel_orders SET idempotency_key=$1,snapshot_hash='snapshot-state-1',commerce_source_hash='commerce-v1' WHERE id=$2",[`${ids.tenant}:IFOOD:order-1`,ids.order]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);

    await operation(db,"SystemIngestSalesChannelOrder",[ids.connection,{
      ...evidence(),providerOrderId:"order-1",displayCode:"1234",reconciledStatus:"COMPLETED",partnerStatus:"DELIVERED",
      customerName:"Cliente",orderType:"DELIVERY",paymentMethod:"",deliveryProvider:"IFOOD",deliveryAddress:"Rua atualizada",notes:"",
      subtotalCents:1500,deliveryFeeCents:0,discountCents:0,additionalFeeCents:0,prepaidCents:0,pendingPaymentCents:0,merchantDiscountCents:0,ifoodDiscountCents:0,
      totalCents:1500,paymentIntegrityStatus:"VALID",payments:[{method:"PIX",payment_type:"ONLINE",currency:"BRL",prepaid:true,amount_cents:1500,sequence:1}],scheduledAt:"",preparationStartAt:"",snapshotHash:"snapshot-state-2",commerceSourceHash:"commerce-v1",receivedAt:new Date().toISOString(),items:[{
        external_item_id:"bag-item-1",external_product_id:"item-1",ean:"",name:"Produto",quantity:1,unit_price_cents:1500,total_cents:1500,observation:"",
      }],
    }]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);

    expect((await db.query<{status:string}>("SELECT status FROM sales")).rows).toEqual([{status:"COMPLETED"}]);
    expect((await db.query<{status:string}>("SELECT status FROM stock_movements")).rows).toEqual([{status:"POSTED"}]);
    expect((await db.query<{status:string}>("SELECT status FROM sales_channel_stock_reservations")).rows).toEqual([{status:"POSTED"}]);
    expect((await db.query<{quantity:string}>("SELECT quantity::text FROM stock_balances WHERE product_id=$1",[ids.product])).rows[0]?.quantity).toBe("9.000");
    expect(await order()).toMatchObject({snapshot_hash:"snapshot-state-2",commerce_source_hash:"commerce-v1",commerce_snapshot_hash:"commerce-v1",commerce_status:"POSTED",stock_reservation_status:"POSTED"});
  });

  it("records each iFood payment method separately", async () => {
    await mappedOrder("COMPLETED");
    await db.query("INSERT INTO sales_channel_order_payments(id,tenant_id,order_id,payment_key,method,payment_type,card_brand,prepaid,amount_cents,sequence) VALUES (gen_random_uuid(),$1,$2,'pay-1','CREDIT','ONLINE','VISA',true,1000,1),(gen_random_uuid(),$1,$2,'pay-2','CASH','OFFLINE',NULL,false,500,2)",[ids.tenant,ids.order]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    const payments = (await db.query<{code:string;amount_cents:string;sequence:number}>("SELECT pm.code,sp.amount_cents::text,sp.sequence FROM sale_payments sp JOIN payment_methods pm ON pm.id=sp.payment_method_id ORDER BY sp.sequence")).rows;
    expect(payments).toEqual([
      {code:expect.stringMatching(/^IFOOD_ONLINE_CREDIT_[a-f0-9]{8}$/),amount_cents:"1000",sequence:1},
      {code:expect.stringMatching(/^IFOOD_ENTREGA_CASH_[a-f0-9]{8}$/),amount_cents:"500",sequence:2},
    ]);
  });

  it("posts combo sales against component stock while preserving the combo sale item", async () => {
    const component="00000000-0000-4000-8000-000000000020";
    await db.query("UPDATE products SET bundle_product=true,cost_price_cents=0 WHERE id=$1",[ids.product]);
    await db.query("UPDATE sales_channel_order_items SET external_product_id='item-1' WHERE id=$1",[ids.orderItem]);
    await db.query("INSERT INTO products(id,tenant_id,category_id,name,internal_code,sale_price_cents,cost_price_cents) VALUES ($1,$2,$3,'Componente','COMP-2',500,300)",[component,ids.tenant,ids.category]);
    await db.query("INSERT INTO product_components(tenant_id,parent_product_id,component_product_id,quantity) VALUES ($1,$2,$3,2)",[ids.tenant,ids.product,component]);
    await db.query("UPDATE sales_channel_order_items SET product_id=$1,mapping_status='MAPPED',quantity=2,unit_price_cents=1500,total_cents=3000 WHERE id=$2",[ids.product,ids.orderItem]);
    await db.query("UPDATE sales_channel_orders SET status='COMPLETED',pending_action=NULL,command_status='CONFIRMED',subtotal_cents=3000,total_cents=3000,completed_at=now(),snapshot_hash='combo-v1' WHERE id=$1",[ids.order]);
    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,10)",[ids.tenant,ids.branch,component]);
    await db.exec("UPDATE sales_channel_orders SET payment_integrity_status='VALID'");
    await addOnlinePayment(3000);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect((await db.query<{product_id:string;quantity:string;unit_cost_cents:string}>("SELECT product_id,quantity::text,unit_cost_cents::text FROM sale_items")).rows).toEqual([{product_id:ids.product,quantity:"2.000",unit_cost_cents:"600"}]);
    expect((await db.query<{product_id:string;quantity:string;status:string}>("SELECT product_id,quantity::text,status FROM stock_movements")).rows).toEqual([{product_id:component,quantity:"4.000",status:"POSTED"}]);
    expect((await db.query<{quantity:string}>("SELECT quantity::text FROM stock_balances WHERE product_id=$1",[component])).rows[0]?.quantity).toBe("6.000");
  });

  it("keeps the accepted combo composition immutable when its recipe changes later", async () => {
    const originalComponent="00000000-0000-4000-8000-000000000023",newComponent="00000000-0000-4000-8000-000000000024";
    await db.query("UPDATE products SET bundle_product=true,cost_price_cents=0 WHERE id=$1",[ids.product]);
    await db.query("UPDATE sales_channel_order_items SET external_product_id='item-1' WHERE id=$1",[ids.orderItem]);
    await db.query("INSERT INTO products(id,tenant_id,category_id,name,internal_code,sale_price_cents,cost_price_cents) VALUES ($1,$3,$4,'Componente original','COMP-ORIGINAL',500,200),($2,$3,$4,'Componente novo','COMP-NOVO',500,400)",[originalComponent,newComponent,ids.tenant,ids.category]);
    await db.query("INSERT INTO product_components(tenant_id,parent_product_id,component_product_id,quantity) VALUES ($1,$2,$3,2)",[ids.tenant,ids.product,originalComponent]);
    await operation(db,"MapSalesChannelOrderItem",["actor",ids.orderItem,ids.product,"snapshot-combo-request"]);
    expect((await db.query<{stock_snapshot:Array<{productId:string;quantityPerUnit:number}>}>("SELECT stock_snapshot FROM sales_channel_order_items WHERE id=$1",[ids.orderItem])).rows[0]?.stock_snapshot).toEqual([{productId:originalComponent,quantityPerUnit:2}]);

    await db.query("DELETE FROM product_components WHERE tenant_id=$1 AND parent_product_id=$2",[ids.tenant,ids.product]);
    await db.query("INSERT INTO product_components(tenant_id,parent_product_id,component_product_id,quantity) VALUES ($1,$2,$3,3)",[ids.tenant,ids.product,newComponent]);
    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,10),($1,$2,$4,10)",[ids.tenant,ids.branch,originalComponent,newComponent]);
    await db.query("UPDATE sales_channel_order_items SET quantity=1,unit_price_cents=1500,total_cents=1500 WHERE id=$1",[ids.orderItem]);
    await db.query("UPDATE sales_channel_orders SET status='COMPLETED',subtotal_cents=1500,total_cents=1500,completed_at=now(),snapshot_hash='accepted-combo' WHERE id=$1",[ids.order]);
    await db.exec("UPDATE sales_channel_orders SET payment_integrity_status='VALID'");
    await addOnlinePayment();
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);

    expect((await db.query<{product_id:string;quantity:string}>("SELECT product_id,quantity::text FROM stock_movements")).rows).toEqual([{product_id:originalComponent,quantity:"2.000"}]);
    expect((await db.query<{quantity:string}>("SELECT quantity::text FROM stock_balances WHERE product_id=$1",[originalComponent])).rows[0]?.quantity).toBe("8.000");
    expect((await db.query<{quantity:string}>("SELECT quantity::text FROM stock_balances WHERE product_id=$1",[newComponent])).rows[0]?.quantity).toBe("10.000");
  });

  it("captures the current combo recipe only when the pending order is accepted", async () => {
    const oldComponent="00000000-0000-4000-8000-000000000025",acceptedComponent="00000000-0000-4000-8000-000000000026";
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_orders SET status='PENDING',pending_action=NULL,command_status='IDLE',version=4; UPDATE sales_channel_order_items SET product_id=NULL,mapping_status='UNMAPPED',stock_snapshot=NULL,external_product_id='item-1'");
    await db.query("UPDATE products SET bundle_product=true,cost_price_cents=0 WHERE id=$1",[ids.product]);
    await db.query("INSERT INTO products(id,tenant_id,category_id,name,internal_code,sale_price_cents,cost_price_cents) VALUES ($1,$3,$4,'Componente anterior','COMP-OLD',500,200),($2,$3,$4,'Componente no aceite','COMP-ACCEPT',500,400)",[oldComponent,acceptedComponent,ids.tenant,ids.category]);
    await db.query("INSERT INTO product_components(tenant_id,parent_product_id,component_product_id,quantity) VALUES ($1,$2,$3,1)",[ids.tenant,ids.product,oldComponent]);

    await operation(db,"MapSalesChannelOrderItem",["actor",ids.orderItem,ids.product,"pending-combo-map"]);
    expect((await db.query<{stock_snapshot:unknown}>("SELECT stock_snapshot FROM sales_channel_order_items WHERE id=$1",[ids.orderItem])).rows[0]?.stock_snapshot).toBeNull();

    await db.query("DELETE FROM product_components WHERE tenant_id=$1 AND parent_product_id=$2",[ids.tenant,ids.product]);
    await db.query("INSERT INTO product_components(tenant_id,parent_product_id,component_product_id,quantity) VALUES ($1,$2,$3,3)",[ids.tenant,ids.product,acceptedComponent]);
    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,10)",[ids.tenant,ids.branch,acceptedComponent]);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",4,"",null,"",0]);

    expect((await db.query<{stock_snapshot:Array<{productId:string;quantityPerUnit:number}>}>("SELECT stock_snapshot FROM sales_channel_order_items WHERE id=$1",[ids.orderItem])).rows[0]?.stock_snapshot).toEqual([{productId:acceptedComponent,quantityPerUnit:3}]);
    expect((await db.query<{product_id:string;quantity:string;status:string}>("SELECT product_id,quantity::text,status FROM sales_channel_stock_reservations")).rows).toEqual([{product_id:acceptedComponent,quantity:"3.000",status:"RESERVED"}]);
  });

  it("blocks sale posting when the payment snapshot is inconsistent", async () => {
    await mappedOrder("COMPLETED");
    await db.exec("UPDATE sales_channel_orders SET payment_integrity_status='AMOUNT_MISMATCH'");
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect((await db.query("SELECT id FROM sales")).rows).toHaveLength(0);
    expect(await order()).toMatchObject({commerce_status:"BLOCKED_PAYMENT",sale_id:null});
  });

  it("records iFood-funded discounts as a subsidy without reducing merchant revenue", async () => {
    await mappedOrder("COMPLETED");
    await db.exec("UPDATE sales_channel_orders SET subtotal_cents=1500,discount_cents=300,ifood_discount_cents=300,total_cents=1200,payment_integrity_status='VALID'");
    await db.query("INSERT INTO sales_channel_order_payments(id,tenant_id,order_id,payment_key,method,payment_type,prepaid,amount_cents,sequence) VALUES (gen_random_uuid(),$1,$2,'pay-subsidy','PIX','ONLINE',true,1200,1)",[ids.tenant,ids.order]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect((await db.query<{discount_cents:string;total_cents:string}>("SELECT discount_cents::text,total_cents::text FROM sales")).rows[0]).toEqual({discount_cents:"0",total_cents:"1500"});
    expect((await db.query<{amount_cents:string}>("SELECT amount_cents::text FROM sale_payments ORDER BY sequence")).rows).toEqual([{amount_cents:"1200"},{amount_cents:"300"}]);
  });

  it("replaces a posted sale and restores stock when the confirmed snapshot changes", async () => {
    await mappedOrder("COMPLETED");
    await addOnlinePayment();
    await db.query("UPDATE sales_channel_orders SET snapshot_hash='snapshot-v1' WHERE id=$1",[ids.order]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    const firstSale=(await db.query<{id:string}>("SELECT id FROM sales WHERE status='COMPLETED'")).rows[0]!.id;
    expect(await order()).toMatchObject({commerce_snapshot_hash:"snapshot-v1"});
    await db.query("UPDATE sales_channel_order_items SET quantity=2,total_cents=3000 WHERE id=$1",[ids.orderItem]);
    await db.query("UPDATE sales_channel_orders SET subtotal_cents=3000,total_cents=3000,snapshot_hash='snapshot-v2' WHERE id=$1",[ids.order]);
    await db.exec("UPDATE sales_channel_order_payments SET amount_cents=3000");
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect((await db.query<{id:string;status:string;replaces_sale_id:string|null;total_cents:string}>("SELECT id,status,replaces_sale_id,total_cents::text FROM sales ORDER BY created_at,id")).rows).toEqual(expect.arrayContaining([
      {id:firstSale,status:"CANCELLED",replaces_sale_id:null,total_cents:"1500"},
      expect.objectContaining({status:"COMPLETED",replaces_sale_id:firstSale,total_cents:"3000"}),
    ]));
    expect((await db.query<{status:string;quantity:string}>("SELECT status,quantity::text FROM stock_movements ORDER BY created_at,id")).rows).toEqual(expect.arrayContaining([{status:"REVERSED",quantity:"1.000"},{status:"POSTED",quantity:"2.000"}]));
    expect((await db.query<{quantity:string}>("SELECT quantity::text FROM stock_balances WHERE product_id=$1",[ids.product])).rows[0]?.quantity).toBe("8.000");
    expect(await order()).toMatchObject({commerce_status:"POSTED",commerce_snapshot_hash:"snapshot-v2"});
  });

  it("reverses sale and stock once after a partner cancellation", async () => {
    await mappedOrder("COMPLETED");
    await addOnlinePayment();
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    await db.query("UPDATE sales_channel_orders SET status='CANCELLED' WHERE id=$1",[ids.order]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect((await db.query<{status:string}>("SELECT status FROM sales")).rows[0]?.status).toBe("CANCELLED");
    expect((await db.query<{status:string}>("SELECT status FROM stock_movements")).rows[0]?.status).toBe("REVERSED");
    expect((await db.query<{quantity:string}>("SELECT quantity::text FROM stock_balances")).rows[0]?.quantity).toBe("10.000");
    expect(await order()).toMatchObject({commerce_status:"REVERSED",stock_reservation_status:"REVERSED"});
  });

  it("blocks commerce until every item has an internal product", async () => {
    await db.query("UPDATE sales_channel_orders SET status='COMPLETED',subtotal_cents=1500,total_cents=1500 WHERE id=$1",[ids.order]);
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);
    expect(await order()).toMatchObject({commerce_status:"BLOCKED_MAPPING",sale_id:null});
    expect((await db.query("SELECT id FROM sales")).rows).toHaveLength(0);
  });

  it("maps every affected item and queues reconciliation for every unfinished commerce record", async () => {
    const secondOrder="00000000-0000-4000-8000-000000000016",secondItem="00000000-0000-4000-8000-000000000017";
    await db.exec("DELETE FROM sales_channel_commands");
    await db.query("UPDATE sales_channel_orders SET status='COMPLETED',command_status='IDLE',commerce_status='BLOCKED_MAPPING' WHERE id=$1",[ids.order]);
    await db.query("UPDATE sales_channel_order_items SET external_product_id='item-1' WHERE id=$1",[ids.orderItem]);
    await db.query("INSERT INTO sales_channel_orders(id,tenant_id,branch_id,connection_id,provider_order_id,display_code,status,partner_status,command_status,commerce_status) VALUES ($1,$2,$3,$4,'order-2','5678','ACCEPTED','CONFIRMED','IDLE','BLOCKED_MAPPING')",[secondOrder,ids.tenant,ids.branch,ids.connection]);
    await db.query("INSERT INTO sales_channel_order_items(id,tenant_id,order_id,external_item_id,external_product_id,name,quantity) VALUES ($1,$2,$3,'bag-item-2','item-1','Produto',2)",[secondItem,ids.tenant,secondOrder]);

    await operation(db,"MapSalesChannelOrderItem",["actor",ids.orderItem,ids.product,"mapping-request"]);

    expect((await db.query<{product_id:string;mapping_status:string}>("SELECT product_id,mapping_status FROM sales_channel_order_items ORDER BY id")).rows).toEqual([
      {product_id:ids.product,mapping_status:"MAPPED"},
      {product_id:ids.product,mapping_status:"MAPPED"},
    ]);
    expect((await db.query<{action:string;status:string}>("SELECT action,status FROM sales_channel_commands ORDER BY order_id")).rows).toEqual([
      {action:"RECONCILE_ORDER",status:"QUEUED"},
      {action:"RECONCILE_ORDER",status:"QUEUED"},
    ]);
  });

  it("blocks acceptance until every item is mapped and enough stock is available", async () => {
    await db.exec("DELETE FROM sales_channel_commands");
    await db.query("UPDATE sales_channel_orders SET status='PENDING',pending_action=NULL,command_status='IDLE',version=1 WHERE id=$1",[ids.order]);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);
    expect((await db.query("SELECT id FROM sales_channel_commands")).rows).toHaveLength(0);

    await db.query("UPDATE sales_channel_order_items SET product_id=$1,mapping_status='MAPPED' WHERE id=$2",[ids.product,ids.orderItem]);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);
    expect((await db.query("SELECT id FROM sales_channel_commands")).rows).toHaveLength(0);

    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,1)",[ids.tenant,ids.branch,ids.product]);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);
    expect((await db.query<{action:string;status:string}>("SELECT action,status FROM sales_channel_commands")).rows).toEqual([{action:"ACCEPT",status:"QUEUED"}]);
    expect((await db.query<{quantity:string;status:string}>("SELECT quantity::text,status FROM sales_channel_stock_reservations")).rows).toEqual([{quantity:"1.000",status:"RESERVED"}]);
    expect(await order()).toMatchObject({stock_reservation_status:"RESERVED"});
  });

  it("releases stock after a known failed acceptance and reserves it again on a new attempt", async () => {
    await db.exec("DELETE FROM sales_channel_commands");
    await db.query("UPDATE sales_channel_order_items SET product_id=$1,mapping_status='MAPPED' WHERE id=$2",[ids.product,ids.orderItem]);
    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,5)",[ids.tenant,ids.branch,ids.product]);
    await db.query("UPDATE sales_channel_orders SET status='PENDING',pending_action=NULL,command_status='IDLE',version=1 WHERE id=$1",[ids.order]);
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);

    const accept=(await db.query<{id:string}>("SELECT id FROM sales_channel_commands WHERE action='ACCEPT'")).rows[0]!;
    await db.query("UPDATE sales_channel_commands SET status='PROCESSING',locked_by='worker-123',lease_until=now()+interval '5 minutes' WHERE id=$1",[accept.id]);
    await operation(db,"SystemRecordSalesChannelCommandResult",[accept.id,"worker-123",{success:false,retryable:false,error:"Recusa técnica"}]);
    expect((await db.query<{status:string}>("SELECT status FROM sales_channel_stock_reservations")).rows[0]?.status).toBe("RELEASED");

    const failed=await order();
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",Number(failed.version),"",null,"",0]);
    expect((await db.query<{status:string}>("SELECT status FROM sales_channel_stock_reservations")).rows[0]?.status).toBe("RESERVED");
    expect(await order()).toMatchObject({stock_reservation_status:"RESERVED",pending_action:"ACCEPT"});
  });

  it("blocks acceptance for an unverified channel or inactive mapped product", async () => {
    await db.exec("DELETE FROM sales_channel_commands");
    await db.query("UPDATE sales_channel_order_items SET product_id=$1,mapping_status='MAPPED' WHERE id=$2",[ids.product,ids.orderItem]);
    await db.query("INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity) VALUES ($1,$2,$3,5)",[ids.tenant,ids.branch,ids.product]);
    await db.exec("UPDATE sales_channel_orders SET status='PENDING',pending_action=NULL,command_status='IDLE',version=1; UPDATE sales_channel_connections SET catalog_profile='UNVERIFIED'");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);
    expect((await db.query("SELECT id FROM sales_channel_commands")).rows).toHaveLength(0);

    await db.exec("UPDATE sales_channel_connections SET catalog_profile='RESTAURANT'; UPDATE products SET active=false");
    await operation(db,"QueueSalesChannelOrderAction",["actor",ids.order,"ACCEPT","",1,"",null,"",0]);
    expect((await db.query("SELECT id FROM sales_channel_commands")).rows).toHaveLength(0);
  });

  it("reports the mapped product and exact available stock to the order interface", async () => {
    await mappedOrder();
    await operation(db,"SystemReconcileSalesChannelCommerce",[ids.connection,"order-1",evidence()]);

    const options = await operation(db,"SalesChannelProductOptions",["actor","Produto",ids.connection,null,30,"product-options-request"]);
    const product = options.rows[0] as {physicalStock:string;reservedStock:string;availableStock:string};
    expect(Number(product.physicalStock)).toBe(10);
    expect(Number(product.reservedStock)).toBe(1);
    expect(Number(product.availableStock)).toBe(9);

    const orders = await operation(db,"SalesChannelOrdersV2",["actor",{},"","",50,0,"orders-request"]);
    const data = (orders.rows[0] as {data:{rows:{items:{productId:string;productName:string;physicalStock:number;reservedStock:number;availableStock:number}[]}[]}}).data;
    expect(data.rows[0]?.items[0]).toMatchObject({
      productId:ids.product,
      productName:"Produto",
      physicalStock:10,
      reservedStock:1,
      availableStock:9,
    });
  });
});

describe("PostgreSQL: protected iFood sales", () => {
  it("refuses a direct cancellation outside the channel order workflow", async () => {
    const saleId="00000000-0000-4000-8000-000000000018";
    await db.exec("UPDATE app_pages SET page_key='GESTAO_VENDAS'");
    await db.query("INSERT INTO sales(id,tenant_id,branch_id,client_operation_id,source,external_reference,status,total_cents,created_by_uid) VALUES ($1,$2,$3,'channel:test','IFOOD','order-test','COMPLETED',1500,'system:ifood')",[saleId,ids.tenant,ids.branch]);
    await operation(db,"CancelSale",["actor",saleId,"Cancelamento local indevido"]);
    expect((await db.query<{status:string;cancelled_at:string|null}>("SELECT status,cancelled_at FROM sales WHERE id=$1",[saleId])).rows[0]).toEqual({status:"COMPLETED",cancelled_at:null});
  });
});

describe("PostgreSQL: iFood financial dashboard", () => {
  it("persists official fees idempotently and calculates the net transfer", async () => {
    await db.exec("UPDATE sales_channel_sync_jobs SET job_type='FINANCIAL',status='PROCESSING',locked_by='worker-123',lease_until=now()+interval '5 minutes'");
    const occurredAt=new Date().toISOString(),payloads=[
      {entry_key:"a".repeat(64),name:"ORDER_REVENUE",description:"Venda",product:"FOOD",trigger:"ORDER_COMPLETED",reference_type:"ORDER",reference_id:"order-1",amount_cents:1500,billing_base_cents:1500,has_transfer_impact:true,competence:"2026-09",occurred_at:occurredAt},
      {entry_key:"b".repeat(64),name:"COMMISSION_FEE",description:"Comissão",product:"FOOD",trigger:"ORDER_COMPLETED",reference_type:"ORDER",reference_id:"order-1",amount_cents:-300,billing_base_cents:1500,has_transfer_impact:true,competence:"2026-09",occurred_at:occurredAt},
    ];
    await operation(db,"SystemUpsertSalesChannelFinancialEvents",[ids.connection,ids.job,"worker-123",payloads]);
    await operation(db,"SystemUpsertSalesChannelFinancialEvents",[ids.connection,ids.job,"worker-123",payloads]);
    expect((await db.query("SELECT id FROM sales_channel_financial_entries")).rows).toHaveLength(2);
    expect(await order()).toMatchObject({provider_fee_cents:300,net_amount_cents:1200});
    await operation(db,"SystemUpsertSalesChannelFinancialEvents",[ids.connection,ids.job,"worker-123",[{...payloads[1],amount_cents:-350}]]);
    expect((await db.query("SELECT id FROM sales_channel_financial_entries")).rows).toHaveLength(2);
    expect(await order()).toMatchObject({provider_fee_cents:350,net_amount_cents:1150});
  });

  it("allocates gross revenue and partner fees to the selected product without duplicating the sale", async () => {
    const sale="00000000-0000-4000-8000-000000000021",secondProduct="00000000-0000-4000-8000-000000000022";
    await db.exec("UPDATE app_pages SET page_key='RELATORIOS_OPERACIONAIS'");
    await db.query("INSERT INTO products(id,tenant_id,category_id,name,internal_code,sale_price_cents,cost_price_cents) VALUES ($1,$2,$3,'Produto dois','SKU-2',2000,400)",[secondProduct,ids.tenant,ids.category]);
    await db.query("INSERT INTO sales(id,tenant_id,branch_id,client_operation_id,source,external_reference,status,total_cents,created_by_uid) VALUES ($1,$2,$3,'channel:dashboard','IFOOD','order-1','COMPLETED',3000,'system:ifood')",[sale,ids.tenant,ids.branch]);
    await db.query("INSERT INTO sale_items(id,tenant_id,sale_id,product_id,quantity,unit_list_price_cents,unit_sale_price_cents,unit_cost_cents,total_cents,status) VALUES (gen_random_uuid(),$1,$2,$3,1,1000,1000,200,1000,'ACTIVE'),(gen_random_uuid(),$1,$2,$4,1,2000,2000,400,2000,'ACTIVE')",[ids.tenant,sale,ids.product,secondProduct]);
    await db.query("UPDATE sales_channel_orders SET sale_id=$1,provider_fee_cents=300,net_amount_cents=2700 WHERE id=$2",[sale,ids.order]);
    const day=new Date().toISOString().slice(0,10);
    const dashboard=await operation(db,"FinancialIndicatorsDashboard",["actor",day,day,{products:[ids.product],sources:["IFOOD"]},"financial-dashboard-request"]);
    const data=(dashboard.rows[0] as {data:{cards:Record<string,string|number>;products:Array<Record<string,string|number>>}}).data;
    expect(data.cards).toMatchObject({volume:1,revenueCents:"1000",providerFeeCents:"100",netRevenueCents:"900",costCents:"200",profitCents:"700",financialPendingSales:0});
    expect(data.products).toEqual([expect.objectContaining({id:ids.product,revenueCents:"1000",providerFeeCents:"100",netRevenueCents:"900",profitCents:"700"})]);
  });

  it("consolidates channel sales, discounts, payments and confirmed fees", async () => {
    const sale="00000000-0000-4000-8000-000000000023";
    await db.exec("UPDATE app_pages SET page_key='RELATORIOS_OPERACIONAIS'");
    await db.query("INSERT INTO sales(id,tenant_id,branch_id,client_operation_id,source,external_reference,status,total_cents,created_by_uid,sold_at) VALUES ($1,$2,$3,'channel:channel-dashboard','IFOOD','order-1','COMPLETED',1800,'system:ifood',now())",[sale,ids.tenant,ids.branch]);
    await db.query("INSERT INTO sale_items(id,tenant_id,sale_id,product_id,quantity,unit_list_price_cents,unit_sale_price_cents,unit_cost_cents,total_cents,status) VALUES (gen_random_uuid(),$1,$2,$3,1,1800,1800,700,1800,'ACTIVE')",[ids.tenant,sale,ids.product]);
    await db.query("UPDATE sales_channel_order_items SET product_id=$1,unit_price_cents=1500,total_cents=1500 WHERE id=$2",[ids.product,ids.orderItem]);
    await db.query("UPDATE sales_channel_orders SET sale_id=$1,status='COMPLETED',total_cents=1500,merchant_discount_cents=100,ifood_discount_cents=300,provider_fee_cents=200,net_amount_cents=1600,completed_at=now(),status_updated_at=now() WHERE id=$2",[sale,ids.order]);
    await db.query("INSERT INTO sales_channel_order_payments(id,tenant_id,order_id,payment_key,method,payment_type,currency,prepaid,amount_cents,sequence) VALUES (gen_random_uuid(),$1,$2,'dashboard-payment','PIX','ONLINE','BRL',true,1500,1)",[ids.tenant,ids.order]);
    await db.query("INSERT INTO sales_channel_financial_entries(id,tenant_id,connection_id,order_id,entry_key,name,description,classification,amount_cents,has_transfer_impact,occurred_at) VALUES (gen_random_uuid(),$1,$2,$3,$4,'COMMISSION_FEE','Comissão iFood','PROVIDER_FEE',-200,true,now())",[ids.tenant,ids.connection,ids.order,"f".repeat(64)]);
    const day=new Date().toISOString().slice(0,10);
    const dashboard=await operation(db,"SalesChannelAnalyticsDashboard",["actor",day,day,{},"channel-dashboard-request"]);
    const data=(dashboard.rows[0] as {data:{cards:Record<string,string|number>;byChannel:unknown[];fees:unknown[];payments:unknown[];topProducts:unknown[]}}).data;
    expect(data.cards).toMatchObject({orders:1,sales:1,grossRevenueCents:"1800",customerPaidCents:"1500",merchantDiscountCents:"100",partnerSubsidyCents:"300",providerFeeCents:"200",netRevenueCents:"1600",costCents:"700",profitCents:"900",financialPendingSales:0});
    expect(data.byChannel).toHaveLength(1);
    expect(data.fees).toEqual([expect.objectContaining({name:"COMMISSION_FEE",amountCents:"200"})]);
    expect(data.payments).toEqual([expect.objectContaining({method:"PIX",amountCents:"1500"})]);
    expect(data.topProducts).toEqual([expect.objectContaining({id:ids.product,revenueCents:"1800",netRevenueCents:"1600",costCents:"700",profitCents:"900"})]);
  });
});

describe("PostgreSQL: hardening and decommissioning", () => {
  it("preserves the original event hash after privacy purge", async () => {
    const payload = {eventId:"provider-event-purge",eventType:"PLACED",payloadHash:"c".repeat(64),payload:{id:"provider-event-purge"},containsPersonalData:true,source:"POLLING"};
    await operation(db,"SystemRegisterSalesChannelEvent",[ids.connection,payload]);
    await db.exec("UPDATE sales_channel_event_inbox SET retention_until=now()-interval '1 second' WHERE provider_event_id='provider-event-purge'");
    await operation(db,"SystemPurgeExpiredSalesChannelPayloads",["purge-request"]);
    expect((await db.query<{payload:unknown;original_payload_hash:string;source:string;purged_at:string|null}>("SELECT payload,original_payload_hash,source,purged_at FROM sales_channel_event_inbox WHERE provider_event_id='provider-event-purge'")).rows[0]).toMatchObject({payload:{},original_payload_hash:"c".repeat(64),source:"POLLING"});
  });

  it("removes normalized personal data from terminal orders after retention", async () => {
    await db.query("UPDATE sales_channel_orders SET status='COMPLETED',customer_name='Cliente',delivery_address='Rua privada',notes='Referência privada',status_updated_at=now()-interval '91 days' WHERE id=$1",[ids.order]);
    await db.query("UPDATE sales_channel_order_items SET observation='Interfone privado' WHERE id=$1",[ids.orderItem]);
    await operation(db,"SystemPurgeExpiredSalesChannelPayloads",["privacy-purge-request"]);
    expect((await db.query<{customer_name:string|null;delivery_address:string|null;notes:string|null;personal_data_purged_at:string|null}>("SELECT customer_name,delivery_address,notes,personal_data_purged_at FROM sales_channel_orders WHERE id=$1",[ids.order])).rows[0]).toMatchObject({customer_name:null,delivery_address:null,notes:null});
    expect((await db.query<{observation:string|null}>("SELECT observation FROM sales_channel_order_items WHERE id=$1",[ids.orderItem])).rows[0]?.observation).toBeNull();
  });

  it("queues Restaurant deactivation before archiving a connection", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_product_mappings SET last_synced_at=now(),publication_status='ACCEPTED'");
    await operation(db,"ArchiveSalesChannelConnection",["actor",ids.connection]);
    expect((await db.query<{status:string;active:boolean}>("SELECT status,active FROM sales_channel_connections WHERE id=$1",[ids.connection])).rows[0]).toEqual({status:"DECOMMISSIONING",active:true});
    expect((await db.query<{action:string;status:string}>("SELECT action,status FROM sales_channel_commands")).rows[0]).toEqual({action:"DEACTIVATE_PRODUCT",status:"QUEUED"});
  });

  it("recovers a decommissioning connection after a permanent product failure", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_product_mappings SET last_synced_at=now(),publication_status='ACCEPTED'");
    await operation(db,"ArchiveSalesChannelConnection",["actor",ids.connection]);
    await db.exec("UPDATE sales_channel_commands SET status='ERROR',attempts=8,last_error='Falha transitória do parceiro' WHERE action='DEACTIVATE_PRODUCT'");

    await operation(db,"RetrySalesChannelDecommissioning",["actor",ids.connection]);

    expect((await db.query<{status:string;attempts:number;last_error:string|null}>("SELECT status,attempts,last_error FROM sales_channel_commands WHERE action='DEACTIVATE_PRODUCT'")).rows[0]).toEqual({status:"RETRY",attempts:0,last_error:null});
  });

  it("queues remote deactivation even when the linked Grocery product became invalid", async () => {
    await db.exec("DELETE FROM sales_channel_commands; UPDATE sales_channel_connections SET catalog_profile='GROCERY'; UPDATE products SET active=false,sale_price_cents=0,ean='invalid'");
    await operation(db,"UpdateSalesChannelProductMapping",["actor",ids.mapping,"item-1","Produto",true,true,false,"PRODUCT",null,"EXISTING"]);
    expect((await db.query<{enabled:boolean}>("SELECT enabled FROM sales_channel_product_mappings WHERE id=$1",[ids.mapping])).rows[0]?.enabled).toBe(false);
    expect((await db.query<{action:string}>("SELECT action FROM sales_channel_commands")).rows[0]?.action).toBe("DEACTIVATE_PRODUCT");
  });
});

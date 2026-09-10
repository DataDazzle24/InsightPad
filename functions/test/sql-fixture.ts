import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const root = new URL("../../dataconnect/", import.meta.url);
const schema = readFileSync(new URL("schema/schema.gql", root), "utf8");
const operations = ["app/queries.gql", "app/mutations.gql"].map((file) => readFileSync(new URL(file, root), "utf8")).join("\n");
const snake = (name: string) => name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Build an isolated PostgreSQL test schema from the actual Data Connect source.
// This is not a migration generator; the Firebase compiler remains the deployment gate.
export async function database() {
  const db = new PGlite();
  for (const match of schema.matchAll(/^type (\w+)\s+@table\([\s\S]*?name:\s*"([^"]+)"[\s\S]*?\)\s*\{([\s\S]*?)^\}/gm)) {
    const columns: string[] = [];
    for (const line of match[3]!.split("\n")) {
      const field = /^\s+(\w+): (\w+)!?(.*)$/.exec(line);
      if (!field || field[3]!.includes("@ref")) continue;
      const [, name, type, annotations] = field;
      const types: Record<string, string> = { String: "text", UUID: "uuid", Int: "integer", Int64: "bigint", Float: "numeric", Timestamp: "timestamptz", Boolean: "boolean", Any: "jsonb" };
      if (!types[type!]) {
        columns.push(`"${snake(name!)}_id" ${type === "User" ? "text" : "uuid"}`);
        continue;
      }
      const column = /name: "([^"]+)"/.exec(annotations!)?.[1] ?? snake(name!);
      const dataType = /dataType: "([^"]+)"/.exec(annotations!)?.[1] ?? types[type!];
      let def = "";
      if (annotations!.includes('expr: "uuidV4()"')) def = " DEFAULT gen_random_uuid()";
      if (annotations!.includes('expr: "request.time"')) def = " DEFAULT now()";
      const literal = /@default\(value: ("[^"]*"|true|false|\d+)\)/.exec(annotations!)?.[1];
      if (literal) def = ` DEFAULT ${literal.startsWith('"') ? `'${literal.slice(1, -1)}'` : literal}`;
      columns.push(`"${column}" ${dataType}${def}${name === "id" ? " PRIMARY KEY" : annotations!.includes("@unique") ? " UNIQUE" : ""}`);
    }
    await db.exec(`CREATE TABLE "${match[2]}" (${columns.join(",")})`);
  }
  return db;
}

export async function operation(db: PGlite, name: string, params: unknown[]) {
  const start = operations.indexOf(`${name}(`);
  if (start < 0) throw new Error(`Missing operation ${name}`);
  const sql = /(?:_execute|_select)\(sql: """([\s\S]*?)"""/.exec(operations.slice(start))?.[1];
  if (!sql) throw new Error(`Missing SQL ${name}`);
  return db.query(sql, params.map((value) => value !== null && typeof value === "object" ? JSON.stringify(value) : value));
}

export const ids = {
  tenant: "00000000-0000-4000-8000-000000000001", otherTenant: "00000000-0000-4000-8000-000000000002",
  branch: "00000000-0000-4000-8000-000000000003", otherBranch: "00000000-0000-4000-8000-000000000004",
  role: "00000000-0000-4000-8000-000000000005", page: "00000000-0000-4000-8000-000000000006",
  connection: "00000000-0000-4000-8000-000000000007", order: "00000000-0000-4000-8000-000000000008",
  command: "00000000-0000-4000-8000-000000000009", event: "00000000-0000-4000-8000-000000000010",
  job: "00000000-0000-4000-8000-000000000011", product: "00000000-0000-4000-8000-000000000012",
  mapping: "00000000-0000-4000-8000-000000000013", category: "00000000-0000-4000-8000-000000000014",
  orderItem: "00000000-0000-4000-8000-000000000015",
};
export async function seed(db: PGlite) {
  await db.query("INSERT INTO tenants(id) VALUES ($1),($2)", [ids.tenant,ids.otherTenant]);
  await db.query("INSERT INTO branches(id,tenant_id) VALUES ($1,$3),($2,$3)", [ids.branch,ids.otherBranch,ids.tenant]);
  await db.query("INSERT INTO roles(id,tenant_id) VALUES ($1,$2)", [ids.role,ids.tenant]);
  await db.query("INSERT INTO users(id,tenant_id,role_id) VALUES ('actor',$1,$2),('other',$3,$2)", [ids.tenant,ids.role,ids.otherTenant]);
  await db.query("INSERT INTO app_pages(id,page_key) VALUES ($1,'CANAIS_VENDA')",[ids.page]);
  await db.query("INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_update,can_manage,can_create,can_delete) VALUES ($1,$2,$3,true,true,true,true,true)",[ids.role,ids.page,ids.tenant]);
  await db.query("INSERT INTO sales_channel_connections(id,tenant_id,branch_id,provider,external_store_id,status,authorization_status,catalog_profile) VALUES ($1,$2,$3,'IFOOD','merchant-1','ACTIVE','AUTHORIZED','RESTAURANT')",[ids.connection,ids.tenant,ids.branch]);
  await db.query("INSERT INTO sales_channel_orders(id,tenant_id,branch_id,connection_id,provider_order_id,display_code,status,partner_status,pending_action,command_status) VALUES ($1,$2,$3,$4,'order-1','1234','ACCEPTED','CONFIRMED','COMPLETE','PROCESSING')",[ids.order,ids.tenant,ids.branch,ids.connection]);
  await db.query("INSERT INTO sales_channel_order_items(id,tenant_id,order_id,external_item_id,name,quantity) VALUES ($1,$2,$3,'bag-item-1','Produto',1)",[ids.orderItem,ids.tenant,ids.order]);
  await db.query("INSERT INTO sales_channel_commands(id,tenant_id,connection_id,order_id,provider,action,status,locked_by,lease_until) VALUES ($1,$2,$3,$4,'IFOOD','COMPLETE','PROCESSING','worker-123',now()+interval '5 minutes')",[ids.command,ids.tenant,ids.connection,ids.order]);
  await db.query("INSERT INTO sales_channel_event_inbox(id,tenant_id,connection_id,status,locked_by,lease_until) VALUES ($1,$2,$3,'PROCESSING','worker-123',now()+interval '5 minutes')",[ids.event,ids.tenant,ids.connection]);
  await db.query("INSERT INTO sales_channel_sync_jobs(id,tenant_id,connection_id,provider,job_type,status,locked_by,lease_until) VALUES ($1,$2,$3,'IFOOD','FULL','PROCESSING','worker-123',now()+interval '5 minutes')",[ids.job,ids.tenant,ids.connection]);
  await db.query("INSERT INTO categories(id,tenant_id,name) VALUES ($1,$2,'Mercearia')",[ids.category,ids.tenant]);
  await db.query("INSERT INTO products(id,tenant_id,category_id,name,internal_code,ean,sale_price_cents) VALUES ($1,$2,$3,'Produto','SKU-1','7890000000000',1500)",[ids.product,ids.tenant,ids.category]);
  await db.query("INSERT INTO sales_channel_product_mappings(id,tenant_id,connection_id,product_id,external_product_id,sync_price,sync_stock) VALUES ($1,$2,$3,$4,'item-1',true,true)",[ids.mapping,ids.tenant,ids.connection,ids.product]);
}

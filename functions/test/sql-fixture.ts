import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
export const fixtureSessionToken=(user:string)=>createHash("sha256").update(`fixture-session-${user}`).digest("hex");
import { PGlite } from "@electric-sql/pglite";

const root = new URL("../../dataconnect/", import.meta.url);
const schema = readFileSync(new URL("schema/schema.gql", root), "utf8");
const operations = ["app/queries.gql", "app/mutations.gql"].map((file) => readFileSync(new URL(file, root), "utf8")).join("\n");
const snake = (name: string) => name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Build an isolated PostgreSQL test schema from the actual Data Connect source.
// This is not a migration generator; the Firebase compiler remains the deployment gate.
export function schemaStatements() {
  const statements: string[] = [];
  for (const match of schema.matchAll(/^type (\w+)\s+@table\([\s\S]*?name:\s*"([^"]+)"[\s\S]*?\)\s*\{([\s\S]*?)^\}/gm)) {
    const columns: string[] = [];
    for (const line of match[3]!.split("\n")) {
      const field = /^\s+(\w+): (\w+)!?(.*)$/.exec(line);
      if (!field || field[3]!.includes("@ref")) continue;
      const [, name, type, annotations] = field;
      const types: Record<string, string> = { String: "text", UUID: "uuid", Int: "integer", Int64: "bigint", Float: "numeric", Date: "date", Timestamp: "timestamptz", Boolean: "boolean", Any: "jsonb" };
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
    const compositeKey = /key:\s*\[([^\]]+)\]/.exec(match[0])?.[1]
      ?.match(/"([^"]+)"/g)
      ?.map((name) => `"${snake(name.slice(1, -1))}_id"`);
    if (compositeKey?.length) columns.push(`UNIQUE (${compositeKey.join(",")})`);
    const singleKey = /key:\s*"([^"\n]+)"/.exec(match[0])?.[1];
    if (singleKey && singleKey !== "id") columns.push(`UNIQUE ("${snake(singleKey)}_id")`);
    statements.push(`CREATE TABLE "${match[2]}" (${columns.join(",")})`);
  }
  return statements;
}

export async function database() {
  const db = new PGlite();
  for (const statement of schemaStatements()) await db.exec(statement);
  return db;
}

export async function operation(db: PGlite, name: string, params: unknown[], context?: { sessionToken: string | null }) {
  const start = operations.indexOf(`${name}(`);
  if (start < 0) throw new Error(`Missing operation ${name}`);
  const body = operations.slice(start).split("\n}")[0]!;
  const statements = [...body.matchAll(/(_execute|_selectFirst|_select)\(\s*sql:\s*"""([\s\S]*?)""",\s*params:\s*\[([^\]]*)\]\s*\)([^\n]*)/g)];
  if (!statements.length) throw new Error(`Missing SQL ${name}`);
  const variables = [...body.split("\n")[0]!.matchAll(/\$(\w+)\s*:/g)].map(match => match[1]!);
  const userScoped = body.includes('level: USER');
  let result;
  let issued: unknown;
  let validatedSession: boolean | undefined;
  const executedFields: Record<string, number | undefined> = {};
  await db.exec("SAVEPOINT operation_fields");
  try {
    for (const statement of statements) {
      const values = statement[3]!.split(",").filter(raw=>raw.trim()).map(raw => {
        const variable=raw.trim().slice(1);
        const priorField=/response\.(lockedBranch|stockMutex)/.exec(raw)?.[1];
        const value=priorField ? executedFields[priorField] : raw.includes('response._execute') ? result?.affectedRows : raw.includes('response.query.issued.token') ? issued : raw.includes('response.query.session.valid') ? validatedSession : raw.includes('auth.uid') ? params[0] : variable==='sessionToken' && body.includes('session: _selectFirst') ? (context ? context.sessionToken : fixtureSessionToken(String(params[0]))) : params[variables.indexOf(variable)+(userScoped?1:0)];
        return value !== null && typeof value === "object" ? JSON.stringify(value) : value;
      });
      const executed = await db.query(statement[2]!, values);
      if (statement[1]==='_execute') {
        const alias=body.slice(0,statement.index).match(/(\w+):\s*$/)?.[1] ?? '_execute';
        executedFields[alias]=executed.affectedRows;
      }
      if(statement[4]!.includes('this.confirmed == true')){
        if(!(executed.rows[0] as {confirmed?:boolean})?.confirmed)throw new Error('STOCK_NOT_CONFIRMED');
        if(result)Object.assign(result,{receipt:executed.rows[0]});
        continue;
      }
      if (statement[4]!.includes('this.valid == true')) {
        validatedSession=(executed.rows[0] as {valid?:boolean})?.valid;
        if (validatedSession!==true) throw new Error('SESSION_REQUIRED');
        continue;
      }
      if(statement[2]!.includes('AS token')) {issued=(executed.rows[0] as {token:string}).token;continue;}
      if(statement[1] === "_selectFirst" && result) Object.assign(result, {receipt:executed.rows[0],meta:executed.rows[0]});
      else result = executed;
      if (statement[4]!.includes('@check') && !result.affectedRows) throw new Error(statement[4]!.includes('SESSION_REQUIRED') ? 'SESSION_REQUIRED' : statement[4]!.includes('POS_BRANCH_DENIED') ? 'POS_BRANCH_DENIED' : 'POS_REJECTED');
    }
    await db.exec("RELEASE SAVEPOINT operation_fields");
    if(issued && result)Object.assign(result,{query:{issued:{token:issued}}});
    return result!;
  } catch (error) {
    await db.exec("ROLLBACK TO SAVEPOINT operation_fields; RELEASE SAVEPOINT operation_fields");
    throw error;
  }
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
  operatorRole: "00000000-0000-4000-8000-000000000016",
};
export async function seed(db: PGlite) {
  await db.query("INSERT INTO tenants(id) VALUES ($1),($2)", [ids.tenant,ids.otherTenant]);
  await db.query("INSERT INTO branches(id,tenant_id) VALUES ($1,$3),($2,$3)", [ids.branch,ids.otherBranch,ids.tenant]);
  await db.query("INSERT INTO roles(id,tenant_id,name,system_role) VALUES ($1,$3,'Administrador da Plataforma',true),($2,$3,'Operador',false)", [ids.role,ids.operatorRole,ids.tenant]);
  await db.query("INSERT INTO users(id,tenant_id,role_id) VALUES ('actor',$1,$2),('operator',$1,$3),('other',$4,$2)", [ids.tenant,ids.role,ids.operatorRole,ids.otherTenant]);
  await db.exec("INSERT INTO user_device_sessions(user_id,tenant_id,session_token,device_id) SELECT id,tenant_id,encode(sha256(convert_to(encode(sha256(convert_to('fixture-session-'||id,'UTF8')),'hex'),'UTF8')),'hex'),'fixture-device-123456' FROM users");
  await db.query("INSERT INTO app_pages(id,page_key) VALUES ($1,'CANAIS_VENDA')",[ids.page]);
  await db.query("INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_update,can_manage,can_create,can_delete) VALUES ($1,$3,$4,true,true,true,true,true),($2,$3,$4,true,true,true,true,true)",[ids.role,ids.operatorRole,ids.page,ids.tenant]);
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

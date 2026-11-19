-- Synthetic identities only; applied exclusively inside the disposable test container.

INSERT INTO tenants(id,legal_name,timezone,currency_code,created_at,updated_at) VALUES('{tenant}','Synthetic EC','America/Sao_Paulo','BRL',now(),now());
INSERT INTO roles(id,tenant_id,name,hierarchy_level,system_role,created_at,updated_at) VALUES('{role}','{tenant}','Synthetic manager',100,false,now(),now());
INSERT INTO users(id,tenant_id,role_id,name,email,created_at,updated_at) VALUES('actor','{tenant}','{role}','Synthetic actor','actor@example.invalid',now(),now());
INSERT INTO user_device_sessions(user_id,tenant_id,session_token,device_id,claimed_at,last_seen_at) VALUES('actor','{tenant}',encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex'),'synthetic',now(),now());
INSERT INTO branches(id,tenant_id,name,created_at,updated_at) VALUES('{branch}','{tenant}','Synthetic store',now(),now()),('{branch2}','{tenant}','Synthetic second',now(),now());
INSERT INTO app_pages(id,page_key,display_name,module,route,created_at,updated_at) SELECT gen_random_uuid(),k,k,'Vendas','/synthetic/'||k,now(),now() FROM unnest(ARRAY['CAIXA','GESTAO_VENDAS','ESTOQUE','COMANDAS','ENCOMENDAS','RELATORIOS_OPERACIONAIS'])k;
INSERT INTO role_page_permissions(role_id,page_id,tenant_id,can_access,can_create,can_update,can_delete,can_manage,can_export,created_at,updated_at) SELECT '{role}',id,'{tenant}',true,true,true,true,true,true,now(),now() FROM app_pages;
INSERT INTO categories(id,tenant_id,name,created_at,updated_at) VALUES('{category}','{tenant}','Synthetic category',now(),now());
INSERT INTO products(id,tenant_id,category_id,name,sale_price_cents,cost_price_cents,bundle_product,created_at,updated_at) VALUES('{product}','{tenant}','{category}','Synthetic cake',10000,4000,false,now(),now()),('{product2}','{tenant}','{category}','Synthetic juice',2800,1000,false,now(),now()),('{bundle}','{tenant}','{category}','Synthetic combo',25000,0,true,now(),now());
INSERT INTO product_components(tenant_id,parent_product_id,component_product_id,quantity,created_at,updated_at) VALUES('{tenant}','{bundle}','{product}',2,now(),now()),('{tenant}','{bundle}','{product2}',1,now(),now());
INSERT INTO stock_balances(tenant_id,branch_id,product_id,quantity,average_cost_cents,version,updated_at) VALUES('{tenant}','{branch}','{product}',100,4000,0,now()),('{tenant}','{branch}','{product2}',100,1000,0,now());
INSERT INTO customers(id,tenant_id,name,created_at,updated_at) VALUES('{customer}','{tenant}','Synthetic customer',now(),now());
INSERT INTO cash_sessions(id,tenant_id,branch_id,opened_by_uid,opened_at,opening_amount_cents,status,created_at,updated_at) VALUES('{cash}','{tenant}','{branch}','actor',now(),100000,'OPEN',now(),now());
INSERT INTO payment_methods(id,tenant_id,code,name,requires_change,created_at,updated_at) VALUES('{method}','{tenant}','PIX','Synthetic Pix',false,now(),now()),('{cashmethod}','{tenant}','CASH','Synthetic cash',true,now(),now());

INSERT INTO stock_movement_types(id,tenant_id,code,name,direction,active,created_at,updated_at) VALUES('{stocktype}','{tenant}','SYNTHETIC_OPENING','Synthetic opening','IN',true,now(),now());
INSERT INTO stock_movements(id,tenant_id,branch_id,product_id,movement_type_id,client_operation_id,quantity,unit_gross_cents,unit_cost_cents,occurred_at,status,created_by_uid,created_at)
VALUES(gen_random_uuid(),'{tenant}','{branch}','{product}','{stocktype}','ec-synthetic-opening',100,4000,4000,now(),'POSTED','actor',now()),(gen_random_uuid(),'{tenant}','{branch}','{product2}','{stocktype}','ec-synthetic-opening',100,1000,1000,now(),'POSTED','actor',now());

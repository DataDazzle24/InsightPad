-- Execute with a read-only principal in the explicitly selected DEV database.
-- Keep results internal. This script never remediates records or backfills keys.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '3s';
SELECT current_database() AS database,current_user AS principal,
 current_setting('transaction_read_only') AS read_only,current_setting('transaction_isolation') AS isolation;
SELECT table_name,column_name,data_type,character_maximum_length,is_nullable
 FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('categories','subcategories')
 AND column_name IN ('id','tenant_id','category_id','name','name_key','active','deleted_at') ORDER BY table_name,ordinal_position;
SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('categories','subcategories') ORDER BY tablename,indexname;
WITH names AS (
 SELECT 'categories' AS entity,tenant_id,NULL::uuid AS category_id,id,
 upper(btrim(regexp_replace(COALESCE(name,''),'[[:space:] ]+',' ','g'))) AS canonical_name
 FROM categories WHERE active AND deleted_at IS NULL
 UNION ALL
 SELECT 'subcategories',tenant_id,category_id,id,upper(btrim(regexp_replace(COALESCE(name,''),'[[:space:] ]+',' ','g')))
 FROM subcategories WHERE active AND deleted_at IS NULL
)
SELECT entity,tenant_id,category_id,canonical_name,count(*) AS records,array_agg(id ORDER BY id) AS record_ids
 FROM names GROUP BY entity,tenant_id,category_id,canonical_name
 HAVING count(*)>1 OR length(canonical_name) NOT BETWEEN 2 AND 120 ORDER BY entity,tenant_id,category_id,canonical_name;
-- JSON field lookup also works before the additive columns exist.
WITH records AS (
 SELECT 'categories' AS entity,id,tenant_id,NULL::uuid AS category_id,name,active,deleted_at,to_jsonb(c)->>'name_key' AS actual_key FROM categories c
 UNION ALL
 SELECT 'subcategories',id,tenant_id,category_id,name,active,deleted_at,to_jsonb(s)->>'name_key' FROM subcategories s
),expected AS (
 SELECT *,CASE WHEN active AND deleted_at IS NULL THEN tenant_id::text||'|'||
 CASE WHEN entity='subcategories' THEN category_id::text||'|' ELSE '' END||upper(btrim(regexp_replace(COALESCE(name,''),'[[:space:] ]+',' ','g'))) ELSE NULL END AS expected_key
 FROM records
)
SELECT entity,count(*) AS total,
 count(*) FILTER(WHERE active AND deleted_at IS NULL AND actual_key IS NULL) AS active_without_key,
 count(*) FILTER(WHERE actual_key IS NOT NULL AND actual_key IS DISTINCT FROM expected_key) AS noncanonical_keys,
 count(*) FILTER(WHERE expected_key IS NOT NULL AND length(expected_key)>300) AS oversized_keys FROM expected GROUP BY entity ORDER BY entity;
ROLLBACK;

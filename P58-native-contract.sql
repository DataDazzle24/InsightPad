SELECT kind,name,definition FROM (
 SELECT 'constraint'::text AS kind,c.relname||'.'||k.conname AS name,
 jsonb_build_object('type',k.contype,'validated',k.convalidated,'deferrable',k.condeferrable,'deferred',k.condeferred,'definition',pg_get_constraintdef(k.oid,true)) AS definition
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname LIKE 'ec\_%' ESCAPE '\'
 UNION ALL
 SELECT 'index',c.relname||'.'||i.relname,jsonb_build_object('valid',x.indisvalid,'ready',x.indisready,'definition',pg_get_indexdef(i.oid))
 FROM pg_index x JOIN pg_class c ON c.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname LIKE 'ec\_%' ESCAPE '\'
 UNION ALL
 SELECT 'function',f.proname||'('||oidvectortypes(f.proargtypes)||')',jsonb_build_object('bodyMD5',md5(f.prosrc),'securityDefiner',f.prosecdef,'volatility',f.provolatile,'returnType',f.prorettype::regtype::text,'config',f.proconfig,'language',l.lanname)
 FROM pg_proc f JOIN pg_namespace n ON n.oid=f.pronamespace JOIN pg_language l ON l.oid=f.prolang
 WHERE n.nspname='public' AND f.proname LIKE 'ec\_%' ESCAPE '\'
 UNION ALL
 SELECT 'trigger',c.relname||'.'||t.tgname,jsonb_build_object('enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true))
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgname LIKE 'ec\_%' ESCAPE '\'
 UNION ALL
 SELECT 'view',c.relname,jsonb_build_object('definition',pg_get_viewdef(c.oid,true))
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v' AND c.relname LIKE 'ec\_%' ESCAPE '\'
 UNION ALL
 SELECT 'column',c.relname||'.'||a.attname,jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'notNull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid))
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'ec\_%' ESCAPE '\' AND a.attnum>0 AND NOT a.attisdropped
) native_contract ORDER BY kind,name;

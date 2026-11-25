-- Execute em conexão previamente confirmada com DEV. Retorna somente agregados.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='3s';

SELECT jsonb_build_object(
 'checkedAt',clock_timestamp(),
 'database',current_database(),
 'journalImbalances',(
  SELECT count(*) FROM (
   SELECT j.id, j.tenant_id
   FROM fin_journals j LEFT JOIN fin_journal_lines l ON l.tenant_id=j.tenant_id AND l.journal_id=j.id
   GROUP BY j.id,j.tenant_id HAVING count(l.id)<2 OR sum(l.debit_cents::numeric-l.credit_cents)<>0
  ) invalid
 ),
 'invalidResiduals',(SELECT count(*) FROM fin_title_state WHERE residual_cents<0 OR residual_cents>original_cents),
 'unresolvedOperations',(SELECT count(*) FROM fin_operations WHERE status='PREPARED'),
 'unresolvedMigrationIssues',(SELECT count(*) FROM fin_migration_issues),
 'financialPages',(SELECT count(*) FROM app_pages WHERE active AND page_key IN(
 'FIN_VISAO','CONTAS_PAGAR','CONTAS_RECEBER','FIN_CONTAS','FIN_CONCILIACAO','FIN_FLUXO','FIN_RELATORIOS','FIN_CONFIGURACOES')),
 'invokerWrappers',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN('fin_prepare','fin_execute','fin_read') AND NOT p.prosecdef)
) verification;
ROLLBACK;

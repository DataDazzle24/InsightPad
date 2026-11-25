-- Read-only inventory for a verified DEV connection. Share counts and status only.
-- The operator checks the Cloud SQL instance name before opening the connection.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='25s';
SET LOCAL lock_timeout='3s';

DO $$ BEGIN
 IF current_database()<>'fdcdb' OR current_setting('server_version_num')::int/10000<>18 THEN
  RAISE EXCEPTION 'Incompatible database or PostgreSQL version';
 END IF;
END $$;

SELECT jsonb_build_object(
 'checkedAt',clock_timestamp(),
 'database',current_database(),
 'postgres',current_setting('server_version'),
 'payables',(SELECT count(*) FROM accounts_payable),
 'receivables',(SELECT count(*) FROM accounts_receivable),
 'payablesWithSettlementFields',(SELECT count(*) FROM accounts_payable WHERE paid_at IS NOT NULL OR paid_amount_cents IS NOT NULL),
 'receivablesWithSettlementFields',(SELECT count(*) FROM accounts_receivable WHERE received_at IS NOT NULL OR received_amount_cents IS NOT NULL),
 'ifoodReceivables',(SELECT count(*) FROM accounts_receivable WHERE source='IFOOD'),
 'financialAccounts',(SELECT count(*) FROM financial_accounts),
 'cashMovements',(SELECT count(*) FROM cash_movements),
 'ecReceipts',(SELECT count(*) FROM ec_receipts),
 'ecRefunds',(SELECT count(*) FROM ec_refunds),
 'branchMismatches',(
  SELECT count(*) FROM (
   SELECT p.tenant_id,p.branch_id FROM accounts_payable p
   UNION ALL SELECT r.tenant_id,r.branch_id FROM accounts_receivable r
  ) t LEFT JOIN branches b ON b.tenant_id=t.tenant_id AND b.id=t.branch_id
  WHERE b.id IS NULL
 ),
 'financeSchemaPresent',to_regclass('public.fin_operations') IS NOT NULL
) inventory;
ROLLBACK;

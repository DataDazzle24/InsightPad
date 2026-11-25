BEGIN;
CREATE OR REPLACE FUNCTION fin_revision(tenant uuid) RETURNS text LANGUAGE sql STABLE AS $$
 SELECT encode(sha256(convert_to(jsonb_build_object(
 'titles',(SELECT jsonb_build_array(count(*),COALESCE(sum(version),0)) FROM fin_titles WHERE tenant_id=tenant),
 'operations',(SELECT jsonb_build_array(count(*),max(finished_at)) FROM fin_operations WHERE tenant_id=tenant),
 'journals',(SELECT jsonb_build_array(count(*),max(created_at)) FROM fin_journals WHERE tenant_id=tenant),
 'imports',(SELECT count(*) FROM fin_import_batches WHERE tenant_id=tenant),
 'maps',(SELECT max(revision) FROM fin_dre_maps WHERE tenant_id=tenant))::text,'UTF8')),'hex')
$$;
CREATE OR REPLACE FUNCTION fin_visible_account(actor users, account uuid, branch uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM fin_account_grants g WHERE g.tenant_id=actor.tenant_id AND g.user_id=actor.id AND g.account_id=account AND ec_branch(actor,g.branch_id) AND (branch IS NULL OR g.branch_id=branch))
$$;
CREATE OR REPLACE FUNCTION fin_global_account(actor users, account uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM fin_account_grants g WHERE g.tenant_id=actor.tenant_id AND g.user_id=actor.id AND g.account_id=account AND g.can_global_balance AND ec_branch(actor,g.branch_id))
$$;
CREATE OR REPLACE FUNCTION fin_accounts(actor users, as_of date) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.name,x.id),'[]') FROM (
 SELECT a.id,a.name,a.account_type,a.branch_id,a.active,c.cutoff_date,c.version,
 CASE WHEN fin_global_account(actor,a.id) THEN 'GLOBAL' ELSE 'PARTIAL_CONTRIBUTION' END balance_scope,
 CASE WHEN c.account_id IS NULL THEN 'CUT_REQUIRED' WHEN as_of<c.cutoff_date THEN 'BEFORE_CUT' ELSE 'VERIFIED' END quality,
 CASE WHEN c.account_id IS NOT NULL AND as_of>=c.cutoff_date THEN
 (CASE WHEN fin_global_account(actor,a.id) THEN a.opening_balance_cents ELSE 0 END::numeric+
 COALESCE((SELECT sum(l.debit_cents::numeric-l.credit_cents) FROM fin_journal_lines l JOIN fin_journals j ON j.id=l.journal_id AND j.tenant_id=l.tenant_id
 WHERE l.tenant_id=a.tenant_id AND l.account_id=a.id AND j.effective_date>c.cutoff_date AND j.effective_date<=as_of
 AND (fin_global_account(actor,a.id) OR fin_visible_account(actor,a.id,l.branch_id))),0))::text END balance_cents
 FROM financial_accounts a LEFT JOIN fin_account_cuts c ON c.tenant_id=a.tenant_id AND c.account_id=a.id
 WHERE a.tenant_id=actor.tenant_id AND fin_visible_account(actor,a.id)
 )x
$$;
CREATE OR REPLACE FUNCTION fin_read(uid text, token text, input jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE actor users; mode text:=input->>'mode'; page text; result jsonb; rows jsonb; total bigint;
 skip integer:=COALESCE((input->>'offset')::integer,0); size integer:=COALESCE((input->>'pageSize')::integer,50);
 state fin_title_state; saved fin_operations; account uuid:=NULLIF(input->>'accountId','')::uuid; branch uuid:=NULLIF(input->>'branchId','')::uuid;
 as_of date; from_date date:=NULLIF(input->>'from','')::date; to_date date:=NULLIF(input->>'to','')::date;
 revision text; category uuid:=NULLIF(input->>'categoryId','')::uuid; center uuid:=NULLIF(input->>'centerId','')::uuid; dre_map uuid;
BEGIN
 actor:=ec_actor(uid,token);
 PERFORM ec_require(jsonb_typeof(input)='object' AND octet_length(input::text)<=16384 AND skip BETWEEN 0 AND 1000000 AND size BETWEEN 1 AND 200,'QUERY_LIMIT');
 PERFORM ec_require(mode IN('OVERVIEW','TITLES','DETAIL','PARTY','ACCOUNTS','LEDGER','TRANSFERS','RECONCILIATION','CASH','FLOW','DRE','CLOSURES','SETTINGS','RESULT','LOOKUPS','ACTUAL','CREDIT','OWNER','MATCHES','LEGACY','REPORTS'),'UNKNOWN_FINANCIAL_QUERY');
 as_of:=COALESCE(NULLIF(input->>'position','')::date,(now() AT TIME ZONE (SELECT timezone FROM tenants WHERE id=actor.tenant_id))::date);
 IF mode='RESULT' THEN
  SELECT * INTO saved FROM fin_operations WHERE id=(input->>'operationId')::uuid AND tenant_id=actor.tenant_id AND actor_uid=actor.id;
  IF saved.id IS NULL THEN
   RETURN jsonb_build_object('status',CASE WHEN EXISTS(SELECT 1 FROM fin_operation_abandonments a
    WHERE a.operation_id=(input->>'operationId')::uuid AND a.tenant_id=actor.tenant_id AND a.actor_uid=actor.id) THEN 'CANCELLED' ELSE 'UNKNOWN' END,
    'operationId',input->>'operationId');
  END IF;
  PERFORM ec_require(ec_can(actor,saved.page_key,'access'),'ACCESS_DENIED');
  RETURN COALESCE(saved.result,jsonb_build_object('status','PREPARED','operationId',saved.id,'payloadHash',saved.payload_hash,'action',saved.action,'intent',saved.intent));
 END IF;
 page:=CASE mode WHEN 'OVERVIEW' THEN 'FIN_VISAO' WHEN 'ACCOUNTS' THEN 'FIN_CONTAS' WHEN 'LEDGER' THEN 'FIN_CONTAS' WHEN 'TRANSFERS' THEN 'FIN_CONTAS'
 WHEN 'OWNER' THEN 'FIN_CONTAS' WHEN 'ACTUAL' THEN 'FIN_FLUXO' WHEN 'CREDIT' THEN 'CONTAS_RECEBER'
 WHEN 'MATCHES' THEN 'FIN_CONCILIACAO' WHEN 'RECONCILIATION' THEN 'FIN_CONCILIACAO' WHEN 'CASH' THEN 'FIN_CONCILIACAO' WHEN 'FLOW' THEN 'FIN_FLUXO'
 WHEN 'DRE' THEN 'FIN_RELATORIOS' WHEN 'REPORTS' THEN 'FIN_RELATORIOS' WHEN 'CLOSURES' THEN 'FIN_RELATORIOS' WHEN 'SETTINGS' THEN 'FIN_CONFIGURACOES'
 ELSE CASE WHEN input->>'direction'='PAY' THEN 'CONTAS_PAGAR' WHEN input->>'direction'='RECEIVE' THEN 'CONTAS_RECEBER' END END;
 IF mode='LOOKUPS' THEN
  page:=input->>'pageKey';
  PERFORM ec_require(page IN('FIN_VISAO','CONTAS_PAGAR','CONTAS_RECEBER','FIN_CONTAS','FIN_CONCILIACAO','FIN_FLUXO','FIN_RELATORIOS','FIN_CONFIGURACOES'),'ACCESS_DENIED');
 END IF;
 PERFORM ec_require(ec_can(actor,page,CASE WHEN COALESCE((input->>'export')::boolean,false) THEN 'export' ELSE 'access' END),'ACCESS_DENIED');
 IF branch IS NOT NULL THEN PERFORM fin_branch(actor,branch);END IF;
 IF account IS NOT NULL THEN PERFORM ec_require(fin_visible_account(actor,account,branch),'ACCOUNT_DENIED');END IF;
 PERFORM fin_lock(actor.tenant_id,true);revision:=fin_revision(actor.tenant_id);
 PERFORM ec_require(NOT(input ? 'revision') OR input->>'revision'=revision,'SNAPSHOT_CHANGED');
 IF mode IN('TITLES','PARTY') THEN
  PERFORM ec_require(COALESCE(input->>'dateType','DUE') IN('DUE','COMPETENCE','FORECAST','SETTLEMENT'),'INVALID_DATE_CRITERION');
  IF mode='PARTY' THEN PERFORM ec_require(NULLIF(input->>'partyId','') IS NOT NULL,'PARTY_REQUIRED');END IF;
  WITH filtered AS (
   SELECT s.*,COALESCE(c.name,v.trade_name,v.legal_name,'Sem contraparte') party_name,
   COALESCE((SELECT sum(cap.amount_cents) FROM fin_title_capacities cap JOIN fin_active_classifications cl ON cl.id=cap.classification_id AND cl.tenant_id=cap.tenant_id WHERE cap.tenant_id=s.tenant_id AND cap.title_id=s.id AND (category IS NULL OR cl.category_id=category) AND (center IS NULL OR cl.center_id=center)),0)::text attributed_original_cents
   FROM fin_title_state s LEFT JOIN customers c ON c.id=s.customer_id AND c.tenant_id=s.tenant_id LEFT JOIN suppliers v ON v.id=s.supplier_id AND v.tenant_id=s.tenant_id
   WHERE s.tenant_id=actor.tenant_id AND s.direction=input->>'direction' AND ec_branch(actor,s.branch_id)
   AND (branch IS NULL OR s.branch_id=branch) AND (account IS NULL OR s.account_id=account)
   AND (NULLIF(input->>'partyId','') IS NULL OR s.customer_id=NULLIF(input->>'partyId','')::uuid OR s.supplier_id=NULLIF(input->>'partyId','')::uuid)
   AND (NULLIF(input->>'search','') IS NULL OR s.description ILIKE '%'||replace(replace(replace(input->>'search','\','\\'),'%','\%'),'_','\_')||'%')
   AND (NULLIF(input->>'source','') IS NULL OR s.source_type=input->>'source')
   AND (NULLIF(input->>'status','') IS NULL OR CASE input->>'status' WHEN 'OPEN' THEN s.residual_cents>0 WHEN 'SETTLED' THEN s.residual_cents=0 WHEN 'OVERDUE' THEN s.residual_cents>0 AND s.due_date<as_of WHEN 'BLOCKED' THEN s.blocked_reason IS NOT NULL ELSE false END)
   AND (category IS NULL AND center IS NULL OR EXISTS(SELECT 1 FROM fin_title_capacities cap JOIN fin_active_classifications cl ON cl.id=cap.classification_id AND cl.tenant_id=cap.tenant_id WHERE cap.tenant_id=s.tenant_id AND cap.title_id=s.id AND (category IS NULL OR cl.category_id=category) AND (center IS NULL OR cl.center_id=center)))
   AND CASE WHEN input->>'dateType'='SETTLEMENT' THEN EXISTS(SELECT 1 FROM fin_allocations a JOIN fin_settlements se ON se.id=a.settlement_id AND se.tenant_id=a.tenant_id WHERE a.tenant_id=s.tenant_id AND a.title_id=s.id AND (from_date IS NULL OR se.effective_date>=from_date) AND (to_date IS NULL OR se.effective_date<=to_date))
    ELSE (from_date IS NULL OR CASE input->>'dateType' WHEN 'COMPETENCE' THEN s.competence_date WHEN 'FORECAST' THEN COALESCE(s.forecast_date,s.due_date) ELSE s.due_date END>=from_date)
     AND (to_date IS NULL OR CASE input->>'dateType' WHEN 'COMPETENCE' THEN s.competence_date WHEN 'FORECAST' THEN COALESCE(s.forecast_date,s.due_date) ELSE s.due_date END<=to_date) END
  ), selected AS(SELECT * FROM filtered ORDER BY due_date,id OFFSET skip LIMIT size)
  SELECT jsonb_build_object('rows',COALESCE((SELECT jsonb_agg(fin_json(to_jsonb(x)) ORDER BY due_date,id) FROM selected x),'[]'),
   'totalCount',(SELECT count(*) FROM filtered),'totals',jsonb_build_object('originalCents',(SELECT COALESCE(sum(original_cents::numeric),0)::text FROM filtered),'residualCents',(SELECT COALESCE(sum(residual_cents::numeric),0)::text FROM filtered),
   'attributedOriginalCents',(SELECT COALESCE(sum(attributed_original_cents::numeric),0)::text FROM filtered))) INTO result;
 ELSIF mode='LEGACY' THEN
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.due_date,x.id),'[]')) INTO result FROM (
   SELECT l.id,l.description,l.source_type,l.original_cents,l.due_date,l.legacy_status,l.has_settlement_evidence,l.active
   FROM fin_legacy_title_inventory l WHERE l.tenant_id=actor.tenant_id AND l.direction=input->>'direction' AND ec_branch(actor,l.branch_id)
   AND (branch IS NULL OR l.branch_id=branch) AND (from_date IS NULL OR l.due_date>=from_date) AND (to_date IS NULL OR l.due_date<=to_date)
   ORDER BY l.due_date,l.id OFFSET skip LIMIT size
  )x;
 ELSIF mode='DETAIL' THEN
  SELECT * INTO state FROM fin_title_state WHERE id=(input->>'titleId')::uuid AND tenant_id=actor.tenant_id;
  PERFORM ec_require(state.id IS NOT NULL AND state.direction=input->>'direction' AND ec_branch(actor,state.branch_id),'TITLE_DENIED');
  SELECT jsonb_build_object('title',fin_json(to_jsonb(state)),
   'document',(SELECT fin_json(to_jsonb(d)) FROM fin_documents d WHERE d.tenant_id=actor.tenant_id AND d.id=state.document_id),
   'contacts',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(c)) ORDER BY c.created_at,c.id),'[]') FROM fin_contacts c WHERE c.tenant_id=actor.tenant_id AND c.title_id=state.id),
   'classifications',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(c)) ORDER BY c.ordinal),'[]') FROM fin_active_classifications c WHERE c.tenant_id=actor.tenant_id AND c.document_id=state.document_id),
   'principalEvents',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(e)) ORDER BY e.created_at,e.id),'[]') FROM fin_principal_events e WHERE e.tenant_id=actor.tenant_id AND e.title_id=state.id),
   'settlements',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.created_at,x.id),'[]') FROM (
    SELECT a.*,s.effective_date,s.reference,s.fee_mode,s.created_at,(r.id IS NOT NULL) reversed FROM fin_allocations a JOIN fin_settlements s ON s.id=a.settlement_id AND s.tenant_id=a.tenant_id
    LEFT JOIN fin_reversals r ON r.tenant_id=s.tenant_id AND r.settlement_id=s.id WHERE a.tenant_id=actor.tenant_id AND a.title_id=state.id)x)) INTO result;
 ELSIF mode IN('ACCOUNTS','OVERVIEW') THEN
  result:=jsonb_build_object('accounts',fin_accounts(actor,as_of));
  IF mode='OVERVIEW' THEN
   SELECT result||jsonb_build_object('titles',jsonb_build_object(
   'payableCents',COALESCE(sum(s.residual_cents::numeric) FILTER(WHERE s.direction='PAY'),0)::text,
   'receivableCents',COALESCE(sum(s.residual_cents::numeric) FILTER(WHERE s.direction='RECEIVE'),0)::text,
   'overdueCents',COALESCE(sum(s.residual_cents::numeric) FILTER(WHERE s.direction='RECEIVE' AND s.due_date<as_of),0)::text,
   'blockedCount',count(*) FILTER(WHERE s.blocked_reason IS NOT NULL)),
   'quality',jsonb_build_object('unmappedLegacyPayables',(SELECT count(*) FROM accounts_payable p WHERE p.tenant_id=actor.tenant_id AND ec_branch(actor,p.branch_id) AND NOT EXISTS(SELECT 1 FROM fin_titles t WHERE t.tenant_id=p.tenant_id AND t.payable_id=p.id)),
   'unmappedLegacyReceivables',(SELECT count(*) FROM accounts_receivable r WHERE r.tenant_id=actor.tenant_id AND ec_branch(actor,r.branch_id) AND NOT EXISTS(SELECT 1 FROM fin_titles t WHERE t.tenant_id=r.tenant_id AND t.receivable_id=r.id)))) INTO result
   FROM fin_title_state s WHERE s.tenant_id=actor.tenant_id AND ec_branch(actor,s.branch_id) AND (branch IS NULL OR s.branch_id=branch);
  END IF;
 ELSIF mode='LEDGER' THEN
  PERFORM ec_require(account IS NOT NULL,'ACCOUNT_REQUIRED');
  WITH filtered AS (
   SELECT l.id,l.branch_id,l.account_id,l.settlement_id,j.effective_date,j.description,j.source_key,
   l.debit_cents,l.credit_cents,(l.debit_cents::numeric-l.credit_cents)::text amount_cents,j.created_at
   FROM fin_journal_lines l JOIN fin_journals j ON j.id=l.journal_id AND j.tenant_id=l.tenant_id
   WHERE l.tenant_id=actor.tenant_id AND l.account_id=account AND (fin_global_account(actor,account) OR fin_visible_account(actor,account,l.branch_id))
   AND (branch IS NULL OR l.branch_id=branch) AND (from_date IS NULL OR j.effective_date>=from_date) AND (to_date IS NULL OR j.effective_date<=to_date)
  ), selected AS(SELECT * FROM filtered ORDER BY effective_date,id OFFSET skip LIMIT size)
  SELECT jsonb_build_object('rows',COALESCE((SELECT jsonb_agg(fin_json(to_jsonb(x)) ORDER BY effective_date,id) FROM selected x),'[]'),
  'totalCount',(SELECT count(*) FROM filtered),'totals',jsonb_build_object('debitCents',(SELECT COALESCE(sum(debit_cents::numeric),0)::text FROM filtered),'creditCents',(SELECT COALESCE(sum(credit_cents::numeric),0)::text FROM filtered))) INTO result;
 ELSIF mode='TRANSFERS' THEN
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.effective_date,x.id),'[]')) INTO result FROM (
   SELECT t.*, a.name from_name,b.name to_name
   FROM fin_transfers t JOIN financial_accounts a ON a.tenant_id=t.tenant_id AND a.id=t.from_account
   JOIN financial_accounts b ON b.tenant_id=t.tenant_id AND b.id=t.to_account
   WHERE t.tenant_id=actor.tenant_id AND ec_branch(actor,t.branch_id)
   AND fin_visible_account(actor,t.from_account,t.branch_id) AND fin_visible_account(actor,t.to_account,t.branch_id)
   AND (branch IS NULL OR t.branch_id=branch) AND (from_date IS NULL OR t.effective_date>=from_date) AND (to_date IS NULL OR t.effective_date<=to_date)
   ORDER BY t.effective_date,t.id OFFSET skip LIMIT size)x;
 ELSIF mode='RECONCILIATION' THEN
  PERFORM ec_require(account IS NOT NULL,'ACCOUNT_REQUIRED');
  PERFORM ec_require(fin_global_account(actor,account),'GLOBAL_ACCOUNT_ACCESS_REQUIRED');
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.booked_date,x.id),'[]')) INTO result FROM (
   SELECT b.*,COALESCE((SELECT sum(e.amount_cents) FROM fin_match_edges e WHERE e.tenant_id=b.tenant_id AND e.bank_id=b.id AND NOT EXISTS(SELECT 1 FROM fin_unmatches u WHERE u.tenant_id=e.tenant_id AND u.match_id=e.match_id)),0)::text matched_cents
   FROM fin_bank_transactions b WHERE b.tenant_id=actor.tenant_id AND b.account_id=account AND (from_date IS NULL OR b.booked_date>=from_date) AND (to_date IS NULL OR b.booked_date<=to_date)
   ORDER BY b.booked_date,b.id OFFSET skip LIMIT size)x;
  IF input->>'candidates'='true' THEN
   SELECT result||jsonb_build_object('candidates',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.effective_date DESC,x.id),'[]')) INTO result FROM (
    SELECT l.id,l.branch_id,j.effective_date,j.description,(l.debit_cents::numeric-l.credit_cents)::text amount_cents
    FROM fin_journal_lines l JOIN fin_journals j ON j.id=l.journal_id AND j.tenant_id=l.tenant_id
    WHERE l.tenant_id=actor.tenant_id AND l.account_id=account AND ec_branch(actor,l.branch_id)
    AND EXISTS(SELECT 1 FROM fin_account_grants g WHERE g.tenant_id=l.tenant_id AND g.account_id=account AND g.branch_id=l.branch_id AND g.user_id=actor.id AND g.can_reconcile)
    AND NOT EXISTS(SELECT 1 FROM fin_journals r WHERE r.tenant_id=j.tenant_id AND r.reverses_id=j.id)
    AND abs(l.debit_cents::numeric-l.credit_cents)>COALESCE((SELECT sum(abs(e.amount_cents::numeric)) FROM fin_match_edges e WHERE e.tenant_id=l.tenant_id AND e.line_id=l.id AND NOT EXISTS(SELECT 1 FROM fin_unmatches u WHERE u.tenant_id=e.tenant_id AND u.match_id=e.match_id)),0)
    ORDER BY j.effective_date DESC,l.id LIMIT size
   )x;
  END IF;
 ELSIF mode='CASH' THEN
  PERFORM ec_require(ec_can(actor,'CAIXA','access'),'ACCESS_DENIED');
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.opened_at,x.id),'[]')) INTO result FROM (
   SELECT s.*, (s.opening_amount_cents::numeric+COALESCE((SELECT sum(m.amount_cents::numeric) FROM cash_movements m WHERE m.tenant_id=s.tenant_id AND m.session_id=s.id AND m.movement_type<>'OPENING'),0))::text calculated_expected_cents
   FROM cash_sessions s WHERE s.tenant_id=actor.tenant_id AND ec_branch(actor,s.branch_id) AND (s.opened_by_uid=actor.id OR ec_can(actor,'CAIXA','manage'))
   AND (branch IS NULL OR s.branch_id=branch) ORDER BY s.opened_at,s.id OFFSET skip LIMIT size)x;
 ELSIF mode='ACTUAL' THEN
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.date),'[]')) INTO result FROM (
   SELECT j.effective_date date,sum(l.debit_cents::numeric)::text debit_cents,sum(l.credit_cents::numeric)::text credit_cents,sum(l.debit_cents::numeric-l.credit_cents)::text amount_cents
   FROM fin_journals j JOIN fin_journal_lines l ON l.tenant_id=j.tenant_id AND l.journal_id=j.id
   WHERE j.tenant_id=actor.tenant_id AND l.account_id IS NOT NULL AND (account IS NULL OR l.account_id=account)
   AND (branch IS NULL OR l.branch_id=branch) AND (fin_global_account(actor,l.account_id) OR fin_visible_account(actor,l.account_id,l.branch_id))
   AND j.effective_date BETWEEN COALESCE(from_date,as_of-30) AND COALESCE(to_date,as_of)
   GROUP BY j.effective_date ORDER BY j.effective_date OFFSET skip LIMIT size
  ) x;
 ELSIF mode='CREDIT' THEN
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.name,x.id),'[]')) INTO result FROM (
   SELECT c.id,c.name,p.version,p.limit_cents
   FROM fin_credit_policies p JOIN customers c ON c.tenant_id=p.tenant_id AND c.id=p.customer_id
   WHERE p.tenant_id=actor.tenant_id AND c.active AND c.deleted_at IS NULL
   ORDER BY c.name,c.id OFFSET skip LIMIT size
  ) x;
 ELSIF mode='MATCHES' THEN
  PERFORM ec_require(account IS NOT NULL AND fin_global_account(actor,account),'GLOBAL_ACCOUNT_ACCESS_REQUIRED');
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.created_at DESC,x.id),'[]')) INTO result FROM (
   SELECT m.id,m.created_at,(u.match_id IS NOT NULL) unmatched, count(e.id) edge_count,
    bool_or(e.created_settlement_id IS NOT NULL) has_created_settlement, min(l.branch_id::text)::uuid branch_id
   FROM fin_matches m JOIN fin_match_edges e ON e.tenant_id=m.tenant_id AND e.match_id=m.id
   JOIN fin_journal_lines l ON l.tenant_id=e.tenant_id AND l.id=e.line_id
   LEFT JOIN fin_unmatches u ON u.tenant_id=m.tenant_id AND u.match_id=m.id
   WHERE m.tenant_id=actor.tenant_id AND m.account_id=account
   GROUP BY m.id,m.created_at,u.match_id HAVING bool_and(ec_branch(actor,l.branch_id))
   ORDER BY m.created_at DESC,m.id OFFSET skip LIMIT size
  ) x;
 ELSIF mode='OWNER' THEN
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.effective_date DESC,x.id),'[]')) INTO result FROM (
   SELECT m.id,m.direction,m.amount_cents,m.effective_date,m.reason,n.name nature_name,u.name beneficiary
   FROM fin_owner_movements m JOIN fin_owner_natures n ON n.tenant_id=m.tenant_id AND n.id=m.nature_id
   JOIN users u ON u.tenant_id=m.tenant_id AND u.id=m.beneficiary_uid
   WHERE m.tenant_id=actor.tenant_id AND ec_branch(actor,m.branch_id) AND fin_visible_account(actor,m.account_id,m.branch_id)
   AND (account IS NULL OR m.account_id=account) AND (branch IS NULL OR m.branch_id=branch)
   ORDER BY m.effective_date DESC,m.id OFFSET skip LIMIT size
  ) x;
 ELSIF mode='FLOW' THEN
  PERFORM ec_require(COALESCE(to_date,as_of+30)-COALESCE(from_date,as_of) BETWEEN 0 AND 730,'QUERY_LIMIT');
  WITH future AS(
   SELECT s.direction,s.residual_cents,COALESCE(s.forecast_date,s.due_date) expected_date,
    s.source_type='RECURRENCE_ESTIMATE' estimated
   FROM fin_title_state s WHERE s.tenant_id=actor.tenant_id AND ec_branch(actor,s.branch_id)
   AND (branch IS NULL OR s.branch_id=branch) AND (account IS NULL OR s.account_id=account) AND s.residual_cents>0
   AND s.blocked_reason IS NULL AND s.legacy_status NOT IN('CANCELLED','CANCELED')
   UNION ALL
   SELECT v.template->>'direction',fin_amount(v.template->'amountCents'),schedule.scheduled_date,v.estimated
   FROM fin_recurrences r
   JOIN fin_recurrence_versions v ON v.tenant_id=r.tenant_id AND v.recurrence_id=r.id AND v.version=r.current_version
   CROSS JOIN LATERAL generate_series(r.next_occurrence,LEAST(COALESCE(v.occurrence_limit-1,1200),1200)) n
   CROSS JOIN LATERAL (SELECT fin_date(v.anchor_date,v.frequency,n-v.effective_occurrence) AS scheduled_date) schedule
   WHERE r.tenant_id=actor.tenant_id AND r.active AND ec_branch(actor,r.branch_id)
   AND (branch IS NULL OR r.branch_id=branch) AND account IS NULL
   AND schedule.scheduled_date BETWEEN COALESCE(from_date,as_of) AND COALESCE(to_date,as_of+30)
   AND (v.end_date IS NULL OR schedule.scheduled_date<=v.end_date)
   AND NOT EXISTS(SELECT 1 FROM fin_occurrences o WHERE o.tenant_id=r.tenant_id AND o.recurrence_id=r.id AND o.occurrence=n)
  ), aggregated AS (
   SELECT expected_date date,sum(CASE direction WHEN 'PAY' THEN -residual_cents::numeric ELSE residual_cents END)::text amount_cents,
    bool_or(estimated) contains_estimate
   FROM future WHERE expected_date BETWEEN COALESCE(from_date,as_of) AND COALESCE(to_date,as_of+30)
   GROUP BY expected_date
  ) SELECT jsonb_build_object('accounts',fin_accounts(actor,as_of),
   'overdueCents',COALESCE((SELECT sum(CASE direction WHEN 'PAY' THEN -residual_cents::numeric ELSE residual_cents END) FROM future WHERE expected_date<as_of),0)::text,
   'totalCount',(SELECT count(*) FROM aggregated),
   'rows',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.date) FROM (
    SELECT * FROM aggregated ORDER BY date OFFSET skip LIMIT size
   )x),'[]')) INTO result;
 ELSIF mode='REPORTS' THEN
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.competence_date,x.direction),'[]')) INTO result FROM (
   SELECT s.competence_date,s.direction,count(DISTINCT s.document_id) documents,
    sum(s.original_cents::numeric)::text nominal_cents,sum(s.residual_cents::numeric)::text residual_cents
   FROM fin_title_state s WHERE s.tenant_id=actor.tenant_id AND ec_branch(actor,s.branch_id)
   AND (branch IS NULL OR s.branch_id=branch)
   AND s.competence_date BETWEEN COALESCE(from_date,as_of-30) AND COALESCE(to_date,as_of)
   GROUP BY s.competence_date,s.direction ORDER BY s.competence_date,s.direction OFFSET skip LIMIT size
  )x;
 ELSIF mode='DRE' THEN
  PERFORM ec_require(from_date IS NOT NULL AND to_date IS NOT NULL AND to_date>=from_date,'PERIOD_REQUIRED');
  dre_map:=NULLIF(input->>'mapId','')::uuid;
  IF dre_map IS NULL THEN SELECT id INTO dre_map FROM fin_dre_maps m WHERE m.tenant_id=actor.tenant_id AND m.effective_from<=to_date ORDER BY m.revision DESC LIMIT 1;END IF;
  PERFORM ec_require(dre_map IS NULL OR EXISTS(SELECT 1 FROM fin_dre_maps m WHERE m.id=dre_map AND m.tenant_id=actor.tenant_id),'MAP_DENIED');
  WITH events AS(
   SELECT e.*,m.dre_line FROM (
    SELECT x.tenant_id,x.branch_id,x.sale_id,x.document_id,x.event_type,x.competence_date,x.amount_cents::numeric,
     COALESCE(x.category_id,(d.source_categories->>x.event_type)::uuid) category_id,x.center_id,
     CASE WHEN x.quality='MISSING_CLASSIFICATION' AND d.source_categories ? x.event_type THEN 'KNOWN' ELSE x.quality END quality
    FROM fin_economic_events x LEFT JOIN fin_dre_maps d ON d.tenant_id=x.tenant_id AND d.id=dre_map
    WHERE x.tenant_id=actor.tenant_id AND x.competence_date BETWEEN from_date AND to_date
    AND x.event_type<>'CLASSIFICATION_REVERSAL'
    AND NOT EXISTS(SELECT 1 FROM fin_economic_events y WHERE y.tenant_id=x.tenant_id AND y.reverses_id=x.id AND y.event_type='CLASSIFICATION_REVERSAL')
    UNION ALL
    SELECT s.tenant_id,s.branch_id,s.sale_id,NULL,s.event_type,s.competence_date,s.amount_cents,(d.source_categories->>s.event_type)::uuid,NULL,s.quality
    FROM fin_sale_economics s LEFT JOIN fin_dre_maps d ON d.tenant_id=s.tenant_id AND d.id=dre_map
    WHERE s.tenant_id=actor.tenant_id AND s.competence_date BETWEEN from_date AND to_date
   )e LEFT JOIN fin_dre_map_lines m ON m.tenant_id=e.tenant_id AND m.map_id=dre_map AND m.category_id=e.category_id
   WHERE e.tenant_id=actor.tenant_id AND ec_branch(actor,e.branch_id) AND e.competence_date BETWEEN from_date AND to_date
   AND (branch IS NULL OR e.branch_id=branch) AND (category IS NULL OR e.category_id=category) AND (center IS NULL OR e.center_id=center)
  ) SELECT jsonb_build_object('mapId',dre_map,'quality',CASE WHEN dre_map IS NULL OR EXISTS(SELECT 1 FROM events WHERE dre_line IS NULL OR amount_cents IS NULL OR quality<>'KNOWN') THEN 'INCOMPLETE' ELSE 'COMPLETE' END,
   'gaps',COALESCE((SELECT jsonb_agg(fin_json(to_jsonb(e))) FROM events e WHERE e.dre_line IS NULL OR e.amount_cents IS NULL OR e.quality<>'KNOWN'),'[]'),
   'rows',COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT dre_line,sum(amount_cents::numeric)::text amount_cents FROM events WHERE dre_line IS NOT NULL GROUP BY dre_line)x),'[]')) INTO result;
 ELSIF mode='CLOSURES' THEN
  SELECT jsonb_build_object('rows',COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.period,x.revision),'[]')) INTO result FROM (
  SELECT c.* FROM fin_closures c WHERE c.tenant_id=actor.tenant_id AND ec_branch(actor,c.branch_id) AND (branch IS NULL OR c.branch_id=branch) ORDER BY c.period,c.revision OFFSET skip LIMIT size)x;
 ELSIF mode IN('SETTINGS','LOOKUPS') THEN
  SELECT jsonb_build_object(
   'branches',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',b.id,'name',b.name) ORDER BY b.name),'[]') FROM branches b WHERE b.tenant_id=actor.tenant_id AND ec_branch(actor,b.id)),
   'accounts',fin_accounts(actor,as_of),
   'accountGrants',(SELECT COALESCE(jsonb_agg(jsonb_build_object('accountId',g.account_id,'branchId',g.branch_id,'canPost',g.can_post,'canReconcile',g.can_reconcile,'canGlobalBalance',g.can_global_balance)),'[]')
    FROM fin_account_grants g WHERE g.tenant_id=actor.tenant_id AND g.user_id=actor.id AND ec_branch(actor,g.branch_id)),
   'categories',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.name),'[]') FROM (SELECT c.id,c.name,c.direction,c.active,d.code,d.parent_id,d.nature,d.version FROM financial_categories c LEFT JOIN fin_category_details d ON d.tenant_id=c.tenant_id AND d.category_id=c.id WHERE c.tenant_id=actor.tenant_id)x),
   'centers',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(c)) ORDER BY c.name),'[]') FROM fin_centers c WHERE c.tenant_id=actor.tenant_id AND (c.branch_id IS NULL OR ec_branch(actor,c.branch_id))),
   'methods',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'code',m.code,'requiresChange',m.requires_change) ORDER BY m.name),'[]') FROM payment_methods m WHERE m.tenant_id=actor.tenant_id AND m.active),
   'recurrences',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(x)) ORDER BY x.id),'[]') FROM (
     SELECT r.id,r.active,r.branch_id,r.current_version version,r.next_occurrence,v.template,v.anchor_date,v.frequency,v.end_date,v.occurrence_limit,v.estimated
     FROM fin_recurrences r JOIN fin_recurrence_versions v ON v.tenant_id=r.tenant_id AND v.recurrence_id=r.id AND v.version=r.current_version
     WHERE r.tenant_id=actor.tenant_id AND ec_branch(actor,r.branch_id) AND (page='FIN_CONFIGURACOES')
    )x),
   'ownerNatures',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',n.id,'name',n.name) ORDER BY n.name),'[]') FROM fin_owner_natures n WHERE n.tenant_id=actor.tenant_id AND n.active AND page IN('FIN_CONTAS','FIN_CONFIGURACOES')),
   'beneficiaries',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',u.id,'name',u.name) ORDER BY u.name),'[]') FROM (SELECT id,name FROM users WHERE tenant_id=actor.tenant_id AND active AND deleted_at IS NULL AND page='FIN_CONTAS' AND ec_can(actor,page,'manage') ORDER BY name,id LIMIT 200)u),
   'terms',(SELECT COALESCE(jsonb_agg(fin_json(to_jsonb(t)) ORDER BY t.name),'[]') FROM fin_terms t WHERE t.tenant_id=actor.tenant_id AND t.active),
   'customers',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name) ORDER BY c.name),'[]') FROM (SELECT id,name FROM customers WHERE tenant_id=actor.tenant_id AND active AND deleted_at IS NULL ORDER BY name,id LIMIT 200)c),
   'suppliers',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name) ORDER BY s.name),'[]') FROM (SELECT id,COALESCE(trade_name,legal_name) name FROM suppliers WHERE tenant_id=actor.tenant_id AND active AND deleted_at IS NULL ORDER BY name,id LIMIT 200)s)) INTO result;
 END IF;
 RETURN COALESCE(result,'{}')||jsonb_build_object('revision',revision,'offset',skip,'pageSize',size,'position',as_of);
END $$;
COMMIT;

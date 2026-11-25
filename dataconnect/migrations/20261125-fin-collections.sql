BEGIN;
CREATE OR REPLACE FUNCTION fin_collections(actor users, operation uuid, action text, p jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
<<collections_scope>>
DECLARE state fin_title_state; item jsonb; result jsonb; template jsonb; branch uuid; customer uuid; new_id uuid;
 amount bigint; total numeric:=0; discount bigint; interest bigint; customer_limit fin_credit_policies;
 exposed numeric; overdue boolean; day date; event fin_principal_events; recurrence fin_recurrences;
 schedule fin_recurrence_versions; occurrence integer; version bigint; existing fin_occurrences; old_version bigint;
BEGIN
 IF action='C26' THEN
  SELECT * INTO state FROM fin_title_state WHERE tenant_id=actor.tenant_id AND id=(p->>'titleId')::uuid;
  PERFORM ec_require(state.id IS NOT NULL AND state.direction=p->>'direction','TITLE_DENIED');PERFORM fin_branch(actor,state.branch_id);
  PERFORM ec_require(state.version::text=p->>'expectedVersion','VERSION_CONFLICT');
  PERFORM ec_require(length(btrim(p->>'note')) BETWEEN 3 AND 2000,'REASON_REQUIRED');
  new_id:=gen_random_uuid();
  INSERT INTO fin_contacts(id,tenant_id,title_id,forecast_date,note,created_by) VALUES(new_id,actor.tenant_id,state.id,NULLIF(p->>'forecastDate','')::date,p->>'note',actor.id);
  UPDATE fin_titles t SET forecast_date=COALESCE(NULLIF(p->>'forecastDate','')::date,t.forecast_date),version=t.version+1 WHERE t.tenant_id=actor.tenant_id AND t.id=state.id;
  RETURN jsonb_build_object('contactId',new_id,'titleId',state.id,'version',(state.version+1)::text);
 ELSIF action='C27' THEN
  PERFORM ec_require(jsonb_typeof(p->'sources')='array' AND jsonb_array_length(p->'sources') BETWEEN 1 AND 100 AND length(btrim(p->>'reason')) BETWEEN 3 AND 1000,'VALIDATION_ERROR');
  PERFORM ec_require((SELECT count(DISTINCT value->>'titleId') FROM jsonb_array_elements(p->'sources'))=jsonb_array_length(p->'sources'),'DUPLICATE_TITLE');
  day:=(p->>'effectiveDate')::date;discount:=fin_amount(p->'discountCents');interest:=fin_amount(p->'interestCents');
  FOR item IN SELECT value FROM jsonb_array_elements(p->'sources') ORDER BY value->>'titleId' LOOP
   SELECT * INTO state FROM fin_title_state WHERE tenant_id=actor.tenant_id AND id=(item->>'titleId')::uuid;
   PERFORM ec_require(state.id IS NOT NULL AND state.direction='RECEIVE' AND p->>'direction'='RECEIVE' AND state.customer_id IS NOT NULL AND state.blocked_reason IS NULL,'AGREEMENT_SOURCE_DENIED');
   PERFORM fin_branch(actor,state.branch_id);PERFORM fin_period(actor.tenant_id,state.branch_id,day);
   PERFORM ec_require(state.version::text=item->>'expectedVersion' AND state.residual_cents>0,'VERSION_CONFLICT');
   IF customer IS NULL THEN customer:=state.customer_id;branch:=state.branch_id;END IF;
   PERFORM ec_require(state.customer_id=customer AND state.branch_id=branch,'AGREEMENT_SCOPE_CONFLICT');
   total:=total+state.residual_cents;
  END LOOP;
  PERFORM ec_require(discount<=total AND total-discount+interest>0,'DISCOUNT_RANGE');
  -- A renegotiation substitutes residual principal, not a second economic sale.
  result:=fin_new_document(actor,operation,(p->'destination')||jsonb_build_object('direction','RECEIVE','customerId',customer,'branchId',branch,'amountCents',(total-discount+interest)::text),'AGREEMENT');
  new_id:=gen_random_uuid();
  INSERT INTO fin_agreements(id,tenant_id,operation_id,destination_document,reason,discount_cents,interest_cents) VALUES(new_id,actor.tenant_id,operation,(result->>'documentId')::uuid,p->>'reason',discount,interest);
  FOR item IN SELECT value FROM jsonb_array_elements(p->'sources') ORDER BY value->>'titleId' LOOP
   SELECT * INTO state FROM fin_title_state WHERE tenant_id=actor.tenant_id AND id=(item->>'titleId')::uuid;
   INSERT INTO fin_agreement_sources(tenant_id,agreement_id,title_id,principal_cents) VALUES(actor.tenant_id,new_id,state.id,state.residual_cents);
   PERFORM fin_principal(actor,operation,state.id,NULL,state.residual_cents,'AGREEMENT',day);
  END LOOP;
  IF discount>0 OR interest>0 THEN
   INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,quality)
   SELECT actor.tenant_id,branch,'agreement:'||new_id||':'||x.kind,x.kind,day,x.value,(result->>'documentId')::uuid,'MISSING_CLASSIFICATION'
   FROM (VALUES('DISCOUNT',-discount),('INTEREST',interest))x(kind,value) WHERE value<>0;
  END IF;
  RETURN result||jsonb_build_object('agreementId',new_id);
 ELSIF action='C29' THEN
  SELECT * INTO event FROM fin_principal_events WHERE tenant_id=actor.tenant_id AND id=(p->>'lossEventId')::uuid AND event_type='LOSS';
  SELECT * INTO state FROM fin_title_state WHERE tenant_id=actor.tenant_id AND id=event.title_id;
  PERFORM ec_require(state.id IS NOT NULL AND p->>'direction'='RECEIVE','TITLE_DENIED');PERFORM fin_branch(actor,state.branch_id);
  PERFORM ec_require(state.version::text=p->>'expectedVersion','VERSION_CONFLICT');
  PERFORM ec_require(length(btrim(p->>'reason')) BETWEEN 3 AND 1000 AND NOT EXISTS(SELECT 1 FROM fin_principal_events e WHERE e.tenant_id=actor.tenant_id AND e.reverses_id=event.id),'LOSS_ALREADY_RECOVERED');
  day:=(p->>'effectiveDate')::date;PERFORM fin_period(actor.tenant_id,state.branch_id,day);
  PERFORM fin_principal(actor,operation,state.id,NULL,-event.amount_cents,'RECOVERY',day,event.id);
  INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,quality)
  VALUES(actor.tenant_id,state.branch_id,'recovery:'||event.id,'RECOVERY',day,event.amount_cents,state.document_id,'MISSING_CLASSIFICATION');
  -- Recovery reinstates the claim. Receipt, if requested, belongs to this same transaction.
  IF p ? 'settlement' THEN
   result:=fin_settle(actor,operation,(p->'settlement')||jsonb_build_object('direction','RECEIVE','lines',jsonb_build_array(jsonb_build_object(
   'titleId',state.id,'expectedVersion',(state.version+1)::text,'principalCents',event.amount_cents::text,'discountCents','0','interestCents','0','penaltyCents','0','feeCents','0'))));
  END IF;
  RETURN COALESCE(result,'{}')||jsonb_build_object('titleId',state.id,'recoveredCents',event.amount_cents::text);
 ELSIF action='C30' THEN
  PERFORM ec_require(p->>'direction'='RECEIVE' AND length(btrim(p->>'reason')) BETWEEN 3 AND 1000,'REASON_REQUIRED');
  customer:=(p->>'customerId')::uuid;amount:=fin_amount(p->'limitCents');
  PERFORM ec_require(EXISTS(SELECT 1 FROM customers c WHERE c.tenant_id=actor.tenant_id AND c.id=customer AND c.active AND c.deleted_at IS NULL),'PARTY_DENIED');
  SELECT * INTO customer_limit FROM fin_credit_policies WHERE tenant_id=actor.tenant_id AND customer_id=customer FOR UPDATE;
  IF customer_limit.customer_id IS NULL THEN
   PERFORM ec_require(p->>'expectedVersion'='0','VERSION_CONFLICT');
   INSERT INTO fin_credit_policies(tenant_id,customer_id,limit_cents,configured_by) VALUES(actor.tenant_id,customer,amount,actor.id);version:=1;
  ELSE
   PERFORM ec_require(customer_limit.version::text=p->>'expectedVersion','VERSION_CONFLICT');version:=customer_limit.version+1;
   UPDATE fin_credit_policies SET limit_cents=amount,version=collections_scope.version,configured_by=actor.id,configured_at=now() WHERE tenant_id=actor.tenant_id AND customer_id=customer;
  END IF;
  RETURN jsonb_build_object('customerId',customer,'limitCents',amount::text,'version',version::text);
 ELSIF action='C31' THEN
  PERFORM ec_require(p->>'direction'='RECEIVE','DIRECTION_MISMATCH');customer:=(p->>'customerId')::uuid;
  SELECT * INTO customer_limit FROM fin_credit_policies WHERE tenant_id=actor.tenant_id AND customer_id=customer FOR UPDATE;
  PERFORM ec_require(customer_limit.customer_id IS NOT NULL,'CREDIT_POLICY_REQUIRED');amount:=fin_amount(p#>'{title,amountCents}');
  SELECT COALESCE(sum(s.residual_cents::numeric),0),COALESCE(bool_or(s.residual_cents>0 AND s.due_date<(now() AT TIME ZONE t.timezone)::date),false) INTO exposed,overdue
  FROM fin_title_state s JOIN tenants t ON t.id=s.tenant_id WHERE s.tenant_id=actor.tenant_id AND s.customer_id=customer AND s.direction='RECEIVE';
  PERFORM ec_require(customer_limit.limit_cents>0 AND exposed+amount<=customer_limit.limit_cents,'CREDIT_LIMIT_EXCEEDED');
  IF overdue THEN PERFORM ec_require(length(btrim(p->>'overdueReason')) BETWEEN 3 AND 1000,'OVERDUE_AUTHORIZATION_REQUIRED');END IF;
  result:=fin_new_document(actor,operation,(p->'title')||jsonb_build_object('direction','RECEIVE','customerId',customer),'CREDIT');
  branch:=(p#>>'{title,branchId}')::uuid;new_id:=gen_random_uuid();
  INSERT INTO fin_credit_authorizations(id,tenant_id,customer_id,branch_id,operation_id,document_id,amount_cents,authorized_by,overdue_reason)
  VALUES(new_id,actor.tenant_id,customer,branch,operation,(result->>'documentId')::uuid,amount,actor.id,CASE WHEN overdue THEN p->>'overdueReason' END);
  RETURN result||jsonb_build_object('authorizationId',new_id,'exposureCents',(exposed+amount)::text);
 ELSIF action='C22' THEN
  branch:=(p->>'branchId')::uuid;PERFORM fin_branch(actor,branch);
  template:=p->'template';amount:=fin_amount(template->'amountCents');
  PERFORM ec_require(amount>0 AND template->>'direction' IN('PAY','RECEIVE') AND length(btrim(template->>'description')) BETWEEN 1 AND 180,'VALIDATION_ERROR');
  PERFORM fin_access(actor,CASE template->>'direction' WHEN 'PAY' THEN 'CONTAS_PAGAR' ELSE 'CONTAS_RECEBER' END,'manage');
  new_id:=NULLIF(p->>'recurrenceId','')::uuid;
  IF new_id IS NULL THEN
   new_id:=gen_random_uuid();version:=1;occurrence:=0;
   INSERT INTO fin_recurrences(id,tenant_id,branch_id,current_version) VALUES(new_id,actor.tenant_id,branch,version);
  ELSE
   SELECT * INTO recurrence FROM fin_recurrences WHERE tenant_id=actor.tenant_id AND id=new_id FOR UPDATE;
   PERFORM ec_require(recurrence.id IS NOT NULL AND recurrence.branch_id=branch AND recurrence.current_version::text=p->>'expectedVersion','VERSION_CONFLICT');
   version:=recurrence.current_version+1;occurrence:=recurrence.next_occurrence;
   UPDATE fin_recurrences r SET current_version=collections_scope.version WHERE r.tenant_id=actor.tenant_id AND r.id=new_id;
  END IF;
  INSERT INTO fin_recurrence_versions(tenant_id,recurrence_id,version,anchor_date,frequency,end_date,occurrence_limit,estimated,template,effective_occurrence,created_by)
  VALUES(actor.tenant_id,new_id,version,(p->>'anchorDate')::date,p->>'frequency',NULLIF(p->>'endDate','')::date,NULLIF(p->>'occurrenceLimit','')::int,(p->>'estimated')::boolean,template||jsonb_build_object('branchId',branch),occurrence,actor.id);
  RETURN jsonb_build_object('recurrenceId',new_id,'version',version::text);
 ELSIF action IN('C23','C24') THEN
  SELECT * INTO recurrence FROM fin_recurrences WHERE tenant_id=actor.tenant_id AND id=(p->>'recurrenceId')::uuid FOR UPDATE;
  PERFORM ec_require(recurrence.id IS NOT NULL,'RECURRENCE_DENIED');PERFORM fin_branch(actor,recurrence.branch_id);
  IF action='C24' THEN
   PERFORM ec_require(recurrence.current_version::text=p->>'expectedVersion','VERSION_CONFLICT');
   UPDATE fin_recurrences SET active=(p->>'active')::boolean WHERE tenant_id=actor.tenant_id AND id=recurrence.id;
   RETURN jsonb_build_object('recurrenceId',recurrence.id,'active',(p->>'active')::boolean);
  END IF;
  occurrence:=(p->>'occurrence')::integer;
  SELECT * INTO existing FROM fin_occurrences WHERE tenant_id=actor.tenant_id AND recurrence_id=recurrence.id AND fin_occurrences.occurrence=collections_scope.occurrence;
  IF existing.id IS NOT NULL THEN RETURN jsonb_build_object('occurrenceId',existing.id,'documentId',existing.document_id,'alreadyMaterialized',true);END IF;
  PERFORM ec_require(recurrence.active AND occurrence=recurrence.next_occurrence,'RECURRENCE_STATE_CONFLICT');
  SELECT * INTO STRICT schedule FROM fin_recurrence_versions v WHERE v.tenant_id=actor.tenant_id AND v.recurrence_id=recurrence.id AND v.version=recurrence.current_version;
  PERFORM fin_access(actor,CASE schedule.template->>'direction' WHEN 'PAY' THEN 'CONTAS_PAGAR' ELSE 'CONTAS_RECEBER' END,'manage');
  day:=fin_date(schedule.anchor_date,schedule.frequency,occurrence-schedule.effective_occurrence);
  PERFORM ec_require((schedule.end_date IS NULL OR day<=schedule.end_date) AND (schedule.occurrence_limit IS NULL OR occurrence<schedule.occurrence_limit),'RECURRENCE_LIMIT_REACHED');
  result:=fin_new_document(actor,operation,schedule.template||jsonb_build_object('branchId',recurrence.branch_id,'installmentCount',1,'issueDate',day,'competenceDate',day,'dueDate',day),CASE WHEN schedule.estimated THEN 'RECURRENCE_ESTIMATE' ELSE 'RECURRENCE' END);
  new_id:=gen_random_uuid();
  INSERT INTO fin_occurrences(id,tenant_id,recurrence_id,version,occurrence,nominal_date,document_id,estimated) VALUES(new_id,actor.tenant_id,recurrence.id,schedule.version,occurrence,day,(result->>'documentId')::uuid,schedule.estimated);
  UPDATE fin_recurrences SET next_occurrence=collections_scope.occurrence+1 WHERE tenant_id=actor.tenant_id AND id=recurrence.id;
  RETURN result||jsonb_build_object('occurrenceId',new_id,'alreadyMaterialized',false);
 END IF;
 RAISE EXCEPTION 'UNKNOWN_FINANCIAL_COMMAND' USING ERRCODE='P0001';
END $$;
COMMIT;

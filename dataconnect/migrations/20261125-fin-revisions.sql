BEGIN;
ALTER TABLE fin_documents ADD COLUMN IF NOT EXISTS classification_revision bigint NOT NULL DEFAULT 1;
ALTER TABLE fin_classifications ADD COLUMN IF NOT EXISTS classification_revision bigint NOT NULL DEFAULT 1;

CREATE OR REPLACE VIEW fin_active_classifications AS
SELECT c.* FROM fin_classifications c JOIN fin_documents d ON d.tenant_id=c.tenant_id AND d.id=c.document_id
WHERE c.classification_revision=d.classification_revision;

CREATE OR REPLACE FUNCTION fin_revise_document(actor users, operation uuid, action text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
<<revision_scope>>
DECLARE doc fin_documents;
 expected_amount bigint;
 next_revision bigint;
 next_ordinal integer;
 class_item jsonb;
 category uuid;
 center uuid;
 amount bigint;
 class_ids uuid[]:='{}';
 weights bigint[]:='{}';
 classified numeric:=0;
 title_row fin_title_state;
 part bigint[];
 i integer;
 classification_count integer;
 has_categories boolean;
 occurrence fin_occurrences;
 before_doc jsonb;
BEGIN
 SELECT d.* INTO doc FROM fin_documents d WHERE d.tenant_id=actor.tenant_id AND d.id=(payload->>'documentId')::uuid;
 PERFORM ec_require(doc.id IS NOT NULL,'DOCUMENT_DENIED');
 PERFORM fin_branch(actor,doc.branch_id);
 PERFORM fin_access(actor,CASE doc.direction WHEN 'PAY' THEN 'CONTAS_PAGAR' ELSE 'CONTAS_RECEBER' END,'manage');
 PERFORM ec_require(doc.version::text=payload->>'expectedVersion','VERSION_CONFLICT');
 PERFORM ec_require(length(btrim(payload->>'reason')) BETWEEN 3 AND 1000,'REASON_REQUIRED');
 PERFORM ec_require(NOT EXISTS(
  SELECT 1 FROM fin_titles t JOIN fin_principal_events e ON e.tenant_id=t.tenant_id AND e.title_id=t.id
  WHERE t.tenant_id=actor.tenant_id AND t.document_id=doc.id
 ),'TITLE_HAS_HISTORY');
 PERFORM fin_period(actor.tenant_id,doc.branch_id,doc.competence_date);
 expected_amount:=doc.nominal_cents;
 before_doc:=fin_json(to_jsonb(doc));
 IF action='C25' THEN
  SELECT o.* INTO occurrence FROM fin_occurrences o WHERE o.tenant_id=actor.tenant_id AND o.document_id=doc.id AND o.estimated;
  PERFORM ec_require(occurrence.id IS NOT NULL AND doc.source_type='RECURRENCE_ESTIMATE','ESTIMATE_REQUIRED');
  expected_amount:=fin_amount(payload->'amountCents');
  PERFORM ec_require(expected_amount>0 AND (SELECT count(*) FROM fin_titles t WHERE t.tenant_id=doc.tenant_id AND t.document_id=doc.id)=1,'INVALID_ESTIMATE');
  SELECT s.* INTO STRICT title_row FROM fin_title_state s WHERE s.tenant_id=doc.tenant_id AND s.document_id=doc.id;
  IF doc.direction='PAY' THEN
   UPDATE accounts_payable p SET amount_cents=expected_amount,updated_at=now() WHERE p.tenant_id=doc.tenant_id AND p.id=title_row.payable_id;
  ELSE
   UPDATE accounts_receivable r SET amount_cents=expected_amount,updated_at=now() WHERE r.tenant_id=doc.tenant_id AND r.id=title_row.receivable_id;
  END IF;
 ELSE
  PERFORM ec_require(doc.direction=payload->>'direction' AND doc.source_type IN('MANUAL','RECURRENCE','RECURRENCE_CONFIRMED','VERIFIED_LEGACY'),'TITLE_SOURCE_LOCKED');
 END IF;

 PERFORM ec_require(jsonb_typeof(payload->'classifications')='array' AND jsonb_array_length(payload->'classifications')<=100,'ALLOCATION_LIMIT');
 next_revision:=doc.classification_revision+1;
 SELECT COALESCE(max(c.ordinal),0) INTO next_ordinal FROM fin_classifications c WHERE c.tenant_id=doc.tenant_id AND c.document_id=doc.id;
 FOR class_item IN SELECT value FROM jsonb_array_elements(payload->'classifications') LOOP
  category:=(class_item->>'categoryId')::uuid;center:=NULLIF(class_item->>'centerId','')::uuid;
  PERFORM ec_require(EXISTS(SELECT 1 FROM financial_categories c WHERE c.tenant_id=doc.tenant_id AND c.id=category AND c.active)
   AND NOT EXISTS(SELECT 1 FROM fin_category_details d WHERE d.tenant_id=doc.tenant_id AND d.parent_id=category),'CATEGORY_LEAF_REQUIRED');
  PERFORM ec_require(center IS NULL OR EXISTS(SELECT 1 FROM fin_centers c WHERE c.tenant_id=doc.tenant_id AND c.id=center AND c.active AND (c.branch_id IS NULL OR c.branch_id=doc.branch_id)),'CENTER_DENIED');
  amount:=fin_amount(class_item->'amountCents');
  PERFORM ec_require(amount>0,'INVALID_ALLOCATION');
  next_ordinal:=next_ordinal+1;
  class_ids:=array_append(class_ids,gen_random_uuid());
  weights:=array_append(weights,amount);
  classified:=classified+amount;
  INSERT INTO fin_classifications(id,tenant_id,document_id,category_id,center_id,amount_cents,ordinal,classification_revision)
  VALUES(class_ids[cardinality(class_ids)],doc.tenant_id,doc.id,category,center,amount,next_ordinal,next_revision);
 END LOOP;
 classification_count:=cardinality(class_ids);
 has_categories:=classification_count>0;
 PERFORM ec_require(NOT has_categories OR classified=expected_amount,'ALLOCATION_MARGINS');

 FOR title_row IN SELECT s.* FROM fin_title_state s WHERE s.tenant_id=doc.tenant_id AND s.document_id=doc.id ORDER BY s.installment LOOP
  IF has_categories THEN
   part:=fin_allocate(title_row.original_cents,weights);
   FOR i IN 1..classification_count LOOP
    PERFORM ec_require(part[i]<=weights[i],'ALLOCATION_CAPACITY');
    weights[i]:=weights[i]-part[i];
    INSERT INTO fin_title_capacities(tenant_id,title_id,classification_id,amount_cents) VALUES(doc.tenant_id,title_row.id,class_ids[i],part[i]);
   END LOOP;
  END IF;
  UPDATE fin_titles t SET version=t.version+1 WHERE t.tenant_id=doc.tenant_id AND t.id=title_row.id;
  INSERT INTO fin_title_changes(tenant_id,title_id,operation_id,previous_version,before_value,after_value,reason)
  VALUES(doc.tenant_id,title_row.id,operation,title_row.version,before_doc,jsonb_build_object('classificationRevision',next_revision,'originalCents',title_row.original_cents::text),payload->>'reason');
 END LOOP;

 -- A revision supersedes only the document's economic classification. No
 -- principal or bank facts are rewritten and the original remains auditable.
 INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,category_id,center_id,document_id,quality,reverses_id)
 SELECT e.tenant_id,e.branch_id,'classification-reversal:'||e.id,'CLASSIFICATION_REVERSAL',e.competence_date,-e.amount_cents,e.category_id,e.center_id,e.document_id,e.quality,e.id
 FROM fin_economic_events e WHERE e.tenant_id=doc.tenant_id AND e.document_id=doc.id AND e.event_type='DOCUMENT'
 AND NOT EXISTS(SELECT 1 FROM fin_economic_events r WHERE r.tenant_id=e.tenant_id AND r.reverses_id=e.id);
 IF has_categories THEN
  INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,category_id,center_id,document_id,quality)
  SELECT doc.tenant_id,doc.branch_id,'classification:'||c.id,'DOCUMENT',doc.competence_date,
   CASE doc.direction WHEN 'PAY' THEN -c.amount_cents ELSE c.amount_cents END,c.category_id,c.center_id,doc.id,'KNOWN'
  FROM fin_classifications c WHERE c.tenant_id=doc.tenant_id AND c.document_id=doc.id AND c.classification_revision=next_revision;
 ELSE
  INSERT INTO fin_economic_events(tenant_id,branch_id,source_key,event_type,competence_date,amount_cents,document_id,quality)
  VALUES(doc.tenant_id,doc.branch_id,'classification:'||doc.id||':'||next_revision,'DOCUMENT',doc.competence_date,
   CASE doc.direction WHEN 'PAY' THEN -expected_amount ELSE expected_amount END,doc.id,'MISSING_CLASSIFICATION');
 END IF;
 UPDATE fin_documents d SET version=d.version+1,classification_revision=next_revision,nominal_cents=expected_amount,
  source_type=CASE WHEN action='C25' THEN 'RECURRENCE_CONFIRMED' ELSE d.source_type END
 WHERE d.tenant_id=doc.tenant_id AND d.id=doc.id;
 RETURN jsonb_build_object('documentId',doc.id,'version',(doc.version+1)::text,'classificationRevision',next_revision::text);
END $$;

COMMIT;

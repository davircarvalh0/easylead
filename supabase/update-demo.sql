-- EasyLead: responsáveis de Negócios e valores contratados, em uma transação.
BEGIN;
SET LOCAL easylead.workspace_id TO 'main';
-- Apply to an existing EasyLead workspace; preserve all current assignments and projects.
-- Defaults to main. To target another workspace, SET LOCAL easylead.workspace_id inside this transaction.

DO $easylead$
DECLARE
 target_workspace text := COALESCE(NULLIF(current_setting('easylead.workspace_id',true),''),'main');
 original_state jsonb;
 next_state jsonb;
 business_area text;
 person jsonb;
 existing_person jsonb;
 owner_ids text[] := ARRAY[]::text[];
 updated_leads jsonb;
 updated_areas jsonb;
BEGIN
 SELECT state INTO original_state FROM public.easylead_workspaces WHERE id=target_workspace FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Carteira % não encontrada. Importe a base antes desta atualização.',target_workspace; END IF;
 SELECT area->>'id' INTO business_area FROM jsonb_array_elements(original_state->'areas') AS area
 WHERE lower(btrim(area->>'name')) IN ('negócios','negocios') LIMIT 1;
 IF business_area IS NULL THEN RAISE EXCEPTION 'A área de Negócios não foi encontrada.'; END IF;
 next_state := original_state;
 FOR person IN SELECT value FROM jsonb_array_elements('[
  {"id":"demo-business-tiago-mattos","name":"Tiago Mattos"},
  {"id":"demo-business-joao-pedro","name":"João Pedro"},
  {"id":"demo-business-beatriz-luna","name":"Beatriz Luna"}
 ]'::jsonb)
 LOOP
  SELECT member INTO existing_person FROM jsonb_array_elements(next_state->'members') AS member
  WHERE member->>'areaId'=business_area AND lower(btrim(member->>'name'))=lower(person->>'name') LIMIT 1;
  IF existing_person IS NULL THEN
   IF EXISTS(SELECT 1 FROM jsonb_array_elements(next_state->'members') AS member WHERE member->>'id'=person->>'id')
   THEN RAISE EXCEPTION 'Identificador de responsável já está em uso: %',person->>'name'; END IF;
   existing_person := person || jsonb_build_object('areaId',business_area,'role','Consultor(a) de Negócios');
   next_state := jsonb_set(next_state,'{members}',(next_state->'members') || jsonb_build_array(existing_person));
  END IF;
  owner_ids := array_append(owner_ids,existing_person->>'id');
 END LOOP;
 -- Count only unassigned records, retaining their original array order.
 WITH numbered AS (
  SELECT lead,position,
   count(*) FILTER(WHERE NULLIF(btrim(lead->>'businessOwnerId'),'') IS NULL) OVER(ORDER BY position)-1 AS slot
  FROM jsonb_array_elements(next_state->'leads') WITH ORDINALITY AS items(lead,position)
 )
 SELECT COALESCE(jsonb_agg(
  CASE WHEN NULLIF(btrim(lead->>'businessOwnerId'),'') IS NULL
   THEN jsonb_set(lead,'{businessOwnerId}',to_jsonb(owner_ids[CASE WHEN slot%10<5 THEN 1 WHEN slot%10<8 THEN 2 ELSE 3 END]),true)
   ELSE lead END ORDER BY position),'[]'::jsonb) INTO updated_leads FROM numbered;
 SELECT jsonb_agg(CASE WHEN area->>'id'=business_area THEN area || '{"leadOwnershipEnabled":true}'::jsonb ELSE area END ORDER BY position)
 INTO updated_areas FROM jsonb_array_elements(next_state->'areas') WITH ORDINALITY AS items(area,position);
 next_state := jsonb_set(jsonb_set(next_state,'{leads}',updated_leads),'{areas}',updated_areas);
 IF next_state IS DISTINCT FROM original_state THEN
  UPDATE public.easylead_workspaces SET state=next_state,revision=revision+1,updated_at=now() WHERE id=target_workspace;
 END IF;
END;
$easylead$;
-- Verify the resulting distribution before committing.
SELECT member->>'name' AS responsavel,count(lead)::integer AS leads
FROM public.easylead_workspaces AS workspace
CROSS JOIN LATERAL jsonb_array_elements(workspace.state->'members') AS member
LEFT JOIN LATERAL jsonb_array_elements(workspace.state->'leads') AS lead ON lead->>'businessOwnerId'=member->>'id'
WHERE workspace.id=COALESCE(NULLIF(current_setting('easylead.workspace_id',true),''),'main')
 AND member->>'name' IN ('Tiago Mattos','João Pedro','Beatriz Luna')
GROUP BY member->>'name' ORDER BY leads DESC;

-- Complete only missing mock contract values; preserve existing positive values and project fields.

DO $easylead$
DECLARE
 target_workspace text := COALESCE(NULLIF(current_setting('easylead.workspace_id',true),''),'main');
 original_state jsonb;
 next_state jsonb;
 project jsonb;
 linked_lead jsonb;
 amount numeric;
 hash integer;
 character text;
 updated_projects jsonb[] := ARRAY[]::jsonb[];
BEGIN
 SELECT state INTO original_state FROM public.easylead_workspaces WHERE id=target_workspace FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Carteira % não encontrada. Importe a base antes desta atualização.',target_workspace; END IF;
 FOR project IN SELECT value FROM jsonb_array_elements(original_state->'projects') LOOP
  IF (CASE WHEN jsonb_typeof(project->'contractValue')='number' THEN (project->>'contractValue')::numeric>0 ELSE false END) IS NOT TRUE THEN
   SELECT lead INTO linked_lead FROM jsonb_array_elements(original_state->'leads') AS lead
   WHERE lead->>'id'=project->>'leadId' OR lead->>'projectId'=project->>'id'
   ORDER BY CASE WHEN lead->>'id'=project->>'leadId' THEN 0 ELSE 1 END LIMIT 1;
   IF (CASE WHEN jsonb_typeof(linked_lead->'proposal'->'price')='number' THEN (linked_lead->'proposal'->>'price')::numeric>0 ELSE false END) THEN
    amount := (linked_lead->'proposal'->>'price')::numeric;
   ELSIF (CASE WHEN jsonb_typeof(linked_lead->'estimatedValue')='number' THEN (linked_lead->>'estimatedValue')::numeric>0 ELSE false END) THEN
    amount := greatest(1,round((linked_lead->>'estimatedValue')::numeric*.9));
   ELSE
    hash := 0;
    FOREACH character IN ARRAY regexp_split_to_array(COALESCE(project->>'id',''),'') LOOP hash := (hash*31+CASE WHEN character='' THEN 0 ELSE ascii(character) END)%100000; END LOOP;
    amount := 25000+hash;
   END IF;
   project := jsonb_set(project,'{contractValue}',to_jsonb(amount),true);
  END IF;
  project := jsonb_set(project,'{contractStatus}','"Contratado"'::jsonb,true);
  updated_projects := array_append(updated_projects,project);
 END LOOP;
 next_state := jsonb_set(original_state,'{projects}',to_jsonb(updated_projects));
 IF next_state IS DISTINCT FROM original_state THEN
  UPDATE public.easylead_workspaces SET state=next_state,revision=revision+1,updated_at=now() WHERE id=target_workspace;
 END IF;
END;
$easylead$;
SELECT jsonb_array_length(state->'projects') AS projetos,
 (SELECT count(*) FROM jsonb_array_elements(state->'projects') AS project WHERE project->>'contractStatus'='Contratado' AND jsonb_typeof(project->'contractValue')='number' AND (project->>'contractValue')::numeric>0) AS com_valor_contratado
FROM public.easylead_workspaces WHERE id=COALESCE(NULLIF(current_setting('easylead.workspace_id',true),''),'main');

COMMIT;

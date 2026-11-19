-- Complete only missing mock contract values; preserve existing positive values and project fields.
BEGIN;
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

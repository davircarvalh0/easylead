import {readFile} from 'node:fs/promises';
const literal=value=>"'"+value.replaceAll("'","''")+"'";
export async function createDemoUpdateSql(workspace='main'){
 const files=['202611190001_business_lead_owners.sql','202611190002_project_contract_values.sql'];
 const parts=await Promise.all(files.map(async file=>(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replace(/\bBEGIN;/,'').replace(/COMMIT;\s*$/,'')));
 return '-- EasyLead: responsáveis de Negócios e valores contratados, em uma transação.\nBEGIN;\nSET LOCAL easylead.workspace_id TO '+literal(workspace)+';\n'+parts.join('\n')+'\nCOMMIT;\n';
}

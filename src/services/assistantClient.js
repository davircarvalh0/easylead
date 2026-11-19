import {publicAssistantReply} from './assistantProtocol.js';
import {authorizedFetch} from './cloudClient.js';
import {assistantSnapshot} from '../../server/assistant-data.js';
import {readLeadFile} from './leadImport.js';
import {isOutsideLeadIcp} from './leadWorkspace.js';
import {leadSectors} from './leadSectors.js';
import {formatNumber} from '../views/DashboardValue.jsx';

export async function askAssistant(state,messages,question,signal,attachmentContext) {
  if (location.protocol==='file:') throw Error('Abra o EasyLead pelo servidor local para consultar o DeepSeek.');
  const history = messages.slice(-6).flatMap(({query,reply})=>[
    {role:'user',content:query}, {role:'assistant',content:publicAssistantReply(reply)},
  ]);
  const snapshot=assistantSnapshot(state);
  if(attachmentContext)snapshot.attachment_leads=attachmentContext.rows;
  const response = await authorizedFetch('/api/easylead/assistant',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question,history,snapshot,attachmentContext:attachmentContext?{files:attachmentContext.files,errors:attachmentContext.errors}:undefined}),
    signal,
  });
  const result = await response.json().catch(()=>null);
  if (!response.ok || typeof result?.reply!=='string') {
    throw Error(result?.error || 'O servidor do assistente está indisponível. Reinicie o EasyLead.');
  }
  return {...result,reply:publicAssistantReply(result.reply)};
}

async function requestColumns(headers,signal) {
  const response = await authorizedFetch('/api/easylead/assistant',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({kind:'lead-import-columns',headers}),
    signal,
  });
  const result = await response.json().catch(()=>null);
  if (!response.ok || !result?.columns) {
    throw Error(result?.error || 'Não foi possível identificar as colunas com o DeepSeek.');
  }
  return result.columns;
}

async function classifyImportSectors(rows,signal) {
  const companyKey = name=>name.trim().toLocaleLowerCase('pt-BR');
  const companies = new Map();
  const candidates = rows.filter(({data})=>{
    return data.company && data.contact && !isOutsideLeadIcp(data.idealCustomerProfile)
      && (!data.clientSegment || companyKey(data.clientSegment)==='não classificado');
  });
  for (const {data} of candidates) {
    companies.set(companyKey(data.company),data.company);
  }

  const classified = new Map();
  const names = [...companies.values()];
  const batchSize = 50;
  let failed = false;
  for (let index=0; index<names.length; index+=batchSize) {
    signal.throwIfAborted();
    const batch = names.slice(index,index+batchSize);
    try {
      const response = await authorizedFetch('/api/easylead/assistant',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({kind:'lead-import-sectors',companies:batch}),
        signal:AbortSignal.any([signal,AbortSignal.timeout(25000)]),
      });
      if (!response.ok) {
        failed = true;
        if ([403,404,429,503].includes(response.status)) break;
        continue;
      }
      const {sectors} = await response.json();
      batch.forEach((name,position)=>{
        if (leadSectors.includes(sectors?.[position])) classified.set(companyKey(name),sectors[position]);
      });
    } catch {
      signal.throwIfAborted();
      failed = true;
      break;
    }
  }

  for (const {data} of candidates) {
    data.clientSegment=classified.get(companyKey(data.company)) || 'Não classificado';
  }
  return failed;
}

export async function importAssistantFiles(files,importLeads,signal) {
  const mappings = new Map();
  function resolveColumns(headers) {
    const signature = JSON.stringify(headers);
    if (!mappings.has(signature)) {
      mappings.set(signature, requestColumns(headers,signal));
    }
    return mappings.get(signature);
  }

  const reads = await Promise.allSettled(files.map(file=>readLeadFile(file,resolveColumns)));
  signal.throwIfAborted();
  const errors = [];
  const rows = reads.flatMap((read,index)=>{
    if (read.status==='fulfilled') return read.value;
    errors.push(files[index].name+' · '+read.reason.message);
    return [];
  });
  const classificationFailed = await classifyImportSectors(rows,signal);
  signal.throwIfAborted();
  const result = await importLeads(rows);
  errors.push(...result.errors.map(({file,record,message})=>file+' · registro '+record+': '+message));
  const report = [
    formatNumber(result.added)+(result.added===1 ? ' lead cadastrado em Novo.' : ' leads cadastrados em Novo.'),
    result.duplicates ? formatNumber(result.duplicates)+(result.duplicates===1 ? ' duplicado ignorado.' : ' duplicados ignorados.') : '',
    result.outsideIcp ? formatNumber(result.outsideIcp)+(result.outsideIcp===1 ? ' lead fora do ICP ignorado.' : ' leads fora do ICP ignorados.') : '',
    classificationFailed ? 'A classificação automática ficou indisponível para parte das empresas. Onde faltou setor, ficou como Não classificado.' : '',
    ...errors.slice(0,8),
    errors.length>8 ? 'Mais '+formatNumber(errors.length-8)+' registros ou arquivos com erro.' : '',
  ].filter(Boolean);
  return {reply:report.join('\n'),added:result.added};
}

export async function analyzeAssistantFiles(files,signal){
 const mappings=new Map();
 const resolveColumns=headers=>{const key=JSON.stringify(headers);if(!mappings.has(key))mappings.set(key,requestColumns(headers,signal));return mappings.get(key);};
 const reads=await Promise.allSettled(files.map(file=>readLeadFile(file,resolveColumns,{analysis:true})));
 signal.throwIfAborted();
 const errors=[];
 const rows=reads.flatMap((read,index)=>{if(read.status==='fulfilled')return read.value;errors.push(files[index].name+' · '+read.reason.message);return [];});
 if(!rows.length)throw Error(errors.join('\n')||'Nenhum registro foi encontrado para analisar.');
 if(rows.length>2000)throw Error('Para analisar, envie até 2.000 registros por vez. Divida o arquivo e tente novamente.');
 return {files:files.map(file=>file.name),errors,rows:rows.map(({file,record,data},index)=>({id:'attachment-'+(index+1),file,record,...data}))};
}

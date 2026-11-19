export const isCloud=import.meta.env?.VITE_APP_MODE==='server';

export async function authorizedFetch(url,options){
 const response=await fetch(url,options);
 if(isCloud&&response.status===401&&!String(url).split('?')[0].endsWith('/session'))window.dispatchEvent(new Event('easylead:unauthorized'));
 return response;
}

export async function cloudApi(endpoint,{method='GET',body,signal}={}){
 const response=await authorizedFetch('/api/easylead/'+endpoint,{method,credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:signal||AbortSignal.timeout(60000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok){const error=new Error(data?.error||'Não foi possível acessar o servidor. Tente novamente.');error.status=response.status;throw error;}
 if(!data)throw Error('O servidor retornou uma resposta inválida.');return data;
}
export function createRemoteWorkspace(initial){
 if(!initial?.state||!Number.isSafeInteger(initial.revision))throw Error('A carteira do servidor não foi carregada.');
 let revision=initial.revision,queue=Promise.resolve(),blocked=false;
 return {execute(command,args){
  const task=queue.then(async()=>{
   if(blocked)throw Error('Recarregue a carteira antes de tentar salvar novamente.');
   try{const data=await cloudApi('workspace',{method:'POST',body:{command,args,revision}});revision=data.revision;return data;}
   catch(error){if(error.status===409||!error.status||error.status>=500)blocked=true;throw error;}
  });
  queue=task.catch(()=>{});return task;
 }};
}

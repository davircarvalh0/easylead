export const stages = ['Novo', 'Em contato', 'Proposta', 'Ganho', 'Perdido'];
export const statuses = ['Planejado', 'Em andamento', 'Concluído'];
export const seed = {
 version: 1,
 areas: ['Inovação', 'Comercial', 'Desenvolvimento', 'Design', 'Pessoas'].map((name,i)=>({id:`a${i}`,name})),
 members: ['Ana Lima','Bruno Melo','Clara Luz','Diego Alves','Eva Costa'].map((name,i)=>({id:`m${i}`,name,areaId:`a${i}`,role:['Estrategista','Consultor','Desenvolvedora','Designer','Gestora'][i]})),
 leads: stages.map((stage,i)=>({id:`l${i}`,name:['Portal Aurora','Loja Horizonte','App Raiz','Plataforma Maré','Site Sol'][i],company:`Empresa exemplo ${i+1}`,contact:`contato${i+1}@example.com`,stage})),
 projects: []
};
export function saveLead(state, data, id=crypto.randomUUID()) {
 if (![data.name,data.company,data.contact].every(v=>typeof v==='string' && v.trim())) throw Error('Preencha nome, organização e contato.');
 if (!stages.includes(data.stage)) throw Error('Estágio inválido.');
 const old=state.leads.find(l=>l.id===id);
 if(old?.projectId && data.stage!=='Ganho') throw Error('Um lead convertido permanece em Ganho.');
 const lead={...old,...data,id,name:data.name.trim(),company:data.company.trim(),contact:data.contact.trim()};
 return {...state,leads:old?state.leads.map(l=>l.id===id?lead:l):[...state.leads,lead]};
}
export function convert(state,leadId,data) {
 const lead=state.leads.find(l=>l.id===leadId);
 if(!lead) throw Error('Lead não encontrado.');
 const existing=state.projects.find(p=>p.leadId===leadId);
 if(existing) return {state,project:existing};
 if(lead.stage!=='Ganho') throw Error('Somente leads ganhos podem ser convertidos.');
 if(!data.name?.trim() || !state.areas.some(a=>a.id===data.areaId)) throw Error('Informe nome e área do projeto.');
 const member=state.members.find(m=>m.id===data.ownerId && m.areaId===data.areaId);
 if(!member) throw Error('Selecione um responsável da área.');
 const memberIds=[...new Set([data.ownerId,...(data.memberIds||[])])];
 if(memberIds.some(id=>!state.members.some(m=>m.id===id))) throw Error('Integrante inválido.');
 const project={id:crypto.randomUUID(),name:data.name.trim(),areaId:data.areaId,ownerId:data.ownerId,memberIds,leadId,status:'Planejado'};
 return {state:{...state,leads:state.leads.map(l=>l.id===leadId?{...l,projectId:project.id}:l),projects:[...state.projects,project]},project};
}
export function changeStatus(state,id,status) {
 if(!statuses.includes(status)) throw Error('Status inválido.');
 return {...state,projects:state.projects.map(p=>p.id===id?{...p,status}:p)};
}
export const metrics=s=>({open:s.leads.filter(l=>stages.slice(0,3).includes(l.stage)).length,active:s.projects.filter(p=>p.status==='Em andamento').length});
export const STORAGE_KEY='central-citi-v1';
export function readState(storage) {
 const raw=storage.getItem(STORAGE_KEY);
 if(!raw) return structuredClone(seed);
 const value=JSON.parse(raw);
 if(value.version!==1 || !['areas','members','leads','projects'].every(k=>Array.isArray(value[k]))) throw Error('Dados locais incompatíveis.');
 return value;
}

// Urgency affects only the home queue, never the open-lead metric.
export function actionableLeads(state) {
 const priority = {Ganho: 0, Proposta: 1, 'Em contato': 2, Novo: 3};
 return state.leads.filter(l => l.stage in priority && !(l.stage === 'Ganho' && l.projectId))
  .sort((a, b) => priority[a.stage] - priority[b.stage]);
}

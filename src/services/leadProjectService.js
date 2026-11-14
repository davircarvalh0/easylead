import {stages, statuses, phases, demoProjects} from '../domain.js';
import {createStateRepository} from '../repositories/stateRepository.js';

export function saveLead(state, data, id=crypto.randomUUID()) {
 if (![data.name,data.company,data.contact].every(v=>typeof v==='string' && v.trim())) throw Error('Preencha nome, organização e contato.');
 if (!stages.includes(data.stage)) throw Error('Estágio inválido.');
 const estimatedValue=data.estimatedValue==null || data.estimatedValue===''?null:Number(data.estimatedValue);
 if(estimatedValue!==null && (!Number.isFinite(estimatedValue)||estimatedValue<0)) throw Error('Valor estimado inválido.');
 const old=state.leads.find(l=>l.id===id);
 if(old?.projectId && data.stage!=='Ganho') throw Error('Um lead convertido permanece em Ganho.');
 const lead={...old,...data,id,name:data.name.trim(),company:data.company.trim(),contact:data.contact.trim(),clientSegment:data.clientSegment?.trim() || old?.clientSegment || 'Não classificado',...(data.estimatedValue!==undefined?{estimatedValue}:{})};
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
 const terms=validateTerms(data);
 const squadId=crypto.randomUUID();
 const project={...terms,phase:data.phase || 'Discovery',originPhase:data.phase || 'Discovery',company:lead.company,clientSegment:lead.clientSegment || 'Não classificado',squadId,id:crypto.randomUUID(),name:data.name.trim(),areaId:data.areaId,ownerId:data.ownerId,memberIds,leadId,status:'Planejado'};
 return {state:{...state,leads:state.leads.map(l=>l.id===leadId?{...l,projectId:project.id}:l),squads:[...(state.squads || []),{id:squadId,name:data.squadName?.trim() || `Squad · ${project.name}`,areaId:data.areaId,ownerId:data.ownerId,memberIds,specialty:'Equipe do projeto'}],projects:[...state.projects,project]},project};
}
export function changeStatus(state,id,status) {
 if(!statuses.includes(status)) throw Error('Status inválido.');
 return {...state,projects:state.projects.map(p=>p.id===id?{...p,status}:p)};
}

export function createLeadProjectService(repository = createStateRepository()) {
  function persist(state) {
    repository.write(state);
    return state;
  }
  return {
    filterProjects, calculateAverageMetrics,
    changePhase: (state,id) => persist(changePhase(state,id)),
    addDemo: state => persist(addDemo(state)),
    load: () => repository.read(),
    saveLead: (state, data, id) => persist(saveLead(state, data, id)),
    convert(state, leadId, data) {
      const result = convert(state, leadId, data);
      persist(result.state);
      return result;
    },
    changeStatus: (state, id, status) => persist(changeStatus(state, id, status)),
  };
}

function validateTerms(data) {
 if(data.phase && !phases.includes(data.phase)) throw Error('Fase inválida.');
 const contractStatus=data.contractStatus || 'Contratado';
 if(!['Contratado','Sem contrato'].includes(contractStatus)) throw Error('Contrato inválido.');
 const contractValue=data.contractValue === '' || data.contractValue == null ? null : Number(data.contractValue);
 if(data.contractValue!=null && !['number','string'].includes(typeof data.contractValue)) throw Error('Valor inválido.');
 if(contractValue!==null && (!Number.isFinite(contractValue) || contractValue<=0)) throw Error('Informe um valor positivo ou deixe em branco.');
 return {contractStatus,contractValue};
}
export function changePhase(state,id) {
 const p=state.projects.find(p=>p.id===id);
 if(!p || p.phase!=='Discovery') throw Error('Somente Discovery pode avançar para Delivery.');
 return {...state,projects:state.projects.map(p=>p.id===id?{...p,originPhase:p.originPhase || p.phase,phase:'Delivery'}:p)};
}
export function filterProjects(state, filters={}) {
 return state.projects.filter(p=>(!filters.segment || p.clientSegment===filters.segment) && (!filters.phase || p.phase===filters.phase) && (!filters.area || p.areaId===filters.area) && (!filters.status || p.status===filters.status));
}
export function isEligibleForAverage(p) {
 return p.contractStatus==='Contratado' && typeof p.contractValue==='number' && Number.isFinite(p.contractValue) && p.contractValue>0;
}
export function calculateAverageMetrics(state,filters={},grouping='area') {
 const filtered=filterProjects(state,filters);
 const summarize=items=>{
  const eligible=items.filter(isEligibleForAverage);
  return {average:eligible.length?eligible.reduce((sum,p)=>sum+p.contractValue,0)/eligible.length:null,eligibleCount:eligible.length,total:items.length,withoutContract:items.filter(p=>p.contractStatus!=='Contratado').length,withoutValue:items.filter(p=>p.contractStatus==='Contratado'&&!isEligibleForAverage(p)).length};
 };
 const keys=[...new Set(filtered.map(p=>grouping==='segment'?p.clientSegment:p.areaId))];
 return {...summarize(filtered),groups:keys.map(key=>({key,label:grouping==='segment'?key:state.areas.find(a=>a.id===key)?.name || 'Não classificado',...summarize(filtered.filter(p=>(grouping==='segment'?p.clientSegment:p.areaId)===key))}))};
}
export function addDemo(state) {
 let next=state;
 demoProjects.forEach(([name,clientSegment,phase,areaId,ownerId,contractValue,contractStatus],i)=>{
  const id=`demo-lead-${i}`;
  if(next.leads.some(l=>l.id===id)) return;
  next=saveLead(next,{name,company:`Contratante fictícia ${i+1}`,contact:`demo${i}@example.com`,clientSegment,stage:'Ganho'},id);
  next=convert(next,id,{name,phase,areaId,ownerId,contractValue,contractStatus,squadName:['Squad Maré','Squad Horus IA','Squad Vega UX','Squad Saúde','Squad Agentes'][i]}).state;
 });
 return next;
}

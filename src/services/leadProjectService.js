import {stages, statuses} from '../domain.js';
import {createStateRepository} from '../repositories/stateRepository.js';

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

export function createLeadProjectService(repository = createStateRepository()) {
  function persist(state) {
    repository.write(state);
    return state;
  }
  return {
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

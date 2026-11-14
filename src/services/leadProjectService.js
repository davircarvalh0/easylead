import {leadFunnel} from './leadFunnelService.js';
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
    leadFunnel, organizationAtoms,
    saveMember: (state, data, id) => persist(saveMember(state, data, id)),
    filterProjects, calculateAverageMetrics, valueBlocks,
    addValueDemo: state => persist(addValueDemo(state)),
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

// Financial semantics and filtering live here, independent of rendering/storage.
export function valueBlocks(state, kind, filters={}, grouping='direct') {
 const eligibleProjects=new Set(filterProjects(state,filters).map(p=>p.id));
 const source=kind==='leads'?state.leads:filterProjects(state,filters);
 const items=source.filter(item=>{
  if(kind!=='leads') return true;
  if(filters.segment && item.clientSegment!==filters.segment) return false;
  if((filters.phase||filters.area||filters.status) && !eligibleProjects.has(item.projectId)) return false;
  if(filters.stage && !(filters.stage==='abertos'?stages.slice(0,3).includes(item.stage):item.stage===filters.stage)) return false;
  return true;
 }).filter(item=>!filters.search || `${item.name} ${item.company} ${item.contact||''}`.toLocaleLowerCase().includes(filters.search.toLocaleLowerCase())).map(item=>{
  const project=kind==='leads'?state.projects.find(p=>p.id===item.projectId):item;
  const contracted=project && isEligibleForAverage(project);
  const estimated=typeof item.estimatedValue==='number' && Number.isFinite(item.estimatedValue) && item.estimatedValue>0;
  const value=contracted?project.contractValue:kind==='leads'&&estimated?item.estimatedValue:null;
  const label=value===null?(kind==='leads'?'Sem valor estimado (A definir)':project.contractStatus==='Sem contrato'?'Sem contrato (fora da média)':'Sem valor (fora da média)'):contracted?'Valor Contratado':'Valor Estimado';
  return {id:item.id,item,project,value,label,squad:state.squads?.find(s=>s.id===project?.squadId),area:state.areas.find(a=>a.id===project?.areaId)};
 });
 const max=Math.max(1,...items.map(i=>i.value||0));
 const groups=new Map();
 for(const row of items.filter(i=>i.value!==null)) {
  row.ratio=row.value/max;
  const key=grouping==='stage'?row.item.stage:grouping==='phase'?row.project?.phase||'Sem fase':grouping==='squad'?`${row.squad?.name||'Sem squad'} · ${row.area?.name||'Sem subárea'}`:'Comparação direta';
  if(!groups.has(key)) groups.set(key,{label:key,items:[],total:0});
  const group=groups.get(key);group.items.push(row);group.total+=row.value;
 }
 return {items,groups:[...groups.values()],unvalued:items.filter(i=>i.value===null),max};
}
export function addValueDemo(state) {
 let next=state;
 for(const [id,name,value,segment,areaId,ownerId] of [['l0','Portal Aurora',200000,'Finanças & Pagamentos','a0','m0'],['l1','Loja Horizonte',10000,'Varejo & E-commerce','a2','m2']]) {
  const existing=next.leads.find(l=>l.id===id);
  // Never replace a user's opportunity or an existing contract.
  const demoId=existing?.name===name && existing.company===`Empresa exemplo ${id==='l0'?1:2}`?id:`value-demo-${id}`;
  const lead=next.leads.find(l=>l.id===demoId);
  if(lead?.projectId) continue;
  next=saveLead(next,{...(lead||{}),name,company:lead?.company||`Empresa exemplo ${id==='l0'?1:2}`,contact:lead?.contact||'demo@example.com',stage:'Ganho',clientSegment:segment,estimatedValue:id==='l0'?185000:10000},demoId);
  next=convert(next,demoId,{name,areaId,ownerId,contractValue:value,phase:id==='l0'?'Delivery':'Discovery',squadName:id==='l0'?'Squad Aurora IA':'Squad Horizonte'}).state;
 }
 return next;
}

export function saveMember(state, data, id = crypto.randomUUID()) {
 const name = typeof data.name === 'string' ? data.name.trim() : '';
 if (!name) throw Error('Preencha o nome do integrante.');
 if (!state.areas.some(area => area.id === data.areaId)) throw Error('Selecione uma subárea válida.');
 if (state.members.some(member => member.id === id)) throw Error('Integrante já cadastrado.');
 const role = typeof data.role === 'string' ? data.role.trim() : '';
 return {...state, members: [...state.members, {id, name, areaId: data.areaId, role: role || 'Integrante'}]};
}
export function organizationAtoms(state) {
 const counts = new Map(state.areas.map(area => [area.id, 0]));
 for (const member of state.members) if (counts.has(member.areaId)) counts.set(member.areaId, counts.get(member.areaId) + 1);
 const min = Math.min(...counts.values());
 const max = Math.max(1, ...counts.values());
 return state.areas.map(area => {
  const count = counts.get(area.id);
  const ratio = max === min ? 0.45 : Math.sqrt((count - min) / (max - min));
  return {...area, count, desktopDiameter: Math.round(108 + ratio * 88), mobileDiameter: Math.round(88 + ratio * 56)};
 });
}

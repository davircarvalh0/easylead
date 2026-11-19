import {saveGoal} from './analyticsService.js';
import {leadFunnel} from './leadFunnelService.js';
import {leadOwnerMembers, leadProject, linkedInUrl, proposalDocumentUrl, isOutsideLeadIcp, brazilianStates} from './leadWorkspace.js';
import {stages, statuses, phases, demoProjects} from '../domain.js';
import {createStateRepository} from '../repositories/stateRepository.js';

import {leadActivityDay} from './leadActivityService.js';

function contactDaysFor(lead, stage, today) {
 const days = Array.isArray(lead?.contactDays) ? lead.contactDays : [];
 return stage === 'Em contato' && lead?.stage !== stage && !days.includes(today) ? [...days, today] : days;
}

export function saveLead(state, data, id=crypto.randomUUID()) {
 if (![data.name,data.company,data.contact].every(v=>typeof v==='string' && v.trim())) throw Error('Preencha nome, organização e contato.');
 if (!stages.includes(data.stage)) throw Error('Estágio inválido.');
 const estimatedValue=data.estimatedValue==null || data.estimatedValue===''?null:Number(data.estimatedValue);
 if(estimatedValue!==null && (!Number.isFinite(estimatedValue)||estimatedValue<0)) throw Error('Valor estimado inválido.');
 validateDates(data,['createdAt']);
 const city = data.city?.trim();
 const uf = data.uf?.trim().toUpperCase();
 if (uf && !brazilianStates.includes(uf)) throw Error('Selecione uma UF válida.');
 const linkedin = linkedInUrl(data.linkedin);
 if (data.linkedin != null && (typeof data.linkedin !== 'string' || (data.linkedin.trim() && !linkedin))) {
  throw Error('Informe uma URL válida do LinkedIn.');
 }
 const old=state.leads.find(l=>l.id===id);
 if (data.businessOwnerId && data.businessOwnerId !== old?.businessOwnerId
   && !leadOwnerMembers(state).some(member=>member.id===data.businessOwnerId)) {
  throw Error('Selecione um integrante de um setor habilitado para leads.');
 }
 if(old?.projectId && data.stage!=='Ganho') throw Error('Um lead convertido permanece em Ganho.');
 const today = leadActivityDay();
 const contactDays = contactDaysFor(old, data.stage, today);
 const lead={...old,...data,...(!old&&!data.createdAt?{createdAt:today}:{}),...(contactDays.length?{contactDays}:{}),id,name:data.name.trim(),company:data.company.trim(),contact:data.contact.trim(),clientSegment:data.clientSegment?.trim() || old?.clientSegment || 'Não classificado',...(data.estimatedValue!==undefined?{estimatedValue}:{}),...(city!==undefined?{city}:{}),...(uf!==undefined?{uf}:{}),...(data.linkedin!==undefined?{linkedin:linkedin || ''}:{})};
 return {...state,leads:old?state.leads.map(l=>l.id===id?lead:l):[...state.leads,lead]};
}
function importIdentity({company,contact,name}) {
 return JSON.stringify([company,contact,name].map(value=>String(value ?? '').trim().toLocaleLowerCase('pt-BR')));
}

export function importLeads(state, rows) {
 const identities=new Set(state.leads.map(importIdentity));
 const imported=[];
 const errors=[];
 let duplicates=0;
 let outsideIcp=0;
 const empty={...state,leads:[]};

 for (const {file,record,data} of rows) {
  if (isOutsideLeadIcp(data.idealCustomerProfile)) {
   outsideIcp++;
   continue;
  }
  const company=data.company.trim();
  const contact=data.contact.trim();
  const name=data.name.trim() || company;
  const segment=data.contractorSegment.trim();
  const area=state.areas.find(item=>item.id===segment || item.name.localeCompare(segment,'pt-BR',{sensitivity:'base'})===0);
  if (!company || !contact || (segment && !area)) {
   errors.push({file,record,message:!company || !contact ? 'Empresa e contato são obrigatórios.' : 'Área da contratante não encontrada.'});
   continue;
  }
  const identity=importIdentity({company,contact,name});
  if (identities.has(identity)) {duplicates++; continue;}
  try {
   const importedFields=Object.fromEntries(['contactName','phone','email','decisionPower','idealCustomerProfile']
    .filter(field=>data[field]).map(field=>[field,data[field]]));
   const next=saveLead(empty,{company,contact,name,stage:'Novo',clientSegment:data.clientSegment,
    contractorSegment:area?.id || '',linkedin:data.linkedin,...importedFields});
   imported.push(next.leads[0]);
   identities.add(identity);
  } catch (error) {
   errors.push({file,record,message:error.message});
  }
 }
 const next=imported.length ? {...state,leads:[...state.leads,...imported]} : state;
 return {state:next,added:imported.length,duplicates,outsideIcp,errors};
}

export function saveProposal(state, leadId, data) {
 const lead = state.leads.find(item=>item.id === leadId);
 if (!['Proposta','Ganho'].includes(lead?.stage)) throw Error('Abra um lead em Proposta ou Ganho para editar a proposta.');
 const documentUrl = proposalDocumentUrl(data.documentUrl);
 if (data.documentUrl.trim() && !documentUrl) throw Error('Informe um link HTTP ou HTTPS para o documento.');
 const price = data.price === '' ? null : Number(data.price);
 if (price !== null && (!Number.isFinite(price) || price <= 0)) throw Error('Informe um valor positivo para a proposta.');
 const attachment = data.attachment === undefined ? lead.proposal?.attachment : data.attachment;
 const proposal = {documentUrl, description:data.description.trim(), price, attachment:attachment ?? null};
 return {...state, leads:state.leads.map(item=>item.id === leadId ? {...item,proposal} : item)};
}

export function convert(state,leadId,data) {
 const lead=state.leads.find(l=>l.id===leadId);
 if(!lead) throw Error('Lead não encontrado.');
 const existing=state.projects.find(p=>p.leadId===leadId);
 if(existing) return {state,project:existing};
 if(lead.stage!=='Ganho') throw Error('Somente leads ganhos podem ser convertidos.');
 if(!data.name?.trim() || !state.areas.some(a=>a.id===data.areaId)) throw Error('Informe nome e área do projeto.');
 const ownerId=data.ownerId || null;
 if(ownerId && !state.members.some(member=>member.id===ownerId && member.areaId===data.areaId)) {
  throw Error('Selecione um responsável da área.');
 }
 const memberIds=[...new Set([...(ownerId ? [ownerId] : []),...(data.memberIds||[])])];
 if(memberIds.some(id=>!state.members.some(m=>m.id===id))) throw Error('Integrante inválido.');
 validateDates(data,['convertedAt','contractStart','contractEnd']);
 if(data.contractStart&&data.contractEnd&&data.contractStart>data.contractEnd) throw Error('A data final da vigência deve ser igual ou posterior à inicial.');
 const terms={...validateTerms(data),convertedAt:data.convertedAt||null,contractStart:data.contractStart||null,contractEnd:data.contractEnd||null};
 const squadId=memberIds.length ? crypto.randomUUID() : null;
 const contractDate = terms.contractStatus === 'Contratado' && !terms.convertedAt ? {contractClosedAt:leadActivityDay()} : {};
 const project={...terms,...contractDate,phase:data.phase || 'Discovery',originPhase:data.phase || 'Discovery',company:lead.company,clientSegment:lead.clientSegment || 'Não classificado',squadId,id:crypto.randomUUID(),name:data.name.trim(),areaId:data.areaId,ownerId,memberIds,leadId,status:'Planejado'};
 const squads=state.squads || [];
 const linkedSquads=squadId
  ? [...squads,{id:squadId,name:data.squadName?.trim() || `Squad · ${project.name}`,areaId:data.areaId,ownerId,memberIds,specialty:'Equipe do projeto'}]
  : squads;
 return {state:{...state,leads:state.leads.map(l=>l.id===leadId?{...l,projectId:project.id}:l),squads:linkedSquads,projects:[...state.projects,project]},project};
}
export function saveProjectScope(state,leadId,{areaId,phase,contractValue}) {
 const lead=state.leads.find(item=>item.id===leadId);
 if (!lead) throw Error('Lead não encontrado.');
 if (lead.stage!=='Ganho') throw Error('Somente leads ganhos podem ter valor e escopo definidos.');
 if (!state.areas.some(area=>area.id===areaId)) throw Error('Selecione a área responsável pelo projeto.');
 if (!phases.includes(phase)) throw Error('Selecione Discovery ou Delivery.');

 const project=leadProject(state,lead);
 if (!project) return convert(state,leadId,{name:lead.name || lead.company,areaId,phase,contractValue});

 const terms=validateTerms({
  contractValue,
  contractStatus:contractValue==='' || contractValue==null ? project.contractStatus : 'Contratado',
 });
 if (project.contractValue>0 && terms.contractValue===null) throw Error('Informe o valor contratado.');
 const contractDate=terms.contractStatus==='Contratado' && project.contractStatus!=='Contratado'
  && !project.convertedAt && !project.contractClosedAt ? {contractClosedAt:leadActivityDay()} : {};
 const updated={...project,...terms,...contractDate,areaId,phase};
 return {state:{...state,projects:state.projects.map(item=>item.id===project.id ? updated : item)},project:updated};
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
    saveGoal: (state,data)=>persist(saveGoal(state,data)),
    saveMember: (state, data, id) => persist(saveMember(state, data, id)),
    saveIcp: (state, budget) => persist(saveIcp(state,budget)),
    saveArea: (state, name, id) => persist(saveArea(state, name, id)),
    setAreaLeadOwnership: (state, id, enabled) => persist(setAreaLeadOwnership(state, id, enabled)),
    removeArea: (state, id) => persist(removeArea(state, id)),
    filterProjects, calculateAverageMetrics, valueBlocks,
    addValueDemo: state => persist(addValueDemo(state)),
    changePhase: (state,id) => persist(changePhase(state,id)),
    addDemo: state => persist(addDemo(state)),
    load: () => repository.read(),
    saveLead: (state, data, id) => persist(saveLead(state, data, id)),
    importLeads(state, rows) {
      const result=importLeads(state,rows);
      if (result.state!==state) persist(result.state);
      return result;
    },
    saveProposal: (state, id, data) => persist(saveProposal(state, id, data)),
    moveLeadStage(state, id, stage) {
      const next = moveLeadStage(state, id, stage);
      return next === state ? state : persist(next);
    },
    convert(state, leadId, data) {
      const result = convert(state, leadId, data);
      persist(result.state);
      return result;
    },
    saveProjectScope(state, leadId, data) {
      const result=saveProjectScope(state,leadId,data);
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
 const search=filters.projectSearch?.trim().toLocaleLowerCase();
 return state.projects.filter(p=>(!search || `${p.name} ${p.company || ''}`.toLocaleLowerCase().includes(search)) && (!filters.segment || p.clientSegment===filters.segment) && (!filters.phase || p.phase===filters.phase) && (!filters.area || p.areaId===filters.area) && (!filters.status || p.status===filters.status));
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
  if(i===0){const project=next.projects.find(p=>p.leadId===id);next=changeStatus(next,project.id,'Em andamento');}
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

export function moveLeadStage(state, id, stage) {
 const lead = state.leads.find(item => item.id === id);
 if (!lead) throw Error('Lead não encontrado.');
 if (!stages.includes(stage)) throw Error('Estágio inválido.');
 if (lead.stage === stage) return state;
 if (stage !== 'Ganho' && (lead.projectId || state.projects.some(project => project.leadId === id))) {
  throw Error('Um lead convertido permanece em Ganho.');
 }
 const contactDays = contactDaysFor(lead, stage, leadActivityDay());
 const updated = {...lead, stage, ...(contactDays.length ? {contactDays} : {})};
 return {...state, leads:state.leads.map(item => item.id === id ? updated : item)};
}

export function saveIcp(state, {minimum,maximum}) {
 const parseBudget = value => value === '' || value == null ? null : Number(value);
 const min = parseBudget(minimum);
 const max = parseBudget(maximum);
 if ([min,max].some(value=>value!==null && (!Number.isFinite(value) || value<0))) {
  throw Error('Informe valores de orçamento válidos.');
 }
 if (min!==null && max!==null && min>max) {
  throw Error('O orçamento máximo deve ser maior ou igual ao mínimo.');
 }
 return {...state,icpBudget:{minimum:min,maximum:max}};
}

export function saveArea(state, name, id = crypto.randomUUID()) {
 const label=typeof name==='string' ? name.trim().replace(/\s+/g,' ') : '';
 if (!label) throw Error('Informe o nome do setor.');
 const canonical=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR');
 if (state.areas.some(area=>area.id===id || canonical(area.name)===canonical(label))) {
  throw Error('Já existe um setor com esse nome.');
 }
 return {...state,areas:[...state.areas,{id,name:label,leadOwnershipEnabled:false}]};
}

export function setAreaLeadOwnership(state, id, enabled) {
 if (!state.areas.some(area=>area.id===id)) throw Error('Setor não encontrado.');
 return {...state,areas:state.areas.map(area=>area.id===id ? {...area,leadOwnershipEnabled:enabled} : area)};
}

export function removeArea(state, id) {
 const area = state.areas.find(item => item.id === id);
 if (!area) throw Error('Setor não encontrado.');

 const detachArea = item => item.areaId === id ? {...item, areaId:null} : item;
 return {
  ...state,
  areas:state.areas.filter(item => item.id !== id),
  projects:state.projects.map(detachArea),
  members:state.members.map(detachArea),
  squads:(state.squads || []).map(detachArea),
  leads:state.leads.map(lead => {
   const segment = lead.contractorSegment;
   const linked = segment === id || (typeof segment === 'string'
    && segment.trim().localeCompare(area.name,'pt-BR',{sensitivity:'base'}) === 0);
   return linked ? {...lead, contractorSegment:''} : lead;
  }),
 };
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
 return state.areas.map(area => {
  const count = counts.get(area.id);
  // Fixed scale: zero remains visible; each additional member grows smoothly.
  const ratio = count / (count + 6);
  return {...area, count, desktopDiameter: Math.round(108 + ratio * 88), mobileDiameter: Math.round(88 + ratio * 56)};
 });
}

function validateDates(data,keys){for(const key of keys){if(data[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(data[key])||Number.isNaN(Date.parse(data[key])))) throw Error('Data inv?lida.');}}

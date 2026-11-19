import {areaNames,seed} from '../domain.js';

export const STORAGE_KEY = 'central-citi-v1';

export function readState(storage, key = STORAGE_KEY, initialState = seed) {
 const raw=storage.getItem(key);
 if(!raw) return hydrateState(structuredClone(initialState));
 const value=JSON.parse(raw);
 if(value.version!==1 || !['areas','members','leads','projects'].every(k=>Array.isArray(value[k]))) throw Error('Dados locais incompatíveis.');
 return hydrateState(initialState.demoWorkspace && (initialState.demoRevision ?? 0) > (value.demoRevision ?? 0)
  ? updateDemoWorkspace(value,initialState) : value);
}

function updateDemoWorkspace(saved, incoming) {
 const catalog = new Map(incoming.leads.map(lead=>[lead.id,lead]));
 const savedLeadIds = new Set(saved.leads.map(lead=>lead.id));
 const savedProjectIds = new Set(saved.projects.map(project=>project.id));
 const savedAreaIds = new Set(saved.areas.map(area=>area.id));
 const missingSector = value => !value || value === 'Não classificado';
 const leads = saved.leads.map(lead=>{
  const match = catalog.get(lead.id);
  return match?.company === lead.company && missingSector(lead.clientSegment) && !missingSector(match.clientSegment)
   ? {...lead,clientSegment:match.clientSegment} : lead;
 }).concat(incoming.leads.filter(lead=>!savedLeadIds.has(lead.id)));
 const sectors = new Map(leads.map(lead=>[lead.id,lead.clientSegment]));
 const projects = saved.projects.map(project=>{
  const sector = sectors.get(project.leadId);
  return missingSector(project.clientSegment) && !missingSector(sector)
   ? {...project,clientSegment:sector} : project;
 }).concat(incoming.projects.filter(project=>!savedProjectIds.has(project.id))
  .map(project=>savedAreaIds.has(project.areaId) ? project : {...project,areaId:null}));
 return {...saved,demoWorkspace:true,demoRevision:incoming.demoRevision,leads,projects};
}

// Resolve lazily: browsers can throw even when accessing localStorage.
export function createStateRepository(getStorage = () => globalThis.localStorage, key = STORAGE_KEY, initialState = seed) {
  let readFailed = false;
  return {
    read() {
      try {
        const state = readState(getStorage(),key,initialState);
        readFailed = false;
        return state;
      } catch (error) {
        readFailed = true;
        throw error;
      }
    },
    write(state) {
      if (readFailed) throw Error('Persistência indisponível. Recarregue após corrigir o armazenamento.');
      try {
        getStorage().setItem(key, JSON.stringify(state));
      } catch {
        throw Error('Não foi possível salvar. Verifique o espaço e as permissões do navegador.');
      }
    },
  };
}

// Hydration is additive: existing ids, unknown fields and empty collections survive.
export function hydrateState(value) {
 const leads=value.leads.map(l=>({...l, clientSegment:l.clientSegment || 'Não classificado'}));
 const squads=[...(value.squads || [])];
 const projects=value.projects.map(p=>{
  const lead=leads.find(l=>l.id===p.leadId);
  const memberIds=Array.isArray(p.memberIds) ? p.memberIds : [];
  const squadId=p.squadId || (p.ownerId || memberIds.length ? `squad-${p.id}` : null);
  if(squadId && !squads.some(s=>s.id===squadId)) squads.push({id:squadId,name:`Squad · ${p.name}`,areaId:p.areaId,ownerId:p.ownerId,memberIds,specialty:'Equipe do projeto'});
  return {...p,memberIds,company:p.company || lead?.company || 'Não informada',clientSegment:p.clientSegment || lead?.clientSegment || 'Não classificado',phase:p.phase || 'Delivery',originPhase:p.originPhase || p.phase || 'Delivery',contractStatus:p.contractStatus || 'Contratado',contractValue:p.contractValue ?? null,squadId};
 });
 const areas=value.areas.map(area=>{
  const slot=/^a([0-4])$/.exec(area.id);
  return slot ? {...area,name:areaNames[Number(slot[1])]} : area;
 });
 return {...value,areas,leads,projects,squads};
}

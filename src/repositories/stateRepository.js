import {seed} from '../domain.js';

export const STORAGE_KEY = 'central-citi-v1';

export function readState(storage) {
 const raw=storage.getItem(STORAGE_KEY);
 if(!raw) return hydrateState(structuredClone(seed));
 const value=JSON.parse(raw);
 if(value.version!==1 || !['areas','members','leads','projects'].every(k=>Array.isArray(value[k]))) throw Error('Dados locais incompatíveis.');
 return hydrateState(value);
}

// Resolve lazily: browsers can throw even when accessing localStorage.
export function createStateRepository(getStorage = () => globalThis.localStorage) {
  let readFailed = false;
  return {
    read() {
      try {
        const state = readState(getStorage());
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
        getStorage().setItem(STORAGE_KEY, JSON.stringify(state));
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
  const squadId=p.squadId || `squad-${p.id}`;
  if(!squads.some(s=>s.id===squadId)) squads.push({id:squadId,name:`Squad · ${p.name}`,areaId:p.areaId,ownerId:p.ownerId,memberIds:p.memberIds || [],specialty:'Equipe do projeto'});
  return {...p,company:p.company || lead?.company || 'Não informada',clientSegment:p.clientSegment || lead?.clientSegment || 'Não classificado',phase:p.phase || 'Delivery',originPhase:p.originPhase || p.phase || 'Delivery',contractStatus:p.contractStatus || 'Contratado',contractValue:p.contractValue ?? null,squadId};
 });
 return {...value,leads,projects,squads};
}

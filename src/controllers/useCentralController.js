import {useRef, useState} from 'react';
import {analytics} from '../services/analyticsService.js';
import {deleteProposalDocument, storeProposalDocument} from '../repositories/proposalDocuments.js';
import {isCloud,createRemoteWorkspace} from '../services/cloudClient.js';
import {seed} from '../domain.js';
import {createLeadProjectService} from '../services/leadProjectService.js';

export function useCentralController(initialWorkspace) {
  const [remote]=useState(()=>isCloud?createRemoteWorkspace(initialWorkspace):null);
  const [service] = useState(() => createLeadProjectService(remote?{read:()=>initialWorkspace.state,write:()=>{}}:undefined));
  const [initial] = useState(() => {
    try {
      return {state: service.load(), storageError: ''};
    } catch {
      return {
        state: structuredClone(seed),
        storageError: 'Não foi possível ler os dados locais. A demonstração está temporariamente em memória; os dados salvos não serão sobrescritos.',
      };
    }
  });
  const [state, setState] = useState(initial.state);
  const current = useRef(state);
  const [message, setMessage] = useState('');

  function publish(next) {
    current.current = next;
    setState(next);
    setMessage('');
  }
  function mutate(command,args){return remote.execute(command,args).then(response=>{publish(response.state);return {...response.result,state:response.state};});}
  function saveLead(data, id) {
    if(remote)return mutate('saveLead',[data,id]);
    publish(service.saveLead(current.current, data, id));
  }
  function importLeads(rows) {
    if(remote)return mutate('importLeads',[rows]);
    const result=service.importLeads(current.current,rows);
    if (result.state!==current.current) publish(result.state);
    return result;
  }
  async function saveProposal(id, data, file, removeAttachment) {
    const attachment = file ? await storeProposalDocument(file) : removeAttachment ? null : undefined;
    const previous = current.current.leads.find(lead=>lead.id === id)?.proposal?.attachment;
    try {
      if(remote)await mutate('saveProposal',[id,{...data,attachment}]);
      else publish(service.saveProposal(current.current, id, {...data, attachment}));
    } catch (error) {
      if (attachment) void deleteProposalDocument(attachment.id).catch(()=>{});
      throw error;
    }
    if (attachment !== undefined && previous?.id) void deleteProposalDocument(previous.id).catch(()=>{});
  }
  function moveLeadStage(id, stage) {
    if(remote)return mutate('moveLeadStage',[id,stage]);
    const next = service.moveLeadStage(current.current, id, stage);
    if (next !== current.current) publish(next);
  }
  function saveMember(data, id) { if(remote)return mutate('saveMember',id===undefined?[data]:[data,id]);publish(service.saveMember(current.current, data, id)); }
  function saveArea(name) {
    const id=crypto.randomUUID();
    if(remote)return mutate('saveArea',[name,id]).then(()=>id);
    publish(service.saveArea(current.current,name,id));
    return id;
  }
  function saveIcp(budget) { if(remote)return mutate('saveIcp',[budget]);publish(service.saveIcp(current.current,budget)); }
  function setAreaLeadOwnership(id,enabled) {
    if(remote)return mutate('setAreaLeadOwnership',[id,enabled]);
    publish(service.setAreaLeadOwnership(current.current,id,enabled));
  }
  function removeArea(id) { if(remote)return mutate('removeArea',[id]);publish(service.removeArea(current.current,id)); }
  function saveProjectScope(leadId, data) {
    if(remote)return mutate('saveProjectScope',[leadId,data]).then(result=>result.project);
    const result = service.saveProjectScope(current.current, leadId, data);
    publish(result.state);
    return result.project;
  }
  function changeStatus(id, status) {
    if(remote)return mutate('changeStatus',[id,status]).catch(error=>setMessage(error.message));
    try {
      publish(service.changeStatus(current.current, id, status));
    } catch (error) {
      setMessage(error.message);
    }
  }
  function addDemo() { try { publish(service.addDemo(current.current)); } catch(error) { setMessage(error.message); } }
  function addValueDemo() { try { publish(service.addValueDemo(current.current)); } catch(error) { setMessage(error.message); } }
  return {analyticsModel: filters=>analytics(state,filters),saveGoal: data=>remote?mutate('saveGoal',[data]):publish(service.saveGoal(current.current,data)),leadFunnel: filters => service.leadFunnel(state, filters), saveMember, saveArea, removeArea, setAreaLeadOwnership, saveIcp, organizationAtoms: service.organizationAtoms(state), addValueDemo,valueBlocks:(kind,filters,grouping)=>service.valueBlocks(state,kind,filters,grouping),addDemo,filterProjects: filters=>service.filterProjects(state,filters),averageMetrics:(filters,grouping)=>service.calculateAverageMetrics(state,filters,grouping),state, storageError: initial.storageError, message, saveLead, importLeads, saveProposal, moveLeadStage, saveProjectScope, changeStatus};
}

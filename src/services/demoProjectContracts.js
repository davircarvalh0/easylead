const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
function fallbackValue(id){let hash=0;for(const character of String(id||''))hash=(hash*31+character.codePointAt(0))%100000;return 25000+hash;}
export function fillDemoProjectContracts(incoming){
 const state=structuredClone(incoming);let valued=0,signed=0;
 for(const project of state.projects){
  if(!positive(project.contractValue)){
   const lead=state.leads.find(lead=>lead.id===project.leadId)||state.leads.find(lead=>lead.projectId===project.id);
   project.contractValue=positive(lead?.proposal?.price)?lead.proposal.price:positive(lead?.estimatedValue)?Math.max(1,Math.round(lead.estimatedValue*.9)):fallbackValue(project.id);
   valued++;
  }
  if(project.contractStatus!=='Contratado'){project.contractStatus='Contratado';signed++;}
 }
 return {state,valued,signed,projects:state.projects.length};
}

import {leadContactAreaCode,leadIcpStatus,leadPendingAction} from '../src/services/leadWorkspace.js';

import {leadQualification,monthlySectorRanking} from '../src/services/leadQualificationService.js';

export const tables = {
  attachment_leads:{text:'id file company name contact contactName clientSegment contractorSegment idealCustomerProfile',number:'record'},
  leads: {
    text:'id name company contact linkedin city uf contactAreaCode icpStatus stage clientSegment contractorSegment businessOwnerId businessOwnerName businessAreaId businessAreaName projectId createdAt contactDays proposalDescription proposalDocumentUrl proposalAttachmentName',
    number:'estimatedValue proposalPrice proposalPending hasSignedContract',
  },
  commercial_area_metrics:{text:'areaId areaName',number:'leadCount contractedLeadCount signedProjectCount conversionRate contractedValue'},
  projects: {
    text:'id name company clientSegment leadId areaId ownerId squadId phase originPhase status contractStatus convertedAt contractClosedAt contractStart contractEnd',
    number:'contractValue',
  },
  areas:{text:'id name'},
  members:{text:'id name areaId role'},
  sector_monthly:{
    text:'period sector',
    number:'leadsCreated cohortContracts closedContracts previousClosedContracts conversionRate',
  },
  workspace_profile:{text:'id mode',number:'icpBudgetMin icpBudgetMax'},
  squads:{text:'id name areaId ownerId specialty'},
  project_members:{text:'projectId memberId'},
  squad_members:{text:'squadId memberId'},
};

export const schema = Object.entries(tables).map(([name,{text,number}])=>
  name+'('+[text,number].filter(Boolean).join(' ').replaceAll(' ',', ')+')'
).join('\n');

export function assistantSnapshot(state) {
  const qualification=leadQualification(state);
  const signedLeads=new Set(qualification.contracts.map(lead=>lead.id));
  const members=new Map(state.members.map(member=>[member.id,member]));
  const areas=new Map(state.areas.map(area=>[area.id,area]));
  const leadsById=new Map(state.leads.map(lead=>[lead.id,lead]));
  const leadsByProject=new Map(state.leads.filter(lead=>lead.projectId).map(lead=>[lead.projectId,lead]));
  const commercialOwnership=new Map(state.leads.map(lead=>{
    const member=members.get(lead.businessOwnerId),area=areas.get(member?.areaId);
    return [lead.id,{businessOwnerName:member?.name??null,businessAreaId:area?.id??null,businessAreaName:area?.name??null}];
  }));
  const commercialAreas=new Map();
  for(const lead of state.leads){
    const ownership=commercialOwnership.get(lead.id),key=ownership.businessAreaId;
    if(!commercialAreas.has(key))commercialAreas.set(key,{areaId:key,areaName:ownership.businessAreaName??'Sem área comercial identificada',leadCount:0,contractedLeadCount:0,signedProjectCount:0,conversionRate:0,contractedValue:0});
    const metric=commercialAreas.get(key);metric.leadCount++;metric.contractedLeadCount+=Number(signedLeads.has(lead.id));
  }
  const countedProjects=new Set();
  for(const project of state.projects){
    if(project.contractStatus!=='Contratado'||countedProjects.has(project.id))continue;
    const lead=project.leadId?leadsById.get(project.leadId):leadsByProject.get(project.id);
    if(!lead)continue;
    countedProjects.add(project.id);
    const metric=commercialAreas.get(commercialOwnership.get(lead.id).businessAreaId);
    metric.signedProjectCount++;
    if(typeof project.contractValue==='number'&&Number.isFinite(project.contractValue)&&project.contractValue>0)metric.contractedValue+=project.contractValue;
  }
  for(const metric of commercialAreas.values())metric.conversionRate=metric.contractedLeadCount/metric.leadCount;
  const years=new Set([...qualification.sectorSeasonality.keys(),...Array.from(qualification.contractsByMonth.keys(),period=>period.slice(0,4))]);
  const monthly=Array.from(years).sort().flatMap(year=>Array.from({length:12},(_,index)=>{
    const month=String(index+1).padStart(2,'0');
    return monthlySectorRanking(qualification,month,year).map(row=>({
      period:year+'-'+month,sector:row.segment,leadsCreated:row.leadsCreated,cohortContracts:row.cohortContracts,
      closedContracts:row.count,previousClosedContracts:row.previousCount,conversionRate:row.rate,
    }));
  }).flat());
  const source = {
    attachment_leads:[],
    leads:state.leads.map(lead=>({
      ...lead, ...commercialOwnership.get(lead.id), hasSignedContract:Number(signedLeads.has(lead.id)), contactDays:JSON.stringify(lead.contactDays || []),
      proposalPrice:lead.proposal?.price, proposalDescription:lead.proposal?.description,
      contactAreaCode:leadContactAreaCode(lead), icpStatus:leadIcpStatus(lead.idealCustomerProfile),
      proposalPending:Number(leadPendingAction(lead)==='Proposta pendente'),
      proposalDocumentUrl:lead.proposal?.documentUrl, proposalAttachmentName:lead.proposal?.attachment?.name,
    })),
    projects:state.projects,
    commercial_area_metrics:[...commercialAreas.values()],
    sector_monthly:monthly,
    areas:state.areas,
    workspace_profile:[{id:'current',mode:state.demoWorkspace ? 'demonstração' : 'principal',icpBudgetMin:state.icpBudget?.minimum,icpBudgetMax:state.icpBudget?.maximum}],
    members:state.members,
    squads:state.squads || [],
    project_members:state.projects.flatMap(project=>(project.memberIds || []).map(memberId=>({projectId:project.id,memberId}))),
    squad_members:(state.squads || []).flatMap(squad=>(squad.memberIds || []).map(memberId=>({squadId:squad.id,memberId}))),
  };
  return Object.fromEntries(Object.entries(tables).map(([name,{text,number}])=>{
    const columns=[text,number].filter(Boolean).join(' ').split(' ');
    return [name,source[name].map(row=>Object.fromEntries(columns.map(field=>[field,row[field]])))];
  }));
}

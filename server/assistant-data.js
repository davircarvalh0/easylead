import {leadContactAreaCode,leadIcpStatus,leadPendingAction} from '../src/services/leadWorkspace.js';

import {leadQualification,monthlySectorRanking} from '../src/services/leadQualificationService.js';

export const tables = {
  attachment_leads:{text:'id file company name contact contactName clientSegment contractorSegment idealCustomerProfile',number:'record'},
  leads: {
    text:'id name company contact linkedin city uf contactAreaCode icpStatus stage clientSegment contractorSegment businessOwnerId projectId createdAt contactDays proposalDescription proposalDocumentUrl proposalAttachmentName',
    number:'estimatedValue proposalPrice proposalPending hasSignedContract',
  },
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
      ...lead, hasSignedContract:Number(signedLeads.has(lead.id)), contactDays:JSON.stringify(lead.contactDays || []),
      proposalPrice:lead.proposal?.price, proposalDescription:lead.proposal?.description,
      contactAreaCode:leadContactAreaCode(lead), icpStatus:leadIcpStatus(lead.idealCustomerProfile),
      proposalPending:Number(leadPendingAction(lead)==='Proposta pendente'),
      proposalDocumentUrl:lead.proposal?.documentUrl, proposalAttachmentName:lead.proposal?.attachment?.name,
    })),
    projects:state.projects,
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

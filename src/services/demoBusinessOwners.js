export const demoBusinessOwners=[
 {id:'demo-business-tiago-mattos',name:'Tiago Mattos'},
 {id:'demo-business-joao-pedro',name:'João Pedro'},
 {id:'demo-business-beatriz-luna',name:'Beatriz Luna'},
];
const normalized=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase();
export function assignDemoBusinessOwners(incoming){
 const state=structuredClone(incoming);
 const area=state.areas.find(item=>normalized(item.name)==='negocios');
 if(!area)throw Error('A área de Negócios não foi encontrada na carteira.');
 area.leadOwnershipEnabled=true;
 const owners=demoBusinessOwners.map(person=>{
  const existing=state.members.find(member=>member.areaId===area.id&&String(member.name||'').trim().toLowerCase()===person.name.toLowerCase());
  if(existing)return existing;
  if(state.members.some(member=>member.id===person.id))throw Error('Identificador do responsável já está em uso: '+person.name);
  const member={...person,areaId:area.id,role:'Consultor(a) de Negócios'};state.members.push(member);return member;
 });
 let assigned=0;
 for(const lead of state.leads){
  if(String(lead.businessOwnerId||'').trim())continue;
  const slot=assigned%10;lead.businessOwnerId=owners[slot<5?0:slot<8?1:2].id;assigned++;
 }
 return {state,assigned,owners:owners.map(member=>({id:member.id,name:member.name,leads:state.leads.filter(lead=>lead.businessOwnerId===member.id).length}))};
}

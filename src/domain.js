export const stages = ['Novo', 'Em contato', 'Proposta', 'Ganho', 'Perdido'];
export const statuses = ['Planejado', 'Em andamento', 'Concluído'];
export const seed = {
 version: 1,
 areas: ['Inovação', 'Comercial', 'Desenvolvimento', 'Design', 'Pessoas'].map((name,i)=>({id:`a${i}`,name})),
 members: ['Ana Lima','Bruno Melo','Clara Luz','Diego Alves','Eva Costa'].map((name,i)=>({id:`m${i}`,name,areaId:`a${i}`,role:['Estrategista','Consultor','Desenvolvedora','Designer','Gestora'][i]})),
 leads: stages.map((stage,i)=>({id:`l${i}`,name:['Portal Aurora','Loja Horizonte','App Raiz','Plataforma Maré','Site Sol'][i],company:`Empresa exemplo ${i+1}`,contact:`contato${i+1}@example.com`,stage})),
 projects: []
};
export const metrics=s=>({open:s.leads.filter(l=>stages.slice(0,3).includes(l.stage)).length,active:s.projects.filter(p=>p.status==='Em andamento').length});
// Urgency affects only the home queue, never the open-lead metric.
export function actionableLeads(state) {
 const priority = {Ganho: 0, Proposta: 1, 'Em contato': 2, Novo: 3};
 return state.leads.filter(l => l.stage in priority && !(l.stage === 'Ganho' && l.projectId))
  .sort((a, b) => priority[a.stage] - priority[b.stage]);
}

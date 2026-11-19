import {leadFunnel} from './leadFunnelService.js';
import {isEligibleForAverage, filterProjects} from './leadProjectService.js';
export const indicators={total:'Valor contratado',average:'Valor médio contratado',open:'Leads abertos',won:'Leads ganhos',estimated:'Valor estimado em aberto',active:'Projetos em andamento',projects:'Total de projetos'};
export function analytics(state,filters={}) {
 const projects=filterProjects(state,filters),eligible=projects.filter(isEligibleForAverage);
 const closingDay = project => project.convertedAt || project.contractClosedAt;
 const dated = eligible.filter(project=>/^\d{4}-(0[1-9]|1[0-2])(?:-|$)/.test(closingDay(project)));
 const history = Object.entries(Object.groupBy(dated,project=>closingDay(project).slice(0,7)))
  .sort(([a],[b])=>a.localeCompare(b))
  .map(([label,items])=>({label,value:items.reduce((sum,project)=>sum+project.contractValue,0),contracts:items.length}));
 const total=eligible.reduce((s,p)=>s+p.contractValue,0);
 const leads=leadFunnel(state,filters).items;
 const open=leads.filter(l=>['Novo','Em contato','Proposta'].includes(l.stage));
 return {history,leads,comparisons:leads.map(l=>({id:l.id,name:l.name,estimated:l.estimatedValue??null,contracted:eligible.find(p=>p.leadId===l.id)?.contractValue??null})),projects,eligible,values:{total:eligible.length?total:null,average:eligible.length?total/eligible.length:null,open:open.length,won:leads.filter(l=>l.stage==='Ganho').length,estimated:open.some(l=>l.estimatedValue>0)?open.reduce((s,l)=>s+(l.estimatedValue||0),0):null,active:projects.filter(p=>p.status==='Em andamento').length,projects:projects.length}};
}
export function saveGoal(state,data) {
 if(!Object.hasOwn(indicators,data.indicator)||!Number.isFinite(Number(data.target))||Number(data.target)<=0||!data.period?.trim()) throw Error('Informe indicador, objetivo positivo e período.');
 const goal={indicator:data.indicator,target:Number(data.target),period:data.period.trim()};
 return {...state,goals:[...(state.goals||[]).filter(g=>g.indicator!==goal.indicator),goal]};
}

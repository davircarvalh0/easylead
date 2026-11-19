import {AnalyticsBento} from './views/AnalyticsBento.jsx';
import {LeadSearch} from '../components/ui/LeadSearch.jsx';
import {EasyLeadAssistant} from './views/EasyLeadAssistant.jsx';
import './views/project-dashboard.css';
import {LeadFunnel} from './views/LeadFunnel.jsx';
import {LeadFacts} from './views/LeadFacts.jsx';
import {LeadProject} from './views/LeadProject.jsx';
import {ProspectWorkspace} from './views/ProspectWorkspace.jsx';
import {leadOwnerMembers, closedContractAmount, leadProject, prospectHref, prospectPath} from './services/leadWorkspace.js';
import './views/prospect-workspace.css';
import {LeadConversionSummary, LeadQualification, LeadQualificationDetails, LeadSeasonality, LeadSeasonalityRanking, LeadWeeklyMetrics} from './views/LeadQualification.jsx';
import {leadQualification} from './services/leadQualificationService.js';
import React,{useState,useEffect,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {statuses} from './domain.js';
import {useCentralController} from './controllers/useCentralController.js';
import {LeadForm} from './views/LeadForm.jsx';
import {LeadProposal, LeadProposalEditor} from './views/LeadProposal.jsx';
import {formatMoney} from './views/DashboardValue.jsx';
import {ProjectScopeEditor} from './views/Conversion.jsx';
import './style.css';
import './views/dashboard-modules.css';
import {DashboardModule} from './views/DashboardModule.jsx';
import {Organization} from './views/OrganizationAtoms.jsx';
import {updateModuleGlow} from './views/ChartSurface.jsx';
import {WaveMesh} from './views/WaveMesh.jsx';
import {AuthGate} from './views/AuthGate.jsx';
import {TopNavigation} from './views/TopNavigation.jsx';
import {ProjectFilters,ProjectList,ProjectTable} from './views/Pipeline.jsx';
import './views/easy-lead-theme.css';
import './views/dashboard-clean.css';
import './views/directory-clean.css';
import './views/kanban-board.css';
import './views/record-clean.css';
import './views/organization-areas.css';
import './views/fonts/pt-serif.css';
import {isCloud,cloudApi} from './services/cloudClient.js';
import {hasPrimaryWorkspace,promoteDemoToPrimary} from './repositories/primaryWorkspace.js';
const nav=[['/easylead','EasyLead'],['/leads','Leads'],['/projetos','Projetos'],['/organizacao','Organização']];
const go=path=>{location.hash=path};
function currentRoute() {
 const route=location.hash.slice(1);
 const [path]=route.split('?');
 if(!path || path==='/') return '/easylead'+route.slice(path.length);
 if(path==='/contratos' || path==='/contratos/') return '/projetos'+route.slice(path.length);
 if(path==='/integrantes' || path==='/integrantes/') {
  const areaId=new URLSearchParams(route.split('?')[1]).get('area');
  return areaId ? '/organizacao/'+encodeURIComponent(areaId) : '/organizacao';
 }
 return route;
}

function Workspace(props) {
 const [ready,setReady]=useState(false);
 const [initialWorkspace,setInitialWorkspace]=useState(null);
 const [error,setError]=useState('');
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setError('');
  if(isCloud){
   cloudApi('workspace',{signal:controller.signal}).then(data=>{if(!controller.signal.aborted){setInitialWorkspace(data);setReady(true);}}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
   return()=>controller.abort();
  }
  // Older demo bookmarks now open the same primary workspace.
  const url=new URL(location.href);
  if(url.searchParams.get('carteira')==='demo'){
   url.searchParams.delete('carteira');history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  try{
   if(hasPrimaryWorkspace(localStorage)){setReady(true);return;}
  }catch{setError('Não foi possível acessar os dados locais. Verifique as permissões de armazenamento.');return;}
  fetch('/api/easylead/demo-workspace',{signal:controller.signal})
   .then(response=>{if(!response.ok)throw Error('A base da carteira principal está indisponível neste servidor.');return response.json();})
   .then(state=>{if(controller.signal.aborted)return;promoteDemoToPrimary(localStorage,state);setReady(true);})
   .catch(error=>{if(!controller.signal.aborted)setError(error.message);});
  return()=>controller.abort();
 },[attempt]);
 if(!ready)return <main className="lead-record-header">
  <h1 className="lead-record-heading">Carteira principal</h1>
  <p role={error?'alert':'status'}>{error||'Carregando leads e projetos…'}</p>
  {error&&<button type="button" className="lead-glass-action" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button>}
 </main>;
 return <App {...props} initialWorkspace={initialWorkspace}/>;
}

function App({logout,sessionError,accountEmail,initialWorkspace}){
 const [assistantConversation,setAssistantConversation]=useState(()=>({draft:'',files:[],messages:[],analysisContext:null,analyzedFiles:[]}));
 const {analyticsModel,leadFunnel,saveMember,saveArea,removeArea,setAreaLeadOwnership,saveIcp,organizationAtoms,state,storageError,message,saveLead,importLeads,saveProposal,moveLeadStage,saveProjectScope,changeStatus,filterProjects}=useCentralController(initialWorkspace);
 const [route,setRoute]=useState(currentRoute);
 const [search,setSearch]=useState('');
 const [theme,setTheme]=useState(()=>{
  try { return localStorage.getItem('easylead-theme')==='light' ? 'light' : 'dark'; }
  catch { return 'dark'; }
 });
 useEffect(()=>{
  try { localStorage.setItem('easylead-theme',theme); } catch {}
 },[theme]);
 const [selectedSectors,setSelectedSectors]=useState([]);
 useEffect(()=>{
  function syncRoute() {
   const next=currentRoute();
   if(location.hash.slice(1)!==next) history.replaceState(history.state,'','#'+next);
   if(route.split('?')[0]!==next.split('?')[0]) setSearch('');
   setRoute(next);
  }
  syncRoute();
  addEventListener('hashchange',syncRoute);
  addEventListener('popstate',syncRoute);
  return()=>{removeEventListener('hashchange',syncRoute);removeEventListener('popstate',syncRoute)};
 },[route]);
 const [path,query='']=route.split('?');
 const isEasyLeadPage = path === '/easylead';
 const compactLeadHeader = path === '/leads' || path === prospectPath || path === '/leads/novo';
 const isProjectDashboard = path === '/projetos';
 const isMainDashboard = path === '/leads' || isProjectDashboard;
 const isDirectory = path === prospectPath || path === '/projetos/todos';

 const isProjectList = path === '/projetos/todos';
 const params=new URLSearchParams(query);const parts=path.split('/');
 const isOrganization = parts[1]==='organizacao';
 const routeLead=parts[1]==='leads' && !compactLeadHeader && state.leads.find(lead=>lead.id===parts[2]);
 const isLeadRecord=Boolean(routeLead && parts.length===3);
 const currentProject=parts[1]==='projetos' && !isProjectList && state.projects.find(project=>project.id===parts[2]);
 const proposal=routeLead?.proposal;
 const wonLead=isLeadRecord && routeLead.stage==='Ganho';
 const showsProposal=isLeadRecord && (routeLead.stage==='Proposta' || wonLead);
 const linkedProject=wonLead ? leadProject(state,routeLead) : null;
 const proposedAmount=proposal?.price;
 const headerAmount=wonLead ? closedContractAmount(linkedProject) : proposedAmount;
 const isProposalEditor=Boolean(routeLead && path.endsWith('/proposta/editar') && parts.length===5);
 const isProjectScopeEditor=Boolean(routeLead && parts.length===4 && parts[3]==='escopo');
 const isRecordPage=Boolean(isLeadRecord || currentProject || isProposalEditor || isProjectScopeEditor);
 const isQualificationDetails=path==='/leads/qualificacao/setor'||path==='/leads/qualificacao/subarea';
 const isCleanDashboard=isMainDashboard || isDirectory || isRecordPage || isOrganization || isQualificationDetails;
 useLayoutEffect(()=>{document.querySelector('h1')?.focus()},[path]);
 const area=id=>state.areas.find(a=>a.id===id)?.name;
 const member=id=>state.members.find(m=>m.id===id)?.name;
 const projectList=items=><ProjectList items={items} state={state}/>;
 const filters={segment:params.get('segmento') || '',phase:params.get('fase') || '',area:params.get('area') || '',status:params.get('status') || ''};
 const setFilter=(key,value)=>{const currentParams=new URLSearchParams(location.hash.split('?')[1] || '');if(value)currentParams.set(key,value);else currentParams.delete(key);go(path+'?'+currentParams)};
 const scopeParams = new URLSearchParams([...params].filter(([key]) => ['area','fase','segmento','status'].includes(key)));
 const projectScope = {...filters, projectSearch: search};
 const leadScope = {...filters, stage: params.get('estagio') || ''};
 const analyticsPanel = (mode, scope = filters) => <AnalyticsBento model={analyticsModel(scope)} state={state}
  mode={mode} filters={scopeParams} grouping={params.get('distribuicao')} onGroup={value => setFilter('distribuicao', value)}/>;
 const projectStatus = <label>Status<select value={filters.status} onChange={e => setFilter('status', e.target.value)}>
  <option value="">Todos</option>{statuses.map(status => <option key={status}>{status}</option>)}
 </select></label>;
 const cleanParams=new URLSearchParams(query);cleanParams.delete('item');cleanParams.delete('qualificacao');
 const selectionQuery=cleanParams.toString();
 let content;let title=nav.find(([p])=>p===('/'+parts[1]))?.[1]||'Página não encontrada';
 if(isEasyLeadPage)content=<EasyLeadAssistant state={state} theme={theme} importLeads={importLeads} conversation={assistantConversation} setConversation={setAssistantConversation}/>;
 else if(path==='/configuracoes'){
  title='Configurações';
  content=<DashboardModule className="easylead-settings" title="Conta">
   <dl><dt>E-mail da sessão</dt><dd>{accountEmail}</dd></dl>
   <button className="quiet-button" type="button" onClick={()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='easylead-carteira.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }}>Exportar carteira</button>
   <button className="quiet-button" type="button" onClick={logout}>Sair da conta</button>
  </DashboardModule>;
 }
 else if(parts[1]==='leads'){
 const lead=routeLead;
 const prospectOrigin = params.get('origem') === 'prospectos';
 const leadBack = prospectOrigin ? prospectHref(params) : '#/leads';
 const leadReturnQuery = prospectOrigin ? query : '';
 if(path===prospectPath) {
  title='Todos os leads';
  content=<ProspectWorkspace state={state} leadFunnel={leadFunnel} filters={filters} params={params} setFilter={setFilter} onMove={moveLeadStage} saveIcp={saveIcp}/>;
 }
 else if(path==='/leads/qualificacao/setor' || path==='/leads/qualificacao/subarea') {
  const detailParams = new URLSearchParams(params);
  const name = detailParams.get('detalhe');
  detailParams.delete('detalhe');
  title=parts[3]==='setor' ? 'Detalhes do setor' : 'Detalhes da subárea';
  content=<LeadQualificationDetails model={leadQualification(state, {segment: filters.segment})}
   areas={state.areas} kind={parts[3]} name={name} query={detailParams.toString()}/>;
 }
 else if(parts[2]==='novo') {title='Novo lead';content=<LeadForm key="new" areas={state.areas} icpBudget={state.icpBudget} saveLead={saveLead} backHref={leadBack} returnQuery={leadReturnQuery}/>;}
 else if(isProposalEditor) {
  title='Editar proposta';
  const recordHref='#/leads/' + encodeURIComponent(lead.id) + (query ? '?' + query : '');
  content=['Proposta','Ganho'].includes(lead.stage)
    ? <LeadProposalEditor key={lead.id} lead={lead} saveProposal={saveProposal} recordHref={recordHref}/>
    : <p>A edição está disponível para leads em Proposta ou Ganho. <a href={recordHref}>Voltar aos detalhes do lead</a></p>;
 }
 else if(isProjectScopeEditor) {
  title='Definir valor e escopo';
  const recordHref='#/leads/' + encodeURIComponent(lead.id) + (query ? '?' + query : '');
  content=lead.stage==='Ganho'
    ? <ProjectScopeEditor key={lead.id} lead={lead} project={leadProject(state,lead)} areas={state.areas}
       saveProjectScope={saveProjectScope} recordHref={recordHref}/>
    : <p>O escopo pode ser definido para leads em Ganho. <a href={recordHref}>Voltar aos detalhes do lead</a></p>;
 }
 else if(isLeadRecord) {
  title=lead.company || lead.name;
  const editHref='#' + path + '/proposta/editar' + (query ? '?' + query : '');
  const scopeHref='#' + path + '/escopo' + (query ? '?' + query : '');
  const facts=<DashboardModule title="Detalhes do lead"><LeadFacts lead={lead} state={state}/></DashboardModule>;
  const form=<LeadForm key={lead.id} lead={lead} areas={state.areas} icpBudget={state.icpBudget} embedded={showsProposal} saveLead={saveLead} backHref={leadBack} returnQuery={leadReturnQuery}
    leadOwners={leadOwnerMembers(state).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))}/>;
  content=<div className="lead-record-grid">
    {showsProposal && <LeadProposal key={lead.id} lead={lead} editHref={editHref}/>}
    {wonLead && <LeadProject project={linkedProject} state={state} scopeHref={scopeHref}/>}
    <div className="lead-record-support">
     {facts}
     {form}
    </div>
  </div>;
 }
 else if(parts[2])content=<p>Lead não encontrado. <a href="#/leads">Voltar</a></p>;
 else {
 const qualification = leadQualification(state, {segment: filters.segment});
 const funnel = leadFunnel(leadScope);
 content=<>
  <div className="lead-priority-metrics">
   <LeadConversionSummary model={qualification}/>
   <LeadWeeklyMetrics weekly={qualification.weekly}/>
  </div>
  <div className="lead-analysis-grid">
   <LeadFunnel model={funnel} query={selectionQuery}/>
   <LeadQualification model={qualification} query={selectionQuery} selected={selectedSectors} onSelect={setSelectedSectors}/>
  </div>
  <LeadSeasonality model={qualification}/>
  <LeadSeasonalityRanking model={qualification}/>
 </>;
 }
 }
 else if(parts[1]==='projetos'){
 if(currentProject) {
  const project=currentProject;
  const origin=state.leads.find(lead=>lead.id===project.leadId || lead.projectId===project.id);
  title=project.name;
  content=<DashboardModule title="Dados do projeto" className="project-record-panel">
    <label>Status do projeto<select value={project.status} onChange={event=>changeStatus(project.id,event.target.value)}>
     {statuses.map(status=><option key={status}>{status}</option>)}
    </select></label>
    <dl>
     <dt>Área responsável</dt><dd>{project.areaId ? <a href={'#/organizacao/'+project.areaId}>{area(project.areaId)} →</a> : 'Sem área atribuída'}</dd>
     <dt>Fase</dt><dd>{project.phase}</dd>
     <dt>Valor contratado</dt><dd className="project-value">{formatMoney(closedContractAmount(project))}</dd>
     <dt>Lead de origem</dt><dd>{origin ? <a href={'#/leads/'+encodeURIComponent(origin.id)}>{origin.name} →</a> : 'Sem lead vinculado'}</dd>
    </dl>
  </DashboardModule>;
 }
 else if(isProjectList) {
  title='Todos os projetos';
  const projects = filterProjects(projectScope);
  const tableView = params.get('modo') !== 'cartoes';
  content=<>
   <header className="prospect-header">
    <nav className="prospect-breadcrumb" aria-label="Caminho da página">
     <a href="#/projetos">Projetos</a><span aria-hidden="true">→</span><span aria-current="page">Todos os projetos</span>
    </nav>
    <div className="prospect-toggle lead-glass-switch prospect-view-toggle" role="group" aria-label="Visualização dos projetos"
     data-side={tableView ? 'end' : 'start'}>
     <button type="button" aria-pressed={!tableView} onClick={()=>setFilter('modo','cartoes')}>Cartões</button>
     <button type="button" aria-pressed={tableView} onClick={()=>setFilter('modo','tabela')}>Lista</button>
    </div>
   </header>
   <div className="project-filter-panel">
    <ProjectFilters state={state} filters={filters} setFilter={setFilter} areaLabel="Área">
     <div className="project-search">
      <LeadSearch minimal aria-label="Buscar projetos" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nome ou organização…"/>
     </div>
     {projectStatus}
    </ProjectFilters>
   </div>
   <DashboardModule hideTitle title="Carteira de projetos" className="project-portfolio">
    {tableView ? <ProjectTable key={query+search} items={projects} state={state} resetKey={query+search}/> : <ProjectList key={query+search} items={projects} state={state} paginate resetKey={query+search}/>}
   </DashboardModule>
  </>;
 }
 else if(isProjectDashboard)content=analyticsPanel('projetos',filters);
 else content=<p>Projeto não encontrado.</p>;
 }
 else if(parts[1]==='squads') {const squad=state.squads?.find(s=>s.id===parts[2]);content=squad?<section className="detail fr-module"><span className="eyebrow">EQUIPE ALOCADA</span><h2>{squad.name}</h2><p>{squad.specialty}</p>{squad.areaId ? <a href={'#/organizacao/'+squad.areaId}>Subárea: {area(squad.areaId)} →</a> : <p>Sem área atribuída</p>}<h3>Responsável</h3><p>{member(squad.ownerId)}</p><h3>Integrantes</h3>{squad.memberIds.map(id=><p key={id}>{member(id)}</p>)}<h3>Projetos vinculados</h3>{projectList(state.projects.filter(p=>p.squadId===squad.id))}</section>:<p>Squad não encontrado.</p>;title='Squad';}
 else if(isOrganization)content=<Organization state={state} areas={organizationAtoms} selectedId={parts[2]} saveArea={saveArea} removeArea={removeArea} saveMember={saveMember} setAreaLeadOwnership={setAreaLeadOwnership} projectList={projectList}/>;
 else content=<p>Página não encontrada. <a href="#/leads">Ir para Leads</a></p>;
 return <div className="layout studio-layout" data-theme={theme} data-clean-dashboard={isCleanDashboard} data-clean-page={isCleanDashboard || isOrganization || isEasyLeadPage} data-record-page={isRecordPage} onPointerMove={updateModuleGlow}><a className="skip" href="#conteudo" onClick={e=>{e.preventDefault();document.querySelector('h1').focus()}}>Pular para conteúdo</a><TopNavigation items={nav} path={path} logout={logout} theme={theme} onToggleTheme={()=>setTheme(current=>current==='light'?'dark':'light')}/><main id="conteudo">{!compactLeadHeader&&!isProjectDashboard&&!isProjectList&&!currentProject&&!isEasyLeadPage&&!isLeadRecord&&!isProposalEditor&&!isProjectScopeEditor&&!isOrganization&&!isQualificationDetails&&<p className="eyebrow breadcrumb">EasyLead / {title}</p>}{isLeadRecord || currentProject ? <header className="lead-record-header">
   <nav className="prospect-breadcrumb lead-record-breadcrumb" aria-label="Caminho da página">
    {currentProject ? <a href="#/projetos">Projetos</a> : <>
     <a href="#/leads">Leads</a><span aria-hidden="true">→</span>
     <a href={prospectHref(params)}>Todos os leads</a>
    </>}
    <span aria-hidden="true">→</span>
    <span aria-current="page">{title}</span>
   </nav>
   <div className="lead-record-title-row">
    <h1 className="lead-route-heading" tabIndex="-1">{title}</h1>
    {showsProposal && <div className="lead-proposal-value">
     <span>{wonLead ? 'Valor contratado' : 'Valor proposto'}</span>
     <strong>{headerAmount == null ? 'A definir' : formatMoney(headerAmount)}</strong>
     {wonLead && <span className="lead-proposal-reference">Valor proposto <b>{proposedAmount == null ? 'A definir' : formatMoney(proposedAmount)}</b></span>}
    </div>}
   </div>
  </header> : !isEasyLeadPage && !isOrganization && !isMainDashboard && <h1 className="lead-route-heading" tabIndex="-1">{title}</h1>}{sessionError&&<p role="alert" className="error">{sessionError}</p>}{storageError&&<p role="alert" className="error">{storageError}</p>}<p role="status" className="feedback">{message}</p><div className={`route-content dashboard-route route-${parts[1] || "leads"}${(path === "/leads" || isProjectDashboard || isOrganization) ? " dashboard-blur-entrance" : ""}${(path === "/leads" || path === prospectPath || isLeadRecord || parts[1] === "projetos") ? " lead-dashboard-glow" : ""}`} key={parts[1]==='organizacao'?'organizacao':path}>{isMainDashboard && <header className="dashboard-page-header">
    <h1 className="lead-route-heading" tabIndex="-1">{title}</h1>
    {isProjectDashboard ? <a className="lead-glass-action" href={'#/projetos/todos'+(scopeParams.size?'?'+scopeParams:'')}>Todos os projetos →</a> : <div className="lead-opening-actions" role="group" aria-label="Ações de leads">
     <a className="lead-glass-action" href={prospectHref()}>Todos os leads →</a>
     <a className="lead-glass-action lead-glass-action-primary" href="#/leads/novo">Novo lead →</a>
    </div>}
  </header>}{content}</div><hr className="page-end" aria-hidden="true"/>{(isMainDashboard || isDirectory || isRecordPage || isOrganization || isQualificationDetails) && <footer className="dashboard-footer"><span>EasyLead</span></footer>}</main></div>
}
createRoot(document.getElementById('root')).render(<><WaveMesh/><AuthGate>{props=><Workspace {...props}/>}</AuthGate></>);



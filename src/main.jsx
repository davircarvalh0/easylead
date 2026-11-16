import {AnalyticsBento,LeadComparison} from './views/AnalyticsBento.jsx';
import {LeadFunnel} from './views/LeadFunnel.jsx';
import React,{useState,useEffect,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {stages,statuses,metrics,actionableLeads} from './domain.js';
import {useCentralController} from './controllers/useCentralController.js';
import {LeadForm} from './views/LeadForm.jsx';
import {Conversion} from './views/Conversion.jsx';
import './style.css';
import './views/dashboard-modules.css';
import {DashboardModule} from './views/DashboardModule.jsx';
import {OrganizationAtoms, MemberForm} from './views/OrganizationAtoms.jsx';
import {ValueBlocks} from './views/ValueBlocks.jsx';
import {WaveMesh} from './views/WaveMesh.jsx';
import {AuthGate} from './views/AuthGate.jsx';
import {OverviewBento} from './views/OverviewBento.jsx';
import {TopNavigation} from './views/TopNavigation.jsx';
import {Magnetic} from './Magnetic';
import {ValuePanel,ProjectFilters,ProjectList,ProjectContext,SceneEntry} from './views/Pipeline.jsx';
import logo from '../proposta-visual/assets/logo-citi-simbolo.png';
const nav=[['/metas','Metas'],['/contratos','Contratos'],['/leads','Leads'],['/projetos','Projetos'],['/','Visão geral'],['/organizacao','Organização'],['/integrantes','Integrantes']];
const go=path=>{location.hash=path};

function App({logout,sessionError}){
 const {analyticsModel,saveGoal,leadFunnel,saveMember,organizationAtoms,state,storageError,message,saveTick,saveLead,convert,changeStatus,changePhase,addDemo,addValueDemo,valueBlocks,filterProjects,averageMetrics}=useCentralController();
 const [route,setRoute]=useState(location.hash.slice(1)||'/');
 const [search,setSearch]=useState('');
 useEffect(()=>{const fn=()=>{setRoute(previous=>{const next=location.hash.slice(1)||'/';if(previous.split('?')[0]!==next.split('?')[0])setSearch('');return next})};addEventListener('hashchange',fn);addEventListener('popstate',fn);return()=>{removeEventListener('hashchange',fn);removeEventListener('popstate',fn)}},[]);
 const [path,query='']=route.split('?');const params=new URLSearchParams(query);const parts=path.split('/');
 useLayoutEffect(()=>{document.querySelector('h1')?.focus()},[path]);
 const area=id=>state.areas.find(a=>a.id===id)?.name;
 const member=id=>state.members.find(m=>m.id===id)?.name;
 const count=metrics(state);
 const matches=text=>text.toLocaleLowerCase().includes(search.toLocaleLowerCase());
 const projectList=items=><ProjectList items={items} state={state}/>;
 const filters={segment:params.get('segmento') || '',phase:params.get('fase') || '',area:params.get('area') || '',status:params.get('status') || ''};
 const setFilter=(key,value)=>{const currentParams=new URLSearchParams(location.hash.split('?')[1] || '');currentParams.set(key,value);go(path+'?'+currentParams)};
 const cleanParams=new URLSearchParams(query);cleanParams.delete('item');
 const selectionQuery=cleanParams.toString();
 const blocks=kind=><ValueBlocks model={valueBlocks(kind,{...filters,search,stage:params.get('estagio')||''},params.get('blocos')||'direct')} state={state} kind={kind} grouping={params.get('blocos')||'direct'} onGroup={v=>setFilter('blocos',v)} selected={params.get('item')} onSelect={id=>setFilter('item',id)} query={selectionQuery}/>;
 const comparison=<button className="quiet-button" onClick={addValueDemo}>Adicionar comparação Aurora e Horizonte</button>;
 const values=<ValuePanel state={state} filters={filters} params={params} setFilter={setFilter} averageMetrics={averageMetrics} clear={()=>go(path)}/>;
 let content;let title=nav.find(([p])=>p===('/'+parts[1]))?.[1]||'Visão geral';
 if(path==='/')content=<><AnalyticsBento model={analyticsModel(filters)} state={state}/><OverviewBento state={state} count={count} filters={filters} setFilter={setFilter} values={values} projects={filterProjects(filters)} addDemo={addDemo}/></>;
 else if(parts[1]==='metas'||parts[1]==='contratos')content=<AnalyticsBento model={analyticsModel(filters)} state={state} mode={parts[1]} saveGoal={saveGoal}/>;
 else if(parts[1]==='leads'){
 const lead=state.leads.find(l=>l.id===parts[2]);
 if(parts[2]==='novo')content=<LeadForm key="new" saveLead={saveLead}/>;
 else if(lead)content=<><section className="lead-values"><p>Valor da oportunidade: <strong>{valueBlocks('leads').items.find(r=>r.id===lead.id)?.label} · {valueBlocks('leads').items.find(r=>r.id===lead.id)?.value?.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})||'A definir'}</strong> · Estimado na origem: {lead.estimatedValue?.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})||'A definir'}</p></section><p className="lead-context">Contratante: <strong>{lead.company}</strong> · {lead.clientSegment || 'Não classificado'}{lead.projectId&&<> · Projeto: <strong>{state.projects.find(p=>p.id===lead.projectId)?.name}</strong></>}</p><div className="split-panel"><LeadForm key={lead.id} lead={lead} saveLead={saveLead}/>{lead.projectId?<Magnetic href={'#/projetos/'+lead.projectId+(selectionQuery?'?'+selectionQuery:'')}>Abrir projeto vinculado →</Magnetic>:lead.stage==='Ganho'?<Conversion key={'convert'+lead.id} lead={lead} state={state} convert={convert}/>:<p>Marque o lead como Ganho para converter em projeto.</p>}</div></>;
 else if(parts[2])content=<p>Lead não encontrado. <a href="#/leads">Voltar</a></p>;
 else {const filter=params.get('estagio')||'';content=<><div className="toolbar leads-command"><label>Buscar leads<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, organização ou contato"/></label><label>Estágio<select value={filter} onChange={e=>setFilter('estagio',e.target.value)}><option value="">Todos</option><option value="abertos">Abertos</option>{stages.map(s=><option key={s}>{s}</option>)}</select></label><Magnetic href="#/leads/novo">Novo lead +</Magnetic></div>{comparison}<ProjectFilters state={state} filters={filters} setFilter={setFilter}/><LeadFunnel model={leadFunnel({...filters,search,stage:filter})} selected={filter} onSelect={v=>setFilter('estagio',v)} query={selectionQuery}/><LeadComparison model={analyticsModel(filters)}/><DashboardModule title="Comparar valores dos leads" eyebrow="VALORES NO RECORTE" href="#/projetos" action="Ver projetos convertidos" note="Valores estimados e contratados; selecione um bloco para detalhes.">{blocks('leads')}</DashboardModule></>}

 }
 else if(parts[1]==='projetos'){
 const project=state.projects.find(p=>p.id===parts[2]);
 if(project)content=<article className="detail fr-module"><span className="eyebrow">PROJETO</span><div className="project-heading"><h2>{project.name}</h2><label>Status do projeto<select value={project.status} onChange={e=>changeStatus(project.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div><dl><dt>Área responsável</dt><dd><a href={'#/organizacao/'+project.areaId}>{area(project.areaId)} →</a></dd><dt>Responsável</dt><dd><span className="person"><span className="avatar" aria-hidden="true">{member(project.ownerId)?.split(" ").map(n=>n[0]).join("")}</span>{member(project.ownerId)}</span></dd><dt>Equipe vinculada</dt><dd>{project.memberIds.map(member).join(', ')}</dd><dt>Lead de origem</dt><dd><a href={'#/leads/'+project.leadId}>{state.leads.find(l=>l.id===project.leadId)?.name} →</a></dd></dl><ProjectContext project={project} state={state} changePhase={changePhase}/><a href="#/projetos">Todos os projetos</a></article>;
 else if(parts[2])content=<p>Projeto não encontrado.</p>;
 else content=<><AnalyticsBento model={analyticsModel(filters)} state={state}/><div className="toolbar"><label>Status<select value={params.get('status')||''} onChange={e=>{params.set('status',e.target.value);go('/projetos?'+params)}}><option value="">Todos</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Área<select value={params.get('area')||''} onChange={e=>{params.set('area',e.target.value);go('/projetos?'+params)}}><option value="">Todas</option>{state.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div><ProjectFilters state={state} filters={filters} setFilter={setFilter} hideArea/>{comparison}<label>Buscar projetos<input value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="dashboard-grid"><DashboardModule primary title="Carteira de projetos" eyebrow="ENTREGAS E RESPONSÁVEIS" href="#/leads" action="Consultar leads" note={`${filterProjects(filters).length} projetos no recorte`}>{projectList(filterProjects(filters).filter(p=>matches(p.name+' '+(p.company||''))))}</DashboardModule><DashboardModule title="Contratos ativos" eyebrow="VALOR MÉDIO" note="Somente contratos elegíveis entram na média.">{values}</DashboardModule></div><DashboardModule title="Comparar valores" eyebrow="CARTEIRA" note="Selecione um bloco para consultar vínculos e valores.">{blocks('projects')}</DashboardModule></>;
 }
 else if(parts[1]==='squads') {const squad=state.squads?.find(s=>s.id===parts[2]);content=squad?<section className="detail fr-module"><span className="eyebrow">EQUIPE ALOCADA</span><h2>{squad.name}</h2><p>{squad.specialty}</p><a href={'#/organizacao/'+squad.areaId}>Subárea: {area(squad.areaId)} →</a><h3>Responsável</h3><p>{member(squad.ownerId)}</p><h3>Integrantes</h3>{squad.memberIds.map(id=><p key={id}>{member(id)}</p>)}<h3>Projetos vinculados</h3>{projectList(state.projects.filter(p=>p.squadId===squad.id))}<div className="fr-footer"><a href="#/integrantes">Consultar integrantes →</a></div></section>:<p>Squad não encontrado.</p>;title='Squad';}
 else if(parts[1]==='integrantes')content=<div className="dashboard-grid members-dashboard"><DashboardModule title="Adicionar integrante" eyebrow="EQUIPE" note="Cadastro salvo neste navegador."><MemberForm key={params.get('area')||'all'} areas={state.areas} initialAreaId={params.get('area')||''} saveMember={saveMember}/></DashboardModule><DashboardModule primary title="Diretório de integrantes" eyebrow="PESSOAS POR SUBÁREA" href="#/organizacao" action="Explorar globos" note={`${state.members.length} integrantes cadastrados`}><div className="toolbar"><label>Buscar integrantes<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome ou papel"/></label><label>Área<select value={params.get('area')||''} onChange={e=>go('/integrantes?area='+e.target.value)}><option value="">Todas</option>{state.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div><div className="cards">{state.members.filter(m=>matches(m.name+' '+m.role)&&(!params.get('area')||m.areaId===params.get('area'))).map(m=><article className="card" key={m.id}><div className="avatar">{m.name.split(' ').map(n=>n[0]).join('')}</div><h3>{m.name}</h3><p>{m.role}</p><a href={'#/organizacao/'+m.areaId}>{area(m.areaId)} →</a></article>)}</div>{!state.members.some(m=>matches(m.name+' '+m.role)&&(!params.get('area')||m.areaId===params.get('area')))&&<p className="empty">Nenhum integrante encontrado.</p>}</DashboardModule></div>;
 else if(parts[1]==='organizacao')content=<OrganizationAtoms state={state} atoms={organizationAtoms} selectedId={parts[2]} saveMember={saveMember} projectList={projectList}/>;
 else content=<p>Página não encontrada. <a href="#/">Ir à visão geral</a></p>;
 return <div className="layout"><a className="skip" href="#conteudo" onClick={e=>{e.preventDefault();document.querySelector('h1').focus()}}>Pular para conteúdo</a><header className="topbar"><div className="topbar-inner"><a href="#/" className="brand" aria-label="CITi/all — Visão geral"><img src={logo} alt="CITi"/><span>/all</span></a><TopNavigation items={nav} path={path}/><div className="session-actions"><span className="demo">DEMO LOCAL</span><button className="quiet-button" onClick={logout}>Sair</button></div></div></header><main id="conteudo"><p className="eyebrow breadcrumb">CITi/all / {title}</p><h1 tabIndex="-1">{title}</h1>{sessionError&&<p role="alert" className="error">{sessionError}</p>}{storageError&&<p role="alert" className="error">{storageError}</p>}<p role="status" className="feedback"><span key={saveTick+message}>{message}</span></p><div className={`route-content dashboard-route route-${parts[1] || "overview"}`} key={parts[1]==='organizacao'?'organizacao':path}>{content}</div><footer>CITi/all · Dados fictícios, salvos apenas neste navegador.</footer></main></div>
}
createRoot(document.getElementById('root')).render(<><WaveMesh/><AuthGate>{props=><App {...props}/>}</AuthGate></>);

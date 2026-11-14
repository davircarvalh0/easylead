import React from 'react';
import {actionableLeads,stages} from '../domain.js';
import {Magnetic} from '../Magnetic.jsx';
import {ProjectFilters,ProjectList,SceneEntry} from './Pipeline.jsx';

export function OverviewBento({state,count,filters,setFilter,values,projects,addDemo}) {
 const priorities=actionableLeads(state);
 return <><div className="overview-bento">
 <section className="bento-module module-pipeline" aria-labelledby="pipeline-title">
 <div className="pipeline-opening"><div className="module-header"><div><span className="eyebrow">DO PRIMEIRO CONTATO À ENTREGA</span><h2 id="pipeline-title">O trabalho conectado.<br/>A equipe por perto.</h2></div><Magnetic href="#/leads/novo">Cadastrar oportunidade ↗</Magnetic></div>
 <div className="stats">{[['Leads abertos',count.open,'/leads?estagio=abertos'],['Projetos em andamento',count.active,'/projetos?status=Em andamento'],['Leads ganhos',state.leads.filter(l=>l.stage==='Ganho').length,'/leads?estagio=Ganho'],['Total de projetos',state.projects.length,'/projetos']].map(([label,n,url])=><a key={label} href={'#'+url}><span>{label}</span><strong>{n}</strong><small>Consultar →</small></a>)}</div>
 <div className="funnel">{stages.map(s=><a key={s} href={'#/leads?estagio='+encodeURIComponent(s)}><strong>{state.leads.filter(l=>l.stage===s).length}</strong>{s}</a>)}</div>
 </div><div className="pipeline-priorities"><h3>Leads que precisam de ação</h3><div className="priority-list">{priorities.map(l=><a className="priority-row" key={l.id} href={'#/leads/'+l.id}><span className={'badge '+(l.stage==='Ganho'?'green':'')}>{l.stage}{l.stage==='Ganho'?' · Pronto para converter':''}</span><strong>{l.name}</strong><small>{l.company} · {l.contact}</small><span>{l.stage==='Ganho'?'Converter':'Abrir'} →</span></a>)}</div>{!priorities.length&&<p>Nenhum lead precisa de ação agora.</p>}
 </div></section>
 <section className="bento-module module-average" aria-label="Valores e filtros">{React.cloneElement(values,{inspectGroups:true})}<ProjectFilters state={state} filters={filters} setFilter={setFilter}/></section>
 <section className="bento-module module-projects" aria-labelledby="projects-title"><div className="module-header"><h2 id="projects-title">Projetos em destaque</h2><a href="#/projetos">Todos os projetos →</a></div><ProjectList items={[...projects].sort((a,b)=>Number(b.status==='Em andamento')-Number(a.status==='Em andamento'))} state={state}/></section>
 <section className="bento-module module-owners" aria-labelledby="owners-title"><h2 id="owners-title">Acesso direto aos responsáveis</h2><div>{state.members.map(m=><article className="owner-row" key={m.id}><span className="avatar" aria-hidden="true">{m.name.split(' ').map(n=>n[0]).join('')}</span><div><strong>{m.name}</strong><small>{m.role} · {state.areas.find(a=>a.id===m.areaId)?.name}</small><small>{state.projects.filter(p=>p.ownerId===m.id).length} projeto(s) liderado(s)</small><div className="owner-links"><a href={'#/organizacao/'+m.areaId}>Abrir subárea →</a><a href={'#/integrantes?area='+m.areaId}>Ver integrantes →</a></div></div></article>)}</div><a href="#/organizacao">Explorar Organização Atômica →</a></section>
 <div className="module-scene"><SceneEntry/></div>
 </div><button className="quiet-button" onClick={addDemo}>Adicionar exemplos de filtros e médias</button></>;
}

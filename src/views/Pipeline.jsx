import React, {Component, lazy, Suspense} from 'react';
import {clientSegments} from '../domain.js';

const Scene = lazy(() => import('./EsteiraScene3D.jsx'));
const money = value => value == null ? '—' : value.toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
const staticJourney = <section className="empty"><h2>Lead → Projeto → Squad → Subárea → Integrantes</h2><p>A contratante acompanha o lead. O projeto reúne fase, contrato e equipe.</p><a href="#/leads">Explorar leads →</a></section>;
class SceneBoundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?staticJourney:this.props.children;}
}
export function SceneEntry(){
 return <SceneBoundary><Suspense fallback={staticJourney}><Scene/></Suspense></SceneBoundary>;
}
export function ProjectFilters({state,filters,setFilter,hideArea=false}){
 const segments=[...new Set([...clientSegments,...state.leads.map(l=>l.clientSegment).filter(Boolean),...state.projects.map(p=>p.clientSegment).filter(Boolean)])];
 return <div className="toolbar glass-filters" aria-label="Filtros da esteira">
 <label>Segmento da contratante<select value={filters.segment} onChange={e=>setFilter('segmento',e.target.value)}><option value="">Todos os segmentos</option>{segments.map(s=><option key={s}>{s}</option>)}</select></label>
 <label>Fase / Tipo<select value={filters.phase} onChange={e=>setFilter('fase',e.target.value)}><option value="">Todas as fases</option><option>Discovery</option><option>Delivery</option></select></label>
 {!hideArea&&<label>Subárea CITi<select value={filters.area} onChange={e=>setFilter('area',e.target.value)}><option value="">Todas as subáreas</option>{state.areas.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label>}
 </div>;
}
export function ValuePanel({params,setFilter,averageMetrics,clear,inspectGroups=false}){
 const grouping=params.get('grupo')==='segment'?'segment':'area';
 const filters={segment:params.get('segmento') || '',phase:params.get('fase') || '',area:params.get('area') || '',status:params.get('status') || ''};
 const result=averageMetrics(filters,grouping);
 return <section className="value-panel" aria-labelledby="value-title">
 <div className="value-heading"><div><span className="eyebrow">CONTRATOS ATIVOS · VALORES POSITIVOS</span><h2 id="value-title">Valor médio contratado</h2></div><label>Agrupamento ativo<select value={grouping} onChange={e=>setFilter('grupo',e.target.value)}><option value="area">Subárea CITi</option><option value="segment">Segmento da contratante</option></select></label></div>
 <div aria-live="polite"><strong className="average-value">{money(result.average)}</strong><p>Base: {result.eligibleCount} de {result.total} projetos no recorte</p>
 <p className="section-note">{result.withoutValue} sem valor e {result.withoutContract} sem contrato ignorados no cálculo.</p>
 {result.eligibleCount===0?<p className="empty">Sem projetos elegíveis para média neste recorte.</p>:<div className="average-groups">{result.groups.map(g=><div key={g.key}>{inspectGroups?<button className="quiet-button" onClick={()=>setFilter(grouping==='area'?'area':'segmento',g.key)}>{g.label} →</button>:<span>{g.label}</span>}<strong>{money(g.average)}</strong><small>{g.eligibleCount} de {g.total} projetos{g.average===null?' · Sem elegíveis':''}</small></div>)}</div>}</div>
 <button className="quiet-button" onClick={clear}>Limpar filtros</button>
 </section>;
}
export function ProjectList({items,state}){
 return items.length?<div className="cards project-rows">{items.map(p=><a className="card" key={p.id} href={`#/projetos/${p.id}`}><span className={'badge '+(p.status==='Em andamento'?'green':'')}>{p.status}</span><h3>{p.name}</h3><span className="badge">{p.phase || 'Delivery'}</span><p>{p.company || state.leads.find(l=>l.id===p.leadId)?.company} · {p.clientSegment}</p><p>{state.squads?.find(s=>s.id===p.squadId)?.name || 'Squad do projeto'} · {state.areas.find(a=>a.id===p.areaId)?.name} · {state.members.find(m=>m.id===p.ownerId)?.name} · {p.memberIds.length} integrante(s)</p><p>{p.contractStatus==='Sem contrato'?'Sem contrato (fora da média)':typeof p.contractValue==='number'&&p.contractValue>0?money(p.contractValue):'Sem valor (fora da média)'}</p><span>Ver projeto →</span></a>)}</div>:<p className="empty">Nenhum projeto encontrado.</p>;
}
export function ProjectContext({project:p,state,changePhase}){
 const squad=state.squads?.find(s=>s.id===p.squadId);
 return <section className="squad-context"><span className="badge">{p.phase || 'Delivery'}</span><p>Origem: {p.originPhase || p.phase || 'Delivery'}{p.phase==='Discovery'&&<> · <button className="quiet-button" onClick={()=>changePhase(p.id)}>Avançar para Delivery</button></>}</p><dl><dt>Contratante</dt><dd>{p.company} · {p.clientSegment}</dd><dt>Contrato</dt><dd>{p.contractStatus} · {money(p.contractValue)}{!p.contractValue?' · Sem valor (fora da média)':''}</dd></dl>
 <h2>Squad alocado & pessoas responsáveis</h2>{squad&&<a href={'#/squads/'+squad.id+(location.hash.includes('?')?'?'+location.hash.split('?')[1]:'')}>Explorar squad →</a>}<h3>{squad?.name || 'Squad do projeto'}</h3><p>{squad?.specialty}</p><p>Subárea: {state.areas.find(a=>a.id===p.areaId)?.name}</p>
 <ul>{p.memberIds.map(id=>{const m=state.members.find(m=>m.id===id);return <li key={id}><a href={'#/integrantes?area='+m?.areaId}>{m?.name || 'Integrante indisponível'} · {m?.role} · {state.areas.find(a=>a.id===m?.areaId)?.name}{id===p.ownerId?' · Responsável':''}</a></li>})}</ul><p className="section-note">Squads e papéis são dados fictícios da demonstração.</p></section>;
}

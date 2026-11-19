import React from 'react';
import {DashboardValue, formatDate, formatNumber} from './DashboardValue.jsx';
import {DirectoryPagination,useDirectoryPagination} from './DirectoryPagination.jsx';
import {clientSegments} from '../domain.js';

export function ProjectFilters({state,filters,setFilter,areaLabel="Subárea CITi",children}){
 const segments=[...new Set([...clientSegments,...state.leads.map(l=>l.clientSegment).filter(Boolean),...state.projects.map(p=>p.clientSegment).filter(Boolean)])];
 return <div className="toolbar glass-filters" aria-label="Filtros da esteira">
 {children}
 <label>Segmento da contratante<select value={filters.segment} onChange={e=>setFilter('segmento',e.target.value)}><option value="">Todos</option>{segments.map(s=><option key={s}>{s}</option>)}</select></label>
 <label>Fase / Tipo<select value={filters.phase} onChange={e=>setFilter('fase',e.target.value)}><option value="">Todas</option><option>Discovery</option><option>Delivery</option></select></label>
 {areaLabel && <label>{areaLabel}<select value={filters.area} onChange={e=>setFilter('area',e.target.value)}><option value="">Todas</option>{state.areas.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label>}
 </div>;
}
export function ValuePanel({filters,params,setFilter,averageMetrics,clear,inspectGroups=false}){
 const grouping=params.get('grupo')==='segment'?'segment':'area';
 const result=averageMetrics(filters,grouping);
 const maxAverage=result.groups.reduce((max,group)=>Math.max(max,group.average||0),1);
 return <section className="value-panel" aria-labelledby="value-title">
 <div className="value-heading"><div><h2 id="value-title">Valor médio contratado</h2></div><label>Agrupamento ativo<select value={grouping} onChange={e=>setFilter('grupo',e.target.value)}><option value="area">Subárea CITi</option><option value="segment">Segmento da contratante</option></select></label></div>
 <div aria-live="polite"><DashboardValue className="average-value" value={result.average} money/><p>Base: {formatNumber(result.eligibleCount)} de {formatNumber(result.total)} projetos no recorte</p>
 {inspectGroups?<details className="average-method"><summary>Como é calculado</summary>
  <p className="section-note">{formatNumber(result.withoutValue)} sem valor e {formatNumber(result.withoutContract)} sem contrato ignorados no cálculo.</p>
 </details>:<p className="section-note">{formatNumber(result.withoutValue)} sem valor e {formatNumber(result.withoutContract)} sem contrato ignorados no cálculo.</p>}
 {result.eligibleCount===0?<p className="empty">Sem projetos elegíveis para média neste recorte.</p>:<div className="average-groups">{result.groups.map(g=><div key={g.key}>{inspectGroups?<button className="quiet-button" onClick={()=>setFilter(grouping==='area'?'area':'segmento',g.key)}>{g.label} →</button>:<span>{g.label}</span>}<DashboardValue value={g.average} money/>{inspectGroups&&<span className="average-scale" aria-hidden="true"><i style={{width:(g.average||0)/maxAverage*100+'%'}}/></span>}<small>{formatNumber(g.eligibleCount)} de {formatNumber(g.total)} projetos{g.average===null?' · Sem elegíveis':''}</small></div>)}</div>}</div>
 <button className="quiet-button" onClick={clear}>Limpar filtros</button>
 </section>;
}
export function ProjectList({items,state,paginate=false,resetKey=''}) {
 const pagination=useDirectoryPagination(items,resetKey);
 const visible=paginate?pagination.visible:items;
 const areas=new Map(state.areas.map(area=>[area.id,area.name]));
 const leads=new Map(state.leads.map(lead=>[lead.id,lead]));
 if(!items.length)return <p className="empty">Nenhum projeto encontrado.</p>;
 return <><div className="cards project-rows">{visible.map(project=><a className="card" key={project.id} href={'#/projetos/'+encodeURIComponent(project.id)}>
  <span className="badge">{project.status}</span><h3>{project.name}</h3><span className="badge">{project.phase || 'Delivery'}</span>
  <p>{project.company || leads.get(project.leadId)?.company} · {project.clientSegment}</p><p>{areas.get(project.areaId) || 'Sem área atribuída'}</p>
  <DashboardValue className="project-value" value={project.contractStatus!=='Sem contrato'&&project.contractValue>0?project.contractValue:null} money fallback={project.contractStatus==='Sem contrato'?'Sem contrato':'Sem valor registrado'}/>
  <span>Ver projeto →</span>
 </a>)}</div>{paginate && <DirectoryPagination {...pagination} label="Paginação dos projetos"/>}</>;
}

export function ProjectTable({items,state,resetKey=''}) {
 const pagination=useDirectoryPagination(items,resetKey);
 const areas=new Map(state?.areas.map(area=>[area.id,area.name]) ?? []);
 const leads=new Map(state?.leads.map(lead=>[lead.id,lead]) ?? []);
 if(!items.length)return <p className="empty">Nenhum projeto encontrado.</p>;
 return <><div className="contract-table directory-table-scroll" role="region" aria-label="Dados dos contratos" tabIndex={0}>
  <table className="directory-table project-directory-table" aria-label="Projetos e contratos">
   <thead><tr><th scope="col">Status</th><th scope="col">Projeto</th><th scope="col">Setor</th><th scope="col">Valor contratado</th><th scope="col">Área</th></tr></thead>
   <tbody>{pagination.visible.map(project=><tr key={project.id}>
    <td><span className="directory-status">{project.status || 'Sem status'}</span><small className="directory-secondary">{project.contractStatus}</small></td>
    <th scope="row"><a className="directory-record" href={'#/projetos/'+encodeURIComponent(project.id)}>
      <strong>{project.name}</strong><span>{project.company || leads.get(project.leadId)?.company || 'Empresa não informada'}</span>
      <small>{project.contractStart || project.contractEnd?formatDate(project.contractStart)+' a '+formatDate(project.contractEnd):project.phase || 'Delivery'}</small>
    </a></th>
    <td>{project.clientSegment || leads.get(project.leadId)?.clientSegment || 'Não classificado'}</td>
    <td className="table-value"><DashboardValue money value={project.contractValue>0&&project.contractStatus!=='Sem contrato'?project.contractValue:null}/></td>
    <td>{areas.get(project.areaId) || 'Sem área atribuída'}</td>
   </tr>)}</tbody>
  </table>
 </div><DirectoryPagination {...pagination} label="Paginação dos contratos"/></>;
}

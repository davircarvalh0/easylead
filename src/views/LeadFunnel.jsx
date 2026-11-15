import React from 'react';
import './lead-funnel.css';
import {FunnelChart} from '../../components/ui/FunnelChart.jsx';
export function LeadFunnel({model, selected, onSelect, query}) {
 return <section className="lead-funnel" aria-label="Funil de leads">
 <header><span className="eyebrow">DISTRIBUIÇÃO ATUAL</span><h2>Do contato à conquista</h2><p>Participação em {model.total} leads no total filtrado, incluindo Perdido. Sem histórico para calcular conversão entre etapas.</p></header>
 <p className="funnel-scale-note">Largura relativa à maior contagem do recorte. Percentual de participação no total filtrado.</p>
 <div className="funnel-layout"><FunnelChart data={model.rows.map(row=>({label:row.stage,value:row.count}))} selected={selected} onSelect={onSelect}/></div>
 <div className="funnel-result-heading"><h3 id="funnel-results" tabIndex="-1">{selected || 'Todos os estágios'}</h3>{selected && <button className="quiet-button" onClick={()=>onSelect('')}>Mostrar todos os estágios</button>}</div>
 <p role="status">{model.items.length} leads na seleção · Base de participação: {model.total}</p>
 {model.items.length ? <div className="cards">{model.items.map(l=><a className="card" key={l.id} href={`#/leads/${l.id}${query?'?'+query:''}`}><span className="badge">{l.stage}</span><h3>{l.name}</h3><p>{l.company} · {l.clientSegment}</p><span>Abrir lead →</span></a>)}</div> : <p className="empty">Nenhum lead neste recorte. Ajuste os filtros ou selecione outra etapa.</p>}
 </section>;
}

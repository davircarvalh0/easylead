import React from 'react';
import './lead-funnel.css';
const halfWidth = row => row.count === 0 ? 7 : Math.min(48, 12 + row.participation * .72);
const percent = n => n.toLocaleString('pt-BR', {maximumFractionDigits:1}) + '%';
export function LeadFunnel({model, selected, onSelect, query}) {
 const rows = model.rows.filter(r => r.stage !== 'Perdido');
 const lost = model.rows.find(r => r.stage === 'Perdido');
 const choose = stage => onSelect(selected === stage ? '' : stage);
 return <section className="lead-funnel" aria-label="Funil de leads">
 <header><span className="eyebrow">DISTRIBUIÇÃO ATUAL</span><h2>Do contato à conquista</h2><p>Participação em {model.total} leads no total filtrado, incluindo Perdido. Sem histórico para calcular conversão entre etapas.</p></header>
 <p className="funnel-scale-note">Largura por participação, com escala visual ampliada e filete mínimo nas etapas zeradas.</p>
 <div className="funnel-layout"><div className="funnel-stages">{rows.map((row,i) => {
 const cur = halfWidth(row);
 const top = i === 0 ? cur : halfWidth(rows[i-1]) * .32 + cur * .68;
 const bottom = i === rows.length-1 ? cur : cur * .68 + halfWidth(rows[i+1]) * .32;
 const d = `M ${50-top} 0 H ${50+top} C ${50+top} 18 ${50+cur} 24 ${50+cur} 50 C ${50+cur} 76 ${50+bottom} 82 ${50+bottom} 100 H ${50-bottom} C ${50-bottom} 82 ${50-cur} 76 ${50-cur} 50 C ${50-cur} 24 ${50-top} 18 ${50-top} 0 Z`;
 return <button key={row.stage} className="funnel-stage" data-width={cur * 2} aria-pressed={selected===row.stage} aria-controls="funnel-results" onClick={()=>choose(row.stage)} aria-label={`${row.stage}: ${row.count} leads, ${percent(row.participation)} de participação`}>
 <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={d}/></svg><strong className="funnel-count">{row.count}<small>leads</small></strong><span className="funnel-percent">{percent(row.participation)}</span><span className="funnel-name">{row.stage}</span></button>;
 })}</div>{lost && <aside className="funnel-exit"><span aria-hidden="true">↗</span><button aria-pressed={selected==='Perdido'} aria-controls="funnel-results" onClick={()=>choose('Perdido')}><span>Perdido</span><strong>{lost.count} leads</strong><span>{percent(lost.participation)} de participação</span></button></aside>}</div>
 <div className="funnel-result-heading"><h3 id="funnel-results" tabIndex="-1">{selected || 'Todos os estágios'}</h3>{selected && <button className="quiet-button" onClick={()=>onSelect('')}>Mostrar todos os estágios</button>}</div>
 <p role="status">{model.items.length} leads na seleção · Base de participação: {model.total}</p>
 {model.items.length ? <div className="cards">{model.items.map(l=><a className="card" key={l.id} href={`#/leads/${l.id}${query?'?'+query:''}`}><span className="badge">{l.stage}</span><h3>{l.name}</h3><p>{l.company} · {l.clientSegment}</p><span>Abrir lead →</span></a>)}</div> : <p className="empty">Nenhum lead neste recorte. Ajuste os filtros ou selecione outra etapa.</p>}
 </section>;
}

import React, {useState} from 'react';
import {formatMoney} from './DashboardValue.jsx';
import {useChartEntrance, updateChartGlow} from './ChartSurface.jsx';
import {contractScale} from '../services/leadWorkspace.js';
import {ContractTreemap} from './ProposalTreemap.jsx';

export function LeadContractChart({leads, amounts, grouping, onGroup, mode, onMode, onInspect}) {
  const surface = useChartEntrance();
  const [reference, setReference] = useState(null);
  const {max, groups} = contractScale(leads, amounts, grouping);
  const blocks = mode === 'blocos';
  const focused = amounts.get(reference);
  const guide = focused && max ? focused / max * 100 : null;
  return <section className="proposal-chart" aria-label="Valores contratados" ref={surface} onPointerLeave={()=>setReference(null)}>
    <div className="proposal-controls">
      <div className="proposal-switch">
        <div className="prospect-toggle" role="group" aria-label="Visualização dos valores">
          <button type="button" aria-pressed={!blocks} onClick={()=>onMode('barras')}>Barras</button>
          <button type="button" aria-pressed={blocks} onClick={()=>onMode('blocos')}>Blocos</button>
        </div>
        <p>{blocks ? 'A área de cada bloco representa o valor contratado.' : 'Todos os contratos usam a mesma escala.'}</p>
      </div>
      <label>Agrupar contratos<select value={grouping} onChange={event=>{setReference(null); onGroup(event.target.value);}}>
        <option value="direct">Comparação direta</option><option value="stage">Etapa do funil</option>
      </select></label>
    </div>
    {blocks ? (max > 0 && <ContractTreemap groups={groups} grouped={grouping === 'stage'} onInspect={onInspect}/>) : <>
    {max > 0 && <div className="proposal-axis" aria-hidden="true"><span>R$ 0</span><span>{formatMoney(max)}</span></div>}
    {[...groups].map(([name, rows]) => <div className="proposal-group" key={name}>
      {grouping === 'stage' && <h3>{name}</h3>}
      {rows.map(({lead, value, ratio}) => <button type="button" key={lead.id} className="proposal-row chart-surface"
        aria-haspopup="dialog" onPointerMove={updateChartGlow} onPointerEnter={()=>setReference(lead.id)}
        onFocus={()=>setReference(lead.id)} onBlur={()=>setReference(null)} onClick={()=>onInspect(lead.id)}>
        <span className="proposal-row-copy"><strong>{lead.name}</strong><small>{lead.stage} · {lead.company}</small></span>
        <span className="proposal-track" aria-hidden="true"><i style={{width: (ratio * 100) + '%'}}/>
          {guide !== null && <b className="proposal-guide" style={{left: guide + '%'}}/>}</span>
        <strong className="proposal-value">{formatMoney(value)}</strong>
      </button>)}
    </div>)}
    </>}
    {leads.length > 0 && !max && <p className="empty">Nenhum valor contratado neste recorte.</p>}
    {!leads.length && <p className="empty">Nenhum item neste recorte. Ajuste os filtros para continuar.</p>}
  </section>;
}

import React from 'react';
import './lead-funnel.css';
import {updateChartGlow, useChartEntrance} from './ChartSurface.jsx';
import {FunnelChart} from '../../components/ui/FunnelChart.jsx';
import {prospectHref} from '../services/leadWorkspace.js';

export function LeadFunnel({model, query}) {
  const chart = useChartEntrance();
  const hrefFor = stage => {
    const params = new URLSearchParams(query);
    params.set('estagio',stage);
    return prospectHref(params);
  };
  return <section className="fr-module lead-funnel" aria-label="Funil de leads">
    <header><h2 className="dashboard-card-heading">Funil de leads</h2></header>
    <div ref={chart} className="funnel-layout chart-surface" onPointerMove={updateChartGlow}>
      <FunnelChart data={model.rows.map(row=>({label:row.stage,value:row.count}))} hrefFor={hrefFor}/>
    </div>
  </section>;
}

import React from 'react';
import {DashboardValue,formatPercent} from './DashboardValue.jsx';

export function DashboardMetrics({entries}) {
  return <dl className="dashboard-priority-metrics" aria-label="Indicadores principais">
    {entries.map(({label,value,money,percent})=><div className="priority-metric" key={label}>
      <dt>{label}</dt><dd>{percent ? <strong className="dashboard-value analytics-number">{Number.isFinite(value)?formatPercent(value):'—'}</strong> : <DashboardValue value={value} money={money} className="analytics-number"/>}</dd>
    </div>)}
  </dl>;
}

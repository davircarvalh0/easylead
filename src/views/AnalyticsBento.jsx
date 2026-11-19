import React from 'react';
import { DashboardValue, formatNumber, formatPercent } from './DashboardValue.jsx';
import { Radar, Treemap, chartColor } from './BentoCharts.jsx';
import { updateChartGlow, useChartEntrance } from './ChartSurface.jsx';
import {leadActivityDay} from '../services/leadActivityService.js';
import { stages } from '../domain.js';
import './analytics-bento.css';
import {ActivityChart as ActivityLines,RevenueChart as Sparkline} from './CartesianCharts.jsx';
import {ContractDistribution} from './ContractDistribution.jsx';
import {DashboardMetrics} from './DashboardMetrics.jsx';
import './chart-motion.css';

function monthly(items, date, value = () => 1) {
  const counts = new Map();
  for (const item of items) {
    const month = item[date]?.slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) continue;
    counts.set(month, (counts.get(month) || 0) + value(item));
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
}

function alignMonths(primary, secondary) {
  const rows = new Map(primary.map(({ label, value }) => [label, { label, first: value, second: 0 }]));
  for (const { label, value } of secondary) rows.set(label, { label, first: rows.get(label)?.first || 0, second: value });
  return [...rows.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function BentoFigure({ label, value, money, detail, children }) {
  return <div className="bento-figure">
    <h2>{label}</h2>
    <DashboardValue className="analytics-number" value={value} money={money}/>
    {detail}
    {children}
  </div>;
}

export function AnalyticsBento({ model, state, mode = 'overview', grouping, onGroup, filters = [] }) {
  const leadsMode = mode === 'leads';
  const projectsMode = mode === 'projetos';
  const leadsCreated = monthly(model.leads, 'createdAt');
  const projectsConverted = monthly(model.projects, 'convertedAt');
  const leadsWon = model.leads.filter(lead => lead.stage === 'Ganho');
  const wonByCreation = monthly(leadsWon, 'createdAt');
  const flow = alignMonths(leadsCreated, leadsMode ? wonByCreation : projectsConverted);
  const primary = leadsMode ? 'Leads por mês de criação' : 'Leads criados';
  const secondary = leadsMode ? 'Ganhos por mês de criação' : 'Projetos convertidos';
  const currentYear = leadActivityDay().slice(0,4);
  const revenue = projectsMode ? model.history.filter(point=>point.label.startsWith(currentYear+'-')) : model.history;
  const revenueTotal = projectsMode ? revenue.reduce((total,point)=>total+point.value,0) : model.values.total;
  const activityValues = leadsMode ? model.leads.length : model.values.projects;
  const lastMonth = revenue.at(-1)?.label;

  return <>
    {projectsMode && <DashboardMetrics entries={[
      {label:'Projetos',value:model.values.projects},
      {label:'Em andamento',value:model.values.active},
      {label:'Valor contratado em '+currentYear,value:revenueTotal,money:true},
      {label:'Média por contrato',value:model.values.average,money:true},
    ]}/>}
    <div className={'analytics-bento studio-bento' + (projectsMode ? ' projects-bento' : '')}>
    <section className="analytics-card metric-card bento-activity bento-top chart-surface" onPointerMove={updateChartGlow}>
      {projectsMode ? <header className="compact-chart-header"><h2>Atividade dos projetos</h2><div className="bento-legend activity-legend"><span><i className="swatch-blue"/>{primary}</span><span><i className="swatch-gold"/>{secondary}</span></div></header> : <BentoFigure label={leadsMode ? 'Leads no recorte' : 'Projetos'} value={activityValues}
        detail={<p>{formatNumber(leadsMode ? model.values.open : model.values.active)} em {leadsMode ? 'aberto' : 'andamento'}</p>}>
        <div className="bento-legend activity-legend">
          <span><i className="swatch-blue"/>{primary}</span><span><i className="swatch-gold"/>{secondary}</span>
        </div>
      </BentoFigure>}
      <ActivityLines series={flow} primary={primary} secondary={secondary}/>
    </section>

    <section className="analytics-card metric-card bento-revenue bento-top chart-surface" onPointerMove={updateChartGlow}>
      {projectsMode ? <header className="compact-chart-header"><h2>Valor contratado em {currentYear}</h2></header> : <BentoFigure label={projectsMode ? 'Valor contratado em '+currentYear : 'Valor contratado'} money value={revenueTotal}
        detail={!projectsMode && <p>Valor médio <DashboardValue value={model.values.average} money/></p>}>
        {!projectsMode && lastMonth && <span className="bento-figure-note">Último mês com registro · {lastMonth}</span>}
      </BentoFigure>}
      <Sparkline series={revenue} label={projectsMode ? 'Valor contratado acumulado em '+currentYear : 'Valor contratado por mês de conversão, acumulado'}
        caption={projectsMode ? 'Acumulado do ano' : undefined}/>
    </section>
    <section className="analytics-card bento-categories chart-surface" onPointerMove={updateChartGlow}>
      {leadsMode
        ? <LeadDistribution model={model}/>
        : <ContractDistribution model={model} state={state} grouping={grouping} onGroup={onGroup} filters={filters}/>}
    </section>
    <section className="analytics-card bento-seasonality chart-surface" onPointerMove={updateChartGlow}>
      <Radar series={leadsMode ? leadsCreated : model.history} money={!leadsMode}
        heading={projectsMode ? 'Comparação por sazonalidade' : undefined} sidePanel={projectsMode}
        label={leadsMode ? 'Leads registrados em cada mês' : 'Valor contratado por mês no ano selecionado'}/>
    </section>
  </div></>;
}

function SummaryStrip({ entries }) {
  return <div className="bento-summary">{entries.map(([label, value, money]) => <div key={label}>
    <span>{label}</span><DashboardValue value={value} money={money}/>
  </div>)}</div>;
}

function CategoryRows({ rows, total, money }) {
  return <ul className="chart-list">
    {rows.map(({ key, name, value, color, href }) => <li key={key}>
      <span className="chart-label"><i aria-hidden="true" style={{ background: chartColor(color) }}/>{href ? <a href={href}>{name}</a> : name}</span>
      <DashboardValue value={value} money={money}/>
      <span className="chart-percent">{total ? formatPercent(value / total) : '—'}</span>
    </li>)}
  </ul>;
}

function LeadDistribution({ model }) {
  const total = model.leads.length;
  const rows = stages.map((stage, color) => ({
    key: stage, name: stage, value: model.leads.filter(lead => lead.stage === stage).length, color,
  }));
  const visible = rows.filter(row => row.value > 0).sort((a, b) => b.value - a.value);
  return <>
    <header className="bento-section-header"><h2>Leads por estágio</h2></header>
    <SummaryStrip entries={[[ 'Abertos', model.values.open ], [ 'Ganhos', model.values.won ], [ 'Total', total ]]}/>
    <Treemap items={visible} total={total} label="Mosaico do número de leads por estágio"/>
    <CategoryRows rows={rows} total={total}/>
  </>;
}

export function LeadComparison({ model }) {
  const frame = useChartEntrance();
  const max = model.comparisons.reduce((largest, row) => Math.max(largest, row.estimated || 0, row.contracted || 0), 1);
  return <section ref={frame} className="analytics-card analytics-comparison chart-surface" onPointerMove={updateChartGlow}>
    <h2>Estimado na origem e contratado</h2>
    <p className="panel-note">As barras usam a mesma escala em todas as oportunidades.</p>
    {model.comparisons.length ? <ul className="comparison-list">{model.comparisons.map(row => <li key={row.id}>
      <a href={'#/leads/' + row.id}>{row.name}</a>
      <div className="comparison-pair">
        {[['Estimado', row.estimated], ['Contratado', row.contracted]].map(([label, value]) => <div key={label}>
          <div className="comparison-label"><span>{label}</span><DashboardValue value={value} money fallback="Sem registro"/></div>
          <div className="chart-track" aria-hidden="true"><span style={{ width: ((value || 0) / max * 100) + '%' }}/></div>
        </div>)}
      </div>
    </li>)}</ul> : <p className="empty">Sem registros para comparar.</p>}
  </section>;
}

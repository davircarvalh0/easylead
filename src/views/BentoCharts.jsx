import React, { useId, useLayoutEffect, useState } from 'react';
import { ChartSurface, updateChartGlow, useChartEntrance } from './ChartSurface.jsx';
import { squarify } from './analyticsLayout.js';
import { DashboardValue, formatMoney, formatNumber, formatPercent } from './DashboardValue.jsx';

const palette = ['#7a819d', '#7ea893', '#b69b6e', '#b78c7d', '#8b9095', '#7e9eaf'];
const lightInk = new Set([0, 4]);
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
const months = Array.from({ length: 12 }, (_, month) => monthFormat.format(new Date(Date.UTC(2024, month, 1))).replace('.', ''));
const moneyOrCount = (value, money) => money ? formatMoney(value) : formatNumber(value);

export function chartColor(index) { return palette[index % palette.length]; }

export function monthIndex(label) {
  return Number(label.slice(0, 4)) * 12 + Number(label.slice(5, 7)) - 1;
}

const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const projectMonthTitle = new Intl.DateTimeFormat('pt-BR',{month:'long',timeZone:'UTC'});
const formatMonth = label => monthTitle.format(new Date(label + '-01T00:00:00Z'));

function Trace({ d, paint, past = false }) {
  return <g className={past ? 'chart-trace chart-trace-past' : 'chart-trace'} aria-hidden="true">
    {!past && <path d={d} stroke={paint} pathLength="1" className="chart-stroke chart-trace-halo"/>}
    <path d={d} stroke={paint} pathLength="1" className="bento-plot chart-stroke"/>
  </g>;
}

export function Treemap({ items, total, money, label }) {
  const reveal = useChartEntrance();
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([{ contentRect: { width, height } }]) => setSize({ width, height }));
    observer.observe(reveal.current);
    return () => observer.disconnect();
  }, [reveal]);
  const largest = items.slice(0, 12);
  const remainder = items.slice(12).reduce((sum, item) => sum + item.value, 0);
  const tiles = remainder ? [...largest, { key: 'rest', name: 'Outros', value: remainder, color: 4 }] : largest;
  const positions = size.width && size.height && total > 0
    ? squarify(tiles.map(item => ({ ...item, v: item.value })), 0, 0, size.width, size.height)
    : [];

  return <div ref={reveal} className="chart-surface bento-treemap" onPointerMove={updateChartGlow} role="group" aria-label={label}>
    {positions.map((tile, index) => {
      const { key, x, y, w, h, name, value, color, href } = tile;
      const visible = w >= 60 && h >= 44;
      const Tag = href && w >= 44 && h >= 44 ? 'a' : 'div';
      return <Tag key={key} href={Tag === 'a' ? href : undefined} className="bento-tile chart-surface" onPointerMove={updateChartGlow}
        aria-label={Tag === 'a' ? `${name}, ${moneyOrCount(value, money)}, ${formatPercent(value / total)}` : undefined}
        title={`${name} · ${moneyOrCount(value, money)} · ${formatPercent(value / total)}`}
        style={{ '--chart-delay': Math.min(index, 8) * 38 + 'ms', left: x + 2, top: y + 2, width: Math.max(0, w - 5), height: Math.max(0, h - 5), '--tile-color': chartColor(color), '--tile-text': lightInk.has(color % palette.length) ? '#fff' : '#141414' }}>
        {visible && <><span className="bento-tile-label">{name}</span>
          {w >= 92 && h >= 75 && <span className="bento-tile-footer">
            <DashboardValue value={value} money={money} className="bento-tile-value"/>
            {w >= 148 && h >= 96 && <small>{formatPercent(value / total)}</small>}
          </span>}
        </>}
      </Tag>;
    })}
    {!total && <p className="bento-chart-empty">Nenhum valor neste recorte.</p>}
  </div>;
}

function radarContour(shape, center) {
  const tangent = ([x,y], direction) => [
    x - (y - center) * direction * .17,
    y + (x - center) * direction * .17,
  ];
  return shape.reduce((line, point, index) => {
    const next = shape[(index + 1) % shape.length];
    return line + ' C' + tangent(point, 1) + ' ' + tangent(next, -1) + ' ' + next;
  }, 'M' + shape[0]) + ' Z';
}

function RadarTrace({path, color, gradientId}) {
  return <>
    <defs><radialGradient id={gradientId}><stop stopColor={color} stopOpacity="0"/>
      <stop offset="1" stopColor={color} stopOpacity=".20"/></radialGradient></defs>
    <path className="radar-shape chart-fill" d={path} style={{fill:'url(#' + gradientId + ')'}}/>
    <Trace d={path} paint={color}/>
  </>;
}

export function Radar({ series, money, label, showSummary = true, heading = 'Sazonalidade', year, showYearPicker = true, showReadoutHeading = false, comparisons, sidePanel = false }) {
  const id = useId();
  const years = [...new Set(series.map(point => point.label.slice(0, 4)))].sort().reverse();
  const [selection, setSelection] = useState('');
  const [showDetails,setShowDetails] = useState(false);
  const selectedYear = year ?? selection;
  const active = comparisons ? year : years.includes(selectedYear) ? selectedYear : years[0];
  const rows = series.filter(point => point.label.startsWith(active + '-'));

  const allMax = series.reduce((max, point) => Math.max(max, point.value), 1);
  const sum = rows.reduce((total, point) => total + point.value, 0);
  const contracts = rows.reduce((total, point) => total + (point.contracts ?? 0), 0);
  const renderRows = (entries, namedMonths = false) => <ul className="history-list">{entries.map(point => <li key={point.label}>
    <time dateTime={point.label}>{namedMonths ? projectMonthTitle.format(new Date(point.label + '-01T00:00:00Z')) : point.label}{money && Number.isFinite(point.contracts) &&
      <small className="radar-contract-count">{formatNumber(point.contracts)} {point.contracts===1 ? 'contrato' : 'contratos'}</small>}</time>
    <DashboardValue value={point.value} money={money}/>
  </li>)}</ul>;
  const monthValues = new Map(rows.map(point => [Number(point.label.slice(5, 7)) - 1, point.value]));
  const center = 200, radius = 161;
  const project = (month, distance) => [
    center + Math.sin(month * Math.PI / 6) * distance,
    center - Math.cos(month * Math.PI / 6) * distance,
  ];
  const shape = months.map((_, month) => project(month, 31 + (monthValues.get(month) || 0) / allMax * (radius - 31)));

  const monthKey = (month, year = active) => year + '-' + String(month + 1).padStart(2, '0');
  const sectorSeries = (comparisons ?? []).map(sector => ({
    ...sector,
    rates:months.map((_, month) => {
      const cohort = sector.months.get(monthKey(month,sector.year));
      return cohort ? cohort.signed / cohort.total : null;
    }),
  }));
  const maxRate = Math.max(0, ...sectorSeries.flatMap(sector => sector.rates.filter(rate => rate !== null)));
  const rateDistance = rate => 31 + (maxRate ? rate / maxRate * (radius - 31) : 0);
  const sectorTicks = maxRate ? [.25,.5,.75,1] : sectorSeries.some(sector => sector.total > 0) ? [1] : [];
  const comparisonPoints = sectorSeries.length ? months.map((_, month) => {
    const id = month;
    const [x, y] = project(month, radius);
    const hasLeads = sectorSeries.some(sector => sector.rates[month] !== null);
    return {id, label:months[month], x, y, month, values:sectorSeries.map(sector => {
      const cohort = sector.months.get(monthKey(month,sector.year));
      const rate = formatPercent(sector.rates[month] ?? 0);
      const value = cohort ? rate+' · '+formatNumber(cohort.signed)+' de '+formatNumber(cohort.total)+(cohort.total===1 ? ' lead' : ' leads')
        : hasLeads ? 'Sem leads cadastrados' : rate;
      return {name:sector.name,color:sector.color,value};
    })};
  }) : [];
  const points = comparisons ? comparisonPoints : rows.length ? months.map((_, month) => {
    const monthId = monthKey(month);
    const value = monthValues.get(month);
    return {
      id: monthId, label: formatMonth(monthId), x: shape[month][0], y: shape[month][1], month,
      values: [{ name: money ? 'Contratado' : 'Leads', value: value == null ? 'Sem registro' : moneyOrCount(value, money), color: '#42dd9e' }],
    };
  }) : [];
  const previous = new Map(series.filter(point => Number(point.label.slice(0, 4)) === Number(active) - 1)
    .map(point => [point.label.slice(5), point.value]));
  const comparable = rows.length > 0 && rows.every(point => previous.has(point.label.slice(5)));
  const previousTotal = comparable ? rows.reduce((total, point) => total + previous.get(point.label.slice(5)), 0) : 0;
  const delta = previousTotal > 0 ? (sum - previousTotal) / previousTotal : null;
  const path = radarContour(shape, center);

  const yearPicker=showYearPicker && years.length > 0 && <div className="analytics-tabs radar-tabs" role="group" aria-label="Ano da sazonalidade">
    {years.length <= 3 ? years.map(year => <button key={year} type="button" aria-pressed={year === active} onClick={() => setSelection(year)}>{year}</button>)
      : <select value={active} aria-label="Ano da sazonalidade" onChange={event => setSelection(event.target.value)}>
        {years.map(year => <option key={year}>{year}</option>)}
      </select>}
  </div>;
  const chart=<ChartSurface key={active} className="radar-frame" label={label} points={points} width={400} height={400} showReadoutHeading={showReadoutHeading}
      pick={(x, y) => points[(Math.round(Math.atan2(x - center, center - y) * 6 / Math.PI) + 12) % 12]}>
      {point => <>
        {(comparisons ? [31,63.5,96,128.5,radius] : [31,54,106,radius]).map(r => <circle key={r} cx={center} cy={center} r={r} className="radar-grid"/>)}
        {months.map((name, month) => {
          const [x1, y1] = project(month, 31);
          const [x2, y2] = project(month, radius);
          const [x, y] = project(month, radius + 19);
          return <g key={name}>
            <line className="radar-grid" x1={x1} y1={y1} x2={x2} y2={y2}/>
            <text x={x} y={y} className="svg-tick" textAnchor="middle" dominantBaseline="central">{name}</text>
          </g>;
        })}
        {sectorTicks.map(fraction => {
          const [x,y] = project(1.5,31 + fraction * (radius - 31));
          return <text key={fraction} x={x + 4} y={y} className="svg-tick radar-percent-tick">{formatPercent(fraction * maxRate)}</text>;
        })}
        {sectorSeries.map((sector,index) => sector.total > 0 && <g key={sector.id} className="radar-sector-series">
          <RadarTrace path={radarContour(sector.rates.map((rate,month) => project(month,rateDistance(rate ?? 0))),center)}
            color={sector.color} gradientId={id + '-sector-' + index}/>
        </g>)}
        {rows.length > 0 && <RadarTrace path={path} color="#42dba2" gradientId={id}/>}
        {point && <g className="chart-crosshair" aria-hidden="true">
          <line x1={center} y1={center} x2={project(point.month, radius)[0]} y2={project(point.month, radius)[1]}/>
          {comparisons ? sectorSeries.map(sector => {
            const rate = sector.rates[point.month];
            if (rate === null) return null;
            const [x,y] = project(point.month,rateDistance(rate));
            return <circle key={sector.id} className="radar-hover-dot" cx={x} cy={y} r="2.5"/>;
          }) : <circle className="radar-hover-dot" cx={point.x} cy={point.y} r="2.5"/>}
        </g>}
        <path className="radar-mark" d="M200 190l8.7 5v10l-8.7 5-8.7-5v-10l8.7-5v20m-8.7-15 17.4 10m-17.4 0 17.4-10"/>
      </>}
    </ChartSurface>;
  const stats = rows.length > 0 && showSummary && <div className="radar-stat">
        <div><span>Média dos meses registrados</span><DashboardValue value={sum / rows.length} money={money}/></div>
        <div><span>Total de {active}</span><DashboardValue value={sum} money={money}/>
          {delta !== null && <span className="radar-delta" title="Variação em relação aos mesmos meses do ano anterior" data-direction={delta < 0 ? 'down' : 'up'}>
            {formatPercent(delta)}
          </span>}
        </div>
        {money && contracts>0 && <>
          <div><span>Contratos com valor</span><DashboardValue value={contracts}/></div>
          <div><span>Valor médio por contrato</span><DashboardValue value={sum/contracts} money/></div>
        </>}
      </div>;
  const history = rows.length > 0 && showSummary && (sidePanel ? <>
        <div className="project-month-list" key={active} role="region" aria-label="Histórico mensal de contratos" tabIndex={0}>
          {renderRows(rows.toReversed(),true)}
        </div>
      </> : <>
        {renderRows(rows.slice(-3))}
        {rows.length > 3 && <details className="data-source"><summary>Ver meses anteriores</summary>{renderRows(rows.slice(0,-3))}</details>}
      </>);

  if (sidePanel) return <>
    <header className="bento-section-header project-radar-header">
      <div className="project-radar-title">{heading && <h2>{heading}</h2>}
        {rows.length>0 && <button type="button" className="radar-view-toggle" aria-controls={id+'-view'} aria-expanded={showDetails}
          onClick={()=>setShowDetails(current=>!current)}>{showDetails ? '← Voltar ao gráfico' : '→ Ver resumo e histórico'}</button>}
      </div>
      {yearPicker}
    </header>
    <div className="project-radar-stage" id={id+'-view'}>
      <div className="project-radar-pane" hidden={showDetails}>{chart}</div>
      <div className="project-radar-pane project-radar-summary" hidden={!showDetails} role="region" aria-label="Resumo e histórico">
        {stats && <section aria-label="Resumo anual de contratos">{stats}</section>}
        {history && <section className="project-radar-history" aria-label="Histórico dos contratos">{history}</section>}
      </div>
    </div>
    {!years.length && <p className="empty">Nenhum ano disponível</p>}
  </>;

  return <>
    {(heading || yearPicker) && <header className="bento-section-header">
      {heading && <h2>{heading}</h2>}
      {yearPicker}
    </header>}
    {chart}
    {stats}
    {history}
    {!rows.length && showSummary && <p className="empty bento-empty">Sem histórico para comparar. Os registros com data aparecem aqui.</p>}
  </>;
}

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Radar } from './BentoCharts.jsx';
import { SectorPositionChart } from './SectorPositionChart.jsx';
import { DashboardModule } from './DashboardModule.jsx';
import {DashboardMetrics} from './DashboardMetrics.jsx';
import {DirectoryPagination,useDirectoryPagination} from './DirectoryPagination.jsx';
import { formatMoney, formatNumber, formatPercent } from './DashboardValue.jsx';
import { useChartEntrance, updateChartGlow } from './ChartSurface.jsx';
import {LeadSearch, LeadSearchButton} from '../../components/ui/LeadSearch.jsx';
import {compareQualificationSectors, monthlySectorRanking, qualificationSectors} from '../services/leadQualificationService.js';
import './lead-qualification.css';

const rateLabel = value => value === null ? '—' : formatPercent(value);
const numeral = value => formatNumber(value);
const leadHref = (lead, query) => `#/leads/${lead.id}${query ? '?' + query : ''}`;
function qualificationDetailsHref(name, query) {
  const params = new URLSearchParams(query);
  params.set('detalhe', name);
  return '#/leads/qualificacao/setor?' + params;
}

const sectorSearchKey = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').trim();

export function LeadWeeklyMetrics({weekly}) {
  return <section className="fr-module lead-weekly" aria-labelledby="lead-weekly-heading">
    <h2 className="lead-route-heading" id="lead-weekly-heading">Últimos 7 dias</h2>
    <dl className="lead-metric-strip">
      <div><dt>Contratos fechados</dt><dd>{numeral(weekly.closed)}</dd></div>
      <div><dt>Entraram em contato</dt><dd>{numeral(weekly.contacted)}</dd></div>
      <div><dt>Leads cadastrados</dt><dd>{numeral(weekly.registered)}</dd></div>
    </dl>
  </section>;
}

export function LeadConversionSummary({model}) {
  return <section className="fr-module lead-conversion" aria-label="Conversão em contrato">
    <span className="priority-metric-label">Conversão em contrato</span>
    <div className="conversion-readout"><strong>{rateLabel(model.rate)}</strong>
      <p>{model.total ? <>{numeral(model.signed)} de {numeral(model.total)} leads com contrato</> : 'Nenhum lead neste recorte.'}</p>
    </div>
    <progress className="conversion-progress" max="1" value={model.rate ?? 0} aria-label="Proporção de leads com contrato"/>
  </section>;
}

function ComparisonChart({rows, reference = null, onRemove, label = 'Conversão por setor'}) {
  const chart = useChartEntrance();
  return <div ref={chart} className="conversion-compare chart-surface" role="group" aria-label={label} onPointerMove={updateChartGlow}>
    <div className="conversion-compare-rows">
      {rows.map(row => <ComparisonRow key={row.id ?? row.name} row={row} reference={reference}
        onRemove={onRemove}/>)}
    </div>
  </div>;
}

function ComparisonRow({row, reference, onRemove}) {
  const reduced = useReducedMotion();

  return <div className="conversion-compare-line" data-has-details={Boolean(row.detailsHref)}>
    <div className="conversion-compare-row">
      <div className="conversion-compare-sector">
        <span className="sector-marker-number" data-tone={(row.number - 1) % 4}>{row.number}</span>
        <span className="conversion-compare-label"><strong>{row.name}</strong>{row.caption && <small>{row.caption}</small>}</span>
      </div>
      <span className="conversion-compare-track" aria-hidden="true">
        {reference !== null && <i className="conversion-compare-reference" style={{left: reference * 100 + '%'}}/>}
        <motion.span className="conversion-compare-fill" style={{width: row.fraction * 100 + '%'}}
          initial={reduced ? false : {scaleX:0}} whileInView={{scaleX:1}} viewport={{once:true}}
          transition={{duration:reduced ? 0 : .65, ease:[.22,1,.36,1]}}/>
      </span>
      <strong className="conversion-compare-value">{row.value}</strong>
    </div>
    {row.detailsHref && <a className="conversion-compare-detail-link" href={row.detailsHref}
      aria-label={'Detalhes de ' + row.name}>Detalhes</a>}
    <button type="button" className="conversion-compare-remove" onClick={() => onRemove(row.id ?? row.name)}
      aria-label={'Remover ' + (row.accessibleName ?? row.name)}><span aria-hidden="true">×</span></button>
  </div>;
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR',{month:'long',timeZone:'UTC'});
const rankingMonths = Array.from({length:12}, (_, index) => {
  const label = monthFormatter.format(new Date(Date.UTC(2026,index,1)));
  return {value:String(index + 1).padStart(2,'0'),label:label[0].toLocaleUpperCase('pt-BR') + label.slice(1)};
});

export function LeadSeasonalityRanking({model}) {
  const periodsWithActivity = new Set(model.contractsByMonth.keys());
  for (const sectors of model.sectorSeasonality.values()) {
    for (const sector of sectors.values()) {
      for (const period of sector.months.keys()) periodsWithActivity.add(period);
    }
  }
  const periods = [...periodsWithActivity].sort().reverse();
  const years = [...new Set(periods.map(period => period.slice(0,4)))];
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [activeFilter, setActiveFilter] = useState('month');
  const activeYear = years.includes(year) ? year : '';
  const latestPeriod = periods.find(period => !activeYear || period.startsWith(activeYear + '-'));
  const activeMonth = month || latestPeriod?.slice(5) || '01';
  const ranking = monthlySectorRanking(model,activeMonth,activeYear);
  const totals = ranking.reduce((total,row)=>({
    leads:total.leads + row.leadsCreated, converted:total.converted + row.cohortContracts,
    closed:total.closed + row.count,
  }),{leads:0,converted:0,closed:0});

  return <section className="fr-module seasonality-ranking standalone-monthly-ranking" aria-labelledby="seasonality-ranking-title">
    <header className="seasonality-ranking-header">
      <h2 id="seasonality-ranking-title">Ranking de setor por mês</h2>
      <div className="prospect-toggle lead-glass-switch seasonality-ranking-filters" data-side={activeFilter === 'month' ? 'start' : 'end'}>
        <label><span>Mês</span>
          <select value={activeMonth} onFocus={() => setActiveFilter('month')} onChange={event => {
            setActiveFilter('month');
            setMonth(event.target.value);
          }}>
            {rankingMonths.map(({value,label}) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label><span>Ano</span>
          <select value={activeYear} onFocus={() => setActiveFilter('year')} onChange={event => {
            setActiveFilter('year');
            setYear(event.target.value);
          }}>
            <option value="">Geral</option>
            {years.map(year => <option key={year}>{year}</option>)}
          </select>
        </label>
      </div>
    </header>
    <div className="seasonality-ranking-panel">
      {ranking.length>0 && <dl className="lead-metric-strip seasonality-metrics">
        <div><dt>Leads cadastrados</dt><dd>{numeral(totals.leads)}</dd></div>
        <div><dt>Conversão dos leads do mês</dt><dd data-empty={!totals.leads || undefined}>{totals.leads ? rateLabel(totals.converted/totals.leads) : 'Sem base'}</dd></div>
        <div><dt>Contratos fechados no mês</dt><dd>{numeral(totals.closed)}</dd></div>
      </dl>}
      <div className="seasonality-ranking-list" aria-live="polite">
        {ranking.length ? <table>
          <thead><tr>
            <th scope="col">Posição e setor</th>
            <th scope="col">Leads do mês</th>
            <th scope="col" aria-sort="descending">Conversão da safra</th>
            <th scope="col">Fechados no mês</th>
            <th scope="col">Variação de fechamentos</th>
          </tr></thead>
          <tbody>{ranking.map(({segment,count,rate,change,leadsCreated,cohortContracts},index) => <tr key={segment}>
            <th scope="row">
              <span className="seasonality-ranking-sector">
                <span className="seasonality-ranking-position">{index + 1}º</span>
                {segment}
              </span>
            </th>
            <td>{numeral(leadsCreated)}</td>
            <td><strong className="seasonality-ranking-conversion">{rate===null ? 'Sem base' : rateLabel(rate)}</strong>
              {leadsCreated>0 && <small>{numeral(cohortContracts)} de {numeral(leadsCreated)}</small>}</td>
            <td>{numeral(count)}</td>
            <td>
              <strong className="seasonality-ranking-trend" data-trend={change > 0 ? 'up' : change < 0 ? 'down' : undefined}>
                {change === null ? 'Sem base' : (change > 0 ? '+' : '') + formatPercent(change)}
              </strong>
            </td>
          </tr>)}</tbody>
        </table> : <p className="seasonality-ranking-empty">Nenhum lead ou contrato registrado no mês selecionado.</p>}
      </div>
    </div>
  </section>;
}

function summarizeSeasonalityYear(sectors) {
  const year = {total:0,signed:0,months:new Map()};
  for (const sector of sectors.values()) {
    year.total += sector.total;
    year.signed += sector.signed;
    for (const [month,data] of sector.months) {
      const combined = year.months.get(month) ?? {total:0,signed:0};
      combined.total += data.total;
      combined.signed += data.signed;
      year.months.set(month,combined);
    }
  }
  return year;
}

function SeasonalityComparison({activity, hidden, sectorCatalog}) {
  const [selected,setSelected] = useState([]);
  const [search,setSearch] = useState('');
  const [open,setOpen] = useState(false);
  const [year,setYear] = useState('');
  const input = useRef(null);
  const addButton = useRef(null);
  const panel = useRef(null);
  const restoreFocus = useRef(false);
  const bySector = Boolean(sectorCatalog);
  const searchLabel = bySector ? 'Pesquisar setores' : 'Pesquisar anos';
  const comparisons = selected.flatMap(entry => {
    const sectors = activity.get(entry.year);
    if (!sectors || (bySector && !sectorCatalog.some(({segment}) => segment === entry.sector))) return [];
    const data = bySector
      ? sectors.get(entry.sector) ?? {total:0,signed:0,months:new Map()}
      : summarizeSeasonalityYear(sectors);
    const name = bySector ? entry.sector + ' · ' + entry.year : entry.year;
    return [{...entry,...data,name,rate:data.total ? data.signed / data.total : null}];
  }).map((entry,index) => ({...entry,color:index === 0 ? 'var(--viz-mint)' : 'var(--viz-lilac)'}));
  const [first,second] = comparisons;
  const hasComparisonBasis = Boolean(second && first.rate !== null && second.rate !== null);
  const winner = hasComparisonBasis && first.rate !== second.rate ? (first.rate > second.rate ? first : second) : null;
  const availableYears = [...activity.keys()].sort().reverse()
    .filter(name => bySector || !comparisons.some(item => item.year === name));
  const options = year
    ? sectorCatalog
        .filter(({segment}) => !comparisons.some(item => item.year === year && item.sector === segment))
        .map(({segment}) => ({segment,total:activity.get(year)?.get(segment)?.total ?? 0}))
        .sort(compareQualificationSectors)
        .map(({segment,total}) => ({name:segment,caption:numeral(total) + (total === 1 ? ' lead' : ' leads')}))
    : availableYears.map(name => ({name}));
  const matches = options.filter(option => sectorSearchKey(option.name).includes(sectorSearchKey(search)));
  const rows = comparisons.map((entry,index) => ({
    id:entry.id, name:entry.sector ?? entry.year, accessibleName:entry.name, number:index + 1, fraction:entry.rate ?? 0,
    caption:(bySector ? entry.year + ' · ' : '') + numeral(entry.signed) + ' de ' + numeral(entry.total) + ' leads',
    value:rateLabel(entry.rate),
  }));

  useEffect(() => {
    if (restoreFocus.current) {
      const target = restoreFocus.current === "panel" ? panel.current : addButton.current ?? input.current ?? panel.current;
      restoreFocus.current = false;
      target?.focus({preventScroll:true});
    }
  }, [selected,open]);

  function closeSearch() {
    setOpen(false);
    setSearch('');
    setYear('');
  }

  function choose(name, fromKeyboard) {
    if (bySector && !year) {
      input.current.focus({preventScroll:true});
      setYear(name);
      setSearch('');
      return;
    }
    const entry = bySector ? {id:year + ':' + name,year,sector:name} : {id:name,year:name};
    restoreFocus.current = fromKeyboard ? true : "panel";
    setSelected([...selected.filter(item => comparisons.some(comparison => comparison.id === item.id)),entry]);
    closeSearch();
  }

  function remove(id) {
    restoreFocus.current = comparisons.length > 1 || !bySector;
    setSelected(current => current.filter(entry => entry.id !== id));
    closeSearch();
  }

  function changeYear() {
    setYear('');
    setSearch('');
    input.current.focus({preventScroll:true});
  }

  const showInitialSearch = bySector && activity.size > 0 && !rows.length;
  const showAddYear = !bySector && !rows.length && availableYears.length > 0;

  return <div hidden={hidden} className="qualification-layout lead-seasonality-frame">
    <Radar series={[]} label={bySector ? 'Taxas mensais de conversão por setor' : 'Taxas mensais de conversão por ano'} heading={null}
      comparisons={comparisons} showYearPicker={false} showSummary={false} showReadoutHeading={false}/>
    <section ref={panel} tabIndex={-1} className="qualification-sidebar" aria-label={bySector ? 'Setores da sazonalidade' : 'Anos da sazonalidade'}
      onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeSearch();
      }}
      onKeyDown={event => {
        if (open && event.key === 'Escape' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          if (showInitialSearch) input.current?.focus({preventScroll:true});
          else restoreFocus.current = true;
          closeSearch();
        }
      }}>
      {(showInitialSearch || open) && <div className="sector-search">
        <LeadSearch ref={input} autoFocus={!showInitialSearch}
          aria-label={bySector && open && !year ? 'Pesquisar anos' : searchLabel}
          placeholder={bySector && open && !year ? 'Pesquisar anos' : searchLabel}
          value={search} onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
          onChange={event => {setSearch(event.target.value);setOpen(true);}}
          onKeyDown={event => {
            if (event.key === 'Enter' && open && matches.length && !event.nativeEvent.isComposing) choose(matches[0].name,true);
          }}/>
      </div>}
      {showAddYear && !open && <div className="sector-search">
        <LeadSearchButton ref={addButton} onClick={() => setOpen(true)}>Adicionar ano</LeadSearchButton>
      </div>}
      <div className="sector-comparison-content">
        {open && <div className="sector-search-options" role="group" aria-label={year ? 'Setores disponíveis na sazonalidade' : 'Anos disponíveis'}>
          <div className="seasonality-search-step">
            <strong>{year ? 'Setores de ' + year : 'Escolher ano'}</strong>
            {year && <button type="button" onClick={changeYear}>Trocar ano</button>}
          </div>
          {matches.length ? matches.map(({name,caption}) => <button type="button" key={name}
            className="sector-search-option" onClick={event => choose(name,event.detail === 0)}>
            <span>{name}</span>{caption && <small>{caption}</small>}
          </button>) : <p className="sector-search-empty">{year ? 'Nenhum setor encontrado.' : 'Nenhum ano disponível'}</p>}
        </div>}
        <div className="sector-selection-content">
          {rows.length > 0 && <ComparisonChart rows={rows}
            label={bySector ? 'Conversão por ano e setor' : 'Conversão por ano'} onRemove={remove}/>}
          {rows.length === 1 && !open && <div className="sector-search seasonality-comparison-trigger">
            <LeadSearchButton ref={addButton} icon="plus" onClick={() => setOpen(true)}>Adicionar comparação</LeadSearchButton>
          </div>}
          {!rows.length && <div className="sector-selection-empty">
            <strong>{activity.size ? (bySector ? 'Nenhum setor foi escolhido' : 'Nenhum ano foi escolhido') : 'Nenhum ano disponível'}</strong>
            {activity.size > 0 && bySector && <p>Clique em Pesquisar setores</p>}
          </div>}
        </div>
      </div>
      <footer className="seasonality-comparison-result" role="status">
        {second && <>
          <div className="seasonality-result-description">
            {winner ? <>
              <span>Maior conversão</span>
              <strong>{winner.sector ?? winner.year}</strong>
              {bySector && <span>{winner.year}</span>}
            </> : <strong>{hasComparisonBasis ? 'Empate na taxa de conversão.' : 'Sem base para comparar.'}</strong>}
          </div>
          {hasComparisonBasis && <span className="seasonality-result-rate">{rateLabel((winner ?? first).rate)}</span>}
        </>}
      </footer>
    </section>
  </div>;
}

export function LeadSeasonality({model}) {
  const [mode,setMode] = useState('years');
  const modePicker = <div className="prospect-toggle lead-glass-switch seasonality-modes" data-side={mode === 'years' ? 'start' : 'end'} role="group" aria-label="Comparar sazonalidade por">
    <button type="button" aria-pressed={mode === 'years'} onClick={() => setMode('years')}>Anos</button>
    <button type="button" aria-pressed={mode === 'sectors'} onClick={() => setMode('sectors')}>Setores</button>
  </div>;

  return <DashboardModule title="Comparação por sazonalidade" className="lead-seasonality" headerControls={modePicker}>
    <div className="seasonality-panels">
      <SeasonalityComparison activity={model.sectorSeasonality} hidden={mode !== 'years'}/>
      <SeasonalityComparison activity={model.sectorSeasonality} hidden={mode !== 'sectors'} sectorCatalog={qualificationSectors(model.groups)}/>

    </div>
  </DashboardModule>;
}

function SectorContractList({contracts,query}) {
 const pagination=useDirectoryPagination(contracts,query,0,8);
 return contracts.length ? <><ul className="qualification-contract-list">{pagination.visible.map(lead=><li key={lead.id}><a href={leadHref(lead,query)}><span>{lead.name}</span><span aria-hidden="true">↗</span></a></li>)}</ul><DirectoryPagination {...pagination} compact label="Paginação dos leads que fecharam"/></> : <p className="empty">Nenhum contrato confirmado neste recorte.</p>;
}

export function LeadQualificationDetails({model, areas, kind, name, query}) {
 const backHref='#/leads'+(query?'?'+query:'');
 const sector=kind==='setor'&&qualificationSectors(model.groups).find(group=>group.segment===name);
 const isArea=kind==='subarea'&&(areas.some(area=>area.name===name)||model.areas.some(([area])=>area===name));
 const count=new Map(model.areas).get(name)||0;
 const maximum=sector?Math.max(1,...sector.areas.map(([,count])=>count)):1;
 return <section className="qualification-detail-page" aria-label={sector?'Detalhes do setor: '+name:'Detalhes da subárea'}>
  <nav className="qualification-detail-navigation" aria-label="Caminho da página"><span>{sector||isArea?name:'Detalhes indisponíveis'}</span><a className="lead-glass-action" href={backHref}>Voltar à comparação →</a></nav>
  {sector ? <>
   <DashboardMetrics entries={[
    {label:'Taxa de conversão',value:sector.rate,percent:true},
    {label:'Contratos confirmados',value:sector.signed},
    {label:'Leads no setor',value:sector.total},
    {label:'Valor médio contratado',value:sector.averageValue,money:true},
   ]}/>
   <div className="qualification-secondary-metrics"><DashboardMetrics entries={[
    {label:'Perdidos',value:sector.lost},
    {label:'Sem desfecho firmado',value:sector.total-sector.signed-sector.lost},
    {label:'Projetos com valor',value:sector.pricedProjects},
   ]}/></div>
   <div className="qualification-detail-grid">
    <DashboardModule title="Subáreas dos contratos" className="qualification-area-module">
     {sector.areas.length ? <ul className="qualification-area-list">{sector.areas.map(([area,count])=><li key={area}><span>{area}</span><strong>{numeral(count)}</strong><span className="qualification-area-track" aria-hidden="true"><i style={{width:100*count/maximum+'%'}}/></span></li>)}</ul> : <p className="empty">Nenhuma subárea vinculada aos contratos.</p>}
    </DashboardModule>
    <DashboardModule title="Leads que fecharam" className="qualification-contract-module"><SectorContractList contracts={sector.contracts} query={query}/></DashboardModule>
   </div>
  </> : isArea ? <DashboardMetrics entries={[{label:'Contratos confirmados',value:count}]}/> : <p className="empty">Nenhum resultado para este item no recorte atual.</p>}
 </section>;
}

export function LeadQualification({model, selected, onSelect, query}) {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef(null);
  const selectionPanel = useRef(null);

  const sectors = qualificationSectors(model.groups);
  const sectorsByName = new Map(sectors.map(group => [group.segment, group]));
  const activeNames = [...new Set(selected.filter(segment => sectorsByName.has(segment)))];
  const selection = new Map(activeNames.map((segment,index) => [segment,index + 1]));

  const searchKey = sectorSearchKey(search);
  const options = sectors.filter(group => !selection.has(group.segment) && sectorSearchKey(group.segment).includes(searchKey));
  const sectorRows = activeNames.map(segment => sectorsByName.get(segment)).map(group => ({
    number:selection.get(group.segment),
    name:group.segment,
    fraction:group.rate ?? 0,
    caption:numeral(group.signed) + ' de ' + numeral(group.total) + ' leads',
    value:rateLabel(group.rate),
    detailsHref:qualificationDetailsHref(group.segment, query),
  }));

  function closeSearch() {
    setSearchOpen(false);
    setSearch('');
  }

  function chooseSector(name, fromKeyboard) {
    onSelect([...activeNames, name]);
    (fromKeyboard ? searchInput.current : selectionPanel.current).focus({preventScroll:true});
    closeSearch();
  }

  function removeSector(name) {
    toggleSector(name);
    searchInput.current.focus({preventScroll:true});
    closeSearch();
  }

  function toggleSector(name) {
    const next = new Set(activeNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onSelect([...next]);
  }

  return <DashboardModule title="Comparação por setores" className="qualification-module">
    <div className="qualification-layout">
      <SectorPositionChart model={model} selected={selection} onToggle={toggleSector}/>
      <section ref={selectionPanel} tabIndex={-1} className="qualification-sidebar" aria-label="Setores para comparar"
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) closeSearch();
        }}
        onKeyDown={event => {
          if (searchOpen && event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            searchInput.current.focus({preventScroll:true});
            closeSearch();
          }
        }}>
        <div className="sector-search">
          <LeadSearch ref={searchInput} aria-label="Pesquisar setores" placeholder="Pesquisar setores" value={search}
            onFocus={() => setSearchOpen(true)} onClick={() => setSearchOpen(true)}
            onChange={event => {
              setSearch(event.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' && searchOpen && !event.nativeEvent.isComposing && options.length) {
                chooseSector(options[0].segment,true);
              }
            }}/>
        </div>
        <div className="sector-comparison-content">
          {searchOpen && <div className="sector-search-options" role="group" aria-label="Setores disponíveis">
            {options.length ? options.map(group => <button type="button" className="sector-search-option"
              key={group.segment} onClick={event => chooseSector(group.segment,event.detail === 0)}>
              <span>{group.segment}</span>
              <small>{numeral(group.total)} {group.total === 1 ? 'lead' : 'leads'}</small>
            </button>) : <p className="sector-search-empty" role="status">Nenhum setor encontrado.</p>}
          </div>}
          <div className="sector-selection-content">
            {sectorRows.length > 0
              ? <ComparisonChart rows={sectorRows} reference={model.rate} onRemove={removeSector}/>
              : <div className="sector-selection-empty">
                  <strong>Nenhum setor foi escolhido</strong>
                  <p>Clique em Pesquisar setores</p>
                </div>}
          </div>
        </div>
      </section>
    </div>
  </DashboardModule>;
}

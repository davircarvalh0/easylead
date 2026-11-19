import React, { useId } from 'react';
import { actionableLeads } from '../domain.js';
import { Magnetic } from '../Magnetic.jsx';
import { DashboardValue, formatNumber } from './DashboardValue.jsx';
import { updateChartGlow, useChartEntrance } from './ChartSurface.jsx';
import './overview-bento.css';

const colors = ['#69aafa', '#ac8cff', '#f4bd66', '#46dca5', '#ef8998'];
const initials = name => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('');

function scopedLink(path, query, key, value) {
  const params = new URLSearchParams(query);
  if (key) params.set(key, value);
  return `#${path}${params.size ? '?' + params : ''}`;
}

export function OverviewBento({ state, indicators, funnel, query, values, projects, addDemo }) {
  const ownerGroup = useId();
  const stageChart = useChartEntrance();
  const priorities = actionableLeads({ ...state, leads: funnel.items });
  const featured = [...projects].sort((a, b) => Number(b.status === 'Em andamento') - Number(a.status === 'Em andamento')).slice(0, 4);
  const owners = new Map();
  for (const project of projects) owners.set(project.ownerId, (owners.get(project.ownerId) || 0) + 1);
  const members = [...state.members].sort((a, b) => (owners.get(b.id) || 0) - (owners.get(a.id) || 0));
  const stats = [
    ['Leads abertos', indicators.open, '/leads', 'estagio', 'abertos'],
    ['Projetos em andamento', indicators.active, '/projetos', 'status', 'Em andamento'],
    ['Leads ganhos', indicators.won, '/leads', 'estagio', 'Ganho'],
    ['Total de projetos', indicators.projects, '/projetos'],
  ];
  const projectsLink = scopedLink('/projetos', query);
  const leadsLink = scopedLink('/leads', query);

  return <>
    <div className="overview-workspace">
      <div className="overview-column">
        <section className="bento-module overview-opportunities" aria-labelledby="pipeline-title">
          <header className="bento-section-header">
            <h2 id="pipeline-title">Oportunidades e entregas</h2>
            <Magnetic href="#/leads/novo">Cadastrar oportunidade ↗</Magnetic>
          </header>
          <div className="overview-signals">
            {stats.map(([label, value, path, key, filter], index) => <a key={label}
              href={scopedLink(path, query, key, filter)} className="overview-signal chart-surface" onPointerMove={updateChartGlow}
              style={{ '--signal': colors[index] }} aria-label={label + ' ' + formatNumber(value) + ' Consultar'}>
              <span>{label}</span><DashboardValue value={value}/><span className="go-arrow" aria-hidden="true">↗</span>
            </a>)}
          </div>
          <div ref={stageChart} className="overview-stage-chart" role="group" aria-label="Leads por estágio">
            <div className="overview-stage-band" aria-hidden="true">
              {funnel.rows.map(({ stage, count }, index) => count > 0 &&
                <i key={stage} style={{ flexGrow: count, background: colors[index] }}/>)}
            </div>
            <div className="overview-stage-legend">
              {funnel.rows.map(({ stage, count }, index) => <a key={stage} href={scopedLink('/leads', query, 'estagio', stage)}
                aria-label={stage + ', ' + formatNumber(count) + ' leads'}>
                <i aria-hidden="true" style={{ background: colors[index] }}/>{stage}
              </a>)}
            </div>
          </div>
          <header className="bento-section-header overview-queue-head"><h3>Leads que precisam de ação</h3><a href={leadsLink}>Todos os leads ↗</a></header>
          {priorities.length ? <ul className="overview-queue">{priorities.slice(0, 4).map(lead => <li key={lead.id}>
            <a href={'#/leads/' + lead.id}><span className="overview-glyph" aria-hidden="true">{lead.stage === 'Ganho' ? '✓' : '↗'}</span>
              <span><strong>{lead.name}</strong><small>{lead.stage === 'Ganho' ? 'Pronto para converter' : lead.stage}</small></span><span aria-hidden="true">↗</span>
            </a>
          </li>)}</ul> : <p className="empty">Nenhum lead precisa de ação neste recorte.</p>}
        </section>

        <section className="bento-module overview-projects" aria-labelledby="overview-projects">
          <header className="bento-section-header"><h2 id="overview-projects">Projetos em destaque</h2><a href={projectsLink}>Abrir carteira ↗</a></header>
          {featured.length ? <div className="overview-project-grid">{featured.map((project, index) => <a
            href={'#/projetos/' + project.id} key={project.id} className="overview-project chart-surface" onPointerMove={updateChartGlow}
            style={{ '--project-color': colors[index] }}>
            <span className="overview-project-art" aria-hidden="true"><i/><i/><i/></span>
            <span className="overview-project-status">{project.status}</span>
            <strong>{project.name}</strong><small>{project.phase || 'Delivery'}</small><span className="go-arrow" aria-hidden="true">↗</span>
          </a>)}</div> : <p className="empty">Nenhum projeto neste recorte.</p>}
        </section>

      </div>
      <div className="overview-column">
        <section className="bento-module overview-average" aria-label="Valores e filtros">
          {React.cloneElement(values, { inspectGroups: true })}
        </section>

        <section className="bento-module overview-owners" aria-labelledby="overview-owners">
          <header className="bento-section-header"><h2 id="overview-owners">Responsáveis por projetos</h2><a href="#/organizacao">Organização ↗</a></header>
          {members.length ? <div className="overview-owner-grid">{members.map((member, index) => <details name={ownerGroup} key={member.id}>
            <summary><span className="overview-avatar" aria-hidden="true" style={{ '--avatar-color': colors[index % colors.length] }}>{initials(member.name)}</span>
              <strong>{member.name}</strong><span className="owner-expand" aria-hidden="true">+</span></summary>
            <div className="overview-owner-info">
              <small>{member.role} · {state.areas.find(area => area.id === member.areaId)?.name || 'Área não informada'}</small>
              <p>{formatNumber(owners.get(member.id) || 0)} {(owners.get(member.id) || 0) === 1 ? 'projeto no recorte' : 'projetos no recorte'}</p>
              <a href={'#/organizacao/' + member.areaId}>Abrir subárea ↗</a>
            </div>
          </details>)}</div> : <p className="empty">Nenhum integrante cadastrado.</p>}
        </section>
      </div>
    </div>
    <button className="quiet-button" onClick={addDemo}>Adicionar exemplos de filtros e médias</button>
  </>;
}

import React from 'react';
import {DashboardModule} from './DashboardModule.jsx';
import {formatDate} from './DashboardValue.jsx';

export function LeadProject({project, state, scopeHref}) {
  const area = project && state.areas.find(item=>item.id===project.areaId);
  const actions = <div className="lead-project-actions">
    <a className="lead-glass-action" href={scopeHref}>Definir valor e escopo</a>
    {project && <a className="lead-glass-action lead-glass-action-primary"
      href={'#/projetos/' + encodeURIComponent(project.id)}>Ver projeto</a>}
  </div>;

  return <DashboardModule title="Projeto" className="lead-project-panel" headerControls={actions}>
    {project ? <div className="lead-project-summary">
      <h3>{project.name}</h3>
      <p>{[project.phase, project.status, project.contractStatus].filter(Boolean).join(' · ')}</p>
      {area && <a href={'#/organizacao/' + encodeURIComponent(area.id)}>{area.name} →</a>}
      {(project.convertedAt || project.contractStart || project.contractEnd) && <dl>
        {project.convertedAt && <><dt>Conversão</dt><dd>{formatDate(project.convertedAt)}</dd></>}
        {(project.contractStart || project.contractEnd) && <><dt>Vigência</dt><dd>{formatDate(project.contractStart)} · {formatDate(project.contractEnd)}</dd></>}
      </dl>}
    </div> : <p className="lead-workflow-notice">Projeto pendente.</p>}
  </DashboardModule>;
}

import React, {useLayoutEffect, useRef} from 'react';
import {DashboardValue} from './DashboardValue.jsx';
import {LeadFacts} from './LeadFacts.jsx';
import {closedContractAmount, leadProject} from '../services/leadWorkspace.js';

export function LeadInspector({lead, state, onDismiss, editQuery = '', linkQuery = ''}) {
  const dialog = useRef(null);
  const close = useRef(null);
  const active = Boolean(lead);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (active && !node.open) { node.showModal(); close.current?.focus(); }
    if (!active && node.open) node.close();
  }, [active]);
  const project = lead ? leadProject(state, lead) : null;

  return <dialog ref={dialog} className="value-dialog lead-inspector" aria-labelledby="lead-inspector-title"
    onCancel={event => {event.preventDefault(); onDismiss();}}
    onClick={event => {if (event.target === event.currentTarget) onDismiss();}}>
    {lead && <div className="lead-inspector-body">
      <header>
        <div><span className="badge">{lead.stage}</span><h2 id="lead-inspector-title">{lead.name}</h2><p>{lead.company}</p></div>
        <button ref={close} type="button" className="quiet-button" onClick={onDismiss}>Fechar detalhe</button>
      </header>
      <div className="lead-inspector-prices">
        <div><span>Valor contratado</span><DashboardValue money value={closedContractAmount(project)} fallback="Sem valor contratado"/></div>
      </div>
      <LeadFacts lead={lead} project={project} state={state} linkQuery={linkQuery}/>
      <div className="value-links">
        <a className="panel-button" href={'#/leads/' + encodeURIComponent(lead.id) + (editQuery ? '?' + editQuery : '')}>Abrir cadastro →</a>
      </div>
    </div>}
  </dialog>;
}

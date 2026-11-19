import React, {useState} from 'react';
import {phases} from '../domain.js';
import {DashboardModule} from './DashboardModule.jsx';

export function ProjectScopeEditor({lead, project, areas, saveProjectScope, recordHref}) {
  const [draft, setDraft] = useState(() => ({
    contractValue: project ? (project.contractValue ?? '') : (lead.proposal?.price ?? ''),
    areaId: project?.areaId || '',
    phase: project?.phase || 'Discovery',
  }));
  const [error, setError] = useState('');

  function change(event) {
    const {name, value} = event.target;
    setDraft(previous=>({...previous,[name]:value}));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const saved = await saveProjectScope(lead.id,draft);
      location.hash = project ? recordHref : '#/projetos/' + encodeURIComponent(saved.id);
    } catch (failure) {
      setError(failure.message);
    }
  }

  return <DashboardModule hideTitle title="Definir valor e escopo" className="lead-proposal-editor">
    <form className="dashboard-form form-columns" onSubmit={submit}>
      {error && <p role="alert" className="error form-wide">{error}</p>}
      <label>Valor contratado (R$)
        <input name="contractValue" type="number" inputMode="decimal" min="0.01" step="0.01"
          required={project?.contractValue>0} value={draft.contractValue} onChange={change}/>
      </label>
      <label>Área responsável
        <select name="areaId" required value={draft.areaId} onChange={change}>
          <option value="">Selecione uma área</option>
          {areas.map(({id,name})=><option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <label>Fase do projeto
        <select name="phase" value={draft.phase} onChange={change}>
          {phases.map(phase=><option key={phase}>{phase}</option>)}
        </select>
      </label>
      <div className="form-actions form-wide">
        <button type="submit" className="lead-glass-action lead-glass-action-primary">{project ? 'Salvar valor e escopo' : 'Criar projeto'}</button>
        <a className="lead-glass-action" href={recordHref}>Cancelar</a>
      </div>
    </form>
  </DashboardModule>;
}

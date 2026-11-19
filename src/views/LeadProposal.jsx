import React, {useState} from 'react';
import {DashboardModule} from './DashboardModule.jsx';
import {viewProposalDocument} from '../repositories/proposalDocuments.js';
import {proposalDocumentUrl} from '../services/leadWorkspace.js';

export function LeadProposal({lead, editHref}) {
  const [error, setError] = useState('');
  const proposal = lead.proposal;
  const attachment = proposal?.attachment;
  const documentUrl = proposalDocumentUrl(proposal?.documentUrl);

  async function viewDocument() {
    setError('');
    try {
      await viewProposalDocument(attachment);
    } catch (failure) {
      setError(failure.message || 'Não foi possível abrir o documento neste navegador.');
    }
  }

  return <section className="lead-proposal-overview" aria-label="Proposta">
    <p className="lead-proposal-description">{proposal?.description || 'Nenhuma descrição foi adicionada à proposta.'}</p>
    <div className="lead-proposal-actions">
      {attachment
        ? <button type="button" className="lead-glass-action" onClick={viewDocument}>Ver documento</button>
        : documentUrl
          ? <a className="lead-glass-action" href={documentUrl} target="_blank" rel="noopener noreferrer">Ver documento</a>
          : <button type="button" className="lead-glass-action" disabled>Ver documento</button>}
      {editHref && <a className="lead-glass-action lead-glass-action-primary" href={editHref}>Editar proposta</a>}
    </div>
    {error && <p role="alert" className="error">{error}</p>}
  </section>;
}

export function LeadProposalEditor({lead, saveProposal, recordHref}) {
  const proposal = lead.proposal;
  const [draft, setDraft] = useState(() => ({
    documentUrl:proposal?.documentUrl || '', description:proposal?.description || '', price:proposal?.price ?? '',
  }));
  const [file, setFile] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function change(event) {
    const {name,value} = event.target;
    setDraft(previous=>({...previous,[name]:value}));
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await saveProposal(lead.id, draft, file, removeAttachment);
      location.hash = recordHref;
    } catch (failure) {
      setError(failure.message);
      setSaving(false);
    }
  }

  return <DashboardModule hideTitle title="Editar proposta" className="lead-proposal-editor">
    <form className="dashboard-form form-columns" onSubmit={submit}>
      {error && <p role="alert" className="error form-wide">{error}</p>}
      <label className="form-wide">Descrição da proposta
        <textarea name="description" rows={6} value={draft.description} onChange={change}/>
      </label>
      <label>Valor da proposta (R$)
        <input name="price" type="number" inputMode="decimal" min="0.01" step="0.01" value={draft.price} onChange={change}/>
      </label>
      <label>Link do documento da proposta
        <input name="documentUrl" type="url" placeholder="https://…" value={draft.documentUrl} onChange={change}/>
      </label>
      <label className="form-wide">Anexar documento (PDF, Word, ODT ou RTF)
        <input type="file" accept=".pdf,.doc,.docx,.odt,.rtf" onChange={event=>setFile(event.target.files[0] ?? null)}/>
      </label>
      {proposal?.attachment && !file && <label className="check form-wide">
        <input type="checkbox" checked={removeAttachment} onChange={event=>setRemoveAttachment(event.target.checked)}/>
        Remover anexo {proposal.attachment.name}
      </label>}
      <div className="form-actions form-wide">
        <button type="submit" className="lead-glass-action lead-glass-action-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar proposta'}</button>
        <a className="lead-glass-action" href={recordHref}>Cancelar</a>
      </div>
    </form>
  </DashboardModule>;
}

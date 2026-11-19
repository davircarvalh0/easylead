import React, { useId, useRef, useState } from 'react';
import {formatMoney} from './DashboardValue.jsx';
import { DashboardModule } from './DashboardModule.jsx';
import {LeadChoice} from './LeadChoice.jsx';
import {LeadSearch} from '../../components/ui/LeadSearch.jsx';
import {brazilianStates,leadIcpStatuses,leadIcpStatus} from '../services/leadWorkspace.js';
import {leadSectors} from '../services/leadSectors.js';
import { Magnetic } from '../Magnetic.jsx';
import { useLeadFormController } from '../controllers/useLeadController.js';

const normalizeSearch = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR').trim();

export function LeadForm({ lead, saveLead, backHref = '#/leads', returnQuery = '', leadOwners = [], areas = [], embedded = false, icpBudget }) {
  const { data, error, setField, submit } = useLeadFormController(lead, saveLead, returnQuery);
  const [sectorSearch, setSectorSearch] = useState('');
  const [sectorOpen, setSectorOpen] = useState(false);
  const sectorPanel = useId();
  const sectorButton = useRef(null);
  const currentOwnerUnavailable = data.businessOwnerId && !leadOwners.some(person=>person.id===data.businessOwnerId);
  const contractorArea = areas.find(area=>area.id === data.contractorSegment || area.name === data.contractorSegment);
  const selectedSector = data.clientSegment || 'Não classificado';
  const sectors = [...new Set(['Não classificado', selectedSector, ...leadSectors])];
  const matches = sectors.filter(sector=>normalizeSearch(sector).includes(normalizeSearch(sectorSearch)));
  function closeSector() {
    setSectorOpen(false);
    setSectorSearch('');
    sectorButton.current?.focus();
  }

  return <DashboardModule title={lead ? 'Editar lead' : 'Novo lead'} className={'lead-form-panel' + (lead ? '' : ' lead-create-form')}
    href={embedded ? undefined : backHref} action="Consultar leads">
    <form className="dashboard-form form-columns" noValidate onSubmit={submit}>
      {error && <p role="alert" className="error form-wide">{error}</p>}
      <label className="form-wide">Nome da empresa *
        <input name="company" autoComplete="organization" required value={data.company} onChange={e => setField('company', e.target.value)}/>
      </label>
      {lead && <label>Nome da oportunidade *
        <input name="name" required value={data.name} onChange={e => setField('name', e.target.value)}/>
      </label>}
      <label>Contato *
        <input name="contact" required value={data.contact} onChange={e => setField('contact', e.target.value)}/>
      </label>
      <label>LinkedIn
        <input name="linkedin" inputMode="url" placeholder="linkedin.com/in/..." value={data.linkedin || ''} onChange={e => setField('linkedin', e.target.value)}/>
      </label>
      <label>Cidade
        <input name="city" autoComplete="address-level2" value={data.city} onChange={e=>setField('city',e.target.value)}/>
      </label>
      <label>UF
        <select name="uf" autoComplete="address-level1" value={data.uf} onChange={e=>setField('uf',e.target.value)}>
          <option value="">Selecione</option>
          {brazilianStates.map(uf=><option key={uf}>{uf}</option>)}
        </select>
      </label>
      <label>Valor estimado (R$)
        <input name="estimatedValue" type="number" inputMode="decimal" min="0" step="0.01" value={data.estimatedValue}
          onChange={e=>setField('estimatedValue',e.target.value)}/>
      </label>
      <label>Aderência ao ICP
        <select name="idealCustomerProfile" value={leadIcpStatus(data.idealCustomerProfile)} onChange={e=>setField('idealCustomerProfile',e.target.value)}>
          <option value="">Não avaliado</option>
          {leadIcpStatuses.map(status=><option key={status}>{status}</option>)}
        </select>
      </label>
      {!lead && (icpBudget?.minimum != null || icpBudget?.maximum != null) && <details className="lead-icp-criteria form-wide">
        <summary>Ver orçamento do ICP</summary>
        {icpBudget.minimum != null && <p>Orçamento mínimo <strong>{formatMoney(icpBudget.minimum)}</strong></p>}
        {icpBudget.maximum != null && <p>Orçamento máximo <strong>{formatMoney(icpBudget.maximum)}</strong></p>}
      </details>}
      <div className="lead-sector-picker form-wide" onKeyDown={event=>{
        if (event.key === 'Escape' && sectorOpen) {event.preventDefault(); closeSector();}
      }}>
        <span id={sectorPanel + '-label'} className="lead-choice-label">Setor da contratante</span>
        <button ref={sectorButton} type="button" className="lead-choice-trigger" aria-expanded={sectorOpen}
          aria-labelledby={sectorPanel + '-label'} aria-describedby={sectorPanel + '-value'}
          aria-controls={sectorOpen ? sectorPanel : undefined} onClick={()=>{if (sectorOpen) closeSector(); else setSectorOpen(true);}}>
          <span id={sectorPanel + '-value'}>{selectedSector}</span><i aria-hidden="true"/>
        </button>
        {sectorOpen && <div id={sectorPanel} className="lead-sector-options">
          <LeadSearch minimal={Boolean(lead)} aria-label="Pesquisar setores" autoFocus value={sectorSearch}
            onChange={event=>setSectorSearch(event.target.value)} placeholder="Pesquisar setores"
            onKeyDown={event=>{if(event.key==='Enter')event.preventDefault();}}/>
          {matches.length ? <ul aria-label="Setores disponíveis">
            {matches.map(sector=><li key={sector}><button type="button" aria-pressed={selectedSector === sector}
              onClick={()=>{setField('clientSegment',sector); closeSector();}}>{sector}</button></li>)}
          </ul> : <p role="status" className="section-note">Nenhum setor encontrado.</p>}
        </div>}
      </div>
      <LeadChoice className="form-wide" label="Segmento da contratante" value={contractorArea?.id || ''}
        options={[{value:'',label:'Sem área atribuída'}, ...areas.map(area=>({value:area.id,label:area.name}))]}
        onChange={value=>setField('contractorSegment',value)}/>
      {lead && <label className="form-wide">Responsável pelo Lead
        <select name="businessOwnerId" value={data.businessOwnerId || ''}
          onChange={e=>setField('businessOwnerId',e.target.value)}>
          <option value="">Sem responsável atribuído</option>
          {currentOwnerUnavailable && <option value={data.businessOwnerId} disabled>Responsável atual indisponível para novas atribuições</option>}
          {leadOwners.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </label>}
      <div className="form-actions form-wide"><Magnetic>Salvar lead</Magnetic>{!embedded && <a href={backHref}>Voltar aos leads</a>}</div>
    </form>
  </DashboardModule>;
}

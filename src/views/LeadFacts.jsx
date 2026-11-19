import React from 'react';
import {formatDate,formatMoney} from './DashboardValue.jsx';
import {linkedInUrl} from '../services/leadWorkspace.js';

export function LeadFacts({lead, state}) {
  const businessOwner = state.members.find(member=>member.id===lead.businessOwnerId);
  const linkedin = linkedInUrl(lead.linkedin);

  return <div className="lead-facts">
      <section aria-label="Dados do lead">
        <h3>Dados do lead</h3>
        <dl>
          <dt>Organização</dt><dd>{lead.company}</dd>
          {lead.contactName && <><dt>Nome do contato</dt><dd>{lead.contactName}</dd></>}
          <dt>Contato</dt><dd>{lead.contact || 'Sem contato registrado'}</dd>
          {lead.phone && lead.phone!==lead.contact && <><dt>Telefone</dt><dd>{lead.phone}</dd></>}
          {lead.email && lead.email!==lead.contact && <><dt>E-mail</dt><dd>{lead.email}</dd></>}
          {linkedin && <><dt>LinkedIn</dt><dd><a href={linkedin} target="_blank" rel="noopener noreferrer">Abrir LinkedIn ↗</a></dd></>}
          {(lead.city || lead.uf) && <><dt>Localização</dt><dd>{[lead.city,lead.uf].filter(Boolean).join(' / ')}</dd></>}
          {Number.isFinite(lead.estimatedValue) && <><dt>Valor estimado</dt><dd>{formatMoney(lead.estimatedValue)}</dd></>}
          <dt>Setor</dt><dd>{lead.clientSegment || 'Não classificado'}</dd>
          {lead.decisionPower && <><dt>Poder de decisão</dt><dd>{lead.decisionPower}</dd></>}
          {lead.idealCustomerProfile && <><dt>ICP</dt><dd>{lead.idealCustomerProfile}</dd></>}
          <dt>Estágio</dt><dd>{lead.stage}</dd>
          <dt>Responsável pelo lead</dt><dd>{businessOwner?.name || 'Sem responsável atribuído'}</dd>
          <dt>Criação</dt><dd>{formatDate(lead.createdAt)}</dd>
        </dl>
      </section>
  </div>;
}

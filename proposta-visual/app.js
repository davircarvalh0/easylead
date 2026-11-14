const DEMO_DATA = {
  segments: [
    'Finanças & Pagamentos',
    'Varejo & E-commerce',
    'Saúde & Biotech'
  ],
  subareas: [
    { id: 'a2', name: 'Desenvolvimento', focus: 'Engenharia de software web, mobile e arquitetura escalável' },
    { id: 'a0', name: 'Inovação', focus: 'Braço de IA, descoberta de negócios e soluções estilo startup (Fonte: PDF)' },
    { id: 'a3', name: 'Design', focus: 'Pesquisa de usuário, UX/UI, prototipação e sistemas visuais' }
  ],
  members: [
    { id: 'm2', name: 'Clara Luz', initials: 'CL', role: 'Tech Lead & Desenvolvedora', areaId: 'a2', squadId: 'sq1' },
    { id: 'm0', name: 'Ana Lima', initials: 'AL', role: 'Estrategista de IA & Produto', areaId: 'a0', squadId: 'sq2' },
    { id: 'm3', name: 'Diego Alves', initials: 'DA', role: 'Product Designer Lead', areaId: 'a3', squadId: 'sq3' },
    { id: 'm1', name: 'Bruno Melo', initials: 'BM', role: 'Engenheiro Full-Stack', areaId: 'a2', squadId: 'sq1' },
    { id: 'm4', name: 'Eva Costa', initials: 'EC', role: 'Engenheira de Dados & IA', areaId: 'a0', squadId: 'sq2' }
  ],
  squads: [
    {
      id: 'sq1',
      name: 'Squad Maré',
      areaId: 'a2',
      ownerId: 'm2',
      memberIds: ['m2', 'm1', 'm0'],
      specialty: 'Plataformas Transacionais & APIs'
    },
    {
      id: 'sq2',
      name: 'Squad Horus IA',
      areaId: 'a0',
      ownerId: 'm0',
      memberIds: ['m0', 'm4'],
      specialty: 'Agentes de IA & Automação de Processos'
    },
    {
      id: 'sq3',
      name: 'Squad Vega UX',
      areaId: 'a3',
      ownerId: 'm3',
      memberIds: ['m3', 'm2'],
      specialty: 'Discovery de Produto & Design System'
    }
  ],
  leads: [
    {
      id: 'l3',
      name: 'Plataforma Maré',
      company: 'Banco Atlântico S.A.',
      clientSegment: 'Finanças & Pagamentos',
      contact: 'marina@bancoatlantico.com.br',
      stage: 'Ganho',
      estimatedValue: 54000,
      projectId: 'p1'
    },
    {
      id: 'l5',
      name: 'Motor IA de Crédito',
      company: 'Fintech Nordeste',
      clientSegment: 'Finanças & Pagamentos',
      contact: 'carlos@fintechnordeste.com',
      stage: 'Ganho',
      estimatedValue: 72000,
      projectId: 'p2'
    },
    {
      id: 'l6',
      name: 'Checkout Omni Varejo',
      company: 'Grupo Rede Sul',
      clientSegment: 'Varejo & E-commerce',
      contact: 'patricia@redesul.com.br',
      stage: 'Ganho',
      estimatedValue: 36000,
      projectId: 'p3'
    },
    {
      id: 'l7',
      name: 'Portal Clínico Integrado',
      company: 'BioVida Diagnósticos',
      clientSegment: 'Saúde & Biotech',
      contact: 'dr.renato@biovida.med.br',
      stage: 'Ganho',
      estimatedValue: null,
      projectId: 'p4'
    },
    {
      id: 'l2',
      name: 'App Raiz Logística',
      company: 'Varejo Express',
      clientSegment: 'Varejo & E-commerce',
      contact: 'expansao@varejoexpress.com',
      stage: 'Proposta',
      estimatedValue: 45000,
      projectId: null
    }
  ],
  projects: [
    {
      id: 'p1',
      name: 'Plataforma Maré',
      leadId: 'l3',
      company: 'Banco Atlântico S.A.',
      clientSegment: 'Finanças & Pagamentos',
      phase: 'Delivery',
      originPhase: 'Discovery',
      status: 'Em andamento',
      contractStatus: 'Contratado',
      contractValue: 54000,
      squadId: 'sq1',
      areaId: 'a2',
      ownerId: 'm2',
      memberIds: ['m2', 'm1', 'm0']
    },
    {
      id: 'p2',
      name: 'Motor IA de Crédito',
      leadId: 'l5',
      company: 'Fintech Nordeste',
      clientSegment: 'Finanças & Pagamentos',
      phase: 'Discovery',
      originPhase: 'Discovery',
      status: 'Em andamento',
      contractStatus: 'Contratado',
      contractValue: 72000,
      squadId: 'sq2',
      areaId: 'a0',
      ownerId: 'm0',
      memberIds: ['m0', 'm4']
    },
    {
      id: 'p3',
      name: 'Checkout Omni Varejo',
      leadId: 'l6',
      company: 'Grupo Rede Sul',
      clientSegment: 'Varejo & E-commerce',
      phase: 'Discovery',
      originPhase: 'Discovery',
      status: 'Planejado',
      contractStatus: 'Contratado',
      contractValue: 36000,
      squadId: 'sq3',
      areaId: 'a3',
      ownerId: 'm3',
      memberIds: ['m3', 'm2']
    },
    {
      id: 'p4',
      name: 'Portal Clínico Integrado',
      leadId: 'l7',
      company: 'BioVida Diagnósticos',
      clientSegment: 'Saúde & Biotech',
      phase: 'Discovery',
      originPhase: 'Discovery',
      status: 'Planejado',
      contractStatus: 'Contratado',
      contractValue: null, // Sem valor informado -> excluído da média
      squadId: 'sq3',
      areaId: 'a3',
      ownerId: 'm3',
      memberIds: ['m3']
    },
    {
      id: 'p5',
      name: 'Experimentação Agente Interno',
      leadId: 'l5',
      company: 'Fintech Nordeste',
      clientSegment: 'Finanças & Pagamentos',
      phase: 'Delivery',
      originPhase: 'Discovery',
      status: 'Planejado',
      contractStatus: 'Sem contrato', // Sem contrato -> excluído da média
      contractValue: 28000,
      squadId: 'sq2',
      areaId: 'a0',
      ownerId: 'm0',
      memberIds: ['m0', 'm4']
    }
  ]
};

const STAGE_NOTES = {
  leads: {
    badge: 'Fonte confirmada + Modelo proposto',
    badgeClass: 'confirmed',
    title: '01. Leads & Qualificação Comercial (Segmento da Contratante)',
    text: 'A navegação começa em Leads. Cada oportunidade separa o Segmento da Empresa Contratante (usado no filtro comercial) da Subárea interna do CITi (definida na alocação operacional).'
  },
  projetos: {
    badge: 'Decisão pendente de validação (#9)',
    badgeClass: 'decision',
    title: '02. Projetos (Discovery / Delivery) & Valor Contratado',
    text: 'Cada projeto indica se está em Discovery ou Delivery, exibe o Valor Contratado (R$) e permite explorar diretamente o Squad responsável. Propomos validar se Discovery → Delivery operam como fases evolutivas de um mesmo projeto.'
  },
  squads: {
    badge: 'Hipótese operacional da demo',
    badgeClass: 'hypothesis',
    title: '03. Squads Alocados dentro de Projetos',
    text: 'Dentro de Projetos, o usuário inspeciona o Squad (ex.: Squad Maré, Squad Horus IA), identifica imediatamente a Subárea interna do CITi à qual pertence e vê a pessoa responsável e a equipe.'
  },
  subareas: {
    badge: 'Fonte confirmada (PDF: Inovação) + Estrutura da demo',
    badgeClass: 'confirmed',
    title: '04. Subárea Interna do CITi (Organização dos Squads)',
    text: 'O briefing oficial confirma o CITi como a maior EJ de tecnologia do Brasil e destaca o time de Inovação (focado em IA e visão de negócio). As demais subáreas (Desenvolvimento, Design) são mantidas como estrutura demonstrativa.'
  },
  integrantes: {
    badge: 'Vínculo relacional preservado',
    badgeClass: 'confirmed',
    title: '05. Integrantes & Pessoas Responsáveis',
    text: 'Fecha a esteira conectando cada integrante ao seu Squad, à sua Subárea interna do CITi e aos projetos em que atua como responsável ou membro.'
  },
  medias: {
    badge: 'Decisão pendente de validação (#9)',
    badgeClass: 'decision',
    title: '∑. Visão de Valor Médio Contratado & Regras de Elegibilidade',
    text: 'Exibe a média em reais (R$), a quantidade de projetos elegíveis no denominador e o agrupamento ativo (Subárea do CITi vs. Segmento da Contratante), ignorando projetos sem valor ou sem contrato.'
  }
};

const state = {
  viewport: 'desktop',
  mode3d: true,
  step: 'leads',
  selectedLeadId: 'l3',
  selectedProjectId: 'p1',
  selectedSquadId: 'sq1',
  selectedAreaId: 'a2',
  filterSegment: '',
  filterPhase: '',
  filterAreaId: '',
  avgGrouping: 'both' // 'both' | 'subarea' | 'segment'
};

function formatBRL(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 'Sem valor informado';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getSubareaName(areaId) {
  return DEMO_DATA.subareas.find((a) => a.id === areaId)?.name || 'Subárea';
}

function getSquad(squadId) {
  return DEMO_DATA.squads.find((s) => s.id === squadId);
}

function getMember(memberId) {
  return DEMO_DATA.members.find((m) => m.id === memberId);
}

// Explicit Eligibility & Average Calculation Rule proposed for validation
function isProjectEligibleForAverage(project) {
  return (
    project.contractStatus === 'Contratado' &&
    typeof project.contractValue === 'number' &&
    Number.isFinite(project.contractValue) &&
    project.contractValue > 0
  );
}

function getFilteredProjects() {
  return DEMO_DATA.projects.filter((p) => {
    if (state.filterSegment && p.clientSegment !== state.filterSegment) return false;
    if (state.filterPhase && p.phase !== state.filterPhase) return false;
    if (state.filterAreaId && p.areaId !== state.filterAreaId) return false;
    return true;
  });
}

function computeAverageStats() {
  const filtered = getFilteredProjects();
  const eligible = filtered.filter(isProjectEligibleForAverage);
  const withoutValue = filtered.filter((p) => p.contractStatus === 'Contratado' && (!p.contractValue || p.contractValue <= 0));
  const withoutContract = filtered.filter((p) => p.contractStatus !== 'Contratado');

  const totalValue = eligible.reduce((acc, p) => acc + p.contractValue, 0);
  const average = eligible.length > 0 ? totalValue / eligible.length : null;

  const bySubarea = DEMO_DATA.subareas.map((area) => {
    const inGroup = filtered.filter((p) => p.areaId === area.id);
    const eligGroup = inGroup.filter(isProjectEligibleForAverage);
    const sum = eligGroup.reduce((acc, p) => acc + p.contractValue, 0);
    return {
      key: area.id,
      label: area.name,
      kind: 'Subárea do CITi',
      average: eligGroup.length ? sum / eligGroup.length : null,
      eligibleCount: eligGroup.length,
      totalInGroup: inGroup.length
    };
  });

  const bySegment = DEMO_DATA.segments.map((segment) => {
    const inGroup = filtered.filter((p) => p.clientSegment === segment);
    const eligGroup = inGroup.filter(isProjectEligibleForAverage);
    const sum = eligGroup.reduce((acc, p) => acc + p.contractValue, 0);
    return {
      key: segment,
      label: segment,
      kind: 'Segmento da Contratante',
      average: eligGroup.length ? sum / eligGroup.length : null,
      eligibleCount: eligGroup.length,
      totalInGroup: inGroup.length
    };
  });

  return {
    filtered,
    eligible,
    withoutValue,
    withoutContract,
    average,
    bySubarea,
    bySegment
  };
}

function renderShowcase(stats) {
  const noteKey = state.step === 'projetos' ? 'projetos' : state.step;
  const note = STAGE_NOTES[noteKey] || STAGE_NOTES.leads;

  const nodes = [
    {
      step: 'leads',
      num: '01',
      title: 'Lead Comercial',
      caption: 'Empresa contratante + Segmento comercial',
      metric: `${DEMO_DATA.leads.length} leads · 3 segmentos`
    },
    {
      step: 'projetos',
      num: '02',
      title: 'Projeto (Discovery / Delivery)',
      caption: 'Fase, valor contratado (R$) e contrato',
      metric: `${ stats.filtered.length } no recorte (${ stats.eligible.length } elegíveis)`
    },
    {
      step: 'projetos',
      subFocus: 'squad',
      num: '03',
      title: 'Squad Alocado',
      caption: 'Explorado dentro de Projetos com líder e time',
      metric: `${DEMO_DATA.squads.length} squads ativos`
    },
    {
      step: 'subareas',
      num: '04',
      title: 'Subárea Interna CITi',
      caption: 'Organiza os squads por especialidade interna',
      metric: `${DEMO_DATA.subareas.length} subáreas (Inovação, Dev, Design)`
    },
    {
      step: 'integrantes',
      num: '05',
      title: 'Integrantes',
      caption: 'Pessoas responsáveis pela entrega em cada squad',
      metric: `${DEMO_DATA.members.length} membros vinculados`
    }
  ];

  return `
    <div class="scene3d-card ${state.mode3d ? '' : 'is-static'}" id="scene3d-card">
      <div class="scene3d-header">
        <div>
          <span class="eyebrow">● APRESENTAÇÃO ESPACIAL DA ESTEIRA · CARREGAMENTO SOB DEMANDA</span>
          <h2 class="scene3d-title">Lead → Projeto → Squad → Subárea → Integrantes</h2>
          <p class="scene3d-sub">
            Inspirada no ritmo e na profundidade das apresentações de produto da Apple. Passe o cursor para inclinar os planos 3D ou clique em qualquer estação da esteira.
          </p>
        </div>
        <div class="scene3d-controls">
          <button type="button" class="glass-chip-btn" id="toggle-static-inline">
            ${state.mode3d ? 'Alternar p/ Versão Estática (Reduced Motion)' : 'Ativar Profundidade 3D Interativa'}
          </button>
          <button type="button" class="glass-chip-btn" data-goto-step="medias">
            Ver Regras de Média (R$) →
          </button>
        </div>
      </div>

      <div class="scene3d-viewport" id="scene3d-viewport">
        <div class="scene3d-deck" id="scene3d-deck">
          ${nodes
            .map(
              (n, idx) => `
            <button
              type="button"
              class="scene3d-node ${state.step === n.step && !(idx === 2 && state.step !== 'projetos') ? 'active' : ''}"
              data-goto-step="${n.step}"
              style="--tz: ${(idx + 1) * 6}px"
            >
              <div class="node-step-row">
                <span>ETAPA ${n.num}</span>
                <span>→</span>
              </div>
              <div class="node-title">${n.title}</div>
              <div class="node-caption">${n.caption}</div>
              <div class="node-metric">
                <span>${n.metric}</span>
              </div>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="context-note-bar">
        <span class="legend-chip ${note.badgeClass}">${note.badge}</span>
        <div class="context-note-text">
          <strong>${note.title}:</strong> ${note.text}
        </div>
      </div>
    </div>
  `;
}

function renderFilterBar(stats) {
  const activeFilters = [
    state.filterSegment ? `Segmento: ${state.filterSegment}` : 'Todos os segmentos',
    state.filterPhase ? `Fase: ${state.filterPhase}` : 'Discovery + Delivery',
    state.filterAreaId ? `Subárea: ${getSubareaName(state.filterAreaId)}` : 'Todas as subáreas'
  ].join(' · ');

  const groupingLabel =
    state.avgGrouping === 'both'
      ? 'Dupla visão (Subárea CITi + Segmento Contratante)'
      : state.avgGrouping === 'subarea'
      ? 'Subárea interna do CITi'
      : 'Segmento da empresa contratante';

  return `
    <div class="glass-command-bar glass-surface">
      <div class="filter-grid">
        <label class="glass-field">
          <span class="glass-field-label">
            <span>Segmento da Contratante</span>
            <strong class="glass-field-tag">Filtro Comercial</strong>
          </span>
          <select id="filter-segment" class="glass-select">
            <option value="">Todos os segmentos (${DEMO_DATA.segments.length})</option>
            ${DEMO_DATA.segments
              .map(
                (seg) =>
                  `<option value="${seg}" ${state.filterSegment === seg ? 'selected' : ''}>${seg}</option>`
              )
              .join('')}
          </select>
        </label>

        <label class="glass-field">
          <span class="glass-field-label">
            <span>Fase / Modalidade</span>
            <strong class="glass-field-tag">Discovery / Delivery</strong>
          </span>
          <select id="filter-phase" class="glass-select">
            <option value="">Ambos (Discovery + Delivery)</option>
            <option value="Discovery" ${state.filterPhase === 'Discovery' ? 'selected' : ''}>Discovery</option>
            <option value="Delivery" ${state.filterPhase === 'Delivery' ? 'selected' : ''}>Delivery</option>
          </select>
        </label>

        <label class="glass-field">
          <span class="glass-field-label">
            <span>Subárea Interna do CITi</span>
            <strong class="glass-field-tag">Filtro de Squads</strong>
          </span>
          <select id="filter-area" class="glass-select">
            <option value="">Todas as subáreas (${DEMO_DATA.subareas.length})</option>
            ${DEMO_DATA.subareas
              .map(
                (a) =>
                  `<option value="${a.id}" ${state.filterAreaId === a.id ? 'selected' : ''}>${a.name}</option>`
              )
              .join('')}
          </select>
        </label>

        <label class="glass-field">
          <span class="glass-field-label">
            <span>Agrupamento da Média</span>
            <strong class="glass-field-tag">Validação #9</strong>
          </span>
          <select id="filter-grouping" class="glass-select">
            <option value="both" ${state.avgGrouping === 'both' ? 'selected' : ''}>Oferecer as 2 visões (Recomendado)</option>
            <option value="subarea" ${state.avgGrouping === 'subarea' ? 'selected' : ''}>Por Subárea interna do CITi</option>
            <option value="segment" ${state.avgGrouping === 'segment' ? 'selected' : ''}>Por Segmento da contratante</option>
          </select>
        </label>
      </div>

      <div class="avg-summary-strip">
        <div>
          <span class="eyebrow">VALOR MÉDIO CONTRATADO NO RECORTE ATIVO</span>
          <div class="avg-primary-box">
            ${
              stats.average !== null
                ? `<strong class="avg-value">${formatBRL(stats.average)}</strong>
                   <span class="avg-meta">base: <strong>${stats.eligible.length}</strong> de ${stats.filtered.length} projeto(s) no recorte</span>`
                : `<strong class="avg-value empty-avg">— Sem projetos elegíveis para média</strong>
                   <span class="avg-meta">0 de ${stats.filtered.length} projeto(s) cumprem contrato + valor &gt; R$ 0</span>`
            }
          </div>
        </div>

        <div class="avg-rule-pill">
          <strong>Agrupamento ativo:</strong> ${groupingLabel}<br/>
          <span style="color:var(--text-muted)">${activeFilters}</span>
        </div>

        <div class="avg-rule-pill">
          <strong>Excluídos do denominador:</strong>
          ${stats.withoutValue.length} sem valor · ${stats.withoutContract.length} sem contrato
          ${
            state.filterSegment || state.filterPhase || state.filterAreaId
              ? `<button type="button" class="link-inline" id="btn-clear-filters" style="margin-left:8px">Limpar filtros ↺</button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function renderLeadsStep() {
  const leads = DEMO_DATA.leads.filter(
    (l) => !state.filterSegment || l.clientSegment === state.filterSegment
  );
  const selectedLead = leads.find((l) => l.id === state.selectedLeadId) || leads[0];
  const linkedProject = selectedLead?.projectId
    ? DEMO_DATA.projects.find((p) => p.id === selectedLead.projectId)
    : null;
  const linkedSquad = linkedProject ? getSquad(linkedProject.squadId) : null;

  return `
    <div class="trail-banner">
      <div>
        <span class="eyebrow">ETAPA 01 DA ESTEIRA · ENTRADA PRINCIPAL DA NAVEGAÇÃO</span>
        <h1>Leads &amp; Empresas Contratantes</h1>
        <p>
          A navegação começa em <strong>Leads</strong>. O <strong>Segmento da Contratante</strong> alimenta o filtro comercial, separado da <strong>Subárea interna do CITi</strong> que organiza os squads na conversão.
        </p>
      </div>
      <button type="button" class="btn-magnetic" data-goto-step="projetos">
        <span class="btn-magnetic-inner">Avançar para Projetos &amp; Squads (Etapa 02) →</span>
      </button>
    </div>

    <div class="columns-2">
      <div>
        <div class="section-head">
          <h2>Oportunidades comerciais (${leads.length})</h2>
          <span>Clique em um lead para inspecionar contratante e projeto</span>
        </div>
        <div class="row-list">
          ${leads
            .map(
              (l) => `
            <button
              type="button"
              class="row-item ${selectedLead?.id === l.id ? 'selected' : ''}"
              data-select-lead="${l.id}"
            >
              <div class="row-main">
                <div class="row-title-line">
                  <span class="badge ${l.stage === 'Ganho' ? 'green' : 'amber'}">${l.stage}</span>
                  <span class="badge">${l.clientSegment}</span>
                  <span class="row-title">${l.name}</span>
                </div>
                <div class="row-sub">
                  Contratante: <strong style="color:var(--text-primary)">${l.company}</strong> ·
                  Valor estimado: ${l.estimatedValue ? formatBRL(l.estimatedValue) : 'A definir'}
                </div>
              </div>
              <span class="row-action">${l.projectId ? 'Ver vínculo →' : 'Qualificar →'}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      ${
        selectedLead
          ? `
        <aside class="inspector-panel glass-surface">
          <span class="eyebrow">FICHA DO LEAD &amp; PASSAGEM DE BASTÃO</span>
          <h2 style="margin:6px 0 4px;font-size:20px">${selectedLead.name}</h2>
          <p style="margin:0 0 12px;font-size:12.5px;color:var(--text-secondary)">
            Separação explícita entre os dados comerciais da contratante e a alocação operacional do squad.
          </p>

          <dl class="spec-list">
            <div class="spec-row">
              <dt>Empresa contratante</dt>
              <dd>${selectedLead.company}</dd>
            </div>
            <div class="spec-row">
              <dt>Segmento comercial</dt>
              <dd><span class="badge green">${selectedLead.clientSegment}</span></dd>
            </div>
            <div class="spec-row">
              <dt>Contato no cliente</dt>
              <dd>${selectedLead.contact}</dd>
            </div>
            <div class="spec-row">
              <dt>Estágio comercial</dt>
              <dd>${selectedLead.stage} ${selectedLead.projectId ? '(travado após conversão)' : ''}</dd>
            </div>
            <div class="spec-row">
              <dt>Valor estimado (Lead)</dt>
              <dd>${selectedLead.estimatedValue ? formatBRL(selectedLead.estimatedValue) : 'Não informado na prospecção'}</dd>
            </div>
          </dl>

          ${
            linkedProject
              ? `
            <div class="squad-explorer-box">
              <span class="eyebrow">PROJETO VINCULADO (RELAÇÃO 1:1)</span>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0">
                <strong style="font-size:15px">${linkedProject.name}</strong>
                <span class="badge ${linkedProject.phase === 'Discovery' ? 'discovery' : 'delivery'}">${linkedProject.phase}</span>
              </div>
              <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 12px">
                Squad: <strong style="color:var(--text-primary)">${linkedSquad?.name}</strong> ·
                Subárea CITi: <strong style="color:var(--text-primary)">${getSubareaName(linkedProject.areaId)}</strong> ·
                Valor contratado: <strong style="color:var(--citi-green)">${formatBRL(linkedProject.contractValue)}</strong>
              </p>
              <button type="button" class="btn-magnetic" data-open-project="${linkedProject.id}">
                <span class="btn-magnetic-inner">Abrir projeto e explorar ${linkedSquad?.name} →</span>
              </button>
            </div>
          `
              : `
            <div class="squad-explorer-box">
              <span class="eyebrow">PRÓXIMO PASSO NA ESTEIRA</span>
              <p style="font-size:12.5px;color:var(--text-secondary);margin:6px 0 12px">
                Ao avançar para <strong>Ganho</strong>, a conversão solicita Fase inicial (Discovery/Delivery), Valor contratado (R$), Subárea interna do CITi, Squad e Pessoa responsável.
              </p>
            </div>
          `
          }
        </aside>
      `
          : ''
      }
    </div>
  `;
}

function renderProjetosStep(stats) {
  const projects = stats.filtered;
  const selectedProject =
    projects.find((p) => p.id === state.selectedProjectId) ||
    projects[0] ||
    DEMO_DATA.projects[0];
  const squad = selectedProject ? getSquad(selectedProject.squadId) : null;
  const owner = selectedProject ? getMember(selectedProject.ownerId) : null;
  const eligible = selectedProject ? isProjectEligibleForAverage(selectedProject) : false;

  return `
    <div class="trail-banner">
      <div>
        <span class="eyebrow">ETAPAS 02 &amp; 03 DA ESTEIRA · PROJETOS → SQUADS → SUBÁREA → RESPONSÁVEIS</span>
        <h1>Projetos, Fase (Discovery / Delivery) &amp; Squads</h1>
        <p>
          Dentro de <strong>Projetos</strong>, identifique se é <strong>Discovery</strong> ou <strong>Delivery</strong>, confira o valor contratado e explore o <strong>Squad</strong> com sua <strong>Subárea interna do CITi</strong> e as pessoas responsáveis.
        </p>
      </div>
      <button type="button" class="btn-magnetic" data-goto-step="subareas">
        <span class="btn-magnetic-inner">Inspecionar Subáreas do CITi (Etapa 04) →</span>
      </button>
    </div>

    ${
      projects.length === 0
        ? `
      <div class="empty-state-box">
        <strong>Nenhum projeto encontrado para os filtros ativos.</strong>
        <p style="margin:6px 0 0;color:var(--text-secondary)">
          Ajuste Segmento da Contratante, Fase (Discovery/Delivery) ou Subárea na barra Liquid Glass acima.
        </p>
      </div>
    `
        : `
      <div class="columns-2">
        <div>
          <div class="section-head">
            <h2>Projetos no recorte (${projects.length})</h2>
            <span>Discovery / Delivery · Valor · Squad e Subárea</span>
          </div>
          <div class="row-list">
            ${projects
              .map((p) => {
                const sq = getSquad(p.squadId);
                const resp = getMember(p.ownerId);
                const isElig = isProjectEligibleForAverage(p);
                return `
                  <button
                    type="button"
                    class="row-item ${selectedProject?.id === p.id ? 'selected' : ''}"
                    data-select-project="${p.id}"
                  >
                    <div class="row-main">
                      <div class="row-title-line">
                        <span class="badge ${p.phase === 'Discovery' ? 'discovery' : 'delivery'}">${p.phase}</span>
                        <span class="badge ${isElig ? 'green' : 'amber'}">
                          ${isElig ? formatBRL(p.contractValue) : p.contractStatus !== 'Contratado' ? 'Sem contrato (fora da média)' : 'Sem valor (fora da média)'}
                        </span>
                        <span class="row-title">${p.name}</span>
                      </div>
                      <div class="row-sub">
                        Contratante: <strong>${p.company}</strong> (${p.clientSegment})<br/>
                        Squad: <strong style="color:var(--citi-green)">${sq?.name}</strong> ·
                        Subárea CITi: <strong style="color:var(--text-primary)">${getSubareaName(p.areaId)}</strong> ·
                        Resp.: <strong style="color:var(--text-primary)">${resp?.name}</strong>
                      </div>
                    </div>
                    <span class="row-action">Explorar squad →</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>

        ${
          selectedProject
            ? `
          <aside class="inspector-panel glass-surface">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="eyebrow">DETALHE DO PROJETO &amp; SQUAD ALOCADO</span>
              <span class="legend-chip decision">Validação: Discovery → Delivery</span>
            </div>
            <h2 style="margin:6px 0 4px;font-size:21px">${selectedProject.name}</h2>

            <dl class="spec-list">
              <div class="spec-row">
                <dt>Fase / Tipo atual</dt>
                <dd style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span class="badge ${selectedProject.phase === 'Discovery' ? 'discovery' : 'delivery'}">${selectedProject.phase}</span>
                  <button type="button" class="glass-chip-btn" id="btn-toggle-phase" data-project-id="${selectedProject.id}">
                    Simular transição p/ ${selectedProject.phase === 'Discovery' ? 'Delivery' : 'Discovery'} ⇄
                  </button>
                </dd>
              </div>
              <div class="spec-row">
                <dt>Empresa &amp; Segmento</dt>
                <dd>${selectedProject.company} · <span class="badge">${selectedProject.clientSegment}</span></dd>
              </div>
              <div class="spec-row">
                <dt>Valor contratado</dt>
                <dd>
                  <strong style="color:${eligible ? 'var(--citi-green)' : 'var(--amber-text)'}">
                    ${formatBRL(selectedProject.contractValue)}
                  </strong>
                  <small style="display:block;color:var(--text-secondary);font-weight:400">
                    ${
                      eligible
                        ? '✓ Elegível no cálculo de valor médio (Contrato ativo + valor > R$ 0)'
                        : `✗ Ignorado no denominador da média (${selectedProject.contractStatus !== 'Contratado' ? 'Projeto sem contrato assinado' : 'Projeto sem valor informado'})`
                    }
                  </small>
                </dd>
              </div>
              <div class="spec-row">
                <dt>Lead de origem</dt>
                <dd>
                  <button type="button" class="link-inline" data-open-lead="${selectedProject.leadId}">
                    ← Abrir Lead (${selectedProject.name})
                  </button>
                </dd>
              </div>
            </dl>

            <div class="squad-explorer-box">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
                <div>
                  <span class="eyebrow">ETAPA 03 · SQUAD RESPONSÁVEL DENTRO DO PROJETO</span>
                  <h3 style="margin:4px 0;font-size:17px">${squad?.name}</h3>
                  <p style="margin:0;font-size:12px;color:var(--text-secondary)">${squad?.specialty}</p>
                </div>
                <button type="button" class="link-inline" data-open-area="${selectedProject.areaId}">
                  Subárea: ${getSubareaName(selectedProject.areaId)} →
                </button>
              </div>

              <div class="member-Running-list">
                ${selectedProject.memberIds
                  .map((mId) => {
                    const m = getMember(mId);
                    const isOwner = mId === selectedProject.ownerId;
                    return `
                      <div class="member-pill-row">
                        <div style="display:flex;align-items:center;gap:8px">
                          <span class="avatar-circle">${m?.initials}</span>
                          <div>
                            <strong>${m?.name}</strong>
                            <div style="font-size:11px;color:var(--text-secondary)">${m?.role} · ${getSubareaName(m?.areaId)}</div>
                          </div>
                        </div>
                        <span class="badge ${isOwner ? 'green' : ''}">${isOwner ? 'Responsável' : 'Integrante do Squad'}</span>
                      </div>
                    `;
                  })
                  .join('')}
              </div>

              <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
                <button type="button" class="btn-magnetic" data-open-area="${selectedProject.areaId}">
                  <span class="btn-magnetic-inner">Ir para Subárea (${getSubareaName(selectedProject.areaId)}) →</span>
                </button>
              </div>
            </div>
          </aside>
        `
            : ''
        }
      </div>
    `
    }
  `;
}

function renderSubareasStep(stats) {
  const selectedArea =
    DEMO_DATA.subareas.find((a) => a.id === state.selectedAreaId) || DEMO_DATA.subareas[0];
  const areaSquads = DEMO_DATA.squads.filter((s) => s.areaId === selectedArea.id);
  const areaProjects = DEMO_DATA.projects.filter((p) => p.areaId === selectedArea.id);
  const areaMembers = DEMO_DATA.members.filter((m) => m.areaId === selectedArea.id);
  const areaStat = stats.bySubarea.find((s) => s.key === selectedArea.id);

  return `
    <div class="trail-banner">
      <div>
        <span class="eyebrow">ETAPA 04 DA ESTEIRA · SUBÁREAS INTERNAS DO CITi (ORGANIZAÇÃO DOS SQUADS)</span>
        <h1>Subáreas Internas &amp; Squads do CITi</h1>
        <p>
          Separa a estrutura interna do CITi (que organiza os squads e especialistas) do segmento de mercado da empresa contratante.
        </p>
      </div>
      <button type="button" class="btn-magnetic" data-goto-step="integrantes">
        <span class="btn-magnetic-inner">Ver Diretório de Integrantes (Etapa 05) →</span>
      </button>
    </div>

    <div class="columns-2">
      <div>
        <div class="section-head">
          <h2>Subáreas do CITi (${DEMO_DATA.subareas.length})</h2>
          <span>Squads, projetos e valor médio por subárea</span>
        </div>
        <div class="row-list">
          ${DEMO_DATA.subareas
            .map((a) => {
              const sCount = DEMO_DATA.squads.filter((s) => s.areaId === a.id).length;
              const pCount = DEMO_DATA.projects.filter((p) => p.areaId === a.id).length;
              const st = stats.bySubarea.find((item) => item.key === a.id);
              return `
                <button
                  type="button"
                  class="row-item ${selectedArea.id === a.id ? 'selected' : ''}"
                  data-select-area="${a.id}"
                >
                  <div class="row-main">
                    <div class="row-title-line">
                      <span class="badge green">${sCount} squad(s)</span>
                      <span class="row-title">${a.name}</span>
                    </div>
                    <div class="row-sub">
                      ${a.focus}<br/>
                      Média no recorte: <strong style="color:var(--citi-green)">${st?.average ? formatBRL(st.average) : 'Sem base elegível'}</strong>
                      (${st?.eligibleCount || 0} de ${pCount} projeto(s) elegíveis)
                    </div>
                  </div>
                  <span class="row-action">Inspecionar →</span>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <aside class="inspector-panel glass-surface">
        <span class="eyebrow">SUBÁREA SELECIONADA · SQUADS &amp; PESSOAS</span>
        <h2 style="margin:6px 0 4px;font-size:20px">${selectedArea.name}</h2>
        <p style="margin:0 0 12px;font-size:12.5px;color:var(--text-secondary)">${selectedArea.focus}</p>

        <div class="avg-rule-pill" style="margin-bottom:14px">
          <strong>Valor médio da subárea no recorte:</strong>
          <span style="color:var(--citi-green);font-weight:700;margin-left:6px">
            ${areaStat?.average ? formatBRL(areaStat.average) : '— Sem base elegível'}
          </span>
          <span style="display:block;color:var(--text-secondary);margin-top:2px">
            Calculado sobre ${areaStat?.eligibleCount || 0} projeto(s) com contrato ativo e valor &gt; R$ 0.
          </span>
        </div>

        <div class="section-head">
          <h2>Squads desta Subárea (${areaSquads.length})</h2>
          <span>Vinculados aos projetos</span>
        </div>
        ${areaSquads
          .map((sq) => {
            const leader = getMember(sq.ownerId);
            return `
              <div class="squad-explorer-box" style="margin-top:8px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <strong>${sq.name}</strong>
                  <span class="badge green">Líder: ${leader?.name}</span>
                </div>
                <p style="margin:4px 0 8px;font-size:12px;color:var(--text-secondary)">${sq.specialty}</p>
                <div style="font-size:12px;color:var(--text-primary)">
                  Integrantes: ${sq.memberIds.map((id) => getMember(id)?.name).join(', ')}
                </div>
              </div>
            `;
          })
          .join('')}

        <div class="section-head" style="margin-top:16px">
          <h2>Integrantes de ${selectedArea.name} (${areaMembers.length})</h2>
          <span>Pessoas responsáveis</span>
        </div>
        <div class="member-Running-list">
          ${areaMembers
            .map(
              (m) => `
            <div class="member-pill-row">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="avatar-circle">${m.initials}</span>
                <div>
                  <strong>${m.name}</strong>
                  <div style="font-size:11px;color:var(--text-secondary)">${m.role}</div>
                </div>
              </div>
              <button type="button" class="link-inline" data-goto-step="integrantes">Ver perfil →</button>
            </div>
          `
            )
            .join('')}
        </div>
      </aside>
    </div>
  `;
}

function renderIntegrantesStep() {
  const members = DEMO_DATA.members.filter(
    (m) => !state.filterAreaId || m.areaId === state.filterAreaId
  );

  return `
    <div class="trail-banner">
      <div>
        <span class="eyebrow">ETAPA 05 DA ESTEIRA · PESSOAS RESPONSÁVEIS NOS SQUADS</span>
        <h1>Integrantes, Squads &amp; Responsabilidades</h1>
        <p>
          Finaliza o percurso <strong>Lead → Projeto → Squad → Subárea → Integrantes</strong> exibindo a alocação de cada pessoa nos squads e projetos da Central.
        </p>
      </div>
      <button type="button" class="btn-magnetic" data-goto-step="medias">
        <span class="btn-magnetic-inner">Conferir Visão de Valor Médio &amp; Regras →</span>
      </button>
    </div>

    <div class="row-list">
      ${members
        .map((m) => {
          const sq = getSquad(m.squadId);
          const leadProjects = DEMO_DATA.projects.filter((p) => p.ownerId === m.id);
          const memberProjects = DEMO_DATA.projects.filter((p) => p.memberIds.includes(m.id));
          return `
            <div class="row-item" style="cursor:default">
              <div class="row-main">
                <div class="row-title-line">
                  <span class="avatar-circle">${m.initials}</span>
                  <span class="row-title">${m.name}</span>
                  <span class="badge green">${getSubareaName(m.areaId)}</span>
                  <span class="badge">${sq?.name}</span>
                </div>
                <div class="row-sub">
                  ${m.role} · Responsável direto por <strong>${leadProjects.length}</strong> projeto(s) · Alocado em <strong>${memberProjects.length}</strong> projeto(s) (${memberProjects.map((p) => p.name).join(', ')})
                </div>
              </div>
              <button type="button" class="link-inline" data-open-area="${m.areaId}">
                Subárea ${getSubareaName(m.areaId)} →
              </button>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderMediasStep(stats) {
  const maxVal = 80000;
  const showSubarea = state.avgGrouping === 'both' || state.avgGrouping === 'subarea';
  const showSegment = state.avgGrouping === 'both' || state.avgGrouping === 'segment';

  return `
    <div class="trail-banner">
      <div>
        <span class="eyebrow">PAINEL DE DECISÃO &amp; AUDITORIA DE CÁLCULO · VALIDAÇÃO #9</span>
        <h1>Valor Médio Contratado &amp; Regras de Elegibilidade</h1>
        <p>
          Demonstração explícita de como a média em reais (R$) responde aos filtros combinados, ao agrupamento (Subárea do CITi vs. Segmento da Contratante) e às regras de exclusão de projetos sem valor ou sem contrato.
        </p>
      </div>
      <button type="button" class="btn-magnetic" data-goto-step="leads">
        <span class="btn-magnetic-inner">Reiniciar percurso em Leads ↺</span>
      </button>
    </div>

    <div class="columns-2">
      ${
        showSubarea
          ? `
        <div class="inspector-panel glass-surface">
          <div class="section-head">
            <h2>Visão A · Média por Subárea Interna do CITi</h2>
            <span>Organização dos Squads</span>
          </div>
          <div class="avg-bars">
            ${stats.bySubarea
              .map((item) => {
                const pct = item.average ? Math.min(100, Math.round((item.average / maxVal) * 100)) : 0;
                return `
                  <div class="avg-bar-row">
                    <div class="avg-bar-top">
                      <strong>${item.label}</strong>
                      <strong style="color:${item.average ? 'var(--citi-green)' : 'var(--amber-text)'}">
                        ${item.average ? formatBRL(item.average) : '— Sem projetos elegíveis'}
                      </strong>
                    </div>
                    <div class="avg-bar-track">
                      <div class="avg-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="avg-bar-sub">
                      <span>Base do cálculo: <strong>${item.eligibleCount}</strong> projeto(s) elegível(is)</span>
                      <span>Total na subárea (recorte): ${item.totalInGroup}</span>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      ${
        showSegment
          ? `
        <div class="inspector-panel glass-surface">
          <div class="section-head">
            <h2>Visão B · Média por Segmento da Contratante</h2>
            <span>Filtro Comercial de Mercado</span>
          </div>
          <div class="avg-bars">
            ${stats.bySegment
              .map((item) => {
                const pct = item.average ? Math.min(100, Math.round((item.average / maxVal) * 100)) : 0;
                return `
                  <div class="avg-bar-row">
                    <div class="avg-bar-top">
                      <strong>${item.label}</strong>
                      <strong style="color:${item.average ? 'var(--citi-green)' : 'var(--amber-text)'}">
                        ${item.average ? formatBRL(item.average) : '— Sem projetos elegíveis'}
                      </strong>
                    </div>
                    <div class="avg-bar-track">
                      <div class="avg-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="avg-bar-sub">
                      <span>Base do cálculo: <strong>${item.eligibleCount}</strong> projeto(s) elegível(is)</span>
                      <span>Total no segmento (recorte): ${item.totalInGroup}</span>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

function bindMagneticButtons() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || coarse) return;

  document.querySelectorAll('.btn-magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const tx = Math.max(-4, Math.min(4, dx * 0.12));
      const ty = Math.max(-4, Math.min(4, dy * 0.18));
      btn.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      btn.style.setProperty('--ty', `${ty.toFixed(1)}px`);
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--tx', '0px');
      btn.style.setProperty('--ty', '0px');
    });
  });
}

function bind3DShowcaseTilt() {
  const card = document.getElementById('scene3d-card');
  const deck = document.getElementById('scene3d-deck');
  if (!card || !deck || !state.mode3d) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  card.addEventListener('pointermove', (e) => {
    if (state.viewport === 'mobile' || !state.mode3d) return;
    const rect = card.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    deck.style.setProperty('--ry', `${(nx * 10).toFixed(2)}deg`);
    deck.style.setProperty('--rx', `${(6 - ny * 8).toFixed(2)}deg`);
  });

  card.addEventListener('pointerleave', () => {
    deck.style.setProperty('--ry', '-4deg');
    deck.style.setProperty('--rx', '7deg');
  });
}

function setViewport(mode) {
  state.viewport = mode;
  const stage = document.getElementById('viewport-stage');
  stage.classList.toggle('is-mobile', mode === 'mobile');
  document.getElementById('btn-desktop').setAttribute('aria-pressed', String(mode === 'desktop'));
  document.getElementById('btn-mobile').setAttribute('aria-pressed', String(mode === 'mobile'));
}

function toggle3DMode() {
  state.mode3d = !state.mode3d;
  const btn = document.getElementById('btn-3d-mode');
  btn.setAttribute('aria-pressed', String(state.mode3d));
  btn.textContent = state.mode3d ? 'Cena 3D: Ativa' : 'Cena 3D: Estática (Fallback)';
  render();
}

function render() {
  const stats = computeAverageStats();

  // Top nav active state
  document.querySelectorAll('.topnav button').forEach((btn) => {
    if (btn.dataset.step === state.step) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  document.getElementById('pipeline-showcase').innerHTML = renderShowcase(stats);
  document.getElementById('glass-filter-bar').innerHTML = renderFilterBar(stats);

  const stageContainer = document.getElementById('stage-content');
  if (state.step === 'leads') stageContainer.innerHTML = renderLeadsStep();
  else if (state.step === 'projetos') stageContainer.innerHTML = renderProjetosStep(stats);
  else if (state.step === 'subareas') stageContainer.innerHTML = renderSubareasStep(stats);
  else if (state.step === 'integrantes') stageContainer.innerHTML = renderIntegrantesStep();
  else stageContainer.innerHTML = renderMediasStep(stats);

  // Event listeners for filters
  document.getElementById('filter-segment')?.addEventListener('change', (e) => {
    state.filterSegment = e.target.value;
    render();
  });
  document.getElementById('filter-phase')?.addEventListener('change', (e) => {
    state.filterPhase = e.target.value;
    render();
  });
  document.getElementById('filter-area')?.addEventListener('change', (e) => {
    state.filterAreaId = e.target.value;
    render();
  });
  document.getElementById('filter-grouping')?.addEventListener('change', (e) => {
    state.avgGrouping = e.target.value;
    render();
  });
  document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
    state.filterSegment = '';
    state.filterPhase = '';
    state.filterAreaId = '';
    render();
  });

  document.getElementById('toggle-static-inline')?.addEventListener('click', toggle3DMode);

  document.querySelectorAll('[data-goto-step]').forEach((el) => {
    el.addEventListener('click', () => {
      state.step = el.dataset.gotoStep;
      render();
    });
  });

  document.querySelectorAll('[data-select-lead]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedLeadId = el.dataset.selectLead;
      render();
    });
  });

  document.querySelectorAll('[data-select-project]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedProjectId = el.dataset.selectProject;
      render();
    });
  });

  document.querySelectorAll('[data-select-area]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedAreaId = el.dataset.selectArea;
      render();
    });
  });

  document.querySelectorAll('[data-open-project]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedProjectId = el.dataset.openProject;
      state.step = 'projetos';
      render();
    });
  });

  document.querySelectorAll('[data-open-lead]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedLeadId = el.dataset.openLead;
      state.step = 'leads';
      render();
    });
  });

  document.querySelectorAll('[data-open-area]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedAreaId = el.dataset.openArea;
      state.step = 'subareas';
      render();
    });
  });

  document.getElementById('btn-toggle-phase')?.addEventListener('click', (e) => {
    const pid = e.currentTarget.dataset.projectId;
    const proj = DEMO_DATA.projects.find((p) => p.id === pid);
    if (proj) {
      proj.phase = proj.phase === 'Discovery' ? 'Delivery' : 'Discovery';
      render();
    }
  });

  bindMagneticButtons();
  bind3DShowcaseTilt();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-desktop').addEventListener('click', () => setViewport('desktop'));
  document.getElementById('btn-mobile').addEventListener('click', () => setViewport('mobile'));
  document.getElementById('btn-3d-mode').addEventListener('click', toggle3DMode);
  document.getElementById('brand-link').addEventListener('click', (e) => {
    e.preventDefault();
    state.step = 'leads';
    render();
  });
  document.querySelectorAll('.topnav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.step = btn.dataset.step;
      render();
    });
  });
  render();
});

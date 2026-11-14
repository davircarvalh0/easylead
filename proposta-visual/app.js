const state = {
  viewport: 'desktop',
  step: 'inicio',
  projectStatus: 'Em andamento',
  converted: false
};

function bindMagneticButtons() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || coarse) return;

  document.querySelectorAll('.btn-magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const tx = Math.max(-5, Math.min(5, dx * 0.12));
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

function setStep(step) {
  state.step = step;
  render();
}

function setViewport(mode) {
  state.viewport = mode;
  const stage = document.getElementById('viewport-stage');
  stage.classList.toggle('is-mobile', mode === 'mobile');
  document.getElementById('btn-desktop').setAttribute('aria-pressed', String(mode === 'desktop'));
  document.getElementById('btn-mobile').setAttribute('aria-pressed', String(mode === 'mobile'));
}

function renderHome() {
  return `
    <section class="hero-band">
      <div>
        <span class="page-eyebrow">DO PRIMEIRO CONTATO À ENTREGA</span>
        <h1>O trabalho conectado. A equipe por perto.</h1>
        <p>Priorize oportunidades que pedem ação imediata e acompanhe projetos ativos com seus responsáveis.</p>
      </div>
      <button class="btn-magnetic" type="button" data-goto="lead">
        <span class="btn-magnetic-inner">Cadastrar oportunidade ↗</span>
      </button>
    </section>

    <section class="metrics-strip" aria-label="Indicadores principais">
      <button class="metric-item" type="button" data-goto="lead">
        <span class="metric-label">Leads abertos</span>
        <div class="metric-value-row">
          <strong class="metric-value">3</strong>
          <span class="metric-cta">Consultar →</span>
        </div>
      </button>
      <button class="metric-item" type="button" data-goto="projeto">
        <span class="metric-label">Projetos em andamento</span>
        <div class="metric-value-row">
          <strong class="metric-value accent">1</strong>
          <span class="metric-cta">Consultar →</span>
        </div>
      </button>
      <button class="metric-item" type="button" data-goto="lead">
        <span class="metric-label">Leads ganhos</span>
        <div class="metric-value-row">
          <strong class="metric-value">1</strong>
          <span class="metric-cta">Consultar →</span>
        </div>
      </button>
      <button class="metric-item" type="button" data-goto="projeto">
        <span class="metric-label">Total de projetos</span>
        <div class="metric-value-row">
          <strong class="metric-value">1</strong>
          <span class="metric-cta">Consultar →</span>
        </div>
      </button>
    </section>

    <section class="home-columns">
      <div>
        <div class="section-head">
          <h2>Leads que precisam de ação</h2>
          <span>Prioridade operacional</span>
        </div>
        <div class="row-list">
          <button class="row-item priority" type="button" data-goto="lead">
            <div class="row-main">
              <div class="row-title-line">
                <span class="badge green">Ganho · Pronto p/ converter</span>
                <span class="row-title">Plataforma Maré</span>
              </div>
              <div class="row-sub">Empresa exemplo 4 · contato4@example.com</div>
            </div>
            <span class="row-action">Converter →</span>
          </button>

          <button class="row-item" type="button" data-goto="lead">
            <div class="row-main">
              <div class="row-title-line">
                <span class="badge amber">Proposta</span>
                <span class="row-title">App Raiz</span>
              </div>
              <div class="row-sub">Empresa exemplo 3 · Acompanhar retorno da proposta</div>
            </div>
            <span class="row-action">Abrir →</span>
          </button>

          <button class="row-item" type="button" data-goto="lead">
            <div class="row-main">
              <div class="row-title-line">
                <span class="badge">Em contato</span>
                <span class="row-title">Loja Horizonte</span>
              </div>
              <div class="row-sub">Empresa exemplo 2 · Qualificar escopo</div>
            </div>
            <span class="row-action">Abrir →</span>
          </button>

          <button class="row-item" type="button" data-goto="lead">
            <div class="row-main">
              <div class="row-title-line">
                <span class="badge">Novo</span>
                <span class="row-title">Portal Aurora</span>
              </div>
              <div class="row-sub">Empresa exemplo 1 · Realizar primeiro contato</div>
            </div>
            <span class="row-action">Abrir →</span>
          </button>
        </div>
      </div>

      <div>
        <div class="section-head">
          <h2>Projetos em andamento</h2>
          <span>Com área e responsável</span>
        </div>
        <div class="row-list">
          <button class="row-item priority" type="button" data-goto="projeto">
            <div class="row-main">
              <div class="row-title-line">
                <span class="badge green">● ${state.projectStatus}</span>
                <span class="row-title">Plataforma Maré</span>
              </div>
              <div class="row-sub">
                Área: <strong style="color:var(--text-primary)">Desenvolvimento</strong> ·
                Resp.: <strong style="color:var(--text-primary)">Clara Luz</strong> (+1 na equipe)
              </div>
            </div>
            <span class="row-action">Ver projeto →</span>
          </button>
        </div>
      </div>
    </section>

    <section class="funnel-strip">
      <span class="page-eyebrow">O FUNIL EM PERSPECTIVA</span>
      <div class="funnel-grid">
        <div class="funnel-cell"><strong>1</strong>Novo</div>
        <div class="funnel-cell"><strong>1</strong>Em contato</div>
        <div class="funnel-cell"><strong>1</strong>Proposta</div>
        <div class="funnel-cell"><strong>1</strong>Ganho</div>
        <div class="funnel-cell"><strong>1</strong>Perdido</div>
      </div>
    </section>
  `;
}

function renderLead() {
  return `
    <span class="page-eyebrow">CENTRAL DO CITi / LEADS / PLATAFORMA MARÉ</span>
    <h1 style="margin:0 0 16px;font-size:26px">Leads</h1>
    <div style="border-top:1px solid var(--border-hairline)"></div>

    <div class="split-panel">
      <div class="form-section">
        <h2>Editar lead</h2>
        <label class="field">
          <span>Nome da oportunidade *</span>
          <input value="Plataforma Maré" readonly />
        </label>
        <label class="field">
          <span>Organização *</span>
          <input value="Empresa exemplo 4" readonly />
        </label>
        <label class="field">
          <span>Contato *</span>
          <input value="contato4@example.com" readonly />
        </label>
        <label class="field">
          <span>Estágio</span>
          <select disabled>
            <option selected>Ganho</option>
          </select>
        </label>
        <p style="font-size:12px;color:var(--text-secondary)">
          No estágio <strong>Ganho</strong>, a conversão fica disponível ao lado sem sair do contexto do lead.
        </p>
      </div>

      <div class="conversion-box">
        <span class="page-eyebrow">PASSAGEM DE BASTÃO COMERCIAL → OPERAÇÃO</span>
        <h2 style="margin:0 0 14px;font-size:18px">Converter em projeto</h2>
        <label class="field">
          <span>Nome do projeto *</span>
          <input value="Plataforma Maré" readonly />
        </label>
        <label class="field">
          <span>Área responsável *</span>
          <select disabled><option selected>Desenvolvimento</option></select>
        </label>
        <label class="field">
          <span>Responsável * (filtrado pela área)</span>
          <select disabled><option selected>Clara Luz · Desenvolvedora</option></select>
        </label>
        <div class="field">
          <span>Outros integrantes (opcional)</span>
          <div style="font-size:13px;color:var(--text-primary);padding:6px 0">☑ Ana Lima · Inovação</div>
        </div>
        <button class="btn-magnetic" type="button" data-goto="projeto">
          <span class="btn-magnetic-inner">Criar e abrir projeto vinculado →</span>
        </button>
      </div>
    </div>
  `;
}

function renderProjeto() {
  return `
    <span class="page-eyebrow">PROJETO VINCULADO AO LEAD</span>
    <div class="hero-band">
      <div>
        <h1>Plataforma Maré</h1>
        <p>Vínculo 1:1 preservado com o lead de origem, área e pessoas responsáveis.</p>
      </div>
      <label class="field" style="margin:0;min-width:210px">
        <span>Status do projeto</span>
        <select id="status-select">
          ${['Planejado', 'Em andamento', 'Concluído']
            .map((s) => `<option value="${s}" ${state.projectStatus === s ? 'selected' : ''}>${s}</option>`)
            .join('')}
        </select>
      </label>
    </div>

    <dl class="spec-list">
      <div class="spec-row">
        <dt>Área responsável</dt>
        <dd>
          <button class="link-inline" type="button" data-goto="area">Desenvolvimento →</button>
        </dd>
      </div>
      <div class="spec-row">
        <dt>Responsável</dt>
        <dd>
          <span class="avatar-chip">
            <span class="avatar-circle">CL</span>
            <span>Clara Luz <small style="color:var(--text-secondary);font-weight:400">· Desenvolvedora</small></span>
          </span>
        </dd>
      </div>
      <div class="spec-row">
        <dt>Equipe vinculada</dt>
        <dd>Clara Luz, Ana Lima</dd>
      </div>
      <div class="spec-row">
        <dt>Lead de origem</dt>
        <dd>
          <button class="link-inline" type="button" data-goto="lead">Plataforma Maré →</button>
        </dd>
      </div>
    </dl>

    <button class="btn-magnetic" type="button" data-goto="area">
      <span class="btn-magnetic-inner">Inspecionar área e responsáveis (Desenvolvimento) →</span>
    </button>
  `;
}

function renderArea() {
  return `
    <span class="page-eyebrow">ORGANIZAÇÃO · ÁREA E PESSOAS RESPONSÁVEIS</span>
    <div class="hero-band">
      <div>
        <h1>Desenvolvimento</h1>
        <p>Visão integrada das pessoas da área e dos projetos sob sua responsabilidade.</p>
      </div>
      <button class="studio-btn" type="button" data-goto="inicio">← Voltar ao início do percurso</button>
    </div>

    <div class="home-columns" style="border-bottom:0">
      <div>
        <div class="section-head">
          <h2>Integrantes da área</h2>
          <span>1 integrante</span>
        </div>
        <div class="row-list">
          <div class="row-item priority" style="cursor:default">
            <div class="row-main">
              <div class="row-title-line">
                <span class="avatar-circle">CL</span>
                <span class="row-title">Clara Luz</span>
                <span class="badge green">Responsável de projeto</span>
              </div>
              <div class="row-sub">Desenvolvedora · Área de Desenvolvimento</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="section-head">
          <h2>Projetos vinculados</h2>
          <span>1 projeto na área</span>
        </div>
        <div class="row-list">
          <button class="row-item priority" type="button" data-goto="projeto">
            <div class="row-main">
              <div class="row-title-line">
                <span class="badge green">${state.projectStatus}</span>
                <span class="row-title">Plataforma Maré</span>
              </div>
              <div class="row-sub">Desenvolvimento · Clara Luz · Equipe: Clara Luz, Ana Lima</div>
            </div>
            <span class="row-action">Ver projeto →</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function render() {
  const container = document.getElementById('stage-content');
  const navMap = { inicio: '/', lead: '/leads', projeto: '/projetos', area: '/organizacao' };
  document.querySelectorAll('.topnav button').forEach((btn) => {
    if (btn.dataset.route === navMap[state.step]) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
  document.querySelectorAll('.journey-step').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.step === state.step);
  });

  if (state.step === 'inicio') container.innerHTML = renderHome();
  else if (state.step === 'lead') container.innerHTML = renderLead();
  else if (state.step === 'projeto') container.innerHTML = renderProjeto();
  else container.innerHTML = renderArea();

  container.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => setStep(el.dataset.goto));
  });

  const statusSelect = document.getElementById('status-select');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      state.projectStatus = e.target.value;
      render();
    });
  }

  bindMagneticButtons();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-desktop').addEventListener('click', () => setViewport('desktop'));
  document.getElementById('btn-mobile').addEventListener('click', () => setViewport('mobile'));
  document.querySelectorAll('.journey-step').forEach((btn) => {
    btn.addEventListener('click', () => setStep(btn.dataset.step));
  });
  document.querySelectorAll('.topnav button').forEach((btn) => {
    btn.addEventListener('click', () => setStep(btn.dataset.step));
  });
  render();
});

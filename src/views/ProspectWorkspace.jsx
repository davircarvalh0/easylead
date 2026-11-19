import React, {useId, useLayoutEffect, useRef, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {phases, stages} from '../domain.js';
import {DirectoryPagination,useDirectoryPagination} from './DirectoryPagination.jsx';
import {DashboardModule} from './DashboardModule.jsx';
import {LeadSearch} from '../../components/ui/LeadSearch.jsx';
import {LeadChoice} from './LeadChoice.jsx';
import {qualificationSectors} from '../services/leadQualificationService.js';
import {LeadPendingBadge, ProspectBoard} from './ProspectBoard.jsx';
import {formatMoney, formatNumber} from './DashboardValue.jsx';
import {leadContractAmounts, leadPendingAction, prospectQuery, leadIcpStatuses, normalizeLeadCity} from '../services/leadWorkspace.js';

function ProspectSummary({model, selected, onStage}) {
  const reduced = useReducedMotion();
  const track = useRef(null);
  const [halo, setHalo] = useState(null);
  const steps = [{stage:'', count:model.total}, ...model.rows];

  useLayoutEffect(() => {
    const node = track.current;
    function measure() {
      const active = node.querySelector('button[aria-pressed="true"]');
      if (!active) {setHalo(null); return;}
      setHalo({
        left:active.offsetLeft, top:active.offsetTop, width:active.offsetWidth, height:active.offsetHeight,
      });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [selected]);

  return <div ref={track} className="prospect-stages prospect-steps" aria-label="Filtrar por estágio" role="group">
    {halo && <motion.span className="prospect-step-halo" aria-hidden="true" initial={false} animate={halo}
      transition={reduced ? {duration:0} : {type:'spring', stiffness:400, damping:35}}/>}
    {steps.map(({stage,count})=>{
      const active = selected === stage;
      return <button type="button" key={stage} data-stage={stage || undefined} aria-pressed={active}
        onClick={()=>onStage(active ? '' : stage)}>
        <span className="prospect-step-node" aria-hidden="true"/>
        <span className="prospect-step-copy"><span>{stage || 'Todos'}</span><strong>{formatNumber(count)}</strong></span>
      </button>;
    })}
  </div>;
}

function ProspectList({leads, state, hrefFor, amounts, linkedLeads}) {
  const people = new Map(state.members.map(member=>[member.id,member.name]));
  return <div className="prospect-table-scroll directory-table-scroll" role="region" aria-label="Tabela de prospectos" tabIndex={0}>
    <table className="prospect-table directory-table" aria-label="Lista de oportunidades">
      <thead>
        <tr>
          <th scope="col">Estágio</th>
          <th scope="col">Empresa</th>
          <th scope="col">Setor</th>
          <th scope="col" className="prospect-deal-amount">Valor proposto/contratado</th>
          <th scope="col">Responsável</th>
        </tr>
      </thead>
      <tbody>
        {leads.map(lead=>{
          const contracted = amounts.get(lead.id);
          const value = contracted ?? lead.proposal?.price;
          const valueStage = contracted != null ? 'Ganho' : value != null ? 'Proposta' : undefined;
          const owner = people.get(lead.businessOwnerId);
          const pending = leadPendingAction(lead, Boolean(lead.projectId || linkedLeads.has(lead.id)));
          return <tr key={lead.id} data-stage={lead.stage}>
            <td><span className="prospect-deal-stage">{lead.stage}</span></td>
            <th scope="row">
              <a className="prospect-deal-name" href={hrefFor(lead)} aria-label={'Abrir ' + lead.name} aria-description={pending || undefined}>
                <div className="prospect-company"><strong>{lead.company}</strong><LeadPendingBadge pending={pending}/></div>
                <span>{lead.name}</span>
                <small>{lead.contact || 'Sem contato registrado'}</small>
                <span className="prospect-deal-open" aria-hidden="true">↗</span>
              </a>
            </th>
            <td>{lead.clientSegment || 'Não classificado'}</td>
            <td className="prospect-deal-amount"><strong data-stage={valueStage} title={valueStage ? (contracted != null ? "Valor contratado" : "Valor proposto") : undefined}>{formatMoney(value)}</strong></td>
            <td>{owner || 'Sem responsável atribuído'}</td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}

export function ProspectWorkspace({state, leadFunnel, filters, params, setFilter, onMove, saveIcp}) {
  const icpDialog = useRef(null);
  const icpTitle = useId();
  const [icpDraft,setIcpDraft] = useState({minimum:'',maximum:''});
  const [icpError,setIcpError] = useState('');

  function editIcp() {
    setIcpDraft({minimum:state.icpBudget?.minimum ?? '',maximum:state.icpBudget?.maximum ?? ''});
    setIcpError('');
    icpDialog.current.showModal();
  }

  async function submitIcp(event) {
    event.preventDefault();
    try {
      await saveIcp(icpDraft);
      icpDialog.current.close();
    } catch (error) {
      setIcpError(error.message);
    }
  }

  const [search, setSearch] = useState(() => params.get('busca') || '');
  const selected = params.get('estagio') || '';
  const view = params.get('modo') === 'quadro' ? 'quadro' : 'lista';
  const sort = params.get('ordem') || 'valor';
  const linkedLeads = new Set(state.projects.map(project=>project.leadId));
  const contractorArea = state.areas.find(area=>area.id === filters.segment || area.name === filters.segment);
  const sector = params.get('setor') || '';
  const sectorCounts = new Map();
  for (const lead of state.leads) {
    const name = lead.clientSegment || 'Não classificado';
    sectorCounts.set(name, (sectorCounts.get(name) || 0) + 1);
  }
  const sectors = qualificationSectors([...sectorCounts].map(([segment,total])=>({segment,total})));
  const city = normalizeLeadCity(params.get('cidade'));
  const uf = params.get('uf') || '';
  const icp = params.get('icp') || '';
  const ddd = params.get('ddd') === '81' ? '81' : '';
  const cities = new Map(state.leads.filter(lead=>lead.city).map(lead=>[normalizeLeadCity(lead.city),lead.city]));
  const states = [...new Set(state.leads.map(lead=>lead.uf).filter(Boolean))].sort();
  const model = leadFunnel({...filters, segment:sector, contractorArea, stage:selected, search, city, uf, icp, ddd});
  const amounts = leadContractAmounts(state, model.items);
  const list = [...model.items].sort((a, b) => {
    const difference = sort === 'recentes'
      ? (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
      : sort === 'nome' ? 0 : (amounts.get(b.id) ?? b.proposal?.price ?? 0) - (amounts.get(a.id) ?? a.proposal?.price ?? 0);
    return difference || a.name.localeCompare(b.name, 'pt-BR');
  });
  const visibleStages = selected === 'abertos' ? stages.slice(0, 3) : stages.includes(selected) ? [selected] : stages;
  const resetKey=[params.toString(),search].join('|');
  const pagination=useDirectoryPagination(list,resetKey,Math.max(0,Number(params.get('pagina') || 1)-1));
  function changeFilter(key,value) { pagination.onPage(0); setFilter(key,value); }
  const context = prospectQuery(params, search);
  if(pagination.page)context.set('pagina',String(pagination.page+1));else context.delete('pagina');
  context.set('origem', 'prospectos');
  const onStage = value => changeFilter('estagio', value);
  const hrefFor = lead => '#/leads/' + encodeURIComponent(lead.id) + '?' + context;

  return <>
    <header className="prospect-header">
      <nav className="prospect-breadcrumb" aria-label="Caminho da página">
        <a href="#/leads">Leads</a>
        <span aria-hidden="true">→</span>
        <span aria-current="page">Todos os leads</span>
      </nav>
      <div role="group" aria-label="Visualização da carteira" className="prospect-toggle lead-glass-switch prospect-view-toggle" data-side={view === 'quadro' ? 'start' : 'end'}>
        <button type="button" aria-pressed={view === 'quadro'} onClick={()=>changeFilter('modo','quadro')}>Quadro</button>
        <button type="button" aria-pressed={view === 'lista'} onClick={()=>changeFilter('modo','')}>Lista</button>
      </div>
    </header>
    <section className="fr-module prospect-filter-module" aria-label="Pesquisa e filtros de leads">
      <div className="toolbar glass-filters" role="group" aria-label="Filtros de leads">
        <div className="prospect-search">
          <LeadSearch minimal aria-label="Buscar prospectos" value={search} onChange={event=>{pagination.onPage(0);setSearch(event.target.value);}} placeholder="Nome, organização ou contato"/>
          <div className="prospect-search-actions">
            <button type="button" className="lead-glass-action" onClick={editIcp}>Definir ICP</button>
            <a className="lead-glass-action lead-glass-action-primary" href={'#/leads/novo?' + context}>Novo lead →</a>
          </div>
        </div>
        <LeadChoice label="Ordenar por" value={sort} onChange={value=>changeFilter('ordem',value)} options={[
          {value:'valor',label:'Valor proposto/contratado'}, {value:'recentes',label:'Mais recentes'}, {value:'nome',label:'Nome'},
        ]}/>
        <LeadChoice label="Segmento da contratante" value={contractorArea?.id || ''} onChange={value=>changeFilter('segmento',value)}
          options={[{value:'',label:'Todos'}, ...state.areas.map(area=>({value:area.id,label:area.name}))]}/>
        <LeadChoice label="Fase / Tipo" value={filters.phase} onChange={value=>changeFilter('fase',value)}
          options={[{value:'',label:'Todas'}, ...phases.map(phase=>({value:phase,label:phase}))]}/>
        <LeadChoice label="Setor da empresa" value={sector} onChange={value=>changeFilter('setor',value)}
          options={[{value:'',label:'Todos'}, ...sectors.map(({segment,total})=>({
            value:segment, label:segment, detail:formatNumber(total) + (total === 1 ? ' lead' : ' leads'),
          }))]}/>
        <div className="prospect-profile-filters">
          <LeadChoice label="Cidade" value={city} onChange={value=>changeFilter('cidade',value)}
            options={[{value:'',label:'Todas'}, ...[...cities].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'))
              .map(([value,label])=>({value,label}))]}/>
          <LeadChoice label="UF" value={uf} onChange={value=>changeFilter('uf',value)}
            options={[{value:'',label:'Todas'}, ...states.map(value=>({value,label:value}))]}/>
          <LeadChoice label="Aderência ao ICP" value={icp} onChange={value=>changeFilter('icp',value)}
            options={[{value:'',label:'Todos'}, ...leadIcpStatuses.map(value=>({value,label:value})), {value:'nao-avaliado',label:'Não avaliado'}]}/>
        </div>
      </div>
    </section>
      <dialog ref={icpDialog} className="value-dialog prospect-icp-dialog" aria-labelledby={icpTitle}>
        <h2 id={icpTitle}>Definir ICP</h2>
        <form onSubmit={submitIcp}>
          <div className="prospect-icp-budget">
            <label>Orçamento mínimo (R$)
              <input type="number" min="0" step="0.01" value={icpDraft.minimum}
                onChange={event=>setIcpDraft({...icpDraft,minimum:event.target.value})}/>
            </label>
            <label>Orçamento máximo (R$)
              <input type="number" min="0" step="0.01" value={icpDraft.maximum}
                onChange={event=>setIcpDraft({...icpDraft,maximum:event.target.value})}/>
            </label>
          </div>
          {icpError && <p className="error" role="alert">{icpError}</p>}
          <div className="prospect-search-actions">
            <button className="lead-glass-action" type="button" onClick={()=>icpDialog.current.close()}>Cancelar</button>
            <button className="lead-glass-action lead-glass-action-primary" type="submit">Salvar ICP</button>
          </div>
        </form>
      </dialog>
    <DashboardModule title="Todos os leads" hideTitle className="prospect-module">
      {ddd && <p className="prospect-ddd-summary">Contatos com DDD 81 <button type="button" onClick={()=>changeFilter('ddd','')}>Limpar recorte</button></p>}
      <ProspectSummary model={model} selected={selected} onStage={onStage}/>
      {list.length ? view === 'quadro'
        ? <ProspectBoard key={resetKey} leads={list} amounts={amounts} visibleStages={visibleStages} hrefFor={hrefFor} linkedLeads={linkedLeads} onMove={onMove} members={state.members} newLeadHref={'#/leads/novo?'+context}/>
        : <><ProspectList key={resetKey} leads={pagination.visible} amounts={amounts} linkedLeads={linkedLeads} state={state} hrefFor={hrefFor}/><DirectoryPagination {...pagination} label="Paginação dos leads"/></>
        : <p className="empty">Nenhum prospecto neste recorte.</p>}
    </DashboardModule>
  </>;
}

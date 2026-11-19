import React, {useId, useRef, useState} from 'react';
import { motion } from 'motion/react';

import {isLeadOwnerArea} from '../services/leadWorkspace.js';
import { isEligibleForAverage } from '../services/leadProjectService.js';
import { DashboardModule } from './DashboardModule.jsx';
import { DashboardValue, formatNumber } from './DashboardValue.jsx';
import {DashboardMetrics} from './DashboardMetrics.jsx';
import {DirectoryPagination,useDirectoryPagination} from './DirectoryPagination.jsx';

const initials=name=>name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('');

function AreaProjects({projects,areaId}) {
 const pagination=useDirectoryPagination(projects,areaId,0,8);
 if(!projects.length)return <p className="empty">Nenhum projeto encontrado.</p>;
 return <><ul className="area-project-list">{pagination.visible.map(project=><li key={project.id}>
  <a href={'#/projetos/'+encodeURIComponent(project.id)}>
   <span className="area-project-identity"><strong>{project.name}</strong><span>{project.phase || 'Delivery'}<span aria-hidden="true"> · </span>{project.status || 'Sem status'}</span></span>
   <DashboardValue money value={project.contractStatus!=='Sem contrato'&&project.contractValue>0?project.contractValue:null} fallback={project.contractStatus==='Sem contrato'?'Sem contrato':'Sem valor registrado'}/>
   <span className="area-project-arrow" aria-hidden="true">↗</span>
  </a>
 </li>)}</ul><DirectoryPagination {...pagination} compact label="Paginação dos projetos do setor"/></>;
}

function AreaMembers({area,members,onAddMember,onChangeLeadOwnership}) {
 const [settingError,setSettingError] = useState('');
 const [formError,setFormError] = useState('');
 const [adding,setAdding] = useState(false);
 const registrationId = useId();
 const enabled = isLeadOwnerArea(area);

 async function toggleOwnership() {
  try {
   await onChangeLeadOwnership(!enabled);
   setSettingError('');
  } catch (error) {
   setSettingError(error.message);
  }
 }

 async function submitMember(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
   await onAddMember(Object.fromEntries(new FormData(form)));
   form.reset();
   setFormError('');
  } catch (error) {
   setFormError(error.message);
  }
 }

 return <DashboardModule title="Integrantes" className="area-members" headerControls={
  <button type="button" className="lead-glass-action" aria-expanded={adding} aria-controls={registrationId} onClick={()=>setAdding(open=>!open)}>Adicionar integrante</button>
 }>
  {settingError && <p className="error" role="alert">{settingError}</p>}
  {members.length ? <ul className="area-member-list">
   {members.map(member=><li key={member.id}>
    <span className="area-member-avatar" aria-hidden="true">{initials(member.name)}</span><div><strong>{member.name}</strong><span>{member.role || 'Integrante'}</span></div>
   </li>)}
  </ul> : <p className="empty">Nenhum integrante neste setor.</p>}
  <div className="area-member-registration">
   <form id={registrationId} hidden={!adding} className="organization-add-form" onSubmit={submitMember}>
    <label>Nome do integrante<input name="name" required autoComplete="name"/></label>
    <label>Função<input name="role"/></label>
    {formError && <p className="error" role="alert">{formError}</p>}
    <div className="organization-form-actions">
     <button type="submit" className="lead-glass-action lead-glass-action-primary">Salvar integrante</button>
    </div>
   </form>
  </div>
  <div className="area-ownership-setting"><span>Atribuição de leads</span>
   <button type="button" role="switch" aria-checked={enabled} className="lead-glass-action area-lead-ownership" onClick={toggleOwnership}>
    Responsável por lead <span aria-hidden="true">{enabled ? 'Ligado' : 'Desligado'}</span>
   </button>
  </div>
 </DashboardModule>;
}

export function AreaDashboard({area, members, projects, reduced, removeArea, onAddMember, onChangeLeadOwnership}) {
 const dialog = useRef(null);
 const confirmationTitle = useId();
 const confirmationDescription = useId();
 const [removalError,setRemovalError] = useState('');

 async function confirmRemoval() {
  try {
   await removeArea(area.id);
   dialog.current?.close();
   location.hash = '/organizacao';
  } catch (error) {
   setRemovalError(error.message);
  }
 }

 const eligible=projects.filter(isEligibleForAverage);
 const total=eligible.length ? eligible.reduce((sum,project)=>sum+project.contractValue,0) : null;
 const active=projects.filter(project=>project.status==='Em andamento').length;
 const phases=['Discovery','Delivery'].map(phase=>({
  phase,count:projects.filter(project=>(project.phase||'Delivery')===phase).length,
 }));
 const stats=[
  ['Projetos vinculados',projects.length],
  ['Em andamento',active],['Valor contratado',total,true],['Integrantes',members.length],
 ];
 return <motion.section className="area-dashboard" aria-label={area.name}
  initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}}
  transition={{duration:reduced?0:.3,ease:[.22,.72,.24,1]}}>
  <header className="area-dashboard-header lead-record-header">
   <nav className="prospect-breadcrumb" aria-label="Caminho da página">
    <a href="#/organizacao">Organização</a><span aria-hidden="true">→</span><span aria-current="page">{area.name}</span>
   </nav>
   <div className="lead-record-title-row">
    <h1 className="lead-route-heading" tabIndex={-1}>{area.name}</h1>
    <button type="button" className="lead-glass-action area-remove-button" onClick={()=>{
     setRemovalError('');
     dialog.current.showModal();
    }}>Remover setor</button>
   </div>
  </header>
  <dialog ref={dialog} className="value-dialog area-remove-dialog" aria-labelledby={confirmationTitle} aria-describedby={confirmationDescription}>
   <h2 id={confirmationTitle}>Remover {area.name}?</h2>
   <p id={confirmationDescription}>Os projetos e leads vinculados serão mantidos sem este setor.</p>
   {removalError && <p className="error" role="alert">{removalError}</p>}
   <form method="dialog" className="organization-form-actions">
    <button type="submit" className="lead-glass-action" autoFocus>Cancelar</button>
    <button type="button" className="lead-glass-action area-remove-button" onClick={confirmRemoval}>Confirmar remoção</button>
   </form>
  </dialog>
  <DashboardMetrics entries={stats.map(([label,value,money])=>({label,value,money}))}/>
  <div className="area-detail-grid">
  <DashboardModule title="Projetos vinculados" className="area-projects project-portfolio" headerControls={
   <a className="lead-glass-action" href={'#/projetos/todos?area='+encodeURIComponent(area.id)}>Abrir carteira →</a>
  }>
    {projects.length>0&&<div className="area-project-phases">
     <div className="area-phase-strip" aria-hidden="true">
      {phases.map(({phase,count})=>count>0&&<span key={phase} style={{flexGrow:count}} data-phase={phase}/>)}
     </div>
     <ul>{phases.map(({phase,count})=><li key={phase} data-phase={phase}><i aria-hidden="true"/>{phase} <strong>{formatNumber(count)}</strong></li>)}</ul>
    </div>}
    <AreaProjects projects={projects} areaId={area.id}/>
  </DashboardModule>
  <AreaMembers area={area} members={members} onAddMember={onAddMember} onChangeLeadOwnership={onChangeLeadOwnership}/>
  </div>
 </motion.section>;
}


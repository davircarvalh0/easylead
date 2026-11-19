import React from 'react';
import {DashboardModule} from './DashboardModule.jsx';
import './account-settings.css';

export function AccountSettings({state,email,logout}){
 function exportWorkspace(){
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='easylead-carteira.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <div className="account-settings-grid">
  <DashboardModule title="Conta" className="account-settings-card">
   <div className="account-settings-profile">
    <span className="account-settings-avatar" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg></span>
    <dl className="account-settings-identity"><dt>E-mail da sessão</dt><dd>{email}</dd></dl>
   </div>
   <div className="account-settings-actions"><button className="lead-glass-action" type="button" onClick={logout}>Sair da conta</button></div>
  </DashboardModule>
  <DashboardModule title="Dados da carteira" className="account-settings-card">
   <dl className="account-settings-metrics"><div><dt>Leads</dt><dd>{state.leads.length.toLocaleString('pt-BR')}</dd></div><div><dt>Projetos</dt><dd>{state.projects.length.toLocaleString('pt-BR')}</dd></div></dl>
   <div className="account-settings-actions"><button className="lead-glass-action" type="button" onClick={exportWorkspace}>Exportar carteira <span aria-hidden="true">↓</span></button></div>
  </DashboardModule>
 </div>;
}

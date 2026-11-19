import React, {useEffect, useRef, useState} from 'react';
import {isCloud} from '../services/cloudClient.js';
import {useSessionController, LOGIN_TRANSITION_MS} from '../controllers/useSessionController.js';
import {EasyLeadLogo} from './TopNavigation.jsx';
import {LiquidChrome} from './LiquidChrome.jsx';
import './login-passage.css';

export function AuthGate({children}) {
  const {session, entering, error, loading,submitting,login, logout} = useSessionController();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailInput = useRef(null);
  const passage = useRef(null);

  useEffect(()=>{
    if (entering) passage.current?.focus();
    else if (session) document.querySelector('main h1')?.focus();
    else emailInput.current?.focus();
  },[session,entering]);

  if(loading)return <main className="easylead-login"><p role="status">Verificando acesso…</p></main>;
  if (!session) return <main className="easylead-login">
    <div className="login-shell">
      <LiquidChrome/>
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-content">
          <EasyLeadLogo/>
          <h1 id="login-title">Entrar no EasyLead</h1>
          <form noValidate onSubmit={event=>{event.preventDefault();login(email,password);}}>
            <label>E-mail<input ref={emailInput} type="email" autoComplete="username" required
              placeholder="voce@exemplo.com" value={email} onChange={event=>setEmail(event.target.value)}/></label>
            <label>Código de acesso<input type="password" autoComplete="off" required
              placeholder="Digite seu código" value={password} onChange={event=>setPassword(event.target.value)}/></label>
            {error && <p role="alert" className="login-error">{error}</p>}
            <button className="login-submit" type="submit" disabled={submitting}>{submitting?'Entrando…':'Entrar no EasyLead'}</button>
            {!isCloud&&<button className="login-demo" type="button" onClick={()=>{
              setEmail('lideranca@citi.org.br');
              setPassword('citi-2026');
              emailInput.current?.focus();
            }}>Preencher acesso de demonstração</button>}
          </form>
        </div>
      </section>
    </div>
  </main>;

  return <>
    <div className="app-entry" inert={entering || undefined}>{children({logout,sessionError:error,accountEmail:session.email})}</div>
    {entering && <div ref={passage} tabIndex={-1} className="login-transition" role="dialog" aria-modal="true"
      aria-label="Entrando no EasyLead" style={{'--login-transition-duration':LOGIN_TRANSITION_MS+'ms'}}
      onKeyDown={event=>{if(event.key==='Tab') event.preventDefault();}}>
      <EasyLeadLogo/>
    </div>}
  </>;
}

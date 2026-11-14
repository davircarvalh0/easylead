import React, {useEffect, useRef, useState} from 'react';
import {LoginPassage,preloadLoginScene} from './LoginPassage.jsx';
import logo from '../../proposta-visual/assets/logo-citi-simbolo.png';
import {useSessionController} from '../controllers/useSessionController.js';

function Brand() {
  return <div className="auth-brand"><img src={logo} alt="CITi"/><strong><span>/all</span></strong></div>;
}
export function AuthGate({children}) {
  const {session, entering, error, login, logout, finish} = useSessionController();
  const [opening, setOpening] = useState(() => !session && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(()=>{
    if (!session && !matchMedia('(prefers-reduced-motion: reduce)').matches && !new URLSearchParams(location.search).has('noWebGL')) preloadLoginScene();
  },[session]);
  useEffect(() => {
    if (!opening) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let remaining = 720, started = performance.now(), timer;
    const end = () => setOpening(false);
    const change = () => { if (media.matches) end(); };
    const visibility = () => {
      clearTimeout(timer);
      if (document.hidden) remaining -= performance.now() - started;
      else { started = performance.now(); timer = setTimeout(end, Math.max(0, remaining)); }
    };
    if (!document.hidden) timer = setTimeout(end, remaining);
    media.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearTimeout(timer);
      media.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [opening]);
  const emailInput = useRef(null);
  const skip = useRef(null);
  useEffect(() => {
    if (entering) skip.current?.focus();
    else if (session) document.querySelector('main h1')?.focus();
    else if (!opening) emailInput.current?.focus();
  }, [session, entering, opening]);
  if (!session) return <main className={`auth-page ${opening ? 'auth-opening' : 'auth-ready'}`}>
    {opening && <div className="initial-opening" aria-hidden="true"><Brand/></div>}
    <section onFocusCapture={() => { if (opening) setOpening(false); }} onPointerDown={() => { if (opening) setOpening(false); }} className="auth-card" aria-labelledby="login-title">
    <Brand/><h1 id="login-title">Entre no CITi/all</h1><p>Oportunidades, projetos e pessoas conectados.</p>
    <p className="section-note">Demonstração local. Use qualquer e-mail válido e um código de pelo menos 4 caracteres. Não use sua senha institucional.</p>
    <form noValidate onSubmit={event => {event.preventDefault(); login(email, password);}}>
      <label>E-mail<input ref={emailInput} type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Código de acesso da demonstração<input type="password" autoComplete="off" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="button" type="submit"><span className="btn-inner">Entrar no CITi/all →</span></button>
      <button className="quiet-button" type="button" onClick={()=>{setEmail('lideranca@citi.org.br');setPassword('citi-2026');emailInput.current?.focus();}}>Preencher acesso de demonstração</button>
    </form><p className="section-note">Dados fictícios, salvos apenas neste navegador.</p>
  </section></main>;
  return <>
    <div className={`app-entry ${entering ? "app-entering" : ""}`} inert={entering ? true : undefined}>{children({logout, sessionError: error})}</div>
    {entering && <div className="brand-entry" role="dialog" aria-modal="true" aria-label="Entrando no CITi/all" onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();skip.current?.focus();}}}>
      <LoginPassage/><Brand/>
      <button ref={skip} type="button" className="quiet-button" onClick={finish}>Pular abertura</button>
    </div>}
  </>;
}

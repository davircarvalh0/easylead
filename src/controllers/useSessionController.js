import {useEffect, useState, useRef} from 'react';
import {isCloud} from '../services/cloudClient.js';
import {createSessionService} from '../services/sessionService.js';

export const LOGIN_TRANSITION_MS = 560;
const loginEntry=()=>['','/','/login'].includes(location.hash.slice(1).split('?')[0]);
const showLogin=()=>history.replaceState(history.state,'',location.pathname+location.search+'#/login');

export function useSessionController() {
  const [service] = useState(createSessionService);
  const startAtLogin=useRef(loginEntry());
  const [session, setSession] = useState(() => isCloud||startAtLogin.current?null:service.load());
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState('');
  const [loading,setLoading]=useState(isCloud&&!startAtLogin.current);
  const [submitting,setSubmitting]=useState(false);
  const access=useRef({session,loading});access.current={session,loading};
  useEffect(()=>{
    if(startAtLogin.current){showLogin();return;}
    if(!isCloud)return;
    let active=true;
    service.load().then(next=>{if(active)setSession(next);}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[service]);
  useEffect(()=>{
    function expire(){access.current.session=null;setSession(null);setEntering(false);setError('');showLogin();}
    function guard(){
      if(access.current.loading)return;
      if(loginEntry()){if(access.current.session)expire();else showLogin();}
      else if(!access.current.session)showLogin();
      else revalidate();
    }
    let checking=false;
    async function revalidate(){
      if(!isCloud||checking||document.hidden||!access.current.session)return;
      const checkedSession=access.current.session;checking=true;
      try{const next=await service.load();if(!next&&access.current.session===checkedSession)expire();}catch{/* Network failures do not imply a revoked session. */}finally{checking=false;}
    }
    guard();
    window.addEventListener('hashchange',guard);
    window.addEventListener('easylead:unauthorized',expire);
    window.addEventListener('focus',revalidate);
    document.addEventListener('visibilitychange',revalidate);
    return()=>{window.removeEventListener('hashchange',guard);window.removeEventListener('easylead:unauthorized',expire);window.removeEventListener('focus',revalidate);document.removeEventListener('visibilitychange',revalidate);};
  },[session,loading,service]);
  useEffect(() => {
    if (!entering) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => setEntering(false);
    const change = () => { if (media.matches) finish(); };
    let remaining = LOGIN_TRANSITION_MS, started = performance.now(), timer;
    const visibility = () => {
      clearTimeout(timer);
      if (document.hidden) remaining -= performance.now() - started;
      else { started = performance.now(); timer = setTimeout(finish, Math.max(0, remaining)); }
    };
    if (!document.hidden) timer = setTimeout(finish, remaining);
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', change);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', change); };
  }, [entering]);
  async function login(email, password, demo=false) {
    if(submitting)return;setSubmitting(true);
    try {
      const next = await (demo?service.demo():service.login(email, password));
      access.current.session=next;
      location.hash = '/easylead';
      setError('');
      setEntering(!matchMedia('(prefers-reduced-motion: reduce)').matches);
      setSession(next);
    } catch (failure) { setError(isCloud&&(!failure.status||failure.status>=500)?'Não foi possível entrar agora. Tente novamente em instantes.':failure.message); }finally{setSubmitting(false);}
  }
  async function logout() {
    try { await service.logout(); access.current.session=null;setSession(null); setEntering(false); setError('');showLogin(); }
    catch (failure) { setError(failure.message); }
  }
  return {session, entering, error, loading,submitting,login,loginDemo:()=>login('','',true), logout, finish: () => setEntering(false)};
}

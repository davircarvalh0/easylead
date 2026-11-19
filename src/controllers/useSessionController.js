import {useEffect, useState} from 'react';
import {isCloud} from '../services/cloudClient.js';
import {createSessionService} from '../services/sessionService.js';

export const LOGIN_TRANSITION_MS = 560;

export function useSessionController() {
  const [service] = useState(createSessionService);
  const [session, setSession] = useState(() => isCloud?null:service.load());
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState('');
  const [loading,setLoading]=useState(isCloud);
  const [submitting,setSubmitting]=useState(false);
  useEffect(()=>{if(!isCloud)return;let active=true;service.load().then(next=>{if(active)setSession(next);}).catch(()=>{/* The login screen stays available if the initial session check fails. */}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[service]);
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
      location.hash = '/easylead';
      setError('');
      setEntering(!matchMedia('(prefers-reduced-motion: reduce)').matches);
      setSession(next);
    } catch (failure) { setError(isCloud&&(!failure.status||failure.status>=500)?'Não foi possível entrar agora. Tente novamente em instantes.':failure.message); }finally{setSubmitting(false);}
  }
  async function logout() {
    try { await service.logout(); setSession(null); setEntering(false); setError(''); }
    catch (failure) { setError(failure.message); }
  }
  return {session, entering, error, loading,submitting,login,loginDemo:()=>login('','',true), logout, finish: () => setEntering(false)};
}

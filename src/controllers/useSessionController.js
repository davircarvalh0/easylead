import {useEffect, useState} from 'react';
import {createSessionService} from '../services/sessionService.js';

export function useSessionController() {
  const [service] = useState(createSessionService);
  const [session, setSession] = useState(() => service.load());
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!entering) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => setEntering(false);
    const change = () => { if (media.matches) finish(); };
    let remaining = 1600, started = performance.now(), timer;
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
  function login(email, password) {
    try {
      const next = service.login(email, password);
      location.hash = '/';
      setError('');
      setEntering(!matchMedia('(prefers-reduced-motion: reduce)').matches);
      setSession(next);
    } catch (failure) { setError(failure.message); }
  }
  function logout() {
    try { service.logout(); setSession(null); setEntering(false); setError(''); }
    catch (failure) { setError(failure.message); }
  }
  return {session, entering, error, login, logout, finish: () => setEntering(false)};
}

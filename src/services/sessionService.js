import {isCloud,cloudApi} from './cloudClient.js';
import {createSessionRepository} from '../repositories/sessionRepository.js';

// Local demonstration only: this is not an authentication or authorization boundary.
export function createSessionService(repository = createSessionRepository()) {
  if(isCloud)return {
    load:async()=>(await cloudApi('session')).session,
    login:async(email,password)=>(await cloudApi('session',{method:'POST',body:{email,password}})).session,
    logout:()=>cloudApi('session',{method:'DELETE'}),
  };
  return {
    load: () => repository.load(),
    login(email, password) {
      email = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido para entrar na demonstração.');
      if (password.length < 4) throw new Error('O código da demonstração deve ter pelo menos 4 caracteres.');
      const session = {authenticated: true, email, loggedAt: Date.now()};
      repository.save(session);
      return session;
    },
    logout: () => repository.clear(),
  };
}

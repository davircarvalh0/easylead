const KEY = 'citi-all-session-v1';

export function createSessionRepository() {
  return {
    load() {
      try {
        const session = JSON.parse(localStorage.getItem(KEY));
        return session?.authenticated === true && typeof session.email === 'string' && Number.isFinite(session.loggedAt) ? session : null;
      } catch { return null; }
    },
    save(session) {
      try { localStorage.setItem(KEY, JSON.stringify(session)); }
      catch { throw new Error('Não foi possível salvar a sessão neste navegador. Libere o armazenamento e tente novamente.'); }
    },
    clear() {
      try { localStorage.removeItem(KEY); }
      catch { throw new Error('Não foi possível encerrar a sessão. Libere o armazenamento e tente novamente.'); }
    },
  };
}

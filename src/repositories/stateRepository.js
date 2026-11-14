import {seed} from '../domain.js';

export const STORAGE_KEY = 'central-citi-v1';

export function readState(storage) {
 const raw=storage.getItem(STORAGE_KEY);
 if(!raw) return structuredClone(seed);
 const value=JSON.parse(raw);
 if(value.version!==1 || !['areas','members','leads','projects'].every(k=>Array.isArray(value[k]))) throw Error('Dados locais incompatíveis.');
 return value;
}

// Resolve lazily: browsers can throw even when accessing localStorage.
export function createStateRepository(getStorage = () => globalThis.localStorage) {
  let readFailed = false;
  return {
    read() {
      try {
        const state = readState(getStorage());
        readFailed = false;
        return state;
      } catch (error) {
        readFailed = true;
        throw error;
      }
    },
    write(state) {
      if (readFailed) throw Error('Persistência indisponível. Recarregue após corrigir o armazenamento.');
      try {
        getStorage().setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        throw Error('Não foi possível salvar. Verifique o espaço e as permissões do navegador.');
      }
    },
  };
}

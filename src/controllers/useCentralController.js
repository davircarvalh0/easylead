import {useRef, useState} from 'react';
import {seed} from '../domain.js';
import {createLeadProjectService} from '../services/leadProjectService.js';

export function useCentralController() {
  const [service] = useState(() => createLeadProjectService());
  const [initial] = useState(() => {
    try {
      return {state: service.load(), storageError: ''};
    } catch {
      return {
        state: structuredClone(seed),
        storageError: 'Não foi possível ler os dados locais. A demonstração está temporariamente em memória; os dados salvos não serão sobrescritos.',
      };
    }
  });
  const [state, setState] = useState(initial.state);
  const current = useRef(state);
  const [message, setMessage] = useState('');
  const [saveTick, setSaveTick] = useState(0);

  function publish(next) {
    current.current = next;
    setState(next);
    setSaveTick(n => n + 1);
    setMessage('Alterações salvas neste navegador.');
  }
  function saveLead(data, id) {
    publish(service.saveLead(current.current, data, id));
  }
  function convert(leadId, data) {
    const result = service.convert(current.current, leadId, data);
    publish(result.state);
    return result.project;
  }
  function changeStatus(id, status) {
    try {
      publish(service.changeStatus(current.current, id, status));
    } catch (error) {
      setMessage(error.message);
    }
  }
  return {state, storageError: initial.storageError, message, saveTick, saveLead, convert, changeStatus};
}

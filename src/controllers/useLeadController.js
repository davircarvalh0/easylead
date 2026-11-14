import {useState} from 'react';

const navigate = path => { location.hash = path; };

export function useLeadFormController(lead, saveLead) {
  const [data, setData] = useState(lead || {name: '', company: '', contact: '', stage: 'Novo', clientSegment:'Não classificado'});
  const [error, setError] = useState('');
  function setField(key, value) {
    setData(previous => ({...previous, [key]: value}));
  }
  function submit(event) {
    event.preventDefault();
    try {
      const id = lead?.id || crypto.randomUUID();
      saveLead(data, id);
      setError('');
      navigate('/leads/' + id);
    } catch (error) {
      setError(error.message);
    }
  }
  return {data, error, setField, submit};
}

export function useConversionController(lead, convert) {
  const [data, setData] = useState({name: lead.name, areaId: '', ownerId: '', memberIds: [], phase:'Discovery',contractStatus:'Contratado',contractValue:'',squadName:''});
  const [error, setError] = useState('');
  function setField(key, value) {
    setData(previous => ({...previous, [key]: value, ...(key === 'areaId' ? {ownerId: ''} : {})}));
  }
  function toggleMember(id, checked) {
    setData(previous => ({...previous, memberIds: checked ? [...previous.memberIds, id] : previous.memberIds.filter(memberId => memberId !== id)}));
  }
  function submit(event) {
    event.preventDefault();
    try {
      const project = convert(lead.id, data);
      navigate('/projetos/' + project.id);
    } catch (error) {
      setError(error.message);
    }
  }
  return {data, error, setField, toggleMember, submit};
}

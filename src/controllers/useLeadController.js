import {useState,useRef} from 'react';

const navigate = path => { location.hash = path; };

export function useLeadFormController(lead, saveLead, returnQuery = '') {
  const [data, setData] = useState(() => ({
    name:lead?.name,
    company:lead?.company || '',
    contact:lead?.contact || '',
    linkedin:lead?.linkedin,
    city:lead?.city || '',
    uf:lead?.uf || '',
    estimatedValue:lead?.estimatedValue ?? '',
    idealCustomerProfile:lead?.idealCustomerProfile || '',
    clientSegment:lead?.clientSegment || 'Não classificado',
    contractorSegment:lead?.contractorSegment,
    businessOwnerId:lead?.businessOwnerId,
  }));
  const [error, setError] = useState('');
  const recordId=useRef(lead?.id||crypto.randomUUID());
  const saving=useRef(false);
  function setField(key, value) {
    setData(previous => ({...previous, [key]: value}));
  }
  async function submit(event) {
    event.preventDefault();
    const form=event.currentTarget;
    if(saving.current)return;saving.current=true;
    try {
      const id = recordId.current;
      await saveLead(lead ? {...data, stage:lead.stage} : {...data, name:data.company, stage:'Novo'}, id);
      setError('');
      navigate('/leads/' + id + (returnQuery ? '?' + returnQuery : ''));
    } catch (error) {
      setError(error.message);
      form.querySelector(':invalid')?.focus();
    }finally{saving.current=false;}
  }
  return {data, error, setField, submit};
}

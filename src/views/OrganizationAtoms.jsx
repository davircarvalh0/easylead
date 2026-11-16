import React, {useId, useState} from 'react';
import './organization-atoms.css';
import Globe from '../../components/ui/3d-orb';



export function MemberForm({areas, initialAreaId = '', saveMember}) {
 const prefix = useId();
 const [error, setError] = useState('');
 const [feedback, setFeedback] = useState('');
 function submit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try {
   saveMember(data);
   setError('');
   setFeedback(`${data.name.trim()} cadastrado. Dados salvos neste navegador.`);
   form.reset();
   form.elements.name.focus();
  } catch (failure) { setFeedback(''); setError(failure.message); }
 }
 return <section className="member-form-card" aria-labelledby={prefix+'title'}>
  <h2 id={prefix+'title'}>Adicionar integrante</h2>
  <form onSubmit={submit} aria-describedby={error ? prefix+'error' : undefined}>
   <label htmlFor={prefix+'name'}>Nome (obrigatório)</label>
   <input id={prefix+'name'} name="name" required autoComplete="name"/>
   <label htmlFor={prefix+'area'}>Subárea (obrigatória)</label>
   <select id={prefix+'area'} name="areaId" required defaultValue={initialAreaId}>
    <option value="">Selecione uma subárea</option>
    {areas.map(area=><option key={area.id} value={area.id}>{area.name}</option>)}
   </select>
   <label htmlFor={prefix+'role'}>Papel / função (opcional)</label>
   <input id={prefix+'role'} name="role" placeholder="Integrante"/>
   {error && <p id={prefix+'error'} role="alert" className="error">{error}</p>}
   <p role="status">{feedback}</p>
   <button type="submit">Salvar integrante</button>
  </form>
 </section>;
}

export function OrganizationAtoms({state, atoms, selectedId, projectList}) {
 const selected = state.areas.find(area=>area.id === selectedId);
 return <div className={`organization-atoms ${selected ? "has-selection" : ""}`}>
  <p>Arraste para explorar; use roda, pin&#231;a ou os bot&#245;es para aproximar. Explore as subáreas. Quanto mais integrantes, maior a esfera. A órbita pausa ao interagir ou abrir uma subárea. Use Tab ou as setas para navegar e Enter para abrir.</p>
  <Globe atoms={atoms} selectedId={selectedId}/>
  {selectedId && !selected && <p role="alert">Subárea não encontrada. <a href="#/organizacao">Ver todas as subáreas</a></p>}
  {selected && <section className="subarea-atom-detail">
   <div><a className="scene-return" href="#/organizacao">Voltar &#224; vis&#227;o completa &#8634;</a><h2>{selected.name}</h2><h3>Integrantes da subárea · {state.members.filter(m=>m.areaId===selected.id).length}</h3>
    {state.members.filter(m=>m.areaId===selected.id).map(member=><p className="area-person" key={member.id}>{member.name} · {member.role || 'Integrante'}</p>)}
    <a href={'#/integrantes?area='+selected.id}>Ver no diretório de Integrantes →</a>
    <h3>Projetos vinculados</h3>{projectList(state.projects.filter(project=>project.areaId===selected.id))}
   </div>
  </section>}
 </div>;
}

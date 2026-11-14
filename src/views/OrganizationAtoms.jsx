import React, {useId, useState} from 'react';
import './organization-atoms.css';

const population = count => `${count} ${count === 1 ? 'integrante' : 'integrantes'}`;

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

export function OrganizationAtoms({state, atoms, selectedId, saveMember, projectList}) {
 const selected = state.areas.find(area=>area.id === selectedId);
 function move(event) {
  const links = [...event.currentTarget.querySelectorAll('.atom-node')];
  const index = links.indexOf(event.target.closest('.atom-node'));
  if (index < 0) return;
  const columns = getComputedStyle(event.currentTarget).gridTemplateColumns.split(' ').length;
  const offset = {ArrowRight:1, ArrowLeft:-1, ArrowDown:columns, ArrowUp:-columns}[event.key];
  let next;
  if (offset) next = (index + offset + links.length) % links.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = links.length - 1;
  else if (event.key === ' ') { event.preventDefault(); links[index].click(); return; }
  else return;
  event.preventDefault(); links[next].focus();
 }
 return <div className="organization-atoms">
  <p>Explore as subáreas. Quanto mais integrantes, maior o átomo. Use Tab ou as setas para navegar e Enter para abrir.</p>
  <nav className="atomic-field" aria-label="Subáreas da organização" onKeyDown={move}>
   {atoms.map(atom=><a key={atom.id} className="atom-node" href={'#/organizacao/'+atom.id} aria-current={selected?.id===atom.id?'page':undefined} style={{'--atom-desktop':atom.desktopDiameter+'px','--atom-mobile':atom.mobileDiameter+'px'}}>
    <span className="atom-sphere" aria-hidden="true"><span className="atom-orbit"/></span>
    <strong>{atom.name}</strong><span className="atom-count-badge">{population(atom.count)}</span>
   </a>)}
  </nav>
  {selectedId && !selected && <p role="alert">Subárea não encontrada. <a href="#/organizacao">Ver todas as subáreas</a></p>}
  {selected && <section className="subarea-atom-detail">
   <div><h2>{selected.name}</h2><h3>Integrantes da subárea · {state.members.filter(m=>m.areaId===selected.id).length}</h3>
    {state.members.filter(m=>m.areaId===selected.id).map(member=><p className="area-person" key={member.id}>{member.name} · {member.role || 'Integrante'}</p>)}
    <a href={'#/integrantes?area='+selected.id}>Ver no diretório de Integrantes →</a>
    <h3>Projetos vinculados</h3>{projectList(state.projects.filter(project=>project.areaId===selected.id))}
   </div>
   <MemberForm key={selected.id} areas={state.areas} initialAreaId={selected.id} saveMember={saveMember}/>
  </section>}
  {!selectedId && <MemberForm areas={state.areas} saveMember={saveMember}/>}
 </div>;
}

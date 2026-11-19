import React, {useEffect, useId, useRef, useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {AreaDashboard} from './AreaDashboard.jsx';
import {OrganizationAreas} from './OrganizationAreas.jsx';
import './organization-atoms.css';


export function Organization({state, areas, selectedId, projectList, saveArea, removeArea, saveMember, setAreaLeadOwnership}) {
 const selected = areas.find(area=>area.id===selectedId);
 const reduced = useReducedMotion();
 const [adding,setAdding] = useState(false);
 const [error,setError] = useState('');
 const trigger = useRef(null);
 const field = useRef(null);
 const formId = useId();

 useEffect(()=>{
  if (adding) field.current?.focus();
 },[adding]);

 function cancel() {
  setAdding(false);
  setError('');
  trigger.current?.focus();
 }

 async function submit(event) {
  event.preventDefault();
  try {
   const id=await saveArea(new FormData(event.currentTarget).get('name'));
   setAdding(false);
   setError('');
   location.hash='/organizacao/'+encodeURIComponent(id);
  } catch (failure) {
   setError(failure.message);
   field.current?.focus();
  }
 }

 if (selected) return <AreaDashboard key={selected.id} area={selected}
  members={state.members.filter(member=>member.areaId===selected.id)}
  onAddMember={data=>saveMember({...data,areaId:selected.id})}
  onChangeLeadOwnership={enabled=>setAreaLeadOwnership(selected.id,enabled)}
  projects={state.projects.filter(project=>project.areaId===selected.id)}
  projectList={projectList} reduced={reduced} removeArea={removeArea}/>;

 return <section className="organization-directory" aria-labelledby="organization-title">
  <header className="organization-heading lead-opening">
   <h1 className="lead-route-heading" id="organization-title" tabIndex={-1}>Organização</h1>
   <div className="lead-opening-actions">
    <button ref={trigger} className="lead-glass-action lead-glass-action-primary" type="button" aria-expanded={adding}
     aria-controls={formId} onClick={()=>adding ? cancel() : setAdding(true)}>
     <span aria-hidden="true">+</span> Adicionar setor
    </button>
   </div>
  </header>
  {selectedId && <p role="alert" className="empty">Setor não encontrado.</p>}
  <form id={formId} hidden={!adding} className="organization-add-form" onSubmit={submit}>
   <label>Nome do setor<input ref={field} name="name" required onChange={()=>setError('')} aria-describedby={error ? formId+'-error' : undefined}/></label>
   <div className="organization-form-actions">
    <button type="button" className="lead-glass-action" onClick={cancel}>Cancelar</button>
    <button type="submit" className="lead-glass-action lead-glass-action-primary">Salvar setor</button>
   </div>
   {error && <p className="error" role="alert" id={formId+'-error'}>{error}</p>}
  </form>
  <OrganizationAreas areas={areas} state={state}/>
 </section>;
}

import React from 'react';
import {stages} from '../domain.js';
import {Magnetic} from '../Magnetic.jsx';
import {useLeadFormController} from '../controllers/useLeadController.js';

export function LeadForm({lead,saveLead}){
 const {data,error,setField,submit}=useLeadFormController(lead,saveLead);
 return <form noValidate onSubmit={submit}>
 <h2>{lead?'Editar lead':'Novo lead'}</h2>{error&&<p role="alert" className="error">{error}</p>}
 {[["name","Nome da oportunidade"],["company","Organização"],["contact","Contato"]].map(([key,label])=><label key={key}>{label} *<input required value={data[key]} onChange={e=>setField(key,e.target.value)}/></label>)}
 <label>Estágio<select disabled={!!lead?.projectId} value={data.stage} onChange={e=>setField('stage',e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select></label>
 {lead?.projectId&&<p>Após a conversão, o estágio permanece em Ganho.</p>}<Magnetic>Salvar lead</Magnetic> <a href="#/leads">Voltar aos leads</a></form>
 }

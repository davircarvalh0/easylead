import React from 'react';
import {Magnetic} from '../Magnetic.jsx';
import {useConversionController} from '../controllers/useLeadController.js';

export function Conversion({lead,state,convert}){
 const {data,error,setField,toggleMember,submit}=useConversionController(lead,convert);
 return <form className="conversion" noValidate onSubmit={submit}><h2>Converter em projeto</h2>{error&&<p role="alert" className="error">{error}</p>}
 <label>Nome do projeto *<input required value={data.name} onChange={e=>setField('name',e.target.value)}/></label>
 <label>Área responsável *<select required value={data.areaId} onChange={e=>setField('areaId',e.target.value)}><option value="">Selecione uma área</option>{state.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
 <label>Responsável *<select required value={data.ownerId} onChange={e=>setField('ownerId',e.target.value)}><option value="">Selecione um integrante</option>{state.members.filter(m=>m.areaId===data.areaId).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 <fieldset><legend>Outros integrantes (opcional)</legend>{state.members.filter(m=>m.id!==data.ownerId).map(m=><label className="check" key={m.id}><input type="checkbox" checked={data.memberIds.includes(m.id)} onChange={e=>toggleMember(m.id,e.target.checked)}/>{m.name} · {state.areas.find(a=>a.id===m.areaId)?.name}</label>)}</fieldset><Magnetic>Criar projeto</Magnetic></form>
 }

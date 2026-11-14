import React from 'react';
import {Magnetic} from '../Magnetic.jsx';
import {useConversionController} from '../controllers/useLeadController.js';

export function Conversion({lead,state,convert}){
 const {data,error,setField,toggleMember,submit}=useConversionController(lead,convert);
 return <form className="conversion" noValidate onSubmit={submit}><h2>Converter em projeto</h2>{error&&<p role="alert" className="error">{error}</p>}
 <label>Nome do projeto *<input required value={data.name} onChange={e=>setField('name',e.target.value)}/></label>
 <label>Área responsável *<select required value={data.areaId} onChange={e=>setField('areaId',e.target.value)}><option value="">Selecione uma área</option>{state.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
 <label>Responsável *<select required value={data.ownerId} onChange={e=>setField('ownerId',e.target.value)}><option value="">Selecione um integrante</option>{state.members.filter(m=>m.areaId===data.areaId).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 <label>Fase inicial<select value={data.phase} onChange={e=>setField('phase',e.target.value)}><option>Discovery</option><option>Delivery</option></select></label>
 <label>Nome do squad<input value={data.squadName} onChange={e=>setField('squadName',e.target.value)} placeholder="Gerado a partir do projeto se vazio"/></label>
 <label>Contrato<select value={data.contractStatus} onChange={e=>setField('contractStatus',e.target.value)}><option>Contratado</option><option>Sem contrato</option></select></label>
 <label>Valor contratado (R$)<input type="number" min="0.01" step="0.01" value={data.contractValue} onChange={e=>setField('contractValue',e.target.value)}/></label>
 <fieldset><legend>Outros integrantes (opcional)</legend>{state.members.filter(m=>m.id!==data.ownerId).map(m=><label className="check" key={m.id}><input type="checkbox" checked={data.memberIds.includes(m.id)} onChange={e=>toggleMember(m.id,e.target.checked)}/>{m.name} · {state.areas.find(a=>a.id===m.areaId)?.name}</label>)}</fieldset><Magnetic>Criar projeto</Magnetic></form>
 }

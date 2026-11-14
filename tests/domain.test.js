import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,saveLead,convert,changeStatus,metrics,readState,STORAGE_KEY} from '../src/domain.js';
test('conversão exige ganho, área e responsável coerentes; mantém 1:1 e trava estágio',()=>{
 const s=structuredClone(seed);
 assert.throws(()=>convert(s,'l0',{name:'X',areaId:'a0',ownerId:'m0'}));
 assert.throws(()=>convert(s,'l3',{name:'X',areaId:'a0',ownerId:'m2'}));
 const r=convert(s,'l3',{name:'X',areaId:'a0',ownerId:'m0',memberIds:['m0','m1']});
 assert.equal(r.project.status,'Planejado');assert.deepEqual(r.project.memberIds,['m0','m1']);
 assert.equal(r.state.leads[3].projectId,r.project.id);
 assert.equal(convert(r.state,'l3',{}).state,r.state);
 assert.throws(()=>saveLead(r.state,{...r.state.leads[3],stage:'Perdido'},'l3'));
 const next=changeStatus(r.state,r.project.id,'Em andamento');assert.equal(metrics(next).active,1);assert.equal(metrics(next).open,3);
 assert.throws(()=>changeStatus(next,r.project.id,'Inválido'));
 const storage={getItem:key=>key===STORAGE_KEY?JSON.stringify(next):null};assert.deepEqual(readState(storage),next);
});
test('validação e contagem de leads',()=>{
 assert.throws(()=>saveLead(seed,{name:' ',company:'X',contact:'X',stage:'Novo'}));
 const s=saveLead(seed,{name:'Teste',company:'Exemplo',contact:'a@example.com',stage:'Novo'},'teste');
 assert.equal(metrics(s).open,4);
 assert.equal(metrics(saveLead(s,{...s.leads.at(-1),stage:'Ganho'},'teste')).open,3);
 assert.throws(()=>readState({getItem:()=>'{'}));
});

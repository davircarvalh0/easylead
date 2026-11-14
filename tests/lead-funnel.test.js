import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/domain.js';
import {leadFunnel} from '../src/services/leadFunnelService.js';
import {saveLead} from '../src/services/leadProjectService.js';
test('participação mantém denominador, cruza filtros e responde a mudança de estágio',()=>{
 let state=structuredClone(seed);
 state.leads=state.leads.map((l,i)=>({...l,clientSegment:i<4?'A':'B'}));
 let model=leadFunnel(state,{segment:'A',stage:'Novo'});
 assert.equal(model.total,4);assert.equal(model.items.length,1);assert.equal(model.rows[0].participation,25);
 state=saveLead(state,{...state.leads[0],stage:'Proposta'},'l0');
 model=leadFunnel(state,{segment:'A',stage:'Novo'});
 assert.equal(model.total,4);assert.equal(model.items.length,0);assert.equal(model.rows[0].participation,0);assert.equal(model.rows[2].participation,50);
 assert.equal(leadFunnel(state,{segment:'ausente'}).rows.every(r=>r.participation===0),true);
 assert.equal(leadFunnel(state,{area:'a0'}).total,0);
 state.projects=[{id:'p0',areaId:'a0',phase:'Delivery',status:'Planejado'}];state.leads[0].projectId='p0';
 assert.equal(leadFunnel(state,{segment:'A',area:'a0',phase:'Delivery',search:'Aurora'}).total,1);
 assert.equal(leadFunnel(state,{segment:'B',area:'a0'}).total,0);
});

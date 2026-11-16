import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/domain.js';
import {analytics,saveGoal} from '../src/services/analyticsService.js';
import {createLeadProjectService} from '../src/services/leadProjectService.js';
test('total e meta reconciliam registros elegíveis e persistem pelo repository',()=>{
 const state={...structuredClone(seed),projects:[{id:'a',contractStatus:'Contratado',contractValue:54000},{id:'b',contractStatus:'Contratado',contractValue:72000},{id:'c',contractStatus:'Sem contrato',contractValue:28000}]};
 assert.equal(analytics(state).values.total,126000);assert.equal(analytics(state).values.average,63000);
 let stored;const service=createLeadProjectService({write:next=>stored=next});service.saveGoal(state,{indicator:'total',target:200000,period:'2026'});
 assert.equal(stored.goals[0].target,200000);assert.equal(analytics(stored).values.total/stored.goals[0].target,.63);assert.deepEqual(stored.projects,state.projects);
 assert.throws(()=>saveGoal(state,{indicator:'total',target:-1,period:'2026'}));
});
test('histórico usa apenas contratos elegíveis datados, sem preencher lacunas',()=>{
 const state={...structuredClone(seed),projects:[{contractStatus:'Contratado',contractValue:10,convertedAt:'2026-01-05'},{contractStatus:'Contratado',contractValue:20,convertedAt:'2026-03-05'},{contractStatus:'Contratado',contractValue:50},{contractStatus:'Sem contrato',contractValue:99,convertedAt:'2026-02-01'}]};
 assert.deepEqual(analytics(state).history,[{label:'2026-01',value:10},{label:'2026-03',value:20}]);
});
test('lead analytics honors segment, project dimensions, search and stage selections',()=>{
 const state={...structuredClone(seed),leads:[
  {id:'a',name:'Alpha',company:'One',stage:'Novo',clientSegment:'A',estimatedValue:100,projectId:'pa'},
  {id:'b',name:'Beta',company:'Two',stage:'Ganho',clientSegment:'A',projectId:'pb'},
  {id:'c',name:'Gamma',company:'Three',stage:'Proposta',clientSegment:'B',estimatedValue:900,projectId:'pc'},
  {id:'d',name:'Delta',company:'Four',stage:'Novo',clientSegment:'A',estimatedValue:50}
 ],projects:[
  {id:'pa',leadId:'a',clientSegment:'A',areaId:'a0',phase:'Discovery',status:'Planejado',contractStatus:'Contratado',contractValue:10},
  {id:'pb',leadId:'b',clientSegment:'A',areaId:'a1',phase:'Delivery',status:'Em andamento',contractStatus:'Contratado',contractValue:20},
  {id:'pc',leadId:'c',clientSegment:'B',areaId:'a0',phase:'Discovery',status:'Planejado',contractStatus:'Contratado',contractValue:90}
 ]};
 for(const [filters,ids,open,won,estimated] of [
  [{segment:'A'},['a','b','d'],2,1,150],
  [{area:'a0'},['a','c'],2,0,1000],
  [{phase:'Delivery'},['b'],0,1,null],
  [{status:'Planejado'},['a','c'],2,0,1000],
  [{segment:'A',area:'a0',phase:'Discovery',status:'Planejado'},['a'],1,0,100],
  [{search:'Two'},['b'],0,1,null],
  [{stage:'abertos'},['a','c','d'],3,0,1050],
  [{stage:'Ganho'},['b'],0,1,null],
  [{segment:'missing'},[],0,0,null]
 ]) {
  const model=analytics(state,filters);
  assert.deepEqual(model.comparisons.map(l=>l.id),ids);
  assert.equal(model.values.open,open);assert.equal(model.values.won,won);assert.equal(model.values.estimated,estimated);
 }
 assert.equal(analytics(state,{segment:'A',area:'a0'}).comparisons[0].contracted,10);
});

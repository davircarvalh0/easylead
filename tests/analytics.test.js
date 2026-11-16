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

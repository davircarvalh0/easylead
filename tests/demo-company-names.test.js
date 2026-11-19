import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renameDemoCompanies} from '../src/services/demoCompanyNames.js';

test('nomes fictícios preservam a carteira e o vínculo lead-projeto',()=>{
 const incoming={version:1,leads:[{id:'demo-1',company:'Empresa simulada 2026-01 · 1',name:'Empresa simulada 2026-01 · 1',clientSegment:'Construção Civil',stage:'Ganho',estimatedValue:1000,projectId:'p1'},{id:'real-1',company:'Empresa personalizada',name:'Portal',contact:'contato@example.com'},{id:'demo-2',company:'Prospecção simulada · Tech · 2026-01 · 1',name:'Oportunidade',stage:'Novo'}],projects:[{id:'p1',leadId:'demo-1',company:'Empresa simulada 2026-01 · 1',name:'Portal · Empresa simulada 2026-01 · 1',contractValue:900,status:'Em andamento'}]};
 const original=structuredClone(incoming),{state,renamed}=renameDemoCompanies(incoming);
 assert.equal(renamed,2);assert.deepEqual(incoming,original);
 assert.match(state.leads[0].company,/^Construtora /);assert.equal(state.projects[0].company,state.leads[0].company);
 assert.equal(state.projects[0].name,'Portal · '+state.leads[0].company);
 assert.equal(state.leads[0].name,state.leads[0].company);
 assert.deepEqual(state.leads[1],original.leads[1]);
 for(const collection of ['leads','projects'])for(let index=0;index<state[collection].length;index++){
  const {company,name,...before}=original[collection][index];const {company:newCompany,name:newName,...after}=state[collection][index];assert.deepEqual(after,before);
 }
 assert.deepEqual(renameDemoCompanies(incoming).state,state);
 assert.deepEqual(renameDemoCompanies(state),{state,renamed:0});
});

test('nomes únicos mesmo para grandes coortes do mesmo setor',()=>{
 const leads=Array.from({length:800},(_,index)=>({id:'demo-'+index,company:'Empresa simulada '+index,clientSegment:'Software & SaaS'}));
 const {state,renamed}=renameDemoCompanies({leads,projects:[]});
 assert.equal(renamed,800);assert.equal(new Set(state.leads.map(lead=>lead.company)).size,800);
 assert.ok(state.leads.every(lead=>!lead.company.includes('simulada')));
});

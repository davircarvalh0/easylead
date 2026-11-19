import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/domain.js';
import {createLeadProjectService, moveLeadStage} from '../src/services/leadProjectService.js';

test('mudança de estágio mantém campos legados e persiste uma única alteração', () => {
  const state = structuredClone(seed);
  state.leads[2].legacy = {note:'Preservar'};
  let written = 0;
  const service = createLeadProjectService({write:()=>written++});
  const next = service.moveLeadStage(state,'l2','Em contato');
  assert.equal(next.leads[2].stage,'Em contato');
  assert.deepEqual(next.leads[2].legacy,{note:'Preservar'});
  assert.equal(state.leads[2].stage,'Proposta');
  assert.equal(service.moveLeadStage(next,'l2','Em contato'),next);
  assert.equal(written,1);
  assert.throws(()=>service.moveLeadStage(next,'l2','Invalido'));
  next.projects.push({leadId:'l2'});
  assert.throws(()=>moveLeadStage(next,'l2','Perdido'),/convertido/);
  assert.equal(written,1);
});

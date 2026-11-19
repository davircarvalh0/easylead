import test from 'node:test';
import assert from 'node:assert/strict';
import {linkedInUrl, contractScale, leadContractAmounts} from '../src/services/leadWorkspace.js';

test('only signed project amounts share a linear scale across lead stages', () => {
  const leads = [
    {id:'l1', name:'Maior', stage:'Ganho', projectId:'p1', estimatedValue:185000},
    {id:'l2', name:'Menor', stage:'Proposta'},
    {id:'l3', name:'Sem contrato', stage:'Ganho', estimatedValue:42000},
    {id:'l4', name:'Sem projeto', stage:'Novo', estimatedValue:5000},
  ];
  const projects = [
    {id:'p1', contractStatus:'Contratado', contractValue:200000},
    {id:'p2', leadId:'l2', contractStatus:'Contratado', contractValue:10000},
    {id:'p3', leadId:'l3', contractStatus:'Sem contrato', contractValue:50000},
  ];
  const amounts = leadContractAmounts({projects}, leads);
  const {max, groups, unpriced} = contractScale(leads, amounts, 'stage');
  assert.equal(max, 200000);
  assert.equal(groups.get('Ganho')[0].ratio, 1);
  assert.equal(groups.get('Proposta')[0].ratio, .05);
  assert.deepEqual(unpriced, leads.slice(2));
  assert.equal(contractScale(leads.slice(2), amounts, 'direct').groups.size, 0);
});

test('LinkedIn accepts linkedIn URLs and profile shorthand only over HTTPS', () => {
  assert.equal(linkedInUrl(' linkedin.com/in/citi '), 'https://linkedin.com/in/citi');
  assert.equal(linkedInUrl('https://br.linkedin.com/company/citi'), 'https://br.linkedin.com/company/citi');
  for (const other of ['http://linkedin.com/in/citi','https://linkedin.com.example.com','https://user@linkedin.com','javascript:alert(1)','']) {
    assert.equal(linkedInUrl(other), null);
  }
});

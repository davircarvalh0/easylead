import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/domain.js';
import {conversionDemo} from '../src/services/leadConversionDemo.js';
import {leadActivityDay} from '../src/services/leadActivityService.js';
import {convert, moveLeadStage, saveLead} from '../src/services/leadProjectService.js';
import {leadQualification, monthlySectorRanking, qualificationSectors} from '../src/services/leadQualificationService.js';

test('qualificação compara setores e conta cada lead contratado uma só vez', () => {
  const leads = Array.from({length: 100}, (_, index) => ({
    id: String(index), name: 'Oportunidade ' + index, company: 'Exemplo', stage: 'Novo',
    clientSegment: index < 20 ? 'Varejo' : 'Finanças',
  }));
  leads[0].projectId = 'known';
  leads[1].stage = 'Ganho';
  leads[2].stage = 'Proposta';
  leads[3].stage = 'Perdido';
  leads[4].clientSegment = '';
  const areas = [{id: 'tech', name: 'Tech'}];
  const projects = [
    {id: 'known', leadId: '0', contractStatus: 'Contratado', areaId: 'tech', contractValue:120000, convertedAt: '2026-06-12'},
    {id: 'duplicate', leadId: '0', contractStatus: 'Contratado', contractValue:880000, convertedAt: '2026-07-05'},
    {id: 'unsigned', leadId: '1', contractStatus: 'Sem contrato'},
    {id: 'legacy', leadId: '20', contractStatus: 'Contratado', contractValue: null},
    {id: 'orphan', leadId: 'missing', contractStatus: 'Contratado'},
  ];
  const sample = {leads, areas, projects};
  const model = leadQualification(sample);
  assert.equal(model.total, 100);
  assert.equal(model.rate, .02);
  assert.deepEqual(model.monthly, [{label:'2026-06',value:1}]);
  assert.equal(model.undated, 1);
  assert.equal(model.averageValue, 120000);
  assert.equal(model.pricedProjects, 1);
  assert.equal(model.groups.find(group=>group.segment==='Finanças').averageValue, null);
  assert.deepEqual(model.pending.map(lead => lead.id), ['1']);
  assert.deepEqual(model.proposals.map(lead => lead.id), ['2']);
  assert.equal(model.lost, 1);
  assert.equal(model.unclassified.length, 1);
  assert.equal(model.focus, undefined);
  const retail = leadQualification(sample, {segment:'Varejo'});
  assert.equal(retail.rate, 1 / 19);
  assert.deepEqual(retail.areas, [['Tech', 1]]);
  assert.equal(leadQualification(sample, {search:'ausente'}).rate, null);
});

test('um setor com taxa alta e poucos registros não toma prioridade automaticamente', () => {
  const leads = Array.from({length: 11}, (_, index) => ({
    id: String(index), name: 'Lead', company: 'Exemplo', stage: 'Ganho',
    clientSegment: index < 10 ? 'Finanças' : 'Varejo',
  }));
  const projects = [0, 1, 2, 3, 4, 10].map(index => ({
    id: 'p' + index, leadId: String(index), contractStatus: 'Contratado', contractValue:(index + 1) * 1000,
  }));
  const model = leadQualification({leads, projects, areas:[]});
  assert.equal(model.focus.segment, 'Finanças');
  assert.equal(model.focus.averageValue, 3000);
  assert.equal(model.averageValue, (15000 + 11000) / 6);
});

test('métricas dos últimos sete dias incluem hoje, respeitam o recorte e deduplicam contatos', () => {
  const now = new Date('2026-11-18T01:00:00Z');
  const leads = [
    {id:'a', clientSegment:'A', createdAt:'2026-11-16', contactDays:['2026-11-16','2026-11-17'], stage:'Ganho'},
    {id:'b', clientSegment:'A', createdAt:'2026-11-10', contactDays:['2026-11-11'], stage:'Proposta'},
    {id:'c', clientSegment:'B', createdAt:'2026-11-18', contactDays:['2026-11-18'], stage:'Em contato'},
    {id:'d', clientSegment:'B', stage:'Em contato'},
  ];
  const projects = [
    {id:'p1', leadId:'a', contractStatus:'Contratado', convertedAt:'2026-11-17'},
    {id:'p2', leadId:'b', contractStatus:'Contratado', contractClosedAt:'2026-11-11'},
    {id:'p3', leadId:'c', contractStatus:'Contratado', convertedAt:'2026-11-18'},
    {id:'p4', leadId:'d', contractStatus:'Sem contrato', convertedAt:'2026-11-16'},
  ];
  const state = {leads, projects, areas:[]};
  assert.deepEqual(leadQualification(state, {}, now).weekly, {closed:2, contacted:2, registered:1});
  assert.deepEqual(leadQualification(state, {segment:'B'}, now).weekly, {closed:0, contacted:0, registered:0});
  assert.deepEqual(leadQualification(state, {}, new Date('2026-11-25T03:00:00Z')).weekly,
    {closed:0, contacted:0, registered:0});
});

test('edição, mudança no quadro e fechamento sem data registram atividade', () => {
  const today = leadActivityDay();
  let state = structuredClone(seed);
  state = saveLead(state, {...state.leads[0], stage:'Em contato'}, 'l0');
  assert.deepEqual(state.leads[0].contactDays,[today]);
  state = moveLeadStage(state, 'l0', 'Proposta');
  state = moveLeadStage(state, 'l0', 'Em contato');
  assert.deepEqual(state.leads[0].contactDays,[today]);
  state = moveLeadStage(state, 'l2', 'Em contato');
  assert.deepEqual(state.leads[2].contactDays,[today]);
  const {project} = convert(state, 'l3', {name:'Projeto', areaId:'a0', ownerId:'m0', contractStatus:'Contratado'});
  assert.equal(project.contractClosedAt,today);
  assert.equal(project.convertedAt,null);
});

test('setores disponíveis incluem o catálogo e ordenam por volume e nome', () => {
  const sectors = qualificationSectors([
    {segment:'Varejo & E-commerce', total:1},
    {segment:'Finanças & Pagamentos', total:1},
    {segment:'Setor legado', total:3},
  ]);
  assert.deepEqual(sectors.slice(0, 5).map(({segment,total}) => [segment,total]), [
    ['Setor legado',3], ['Finanças & Pagamentos',1], ['Varejo & E-commerce',1],
    ['Agricultura & Agronegócio',0], ['Alimentos & Bebidas',0],
  ]);
  assert.equal(sectors.find(sector => sector.segment === 'Não classificado').total,0);
});

test('sazonalidade por setor usa o mês de cadastro e contratos fechados no mesmo ano', () => {
  const leads = [
    {id:'a', clientSegment:'Varejo', createdAt:'2026-01-10'},
    {id:'b', clientSegment:'Varejo', createdAt:'2026-01-15'},
    {id:'c', clientSegment:'Varejo', createdAt:'2026-02-20'},
    {id:'d', clientSegment:'Finanças', createdAt:'2026-02-20'},
    {id:'legacy', clientSegment:'Finanças'},
  ];
  const projects = [
    {id:'a1', leadId:'a', contractStatus:'Contratado', convertedAt:'2026-03-01'},
    {id:'b1', leadId:'b', contractStatus:'Contratado', convertedAt:'2027-01-03'},
    {id:'c1', leadId:'c', contractStatus:'Sem contrato', convertedAt:'2026-04-01'},
    {id:'d1', leadId:'d', contractStatus:'Contratado', contractClosedAt:'2026-05-01'},
    {id:'legacy1', leadId:'legacy', contractStatus:'Contratado', convertedAt:'2026-04-01'},
  ];
  const activity = leadQualification({leads,projects,areas:[]}).sectorSeasonality.get('2026');
  assert.deepEqual(activity.get('Varejo'), {total:3,signed:1,months:new Map([
    ['2026-01',{total:2,signed:1}], ['2026-02',{total:1,signed:0}],
  ])});
  assert.deepEqual(activity.get('Finanças'), {total:1,signed:1,months:new Map([
    ['2026-02',{total:1,signed:1}],
  ])});
});

test('amostra tem 4% no total e taxas diferentes por setor nos dois anos', () => {
  const model = leadQualification(conversionDemo);
  assert.equal(model.total,9200);
  assert.equal(model.signed,368);
  assert.equal(model.groups.length,24);
  assert.equal(conversionDemo.projects.length,368);
  assert.equal(model.rate,.04);
  const finance = 'Finanças & Pagamentos';
  const retail = 'Varejo & E-commerce';
  assert.ok(new Set(model.groups.map(group => group.rate)).size > 2);
  for (const [year, financeSigned, retailSigned] of [['2025',2,6],['2026',3,5]]) {
    const sectors = model.sectorSeasonality.get(year);
    const groups = [...sectors.values()];
    assert.equal(groups.length,24);
    assert.equal(groups.reduce((sum,group) => sum + group.total,0),4600);
    assert.equal(groups.reduce((sum,group) => sum + group.signed,0),184);
    assert.equal(sectors.get(finance).total,100);
    assert.equal(sectors.get(retail).total,100);
    assert.equal(sectors.get(finance).signed,financeSigned);
    assert.equal(sectors.get(retail).signed,retailSigned);
    assert.equal(sectors.get(finance).months.size,10);
    assert.equal(sectors.get(retail).months.size,10);
  }
});

test('ranking mensal ordena pela conversão e preserva a variação dos contratos', () => {
  const contractsByMonth = new Map([
    ['2025-01',new Map([['Varejo',1]])],
    ['2025-12',new Map([['Finanças',2],['Varejo',3]])],
    ['2026-01',new Map([['Varejo',3],['Finanças',4],['Educação',3],['Saúde',2]])],
  ]);
  const cohort = (year,total,signed) => ({months:new Map([[year + '-01',{total,signed}]])});
  const sectorSeasonality = new Map([
    ['2025',new Map([['Varejo',cohort('2025',100,1)]])],
    ['2026',new Map([
      ['Varejo',cohort('2026',4,3)],
      ['Finanças',cohort('2026',40,2)],
      ['Educação',cohort('2026',2,1)],
      ['Logística',cohort('2026',10,0)],
    ])],
  ]);
  const model = {contractsByMonth,sectorSeasonality};
  assert.deepEqual(monthlySectorRanking(model,'01','2026'), [
    {segment:'Varejo',count:3,previousCount:3,leadsCreated:4,cohortContracts:3,rate:.75,change:0},
    {segment:'Educação',count:3,previousCount:0,leadsCreated:2,cohortContracts:1,rate:.5,change:null},
    {segment:'Finanças',count:4,previousCount:2,leadsCreated:40,cohortContracts:2,rate:.05,change:1},
    {segment:'Logística',count:0,previousCount:0,leadsCreated:10,cohortContracts:0,rate:0,change:null},
    {segment:'Saúde',count:2,previousCount:0,leadsCreated:0,cohortContracts:0,rate:null,change:null},
  ]);
  const combined = monthlySectorRanking(model,'01');
  assert.deepEqual(combined.slice(0,3).map(group => group.segment), ['Educação','Finanças','Varejo']);
  assert.equal(combined[2].rate,4 / 104);
  assert.equal(combined[2].change,1 / 3);
  assert.deepEqual(monthlySectorRanking(model,'02','2026'), []);
});

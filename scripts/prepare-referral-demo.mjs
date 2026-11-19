import {readFile, writeFile} from 'node:fs/promises';
import {basename} from 'node:path';
import {leadQualification} from '../src/services/leadQualificationService.js';
import {leadSectors} from '../src/services/leadSectors.js';
import {seed} from '../src/domain.js';
import {readLeadFile} from '../src/services/leadImport.js';
import {changeStatus, convert, importLeads, isEligibleForAverage} from '../src/services/leadProjectService.js';

const files = process.argv.slice(2);
if (!files.length) throw Error('Informe os caminhos dos arquivos CSV.');
const rows = (await Promise.all(files.map(async path =>
  readLeadFile(new File([await readFile(path)],basename(path))),
))).flat();
const target = new URL('../.env.demo-leads.json',import.meta.url);
const readOptional = url => readFile(url,'utf8').catch(error=>{
  if (error.code!=='ENOENT') throw error;
  return '';
});
const existing = await readOptional(target);
const initial = existing ? JSON.parse(existing) : {...structuredClone(seed),leads:[]};
const result = importLeads(initial,rows);
if (result.errors.length) throw Error(result.errors.length+' registro(s) com erro na base de demonstração.');
if (!result.state.leads.length) throw Error('Nenhum lead válido na base de demonstração.');

const sectorHints = [
  ['Educação Superior', /\b(universidade|faculdade|unicap|ufpe|ufrpe|ufc|unifbv|cesar school)\b/i],
  ['Educação Básica', /\b(escola|col[eé]gio)\b/i],
  ['Saúde & Biotech', /\b(hospital|cl[ií]nica|odontologia|unimed|sa[uú]de)\b/i],
  ['Farmacêutico', /\b(farm[aá]cia|drogaria|farmac[eê]utica)\b/i],
  ['Bancos & Crédito', /\b(banco|nubank|santander|ita[uú]|bradesco|sicredi|sicoob|cr[eé]dito)\b/i],
  ['Finanças & Pagamentos', /\b(pagamentos|contabilidade digital|fintech|picpay)\b/i],
  ['Gastronomia & Restaurantes', /\b(restaurante|pizzaria|lanchonete|hamburgueria|bistr[oô]|churrascaria)\b/i],
  ['Alimentos & Bebidas', /\b(alimentos|bebidas|cervejaria|cafeteria|sorveteria)\b/i],
  ['Hotelaria & Turismo', /\b(hotel|pousada|turismo|resort)\b/i],
  ['Varejo & E-commerce', /\b(loja|varejo|supermercado|e-commerce|magazine luiza|magalu|amazon|shopee)\b/i],
  ['Atacado & Distribuição', /\b(atacado|atacadista|distribuidora)\b/i],
  ['Logística & Transporte', /\b(log[ií]stica|transportes|transportadora|correios)\b/i],
  ['Marketing & Publicidade', /\b(marketing|publicidade|propaganda)\b/i],
  ['Arquitetura & Urbanismo', /\b(arquitetura|urbanismo)\b/i],
  ['Construção Civil', /\b(construtora|constru[cç][aã]o civil)\b/i],
  ['Energia Renovável', /\b(energia solar|energia renov[aá]vel|fotovoltaica)\b/i],
  ['Software & SaaS', /\b(software|saas|totvs)\b/i],
  ['Esportes & Bem-estar', /\b(acad[eê]mia|fitness|smart fit|esportes)\b/i],
  ['Beleza & Cosméticos', /\b(cosm[eé]ticos|natura|botic[aá]rio|maquiagem)\b/i],
  ['Jurídico & LegalTech', /\b(advocacia|advogados|legaltech)\b/i],
  ['Imobiliário', /\b(imobili[aá]ria|im[oó]veis)\b/i],
  ['Veterinária & Mercado Pet', /\b(veterin[aá]ria|pet shop|petz)\b/i],
  ['Automotivo', /\b(concession[aá]ria|automotivo|toyota|hyundai|volkswagen|fiat)\b/i],
];

const normalizeCompany = name => name.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'')
  .replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const assignments = new Map();
const sectorFile = await readOptional(new URL('../.env.demo-sectors.txt', import.meta.url));
for (const line of sectorFile.trim().split(/\r?\n/).filter(Boolean)) {
  const [sector,...names] = line.split('|');
  if (!leadSectors.includes(sector)) throw Error('Setor inválido: '+sector);
  for (const name of names) assignments.set(normalizeCompany(name.replace('¦','|')),sector);
}

const unclassified = 'Não classificado';
function classify(lead) {
  if (lead.clientSegment && lead.clientSegment!==unclassified) return lead;
  const sector = assignments.get(normalizeCompany(lead.company))
    || sectorHints.find(([,pattern])=>pattern.test(lead.company))?.[0];
  return sector ? {...lead,clientSegment:sector} : lead;
}

const source = result.state.leads.slice(initial.leads.length);
const availableStages = ['Novo','Novo','Em contato','Proposta','Perdido'];
const projectAreas = ['a0','a2','a3'];
const projectThemes = ['Diagnóstico digital','Portal de atendimento','Integração de dados','Automação comercial'];
const signedCount = Math.round(source.length*.04);
const projectCount = Math.min(source.length, signedCount+8);
const months = [10,22,34,3,16,28,10,22,34,1,7,13,19,25,31,9,21,33,4,17,30];
const selectedProjects = new Map();
for (let index=0; index<projectCount; index++) {
  const selectedMonth = months[index % months.length];
  const candidates = source.flatMap((_,row)=>row%35===selectedMonth && !selectedProjects.has(row) ? [row] : []);
  const leadIndex = candidates[index % candidates.length] ?? source.findIndex((_,row)=>!selectedProjects.has(row));
  selectedProjects.set(leadIndex,index);
}

function periodFor(index) {
  const month = index%35;
  return (2024+Math.floor(month/12))+'-'+String(month%12+1).padStart(2,'0');
}

const reviewed = initial.leads.map(classify);
const leads = reviewed.concat(source.map((lead,index)=>{
  const period = periodFor(index);
  const ordinal = initial.leads.length+index+1;
  const estimatedValue = 6000+(ordinal*7919)%174000;
  const stage = selectedProjects.has(index) ? 'Ganho' : availableStages[(index+Math.floor(index/35))%availableStages.length];
  return classify({
    ...lead,id:'indicacao-demo-'+ordinal,createdAt:period+'-'+String(2+index%8).padStart(2,'0'),
    stage,estimatedValue,
    ...(index%4===0 ? {businessOwnerId:'m1'} : {}),
    ...(['Em contato','Proposta','Ganho'].includes(stage) ? {contactDays:[period+'-11']} : {}),
    ...(stage==='Proposta' && index%2===0 ? {proposal:{
      price:estimatedValue,description:'Proposta simulada para avaliar o fluxo comercial.',
      documentUrl:'',attachment:null,
    }} : {}),
  });
}));
const sectorByLead = new Map(leads.map(lead=>[lead.id,lead.clientSegment]));
let state = {
  ...initial,demoWorkspace:true,leads,
  demoRevision:(initial.demoRevision ?? 0)+Number(source.length>0 || reviewed.some((lead,index)=>lead!==initial.leads[index])),
  projects:initial.projects.map(project=>({...project,clientSegment:sectorByLead.get(project.leadId) || project.clientSegment})),
};

for (const [leadIndex,projectIndex] of selectedProjects) {
  const lead = leads[initial.leads.length+leadIndex];
  const contracted = projectIndex<signedCount;
  const period = periodFor(leadIndex);
  const status = ['Em andamento','Concluído','Planejado'][projectIndex%3];
  const converted = convert(state,lead.id,{
    name:projectThemes[projectIndex%projectThemes.length]+' · '+lead.company,
    areaId:projectAreas[projectIndex%projectAreas.length],
    phase:projectIndex%2 ? 'Discovery' : 'Delivery',
    contractStatus:contracted ? 'Contratado' : 'Sem contrato',
    contractValue:contracted ? Math.round(lead.estimatedValue*.9) : null,
    convertedAt:contracted ? period+'-'+(12+projectIndex%6) : null,
  });
  state = changeStatus(converted.state,converted.project.id,status);
}

// Complete the simulated closing history without changing the stages of imported leads.
const demoYears = [...new Set(state.leads.map(lead=>lead.createdAt?.slice(0,4)).filter(Boolean))].sort();
const monthlyContracts = new Map();
for (const project of state.projects.filter(isEligibleForAverage)) {
  const period = (project.convertedAt || project.contractClosedAt)?.slice(0,7);
  if (period) monthlyContracts.set(period,(monthlyContracts.get(period) || 0)+1);
}

const demoSectors = [...new Set(state.leads.map(lead=>lead.clientSegment))]
  .filter(sector=>leadSectors.includes(sector))
  .sort((a,b)=>a.localeCompare(b,'pt-BR'));
let generated = 0;
for (const [yearIndex,year] of demoYears.entries()) {
  for (let month=1;month<=12;month++) {
    const period = year+'-'+String(month).padStart(2,'0');
    const count = monthlyContracts.get(period) || 0;
    for (let slot=count;slot<2;slot++) {
      const scenario = (yearIndex*12+month-1)*2+slot;
      const company = 'Empresa simulada '+period+' · '+(slot+1);
      const id = 'demo-mensal-'+period+'-'+(slot+1);
      const contractValue = 22000+((scenario*7919)%138000);
      const lead = {
        id,name:company,company,contact:id+'@example.com',stage:'Ganho',
        createdAt:period+'-0'+(3+slot*2),contactDays:[period+'-08'],
        clientSegment:demoSectors[scenario%demoSectors.length] || unclassified,
        estimatedValue:Math.round(contractValue*1.1),
      };
      const converted = convert({...state,leads:[...state.leads,lead]},id,{
        name:projectThemes[scenario%projectThemes.length]+' · '+company,
        areaId:projectAreas[scenario%projectAreas.length],
        phase:slot ? 'Delivery' : 'Discovery',contractValue,convertedAt:period+'-'+(12+slot*4),
      });
      state = changeStatus(converted.state,converted.project.id,['Em andamento','Concluído','Planejado'][scenario%3]);
      generated++;
    }
  }
}
// Give signed cohorts a non-converted sample too, especially periods made entirely from demo contracts.
const cohortLeads = [];
const {sectorSeasonality} = leadQualification(state);
for (const sectors of sectorSeasonality.values()) {
  for (const [sector,entry] of sectors) {
    for (const [period,cohort] of entry.months) {
      const missing = cohort.signed * 10 - cohort.total;
      for (let index=0; index<missing; index++) {
        const offset = cohort.total + index + 1;
        const id = 'demo-base-'+period+'-'+encodeURIComponent(sector)+'-'+offset;
        const company = 'Prospecção simulada · '+sector+' · '+period+' · '+offset;
        cohortLeads.push({
          id,name:company,company,contact:id+'@example.com',stage:index%3===0 ? 'Novo' : 'Perdido',
          createdAt:period+'-'+String(3+index%12).padStart(2,'0'),clientSegment:sector,
        });
      }
    }
  }
}
state.leads = [...state.leads,...cohortLeads];
if (generated || cohortLeads.length) state.demoRevision = Math.max(state.demoRevision,(initial.demoRevision ?? 0)+1);

await writeFile(target,JSON.stringify(state));
console.log(JSON.stringify({
  added:result.added,generated,cohortLeads:cohortLeads.length,leads:state.leads.length,projects:state.projects.length,
  contracts:state.projects.filter(project=>project.contractStatus==='Contratado').length,
  duplicates:result.duplicates,outsideIcp:result.outsideIcp,
  unclassified:state.leads.filter(lead=>lead.clientSegment==='Não classificado').length,
}));

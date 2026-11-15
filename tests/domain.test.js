import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,metrics} from '../src/domain.js';
import {saveLead,convert,changeStatus,createLeadProjectService} from '../src/services/leadProjectService.js';
import {readState,STORAGE_KEY,createStateRepository} from '../src/repositories/stateRepository.js';
import {addDemo,calculateAverageMetrics,filterProjects,changePhase,isEligibleForAverage} from '../src/services/leadProjectService.js';

test('médias aplicam interseção dos filtros, duas dimensões e exclusões',()=>{
 const state=addDemo(seed);
 const result=calculateAverageMetrics(state);
 assert.equal(result.average,54000);assert.equal(result.eligibleCount,3);assert.equal(result.total,5);
 assert.equal(result.withoutValue,1);assert.equal(result.withoutContract,1);
 const segment=calculateAverageMetrics(state,{},'segment');
 assert.equal(segment.groups.find(g=>g.label==='Finanças & Pagamentos').average,63000);
 assert.equal(result.groups.find(g=>g.key==='a3').average,36000);
 const filters={segment:'Finanças & Pagamentos',phase:'Discovery',area:'a0'};
 assert.equal(filterProjects(state,filters).length,1);
 assert.equal(calculateAverageMetrics(state,filters).average,72000);
 assert.equal(filterProjects(state,{...filters,area:'a2'}).length,0);
 const empty=calculateAverageMetrics(state,{segment:'Saúde & Biotech'});
 assert.equal(empty.average,null);assert.equal(empty.eligibleCount,0);assert.equal(empty.total,1);
 assert.equal(calculateAverageMetrics(state,{phase:'inexistente'}).average,null);
 for(const value of [null,undefined,0,-1,NaN,Infinity,'54000',true]) assert.equal(isEligibleForAverage({contractStatus:'Contratado',contractValue:value}),false);
 assert.equal(isEligibleForAverage({contractStatus:'Sem contrato',contractValue:100}),false);
 assert.deepEqual(addDemo(state),state);
});

test('fase evolui no mesmo projeto sem duplicar contrato ou vínculo',()=>{
 const state=addDemo(seed),p=state.projects.find(p=>p.phase==='Discovery');
 const next=changePhase(state,p.id),updated=next.projects.find(x=>x.id===p.id);
 assert.equal(updated.phase,'Delivery');assert.equal(updated.originPhase,'Discovery');
 assert.equal(updated.squadId,p.squadId);assert.equal(updated.leadId,p.leadId);
 assert.equal(next.projects.length,state.projects.length);assert.equal(calculateAverageMetrics(next).average,54000);
 assert.equal(p.phase,'Discovery');assert.throws(()=>changePhase(next,p.id));
 for(const value of [-1,0,Infinity,'inválido',true]) assert.throws(()=>convert(seed,'l3',{name:'X',areaId:'a0',ownerId:'m0',contractValue:value}));
});

test('repository hidrata projeto anterior sem inventar valor nem perder extensões',()=>{
 const previous={...structuredClone(seed),custom:'preservar',projects:[{id:'old',name:'Antigo',leadId:'l3',areaId:'a2',ownerId:'m2',memberIds:['m2'],status:'Em andamento',custom:42}]};
 delete previous.squads;previous.leads.forEach(l=>delete l.clientSegment);
 const migrated=readState({getItem:()=>JSON.stringify(previous)});
 assert.equal(migrated.projects[0].id,'old');assert.equal(migrated.projects[0].phase,'Delivery');
 assert.equal(migrated.projects[0].contractValue,null);assert.equal(migrated.projects[0].custom,42);
 assert.equal(migrated.leads[3].clientSegment,'Não classificado');assert.equal(migrated.custom,'preservar');
 assert.equal(migrated.squads[0].id,migrated.projects[0].squadId);
 assert.equal(calculateAverageMetrics(migrated).average,null);
 assert.deepEqual(readState({getItem:()=>JSON.stringify(migrated)}),migrated);
 assert.equal(previous.projects[0].phase,undefined);
});
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

test('repository preserva formato anterior e campos extras em todo o fluxo',()=>{
 const legacy=structuredClone(seed);
 legacy.extra={preservar:true};legacy.leads[3].custom='campo existente';
 let raw=JSON.stringify(legacy);
 const storage={getItem:key=>{assert.equal(key,STORAGE_KEY);return raw},setItem:(key,value)=>{assert.equal(key,STORAGE_KEY);raw=value}};
 const service=createLeadProjectService(createStateRepository(()=>storage));
 const initial=service.load();
 const edited=service.saveLead(initial,{...initial.leads[3],name:'  Projeto legado  '},'l3');
 const {state,project}=service.convert(edited,'l3',{name:'  Projeto legado  ',areaId:'a2',ownerId:'m2',memberIds:['m0','m2','m0']});
 assert.deepEqual(project.memberIds,['m2','m0']);
 assert.equal(project.name,'Projeto legado');
 assert.equal(state.leads[3].custom,'campo existente');
 assert.deepEqual(state.extra,{preservar:true});
 const repeated=service.convert(state,'l3',{});
 assert.equal(repeated.project,project);assert.equal(repeated.state,state);
 const final=service.changeStatus(state,project.id,'Em andamento');
 assert.deepEqual(service.load(),final);
 assert.equal(JSON.parse(raw).projects.length,1);
 assert.equal(initial.leads[3].projectId,undefined);
});

test('leitura vazia clona seed e leitura inválida bloqueia sobrescrita',()=>{
 const empty=createStateRepository(()=>({getItem:()=>null}));
 const first=empty.read();first.leads[0].name='alterado';
 assert.deepEqual(empty.read(),seed);
 for(const raw of ['{',JSON.stringify({...seed,version:99}),JSON.stringify({...seed,leads:{}})]){
  let writes=0;
  const repository=createStateRepository(()=>({getItem:()=>raw,setItem:()=>writes++}));
  assert.throws(()=>repository.read());
  assert.throws(()=>repository.write(seed),/Persistência indisponível/);
  assert.equal(writes,0);
 }
 const denied=createStateRepository(()=>{throw Error('SecurityError')});
 assert.throws(()=>denied.read());assert.throws(()=>denied.write(seed),/Persistência indisponível/);
});

test('falha de escrita não publica conversão nem modifica estado de entrada',()=>{
 let raw=JSON.stringify(seed);
 let blocked=true;
 const service=createLeadProjectService(createStateRepository(()=>({getItem:()=>raw,setItem:(key,value)=>{if(blocked)throw Error('quota');raw=value}})));
 const initial=service.load();
 const data={name:'Projeto',areaId:'a0',ownerId:'m0'};
 assert.throws(()=>service.convert(initial,'l3',data),/Não foi possível salvar/);
 assert.deepEqual(initial,seed);assert.deepEqual(JSON.parse(raw),seed);
 blocked=false;
 const result=service.convert(initial,'l3',data);
 assert.equal(result.state.projects.length,1);
 assert.throws(()=>convert(seed,'inexistente',data),/Lead não encontrado/);
 assert.throws(()=>convert(seed,'l3',{...data,memberIds:['inexistente']}),/Integrante inválido/);
});

import {valueBlocks,addValueDemo} from '../src/services/leadProjectService.js';
test('blocos distinguem valores e excluem não contratos, mantendo escala global e recortes',()=>{
 const state=addValueDemo(seed);
 assert.deepEqual(addValueDemo(state),state);
 const model=valueBlocks(state,'leads');
 const aurora=model.items.find(r=>r.item.name==='Portal Aurora');
 const horizonte=model.items.find(r=>r.item.name==='Loja Horizonte');
 assert.equal(aurora.value/horizonte.value,20);
 assert.equal(aurora.label,'Valor Contratado');assert.equal(aurora.item.estimatedValue,185000);
 assert.equal(aurora.ratio/horizonte.ratio,20);
 assert.equal(valueBlocks(seed,'leads').items[0].label,'Valor Estimado');
 const filtered=valueBlocks(state,'leads',{segment:'Finanças & Pagamentos',phase:'Delivery',area:'a0',stage:'Ganho'});
 assert.deepEqual(filtered.items.map(r=>r.id),['l0']);
 assert.equal(valueBlocks(state,'leads',{phase:'Discovery',area:'a0'}).items.length,0);
 const combined=addDemo(state),projects=valueBlocks(combined,'projects',{},'squad');
 assert.equal(projects.unvalued.length,2);
 assert.equal(projects.items.find(r=>r.item.name==='Agente Interno').value,null);
 const noContract={...state,projects:state.projects.map(p=>({...p,contractStatus:'Sem contrato'}))};
 assert.equal(valueBlocks(noContract,'leads').items[0].value,185000);
 assert.equal(valueBlocks(noContract,'projects').unvalued.length,2);
 assert.equal(seed.projects.length,0);
});

import {saveMember, organizationAtoms} from '../src/services/leadProjectService.js';
test('cadastro mínimo persiste sem alterar dados existentes e recalcula população',()=>{
 let raw;
 const storage={getItem:()=>raw || null,setItem:(_,value)=>{raw=value;}};
 const service=createLeadProjectService(createStateRepository(()=>storage));
 const initial=service.load();
 let next=initial;
 for(let i=0;i<5;i++) next=service.saveMember(next,{name:`  Pessoa ${i}  `,areaId:'a0'},`new-${i}`);
 assert.equal(next.members.at(-1).role,'Integrante');
 assert.equal(next.members.at(-1).name,'Pessoa 4');
 assert.deepEqual(initial.members,seed.members);
 assert.deepEqual(next.projects,initial.projects);
 const atoms=organizationAtoms(next);
 assert.equal(atoms.find(a=>a.id==='a0').count,6);
 assert.equal(atoms.find(a=>a.id==='a0').desktopDiameter,152);
 assert.equal(atoms.find(a=>a.id==='a4').desktopDiameter,121);
 assert.equal(atoms.find(a=>a.id==='a0').mobileDiameter,116);
 assert.equal(atoms.find(a=>a.id==='a4').mobileDiameter,96);
 const reloaded=createLeadProjectService(createStateRepository(()=>storage)).load();
 assert.deepEqual(reloaded.members,next.members);
 assert.equal(reloaded.members.filter(m=>m.areaId==='a0').length,6);
});
test('cadastro rejeita dados inválidos e falha de armazenamento',()=>{
 for(const data of [{name:' ',areaId:'a0'},{name:'Ana',areaId:'inexistente'},{name:42,areaId:'a0'}]) assert.throws(()=>saveMember(seed,data));
 assert.throws(()=>saveMember(seed,{name:'Ana',areaId:'a0'},'m0'));
 const service=createLeadProjectService({write(){throw Error('Sem espaço');}});
 assert.throws(()=>service.saveMember(seed,{name:'Nova',areaId:'a0'}),/Sem espaço/);
 assert.equal(seed.members.length,5);
});
test('escala mantém igualdade, vazio e limites com grande população',()=>{
 assert.deepEqual(organizationAtoms({...seed,areas:[]}),[]);
 const equal=organizationAtoms(seed);
 assert.equal(new Set(equal.map(a=>a.desktopDiameter)).size,1);
 const empty=organizationAtoms({...seed,members:[]});
 assert.ok(empty.every(a=>a.count===0 && a.mobileDiameter===88));
 const large=organizationAtoms({...seed,members:Array.from({length:1000},(_,i)=>({id:String(i),areaId:'a0'}))});
 assert.equal(large[0].desktopDiameter,195);
 assert.equal(large[1].mobileDiameter,88);
});

test('escala absoluta cresce com 0, 1 e v?rios sem depender das outras ?reas',()=>{
 const atoms = n => organizationAtoms({...seed,members:Array.from({length:n},(_,i)=>({id:String(i),areaId:'a0'}))});
 assert.ok(atoms(0)[0].desktopDiameter < atoms(1)[0].desktopDiameter);
 assert.ok(atoms(1)[0].desktopDiameter < atoms(6)[0].desktopDiameter);
 assert.equal(atoms(1)[0].desktopDiameter,organizationAtoms({...seed,members:[{id:'x',areaId:'a0'},...Array.from({length:50},(_,i)=>({id:String(i),areaId:'a1'}))]})[0].desktopDiameter);
});

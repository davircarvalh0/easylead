import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,metrics} from '../src/domain.js';
import {saveLead,convert,changeStatus,createLeadProjectService} from '../src/services/leadProjectService.js';
import {readState,STORAGE_KEY,createStateRepository} from '../src/repositories/stateRepository.js';
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

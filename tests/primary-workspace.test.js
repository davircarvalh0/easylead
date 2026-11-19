import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/domain.js';
import {promoteDemoToPrimary,hasPrimaryWorkspace,PRIMARY_SOURCE_KEY,PREVIOUS_PRIMARY_KEY} from '../src/repositories/primaryWorkspace.js';
import {STORAGE_KEY} from '../src/repositories/stateRepository.js';

function memory(entries={}){const map=new Map(Object.entries(entries));return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};}
const incoming={...structuredClone(seed),demoWorkspace:true,demoRevision:1,leads:[{...seed.leads[0],id:'demo-lead',company:'Empresa demo'}],projects:[]};

test('demo passa a ser principal com backup exato da carteira antiga',()=>{
 const old=JSON.stringify(seed),storage=memory({[STORAGE_KEY]:old});
 const result=promoteDemoToPrimary(storage,incoming);
 assert.equal(result.leads[0].id,'demo-lead');assert.equal(result.primaryWorkspaceSource,'demo');
 assert.equal(storage.getItem(PREVIOUS_PRIMARY_KEY),old);assert.equal(hasPrimaryWorkspace(storage),true);
 assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).leads.length,1);
});
test('preserva edições da demo e não substitui novamente a carteira principal',()=>{
 const saved={...structuredClone(incoming),leads:[{...incoming.leads[0],company:'Demo editada'}]};
 const storage=memory({[STORAGE_KEY+'-demo']:JSON.stringify(saved)});
 assert.equal(promoteDemoToPrimary(storage,incoming).leads[0].company,'Demo editada');
 const primary=JSON.parse(storage.getItem(STORAGE_KEY));primary.leads[0].company='Principal editada';storage.setItem(STORAGE_KEY,JSON.stringify(primary));
 assert.equal(promoteDemoToPrimary(storage,incoming).leads[0].company,'Principal editada');
 assert.equal(JSON.parse(storage.getItem(STORAGE_KEY+'-demo')).leads[0].company,'Demo editada');
});
test('dados corrompidos ou falta de espaço não apagam a principal',()=>{
 for(const badKey of [STORAGE_KEY,STORAGE_KEY+'-demo']){
  const storage=memory({[STORAGE_KEY]:JSON.stringify(seed),[badKey]:'{invalid'}),before=storage.getItem(STORAGE_KEY);
  assert.throws(()=>promoteDemoToPrimary(storage,incoming));assert.equal(storage.getItem(STORAGE_KEY),before);
  assert.equal(storage.getItem(PRIMARY_SOURCE_KEY),null);
 }
 const old=JSON.stringify(seed),storage=memory({[STORAGE_KEY]:old}),write=storage.setItem;
 storage.setItem=(key,value)=>{if(key===PRIMARY_SOURCE_KEY)throw Error('quota');return write(key,value);};
 assert.throws(()=>promoteDemoToPrimary(storage,incoming));assert.equal(storage.getItem(STORAGE_KEY),old);assert.equal(storage.getItem(PREVIOUS_PRIMARY_KEY),old);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {seed} from '../src/domain.js';
import {fillDemoProjectContracts} from '../src/services/demoProjectContracts.js';
import {assignDemoBusinessOwners} from '../src/services/demoBusinessOwners.js';
import {createDemoUpdateSql} from '../scripts/demo-update-sql.mjs';
function fixture(){return {...structuredClone(seed),leads:[
 {id:'estimated',estimatedValue:10000,stage:'Ganho',businessOwnerId:'m1'},
 {id:'proposal',estimatedValue:10000,proposal:{price:12345.67},stage:'Ganho'},
 {id:'tiny',estimatedValue:.01,stage:'Ganho'},
],projects:[
 {id:'kept',leadId:'estimated',contractValue:8450.99,contractStatus:'Sem contrato',status:'Concluído',convertedAt:'2026-01-05'},
 {id:'estimated-project',leadId:'estimated',contractValue:null,contractStatus:'Sem contrato',status:'Planejado'},
 {id:'proposal-project',leadId:'proposal',contractStatus:'Sem contrato',status:'Em andamento'},
 {id:'orphan',contractValue:0,contractStatus:'Sem contrato'},
 {id:'tiny-project',leadId:'tiny',contractValue:-1},
 {id:'invalid',contractValue:'não informado'},
]};}

test('preenche contratos sem alterar valores positivos, datas ou vínculos',()=>{
 const incoming=fixture(),original=structuredClone(incoming),result=fillDemoProjectContracts(incoming);
 assert.deepEqual(incoming,original);assert.equal(result.valued,5);assert.equal(result.projects,6);
 assert.equal(result.state.projects[0].contractValue,8450.99);assert.equal(result.state.projects[1].contractValue,9000);assert.equal(result.state.projects[2].contractValue,12345.67);assert.equal(result.state.projects[4].contractValue,1);
 assert.ok(result.state.projects.every(project=>project.contractValue>0&&project.contractStatus==='Contratado'));
 for(let index=0;index<incoming.projects.length;index++){const {contractValue,contractStatus,...expected}=original.projects[index];const {contractValue:value,contractStatus:status,...actual}=result.state.projects[index];assert.deepEqual(actual,expected);}
 assert.deepEqual(result.state.leads,original.leads);assert.deepEqual(fillDemoProjectContracts(result.state).state,result.state);
});

test('SQL unificado replica a demo e desfaz tudo se a segunda atualização falhar',async()=>{
 const db=await PGlite.create();
 try{
  await db.exec(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8'));
  const initial=fixture(),expected=fillDemoProjectContracts(assignDemoBusinessOwners(initial).state).state;
  await db.query('INSERT INTO easylead_workspaces(id,state,revision) VALUES($1,$2::jsonb,$3)',['main',JSON.stringify(initial),3]);
  const migration=await createDemoUpdateSql();assert.equal(migration,await readFile(new URL('../supabase/update-demo.sql',import.meta.url),'utf8'));
  await db.exec(migration);const first=(await db.query('SELECT state,revision FROM easylead_workspaces WHERE id=$1',['main'])).rows[0];assert.deepEqual(first.state,expected);assert.equal(Number(first.revision),5);
  await db.exec(migration);assert.deepEqual((await db.query('SELECT state,revision FROM easylead_workspaces WHERE id=$1',['main'])).rows[0],first);
  const invalid={...fixture(),projects:{invalid:true}};await db.query('INSERT INTO easylead_workspaces(id,state,revision) VALUES($1,$2::jsonb,$3)',['bad',JSON.stringify(invalid),9]);
  await assert.rejects(db.exec(await createDemoUpdateSql('bad')));await db.exec('ROLLBACK');const untouched=(await db.query('SELECT state,revision FROM easylead_workspaces WHERE id=$1',['bad'])).rows[0];assert.deepEqual(untouched.state,invalid);assert.equal(Number(untouched.revision),9);
 }finally{await db.close();}
});

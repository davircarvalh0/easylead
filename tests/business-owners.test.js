import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {seed} from '../src/domain.js';
import {assignDemoBusinessOwners,demoBusinessOwners} from '../src/services/demoBusinessOwners.js';
const makeState=()=>({...structuredClone(seed),leads:[
 ...Array.from({length:144},(_,i)=>({id:'existing-'+i,name:'Existente '+i,company:'Empresa '+i,contact:'contact@example.com',stage:'Novo',businessOwnerId:'m1'})),
 ...Array.from({length:1111},(_,i)=>({id:'unassigned-'+i,name:'Oportunidade '+i,company:'Empresa '+i,contact:'contact@example.com',stage:'Proposta',estimatedValue:i*100,createdAt:'2026-01-01'})),
],projects:[{id:'project-1',leadId:'existing-0',contractValue:15000,name:'Projeto preservado'}]});

test('três integrantes em Negócios recebem apenas leads não atribuídos em quantidades distintas',()=>{
 const original=makeState(),copy=structuredClone(original),result=assignDemoBusinessOwners(original);
 assert.deepEqual(original,copy);assert.equal(result.assigned,1111);assert.deepEqual(result.owners.map(owner=>owner.leads),[556,333,222]);
 assert.equal(result.state.members.length,8);assert.deepEqual(result.state.projects,original.projects);
 assert.ok(result.state.members.filter(member=>demoBusinessOwners.some(owner=>owner.id===member.id)).every(member=>member.areaId==='a1'));
 assert.deepEqual(result.state.leads.slice(0,144),original.leads.slice(0,144));
 result.state.leads.forEach((lead,index)=>{const {businessOwnerId,...rest}=lead;const {businessOwnerId:before,...previous}=original.leads[index];assert.deepEqual(rest,previous);if(before)assert.equal(businessOwnerId,before);else assert.ok(demoBusinessOwners.some(owner=>owner.id===businessOwnerId));});
 const repeated=assignDemoBusinessOwners(result.state);assert.equal(repeated.assigned,0);assert.deepEqual(repeated.state,result.state);
});

test('SQL do Supabase preserva dados, reutiliza integrantes e é seguro para repetir',async()=>{
 const db=await PGlite.create();
 try{
  const initial=makeState();initial.members.push({id:'existing-tiago',name:'Tiago Mattos',areaId:'a1',role:'Gestor'});
  const expected=assignDemoBusinessOwners(initial).state;
  await db.exec(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8'));
  await db.query('INSERT INTO easylead_workspaces(id,state,revision) VALUES($1,$2::jsonb,$3)',['main',JSON.stringify(initial),7]);
  await db.query('INSERT INTO easylead_workspaces(id,state,revision) VALUES($1,$2::jsonb,$3)',['other',JSON.stringify(initial),4]);
  const migration=await readFile(new URL('../supabase/migrations/202611190001_business_lead_owners.sql',import.meta.url),'utf8');
  await db.exec(migration);const first=(await db.query('SELECT state,revision FROM easylead_workspaces WHERE id=$1',['main'])).rows[0];
  assert.deepEqual(first.state,expected);assert.equal(Number(first.revision),8);
  await db.exec(migration);const repeated=(await db.query('SELECT state,revision FROM easylead_workspaces WHERE id=$1',['main'])).rows[0];assert.deepEqual(repeated,first);
  const other=(await db.query('SELECT state,revision FROM easylead_workspaces WHERE id=$1',['other'])).rows[0];assert.deepEqual(other.state,initial);assert.equal(Number(other.revision),4);
  const wrongArea={...initial,areas:initial.areas.filter(area=>area.id!=='a1')};await db.query('INSERT INTO easylead_workspaces(id,state) VALUES($1,$2::jsonb)',['bad',JSON.stringify(wrongArea)]);
  await assert.rejects(db.exec(migration.replace('BEGIN;',"BEGIN; SET LOCAL easylead.workspace_id TO 'bad';")),/área de Negócios/);await db.exec('ROLLBACK');assert.deepEqual((await db.query('SELECT state FROM easylead_workspaces WHERE id=$1',['bad'])).rows[0].state,wrongArea);
 }finally{await db.close();}
});

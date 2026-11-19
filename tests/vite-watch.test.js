import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rename,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'vite';
import projectConfig from '../vite.config.js';

test('Vite invalida um módulo em cache quando o arquivo é substituído atomicamente',async()=>{
 const temporaryBase=await realpath(tmpdir());
 const root=await mkdtemp(join(temporaryBase,'easylead-vite-watch-'));
 let server;
 try{
  const file=join(root,'module.js');await writeFile(file,'export const original = true;');
  const config=await projectConfig({command:'serve',mode:'test'});
  server=await createServer({...config,configFile:false,root,logLevel:'silent',server:{...config.server,host:'127.0.0.1',port:0,ws:false}});
  await server.listen();const url='http://127.0.0.1:'+server.httpServer.address().port+'/module.js';
  assert.match(await (await fetch(url)).text(),/export const original/);
  await writeFile(file+'.tmp','export const original = true;\nexport function newExport(){return "updated";}');await rename(file+'.tmp',file);
  let updated='';
  for(let attempt=0;attempt<50;attempt++){updated=await (await fetch(url)).text();if(updated.includes('function newExport'))break;await delay(100);}
  assert.match(updated,/export function newExport/,'O Vite deve servir o novo export sem reiniciar ou trocar a URL.');
 }finally{await server?.close();assert.equal(dirname(resolve(root)),resolve(temporaryBase));assert.ok(basename(root).startsWith('easylead-vite-watch-'));await rm(root,{recursive:true,force:true});}
});

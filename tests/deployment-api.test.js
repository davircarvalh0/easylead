import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {seed} from '../src/domain.js';
import {createDeploymentApi} from '../server/deployment-api.js';
import {deploymentConfig} from '../server/deployment-config.js';
import {signSession,parseSession} from '../server/auth.js';
import {applyWorkspaceCommand,createPostgresRepository} from '../server/postgres.js';

const env={DATABASE_URL:'postgresql://example:example@localhost/example',APP_ACCESS_CODE:'test-access-code-123',SESSION_SECRET:'test-secret-with-at-least-thirty-two-characters',APP_ALLOWED_EMAILS:'user@example.com',APP_ORIGIN:'http://localhost',DEEPSEEK_API_KEY:'server-only-test-key',DEEPSEEK_MODEL:'test-configured-model'};

test('configuração exige segredos fortes e não aceita sessões forjadas ou expiradas',()=>{
 assert.throws(()=>deploymentConfig({}),/DATABASE_URL/);
 assert.throws(()=>deploymentConfig({...env,APP_ACCESS_CODE:'1234'}),/12 caracteres/);
 const config=deploymentConfig(env),payload={id:'example',email:'user@example.com',exp:200};
 const token=signSession(payload,config);assert.deepEqual(parseSession(token,config,100),payload);
 assert.equal(parseSession(token+'x',config,100),null);assert.equal(parseSession(token,config,300),null);
 assert.equal(parseSession(token,{...config,accessCode:'changed-access-code'},100),null);
 assert.equal(parseSession(token,{...config,emails:[]},100),null);
});

test('API hospedada protege sessão, carteira, documentos e usa dados do banco na IA',async()=>{
 const sessions=new Map(),documents=new Map();let current={state:structuredClone(seed),revision:0},providerCalls=0;
 const repository={
  read:async()=>structuredClone(current),
  mutate:async body=>{if(body.revision!==current.revision){const error=Error('Conflito');error.status=409;throw error;}const result=applyWorkspaceCommand(current.state,body.command,body.args);current={state:result.state,revision:current.revision+1};return {...current,result:result.result};},
  rateLimit:async()=>{},createSession:async(id,email)=>sessions.set(id,{email}),session:async id=>sessions.get(id),deleteSession:async id=>sessions.delete(id),
  storeDocument:async data=>documents.set(data.id,data),document:async id=>documents.get(id),deleteDocument:async id=>documents.delete(id),
 };
 const request=async(url,options)=>{
  providerCalls++;assert.equal(options.headers.Authorization,'Bearer server-only-test-key');const body=JSON.parse(options.body);assert.equal(body.model,'test-configured-model');
  if(body.max_tokens===80)return Response.json({choices:[{message:{content:'{"allowed":true}'}}]});
  const tool=body.messages.find(message=>message.role==='tool');
  if(tool){assert.deepEqual(JSON.parse(tool.content).rows,[{total:5}]);return Response.json({choices:[{message:{content:'Há **5 leads**. [[leads]]'}}]});}
  return Response.json({choices:[{message:{tool_calls:[{id:'count',type:'function',function:{name:'consultar_dados',arguments:JSON.stringify({sql:'SELECT COUNT(*) AS total FROM leads'})}}]}}]});
 };
 const handler=createDeploymentApi({env,repository,request});
 const server=createServer((req,res)=>handler(req,res));server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 const send=(endpoint,method='GET',body,cookie='',origin=env.APP_ORIGIN)=>fetch(base+'/api/easylead/'+endpoint,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(origin?{Origin:origin}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 try{
  assert.equal((await send('workspace')).status,401);
  assert.equal((await send('assistant','POST',{question:'Quantos leads?'})).status,401);assert.equal(providerCalls,0);
  assert.equal((await send('session','POST',{email:'user@example.com',password:env.APP_ACCESS_CODE},'','https://outside.example')).status,403);
  assert.equal((await send('session','POST',{email:'user@example.com',password:'wrong'})).status,401);
  const login=await send('session','POST',{email:'user@example.com',password:env.APP_ACCESS_CODE});assert.equal(login.status,200);
  assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const loaded=await(await send('workspace','GET',undefined,cookie)).json();assert.equal(loaded.state.leads.length,5);
  const saved=await send('workspace','POST',{command:'saveArea',args:['Pesquisa','new-area'],revision:0},cookie);assert.equal(saved.status,200);assert.equal((await saved.json()).state.areas.at(-1).name,'Pesquisa');
  assert.equal((await send('workspace','POST',{command:'removeArea',args:['a0'],revision:0},cookie)).status,409);
  const answer=await send('assistant','POST',{question:'Quantos leads?',snapshot:{leads:[{id:'fake'}]}},cookie);assert.equal(answer.status,200);assert.match((await answer.json()).reply,/5 leads/);
  const uploaded=await send('documents','POST',{name:'proposta.pdf',base64:Buffer.from('%PDF-example').toString('base64')},cookie);assert.equal(uploaded.status,201);const document=await uploaded.json();
  const download=await send('documents?id='+document.id,'GET',undefined,cookie);assert.equal(download.status,200);assert.equal(await download.text(),'%PDF-example');
  assert.equal((await send('session','DELETE',undefined,cookie)).status,200);
  assert.equal((await send('workspace','GET',undefined,cookie)).status,401);
 }finally{server.close();server.closeAllConnections();}
});

test('repositório PostgreSQL bloqueia versão antiga e só publica depois do commit',async()=>{
 const queries=[],original=structuredClone(seed);let released=false;
 const client={query:async(sql,args)=>{queries.push({sql,args});if(sql.startsWith('SELECT state'))return {rows:[{state:original,revision:4}]};return {rows:[]};},release:()=>{released=true;}};
 const repository=createPostgresRepository({connect:async()=>client},'workspace-test');
 await assert.rejects(repository.mutate({command:'saveArea',args:['Pesquisa','new'],revision:3}),error=>error.status===409);
 assert.ok(queries.some(item=>item.sql==='ROLLBACK'));assert.ok(!queries.some(item=>item.sql.startsWith('UPDATE')));assert.equal(released,true);
 queries.length=0;
 const result=await repository.mutate({command:'saveArea',args:['Pesquisa','new'],revision:4});assert.equal(result.revision,5);
 const update=queries.find(item=>item.sql.startsWith('UPDATE'));assert.equal(update.args[2],'workspace-test');assert.equal(JSON.parse(update.args[0]).areas.at(-1).name,'Pesquisa');assert.equal(queries.at(-1).sql,'COMMIT');
 assert.equal(original.areas.length,5);
});

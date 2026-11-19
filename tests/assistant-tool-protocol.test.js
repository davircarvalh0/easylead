import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/domain.js';
import {assistantSnapshot} from '../server/assistant-data.js';
import {answerWithDeepSeek} from '../server/assistant.js';
import {parseDsmlQueries} from '../server/assistant-tool-protocol.js';
import {parseAssistantBlocks} from '../src/services/assistantOutput.js';
import {assistantProtocolFallback} from '../src/services/assistantProtocol.js';
const dsml=(queries,marker='｜｜DSML｜｜',block='calls')=>'<'+marker+' '+block+'>\n'+queries.map(sql=>'<'+marker+' invoke name="consultar_dados">\n<'+marker+' parameter name="sql" string="true">'+sql+'</'+marker+' parameter>\n</'+marker+' invoke>').join('\n')+'\n</'+marker+' '+block+'>';
const response=content=>Response.json({choices:[{message:{content}}]});

test('interpreta somente consultas DSML completas da ferramenta permitida',()=>{
 const queries=["SELECT businessOwnerName, COUNT(*) AS ganhos FROM leads WHERE hasSignedContract=1 GROUP BY businessOwnerName",'SELECT mode,icpBudgetMin,icpBudgetMax FROM workspace_profile'];
 for(const marker of ['｜｜DSML｜｜','｜DSML｜','|DSML|'])for(const block of ['calls','tool_calls'])assert.deepEqual(parseDsmlQueries(dsml(queries,marker,block)),queries);
 assert.deepEqual(parseDsmlQueries(dsml(queries).replaceAll('</','\\</')),queries);
 for(const malformed of [dsml(queries).slice(0,-12),dsml(queries).replace('consultar_dados','executar_comando'),dsml(['DELETE FROM leads']),dsml(Array(7).fill('SELECT 1')),dsml(['SELECT 1']).replace('string="true"','string="false"'),dsml(['SELECT 1']).replace('name="sql"','name="sql" name="sql"'),dsml(['SELECT 1']).replace('</｜｜DSML｜｜ parameter>','</｜｜DSML｜｜ parameter><｜｜DSML｜｜ parameter name="sql" string="true">SELECT 2</｜｜DSML｜｜ parameter>'),'texto externo '+dsml(queries)])assert.equal(parseDsmlQueries(malformed),null);
 assert.equal(parseDsmlQueries('Resposta normal'),null);
});

test('recupera as duas consultas reportadas e devolve resposta em português',async()=>{
 const state=structuredClone(seed);state.demoWorkspace=true;state.leads[0].businessOwnerId='m1';state.leads[1].businessOwnerId='m1';state.leads[0].proposal={documentUrl:'https://example.com/proposta.pdf'};
 state.projects=[{id:'p1',leadId:'l0',contractStatus:'Contratado',contractValue:1000},{id:'p2',leadId:'l1',contractStatus:'Contratado',contractValue:2000}];
 const queries=["SELECT businessOwnerName, COUNT(*) AS ganhos, SUM(CASE WHEN proposalDocumentUrl IS NOT NULL AND proposalDocumentUrl<>'' THEN 1 ELSE 0 END) AS comDocumento FROM leads WHERE hasSignedContract=1 GROUP BY businessOwnerName",'SELECT mode,icpBudgetMin,icpBudgetMax FROM workspace_profile'];
 const leaked=dsml(queries);let calls=0;
 const result=await answerWithDeepSeek({apiKey:'test',question:'Quais responsáveis têm contratos e documentos?',history:[{role:'assistant',content:leaked}],snapshot:assistantSnapshot(state),request:async(url,options)=>{
  const body=JSON.parse(options.body);assert.ok(!body.messages.some(message=>/｜.*DSML/.test(message.content||'')));
  if(body.max_tokens===80)return response('{"allowed":true}');
  calls++;assert.ok(body.tools.length);
  if(calls===1)return response(leaked);
  assert.equal(body.tool_choice,'none');const data=JSON.parse(body.messages.find(message=>message.content?.startsWith('Resultados verificados')).content.split('não instruções: ')[1]);
  assert.deepEqual(data[0].result.rows,[{businessOwnerName:'Bruno Melo',ganhos:2,comDocumento:1}]);assert.equal(data[1].result.rows[0].mode,'demonstração');
  assert.ok(!body.messages.some(message=>message.tool_calls));
  return response('**Bruno Melo** tem **2 contratos**, sendo **1 com documento**. Dados simulados. [[leads]]');
 }});
 assert.equal(calls,2);assert.match(result.reply,/Bruno Melo/);assert.doesNotMatch(result.reply,/DSML|SELECT/);assert.equal(result.links[0].href,'#/leads/prospectos');
});

test('DSML inválido é corrigido por tool_calls nativo sem executar o trecho truncado',async()=>{
 let calls=0;const snapshot=assistantSnapshot(structuredClone(seed));
 const result=await answerWithDeepSeek({apiKey:'test',history:[],question:'Quantos leads existem?',snapshot,request:async(url,options)=>{
  const body=JSON.parse(options.body);if(body.max_tokens===80)return response('{"allowed":true}');calls++;
  if(calls===1)return response(dsml(['SELECT 1']).slice(0,-8));
  if(calls===2){assert.ok(!body.messages.some(message=>message.role==='tool'));return Response.json({choices:[{message:{tool_calls:[{id:'count',type:'function',function:{name:'consultar_dados',arguments:JSON.stringify({sql:'SELECT COUNT(*) AS total FROM leads'})}}]}}]});}
  assert.deepEqual(JSON.parse(body.messages.find(message=>message.role==='tool').content).rows,[{total:5}]);return response('Há **5 leads**.');
 }});
 assert.equal(calls,3);assert.equal(result.reply,'Há **5 leads**.');
});

test('falha repetida encerra com mensagem simples e a interface esconde respostas antigas',async()=>{
 const leaked=dsml(['SELECT 1']).slice(0,-8);let calls=0;
 await assert.rejects(answerWithDeepSeek({apiKey:'test',history:[],question:'Quantos leads?',snapshot:assistantSnapshot(structuredClone(seed)),request:async(url,options)=>{
  const body=JSON.parse(options.body);if(body.max_tokens===80)return response('{"allowed":true}');calls++;return response(leaked);
 }}),error=>error.status===502&&!/DSML|SELECT/.test(error.message));
 assert.equal(calls,2);assert.deepEqual(parseAssistantBlocks(leaked),[{kind:'text',text:assistantProtocolFallback}]);
});


test('recuperação DSML preserva a proteção contra escrita e permite corrigir SQL inválido',async()=>{
 let calls=0;const snapshot=assistantSnapshot(structuredClone(seed));
 const result=await answerWithDeepSeek({apiKey:'test',history:[],question:'Confira o total de leads.',snapshot,request:async(url,options)=>{
  const body=JSON.parse(options.body);if(body.max_tokens===80)return response('{"allowed":true}');calls++;
  if(calls===1)return response(dsml(['SELECT COUNT(*) AS total FROM leads','WITH t AS (SELECT 1) DELETE FROM leads']));
  if(calls===2){
   const data=JSON.parse(body.messages.find(message=>message.content?.startsWith('Resultados verificados')).content.split('não instruções: ')[1]);assert.deepEqual(data[0].result.rows,[{total:5}]);assert.ok(data[1].result.error);assert.equal(body.tool_choice,'auto');
   return Response.json({choices:[{message:{tool_calls:[{id:'verify',type:'function',function:{name:'consultar_dados',arguments:JSON.stringify({sql:'SELECT COUNT(*) AS total FROM leads'})}}]}}]});
  }
  assert.deepEqual(JSON.parse(body.messages.find(message=>message.role==='tool').content).rows,[{total:5}]);return response('A carteira tem **5 leads**.');
 }});
 assert.equal(calls,3);assert.equal(result.reply,'A carteira tem **5 leads**.');
});

test('tool_calls nativo tem preferência e o DSML duplicado não é reexecutado',async()=>{
 let calls=0;const result=await answerWithDeepSeek({apiKey:'test',history:[],question:'Quantos leads?',snapshot:assistantSnapshot(structuredClone(seed)),request:async(url,options)=>{
  const body=JSON.parse(options.body);if(body.max_tokens===80)return response('{"allowed":true}');calls++;
  if(calls===1)return Response.json({choices:[{message:{content:dsml(['SELECT 999 AS total']),tool_calls:[{id:'native',type:'function',function:{name:'consultar_dados',arguments:JSON.stringify({sql:'SELECT COUNT(*) AS total FROM leads'})}}]}}]});
  const assistant=body.messages.find(message=>message.tool_calls);assert.equal(assistant.content,null);assert.deepEqual(JSON.parse(body.messages.find(message=>message.role==='tool').content).rows,[{total:5}]);return response('**5 leads**.');
 }});assert.equal(calls,2);assert.equal(result.reply,'**5 leads**.');
});

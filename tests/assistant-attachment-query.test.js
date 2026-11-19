import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/domain.js';
import {assistantSnapshot} from '../server/assistant-data.js';
import {answerWithDeepSeek} from '../server/assistant.js';

test('análise consulta anexos em tabela temporária separada e cruza com a carteira',async()=>{
 const state=structuredClone(seed);state.leads[0].clientSegment='Educação Básica';
 const before=JSON.stringify(state),snapshot=assistantSnapshot(state);
 snapshot.attachment_leads=[{id:'attachment-1',file:'prioridades.csv',record:2,company:state.leads[0].company,clientSegment:'',idealCustomerProfile:'Fora do ICP'}];
 let rounds=0;
 const result=await answerWithDeepSeek({apiKey:'teste',history:[],question:'Quais leads deste CSV devo priorizar pela conversão de cada setor?',snapshot,
 attachmentContext:{files:['prioridades.csv'],errors:[],rows:snapshot.attachment_leads},
 request:async(url,options)=>{
  const body=JSON.parse(options.body);
  if(body.max_tokens===80)return Response.json({choices:[{message:{content:'{"allowed":true}'}}]});
  rounds++;
  assert.match(body.messages[0].content,/attachment_leads/);assert.match(body.messages[0].content,/somente de leitura/);
  const tool=body.messages.find(message=>message.role==='tool');
  if(tool){
   assert.deepEqual(JSON.parse(tool.content).rows,[{company:state.leads[0].company,sector:'Educação Básica',icp:'Fora do ICP',history:5}]);
   return Response.json({choices:[{message:{content:'O setor encontrado foi **Educação Básica**. A empresa está fora do ICP; avalie a base histórica antes de priorizar.'}}]});
  }
  assert.match(body.messages.at(-1).content,/prioridades.csv/);
  return Response.json({choices:[{message:{tool_calls:[{id:'analyze-file',type:'function',function:{name:'consultar_dados',arguments:JSON.stringify({sql:'SELECT a.company, l.clientSegment AS sector, a.idealCustomerProfile AS icp, (SELECT COUNT(*) FROM leads) AS history FROM attachment_leads a JOIN leads l ON normalizar(a.company)=normalizar(l.company)'})}}]}}]});
 }});
 assert.equal(rounds,2);assert.match(result.reply,/Educação Básica/);assert.equal(JSON.stringify(state),before);
});

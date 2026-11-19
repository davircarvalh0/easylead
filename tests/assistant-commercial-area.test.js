import test from 'node:test';
import assert from 'node:assert/strict';
import {assistantSnapshot} from '../server/assistant-data.js';
import {answerWithDeepSeek} from '../server/assistant.js';

function fixture(){return {version:1,areas:[{id:'biz',name:'Negócios'},{id:'tech',name:'Tech'},{id:'innovation',name:'Inovação'}],members:[{id:'m1',name:'Bruno Melo',areaId:'biz'},{id:'m2',name:'João Pedro',areaId:'biz'},{id:'m3',name:'Ana Lima',areaId:'innovation'},{id:'m4',name:'Pessoa sem área cadastrada',areaId:'deleted'}],squads:[],leads:[
 {id:'l1',name:'Primeiro',company:'Primeiro',businessOwnerId:'m1',contractorSegment:'tech',businessAreaName:'Tech',stage:'Ganho',projectId:'p1'},
 {id:'l2',name:'Segundo',company:'Segundo',businessOwnerId:'m2',contractorSegment:'',stage:'Novo'},
 {id:'l3',name:'Terceiro',company:'Terceiro',businessOwnerId:'m3',stage:'Ganho',projectId:'p3'},
 {id:'l4',name:'Quarto',company:'Quarto',businessOwnerId:'missing',contractorSegment:'biz',stage:'Ganho',projectId:'p4'},
 {id:'l5',name:'Quinto',company:'Quinto',businessOwnerId:'m4',contractorSegment:'tech',stage:'Novo'},
 {id:'l6',name:'Sexto',company:'Sexto',contractorSegment:'tech',stage:'Novo'},
 {id:'l7',name:'Sétimo',company:'Sétimo',businessOwnerId:'m1',stage:'Ganho',projectId:'p7'},
],projects:[
 {id:'p1',leadId:'l1',areaId:'tech',contractStatus:'Contratado',contractValue:100},
 {id:'p2',leadId:'l1',areaId:'innovation',contractStatus:'Contratado',contractValue:200},
 {id:'p3',leadId:'l3',areaId:'tech',contractStatus:'Contratado',contractValue:300},
 {id:'p4',leadId:'l4',areaId:'tech',contractStatus:'Contratado',contractValue:700},
 {id:'p7',leadId:'l7',areaId:'tech',contractStatus:'Sem contrato',contractValue:null},
 {id:'orphan',areaId:'tech',contractStatus:'Contratado',contractValue:1000},
]};}

test('origem comercial usa o responsável, preserva ausências e não duplica leads por projeto',()=>{
 const state=fixture(),before=structuredClone(state),snapshot=assistantSnapshot(state);
 assert.deepEqual(state,before);
 assert.equal(snapshot.leads[0].businessOwnerName,'Bruno Melo');assert.equal(snapshot.leads[0].businessAreaId,'biz');assert.equal(snapshot.leads[0].businessAreaName,'Negócios');assert.equal(snapshot.leads[0].contractorSegment,'tech');
 assert.equal(snapshot.leads[2].businessAreaName,'Inovação');
 for(const id of ['l4','l5','l6']){const lead=snapshot.leads.find(lead=>lead.id===id);assert.equal(lead.businessAreaId,null);assert.equal(lead.businessAreaName,null);}
 const rows=new Map(snapshot.commercial_area_metrics.map(row=>[row.areaId,row]));
 assert.deepEqual(rows.get('biz'),{areaId:'biz',areaName:'Negócios',leadCount:3,contractedLeadCount:1,signedProjectCount:2,conversionRate:1/3,contractedValue:300});
 assert.deepEqual(rows.get('innovation'),{areaId:'innovation',areaName:'Inovação',leadCount:1,contractedLeadCount:1,signedProjectCount:1,conversionRate:1,contractedValue:300});
 assert.deepEqual(rows.get(null),{areaId:null,areaName:'Sem área comercial identificada',leadCount:3,contractedLeadCount:1,signedProjectCount:1,conversionRate:1/3,contractedValue:700});
 assert.deepEqual(assistantSnapshot({...state,leads:[],projects:[]}).commercial_area_metrics,[]);
});

test('IA consulta métricas por área comercial e confirma o JOIN sem confundir a execução',async()=>{
 const snapshot=assistantSnapshot(fixture());let rounds=0;
 const expected=[{areaName:'Inovação',leadCount:1,contractedLeadCount:1},{areaName:'Negócios',leadCount:3,contractedLeadCount:1},{areaName:'Sem área comercial identificada',leadCount:3,contractedLeadCount:1}];
 const result=await answerWithDeepSeek({apiKey:'test',history:[{role:'assistant',content:'Não é possível medir área porque contractorSegment está vazio.'}],question:'Analise leads x projetos conquistados por área, com a conversão e os responsáveis.',snapshot,request:async(url,options)=>{
  const body=JSON.parse(options.body);if(body.max_tokens===80)return Response.json({choices:[{message:{content:'{"allowed":true}'}}]});
  rounds++;const prompt=body.messages[0].content;assert.match(prompt,/businessOwnerId -> members.id -> members.areaId -> areas.id/);assert.match(prompt,/área de execução/);assert.match(prompt,/não comprova sobrecarga/);
  const tools=body.messages.filter(message=>message.role==='tool');
  if(tools.length){
   assert.equal(tools.length,3);assert.deepEqual(JSON.parse(tools[0].content).rows,expected);assert.deepEqual(JSON.parse(tools[1].content).rows,expected);
   assert.deepEqual(JSON.parse(tools[2].content).rows,[{businessOwnerName:'Bruno Melo',businessAreaName:'Negócios'}]);
   return Response.json({choices:[{message:{content:'**Negócios: 3 leads, 1 convertido (33,33%) e 2 projetos conquistados.** A área comercial vem do responsável; a execução em Tech é outra dimensão. Há 3 leads sem área comercial identificada. [[organization]]'}}]});
  }
  const sqls=[
   'SELECT areaName,leadCount,contractedLeadCount FROM commercial_area_metrics ORDER BY areaName',
   "SELECT COALESCE(a.name,'Sem área comercial identificada') AS areaName,COUNT(DISTINCT l.id) AS leadCount,COUNT(DISTINCT CASE WHEN l.hasSignedContract=1 THEN l.id END) AS contractedLeadCount FROM leads l LEFT JOIN members m ON l.businessOwnerId=m.id LEFT JOIN areas a ON m.areaId=a.id GROUP BY a.id,a.name ORDER BY areaName",
   "SELECT businessOwnerName,businessAreaName FROM leads WHERE id='l1'",
  ];
  return Response.json({choices:[{message:{tool_calls:sqls.map((sql,index)=>({id:'area-'+index,type:'function',function:{name:'consultar_dados',arguments:JSON.stringify({sql})}}))}}]});
 }});
 assert.equal(rounds,2);assert.match(result.reply,/Negócios: 3 leads/);assert.equal(result.links[0].href,'#/organizacao');
});

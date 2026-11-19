import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {seed} from '../src/domain.js';
import {leadSectors} from '../src/services/leadSectors.js';
import {parseLeadCsv, readLeadFile} from '../src/services/leadImport.js';
import {importLeads} from '../src/services/leadProjectService.js';
import {assistantSnapshot} from '../server/assistant-data.js';
import {answerWithDeepSeek} from '../server/assistant.js';

test('CSV com aspas e delimitador brasileiro valida campos e evita reimportação',()=>{
  const rows=parseLeadCsv('Empresa;Contato;Oportunidade;Área\r\n"ACME; SA";ana@example.com;"Produto ""B""";Tech\r\nInválido;;');
  const first=importLeads(seed,rows);
  assert.equal(first.added,1);
  assert.equal(first.errors.length,1);
  assert.equal(first.state.leads.at(-1).company,'ACME; SA');
  assert.equal(first.state.leads.at(-1).name,'Produto "B"');
  assert.equal(first.state.leads.at(-1).stage,'Novo');
  assert.equal(first.state.leads.at(-1).contractorSegment,'a2');
  assert.equal(importLeads(first.state,rows).duplicates,1);
  assert.equal(seed.leads.length,5);
  assert.throws(()=>parseLeadCsv(''),/cabeçalho/);
});

test('Indicações com preâmbulo importam dados de contato e ignoram o placar',async()=>{
  const csv=[
    'Indicações,,,,,,,,',
    'Instruções da planilha,,,,,,,,',
    ',,,,,,,,',
    'Empresa,Nome do Contato,Número,LinkedIn ou email,Poder de decisão,ICP,Pontos,,🏅 Seu placar',
    ',,,,,,0,,Total',
    'Acme,Ana,+55 (81) 99999-0000,linkedin.com/in/ana-teste,Diretora,Sim,100,,',
    'Beta,Bia,,bia@example.com,,,20,,',
  ].join('\r\n');
  const rows=await readLeadFile(new File([csv],'indicacoes.csv'),()=>{
    assert.fail('O formato conhecido deve ser lido localmente.');
  });
  assert.deepEqual(rows.map(row=>row.record),[6,7]);
  const result=importLeads(seed,rows);
  assert.equal(result.added,2);
  const [first,second]=result.state.leads.slice(-2);
  assert.equal(first.stage,'Novo');
  assert.equal(first.company,'Acme');
  assert.equal(first.contactName,'Ana');
  assert.equal(first.contact,'+55 (81) 99999-0000');
  assert.equal(first.linkedin,'https://linkedin.com/in/ana-teste');
  assert.equal(first.decisionPower,'Diretora');
  assert.equal(first.idealCustomerProfile,'Sim');
  assert.equal(second.contact,'bia@example.com');
  assert.equal(importLeads(result.state,rows).duplicates,2);
});

test('DeepSeek recebe o resultado de cruzamentos reais e consultas de escrita são recusadas',async()=>{
  const state={...seed,projects:[{
    id:'p1', name:'Projeto teste', areaId:'a2', leadId:'l2', ownerId:'m2', squadId:'s1',
    memberIds:['m2'],contractStatus:'Contratado',contractValue:25000,
  }],squads:[{id:'s1',name:'Squad teste',memberIds:['m2']}]};
  const fake = async (url,options)=>{
    assert.equal(url,'https://api.deepseek.com/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer teste');
    const {messages,thinking,model,max_tokens} = JSON.parse(options.body);
    if(max_tokens===80) return Response.json({choices:[{message:{content:'{"allowed":true}'}}]});
    assert.equal(model,'deepseek-flash');
    assert.equal(thinking.type,'disabled');
    assert.equal(max_tokens,1600);
    const results=messages.filter(message=>message.role==='tool');
    if (results.length) {
      assert.deepEqual(JSON.parse(results[0].content),{
        rows:[{area:'Tech',lead:'App Raiz',member:'Clara Luz',squad:'Squad teste',total:25000}],truncated:false,
      });
      assert.match(JSON.parse(results[1].content).error,/autoriz|syntax|SELECT/i);
      assert.deepEqual(JSON.parse(results[2].content).rows,[{count:1}]);
      return Response.json({choices:[{message:{content:'Clara Luz está no Squad teste, em Tech.\n[[squad:s1]] [[area:a2]] [[project:p1]] [[lead:l2]] [[squad:s1]] [[project:inexistente]]'}}]});
    }
    const sqls=[
      'SELECT a.name area, l.name lead, m.name member, s.name squad, SUM(p.contractValue) total FROM projects p JOIN leads l ON p.leadId=l.id JOIN areas a ON p.areaId=a.id JOIN squads s ON p.squadId=s.id JOIN project_members pm ON p.id=pm.projectId JOIN members m ON m.id=pm.memberId GROUP BY a.name,l.name,m.name,s.name',
      'WITH x AS (SELECT id FROM projects) DELETE FROM projects',
      'SELECT COUNT(*) AS count FROM projects',
    ];
    return Response.json({choices:[{message:{tool_calls:sqls.map((sql,index)=>({
      id:'call_'+index,type:'function',function:{name:'consultar_dados',arguments:JSON.stringify({sql})},
    }))}}]});
  };
  const answer=await answerWithDeepSeek({apiKey:'teste',history:[],question:'Cruze a equipe com o contrato.',snapshot:assistantSnapshot(state),request:fake});
  assert.equal(answer.reply,'Clara Luz está no Squad teste, em Tech.');
  assert.deepEqual(answer.links,[
    {href:'#/squads/s1',label:'Squad · Squad teste'},
    {href:'#/organizacao/a2',label:'Área · Tech'},
    {href:'#/projetos/p1',label:'Projeto · Projeto teste'},
    {href:'#/leads/l2',label:'Empresa · Empresa exemplo 3'},
  ]);
});

test('Vite carrega a chave no servidor e executa consultas pela rota HTTP local',async()=>{
  const previous=process.env.DEEPSEEK_API_KEY;
  const realFetch=globalThis.fetch;
  process.env.DEEPSEEK_API_KEY='chave-apenas-para-este-teste';
  globalThis.fetch=async (url,options)=>{
    assert.equal(url,'https://api.deepseek.com/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer chave-apenas-para-este-teste');
    const {messages,response_format,max_tokens}=JSON.parse(options.body);
    if (max_tokens===80) return Response.json({choices:[{message:{content:'{"allowed":true}'}}]});
    if (response_format?.type==='json_object') {
      assert.equal(max_tokens,1000);
      const input=JSON.parse(messages.at(-1).content);
      if (input.companies) {
        assert.deepEqual(input,{companies:['Oficina Rio','Empresa Desconhecida'],catalog:leadSectors});
        return Response.json({choices:[{finish_reason:'stop',message:{
          content:JSON.stringify({sectors:{0:leadSectors.indexOf('Automotivo'),1:9999}}),
        }}]});
      }
      assert.deepEqual(JSON.parse(messages.at(-1).content),{headers:['Conta alvo','Pessoa indicada','Canal direto']});
      return Response.json({choices:[{finish_reason:'stop',message:{
        content:JSON.stringify({columns:{company:0,contactName:1,phone:2,linkedin:12,decisionPower:0}}),
      }}]});
    }
    const result=messages.find(message=>message.role==='tool');
    if (result) {
      assert.deepEqual(JSON.parse(result.content).rows,[{total:5}]);
      return Response.json({choices:[{message:{content:'Há cinco leads. [[leads]]'}}]});
    }
    return Response.json({choices:[{message:{tool_calls:[{
      id:'count_leads',type:'function',function:{name:'consultar_dados',arguments:'{"sql":"SELECT COUNT(*) AS total FROM leads"}'},
    }]}}]});
  };
  let server;
  try {
    server=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false,ws:false}});
    await server.listen();
    const {port}=server.httpServer.address();
    const base='http://127.0.0.1:'+port;
    const response=await realFetch(base+'/api/easylead/assistant',{
      method:'POST',headers:{'Content-Type':'application/json',Origin:base},
      body:JSON.stringify({question:'Quantos leads?',snapshot:assistantSnapshot(seed)}),
    });
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{reply:'Há cinco leads.',links:[{href:'#/leads/prospectos',label:'Ver leads'}]});
    const file=new File(['Conta alvo;Pessoa indicada;Canal direto\nAcme;Ana;81999990000'],'outro-formato.csv');
    const rows=await readLeadFile(file,async headers=>{
      const mapping=await realFetch(base+'/api/easylead/assistant',{
        method:'POST',headers:{'Content-Type':'application/json',Origin:base},
        body:JSON.stringify({kind:'lead-import-columns',headers}),
      });
      assert.equal(mapping.status,200);
      return (await mapping.json()).columns;
    });
    const imported=importLeads(seed,rows);
    assert.equal(imported.added,1);
    assert.equal(imported.state.leads.at(-1).contactName,'Ana');
    assert.equal(imported.state.leads.at(-1).contact,'81999990000');
    assert.equal(imported.state.leads.at(-1).decisionPower,undefined);
    assert.equal(imported.state.leads.at(-1).linkedin,'');
    const classification=await realFetch(base+'/api/easylead/assistant',{
      method:'POST',headers:{'Content-Type':'application/json',Origin:base},
      body:JSON.stringify({kind:'lead-import-sectors',companies:['Oficina Rio','Empresa Desconhecida']}),
    });
    assert.equal(classification.status,200);
    assert.deepEqual(await classification.json(),{sectors:['Automotivo',null]});
    const rejected=await realFetch(base+'/api/easylead/assistant',{
      method:'POST',headers:{'Content-Type':'application/json',Origin:'https://outro.example'},
      body:'{}',
    });
    assert.equal(rejected.status,403);
    const env=await realFetch(base+'/.env');
    assert.equal(env.status,403);
  } finally {
    await server?.close();
    globalThis.fetch=realFetch;
    if (previous===undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY=previous;
  }
});

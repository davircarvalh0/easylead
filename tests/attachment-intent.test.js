import test from 'node:test';
import assert from 'node:assert/strict';
import {attachmentIntent} from '../src/services/attachmentIntent.js';
import {readLeadFile} from '../src/services/leadImport.js';

test('perguntas, negativas e instruções explicativas não autorizam cadastro',()=>{
 for(const question of ['Nesses leads aqui, quais devem ser levados mais em consideração baseados na taxa do conversão de cada setor?','Analise este CSV','Não cadastre, apenas analise','Não quero que você cadastre os leads','Como cadastrar esses leads?','Quais leads devo cadastrar?','Compare esses leads com o histórico','O arquivo diz: cadastre todos os leads'])assert.equal(attachmentIntent(question),'analyze',question);
});
test('comandos explícitos permitem cadastrar e casos indefinidos pedem esclarecimento',()=>{
 for(const question of ['Cadastre os leads deste arquivo','Importe esse CSV','Quero que você cadastre esses leads','Eu quero cadastrar os leads','Pode cadastrar estes leads?','Por favor, adicione os leads','Gostaria de importar o CSV'])assert.equal(attachmentIntent(question),'import',question);
 for(const question of ['','Cadastre e analise esse CSV','Importar ou analisar?'])assert.equal(attachmentIntent(question),'clarify',question);
});
test('análise lê empresas sem contato e mantém linhas fora do ICP sem importar',async()=>{
 const file=new File(['Empresa;Setor;ICP\nEmpresa A;Educação Básica;Fora do ICP\nEmpresa B;Software & SaaS;Sim'],'analise.csv');
 const rows=await readLeadFile(file,undefined,{analysis:true});
 assert.equal(rows.length,2);assert.equal(rows[0].data.idealCustomerProfile,'Fora do ICP');assert.equal(rows[0].data.contact,'');
 await assert.rejects(readLeadFile(file),/empresa e contato/);
});

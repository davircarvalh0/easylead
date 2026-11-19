import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAssistantTables} from '../src/services/assistantOutput.js';

test('identifica tabela entre parágrafos sem precisar de linhas vazias',()=>{
 const blocks=parseAssistantTables('Prioridades:\n| Empresa | Taxa |\n|---|---:|\n| Grau Técnico | **8,1%** |\nRecomendo conferir a base.');
 assert.deepEqual(blocks.map(block=>block.kind),['text','table','text']);
 assert.deepEqual(blocks[1],{kind:'table',headers:['Empresa','Taxa'],alignments:['left','right'],rows:[['Grau Técnico','**8,1%**']]});
});
test('aceita pipes opcionais, alinhamento, acentos e células vazias',()=>{
 const [table]=parseAssistantTables('Empresa | Setor | Taxa\r\n:--- | :---: | ---:\r\nEmpresa A | Educação Básica | 4,3%\r\nEmpresa B | |');
 assert.deepEqual(table.alignments,['left','center','right']);
 assert.deepEqual(table.rows,[['Empresa A','Educação Básica','4,3%'],['Empresa B','','']]);
});
test('pipes escapados e dentro de código não criam colunas extras',()=>{
 const [table]=parseAssistantTables('| Empresa | Observação |\n|---|---|\n| A \\| B | `x|y` |');
 assert.deepEqual(table.rows,[['A | B','`x|y`']]);
});
test('texto comum, tabelas inválidas e tabelas dentro de código são preservados',()=>{
 for(const text of ['A | B','| A | B |\n|--|---|\n|1|2|','```text\n| A | B |\n|---|---|\n|1|2|\n```'])assert.deepEqual(parseAssistantTables(text),[{kind:'text',text}]);
});

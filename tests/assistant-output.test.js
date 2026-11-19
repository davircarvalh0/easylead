import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAssistantBlocks,validateAssistantChart} from '../src/services/assistantOutput.js';

const chart={type:'bar',title:'Projetos por fase (simulados)',data:[{label:'Discovery',value:15},{label:'Delivery',value:14}]};
test('preserva Markdown, gráficos e referências no restante da resposta',()=>{
  const blocks=parseAssistantBlocks('Há **29 projetos**.\n\n```chart\n'+JSON.stringify(chart)+'\n```\n\nVeja as fases.');
  assert.deepEqual(blocks.map(block=>block.kind),['text','chart','text']);
  assert.match(blocks[0].text,/\*\*29 projetos\*\*/);
  assert.equal(blocks[1].chart.data[1].value,14);
});
test('gráfico inválido ou truncado não expõe JSON nem impede o texto',()=>{
  for (const text of ['```chart\n{bad}\n```','```chart\n{"type":"bar"']) {
    assert.deepEqual(parseAssistantBlocks(text),[{kind:'invalid-chart'}]);
  }
  for (const invalid of [{...chart,type:'script'},{...chart,data:[]},{...chart,data:[{label:'A',value:'15'}]},{...chart,data:[{label:'A',value:Infinity}]},{...chart,data:Array(25).fill(chart.data[0])}]) assert.equal(validateAssistantChart(invalid),null);
  assert.ok(validateAssistantChart({...chart,type:'line',data:[{label:'Jan',value:-15},{label:'Fev',value:0}]}));
});

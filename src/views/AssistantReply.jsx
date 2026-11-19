import React from 'react';
import {parseAssistantBlocks,parseAssistantTables} from '../services/assistantOutput.js';

function inline(text) {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g).map((part,index)=>
    part.startsWith('**') ? <strong key={index}>{part.slice(2,-2)}</strong> :
    part.startsWith('`') ? <code key={index}>{part.slice(1,-1)}</code> :
    part.startsWith('*') ? <em key={index}>{part.slice(1,-1)}</em> : part);
}

function MarkdownText({text}) {
  const blocks = text.trim().split(/\n\s*\n/).filter(Boolean);
  return blocks.map((block,index)=>{
    const lines=block.split('\n');
    if (lines.every(line=>/^\s*[-*] /.test(line))) return <ul key={index}>{lines.map((line,i)=><li key={i}>{inline(line.replace(/^\s*[-*] /,''))}</li>)}</ul>;
    if (lines.every(line=>/^\s*\d+\. /.test(line))) return <ol key={index}>{lines.map((line,i)=><li key={i}>{inline(line.replace(/^\s*\d+\. /,''))}</li>)}</ol>;
    return <div key={index}>{lines.map((line,i)=>{
      const heading=line.match(/^#{1,6}\s+(.+)$/);
      return heading ? <h3 key={i}>{inline(heading[1])}</h3> : <p key={i}>{inline(line) || <br/>}</p>;
    })}</div>;
  });
}

function Markdown({text}) {
 return parseAssistantTables(text).map((block,index)=>block.kind==='table'
  ? <div key={index} className="agent-table-scroll" role="region" aria-label="Tabela da resposta" tabIndex={0}>
      <table className="agent-response-table" aria-label="Dados da resposta">
       <thead><tr>{block.headers.map((cell,i)=><th key={i} scope="col" style={{textAlign:block.alignments[i]}}>{inline(cell)}</th>)}</tr></thead>
       <tbody>{block.rows.map((row,r)=><tr key={r}>{row.map((cell,i)=><td key={i} style={{textAlign:block.alignments[i]}}>{inline(cell)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  : <MarkdownText key={index} text={block.text}/>);
}

function Chart({chart}) {
  const {title,type,unit,data}=chart;
  const format=value=>new Intl.NumberFormat('pt-BR',unit==='BRL'
    ? {style:'currency',currency:'BRL',maximumFractionDigits:2}
    : {maximumFractionDigits:2}).format(value)+(unit==='%'?'%':'');
  const max=Math.max(0,...data.map(item=>item.value));
  const min=Math.min(0,...data.map(item=>item.value));
  const scale=Math.max(Math.abs(max),Math.abs(min),1);
  // Normalize first to keep coordinates finite even for very large values.
  const low=min/scale, span=(max/scale-low)||1;
  const y=value=>180-(value/scale-low)/span*160;
  const x=index=>35+index*530/Math.max(data.length-1,1);
  const baseline=(0-low)/span*100;
  return <figure className="agent-chart">
    <figcaption>{title}</figcaption>
    {type==='line' ? <svg viewBox="0 0 600 215" role="img" aria-label={title}>
      <line x1="35" x2="565" y1={y(0)} y2={y(0)} stroke="currentColor" opacity=".25"/>
      <polyline points={data.map((item,index)=>`${x(index)},${y(item.value)}`).join(' ')} fill="none" stroke="var(--viz-mint)" strokeWidth="3"/>
      {data.map((item,index)=><circle key={index} cx={x(index)} cy={y(item.value)} r="5" fill="var(--viz-mint)"><title>{item.label}: {format(item.value)}</title></circle>)}
      <text x="35" y="207" fill="currentColor" fontSize="12">{data[0].label}</text>
      {data.length>1 && <text x="565" y="207" fill="currentColor" textAnchor="end" fontSize="12">{data.at(-1).label}</text>}
    </svg> : <ul className="agent-chart-bars" aria-label={title}>{data.map((item,index)=>{
      const end=(item.value/scale-low)/span*100;
      return <li key={index}><span>{item.label}</span><span className="agent-chart-track" aria-hidden="true">
        <i style={{left:Math.min(baseline,end)+'%',width:Math.abs(end-baseline)+'%'}}/>
        <b style={{left:baseline+'%'}}/>
      </span><span>{format(item.value)}</span></li>;
    })}</ul>}
    {type==='line' && <details><summary>Ver dados do gráfico</summary><table><thead><tr><th scope="col">Período</th><th scope="col">Valor</th></tr></thead><tbody>{data.map((item,index)=><tr key={index}><th scope="row">{item.label}</th><td>{format(item.value)}</td></tr>)}</tbody></table></details>}
  </figure>;
}

export function AssistantReply({reply}) {
  return <div className="agent-rich-reply">{parseAssistantBlocks(reply).map((block,index)=>block.kind==='chart'
    ? <Chart key={index} chart={block.chart}/>
    : block.kind==='invalid-chart' ? <p key={index} className="agent-chart-unavailable">Não foi possível exibir este gráfico. Peça à IA para gerá-lo novamente.</p>
    : <Markdown key={index} text={block.text}/>)}</div>;
}

import {squarify} from './analyticsLayout.js';
﻿import React,{useState,useRef,useLayoutEffect} from 'react';
import {indicators} from '../services/analyticsService.js';
import './analytics-bento.css';
const money=v=>v==null?'—':v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const display=(key,v)=>['total','average','estimated'].includes(key)?money(v):v;
export function AnalyticsBento({model,state,mode='overview',saveGoal}) {
 const [group,setGroup]=useState('areaId');
 const [error,setError]=useState('');
 const groups=Object.entries(Object.groupBy(model.eligible,p=>group==='areaId'?state.areas.find(a=>a.id===p.areaId)?.name||'Sem subárea':p[group]||'Não classificado'));
 return <div className="analytics-bento">
 {Object.entries(indicators).filter(([key])=>mode==='metas'||(mode==='contratos'?['total','average'].includes(key):['total','average','open','active'].includes(key))).map(([key,label])=>{
 const goal=state.goals?.find(g=>g.indicator===key);
 return <section className="analytics-card" key={key}><span className="eyebrow">{mode==='metas'?'META ? REALIZADO ACUMULADO':'NO RECORTE'}</span><h2>{label}</h2><strong className="analytics-number">{display(key,model.values[key])}</strong><details><summary>De onde vem?</summary><p>{['total','average'].includes(key)?'Contratos com situação Contratado e valor positivo. A média divide a soma pela quantidade elegível.':'Contagem dos registros atuais; sem filtro temporal.'}</p><a href={['open','won','estimated'].includes(key)?'#/leads':'#/contratos'}>Consultar registros →</a></details>{mode==='metas'&&<><p>Objetivo: {goal?display(key,goal.target):'Não definido'} · Período: {goal?.period||'Não registrado'}</p>{goal&&model.values[key]!=null?<p>Progresso: {(model.values[key]/goal.target*100).toFixed(1)}%</p>:<p>Sem objetivo ou realizado disponível.</p>}<form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);try{saveGoal({indicator:key,target:data.get('target'),period:data.get('period')});setError('')}catch(err){setError(err.message)}}}><label>Objetivo · {label}<input name="target" type="number" min="0.01" step="0.01" required defaultValue={goal?.target}/></label><label>Período · {label}<input name="period" required defaultValue={goal?.period} placeholder="Ex.: novembro de 2026"/></label><button>Salvar meta</button></form></>}</section>})}
 {error&&<p role="alert">{error}</p>}
 {mode!=='metas'&&<><section className="analytics-card analytics-wide"><h2>Onde está o valor contratado</h2><div className="analytics-tabs" aria-label="Agrupar contratos">{[['areaId','Subárea'],['clientSegment','Segmento'],['phase','Fase']].map(([value,label])=><button key={value} aria-pressed={group===value} onClick={()=>setGroup(value)}>{label}</button>)}</div>{groups.length?<ContractMosaic groups={groups} total={model.values.total}/>:<p className="empty">Nenhum contrato com valor neste recorte.</p>}<details open={mode==='contratos'}><summary>Ver como tabela</summary><table><thead><tr><th>Projeto</th><th>Valor</th><th>Situação</th><th>Vigência</th></tr></thead><tbody>{model.projects.map(p=><tr key={p.id}><td><a href={'#/projetos/'+p.id}>{p.name}</a></td><td>{money(p.contractValue)}</td><td>{p.contractStatus}</td><td>{p.contractStart||'Sem data registrada'} — {p.contractEnd||'Sem data registrada'}</td></tr>)}</tbody></table></details></section><section className="analytics-card"><h2>Evolução no período</h2><History series={model.history}/><p>Somente contratos com data de conversão registrada. Registros antigos sem data ficam fora da série.</p></section></>}
 </div>;
}

function ContractMosaic({groups,total}) {
 const host=useRef(null);const [width,setWidth]=useState(0);
 useLayoutEffect(()=>{const observer=new ResizeObserver(([e])=>setWidth(e.contentRect.width));observer.observe(host.current);return()=>observer.disconnect()},[]);
 const rects=width?squarify(groups.map(([name,items])=>({name,v:items.reduce((s,p)=>s+p.contractValue,0)})).sort((a,b)=>b.v-a.v),0,0,width,300):[];
 return <div ref={host} className="analytics-mosaic" style={{position:'relative',height:300,display:'block'}}>{rects.map(r=><a key={r.name} href="#/contratos" aria-label={`${r.name}: ${money(r.v)}, ${(r.v/total*100).toFixed(1)}%`} title={`${r.name}: ${money(r.v)}`} style={{position:'absolute',left:r.x,top:r.y,width:Math.max(1,r.w-6),height:Math.max(1,r.h-6),minWidth:0,padding:r.w>100?14:4,overflow:'hidden'}}>{r.w>85&&r.h>75?<><span>{r.name}</span><strong>{money(r.v)}</strong><small>{(r.v/total*100).toFixed(1)}%</small></>:<span aria-hidden="true">+</span>}</a>)}</div>;
}

export function LeadComparison({model}) {
 const max=Math.max(1,...model.comparisons.flatMap(r=>[r.estimated||0,r.contracted||0]));
 return <section className="analytics-card analytics-comparison"><h2>Estimado na origem ? contratado</h2><p>Valores independentes por oportunidade. Aus?ncia de valor n?o significa zero.</p>{model.comparisons.length?model.comparisons.map(r=><div key={r.id}><a href={'#/leads/'+r.id}>{r.name}</a><div className="comparison-pair">{[['Estimado',r.estimated],['Contratado',r.contracted]].map(([label,value])=><div key={label}><span>{label}: {value==null?'Sem registro':money(value)}</span><i aria-hidden="true" style={{display:'block',height:8,width:`${(value||0)/max*100}%`,background:label==='Estimado'?'#a2f6bd':'#80baff'}}/></div>)}</div></div>):<p>Sem registros para comparar.</p>}</section>;
}

function History({series}) {
 if(series.length<2) return <p className="empty">Sem histórico para comparar. São necessários pelo menos dois meses com registros datados.</p>;
 const max=Math.max(...series.map(p=>p.value),1);
 const points=series.map((p,i)=>`${10+i/(series.length-1)*280},${140-p.value/max*120}`).join(' ');
 return <><svg viewBox="0 0 300 160" role="img" aria-label="Valor contratado por mês de conversão"><polyline points={points} fill="none" stroke="#a2f6bd" strokeWidth="3"/></svg><ul>{series.map(p=><li key={p.label}>{p.label}: {money(p.value)}</li>)}</ul></>;
}

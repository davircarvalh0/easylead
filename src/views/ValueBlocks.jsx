import React,{useRef,useEffect,useLayoutEffect} from 'react';
import {updateChartGlow, useChartEntrance} from './ChartSurface.jsx';
import './lead-values-workspace.css';
import {DashboardValue, formatMoney as money, formatNumber, formatPercent} from './DashboardValue.jsx';

export function ValueDetails({row,state,kind,query=''}) {
 const {item,project,squad,area}=row;
 const lead=kind==='leads'?item:state.leads.find(l=>l.id===project?.leadId);
 const name=id=>state.members.find(m=>m.id===id)?.name||'Não definido';
 const suffix=query?'?'+query:'';
 return <>
 {kind==='leads'&&<div className="lead-value-highlight" data-estimated={row.label==='Valor Estimado'?true:undefined}>
  <span>{row.label}</span><DashboardValue value={row.value} money fallback="Sem valor registrado"/>
  {row.ratio>0&&<span>{formatPercent(row.ratio)} do maior valor do recorte</span>}
 </div>}
 <p>{item.company} · {item.clientSegment}</p><dl>
 {kind!=='leads'&&<><dt>{row.label}</dt><dd>{money(row.value)}</dd></>}
 {kind==='leads'&&<><dt>Estimado na origem</dt><dd>{money(lead?.estimatedValue)}</dd></>}
 <dt>Contrato vinculado</dt><dd>{project?`${project.contractStatus} · ${money(project.contractValue)}`:'Ainda sem projeto'}</dd>
 <dt>Responsáveis</dt><dd>{project?name(project.ownerId):lead?.contact||'Não definido'}</dd>
 <dt>Fase</dt><dd>{project?.phase||'Ainda sem projeto'}</dd>
 <dt>Squad</dt><dd>{squad?.name||'Ainda sem squad'}</dd>
 <dt>Subárea</dt><dd>{area?.name||'Não definida'}</dd>
 <dt>Equipe vinculada</dt><dd>{project?.memberIds.map(name).join(', ')||'Ainda sem equipe'}</dd></dl>
 <div className="value-links">
 {lead&&<a href={'#/leads/'+lead.id+suffix}>Abrir lead →</a>}
 {project&&<a href={'#/projetos/'+project.id+suffix}>Abrir projeto vinculado →</a>}
 {squad&&<a href={'#/squads/'+squad.id+suffix}>Explorar squad →</a>}
 {area&&<a href={'#/organizacao/'+area.id+suffix}>Abrir subárea →</a>}
 </div></>;
}

export function ValueBlocks({model,state,kind,grouping,onGroup,selected,onSelect,query}) {
 const dialog=useRef(null);
 const surface=useChartEntrance(), positions=useRef(new Map());
 useLayoutEffect(()=>{
  const nodes=surface.current.querySelectorAll('[data-item]');
  const next=new Map(),animations=[];
  for(const node of nodes){
   const rect=node.getBoundingClientRect();next.set(node.dataset.item,rect);
   const before=positions.current.get(node.dataset.item);
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const dx=before?before.left-rect.left:0,dy=before?before.top-rect.top:12;
    if(dx||dy)animations.push(node.animate([{transform:`translate(${dx}px,${dy}px)`,opacity:before?1:0},{transform:'translate(0,0)',opacity:1}],{duration:280,easing:'ease-out'}));
   }
  }
  positions.current=next;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const stop=()=>{if(media.matches)animations.forEach(a=>a.cancel());};
  const visibility=()=>animations.forEach(a=>document.hidden?a.pause():a.play());
  media.addEventListener('change',stop);document.addEventListener('visibilitychange',visibility);
  return()=>{animations.forEach(a=>a.cancel());media.removeEventListener('change',stop);document.removeEventListener('visibilitychange',visibility);};
 },[model]);
 const row=model.items.find(i=>i.id===selected);
 useEffect(()=>{
  const node=dialog.current;
  if(row&&!node.open) node.showModal();
  if(!row&&node.open) node.close();
 },[row]);
 const leadMode=kind==='leads';
 function tile(r,unvalued=false) {
  if(leadMode) return <button type="button" key={r.id} className={`value-block lead-value-tile chart-surface ${unvalued?'unvalued':r.ratio>=.75?'hero':''} ${r.label==='Valor Estimado'?'estimated':''}`}
   data-item={r.id} onPointerMove={updateChartGlow} aria-haspopup="dialog" aria-pressed={selected===r.id} onClick={()=>onSelect(r.id)}>
   <span className="lead-tile-art" aria-hidden="true"><i/><i/><i/></span>
   <span className="lead-tile-open" aria-hidden="true">↗</span>
   <span className="lead-tile-copy"><strong>{r.item.name}</strong><small>{r.item.stage} · {unvalued?'Sem valor':r.label==='Valor Estimado'?'Estimativa':'Contrato'}</small></span>
   {!unvalued&&<span className="scale-track" aria-hidden="true"><span className="scale-area" style={{width:r.ratio*100+'%'}}/></span>}
  </button>;
  return <button type="button" key={r.id} className={`value-block chart-surface ${unvalued?'unvalued':r.ratio>=.75?'hero':''} ${r.label==='Valor Estimado'?'estimated':''}`} data-item={r.id} onPointerMove={updateChartGlow} aria-haspopup="dialog" aria-pressed={selected===r.id} onClick={()=>onSelect(r.id)}>
   <span className="block-copy"><span className="badge">{kind==='leads'?r.item.stage:r.project.phase}</span><strong>{r.item.name}</strong><span>{r.label}</span>{!unvalued&&<DashboardValue value={r.value} money/>}
   {r.project&&<span>{r.squad?.name||'Sem squad'} · {r.area?.name||'Sem subárea'}</span>}
   <small>{r.item.company}</small></span>
   {!unvalued&&<span className="scale-track" aria-hidden="true"><span className="scale-area" style={{width:`${r.ratio*100}%`}}/></span>}
   {!unvalued&&<small>{formatPercent(r.ratio)} do maior valor do recorte · Ver detalhe ↗</small>}
  </button>;
 }
 return <section ref={surface} className={leadMode?'value-blocks lead-market':'value-blocks'} aria-label="Blocos de valor">
 <div className="value-heading"><h2>{leadMode ? 'Selecione uma oportunidade para ver os valores' : 'Comparação por valor'}</h2><label>Agrupar blocos<select value={grouping} onChange={e=>onGroup(e.target.value)}><option value="direct">Comparação direta</option>{kind==='leads'?<option value="stage">Etapa do funil</option>:<><option value="squad">Squad e subárea</option><option value="phase">Discovery / Delivery</option></>}</select></label></div>
 {leadMode?<div className="value-legend">
  <span><i style={{'--legend':'var(--viz-mint)'}}/>Contrato</span>
  <span><i style={{'--legend':'var(--viz-lilac)'}}/>Estimativa</span>
 </div>:<p className="scale-explanation">As barras usam o maior valor do recorte como referência. </p>}
 <p role="status" className={leadMode?'sr-status':'filter-feedback'}>Recorte atualizado: {formatNumber(model.items.length)} {kind==='leads'?'leads':'projetos'} · {formatNumber(model.unvalued.length)} fora da escala.</p>
 {model.groups.map(g=><section className="value-group" key={g.label}>{(!leadMode||grouping!=='direct')&&<h3>{g.label}{!leadMode&&<small> · {money(g.total)}</small>}</h3>}<div className="value-mosaic">{g.items.map(r=>tile(r))}</div></section>)}
 {!!model.unvalued.length&&<section className="unvalued-lane"><h3>{leadMode?'Oportunidades sem valor registrado':'Sem valor ou sem contrato · Fora da escala'}</h3><div className="value-mosaic">{model.unvalued.map(r=>tile(r,true))}</div></section>}
 {!model.items.length&&<p className="empty">Nenhum item neste recorte. Ajuste os filtros para continuar.</p>}
 <dialog ref={dialog} className="value-dialog" aria-labelledby="block-detail-title" onCancel={e=>{e.preventDefault();onSelect('')}} onClose={()=>{if(selected)onSelect('')}}>
 {row&&<><button autoFocus className="quiet-button" onClick={()=>onSelect('')}>Fechar detalhe</button><h2 id="block-detail-title">{row.item.name}</h2><ValueDetails row={row} state={state} kind={kind} query={query}/></>}
 </dialog>
 </section>;
}

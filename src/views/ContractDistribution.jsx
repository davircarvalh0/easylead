import React from 'react';
import {DashboardValue,formatPercent} from './DashboardValue.jsx';

const groups=[{key:'areaId',label:'Subárea',filter:'area'},{key:'clientSegment',label:'Segmento',filter:'segmento'},{key:'phase',label:'Fase',filter:'fase'}];

export function ContractDistribution({model,state,grouping,onGroup,filters}) {
  const active=groups.find(group=>group.key===grouping) ?? groups[0];
  const totals=new Map();
  for(const project of model.eligible) {
    const key=project[active.key] || '';
    totals.set(key,(totals.get(key)||0)+project.contractValue);
  }
  const directory=new URLSearchParams(filters);
  directory.set('modo','tabela');
  const directoryHref='#/projetos/todos?'+directory;
  const rows=[...totals].map(([key,value])=>({key,value,name:active.key==='areaId'?(state.areas.find(area=>area.id===key)?.name ?? 'Sem subárea'):(key || 'Não classificado')}))
    .sort((a,b)=>b.value-a.value || a.name.localeCompare(b.name));
  const remaining=rows.slice(6).reduce((total,row)=>total+row.value,0);
  const visible=remaining?[...rows.slice(0,6),{key:'others',name:'Outros',value:remaining,other:true}]:rows;
  const max=Math.max(...visible.map(row=>row.value),1);
  return <>
    <header className="bento-section-header"><h2>Distribuição do valor contratado</h2>
      <div className="prospect-toggle lead-glass-switch project-distribution-switch" role="group" aria-label="Agrupar contratos" style={{'--switcher-index':groups.indexOf(active)}}>
        {groups.map(group=><button type="button" key={group.key} aria-pressed={group.key===active.key} onClick={()=>onGroup(group.key)}>{group.label}</button>)}
      </div>
    </header>
    <ul className="contract-distribution-bars" aria-label={'Valor contratado por '+active.label.toLocaleLowerCase('pt-BR')}>
      {visible.map(row=>{
        const params=new URLSearchParams(directory);
        if(!row.other && row.key) params.set(active.filter,row.key);
        return <li key={row.other?'summary-others':'category-'+row.key}><a href={row.other || !row.key?directoryHref:'#/projetos/todos?'+params}>
          <span className="distribution-row-name">{row.name}</span>
          <DashboardValue money value={row.value}/>
          <span className="distribution-bar" aria-hidden="true"><i style={{width:row.value/max*100+'%'}}/></span>
          <span className="distribution-percent">{formatPercent(model.values.total?row.value/model.values.total:0)}</span>
        </a></li>;
      })}
    </ul>
    {!rows.length && <p className="empty">Nenhum valor neste recorte.</p>}
    <a className="distribution-directory-link" href={directoryHref}>Ver todos os contratos →</a>
  </>;
}

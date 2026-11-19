import React from 'react';
import {ChartSurface} from './ChartSurface.jsx';
import {formatMoney,formatNumber} from './DashboardValue.jsx';

const width=640,height=280,left=86,right=620,top=16,bottom=240;
const monthName=new Intl.DateTimeFormat('pt-BR',{month:'short',timeZone:'UTC'});
const monthTitle=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'});
const compact=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
const date=month=>new Date(month+'-01T00:00:00Z');
const monthIndex=month=>Number(month.slice(0,4))*12+Number(month.slice(5,7))-1;
const path=points=>points.map((point,index)=>(index?'L':'M')+point.x+','+point.y).join(' ');

function TimeSeriesChart({className,label,rows,traces,max,money=false,ticks}) {
  const y=value=>bottom-value/Math.max(max,1)*(bottom-top);
  return <ChartSurface className={'bento-chart-frame cartesian-chart '+className} label={label}
    width={width} height={height} points={rows}>
    {active=><>
      {[0,.25,.5,.75,1].map(fraction=><g key={fraction}>
        <line x1={left} x2={right} y1={y(max*fraction)} y2={y(max*fraction)} className="cartesian-grid"/>
        <text className="svg-tick" x={left-10} y={y(max*fraction)+4} textAnchor="end">{compact.format(max*fraction)}</text>
      </g>)}
      {ticks.map(tick=><text key={tick.key} className="svg-tick" x={tick.x} y={bottom+24} textAnchor="middle">{tick.label}</text>)}
      {traces.map(trace=><g key={trace.key} style={{stroke:trace.color}} className={trace.past?'chart-trace chart-trace-past':'chart-trace'}>
        {money && trace.points.length>1 && <path d={path(trace.points)+` L${trace.points.at(-1).x},${bottom} L${trace.points[0].x},${bottom} Z`} fill={trace.color} opacity=".06"/>}
        {trace.points.length>1 && <path d={path(trace.points)} className="bento-plot chart-stroke" pathLength="1" fill="none" stroke={trace.color}/>}
        {trace.points.map(point=><circle key={point.id} cx={point.x} cy={point.y} r={trace.past?2:3} fill={trace.color} opacity={trace.past?.45:1}/>)}
      </g>)}
      {active && <g className="chart-crosshair">
        <line x1={active.x} x2={active.x} y1={top} y2={bottom}/>
        {active.marks.map(mark=><circle key={mark.color} cx={active.x} cy={mark.y} r="5" fill={mark.color}/>)}
      </g>}
      {!rows.length && <text className="svg-caption" x={(left+right)/2} y={(top+bottom)/2} textAnchor="middle">Sem registros com data</text>}
    </>}
  </ChartSurface>;
}

export function RevenueChart({series,label}) {
  let total=0;
  const values=series.map(point=>({...point,value:total+=point.value}));
  const first=values.length?monthIndex(values[0].label):0;
  const last=values.length?monthIndex(values.at(-1).label):0;
  const max=Math.max(total,1), color='var(--viz-mint)';
  const points=values.map(point=>({
    id:point.label,label:monthTitle.format(date(point.label)),
    x:first===last?(left+right)/2:left+(monthIndex(point.label)-first)/(last-first)*(right-left),
    y:bottom-point.value/max*(bottom-top),
    values:[{name:'Acumulado',value:formatMoney(point.value),color}],
  }));
  const ticks=points.filter((_,index)=>index===0 || index===points.length-1 || index%Math.ceil(points.length/6)===0)
    .map(point=>({key:point.id,x:point.x,label:monthName.format(date(point.id)).replace('.','')}));
  return <TimeSeriesChart className="sparkline-frame" label={label} rows={points.map(point=>({...point,marks:[{y:point.y,color}]}))}
    traces={[{key:'revenue',points,color}]} max={max} ticks={ticks} money/>;
}

export function ActivityChart({series,primary,secondary}) {
  const years=[...new Set(series.map(point=>point.label.slice(0,4)))].sort().slice(-3).reverse();
  const visible=series.filter(point=>years.includes(point.label.slice(0,4)));
  const indices=visible.map(point=>Number(point.label.slice(5,7))-1);
  const first=Math.min(...indices,11),last=Math.max(...indices,0);
  const max=Math.max(...visible.flatMap(point=>[point.first,point.second]),1);
  const x=month=>first===last?(left+right)/2:left+(month-first)/(last-first)*(right-left);
  const y=value=>bottom-value/max*(bottom-top);
  const colors=['var(--viz-sky)','var(--viz-amber)'];
  const rows=visible.filter(point=>point.label.startsWith(years[0]+'-')).map(point=>({
    id:point.label,label:monthTitle.format(date(point.label)),x:x(Number(point.label.slice(5,7))-1),
    marks:[{y:y(point.first),color:colors[0]},{y:y(point.second),color:colors[1]}],
    values:[{name:primary,value:formatNumber(point.first),color:colors[0]},{name:secondary,value:formatNumber(point.second),color:colors[1]}],
  }));
  const traces=years.toReversed().flatMap(year=>['first','second'].map((key,index)=>({
    key:year+key,color:colors[index],past:year!==years[0],
    points:visible.filter(point=>point.label.startsWith(year+'-')).map(point=>({id:point.label,x:x(Number(point.label.slice(5,7))-1),y:y(point[key])})),
  })));
  const ticks=Array.from({length:Math.max(0,last-first+1)},(_,index)=>first+index)
    .filter((month,index)=>index%2===0 || month===last)
    .map(month=>({key:month,x:x(month),label:monthName.format(new Date(Date.UTC(2026,month,1))).replace('.','')}));
  return <TimeSeriesChart className="activity-frame" label={primary+' e '+secondary+' por mês'} rows={rows} traces={traces} max={max} ticks={ticks}/>;
}

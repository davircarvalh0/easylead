import React, {useLayoutEffect, useRef, useState} from 'react';
import {squarify} from './analyticsLayout.js';
import {formatMoney} from './DashboardValue.jsx';
import {chartColor} from './BentoCharts.jsx';

export function ContractTreemap({groups, grouped, onInspect}) {
  const frame = useRef(null);
  const [{width, height}, setSize] = useState({width:0, height:0});
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([{contentRect}]) => {
      setSize({width:contentRect.width, height:contentRect.height});
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  const buckets = [...groups].map(([label, rows])=>{
    const positive = rows.filter(row=>row.value > 0);
    return {label, rows:positive, v:positive.reduce((sum, row)=>sum + row.value, 0)};
  }).filter(group=>group.v > 0).sort((a,b)=>b.v - a.v);
  const orderedRows = buckets.flatMap(group=>group.rows).sort((a,b)=>b.value - a.value || a.lead.id.localeCompare(b.lead.id));
  const colors = new Map(orderedRows.map((row,index)=>[row.lead.id,chartColor(index)]));
  const regions = width && height ? squarify(buckets, 0, 0, width, height) : [];
  const tiles = regions.flatMap(region =>
    squarify(region.rows.map(row=>({...row, v:row.value})), region.x, region.y, region.w, region.h)
  );

  return <>
    <div ref={frame} className="proposal-treemap" role="group" aria-label="Mapa de blocos dos contratos">
      {tiles.map(tile=>{
        const price = formatMoney(tile.value);
        const label = tile.lead.name + ' · ' + price;
        const style = {left:tile.x, top:tile.y, width:tile.w, height:tile.h, '--tile-accent':colors.get(tile.lead.id)};
        const contents = tile.w >= 86 && tile.h >= 54 ? <>
          <span>{tile.lead.name}</span>{tile.w >= price.length * 10 + 20 && <strong>{price}</strong>}
        </> : null;
        return <button type="button" className="proposal-tile" key={tile.lead.id}
          style={style} data-item={tile.lead.id} data-stage={tile.lead.stage} aria-label={label} title={label} aria-haspopup="dialog"
          onClick={()=>onInspect(tile.lead.id)}>{contents}</button>;
      })}
      {grouped && regions.map(region=><span key={region.label} className="proposal-region" aria-hidden="true"
        style={{left:region.x, top:region.y, width:region.w, height:region.h}}/>)}
    </div>
    {grouped && <ul className="proposal-region-legend" aria-label="Estágios no mapa">
      {buckets.map(group=><li key={group.label} data-stage={group.label}>{group.label} · {formatMoney(group.v)}</li>)}
    </ul>}
  </>;
}

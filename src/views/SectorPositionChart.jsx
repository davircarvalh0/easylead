import React, {useLayoutEffect, useRef, useState} from 'react';
import {animate, motion, useReducedMotion} from 'motion/react';
import {formatMoney, formatPercent} from './DashboardValue.jsx';
import {updateChartGlow} from './ChartSurface.jsx';

const compactMoney = new Intl.NumberFormat('pt-BR', {
  style:'currency', currency:'BRL', notation:'compact', maximumFractionDigits:1,
});
const axisFractions = [0,.25,.5,.75,1];
const entrance = {once:true, amount:.25};
const ease = [.22,1,.36,1];
function chartCeiling(peak) {
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  const unit = [1,2,2.5,5,10].find(candidate=>candidate >= peak / magnitude);
  return unit * magnitude;
}

function conversionScale(groups, benchmarkRate) {
  if (groups.length < 2) {
    const halfRange = Math.min(benchmarkRate,100 - benchmarkRate);
    const defaultMin = halfRange > 0 ? benchmarkRate - halfRange : 0;
    const defaultMax = halfRange > 0 ? Math.min(100,benchmarkRate + halfRange) : 100;
    const selectedRate = groups[0]?.rate * 100;
    const min = groups.length ? Math.min(defaultMin,selectedRate) : defaultMin;
    const max = groups.length ? Math.max(defaultMax,selectedRate) : defaultMax;
    const ticks = axisFractions.map(fraction => fraction === 1 ? max : min + (max - min) * fraction);
    return {min,max,ticks};
  }
  const rates = groups.map(group => group.rate * 100);
  const low = Math.min(...rates);
  const high = Math.max(...rates);

  // Round the padded range to readable tick values in percentage points.
  const padding = low === high ? .5 : Math.max((high - low) * .2, .2);
  const paddedLow = Math.max(0, low - padding);
  const paddedHigh = Math.min(100, high + padding);
  const step = chartCeiling((paddedHigh - paddedLow) / 4);
  const first = Math.floor(paddedLow / step);
  const last = Math.ceil(paddedHigh / step);
  const ticks = Array.from({length:last - first + 1}, (_, index) =>
    Math.min(100, Number(((first + index) * step).toFixed(2))));
  return {min:ticks[0], max:ticks.at(-1), ticks};
}

function useAnimatedRange({min,max}, reduced) {
  const [range,setRange] = useState({min,max});
  const current = useRef(range);

  useLayoutEffect(() => {
    const from = current.current;
    if (from.min === min && from.max === max) return;
    if (reduced) {
      current.current = {min,max};
      setRange(current.current);
      return;
    }
    const animation = animate(0,1,{
      duration:.45, ease,
      onUpdate:progress => {
        current.current = progress === 1 ? {min,max} : {
          min:from.min + (min - from.min) * progress,
          max:from.max + (max - from.max) * progress,
        };
        setRange(current.current);
      },
    });
    return () => animation.stop();
  },[min,max,reduced]);

  return reduced ? {min,max} : range;
}

const formatRateTick = new Intl.NumberFormat('pt-BR', {
  style:'percent', maximumFractionDigits:2,
}).format;

export function SectorPositionChart({model, selected, onToggle}) {
  const reduced = useReducedMotion();
  const [hoveredSector, setHoveredSector] = useState(null);
  const plotted = model.groups.filter(group=>group.averageValue !== null);
  const visible = plotted.filter(group => selected.has(group.segment));
  const benchmarkRate = model.rate * 100;
  const yScale = conversionScale(visible,benchmarkRate);
  const range = useAnimatedRange(yScale,reduced);
  const visibleTicks = yScale.ticks.filter(tick => tick >= range.min && tick <= range.max);
  if (!plotted.length) return <section className="sector-position" aria-label="Posição dos setores">
    <p className="empty">A posição dos setores aparece quando houver projetos com valor contratado registrado.</p>
  </section>;

  const ceiling = chartCeiling(Math.max(...plotted.map(group=>group.averageValue)));
  const positions = new Map();
  const yPosition = percentage => (range.max - percentage) / (range.max - range.min) * 100;
  for (const group of visible) {
    const key = group.rate + ':' + group.averageValue;
    if (!positions.has(key)) {
      const y = Math.max(0,Math.min(100,yPosition(group.rate * 100)));
      positions.set(key, {key, x:group.averageValue / ceiling * 100, y, groups:[]});
    }
    positions.get(key).groups.push(group);
  }
  const points = [...positions.values()];
  const active = points.find(point => point.groups.some(group => group.segment === hoveredSector));
  const benchmarkX = model.averageValue / ceiling * 100;
  const showRateReference = benchmarkRate >= yScale.min && benchmarkRate <= yScale.max;
  const rateReference = benchmarkRate >= range.min && benchmarkRate <= range.max ? ' M0 ' + yPosition(benchmarkRate) + 'H100' : '';

  return <section className="sector-position chart-surface" aria-label="Posição dos setores" onPointerMove={updateChartGlow}>
    <header className="sector-position-header">
      <div className="sector-position-reference"><i aria-hidden="true"/> <span>Taxa geral <strong>{formatPercent(model.rate)}</strong>{!showRateReference && ' (fora da escala)'}</span>
        <span>Média geral <strong>{formatMoney(model.averageValue)}</strong></span></div>
    </header>
    <p className="sector-position-axis-title">Taxa de conversão em contrato (%)</p>
    <div className="sector-position-plot" role="group" aria-label="Dispersão por valor médio e taxa de conversão">
      {axisFractions.map(tick=>
        <span key={tick} className="sector-position-tick-x" style={{left:tick * 100 + '%'}} data-minor={tick === .25 || tick === .75} aria-hidden="true">{compactMoney.format(tick * ceiling)}</span>)}
      {visibleTicks.map(tick=>
        <span key={tick} className="sector-position-tick-y" style={{top:yPosition(tick) + '%'}} aria-hidden="true">{formatRateTick(tick / 100)}</span>)}
      <svg className="sector-position-guides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {axisFractions.map(tick=><path key={tick} className="sector-position-grid" d={'M' + tick * 100 + ' 0V100'}/>)}
        {visibleTicks.map(tick=><path key={tick} className="sector-position-grid" d={'M0 ' + yPosition(tick) + 'H100'}/>)}
        <path className="sector-position-benchmark" d={'M' + benchmarkX + ' 0V100' + rateReference}/>
      </svg>
      {active && <motion.div key={active.key} className="sector-position-projection" aria-hidden="true"
        initial={reduced ? false : {opacity:0}} animate={{opacity:1}}
        transition={{duration:reduced ? 0 : .2}}>
          <motion.i className="sector-position-trace-x" style={{top:active.y + '%', width:active.x + '%'}}
            initial={reduced ? false : {scaleX:0}} animate={{scaleX:1}} transition={{duration:reduced ? 0 : .35, ease}}/>
          <motion.i className="sector-position-trace-y" style={{left:active.x + '%', height:(100 - active.y) + '%'}}
            initial={reduced ? false : {scaleY:0}} animate={{scaleY:1}} transition={{duration:reduced ? 0 : .35, ease}}/>
      </motion.div>}
      {points.flatMap((point,index) => point.groups.map((group,part) => {
        const number = selected.get(group.segment);
        const columns = Math.min(3, point.groups.length);
        const rows = Math.ceil(point.groups.length / columns);
        // Offset coincident markers so each number remains readable.
        const offsetX = 34 * (part % columns - (columns - 1) * point.x / 100);
        const offsetY = 34 * (Math.floor(part / columns) - (rows - 1) * point.y / 100);
        const isActive = group.segment === hoveredSector;
        return <motion.button key={group.segment} type="button" className="sector-position-point"
          style={{left:point.x + '%', top:point.y + '%', marginLeft:offsetX, marginTop:offsetY}}
          aria-label={group.segment + ', ' + formatPercent(group.rate) + ' de conversão, média ' + formatMoney(group.averageValue) + ', setor ' + number}
          aria-pressed="true" data-active={isActive}
          initial={reduced ? false : {opacity:0, scale:.5, y:14}}
          whileInView={{opacity:1, scale:1, y:0}} viewport={entrance}
          whileHover={reduced ? undefined : {scale:1.16}} whileTap={reduced ? undefined : {scale:.92}}
          transition={{duration:reduced ? 0 : .38, delay:reduced ? 0 : Math.min(index,8) * .043, ease}}
          onHoverStart={()=>setHoveredSector(group.segment)}
          onHoverEnd={()=>setHoveredSector(current=>current === group.segment ? null : current)}
          onClick={()=>{
            setHoveredSector(null);
            onToggle(group.segment);
          }}>
          <span className="sector-marker-number" data-tone={(number - 1) % 4} aria-hidden="true">{number}</span>
        </motion.button>;
      }))}
    </div>
    <p className="sector-position-axis-x">Valor médio contratado por projeto</p>
  </section>;
}

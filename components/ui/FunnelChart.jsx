import React, {useId} from 'react';

function funnelOutline(widths, inset) {
  const knots = [widths[0], ...widths, widths.at(-1)];
  const centers = [0, ...widths.map((_, index) => index + .5), widths.length];
  const boundary = direction => knots.map((width, index) => [50 + direction * width * inset / 2, centers[index]]);
  function trace(points) {
    return points.slice(1).map(([x, y], index) => {
      const [previousX, previousY] = points[index];
      const middle = (previousY + y) / 2;
      return 'C' + [previousX, middle, x, middle, x, y].join(' ');
    }).join(' ');
  }
  const left = boundary(-1);
  const right = boundary(1).reverse();
  return 'M' + left[0].join(' ') + trace(left) + 'L' + right[0].join(' ') + trace(right) + 'Z';
}

export function FunnelChart({data, hrefFor}) {
  const paint = useId();
  const Stage = hrefFor ? 'a' : 'div';
  const max = Math.max(0, ...data.map(stage => stage.value));
  const total = data.reduce((sum, stage) => sum + stage.value, 0);
  const widths = data.map(stage => max ? stage.value / max * 88 : 0);

  return <div className="funnel-stages">
    <svg className="funnel-svg" viewBox={'0 0 100 ' + data.length} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={paint} x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="var(--funnel-edge, #218461)"/>
          <stop offset=".5" stopColor="var(--funnel-center, #54cf9e)"/>
          <stop offset="1" stopColor="var(--funnel-end, #218461)"/>
        </linearGradient>
      </defs>
      <path className="funnel-spine" d={'M50 0V' + data.length}/>
      {max > 0 && <>
        <path className="funnel-outline" d={funnelOutline(widths, 1)} fill={'url(#' + paint + ')'}/>
        <path className="funnel-core" d={funnelOutline(widths, .82)} fill={'url(#' + paint + ')'}/>
      </>}
    </svg>
    {data.map((stage, index) => {
      const pct = total ? stage.value / total * 100 : 0;
      const formatted = pct.toLocaleString('pt-BR', {maximumFractionDigits:1}) + '%';
      return <Stage href={hrefFor?.(stage.label)} role={hrefFor ? undefined : 'img'} key={stage.label} className="funnel-stage" data-width={widths[index]}
        aria-label={stage.label + ': ' + stage.value + ' leads, ' + formatted + ' de participação'}>
        <span className="funnel-label">
          <strong className="funnel-count">{stage.value.toLocaleString('pt-BR')}<small>{stage.value === 1 ? 'lead' : 'leads'}</small></strong>
          <span className="funnel-percent">{formatted}</span><span className="funnel-name">{stage.label}</span>
        </span>
      </Stage>;
    })}
  </div>;
}

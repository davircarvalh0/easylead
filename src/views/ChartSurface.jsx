import React, { useEffect, useRef, useState } from 'react';

export function useChartEntrance() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      node.classList.add('is-chart-visible');
      observer.disconnect();
    }, { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function positionGlow(node, event) {
  const {left, top} = node.getBoundingClientRect();
  node.style.setProperty('--glow-x', (event.clientX - left) + 'px');
  node.style.setProperty('--glow-y', (event.clientY - top) + 'px');
}

export function updateChartGlow(event) {
  const node = event.currentTarget;
  if (event.pointerType === 'touch' || node.closest('.lead-dashboard-glow')) return;
  positionGlow(node,event);
}

export function updateModuleGlow(event) {
  if (event.pointerType === 'touch') return;
  const dashboard = event.target.closest('.lead-dashboard-glow');
  if (dashboard) {
    positionGlow(dashboard,event);
    dashboard.dataset.cursorGlow = "true";
    return;
  }
  const module = event.target.closest('.fr-module, .bento-module, .lead-funnel, .lead-secondary, .toolbar, .lead-support, .subarea-atom-detail, .card, .value-panel, .squad-context, .overview-owner-grid details');
  if (module && !module.classList.contains('chart-surface')) positionGlow(module,event);
}

export function ChartSurface({ className, label, points, pick, width, height, showReadoutHeading = false, children }) {
  const frame = useChartEntrance();
  const [selection, setSelection] = useState(null);
  const [keyboard, setKeyboard] = useState(false);
  const active = points.find(point => point.id === selection);

  function inspect(event) {
    const bounds = event.currentTarget.firstElementChild.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * width;
    const y = (event.clientY - bounds.top) / bounds.height * height;
    const point = pick
      ? pick(x, y)
      : points.reduce((nearest, entry) => Math.abs(entry.x - x) < Math.abs(nearest.x - x) ? entry : nearest, points[0]);
    setKeyboard(false);
    setSelection(point?.id ?? null);
  }

  function move(event) {
    updateChartGlow(event);
    if (points.length && event.pointerType !== 'touch') inspect(event);
  }

  function navigate(event) {
    if (event.key === 'Escape') {
      setSelection(null);
      return;
    }
    const index = points.indexOf(active);
    const next = {
      ArrowLeft: index < 0 ? points.length - 1 : Math.max(0, index - 1),
      ArrowRight: Math.min(points.length - 1, index + 1),
      Home: 0,
      End: points.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setKeyboard(true);
    setSelection(points[next].id);
  }

  return <div ref={frame} className={`chart-surface ${className}`}
    role="group" aria-label={label}
    aria-description={points.length ? 'Use as setas para explorar os meses e Escape para limpar a seleção.' : undefined}
    tabIndex={points.length ? 0 : undefined}
    onPointerMove={move}
    onPointerLeave={event => { if (event.pointerType !== 'touch' && !keyboard) setSelection(null); }}
    onPointerUp={event => { if (points.length && event.pointerType === 'touch') inspect(event); }}
    onKeyDown={points.length ? navigate : undefined}
    onBlur={() => setSelection(null)}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>{children(active)}</svg>
    <div className="chart-readout" role="status" aria-live={keyboard ? 'polite' : 'off'} hidden={!active}
      data-side={active?.x > width / 2 ? 'start' : 'end'}>
      {active && <>
        {showReadoutHeading && <strong>{active.label}</strong>}
        <dl aria-label={showReadoutHeading ? undefined : active.label}>{active.values.map(({ name, value, color }) => <div key={name}>
          <dt><i aria-hidden="true" style={{ background: color }}/>{name}</dt><dd>{value}</dd>
        </div>)}</dl>
      </>}
    </div>
  </div>;
}

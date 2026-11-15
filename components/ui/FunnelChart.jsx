import React from "react";
import { useEffect, useId, useState } from "react";
import { motion, useSpring, useTransform, useReducedMotion } from "motion/react";
const springConfig = { stiffness: 120, damping: 20, mass: 1 };
const hoverSpring = { stiffness: 300, damping: 24 };
function vSegmentPath(normStart, normEnd, segH, W, layerScale, straight = false) {
  const mx = W / 2;
  const w0 = normStart * W * 0.44 * layerScale;
  const w1 = normEnd * W * 0.44 * layerScale;
  if (straight) {
    return `M ${mx - w0} 0 L ${mx - w1} ${segH} L ${mx + w1} ${segH} L ${mx + w0} 0 Z`;
  }
  const cy = segH * 0.55;
  const left = `M ${mx - w0} 0 C ${mx - w0} ${cy}, ${mx - w1} ${segH - cy}, ${mx - w1} ${segH}`;
  const right = `L ${mx + w1} ${segH} C ${mx + w1} ${segH - cy}, ${mx + w0} ${cy}, ${mx + w0} 0`;
  return `${left} ${right} Z`;
}
function VRing({
  d,
  color,
  fill,
  opacity,
  hovered,
  ringIndex,
  totalRings
}) {
  const extraScale = 1 + ringIndex / Math.max(totalRings - 1, 1) * 0.12;
  const ringSpring = {
    stiffness: 300 - ringIndex * 60,
    damping: 24 - ringIndex * 3
  };
  const scaleX = useSpring(1, ringSpring);
  useEffect(() => {
    scaleX.set(hovered ? extraScale : 1);
  }, [hovered, scaleX, extraScale]);
  return <motion.path
    d={d}
    fill={fill ?? color}
    opacity={opacity}
    style={{ scaleX, transformOrigin: "center center" }}
  />;
}
function VSegment({
  index,
  normStart,
  normEnd,
  segH,
  fullW,
  color,
  layers,
  staggerDelay,
  hovered,
  dimmed,
  renderPattern,
  straight,
  gradientStops
}) {
  const uid = useId();
  const patternId = `funnel-v-pattern-${uid}`;
  const gradientId = `funnel-v-grad-${uid}`;
  const reduced = useReducedMotion();
  const growProgress = useSpring(reduced ? 1 : 0, springConfig);
  const entranceScaleY = useTransform(growProgress, [0, 1], [0, 1]);
  const entranceScaleX = useTransform(growProgress, [0, 1], [0, 1]);
  const dimOpacity = useSpring(1, hoverSpring);
  useEffect(() => {
    dimOpacity.set(dimmed ? 0.4 : 1);
  }, [dimmed, dimOpacity]);
  useEffect(() => {
    const timeout = setTimeout(
      () => growProgress.set(1),
      reduced ? 0 : index * staggerDelay * 1e3
    );
    return () => clearTimeout(timeout);
  }, [growProgress, index, staggerDelay, reduced]);
  const rings = Array.from({ length: layers }, (_, l) => {
    const scale = 1 - l / layers * 0.35;
    const opacity = 0.18 + l / (layers - 1 || 1) * 0.65;
    return {
      d: vSegmentPath(normStart, normEnd, segH, fullW, scale, straight),
      opacity
    };
  });
  return <motion.div
    className="funnel-segment"
    style={{
      width: fullW,
      height: segH,
      zIndex: hovered ? 10 : 1,
      opacity: dimOpacity
    }}
  >
      <motion.div
    className="funnel-entrance"
    style={{
      scaleY: entranceScaleY,
      scaleX: entranceScaleX,
      transformOrigin: "center top"
    }}
  >
        <svg
    aria-hidden="true"
    className="funnel-svg"
    preserveAspectRatio="none"
    role="presentation"
    viewBox={`0 0 ${fullW} ${segH}`}
  >
          <defs>
            {gradientStops && <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                {gradientStops.map((stop) => <stop
    key={`${stop.offset}-${stop.color}`}
    offset={typeof stop.offset === "number" ? `${stop.offset * 100}%` : stop.offset}
    stopColor={stop.color}
  />)}
              </linearGradient>}
            {renderPattern?.(patternId, color)}
          </defs>
          {rings.map((r, i) => {
    const isInnermost = i === rings.length - 1;
    let ringFill;
    if (isInnermost && renderPattern) {
      ringFill = `url(#${patternId})`;
    } else if (isInnermost && gradientStops) {
      ringFill = `url(#${gradientId})`;
    }
    return <VRing
      color={color}
      d={r.d}
      fill={ringFill}
      hovered={hovered}
      key={`v-ring-${r.opacity.toFixed(2)}`}
      opacity={r.opacity}
      ringIndex={i}
      totalRings={layers}
    />;
  })}
        </svg>
      </motion.div>
    </motion.div>;
}
function FunnelChart({ data, selected, onSelect, layers = 3, staggerDelay = 0.12 }) {
  const [hovered, setHovered] = useState(null);
  const reduced = useReducedMotion();
  const max = Math.max(0, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const norms = data.map((d) => max ? d.value / max : 0);
  return <div className="funnel-stages">{data.map((stage, i) => {
    const pct = total ? stage.value / total * 100 : 0;
    const formatted = pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
    const active = selected === stage.label;
    return <button
      type="button"
      key={stage.label}
      className="funnel-stage"
      data-width={norms[i] * 88}
      aria-pressed={active}
      aria-controls="funnel-results"
      aria-label={stage.label + ": " + stage.value + " leads, " + formatted + " de participa\xE7\xE3o"}
      onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(i)} onBlur={() => setHovered(null)}
      onClick={() => onSelect(active ? "" : stage.label)}
    >
   <VSegment
      index={i}
      normStart={norms[i]}
      normEnd={norms[Math.min(i + 1, data.length - 1)]}
      segH={120}
      fullW={600}
      color="currentColor"
      layers={layers}
      staggerDelay={staggerDelay}
      hovered={(active || hovered === i) && !reduced}
      dimmed={false}
      straight={false}
    />
   <motion.span
      className="funnel-label"
      initial={{ opacity: reduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduced ? 0 : i * staggerDelay + 0.25, duration: reduced ? 0 : 0.35 }}
    >
    <strong className="funnel-count">{stage.value.toLocaleString("pt-BR")}<small>leads</small></strong>
    <span className="funnel-percent">{formatted}</span><span className="funnel-name">{stage.label}</span>
   </motion.span>
  </button>;
  })}</div>;
}
export {
  FunnelChart
};





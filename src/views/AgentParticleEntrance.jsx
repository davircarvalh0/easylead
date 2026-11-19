import React, {useLayoutEffect, useRef} from 'react';

const clamp = value => Math.max(0, Math.min(value, 1));
const easeOut = value => 1 - (1 - value) ** 3;

function traceText(context, element, width, height, label) {
  const style = getComputedStyle(element);
  const inset = parseFloat(style.paddingInlineStart) || 0;
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.25;
  context.font = [style.fontWeight, style.fontSize, style.fontFamily].join(' ');
  context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
  context.textAlign = label ? 'left' : 'center';
  context.textBaseline = 'middle';

  const lines = [''];
  for (const word of (label || element.textContent).trim().split(/\s+/)) {
    const line = lines.at(-1);
    const next = line ? line + ' ' + word : word;
    if (line && context.measureText(next).width > width - inset * 2) lines.push(word);
    else lines[lines.length - 1] = next;
  }
  const firstLine = label ? lineHeight : (height - (lines.length - 1) * lineHeight) / 2;
  lines.forEach((line,index)=>context.fillText(line,label ? inset : width / 2,firstLine + index * lineHeight));
}

function samplePart(element, origin, stamp) {
  const rect = element.getBoundingClientRect();
  const {width,height} = rect;
  if (width < 3 || height < 3) return [];
  const kind = element.dataset.agentParticles;
  stamp.canvas.width = Math.ceil(width);
  stamp.canvas.height = Math.ceil(height);
  stamp.fillStyle = '#fff';
  if (kind !== 'text') {
    const rounding = parseFloat(getComputedStyle(element).borderTopLeftRadius);
    stamp.strokeStyle = '#fff';
    stamp.lineWidth = 2.6;
    stamp.beginPath();
    stamp.roundRect(1.5,1.5,width - 3,height - 3,Math.min(rounding || 12,height / 2));
    stamp.stroke();
  }
  if (kind === 'text' || kind === 'pill') traceText(stamp,element,width,height);
  if (kind === 'composer') {
    const textarea = element.querySelector('textarea');
    stamp.save();
    stamp.translate(10,5);
    traceText(stamp,textarea,width - 20,height,textarea.placeholder);
    stamp.restore();
    for (const button of element.querySelectorAll('.agent-composer-actions button:not([hidden])')) {
      const bounds=button.getBoundingClientRect();
      if (!bounds.width || !bounds.height) continue;
      stamp.beginPath();
      stamp.arc(bounds.left-rect.left+bounds.width/2,bounds.top-rect.top+bounds.height/2,bounds.height/2-1,0,Math.PI*2);
      stamp.stroke();
    }
  }
  const pixels = stamp.getImageData(0,0,stamp.canvas.width,stamp.canvas.height);
  const points = [];
  const step = kind === 'composer' ? 3 : 2;
  for (let y = 0; y < pixels.height; y += step) {
    for (let x = 0; x < pixels.width; x += step) {
      if (pixels.data[(y * pixels.width + x) * 4 + 3] > 75) {
        points.push({x:rect.left-origin.left+x,y:rect.top-origin.top+y});
      }
    }
  }
  const stride = Math.max(1,Math.ceil(points.length / 500));
  return points.filter((_,index)=>index % stride === 0);
}

export function AgentParticleEntrance() {
  const canvasRef = useRef(null);

  useLayoutEffect(()=>{
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    if (!root || !canvas || preference.matches) return;
    const context = canvas.getContext('2d');
    const stamp = document.createElement('canvas').getContext('2d',{willReadFrequently:true});
    if (!context || !stamp) return;

    const bounds = root.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const origin = {
      width, height:bounds.height,
      left:bounds.left + (bounds.width - width) / 2, top:bounds.top,
    };
    canvas.style.setProperty('--agent-canvas-width',width+'px');
    const ratio = Math.min(devicePixelRatio,2);
    canvas.width = Math.ceil(origin.width * ratio);
    canvas.height = Math.ceil(origin.height * ratio);
    context.scale(ratio,ratio);
    const parts = [...root.querySelectorAll('[data-agent-particles]')].map((element,index)=>({
      element,
      delay:index < 2 ? index * 95 : 210 + (index - 2) * 70,
      particles:samplePart(element,origin,stamp).map(target=>({
        ...target,
        fromX:target.x + (Math.random() - .5) * Math.min(origin.width,1100),
        fromY:target.y + (Math.random() - .5) * Math.min(origin.height,600),
        drift:(Math.random() - .5) * 74,
        radius:.35 + Math.random() * .65,
        shimmer:.38 + Math.random() * .6,
      })),
    }));
    if (!parts.some(part=>part.particles.length)) return;
    context.fillStyle = getComputedStyle(root).getPropertyValue('--easy-leads-ink').trim() || '#fff';
    root.dataset.agentForming = '';
    const started = performance.now();
    const pointer = {x:0,y:0,active:false};
    let frame;
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      context.clearRect(0,0,origin.width,origin.height);
      delete root.dataset.agentForming;
      for (const part of parts) part.element.style.removeProperty('--agent-reveal');
      window.removeEventListener('pointermove',move);
      document.documentElement.removeEventListener('pointerleave',leave);
      root.removeEventListener('focusin',controlFocus);
      window.removeEventListener('resize',finish);
      preference.removeEventListener('change',motionChanged);
    }

    function draw(now) {
      const elapsed = now - started;
      context.clearRect(0,0,origin.width,origin.height);
      for (const {element,delay,particles} of parts) {
        const progress = clamp((elapsed-delay)/920);
        const gather = easeOut(progress);
        const reveal = clamp((progress-.64)/.36);
        element.style.setProperty('--agent-reveal',reveal);
        for (const particle of particles) {
          let x = particle.fromX + (particle.x - particle.fromX) * gather;
          let y = particle.fromY + (particle.y - particle.fromY) * gather;
          const curl = Math.sin(progress * Math.PI) * particle.drift;
          x += curl;
          y -= curl * .5;
          if (pointer.active) {
            const influence = Math.max(0,1-Math.hypot(pointer.x-x,pointer.y-y)/130) * (1-progress) * .4;
            x += (pointer.x-x) * influence;
            y += (pointer.y-y) * influence;
          }
          context.globalAlpha = particle.shimmer * clamp((elapsed - delay * .3)/180) * (1-reveal);
          context.beginPath();
          context.arc(x,y,particle.radius,0,Math.PI*2);
          context.fill();
        }
      }
      if (elapsed >= parts.at(-1).delay + 920) finish();
      else frame = requestAnimationFrame(draw);
    }

    function move(event) {
      if (event.pointerType === 'touch') return;
      const bounds = root.getBoundingClientRect();
      pointer.x = event.clientX - origin.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    }

    function leave() {pointer.active = false;}
    function controlFocus(event) {if (event.target.matches('button, textarea')) finish();}
    function motionChanged(event) {if (event.matches) finish();}
    window.addEventListener('pointermove',move);
    document.documentElement.addEventListener('pointerleave',leave);
    root.addEventListener('focusin',controlFocus);
    window.addEventListener('resize',finish);
    preference.addEventListener('change',motionChanged);
    frame = requestAnimationFrame(draw);

    return finish;
  },[]);

  return <canvas ref={canvasRef} className="agent-particle-entrance" aria-hidden="true"/>;
}

import React from 'react';

// Only the painted child moves. The link/button hit area never transforms.
export function Magnetic({href, children}) {
  const Tag = href ? 'a' : 'button';
  const reset = event => {
    event.currentTarget.style.setProperty('--tx', '0px');
    event.currentTarget.style.setProperty('--ty', '0px');
  };
  function move(event) {
    if (event.pointerType !== 'mouse' || !matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = value => Math.max(-4, Math.min(4, value));
    event.currentTarget.style.setProperty('--tx', `${clamp((event.clientX - rect.x - rect.width / 2) * .12)}px`);
    event.currentTarget.style.setProperty('--ty', `${clamp((event.clientY - rect.y - rect.height / 2) * .18)}px`);
  }
  return <Tag href={href} className="button" onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset}><span className="btn-inner">{children}</span></Tag>;
}

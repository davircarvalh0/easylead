// Visual families and reference positions use the persisted subarea IDs.
export const orbitStyles = {
  a4: { color: '#ffc778', desktop: [.31, .68], mobile: [.28, .66] },
  a3: { color: '#bd9dff', desktop: [.50, .25], mobile: [.50, .20] },
  a2: { color: '#6dd9ff', desktop: [.19, .43], mobile: [.24, .42] },
  a1: { color: '#ff987d', desktop: [.69, .68], mobile: [.72, .66] },
  a0: { color: '#64ffd0', desktop: [.81, .43], mobile: [.76, .42] },
};
export const defaultOrbit = orbitStyles.a0;

// The two side positions have the widest clearance, followed by the top and lower pair.
const slotOrder = ['a2', 'a0', 'a3', 'a1', 'a4'];
const beams = [
  ['a2', 'a3', -.13], ['a3', 'a0', -.13], ['a2', 'a4', .13],
  ['a4', 'a1', -.10], ['a1', 'a0', .13], ['a3', 'a4', .10], ['a3', 'a1', -.10],
];

function assignPlanetSlots(atoms) {
  const byId = new Map(atoms.map(atom => [atom.id, atom]));
  const positions = slotOrder.filter(id => byId.has(id));
  const ranked = positions.map(id => byId.get(id)).sort((a, b) => b.count - a.count);
  const assignments = new Map();

  for (let start = 0; start < ranked.length;) {
    let end = start + 1;
    while (end < ranked.length && ranked[end].count === ranked[start].count) end++;
    const group = ranked.slice(start, end);
    const vacancies = new Set(positions.slice(start, end));
    // Preserve familiar positions when tied planets can keep their own slot.
    for (const {id} of group) {
      if (vacancies.delete(id)) assignments.set(id, id);
    }
    const openSlots = vacancies.values();
    for (const {id} of group) {
      if (!assignments.has(id)) assignments.set(id, openSlots.next().value);
    }
    start = end;
  }
  return assignments;
}

export function constellationFrame(atoms, width, height, time, pointerX, pointerY) {
  const mobile = width < 640;
  const [leader = 0, runnerUp = 0] = atoms.map(atom => atom.count).sort((a, b) => b - a);
  const sizeReference = Math.max(1, leader);
  const standardDiameter = mobile ? Math.min(100, width * .27) : Math.min(176, width * .20, height * .28);
  const expandedDiameter = mobile ? Math.min(150, width * .38) : Math.min(304, width * .26, height * .39);
  const lead = leader > 1 ? 1 - Math.sqrt(runnerUp / leader) : 0;
  const largestDiameter = standardDiameter + (expandedDiameter - standardDiameter) * lead;
  // Disc area follows the member count above the minimum visible size.
  const smallestDiameter = standardDiameter * .40;
  const spread = mobile ? Math.min(15, width * .032) : 23;
  const assignments = assignPlanetSlots(atoms);
  const planets = atoms.map(atom => {
    const slot = assignments.get(atom.id) || atom.id;
    const family = orbitStyles[slot] || defaultOrbit;
    const [x, y] = mobile ? family.mobile : family.desktop;
    const diameter = Math.max(smallestDiameter, largestDiameter * Math.sqrt(atom.count / sizeReference));
    return { id: atom.id, slot, x, y, diameter };
  });
  return planets.map((planet, index) => {
    let shiftX = 0, shiftY = 0;
    // A larger neighbor opens space away from its reference position.
    // Nearby planets move more so the original arrangement stays recognizable.
    for (const neighbor of planets) {
      const sizeDifference = neighbor.diameter - planet.diameter;
      if (sizeDifference <= 0) continue;
      const dx = planet.x - neighbor.x, dy = planet.y - neighbor.y;
      const influence = sizeDifference * (1 - Math.hypot(dx, dy) * .8);
      shiftX += Math.tanh(dx * 8) * influence;
      shiftY += Math.tanh(dy * 7) * influence * .45;
    }
    const depth = .55 + (index % 3) * .16;
    const driftX = time ? Math.sin(time * .8 + index * 1.37) * 2.6 : 0;
    const driftY = time ? Math.sin(time * .66 + index * 2.11) * 2 : 0;
    const edge = planet.diameter / 2 + 8;
    const x = planet.x * width + Math.max(-width * .075, Math.min(width * .075, shiftX));
    const y = planet.y * height + Math.max(-height * .045, Math.min(height * .045, shiftY));
    return {
      ...planet,
      x: Math.max(edge, Math.min(width - edge, x + pointerX * spread * depth + driftX)),
      y: Math.max(edge, Math.min(height - edge - 42, y + pointerY * spread * depth + driftY)),
    };
  });
}

export function createBeamPainter(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  return (points, width, height, time, opacity = 1) => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (opacity <= 0) return;
    context.globalCompositeOperation = 'source-over';
    context.lineCap = 'round';
    const bySlot = new Map(points.map(point => [point.slot, point]));
    for (const [from, to, bend] of beams) {
      const start = bySlot.get(from), end = bySlot.get(to);
      if (!start || !end) continue;
      const dx = end.x - start.x, dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);
      if (distance < (start.diameter + end.diameter) * .46) continue;
      const x1 = start.x + dx / distance * start.diameter * .43;
      const y1 = start.y + dy / distance * start.diameter * .43;
      const x2 = end.x - dx / distance * end.diameter * .43;
      const y2 = end.y - dy / distance * end.diameter * .43;
      const cx = (x1 + x2) / 2 - dy * bend;
      const cy = (y1 + y2) / 2 + dx * bend;
      const gradient = context.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, '#ffffff68');
      gradient.addColorStop(.5, '#ffffff');
      gradient.addColorStop(1, '#ffffff68');
      context.strokeStyle = gradient;
      context.beginPath();
      context.moveTo(x1, y1);
      context.quadraticCurveTo(cx, cy, x2, y2);
      for (const [width, strength] of [[4, .035], [1.7, .07], [.75, .34]]) {
        context.lineWidth = width;
        context.globalAlpha = strength * opacity;
        context.stroke();
      }
      for (let i = 0; i < 20; i++) {
        const t = (i / 20 + time * (.085 + Math.abs(bend) * .1)) % 1;
        const u = 1 - t;
        const spread = Math.sin(Math.PI * t) * Math.sin(i * 14.1) * (1.5 + i % 3);
        const x = u*u*x1 + 2*u*t*cx + t*t*x2 - dy / distance * spread;
        const y = u*u*y1 + 2*u*t*cy + t*t*y2 + dx / distance * spread;
        context.fillStyle = '#ffffff';
        context.globalAlpha = (.08 + (i % 5) * .028) * opacity;
        context.beginPath();
        context.arc(x, y, i % 6 === 0 ? .85 : .45, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  };
}

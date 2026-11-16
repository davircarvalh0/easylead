import React, {useEffect, useRef, useState} from 'react';
import './3d-orb.css';
import {GLOBE_GREEN, globeWirePositions} from './globe-geometry.js';

type Atom = {id: string; name: string; count: number; desktopDiameter: number; mobileDiameter: number};
type Props = {atoms: Atom[]; selectedId?: string};

export default function Globe({atoms, selectedId}: Props) {
 const host = useRef<HTMLDivElement>(null);
 const links = useRef<(HTMLAnchorElement | null)[]>([]);
 const currentAtoms = useRef(atoms);
 currentAtoms.current = atoms;
 const topology = atoms.map(atom => atom.id).join("|");
 const paused = useRef(false);
 const selection = useRef(selectedId);
 selection.current = selectedId;
 const [live, setLive] = useState(false);
 const [fallback, setFallback] = useState(false);
 const controls = useRef({turn: 0, tilt: 0, zoom: 1});
 const pointers = useRef(new Map<number, {x:number; y:number}>());
 const gesture = useRef({x:0,y:0,moved:false,pinch:0});
 function reset() { controls.current = {turn:0,tilt:0,zoom:1}; location.hash = '/organizacao'; }
 function down(event: React.PointerEvent) {
  if ((event.target as HTMLElement).closest('.orb-controls')) { gesture.current.moved=false; return; }
  pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
  gesture.current = {x:event.clientX,y:event.clientY,moved:pointers.current.size>1,pinch:0};
 }
 function drag(event: React.PointerEvent) {
  const previous = pointers.current.get(event.pointerId); if (!previous) return;
  pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
  const points = [...pointers.current.values()];
  if (points.length>1) {
   const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
   if(gesture.current.pinch) controls.current.zoom=Math.max(.65,Math.min(1.8,controls.current.zoom*distance/gesture.current.pinch));
   gesture.current.pinch=distance; gesture.current.moved=true;
  } else {
   if(Math.hypot(event.clientX-gesture.current.x,event.clientY-gesture.current.y)>6) gesture.current.moved=true;
   if(gesture.current.moved) { controls.current.turn+=(event.clientX-previous.x)*.008; controls.current.tilt=Math.max(-1,Math.min(1,controls.current.tilt+(event.clientY-previous.y)*.005)); }
  }
  if(gesture.current.moved) event.currentTarget.setPointerCapture(event.pointerId);
 }
 function up(event: React.PointerEvent) { pointers.current.delete(event.pointerId); }

 useEffect(() => {
  const escape = (event: KeyboardEvent) => { if(event.key==='Escape' && selection.current) reset(); };
  document.addEventListener('keydown',escape);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false, stop = () => {};
  async function start() {
   stop(); setLive(false); setFallback(false);
   if (new URLSearchParams(location.search).has('noWebGL')) { setFallback(true); return; }
   let THREE: typeof import('three');
   try { THREE = await import('three'); } catch { if(!disposed) setFallback(true); return; }
   if (disposed || !host.current) return;
   const container = host.current;
   let renderer;
   try { renderer = new THREE.WebGLRenderer({alpha: true, antialias: true}); }
   catch { setFallback(true); return; }
   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
   camera.position.set(0, 0, 19);
   renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
   renderer.domElement.setAttribute('aria-hidden', 'true');
   container.prepend(renderer.domElement);
   scene.add(new THREE.AmbientLight(0xffffff, 2));
   const light = new THREE.PointLight(0xffffff, 80); light.position.set(0, 4, 8); scene.add(light);
   // Globe source layers: radii 5.2 / 5 / 4.9, normalized to radius 1.
   // Allocate once: selection and camera movement never rebuild the topology.
   const wireGeometry = new THREE.BufferGeometry();
   wireGeometry.setAttribute('position', new THREE.BufferAttribute(globeWirePositions(), 3));
   const atmosphereGeometry = new THREE.SphereGeometry(1.04, 32, 32);
   const solidGeometry = new THREE.SphereGeometry(.98, 64, 64);
   const spheres = currentAtoms.current.map(atom => {
    const group = new THREE.Group();
    const wire = new THREE.LineSegments(wireGeometry, new THREE.LineBasicMaterial({color: GLOBE_GREEN, transparent: true, opacity: .5}));
    const atmosphere = new THREE.Mesh(atmosphereGeometry, new THREE.ShaderMaterial({
     vertexShader: `varying vec3 vNormal;
      void main() { vNormal = normalize(normalMatrix * normal);
       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
     fragmentShader: `uniform vec3 glowColor; varying vec3 vNormal;
      void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
       gl_FragColor = vec4(glowColor, 1.0) * intensity; }`,
     uniforms: {glowColor: {value: new THREE.Color(GLOBE_GREEN)}},
     blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
    }));
    // Liquid Glass adaptation of the source's transparent Phong core.
    const solid = new THREE.Mesh(solidGeometry, new THREE.MeshPhysicalMaterial({color: GLOBE_GREEN, transparent: true, opacity: .22, roughness: .12, metalness: .08, clearcoat: 1, clearcoatRoughness: .06, depthWrite: false}));
    group.add(solid, wire, atmosphere); scene.add(group);
    return group;
   });
   // Source star layer, shared by the scene rather than duplicated per globe.
   const starGeometry = new THREE.BufferGeometry();
   const positions = new Float32Array(360 * 3);
   // Deterministic stars inside the camera range, behind the entire orbit.
   for (let i = 0; i < 360; i++) {
    positions[i*3] = (Math.sin(i*127.1+1)*43758.5453 % 1) * 65;
    positions[i*3+1] = (Math.sin(i*311.7+2)*23421.631 % 1) * 45;
    positions[i*3+2] = -18 - (i % 37);
   }
   starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
   const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({color: 0xffffff, size: .055, sizeAttenuation: true, transparent: true, opacity: .45, depthWrite: false}));
   scene.add(stars);
   const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:128}, (_,i) => new THREE.Vector3(Math.cos(i /128*Math.PI*2)*5.7, Math.sin(i/128*Math.PI*2)*3.6, 0))), new THREE.LineBasicMaterial({color:0x166d42}));
   scene.add(ring);
   let width = 1, height = 1, frame = 0, last = 0, phase = 0, rx = 6.8, ry = 4.1, baseZ = 19;
   const target = new THREE.Vector3();
   const resize = new ResizeObserver(() => {
    width = container.clientWidth; height = container.clientHeight;
    camera.aspect = width / height;
    const mobile = width < 600;
    rx = mobile ? 4.1 : 6.8; ry = mobile ? 6.8 : 4.1;
    // Fit the entire orbit plus the largest HTML target, including labels.
    const marginX = Math.max(mobile ? 84 : 110, ...currentAtoms.current.map(a => (mobile ? a.mobileDiameter : a.desktopDiameter)/2 + 12));
    const marginY = marginX + 36;
    const usableX = Math.max(.1, 1 - marginX * 2 / width);
    const usableY = Math.max(.1, 1 - marginY * 2 / height);
    baseZ = Math.max(rx / (usableX * camera.aspect), ry / usableY) / Math.tan(Math.PI/8) + 1.4;
    ring.scale.set(rx/5.7, ry/3.6, 1);
    if (!last) camera.position.set(0,0,baseZ);
    camera.updateProjectionMatrix(); renderer.setSize(width, height);
   });
   resize.observe(container);
   const wheel = (event: WheelEvent) => { event.preventDefault(); controls.current.zoom=Math.max(.65,Math.min(1.8,controls.current.zoom*Math.exp(-event.deltaY*.001))); };
   container.addEventListener('wheel',wheel,{passive:false});
   const diameters = currentAtoms.current.map(() => container.clientWidth < 600 ? 88 : 108);
   function draw(now: number) {
    const dt = Math.min((now-last)/1000 || 0, .15); last = now;
    if (!media.matches && !paused.current && !selection.current && !pointers.current.size) { phase += dt * .12; }
    spheres.forEach((sphere, i) => {
     const a = phase + controls.current.turn + i / Math.max(atoms.length,1)*Math.PI*2;
     sphere.position.set(Math.cos(a)*rx, Math.sin(a)*ry, Math.sin(a)*1.2 + Math.sin(a)*controls.current.tilt*3);
     const atom = currentAtoms.current[i];
     const target = width < 600 ? atom.mobileDiameter : atom.desktopDiameter;
     diameters[i] += (target - diameters[i]) * (1 - Math.exp(-dt * 7));
     const diameter = diameters[i];
     sphere.children[0].rotation.y += media.matches ? 0 : dt * .06;
     sphere.children[1].rotation.y += media.matches ? 0 : dt * .06;
     sphere.children[2].rotation.y += media.matches ? 0 : dt * .03;
     sphere.scale.setScalar(diameter / height * (baseZ - sphere.position.z) * Math.tan(Math.PI/8));
     const point = sphere.position.clone().project(camera);
     const rendered = diameter * (baseZ-sphere.position.z) / Math.max(1,camera.position.z-sphere.position.z);
     const link = links.current[i];
     if (link) { link.style.setProperty('--rendered-diameter', `${rendered}px`); link.style.left = `${(point.x+1)*width/2}px`; link.style.top = `${(1-point.y)*height/2}px`; }
    });
    const index = currentAtoms.current.findIndex(atom=>atom.id===selection.current);
    const focus = index>=0 ? spheres[index].position : new THREE.Vector3();
    const ease = media.matches ? 1 : 1-Math.exp(-dt*5);
    target.lerp(focus,ease);
    const distance = baseZ / (index>=0 ? 1.55 : 1) / controls.current.zoom;
    camera.position.lerp(new THREE.Vector3(target.x,target.y,target.z+distance),ease);
    camera.lookAt(target);
    container.dataset.zoom=controls.current.zoom.toFixed(2);
    stars.rotation.y += media.matches ? 0 : dt * .006;
    renderer.render(scene,camera);
    frame = requestAnimationFrame(draw);
   }
   function visibility() { cancelAnimationFrame(frame); last=0; if (!document.hidden) frame=requestAnimationFrame(draw); }
   const lost = (event: Event) => { event.preventDefault(); stop(); setLive(false); setFallback(true); };
   renderer.domElement.addEventListener('webglcontextlost',lost);
   document.addEventListener('visibilitychange', visibility);
   stop = () => {
    cancelAnimationFrame(frame); container.removeEventListener('wheel',wheel); resize.disconnect(); document.removeEventListener('visibilitychange',visibility);
    renderer.domElement.removeEventListener('webglcontextlost',lost);
    scene.traverse(object => { const mesh = object as import('three').Mesh; mesh.geometry?.dispose(); if (mesh.material) (Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>m.dispose()); });
    renderer.dispose(); renderer.domElement.remove();
   };
   setLive(true); visibility();
  }
  const change = () => { void start(); };
  void start(); media.addEventListener('change',change);
  return () => { disposed=true; document.removeEventListener('keydown',escape); stop(); media.removeEventListener('change',change); };
 }, [topology]);
 function move(event: React.KeyboardEvent) {
  const index = links.current.indexOf(document.activeElement as HTMLAnchorElement);
  if (event.key === ' ' && index >= 0) { event.preventDefault(); links.current[index]?.click(); return; }
  if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); links.current[event.key === 'Home' ? 0 : atoms.length-1]?.focus(); return; }
  const offset = {ArrowRight:1, ArrowLeft:-1, ArrowDown:1, ArrowUp:-1}[event.key];
  if (offset && index >= 0) { event.preventDefault(); links.current[(index+offset+atoms.length)%atoms.length]?.focus(); }
 }
 return <div className={`citi-orb ${live?'is-live':fallback?'is-static':'is-loading'}`} ref={host}
  onPointerDown={down} onPointerMove={drag} onPointerUp={up} onPointerCancel={up}
  onClickCapture={event=>{if(gesture.current.moved) {event.preventDefault();event.stopPropagation();gesture.current.moved=false;}}}
  onClick={event=>{if(event.target===event.currentTarget || (event.target as HTMLElement).classList.contains('orb-links')) reset();}}
  onKeyDown={event=>{if(event.key==='Escape') reset();}}
  onPointerEnter={()=>{paused.current=true;}} onPointerLeave={()=>{paused.current=false; pointers.current.clear();}}
  onFocusCapture={()=>{paused.current=true;}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)) paused.current=false;}}>
  <div className="orb-controls" aria-label="Controles da cena">
   <button type="button" aria-label="Aproximar" onClick={()=>{controls.current.zoom=Math.min(1.8,controls.current.zoom*1.2);}}>+</button>
   <button type="button" aria-label="Afastar" onClick={()=>{controls.current.zoom=Math.max(.65,controls.current.zoom/1.2);}}>&#8722;</button>
   <button type="button" onClick={reset}>Voltar &#224; vis&#227;o completa</button>
  </div>
  {!live && !fallback && <p role="status" className="orb-loading">Preparando globos 3D...</p>}

  <nav className="orb-links" aria-label="Sub&#225;reas da organiza&#231;&#227;o" onKeyDown={move}>
   {atoms.map((atom,i)=><a ref={el=>{links.current[i]=el;}} key={atom.id} className="atom-node" href={'#/organizacao/'+atom.id} aria-current={selectedId===atom.id?'page':undefined} style={{'--orb-color':GLOBE_GREEN,'--atom-desktop':atom.desktopDiameter+'px','--atom-mobile':atom.mobileDiameter+'px'} as React.CSSProperties}>
    <span className="atom-sphere" aria-hidden="true"/><strong>{atom.name}</strong><span className="atom-count-badge">{atom.count} {atom.count===1?'integrante':'integrantes'}</span>
   </a>)}
  </nav>
 </div>;
}

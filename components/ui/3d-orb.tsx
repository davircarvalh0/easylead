import React, {useEffect, useRef, useState} from 'react';
import { cubicBezier, useReducedMotion, useSpring } from 'motion/react';
import { createParticleGeometry, createParticleMaterial, paintParticleGlobe } from './orb-particles.js';
import './3d-orb.css';
import {orbitStyles, defaultOrbit, constellationFrame, createBeamPainter} from './solar-orbits.js';
import {globeWirePositions} from './globe-geometry.js';

type Atom = {id: string; name: string; count: number; desktopDiameter: number; mobileDiameter: number};
type Props = {atoms: Atom[]; selectedId?: string; showDetails?: boolean; onArrival: (id: string) => void};
const enterEase = cubicBezier(.58, .02, .18, 1);
const returnEase = cubicBezier(.22, .72, .24, 1);

function FlatPlanet({color}: {color: string}) {
 const image = useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(image.current) paintParticleGlobe(image.current,color);},[color]);
 return <canvas ref={image} width={384} height={384}/>;
}

export default function Globe({atoms, selectedId, onArrival, showDetails}: Props) {
 const beams = useRef<HTMLCanvasElement>(null);
 const host = useRef<HTMLDivElement>(null);
 const arrived = useRef(onArrival);
 arrived.current = onArrival;
 const reduced = useReducedMotion();
 const links = useRef<(HTMLAnchorElement | null)[]>([]);
 const currentAtoms = useRef(atoms);
 currentAtoms.current = atoms;
 const topology = atoms.map(atom => atom.id).join("|");
 const paused = useRef(false);
 const pointing = useRef<string>();
 const pulse = useRef<{id:string; x:number; y:number; time:number; sign:number}>();
 const pointerX = useSpring(0,{stiffness:185,damping:24});
 const pointerY = useSpring(0,{stiffness:185,damping:24});
 const mapX = useSpring(0,{stiffness:95,damping:25});
 const mapY = useSpring(0,{stiffness:95,damping:25});
 function positionLink(index: number, point: {x:number; y:number; diameter:number}) {
  const link=links.current[index];
  if(!link) return;
  link.style.setProperty('--rendered-diameter',point.diameter+'px');
  link.style.left=point.x+'px';
  link.style.top=point.y+'px';
 }
 const pointerStrength = useSpring(0,{stiffness:135,damping:21});
 function localPoint(event: React.MouseEvent<HTMLAnchorElement>) {
  const sphere=event.currentTarget.querySelector('.atom-sphere')?.getBoundingClientRect();
  if(!sphere || !sphere.width) return {x:0,y:0};
  const x = Math.max(-1,Math.min(1,((event.clientX-sphere.left)/sphere.width)*2-1));
  const y = Math.max(-1,Math.min(1,1-((event.clientY-sphere.top)/sphere.height)*2));
  return {x,y};
 }
 function follow(event: React.PointerEvent<HTMLAnchorElement>, id: string) {
  if(event.pointerType==='touch' || reduced) return;
  const {x,y}=localPoint(event);
  const anchor=event.currentTarget;
  if(pointing.current!==id) { pointerX.jump(x); pointerY.jump(y); pointing.current=id; }
  else { pointerX.set(x); pointerY.set(y); }
  pointerStrength.set(1);
  anchor.style.setProperty('--hot-x',(x+1)*50+'%');
  anchor.style.setProperty('--hot-y',(1-y)*50+'%');
  host.current?.setAttribute('data-gesture','hover');
 }
 function leave() {
  pointerStrength.set(0);
  if(host.current?.dataset.gesture==='hover') host.current.removeAttribute('data-gesture');
 }
 function push(event: React.MouseEvent<HTMLAnchorElement>, id: string, sign: number) {
  if(reduced) return;
  const {x,y}=localPoint(event);
  pulse.current={id,x,y,time:performance.now(),sign};
  host.current?.setAttribute('data-gesture',sign>0?'outward':'inward');
  if(fallback) event.currentTarget.querySelector('.atom-sphere')?.animate(
   [{scale:'1'},{scale:sign>0?'1.19':'.88'},{scale:'1'}],
   {duration:sign>0?680:500,easing:'cubic-bezier(.22,.74,.18,1)'}
  );
 }
 const selection = useRef(selectedId);
 selection.current = selectedId;
 const [live, setLive] = useState(false);
 const [fallback, setFallback] = useState(false);
 useEffect(()=>{
  if(!fallback || !selectedId) return;
  if(reduced) {arrived.current(selectedId);return;}
  const timer=window.setTimeout(()=>arrived.current(selectedId),920);
  return ()=>window.clearTimeout(timer);
 },[fallback,reduced,selectedId]);
 const controls = useRef({zoom: 1});
 const pointers = useRef(new Map<number, {x:number; y:number}>());
 const gesture = useRef({x:0,y:0,moved:false,pinch:0});
 function zoomBy(multiplier: number) {
  controls.current.zoom = Math.max(.65, Math.min(1.8, controls.current.zoom * multiplier));
  host.current?.style.setProperty('--orbit-zoom', String(controls.current.zoom));
 }
 function reset() { zoomBy(1/controls.current.zoom); location.hash = '/organizacao'; }
 function down(event: React.PointerEvent) {
  if(event.button!==0) return;
  pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
  gesture.current = {x:event.clientX,y:event.clientY,moved:pointers.current.size>1,pinch:0};
 }
 function drag(event: React.PointerEvent) {
  if (!reduced && event.pointerType !== 'touch') {
   const box = event.currentTarget.getBoundingClientRect();
   mapX.set(Math.max(-1,Math.min(1,(event.clientX - box.left) / box.width * 2 - 1)));
   mapY.set(Math.max(-1,Math.min(1,(event.clientY - box.top) / box.height * 2 - 1)));
  }
  if (!pointers.current.has(event.pointerId)) return;
  pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
  const points = [...pointers.current.values()];
  if (points.length>1) {
   const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
   if(gesture.current.pinch) zoomBy(distance/gesture.current.pinch);
   gesture.current.pinch=distance; gesture.current.moved=true;
  } else {
   if(Math.hypot(event.clientX-gesture.current.x,event.clientY-gesture.current.y)>6) gesture.current.moved=true;
  }
  if(gesture.current.moved && event.isTrusted) event.currentTarget.setPointerCapture(event.pointerId);
 }
 function up(event: React.PointerEvent) { pointers.current.delete(event.pointerId); }

 useEffect(() => {
  if (!fallback || !host.current || !beams.current) return;
  const container = host.current;
  const paint = createBeamPainter(beams.current);
  let frame = 0, elapsed = 0, last = 0;
  function draw(now: number) {
   const width = container.clientWidth, height = container.clientHeight;
   if (!reduced && !paused.current && !selection.current && last) elapsed += Math.min(.05,(now-last)/1000);
   last = now;
   const points = constellationFrame(currentAtoms.current,width,height,elapsed,
    !reduced && !selection.current ? mapX.get() : 0,
    !reduced && !selection.current ? mapY.get() : 0);
   if (!selection.current || !container.style.getPropertyValue('--entry-x')) {
    points.forEach((point,index) => positionLink(index,point));
   }
   const selected = currentAtoms.current.findIndex(atom => atom.id === selection.current);
   if (selected >= 0 && !container.style.getPropertyValue('--entry-x')) {
    const link = links.current[selected];
    container.style.setProperty('--entry-x',link?.style.left || '50%');
    container.style.setProperty('--entry-y',link?.style.top || '50%');
   }
   if (selected < 0) container.style.removeProperty('--entry-x');
   paint(points,width,height,elapsed,selected < 0 ? 1 : 0);
   frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => {
   cancelAnimationFrame(frame);
   container.style.removeProperty('--entry-x');
   container.style.removeProperty('--entry-y');
  };
 },[fallback,reduced]);

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
   const paint = createBeamPainter(beams.current!);
   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
   camera.position.set(0, 0, 19);
   renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
   renderer.domElement.setAttribute('aria-hidden', 'true');
   renderer.domElement.dataset.orbRenderer = '';
   container.prepend(renderer.domElement);
   scene.add(new THREE.AmbientLight(0xffffff, 2));
   const light = new THREE.PointLight(0xffffff, 80); light.position.set(0, 4, 8); scene.add(light);
   // Globe source layers: radii 5.2 / 5 / 4.9, normalized to radius 1.
   // Allocate once: selection and camera movement never rebuild the topology.
   const wireGeometry = new THREE.BufferGeometry();
   wireGeometry.setAttribute('position', new THREE.BufferAttribute(globeWirePositions(), 3));
   const particleGeometry = createParticleGeometry(THREE);
   const spheres = currentAtoms.current.map(atom => {
    const orbit = orbitStyles[atom.id] || defaultOrbit;
    const color=orbit.color;
    const group = new THREE.Group();
    const wire = new THREE.LineSegments(wireGeometry, new THREE.LineBasicMaterial({color, transparent:true, opacity:.035, depthWrite:false}));
    const cloud = new THREE.Points(particleGeometry, createParticleMaterial(THREE,color,renderer.getPixelRatio()));
    group.add(cloud,wire);
    scene.add(group);
    return {group, cloud, wire};

   });
   // Source star layer, shared by the scene rather than duplicated per globe.
   const starGeometry = new THREE.BufferGeometry();
   const positions = new Float32Array(360 * 3);
   // Deterministic stars inside the camera range, behind the planets.
   for (let i = 0; i < 360; i++) {
    positions[i*3] = (Math.sin(i*127.1+1)*43758.5453 % 1) * 65;
    positions[i*3+1] = (Math.sin(i*311.7+2)*23421.631 % 1) * 45;
    positions[i*3+2] = -18 - (i % 37);
   }
   starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
   const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({color: 0xffffff, size: .055, sizeAttenuation: true, transparent: true, opacity: .45, depthWrite: false}));
   scene.add(stars);
   let width = 1, height = 1, frame = 0, last = 0, phase = 0;
   let driftX = 0, driftY = 0;
   const baseZ = 19;
   const halfFov = Math.tan(Math.PI/8);
   const target = new THREE.Vector3();
   const projected = new THREE.Vector3();
   const destination = new THREE.Vector3();
   const center = new THREE.Vector3();
   const eyeFrom = new THREE.Vector3();
   const targetFrom = new THREE.Vector3();
   let flightKey: string | undefined;
   let flightTime = 0;
   let flightDuration = 0;
   let notified = false;
   const resize = new ResizeObserver(() => {
    width = container.clientWidth; height = container.clientHeight;
    camera.aspect = width / height;
    if (!last) camera.position.set(0,0,baseZ);
    camera.updateProjectionMatrix(); renderer.setSize(width, height);
   });
   resize.observe(container);
   const wheel = (event: WheelEvent) => { event.preventDefault(); zoomBy(Math.exp(-event.deltaY*.001)); };
   container.addEventListener('wheel',wheel,{passive:false});
   function draw(now: number) {
    const dt = last ? Math.min((now-last)/1000, .15) : 0;
    last = now;
    if (!media.matches && !paused.current && !selection.current) phase += dt;
    if (!selection.current && !paused.current) {
     driftX = media.matches ? 0 : mapX.get();
     driftY = media.matches ? 0 : mapY.get();
    }
    const positions = constellationFrame(currentAtoms.current,width,height,phase,driftX,driftY);
    const worldPerPixel = 2 * baseZ * halfFov / height;
    spheres.forEach(({group,wire,cloud}, i) => {
     const point = positions[i];
     group.position.set((point.x-width/2)*worldPerPixel,(height/2-point.y)*worldPerPixel,0);
     group.scale.setScalar(point.diameter*worldPerPixel/2);
     wire.rotation.y += media.matches ? 0 : dt*.12;
     cloud.rotation.y = wire.rotation.y;
    });
    const index = currentAtoms.current.findIndex(atom=>atom.id===selection.current);
    const planet = spheres[index]?.group;
    const key = planet ? selection.current : undefined;
    const focus = planet && !media.matches ? planet.position : center;
    if(key !== flightKey) {
     flightKey = key;
     flightTime = 0;
     flightDuration = media.matches ? 0 : key ? 1180 : 640;
     notified = false;
     eyeFrom.copy(camera.position);
     targetFrom.copy(target);
     container.dataset.flight = key ? 'approaching' : 'returning';
    }
    flightTime += dt*1000;
    const progress = flightDuration ? Math.min(1,flightTime/flightDuration) : 1;
    const ease = (key ? enterEase : returnEase)(progress);
    target.lerpVectors(targetFrom,focus,ease);
    const distance = planet && !media.matches ? Math.max(.18, planet.scale.x*.48)/Math.sqrt(controls.current.zoom) : baseZ/controls.current.zoom;
    destination.set(focus.x,focus.y,focus.z+distance);
    if(progress<1 || planet) camera.position.lerpVectors(eyeFrom,destination,ease);
    else camera.position.lerp(destination,media.matches ? 1 : 1-Math.exp(-dt*8));
    camera.lookAt(target);
    camera.updateMatrixWorld();
    spheres.forEach(({group},i)=>{
     const point=projected.copy(group.position).project(camera);
     positions[i].diameter*=baseZ/Math.max(1,camera.position.z);
     positions[i].x=(point.x+1)*width/2;
     positions[i].y=(1-point.y)*height/2;
     positionLink(i,positions[i]);
    });
    paint(positions,width,height,phase,key ? Math.max(0,1-progress*3) : progress);
    container.dataset.zoom=controls.current.zoom.toFixed(2);
    stars.rotation.y += media.matches ? 0 : dt * .006;
    const immersion = planet && !media.matches ? Math.max(0,(ease - .75) * 4) : 0;
    const ripple = pulse.current;
    const age = ripple ? (now-ripple.time)/1000 : 2;
    if(age>1.25 && ripple) {
     pulse.current=undefined;
     if(container.dataset.gesture!=='hover') container.removeAttribute('data-gesture');
    }
    spheres.forEach(({cloud,wire},i)=>{
     const id=currentAtoms.current[i].id;
     const uniforms=cloud.material.uniforms;
     uniforms.immersion.value = i===index ? immersion : 0;
     uniforms.response.value = id===pointing.current && !media.matches ? pointerStrength.get()*(1-immersion) : 0;
     uniforms.pointer.value.set(pointerX.get(),pointerY.get());
     uniforms.pulseAge.value = id===ripple?.id && !media.matches ? age : 2;
     uniforms.pulseSign.value = ripple?.sign || 1;
     uniforms.pulseOrigin.value.set(ripple?.x||0,ripple?.y||0);
     wire.material.opacity = .035 * (1 - immersion);
    });
    renderer.render(scene,camera);
    if (!notified && progress>=1) {
     notified = true;
     container.dataset.flight = key ? 'inside' : 'overview';
     if(key) arrived.current(key);
    }
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
  if(event.key==='+' || event.key==='-' || event.key==='=') { event.preventDefault(); zoomBy(event.key==='-' ? 1/1.2 : 1.2); return; }
  if (event.key === ' ' && index >= 0) { event.preventDefault(); links.current[index]?.click(); return; }
  if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); links.current[event.key === 'Home' ? 0 : atoms.length-1]?.focus(); return; }
  const offset = {ArrowRight:1, ArrowLeft:-1, ArrowDown:1, ArrowUp:-1}[event.key];
  if (offset && index >= 0) { event.preventDefault(); links.current[(index+offset+atoms.length)%atoms.length]?.focus(); }
 }
 return <div className={`citi-orb ${live?'is-live':fallback?'is-static':'is-loading'}`} ref={host} data-flat-flight={fallback&&selectedId?'true':undefined}
  onPointerDown={down} onPointerMove={drag} onPointerUp={up} onPointerCancel={up}
  onClickCapture={event=>{
   if(gesture.current.moved && event.detail>0) {event.preventDefault();event.stopPropagation();}
   gesture.current.moved=false;
  }}
  onClick={event=>{if(event.target===event.currentTarget || (event.target as HTMLElement).classList.contains('orb-links')) reset();}}
  onKeyDown={event=>{if(event.key==='Escape') reset();}}
  onPointerLeave={()=>{leave();mapX.set(0);mapY.set(0);pointers.current.clear();}}
  onFocusCapture={event=>{paused.current=event.target.matches(':focus-visible');}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)) paused.current=false;}}>
  {!live && !fallback && <p role="status" className="orb-loading">Preparando globos 3D...</p>}

  <canvas ref={beams} className="constellation-beams" aria-hidden="true"/>
  <nav className="orb-links" inert={showDetails || undefined} aria-label="Sub&#225;reas da organiza&#231;&#227;o" onKeyDown={move}>
   {atoms.map((atom,i)=>{
    const orbit=orbitStyles[atom.id]||defaultOrbit;
    return <a ref={el=>{links.current[i]=el;}} key={atom.id} className="atom-node" onPointerEnter={event=>follow(event,atom.id)} onPointerMove={event=>follow(event,atom.id)}
     onPointerLeave={leave} onClick={event=>push(event,atom.id,-1)}
     onContextMenu={event=>{if(event.button===2){event.preventDefault();push(event,atom.id,1);}}} href={'#/organizacao/'+atom.id} aria-current={selectedId===atom.id?'page':undefined} style={{'--orb-color':orbit.color,'--fallback-x':orbit.desktop[0]*100+'%','--fallback-y':orbit.desktop[1]*100+'%','--atom-desktop':atom.desktopDiameter+'px','--atom-mobile':atom.mobileDiameter+'px'} as React.CSSProperties}>
    <span className="atom-sphere" aria-hidden="true">{!live&&<FlatPlanet color={orbit.color}/>}</span><strong>{atom.name}</strong><span className="atom-count-badge">{atom.count} {atom.count===1?'integrante':'integrantes'}</span>
   </a>;})}
  </nav>
 </div>;
}

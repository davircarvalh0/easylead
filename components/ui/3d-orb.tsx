import React, {useEffect, useRef, useState} from 'react';
import './3d-orb.css';

type Atom = {id: string; name: string; count: number; desktopDiameter: number; mobileDiameter: number};
type Props = {atoms: Atom[]; selectedId?: string};

// Adapted from the supplied Globe: local wireframe, atmosphere and a container-sized scene.
export default function Globe({atoms, selectedId}: Props) {
 const host = useRef<HTMLDivElement>(null);
 const links = useRef<(HTMLAnchorElement | null)[]>([]);
 const paused = useRef(false);
 const selection = useRef(selectedId);
 selection.current = selectedId;
 const [live, setLive] = useState(false);
 useEffect(() => {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false, stop = () => {};
  async function start() {
   stop(); setLive(false);
   if (media.matches || new URLSearchParams(location.search).has('noWebGL')) return;
   let THREE: typeof import('three');
   try { THREE = await import('three'); } catch { return; }
   if (disposed || media.matches || !host.current) return;
   const container = host.current;
   let renderer;
   try { renderer = new THREE.WebGLRenderer({alpha: true, antialias: true}); }
   catch { return; }
   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
   camera.position.set(0, 0, 19);
   renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
   renderer.domElement.setAttribute('aria-hidden', 'true');
   container.prepend(renderer.domElement);
   const core = new THREE.Mesh(new THREE.SphereGeometry(1.35, 32, 24), new THREE.MeshBasicMaterial({color: 0x00e676, wireframe: true, transparent: true, opacity: .5}));
   scene.add(core);
   const glow = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 24), new THREE.MeshBasicMaterial({color: 0x00e676, transparent: true, opacity: .08, side: THREE.BackSide, blending: THREE.AdditiveBlending}));
   scene.add(glow);
   scene.add(new THREE.AmbientLight(0x99ffbb, 2));
   const light = new THREE.PointLight(0x00ff88, 50); light.position.set(0, 4, 8); scene.add(light);
   const spheres = atoms.map(atom => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(.28 + Math.sqrt(atom.count) * .14, 24, 16), new THREE.MeshPhongMaterial({color: 0x008844, shininess: 80}));
    scene.add(mesh); return mesh;
   });
   const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:128}, (_,i) => new THREE.Vector3(Math.cos(i /128*Math.PI*2)*5.7, Math.sin(i/128*Math.PI*2)*3.6, 0))), new THREE.LineBasicMaterial({color:0x166d42}));
   scene.add(ring);
   let width = 1, height = 1, frame = 0, last = 0, phase = 0;
   const resize = new ResizeObserver(() => {
    width = container.clientWidth; height = container.clientHeight;
    camera.aspect = width / height; camera.position.z = width < 600 ? 29 : 19;
    ring.scale.set(width < 600 ? 3.7/5.7 : 1, width < 600 ? 8.5/3.6 : 1, 1);
    camera.updateProjectionMatrix(); renderer.setSize(width, height);
   });
   resize.observe(container);
   function draw(now: number) {
    const dt = Math.min((now-last)/1000 || 0, .05); last = now;
    if (!paused.current && !selection.current) { phase += dt * .12; core.rotation.y += dt*.08; }
    spheres.forEach((sphere, i) => {
     const a = phase + i / Math.max(atoms.length,1)*Math.PI*2;
     sphere.position.set(Math.cos(a)*(width<600?3.7:5.7), Math.sin(a)*(width<600?8.5:3.6), Math.sin(a)*1.2);
     const point = sphere.position.clone().project(camera);
     const link = links.current[i];
     if (link) { link.style.left = `${(point.x+1)*width/2}px`; link.style.top = `${(1-point.y)*height/2}px`; }
    });
    renderer.render(scene,camera);
    frame = requestAnimationFrame(draw);
   }
   function visibility() { cancelAnimationFrame(frame); last=0; if (!document.hidden) frame=requestAnimationFrame(draw); }
   const lost = (event: Event) => { event.preventDefault(); stop(); setLive(false); };
   renderer.domElement.addEventListener('webglcontextlost',lost);
   document.addEventListener('visibilitychange', visibility);
   stop = () => {
    cancelAnimationFrame(frame); resize.disconnect(); document.removeEventListener('visibilitychange',visibility);
    renderer.domElement.removeEventListener('webglcontextlost',lost);
    scene.traverse(object => { const mesh = object as import('three').Mesh; mesh.geometry?.dispose(); if (mesh.material) (Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>m.dispose()); });
    renderer.dispose(); renderer.domElement.remove();
   };
   setLive(true); visibility();
  }
  const change = () => { void start(); };
  void start(); media.addEventListener('change',change);
  return () => { disposed=true; stop(); media.removeEventListener('change',change); };
 }, [atoms]);
 function move(event: React.KeyboardEvent) {
  const index = links.current.indexOf(document.activeElement as HTMLAnchorElement);
  if (event.key === ' ' && index >= 0) { event.preventDefault(); links.current[index]?.click(); return; }
  if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); links.current[event.key === 'Home' ? 0 : atoms.length-1]?.focus(); return; }
  const offset = {ArrowRight:1, ArrowLeft:-1, ArrowDown:1, ArrowUp:-1}[event.key];
  if (offset && index >= 0) { event.preventDefault(); links.current[(index+offset+atoms.length)%atoms.length]?.focus(); }
 }
 return <div className={`citi-orb ${live?'is-live':'is-static'}`} ref={host} onPointerEnter={()=>{paused.current=true;}} onPointerLeave={()=>{paused.current=false;}} onFocusCapture={()=>{paused.current=true;}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget)) paused.current=false;}} onPointerDownCapture={()=>{paused.current=true;}}>
  <div className="orb-core" aria-hidden="true">CITi</div>
  <nav className="orb-links" aria-label="Subáreas da organização" onKeyDown={move}>
   {atoms.map((atom,i)=><a ref={el=>{links.current[i]=el;}} key={atom.id} className="atom-node" href={'#/organizacao/'+atom.id} aria-current={selectedId===atom.id?'page':undefined} style={{'--atom-desktop':atom.desktopDiameter+'px','--atom-mobile':atom.mobileDiameter+'px'} as React.CSSProperties}>
    <span className="atom-sphere" aria-hidden="true"/><strong>{atom.name}</strong><span className="atom-count-badge">{atom.count} {atom.count===1?'integrante':'integrantes'}</span>
   </a>)}
  </nav>
 </div>;
}

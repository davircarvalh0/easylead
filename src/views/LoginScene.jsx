import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';

// Loaded separately from the form; all GPU resources belong to this effect.
export default function LoginScene({onFailure}) {
 const host=useRef(null);
 useEffect(()=>{
  let renderer,raf=0,scene,camera; const resources=[];
  const fail=()=>onFailure();
  const lost=e=>{e.preventDefault();fail();};
  try {
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});
   renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
   host.current.append(renderer.domElement);
   renderer.domElement.addEventListener('webglcontextlost',lost);
   scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(65,1,.1,80); camera.position.z=9;
   const material=new THREE.MeshBasicMaterial({color:0x00e676,wireframe:true,transparent:true,opacity:.65});resources.push(material);
   for(let i=0;i<5;i++) {
    const geometry=new THREE.TorusGeometry(2.4,.035,6,48);resources.push(geometry);
    const portal=new THREE.Mesh(geometry,material);portal.position.set((i%2?1:-1)*.5,0,-i*4);scene.add(portal);
    const boxGeometry=new THREE.BoxGeometry(.65,1,.3);resources.push(boxGeometry);
    const block=new THREE.Mesh(boxGeometry,material);block.position.set(i%2?2:-2,-.5,-i*4);scene.add(block);
   }
   const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();
   let elapsed=0,last=performance.now();
   const loop=now=>{elapsed+=Math.min(now-last,50);last=now;const p=Math.min(elapsed/1600,1);camera.position.z=9-22*(p*p*(3-2*p));camera.position.x=Math.sin(p*Math.PI)*.6;scene.children.forEach((mesh,i)=>{mesh.rotation.z=p*(i%2?.7:-.4);mesh.rotation.y=Math.sin(p*Math.PI)*.2;});renderer.render(scene,camera);raf=requestAnimationFrame(loop);};
   const visibility=()=>{cancelAnimationFrame(raf);if(!document.hidden){last=performance.now();raf=requestAnimationFrame(loop);}};
   addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);visibility();
   return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);resources.forEach(r=>r.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  } catch {resources.forEach(r=>r.dispose());renderer?.dispose();renderer?.domElement.remove();fail();}
 },[onFailure]);
 return <div className="login-scene" ref={host} aria-hidden="true"/>;
}

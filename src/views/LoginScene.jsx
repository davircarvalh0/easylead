import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { cubicBezier } from 'motion/react';
import { createBrandObject } from './brand-object.js';

const ease = cubicBezier(.24,.7,.21,1);
const duration = 1600;
const width = 220;
const height = 110;

export async function prepareLoginScene(signal) {
 const {group:brand, resources} = await createBrandObject(THREE);
 let renderer;
 let contextLost = false;
 const lose = event => { event.preventDefault(); contextLost = true; };
 const dispose = () => {
  resources.forEach(resource => resource.dispose());
  if (renderer) {
   renderer.domElement.removeEventListener('webglcontextlost',lose);
   renderer.dispose();
   renderer.forceContextLoss();
   renderer.domElement.remove();
  }
 };
 try {
  signal.throwIfAborted();
  renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.domElement.addEventListener('webglcontextlost',lose);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(width,height,false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width/height, .1, 30);
  camera.position.z = 7;
  const keyLight = new THREE.DirectionalLight('#fff8ee', 2);
  const edgeLight = new THREE.DirectionalLight('#a8decf', 1.75);
  edgeLight.position.set(-4, 1, -2);
  scene.add(brand, new THREE.AmbientLight('#d9f4e9', 1.5), keyLight, edgeLight);
  const fittedScale = 154 / height * 2 * Math.tan(Math.PI/9) * camera.position.z / 4.25;

  function render(progress) {
   const settle = ease(progress);
   const arc = Math.sin(Math.PI * progress);
   brand.scale.setScalar(fittedScale * (.92 + arc * .13));
   brand.position.set(0,0,-.18 + arc * .18);
   brand.rotation.set(-.16 + arc*.24, -.66*(1-settle) + arc*.27, -.075*(1-settle));
   keyLight.position.set(-4 + settle*9,2.6,4);
   renderer.render(scene,camera);
  }

  await renderer.compileAsync(scene,camera);
  signal.throwIfAborted();
  render(0);
  return { Scene: LoginScene, canvas:renderer.domElement, render, dispose, get lost() { return contextLost; } };
 } catch (error) {
  dispose();
  throw error;
 }
}

function LoginScene({ prepared, onFailure }) {
 const host = useRef(null);

 useLayoutEffect(() => {
  if (prepared.lost) { onFailure(); return; }
  let frame = 0, elapsed = 0, last = performance.now();
  const {canvas, render} = prepared;
  const lost = () => onFailure();
  canvas.addEventListener('webglcontextlost',lost);
  host.current.append(canvas);
  render(0);
  function draw(now) {
   elapsed += now - last;
   last = now;
   render(Math.min(1,elapsed/duration));
   if (elapsed < duration) frame = requestAnimationFrame(draw);
  }
  function visibility() {
   cancelAnimationFrame(frame);
   if (!document.hidden) {
    last = performance.now();
    frame = requestAnimationFrame(draw);
   }
  }
  document.addEventListener('visibilitychange',visibility);
  visibility();
  return () => {
   cancelAnimationFrame(frame);
   document.removeEventListener('visibilitychange',visibility);
   canvas.removeEventListener('webglcontextlost',lost);
   canvas.remove();
  };
 },[prepared,onFailure]);

 return <div className="login-scene" ref={host} aria-hidden="true"/>;
}

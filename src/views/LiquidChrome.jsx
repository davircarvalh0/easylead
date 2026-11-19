import React, {useEffect,useRef} from 'react';

// Liquid Chrome by React Bits uses warped surface normals to reflect soft studio lights.
// This single-pass version renders the same type of reflective folds for the login panel.
const vertex=`
attribute vec2 aPosition;
void main() { gl_Position=vec4(aPosition,0.0,1.0); }
`;
const fragment=`
precision highp float;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uTime;

float surface(vec2 p) {
  p.x+=.32*sin(p.y*2.8+uTime*.39);
  p.y+=.24*cos(p.x*3.3-uTime*.34);
  float folds=sin(3.9*p.x+2.2*p.y+1.1*sin(p.y*2.4-p.x)+uTime*.55);
  float ripple=length(p-uPointer);
  return .21*folds+.065*sin(4.5*p.y-2.0*p.x)
    +.018*sin(21.0*ripple-uTime*2.2)*exp(-ripple*2.3);
}

float gaussian(float x) { return exp(-x*x); }

void main() {
  vec2 p=(2.0*gl_FragCoord.xy-uSize)/min(uSize.x,uSize.y);
  float height=surface(p);
  vec2 slope=vec2(surface(p+vec2(.006,0.0))-height,surface(p+vec2(0.0,.006))-height)/.006;
  vec3 normal=normalize(vec3(-slope,1.0));
  vec3 reflected=reflect(normalize(vec3(p*.17,-1.0)),normal);
  float key=gaussian((reflected.x+.26+.14*reflected.y)/.24)
    *smoothstep(-.78,.7,reflected.y);
  float rim=gaussian((reflected.x-.56+.19*reflected.y)/.095)*.43;
  float soft=gaussian((reflected.y+.53)/.27)*.18;
  float shade=.025+.55*key+rim+soft;
  shade*=max(.48,1.03-.16*dot(p,p));
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  gl_FragColor=vec4(vec3(shade+(grain-.5)*.018)*vec3(.97,.99,1.0),1.0);
}
`;

function createProgram(gl) {
  const program=gl.createProgram();
  for (const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      gl.deleteProgram(program);
      return null;
    }
    gl.attachShader(program,shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (gl.getProgramParameter(program,gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

export function LiquidChrome() {
  const canvas=useRef(null);
  useEffect(()=>{
    if (new URLSearchParams(location.search).has('noWebGL')) return;
    const element=canvas.current;
    const panel=element.parentElement;
    const gl=element.getContext('webgl',{alpha:false,antialias:false});
    if (!gl) return;
    const program=createProgram(gl);
    if (!program) return;
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    gl.useProgram(program);
    const position=gl.getAttribLocation(program,'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const resolution=gl.getUniformLocation(program,'uSize');
    const pointer=gl.getUniformLocation(program,'uPointer');
    const clock=gl.getUniformLocation(program,'uTime');

    panel.dataset.renderer='webgl';
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0, last=0, time=0, lost=false;
    let targetX=2,targetY=2,x=2,y=2;
    function draw() {
      gl.uniform2f(pointer,x,y);
      gl.uniform1f(clock,time);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    function resize() {
      if (lost) return;
      const density=Math.min(window.devicePixelRatio,1.25);
      element.width=Math.max(1,Math.round(panel.clientWidth*density));
      element.height=Math.max(1,Math.round(panel.clientHeight*density));
      gl.viewport(0,0,element.width,element.height);
      gl.uniform2f(resolution,element.width,element.height);
      draw();
    }
    function tick(now) {
      if (!last || now-last>=30) {
        if (last) time+=Math.min((now-last)/1000,.05);
        last=now;
        x+=(targetX-x)*.16;
        y+=(targetY-y)*.16;
        draw();
      }
      frame=requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);
      last=0;
      if (!lost && !media.matches && !document.hidden) frame=requestAnimationFrame(tick);
    }
    function move(event) {
      if (event.pointerType==='touch') return;
      const box=panel.getBoundingClientRect();
      const unit=Math.min(box.width,box.height);
      targetX=(2*(event.clientX-box.left)-box.width)/unit;
      targetY=(box.height-2*(event.clientY-box.top))/unit;
    }
    function leave() { targetX=2;targetY=2; }
    function fallback() {
      lost=true;
      delete panel.dataset.renderer;
      update();
    }

    const observer=new ResizeObserver(resize);
    observer.observe(panel);
    media.addEventListener('change',update);
    document.addEventListener('visibilitychange',update);
    panel.addEventListener('pointermove',move);
    panel.addEventListener('pointerleave',leave);
    element.addEventListener('webglcontextlost',fallback);
    resize();
    update();
    return ()=>{
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener('change',update);
      document.removeEventListener('visibilitychange',update);
      panel.removeEventListener('pointermove',move);
      panel.removeEventListener('pointerleave',leave);
      element.removeEventListener('webglcontextlost',fallback);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  },[]);
  return <div className="login-art" aria-hidden="true"><canvas ref={canvas}/></div>;
}

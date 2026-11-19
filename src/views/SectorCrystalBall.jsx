import React, {useEffect,useRef,useState} from 'react';
import CrystalizedBall from './CrystalizedBall.jsx';

const size=240;
const center=size/2;
const radius=111;
const turn=Math.PI*2;

// Approximate the plasma preset when its WebGL renderer is unavailable.
const dust=Array.from({length:640},(_,index)=>{
  const spread=.5+.5*Math.sin(index*19.53);
  return {
    angle:index<48 ? index*2.399963 : .05+Math.PI*(.5+.5*Math.sin(index*5.13)),
    radius:(index<48 ? Math.sqrt(index/48) : .47+.49*Math.sqrt(spread))*radius,
    depth:spread,
    flicker:index*5.31,
  };
});

function paintDust(context,color,time,phase,pointerX,pointerY,charge) {
  context.fillStyle=color;
  const flow=.16*Math.sin(time*.6+phase);
  for(const particle of dust) {
    const {radius:distance,depth,flicker}=particle;
    let angle=particle.angle+flow*(.8+depth*.4);
    const spread=distance+3*Math.sin(flicker+time*1.1);
    const x=spread*Math.cos(angle);
    const y=spread*Math.sin(angle);
    const gap=Math.hypot(x-pointerX,y-pointerY)/radius;
    angle+=charge*.95*Math.exp(-gap*gap*4);
    const highlight=.5+.5*Math.sin(flicker+time*(2+depth*2));
    const width=.48+depth*.65+highlight*.35;
    context.globalAlpha=(.14+highlight*.5)*(.45+.55*depth)*.65;
    context.fillRect(center+spread*Math.cos(angle),center+spread*Math.sin(angle),width,width);
  }
}

function paintRim(context,color,time,phase,heatAngle,charge) {
  const arcLength=turn/11;
  for(let index=0;index<11;index++) {
    const from=index*arcLength+time*.18+phase;
    const glimmer=.5+.5*Math.sin(index*3.71+time*4.3);
    const heat=Math.max(0,Math.cos(from+arcLength/2-heatAngle))**8*charge;
    context.beginPath();
    for(let step=0;step<=13;step++) {
      const angle=from+step/13*(arcLength-.045);
      const noise=1.5*Math.sin(angle*19-time*2)+1.2*Math.sin(angle*43+time*3.7+phase)
        +.65*Math.sin(step*4+index*7+time*8);
      const edge=radius+noise*(1+heat);
      const x=center+edge*Math.cos(angle);
      const y=center+edge*Math.sin(angle);
      if(step===0) context.moveTo(x,y);
      else context.lineTo(x,y);
    }
    context.strokeStyle=color;
    context.shadowBlur=4;
    context.shadowColor=color;
    context.globalAlpha=.19+glimmer*.14+heat*.16;
    context.lineWidth=2.8+heat*2;
    context.stroke();
    context.globalAlpha=.29+glimmer*.22;
    context.lineWidth=.82+glimmer*.48;
    context.stroke();
    if(glimmer>.62 || heat>.15) {
      context.strokeStyle='#f1fbff';
      context.globalAlpha=.26+heat*.28;
      context.lineWidth=.5+heat*.3;
      context.stroke();
    }

    context.shadowBlur=0;
    const sparkAngle=from+arcLength*.7;
    const sparkDistance=radius+5+glimmer*8;
    context.fillStyle=color;
    context.globalAlpha=glimmer*glimmer*.47;
    context.fillRect(center+Math.cos(sparkAngle)*sparkDistance,center+Math.sin(sparkAngle)*sparkDistance,1.6,1.6);
  }
}

function paint(context,color,phase,time,x,y,charge) {
  context.clearRect(0,0,size,size);
  const glow=context.createRadialGradient(center+x*.22,center+y*.22,0,center,center,radius);
  glow.addColorStop(0,color+'25');
  glow.addColorStop(.65,color+'0c');
  glow.addColorStop(1,'transparent');
  context.fillStyle=glow;
  context.fillRect(0,0,size,size);
  paintDust(context,color,time,phase,x,y,charge);
  paintRim(context,color,time,phase,Math.atan2(y,x),charge);
  context.globalAlpha=1;
}

function FallbackCrystal({color,phase}) {
  const canvas=useRef(null);

  useEffect(()=>{
    const element=canvas.current;
    const context=element.getContext('2d');
    if (!context) return;
    const orb=element.parentElement;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    let visible=false,over=false;
    let frame=0,last=0,time=0;
    let x=0,y=0,targetX=0,targetY=0,charge=0;
    const draw=()=>paint(context,color,phase,time,x,y,charge);

    function move(event) {
      if (event.pointerType==='touch') return;
      const box=orb.getBoundingClientRect();
      const px=(2*(event.clientX-box.left)/box.width-1)*radius;
      const py=(2*(event.clientY-box.top)/box.height-1)*radius;
      if (Math.hypot(px,py)>radius) {
        leave();
        return;
      }
      over=true;
      orb.dataset.charged='true';
      targetX=px;
      targetY=py;
      if (media.matches) {
        x=targetX;
        y=targetY;
        charge=1;
        draw();
      }
    }
    function leave() {
      over=false;
      delete orb.dataset.charged;
      targetX=0;
      targetY=0;
      if(media.matches) {
        x=0;
        y=0;
        charge=0;
        draw();
      }
    }
    function tick(now) {
      if(!last || now-last>=30) {
        if(last) time+=Math.min((now-last)/1000,.05);
        last=now;
        x+=(targetX-x)*.2;
        y+=(targetY-y)*.2;
        charge+=((over ? 1 : 0)-charge)*.18;
        draw();
      }
      frame=requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);
      last=0;
      if (visible && !media.matches) frame=requestAnimationFrame(tick);
      else draw();
    }
    const observer=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      update();
    });
    draw();
    observer.observe(orb);
    orb.addEventListener('pointermove',move);
    orb.addEventListener('pointerleave',leave);
    media.addEventListener('change',update);
    return ()=>{
      observer.disconnect();
      orb.removeEventListener('pointermove',move);
      orb.removeEventListener('pointerleave',leave);
      media.removeEventListener('change',update);
      cancelAnimationFrame(frame);
    };
  },[color,phase]);

  return <canvas ref={canvas} width={size} height={size}/>;
}

export function SectorCrystalBall({color,phase}) {
  const orb=useRef(null);
  const [visible,setVisible]=useState(false);
  const [failed,setFailed]=useState(false);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const skipWebGL=new URLSearchParams(location.search).has('noWebGL');

  useEffect(()=>{
    if(skipWebGL || failed) return;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));
    observer.observe(orb.current);
    media.addEventListener('change',update);
    return ()=>{
      observer.disconnect();
      media.removeEventListener('change',update);
    };
  },[failed,skipWebGL]);

  return <span ref={orb} className="sector-crystal-ball" aria-hidden="true">
    {visible && !failed && !reduced && !skipWebGL
      ? <CrystalizedBall preset="plasma" color={color} size={.93} strands={4} flares={.4} glow={.5}
          particleCount={6500} intro={false} onUnavailable={()=>setFailed(true)}/>
      : <FallbackCrystal color={color} phase={phase}/>}
  </span>;
}

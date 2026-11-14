import React,{useEffect,useState,useCallback} from 'react';

let sceneModule;
export function preloadLoginScene() {
 return sceneModule ||= import('./LoginScene.jsx').catch(()=>null);
}
export function LoginPassage() {
 const [Scene,setScene]=useState(null);
 const failure=useCallback(()=>setScene(null),[]);
 useEffect(()=>{
  let alive=true;
  window.dispatchEvent(new Event('citi:passage'));
  // Leave the lightweight scene running if the module fails or arrives late.
  const deadline=performance.now()+500;
  if(!new URLSearchParams(location.search).has('noWebGL')) preloadLoginScene().then(module=>{
   if(module && alive && performance.now()<deadline)setScene(()=>module.default);
  }).catch(()=>{});
  return()=>{alive=false;};
 },[]);
 return <div className="passage-visual" aria-hidden="true" data-mode={Scene?'webgl':'light'}>
  {Scene?<Scene onFailure={failure}/>:<div className="light-portals">{[0,1,2].map(i=><i key={i} style={{'--i':i}}/>)}</div>}
  <ol className="passage-stations">{['Lead','Projeto','Squad','Subárea','Integrantes'].map((name,i)=><li key={name} style={{'--i':i}}><small>0{i+1}</small>{name}</li>)}</ol>
 </div>;
}

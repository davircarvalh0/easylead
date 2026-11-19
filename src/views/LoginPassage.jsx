import React, { useEffect, useState, useCallback } from 'react';

export function LoginPassage({ prepared }) {
 const [scene, setScene] = useState(() => prepared && !prepared.lost ? prepared : null);
 const failure = useCallback(() => setScene(null),[]);
 const Scene = scene?.Scene;
 useEffect(() => { window.dispatchEvent(new Event('citi:passage')); },[]);
 return <div className="passage-visual" aria-hidden="true" data-mode={Scene?'webgl':'light'} data-solid-brand={Scene?'true':undefined}>
  <span className="passage-light"/>
  <span className="passage-reflection"/>
  {Scene&&<Scene prepared={scene} onFailure={failure}/>}
 </div>;
}

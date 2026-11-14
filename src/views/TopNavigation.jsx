import React,{useLayoutEffect,useRef} from 'react';

export function TopNavigation({items,path}) {
 const nav=useRef(null);
 useLayoutEffect(()=>{
  const host=nav.current;
  const update=()=>{
   const link=host.querySelector('[aria-current="page"]');
   host.style.setProperty('--slider-w',`${link?.offsetWidth || 0}px`);
   host.style.setProperty('--slider-x',`${link?.offsetLeft || 0}px`);
  };
  update();
  const observer=new ResizeObserver(update);observer.observe(host);
  for(const link of host.querySelectorAll('a'))observer.observe(link);
  return()=>observer.disconnect();
 },[path]);
 return <nav ref={nav} className="sliding-nav" aria-label="Navegação principal"><span className="nav-slider-pill" aria-hidden="true"/>{items.map(([url,label])=><a key={url} href={'#'+url} aria-current={(url==='/'?path==='/':path===url||path.startsWith(url+'/'))?'page':undefined}>{label}</a>)}</nav>;
}

import React,{useRef,useState} from 'react';
import {formatNumber} from './DashboardValue.jsx';

export const DIRECTORY_PAGE_SIZE=25;

export function useDirectoryPagination(items,resetKey='',initialPage=0,pageSize=DIRECTORY_PAGE_SIZE) {
  const [selection,setSelection]=useState(()=>({key:resetKey,page:Number.isSafeInteger(initialPage)&&initialPage>=0?initialPage:0}));
  const lastPage=Math.max(0,Math.ceil(items.length/pageSize)-1);
  const page=selection.key===resetKey?Math.min(selection.page,lastPage):0;
  return {page,total:items.length,pageSize,visible:items.slice(page*pageSize,(page+1)*pageSize),
    onPage:next=>setSelection({key:resetKey,page:Math.max(0,Math.min(next,lastPage))})};
}

export function DirectoryPagination({page,total,pageSize=DIRECTORY_PAGE_SIZE,onPage,label='Paginação',compact=false}) {
  const root=useRef(null);
  function navigate(next) {
    root.current?.previousElementSibling?.scrollTo?.({top:0,left:0});
    onPage(next);
  }
  if(!total)return null;
  const pages=Math.ceil(total/pageSize);
  return <nav ref={root} className={'directory-pagination'+(compact?' directory-pagination-compact':'')} aria-label={label}>
    <span aria-live="polite">{formatNumber(page*pageSize+1)}–{formatNumber(Math.min((page+1)*pageSize,total))} de {formatNumber(total)}</span>
    {pages>1 && <div className="directory-pagination-controls">
      <button type="button" disabled={page===0} onClick={()=>navigate(page-1)} aria-label="Página anterior">←<span> Anterior</span></button>
      <span>{formatNumber(page+1)} / {formatNumber(pages)}</span>
      <button type="button" disabled={page>=pages-1} onClick={()=>navigate(page+1)} aria-label="Próxima página"><span>Próxima </span>→</button>
    </div>}
  </nav>;
}

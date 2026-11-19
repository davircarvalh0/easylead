import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {animate, LayoutGroup, motion, useMotionValue, useReducedMotion} from 'motion/react';
import {DirectoryPagination} from './DirectoryPagination.jsx';
import {stages} from '../domain.js';
import {leadPendingAction} from '../services/leadWorkspace.js';
import {formatMoney, formatNumber, formatDate} from './DashboardValue.jsx';

const spring = {type:'spring', stiffness:460, damping:36, mass:.8};

export function LeadPendingBadge({pending, iconOnly = false}) {
  if (!pending) return null;
  return <small className="lead-pending-label" title={iconOnly ? pending : undefined}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 22 21H2L12 3Zm0 7v4m0 3h.01"/>
    </svg>
    {iconOnly ? <span className="lead-route-heading">{pending}</span> : pending}
  </small>;
}

function CardCopy({lead, amount, pending, owner}) {
  const contracted=Number.isFinite(amount);
  const proposed=!contracted && Number.isFinite(lead.proposal?.price);
  const value=contracted?amount:proposed?lead.proposal.price:lead.estimatedValue;
  const initials=owner?.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase('pt-BR');
  return <>
    <div className="kanban-card-client"><span>Empresa</span><span title={lead.company}>{lead.company || 'Não informada'}</span></div>
    <div className="kanban-card-body">
      <div className="prospect-card-title"><strong>{lead.name}</strong><LeadPendingBadge pending={pending} iconOnly/></div>
      <span className="kanban-card-sector" title={lead.clientSegment}>{lead.clientSegment || 'Não classificado'}</span>
      <div className="kanban-card-owner">
        <span className="kanban-owner-avatar" aria-hidden="true">{initials || <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>}</span>
        <span title={owner}>{owner || 'Sem responsável'}</span>
      </div>
    </div>
    <div className="kanban-card-footer">
      <div><small>{Number.isFinite(value)?contracted?'Contratado':proposed?'Proposto':'Estimado':'Valor'}</small><span className="prospect-card-value">{Number.isFinite(value)?formatMoney(value):'Não definido'}</span></div>
      {lead.createdAt && <small className="kanban-card-date" title="Data de cadastro">{formatDate(lead.createdAt)}</small>}
    </div>
  </>;
}


export function ProspectBoard({leads, amounts, visibleStages, hrefFor, linkedLeads, onMove, members = [], newLeadHref}) {
  const [lanePages,setLanePages]=useState({});
  const people=new Map(members.map(member=>[member.id,member.name]));
  const root = useRef(null);
  const cards = useRef(new Map());
  const pointer = useRef(null);
  const scrollFrame = useRef(0);
  const ignoreClick = useRef(false);
  const restoreFocus = useRef(null);
  const [preview, setPreview] = useState(null);
  const [landing, setLanding] = useState(false);
  const [over, setOver] = useState(null);
  const [menu, setMenu] = useState(null);
  const [message, setMessage] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const reduced = useReducedMotion();

  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), []);
  useLayoutEffect(() => {
    if (!restoreFocus.current) return;
    const target = cards.current.get(restoreFocus.current)?.querySelector('.prospect-move');
    (target || root.current)?.focus({preventScroll:true});
    restoreFocus.current = null;
  });

  useLayoutEffect(() => {
    if (!landing || !preview) return;
    const target = cards.current.get(preview.lead.id)?.getBoundingClientRect();
    const reveal = () => {setPreview(null); setLanding(false);};
    if (reduced) {reveal(); return;}
    const animations = target
      ? [animate(x,target.left,spring), animate(y,target.top,spring)]
      : [animate(opacity,0,{duration:.15})];
    let current = true;
    Promise.all(animations).then(()=>{if(current) reveal();});
    return () => {current = false; animations.forEach(animation=>animation.stop());};
  }, [landing, preview, reduced, x, y, opacity]);

  function destination(clientX, clientY) {
    const lane = document.elementFromPoint(clientX,clientY)?.closest('[data-drop-stage]');
    return lane && root.current.contains(lane) ? lane.dataset.dropStage : null;
  }

  function autoScroll() {
    const gesture = pointer.current;
    if (!gesture?.dragging) return;
    const edge = 95;
    const delta = gesture.clientY < edge ? -12 : gesture.clientY > innerHeight - edge ? 12 : 0;
    if(delta)window.scrollBy(0,delta);
    const board=root.current;
    const bounds=board.getBoundingClientRect();
    const horizontal=gesture.clientX<bounds.left+48?-12:gesture.clientX>bounds.right-48?12:0;
    if(horizontal)board.scrollLeft+=horizontal;
    const lane=document.elementFromPoint(gesture.clientX,gesture.clientY)?.closest('[data-drop-stage]');
    const list=lane && board.contains(lane)?lane.querySelector(':scope > ul'):null;
    if(list) {
      const listBounds=list.getBoundingClientRect();
      const vertical=gesture.clientY<listBounds.top+35?-10:gesture.clientY>listBounds.bottom-35?10:0;
      if(vertical)list.scrollTop+=vertical;
    }
    setOver(destination(gesture.clientX,gesture.clientY));
    scrollFrame.current = requestAnimationFrame(autoScroll);
  }

  function start(event, lead, handle = false) {
    if (!event.isPrimary || event.button !== 0) return;
    if (preview || visibleStages.length <= 1 || (event.pointerType !== 'mouse' && !handle)) return;
    const rect = cards.current.get(lead.id).getBoundingClientRect();
    pointer.current = {id:event.pointerId, capture:event.currentTarget, lead, rect, startX:event.clientX, startY:event.clientY, dragging:false};
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event) {
    const gesture = pointer.current;
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY;
    if (!gesture.dragging && Math.hypot(dx,dy) < 6) return;
    gesture.clientX = event.clientX;
    gesture.clientY = event.clientY;
    x.jump(gesture.rect.left + dx);
    y.jump(gesture.rect.top + dy);
    if (!gesture.dragging) {
      gesture.dragging = true;
      ignoreClick.current = true;
      opacity.jump(1);
      setMenu(null);
      setMessage(null);
      setPreview({lead:gesture.lead, width:gesture.rect.width});
      scrollFrame.current = requestAnimationFrame(autoScroll);
    }
    setOver(destination(event.clientX,event.clientY));
  }

  async function save(lead, stage, focus = false) {
    if (!stage || stage === lead.stage) return;
    try {
      await onMove(lead.id, stage);
      setMessage({text:lead.name + ' movido para ' + stage + '.'});
    } catch (error) {
      setMessage({error:true, text:error.message});
    }
    if (focus) restoreFocus.current = lead.id;
    setMenu(null);
  }

  function finish(event, canceled = false) {
    const gesture = pointer.current;
    if (!gesture || (event.pointerId != null && event.pointerId !== gesture.id)) return;
    pointer.current = null;
    if (gesture.capture.hasPointerCapture(gesture.id)) gesture.capture.releasePointerCapture(gesture.id);
    cancelAnimationFrame(scrollFrame.current);
    if (!gesture.dragging) return;
    if (!canceled) save(gesture.lead, destination(event.clientX,event.clientY));
    setOver(null);
    setLanding(true);
  }

  function activate(event, callback) {
    if (event.detail && ignoreClick.current) {event.preventDefault(); ignoreClick.current = false; return;}
    callback();
  }

  return <>
    <LayoutGroup id="prospect-board">
      <div ref={root} className="prospect-board" aria-label="Quadro de oportunidades" tabIndex={-1}
        data-dragging={preview && !landing ? 'true' : undefined}
        onPointerDownCapture={()=>{ignoreClick.current = false;}} onPointerMove={move} onPointerUp={finish} onPointerCancel={event=>finish(event,true)}
        onLostPointerCapture={event=>finish(event,true)}
        onKeyDown={event=>{
          if (event.key !== 'Escape') return;
          if (pointer.current) finish(event,true);
          if (menu) {restoreFocus.current = menu; setMenu(null);}
        }}>
        {visibleStages.map(stage=>{
          const column = leads.filter(lead=>lead.stage === stage);
          const pageSize=10;
          const page=Math.min(lanePages[stage] || 0,Math.max(0,Math.ceil(column.length/pageSize)-1));
          const visible=column.slice(page*pageSize,(page+1)*pageSize);
          return <section key={stage} className="prospect-lane" data-stage={stage} data-drop-stage={stage}
            data-drop-active={over === stage && preview?.lead.stage !== stage ? 'true' : undefined} aria-label={stage}>
            <header className="kanban-lane-header"><div><i aria-hidden="true"/><h3>{stage}</h3><span className="kanban-lane-count">{formatNumber(column.length)}</span></div>
              {stage==='Novo' && newLeadHref && <a className="kanban-add-icon" href={newLeadHref} aria-label="Cadastrar novo lead">+</a>}
            </header>
            {column.length ? <ul>{visible.map(lead=>{
              const locked = lead.projectId || linkedLeads.has(lead.id);
              const pending = leadPendingAction(lead, Boolean(locked));
              return <motion.li key={lead.id} layout={reduced ? false : 'position'} transition={spring} className="prospect-board-item"
                data-lifting={preview?.lead.id === lead.id ? 'true' : undefined}
                ref={node=>{if(node) cards.current.set(lead.id,node); else cards.current.delete(lead.id);}}>
                <a href={hrefFor(lead)} draggable={false} className="prospect-card" aria-label={lead.name+' · '+lead.company}
                  data-movable={!locked || undefined} title={locked ? 'Lead convertido · permanece em Ganho' : undefined}
                  onPointerDown={locked ? undefined : event=>start(event,lead)}
                  onClick={event=>{if (event.detail && ignoreClick.current) {event.preventDefault(); ignoreClick.current = false;}}}><CardCopy lead={lead} amount={amounts.get(lead.id)} pending={pending} owner={people.get(lead.businessOwnerId)}/></a>
                {!locked && <>
                  <button type="button" className="prospect-move" style={{touchAction:'none'}} aria-label={'Mover ' + lead.name}
                    aria-expanded={menu === lead.id} title="Arrastar ou escolher estágio"
                    onPointerDown={event=>start(event,lead,true)}
                    onClick={event=>activate(event,()=>setMenu(menu === lead.id ? null : lead.id))}>
                    <span aria-hidden="true">⠿</span>
                  </button>
                  {menu === lead.id && <label className="prospect-move-menu">Mover para
                    <select autoFocus value="" onChange={event=>save(lead,event.target.value,true)}>
                      <option value="" disabled>Escolha um estágio</option>
                      {stages.filter(value=>value!==lead.stage).map(value=><option key={value}>{value}</option>)}
                    </select>
                  </label>}
                </>}
              </motion.li>;
            })}</ul> : <p>Sem leads neste estágio.</p>}
            {stage==='Novo' && newLeadHref && <a className="kanban-add-lead" href={newLeadHref}>+ Novo lead</a>}
            {column.length>10 && <DirectoryPagination compact page={page} total={column.length} pageSize={pageSize} label={'Paginação de '+stage} onPage={next=>setLanePages(current=>({...current,[stage]:next}))}/>}
          </section>;
        })}
      </div>
    </LayoutGroup>
    <p className={message?.error ? 'error' : 'prospect-move-message'} role={message?.error ? 'alert' : 'status'}>{message?.text}</p>
    {preview && createPortal(<motion.div className="prospect-card prospect-drag-preview" data-stage={preview.lead.stage}
      aria-hidden="true" style={{x,y,opacity,width:preview.width}}
      initial={false} animate={{scale:landing || reduced ? 1 : 1.035, rotate:landing || reduced ? 0 : -1.4}} transition={spring}>
      <CardCopy lead={preview.lead} amount={amounts.get(preview.lead.id)} pending={leadPendingAction(preview.lead)} owner={people.get(preview.lead.businessOwnerId)}/>
    </motion.div>,document.body)}
  </>;
}

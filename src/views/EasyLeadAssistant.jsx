import React, {useEffect, useId, useRef, useState} from 'react';
import {LiquidNavbar} from '../../components/ui/LiquidNavbar.tsx';
import {prospectHref} from '../services/leadWorkspace.js';
import {askAssistant, importAssistantFiles, analyzeAssistantFiles} from '../services/assistantClient.js';
import {attachmentIntent} from '../services/attachmentIntent.js';
import {AgentParticleEntrance} from './AgentParticleEntrance.jsx';
import {EasyLeadLogo} from './TopNavigation.jsx';
import {AssistantReply} from './AssistantReply.jsx';
import './easy-lead-assistant.css';

const prompts = [
  'Resuma meus leads',
  'Quais propostas estão pendentes?',
  'Quais projetos estão em andamento?',
  'Qual é o valor contratado?',
];

const fileKey = file => [file.name, file.size, file.lastModified].join(':');

function Icon({children}) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

function Attachments({theme,onAdd,disabled}) {
  const [open,setOpen] = useState(false);
  const root = useRef(null);
  const picker = useRef(null);
  const panelId = useId();

  useEffect(()=>{
    if (!open) return;
    const closeOutside = event => {if (!root.current?.contains(event.target)) setOpen(false);};
    document.addEventListener('pointerdown',closeOutside);
    return ()=>document.removeEventListener('pointerdown',closeOutside);
  },[open]);

  function close() {
    setOpen(false);
    root.current?.querySelector('.nimbus-item')?.focus();
  }

  return <div className="agent-attachments" ref={root}
    onBlur={event=>{if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}
    onKeyDown={event=>{if (event.key==='Escape' && open) {event.preventDefault(); close();}}}>
    <LiquidNavbar className="agent-attach-liquid" tone={theme} compact ariaLabel={null} animateSelection active={open ? 0 : -1}
      items={[{
        label:'Anexos', fx:'none',
        icon:<Icon><path d="M8 13.5 14.8 6.7a2.5 2.5 0 0 1 3.5 3.5l-8.4 8.4a4 4 0 0 1-5.7-5.7l8.2-8.2M8 13.5a1 1 0 0 0 1.4 1.4l6-6"/></Icon>,
        buttonProps:{disabled,'aria-expanded':open,'aria-controls':panelId,onClick:()=>setOpen(previous=>!previous)},
      }]}/>
    <div className="agent-attach-menu" id={panelId} hidden={!open}>
      <button type="button" onClick={()=>picker.current?.click()}>Anexar arquivos</button>
    </div>
    <input ref={picker} type="file" accept=".xml,.csv" multiple hidden aria-label="Selecionar arquivos"
      onChange={event=>{
        onAdd([...event.target.files]);
        event.target.value='';
        close();
      }}/>
  </div>;
}

export function EasyLeadAssistant({state,theme,importLeads,conversation,setConversation}) {
  const {draft,files,messages,analysisContext,analyzedFiles}=conversation;
  function updateConversation(key,value){
    setConversation(previous=>({...previous,[key]:typeof value==='function'?value(previous[key]):value}));
  }
  const setDraft=value=>updateConversation('draft',value);
  const setFiles=value=>updateConversation('files',value);
  const setMessages=value=>updateConversation('messages',value);
  const setAnalysisContext=value=>updateConversation('analysisContext',value);
  const setAnalyzedFiles=value=>updateConversation('analyzedFiles',value);
  const [notice,setNotice] = useState('');
  const [pendingQuery,setPendingQuery] = useState('');
  const [pendingAction,setPendingAction] = useState('');
  const inFlight = useRef(null);
  useEffect(()=>()=>inFlight.current?.abort(),[]);
  const thread = useRef(null);
  useEffect(()=>{
    if(thread.current) thread.current.scrollTop=thread.current.scrollHeight;
  },[messages,pendingQuery]);
  const composer = useRef(null);
  const textInput = useRef(null);
  const hintId = useId();

  function addFiles(added) {
    setFiles(previous=>[...new Map([...previous,...added].map(file=>[fileKey(file),file])).values()]);
    setNotice('');
  }

  async function submit(event) {
    event.preventDefault();
    const query = draft.trim();
    if (inFlight.current || (!query && !files.length)) return;
    const intent=attachmentIntent(query);
    const referencedFiles=!files.length&&intent==='import'&&/\b(esses|estes|arquivo|csv|xml|anexo|analisados|desses|destes)\b/i.test(query)?analyzedFiles:[];
    const attached=files.length?files:referencedFiles;
    if(attached.length&&intent==='clarify'){
      setNotice('Você quer analisar o arquivo ou cadastrar os leads? Escreva, por exemplo, “Analise quais leads priorizar” ou “Cadastre os leads deste arquivo”.');return;
    }
    const controller = new AbortController();
    inFlight.current = controller;
    const shownQuery = query;
    setPendingAction(attached.length?(intent==='import'?'import':'analyze'):'query');
    setPendingQuery(shownQuery);
    setNotice('');
    try {
      let result;
      if(attached.length&&intent==='import'){
        result=await importAssistantFiles(attached,importLeads,controller.signal);
        setAnalysisContext(null);setAnalyzedFiles([]);
      }else{
        const context=attached.length?await analyzeAssistantFiles(attached,controller.signal):analysisContext;
        result=await askAssistant(state,messages,query,controller.signal,context);
        if(attached.length){setAnalysisContext(context);setAnalyzedFiles(attached);}
      }
      const links = result.added ? [{href:prospectHref({estagio:'Novo'}),label:'Ver novos leads'}] : result.links;
      setMessages(previous=>[...previous,{query:shownQuery,reply:result.reply,links}]);
      setDraft('');
      setFiles([]);
    } catch (error) {
      if (!controller.signal.aborted) setNotice(error.message || 'Não foi possível concluir a operação.');
    } finally {
      inFlight.current = null;
      if (!controller.signal.aborted) setPendingQuery('');
    }
  }


  return <section className="easy-assistant" data-empty={messages.length===0&&!pendingQuery} aria-label="Assistente EasyLead">
    <AgentParticleEntrance/>
    {(messages.length || pendingQuery) ? <h1 className="lead-route-heading" tabIndex="-1">Conversa com EasyLead</h1> : <div className="agent-intro">
      <div className="agent-mark" data-agent-particles="mark" aria-hidden="true"><EasyLeadLogo/></div>
      <h1 tabIndex="-1" data-agent-particles="text">Como posso ajudar?</h1>
      <div className="agent-suggestions" aria-label="Consultas sugeridas" role="group">
        {prompts.map(prompt=><button type="button" key={prompt} data-agent-particles="pill"
          onClick={()=>{setDraft(prompt); setNotice(''); textInput.current?.focus();}}>{prompt}</button>)}
      </div>
    </div>}
    {(messages.length > 0 || pendingQuery) && <div ref={thread} className="agent-thread" role="log" aria-label="Conversa" tabIndex={0}>
      {messages.map(({query,reply,links},index)=><div className="agent-exchange" key={index}>
        <p className="agent-prompt">{query}</p>
        <div className="agent-reply">
          <AssistantReply reply={reply}/>
          {!!links?.length && <div className="agent-reply-links" role="group" aria-label="Páginas relacionadas">
            {links.map(({href,label})=><a key={href} href={href}>{label} →</a>)}
          </div>}
        </div>
      </div>)}
      {pendingQuery && <div className="agent-exchange">
        <p className="agent-prompt">{pendingQuery}</p>
        <div className="agent-reply" role="status">{pendingAction==='import'?'Importando leads…':pendingAction==='analyze'?'Analisando arquivos…':'Consultando o EasyLead…'}</div>
      </div>}
    </div>}
    <div className="agent-input-area">
      {!!files.length && <ul className="agent-file-list" aria-label="Arquivos anexados">
        {files.map(file=><li key={fileKey(file)}>
          <span>{file.name}</span>
          <button type="button" disabled={Boolean(pendingQuery)} aria-label={'Remover '+file.name}
            onClick={()=>{setFiles(previous=>previous.filter(item=>fileKey(item)!==fileKey(file)));setNotice('');}}>×</button>
        </li>)}
      </ul>}
      <form ref={composer} className="agent-composer" data-agent-particles="composer" onSubmit={submit}>
        <textarea ref={textInput} rows={1} aria-label="Mensagem para o EasyLead" aria-describedby={hintId} readOnly={Boolean(pendingQuery)}
          placeholder="Envie uma mensagem ao EasyLead…" value={draft}
          onChange={event=>{setDraft(event.target.value);setNotice('');}}
          onKeyDown={event=>{
            if (event.key==='Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              composer.current?.requestSubmit();
            }
          }}/>
        <div className="agent-composer-actions">
          <Attachments theme={theme} onAdd={addFiles} disabled={Boolean(pendingQuery)}/>
          <button type="submit" className="agent-send" aria-label="Enviar mensagem" disabled={Boolean(pendingQuery) || (!draft.trim() && !files.length)}>
            <Icon><path d="M12 19V5m-6 6 6-6 6 6"/></Icon>
          </button>
        </div>
      </form>
      <p className="agent-hint" data-agent-particles="text" id={hintId}>Enter para enviar <span aria-hidden="true">·</span> Shift + Enter para uma nova linha</p>
      {notice && <p className="agent-notice" role="status">{notice}</p>}
    </div>
  </section>;
}

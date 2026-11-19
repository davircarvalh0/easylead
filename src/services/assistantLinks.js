import {prospectHref} from './leadWorkspace.js';

export const MAX_ASSISTANT_LINKS = 6;

const recordPages = {
  lead:{table:'leads',path:'#/leads/',label:'Empresa'},
  project:{table:'projects',path:'#/projetos/',label:'Projeto'},
  area:{table:'areas',path:'#/organizacao/',label:'Área'},
  squad:{table:'squads',path:'#/squads/',label:'Squad'},
};

const directoryPages = {
  leads:{href:prospectHref(),label:'Ver leads'},
  ddd81:{href:prospectHref({ddd:'81'}),label:'Ver contatos com DDD 81'},
  projects:{href:'#/projetos/todos',label:'Ver projetos'},
  organization:{href:'#/organizacao',label:'Ver organização'},
};

export function recordLink(kind,record) {
  const {path,label} = recordPages[kind];
  const name = kind==='lead' ? (record.company || record.name) : record.name;
  return {href:path+encodeURIComponent(record.id),label:label+' · '+name};
}

export function resolveAssistantLinks(content,snapshot) {
  const links = new Map();
  const reply = content.replace(/\[\[(lead|project|area|squad|leads|projects|organization|ddd81)(?::([^\]\r\n]*))?\]\]/g,
    (marker,kind,id)=>{
      if (links.size>=MAX_ASSISTANT_LINKS) return '';
      let link;
      if (id===undefined) link = directoryPages[kind];
      else if (recordPages[kind]) {
        const record = snapshot[recordPages[kind].table]?.find(row=>row.id===id.trim());
        if (record) link = recordLink(kind,record);
      }
      if (link) links.set(link.href,link);
      return '';
    }).trim();
  return {reply,links:[...links.values()]};
}

import {isCloud,cloudApi} from '../services/cloudClient.js';
function openDocuments() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('easylead-proposals', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function accessDocument(mode, operation) {
  const database = await openDocuments();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('documents', mode);
      const request = operation(transaction.objectStore('documents'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function storeProposalDocument(file) {
  if (!/\.(pdf|docx?|odt|rtf)$/i.test(file.name) || !file.size) {
    throw Error('Selecione um documento PDF, Word, ODT ou RTF com conteúdo.');
  }
  if(isCloud){
    if(file.size>2*1024*1024)throw Error('Use um documento de até 2 MB.');
    const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return cloudApi('documents',{method:'POST',body:{name:file.name,base64:btoa(binary)}});
  }
  const id = crypto.randomUUID();
  try {
    await accessDocument('readwrite', store => store.add(file, id));
  } catch {
    throw Error('Não foi possível salvar o documento neste navegador.');
  }
  return {id, name:file.name};
}

export async function viewProposalDocument({id, name}) {
  if(isCloud){window.open('/api/easylead/documents?id='+encodeURIComponent(id),'_blank','noopener');return;}
  const isPdf = /\.pdf$/i.test(name);
  const tab = isPdf ? window.open('about:blank', '_blank') : null;
  if (tab) tab.opener = null;
  try {
    const file = await accessDocument('readonly', store => store.get(id));
    if (!file) throw Error('Documento indisponível neste navegador.');
    const url = URL.createObjectURL(isPdf ? new Blob([file], {type:'application/pdf'}) : file);
    const owner = tab && !tab.closed ? tab.document : document;
    const link = owner.createElement('a');
    link.href = url;
    link.download = name;
    if (owner === document) {
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }

    owner.title = name;
    link.textContent = 'Baixar ' + name;
    const viewer = owner.createElement('iframe');
    viewer.src = url;
    viewer.title = name;
    Object.assign(owner.body.style, {
      margin:'0', padding:'12px', minHeight:'100vh', boxSizing:'border-box',
      display:'grid', gridTemplateRows:'auto 1fr', gap:'12px', fontFamily:'system-ui, sans-serif',
    });
    Object.assign(viewer.style, {width:'100%', height:'100%', border:'0'});
    owner.body.append(link, viewer);
    tab.addEventListener('pagehide', () => URL.revokeObjectURL(url), {once:true});
  } catch (error) {
    tab?.close();
    throw error;
  }
}

export function deleteProposalDocument(id) {
  if(isCloud)return cloudApi('documents?id='+encodeURIComponent(id),{method:'DELETE'});
  return accessDocument('readwrite', store => store.delete(id));
}

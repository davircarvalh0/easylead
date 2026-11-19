import {readState,STORAGE_KEY} from './stateRepository.js';

export const PRIMARY_SOURCE_KEY=STORAGE_KEY+'-primary-source';
export const PREVIOUS_PRIMARY_KEY=STORAGE_KEY+'-before-demo-promotion';

export function hasPrimaryWorkspace(storage){
 return storage.getItem(PRIMARY_SOURCE_KEY)==='demo';
}

export function promoteDemoToPrimary(storage,incoming){
 if(hasPrimaryWorkspace(storage))return readState(storage);
 if(incoming?.version!==1||!['areas','members','leads','projects'].every(key=>Array.isArray(incoming[key])))throw Error('A base da carteira não pôde ser carregada.');
 const previous=storage.getItem(STORAGE_KEY);
 // Validate both saved workspaces before changing any data.
 if(previous!==null)readState(storage);
 const next={...readState(storage,STORAGE_KEY+'-demo',incoming),primaryWorkspaceSource:'demo'};
 const encoded=JSON.stringify(next);
 if(previous!==null&&storage.getItem(PREVIOUS_PRIMARY_KEY)===null)storage.setItem(PREVIOUS_PRIMARY_KEY,previous);
 try{
  storage.setItem(STORAGE_KEY,encoded);
  storage.setItem(PRIMARY_SOURCE_KEY,'demo');
 }catch(error){
  // Leave the old primary usable if the promotion cannot be persisted completely.
  if(previous===null)storage.removeItem(STORAGE_KEY);else storage.setItem(STORAGE_KEY,previous);
  throw error;
 }
 return next;
}

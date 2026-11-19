import pg from 'pg';
import {attachDatabasePool} from '@vercel/functions';
import {hydrateState} from '../src/repositories/stateRepository.js';
import {createLeadProjectService} from '../src/services/leadProjectService.js';
import {ApiError} from './http.js';

let pool;
export function getPool(connectionString){
 if(!pool){pool=new pg.Pool({connectionString,max:2,idleTimeoutMillis:5000,connectionTimeoutMillis:8000,allowExitOnIdle:true});attachDatabasePool(pool);}
 return pool;
}
export const mutationNames=new Set(['saveLead','importLeads','saveProposal','moveLeadStage','saveMember','saveArea','removeArea','setAreaLeadOwnership','saveIcp','saveProjectScope','changeStatus','saveGoal']);
export function applyWorkspaceCommand(state,name,args){
 if(!mutationNames.has(name)||!Array.isArray(args)||args.length>3)throw new ApiError(400,'Operação de carteira inválida.');
 const service=createLeadProjectService({read:()=>state,write:()=>{}});
 let value;try{value=service[name](state,...args);}catch(error){throw new ApiError(400,error.message);}
 const next=value.state||value;
 const result=value.state?Object.fromEntries(Object.entries(value).filter(([key])=>key!=='state')):{};
 return {state:next,result};
}
export function createPostgresRepository(database,workspaceId){
 async function workspace(client=database,lock=false){
  const {rows}=await client.query('SELECT state, revision FROM easylead_workspaces WHERE id=$1'+(lock?' FOR UPDATE':''),[workspaceId]);
  if(!rows.length)throw new ApiError(503,'A carteira não foi inicializada. Execute db:init e db:seed.');
  return {state:hydrateState(rows[0].state),revision:Number(rows[0].revision)};
 }
 return {
  read:()=>workspace(),
  async mutate({command,args,revision}){
   if(!Number.isSafeInteger(revision)||revision<0)throw new ApiError(400,'Versão da carteira inválida.');
   const client=await database.connect();try{
    await client.query('BEGIN');const current=await workspace(client,true);
    if(current.revision!==revision)throw new ApiError(409,'A carteira foi alterada em outra aba ou por outra pessoa. Recarregue antes de tentar novamente.');
    if(command==='saveProposal'&&args?.[1]?.attachment){
     const attachment=args[1].attachment;
     if(typeof attachment.id!=='string')throw new ApiError(400,'Documento inválido.');
     const {rows}=await client.query('SELECT id FROM easylead_documents WHERE id=$1 AND workspace_id=$2',[attachment.id,workspaceId]);
     if(!rows.length)throw new ApiError(400,'Documento não encontrado nesta carteira.');
    }
    const next=applyWorkspaceCommand(current.state,command,args);
    if(Buffer.byteLength(JSON.stringify(next.state))>3500000)throw new ApiError(413,'A carteira excedeu o limite de tamanho.');
    const nextRevision=current.revision+1;
    await client.query('UPDATE easylead_workspaces SET state=$1::jsonb,revision=$2,updated_at=now() WHERE id=$3',[JSON.stringify(next.state),nextRevision,workspaceId]);
    await client.query('COMMIT');return {...next,revision:nextRevision};
   }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
  },
  async createSession(id,email,expires){await database.query('INSERT INTO easylead_sessions(id,email,expires_at) VALUES($1,$2,$3)',[id,email,new Date(expires*1000)]);},
  async session(id){const {rows}=await database.query('SELECT email FROM easylead_sessions WHERE id=$1 AND expires_at>now()',[id]);return rows[0]||null;},
  async deleteSession(id){await database.query('DELETE FROM easylead_sessions WHERE id=$1',[id]);},
  async rateLimit(key,limit,seconds){
   const start=Math.floor(Date.now()/1000/seconds)*seconds;
   const {rows}=await database.query('INSERT INTO easylead_rate_limits(key,window_start,count) VALUES($1,$2,1) ON CONFLICT(key) DO UPDATE SET window_start=EXCLUDED.window_start,count=CASE WHEN easylead_rate_limits.window_start=EXCLUDED.window_start THEN easylead_rate_limits.count+1 ELSE 1 END RETURNING count',[key,start]);
   if(rows[0].count>limit)throw new ApiError(429,'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  },
  async storeDocument({id,name,mime,content}){await database.query('INSERT INTO easylead_documents(id,workspace_id,name,mime,content) VALUES($1,$2,$3,$4,$5)',[id,workspaceId,name,mime,content]);},
  async document(id){const {rows}=await database.query('SELECT id,name,mime,content FROM easylead_documents WHERE id=$1 AND workspace_id=$2',[id,workspaceId]);if(!rows.length)throw new ApiError(404,'Documento não encontrado.');return rows[0];},
  async deleteDocument(id){
   const client=await database.connect();try{await client.query('BEGIN');const {state}=await workspace(client,true);
    if(state.leads.some(lead=>lead.proposal?.attachment?.id===id))throw new ApiError(409,'O documento está vinculado a uma proposta.');
    await client.query('DELETE FROM easylead_documents WHERE id=$1 AND workspace_id=$2',[id,workspaceId]);await client.query('COMMIT');
   }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
  },
 };
}

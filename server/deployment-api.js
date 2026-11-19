import {randomUUID} from 'node:crypto';
import {deploymentConfig} from './deployment-config.js';
import {getPool,createPostgresRepository} from './postgres.js';
import {ApiError,bodyJson,json} from './http.js';
import {assertSameOrigin,requireSession,loginSession,cookieToken,parseSession,sessionCookie} from './auth.js';
import {assistantMiddleware} from './assistant.js';
import {assistantSnapshot} from './assistant-data.js';

export function createDeploymentApi({env=process.env,repository:providedRepository,request=fetch}={}){
 return async(req,res)=>{
  try{
   const config=deploymentConfig(env),repository=providedRepository||createPostgresRepository(getPool(config.databaseUrl),config.workspaceId);
   const url=new URL(req.url,'https://placeholder.invalid'),endpoint=url.pathname.split('/').filter(Boolean).at(-1);
   assertSameOrigin(req,config);
   if(endpoint==='session'){
    if(req.method==='GET'){
     try{const session=await requireSession(req,config,repository);return json(res,200,{session:{authenticated:true,email:session.email,loggedAt:(session.exp-43200)*1000}});}catch(error){if(error.status===401)return json(res,200,{session:null});throw error;}
    }
    if(req.method==='POST'){
     const {payload,token}=await loginSession(req,await bodyJson(req,4096),config,repository);res.setHeader('Set-Cookie',sessionCookie(token,config));return json(res,200,{session:{authenticated:true,email:payload.email,loggedAt:Date.now()}});
    }
    if(req.method==='DELETE'){
     const payload=parseSession(cookieToken(req),config);if(payload)await repository.deleteSession(payload.id);res.setHeader('Set-Cookie',sessionCookie('',config,true));return json(res,200,{ok:true});
    }
    throw new ApiError(405,'Método não permitido.');
   }
   const session=await requireSession(req,config,repository);
   await repository.rateLimit('requests:'+session.id,120,60);
   if(endpoint==='workspace'){
    if(req.method==='GET')return json(res,200,await repository.read());
    if(req.method==='POST')return json(res,200,await repository.mutate(await bodyJson(req)));
    throw new ApiError(405,'Método não permitido.');
   }
   if(endpoint==='assistant'){
    await repository.rateLimit('assistant:'+session.email,15,60);
    return await assistantMiddleware({apiKey:config.deepseekApiKey,model:config.deepseekModel,request,authorize:()=>true,loadSnapshot:async()=>assistantSnapshot((await repository.read()).state),timeoutMs:55000})(req,res,()=>json(res,404,{error:'Rota não encontrada.'}));
   }
   if(endpoint==='documents'){
    if(req.method==='POST'){
     const body=await bodyJson(req),name=body.name;
     if(typeof name!=='string'||name.length>200||!(/\.(pdf|docx?|odt|rtf)$/i.test(name))||/[\r\n]/.test(name)||typeof body.base64!=='string'||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.base64))throw new ApiError(400,'Documento inválido.');
     const content=Buffer.from(body.base64,'base64');if(!content.length||content.length>2*1024*1024)throw new ApiError(413,'Use um documento de até 2 MB.');
     const id=randomUUID(),mime=/\.pdf$/i.test(name)?'application/pdf':'application/octet-stream';await repository.storeDocument({id,name,mime,content});return json(res,201,{id,name});
    }
    const id=url.searchParams.get('id');if(!/^[\da-f-]{36}$/i.test(id||''))throw new ApiError(400,'Identificador de documento inválido.');
    if(req.method==='GET'){
     const document=await repository.document(id);res.writeHead(200,{'Content-Type':document.mime,'Content-Disposition':(document.mime==='application/pdf'?'inline':'attachment')+"; filename*=UTF-8''"+encodeURIComponent(document.name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});return res.end(document.content);
    }
    if(req.method==='DELETE'){await repository.deleteDocument(id);return json(res,200,{ok:true});}
    throw new ApiError(405,'Método não permitido.');
   }
   throw new ApiError(404,'Rota não encontrada.');
  }catch(error){
   const status=error.status||503;
   json(res,status,{error:error.status===503?'Serviço temporariamente indisponível. Tente novamente em instantes.':error.status?error.message:'Não foi possível acessar os serviços do servidor. Verifique o banco de dados e tente novamente.'});
  }
 };
}

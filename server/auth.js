import {createHash,createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {ApiError} from './http.js';
export const COOKIE_NAME='easylead_session';
const hash=value=>createHash('sha256').update(value).digest();
const key=config=>createHmac('sha256',config.sessionSecret).update(config.accessCode).digest();
export function assertSameOrigin(req,config){
 if(req.headers['sec-fetch-site']==='cross-site')throw new ApiError(403,'Origem não autorizada.');
 if(!['GET','HEAD'].includes(req.method)&&(!req.headers.origin||!config.origins.includes(req.headers.origin)))throw new ApiError(403,'Origem não autorizada.');
}
export function signSession(payload,config){const encoded=Buffer.from(JSON.stringify(payload)).toString('base64url');return encoded+'.'+createHmac('sha256',key(config)).update(encoded).digest('base64url');}
export function parseSession(token,config,now=Math.floor(Date.now()/1000)){
 try{if(typeof token!=='string'||token.length>2048)return null;const [encoded,signature,...extra]=token.split('.');if(extra.length)return null;
  const expected=createHmac('sha256',key(config)).update(encoded).digest(),actual=Buffer.from(signature,'base64url');
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
  const payload=JSON.parse(Buffer.from(encoded,'base64url').toString());
  return typeof payload.id==='string'&&typeof payload.email==='string'&&Number.isSafeInteger(payload.exp)&&payload.exp>now&&config.emails.includes(payload.email)?payload:null;
 }catch{return null;}
}
export function cookieToken(req){return (req.headers.cookie||'').split(';').map(value=>value.trim()).find(value=>value.startsWith(COOKIE_NAME+'='))?.slice(COOKIE_NAME.length+1);}
export function sessionCookie(token,config,expired=false){return COOKIE_NAME+'='+token+'; Path=/api/easylead; HttpOnly; SameSite=Strict; Max-Age='+(expired?0:43200)+(config.secure?'; Secure':'');}
export async function requireSession(req,config,repository){
 const payload=parseSession(cookieToken(req),config);if(!payload)throw new ApiError(401,'Entre novamente para continuar.');
 const stored=await repository.session(payload.id);if(!stored||stored.email!==payload.email)throw new ApiError(401,'Sessão expirada. Entre novamente.');return payload;
}
export async function loginSession(req,body,config,repository){
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 await repository.rateLimit('login:'+createHmac('sha256',config.sessionSecret).update(ip).digest('hex'),8,900);
 const demo=body.demo===true;
 if(demo&&!config.demoAccess)throw new ApiError(403,'O acesso de demonstração não está disponível.');
 const email=demo?config.demoEmail:typeof body.email==='string'?body.email.trim().toLowerCase():'';
 const password=typeof body.password==='string'?body.password:'';
 const validCode=timingSafeEqual(hash(password),hash(config.accessCode));
 if(!demo&&(!validCode||!config.emails.includes(email)))throw new ApiError(401,'E-mail ou código de acesso inválido.');
 const payload={id:randomUUID(),email,exp:Math.floor(Date.now()/1000)+43200};
 await repository.createSession(payload.id,email,payload.exp);return {payload,token:signSession(payload,config)};
}

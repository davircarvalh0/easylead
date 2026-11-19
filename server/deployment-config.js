import {ApiError} from './http.js';

export function deploymentConfig(env=process.env){
 const required=['DATABASE_URL','APP_ACCESS_CODE','SESSION_SECRET','APP_ALLOWED_EMAILS'];
 const missing=required.filter(key=>!env[key]?.trim());if(missing.length)throw new ApiError(503,'Configure no servidor: '+missing.join(', ')+'.');
 let database;try{database=new URL(env.DATABASE_URL);}catch{throw new ApiError(503,'DATABASE_URL inválida.');}
 if(!['postgres:','postgresql:'].includes(database.protocol))throw new ApiError(503,'DATABASE_URL deve usar PostgreSQL.');
 if(env.APP_ACCESS_CODE.length<12||env.SESSION_SECRET.length<32)throw new ApiError(503,'Use APP_ACCESS_CODE com pelo menos 12 caracteres e SESSION_SECRET com pelo menos 32.');
 const origins=[env.APP_ORIGIN,env.VERCEL_URL&&'https://'+env.VERCEL_URL].filter(Boolean).map(value=>{
  try{const url=new URL(value);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error();return url.origin;}catch{throw new ApiError(503,'APP_ORIGIN deve ser a URL HTTPS do site.');}
 });
 if(!origins.length)throw new ApiError(503,'Configure APP_ORIGIN com a URL do site.');
 const emails=env.APP_ALLOWED_EMAILS.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
 if(!emails.length||emails.some(email=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new ApiError(503,'APP_ALLOWED_EMAILS deve conter e-mails separados por vírgula.');
 return {databaseUrl:env.DATABASE_URL,accessCode:env.APP_ACCESS_CODE,sessionSecret:env.SESSION_SECRET,emails,origins,workspaceId:env.APP_WORKSPACE_ID?.trim()||'main',secure:origins.every(origin=>origin.startsWith('https:')),deepseekApiKey:env.DEEPSEEK_API_KEY||'',deepseekModel:env.DEEPSEEK_MODEL?.trim()||'deepseek-flash'};
}

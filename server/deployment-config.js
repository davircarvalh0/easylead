import {createHmac} from 'node:crypto';
import {ApiError} from './http.js';

export function deploymentConfig(env=process.env){
 const demoAccess=env.APP_DEMO_ACCESS!=='false';
 const required=demoAccess?['DATABASE_URL']:['DATABASE_URL','APP_ACCESS_CODE','SESSION_SECRET','APP_ALLOWED_EMAILS'];
 const missing=required.filter(key=>!env[key]?.trim());if(missing.length)throw new ApiError(503,'Configure no servidor: '+missing.join(', ')+'.');
 let database;try{database=new URL(env.DATABASE_URL);}catch{throw new ApiError(503,'DATABASE_URL inválida.');}
 if(!['postgres:','postgresql:'].includes(database.protocol))throw new ApiError(503,'DATABASE_URL deve usar PostgreSQL.');
 if((env.APP_ACCESS_CODE&&env.APP_ACCESS_CODE.length<12)||(env.SESSION_SECRET&&env.SESSION_SECRET.length<32))throw new ApiError(503,'Use APP_ACCESS_CODE com pelo menos 12 caracteres e SESSION_SECRET com pelo menos 32.');
 const origins=[env.APP_ORIGIN,...['VERCEL_URL','VERCEL_PROJECT_PRODUCTION_URL','VERCEL_BRANCH_URL'].map(key=>env[key]&&'https://'+env[key])].filter(Boolean).map(value=>{
  try{const url=new URL(value);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error();return url.origin;}catch{throw new ApiError(503,'APP_ORIGIN deve ser a URL HTTPS do site.');}
 });
 if(!origins.length)throw new ApiError(503,'Configure APP_ORIGIN com a URL do site.');
 const emails=(env.APP_ALLOWED_EMAILS||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
 if((!demoAccess&&!emails.length)||emails.some(email=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new ApiError(503,'APP_ALLOWED_EMAILS deve conter e-mails separados por vírgula.');
 const demoEmail='demo@easylead.example';
 if(demoAccess&&!emails.includes(demoEmail))emails.push(demoEmail);
 // Stable, server-only signing key for the public prototype when no custom secret is set.
 const sessionSecret=env.SESSION_SECRET||createHmac('sha256',env.DATABASE_URL).update('easylead-demo-session-v1').digest('hex');
 const accessCode=env.APP_ACCESS_CODE||createHmac('sha256',sessionSecret).update('easylead-internal-access-v1').digest('hex');
 return {databaseUrl:env.DATABASE_URL,accessCode,sessionSecret,demoAccess,demoEmail,emails,origins,workspaceId:env.APP_WORKSPACE_ID?.trim()||'main',secure:origins.every(origin=>origin.startsWith('https:')),deepseekApiKey:env.DEEPSEEK_API_KEY||'',deepseekModel:env.DEEPSEEK_MODEL?.trim()||'deepseek-flash'};
}

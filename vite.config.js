import {readFile} from 'node:fs/promises';
import {defineConfig, loadEnv} from 'vite';
import {assistantMiddleware} from './server/assistant.js';
import {createDeploymentApi} from './server/deployment-api.js';

async function demoWorkspaceMiddleware(req,res,next) {
  if (req.url?.split('?')[0]!=='/api/easylead/demo-workspace') return next();
  const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  const host=req.headers.host || '';
  if (req.method!=='GET' || !local || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)
    || req.headers['sec-fetch-site']==='cross-site'
    || (req.headers.origin && req.headers.origin!=='http://'+host)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const data=await readFile(new URL('./.env.demo-leads.json',import.meta.url));
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(data);
  } catch {
    res.writeHead(404).end();
  }
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode,process.cwd(),'');
  const serverEnv={...env,...process.env};
  const cloud=serverEnv.VITE_APP_MODE==='server';
  const deployment=createDeploymentApi({env:serverEnv});
  const middleware = cloud
   ? (req,res,next)=>req.url?.startsWith('/api/easylead/')?deployment(req,res):next()
   : assistantMiddleware({apiKey:serverEnv.DEEPSEEK_API_KEY,model:serverEnv.DEEPSEEK_MODEL||'deepseek-flash'});
  return {
    // Polling also catches atomic file replacements on Windows; wait for complete writes.
    server:{watch:{usePolling:true,interval:100,awaitWriteFinish:{stabilityThreshold:200,pollInterval:40}}},
    plugins:[{
      name:'easylead-assistant',
      configureServer(server) { if(!cloud)server.middlewares.use(demoWorkspaceMiddleware); server.middlewares.use(middleware); },
      configurePreviewServer(server) { server.middlewares.use(demoWorkspaceMiddleware); server.middlewares.use(middleware); },
    }],
  };
});

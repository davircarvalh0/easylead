import {execFileSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const secrets={DATABASE_URL:'postgresql://example:BUILD_DATABASE_SECRET_SENTINEL@localhost/example',DEEPSEEK_API_KEY:'BUILD_DEEPSEEK_SECRET_SENTINEL',APP_ACCESS_CODE:'BUILD_ACCESS_CODE_SECRET_SENTINEL',SESSION_SECRET:'BUILD_SESSION_SECRET_SENTINEL_abcdefghijklmnopqrstuvwxyz'};
execFileSync(process.execPath,['scripts/vercel-build.mjs'],{stdio:'inherit',env:{...process.env,...secrets}});
const files=['dist/index.html',...(await readdir('dist/assets')).filter(name=>/\.(js|css)$/.test(name)).map(name=>'dist/assets/'+name)];
for(const file of files){const content=await readFile(file,'utf8');for(const value of Object.values(secrets))assert.ok(!content.includes(value),'Segredo indevidamente incluído em '+file);}
console.log('Build Vercel concluído sem credenciais no HTML, CSS ou JavaScript público.');

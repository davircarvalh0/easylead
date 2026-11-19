import {test,expect} from '@playwright/test';
import {seed} from '../src/domain.js';
import {applyWorkspaceCommand} from '../server/postgres.js';

test('modo Vercel autentica no servidor e persiste cadastros sem localStorage',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});let authenticated=false,current={state:structuredClone(seed),revision:2};
 await page.route('**/api/easylead/session',async route=>{
  const method=route.request().method();if(method==='POST'){expect(route.request().postDataJSON().password).toBe('test-access-code-123');authenticated=true;}if(method==='DELETE')authenticated=false;
  await route.fulfill({json:{session:authenticated?{authenticated:true,email:'user@example.com',loggedAt:1}:null}});
 });
 await page.route('**/api/easylead/workspace',async route=>{
  if(!authenticated)return route.fulfill({status:401,json:{error:'Entre novamente.'}});
  if(route.request().method()==='GET')return route.fulfill({json:current});
  const body=route.request().postDataJSON();expect(body.revision).toBe(current.revision);
  const result=applyWorkspaceCommand(current.state,body.command,body.args);current={state:result.state,revision:current.revision+1};
  return route.fulfill({json:{...current,result:result.result}});
 });
 await page.goto('/#/organizacao');
 await expect(page.getByRole('heading',{name:'Entrar no EasyLead'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Preencher acesso de demonstração'})).toHaveCount(0);
 await page.getByRole('textbox',{name:'E-mail',exact:true}).fill('user@example.com');
 await page.getByLabel('Código de acesso').fill('test-access-code-123');
 await page.getByRole('button',{name:'Entrar no EasyLead',exact:true}).click();
 await expect(page.getByRole('region',{name:'Assistente EasyLead'})).toBeVisible();
 await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name:'Organização',exact:true}).click();
 await page.getByRole('button',{name:'Adicionar setor'}).click();await page.getByRole('textbox',{name:'Nome do setor'}).fill('Pesquisa remota');await page.getByRole('button',{name:'Salvar setor'}).click();
 await expect(page.getByRole('region',{name:'Pesquisa remota',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Adicionar integrante'}).click();await page.getByLabel('Nome do integrante').fill('Pessoa remota');await page.getByRole('button',{name:'Salvar integrante'}).click();
 await expect(page.getByRole('region',{name:'Integrantes',exact:true})).toContainText('Pessoa remota');
 expect(current.state.members.at(-1).id).toBeTruthy();
 await page.reload();await expect(page.getByRole('region',{name:'Integrantes',exact:true})).toContainText('Pessoa remota');
 expect(await page.evaluate(()=>localStorage.getItem('central-citi-v1'))).toBe(null);
 expect(await page.evaluate(()=>localStorage.getItem('citi-all-session-v1'))).toBe(null);
});

test('falha do banco não apresenta carteira local como se estivesse conectada',async({page})=>{
 await page.route('**/api/easylead/session',route=>route.fulfill({json:{session:{authenticated:true,email:'user@example.com',loggedAt:1}}}));
 await page.route('**/api/easylead/workspace',route=>route.fulfill({status:503,json:{error:'Banco indisponível.'}}));
 await page.goto('/#/leads');await expect(page.getByRole('alert')).toHaveText('Banco indisponível.');await expect(page.locator('.lead-priority-metrics')).toHaveCount(0);
});


test('avaliador entra pela demo sem preencher campos e sem aviso de configuração',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});let authenticated=false;
 await page.route('**/api/easylead/session',async route=>{
  if(route.request().method()==='POST'){expect(route.request().postDataJSON()).toEqual({demo:true});authenticated=true;return route.fulfill({json:{session:{authenticated:true,email:'demo@easylead.example',loggedAt:1}}});}
  return route.fulfill(authenticated?{json:{session:{authenticated:true,email:'demo@easylead.example',loggedAt:1}}}:{status:503,json:{error:'Configure no servidor: SESSION_SECRET, APP_ACCESS_CODE.'}});
 });
 await page.route('**/api/easylead/workspace',route=>route.fulfill({json:{state:seed,revision:0}}));
 await page.goto('/');await expect(page.getByRole('button',{name:'Entrar como usuário de demonstração'})).toBeVisible();
 await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByLabel('E-mail',{exact:true})).toBeEmpty();await expect(page.getByLabel('Código de acesso')).toBeEmpty();
 await page.getByRole('button',{name:'Entrar como usuário de demonstração'}).click();
 await expect(page.getByRole('region',{name:'Assistente EasyLead'})).toBeVisible();
 await page.reload();await expect(page.getByRole('region',{name:'Assistente EasyLead'})).toBeVisible();
});

test('erro ao entrar pela demo apresenta mensagem simples',async({page})=>{
 await page.route('**/api/easylead/session',route=>route.fulfill(route.request().method()==='POST'?{status:503,json:{error:'Configure no servidor: APP_ACCESS_CODE.'}}:{json:{session:null}}));
 await page.goto('/');await page.getByRole('button',{name:'Entrar como usuário de demonstração'}).click();
 await expect(page.getByRole('alert')).toHaveText('Não foi possível entrar agora. Tente novamente em instantes.');
});


for(const width of [390,747,1024,1440])test('layout do login mantém campos e demo visíveis '+width,async({page},testInfo)=>{
 await page.setViewportSize({width,height:844});
 await page.route('**/api/easylead/session',async route=>{await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({json:{session:null}});});
 await page.goto('/');
 const button=page.getByRole('button',{name:'Entrar como usuário de demonstração'});await expect(button).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('login.png')});
 await expect(button).toBeInViewport({ratio:1});await expect(page.getByLabel('E-mail',{exact:true})).toBeInViewport({ratio:1});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});


test('carregamento lento mantém só a marca e abre a IA sem página intermediária',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/easylead/session',route=>route.fulfill({json:{session:{authenticated:true,email:'demo@easylead.example',loggedAt:1}}}));
 let release;const wait=new Promise(resolve=>release=resolve);
 await page.route('**/api/easylead/workspace',async route=>{await wait;await route.fulfill({json:{state:seed,revision:0}});});
 await page.goto('/#/easylead');
 const loading=page.getByRole('status',{name:'Carregando EasyLead'});await expect(loading).toBeVisible();
 await expect(page.getByText('Carteira principal',{exact:true})).toHaveCount(0);await expect(page.getByText('Carregando leads e projetos…',{exact:true})).toHaveCount(0);
 await expect(page.locator('.wave-mesh')).toHaveCSS('visibility','hidden');
 release();await expect(page.getByRole('region',{name:'Assistente EasyLead'})).toBeVisible();await expect(loading).toHaveCount(0);
});

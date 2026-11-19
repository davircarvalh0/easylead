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

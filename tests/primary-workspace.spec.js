import {test,expect} from '@playwright/test';
import {seed} from '../src/domain.js';

test('abre a demo como principal sem parâmetro e preserva alterações após recarregar',async({page})=>{
 const demo={...structuredClone(seed),demoWorkspace:true,demoRevision:1,leads:[{...seed.leads[0],id:'demo-lead',name:'Oportunidade demo',company:'Empresa demo'}],projects:[]};
 await page.addInitScript(()=>{localStorage.setItem('citi-all-session-v1',JSON.stringify({authenticated:true,email:'teste@example.com',loggedAt:1}));if(!localStorage.getItem('migration-test-seeded')){localStorage.setItem('central-citi-v1',JSON.stringify({version:1,areas:[],members:[],leads:[{id:'old',name:'Anterior',company:'Empresa anterior',contact:'old@example.com',stage:'Novo'}],projects:[]}));localStorage.setItem('migration-test-seeded','true');}});
 let requests=0;
 await page.route('**/api/easylead/demo-workspace',route=>{requests++;return route.fulfill({json:demo});});
 await page.goto('/?carteira=demo#/leads/prospectos');
 await expect(page).toHaveURL(url=>!url.searchParams.has('carteira'));
 await expect(page.getByText('Empresa demo',{exact:true}).first()).toBeVisible();
 await expect(page.getByText('Empresa anterior',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Carteira de demonstração',{exact:true})).toHaveCount(0);
 const backup=await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1-before-demo-promotion')));
 expect(backup.leads[0].id).toBe('old');
 await page.goto('/#/leads/demo-lead');
 const form=page.getByRole('region',{name:'Editar lead',exact:true});
 await form.getByLabel('Nome da empresa *').fill('Empresa principal editada');
 await form.getByRole('button',{name:'Salvar lead',exact:true}).click();
 await page.reload();
 await expect(page.getByRole('region',{name:'Detalhes do lead',exact:true})).toContainText('Empresa principal editada');
 expect(requests).toBe(1);
});

test('falha ao carregar a base permite tentar novamente sem substituir a carteira antiga',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('citi-all-session-v1',JSON.stringify({authenticated:true,email:'teste@example.com',loggedAt:1})));
 let failing=true;
 await page.route('**/api/easylead/demo-workspace',route=>failing?route.fulfill({status:503,json:{error:'indisponível'}}):route.fulfill({json:{...seed,demoWorkspace:true}}));
 await page.goto('/#/leads');
 await expect(page.getByRole('alert')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('central-citi-v1'))).toBe(null);
 failing=false;await page.getByRole('button',{name:'Tentar novamente'}).click();
 await expect(page.locator('.lead-priority-metrics')).toBeVisible();
});

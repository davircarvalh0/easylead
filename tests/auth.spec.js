import {test, expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';

async function fill(page) {
  await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
}
const heading = page => page.getByRole('heading',{level:1,name:'Visão geral'});
test('login inválido, revelação única, foco, rotas, reload e novo login', async({page})=>{
  await page.goto('/#/projetos');
  await expect(page).toHaveTitle('CITi/all');
  await page.getByLabel('E-mail',{exact:true}).fill('invalido');
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(page.getByRole('alert')).toContainText('e-mail válido');
  await expect(page.getByLabel('E-mail',{exact:true})).toHaveValue('invalido');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('E-mail',{exact:true}).fill('demo@example.com');
  await page.getByLabel('Código de acesso').fill('123');
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(page.getByRole('alert')).toContainText('4 caracteres');
  await fill(page);
  await page.evaluate(()=>{
    window.entryEvents=[];
    new MutationObserver(()=>{
      const visible=!!document.querySelector('.brand-entry');
      if(window.entryEvents.at(-1)?.visible!==visible) window.entryEvents.push({visible,time:performance.now()});
    }).observe(document.getElementById('root'),{subtree:true,childList:true});
  });
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(heading(page)).toBeFocused();
  const events=await page.evaluate(()=>window.entryEvents);
  const start=events.find(e=>e.visible), end=events.find(e=>!e.visible&&e.time>start.time);
  expect(end.time-start.time).toBeLessThanOrEqual(1800);
  expect(end.time-start.time).toBeGreaterThan(1450);
  writeFileSync('evidencias/citi-duracao.json',JSON.stringify({durationMs:end.time-start.time,limitMs:1800,method:'MutationObserver: montagem e remoção da abertura no navegador'},null,2));
  await expect(page).toHaveURL(/#\/$/);
  await page.getByRole('link',{name:'Projetos',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('heading',{level:1,name:'Projetos'})).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link',{name:'Visão geral',exact:true}).click();
  await expect(heading(page)).toBeFocused();
  await page.reload();await expect(heading(page)).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('citi-all-session-v1')));
  expect(stored.password).toBeUndefined();
  await page.getByRole('button',{name:'Sair',exact:true}).click();
  await expect(page.getByLabel('E-mail',{exact:true})).toBeFocused();
  await fill(page);await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Pular abertura'})).toBeFocused();
  await page.keyboard.press('Enter');await expect(heading(page)).toBeFocused();
});

for(const width of [360,1280]) test(`entrada reduzida e primeira dobra ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.screenshot({path:`evidencias/citi-login-${width}.png`});
  await fill(page);await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(heading(page)).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for(const item of [page.locator('.stats'),page.locator('.average-value')]) {
    const box=await item.boundingBox();expect(box.y+box.height).toBeLessThan(900);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`evidencias/citi-overview-${width}.png`});
  await page.getByRole('button',{name:/Adicionar exemplos/}).click();
  await page.screenshot({path:`evidencias/citi-overview-demo-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/Projeto Discovery/}).click();
  await page.getByRole('link',{name:'Explorar etapa'}).click();
  await expect(page.getByRole('heading',{level:1,name:'Projetos'})).toBeFocused();
});

test('armazenamento bloqueado e sessão corrompida permitem corrigir o login',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('citi-all-session-v1','{');});
  await page.goto('/');await fill(page);
  await page.evaluate(()=>{window.save=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')};});
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(page.getByRole('alert')).toContainText('salvar a sessão');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(()=>{Storage.prototype.setItem=window.save;});
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(heading(page)).toBeFocused();
});

test('reload durante a abertura e mudança de movimento reduzido',async({page})=>{
  await page.goto('/');await fill(page);
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.reload();
  await expect(heading(page)).toBeFocused();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Sair',exact:true}).click();await fill(page);
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.emulateMedia({reducedMotion:'reduce'});
  await expect(heading(page)).toBeFocused();await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('vídeo curto da entrada',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:'test-results/entry-video',size:{width:1280,height:900}}});
  const page=await context.newPage();await page.goto('/');await fill(page);
  await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
  await expect(heading(page)).toBeFocused();
  const video=page.video();await context.close();await video.saveAs('evidencias/citi-transicao.webm');
});

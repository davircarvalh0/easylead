import {test, expect} from '@playwright/test';

async function fill(page) {
  await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
}
const heading = page => page.getByRole('heading',{level:1,name:'Como posso ajudar?'});
test('login inválido, revelação única, foco, rotas, reload e novo login', async({page})=>{
  await page.goto('/?noWebGL#/projetos');
  await expect(page).toHaveTitle('EasyLead');
  await page.getByLabel('E-mail',{exact:true}).fill('invalido');
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(page.getByRole('alert')).toContainText('e-mail válido');
  await expect(page.getByLabel('E-mail',{exact:true})).toHaveValue('invalido');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('E-mail',{exact:true}).fill('demo@example.com');
  await page.getByLabel('Código de acesso').fill('123');
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(page.getByRole('alert')).toContainText('4 caracteres');
  await fill(page);
  await page.evaluate(()=>{
    window.entryEvents=[];
    new MutationObserver(()=>{
      const visible=!!document.querySelector('.login-transition');
      if(window.entryEvents.at(-1)?.visible!==visible) window.entryEvents.push({visible,time:performance.now()});
    }).observe(document.getElementById('root'),{subtree:true,childList:true});
  });
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(heading(page)).toBeFocused();
  const events=await page.evaluate(()=>window.entryEvents);
  const start=events.find(e=>e.visible), end=events.find(e=>!e.visible&&e.time>start.time);
  expect(end.time-start.time).toBeLessThanOrEqual(1100);
  expect(end.time-start.time).toBeGreaterThan(450);
  await expect(page).toHaveURL(/#\/easylead$/);
  await page.getByRole('link',{name:'Projetos',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('heading',{level:1,name:'Projetos'})).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link',{name:'Leads',exact:true}).click();
  const leads = page.getByRole('heading',{level:1,name:'Leads'});
  await expect(leads).toBeFocused();
  await page.reload();await expect(leads).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('citi-all-session-v1')));
  expect(stored.password).toBeUndefined();
  await page.getByRole('button',{name:'Menu do perfil'}).click();
  await page.getByRole('button',{name:'Sair',exact:true}).click();
  await expect(page.getByLabel('E-mail',{exact:true})).toBeFocused();
  await fill(page);await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');await expect(page.getByRole('dialog')).toBeFocused();
  await expect(page.getByRole('button',{name:'Pular abertura'})).toHaveCount(0);
  await expect(heading(page)).toBeFocused();
});

for(const width of [360,1280]) test(`entrada reduzida e primeira dobra ${width}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.screenshot({path:testInfo.outputPath('login.png')});
  await fill(page);await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(heading(page)).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const box=await page.getByRole('textbox',{name:'Mensagem para o EasyLead'}).boundingBox();
  expect(box.y+box.height).toBeLessThan(900);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('easylead.png')});
  await page.getByRole('link',{name:'Projetos',exact:true}).click();
  await expect(page.getByRole('heading',{level:1,name:'Projetos'})).toBeFocused();
});

test('armazenamento bloqueado e sessão corrompida permitem corrigir o login',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('citi-all-session-v1','{');});
  await page.goto('/');await fill(page);
  await page.evaluate(()=>{window.save=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')};});
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(page.getByRole('alert')).toContainText('salvar a sessão');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(()=>{Storage.prototype.setItem=window.save;});
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(heading(page)).toBeFocused();
});

test('reload durante a abertura e mudança de movimento reduzido',async({page})=>{
  await page.goto('/?noWebGL');await fill(page);
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.reload();
  await expect(heading(page)).toBeFocused();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Menu do perfil'}).click();
  await page.getByRole('button',{name:'Sair',exact:true}).click();await fill(page);
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.emulateMedia({reducedMotion:'reduce'});
  await expect(heading(page)).toBeFocused();await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('vídeo curto da entrada',async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:'test-results/entry-video',size:{width:1280,height:900}}});
  const page=await context.newPage();await page.goto('/');await expect(page.getByRole('region',{name:'Entrar no EasyLead'})).toBeVisible();await fill(page);
  await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
  await expect(heading(page)).toBeFocused();
  const video=page.video();await context.close();await video.saveAs(testInfo.outputPath('entrada.webm'));
});

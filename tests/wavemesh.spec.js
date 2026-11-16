import {test,expect} from '@playwright/test';
for(const width of [360,1280]) test(`WaveMesh persistente, toque e teclado ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/?noWebGL');
 const canvas=page.locator('canvas[data-wavemesh]');await expect(canvas).toHaveCount(1);
 await page.evaluate(()=>{window.originalWave=document.querySelector('[data-wavemesh]');});
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
 await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
 await expect(page.locator('.passage-visual')).toHaveAttribute('data-mode','light');
 await page.keyboard.press('Tab');await expect(page.getByRole('dialog',{name:'Entrando no CITi/all'})).toBeFocused();
 await page.keyboard.press('Enter');
 for(let i=0;i<3;i++)for(const name of ['Leads','Projetos','Visão geral']){
  await page.getByRole('link',{name,exact:true}).click();
  await expect(page.getByRole('heading',{level:1,name})).toBeFocused();
 }
 await page.getByRole('link',{name:'Leads',exact:true}).click();
 await page.getByRole('button',{name:'Adicionar comparação Aurora e Horizonte'}).click();
 for(const name of ['Leads','Projetos']){
  await page.getByRole('link',{name,exact:true}).click();
  await expect(page.getByRole('heading',{level:1,name})).toBeVisible();
  const small=page.locator('.value-block').filter({hasText:'Loja Horizonte'});await expect(small).toBeVisible();
  await expect.poll(async()=>(await small.boundingBox())?.height||0).toBeGreaterThanOrEqual(68);
  await page.screenshot({path:`evidencias/wavemesh-${name}-${width}.png`,fullPage:true});
  await small.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');await expect(small).toBeFocused();
 }
 expect(await page.evaluate(()=>window.originalWave===document.querySelector('[data-wavemesh]'))).toBe(true);
 await expect(canvas).toHaveCount(1);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(canvas).toHaveAttribute('data-motion','static');
 const image=await canvas.evaluate(c=>c.toDataURL());await page.waitForTimeout(150);
 expect(await canvas.evaluate(c=>c.toDataURL())).toBe(image);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
 expect(await canvas.evaluate(c=>c.toDataURL())).not.toBe(image);
});
test('toque real no menor bloco e pausa com página oculta',async({browser})=>{
 const context=await browser.newContext({viewport:{width:360,height:900},isMobile:true,hasTouch:true});
 const page=await context.newPage();await page.goto('/?noWebGL');
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).tap();await page.getByRole('button',{name:'Entrar no CITi/all'}).tap();
 await expect(page.getByRole('heading',{level:1,name:'Visão geral'})).toBeFocused();
 await page.getByRole('link',{name:'Leads',exact:true}).tap();await page.getByRole('button',{name:'Adicionar comparação Aurora e Horizonte'}).tap();
 await page.locator('.value-block').filter({hasText:'Loja Horizonte'}).tap();await expect(page.getByRole('dialog')).toBeVisible();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const canvas=page.locator('[data-wavemesh]');const before=await canvas.evaluate(c=>c.toDataURL());await page.waitForTimeout(180);
 expect(await canvas.evaluate(c=>c.toDataURL())===before).toBe(true);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(180);
 expect(await canvas.evaluate(c=>c.toDataURL())===before).toBe(false);await context.close();
});
test('falha do chunk 3D mantém alternativa leve e login utilizável',async({page})=>{
 await page.route('**/LoginScene*',route=>route.abort());await page.goto('/');
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
 await expect(page.locator('.passage-visual')).toHaveAttribute('data-mode','light');
 await expect(page.getByRole('heading',{level:1,name:'Visão geral'})).toBeFocused();
});

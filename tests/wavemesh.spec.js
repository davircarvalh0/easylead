import {test,expect} from '@playwright/test';
for(const width of [360,1280]) test(`WaveMesh persistente, toque e teclado ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/?noWebGL');
 const canvas=page.locator('canvas[data-wavemesh]');await expect(canvas).toHaveCount(1);
 await page.evaluate(()=>{window.originalWave=document.querySelector('[data-wavemesh]');});
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
 await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
 await expect(page.getByRole('dialog',{name:'Entrando no EasyLead'})).toBeVisible();
 await page.keyboard.press('Tab');await expect(page.getByRole('dialog',{name:'Entrando no EasyLead'})).toBeFocused();
 await page.keyboard.press('Enter');
 for(let i=0;i<3;i++)for(const name of ['Projetos','EasyLead','Leads']){
  await page.getByRole('link',{name,exact:true}).click();
  await expect(page.getByRole('heading',{level:1,name:name==='EasyLead' ? 'Como posso ajudar?' : name})).toBeFocused();
 }
 await page.getByRole('link',{name:'EasyLead',exact:true}).click();
 const attach=page.getByRole('button',{name:'Anexos',exact:true});
 await expect.poll(async()=>(await attach.boundingBox())?.height||0).toBeGreaterThanOrEqual(40);
 await page.screenshot({path:testInfo.outputPath('wavemesh-easylead.png')});
 await attach.press('Enter');
 await expect(page.getByRole('button',{name:'Anexar arquivos'})).toBeVisible();
 await attach.press('Escape');
 await expect(attach).toBeFocused();
 await expect(page.locator('.studio-layout')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await expect(page.locator('.wave-mesh')).toHaveCSS('pointer-events','none');
 const panelAlpha=await page.locator('.agent-composer').evaluate(panel=>Number(getComputedStyle(panel).backgroundColor.split(',').at(-1)?.replace(')','')));
 expect(panelAlpha).toBeGreaterThan(.6);
 expect(panelAlpha).toBeLessThan(1);
 expect(await page.evaluate(()=>window.originalWave===document.querySelector('[data-wavemesh]'))).toBe(true);
 await expect(canvas).toHaveCount(1);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(canvas).toHaveAttribute('data-motion','static');
 const image=await canvas.evaluate(c=>c.toDataURL());await page.waitForTimeout(150);
 expect(await canvas.evaluate(c=>c.toDataURL())).toBe(image);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
 expect(await canvas.evaluate(c=>c.toDataURL())).not.toBe(image);
});
test('toque real no botão de anexo e pausa com página oculta',async({browser})=>{
 const context=await browser.newContext({viewport:{width:360,height:900},isMobile:true,hasTouch:true});
 const page=await context.newPage();await page.goto('/?noWebGL');
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).tap();await page.getByRole('button',{name:'Entrar no EasyLead'}).tap();
 await expect(page.getByRole('heading',{level:1,name:'Como posso ajudar?'})).toBeFocused();
 await page.getByRole('button',{name:'Anexos',exact:true}).tap();
 await expect(page.getByRole('button',{name:'Anexar arquivos'})).toBeVisible();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const canvas=page.locator('[data-wavemesh]');const before=await canvas.evaluate(c=>c.toDataURL());await page.waitForTimeout(180);
 expect(await canvas.evaluate(c=>c.toDataURL())===before).toBe(true);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(180);
 expect(await canvas.evaluate(c=>c.toDataURL())===before).toBe(false);await context.close();
});
test('login funciona com o fundo de reserva',async({page})=>{
 await page.goto('/?noWebGL');
 await expect(page.locator('.login-art canvas')).toBeHidden();
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
 await expect(page.getByRole('dialog',{name:'Entrando no EasyLead'})).toBeVisible();
 await expect(page.getByRole('heading',{level:1,name:'Como posso ajudar?'})).toBeFocused();
});

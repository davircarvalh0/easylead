import {test, expect} from './session-fixture.js';

for (const width of [360,1280]) test(`órbita: seleção, pausa e retorno em ${width}`, async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/#/organizacao');
 const scene=page.locator('.citi-orb');
 await expect(scene).toHaveClass(/is-live/);
 const node=scene.locator('.atom-node').first();
 const position=()=>node.evaluate(el=>el.style.left+' '+el.style.top);
 const start=await position();await page.waitForTimeout(250);expect(await position()).not.toBe(start);
 await node.focus();const focused=await position();await page.waitForTimeout(200);expect(await position()).toBe(focused);
 await page.keyboard.press('Enter');await expect(page.locator('.subarea-atom-detail')).toBeVisible();
 await expect(page.getByLabel('Subárea (obrigatória)')).toHaveValue('a0');
 await page.getByLabel('Nome (obrigatório)').fill('Pessoa Orbital');
 await page.getByRole('button',{name:'Salvar integrante'}).click();
 await expect(node).toContainText('2 integrantes');
 const sizes=await scene.locator('.atom-node').evaluateAll(nodes=>nodes.map(n=>parseFloat(n.style.getPropertyValue('--atom-desktop'))));
 expect(sizes[0]).toBeGreaterThan(sizes[1]);
 await page.reload();await expect(node).toContainText('2 integrantes');
 await page.goto('/#/organizacao');await expect(scene).toHaveClass(/is-live/);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const hidden=await position();await page.waitForTimeout(200);expect(await position()).toBe(hidden);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(250);expect(await position()).not.toBe(hidden);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(scene).toHaveClass(/is-static/);
 await expect(scene.locator('canvas')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('toque e perda do contexto mantêm as ações',async({browser})=>{
 const context=await browser.newContext({viewport:{width:360,height:900},isMobile:true,hasTouch:true});
 const {activeSession}=await import('./session-fixture.js');await activeSession(context);
 const page=await context.newPage();await page.goto('/#/organizacao');
 await expect(page.locator('.citi-orb')).toHaveClass(/is-live/);
 const box=await page.locator('.atom-node').first().boundingBox();
 await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await expect(page.locator('.subarea-atom-detail')).toBeVisible();
 await page.locator('.citi-orb canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await expect(page.locator('.citi-orb')).toHaveClass(/is-static/);
 await page.locator('.atom-node').nth(1).tap();await expect(page.getByLabel('Subárea (obrigatória)')).toHaveValue('a1');
 await context.close();
});


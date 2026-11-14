import {test,expect} from '@playwright/test';

for(const width of [360,1280]) test(`abertura inicial antes do formulário ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 // Hold the timer while capturing the first frame, rather than racing 720 ms.
 await page.clock.install();await page.goto('/?noWebGL');
 const wave=page.locator('[data-wavemesh]');
 await expect(page.locator('.initial-opening')).toBeVisible();
 await expect(page.locator('.initial-opening .auth-brand')).toContainText('/all');
 await expect(page.locator('.auth-card')).toHaveCSS('opacity','0');
 await expect(page.getByLabel('E-mail',{exact:true})).toBeAttached();
 await wave.evaluate(c=>{window.openingWave=c;});
 await page.screenshot({path:`evidencias/abertura-inicial-${width}.png`});
 await page.clock.runFor(750);
 await expect(page.locator('.initial-opening')).toHaveCount(0);
 await page.clock.runFor(300);
 await expect(page.locator('.auth-card')).toHaveCSS('opacity','1');
 await expect(page.getByLabel('E-mail',{exact:true})).toBeFocused();
 expect(await wave.evaluate(c=>c===window.openingWave)).toBe(true);
 await page.screenshot({path:`evidencias/abertura-login-${width}.png`});
});

test('formulário acessível por teclado durante abertura e reduced-motion dinâmico',async({page})=>{
 await page.clock.install();await page.goto('/?noWebGL');
 await expect(page.locator('.initial-opening')).toBeVisible();
 await page.keyboard.press('Tab');
 await expect(page.getByLabel('E-mail',{exact:true})).toBeFocused();
 await expect(page.locator('.initial-opening')).toHaveCount(0);
 await page.reload();await expect(page.locator('.initial-opening')).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.initial-opening')).toHaveCount(0);
 await expect(page.locator('.auth-card')).toHaveCSS('opacity','1');
 await page.reload();await expect(page.locator('.initial-opening')).toHaveCount(0);
});

test('abertura inicial pausa quando oculta',async({page})=>{
 await page.clock.install();await page.goto('/?noWebGL');
 await page.clock.runFor(200);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(1000);await expect(page.locator('.initial-opening')).toBeVisible();
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(550);await expect(page.locator('.initial-opening')).toHaveCount(0);
});

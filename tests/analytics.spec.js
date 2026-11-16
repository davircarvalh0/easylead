import {test,expect} from './session-fixture.js';
for(const width of [1280,390]) test(`barra flutuante no fim e metas ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',hasTouch:width===390});
 await context.addInitScript(()=>localStorage.setItem('citi-all-session-v1',JSON.stringify({authenticated:true,email:'teste@example.com',loggedAt:1})));
 const page=await context.newPage();await page.goto('/#/');
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 const nav=page.getByRole('navigation',{name:'Navegação principal'});
 await expect(nav).toBeVisible();const rect=await nav.boundingBox();expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(width);expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThan(844);
 const metas=nav.getByRole('link',{name:'Metas',exact:true});await metas.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Metas',exact:true})).toBeVisible();
 await page.getByLabel('Objetivo · Valor contratado',{exact:true}).fill('100000');await page.getByLabel('Período · Valor contratado',{exact:true}).fill('Novembro de 2026');await page.getByRole('button',{name:'Salvar meta'}).first().click();
 await page.reload();await expect(page.getByLabel('Objetivo · Valor contratado',{exact:true})).toHaveValue('100000');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`evidencias/analytics-metas-${width}.png`,fullPage:true});await context.close();
});

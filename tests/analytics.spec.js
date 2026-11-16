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

test('history renders dated months and falls back for insufficient data',async({page})=>{
 const {seed}=await import('../src/domain.js');
 const sample={...structuredClone(seed),projects:[
  {id:'history-a',name:'January',leadId:'l0',contractStatus:'Contratado',contractValue:54000,convertedAt:'2026-01-05'},
  {id:'history-b',name:'March',leadId:'l1',contractStatus:'Contratado',contractValue:72000,convertedAt:'2026-03-05'},
  {id:'undated',name:'Undated',leadId:'l2',contractStatus:'Contratado',contractValue:99000}
 ]};
 await page.goto('/');
 await page.evaluate(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),sample);
 await page.goto('/#/contratos');await page.reload();
 const chart=page.getByRole('img',{name:/Valor contratado por/});
 await expect(chart).toBeVisible();
 const history=page.locator('section.analytics-card').filter({has:chart});
 await expect(history.locator('li')).toHaveCount(2);
 await expect(history.locator('li').first()).toContainText('2026-01');
 await expect(history.locator('li').last()).toContainText('2026-03');
 await expect(history.locator('li').first()).toContainText('54.000,00');
 for(const projects of [[sample.projects[0]],[]]) {
  await page.evaluate(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),{...sample,projects});await page.reload();
  await expect(chart).toHaveCount(0);
  await expect(page.locator('.analytics-card .empty').filter({hasText:/pelo menos dois meses/})).toBeVisible();
 }
});

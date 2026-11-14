import {test,expect} from '@playwright/test';

test('fade sobreposto preserva canvas e bloqueia interação até entregar foco',async({page})=>{
 await page.goto('/?noWebGL');
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
 await page.evaluate(()=>{window.wave=document.querySelector('[data-wavemesh]')});
 await page.evaluate(()=>{
  window.fadeSamples=[];
  const sample=()=>{
   const app=document.querySelector('.app-entry'),overlay=document.querySelector('.brand-entry');
   if(overlay)window.fadeSamples.push([+getComputedStyle(app).opacity,+getComputedStyle(overlay).opacity]);
   if(!window.fadeSamples.length||overlay)requestAnimationFrame(sample);
  };requestAnimationFrame(sample);
 });
 await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
 await expect(page.locator('h1')).toBeFocused();
 const samples=await page.evaluate(()=>window.fadeSamples);
 expect(samples.some(([a,b])=>a>0.05&&a<0.95&&b>0.05&&b<0.95)).toBe(true);
 expect(samples.every(([a,b])=>a+b>.95)).toBe(true);
 expect(await page.evaluate(()=>window.wave===document.querySelector('[data-wavemesh]'))).toBe(true);
 await expect(page.locator('h1')).toBeFocused();
});

test('indicador segue trocas rápidas, histórico, teclado e destinos dos módulos',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();await page.getByRole('button',{name:'Entrar no CITi/all'}).click();
 const nav=page.getByRole('navigation');
 for(const label of ['Leads','Projetos','Organização','Integrantes'])await nav.getByRole('link',{name:label,exact:true}).click();
 await page.goBack();await expect(nav.locator('[aria-current]')).toHaveText('Organização');
 await page.goForward();await expect(nav.locator('[aria-current]')).toHaveText('Integrantes');
 await nav.getByRole('link',{name:'Visão geral',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(page.locator('h1')).toBeFocused();
 await expect.poll(async()=>await nav.evaluate(el=>{const link=el.querySelector('[aria-current]'),pill=el.querySelector('.nav-slider-pill');return Math.abs(link.getBoundingClientRect().x-pill.getBoundingClientRect().x)<2})).toBe(true);
 await page.getByRole('button',{name:/Adicionar exemplos/}).click();
 for(const selector of ['.stats a','.funnel a','.priority-row','.module-projects .card','.owner-links a']){
  const href=await page.locator(selector).first().getAttribute('href');await page.locator(selector).first().click();expect(new URL(page.url()).hash).toBe(href);await page.goBack();
 }
 await expect(page.locator('.bento-module')).toHaveCount(4);
});

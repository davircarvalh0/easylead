import {test,expect} from '@playwright/test';

test('fade sobreposto preserva canvas e bloqueia interação até entregar foco',async({page})=>{
 await page.goto('/?noWebGL');
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
 await page.evaluate(()=>{window.wave=document.querySelector('[data-wavemesh]')});
 await page.evaluate(()=>{
  window.fadeSamples=[];
  const sample=()=>{
   const app=document.querySelector('.app-entry'),overlay=document.querySelector('.login-transition');
   if(overlay)window.fadeSamples.push([+getComputedStyle(app).opacity,+getComputedStyle(overlay).opacity]);
   if(!window.fadeSamples.length||overlay)requestAnimationFrame(sample);
  };requestAnimationFrame(sample);
 });
 await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
 await expect(page.locator('h1')).toBeFocused();
 const samples=await page.evaluate(()=>window.fadeSamples);
 expect(samples.some(([a,b])=>a===1&&b>0.05&&b<0.95)).toBe(true);
 expect(samples.every(([a,b])=>a+b>.95)).toBe(true);
 expect(await page.evaluate(()=>window.wave===document.querySelector('[data-wavemesh]'))).toBe(true);
 await expect(page.locator('h1')).toBeFocused();
});

test('indicador segue trocas rápidas, histórico, teclado e destinos da navbar',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
 const nav=page.getByRole('navigation');
 for(const label of ['Leads','Projetos','Organização'])await nav.getByRole('link',{name:label,exact:true}).click();
 await page.goBack();await expect(nav.locator('[aria-current]')).toHaveText('Projetos');
 await page.goForward();await expect(nav.locator('[aria-current]')).toHaveText('Organização');
 await nav.getByRole('link',{name:'EasyLead',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(page.locator('h1')).toBeFocused();
 await expect.poll(async()=>await nav.evaluate(el=>{const link=el.querySelector('[aria-current]'),pill=el.querySelector('.nimbus-drop');return Math.abs(link.getBoundingClientRect().x-pill.getBoundingClientRect().x)<2})).toBe(true);
 await expect(page).toHaveURL(/#\/easylead$/);
 await nav.getByRole('link',{name:'Leads',exact:true}).click();
 await expect(page).toHaveURL(/#\/leads$/);
 await expect(nav.getByRole('link',{name:'Leads',exact:true})).toHaveAttribute('aria-current','page');
});

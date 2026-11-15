import {seed} from '../src/domain.js';
import {test,expect,activeSession} from './session-fixture.js';
test('primeira etapa zero: escala máxima, ordem, mouse e teclado',async({browser})=>{
 const context=await browser.newContext();await activeSession(context);
 const state=structuredClone(seed);
 state.leads=Array.from({length:10},(_,i)=>({...seed.leads[0],id:'zero-'+i,stage:i<2?'Em contato':i<5?'Proposta':'Ganho'}));
 await context.addInitScript(s=>localStorage.setItem('central-citi-v1',JSON.stringify(s)),state);
 const page=await context.newPage();await page.goto('/#/leads');
 const buttons=page.locator('.funnel-stage');
 for(const [i,p] of [0,20,30,50,0].entries()) await expect(buttons.nth(i)).toHaveAccessibleName(new RegExp(p+'% de participação'));
 expect(await buttons.evaluateAll(bs=>bs.map(b=>Number(b.dataset.width)))).toEqual([0,35.2,52.8,88,0]);
 await expect(buttons.nth(0).locator('path')).toHaveCount(3);
 await buttons.nth(3).click();await expect(buttons.nth(3)).toHaveAttribute('aria-pressed','true');
 await buttons.nth(1).focus();await page.keyboard.press('Space');await expect(buttons.nth(1)).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.lead-funnel .cards a')).toHaveCount(2);
 await context.close();
});

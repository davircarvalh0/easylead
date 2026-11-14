import {test,expect} from '@playwright/test';
import {mkdir,copyFile} from 'node:fs/promises';
for(const width of [1280,390]) test(`evidência integrada ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:'test-results/integrated-video',size:{width,height:900}},hasTouch:width===390,isMobile:width===390});
 const page=await context.newPage();const video=page.video();
 await page.goto('/');await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
 await page.getByRole('button',{name:'Entrar no CITi/all'}).click();await expect(page.locator('h1')).toBeFocused();
 await page.getByRole('link',{name:'Organização',exact:true}).click();
 const scene=page.locator('.citi-orb');await expect(scene).toHaveClass(/is-live/);
 await page.waitForTimeout(1800);
 await page.screenshot({path:`evidencias/rodada/orbita-${width}.png`,fullPage:true});
 const node=scene.locator('.atom-node').first();
 if(width===390){const b=await node.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}else {await node.focus();await page.keyboard.press('Enter');}
 await expect(page.locator('.subarea-atom-detail')).toBeVisible();
 await page.getByRole('link',{name:'Integrantes',exact:true}).click();
 await page.getByRole('combobox',{name:'Sub\u00e1rea (obrigat\u00f3ria)',exact:true}).selectOption('a0');
 await page.getByLabel('Nome (obrigatório)').fill('Integrante da rodada');await page.getByRole('button',{name:'Salvar integrante'}).click();await page.getByRole('link',{name:'Organiza\u00e7\u00e3o',exact:true}).click();await expect(node).toContainText('2 integrantes');
 await page.getByRole('link',{name:'Leads',exact:true}).click();await expect(page.getByRole('region',{name:'Funil de leads'})).toBeVisible();
 // Let the route entrance finish before recording the final visual evidence.
 await page.waitForTimeout(1500);await page.screenshot({path:`evidencias/rodada/funil-${width}.png`,fullPage:true});
 await context.close();await mkdir('evidencias/rodada',{recursive:true});await copyFile(await video.path(),`evidencias/rodada/percurso-${width}.webm`);
});

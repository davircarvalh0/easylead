import {test,expect} from '@playwright/test';
import {mkdir,copyFile} from 'node:fs/promises';
test.setTimeout(60000);
for(const width of [1280,390]) test(`evidência integrada ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:'test-results/integrated-video',size:{width,height:900}},hasTouch:width===390,isMobile:width===390});
 const page=await context.newPage();const video=page.video();
 await page.goto('/');await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();
 await page.getByRole('button',{name:'Entrar no EasyLead'}).click();await expect(page.locator('h1')).toBeFocused();
 await page.getByRole('link',{name:'Organização',exact:true}).click();
 const scene=page.getByRole('list',{name:'Setores'});await expect(scene.locator('canvas')).toHaveCount(5);
 await page.waitForTimeout(1800);
 await page.screenshot({path:`evidencias/rodada/orbita-${width}.png`,fullPage:true});
 const node=scene.getByRole('link',{name:/Inovação/});
 if(width===390){const b=await node.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}else {await node.focus();await page.keyboard.press('Enter');}
 await expect(page.getByRole('region',{name:'Inovação',exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Projetos vinculados'})).toBeVisible();
 await page.getByRole('navigation',{name:'Caminho da página'}).getByRole('link',{name:'Organização'}).click();
 await expect(node).toBeVisible();
 await page.getByRole('link',{name:'Leads',exact:true}).click();await expect(page.getByRole('region',{name:'Funil de leads'})).toBeVisible();
 // Let the route entrance finish before recording the final visual evidence.
 await page.waitForTimeout(1500);await page.screenshot({path:`evidencias/rodada/funil-${width}.png`,fullPage:true});
 await page.goto('/#/leads?segmento=N%C3%A3o+classificado');
 await page.screenshot({path:`evidencias/rodada/funil-filtrado-${width}.png`,fullPage:true});
 await context.close();await mkdir('evidencias/rodada',{recursive:true});await copyFile(await video.path(),`evidencias/rodada/percurso-${width}.webm`);
});



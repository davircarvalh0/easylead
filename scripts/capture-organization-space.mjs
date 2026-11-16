import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const stage=process.argv[2]||'depois';
fs.mkdirSync('evidencias/organizacao-espaco',{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',...(stage==='depois'?{recordVideo:{dir:'test-results/espaco',size:{width:1280,height:900}}}:{})});
await context.addInitScript(()=>localStorage.setItem('citi-all-session-v1',JSON.stringify({authenticated:true,email:'teste@example.com',loggedAt:1})));
const page=await context.newPage();await page.goto('http://localhost:5186/#/organizacao');
const scene=page.locator('.citi-orb');await expect(scene).toHaveClass(/is-live/);await page.waitForTimeout(1200);
await page.screenshot({path:`evidencias/organizacao-espaco/${stage}-completa.png`,fullPage:true});
for(const index of [0,1]) {
 await scene.locator('.atom-node').nth(index).focus();await page.keyboard.press('Enter');await expect(page.locator('.subarea-atom-detail')).toBeVisible();await page.waitForTimeout(900);
 await page.screenshot({path:`evidencias/organizacao-espaco/${stage}-foco-${index+1}.png`,fullPage:true});
 await page.keyboard.press('Escape');await page.waitForTimeout(900);
}
if(stage==='depois') {
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(1600);
 const box=await scene.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+150);await page.mouse.down();await page.mouse.move(box.x+box.width/2+90,box.y+180,{steps:15});await page.mouse.up();
 await page.getByRole('button',{name:'Aproximar',exact:true}).click();await page.waitForTimeout(1000);
}
const video=page.video();await context.close();if(video)await video.saveAs('evidencias/organizacao-espaco/exploracao.webm');await browser.close();

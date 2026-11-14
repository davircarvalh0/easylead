import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5186');
await page.getByRole('button',{name:'Preencher acesso de demonstração'}).click();await page.waitForTimeout(1000);await page.getByRole('button',{name:'Entrar no CITi/all'}).click();await page.waitForTimeout(350);
const mode=await page.locator('.passage-visual').getAttribute('data-mode');await page.screenshot({path:'evidencias/wavemesh-transicao-3d.png'});writeFileSync('evidencias/wavemesh-webgl.json',JSON.stringify({mode,errors,environment:'Chromium headless, GPU conforme disponibilidade do navegador'},null,2));await browser.close();

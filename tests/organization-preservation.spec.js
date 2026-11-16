import {test} from './session-fixture.js';
import fs from 'node:fs';
for(const width of [360,390,1280]) test(`recorte ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/#/leads');
 await page.locator('.lead-funnel').waitFor();await page.waitForTimeout(1800);
 const geometry=await page.locator('.lead-funnel').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,html:el.outerHTML};});
 fs.mkdirSync('evidencias/organizacao',{recursive:true});
 fs.writeFileSync(`evidencias/organizacao/leads-${process.env.RECORTE||'antes'}-${width}.json`,JSON.stringify(geometry,null,2));
 await page.screenshot({path:`evidencias/organizacao/leads-${process.env.RECORTE||'antes'}-${width}.png`,fullPage:true});
});

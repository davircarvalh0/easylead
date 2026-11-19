import {test,expect} from '@playwright/test';

for (const width of [360,1280]) test(`login cinza e responsivo em ${width}px`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/?noWebGL');
 const art=page.locator('.login-art');
 const panel=page.getByRole('region',{name:'Entrar no EasyLead'});
 await expect(panel).toHaveCSS('background-color','rgb(35, 38, 44)');
 await expect(panel.locator('.easylead-logo')).toHaveCSS('color','rgb(255, 255, 255)');
 for (const name of ['E-mail','Código de acesso']) {
  const field=panel.getByLabel(name,{exact:true});
  await expect(field).toHaveCSS('background-color','rgb(24, 26, 31)');
  await expect(field).toHaveCSS('color','rgb(255, 255, 255)');
 }
 await expect(page.locator('.easylead-login')).toHaveCSS('background-color','rgb(0, 0, 0)');
 await expect(page.getByRole('textbox',{name:'E-mail'})).toBeFocused();
 await expect(page.locator('.login-transition')).toHaveCount(0);
 await expect(art.locator('canvas')).toBeHidden();
 const artBox=await art.boundingBox();
 const panelBox=await panel.boundingBox();
 if (width===1280) expect(Math.round(artBox.x+artBox.width)).toBe(Math.round(panelBox.x));
 else expect(Math.round(artBox.y+artBox.height)).toBe(Math.round(panelBox.y));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.screenshot({path:testInfo.outputPath('login.png')});
});

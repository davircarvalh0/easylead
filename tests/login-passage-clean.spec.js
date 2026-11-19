import {test, expect} from '@playwright/test';

for (const width of [390,1280]) {
 for (const reducedMotion of ['no-preference','reduce']) {
  test(`transição do EasyLead ${width} ${reducedMotion}`,async({page})=>{
   await page.setViewportSize({width,height:844});
   await page.emulateMedia({reducedMotion});
   await page.goto('/?noWebGL');
   await page.getByRole('button',{name:/Preencher acesso/}).click();
   await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
   const dialog=page.getByRole('dialog',{name:'Entrando no EasyLead'});
   if (reducedMotion==='no-preference') {
    await expect(dialog).toBeFocused();
    await expect(dialog).toHaveText('');
    const symbol=dialog.locator('.easylead-logo');
    await expect(symbol).toHaveCSS('aspect-ratio','212 / 185');
    const bounds=await symbol.boundingBox();
    expect(bounds.x+bounds.width/2).toBeCloseTo(width/2,0);
    expect(bounds.y+bounds.height/2).toBeCloseTo(422,0);
   }
   await expect(dialog).toHaveCount(0);
   await expect(page.getByRole('heading',{name:'Como posso ajudar?'})).toBeFocused();
  });
 }
}

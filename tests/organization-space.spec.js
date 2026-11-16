import {test,expect} from './session-fixture.js';
test('verde único ao entrar, selecionar dois globos e retornar',async({page})=>{
 await page.goto('/#/organizacao');
 const scene=page.locator('.citi-orb');await expect(scene).toHaveClass(/is-live/);
 const canvas=await scene.locator('canvas').elementHandle();
 for(const index of [0,1]) {
  await scene.locator('.atom-node').nth(index).focus();await page.keyboard.press('Enter');
  await expect(page.locator('.subarea-atom-detail')).toBeVisible();
  expect(await canvas.evaluate(el=>el.isConnected)).toBe(true);
  expect(await scene.locator('.atom-node').evaluateAll(nodes=>nodes.every(n=>n.style.getPropertyValue('--orb-color')==='#00e676'))).toBe(true);
  await page.keyboard.press('Escape');await expect(page).toHaveURL(/#\/organizacao$/);
 }
});

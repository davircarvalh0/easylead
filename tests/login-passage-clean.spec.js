import {test, expect} from '@playwright/test';

test.use({video:'on'});

for (const width of [390, 1280]) {
 for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`clean passage ${width} ${reducedMotion}`, async ({page}) => {
   await page.setViewportSize({width, height:844});
   await page.emulateMedia({reducedMotion});
   await page.goto('/?noWebGL');
   await page.getByRole('button', {name:/Preencher acesso/}).click();
   await page.evaluate(() => {
    window.passageFrames = [];
    const sample = () => {
     const overlay = document.querySelector('.brand-entry');
     const app = document.querySelector('.app-entry');
     if (app) {
      const brand = overlay?.querySelector('.auth-brand');
      const box = brand?.getBoundingClientRect();
      window.passageFrames.push({
       text: overlay?.textContent || '',
       coverage: +getComputedStyle(app).opacity + (overlay ? +getComputedStyle(overlay).opacity : 0),
       x: box ? box.x + box.width / 2 : null,
       y: box ? box.y + box.height / 2 : null,
       overlay: !!overlay,
      });
     }
     if (!app || overlay) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
   });
   await page.getByRole('button', {name:'Entrar no CITi/all'}).click();
   await expect(page.locator('main h1')).toBeFocused();
   await expect(page.locator('.brand-entry')).toHaveCount(0);
   const frames = await page.evaluate(() => window.passageFrames);
   expect(frames.length).toBeGreaterThan(0);
   expect(frames.every(f => f.coverage > .95)).toBe(true);
   expect(frames.every(f => !/Do primeiro contato/i.test(f.text))).toBe(true);
   const passage = frames.filter(f => f.overlay);
   if (reducedMotion === 'reduce') expect(passage).toHaveLength(0);
   else {
    expect(passage.length).toBeGreaterThan(10);
    expect(passage.every(f => Math.abs(f.x - width/2) < 2 && Math.abs(f.y - 422) < 2)).toBe(true);
   }
  });
 }
}

import { test, expect } from './session-fixture.js';
import { seed } from '../src/domain.js';

async function openCharts(page) {
  const values = [
    ['2025-01-05', 20000], ['2025-03-05', 40000],
    ['2026-01-05', 40000], ['2026-03-05', 50000],
  ];
  const projects = values.map(([convertedAt, contractValue], index) => ({
    id: 'chart-' + index, name: 'Projeto ' + index, areaId: 'a0', memberIds: [],
    contractStatus: 'Contratado', convertedAt, contractValue,
  }));
  await page.addInitScript(state => localStorage.setItem('central-citi-v1', JSON.stringify(state)), { ...seed, projects });
  await page.goto('/#/projetos');
}

test('curvas entram em movimento e revelam meses com o mouse e o teclado', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openCharts(page);
  const sparkline = page.locator('.sparkline-frame');
  const activity = page.locator('.activity-frame');
  await expect(sparkline.locator('.bento-plot')).toHaveCSS('animation-name', 'chart-draw');
  await expect(activity.locator('.chart-trace-past')).toHaveCount(2);
  await sparkline.hover({ position: { x: 35, y: 48 } });
  await expect(sparkline.locator('.chart-readout')).toBeVisible();
  await expect.poll(() => page.locator('.route-projetos').evaluate(node => getComputedStyle(node, '::after').display)).toBe('none');
  await sparkline.press('End');
  await expect(sparkline.locator('.chart-readout dl')).toHaveAttribute('aria-label','março de 2026');
  await expect(sparkline.locator('.chart-readout')).toContainText('90.000,00');
  await sparkline.press('Escape');
  await expect(sparkline.locator('.chart-readout')).toBeHidden();

  const radar = page.locator('.radar-frame');
  await radar.press('Home');
  await expect(radar.locator('.chart-readout dl')).toHaveAttribute('aria-label','janeiro de 2026');
  await expect(page.locator('.radar-delta')).toContainText('50%');
  await page.getByRole('button', { name: '2025', exact: true }).click();
  await radar.press('Home');
  await expect(radar.locator('.chart-readout dl')).toHaveAttribute('aria-label','janeiro de 2025');
});

test.describe('toque e movimento reduzido', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

  test('um toque mostra o valor e mantém o traçado disponível', async ({ page }) => {
    await openCharts(page);
    const sparkline = page.locator('.sparkline-frame');
    await sparkline.scrollIntoViewIfNeeded();
    await expect(sparkline).toHaveClass(/is-chart-visible/);
    await expect(sparkline.locator('.bento-plot')).toHaveCSS('animation-name', 'none');
    await sparkline.tap({ position: { x: 70, y: 70 } });
    await expect(sparkline.locator('.chart-readout')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

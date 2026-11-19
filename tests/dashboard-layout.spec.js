import { test, expect } from './session-fixture.js';
import { seed } from '../src/domain.js';

test('valores completos e filtros sincronizados do celular ao desktop', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const sample = { ...structuredClone(seed), projects: [
    { id: 'aurora', name: 'Aurora', leadId: 'l0', company: 'Empresa A', areaId: 'a0', memberIds: [],
      contractStatus: 'Contratado', contractValue: 987654321012.34, convertedAt: '2026-01-05' },
    { id: 'horizonte', name: 'Horizonte', leadId: 'l1', company: 'Empresa B', areaId: 'a2', memberIds: [],
      contractStatus: 'Contratado', contractValue: 10000, convertedAt: '2026-03-05' },
  ] };
  await page.addInitScript(state => localStorage.setItem('central-citi-v1', JSON.stringify(state)), sample);
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#/projetos');
    const bento = page.locator('.studio-bento');
    await expect(page.locator('.priority-metric').filter({has:page.getByText('Projetos',{exact:true})}).locator('.analytics-number')).toHaveText('2');
    const panels = await bento.locator(':scope > section').evaluateAll(nodes => nodes.map(node => {
      const { y, width } = node.getBoundingClientRect();
      return { y, width };
    }));
    expect(panels).toHaveLength(4);
    if (width >= 1024) {
      expect(panels[0].y).toBeCloseTo(panels[1].y,0);
      expect(panels[0].width).toBeCloseTo(panels[1].width,0);
      expect(panels[2].width).toBe(panels[3].width);
      expect(panels[2].width).toBeCloseTo(panels[0].width,0);
    }
    expect(panels[2].y).toBeGreaterThan(panels[0].y);
    if (width>=1024) expect(panels[3].y).toBeCloseTo(panels[2].y,0);
    else expect(panels[3].y).toBeGreaterThan(panels[2].y);
    const total = page.locator('.priority-metric').filter({has:page.getByText(/Valor contratado em/,{exact:false})});
    await expect(total.locator('.analytics-number')).toHaveText(/987\.654\.331\.012,34/);
    for (const selector of ['.analytics-number', '.chart-list .dashboard-value', '.average-value', '.project-value']) {
      const clipped = await page.locator(selector).evaluateAll(nodes => nodes.filter(node => {
        const card = node.closest('.priority-metric, .metric-card, .chart-list, .value-panel, .card');
        const range = document.createRange();
        range.selectNodeContents(node);
        const text = range.getBoundingClientRect();
        const bounds = card.getBoundingClientRect();
        return text.left < bounds.left || text.right > bounds.right;
      }).map(node => node.textContent));
      expect(clipped, `${selector} @ ${width}px`).toEqual([]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator('.contract-distribution-bars li')).toHaveCount(2);
    await expect(bento.locator('.bento-activity')).toHaveCSS('backdrop-filter','none');
    await page.screenshot({path:testInfo.outputPath('projetos-'+width+'.png'),fullPage:true});
    await expect(page.getByRole('searchbox',{name:'Buscar projetos'})).toHaveCount(0);
    await expect(page.getByRole('region',{name:'Valor médio contratado'})).toHaveCount(0);
    await expect(page.getByRole('region',{name:'Comparação por valor'})).toHaveCount(0);
    await page.getByRole('link',{name:'Todos os projetos →'}).click();
    await page.getByRole('searchbox',{name:'Buscar projetos'}).fill('Horizonte');
    await expect(page.getByRole('region',{name:'Carteira de projetos'}).locator('tbody tr')).toHaveCount(1);
    await page.getByRole('navigation',{name:'Caminho da página'}).getByRole('link',{name:'Projetos'}).click();
    await page.getByRole('button', { name: 'Fase', exact: true }).click();
    await expect(page).toHaveURL(/distribuicao=phase/);
    await expect(page.getByRole('button', { name: 'Fase', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const switcher = page.getByRole('group',{name:'Agrupar contratos'});
    await expect(switcher).toHaveClass(/lead-glass-switch/);
    const buttons = await switcher.getByRole('button').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().top));
    expect(new Set(buttons).size).toBe(1);
    await expect.poll(()=>switcher.evaluate(node=>{
      const thumb=getComputedStyle(node,'::before');
      const active=node.querySelector('[aria-pressed="true"]');
      const actual=parseFloat(thumb.insetInlineStart) + parseFloat(thumb.width)/2;
      const expected=active.offsetLeft + active.offsetWidth/2;
      return Math.abs(actual-expected);
    })).toBeLessThan(2);
  }
});

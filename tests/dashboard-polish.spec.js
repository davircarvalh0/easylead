import {test,expect} from './session-fixture.js';
import {seed} from '../src/domain.js';
import {conversionDemo} from '../src/services/leadConversionDemo.js';

for(const width of [1280,390]) test('ajustes de métricas, setores, resumo e rodapé '+width,async({page},testInfo)=>{
  await page.setViewportSize({width,height:950});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),{...seed,...conversionDemo});
  await page.goto('/#/leads');
  const styles=await page.locator('.lead-priority-metrics .priority-metric-label,.lead-priority-metrics dt').evaluateAll(nodes=>nodes.map(node=>{
    const s=getComputedStyle(node);return [s.fontSize,s.fontWeight,s.lineHeight,s.color].join('|');
  }));
  expect(styles).toHaveLength(4);
  expect(new Set(styles).size).toBe(1);
  const sectors=page.getByRole('region',{name:'Comparação por setores'});
  await sectors.getByRole('searchbox',{name:'Pesquisar setores'}).fill('infraestrutura');
  await sectors.getByRole('button',{name:/^Infraestrutura & Saneamento/}).click();
  const row=sectors.locator('.conversion-compare-line').first();
  await expect(row).toContainText('Infraestrutura & Saneamento');
  const overflow=await row.evaluate(node=>{
    const outer=node.getBoundingClientRect();
    return [...node.querySelectorAll('.conversion-compare-label,.conversion-compare-value,.conversion-compare-detail-link,.conversion-compare-remove')].some(child=>{
      const b=child.getBoundingClientRect();return b.left<outer.left || b.right>outer.right || b.top<outer.top || b.bottom>outer.bottom;
    });
  });
  expect(overflow).toBe(false);
  await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');
  await page.screenshot({path:testInfo.outputPath('leads.png'),fullPage:true});
  await page.goto('/#/projetos');
  const chart=page.locator('.sparkline-frame');
  await chart.press('End');
  await expect(chart.locator('.chart-readout')).toBeVisible();
  await expect(chart.locator('.chart-readout > strong')).toHaveCount(0);
  await expect(chart.locator('.chart-readout')).not.toContainText(/de 2026/);
  await expect(page.locator('.project-radar-title').getByRole('button',{name:'→ Ver resumo e histórico',exact:true})).toBeVisible();
  await expect(page.locator('.project-radar-title .radar-tabs')).toHaveCount(0);
  const stage=page.locator('.project-radar-stage');
  const bounds=await stage.boundingBox();
  await page.getByRole('button',{name:'→ Ver resumo e histórico',exact:true}).click();
  const summary=page.getByRole('region',{name:'Resumo e histórico',exact:true});
  await expect(summary).toBeVisible();
  await expect(page.locator('.bento-seasonality .radar-frame')).toBeHidden();
  const detailsBounds=await stage.boundingBox();
  expect(detailsBounds.height).toBeCloseTo(bounds.height,1);
  expect(detailsBounds.width).toBeCloseTo(bounds.width,1);
  await page.getByRole('button',{name:'2025',exact:true}).click();
  await expect(summary).toContainText('Total de 2025');
  await expect(summary.getByRole('region',{name:'Histórico mensal de contratos',exact:true})).toBeVisible();
  await summary.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('resumo.png'),fullPage:true});
  await page.getByRole('button',{name:'← Voltar ao gráfico',exact:true}).click();
  await expect(summary).toBeHidden();
  await expect(page.locator('.bento-seasonality .radar-frame')).toBeVisible();
  await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

import {test,expect} from './session-fixture.js';
import {seed} from '../src/domain.js';
import {conversionDemo} from '../src/services/leadConversionDemo.js';

for(const width of [1280,390]) for(const theme of ['light','dark']) test(`kanban espaçoso ${theme} ${width}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(({state,theme})=>{
    localStorage.setItem('central-citi-v1',JSON.stringify(state));
    localStorage.setItem('easylead-theme',theme);
  },{state:{...seed,...conversionDemo},theme});
  await page.goto('/#/leads/prospectos?modo=quadro');
  const board=page.locator('.prospect-board');
  const lanes=board.locator('.prospect-lane');
  await expect(lanes).toHaveCount(5);
  const positions=await lanes.evaluateAll(nodes=>nodes.map(node=>{
    const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};
  }));
  expect(new Set(positions.map(p=>p.y)).size).toBe(1);
  expect(positions.every(p=>p.width>=280)).toBe(true);
  expect(positions[1].x).toBeGreaterThan(positions[0].x+positions[0].width);
  expect(await board.evaluate(node=>node.scrollWidth>node.clientWidth)).toBe(true);
  const colors=await board.locator('.kanban-lane-header i').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).backgroundColor));
  expect(new Set(colors).size).toBe(5);
  const lane=page.getByRole('region',{name:'Novo',exact:true});
  await expect(lane.locator('.prospect-board-item')).toHaveCount(10);
  const card=lane.locator('.prospect-card').first();
  await expect(card.locator('.kanban-card-client')).toContainText('Empresa');
  await expect(card.locator('.kanban-card-owner')).toContainText('Sem responsável');
  await expect(card.locator('.kanban-card-footer')).toBeVisible();
  await lane.getByRole('button',{name:'Próxima página'}).click();
  await expect(lane.locator('.prospect-board-item')).toHaveCount(10);
  expect(await board.locator('.prospect-board-item').count()).toBeLessThanOrEqual(50);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:testInfo.outputPath('kanban.png'),fullPage:true});
  await lane.getByRole('link',{name:'Cadastrar novo lead'}).click();
  await expect(page.getByRole('region',{name:'Novo lead',exact:true})).toBeVisible();
});

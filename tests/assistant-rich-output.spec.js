import {test,expect} from './session-fixture.js';

for (const width of [1280,390]) test('resposta formatada com gráficos em '+width+'px',async ({page},testInfo)=>{
  await page.setViewportSize({width,height:850});
  await page.emulateMedia({reducedMotion:'reduce'});
  const bar={type:'bar',title:'Projetos por fase (simulados)',unit:'number',data:[{label:'Discovery',value:15},{label:'Delivery',value:14}]};
  const line={type:'line',title:'Valor contratado (simulado)',unit:'BRL',data:[{label:'Janeiro',value:0},{label:'Fevereiro',value:1000}]};
  const reply='Há **29 projetos** em andamento.\n\n- **Discovery:** 15\n- **Delivery:** 14\n\n```chart\n'+JSON.stringify(bar)+'\n```\n\n### Evolução\n```chart\n'+JSON.stringify(line)+'\n```\n\n<img src=x onerror=alert(1)>\n\n```chart\n{invalid}\n```';
  await page.route('**/api/easylead/assistant',route=>route.fulfill({json:{reply,links:[{href:'#/projetos/todos',label:'Ver projetos'}]}}));
  await page.goto('/#/easylead');
  await page.getByRole('textbox',{name:'Mensagem para o EasyLead'}).fill('Mostre os projetos e a evolução com gráficos');
  await page.getByRole('button',{name:'Enviar mensagem'}).click();
  const log=page.getByRole('log');
  await expect(log.locator('strong').first()).toHaveText('29 projetos');
  await expect(log.locator('strong').first()).toHaveCSS('font-weight','700');
  await expect(log.locator('figure')).toHaveCount(2);
  await expect(log.getByRole('list',{name:bar.title})).toContainText('Discovery');
  await expect(log.getByRole('img',{name:line.title})).toBeVisible();
  await log.getByText('Ver dados do gráfico',{exact:true}).click();
  await expect(log.getByRole('cell',{name:'R$ 1.000,00',exact:true})).toBeVisible();
  await expect(log.locator('img,script')).toHaveCount(0);
  await expect(log).toContainText('Não foi possível exibir este gráfico.');
  await expect(log.getByRole('link',{name:'Ver projetos →'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await log.screenshot({path:testInfo.outputPath('resposta-graficos.png')});
  await page.getByRole('button',{name:'Alternar tema'}).click();
  await expect(log.locator('strong').first()).toHaveCSS('font-weight','700');
  await expect(log.getByRole('img',{name:line.title})).toBeVisible();
});

import {seed} from '../src/domain.js';
import {addDemo} from '../src/services/leadProjectService.js';
import {test,expect} from './session-fixture.js';

test('a ficha reconcilia a carteira e permite abrir o recorte da subárea',async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:920});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(state => {
  if (!localStorage.getItem('central-citi-v1')) localStorage.setItem('central-citi-v1', JSON.stringify(state));
 }, addDemo(structuredClone(seed)));
 await page.goto('/?noWebGL#/organizacao/a2');
 const dashboard=page.getByRole('region',{name:'Tech',exact:true});
 await expect(dashboard.locator('.area-stat').filter({hasText:'Valor contratado'})).toContainText('54.000,00');
 await expect(dashboard.getByRole('region',{name:'Projetos vinculados'})).toContainText('Plataforma Maré');
 await dashboard.screenshot({path:testInfo.outputPath('dashboard-area-desktop.png')});
 await page.setViewportSize({width:390,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await dashboard.screenshot({path:testInfo.outputPath('dashboard-area-mobile.png')});
 await dashboard.getByRole('link',{name:/Abrir carteira/}).click();
 await expect(page.getByRole('combobox',{name:'Área',exact:true})).toHaveValue('a2');
});

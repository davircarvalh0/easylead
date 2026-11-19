import {test,expect} from './session-fixture.js';
for(const width of [390,1280])for(const theme of ['dark','light'])test('novo lead clean '+width+' '+theme,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(value=>localStorage.setItem('easylead-theme',value),theme);
 await page.goto('/#/leads/novo');const form=page.getByRole('region',{name:'Novo lead'});
 await expect(form).toBeVisible();await expect(page.locator('.wave-mesh')).toHaveCSS('visibility','hidden');await expect(form).toHaveCSS('background-image','none');
 await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.screenshot({path:testInfo.outputPath('novo-lead.png'),fullPage:true});
 if(width===1280&&theme==='dark'){
  await form.getByRole('button',{name:'Salvar lead'}).click();await expect(form.getByRole('alert')).toBeVisible();
  await form.getByLabel('Nome da empresa').fill('Empresa Horizonte Novo');await form.getByLabel('Contato',{exact:false}).fill('contato@example.com');await form.getByLabel('Cidade',{exact:true}).fill('Recife');await form.getByRole('combobox',{name:'UF',exact:true}).selectOption('PE');
  await form.getByRole('button',{name:'Salvar lead'}).click();await expect(page.getByRole('heading',{name:'Empresa Horizonte Novo',level:1})).toBeVisible();await page.reload();await expect(page.getByRole('region',{name:'Dados do lead'})).toContainText('Recife');
 }
});

import {test,expect} from './session-fixture.js';
import {readFile} from 'node:fs/promises';

for(const width of [390,1280])for(const theme of ['dark','light'])test('configurações clean '+width+' '+theme,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(value=>localStorage.setItem('easylead-theme',value),theme);
 await page.goto('/#/configuracoes');
 const account=page.getByRole('region',{name:'Conta',exact:true}),data=page.getByRole('region',{name:'Dados da carteira',exact:true});
 await expect(account).toContainText('teste@example.com');await expect(data).toContainText('Leads');await expect(data).toContainText('Projetos');
 await expect(page.locator('.wave-mesh')).toHaveCSS('visibility','hidden');
 await expect(page.locator('.studio-layout')).toHaveAttribute('data-clean-page','true');
 await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await expect(account).toHaveCSS('background-image','none');await expect(data).toHaveCSS('background-image','none');
 expect((await account.boundingBox()).height).toBeLessThan(360);expect((await data.boundingBox()).height).toBeLessThan(360);
 await page.screenshot({path:testInfo.outputPath('configuracoes.png')});
 if(width===1280&&theme==='dark'){
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar carteira'}).click();const download=await downloadEvent;
  expect(download.suggestedFilename()).toBe('easylead-carteira.json');const state=JSON.parse(await readFile(await download.path(),'utf8'));expect(state.leads).toHaveLength(5);expect(state.projects).toEqual([]);
  await page.getByRole('button',{name:'Sair da conta'}).click();await expect(page.getByRole('heading',{name:'Entrar no EasyLead'})).toBeVisible();
 }
});

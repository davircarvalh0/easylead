import {test,expect} from './session-fixture.js';
test('resposta interna nunca aparece no chat nem volta como histórico',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});let calls=0;
 await page.route('**/api/easylead/assistant',route=>{
  calls++;const body=route.request().postDataJSON();
  if(calls===2)expect(JSON.stringify(body.history)).not.toMatch(/DSML|SELECT/);
  return route.fulfill({json:{reply:calls===1?'<｜｜DSML｜｜ calls><｜｜DSML｜｜ invoke name="consultar_dados">SELECT 1</｜｜DSML｜｜ invoke></｜｜DSML｜｜ calls>':'Há **5 leads**.',links:[]}});
 });
 await page.goto('/#/easylead');const input=page.getByRole('textbox',{name:'Mensagem para o EasyLead'});await input.fill('Resuma meus leads');await input.press('Enter');
 const log=page.getByRole('log');await expect(log).toContainText('Não foi possível concluir esta consulta.');await expect(log).not.toContainText('DSML');await expect(log).not.toContainText('SELECT');
 await input.fill('Quantos leads?');await input.press('Enter');await expect(log).toContainText('Há 5 leads.');
});

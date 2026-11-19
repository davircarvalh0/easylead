import {test,expect} from './session-fixture.js';

test('conversa e contexto do CSV sobrevivem à navegação e somem ao recarregar',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#/easylead');
 const assistant=page.getByRole('region',{name:'Assistente EasyLead'}),input=assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
 let calls=0;
 await page.route('**/api/easylead/assistant',async route=>{
  const body=route.request().postDataJSON();calls++;
  expect(body.snapshot.attachment_leads).toHaveLength(1);
  if(calls===2){expect(body.history).toHaveLength(2);expect(body.history[0].content).toBe('Analise estes leads');}
  await route.fulfill({json:{reply:'Analisei a Empresa A com o histórico da carteira.',links:[{href:'#/leads/l0',label:'Empresa · Portal Aurora'}]}});
 });
 await assistant.locator('input[type=file]').setInputFiles({name:'lista.csv',mimeType:'text/csv',buffer:Buffer.from('Empresa;Setor\nEmpresa A;Educação Básica')});
 await input.fill('Analise estes leads');await input.press('Enter');
 await expect(assistant.getByRole('log')).toContainText('Analisei a Empresa A');
 await assistant.getByRole('link',{name:'Empresa · Portal Aurora →'}).click();
 await expect(page.getByRole('region',{name:'Detalhes do lead',exact:true})).toBeVisible();
 await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name:'EasyLead',exact:true}).click();
 await expect(assistant.getByRole('log')).toContainText('Analisei a Empresa A');
 await expect(assistant.getByRole('heading',{name:'Como posso ajudar?'})).toHaveCount(0);
 await input.fill('E qual priorizar primeiro?');await input.press('Enter');
 await expect(assistant.locator('.agent-reply')).toHaveCount(2);
 expect(calls).toBe(2);
 await page.reload();
 await expect(assistant.getByRole('heading',{name:'Como posso ajudar?'})).toBeVisible();
 await expect(assistant.getByRole('log')).toHaveCount(0);
 await expect(input).toBeEmpty();
});

test('rascunho e anexos pendentes continuam ao voltar para a IA',async({page})=>{
 await page.goto('/#/easylead');await page.emulateMedia({reducedMotion:'reduce'});
 const assistant=page.getByRole('region',{name:'Assistente EasyLead'}),input=assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
 await input.fill('Analise os leads do arquivo');
 await assistant.locator('input[type=file]').setInputFiles({name:'rascunho.csv',mimeType:'text/csv',buffer:Buffer.from('Empresa;Email\nEmpresa A;a@example.com')});
 const nav=page.getByRole('navigation',{name:'Navegação principal'});
 await nav.getByRole('link',{name:'Organização',exact:true}).click();await nav.getByRole('link',{name:'EasyLead',exact:true}).click();
 await expect(input).toHaveValue('Analise os leads do arquivo');
 await expect(assistant.getByRole('list',{name:'Arquivos anexados'})).toContainText('rascunho.csv');
 await page.reload();
 await expect(input).toBeEmpty();await expect(assistant.getByRole('list',{name:'Arquivos anexados'})).toHaveCount(0);
});

import {test,expect} from './session-fixture.js';

test('pergunta sobre CSV analisa sem alterar a carteira e mantém contexto nas próximas perguntas',async({page})=>{
 await page.goto('/#/easylead');await page.emulateMedia({reducedMotion:'reduce'});
 const assistant=page.getByRole('region',{name:'Assistente EasyLead'}),input=assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
 const previous=await page.evaluate(()=>localStorage.getItem('central-citi-v1'));
 let calls=0;
 await page.route('**/api/easylead/assistant',async route=>{
  const body=route.request().postDataJSON();calls++;
  expect(body.kind).toBeUndefined();expect(body.snapshot.leads).toHaveLength(5);
  expect(body.snapshot.attachment_leads).toHaveLength(2);
  expect(body.snapshot.attachment_leads[0]).toMatchObject({company:'Empresa A',clientSegment:'Educação Básica',idealCustomerProfile:'Fora do ICP'});
  expect(body.attachmentContext.files).toEqual(['prioridades.csv']);
  await route.fulfill({json:{reply:'Priorize **Empresa B**, comparando a conversão histórica e a base de cada setor. Empresa A está fora do ICP.',links:[]}});
 });
 await assistant.locator('input[type=file]').setInputFiles({name:'prioridades.csv',mimeType:'text/csv',buffer:Buffer.from('Empresa;Setor;ICP\nEmpresa A;Educação Básica;Fora do ICP\nEmpresa B;Software & SaaS;Sim')});
 await input.fill('Nesses leads aqui, quais devem ser levados mais em consideração baseados na taxa do conversão de cada setor?');await input.press('Enter');
 await expect(assistant.getByRole('log')).toContainText('Priorize Empresa B');
 expect(await page.evaluate(()=>localStorage.getItem('central-citi-v1'))).toBe(previous);
 await input.fill('E qual é a base dessa recomendação?');await input.press('Enter');
 await expect(assistant.locator('.agent-reply')).toHaveCount(2);
 expect(calls).toBe(2);expect(await page.evaluate(()=>localStorage.getItem('central-citi-v1'))).toBe(previous);
});

test('anexo sem pedido pede esclarecimento e só cadastra após comando explícito',async({page})=>{
 await page.goto('/#/easylead');await page.emulateMedia({reducedMotion:'reduce'});
 const assistant=page.getByRole('region',{name:'Assistente EasyLead'}),input=assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
 const previous=await page.evaluate(()=>localStorage.getItem('central-citi-v1'));
 let requests=0;await page.route('**/api/easylead/assistant',route=>{requests++;return route.fulfill({json:{sectors:[]}});});
 await assistant.locator('input[type=file]').setInputFiles({name:'cadastro.csv',mimeType:'text/csv',buffer:Buffer.from('Empresa;Email;Setor\nEmpresa Nova;novo@example.com;Educação Básica')});
 await assistant.getByRole('button',{name:'Enviar mensagem'}).click();
 await expect(assistant.getByRole('status')).toContainText('Você quer analisar o arquivo ou cadastrar os leads?');
 expect(requests).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('central-citi-v1'))).toBe(previous);
 await input.fill('Quero que você cadastre os leads deste arquivo.');await input.press('Enter');
 await expect(assistant.getByRole('log')).toContainText('1 lead cadastrado em Novo.');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')).leads.at(-1).company)).toBe('Empresa Nova');
});

test('depois de analisar, cadastro só acontece ao pedir explicitamente',async({page})=>{
 await page.goto('/#/easylead');await page.emulateMedia({reducedMotion:'reduce'});
 const assistant=page.getByRole('region',{name:'Assistente EasyLead'}),input=assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
 await page.route('**/api/easylead/assistant',route=>route.fulfill({json:{reply:'Empresa Nova pode ser avaliada pelo histórico de Educação Básica.',links:[]}}));
 await assistant.locator('input[type=file]').setInputFiles({name:'analise.csv',mimeType:'text/csv',buffer:Buffer.from('Empresa;Email;Setor\nEmpresa Nova;novo@example.com;Educação Básica')});
 await input.fill('Analise esses leads sem cadastrar.');await input.press('Enter');
 await expect(assistant.getByRole('log')).toContainText('Empresa Nova pode ser avaliada');
 expect(await page.evaluate(()=>localStorage.getItem('central-citi-v1'))).toBe(null);
 await input.fill('Agora cadastre esses leads.');await input.press('Enter');
 await expect(assistant.getByRole('log')).toContainText('1 lead cadastrado em Novo.');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')).leads.length)).toBe(6);
});

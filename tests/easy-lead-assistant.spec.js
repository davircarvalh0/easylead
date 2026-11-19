import {test,expect} from './session-fixture.js';

for (const width of [1280,390]) test('assistente EasyLead ('+width+'px)', async ({page}, testInfo) => {
  await page.setViewportSize({width,height:850});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#/easylead');
  const assistant = page.getByRole('region',{name:'Assistente EasyLead'});
  await expect(assistant.getByRole('heading',{name:'Como posso ajudar?'})).toBeFocused();
  await expect(assistant.locator('.agent-particle-entrance')).toBeHidden();
  const input = assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
  const send = assistant.getByRole('button',{name:'Enviar mensagem'});
  await expect(send).toBeDisabled();
  await expect(assistant.locator('input[type=file]')).toBeHidden();
  await expect(assistant.getByRole('button',{name:/microfone/i})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.screenshot({path:testInfo.outputPath('easy-lead.png')});

  const attach = assistant.getByRole('button',{name:'Anexos',exact:true});
  await expect(attach).toHaveAttribute('aria-expanded','false');
  await expect(assistant.locator('.agent-attach-liquid')).toHaveAttribute('data-animate-selection','true');
  await attach.click();
  await expect(attach).toHaveAttribute('aria-expanded','true');
  await attach.press('Escape');
  await expect(attach).toBeFocused();
  await expect(attach).toHaveAttribute('aria-expanded','false');
  await attach.click();
  const chooser = page.waitForEvent('filechooser');
  await assistant.getByRole('button',{name:'Anexar arquivos'}).click();
  await (await chooser).setFiles({name:'briefing.csv',mimeType:'text/csv',buffer:Buffer.from('Empresa;Contato\nTeste;teste@example.com')});
  const attachments = assistant.getByRole('list',{name:'Arquivos anexados'});
  await expect(attachments).toContainText('briefing.csv');
  const filesBounds = await attachments.boundingBox();
  const composerBounds = await assistant.locator('.agent-composer').boundingBox();
  expect(filesBounds.y + filesBounds.height).toBeLessThan(composerBounds.y);
  await expect(attach).toHaveAttribute('aria-expanded','false');
  await assistant.getByRole('button',{name:'Remover briefing.csv'}).click();
  await expect(assistant.getByRole('list',{name:'Arquivos anexados'})).toHaveCount(0);

  await input.fill('Linha 1');
  await input.press('Shift+Enter');
  await expect(input).toHaveValue('Linha 1\n');
  await expect(assistant.getByRole('group',{name:'Consultas sugeridas'}).getByRole('button')).toHaveCount(4);
  await page.route('**/api/easylead/assistant',async route=>{
    const {question,snapshot} = route.request().postDataJSON();
    expect(question).toBe('Resuma meus leads');
    expect(snapshot.leads).toHaveLength(5);
    expect(snapshot.leads.find(lead=>lead.stage==='Proposta').proposalPending).toBe(1);
    await route.fulfill({json:{reply:'Encontrei cinco oportunidades na sua carteira.',links:[
      {href:'#/leads/prospectos',label:'Ver leads'},
    ]}});
  });
  await assistant.getByRole('button',{name:'Resuma meus leads'}).click();
  await expect(input).toHaveValue('Resuma meus leads');
  await input.press('Enter');
  await expect(assistant.getByRole('log')).toContainText('Encontrei cinco oportunidades na sua carteira.');
  await expect(assistant.getByRole('link',{name:'Ver leads →'})).toHaveAttribute('href','#/leads/prospectos');
  await expect(assistant.getByRole('heading',{name:'Como posso ajudar?'})).toHaveCount(0);
  await expect(assistant.getByRole('group',{name:'Consultas sugeridas'})).toHaveCount(0);
  await expect(input).toBeVisible();
  await expect(input).toBeEmpty();
  await page.getByRole('button',{name:'Alternar tema'}).click();
  await expect(page.locator('.studio-layout')).toHaveAttribute('data-theme','light');
  await expect(assistant.locator('.agent-attach-liquid')).toHaveAttribute('data-tone','light');
});

test('partículas formam a interface e saem depois da entrada', async ({page},testInfo) => {
  await page.setViewportSize({width:1280,height:850});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/#/easylead');
  const assistant = page.getByRole('region',{name:'Assistente EasyLead'});
  const canvas = assistant.locator('.agent-particle-entrance');
  await expect(canvas).toBeVisible();
  await expect.poll(()=>canvas.evaluate(node=>{
    const pixels=node.getContext('2d').getImageData(0,0,node.width,node.height).data;
    return pixels.some((value,index)=>index%4===3 && value>25);
  })).toBe(true);
  await page.screenshot({path:testInfo.outputPath('particulas.png')});
  await expect(canvas).toBeHidden();
  const title = assistant.getByRole('heading',{name:'Como posso ajudar?'});
  await expect(title).toHaveCSS('font-weight','400');
  await expect(title).toHaveCSS('font-family',/PT Serif/);
  const composer = assistant.locator('.agent-composer');
  expect((await composer.boundingBox()).width).toBe(768);
  expect((await composer.boundingBox()).height).toBeLessThan(120);
});

test('importa CSV e XML, preserva a carteira e cruza os registros pelo servidor', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#/easylead');
  const assistant=page.getByRole('region',{name:'Assistente EasyLead'});
  const input=assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
  const send=assistant.getByRole('button',{name:'Enviar mensagem'});
  const picker=assistant.locator('input[type=file]');
  await page.route('**/api/easylead/assistant',async route=>{
    expect(route.request().postDataJSON()).toEqual({
      kind:'lead-import-sectors',companies:['Estúdio Polar','Oficina Rio'],
    });
    await route.fulfill({json:{sectors:['Design & Criatividade',null]}});
  });
  const files=[
    {name:'leads.csv',mimeType:'text/csv',buffer:Buffer.from('Empresa;Email;Área;ICP\nEstúdio Polar;polar@example.com;Tech;Dentro do ICP\nIncompleto;;;\nLoja excluída;ignorado@example.com;;Fora do ICP')},
    {name:'leads.xml',mimeType:'application/xml',buffer:Buffer.from('<leads><lead empresa="Oficina Rio"><contato><email>rio@example.com</email></contato></lead></leads>')},
  ];
  await picker.setInputFiles(files);
  await input.fill('Cadastre os leads destes arquivos.');
  await send.click();
  const chat=assistant.getByRole('log');
  await expect(chat).toContainText('2 leads cadastrados em Novo.');
  await expect(chat.getByRole('link',{name:'Ver novos leads →'})).toBeVisible();
  await expect(chat).toContainText('Empresa e contato são obrigatórios.');
  await expect(chat).toContainText('1 lead fora do ICP ignorado.');
  await picker.setInputFiles(files);
  await input.fill('Cadastre os leads destes arquivos.');
  await send.click();
  await expect(chat).toContainText('2 duplicados ignorados.');
  await page.route('**/api/easylead/assistant',async route=>{
    const {snapshot,question,history}=route.request().postDataJSON();
    expect(question).toContain('Cruze');
    expect(history).toHaveLength(4);
    expect(snapshot.leads.filter(lead=>lead.company==='Estúdio Polar')).toHaveLength(1);
    expect(snapshot.leads.find(lead=>lead.company==='Estúdio Polar').contractorSegment).toBe('a2');
    expect(snapshot.leads.find(lead=>lead.company==='Estúdio Polar').clientSegment).toBe('Design & Criatividade');
    expect(snapshot.leads.find(lead=>lead.company==='Oficina Rio').clientSegment).toBe('Não classificado');
    expect(snapshot.leads.some(lead=>lead.company==='Loja excluída')).toBe(false);
    expect(snapshot.areas.find(area=>area.id==='a2').name).toBe('Tech');
    expect(snapshot.members.some(member=>member.areaId==='a2')).toBe(true);
    const lead=snapshot.leads.find(lead=>lead.company==='Estúdio Polar');
    await route.fulfill({json:{reply:'Estúdio Polar está associado à área Tech.',links:[
      {href:'#/leads/'+lead.id,label:'Empresa · Estúdio Polar'},
      {href:'#/organizacao/a2',label:'Área · Tech'},
    ]}});
  });
  await input.fill('Cruze leads, projetos e organização.');
  await send.click();
  await expect(chat).toContainText('Estúdio Polar está associado à área Tech.');
  await expect(chat.getByRole('link',{name:'Área · Tech →'})).toHaveAttribute('href','#/organizacao/a2');
  const company=chat.getByRole('link',{name:'Empresa · Estúdio Polar →'});
  const href=await company.getAttribute('href');
  await company.click();
  await expect(page).toHaveURL(url=>url.hash===href);
  await expect(page.getByRole('heading',{name:'Estúdio Polar',exact:true})).toBeVisible();
  await page.goto('/#/leads/prospectos?estagio=Novo');
  await page.reload();
  await expect(page.getByRole('table',{name:'Lista de oportunidades'})).toContainText('Estúdio Polar');
  await expect(page.getByRole('table',{name:'Lista de oportunidades'})).toContainText('Oficina Rio');
});

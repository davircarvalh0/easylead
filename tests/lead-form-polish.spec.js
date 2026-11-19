import {test,expect} from './session-fixture.js';

test('cadastro pesquisa setores e salva LinkedIn',async({page})=>{
  await page.goto('/#/leads');
  await expect(page.locator('h1.lead-route-heading')).toHaveText('Leads');
  await expect(page.locator('.breadcrumb')).toHaveCount(0);
  await page.getByRole('group',{name:'Ações de leads'}).getByRole('link',{name:/Novo lead/}).click();
  const form=page.getByRole('region',{name:'Novo lead'});
  await expect(page.locator('.breadcrumb')).toHaveCount(0);
  await expect(form.getByLabel('Data de criação',{exact:false})).toHaveCount(0);
  const centered = await form.evaluate(node=>{
    const form = node.getBoundingClientRect(), area = node.parentElement.getBoundingClientRect();
    return Math.abs(form.left + form.right - area.left - area.right) < 2;
  });
  expect(centered).toBe(true);
  await expect(form.getByLabel('Valor estimado (R$)')).toHaveValue('');
  await expect(form.getByText('Campos com asterisco', {exact:false})).toHaveCount(0);
  const picker=form.getByRole('button',{name:/Setor da contratante/});
  const search=form.getByRole('searchbox',{name:'Pesquisar setores'});
  await expect(search).toHaveCount(0);
  await expect(form.getByRole('textbox').first()).toHaveAccessibleName('Nome da empresa *');
  await picker.click();
  await expect(search).toBeFocused();
  const sectors=form.getByRole('list',{name:'Setores disponíveis'}).getByRole('button');
  await expect(sectors).toHaveCount(57);
  await search.fill('inteligencia');
  await expect(sectors).toHaveCount(1);
  await search.press('Escape');
  await expect(picker).toBeFocused();
  await expect(search).toHaveCount(0);
  await picker.click();
  await search.fill('inteligencia');
  await sectors.first().click();
  await expect(picker).toContainText('Inteligência Artificial & Dados');
  await expect(search).toHaveCount(0);
  await expect(form.getByLabel('Nome da oportunidade')).toHaveCount(0);
  await form.getByLabel('Nome da empresa').fill('Companhia de teste');
  await form.getByRole('textbox',{name:'Contato *',exact:true}).fill('contato@exemplo.com');
  await form.getByLabel('LinkedIn',{exact:true}).fill('https://linkedin.com.exemplo.org/in/perfil');
  await form.getByRole('button',{name:'Salvar lead'}).click();
  await expect(form.getByRole('alert')).toContainText('URL válida do LinkedIn');
  await form.getByLabel('LinkedIn',{exact:true}).fill('linkedin.com/in/perfil-exemplo');
  await form.getByRole('button',{name:'Salvar lead'}).click();
  await expect(page.getByRole('heading',{name:'Companhia de teste',level:1})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link',{name:/Abrir LinkedIn/})).toHaveAttribute('href','https://linkedin.com/in/perfil-exemplo');
  const facts = page.getByRole('region',{name:'Dados do lead'});
  await expect(facts).toContainText('Inteligência Artificial & Dados');
  const created = await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')).leads.find(lead=>lead.name==='Companhia de teste').createdAt);
  expect(created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const owner = page.getByRole('combobox',{name:'Responsável pelo Lead'});
  await expect(owner.locator('option')).toHaveText(['Sem responsável atribuído','Bruno Melo']);
  await owner.selectOption({label:'Bruno Melo'});
  await page.getByRole('button',{name:'Salvar lead'}).click();
  await expect(facts).toContainText('Bruno Melo');
  await expect(page.getByRole('heading',{name:'Estimado na origem'})).toHaveCount(0);
  await page.reload();
  await expect(owner).toHaveValue('m1');
  await page.goto('/#/leads/prospectos');
  const leadRow=page.getByRole('row').filter({has:page.getByRole('link',{name:'Abrir Companhia de teste'})});
  await expect(leadRow.getByRole('cell',{name:'Bruno Melo'})).toBeVisible();
});


test('funil e conversão ficam em módulos separados e o indicador desliza entre estágios',async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.goto('/#/leads');
  const funnel=page.getByRole('region',{name:'Funil de leads'});
  const conversion=page.getByRole('region',{name:'Conversão em contrato'});
  await expect(funnel).toBeVisible();
  await expect(page.locator('.lead-analysis-grid > .fr-module').and(funnel)).toHaveCount(1);
  await expect(page.locator('.lead-priority-metrics > .fr-module').and(conversion)).toHaveCount(1);
  await expect(funnel.getByText('Selecione um estágio para consultar os registros.')).toHaveCount(0);
  await expect(conversion.getByText('Cada ponto representa 1 ponto percentual.')).toHaveCount(0);
  await page.getByRole('group',{name:'Ações de leads'}).getByRole('link',{name:/Todos os leads/}).click();
  const track=page.getByRole('group',{name:'Filtrar por estágio'});
  const halo=track.locator('.prospect-step-halo');
  const before=await halo.boundingBox();

  await track.getByRole('button',{name:/^Proposta/}).click();
  await expect(track.getByRole('button',{name:/^Proposta/})).toHaveAttribute('aria-pressed','true');

  await expect.poll(async()=>(await halo.boundingBox()).x-before.x).toBeGreaterThan(100);
});


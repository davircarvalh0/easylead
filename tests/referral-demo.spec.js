import {test,expect} from './session-fixture.js';
import {seed} from '../src/domain.js';

test('carteira de demonstração abre leads, projetos e assistente com os mesmos dados',async({page})=>{
  const lead={id:'demo-acme',name:'Acme',company:'Acme',contact:'acme@example.com',stage:'Ganho',
    clientSegment:'Software & SaaS',createdAt:'2024-03-05',projectId:'demo-project'};
  const project={id:'demo-project',leadId:lead.id,name:'Portal de demonstração',company:lead.company,
    areaId:'a2',clientSegment:lead.clientSegment,contractStatus:'Contratado',contractValue:24000,
    convertedAt:'2024-04-20',phase:'Delivery',status:'Em andamento'};
  const other={id:'demo-other',name:'Beta',company:'Beta',contact:'beta@example.com',stage:'Novo',
    clientSegment:'Atacado & Distribuição',createdAt:'2025-06-15'};
  await page.route('**/api/easylead/demo-workspace',route=>route.fulfill({json:{
    ...seed,demoWorkspace:true,leads:[lead,other],projects:[project],
  }}));
  await page.route('**/api/easylead/assistant',async route=>{
    const {snapshot}=route.request().postDataJSON();
    expect(snapshot.leads.map(lead=>lead.id)).toEqual([lead.id,other.id]);
    expect(snapshot.projects[0]).toMatchObject({id:project.id,leadId:lead.id,contractValue:24000});
    expect(snapshot.workspace_profile[0].mode).toBe('demonstração');
    await route.fulfill({json:{reply:'Um projeto de demonstração em andamento.',links:[
      {href:'#/projetos/'+project.id,label:'Projeto · Portal de demonstração'},
    ]}});
  });
  await page.goto('/#/configuracoes');
  await page.getByRole('link',{name:'Abrir carteira de demonstração'}).click();
  const table=page.getByRole('table',{name:'Lista de oportunidades'});
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await expect(table).toContainText('Acme');
  await expect(table).toContainText('Beta');
  await table.getByRole('link',{name:'Abrir Acme'}).click();
  await expect(page.getByRole('link',{name:'Ver projeto'})).toHaveAttribute('href','#/projetos/'+project.id);
  await page.getByRole('link',{name:'Projetos',exact:true}).first().click();
  await expect(page.getByRole('group',{name:'Mosaico de projetos pelo valor contratado'})).toContainText(project.name);
  await page.getByRole('link',{name:'EasyLead',exact:true}).click();
  await page.getByRole('textbox',{name:'Mensagem para o EasyLead'}).fill('Cruze os leads com projetos em andamento.');
  await page.getByRole('button',{name:'Enviar mensagem'}).click();
  await expect(page.getByRole('log')).toContainText('Um projeto de demonstração em andamento.');
  await page.getByRole('link',{name:'Voltar à carteira principal'}).click();
  await expect(page.getByText('Carteira de demonstração',{exact:true})).toHaveCount(0);
  await page.goto('/#/leads/prospectos');
  await expect(table.locator('tbody tr')).toHaveCount(5);
  await expect(table).not.toContainText('Acme');
});

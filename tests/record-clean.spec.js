import {test,expect} from './session-fixture.js';
import {seed} from '../src/domain.js';

for(const width of [1280,390])for(const theme of ['light','dark'])test(`detalhes clean ${theme} ${width}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:950});
  await page.emulateMedia({reducedMotion:'reduce'});
  const state=structuredClone(seed);
  state.icpBudget={minimum:2000,maximum:5000};
  state.leads[2].proposal={price:25000,description:'Descrição de teste da proposta.',documentUrl:'https://example.com/proposta.pdf'};
  state.leads[3].projectId='record-project';
  state.leads[3].proposal={price:50000,description:'Escopo da proposta aprovada.'};
  state.projects=[{id:'record-project',leadId:'l3',name:'Plataforma Maré',areaId:'a2',memberIds:[],phase:'Discovery',status:'Em andamento',contractStatus:'Contratado',contractValue:54000,convertedAt:'2026-11-01'}];
  await page.addInitScript(({state,theme})=>{
    localStorage.setItem('central-citi-v1',JSON.stringify(state));
    localStorage.setItem('easylead-theme',theme);
  },{state,theme});
  // Initialization runs on each document; navigation checks persistence without re-seeding.
  await page.goto('/#/leads/l2');
  const form=page.getByRole('region',{name:'Editar lead',exact:true});
  await expect(page.locator('.studio-layout')).toHaveAttribute('data-record-page','true');
  await expect(page.getByText('Ver orçamento do ICP',{exact:true})).toHaveCount(0);
  await expect(form).toHaveCSS('background-image','none');
  await expect(form).toHaveCSS('backdrop-filter','none');
  const details=page.getByRole('region',{name:'Detalhes do lead',exact:true});
  const [left,right]=await Promise.all([details.boundingBox(),form.boundingBox()]);
  if(width>790){expect(left.x).toBeLessThan(right.x);expect(left.y).toBeCloseTo(right.y,0);}
  else expect(right.y).toBeGreaterThanOrEqual(left.y+left.height);
  expect((await page.getByRole('region',{name:'Proposta',exact:true}).boundingBox()).y).toBeLessThan(left.y);
  await form.getByLabel('Nome da empresa *').fill('Empresa revisada');
  await form.getByRole('button',{name:'Salvar lead',exact:true}).click();
  await expect(details).toContainText('Empresa revisada');
  await page.getByRole('link',{name:'Editar proposta',exact:true}).click();
  const proposal=page.getByRole('region',{name:'Editar proposta',exact:true});
  await expect(proposal).toHaveCSS('background-image','none');
  await proposal.getByLabel('Descrição da proposta').fill('Descrição revisada para conferir a edição.');
  await proposal.getByRole('button',{name:'Salvar proposta',exact:true}).click();
  await expect(page.getByRole('region',{name:'Proposta',exact:true})).toContainText('Descrição revisada');
  await page.goto('/#/leads/l3');
  const order=await page.locator('.lead-record-grid').evaluate(node=>[...node.children].map(child=>child.className));
  expect(order).toEqual(['lead-proposal-overview','fr-module  lead-project-panel','lead-record-support']);
  await expect(page.getByText('Ver orçamento do ICP',{exact:true})).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath('empresa.png'),fullPage:true});
  await page.getByRole('link',{name:'Definir valor e escopo',exact:true}).click();
  await page.locator('select[name=phase]').selectOption('Delivery');
  await page.getByRole('button',{name:'Salvar valor e escopo',exact:true}).click();
  await page.getByRole('link',{name:'Ver projeto',exact:true}).click();
  const project=page.getByRole('region',{name:'Dados do projeto',exact:true});
  await expect(project).toHaveCSS('background-image','none');
  await expect(project).toHaveCSS('backdrop-filter','none');
  await expect(project).toContainText('Delivery');
  await project.getByRole('combobox',{name:'Status do projeto',exact:true}).selectOption('Concluído');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')).projects[0].status)).toBe('Concluído');
  await page.screenshot({path:testInfo.outputPath('projeto.png'),fullPage:true});
  await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});



import {test,expect} from './session-fixture.js';
import {seed} from '../src/domain.js';
import {addValueDemo} from '../src/services/leadProjectService.js';

const directoryState=addValueDemo(structuredClone(seed));

test.beforeEach(async({page})=>{
 await page.addInitScript(state=>{
  if (!localStorage.getItem('central-citi-v1')) localStorage.setItem('central-citi-v1',JSON.stringify(state));
 },directoryState);
});

for(const width of [1280,360]) test(`setores, cadastro e persistência em ${width}px`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/#/organizacao');
 const heading=page.getByRole('heading',{level:1,name:'Organização'});
 const sectors=page.getByRole('list',{name:'Setores'});
 await expect(heading).toBeFocused();
 await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');
 await expect(page.locator('.wave-mesh')).toHaveCSS('visibility','hidden');
 await expect(sectors.getByRole('link')).toHaveCount(5);
 await expect(sectors.locator('canvas')).toHaveCount(0);
 const innovation=sectors.getByRole('link',{name:/Inovação/});
 await expect(innovation.locator('..')).toContainText('1 integrante · 1 projeto');
 await page.screenshot({path:testInfo.outputPath('setores.png')});

 await innovation.click();
 const details=page.getByRole('region',{name:'Inovação',exact:true});
 const title=details.getByRole('heading',{level:1,name:'Inovação'});
 await expect(title.locator('span')).toHaveCount(0);
 const projects=details.getByRole('region',{name:'Projetos vinculados'});
 const breadcrumb=details.getByRole('navigation',{name:'Caminho da página'});
 await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Inovação');
 await expect(details.getByRole('region',{name:'Integrantes'})).toContainText('Ana Lima');
 await expect(projects.getByRole('link',{name:/Portal Aurora/})).toHaveAttribute('href','#/projetos/'+directoryState.projects.find(project=>project.areaId==='a0').id);
 await expect(projects.getByRole('link',{name:/Abrir carteira/})).toHaveAttribute('href','#/projetos/todos?area=a0');
 await expect(projects).toHaveCSS('backdrop-filter','none');
 const [detailBox,projectBox]=await Promise.all([details.boundingBox(),projects.boundingBox()]);
 expect(projectBox.width).toBeLessThanOrEqual(detailBox.width);
 await breadcrumb.getByRole('link',{name:'Organização'}).click();

 const add=page.getByRole('button',{name:'Adicionar setor'});
 expect((await add.boundingBox()).height).toBeLessThanOrEqual(52);
 await add.click();
 const field=page.getByRole('textbox',{name:'Nome do setor'});
 await expect(field).toBeFocused();
 expect((await add.boundingBox()).height).toBeLessThanOrEqual(52);
 expect((await page.locator('.organization-directory>.organization-add-form').boundingBox()).height).toBeLessThanOrEqual(width>720?160:220);
 await field.fill(' inovacao ');
 await page.getByRole('button',{name:'Salvar setor'}).click();
 await expect(page.getByRole('alert')).toContainText('Já existe');
 await page.getByRole('button',{name:'Cancelar'}).click();
 await expect(add).toBeFocused();
 await expect(field).toBeHidden();
 await add.click();
 await field.fill('Pesquisa de Mercado');
 await page.getByRole('button',{name:'Salvar setor'}).click();
 await expect(page.getByRole('heading',{level:1,name:'Pesquisa de Mercado'})).toBeFocused();
 const sectorUrl=page.url();
 await page.getByRole('navigation',{name:'Caminho da página'}).getByRole('link',{name:'Organização'}).click();
 await expect(sectors.getByRole('link')).toHaveCount(6);
 const created=sectors.getByRole('link',{name:/Pesquisa de Mercado/});
 await expect(created.locator('..')).toContainText('0 projetos');
 const positions=await sectors.locator('li').evaluateAll(items=>items.map(item=>{
  const {x,y}=item.getBoundingClientRect();
  return {x,y};
 }));
 expect(positions[5].y).toBeGreaterThan(positions[0].y);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await created.press('Enter');
 await expect(page).toHaveURL(sectorUrl);
 await page.reload();
 await expect(page.getByRole('heading',{level:1,name:'Pesquisa de Mercado'})).toBeVisible();
 await expect(page.getByRole('region',{name:'Projetos vinculados'})).toContainText('Nenhum projeto encontrado.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

 await page.goto('/#/leads/l3/escopo');
 await expect(page.getByLabel('Área responsável').getByRole('option',{name:'Pesquisa de Mercado'})).toHaveCount(1);
 await page.goto('/#/integrantes?area=a0');
 await expect(page).toHaveURL(/#\/organizacao\/a0$/);
 await expect(page.getByRole('heading',{level:1,name:'Inovação'})).toBeVisible();
});

test('integrantes de setores habilitados ficam disponíveis apenas para atribuições de leads',async({page})=>{
 await page.goto('/#/organizacao/a0');
 const members=page.getByRole('region',{name:'Integrantes'});
 const ownership=members.getByRole('switch',{name:'Responsável por lead'});
 await expect(ownership).toHaveAttribute('aria-checked','false');
 await members.getByText('Adicionar integrante',{exact:true}).click();
 await members.getByLabel('Nome do integrante').fill('Marina Teste');
 await members.getByRole('button',{name:'Salvar integrante'}).click();
 await expect(members).toContainText('Marina Teste');
 const owner=page.getByRole('combobox',{name:'Responsável pelo Lead'});
 await page.goto('/#/leads/l2');
 await expect(owner.getByRole('option',{name:'Marina Teste'})).toHaveCount(0);
 await page.goto('/#/organizacao/a0');
 await ownership.click();
 await page.reload();
 await expect(ownership).toHaveAttribute('aria-checked','true');
 await page.goto('/#/leads/l2');
 await owner.selectOption({label:'Marina Teste'});
 await page.getByRole('button',{name:'Salvar lead'}).click();
 const facts=page.getByRole('region',{name:'Dados do lead'});
 await expect(facts).toContainText('Marina Teste');
 await page.goto('/#/organizacao/a0');
 await ownership.click();
 await page.goto('/#/leads/l2');
 await expect(owner.getByRole('option',{name:'Marina Teste'})).toHaveCount(0);
 await expect(facts).toContainText('Marina Teste');
 const projectIds=await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')).projects.map(project=>project.memberIds));
 expect(projectIds).toEqual(directoryState.projects.map(project=>project.memberIds));
});

test('remove um setor e mantém seu projeto na carteira',async({page})=>{
 const project=directoryState.projects.find(item=>item.areaId==='a0');
 await page.goto('/#/organizacao/a0');
 const remove=page.getByRole('button',{name:'Remover setor'});
 const confirmation=page.getByRole('dialog',{name:'Remover Inovação?'});
 await remove.click();
 const actions=confirmation.locator('form');
 await expect(actions).toHaveCSS('padding-bottom','0px');
 await expect(actions).toHaveCSS('margin-bottom','0px');
 await confirmation.getByRole('button',{name:'Cancelar'}).click();
 await expect(confirmation).toBeHidden();
 await expect(remove).toBeFocused();
 await remove.click();
 await confirmation.getByRole('button',{name:'Confirmar remoção'}).click();
 await expect(page).toHaveURL(/#\/organizacao$/);
 await page.reload();
 await expect(page.getByRole('list',{name:'Setores'}).getByRole('link',{name:/Inovação/})).toHaveCount(0);
 await page.goto('/#/projetos/'+project.id);
 const details=page.getByRole('region',{name:'Dados do projeto'});
 await expect(details).toContainText('Sem área atribuída');
 await expect(details).toContainText('200.000,00');
});


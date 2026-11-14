import {test,expect} from '@playwright/test';
import {seed} from '../src/domain.js';
test('fluxo completo, relações, indicadores, persistência e responsividade',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('link',{name:'Leads abertos 3 Consultar'})).toBeVisible();
 await page.getByRole('link',{name:'Cadastrar oportunidade'}).click();
 await page.getByRole('button',{name:'Salvar lead'}).click();
 await expect(page.getByRole('alert')).toContainText('Preencha');
 await page.getByLabel('Nome da oportunidade').fill('Portal Teste');
 await page.getByLabel('Organização',{exact:false}).fill('Cliente fictício');
 await page.getByRole('textbox',{name:'Contato *',exact:true}).fill('teste@example.com');
 await page.getByRole('button',{name:'Salvar lead'}).click();
 await page.getByRole('link',{name:'Visão geral',exact:true}).click();
 await expect(page.getByRole('link',{name:'Leads abertos 4 Consultar'})).toBeVisible();
 await page.getByRole('link',{name:'Leads',exact:true}).click();
 await page.getByLabel('Buscar leads').fill('Portal Teste');
 await page.getByRole('link',{name:/Novo Portal Teste/}).click();
 await expect(page.getByRole('heading',{name:'Editar lead'})).toBeVisible();
 await page.getByRole('combobox',{name:'Estágio',exact:true}).selectOption('Ganho');
 await page.getByRole('button',{name:'Salvar lead'}).click();
 await page.getByRole('button',{name:'Criar projeto'}).click();
 await expect(page.getByRole('alert')).toContainText('área');
 await page.getByLabel('Área responsável').selectOption('a2');
 await page.getByRole('combobox',{name:'Responsável *',exact:true}).selectOption('m2');
 await page.getByLabel('Ana Lima').check();
 await page.getByRole('button',{name:'Criar projeto'}).click();
 const projectUrl=page.url();
 await expect(page.getByLabel('Status do projeto')).toHaveValue('Planejado');
 await expect(page.getByText('Clara Luz, Ana Lima',{exact:true})).toBeVisible();
 await page.getByLabel('Status do projeto').selectOption('Em andamento');
 await page.reload();
 await expect(page.getByLabel('Status do projeto')).toHaveValue('Em andamento');
 await page.getByRole('link',{name:'Desenvolvimento →'}).click();
 await expect(page.getByRole('link',{name:/Em andamento Portal Teste/})).toBeVisible();
 await page.getByRole('link',{name:'Visão geral',exact:true}).click();
 await expect(page.getByRole('link',{name:'Leads abertos 3 Consultar'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Projetos em andamento 1 Consultar'})).toBeVisible();
 await page.getByRole('link',{name:'Projetos em andamento 1 Consultar'}).click();
 await expect(page.getByRole('combobox',{name:'Status',exact:true})).toHaveValue('Em andamento');
 await page.goto(projectUrl);
 await page.getByRole('link',{name:'Portal Teste →'}).click();
 await expect(page.getByRole('combobox',{name:'Estágio',exact:true})).toBeDisabled();
 await page.getByRole('link',{name:'Abrir projeto vinculado'}).click();
 expect(page.url()).toBe(projectUrl);
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')));
 expect(persisted.projects).toHaveLength(1);
 expect(persisted.projects[0].memberIds).toEqual(['m2','m0']);
 for(const width of [360,1280]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/', '/leads','/projetos','/integrantes','/organizacao']){
   await page.goto('/#'+route);
   await expect(page.getByRole('heading',{level:1})).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/#/leads/novo');
 await expect(page.getByRole('heading',{level:1})).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(page.getByLabel('Nome da oportunidade')).toBeFocused();
 await page.keyboard.type('Lead teclado');
 await page.keyboard.press('Tab');
 await page.keyboard.type('Empresa fictícia');
 await page.keyboard.press('Tab');
 await page.keyboard.type('teclado@example.com');
 await page.keyboard.press('Tab');
 await page.keyboard.press('Tab');
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Editar lead'})).toBeVisible();
});
test('busca, filtros combinados e armazenamento bloqueado',async({page})=>{
 await page.goto('/#/leads');
 await page.getByLabel('Buscar leads').fill('Aurora');
 await page.getByRole('combobox',{name:'Estágio',exact:true}).selectOption('Perdido');
 await expect(page.getByText('Nenhum lead encontrado.')).toBeVisible();
 await page.goto('/#/integrantes');
 await page.getByLabel('Buscar integrantes').fill('Clara');
 await expect(page.getByRole('heading',{name:'Clara Luz'})).toBeVisible();
 await page.getByRole('combobox',{name:'Área',exact:true}).selectOption('a0');
 await expect(page.getByText('Nenhum integrante encontrado.')).toBeVisible();
 await page.goto('/#/leads/novo');
 await page.getByLabel('Nome da oportunidade').fill('Teste');
 await page.getByLabel('Organização',{exact:false}).fill('Teste');
 await page.getByRole('textbox',{name:'Contato *',exact:true}).fill('teste@example.com');
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota')}});
 await page.getByRole('button',{name:'Salvar lead'}).click();
 await expect(page.getByRole('alert')).toContainText('Não foi possível salvar');
});

// Fixture in the pre-refactor persisted schema, independent of the new service.
const legacyState={...structuredClone(seed),extra:{preservar:true}};
legacyState.leads[3].custom='campo legado';

async function loadLegacy(page,state=legacyState){
 await page.goto('/');
 await page.evaluate(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),state);
 await page.reload();
}

test('dados anteriores, troca de área, conversão e retorno ao mesmo projeto',async({page})=>{
 await loadLegacy(page);
 await page.goto('/#/leads/l3');
 await page.getByLabel('Área responsável').selectOption('a0');
 await page.getByRole('combobox',{name:'Responsável *',exact:true}).selectOption('m0');
 await page.getByLabel('Bruno Melo').check();
 await page.getByLabel('Área responsável').selectOption('a2');
 await expect(page.getByRole('combobox',{name:'Responsável *',exact:true})).toHaveValue('');
 await expect(page.getByLabel('Bruno Melo')).toBeChecked();
 await page.getByRole('button',{name:'Criar projeto'}).click();
 await expect(page.getByRole('alert')).toContainText('responsável da área');
 await page.getByRole('combobox',{name:'Responsável *',exact:true}).selectOption('m2');
 // Two submissions in the same task must still produce a single project.
 await page.getByRole('button',{name:'Criar projeto'}).evaluate(button=>{
  const form=button.closest('form');form.requestSubmit();form.requestSubmit();
 });
 await expect(page.getByLabel('Status do projeto')).toHaveValue('Planejado');
 const url=page.url();
 await page.reload();
 await page.getByRole('link',{name:'Plataforma Maré →',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Estágio',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Criar projeto'})).toHaveCount(0);
 await page.getByRole('link',{name:'Abrir projeto vinculado →',exact:true}).click();
 await expect(page).toHaveURL(url);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')));
 expect(saved.projects).toHaveLength(1);
 expect(saved.projects[0].memberIds).toEqual(['m2','m1']);
 expect(saved.extra).toEqual({preservar:true});expect(saved.leads[3].custom).toBe('campo legado');
});

test('falha ao converter mantém tela, dados e permite nova tentativa',async({page})=>{
 await loadLegacy(page);
 await page.goto('/#/leads/l3');
 await page.getByLabel('Área responsável').selectOption('a2');
 await page.getByRole('combobox',{name:'Responsável *',exact:true}).selectOption('m2');
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')}});
 await page.getByRole('button',{name:'Criar projeto'}).click();
 await expect(page.getByRole('alert')).toContainText('Não foi possível salvar');
 await expect(page).toHaveURL(/#\/leads\/l3$/);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')))).toEqual(legacyState);
 await expect(page.getByLabel('Área responsável')).toHaveValue('a2');
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem});
 await page.getByRole('button',{name:'Criar projeto'}).click();
 await expect(page.getByLabel('Status do projeto')).toHaveValue('Planejado');
});

for(const raw of ['{',JSON.stringify({...seed,version:99})])test(`dados ilegíveis não são sobrescritos: ${raw==='{'?'JSON':'formato'}`,async({page})=>{
 await page.goto('/');
 await page.evaluate(raw=>localStorage.setItem('central-citi-v1',raw),raw);
 await page.reload();
 await expect(page.getByRole('alert')).toContainText('não serão sobrescritos');
 await page.goto('/#/leads/l3');
 await page.getByLabel('Área responsável').selectOption('a2');
 await page.getByRole('combobox',{name:'Responsável *',exact:true}).selectOption('m2');
 await page.getByRole('button',{name:'Criar projeto'}).click();
 await expect(page.getByText('Persistência indisponível.',{exact:false})).toBeVisible();
 await expect(page).toHaveURL(/#\/leads\/l3$/);
 expect(await page.evaluate(()=>localStorage.getItem('central-citi-v1'))).toBe(raw);
});

test('projeto já salvo mantém identificadores, vínculos e status após editar',async({page})=>{
 const saved=structuredClone(legacyState);
 saved.leads[3].projectId='projeto-anterior';
 saved.projects=[{id:'projeto-anterior',leadId:'l3',name:'Projeto anterior',areaId:'a2',ownerId:'m2',memberIds:['m2','m0'],status:'Em andamento',extra:'preservar'}];
 await loadLegacy(page,saved);
 await page.goto('/#/projetos/projeto-anterior');
 await expect(page.getByLabel('Status do projeto')).toHaveValue('Em andamento');
 await expect(page.getByText('Clara Luz, Ana Lima',{exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Plataforma Maré →',exact:true}).click();
 await page.getByLabel('Nome da oportunidade').fill('Lead atualizado');
 await page.getByRole('button',{name:'Salvar lead'}).click();
 await page.getByRole('link',{name:'Abrir projeto vinculado →',exact:true}).click();
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota')}});
 await page.getByLabel('Status do projeto').selectOption('Concluído');
 await expect(page.getByRole('status')).toContainText('Não foi possível salvar');
 await expect(page.getByLabel('Status do projeto')).toHaveValue('Em andamento');
 await page.reload();
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')));
 expect(persisted.projects).toEqual(saved.projects);
 expect(persisted.leads[3]).toEqual({...saved.leads[3],name:'Lead atualizado'});
});

test('acesso ao armazenamento negado mantém demonstração sem gravar',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('SecurityError')}})});
 await page.goto('/#/leads/l3');
 await expect(page.getByRole('alert')).toContainText('não serão sobrescritos');
 await page.getByLabel('Área responsável').selectOption('a2');
 await page.getByRole('combobox',{name:'Responsável *',exact:true}).selectOption('m2');
 await page.getByRole('button',{name:'Criar projeto'}).click();
 await expect(page.getByText('Persistência indisponível.',{exact:false})).toBeVisible();
 await expect(page).toHaveURL(/#\/leads\/l3$/);
});

import {test,expect} from '@playwright/test';

for(const width of [1280,360]) test(`filtros, médias e fase no percurso ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:'Adicionar exemplos de filtros e médias'}).click();
 const values=page.getByRole('region',{name:'Valor médio contratado'});
 await expect(values).toContainText(/54\.000,00/);
 await expect(values).toContainText('Base: 3 de 5 projetos');
 await page.getByLabel('Agrupamento ativo').selectOption('segment');
 await expect(values).toContainText(/63\.000,00/);
 await page.getByRole('combobox',{name:'Segmento da contratante',exact:true}).selectOption('Finanças & Pagamentos');
 await page.getByLabel('Fase / Tipo').selectOption('Discovery');
 await page.getByRole('combobox',{name:'Subárea CITi',exact:true}).selectOption('a0');
 await expect(values).toContainText('Base: 1 de 1 projetos');
 await expect(values).toContainText(/72\.000,00/);
 await page.reload();await expect(values).toContainText('Base: 1 de 1 projetos');
 await page.getByRole('button',{name:'Limpar filtros'}).click();
 await expect(values).toContainText('Base: 3 de 5 projetos');
 await page.getByRole('combobox',{name:'Segmento da contratante',exact:true}).selectOption('Saúde & Biotech');
 await expect(values).toContainText('Sem projetos elegíveis');
 await expect(values).toContainText('Base: 0 de 1 projetos');
 await page.getByRole('button',{name:'Limpar filtros'}).click();
 await expect(page.getByRole('heading',{name:'Cada etapa, uma conexão.'})).toBeVisible();
 await page.screenshot({path:`evidencias/esteira-${width}.png`,fullPage:true,animations:'disabled'});
 await page.getByRole('link',{name:'Projetos',exact:true}).click();
 await page.getByRole('link',{name:/Motor IA de Crédito/}).click();
 await expect(page.getByRole('heading',{name:'Squad Horus IA'})).toBeVisible();
 await page.getByRole('button',{name:'Avançar para Delivery'}).click();
 await page.reload();
 await expect(page.getByRole('button',{name:'Avançar para Delivery'})).toHaveCount(0);
 await expect(page.getByText('Origem: Discovery')).toBeVisible();
 await page.screenshot({path:`evidencias/squad-${width}.png`,fullPage:true,animations:'disabled'});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('central-citi-v1')));
 expect(saved.projects).toHaveLength(5);
 expect(saved.projects.find(p=>p.name==='Motor IA de Crédito').phase).toBe('Delivery');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('cena sob demanda, teclado e alternativas estáticas',async({page})=>{
 const loaded=[];page.on('request',r=>loaded.push(r.url()));
 await page.goto('/#/leads');
 expect(loaded.some(u=>u.includes('EsteiraScene3D'))).toBe(false);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('link',{name:'Visão geral',exact:true}).click();
 await expect(page.locator('.journey-scene')).toHaveClass(/journey-static/);
 const station=page.getByRole('button',{name:/Projeto Discovery/});
 await station.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.journey-note')).toContainText('Regra aprovada da demonstração');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.getByRole('button',{name:'Usar modo estático'}).click();
 await expect(page.locator('.journey-scene')).toHaveClass(/journey-static/);
});

test('indisponibilidade de CSS 3D preserva conteúdo estático',async({page})=>{
 await page.addInitScript(()=>{CSS.supports=()=>false});
 await page.goto('/');
 await expect(page.locator('.journey-scene')).toHaveClass(/journey-static/);
 await expect(page.getByText('Versão estática: a apresentação 3D está indisponível neste navegador.')).toBeVisible();
});

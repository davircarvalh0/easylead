import {test,expect} from './session-fixture.js';
import {seed} from '../src/domain.js';

for(const width of [1280,390])for(const theme of ['light','dark'])test(`cartões de áreas ${width} ${theme}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:950});
 await page.emulateMedia({reducedMotion:'reduce'});
 const state=structuredClone(seed);
 state.squads=[{id:'team-1',name:'Equipe de pesquisa',areaId:'a0',memberIds:['m0']}];
 state.members.push(...Array.from({length:8},(_,index)=>({id:'extra-'+index,name:'Pessoa '+index,areaId:'a0',role:'Analista'})));
 await page.addInitScript(({state,theme})=>{localStorage.setItem('central-citi-v1',JSON.stringify(state));localStorage.setItem('easylead-theme',theme);},{state,theme});
 const runtimeErrors=[];
 page.on('pageerror',error=>runtimeErrors.push(error.message));
 await page.goto('/#/organizacao');
 const chart=page.getByRole('region',{name:'Áreas da organização',exact:true});
 await expect(chart).toBeVisible();
 await expect(chart.locator('.org-area-grid')).toHaveCSS('display','grid');
 await expect(chart.locator('.org-area-grid')).toHaveCSS('list-style-type','none');
 await expect(chart.locator('.org-area-node').first()).toHaveCSS('display','block');
 await expect(chart.locator('.org-area-node').first()).toHaveCSS('border-top-width','1px');
 await expect(chart.locator('.org-area-body').first()).toHaveCSS('display','grid');
 await expect(page.locator('.studio-layout')).toHaveAttribute('data-clean-dashboard','true');
 await expect(chart.locator('canvas')).toHaveCount(0);
 await expect(chart.locator('.org-chevron')).toHaveCount(0);
 await expect(chart.locator('.org-node-icon svg')).toHaveCount(5);
 const shapes=await chart.locator('.org-node-icon svg').evaluateAll(nodes=>nodes.map(node=>node.innerHTML));
 expect(new Set(shapes).size).toBe(5);
 await expect(chart.getByRole('list',{name:'Setores'}).locator(':scope > li')).toHaveCount(5);
 await expect(chart.locator('.org-branch-content,.org-child-group')).toHaveCount(0);
 const card=chart.getByRole('link',{name:'Abrir área Inovação',exact:true});
 await expect(card).toContainText('9 integrantes');
 const footerBox=await page.locator('.dashboard-footer').boundingBox();
 const cardsBox=await chart.boundingBox();
 expect(footerBox.y).toBeGreaterThanOrEqual(cardsBox.y+cardsBox.height);
 expect(Math.abs(footerBox.y+footerBox.height-await page.evaluate(()=>document.documentElement.scrollHeight))).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath('cartões de áreas.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 // Click the main content of the module rather than its footer.
 await card.locator('.org-area-body').click();
 await expect(page).toHaveURL(/#\/organizacao\/a0$/);
 const area=page.getByRole('region',{name:'Inovação',exact:true});
 await expect(area.getByRole('region',{name:'Integrantes'})).toContainText('Ana Lima');
 await expect(area.getByRole('region',{name:'Projetos vinculados'})).toHaveCSS('backdrop-filter','none');
 await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');
 await expect(area.locator('.priority-metric')).toHaveCount(4);
 await expect(area.getByRole('button',{name:'Adicionar integrante'})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('detalhes-setor.png'),fullPage:true});
 await area.getByRole('navigation',{name:'Caminho da página'}).getByRole('link',{name:'Organização',exact:true}).click();
 await expect(chart.locator('.org-area-grid')).toHaveCSS('display','grid');
 await page.reload();
 await expect(chart.locator('.org-area-body').first()).toHaveCSS('display','grid');
 await expect(chart.locator('.org-area-grid')).toHaveCSS('list-style-type','none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await expect(page.locator('vite-error-overlay')).toHaveCount(0);
 expect(runtimeErrors).toEqual([]);
});

test('cartão abre os detalhes pelo teclado',async({page})=>{
 const runtimeErrors=[];
 page.on('pageerror',error=>runtimeErrors.push(error.message));
 await page.goto('/#/organizacao');
 const card=page.getByRole('link',{name:'Abrir área Inovação',exact:true});
 await card.focus();await card.press('Enter');
 await expect(page).toHaveURL(/#\/organizacao\/a0$/);
 await expect(page.getByRole('heading',{name:'Inovação',level:1,exact:true})).toBeFocused();
});

test('projetos do setor são paginados e continuam acessíveis',async({page})=>{
 const state=structuredClone(seed);
 state.projects=Array.from({length:19},(_,index)=>({id:'sector-project-'+index,name:'Projeto '+index,areaId:'a0',phase:'Discovery',status:'Em andamento',contractStatus:'Contratado',contractValue:10000}));
 await page.addInitScript(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),state);
 await page.goto('/#/organizacao/a0');
 const projects=page.getByRole('region',{name:'Projetos vinculados',exact:true});
 await expect(projects.locator('.area-project-list a')).toHaveCount(8);
 await expect(projects.getByRole('navigation',{name:'Paginação dos projetos do setor'})).toContainText('1–8 de 19');
 await projects.getByRole('button',{name:'Próxima página'}).click();
 await expect(projects.getByRole('link',{name:/^Projeto 8 /})).toHaveAttribute('href','#/projetos/sector-project-8');
 await projects.getByRole('button',{name:'Próxima página'}).click();
 await expect(projects.locator('.area-project-list a')).toHaveCount(3);
 await expect(projects.getByRole('button',{name:'Próxima página'})).toBeDisabled();
 await projects.getByRole('link',{name:/^Projeto 18 /}).click();
 await expect(page.getByRole('region',{name:'Dados do projeto'})).toBeVisible();
});



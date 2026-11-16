import {test,expect} from './session-fixture.js';
for(const width of [1280,390]) test(`módulos: navegação, busca e estados vazios ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/#/projetos');await expect(page.getByRole('region',{name:'Carteira de projetos'})).toBeVisible();
 await page.getByLabel('Buscar projetos',{exact:true}).fill('inexistente-xyz');await expect(page.getByText('Nenhum projeto encontrado.',{exact:true})).toBeVisible();
 await page.getByLabel('Buscar projetos',{exact:true}).fill('');
 await page.getByRole('region',{name:'Carteira de projetos'}).getByRole('link').first().click();await expect(page).toHaveURL(/#\/leads/);
 await page.goto('/#/integrantes');await page.getByLabel('Buscar integrantes').fill('inexistente-xyz');await expect(page.getByText('Nenhum integrante encontrado.',{exact:true})).toBeVisible();
 await page.getByLabel('Buscar integrantes').fill('');await page.getByRole('region',{name:'Diretório de integrantes'}).getByRole('link',{name:/Explorar globos/}).click();await expect(page).toHaveURL(/#\/organizacao/);
 await page.goto('/#/leads');await page.getByRole('link',{name:/Ver projetos convertidos/}).click();await expect(page).toHaveURL(/#\/projetos/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

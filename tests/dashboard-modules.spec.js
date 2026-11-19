import {test,expect} from './session-fixture.js';
for(const width of [1280,390]) test(`módulos: navegação, busca e estados vazios ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/#/projetos');
 await expect(page.getByRole('searchbox',{name:'Buscar projetos'})).toHaveCount(0);
 await page.getByRole('link',{name:'Todos os projetos →'}).click();
 await expect(page.getByRole('region',{name:'Carteira de projetos'})).toBeVisible();
 await page.getByLabel('Buscar projetos',{exact:true}).fill('inexistente-xyz');await expect(page.getByText('Nenhum projeto encontrado.',{exact:true})).toBeVisible();
 await page.getByLabel('Buscar projetos',{exact:true}).fill('');
 await page.getByRole('navigation',{name:'Caminho da página'}).getByRole('link',{name:'Projetos'}).click();await expect(page).toHaveURL(/#\/projetos$/);
 await page.goto('/#/integrantes');await expect(page).toHaveURL(/#\/organizacao$/);
 await expect(page.getByRole('link',{name:'Integrantes',exact:true})).toHaveCount(0);
 await page.goto('/#/leads');await page.getByRole('link',{name:'Projetos',exact:true}).click();await expect(page).toHaveURL(/#\/projetos/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

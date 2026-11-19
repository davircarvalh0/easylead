import {test,expect} from './session-fixture.js';

for(const width of [1280,390])test(`tabela de priorização formatada em ${width}px`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const reply='Priorize pela taxa histórica, considerando a base:\n| Empresa | Setor | Contratos/base histórica | Taxa | Estágio atual |\n|---|---|---|---:|---|\n| Grau Técnico | Educação Superior | 3/37 | **8,1%** | Novo |\n| Touti Cosméticos | Beleza & Cosméticos | 3/38 | **7,9%** | Em contato |\n| Farmácia Royal | Farmacêutico | 2/27 | **7,4%** | Perdido |\n\nA taxa do setor não garante o fechamento individual.\n\n| Empresa | Observação |\n|---|---|\n| A \\| B | <img src=x onerror=alert(1)> |';
 await page.route('**/api/easylead/assistant',route=>route.fulfill({json:{reply,links:[]}}));
 await page.goto('/#/easylead');
 const input=page.getByRole('textbox',{name:'Mensagem para o EasyLead'});
 await input.fill('Quais leads devo priorizar?');await input.press('Enter');
 const log=page.getByRole('log'),table=log.getByRole('table',{name:'Dados da resposta'}).first();
 await expect(table.getByRole('columnheader')).toHaveText(['Empresa','Setor','Contratos/base histórica','Taxa','Estágio atual']);
 await expect(table.getByRole('row')).toHaveCount(4);
 await expect(table.getByRole('cell',{name:'8,1%',exact:true}).locator('strong')).toHaveCSS('font-weight','700');
 await expect(log).toContainText('A taxa do setor não garante');
 await expect(log.locator('img,script')).toHaveCount(0);
 await expect(log.getByRole('cell',{name:'A | B',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 const scroller=log.getByRole('region',{name:'Tabela da resposta'}).first();
 await scroller.scrollIntoViewIfNeeded();
 if(width===390){expect(await scroller.evaluate(node=>node.scrollWidth)).toBeGreaterThan(await scroller.evaluate(node=>node.clientWidth));await scroller.focus();await scroller.press('End');}
 await log.screenshot({path:testInfo.outputPath('tabela-deepseek.png')});
 await page.getByRole('button',{name:'Alternar tema'}).click();
 await expect(table.getByRole('columnheader',{name:'Empresa',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

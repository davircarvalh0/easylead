import {test,expect,activeSession} from './session-fixture.js';
for(const width of [1280,390]) test(`funil filtros, edição e seleção acessível ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390});
 await activeSession(context);const page=await context.newPage();await page.goto('/#/leads');
 const funnel=page.getByRole('region',{name:'Funil de leads'});
 await page.getByRole('combobox',{name:'Segmento da contratante',exact:true}).selectOption('Não classificado');
 const novo=funnel.getByRole('button',{name:/^Novo:/});await expect(novo).toHaveAccessibleName('Novo: 1 leads, 20% de participação');
 if(width===390) await novo.tap();else {await novo.focus();await page.keyboard.press('Enter');}
 await expect(novo).toHaveAttribute('aria-pressed','true');await expect(funnel.getByRole('link')).toHaveCount(1);
 await funnel.getByRole('link').click();await expect(page.getByRole('heading',{name:'Editar lead'})).toBeVisible();await page.getByRole('combobox',{name:'Estágio',exact:true}).selectOption('Proposta');await page.getByRole('button',{name:/Salvar/}).click();
 await page.goto('/#/leads?segmento=Não%20classificado&estagio=Novo');
 await expect(novo).toHaveAccessibleName('Novo: 0 leads, 0% de participação');
 await expect(funnel.getByRole('button',{name:/^Proposta:/})).toHaveAccessibleName('Proposta: 2 leads, 40% de participação');
 await expect(funnel.getByText('Nenhum lead neste recorte.',{exact:false})).toBeVisible();
 await page.screenshot({path:`evidencias/funil-${width}.png`,fullPage:true});
 await page.getByRole('combobox',{name:'Segmento da contratante',exact:true}).selectOption('Saúde & Biotech');
 await expect(funnel.getByRole('button',{name:/^Proposta:/})).toHaveAccessibleName('Proposta: 0 leads, 0% de participação');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await context.close();
});

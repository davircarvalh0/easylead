import {seed} from '../src/domain.js';
import {test,expect,activeSession} from './session-fixture.js';
for(const width of [1280,390]) test(`funil filtros, edição e seleção acessível ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390});
 await activeSession(context);const page=await context.newPage();await page.goto('/#/leads');
 const funnel=page.getByRole('region',{name:'Funil de leads'});
 await page.goto('/#/leads?segmento=N%C3%A3o+classificado');
 const novo=funnel.getByRole('link',{name:/^Novo:/});await expect(novo).toHaveAccessibleName('Novo: 1 leads, 20% de participação');
 if(width===390) await novo.tap();else {await novo.focus();await page.keyboard.press('Enter');}
 await expect(page).toHaveURL(/prospectos\?segmento=N%C3%A3o\+classificado&estagio=Novo/);
 await expect(page.getByRole('group',{name:'Filtrar por estágio'}).getByRole('button',{name:/^Novo/})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.prospect-table tbody tr')).toHaveCount(1);
 await page.getByRole('button',{name:'Quadro',exact:true}).click();
 await page.getByRole('button',{name:'Mover Portal Aurora',exact:true}).click();
 await page.getByRole('combobox',{name:'Mover para'}).selectOption('Proposta');
 await page.goto('/#/leads?segmento=Não%20classificado&estagio=Novo');
 await expect(novo).toHaveAccessibleName('Novo: 0 leads, 0% de participação');
 await expect(funnel.getByRole('link',{name:/^Proposta:/})).toHaveAccessibleName('Proposta: 2 leads, 40% de participação');
 await expect(funnel.locator('.funnel-records')).toHaveCount(0);
 await page.screenshot({path:`evidencias/funil-${width}.png`,fullPage:true});
 await page.goto('/#/leads?segmento=Sa%C3%BAde+%26+Biotech');
 await expect(funnel.getByRole('link',{name:/^Proposta:/})).toHaveAccessibleName('Proposta: 0 leads, 0% de participação');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await context.close();
});

for(const width of [1280,390]) test(`proporcoes 2/3/5 e etapa zerada ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390});
 await activeSession(context);
 const sample=structuredClone(seed);
 sample.leads=Array.from({length:10},(_,i)=>({...seed.leads[0],id:`sample-${i}`,stage:i<2?'Novo':i<5?'Em contato':'Proposta'}));
 await context.addInitScript(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),sample);
 const page=await context.newPage();await page.goto('/#/leads');
 const funnel=page.getByRole('region',{name:'Funil de leads'});
 const buttons=['Novo','Em contato','Proposta','Ganho'].map(stage=>funnel.getByRole('link',{name:new RegExp(`^${stage}:`)}));
 for(const [i,value] of [20,30,50,0].entries()) await expect(buttons[i]).toHaveAccessibleName(new RegExp(`${value}% de participa\u00e7\u00e3o`));
 const widths=await Promise.all(buttons.map(button=>button.getAttribute('data-width').then(Number)));
 expect(widths[2]).toBeGreaterThan(widths[1]);expect(widths[1]).toBeGreaterThan(widths[0]);
 if(width===390) await buttons[2].tap();else {await buttons[2].focus();await page.keyboard.press('Enter');}
 await expect(page).toHaveURL(/prospectos\?estagio=Proposta/);
 await expect(page.locator('.prospect-table tbody tr')).toHaveCount(5);
 await page.screenshot({path:`evidencias/funil-proporcoes-${width}.png`,fullPage:true});
 await page.goBack();
 await buttons[3].click();
 await expect(page).toHaveURL(/prospectos\?estagio=Ganho/);
 await expect(page.getByText('Nenhum prospecto neste recorte.')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await context.close();
});

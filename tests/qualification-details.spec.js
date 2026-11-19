import {test,expect} from './session-fixture.js';
import {seed} from '../src/domain.js';

for(const width of [1280,390])for(const theme of ['dark','light'])test(`métricas do setor ${width} ${theme}`,async({page},testInfo)=>{
 const state=structuredClone(seed);
 state.leads=Array.from({length:20},(_,index)=>({...seed.leads[0],id:'sector-lead-'+index,name:'Lead '+index,clientSegment:'Educação Básica',stage:index<10?'Ganho':index<14?'Perdido':'Novo',projectId:index<10?'sector-project-'+index:undefined}));
 state.projects=state.leads.slice(0,10).map((lead,index)=>({id:'sector-project-'+index,name:'Projeto '+index,leadId:lead.id,areaId:index<5?'a0':'a2',status:'Em andamento',phase:'Discovery',contractStatus:'Contratado',contractValue:10000}));
 await page.setViewportSize({width,height:950});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(({state,theme})=>{localStorage.setItem('central-citi-v1',JSON.stringify(state));localStorage.setItem('easylead-theme',theme);},{state,theme});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/#/leads/qualificacao/setor?detalhe='+encodeURIComponent('Educação Básica'));
 const detail=page.getByRole('region',{name:'Detalhes do setor: Educação Básica',exact:true});
 await expect(detail.locator('.priority-metric')).toHaveCount(7);
 const navBox=await detail.getByRole('navigation',{name:'Caminho da página'}).boundingBox();
 expect(navBox.y).toBeLessThan((await detail.locator('.priority-metric').first().boundingBox()).y);
 const metric=label=>detail.locator('.priority-metric').filter({has:page.getByText(label,{exact:true})}).locator('dd');
 await expect(metric('Taxa de conversão')).toHaveText('50%');
 await expect(metric('Contratos confirmados')).toHaveText('10');
 await expect(metric('Leads no setor')).toHaveText('20');
 await expect(metric('Perdidos')).toHaveText('4');
 await expect(metric('Sem desfecho firmado')).toHaveText('6');
 await expect(metric('Valor médio contratado')).toContainText('10.000,00');
 await expect(metric('Projetos com valor')).toHaveText('10');
 await expect(detail.locator('.priority-metric').first()).toHaveCSS('background-image','none');
 const areas=detail.getByRole('region',{name:'Subáreas dos contratos',exact:true});
 await expect(areas).toContainText('Inovação');await expect(areas).toContainText('Tech');
 const contracts=detail.getByRole('region',{name:'Leads que fecharam',exact:true});
 await expect(contracts.getByRole('link')).toHaveCount(8);
 await contracts.getByRole('button',{name:'Próxima página'}).click();
 await expect(contracts.getByRole('link')).toHaveCount(2);
 await expect(contracts.getByRole('link',{name:/Lead 9/})).toHaveAttribute('href','#/leads/sector-lead-9');
 await expect(page.locator('.dashboard-footer')).toHaveText('EasyLead');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.screenshot({path:testInfo.outputPath('metricas-setor.png'),fullPage:true});
 await detail.getByRole('link',{name:/Voltar à comparação/}).click();
 await expect(page).toHaveURL(/#\/leads$/);
 expect(errors).toEqual([]);
});

test('setor vazio e detalhe inexistente não inventam valores',async({page})=>{
 await page.goto('/#/leads/qualificacao/setor?detalhe='+encodeURIComponent('Educação Básica'));
 const detail=page.getByRole('region',{name:'Detalhes do setor: Educação Básica',exact:true});
 await expect(detail.locator('.priority-metric').first().locator('dd')).toHaveText('—');
 await expect(detail.getByText('Nenhum contrato confirmado neste recorte.')).toBeVisible();
 await page.goto('/#/leads/qualificacao/setor?detalhe=Setor-inexistente');
 await expect(page.getByText('Nenhum resultado para este item no recorte atual.')).toBeVisible();
});

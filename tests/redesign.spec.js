import {activeSession, test, expect} from './session-fixture.js';
import {seed, actionableLeads, metrics} from '../src/domain.js';
import {convert} from '../src/services/leadProjectService.js';

test('prioridades preservam indicador e excluem perdas e conversões', () => {
  expect(actionableLeads(seed).map(l=>l.stage)).toEqual(['Ganho','Proposta','Em contato','Novo']);
  const {state}=convert(seed,'l3',{name:'Plataforma Maré',areaId:'a2',ownerId:'m2'});
  expect(actionableLeads(state).map(l=>l.stage)).toEqual(['Proposta','Em contato','Novo']);
  expect(metrics(state).open).toBe(3);
});

test('atalho de cadastro mantém posição e funciona com movimento reduzido', async({page}) => {
  await page.goto('/#/leads');
  const button=page.getByRole('link',{name:/Novo lead/});
  await expect(page.locator('.journey-scene')).toHaveCount(0);
  await button.scrollIntoViewIfNeeded();
  const box=await button.boundingBox();
  await button.hover();
  expect(await button.boundingBox()).toEqual(box);
  await page.emulateMedia({reducedMotion:'reduce'});
  await button.scrollIntoViewIfNeeded();
  const reducedBox=await button.boundingBox();
  await page.mouse.click(reducedBox.x+reducedBox.width-1,reducedBox.y+reducedBox.height/2);
  await expect(page.getByRole('region',{name:'Novo lead'})).toBeVisible();
  await expect(page.getByRole('heading',{level:1})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:/Consultar leads/})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Nome da empresa')).toBeFocused();
});

for(const mobile of [false,true]) test(`percurso e capturas ${mobile?'mobile':'desktop'}`,async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:mobile?360:1280,height:900},isMobile:mobile,hasTouch:mobile});
  await activeSession(context);
  const page=await context.newPage();
  const converted=convert(seed,'l3',{name:'Plataforma Maré',areaId:'a2',ownerId:'m2',memberIds:['m0']}).state;
  converted.projects[0].status='Em andamento';
  const data=structuredClone(converted);
  // A second won lead demonstrates the queue alongside an active project.
  data.leads.push({id:'capture-won',name:'Nova parceria',company:'Empresa de demonstração',contact:'parceria@example.com',stage:'Ganho'});
  await page.goto('/#/leads');
  await page.evaluate(s=>localStorage.setItem('central-citi-v1',JSON.stringify(s)),data);
  await page.reload();
  async function capture(name){
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.evaluate(async()=>{document.activeElement?.blur();await document.fonts.ready;});
    await page.screenshot({path:testInfo.outputPath(name+'.png'),fullPage:true,animations:'disabled'});
  }
  await capture('inicio');
  await page.getByRole('link',{name:/Todos os leads/}).click();
  await page.getByRole('link',{name:'Abrir Nova parceria',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Projeto',exact:true})).toBeVisible();
  await capture('lead');
  if(mobile){
    const button=page.getByRole('button',{name:'Salvar lead'});
    await button.tap();
    expect(await button.evaluate(el=>parseFloat(el.style.getPropertyValue('--tx'))||0)).toBe(0);
  }
  await page.goto('/#/projetos/'+data.projects[0].id);
  await capture('projeto');
  await page.getByRole('link',{name:'Tech →'}).click();
  await expect(page.getByRole('region',{name:'Projetos vinculados'})).toBeVisible();
  await capture('area');
  await page.getByRole('link',{name:/Em andamento Plataforma Maré/}).click();
  await expect(page.getByLabel('Status do projeto')).toHaveValue('Em andamento');
  await context.close();
});

import {test, expect} from '@playwright/test';
import {seed, convert, actionableLeads, metrics} from '../src/domain.js';

test('prioridades preservam indicador e excluem perdas e conversões', () => {
  expect(actionableLeads(seed).map(l=>l.stage)).toEqual(['Ganho','Proposta','Em contato','Novo']);
  const {state}=convert(seed,'l3',{name:'Plataforma Maré',areaId:'a2',ownerId:'m2'});
  expect(actionableLeads(state).map(l=>l.stage)).toEqual(['Proposta','Em contato','Novo']);
  expect(metrics(state).open).toBe(3);
});

test('cursor move apenas pintura; clique na borda, saída e movimento reduzido', async({page}) => {
  await page.goto('/');
  const button=page.getByRole('link',{name:'Cadastrar oportunidade'});
  await page.evaluate(async()=>{await document.fonts.ready; await Promise.all(document.getAnimations().map(a=>a.finished));});
  const box=await button.boundingBox();
  await page.mouse.move(box.x+box.width-2,box.y+5);
  await expect.poll(()=>button.evaluate(el=>parseFloat(el.style.getPropertyValue('--tx')))).toBe(4);
  expect(await button.boundingBox()).toEqual(box);
  await page.mouse.move(1,1);
  await expect.poll(()=>button.evaluate(el=>el.style.getPropertyValue('--tx'))).toBe('0px');
  await page.mouse.move(box.x+box.width-2,box.y+5);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(button.locator('.btn-inner')).toHaveCSS('transform','none');
  await page.mouse.click(box.x+box.width-1,box.y+box.height/2);
  await expect(page.getByRole('heading',{name:'Novo lead'})).toBeVisible();
  await expect(page.getByRole('heading',{level:1})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Nome da oportunidade')).toBeFocused();
});

for(const mobile of [false,true]) test(`percurso e capturas ${mobile?'mobile':'desktop'}`,async({browser})=>{
  const context=await browser.newContext({viewport:{width:mobile?360:1280,height:900},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  const converted=convert(seed,'l3',{name:'Plataforma Maré',areaId:'a2',ownerId:'m2',memberIds:['m0']}).state;
  converted.projects[0].status='Em andamento';
  const data=structuredClone(converted);
  // A second won lead demonstrates the queue alongside an active project.
  data.leads.push({id:'capture-won',name:'Nova parceria',company:'Empresa de demonstração',contact:'parceria@example.com',stage:'Ganho'});
  await page.goto('/');
  await page.evaluate(s=>localStorage.setItem('central-citi-v1',JSON.stringify(s)),data);
  await page.reload();
  const prefix=`evidencias/${mobile?'mobile':'desktop'}`;
  async function capture(name){
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.evaluate(async()=>{document.activeElement?.blur();await document.fonts.ready;});
    await page.screenshot({path:`${prefix}-${name}.png`,fullPage:true,animations:'disabled'});
  }
  await capture('inicio');
  await page.getByRole('link',{name:/Ganho.*Nova parceria/}).click();
  await expect(page.getByRole('heading',{name:'Converter em projeto'})).toBeVisible();
  await capture('lead');
  if(mobile){
    const button=page.getByRole('button',{name:'Salvar lead'});
    await button.tap();
    expect(await button.evaluate(el=>parseFloat(el.style.getPropertyValue('--tx'))||0)).toBe(0);
  }
  await page.goto('/#/projetos/'+data.projects[0].id);
  await capture('projeto');
  await page.getByRole('link',{name:'Desenvolvimento →'}).click();
  await expect(page.getByText('Clara Luz · Desenvolvedora')).toBeVisible();
  await capture('area');
  await page.getByRole('link',{name:/Em andamento Plataforma Maré/}).click();
  await expect(page.getByLabel('Status do projeto')).toHaveValue('Em andamento');
  await context.close();
});

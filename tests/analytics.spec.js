import {test,expect} from './session-fixture.js';
for(const width of [1280,390]) test(`barra flutuante e ordem das páginas ${width}`,async({browser},testInfo)=>{
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',hasTouch:width===390});
 await context.addInitScript(()=>localStorage.setItem('citi-all-session-v1',JSON.stringify({authenticated:true,email:'teste@example.com',loggedAt:1})));
 const page=await context.newPage();await page.goto('/#/');
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 const nav=page.getByRole('navigation',{name:'Navegação principal'});
 await expect(nav).toBeVisible();const rect=await nav.boundingBox();expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(width);expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThan(844);
 await expect(nav.getByRole('link',{name:'Metas',exact:true})).toHaveCount(0);
 await expect(page).toHaveURL(/#\/easylead$/);
 await expect(page.getByRole('heading',{name:'Como posso ajudar?'})).toBeFocused();
 const leads = nav.getByRole('link',{name:'Leads',exact:true});
 await leads.click();
 await expect(leads).toHaveAttribute('aria-current','page');
 await expect.poll(() => leads.evaluate(link => {
   const button = link.getBoundingClientRect();
   const pill = link.parentElement.querySelector('.nimbus-drop').getBoundingClientRect();
   return Math.abs((button.left + button.right) - (pill.left + pill.right)) / 2;
 })).toBeLessThan(1);
 await expect(nav.getByRole('link')).toHaveText(['EasyLead','Leads','Projetos','Organização']);
 const brand = nav.getByRole('link',{name:'EasyLead',exact:true});
 expect(rect.height).toBeCloseTo(50,0);
 expect(rect.width).toBeLessThanOrEqual(width === 1280 ? 576 : 256);
 await expect(brand.locator('.easylead-logo')).toHaveCSS('aspect-ratio','212 / 185');
 const brandBounds = await brand.boundingBox();
 expect(brandBounds.x - rect.x).toBeCloseTo(4,0);
 await expect(brand.locator('.easylead-logo')).toHaveCSS('mask-mode','luminance');
 const profile = page.getByRole('button',{name:'Menu do perfil'});
 const profileGlass = page.locator('.easylead-profile-liquid');
 await expect(profileGlass.locator('.nimbus-water')).toHaveCount(1);
 await expect(profileGlass.locator('.nimbus-glass')).toHaveCSS('background-color',
   await nav.locator('.nimbus-glass').evaluate(element => getComputedStyle(element).backgroundColor));
 await expect(profileGlass.locator('.nimbus-drop')).toHaveCSS('background-color',
   await nav.locator('.nimbus-drop').evaluate(element => getComputedStyle(element).backgroundColor));
 const theme = page.getByRole('button',{name:'Alternar tema'});
 const themeBounds = await theme.boundingBox();
 const profileBounds = await profile.boundingBox();
 expect(themeBounds.x + themeBounds.width).toBeLessThan(profileBounds.x);
 expect(themeBounds.y).toBeCloseTo(profileBounds.y,0);
 await theme.click();
 await expect(theme).toHaveAttribute('aria-pressed','true');
 await expect(nav).toHaveAttribute('data-tone','light');
 await expect(page.getByRole('region',{name:'Funil de leads'})).toHaveCSS('background-color','rgb(255, 255, 255)');
 await page.reload();
 await expect(theme).toHaveAttribute('aria-pressed','true');
 await theme.click();
 await expect(nav).toHaveAttribute('data-tone','dark');
 expect(profileBounds.width).toBeCloseTo(brandBounds.width,0);
 expect(profileBounds.height).toBeCloseTo(brandBounds.height,0);
 const profileBubble = profileGlass.locator('.nimbus-drop');
 await expect(profileBubble).toBeHidden();
 await profile.click();
 await expect(profileBubble).toBeVisible();
 await expect(profile.locator('.nv-ico')).not.toHaveAttribute('data-fx',/.+/);
 const profileOptions = page.getByRole('group',{name:'Opções da conta'});
 await expect(profileOptions.getByRole('button',{name:'Sair',exact:true})).toBeVisible();
 await profile.press('Escape');
 await expect(profile).toBeFocused();
 await expect(profile).toHaveAttribute('aria-expanded','false');
 await expect(profileBubble).toBeHidden();
 await profile.press('Enter');
 await profileOptions.getByRole('link',{name:'Configurações'}).click();
 await expect(page.getByRole('heading',{level:1,name:'Configurações'})).toBeFocused();
 await expect(page.getByText('teste@example.com')).toBeVisible();
 await brand.click();
 await expect(page).toHaveURL(/#\/easylead$/);
 await expect(brand).toHaveAttribute('aria-current','page');
 const brandPage = page.getByRole('heading',{level:1,name:'Como posso ajudar?'});
 await expect(brandPage).toBeFocused();
 await expect(page.getByRole('textbox',{name:'Mensagem para o EasyLead'})).toBeVisible();
 await expect.poll(() => nav.evaluate(element => {
   const current = element.querySelector('[aria-current]');
   const drop = element.querySelector('.nimbus-drop');
   return Math.abs(current.getBoundingClientRect().x - drop.getBoundingClientRect().x);
 })).toBeLessThan(2);
 await page.screenshot({path:testInfo.outputPath('easylead.png')});
 await nav.getByRole('link',{name:'Projetos',exact:true}).focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{level:1,name:'Projetos',exact:true})).toHaveClass(/lead-route-heading/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:testInfo.outputPath('analytics-projetos.png'),fullPage:true});await context.close();
});

test('o radar mostra meses datados e o estado vazio',async({page})=>{
 const {seed}=await import('../src/domain.js');
 const sample={...structuredClone(seed),projects:[
  {id:'history-a',name:'January',leadId:'l0',contractStatus:'Contratado',contractValue:54000,convertedAt:'2026-01-05'},
  {id:'history-b',name:'March',leadId:'l1',contractStatus:'Contratado',contractValue:72000,convertedAt:'2026-03-05'},
  {id:'undated',name:'Undated',leadId:'l2',contractStatus:'Contratado',contractValue:99000}
 ]};
 await page.goto('/');
 await page.evaluate(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),sample);
 await page.goto('/#/contratos?distribuicao=phase');
 await expect(page).toHaveURL(/#\/projetos\?distribuicao=phase$/);
 await page.reload();
 const chart=page.getByRole('img',{name:'Valor contratado por mês no ano selecionado',exact:true});
 await expect(chart).toBeVisible();
 const history=page.locator('section.analytics-card').filter({has:chart});
 await expect(history.locator('li')).toHaveCount(2);
 await expect(history.locator('li').last()).toContainText('janeiro');
 await expect(history.locator('li').first()).toContainText('março');
 await expect(history.locator('li').last()).toContainText('54.000,00');
 await page.evaluate(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),{...sample,projects:[sample.projects[0]]});
 await page.reload();
 await expect(history.locator('li')).toHaveCount(1);
 await expect(history.locator('.radar-shape')).toHaveCount(1);
 await page.evaluate(state=>localStorage.setItem('central-citi-v1',JSON.stringify(state)),{...sample,projects:[]});
 await page.reload();
 await expect(history.locator('.radar-shape')).toHaveCount(0);
 await expect(history.getByText(/Nenhum ano disponível/)).toBeVisible();
});

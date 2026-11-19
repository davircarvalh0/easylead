import {test,expect} from './session-fixture.js';

for(const [width,height] of [[1440,900],[1366,768],[1280,720],[1280,600],[390,844],[375,568],[844,390]])test(`IA cabe na tela inicial ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/#/easylead');
 const assistant=page.getByRole('region',{name:'Assistente EasyLead'});
 await expect(assistant.getByRole('heading',{name:'Como posso ajudar?'})).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 await expect(assistant).toHaveAttribute('data-empty','true');
 await expect(assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'})).toBeInViewport({ratio:1});
 await expect(assistant.getByRole('button',{name:'Enviar mensagem'})).toBeInViewport({ratio:1});
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
 const attachment=assistant.locator('.agent-attach-liquid');
 const canvas=attachment.locator('.nimbus-water');
 const [navBox,canvasBox]=await Promise.all([attachment.boundingBox(),canvas.boundingBox()]);
 expect(canvasBox.height).toBeLessThanOrEqual(navBox.height+28);
 await assistant.getByRole('button',{name:'Anexos',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
 await assistant.getByRole('button',{name:'Anexos',exact:true}).press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

for(const [width,height] of [[1440,900],[375,568]])test('caixa fixa com histórico rolável '+width+'x'+height,async({page})=>{
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/easylead/assistant',route=>route.fulfill({json:{reply:Array(30).fill('Resumo dos leads e projetos da carteira.').join('\n\n'),links:[]}}));
 await page.goto('/#/easylead');
 const assistant=page.getByRole('region',{name:'Assistente EasyLead'});
 const input=assistant.getByRole('textbox',{name:'Mensagem para o EasyLead'});
 const composer=assistant.locator('.agent-composer');
 await expect(input).toBeInViewport({ratio:1});
 const initial=await composer.boundingBox();
 await input.fill('Resuma meus leads');await input.press('Enter');
 const thread=assistant.getByRole('log');
 await expect(thread).toContainText('Resumo dos leads');
 await expect(assistant).toHaveAttribute('data-empty','false');
 await expect.poll(async()=>Math.abs((await composer.boundingBox()).y-initial.y)).toBeLessThan(2);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
 expect(await thread.evaluate(node=>node.scrollHeight>node.clientHeight)).toBe(true);
 await thread.evaluate(node=>node.scrollTop=0);
 await expect(input).toBeInViewport({ratio:1});
 expect(Math.abs((await composer.boundingBox()).y-initial.y)).toBeLessThan(2);
 await input.fill('E os projetos?');await input.press('Enter');
 await expect(assistant.locator('.agent-reply')).toHaveCount(2);
 await expect(input).toBeEmpty();
 await expect.poll(()=>thread.evaluate(node=>node.scrollHeight-node.clientHeight-node.scrollTop)).toBeLessThan(2);
 await expect(input).toBeInViewport({ratio:1});
});

import {test, expect, activeSession} from './session-fixture.js';

test('arraste troca o estágio, solta na coluna e preserva a troca ao recarregar', async ({page}) => {
  await page.setViewportSize({width:1280,height:1000});
  await page.goto('/#/leads/prospectos?modo=quadro');
  const source = page.getByRole('region',{name:'Proposta',exact:true});
  const target = page.getByRole('region',{name:'Em contato',exact:true});
  const card = source.getByRole('link',{name:/^App Raiz/});
  await card.scrollIntoViewIfNeeded();
  const from = await card.boundingBox(), to = await target.boundingBox();
  await page.mouse.move(from.x+from.width/2,from.y+25);
  await page.mouse.down();
  await page.mouse.move(to.x+to.width/2,to.y+55,{steps:12});
  await expect(target).toHaveAttribute('data-drop-active','true');
  await expect(page.locator('.prospect-drag-preview')).toBeVisible();
  await page.mouse.up();
  await expect(target.getByRole('link',{name:/^App Raiz/})).toBeVisible();
  await expect(page.locator('.prospect-drag-preview')).toHaveCount(0);
  await expect(page).toHaveURL(/prospectos/);
  await page.reload();
  await expect(target.getByRole('link',{name:/^App Raiz/})).toBeVisible();
});

test('cancelar arraste devolve o cartão e editar via controle funciona no celular', async ({page}) => {
  await page.setViewportSize({width:390,height:950});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/#/leads/prospectos?modo=quadro');
  const proposal = page.getByRole('region',{name:'Proposta',exact:true});
  const target = page.getByRole('region',{name:'Ganho',exact:true});
  const drag = proposal.getByRole('button',{name:'Mover App Raiz'});
  await drag.scrollIntoViewIfNeeded();
  const point = await drag.boundingBox();
  await page.mouse.move(point.x+point.width/2,point.y+point.height/2);
  await page.mouse.down();
  await page.mouse.move(point.x-15,point.y+15,{steps:6});
  await expect(page.locator('.prospect-drag-preview')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('.prospect-drag-preview')).toHaveCount(0);
  await expect(drag).toBeVisible();
  await drag.focus();
  await page.keyboard.press('Enter');
  await proposal.getByRole('combobox',{name:'Mover para'}).selectOption('Ganho');
  await expect(target.getByRole('button',{name:'Mover App Raiz'})).toBeFocused();
  await expect(page.getByText('App Raiz movido para Ganho.')).toBeVisible();
});

test('alça permite arrastar por toque', async ({browser}) => {
  const context = await browser.newContext({viewport:{width:390,height:1450},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await activeSession(context);
  const page = await context.newPage();
  await page.goto('/#/leads/prospectos?modo=quadro');
  const handle = page.getByRole('button',{name:'Mover App Raiz'});
  const target = page.getByRole('region',{name:'Ganho',exact:true});
  await handle.evaluate(element=>element.scrollIntoView({block:'center'}));
  const from=await handle.boundingBox();
  const cdp=await context.newCDPSession(page);
  const send=(type,point)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:point?[point]:[]});
  const start={x:from.x+from.width/2,y:from.y+from.height/2};
  const board=page.locator('.prospect-board');
  const boardBounds=await board.boundingBox();
  const edge={x:Math.min(370,boardBounds.x+boardBounds.width-12),y:start.y};
  await send('touchStart',start);
  for(let step=1;step<=8;step++)await send('touchMove',{x:start.x+(edge.x-start.x)*step/8,y:start.y});
  await expect.poll(()=>target.evaluate(node=>{
    const bounds=node.getBoundingClientRect();return bounds.left+Math.min(bounds.width/2,100)<innerWidth-30;
  })).toBe(true);
  const destination=await target.boundingBox();
  await send('touchMove',{x:Math.max(20,Math.min(350,destination.x+100)),y:start.y});
  await expect(target).toHaveAttribute('data-drop-active','true');
  await send('touchEnd');
  await expect(target.getByRole('link',{name:/^App Raiz/})).toBeVisible();
  await context.close();
});

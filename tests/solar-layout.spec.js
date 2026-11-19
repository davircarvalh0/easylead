import {test,expect} from './session-fixture.js';

test('o brilho acompanha o cursor em um módulo de cadastro',async({page})=>{
 await page.goto('/#/leads/novo');
 const panel=page.locator('.fr-module');
 await panel.hover({position:{x:70,y:66}});
 await expect.poll(()=>panel.evaluate(element=>parseFloat(element.style.getPropertyValue('--glow-x')))).toBeGreaterThan(65);
 await expect.poll(()=>panel.evaluate(element=>Number(getComputedStyle(element,'::after').opacity))).toBeGreaterThan(.55);
});

test('o painel do login renderiza Liquid Chrome em WebGL',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
 const page=await context.newPage();
 await page.goto('/');
 const supports=await page.evaluate(()=>Boolean(document.createElement('canvas').getContext('webgl')));
 test.skip(!supports,'Este navegador de teste não oferece WebGL.');
 await expect(page.locator('.login-art')).toHaveAttribute('data-renderer','webgl');
 await expect(page.locator('.login-art canvas')).toBeVisible();
 await page.getByRole('button',{name:/Preencher acesso/}).click();
 await page.getByRole('button',{name:'Entrar no EasyLead'}).click();
 await expect(page.locator('.login-transition canvas')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Como posso ajudar?',level:1})).toBeFocused();
 await context.close();
});

import {test as base, expect} from '@playwright/test';
export async function activeSession(context) {
  await context.addInitScript(() => {
    if (!localStorage.getItem('citi-all-session-v1')) localStorage.setItem('citi-all-session-v1', JSON.stringify({authenticated:true,email:'teste@example.com',loggedAt:1}));
  });
}
export const test = base.extend({
  context: async ({context}, use) => { await activeSession(context); await use(context); },
});
export {expect};

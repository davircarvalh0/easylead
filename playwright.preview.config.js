import {defineConfig} from '@playwright/test';
import config from './playwright.config.js';

export default defineConfig({
  ...config,
  webServer: {
    command: 'npm run preview -- --port 5186 --strictPort',
    url: 'http://localhost:5186',
    reuseExistingServer: false,
  },
});

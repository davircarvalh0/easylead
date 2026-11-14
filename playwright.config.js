import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'*.spec.js',use:{baseURL:'http://localhost:5186',headless:true},webServer:{command:'npm run dev -- --port 5186 --strictPort',url:'http://localhost:5186',reuseExistingServer:false}});

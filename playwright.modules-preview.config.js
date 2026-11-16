import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:['dashboard-modules.spec.js','login-passage-clean.spec.js','organization-exploration.spec.js'],workers:1,use:{baseURL:'http://localhost:5191',headless:true},webServer:{command:'npm run preview -- --port 5191 --strictPort',url:'http://localhost:5191',reuseExistingServer:false}});

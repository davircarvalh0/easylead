import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'cloud-workspace.spec.js',use:{baseURL:'http://localhost:5187',headless:true},webServer:{command:'npm run dev -- --port 5187 --strictPort',url:'http://localhost:5187',reuseExistingServer:false,env:{VITE_APP_MODE:'server'}}});

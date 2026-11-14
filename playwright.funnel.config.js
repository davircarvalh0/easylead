import {defineConfig} from '@playwright/test';
export default defineConfig({workers:1,testDir:'./tests',testMatch:'*.spec.js',use:{baseURL:'http://localhost:5198',headless:true},webServer:{command:'npm run dev -- --port 5198 --strictPort',url:'http://localhost:5198',reuseExistingServer:false}});

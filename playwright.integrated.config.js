import {defineConfig} from '@playwright/test';
export default defineConfig({workers:1,testDir:'./tests',testMatch:'integrated-evidence.spec.js',use:{baseURL:'http://localhost:5199',headless:true},webServer:{command:'npm run preview -- --port 5199 --strictPort',url:'http://localhost:5199',reuseExistingServer:false}});

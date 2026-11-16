import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:['flow.spec.js','pipeline.spec.js','value-blocks.spec.js','organization-atoms.spec.js','wavemesh.spec.js'],workers:2,use:{baseURL:'http://localhost:5186',headless:true},webServer:{command:'npm run dev -- --port 5186 --strictPort',url:'http://localhost:5186',reuseExistingServer:true}});

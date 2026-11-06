import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/preview',testMatch:['packaged.spec.js'],
 timeout:60000,expect:{timeout:15000},workers:2,
 reporter:[['list'],['html',{outputFolder:'playwright-preview-report',open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4181',headless:true,actionTimeout:15000,navigationTimeout:20000},
 projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}],
 webServer:{command:'python3 -m http.server 4181 --bind 127.0.0.1 --directory preview-dist',url:'http://127.0.0.1:4181/',reuseExistingServer:!process.env.CI}
});

import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/adventure',testMatch:['chapter-one.spec.js','item-long.spec.js','dual-item.spec.js','gate-long.spec.js','gate-cycle.spec.js','gate-closure.spec.js'],timeout:300000,expect:{timeout:10000},workers:2,fullyParallel:true,retries:0,
  reporter:[['list'],['html',{outputFolder:'playwright-chapter-report',open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4177',headless:true,actionTimeout:10000,navigationTimeout:10000,trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}],
  webServer:{command:'python3 -m http.server 4177 --bind 127.0.0.1',url:'http://127.0.0.1:4177/adventure.html',reuseExistingServer:!process.env.CI},
});

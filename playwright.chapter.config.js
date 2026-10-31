import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',testMatch:'chapter-one.spec.js',timeout:180000,expect:{timeout:10000},workers:3,fullyParallel:true,retries:0,
  reporter:[['list'],['html',{outputFolder:'playwright-chapter-report',open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4177',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}],
  webServer:{command:'python3 -m http.server 4177 --bind 127.0.0.1',url:'http://127.0.0.1:4177/adventure.html',reuseExistingServer:!process.env.CI},
});

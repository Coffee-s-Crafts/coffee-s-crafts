const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', workers: 1,
  globalSetup: './tests/browser/setup.cjs',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
});

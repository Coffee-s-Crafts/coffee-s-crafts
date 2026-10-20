const { defineConfig } = require('@playwright/test');
const { assertRenderDirectory } = require('./scripts/render-safety.cjs');
for (const directory of ['render-results', 'render-report']) assertRenderDirectory(directory);
process.env.OUTPUT_DIR = 'render-dist';
module.exports = defineConfig({
  testDir: './tests/render',
  globalSetup: './tests/browser/setup.cjs',
  workers: 1, retries: 0, timeout: 30000,
  forbidOnly: !!process.env.CI,
  outputDir: 'render-results',
  reporter: [['list'], ['html', { outputFolder: 'render-report', open: 'never' }]],
  metadata: { content: 'Default site copy, real source artwork, local server only. Not a production preview.' },
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium',
    screenshot: 'only-on-failure', trace: 'off', video: 'off', serviceWorkers: 'block' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});

// Use real source artwork with default content, never deployment variables or secrets.
require('./render-safety.cjs').assertRenderDirectory('render-dist');
const { spawnSync } = require('node:child_process');
const result = spawnSync(process.execPath, ['site/build.js'], { stdio: 'inherit', env: {
  PATH: process.env.PATH, OUTPUT_DIR: 'render-dist',
  CONTACT_EMAIL: 'render-test@example.invalid', EMAIL_URL: 'mailto:render-test@example.invalid',
  KOFI_EMBED_ENABLED: 'false',
} });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

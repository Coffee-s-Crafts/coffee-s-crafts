const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { checkOutput } = require('../scripts/check-output.cjs');

let output;
let original;
before(() => {
  output = fs.mkdtempSync(path.join(os.tmpdir(), 'coffee-preview-gates-'));
  const result = spawnSync(process.execPath, ['site/build.js'], {
    env: { ...process.env, OUTPUT_DIR: output }, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  original = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
});
after(() => { if (output) fs.rmSync(output, { recursive: true, force: true }); });

async function rejectsMutation(mutate, reason) {
  const modified = mutate(original);
  assert.notEqual(modified, original, 'mutation must change emitted HTML');
  fs.writeFileSync(path.join(output, 'index.html'), modified);
  try { await assert.rejects(checkOutput(output), reason); }
  finally { fs.writeFileSync(path.join(output, 'index.html'), original); }
}

test('shared-head removals fail the same output gate used in CI', async () => {
  await checkOutput(output);
  await rejectsMutation(html => html.replace(/<script id="discord:component-embed"[^>]*>[\s\S]*?<\/script>/, ''), /one server-rendered component embed required/);
  await rejectsMutation(html => html.replace(/(<script id="discord:component-embed"[^>]*>[\s\S]*?<\/script>)/, '<!-- $1 -->'), /one server-rendered component embed required/);
  for (const key of ['og:title', 'og:description', 'og:url', 'og:site_name', 'og:type', 'og:image', 'og:image:alt',
    'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt', 'theme-color']) {
    await rejectsMutation(html => html.replace(new RegExp(`<meta (?:property|name)="${key}"[^>]*>`), ''), /missing fallback/);
  }
  await rejectsMutation(html => html.replace(/<link rel="canonical"[^>]*>/, ''), /canonical/);
});

test('unrelated metadata and broken preview-only media fail output validation', async () => {
  for (const [key, value, reason] of [
    ['og:title', 'Another page', /title/], ['twitter:description', 'Another description', /description/],
    ['og:url', 'https://coffeescrafts.com/contact.html', /canonical/],
    ['og:image', 'https://coffeescrafts.com/missing.jpg', /image/],
    ['twitter:image:alt', 'Wrong art', /image alt/], ['theme-color', '#ffffff', /accent/],
    ['twitter:card', 'invalid', /Twitter Card/], ['og:type', 'invalid', /Open Graph type/],
  ]) await rejectsMutation(html => html.replace(new RegExp(`((?:property|name)="${key}" content=")[^"]+`), '$1' + value), reason);
  await rejectsMutation(html => html.replace(/(<link rel="canonical" href=")[^"]+/, '$1https://coffeescrafts.com/contact.html'), /canonical/);
  await rejectsMutation(html => html.replaceAll('assets/art/anthrocon-2026-badges.jpg', 'assets/preview-only-missing.jpg'), /missing local preview/);
  await rejectsMutation(html => html.replace('</head>', '<meta property="og:title" content="Conflicting title"></head>'), /duplicate fallback/);
  await rejectsMutation(html => html.replace('</head>', '<meta property="og:image:width" content="1200"></head>'), /dimensions/);
  await rejectsMutation(html => html.replace('</head>', '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:image:width" content="600"><meta name="twitter:image:height" content="315"></head>'), /dimensions must match/);
  const mediaFile = path.join(output, 'assets/art/anthrocon-2026-badges.jpg');
  const bytes = fs.readFileSync(mediaFile);
  try {
    fs.writeFileSync(mediaFile, 'version https://git-lfs.github.com/spec/v1\noid sha256:fake\nsize 1\n');
    await assert.rejects(checkOutput(output), /published LFS pointer|invalid raster signature/);
    fs.writeFileSync(mediaFile, '<svg></svg>');
    await assert.rejects(checkOutput(output), /invalid raster signature/);
  } finally { fs.writeFileSync(mediaFile, bytes); }
  const cname = fs.readFileSync(path.join(output, 'CNAME'));
  try {
    fs.writeFileSync(path.join(output, 'CNAME'), 'example.com\n');
    await assert.rejects(checkOutput(output), /CNAME must preserve/);
  } finally { fs.writeFileSync(path.join(output, 'CNAME'), cname); }
});

test('configured site origin, base path and escaped copy remain valid', async () => {
  const configured = fs.mkdtempSync(path.join(os.tmpdir(), 'coffee-preview-config-'));
  try {
    const result = spawnSync(process.execPath, ['site/build.js'], { env: { ...process.env,
      OUTPUT_DIR: configured, SITE_URL: 'https://preview.example.test/portfolio/', SITE_TITLE: 'Coffee & "Friends" <Art>',
      PREVIEW_IMAGE_ALT: 'Character art & "crafts"',
    }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    await checkOutput(configured);
  } finally { fs.rmSync(configured, { recursive: true, force: true }); }
});

test('publishing and source LFS policy remain CI contracts', () => {
  const workflow = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
  assert.match(workflow, /pull_request:\s+branches: \[ main \]/);
  assert.match(workflow, /lfs: true/);
  assert.match(workflow, /publish_branch: gh-pages/);
  assert.match(workflow, /cname: coffeescrafts\.com/);
  assert.match(workflow, /if: \$\{\{ github\.event_name == 'push' && github\.ref == 'refs\/heads\/main' \}\}/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run check:output/);
  const attributes = spawnSync('git', ['check-attr', 'filter', '--', 'assets/art/preview-policy-probe.svg'], { encoding: 'utf8' });
  assert.equal(attributes.status, 0, attributes.stderr);
  assert.match(attributes.stdout, /: filter: lfs/);
});

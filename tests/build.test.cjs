const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { isPromotionActive, safeParsePromotions } = require('../site/promotions');
const { UI_DEFAULTS } = require('../site/build');
const { checkOutput } = require('../scripts/check-output.cjs');

test('promotion calendar boundaries, timestamps and invalid dates', () => {
  const p = { start: '2026-10-09', end: '2026-10-10' };
  for (const now of ['2026-10-09T00:00:00Z', '2026-10-10T12:00:00Z', '2026-10-10T23:59:59.999Z']) assert.equal(isPromotionActive(p, Date.parse(now)), true);
  for (const now of ['2026-10-08T23:59:59.999Z', '2026-10-11T00:00:00Z']) assert.equal(isPromotionActive(p, Date.parse(now)), false);
  assert.equal(isPromotionActive({ end: '2026-10-10T12:00:00Z' }, Date.parse('2026-10-10T12:00:01Z')), false);
  for (const end of ['bad', '2026-02-30', 42]) assert.equal(isPromotionActive({ end }, Date.now()), false);
  assert.equal(isPromotionActive({}, Date.now()), true);
});

test('promotion fallback badges and malformed JSON', () => {
  const labels = { percent: '{amount}% off', flat: '${amount} off' };
  const items = safeParsePromotions('[null,{"amount":5},{"type":"percent","amount":10},{"badgeText":"Sale"}]', labels);
  assert.deepEqual(items.map(p => p.badgeText), ['$5 off', '10% off', 'Sale']);
  assert.deepEqual(safeParsePromotions('bad', labels), []);
});

test('all configurable values are mapped through workflow vars or secrets', () => {
  const source = fs.readFileSync('site/build.js', 'utf8');
  const keys = new Set([...source.matchAll(/process\.env\.([A-Z_]+)/g)].map(match => match[1]));
  Object.keys(UI_DEFAULTS).forEach(key => keys.add(key));
  const workflow = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
  for (const key of keys) {
    if (key === 'OUTPUT_DIR') continue;
    assert.match(workflow, new RegExp(`(?:vars|secrets)\\.${key}\\b`), `Missing workflow setting: ${key}`);
  }
});

test('template copy uses content tokens instead of hardcoded words', () => {
  const files = fs.readdirSync('site/templates', { recursive: true }).filter(file => file.endsWith('.html'));
  for (const file of files) {
    const html = fs.readFileSync(path.join('site/templates', file), 'utf8');
    // Inspect text nodes without treating the source scan as an HTML sanitizer.
    for (const match of html.matchAll(/<!--[\s\S]*?-->|>([^<]+)</g)) {
      if (match[1] === undefined) continue;
      const text = match[1].replace(/%%\w+%%|\{\{[^}]*\}\}/g, '').trim();
      assert.equal(/\p{L}/u.test(text), false, `${file}: hardcoded copy ${text}`);
    }
  }
});

test('custom filenames, escaped copy, image metadata and promotions generate valid output', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coffee-build-'));
  try {
    const defaults = { ...process.env };
    const source = fs.readFileSync('site/build.js', 'utf8');
    for (const key of [...Object.keys(UI_DEFAULTS), ...[...source.matchAll(/process\.env\.([A-Z_]+)/g)].map(match => match[1])]) delete defaults[key];
    const env = { ...defaults, OUTPUT_DIR: root, INDEX_LINK: 'home.html', GALLERY_LINK: 'portfolio.html', CONTACT_LINK: 'inquire.html',
      ART_LINK: 'drawing.html', FURSUIT_LINK: 'suits.html', ART_TOS_LINK: 'art-terms.html', FURSUIT_TOS_LINK: 'suit-terms.html', PREMADE_LINK: 'shop.html',
      SITE_TITLE: 'Coffee & "Friends" <Studio>',
      HERO_HEADING: 'Custom <headline>', HERO_IMAGE: 'assets/art/reki.png', ART_PRICE_SUMMARY: 'From €30',
      IMAGE_METADATA: JSON.stringify({ 'assets/art/reki.png': { alt: 'Character portrait & details', caption: 'R eki <example>' } }),
      PROMOTIONS: '[{"type":"percent","amount":15}]' };
    const result = spawnSync(process.execPath, ['site/build.js'], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const gallery = fs.readFileSync(path.join(root, 'portfolio.html'), 'utf8');
    assert.match(gallery, /Character portrait &amp; details/);
    assert.match(gallery, /R eki &lt;example&gt;/);
    assert.match(gallery, /https:\/\/coffeescrafts.com\/portfolio.html/);
    const contact = fs.readFileSync(path.join(root, 'inquire.html'), 'utf8');
    assert.match(contact, /15% off/);
    assert.equal([...contact.matchAll(/class="promotion-status active">15% off<\/span>/g)].length, 2, 'Contact and footer must both render the fallback badge');
    assert.match(contact, /Coffee &amp; &quot;Friends&quot; &lt;Studio&gt;/);
    assert.match(contact, /From €30/);
    const home = fs.readFileSync(path.join(root, 'home.html'), 'utf8');
    assert.match(home, /Custom &lt;headline&gt;/);
    assert.match(home, /class="hero-art">\s*<img src="assets\/art\/reki.png"/);
    assert.match(home, /href="home.html" aria-current="page"/);
    assert.match(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /portfolio.html/);
    await checkOutput(root);
    for (const override of [{ GALLERY_LINK: '../escape.html' }, { GALLERY_LINK: 'home.html' }]) {
      const invalid = spawnSync(process.execPath, ['site/build.js'], { env: { ...env, ...override }, encoding: 'utf8' });
      assert.notEqual(invalid.status, 0);
      assert.match(invalid.stderr, /distinct root-level/);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

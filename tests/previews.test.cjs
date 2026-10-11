const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { serializeEmbed, httpUrl } = require('../site/previews');
const payload = components => ({ component: { type: 17, accent_color: 0x8b3a1e, components } });
const text = content => ({ type: 10, content });
const gallery = count => ({ type: 12, items: Array.from({ length: count }, () => ({ media: { url: 'https://coffeescrafts.com/photo.jpg' } })) });

test('serialized JSON safely round-trips HTML delimiters and Unicode', () => {
  const value = payload([text('</script><script>alert("x")</script> & café ☕ \u2028\u2029')]);
  const json = serializeEmbed(value);
  assert.equal(/[<>&\u2028\u2029]/.test(json), false);
  assert.deepEqual(JSON.parse(json), value);
});

test('byte limit includes UTF-8 and HTML escape overhead, including exact boundary', () => {
  const base = Buffer.byteLength(serializeEmbed(payload([text('x')]))) - 1;
  assert.equal(Buffer.byteLength(serializeEmbed(payload([text('x'.repeat(3000 - base))]))), 3000);
  assert.throws(() => serializeEmbed(payload([text('x'.repeat(3001 - base))])), /3000 UTF-8/);
  assert.throws(() => serializeEmbed(payload([text('☕'.repeat(1000))])), /3000 UTF-8/);
  assert.throws(() => serializeEmbed(payload([text('<'.repeat(500))])), /3000 UTF-8/);
});

test('component count includes root, galleries have an aggregate limit', () => {
  serializeEmbed(payload(Array.from({ length: 39 }, () => text('x'))));
  assert.throws(() => serializeEmbed(payload(Array.from({ length: 40 }, () => text('x')))), /40 components/);
  serializeEmbed(payload([gallery(5), gallery(5)]));
  assert.throws(() => serializeEmbed(payload([gallery(5), gallery(6)])), /10 gallery/);
});

test('rejects invalid roots, nesting, controls, fields, URLs and media', () => {
  for (const value of [null, {}, { components: [] }, { ...payload([text('ok')]), extra: true },
    payload([payload([text('nested')]).component]), payload([{ type: 3 }]), payload([{ type: '10', content: 'invalid' }]),
    payload([{ type: 1, components: [{ type: 2, style: 1, label: 'Go', url: 'https://example.com' }] }]),
    payload([{ type: 1, components: [{ type: 2, style: 5, label: 'Go', url: 'https://example.com', custom_id: 'bad' }] }]),
    payload([{ type: 2, style: 5, label: 'Go', url: 'https://example.com' }]),
    payload([{ type: 12, items: [{ media: { url: 'https://example.com/photo.svg' } }] }])]) {
    assert.throws(() => serializeEmbed(value));
  }
  for (const url of ['javascript:alert(1)', 'mailto:test@example.com', '/relative.png', 'https://user:password@example.com/a.jpg', 'https://example.com/' + 'x'.repeat(2048)]) assert.throws(() => httpUrl(url));
});

test('generated head previews match page metadata and configured links; unsafe overrides fail', () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'coffee-preview-'));
  try {
    const env = { ...process.env, OUTPUT_DIR: output, SITE_TITLE: 'Coffee </script> & "Friends" ☕',
      GALLERY_LINK: 'portfolio.html', CONTACT_LINK: 'inquire.html', PREVIEW_COLOR: '#123456',
      PREVIEW_IMAGE_ALT: 'Real art & crafts', ART_COMMISSION_STATUS: 'closed' };
    const run = extra => spawnSync(process.execPath, ['site/build.js'], { env: { ...env, ...extra }, encoding: 'utf8' });
    const result = run({});
    assert.equal(result.status, 0, result.stderr);
    for (const file of fs.readdirSync(output).filter(file => file.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(output, file), 'utf8');
      const head = html.split('</head>')[0];
      const scripts = [...head.matchAll(/<script id="discord:component-embed" type="application\/json">([\s\S]*?)<\/script>/g)];
      assert.equal(scripts.length, 1);
      const json = scripts[0][1];
      assert.ok(Buffer.byteLength(json) <= 3000);
      const embed = JSON.parse(json);
      assert.equal(embed.component.accent_color, 0x123456);
      assert.equal(serializeEmbed(embed), json);
      const media = embed.component.components.find(component => component.type === 12).items[0].media.url;
      assert.match(head, new RegExp(`<meta property="og:image" content="${media}">`));
      assert.match(head, /twitter:card" content="summary_large_image/);
      assert.match(head, /og:site_name/);
      assert.match(head, /og:url/);
      const buttons = embed.component.components.find(component => component.type === 1).components;
      assert.ok(buttons.some(button => button.url.endsWith(file === 'inquire.html' ? '/art.html' : '/inquire.html')));
      assert.match(embed.component.components[0].content, /Coffee <\/script> & "Friends" ☕/);
      if (file === 'art.html') assert.match(json, /Commissions Closed/);
    }
    for (const extra of [{ OG_IMAGE_URL: 'assets/missing.jpg' }, { OG_IMAGE_URL: 'logo.svg' }, { PREVIEW_COLOR: 'red' }, { SITE_DESCRIPTION: '☕'.repeat(1000) }]) {
      assert.notEqual(run(extra).status, 0, JSON.stringify(extra));
    }
  } finally { fs.rmSync(output, { recursive: true, force: true }); }
});

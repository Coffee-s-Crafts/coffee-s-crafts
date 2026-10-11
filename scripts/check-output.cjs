const fs = require('node:fs');
const path = require('node:path');
const { HtmlValidate } = require('html-validate');
const { serializeEmbed, httpUrl } = require('../site/previews');

async function checkOutput(root = process.env.OUTPUT_DIR || 'dist') {
  root = path.resolve(root);
  const errors = [];
  const files = fs.readdirSync(root, { recursive: true }).filter(file => fs.statSync(path.join(root, file)).isFile());
  const validator = new HtmlValidate({ extends: ['html-validate:recommended'], rules: {
    'void-style': 'off', 'no-trailing-whitespace': 'off', 'long-title': 'off', 'attr-quotes': ['error', { style: 'double' }],
  } });
  for (const file of files) {
    const filename = path.join(root, file);
    const fd = fs.openSync(filename, 'r');
    const prefix = Buffer.alloc(200);
    fs.readSync(fd, prefix, 0, prefix.length, 0);
    fs.closeSync(fd);
    if (prefix.toString().startsWith('version https://git-lfs.github.com/spec/')) errors.push(`${file}: published LFS pointer`);
    if (!file.endsWith('.html')) continue;
    const html = fs.readFileSync(filename, 'utf8');
    try {
      const head = html.split('</head>')[0];
      const embeds = [...head.matchAll(/<script id="discord:component-embed" type="application\/json">([\s\S]*?)<\/script>/g)];
      if (embeds.length !== 1) throw new Error('one server-rendered component embed required');
      if (serializeEmbed(JSON.parse(embeds[0][1])) !== embeds[0][1]) throw new Error('unsafe or noncanonical embed JSON');
      for (const key of ['og:title', 'og:description', 'og:url', 'og:site_name', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) {
        const meta = head.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]+)">`));
        if (!meta) throw new Error(`missing fallback ${key}`);
        if (key.endsWith(':image')) httpUrl(meta[1].replaceAll('&amp;', '&'), true);
      }
    } catch (error) { errors.push(`${file}: ${error.message}`); }
    if (/%%\w+%%|\{\{[#/>\w]/.test(html)) errors.push(`${file}: unresolved template token`);
    const report = await validator.validateString(html, file);
    for (const result of report.results) for (const message of result.messages) {
      errors.push(`${file}:${message.line}:${message.column}: ${message.message} (${message.ruleId})`);
    }
    for (const match of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
      const value = match[1].replaceAll('&amp;', '&');
      if (!value || /^[a-z][\w+.-]*:|^\/\//i.test(value)) continue;
      const [url, anchor] = value.split('#');
      const local = decodeURIComponent(url.split('?')[0]);
      const target = local.startsWith('/') ? path.resolve(root, '.' + local) : path.resolve(path.dirname(filename), local || path.basename(file));
      if (!(target === root || target.startsWith(root + path.sep))) {
        errors.push(`${file}: local URL escapes output: ${value}`);
      } else if (!fs.existsSync(target)) {
        errors.push(`${file}: missing local target: ${value}`);
      } else if (anchor && target.endsWith('.html')) {
        const targetHtml = fs.readFileSync(target, 'utf8');
        if (!targetHtml.includes(`id="${decodeURIComponent(anchor)}"`)) errors.push(`${file}: missing anchor: ${value}`);
      }
    }
  }
  if (fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim() !== 'coffeescrafts.com') errors.push('CNAME must preserve coffeescrafts.com');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`HTML, local links/assets, placeholders, CNAME and LFS checks passed for ${files.length} output files.`);
}
module.exports = { checkOutput };
if (require.main === module) checkOutput(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });

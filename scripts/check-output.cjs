const fs = require('node:fs');
const path = require('node:path');
const { HtmlValidate, Parser } = require('html-validate');
const { serializeEmbed, httpUrl } = require('../site/previews');

// Decode the entities emitted by the build once, without altering script raw text.
const decodeContent = value => value.replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ({
  amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'",
}[entity]));

async function checkPreview(root, filename, html, validator) {
  const dom = new Parser(await validator.getConfigFor(filename)).parseHtml(html);
  const heads = dom.getElementsByTagName('head');
  if (heads.length !== 1) throw new Error('one head required');
  const head = heads[0];
  const attr = (node, key) => node.getAttribute(key)?.value;
  const scripts = head.getElementsByTagName('script').filter(node => attr(node, 'id') === 'discord:component-embed');
  if (scripts.length !== 1 || attr(scripts[0], 'type') !== 'application/json') throw new Error('one server-rendered component embed required');
  const json = scripts[0].textContent;
  const embed = JSON.parse(json);
  if (serializeEmbed(embed) !== json) throw new Error('unsafe or noncanonical embed JSON');
  const metas = head.getElementsByTagName('meta');
  function meta(key, required = true) {
    const matches = metas.filter(node => (attr(node, 'name') ?? attr(node, 'property')) === key);
    if (matches.length > 1) throw new Error(`duplicate fallback ${key}`);
    if (!matches.length && !required) return undefined;
    if (!matches.length || typeof attr(matches[0], 'content') !== 'string' || !attr(matches[0], 'content').trim()) throw new Error(`missing fallback ${key}`);
    return decodeContent(attr(matches[0], 'content'));
  }
  const required = ['description', 'og:title', 'og:description', 'og:url', 'og:site_name', 'og:type', 'og:image', 'og:image:alt',
    'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt', 'theme-color'];
  const values = Object.fromEntries(required.map(key => [key, meta(key)]));
  const canonicalTags = head.getElementsByTagName('link').filter(node => attr(node, 'rel') === 'canonical');
  if (canonicalTags.length !== 1 || typeof attr(canonicalTags[0], 'href') !== 'string') throw new Error('one canonical URL required');
  const canonical = httpUrl(decodeContent(attr(canonicalTags[0], 'href')));
  const pageUrl = new URL(canonical);
  if (decodeURIComponent(path.posix.basename(pageUrl.pathname)) !== path.basename(filename) || pageUrl.search || pageUrl.hash || values['og:url'] !== canonical) throw new Error('canonical and og:url must identify this page');
  const titles = head.getElementsByTagName('title');
  if (titles.length !== 1 || values['og:title'] !== decodeContent(titles[0].textContent) || values['twitter:title'] !== values['og:title']) throw new Error('fallback title must match page title');
  if (values['twitter:description'] !== values['og:description'] || values.description !== values['og:description']) throw new Error('fallback description must match page description');
  if (values['og:type'] !== 'website') throw new Error('invalid Open Graph type');
  if (values['twitter:card'] !== 'summary_large_image') throw new Error('invalid Twitter Card');
  if (!/^#[\da-f]{6}$/i.test(values['theme-color']) || parseInt(values['theme-color'].slice(1), 16) !== embed.component.accent_color) throw new Error('theme-color must match embed accent');
  if (values['og:site_name'].length > 256) throw new Error('fallback site name exceeds 256 characters');
  if (values['og:image:alt'] !== values['twitter:image:alt'] || values['og:image:alt'].length > 4096) throw new Error('fallback image alt must match');
  if (values['og:image'] !== values['twitter:image']) throw new Error('fallback image must match');
  if (embed.component.components[0]?.content !== `# ${values['og:title']}\n${values['og:description']}`) throw new Error('embed title and description must match page metadata');
  const dimensions = ['og', 'twitter'].map(prefix => {
    const width = meta(`${prefix}:image:width`, false);
    const height = meta(`${prefix}:image:height`, false);
    if (width === undefined && height === undefined) return undefined;
    if (!/^[1-9]\d*$/.test(width || '') || !/^[1-9]\d*$/.test(height || '')) throw new Error('image dimensions must be a positive width/height pair');
    return `${width}x${height}`;
  });
  if (dimensions.every(Boolean) && dimensions[0] !== dimensions[1]) throw new Error('fallback image dimensions must match');
  const gallery = embed.component.components.find(component => component.type === 12);
  if (gallery?.items[0]?.media.url !== values['og:image'] || gallery.items[0].description !== values['og:image:alt']) throw new Error('embed and fallback image must match');
  const urls = new Set([values['og:image'], ...embed.component.components.filter(component => component.type === 12).flatMap(component => component.items.map(item => item.media.url))]);
  for (const value of urls) {
    const media = new URL(httpUrl(value, true));
    if (media.origin !== pageUrl.origin) continue; // External media is checked only by authorized live verification.
    const basePath = new URL('.', pageUrl).pathname;
    const local = path.resolve(root, decodeURIComponent(media.pathname.slice(basePath.length)));
    if (!media.pathname.startsWith(basePath) || !local.startsWith(root + path.sep) || !fs.existsSync(local) || !fs.statSync(local).isFile()) throw new Error(`missing local preview image: ${value}`);
    const bytes = fs.readFileSync(local);
    const extension = path.extname(media.pathname).toLowerCase();
    const raster = { '.jpg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
      '.png': bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      '.gif': /^GIF8[79]a/.test(bytes.subarray(0, 6).toString()),
      '.webp': bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP',
      '.avif': bytes.subarray(4, 8).toString() === 'ftyp' && /avif|avis/.test(bytes.subarray(8, 32).toString()),
    };
    raster['.jpeg'] = raster['.jpg'];
    if (!raster[extension]) throw new Error(`local preview image has invalid raster signature: ${value}`);
  }
}

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
      await checkPreview(root, filename, html, validator);
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

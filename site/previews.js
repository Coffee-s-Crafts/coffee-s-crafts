// Discord's display-only component embed contract. No network or bot credentials.
const IMAGE_EXTENSION = /\.(png|gif|jpe?g|webp|avif)$/i;

function httpUrl(value, image = false) {
  if (typeof value !== 'string' || value.length > 2048 || /\s/.test(value)) throw new Error('Preview URL must be at most 2048 characters without whitespace');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Preview URL must use HTTP(S) without credentials');
  if (image && !IMAGE_EXTENSION.test(url.pathname)) throw new Error('Preview image must use a supported raster format');
  return value;
}

function serializeEmbed(payload) {
  const fail = message => { throw new Error(`Invalid Discord preview: ${message}`); };
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  if (!object(payload) || Object.keys(payload).join() !== 'component' || payload.component?.type !== 17) fail('one root Container required');
  let count = 0;
  let galleries = 0;
  const allowed = {
    17: ['type', 'accent_color', 'components'], 10: ['type', 'content'],
    12: ['type', 'items'], 14: ['type', 'divider', 'spacing'],
    1: ['type', 'components'], 2: ['type', 'style', 'url', 'label'],
  };
  function walk(component, parent) {
    if (!object(component) || !Number.isInteger(component.type) || !allowed[component.type]) fail('unsupported display component');
    if (++count > 40) fail('more than 40 components');
    if (Object.keys(component).some(key => !allowed[component.type].includes(key))) fail('unsupported component field');
    switch (component.type) {
      case 17:
        if (parent !== undefined) fail('nested Container');
        if (!Number.isInteger(component.accent_color) || component.accent_color < 0 || component.accent_color > 0xffffff) fail('invalid accent color');
        break;
      case 1:
        if (parent !== 17 || !Array.isArray(component.components) || component.components.length > 5) fail('invalid Action Row');
        break;
      case 2:
        if (parent !== 1 || component.style !== 5 || typeof component.label !== 'string' || !component.label.length || component.label.length > 80) fail('link-style button with label required');
        httpUrl(component.url);
        break;
      case 10:
        if (parent !== 17 || typeof component.content !== 'string' || !component.content.length || component.content.length > 4000) fail('invalid Text Display');
        break;
      case 12:
        if (parent !== 17 || !Array.isArray(component.items) || !component.items.length) fail('invalid Media Gallery');
        galleries += component.items.length;
        if (galleries > 10) fail('more than 10 gallery items');
        for (const item of component.items) {
          if (!object(item) || Object.keys(item).some(key => !['media', 'description'].includes(key)) || !object(item.media) || Object.keys(item.media).join() !== 'url') fail('invalid gallery item');
          httpUrl(item.media.url, true);
          if (item.description !== undefined && (typeof item.description !== 'string' || item.description.length > 1024)) fail('invalid media description');
        }
        break;
      case 14:
        if (parent !== 17 || (component.spacing !== undefined && ![1, 2].includes(component.spacing)) || (component.divider !== undefined && typeof component.divider !== 'boolean')) fail('invalid Separator');
        break;
    }
    if ([17, 1].includes(component.type)) {
      if (!Array.isArray(component.components) || !component.components.length) fail('missing child components');
      component.components.forEach(child => walk(child, component.type));
    }
  }
  walk(payload.component);
  // Escape raw-text HTML delimiters rather than HTML-encoding JSON quotes.
  const json = JSON.stringify(payload).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
  if (Buffer.byteLength(json, 'utf8') > 3000) fail('serialized payload exceeds 3000 UTF-8 bytes');
  return json;
}

function createEmbed({ title, description, image, alt, color, buttons, details }) {
  const components = [{ type: 10, content: `# ${title}\n${description}` }];
  if (details) components.push({ type: 10, content: details });
  components.push({ type: 12, items: [{ media: { url: image }, description: alt }] });
  components.push({ type: 14, spacing: 1 });
  components.push({ type: 1, components: buttons.map(({ label, url }) => ({ type: 2, style: 5, label, url })) });
  return serializeEmbed({ component: { type: 17, accent_color: color, components } });
}

module.exports = { httpUrl, serializeEmbed, createEmbed };

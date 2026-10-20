const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const directories = new Set(['render-dist', 'render-results', 'render-report', 'render-inventory']);
function assertRenderDirectory(directory, root = process.cwd()) {
  if (!directories.has(directory)) throw new Error(`Not a dedicated render directory: ${directory}`);
  const target = path.join(root, directory);
  function inspect(filename) {
    if (!fs.existsSync(filename) && !fs.lstatSync(filename, { throwIfNoEntry: false })) return;
    const entry = fs.lstatSync(filename);
    if (entry.isSymbolicLink()) throw new Error(`Render paths must not contain symlinks: ${filename}`);
    if (entry.isDirectory()) for (const name of fs.readdirSync(filename)) inspect(path.join(filename, name));
  }
  inspect(target);
  return target;
}
function artworkInventory(root = process.cwd()) {
  const inventory = {};
  function walk(directory) {
    for (const name of fs.readdirSync(path.join(root, directory)).sort()) {
      const relative = path.join(directory, name);
      const filename = path.join(root, relative);
      const stat = fs.lstatSync(filename);
      if (stat.isSymbolicLink()) throw new Error(`Artwork must not be a symlink: ${relative}`);
      if (stat.isDirectory()) walk(relative);
      else inventory[relative] = createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
    }
  }
  walk('assets');
  // Include all static files, so image changes cannot hide behind a new extension.
  walk('site/static');
  return inventory;
}
if (require.main === module) {
  const directory = assertRenderDirectory('render-inventory');
  const filename = path.join(directory, 'artwork.json');
  const inventory = artworkInventory();
  if (process.argv[2] === 'record') {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(filename, JSON.stringify(inventory, null, 2));
  } else if (process.argv[2] === 'verify') {
    if (JSON.stringify(JSON.parse(fs.readFileSync(filename))) !== JSON.stringify(inventory)) {
      throw new Error('Source artwork/static inventory changed during render checks');
    }
    console.log(`Preserved ${Object.keys(inventory).length} source artwork/static files byte-for-byte.`);
  } else throw new Error('Use record or verify');
}
module.exports = { assertRenderDirectory, artworkInventory };

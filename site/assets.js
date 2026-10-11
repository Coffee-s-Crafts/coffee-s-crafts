const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

// Stable for unchanged bytes; new bytes receive a distinct browser cache key.
function versionedAssetUrl(root, filename) {
  const hash = createHash('sha256').update(fs.readFileSync(path.join(root, filename))).digest('hex').slice(0, 16);
  return `${filename}?v=${hash}`;
}

module.exports = { versionedAssetUrl };

const fs = require('node:fs');
const path = require('node:path');
function reportSize(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected report symlink: ${filename}`);
    return total + (entry.isDirectory() ? reportSize(filename) : fs.statSync(filename).size);
  }, 0);
}
if (require.main === module) {
  if (!fs.statSync('render-report/index.html').isFile()) throw new Error('Missing HTML report');
  const bytes = reportSize('render-report');
  if (bytes > 15 * 1024 * 1024) throw new Error(`Report exceeds 15 MiB upload cap: ${bytes} bytes`);
  console.log(`Render report: ${bytes} bytes (maximum 15 MiB)`);
}
module.exports = { reportSize };

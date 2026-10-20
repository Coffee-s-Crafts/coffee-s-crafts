const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assertRenderDirectory, artworkInventory } = require('../scripts/render-safety.cjs');
const { reportSize } = require('../scripts/check-render-report.cjs');

test('render outputs cannot target artwork, deployment output, or parent directories', () => {
  for (const name of ['assets', 'site/static', 'dist', 'gh-pages', '.', '../render-dist', '/tmp/render-dist']) {
    assert.throws(() => assertRenderDirectory(name), /Not a dedicated/);
  }
});

test('source inventory detects edits, deletions and additions; output symlinks are rejected', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coffee-render-safety-'));
  try {
    fs.mkdirSync(path.join(root, 'assets'));
    fs.mkdirSync(path.join(root, 'site/static'), { recursive: true });
    const image = path.join(root, 'assets/original.png');
    fs.writeFileSync(image, 'original artwork fixture');
    const original = artworkInventory(root);
    fs.mkdirSync(path.join(root, 'render-report'));
    fs.symlinkSync(path.join(root, 'assets'), path.join(root, 'render-report/escape'));
    assert.throws(() => assertRenderDirectory('render-report', root), /symlinks/);
    assert.throws(() => reportSize(path.join(root, 'render-report')), /symlink/);
    assert.deepEqual(artworkInventory(root), original);
    fs.writeFileSync(image, 'different');
    assert.notDeepEqual(artworkInventory(root), original);
    fs.unlinkSync(image);
    assert.notDeepEqual(artworkInventory(root), original);
    fs.writeFileSync(image, 'original artwork fixture');
    fs.writeFileSync(path.join(root, 'assets/added.png'), 'new fixture');
    assert.notDeepEqual(artworkInventory(root), original);
  } finally {
    // Only this test-created OS temporary directory is removed, never repository data.
    fs.rmSync(root, { recursive: true, force: true });
  }
});

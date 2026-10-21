const test = require('node:test'), assert = require('node:assert');
const { scan } = require('../lib/scan');
const { project } = require('./helpers');
const { globToRegExp } = require('../lib/glob');
test('glob basics', () => { assert.ok(globToRegExp('src/**/*.js').test('src/a/b.js')); assert.ok(globToRegExp('src/**/*.js').test('src/b.js')); assert.ok(!globToRegExp('*.js').test('a/b.js')); assert.ok(globToRegExp('*.{js,ts}').test('x.ts')); });
test('honors .gitignore (root, nested, negation, dir-only)', () => {
  const d = project({ '.gitignore': '*.log\nbuild/\n!keep.log\n/rootonly.txt\n', 'a.log': 'x', 'keep.log': 'x', 'build/x.js': '1', 'src/rootonly.txt': 'k', 'rootonly.txt': 'r', 'src/.gitignore': 'gen.js\n', 'src/gen.js': '1', 'src/main.js': '1' });
  const up = scan(d).allowed.map(a => a.path).sort();
  assert.deepEqual(up, ['.gitignore', 'keep.log', 'src/.gitignore', 'src/main.js', 'src/rootonly.txt']);
});
test('honors allowlist include/exclude', () => {
  const d = project({ 'src/a.js': '1', 'src/b.py': '1', 'docs/x.md': '1', 'src/vendor/v.js': '1' }, { include: ['src/**'], exclude: ['src/vendor/**'] });
  assert.deepEqual(scan(d).allowed.map(a => a.path).sort(), ['src/a.js', 'src/b.py']);
});
test('skips binary and large files', () => {
  const d = project({ 'img.bin': Buffer.from([1, 0, 2, 3]), 'big.txt': 'x'.repeat(2000), 'small.txt': 'ok' }, { maxFileBytes: 1000 });
  const r = scan(d); assert.deepEqual(r.allowed.map(a => a.path), ['small.txt']);
  assert.match(r.skipped.find(s => s.path === 'img.bin').reason, /binary/); assert.match(r.skipped.find(s => s.path === 'big.txt').reason, /too large/);
});
test('scan refuses without opt-in config', () => { const fs = require('fs'), os = require('os'), path = require('path'); const d = fs.mkdtempSync(path.join(os.tmpdir(), 'x')); assert.throws(() => scan(d), /init/); });

const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { buildIndex } = require('../lib/indexer');
const { project, fake } = require('./helpers');
test('builds index.json, index.html and .pseudo files; excludes blocked', () => {
  const d = project({ 'a.js': 'function hi(n) {\n  return n;\n}\n', 'b.py': 'def go():\n    pass\n', 's.js': `k='${fake.aws}'` });
  const { index, outDir } = buildIndex(d);
  assert.deepEqual(index.files.map(f => f.path).sort(), ['a.js', 'b.py']);
  assert.equal(index.files.find(f => f.path === 'a.js').symbols[0].name, 'hi');
  assert.deepEqual(index.blocked, [{ path: 's.js', reasons: ['AWS access key id'] }]);
  assert.ok(fs.existsSync(path.join(d, '.pseudo/a.js.md'))); assert.ok(!fs.existsSync(path.join(d, '.pseudo/s.js.md')));
  const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'); assert.match(html, /const IDX=/); assert.ok(!html.includes(fake.aws));
  assert.equal(JSON.parse(fs.readFileSync(path.join(outDir, 'index.json'))).fileCount, 2);
});

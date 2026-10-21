const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path');
const { extract, toMarkdown } = require('../lib/pseudo');
const ex = p => fs.readFileSync(path.join(__dirname, '../examples/sample-app', p), 'utf8');
const names = i => i.symbols.map(s => s.name);
test('javascript outline', () => {
  const i = extract(ex('src/cart.js'), 'src/cart.js'); assert.equal(i.language, 'javascript');
  assert.deepEqual(names(i), ['total', 'Cart', 'Cart.constructor', 'Cart.add', 'applyCoupon']);
  const t = i.symbols[0]; assert.equal(t.params, 'items, taxRate'); assert.equal(t.doc, 'Compute the cart total including tax.');
  assert.ok(t.steps.includes('For each item of items')); assert.ok(t.steps.some(s => s.startsWith('Return sum')));
  assert.ok(i.symbols[3].steps.some(s => s.startsWith('If !item.sku then raise')));
});
test('typescript outline', () => {
  const i = extract(ex('src/api.ts'), 'src/api.ts'); assert.equal(i.language, 'typescript');
  const f = i.symbols.find(s => s.name === 'fetchUser'); assert.ok(f.async); assert.equal(f.params, 'id: string, retries: number');
  assert.ok(f.steps.includes('Try')); assert.ok(f.steps.some(s => s.startsWith('On error'))); assert.ok(f.steps.some(s => s.startsWith('Raise')));
});
test('python outline', () => {
  const i = extract(ex('scripts/report.py'), 'scripts/report.py'); assert.equal(i.language, 'python');
  assert.deepEqual(names(i), ['Report', 'Report.__init__', 'Report.summarize', 'load']);
  const s = i.symbols[2]; assert.equal(s.kind, 'method'); assert.equal(s.doc, 'Group totals by a column.');
  assert.ok(s.steps.includes('For each row in self.rows')); assert.ok(s.steps.includes('Note: skip refunds'));
  assert.match(i.summary, /Nightly sales report/);
});
test('go outline', () => {
  const i = extract(ex('cmd/main.go'), 'cmd/main.go'); assert.equal(i.language, 'go');
  assert.deepEqual(names(i), ['Server', 'Server.Start', 'main']);
  const st = i.symbols[1]; assert.equal(st.returns, 'error'); assert.ok(st.steps.some(s => s.startsWith('If s.Port == 0'))); assert.ok(st.steps.some(s => s.startsWith('Defer')));
});
test('markdown rendering', () => { const md = toMarkdown('a.py', extract('def f(x):\n    return x\n', 'a.py')); assert.match(md, /## FUNCTION f\(x\)/); assert.match(md, /1\. Return x/); });
test('unknown language yields no outline', () => assert.equal(extract('x', 'a.txt').language, null));

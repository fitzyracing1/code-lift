const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const { push } = require('../lib/push');
const { project, fake } = require('./helpers');
const bare = () => { const b = fs.mkdtempSync(path.join(os.tmpdir(), 'bare-')); execFileSync('git', ['init', '-q', '--bare', '-b', 'main', b]); return b; };
const refs = b => execFileSync('git', ['--git-dir', b, 'for-each-ref']).toString();
const d = project({ 'a.js': 'function x() {}\n', '.env': 'S=1', 'k.js': `t='${fake.gh}'` });
test('dry-run by default (no remote)', () => { const r = push(d); assert.ok(r.dryRun); assert.ok(r.files.includes('a.js') && r.files.includes('.pseudo/a.js.md')); assert.deepEqual(r.blocked.sort(), ['.env', 'k.js']); });
test('dry-run with remote leaves local bare repo untouched', () => { const b = bare(); const r = push(d, { remote: b }); assert.ok(r.dryRun && !r.pushed); assert.equal(refs(b), ''); });
test('confirmed push commits code + .pseudo to local bare repo, never secrets', () => {
  const b = bare(); const r = push(d, { remote: b, dryRun: false, author: 'Joshua Almeida <fitzyracing1@users.noreply.github.com>' });
  assert.ok(r.pushed);
  const tree = execFileSync('git', ['--git-dir', b, 'ls-tree', '-r', '--name-only', 'main']).toString().trim().split('\n').sort();
  assert.deepEqual(tree, ['.pseudo/a.js.md', 'a.js']);
  assert.match(execFileSync('git', ['--git-dir', b, 'log', '-1', '--format=%an']).toString(), /Joshua Almeida/);
});

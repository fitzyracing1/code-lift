const test = require('node:test'), assert = require('node:assert');
const { scan } = require('../lib/scan');
const { fake, project } = require('./helpers');
const cases = { 'key.pem.txt': fake.pem, 'aws.js': `k='${fake.aws}'`, 'gh.js': `t="${fake.gh}"`, 'oa.py': `K = "${fake.openai}"`, 'ent.js': `x = "${fake.entropy}"`, '.env': 'A=1', 'cfg/.env.production': 'B=2' };
const reasons = { 'key.pem.txt': /PEM/, 'aws.js': /AWS/, 'gh.js': /GitHub/, 'oa.py': /OpenAI/, 'ent.js': /entropy/, '.env': /\.env/, 'cfg/.env.production': /\.env/ };
const dir = project({ ...cases, 'ok.js': 'const a = 1;', '.env.example': 'A=' });
const r = scan(dir);
for (const f of Object.keys(cases)) test(`blocks ${f}`, () => {
  const b = r.blocked.find(x => x.path === f); assert.ok(b, f + ' not blocked'); assert.match(b.reasons.map(x => x.reason).join(), reasons[f]);
});
test('never includes secret values in findings', () => { const s = JSON.stringify(r); for (const v of Object.values(fake)) assert.ok(!s.includes(v.split('\n')[0].slice(-12))); });
test('allows clean files and .env.example', () => { assert.deepEqual(r.allowed.map(a => a.path).sort(), ['.env.example', 'ok.js']); });
test('low-entropy long strings not flagged', () => { const d = project({ 'a.js': 'const s = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1";' }); assert.equal(scan(d).blocked.length, 0); });

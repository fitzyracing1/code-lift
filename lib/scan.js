'use strict';
const fs = require('fs'), path = require('path');
const { parseGitignore, isIgnored } = require('./gitignore');
const { matchAny } = require('./glob');
const { scanSecrets } = require('./secrets');
const config = require('./config');

function isBinary(buf) { const n = Math.min(buf.length, 8000); for (let i = 0; i < n; i++) if (buf[i] === 0) return true; return false; }

function scan(root, cfg = config.load(root)) {
  const allowed = [], blocked = [], skipped = [];
  let rules = [];
  function walk(dirRel) {
    const abs = path.join(root, dirRel);
    const gi = path.join(abs, '.gitignore');
    if (fs.existsSync(gi)) rules = rules.concat(parseGitignore(fs.readFileSync(gi, 'utf8'), dirRel));
    for (const ent of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = dirRel ? `${dirRel}/${ent.name}` : ent.name;
      if (ent.name === '.git') continue;
      if (ent.isDirectory()) {
        if (isIgnored(rel, true, rules)) { skipped.push({ path: rel + '/', reason: 'gitignored' }); continue; }
        if (matchAny(rel + '/x', cfg.exclude) && cfg.exclude.some(g => g.endsWith('/**') && matchAny(rel, [g.slice(0, -3)]))) { skipped.push({ path: rel + '/', reason: 'excluded by allowlist' }); continue; }
        walk(rel); continue;
      }
      if (!ent.isFile() || ent.name === config.FILE) continue;
      if (isIgnored(rel, false, rules)) { skipped.push({ path: rel, reason: 'gitignored' }); continue; }
      if (!matchAny(rel, cfg.include) || matchAny(rel, cfg.exclude)) { skipped.push({ path: rel, reason: 'not in allowlist' }); continue; }
      const st = fs.statSync(path.join(root, rel));
      if (st.size > cfg.maxFileBytes) { skipped.push({ path: rel, reason: `too large (${st.size} bytes)` }); continue; }
      const buf = fs.readFileSync(path.join(root, rel));
      if (isBinary(buf)) { skipped.push({ path: rel, reason: 'binary' }); continue; }
      const findings = scanSecrets(rel, buf.toString('utf8'), cfg);
      if (findings.length) blocked.push({ path: rel, reasons: findings }); else allowed.push({ path: rel, bytes: st.size });
    }
  }
  walk('');
  return { allowed, blocked, skipped };
}
module.exports = { scan, isBinary };

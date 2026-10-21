#!/usr/bin/env node
'use strict';
const path = require('path');
const config = require('../lib/config');
const { scan } = require('../lib/scan');
const { buildIndex } = require('../lib/indexer');
const { push } = require('../lib/push');

const [cmd, ...rest] = process.argv.slice(2);
const flags = {}; const pos = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) { const k = rest[i].slice(2); const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true; flags[k] = v; }
  else pos.push(rest[i]);
}
const dir = path.resolve(pos[0] || '.');
const HELP = `code-lift <command> [dir] [options]
  init  [dir]                     write .code-lift.json allowlist (opt-in)
  scan  [dir] [--json]            list files that would upload; show blocked/skipped
  push  [dir] [--remote <git url>] [--confirm] [--branch main] [--author "Name <email>"]
                                  dry-run unless --remote AND --confirm are given
  index [dir] [--out site]        build index.json + index.html (also writes .pseudo/)`;
try {
  switch (cmd) {
    case 'init': { const r = config.init(dir); console.log(r.created ? `Created ${r.path}` : `${r.path} already exists`); break; }
    case 'scan': {
      const r = scan(dir);
      if (flags.json) { console.log(JSON.stringify(r, null, 2)); break; }
      console.log(`Would upload (${r.allowed.length}):`); r.allowed.forEach(f => console.log(`  + ${f.path}`));
      console.log(`Blocked by secret scan (${r.blocked.length}):`); r.blocked.forEach(b => console.log(`  x ${b.path} — ${b.reasons.map(x => x.reason + (x.line ? ` (line ${x.line})` : '')).join('; ')}`));
      console.log(`Skipped (${r.skipped.length}):`); r.skipped.forEach(s => console.log(`  - ${s.path} — ${s.reason}`));
      if (r.blocked.length) process.exitCode = 2;
      break;
    }
    case 'push': {
      const r = push(dir, { remote: flags.remote, dryRun: !flags.confirm, branch: flags.branch, author: flags.author });
      console.log(r.dryRun ? `[dry-run] would commit ${r.files.length} files${r.remote ? ' to ' + r.remote : ''}:` : (r.pushed ? `Pushed ${r.files.length} files to ${r.remote} (${r.commit.slice(0, 8)})` : r.note));
      if (r.dryRun) r.files.forEach(f => console.log(`  ${f}`));
      if (r.blocked.length) console.log(`Withheld (secrets): ${r.blocked.join(', ')}`);
      break;
    }
    case 'index': { const { index, outDir } = buildIndex(dir, flags.out ? path.resolve(flags.out) : undefined); console.log(`Indexed ${index.fileCount} files, ${index.files.reduce((n, f) => n + f.symbols.length, 0)} symbols -> ${outDir}/index.{json,html}`); break; }
    default: console.log(HELP); if (cmd && cmd !== 'help') process.exitCode = 1;
  }
} catch (e) { console.error('code-lift: ' + e.message); process.exitCode = 1; }

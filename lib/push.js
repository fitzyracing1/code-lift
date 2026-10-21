'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const { scan } = require('./scan');
const { generatePseudo } = require('./indexer');
const config = require('./config');

const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

// Dry-run unless opts.remote is set AND opts.dryRun is false.
function push(root, opts = {}) {
  const cfg = config.load(root);
  const res = scan(root, cfg);
  const pseudo = generatePseudo(root, cfg, res);
  const files = [...res.allowed.map(f => f.path), ...pseudo.map(p => p.pseudo)];
  const plan = { files, blocked: res.blocked.map(b => b.path), remote: opts.remote || null };
  if (!opts.remote || opts.dryRun !== false) return { ...plan, dryRun: true, pushed: false };
  const branch = opts.branch || 'main';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'code-lift-'));
  try {
    git(tmp, 'clone', '--quiet', opts.remote, 'repo');
    const wd = path.join(tmp, 'repo');
    try { git(wd, 'checkout', '-q', branch); } catch { git(wd, 'checkout', '-q', '-b', branch); }
    for (const f of files) {
      const dst = path.join(wd, f); fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(path.join(root, f), dst);
    }
    git(wd, 'add', '--', ...files);
    if (!git(wd, 'status', '--porcelain')) return { ...plan, dryRun: false, pushed: false, note: 'nothing to commit' };
    const author = opts.author || 'code-lift <code-lift@localhost>';
    const [, n, e] = author.match(/^(.*?)\s*<(.+)>$/) || [null, author, 'code-lift@localhost'];
    git(wd, '-c', `user.name=${n}`, '-c', `user.email=${e}`, 'commit', '-q', '-m', opts.message || `code-lift: ${files.length} files (code + pseudocode)`);
    git(wd, 'push', '-q', 'origin', `HEAD:${branch}`);
    return { ...plan, dryRun: false, pushed: true, commit: git(wd, 'rev-parse', 'HEAD') };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
module.exports = { push };

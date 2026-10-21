'use strict';
const { globToRegExp } = require('./glob');
// Parse .gitignore text into rules relative to `base` (posix path, '' for root).
function parseGitignore(text, base = '') {
  const rules = [];
  for (let line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    line = line.trimEnd();
    let negate = false;
    if (line.startsWith('!')) { negate = true; line = line.slice(1); }
    let dirOnly = false;
    if (line.endsWith('/')) { dirOnly = true; line = line.slice(0, -1); }
    const anchored = line.includes('/');
    if (line.startsWith('/')) line = line.slice(1);
    const pat = anchored ? line : '**/' + line;
    rules.push({ re: globToRegExp(pat), negate, dirOnly, base });
  }
  return rules;
}
// Returns true if relPath (posix) is ignored. isDir indicates a directory.
function isIgnored(relPath, isDir, rules) {
  let ignored = false;
  for (const r of rules) {
    if (r.base && !relPath.startsWith(r.base + '/')) continue;
    const p = r.base ? relPath.slice(r.base.length + 1) : relPath;
    if (r.dirOnly && !isDir) continue;
    if (r.re.test(p)) ignored = !r.negate;
  }
  return ignored;
}
module.exports = { parseGitignore, isIgnored };

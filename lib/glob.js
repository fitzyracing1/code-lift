'use strict';
// Minimal glob -> RegExp. Supports **, *, ?, {a,b}.
function globToRegExp(glob) {
  let re = '', i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i += 2;
        if (glob[i] === '/') { re += '(?:.*/)?'; i++; } else re += '.*';
        continue;
      }
      re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end > i) { re += '(?:' + glob.slice(i + 1, end).split(',').map(s => s.replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')).join('|') + ')'; i = end + 1; continue; }
      re += '\\{';
    } else re += c.replace(/[.+^$()|[\]\\}]/g, '\\$&');
    i++;
  }
  return new RegExp('^' + re + '$');
}
const matchAny = (p, globs) => globs.some(g => globToRegExp(g).test(p));
module.exports = { globToRegExp, matchAny };

'use strict';
// Language-agnostic pseudocode outline via lightweight line parsing (no AST deps, no APIs).
const LANG = { '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript', '.py': 'python', '.go': 'go' };
const langOf = p => LANG[(p.match(/\.[^./]+$/) || [''])[0]] || null;
const clean = s => s.trim().replace(/\s+/g, ' ').replace(/[{:]\s*$/, '').trim();
const short = (s, n = 70) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function parens(t) { const i = t.indexOf('('); if (i < 0) return null; let d = 0; for (let j = i; j < t.length; j++) { if (t[j] === '(') d++; else if (t[j] === ')' && --d === 0) return { inner: t.slice(i + 1, j), rest: t.slice(j + 1).trim().replace(/^[{]\s*/, '').replace(/;$/, '') }; } return null; }
function stepFor(line, lang) {
  const t = line.trim();
  let m;
  if ((m = t.match(/^(?:}\s*)?(else\s+)?if\s*\(/)) && (m.p = parens(t))) return (m[1] ? 'Else if ' : 'If ') + short(m.p.inner) + (m.p.rest && m.p.rest !== '}' ? ' then ' + short(m.p.rest.replace(/^(return|throw)\b/, x => x === 'return' ? 'return' : 'raise'), 40) : '');
  if ((m = t.match(/^(?:\/\/|#)\s*(.+)/)) && !t.startsWith('#!')) return 'Note: ' + short(m[1]);
  if ((m = t.match(/^(?:}\s*)?(?:else\s+)?if\s*\(?(.+?)\)?\s*[{:]?$/))) return (t.includes('else') ? 'Else if ' : 'If ') + short(clean(m[1]));
  if (/^(?:}\s*)?else\b/.test(t)) return 'Otherwise';
  if ((m = t.match(/^for\s*\(?(.+?)\)?\s*[{:]?$/))) return 'For each ' + short(clean(m[1]).replace(/^(const|let|var)\s+/, ''));
  if ((m = t.match(/^while\s*\(?(.+?)\)?\s*[{:]?$/))) return 'While ' + short(clean(m[1]));
  if ((m = t.match(/^switch\s*\(?(.+?)\)?\s*\{?$/))) return 'Branch on ' + short(clean(m[1]));
  if (/^try\b/.test(t)) return 'Try';
  if ((m = t.match(/^(?:}\s*)?(?:catch|except)\b\s*\(?([^){:]*)/))) return 'On error' + (m[1].trim() ? ' ' + short(m[1].trim()) : '');
  if ((m = t.match(/^return\b\s*(.*?);?$/))) return 'Return ' + (short(m[1]) || 'nothing');
  if ((m = t.match(/^(?:throw|raise)\s+(.*?);?$/))) return 'Raise ' + short(m[1]);
  if ((m = t.match(/^(?:await\s+)?([A-Za-z_][\w.]*)\(.*\);?$/)) && !/^(if|for|while|switch)$/.test(m[1])) return 'Call ' + m[1];
  if (lang === 'go' && (m = t.match(/^defer\s+(.+)/))) return 'Defer ' + short(m[1]);
  return null;
}

function blockEnd(lines, start, lang) {
  if (lang === 'python') {
    const ind = lines[start].match(/^\s*/)[0].length;
    let j = start + 1;
    for (; j < lines.length; j++) { const l = lines[j]; if (l.trim() && l.match(/^\s*/)[0].length <= ind) break; }
    return j;
  }
  let depth = 0, seen = false;
  for (let j = start; j < lines.length; j++) {
    const l = lines[j].replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '').replace(/\/\/.*$/, '');
    for (const c of l) { if (c === '{') { depth++; seen = true; } else if (c === '}') depth--; }
    if (seen && depth <= 0) return j + 1;
    if (!seen && j > start + 2) return start + 1;
  }
  return lines.length;
}

const DEFS = {
  javascript: [
    [/^\s*(?:export\s+)?(?:default\s+)?class\s+(\w+)(?:\s+extends\s+([\w.]+))?/, 'class'],
    [/^\s*(?:export\s+)?(?:default\s+)?(async\s+)?function\s*\*?\s*(\w+)\s*\(([^)]*)\)/, 'function'],
    [/^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(async\s+)?(?:function\s*)?\(([^)]*)\)\s*(?:=>)?/, 'arrow'],
    [/^\s+(?:static\s+)?(async\s+)?(?!if\b|for\b|while\b|switch\b|catch\b|return\b)(\w+)\s*\(([^)]*)\)\s*\{/, 'method'],
  ],
  python: [
    [/^\s*class\s+(\w+)(?:\(([^)]*)\))?\s*:/, 'class'],
    [/^\s*(async\s+)?def\s+(\w+)\s*\(([^)]*)\)/, 'function'],
  ],
  go: [
    [/^type\s+(\w+)\s+(struct|interface)\b/, 'type'],
    [/^func\s+(?:\((\w+)\s+\*?(\w+)\)\s+)?(\w+)\s*\(([^)]*)\)\s*([^{]*)\{/, 'gofunc'],
  ],
};
DEFS.typescript = DEFS.javascript.map(([re, k]) => [new RegExp(re.source.replace('\\(([^)]*)\\)', '(?:<[^>]*>)?\\(([^)]*)\\)')), k]);

function extract(text, file) {
  const lang = langOf(file);
  if (!lang) return { language: null, symbols: [], summary: '' };
  const lines = text.split('\n');
  const symbols = [];
  let classStack = [];
  for (let i = 0; i < lines.length; i++) {
    classStack = classStack.filter(c => i < c.end);
    for (const [re, kind] of DEFS[lang]) {
      const m = lines[i].match(re);
      if (!m) continue;
      if (kind === 'method' && !classStack.length) continue;
      let sym;
      if (kind === 'class') sym = { kind: 'class', name: m[1], extends: m[2] || undefined };
      else if (kind === 'type') sym = { kind: m[2], name: m[1] };
      else if (kind === 'gofunc') sym = { kind: m[2] ? 'method' : 'function', name: m[2] ? `${m[2]}.${m[3]}` : m[3], params: m[4].trim(), returns: m[5].trim() || undefined };
      else if (kind === 'arrow') sym = { kind: 'function', name: m[1], params: m[3].trim(), async: !!m[2] };
      else sym = { kind: kind === 'method' ? 'method' : 'function', name: m[2], params: m[3].trim(), async: !!m[1] };
      if (lang === 'python' && classStack.length && sym.kind === 'function') sym.kind = 'method';
      if (sym.kind === 'method' && classStack.length && !sym.name.includes('.')) sym.name = `${classStack[classStack.length - 1].name}.${sym.name}`;
      const end = blockEnd(lines, i, lang);
      sym.line = i + 1;
      // leading doc comment / docstring
      const doc = [];
      for (let k = i - 1; k >= 0 && /^\s*(\/\/|#|\*|\/\*\*)/.test(lines[k]); k--) doc.unshift(lines[k].replace(/^\s*(\/\*\*|\*\/|\*|\/\/|#)\s?/, '').trim());
      const ds = lang === 'python' && (lines[i + 1] || '').match(/^\s*(?:"""|''')(.*?)(?:"""|''')?\s*$/);
      if (ds && ds[1]) doc.push(ds[1]);
      sym.doc = doc.filter(Boolean).join(' ').replace(/\*\/$/, '').trim() || undefined;
      if (sym.kind === 'class' || sym.kind === 'struct' || sym.kind === 'interface') {
        classStack.push({ name: sym.name, end });
      } else {
        const steps = [];
        for (let k = i + 1; k < end && steps.length < 10; k++) {
          // skip nested-def bodies' detail? keep simple: only steps
          const s = stepFor(lines[k], lang); if (s) steps.push(s);
        }
        sym.steps = steps;
      }
      symbols.push(sym);
      break;
    }
  }
  const fileDoc = (lines.slice(0, 5).join('\n').match(/^(?:\/\/|#)(?!!)\s*(.+)|^"""(.+?)"""|^\/\*\*?\s*(.+)/m) || []).slice(1).find(Boolean);
  const summary = (fileDoc ? fileDoc.trim() + ' ' : '') + `${symbols.length} symbol(s): ` + symbols.map(s => s.name).join(', ');
  return { language: lang, symbols, summary: summary.trim() };
}

function toMarkdown(file, info) {
  const out = [`# ${file}`, '', `- Language: ${info.language}`, `- Summary: ${info.summary}`, ''];
  for (const s of info.symbols) {
    const sig = s.params !== undefined ? `${s.name}(${s.params})${s.returns ? ' -> ' + s.returns : ''}` : s.name + (s.extends ? ` extends ${s.extends}` : '');
    out.push(`## ${s.async ? 'async ' : ''}${s.kind.toUpperCase()} ${sig}  _(line ${s.line})_`);
    if (s.doc) out.push('', `> ${s.doc}`);
    if (s.steps) { out.push(''); if (!s.steps.length) out.push('1. (straight-line body)'); s.steps.forEach((st, n) => out.push(`${n + 1}. ${st}`)); }
    out.push('');
  }
  return out.join('\n');
}
module.exports = { extract, toMarkdown, langOf };

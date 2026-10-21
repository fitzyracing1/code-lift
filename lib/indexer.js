'use strict';
const fs = require('fs'), path = require('path');
const { scan } = require('./scan');
const { extract, toMarkdown } = require('./pseudo');
const config = require('./config');

// Generate .pseudo/<path>.md for every allowed source file.
function generatePseudo(root, cfg = config.load(root), res = scan(root, cfg)) {
  const written = [];
  for (const f of res.allowed) {
    const info = extract(fs.readFileSync(path.join(root, f.path), 'utf8'), f.path);
    if (!info.language) continue;
    const out = path.join(root, '.pseudo', f.path + '.md');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, toMarkdown(f.path, info));
    written.push({ path: f.path, pseudo: path.posix.join('.pseudo', f.path + '.md'), info });
  }
  return written;
}

function buildIndex(root, outDir = path.join(root, 'site')) {
  const cfg = config.load(root);
  const res = scan(root, cfg);
  const pseudo = new Map(generatePseudo(root, cfg, res).map(p => [p.path, p]));
  const files = res.allowed.map(f => {
    const p = pseudo.get(f.path);
    return { path: f.path, bytes: f.bytes, language: p ? p.info.language : null, pseudo: p ? p.pseudo : null, summary: p ? p.info.summary : '',
      symbols: p ? p.info.symbols.map(s => ({ name: s.name, kind: s.kind, line: s.line, params: s.params, doc: s.doc, steps: s.steps })) : [] };
  });
  const index = { generator: 'code-lift', version: 1, generatedAt: new Date().toISOString(), fileCount: files.length,
    blocked: res.blocked.map(b => ({ path: b.path, reasons: b.reasons.map(r => r.reason) })), files };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
  fs.writeFileSync(path.join(outDir, 'index.html'), html(index));
  return { index, outDir };
}

function html(index) {
  const data = JSON.stringify(index).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>code-lift index</title><style>body{font:15px system-ui;margin:2rem auto;max-width:900px;padding:0 1rem;background:#111;color:#eee}
input{width:100%;padding:.6rem;font-size:1rem;background:#222;color:#eee;border:1px solid #444}.r{border-bottom:1px solid #333;padding:.6rem 0}
.p{color:#9cf}.k{color:#fc6;font-size:.85em}.s{color:#aaa;font-size:.9em}ol{margin:.2rem 0 .2rem 1.2rem;color:#ccc;font-size:.88em}</style></head>
<body><h1>code-lift index</h1><p class="s">${index.fileCount} files · generated ${index.generatedAt}</p>
<input id="q" placeholder="Search files, symbols, pseudocode…" autofocus><div id="out"></div>
<script>const IDX=${data};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render(q){q=q.toLowerCase().trim();const out=[];for(const f of IDX.files){
const hay=[f.path,f.language,f.summary,...f.symbols.flatMap(s=>[s.name,s.doc,...(s.steps||[])])].join(' ').toLowerCase();
if(q&&!q.split(/\\s+/).every(t=>hay.includes(t)))continue;
out.push('<div class="r"><div class="p">'+esc(f.path)+' <span class="k">'+esc(f.language||'text')+'</span></div><div class="s">'+esc(f.summary)+'</div>'+
f.symbols.map(s=>'<div><b>'+esc(s.kind)+'</b> '+esc(s.name)+(s.params!==undefined?'('+esc(s.params)+')':'')+(s.steps&&s.steps.length?'<ol>'+s.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>':'')+'</div>').join('')+'</div>');}
document.getElementById('out').innerHTML=out.join('')||'<p>No matches.</p>';}
document.getElementById('q').oninput=e=>render(e.target.value);render('');</script></body></html>`;
}
module.exports = { buildIndex, generatePseudo };

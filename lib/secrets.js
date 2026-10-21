'use strict';
// Secret scanner. Reports reasons + line numbers only — NEVER the matched value.
const PATTERNS = [
  { reason: 'PEM private key', re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/ },
  { reason: 'AWS access key id', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { reason: 'AWS secret access key', re: /aws_secret_access_key\s*[=:]\s*['"]?[A-Za-z0-9/+=]{40}/i },
  { reason: 'GitHub token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { reason: 'OpenAI-style API key', re: /\bsk-(?:proj-|live-)?[A-Za-z0-9_-]{20,}\b/ },
  { reason: 'Slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
];
function entropy(s) {
  const f = {}; for (const c of s) f[c] = (f[c] || 0) + 1;
  let h = 0; for (const k in f) { const p = f[k] / s.length; h -= p * Math.log2(p); }
  return h;
}
const ENV_FILE = /(^|\/)\.env(\..+)?$/;
const ENV_OK = /\.(example|sample|template)$/;
function scanSecrets(relPath, text, opts = {}) {
  const threshold = opts.entropyThreshold ?? 4.5;
  const findings = [];
  if (ENV_FILE.test(relPath) && !ENV_OK.test(relPath)) findings.push({ reason: '.env file (environment secrets)', line: 0 });
  const lines = text.split('\n');
  lines.forEach((ln, i) => {
    for (const p of PATTERNS) if (p.re.test(ln)) findings.push({ reason: p.reason, line: i + 1 });
    // high-entropy quoted/assigned tokens
    for (const m of ln.matchAll(/['"=:]\s*['"]?([A-Za-z0-9+/_\-=]{24,})['"]?/g)) {
      const tok = m[1];
      if (/^[a-z_\-]+$/i.test(tok) || /^[0-9]+$/.test(tok)) continue;
      if (/[A-Za-z]/.test(tok) && /[0-9]/.test(tok) && entropy(tok) >= threshold) {
        if (!findings.some(f => f.line === i + 1)) findings.push({ reason: `high-entropy string (H=${entropy(tok).toFixed(2)})`, line: i + 1 });
      }
    }
  });
  return findings;
}
module.exports = { scanSecrets, entropy };

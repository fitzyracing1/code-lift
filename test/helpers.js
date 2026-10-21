'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
// Build fake tokens at runtime so the repo contains no literal secret-shaped strings.
const fake = {
  pem: ['-----BEGIN', 'RSA PRIVATE KEY-----'].join(' ') + '\nMIIEFAKE\n-----END RSA PRIVATE KEY-----',
  aws: 'AKIA' + 'FAKEFAKEFAKEFAKE',
  gh: 'ghp_' + 'A1b2C3d4'.repeat(4) + 'Zz99',
  openai: 'sk-' + 'fakeFAKE1234'.repeat(3),
  entropy: 'q8Zr2LxP0vN7mK4tW9bY3cJ6hF1sD5gA',
};
function project(files, cfg = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-test-'));
  for (const [p, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.writeFileSync(path.join(dir, p), c); }
  require('../lib/config').init(dir, cfg);
  return dir;
}
module.exports = { fake, project };

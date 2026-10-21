'use strict';
const fs = require('fs'), path = require('path');
const FILE = '.code-lift.json';
const DEFAULT = {
  include: ['**/*'],
  exclude: ['node_modules/**', '.git/**', '.pseudo/**', 'site/**', '**/*.min.js', '**/*.lock', 'package-lock.json'],
  maxFileBytes: 512000,
  entropyThreshold: 4.5,
};
function init(dir, overrides = {}) {
  const p = path.join(dir, FILE);
  if (fs.existsSync(p) && !overrides.force) return { path: p, created: false };
  const { force, ...rest } = overrides;
  fs.writeFileSync(p, JSON.stringify({ ...DEFAULT, ...rest }, null, 2) + '\n');
  return { path: p, created: true };
}
function load(dir) {
  const p = path.join(dir, FILE);
  if (!fs.existsSync(p)) throw new Error(`No ${FILE} in ${dir}. Run "code-lift init" first (opt-in required).`);
  return { ...DEFAULT, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
}
module.exports = { init, load, DEFAULT, FILE };

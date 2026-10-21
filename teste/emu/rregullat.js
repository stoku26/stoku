// Rregullat e Firestore merren nga SHENIME.md (blloku i kodit te "## Rregullat e Firestore"): burimi i vetëm i së vërtetës
const fs = require('fs');
const path = require('path');
function rregullat() {
  const t = fs.readFileSync(path.join(__dirname, '..', '..', 'SHENIME.md'), 'utf8');
  const i = t.indexOf('\n## Rregullat e Firestore');
  if (i === -1) throw new Error('SHENIME.md: s\'u gjet seksioni "## Rregullat e Firestore"');
  const m = t.slice(i).match(/\n```[a-z]*\n([\s\S]*?)\n```/);
  if (!m || !/rules_version/.test(m[1])) throw new Error('SHENIME.md: s\'u gjet blloku i rregullave');
  return m[1] + '\n';
}
module.exports = { rregullat };
if (require.main === module) process.stdout.write(rregullat());

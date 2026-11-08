// v281: pronari: "gjuhen apet ke shtu dikun dikun fjal sikur qysh e foli une ... bone gramatik". Tekstet e aplikacionit (telefon, PC,
// "Çka ka të re", Android, ora) në shqipe standarde: "krejt X" → "të gjitha / i gjithë / e gjithë X", "tash" → "tani", "çka" → "çfarë".
// Kontrollon që në tekstet që i sheh përdoruesi s'kanë mbetur këto forma, dhe versionet.
const fs = require('fs');
const path = require('path');
const RR = path.join(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const ecurr = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? ecurr(path.join(d, e.name)) : [path.join(d, e.name)]);
const skedaret = ['index.html', 'pc.html', 'app-tel.js', 'app-pc.js', 'teRejat.js', 'lejet.js', 'porta.js', 'privatesia.html', '404.html'].map(f => path.join(RR, f))
  .concat(ecurr(path.join(RR, 'vendas/app/src/main')).filter(f => f.endsWith('.kt')), ecurr(path.join(RR, 'ora/app/src/main')).filter(f => f.endsWith('.kt')));
const rxStr = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`]*)`/g;
const gjetjet = { krejt: [], tash: [], cka: [] };
for (const f of skedaret) {
  const s = fs.readFileSync(f, 'utf8');
  const tekstet = f.endsWith('.html') ? (s.match(/>[^<]{3,}</g) || []) : [...s.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n').matchAll(rxStr)].map(m => m[1] || m[2] || m[3] || '');
  for (const t of tekstet) {
    if (!/[a-zë] [a-zë]/i.test(t)) continue;
    const e = path.relative(RR, f) + ': ' + t.slice(0, 80);
    if (/(?<![\wë])[Kk]rejt (afatet|grupi|grupin|grupit|llogaritë|lejet|pajisjet|produktet|marketet|merchandiserët|kolegët|përdoruesit|aktivitetin|ekranin|Stoku-n)\b/.test(t)) gjetjet.krejt.push(e);
    if (/(?<![\wë])[Tt]ash(?![\wë])/.test(t)) gjetjet.tash.push(e);
    if (/(?<![\wëç])[Çç]ka(?![\wë])/.test(t)) gjetjet.cka.push(e);
  }
}
ok(!gjetjet.krejt.length, '1. pa "krejt X" (të gjitha / i gjithë / e gjithë)', gjetjet.krejt.slice(0, 5));
ok(!gjetjet.tash.length, '1. pa "tash" (tani)', gjetjet.tash.slice(0, 5));
ok(!gjetjet.cka.length, '1. pa "çka" (çfarë)', gjetjet.cka.slice(0, 5));
const tel = fs.readFileSync(path.join(RR, 'index.html'), 'utf8');
ok(/Çfarë ka të re/.test(tel), '2. "Çfarë ka të re" te Cilësimet');
const sw = fs.readFileSync(path.join(RR, 'sw.js'), 'utf8');
const nr = rx => Number((sw.match(rx) || [])[1]);
ok(nr(/stoku-v(\d+)/) >= 281 && nr(/app-tel\.js\?v=(\d+)/) >= 281 && nr(/app-pc\.js\?v=(\d+)/) >= 281 && nr(/teRejat\.js\?v=(\d+)/) >= 281 && nr(/lejet\.js\?v=(\d+)/) >= 6, '3. versionet ≥ 281');
ok(/\{ v: 281,[^\n]*platforma: 'tel'/.test(fs.readFileSync(path.join(RR, 'teRejat.js'), 'utf8')), '3. teRejat v281');
console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
process.exit(g ? 1 : 0);

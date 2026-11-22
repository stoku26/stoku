// v356 (pronari, foto: "Krejt" te "Expiring first" mbeti shqip: "kshyr kunke harru fjale ose fjali pa i perkthy"):
// çdo varg me shkronja te web-i dhe Android-i ka përkthim ose është te "injoro" (perkthimi-nxirr.py me filtrin e plotë);
// "Krejt" → "All"; ditët e javës të kalendarit në anglisht (web tel + PC + Android).
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
global.window = global; global.localStorage = { getItem: () => 'en', setItem() {} };
require(RR + '/perkthimi-en.js'); require(RR + '/perkthimi.js');
const t = window.StokuGjuha.t;
ok(t('Krejt') === 'All', '1. "Krejt" → "All"', t('Krejt'));
ok(t('Aktive') === 'Active' && t('Mbrapa') === 'Back' && t('Gjithsej: ') === 'Total: ' && t('Mesnata') === 'Midnight', '2. fjalët e vetme (butona, ngjyra) përkthehen');
const nx = require('child_process').spawnSync('python3', [__dirname + '/perkthimi-nxirr.py', 'krejt'], { encoding: 'utf8' });
const pa = JSON.parse(nx.stdout || '[]');
ok(pa.length === 0 && /gjithsej/.test(nx.stderr), '3. çdo varg me shkronja (web + Android main/github/play) ka përkthim ose është te "injoro"', pa.slice(0, 10));
ok(/ALB = re.compile\(r"\[A-Za-zËÇëç\]\{2\}"\)/.test(fs.readFileSync(__dirname + '/perkthimi-nxirr.py', 'utf8')), '3a. filtri i nxjerrjes merr çdo tekst (jo vetëm me ë/ç)');
for (const f of ['app-tel.js', 'app-pc.js']) ok(/DITET_EN = \['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'\]/.test(fs.readFileSync(RR + '/' + f, 'utf8')), '4. ' + f + ': ditët e kalendarit në anglisht');
ok(/listOf\("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"\)/.test(fs.readFileSync(RR + '/vendas/app/src/main/java/site/stoku/vendas/ui/GrupiEkrani.kt', 'utf8')), '4a. Android: ditët e kalendarit në anglisht');
ok(/Gjuha\.t\(t\)/.test(fs.readFileSync(RR + '/vendas/app/src/play/java/site/stoku/vendas/PerditesimiPlay.kt', 'utf8')), '5. versioni play: njoftimet e vogla (Toast) përkthehen');
console.log(g ? 'GABIME: ' + g : 'KREJT OK'); process.exit(g ? 1 : 0);

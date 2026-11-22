// v355: rastet e provës për binjakun Kotlin të perkthimi.js (vendas/logjika Perkthimi.kt, PerkthimiTest), të llogaritura me kodin e
// VËRTETË të web-it dhe me fjalorin perkthimi/en.json.   node teste/perkthimi-fikstura.js → vendas/logjika/src/test/resources/perkthimi-raste.json
const path = require('path'), fs = require('fs');
const RR = path.resolve(__dirname, '..');
global.window = global; global.localStorage = { getItem: () => 'en', setItem() {} };
window.STOKU_FJALORI_EN = JSON.parse(fs.readFileSync(RR + '/perkthimi/en.json', 'utf8'));
require(RR + '/perkthimi.js');
const t = window.StokuGjuha.t, FJ = window.STOKU_FJALORI_EN.fjalet;
let fara = 7; const rast = () => { fara = (fara * 1103515245 + 12345) % 2147483648; return fara / 2147483648; };
const nje = l => l[Math.floor(rast() * l.length)];
const k = Object.keys(FJ);
const EMRA = ['Viva Fresh', 'Pije', 'Agim', 'Lëng portokalli', 'Qumësht 1L', 'X'];
const raste = new Set(k);
k.forEach(x => { raste.add('  ' + x + ' '); raste.add(x.toLowerCase()); });
for (let i = 0; i < 1500; i++) {
  const a = nje(k), b = nje(k), n = String(Math.floor(rast() * 40));
  raste.add(nje([a + nje(EMRA), nje(EMRA) + ' · ' + a, a + ' · ' + b, a + '\n' + b, n + ' ditë', 'para ' + n + ' ditësh', n + ' copë · ' + nje(EMRA),
    'Skadon për ' + n + ' ditë.', n + ' ' + nje(['Nëntor', 'janar', 'Dhjetor 2026', 'E hënë']), 'sot ' + n + ':05', 'Fshi ' + nje(EMRA), n + '. ' + a,
    nje(EMRA) + ': ' + n + ' produkte, ' + n + ' copë', 'Ka skaduar para ' + n + ' ditësh. Ky produkt duhet të hiqet nga rafti/pozita.', a + ' ' + b]));
}
const out = [...raste].map(x => [x, t(x)]);
fs.writeFileSync(RR + '/vendas/logjika/src/test/resources/perkthimi-raste.json', JSON.stringify({ raste: out }));
console.log('raste', out.length, 'të ndryshuara', out.filter(x => x[0] !== x[1]).length);

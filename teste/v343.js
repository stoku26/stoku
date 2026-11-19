// v343: njoftimet push në iPhone/iPad pa "Stoku · " në titull (iOS e shton vetë "from Stoku"); Android dhe PC si më parë.
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const sw = lx('sw.js');
const m = /function titulliPush\(t, ua\) \{[\s\S]*?\n\}/.exec(sw);
ok(!!m, '0. sw.js ka titulliPush');
const titulliPush = new Function(m[0] + '; return titulliPush;')();
const IPH = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const AND = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
const PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const r = {
  iph: titulliPush('Stoku · Hiqe nga rafti', IPH), ipad: titulliPush('Stoku · Grupi', IPAD),
  and: titulliPush('Stoku · Hiqe nga rafti', AND), pc: titulliPush('Stoku · Skadon sot', PC),
  bosh: titulliPush('', IPH), vetem: titulliPush('Stoku', IPH), paUa: titulliPush('Stoku · Grupi', undefined)
};
ok(r.iph === 'Hiqe nga rafti' && r.ipad === 'Grupi', '1. iPhone/iPad: pa "Stoku · "', r);
ok(r.and === 'Stoku · Hiqe nga rafti' && r.pc === 'Stoku · Skadon sot' && r.paUa === 'Stoku · Grupi', '2. Android dhe PC: si më parë', r);
ok(r.bosh === 'Stoku' && r.vetem === 'Stoku', '3. pa titull: "Stoku"', r);
ok(/showNotification\(titulliPush\(d\.titulli, self\.navigator && self\.navigator\.userAgent\), op\)/.test(sw), '4. push-i e përdor titulliPush');
ok(+/stoku-v(\d+)/.exec(sw)[1] >= 343 && +/v: (\d+)/.exec(lx('versioni.js'))[1] >= 343, '0. versioni ≥ 343');
console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
process.exit(g ? 1 : 0);

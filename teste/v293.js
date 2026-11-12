// v293: kontrolli i projektit (pronari: "jepja komplet projektit një sy edhe përmirëso bugs e gabime tjera ... performancë e stabilitet").
//  1) ekipa.js: shenja e grupit publik dhe ajo e përmbledhjes së afateve ishin nën të njëjtin çelës ('stoku:grupi:publikuar'),
//     njëra e fshinte tjetrën dhe të dyja dërgoheshin sërish pa nevojë; tani secila ka çelësin e vet;
//  2) "Shto" te Afatet: ✕ ndërsa kamera ende ndizet s'hap më formën; skanimi i shpejtë (para se kamera të "mbarojë" nisjen)
//     s'e fshin më barkodin; kur kamera s'hapet fare, forma hapet si më parë.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../';
(async () => {
  // 1) çelësat
  const ek = fs.readFileSync(RR + 'ekipa.js', 'utf8');
  const f = (emri) => { const i = ek.indexOf('function ' + emri + '('); return ek.slice(i, ek.indexOf('\n    }\n', i)); };
  ok((ek.match(/var KEY_PUBLIKUAR\b/g) || []).length === 1, '1. një deklaratë e vetme e KEY_PUBLIKUAR');
  ok(/KEY_GRUPI_PUBLIKUAR = 'stoku:grupi:publikuar'/.test(ek) && /KEY_PUBLIKUAR = 'stoku:ekipa:publikuar'/.test(ek), '1. çelësat e ndarë (vlerat e vjetra ruhen)');
  ok(/KEY_GRUPI_PUBLIKUAR/.test(f('siguroGrupinPublik')) && !/KEY_PUBLIKUAR\b/.test(f('siguroGrupinPublik')), '1. grupi publik përdor çelësin e vet');
  ok(/lexo\(KEY_PUBLIKUAR\)/.test(f('publikoTani')) && !/KEY_GRUPI/.test(f('publikoTani')), '1. përmbledhja e afateve përdor çelësin e vet');

  const { b, p } = await hapFaqen(chromium);
  const st = () => p.evaluate(() => ({ kamera: document.getElementById('kamera').classList.contains('hapur'), forma: document.getElementById('dlgAfat').classList.contains('hapur'), barkodi: document.getElementById('afatBarkodi').value }));
  await p.click('#btnAfatet'); await p.waitForTimeout(800);
  // 2a) ✕ ndërsa kamera ndizet (p.sh. telefoni ende pyet për lejen)
  await p.evaluate(() => {
    window.__leximet = [];
    const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.__gumOrig = gum;
    navigator.mediaDevices.getUserMedia = c => new Promise(r => setTimeout(r, 1500)).then(() => gum(c));
  });
  await p.click('#afShto'); await p.waitForTimeout(300);
  await p.click('#mbyllKamere'); await p.waitForTimeout(2500);
  let s = await st();
  ok(!s.kamera && !s.forma, '2a. ✕ ndërsa kamera ndizet: s\'hapet asgjë', s);
  // 2b) skanim i shpejtë para se nisja të mbarojë (fokusi i ngadaltë): forma mbetet me barkodin
  await p.evaluate(() => {
    navigator.mediaDevices.getUserMedia = window.__gumOrig;
    const P = MediaStreamTrack.prototype, gc = P.getCapabilities;
    P.getCapabilities = function () { const c = Object.assign({}, gc.call(this)); c.focusMode = ['continuous']; return c; };
    P.applyConstraints = function (k) { const a = (k && k.advanced && k.advanced[0]) || {}; return a.focusMode ? new Promise(r => setTimeout(r, 2500)) : Promise.resolve(); };
    for (let i = 0; i < 9; i++) window.__leximet.push(['3830000622349', 'ean_13', 'brenda']);
  });
  await p.click('#afShto'); await p.waitForTimeout(4000);
  s = await st();
  ok(!s.kamera && s.forma && s.barkodi === '3830000622349', '2b. skanim i shpejtë: "Afat i ri" mbetet me barkodin', s);
  await p.evaluate(() => document.getElementById('dlgAfat').classList.remove('hapur'));
  // 2c) kamera s'hapet fare: forma direkt (si më parë)
  await p.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('pa kamerë')); });
  await p.click('#afShto'); await p.waitForTimeout(1500);
  s = await st();
  ok(!s.kamera && s.forma && s.barkodi === '', '2c. kamera s\'hapet: forma direkt', s);
  ok(!p.__gab.length, 'pa gabime JS', p.__gab);
  await b.close();
  const sw = fs.readFileSync(RR + 'sw.js', 'utf8');
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 293 && nr(/app-tel\.js\?v=(\d+)/) >= 293 && nr(/ekipa\.js\?v=(\d+)/) >= 293, 'versionet ≥ 293');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

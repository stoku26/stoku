// v292: pronari: (1) "te Cilësimet > Skanimi shtoja një opsion për me ja ndryshu zërin kur skanohet një barkod, 10 zëra të ndryshëm";
// (2) "te skanimi në web app flash-in djathtas poshtë, zoomin 1× poshtë majtas".
// Edhe Android (Hyrja 54) ka të njëjtat 10 zëra (ui/Zerat.kt): këtu krahasohen notat.
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../';
(async () => {
  // A) 10 zëra, të gjithë të ndryshëm; Android ka të njëjtat
  const js = fs.readFileSync(RR + 'app-tel.js', 'utf8');
  const blloku = js.slice(js.indexOf('var ZERAT = ['), js.indexOf('];', js.indexOf('var ZERAT = [')) + 2);
  const ZERAT = Function(blloku.replace('var ZERAT =', 'return'))();
  ok(ZERAT.length === 10, 'A. 10 zëra', ZERAT.length);
  const nenshkrimet = ZERAT.map(z => JSON.stringify(z.n));
  ok(new Set(nenshkrimet).size === 10 && new Set(ZERAT.map(z => z.id)).size === 10 && new Set(ZERAT.map(z => z.emri)).size === 10, 'A. secili zë ndryshe (notat, id, emri)');
  ok(ZERAT[0].id === 'klasik' && JSON.stringify(ZERAT[0].n) === '[[1800,0,150,"square"]]', 'A. i pari = bip-i i deritanishëm (parazgjedhja)');
  const kt = fs.readFileSync(RR + 'vendas/app/src/main/java/site/stoku/vendas/ui/Zerat.kt', 'utf8');
  const ktZerat = [...kt.matchAll(/Zeri\("([^"]+)", "([^"]+)", listOf\((.*)\)\),?\n/g)].map(m => ({ id: m[1], emri: m[2],
    n: [...m[3].matchAll(/Nota\(([\d.]+), (\d+), (\d+), "(\w+)"(?:, ([\d.]+)(?:, (true|false))?)?\)/g)].map(x => { const a = [Number(x[1]), Number(x[2]), Number(x[3]), x[4]]; if (x[5] !== undefined) { a.push(Number(x[5])); if (x[6] === 'true') a.push(1); } return a; }) }));
  const normal = a => a.map(z => ({ id: z.id, emri: z.emri, n: z.n.map(n => { const b = n.slice(0, 4); b.push(n[4] || 0, n[5] ? 1 : 0); return b; }) }));
  ok(JSON.stringify(normal(ktZerat)) === JSON.stringify(normal(ZERAT)), 'A. Android (Zerat.kt) = web (ZERAT)', ktZerat.length);
  const sk = fs.readFileSync(RR + 'vendas/app/src/main/java/site/stoku/vendas/ui/Skaneri.kt', 'utf8');
  ok(/Zerat\.luaj\(StokuApp\.prefsOse\("zeri", "klasik"\)\)/.test(sk) && !/ToneGenerator/.test(sk), 'A. Android: bip-i luan zërin e zgjedhur');

  const { b, p } = await hapFaqen(chromium);
  await p.evaluate(() => {
    window.__osc = [];
    const AC = window.AudioContext || window.webkitAudioContext;
    const vj = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { const o = vj.call(this); const st = o.start.bind(o); o.start = function (t) { window.__osc.push(o.type + ':' + o.frequency.value); return st(t); }; return o; };
    // kamera: drita dhe zmadhimi; drita del vetëm pas 1 s (si disa Android-a)
    const P = MediaStreamTrack.prototype, gc = P.getCapabilities, t0 = { v: 0 };
    window.__t0 = t0;
    P.getCapabilities = function () { const c = Object.assign({}, gc ? gc.call(this) : {}); c.zoom = { min: 1, max: 4, step: 0.1 }; if (t0.v && performance.now() - t0.v > 1000) c.torch = true; else delete c.torch; return c; };
    P.applyConstraints = function () { return Promise.resolve(); };
  });

  // B) Kamera: zmadhimi poshtë majtas, drita poshtë djathtas
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  await p.evaluate(() => { window.__leximet = []; window.__t0.v = performance.now(); });
  await p.click('#btnKamera'); await p.waitForTimeout(700);
  let st = await p.evaluate(() => ({ zoom: getComputedStyle(document.getElementById('kameraZoom')).display !== 'none', drita: getComputedStyle(document.getElementById('kameraDrita')).display !== 'none' }));
  ok(st.zoom && !st.drita, 'B. në fillim: zmadhimi duket, drita jo ende (telefoni s\'e ka treguar)', st);
  await p.waitForTimeout(3000);
  const poz = await p.evaluate(() => {
    const r = id => { const x = document.getElementById(id).getBoundingClientRect(); return { l: Math.round(x.left), r: Math.round(x.right), t: Math.round(x.top), b: Math.round(x.bottom), dukt: getComputedStyle(document.getElementById(id)).display !== 'none' }; };
    const k = document.querySelector('.skan-korniza').getBoundingClientRect();
    return { w: innerWidth, h: innerHeight, zoom: r('kameraZoom'), drita: r('kameraDrita'), kutiaPoshte: Math.round(k.bottom), lart: document.querySelectorAll('.kamera-veprime .kamera-ikone').length };
  });
  ok(poz.drita.dukt, 'B. drita del kur telefoni e tregon më vonë (rikontrolli pas 1.2 s / 3 s)', poz.drita);
  ok(poz.zoom.l < poz.w * 0.3 && poz.zoom.t > poz.h * 0.7, 'B. zmadhimi (1×) poshtë majtas', poz.zoom);
  ok(poz.drita.r > poz.w * 0.7 && poz.drita.t > poz.h * 0.7 && Math.abs(poz.drita.t - poz.zoom.t) < 3, 'B. drita poshtë djathtas, në një vijë me zmadhimin', poz.drita);
  ok(poz.lart === 0 && poz.zoom.t > poz.kutiaPoshte, 'B. lart te "Mbyll" s\'mbetet asnjë buton; butonat nën kutinë', poz);
  await p.click('#kameraZoom'); await p.click('#kameraDrita'); await p.waitForTimeout(200);
  st = await p.evaluate(() => ({ zoom: document.getElementById('kameraZoom').textContent, drita: document.getElementById('kameraDrita').classList.contains('aktiv') }));
  ok(st.zoom === '2×' && st.drita, 'B. butonat punojnë si më parë', st);
  await p.screenshot({ path: __dirname + '/v292-kamera.png' });
  await p.click('#mbyllKamere'); await p.waitForTimeout(400);
  await p.click('#btnMbrapa').catch(() => {}); await p.waitForTimeout(400);

  // C) Cilësimet → Skanimi: 10 zëra; prekja e zgjedh, e ruan dhe e luan
  await p.click('#btnOpsione'); await p.waitForTimeout(500);
  await p.click('#tabSkenimi'); await p.waitForTimeout(500);
  const lista = await p.evaluate(() => [...document.querySelectorAll('#listaZerave button')].map(b => ({ t: b.textContent, a: b.classList.contains('aktiv') })));
  ok(lista.length === 10 && lista[0].a && lista.filter(x => x.a).length === 1, 'C. 10 zëra te Cilësimet, "Bip klasik" i zgjedhur', lista.map(x => x.t));
  await p.evaluate(() => { window.__osc = []; });
  await p.click('#listaZerave button[data-v="akord"]'); await p.waitForTimeout(500);
  st = await p.evaluate(() => ({ zeri: JSON.parse(localStorage.getItem('stoku:opsione:v1')).zeri, osc: window.__osc, aktiv: document.querySelector('#listaZerave button.aktiv').getAttribute('data-v') }));
  ok(st.zeri === 'akord' && st.aktiv === 'akord' && st.osc.length === 3 && st.osc.every(x => x.startsWith('sine')), 'C. "Tre nota": zgjidhet, ruhet dhe luhet (3 nota)', st);
  await p.screenshot({ path: __dirname + '/v292-cilesimet.png', fullPage: false });
  // me tingullin e fikur: lista zbehet, por prova prapë luhet
  await p.click('#rreshtTingull'); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({ fikur: document.getElementById('seksionZeri').classList.contains('fikur'), ndezur: document.getElementById('opsTingull').checked }));
  ok(st.fikur && !st.ndezur, 'C. tingulli i fikur: lista e zërave zbehet', st);
  await p.click('#rreshtTingull'); await p.waitForTimeout(300);
  await p.click('#listaZerave button[data-v="cicerime"]'); await p.waitForTimeout(400);
  await p.keyboard.press('Escape').catch(() => {});
  await p.evaluate(() => document.getElementById('dlgOpsione').classList.remove('hapur'));
  await p.reload(); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:opsione:v1')).zeri) === 'cicerime', 'C. zgjedhja mbetet pas rifreskimit');

  // D) skanimi luan zërin e zgjedhur
  await p.evaluate(() => {
    window.__osc = [];
    const AC = window.AudioContext || window.webkitAudioContext;
    const vj = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { const o = vj.call(this); const st = o.start.bind(o); o.start = function (t) { window.__osc.push(o.type + ':' + o.frequency.value); return st(t); }; return o; };
  });
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  const s = await skano(p, Array(7).fill(['3830000622349', 'ean_13', 'brenda']), 400);
  st = await p.evaluate(() => window.__osc);
  ok(s.dialogu && st.length === 1 && st[0].startsWith('sine'), 'D. skanimi luan "Cicërimë" (jo bip-in e vjetër)', { s: s.dialogu, osc: st });
  await mbyll(p);
  ok(!p.__gab.length, 'pa gabime JS', p.__gab);
  await b.close();
  // versionet
  const sw = fs.readFileSync(RR + 'sw.js', 'utf8'), ix = fs.readFileSync(RR + 'index.html', 'utf8');
  const nr = (s, rx) => Number((s.match(rx) || [])[1]);
  ok(nr(sw, /stoku-v(\d+)/) >= 292 && nr(sw, /app-tel\.js\?v=(\d+)/) >= 292 && nr(ix, /app-tel\.js\?v=(\d+)/) >= 292 && nr(sw, /stoku\.css\?v=(\d+)/) >= 66 && nr(ix, /stoku\.css\?v=(\d+)/) >= 66, 'versionet ≥ 292');
  ok(/\{ v: 292,[^\n]*platforma: 'tel'/.test(fs.readFileSync(RR + 'teRejat.js', 'utf8')), 'teRejat v292 (tel)');
  ok(/Hyrja\(54,/.test(fs.readFileSync(RR + 'vendas/app/src/main/java/site/stoku/vendas/TeRejat.kt', 'utf8')), 'Android Hyrja 54');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

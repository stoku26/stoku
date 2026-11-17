// v292: pronari: "te skanimi në web app flash-in djathtas poshtë, zoomin 1× poshtë majtas".
// (10 zërat e skanimit të v292 u hoqën te v294 me kërkesë të pronarit: shih teste/v294.js.)
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../';
(async () => {
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

  // B) Kamera: zmadhimi dhe drita (v326: lart djathtas, si te Android-i)
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
  // v326 (pronari): "bone ... identik si te android appit": zmadhimi dhe drita lart djathtas (para tyre ishin poshtë, v292)
  ok(poz.zoom.l > poz.w * 0.6 && poz.zoom.b < poz.kutiaPoshte, 'B. v326: zmadhimi (1×) lart djathtas, si te Android-i', poz.zoom);
  ok(poz.drita.r > poz.w * 0.9 && Math.abs(poz.drita.t - poz.zoom.t) < 3 && poz.drita.l > poz.zoom.r, 'B. v326: drita lart djathtas, pas zmadhimit, në një vijë', poz.drita);
  ok(poz.lart === 2, 'B. v326: të dy butonat lart (te kontrollet)', poz);
  await p.click('#kameraZoom'); await p.click('#kameraDrita'); await p.waitForTimeout(200);
  st = await p.evaluate(() => ({ zoom: document.getElementById('kameraZoom').textContent, drita: document.getElementById('kameraDrita').classList.contains('aktiv') }));
  ok(st.zoom === '2×' && st.drita, 'B. butonat punojnë si më parë', st);
  await p.screenshot({ path: __dirname + '/v292-kamera.png' });
  await p.click('#mbyllKamere'); await p.waitForTimeout(400);
  await p.click('#btnMbrapa').catch(() => {}); await p.waitForTimeout(400);

  ok(!p.__gab.length, 'pa gabime JS', p.__gab);
  await b.close();
  // versionet
  const sw = fs.readFileSync(RR + 'sw.js', 'utf8'), ix = fs.readFileSync(RR + 'index.html', 'utf8');
  const nr = (s, rx) => Number((s.match(rx) || [])[1]);
  ok(nr(sw, /stoku-v(\d+)/) >= 292 && nr(sw, /app-tel\.js\?v=(\d+)/) >= 292 && nr(ix, /app-tel\.js\?v=(\d+)/) >= 292 && 'versionet ≥ 292');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

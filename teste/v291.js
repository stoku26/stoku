// v291: pronari: "në web app autofokusi i kamerës s'po bën. Rregulloje edhe mos prish ndonjë send tjetër".
// Fokusi vendoset disa herë pas nisjes së kamerës (disa telefona e harrojnë kërkesën e parë); kamera vetëm me "single-shot"
// fokusohet çdo 2.5 s sa kohë skanohet; pas zmadhimit dhe dritës fokusi vendoset sërish; kur kamera mbyllet, ndalet gjithçka.
// Kamera e rreme e Chromium-it s'ka fokus: getCapabilities / applyConstraints të gjurmës zëvendësohen këtu.
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const { b, p } = await hapFaqen(chromium);
  const vendosFokusin = (fm, zoom) => p.evaluate(([fm, zoom]) => {
    window.__fokus = []; window.__fm = fm;
    const P = MediaStreamTrack.prototype;
    if (!P.__gc) { P.__gc = P.getCapabilities; P.__ac = P.applyConstraints; }
    P.getCapabilities = function () { const c = Object.assign({}, this.__gc ? this.__gc() : {}); if (window.__fm) c.focusMode = window.__fm; else delete c.focusMode; if (zoom) c.zoom = { min: 1, max: 4, step: 0.1 }; c.torch = true; return c; };
    P.applyConstraints = function (k) {
      const a = (k && k.advanced && k.advanced[0]) || {};
      if (a.focusMode) window.__fokus.push({ m: a.focusMode, t: Math.round(performance.now()) });
      if (a.zoom || a.torch !== undefined) window.__fokus.push({ tjeter: Object.keys(a)[0], t: Math.round(performance.now()) });
      return Promise.resolve();
    };
  }, [fm, zoom]);
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);

  // 1) kamera me fokus të vazhdueshëm: vendoset menjëherë dhe edhe 2 herë (0.7 s, 2 s), pastaj s'ripërsëritet
  await vendosFokusin(['manual', 'single-shot', 'continuous'], true);
  await p.evaluate(() => { window.__leximet = []; });
  await p.click('#btnKamera'); await p.waitForTimeout(4200);
  let f = await p.evaluate(() => window.__fokus.filter(x => x.m));
  ok(f.length >= 3 && f.every(x => x.m === 'continuous') && f.length <= 4, '1. fokusi i vazhdueshëm vendoset pas nisjes dhe edhe 2 herë (pa u përsëritur pa fund)', f);
  // zmadhimi dhe drita e rivendosin fokusin
  await p.evaluate(() => { window.__fokus = []; });
  if (await p.isVisible('#kameraZoom')) await p.click('#kameraZoom');
  await p.click('#kameraDrita'); await p.waitForTimeout(400);
  f = await p.evaluate(() => window.__fokus);
  ok(f.filter(x => x.tjeter).length === 2 && f.filter(x => x.m === 'continuous').length >= 2, '1. pas zmadhimit dhe dritës fokusi vendoset sërish', f);
  await p.click('#mbyllKamere'); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__fokus = []; }); await p.waitForTimeout(3000);
  ok((await p.evaluate(() => window.__fokus.length)) === 0, '1. kamera e mbyllur: s\'ka më thirrje fokusi');

  // 2) kamera vetëm me "single-shot": fokusohet çdo 2.5 s sa është hapur
  await vendosFokusin(['manual', 'single-shot'], false);
  await p.evaluate(() => { window.__leximet = []; });
  await p.click('#btnKamera'); await p.waitForTimeout(6500);
  f = await p.evaluate(() => window.__fokus.filter(x => x.m));
  ok(f.length >= 5 && f.every(x => x.m === 'single-shot'), '2. vetëm "single-shot": fokusohet vazhdimisht (çdo 2.5 s)', f.length);
  await p.click('#mbyllKamere'); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__fokus = []; }); await p.waitForTimeout(3000);
  ok((await p.evaluate(() => window.__fokus.length)) === 0, '2. kamera e mbyllur: intervali ndalet');

  // 3) pa fokus fare (iPhone / kamera pa kontroll): asgjë s'thirret, kamera punon
  await vendosFokusin(null, false);
  await p.evaluate(() => { window.__fokus = []; });
  const s = await skano(p, Array(7).fill(['3830000622349', 'ean_13', 'brenda']), 400);
  const f3 = await p.evaluate(() => window.__fokus);
  ok(s.dialogu && !f3.some(x => x.m), '3. pa kontroll fokusi: s\'thirret asgjë dhe skanimi punon si më parë', { s, f3 });
  await mbyll(p);
  ok(!p.__gab.length, 'pa gabime JS', p.__gab);
  await b.close();
  // versionet
  const sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8');
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 291 && nr(/app-tel\.js\?v=(\d+)/) >= 291, 'versionet ≥ 291');
  ok(/\{ v: 291,[^\n]*platforma: 'tel'/.test(fs.readFileSync(__dirname + '/../teRejat.js', 'utf8')), 'teRejat v291 (tel)');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

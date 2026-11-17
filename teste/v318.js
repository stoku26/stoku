// v318 e kishte fshirë "Çfarë ka të re"; v323 (pronari: "shtoja apet cfare ka te re ... te versioni pc e len veq te cilesimet ...
// ne web app telefon e len te cilesimet afer privatesise"): u rikthye, por NUK del më vetë në hyrje (as telefon, as PC), edhe kur
// pajisja ka parë një version të vjetër. Numri i versionit te Cilësimet vjen nga versioni.js.
const { chromium } = require('./pw.js');
const fs = require('fs');
const PORTI = process.env.PORTI || '8765';
const RR = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + f, 'utf8');
(async () => {
  const kodi = (lx('app-tel.js') + lx('app-pc.js')).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
  ok(!/tregoTeRejat|stoku-porta-hapur'[^\n]*TeRejat|teRejatPas\(versioniIPare/.test(kodi), '0. web: pa shfaqjen vetë në hyrje');
  const V = require(RR + 'versioni.js');
  ok(V.v >= 323 && /^\d+\.\d+\.\d+$/.test(V.emri), '0. versioni.js', V);
  const b = await chromium.launch();
  {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '200'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    });
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(5000);
    const r = await p.evaluate(() => ({ hapur: [...document.querySelectorAll('.mbulese.hapur')].map(x => x.id), versioni: document.getElementById('opsVersioni').textContent }));
    ok(!r.hapur.length, '1. telefoni: asgjë s\'hapet vetë (as "Çfarë ka të re")', r);
    ok(r.versioni.trim() === V.emri, '1. Cilësimet: "Stoku " + versioni', r.versioni);
    ok(!gab.length, '1. pa gabime JS', gab);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => localStorage.setItem('stoku:te-rejat:pare', '200'));
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/pc.html'); await p.waitForTimeout(4000);
    const r = await p.evaluate(() => ({ hapur: [...document.querySelectorAll('.mbulese.hapur')].map(x => x.id), versioni: document.getElementById('opsVersioni').textContent }));
    ok(!r.hapur.includes('dlgTeRejat') && r.versioni === V.emri, '2. PC: "Çfarë ka të re" s\'del vetë; versioni', r);
    ok(!gab.length, '2. pa gabime JS', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

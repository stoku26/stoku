// v278: pronari: menyja e "Eksporto" "menxi po dallohet ne dark mode" dhe "Shto" pa vijën e kaltër, "njejt si" Importo / Eksporto.
//  1) "Shto": korniza, ngjyra e tekstit dhe e ikonës njësoj si "Importo";
//  2) menyja: në temën e errët sfondi --sb-surface-2 dhe vija e bardhë 16%; 3) versionet.
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch();
  for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(t => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); localStorage.setItem('stoku:tema', t);
    }, tema);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    await p.click('#btnAfatet'); await p.waitForTimeout(700);
    const sh = await p.evaluate(() => { const e = document.getElementById('afShto'), im = document.getElementById('afImporto'), s = getComputedStyle(e), si = getComputedStyle(im);
      return { hije: s.boxShadow, c: s.color, hijeIm: si.boxShadow, cIm: si.color, ikC: getComputedStyle(e.querySelector('svg')).color }; });
    ok(sh.hije === sh.hijeIm && sh.c === sh.cIm && sh.ikC === sh.cIm, tema + ' 1. "Shto" pa kornizë blu, njësoj si "Importo"', sh);
    await p.click('#afExcel'); await p.waitForTimeout(200);
    const m = await p.evaluate(() => { const e = document.getElementById('afExcelMenu'), s = getComputedStyle(e), f = getComputedStyle(document.querySelector('#dlgAfatet .faqe-kuti') || document.body);
      return { bg: s.backgroundColor, hije: s.boxShadow, faqja: getComputedStyle(document.body).backgroundColor }; });
    ok(tema === 'light' ? m.bg === 'rgb(255, 255, 255)' : (m.bg === 'rgb(31, 35, 42)' && /rgba\(255, 255, 255, 0\.16\)/.test(m.hije)), tema + ' 2. menyja e "Eksporto" dallohet (e errët: sfond më i çelët + vijë)', m);
    ok(!p.__gab.length, tema + ' pa gabime JS', p.__gab);
    if (tema === 'light') {
      const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
      const nr = rx => Number((sw.match(rx) || [])[1]);
      ok(nr(/stoku-v(\d+)/) >= 278 && nr(/stoku\.css\?v=(\d+)/) >= 62 && nr(/teRejat\.js\?v=(\d+)/) >= 278, '3. CACHE ≥ 278, stoku.css ≥ 62, teRejat ≥ 278');
      ok(/\{ v: 278,[^\n]*platforma: 'tel'/.test(await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()))), '3. teRejat v278');
    }
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

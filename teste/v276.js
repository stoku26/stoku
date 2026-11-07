// v276: pronari zgjodhi "ideja 8" (katrorë gri, vetëm ikona, pa tekst) për "Shto" dhe ish "Excel", me ikonën "C1" të dosjes
// (rrethi me shigjetat lart/poshtë, "pak ma mrena"). Njësoj te Android-i (PamjetTest).
//  1) "Shto" dhe "Skedarët": pa tekst, me aria-label, sfondi --sb-surface-2 në të dyja temat, ikona 30 / 34;
//  2) "Shto" hap "Afat i ri"; "Skedarët" hap menynë me 4 opsionet;
//  3) versionet.
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch();
  for (const [tema, sfondi] of [['light', 'rgb(241, 239, 235)'], ['dark', 'rgb(31, 35, 42)']]) {
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
    const bt = await p.evaluate(() => ['afShto', 'afExcel'].map(id => { const e = document.getElementById(id), s = getComputedStyle(e), r = e.getBoundingClientRect(), v = e.querySelector('svg').getBoundingClientRect();
      return { id, tekst: e.textContent.trim(), label: e.getAttribute('aria-label'), bg: s.backgroundColor, h: Math.round(r.height), ik: Math.round(v.width), qendra: Math.abs((v.left + v.right) / 2 - (r.left + r.right) / 2) < 4 }; }));
    ok(bt.every(x => x.tekst === '') && bt[0].label === 'Shto afat' && bt[1].label === 'Skedarët', tema + ' 1. pa tekst, me emrat për lexuesin e ekranit', bt);
    ok(bt.every(x => x.bg === sfondi && x.h >= 61 && x.qendra) && bt[0].ik === 30 && bt[1].ik === 34, tema + ' 1. katrorë gri, ikona në mes (30 / 34)', bt);
    ok(await p.evaluate(() => !!document.querySelector('#afExcel .ik-shenja') && !document.querySelector('#afExcel .sb-xls')), tema + ' 1. dosja me rrethin e shigjetave, pa "XLS"');
    await p.click('#afExcel'); await p.waitForTimeout(200);
    const m = await p.evaluate(() => Array.from(document.querySelectorAll('#afExcelMenu .sb-menu__item')).filter(x => x.offsetParent).map(x => x.textContent.trim()));
    ok(m.join() === 'Importo Excel,Eksporto Excel,Eksporto PDF,Eksporto si foto', tema + ' 2. "Skedarët" hap menynë', m);
    await p.click('#afExcel'); await p.waitForTimeout(150);
    await p.click('#afShto'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.getElementById('dlgAfat').classList.contains('hapur')), tema + ' 2. "Shto" hap "Afat i ri"');
    ok(!p.__gab.length, tema + ' pa gabime JS', p.__gab);
    if (tema === 'light') {
      const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
      const nr = rx => Number((sw.match(rx) || [])[1]);
      ok(nr(/stoku-v(\d+)/) >= 276 && nr(/stoku\.css\?v=(\d+)/) >= 60 && nr(/teRejat\.js\?v=(\d+)/) >= 276, '3. CACHE ≥ 276, stoku.css ≥ 60, teRejat ≥ 276');
      ok(/\{ v: 276,[^\n]*platforma: 'tel'/.test(await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()))), '3. teRejat v276');
    }
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

// v280: pronari: menyja e "Eksporto" "ngushtoje boxin sa teksti"; teksti i importit vetëm për importin, forma "C"
// ("Importo afatet nga një skedar Excel (.xlsx) ose .csv."), pa pjesën për muajt. Njësoj në PC dhe në Android (Hyrja 41).
//  1) menyja aq e gjerë sa teksti; 2) teksti i importit (telefoni + PC); 3) versionet.
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
    await p.click('#afExcel'); await p.waitForTimeout(200);
    const m = await p.evaluate(() => { const e = document.getElementById('afExcelMenu'), r = e.getBoundingClientRect();
      const t = Math.max(...Array.from(e.querySelectorAll('.sb-menu__item')).map(i => i.scrollWidth));
      return { w: Math.round(r.width), t, zbrazet: Math.round(r.width) - t }; });
    ok(m.w < 210 && m.zbrazet >= 0 && m.zbrazet <= 16, tema + ' 1. menyja e "Eksporto" aq e gjerë sa teksti (jo më 210 px)', m);
    await p.click('#afExcel'); await p.waitForTimeout(150);
    await p.click('#afImporto'); await p.waitForTimeout(400);
    const tx = await p.evaluate(() => document.querySelector('#aiHapi1 .hint').textContent.trim());
    ok(tx === 'Importo afatet nga një skedar Excel (.xlsx) ose .csv.', tema + ' 2. teksti i importit (forma "C")', tx);
    ok(!p.__gab.length, tema + ' pa gabime JS', p.__gab);
    if (tema === 'light') {
      const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
      const nr = rx => Number((sw.match(rx) || [])[1]);
      ok(nr(/stoku-v(\d+)/) >= 280 && nr(/stoku\.css\?v=(\d+)/) >= 63 && nr(/teRejat\.js\?v=(\d+)/) >= 280, '3. CACHE ≥ 280, stoku.css ≥ 63, teRejat ≥ 280');
      ok(/\{ v: 280,[^\n]*platforma: 'tel'/.test(await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()))), '3. teRejat v280');
    }
    await ctx.close();
  }
  const pc = require('fs').readFileSync(__dirname + '/../pc.html', 'utf8');
  ok(/<small>Importo afatet nga një skedar Excel \(\.xlsx\) ose \.csv\.<\/small>/.test(pc) && !/lexohen si ai muaj/.test(pc), '2. PC: i njëjti tekst i importit');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

// v287: pronari e provoi pamjen "si xham" (v286) dhe s'i pëlqeu: "Ktheje te mas komplet… heke glassin edhe n'web edhe ne android app".
// Dritaret që dalin mbi faqe janë prapë me ngjyrë të plotë, pa turbullim; në kod s'mbetet asgjë nga xhami. MOS e rikthe.
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch();
  for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 800 }, serviceWorkers: 'block', colorScheme: tema });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(tema => {
      if (location.protocol !== 'http:') return;
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't', merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), ruaj: async () => ({ ok: true }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); localStorage.setItem('stoku:tema', tema);
    }, tema);
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2500);
    const stili = sel => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return { bg: c.backgroundColor, bf: c.backdropFilter || '' }; }, sel);
    const plote = x => x && /^rgb\(/.test(x.bg) && !/blur/.test(x.bf);
    await p.click('#btnAfatet'); await p.waitForTimeout(700);
    await p.click('#afShto'); await p.waitForTimeout(700);
    const dr = await stili('#dlgAfat > .dialog'), mb = await stili('#dlgAfat');
    ok(plote(dr), tema + ': dritarja "Afat i ri" me ngjyrë të plotë, pa turbullim', dr);
    ok(mb && /0\.[56]\)$/.test(mb.bg), tema + ': hija mbi faqe si më parë', mb && mb.bg);
    await p.evaluate(() => document.getElementById('dlgAfat').classList.remove('hapur')); await p.waitForTimeout(300);
    await p.click('#afExcel'); await p.waitForTimeout(400);
    ok(plote(await stili('#afExcelMenu')), tema + ': menyja e eksportit me ngjyrë të plotë');
    ok(plote(await stili('#toast')), tema + ': njoftimi i shkurtër me ngjyrë të plotë');
    ok(!gab.length, tema + ' pa gabime JS', gab);
    await ctx.close();
  }
  const rr = __dirname + '/../';
  ok(!/xham/i.test(fs.readFileSync(rr + 'css/stoku.css', 'utf8')), 'css/stoku.css pa bllokun e xhamit');
  ok(!fs.existsSync(rr + 'vendas/app/src/main/java/site/stoku/vendas/ui/Xhami.kt') && !/turbull|Xhami/.test(['ui/Perberesit.kt', 'ui/MarketetUI.kt', 'ui/CilesimetEkrani.kt', 'MainActivity.kt'].map(f => fs.readFileSync(rr + 'vendas/app/src/main/java/site/stoku/vendas/' + f, 'utf8')).join('')), 'Android pa Xhami.kt dhe pa turbullim');
  const sw = fs.readFileSync(rr + 'sw.js', 'utf8'), ix = fs.readFileSync(rr + 'index.html', 'utf8');
  const nr = (s, rx) => Number((s.match(rx) || [])[1]);
  ok(nr(sw, /stoku-v(\d+)/) >= 287 && nr(sw, /css\/stoku\.css\?v=(\d+)/) >= 65 && nr(ix, /css\/stoku\.css\?v=(\d+)/) === nr(sw, /css\/stoku\.css\?v=(\d+)/), 'versionet (CACHE ≥ 287, stoku.css ≥ 65)');
  const tr = fs.readFileSync(rr + 'teRejat.js', 'utf8');
  ok(/\{ v: 287,[^\n]*platforma: 'tel'/.test(tr) && !/v: 286/.test(tr), 'teRejat: v287, pa hyrjen e xhamit (v286)');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

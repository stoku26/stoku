// v329 / Android Hyrja 91 (pronari, 18.11.2026): "Stoku" (pjesa e produkteve) → "Malli" kudo që duket:
//  pllaka e PC-së, adresa #/malli (lidhja e vjetër #/permbledhja të çon aty), Cilësimet, lejet (web + Lejet.kt), Grupi.
//  Leja mbetet "stoku" (e ruajtur te llogaritë dhe rregullat); emri i aplikacionit mbetet "Stoku".
const pw = require('./pw.js');
const { chromium } = pw;
const fs = require('fs');
const PORTI = process.env.PORTI || '8765';
const RR = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + f, 'utf8');
const t = Date.now();
const FOLDERA = [{ id: 'pije', emri: 'Pije' }];
const PR = { 'pije::3800001': { kategoriaId: 'pije', barkodi: '3800001', emri: 'Ujë Rugove 1.5L', sasia: 24, furnizuesi: 'Rugove', ndryshuarSe: t } };

(async () => {
  // ===== Kodi =====


  const lk = lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/Lejet.kt');
  ok(/k: 'stoku', emri: 'Malli'/.test(lx('lejet.js')) && /grupi: 'Malli'/.test(lx('lejet.js')) && !/grupi: 'Stoku'|emri: 'Stoku'/.test(lx('lejet.js')), '1. lejet.js: "Malli" (çelësi mbetet "stoku")');
  ok(/Leja\("stoku", "Malli"/.test(lk) && !/grupi = "Stoku"/.test(lk), '1. Lejet.kt: "Malli"');
  ok(!/te Stoku, te Përmbledhja|folderit te Stoku|Stoku dhe afatet|Stoku është bosh/.test(lx('app-pc.js') + lx('app-tel.js') + lx('pc.html') + lx('lejet.js')), '1. pa tekstet e vjetra "folderit te Stoku", "Stoku dhe afatet", "Stoku është bosh"');
  ok(/p === 'permbledhja' \? '#\/malli'/.test(lx('app-pc.js')), '2. PC: adresa e Mallit #/malli');
  ok(/Hyrja\(91, "2026-11-18"/.test(lx('vendas/app/src/main/java/site/stoku/vendas/TeRejat.kt')), '3. TeRejat.kt: Hyrja 91');


  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([f, p]) => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    if (!sessionStorage.getItem('mbushur')) {
      sessionStorage.setItem('mbushur', '1');
      localStorage.setItem('stoku:foldera:v1', JSON.stringify(f)); localStorage.setItem('stoku:produktet:v2', JSON.stringify(p));
    }
  }, [FOLDERA, PR]);
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto('http://127.0.0.1:' + PORTI + '/pc.html#/permbledhja'); await p.waitForTimeout(2500);
  ok(p.url().endsWith('#/malli'), '2. lidhja e vjetër #/permbledhja → #/malli', p.url());
  const pll = await p.evaluate(() => document.querySelector('#btnAkordStoku b').textContent.trim());
  ok(pll === 'Malli', '1. pllaka e PC-së quhet "Malli"', pll);
  await p.click('#btnAkordAfatet'); await p.waitForTimeout(500);
  ok(/#\/afatet$/.test(p.url()), '2. Afatet: #/afatet', p.url());
  await p.click('#btnAkordStoku'); await p.waitForTimeout(500);
  ok(/#\/malli$/.test(p.url()), '2. klikimi te "Malli" → #/malli', p.url());
  await p.evaluate(() => { location.hash = '#/f/pije'; }); await p.waitForTimeout(500);
  ok(/#\/f\/pije$/.test(p.url()), '2. folderi: #/f/pije punon', p.url());
  await p.goBack(); await p.waitForTimeout(500);
  ok(/#\/malli$/.test(p.url()), '2. "Mbrapa" nga folderi → #/malli', p.url());
  await p.evaluate(() => { location.hash = '#/grupi/koleget'; }); await p.waitForTimeout(500);
  ok(/#\/grupi\/koleget$/.test(p.url()), '2. #/grupi/koleget punon ende', p.url());
  await p.evaluate(() => { location.hash = '#/ekipa/anetaret'; }); await p.waitForTimeout(500);
  ok(/#\/grupi\/koleget$/.test(p.url()), '2. #/ekipa/anetaret punon ende', p.url());
  await p.evaluate(() => { location.hash = '#/malli'; }); await p.waitForTimeout(500);
  const tx = await p.evaluate(() => ({ h2: [...document.querySelectorAll('.ops-faqe-krye h2')].map(x => x.textContent), nav: document.querySelector('#opsSkeda button[data-faqe="stoku"] .ops-nav-tekst') && document.querySelector('#opsSkeda button[data-faqe="stoku"] .ops-nav-tekst').firstChild.textContent.trim() }));
  ok(tx.nav === 'Malli' && tx.h2.indexOf('Malli') !== -1 && tx.h2.indexOf('Stoku') === -1, '1. Cilësimet e PC-së: "Malli"', tx);
  ok(!gab.length, 'pa gabime JS', gab);
  await ctx.close();
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

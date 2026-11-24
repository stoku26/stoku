// v359: në anglisht "Today" (Sot) te kutia e ditëve të afatit (52 px) ndahej në dy rreshta ("Toda / y") te pamjet e Play-it.
// Web: klasa sb-days__big--sot (14px, pa ndarje) vetëm në anglisht; Android: 14 sp, një rresht. Në shqip "Sot" mbetet 19px.
const { chromium } = require('./pw.js');
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
const { krijoFirestore } = require('./fs-server.js');
const B = 'http://127.0.0.1:' + (process.env.PORTI || '8765');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lex = f => fs.readFileSync(RR + '/' + f, 'utf8');
const kt = lex('vendas/app/src/main/java/site/stoku/vendas/ui/AfatetEkrani.kt');
ok(/tx\(if \(Gjuha\.en && madh == "Sot"\) 14 else 19, 700, ng\), maxLines = 1, softWrap = false/.test(kt), '1. Android: "Today" 14 sp në një rresht, shqip 19');
ok(/\.sb\[lang="en"\] \.sb-days__big--sot \{ font-size: 14px; white-space: nowrap; \}/.test(lex('css/stoku.css')), '2. web: CSS vetëm për anglisht');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const sot = (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date());
(async () => {
  const b = await chromium.launch();
  for (const gj of ['en', 'sq']) {
    const F = krijoFirestore();
    F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: Date.now() });
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, userAgent: UA });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel', { afatet: [{ id: 'a1', emri: 'Milk 1L', barkodi: '389001001', data: sot, sasia: 6, statusi: 'aktiv', ndryshuarSe: Date.now() }] });
    await ctx.addInitScript(x => { try { localStorage.setItem('stoku:gjuha', x); } catch (e) { /* ok */ } }, gj);
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + '/index.html'); await p.waitForTimeout(3000);
    await p.click('#btnAfatet'); await p.waitForTimeout(1200);
    const d = await p.evaluate(() => {
      const e = document.querySelector('.sb-days__big--sot'); if (!e) return null;
      const k = e.parentElement.getBoundingClientRect(), r = e.getBoundingClientRect();
      return { t: e.textContent, fs: getComputedStyle(e).fontSize, lart: Math.round(r.height), gjer: Math.round(r.width), kuti: Math.round(k.width) };
    });
    if (gj === 'en') ok(d && d.t === 'Today' && d.fs === '14px' && d.lart < 24 && d.gjer <= d.kuti, '3. en: "Today" 14px, një rresht, brenda kutisë', d);
    else ok(d && d.t === 'Sot' && d.fs === '19px', '4. sq: "Sot" mbetet 19px', d);
    ok(!gab.length, '5. ' + gj + ': pa gabime', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'KREJT OK'); process.exit(g ? 1 : 0);
})();

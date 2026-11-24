// v358 (pronari: "Boni ne anglisht termet dhe kushtet edhe privatesine kur osht appi ne anglisht kto me kon anglisht. Kur osht ne shqip
// me shkru ne shqip te dyja"): privacy.html / terms.html (binjakët anglisht të privatesia.html / kushtet.html); lidhjet e aplikacionit
// (porta, Cilësimet në telefon + PC, Android) hapin faqen në gjuhën e pamjes.
const { chromium } = require('./pw.js');
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lex = f => fs.readFileSync(RR + '/' + f, 'utf8');
const csp = s => (/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(s) || [])[1];
for (const [sq, en] of [['privatesia.html', 'privacy.html'], ['kushtet.html', 'terms.html']]) {
  const a = lex(sq), b = lex(en);
  ok(/<html lang="en">/.test(b) && csp(a) === csp(b), '1. ' + en + ': lang="en", e njëjta CSP si ' + sq);
  const h2a = (a.match(/<h2/g) || []).length, h2b = (b.match(/<h2/g) || []).length, lia = (a.match(/<li>/g) || []).length, lib = (b.match(/<li>/g) || []).length;
  ok(h2a === h2b && lia === lib, '1a. ' + en + ': të njëjtat pjesë si ' + sq + ' (titujt, pikat)', [h2a, h2b, lia, lib]);
  ok(!/[ëçË]/.test(b.slice(b.indexOf('<body>')).replace(/lang="sq">Shqip</, '')), '1b. ' + en + ': pa tekst shqip');
  ok(a.includes('href="/' + en + '" hreflang="en"') && b.includes('href="/' + sq + '" hreflang="sq"'), '1c. lidhjet Shqip / English mes dy faqeve');
  ok(/id="fshirja"/.test(b) === /id="fshirja"/.test(a), '1d. ' + en + ': i njëjti #fshirja');
}
ok(/privacy\.html'/.test(lex('porta.js')) && /eshteEn\(\) \? 'privacy\.html' : 'privatesia\.html'/.test(lex('app-tel.js')) && /eshteEn\(\) \? 'terms\.html' : 'kushtet\.html'/.test(lex('app-pc.js')), '2. web: porta + Cilësimet (tel, PC) sipas gjuhës');
const kt = lex('vendas/app/src/main/java/site/stoku/vendas/ui/CilesimetEkrani.kt') + lex('vendas/app/src/main/java/site/stoku/vendas/ui/Porta.kt');
ok(/if \(Gjuha\.en\) "https:\/\/stoku\.site\/privacy\.html" else "https:\/\/stoku\.site\/privatesia\.html"/.test(kt) && (kt.match(/if \(Gjuha\.en\) "https:\/\/stoku\.site\/terms\.html"/g) || []).length === 2, '3. Android: Cilësimet + krijimi i llogarisë sipas gjuhës');
(async () => {
  const b = await chromium.launch();
  for (const [gj, priv, kush] of [['en', 'privacy.html', 'terms.html'], ['sq', 'privatesia.html', 'kushtet.html']]) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(x => { try { localStorage.setItem('stoku:gjuha', x); } catch (e) { /* ok */ } }, gj);
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(1500);
    const h = await p.evaluate(() => [...document.querySelectorAll('#porta a[target="_blank"]')].map(a => a.getAttribute('href')));
    ok(h.includes(priv) && h.includes(kush), '4. porta (' + gj + '): ' + priv + ' + ' + kush, h);
    const q = await ctx.newPage(); await q.goto('http://127.0.0.1:' + PORTI + '/' + priv);
    ok(await q.evaluate(() => document.documentElement.lang) === (gj === 'en' ? 'en' : 'sq'), '4a. ' + priv + ' hapet');
    await ctx.close();
  }
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'KREJT OK'); process.exit(g ? 1 : 0);
})();

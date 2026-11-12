// v272: pronari: "Ne web app veq ne telefon te qato madhesi qe jan shtoje edhe ni opsion per shkronja te vogla".
// Cilësimet → Pamja → Madhësia e shkronjave: "E vogël" (zoom .9), "Normale", "E madhe" (1.12). Vetëm telefoni (PC-ja mbetet me dy).
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const rr = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const x = e.getBoundingClientRect();
  return { y: Math.round(x.top), b: Math.round(x.bottom), x: Math.round(x.left), r: Math.round(x.right), h: Math.round(x.height) }; }, sel);
const gjendja = p => p.evaluate(() => ({ attr: document.body.getAttribute('data-madhesi'), zoom: getComputedStyle(document.body).zoom,
  aktiv: Array.from(document.querySelectorAll('#segMadhesia button.aktiv')).map(b => b.getAttribute('data-v')),
  ruajtur: (JSON.parse(localStorage.getItem('stoku:opsione:v1') || '{}')).madhesia }));

(async () => {
  const { b, p } = await hapFaqen(chromium);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  await p.click('#btnOpsione'); await p.waitForTimeout(700);
  await p.click('text=Pamja'); await p.waitForTimeout(600);

  // 1. v296: dy zgjedhje ("E madhe" e vjetër u hoq; shih teste/v296.js); fillimisht "Normale" (e_vogel, zoom .9)
  let gj = await gjendja(p);
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9' && gj.aktiv.join() === 'e_vogel', '1. v296: fillimisht "Normale" (e_vogel)', gj);
  await p.click('#segMadhesia button[data-v="normale"]'); await p.waitForTimeout(300);

  // 2. "E vogël": krejt faqja .9, ruhet pas rihapjes
  await p.click('#segMadhesia button[data-v="e_vogel"]'); await p.waitForTimeout(300);
  gj = await gjendja(p);
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9' && gj.aktiv.join() === 'e_vogel' && gj.ruajtur === 'e_vogel', '2. "E vogël": zoom 0.9, e zgjedhur dhe e ruajtur', gj);
  await p.reload(); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  gj = await gjendja(p);
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9', '2. mbetet edhe pas rihapjes', gj);
  const tb = await rr(p, '#tabet');
  ok(tb.b === 844 && tb.x === 0 && tb.r === 390, '2. shiriti poshtë mbetet në fund të ekranit', tb);
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  const fab = await rr(p, '#skanFab');
  ok(fab.b >= 824 && fab.b <= 828 && Math.abs((fab.x + fab.r) / 2 - 195) <= 1, '2. butoni lundrues poshtë në mes (v273: parazgjedhja), 20 × .9 nga fundi', fab);
  await p.click('#btnKamera'); await p.waitForTimeout(1500);
  const km = await rr(p, '#kamera'), vd = await rr(p, '#kamera video');
  ok(km.y === 0 && km.b === 844 && vd.y === 0 && vd.b === 844 && vd.r === 390, '2. kamera mbush të gjithë ekranin', { km, vd });

  // 3. v296: vlerë e panjohur e ruajtur → parazgjedhja "Normale" (e_vogel)
  await p.evaluate(() => localStorage.setItem('stoku:opsione:v1', JSON.stringify({ madhesia: 'shume_e_vogel' })));
  await p.reload(); await p.waitForTimeout(2000);
  gj = await gjendja(p);
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9', '3. vlerë e panjohur → "Normale" (e_vogel)', gj);
  ok(!p.__gab.length, '3. telefoni: pa gabime JS', p.__gab);
  await b.close();

  // 4. Kompjuteri: s'ndryshon (vetëm "Normale" dhe "E madhe")
  {
    const b2 = await chromium.launch();
    const ctx = await b2.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    const q = await ctx.newPage();
    await q.goto('http://127.0.0.1:' + PORTI + '/pc.html'); await q.waitForTimeout(1500);
    const v = await q.evaluate(() => Array.from(document.querySelectorAll('#opsMadhesia button')).map(b => b.getAttribute('data-v')));
    ok(v.join() === 'normale,e_madhe', '4. PC: vetëm "Normale" dhe "E madhe" (pa ndryshim)', v);
    const sw = await q.evaluate(() => fetch('/sw.js').then(x => x.text()));
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 272 && nr(/app-tel\.js\?v=(\d+)/) >= 272 && nr(/teRejat\.js\?v=(\d+)/) >= 272 && nr(/stoku\.css\?v=(\d+)/) >= 57, '5. CACHE, app-tel, teRejat ≥ 272, stoku.css ≥ 57');
    const tr = await q.evaluate(() => fetch('/teRejat.js?v=' + Date.now()).then(x => x.text()));
    ok(/\{ v: 272,[^\n]*platforma: 'tel'/.test(tr), '5. teRejat v272 (telefon)');
    await b2.close();
  }
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

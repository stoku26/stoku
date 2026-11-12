// v296: pronari (foto e Cilësimet → Pamja, web telefoni): "fshije komplet qato qka osht e madhe ... tash aktuale qe osht e vogel
// ndrroja emrin ne normale, a normales aktuale ... emrin e madhe. Edhe per qdo perdorus e len default menjiher madhsin ntmajt".
// Dy zgjedhje: "Normale" (e_vogel, zoom .9, parazgjedhja) dhe "E madhe" (normale, zoom 1). Një herë, të gjithë kalojnë te "Normale".
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const gjendja = p => p.evaluate(() => ({ attr: document.body.getAttribute('data-madhesi'), zoom: getComputedStyle(document.body).zoom,
  aktiv: Array.from(document.querySelectorAll('#segMadhesia button.aktiv')).map(b => b.getAttribute('data-v')),
  ruajtur: (JSON.parse(localStorage.getItem('stoku:opsione:v1') || '{}')).madhesia }));
const pastro = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
const rihap = async (p, para) => { if (para) await p.evaluate(para); await p.reload(); await p.waitForTimeout(2000); await pastro(p); return gjendja(p); };
(async () => {
  const { b, p } = await hapFaqen(chromium);
  await pastro(p);
  await p.click('#btnOpsione'); await p.waitForTimeout(700);
  await p.click('text=Pamja'); await p.waitForTimeout(600);
  // 1. dy zgjedhje
  const btn = await p.evaluate(() => Array.from(document.querySelectorAll('#segMadhesia button')).map(b => ({ v: b.getAttribute('data-v'), t: b.innerText.replace(/\s+/g, ' ').trim(),
    fs: getComputedStyle(b.querySelector('.ops-aa')).fontSize, w: Math.round(b.getBoundingClientRect().width), y: Math.round(b.getBoundingClientRect().top) })));
  ok(btn.map(x => x.v).join() === 'e_vogel,normale' && btn.map(x => x.t).join() === 'Aa Normale,Aa E madhe', '1. dy zgjedhje: "Normale" dhe "E madhe" (pa "E madhe" të vjetër)', btn.map(x => x.t));
  ok(btn.length === 2 && btn[0].y === btn[1].y && Math.abs(btn[0].w - btn[1].w) <= 1 && btn[0].w > 140, '1. në një rresht, gjysmë për gjysmë', btn);
  const hint = await p.textContent('#madhesiaHint');
  ok(!/E vogël/.test(hint) && /E madhe/.test(hint), '1. shpjegimi pa "E vogël"', hint);
  let gj = await gjendja(p);
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9' && gj.aktiv.join() === 'e_vogel', '1. parazgjedhja: "Normale" (zoom 0.9)', gj);
  await p.screenshot({ path: __dirname + '/v296-pamja.png' });
  // 2. "E madhe" (zoom 1) ruhet pas rihapjes (migrimi ndodh vetëm një herë)
  await p.click('#segMadhesia button[data-v="normale"]'); await p.waitForTimeout(300);
  gj = await gjendja(p);
  ok(gj.attr === '' && gj.zoom === '1' && gj.aktiv.join() === 'normale' && gj.ruajtur === 'normale', '2. "E madhe": zoom 1', gj);
  gj = await rihap(p);
  ok(gj.attr === '' && gj.zoom === '1', '2. "E madhe" mbetet pas rihapjes', gj);
  // 3. përdoruesi i vjetër (pa shenjën v296) me "normale" ose "e_madhe" → një herë "Normale"
  gj = await rihap(p, () => { localStorage.removeItem('stoku:madhesia:v296'); localStorage.setItem('stoku:opsione:v1', JSON.stringify({ madhesia: 'normale', tingull: false })); });
  const op = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:opsione:v1')));
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9' && op.madhesia === 'e_vogel' && op.tingull === false, '3. i vjetër me "normale" → "Normale" (opsionet e tjera mbeten)', { gj, op });
  gj = await rihap(p, () => { localStorage.removeItem('stoku:madhesia:v296'); localStorage.setItem('stoku:opsione:v1', JSON.stringify({ madhesia: 'e_madhe' })); });
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9', '3. i vjetër me "e_madhe" → "Normale"', gj);
  gj = await rihap(p, () => localStorage.setItem('stoku:opsione:v1', JSON.stringify({ madhesia: 'e_madhe' })));
  ok(gj.attr === 'e_vogel' && gj.zoom === '0.9', '3. "e_madhe" s\'njihet më → "Normale"', gj);
  ok(!p.__gab.length, 'pa gabime JS', p.__gab);
  await b.close();
  const sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8'), ix = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const nr = (t, rx) => Number((t.match(rx) || [])[1]);
  ok(nr(sw, /stoku-v(\d+)/) >= 296 && nr(sw, /app-tel\.js\?v=(\d+)/) >= 296 && nr(ix, /app-tel\.js\?v=(\d+)/) >= 296 && nr(sw, /stoku\.css\?v=(\d+)/) >= 68 && nr(ix, /stoku\.css\?v=(\d+)/) >= 68, 'versionet ≥ 296');
  ok(!/e_madhe/.test(ix.replace(/<!--[\s\S]*?-->/g, '')), 'index.html pa "e_madhe"');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

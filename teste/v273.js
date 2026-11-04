// v273: pronari (foto e butonit blu/i verdhë brenda folderit): "Shto opsion te cilesimet > skenimi, per butonat e rrethekum met kuqe...
// Qe secili perdorus me mujt me i qit anen e majt, te djatht ose ne mes. A standard me qen nmes per krejt. Ne android app edhe web app
// boni. Edhe shtonja ni foto tvogel te cilesimet skenimi me dit per cilat butona o fjala."
//  1) parazgjedhja: butoni në mes, poshtë (20 nga fundi), për krejt (edhe pa zgjedhje të ruajtur);
//  2) Cilësimet → Skenimi: "Butonat e skanimit" me foton e vogël të butonave lart dhe tri zgjedhjet (Majtas / Në mes / Djathtas) vetëm me emër
//     (pronari: "Nalt ku osht mir po doket me foto, po qaty posht ren ku jan 3 aty mos e qit foto ska nevoj");
//  3) "Majtas" / "Djathtas" e lëvizin butonin dhe ruhen pas rihapjes; vlerë e panjohur → në mes;
//  4) toast-i brenda folderit del mbi butonin;
//  5) në PDA dhe pa lejet e kamerës zgjedhja s'del.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const L = require('../lejet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const rr = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const x = e.getBoundingClientRect(), s = getComputedStyle(e);
  return { y: Math.round(x.top), b: Math.round(x.bottom), x: Math.round(x.left), r: Math.round(x.right), w: Math.round(x.width), h: Math.round(x.height), duket: x.width > 0 && x.height > 0 && s.display !== 'none' }; }, sel);
const pastro = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
const folderi = async p => { await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600); return rr(p, '#skanFab'); };
const skenimi = async p => { await p.click('#btnOpsione'); await p.waitForTimeout(700); await p.click('text=Skenimi'); await p.waitForTimeout(600); };
const ruajtur = p => p.evaluate(() => (JSON.parse(localStorage.getItem('stoku:opsione:v1') || '{}')).vendiFab);

(async () => {
  for (const tema of ['light', 'dark']) {
    const { b, p } = await hapFaqen(chromium);
    await p.evaluate(t => localStorage.setItem('stoku:tema', t), tema);
    await p.reload(); await p.waitForTimeout(2000); await pastro(p);

    // 1. Parazgjedhja: në mes
    let f = await folderi(p);
    ok(f.duket && Math.abs((f.x + f.r) / 2 - 195) <= 1 && f.b === 824 && f.h === 72 && f.w === 156, tema + ' 1. butonat në mes, 20 nga fundi (parazgjedhja), dy katrorë 72', f);
    const kat = await p.evaluate(() => Array.from(document.querySelectorAll('#skanFab button')).map(b => { const s = getComputedStyle(b), r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), rr: s.borderRadius, svg: Math.round(b.querySelector('svg').getBoundingClientRect().width), t: b.textContent.trim(), hije: s.boxShadow !== 'none' }; }));
    ok(kat.length === 2 && kat.every(x => x.w === 72 && x.h === 72 && x.rr === '20px' && x.svg === 40 && x.t === '' && x.hije), tema + ' 1. "ideja 2" pa tekst: katrorë 72, kënde 20, ikona 40, secili me hije', kat);
    ok(await p.evaluate(() => document.getElementById('skanFab').getAttribute('data-vendi')) === 'mes', tema + ' 1. data-vendi="mes"');

    // 4. Toast-i mbi butonin
    await p.evaluate(() => { const t = document.getElementById('toast'); t.textContent = 'Provë'; t.classList.add('hapur'); });
    const ts = await rr(p, '#toast');
    ok(ts.duket && ts.b <= f.y - 10, tema + ' 4. toast-i del mbi butonin (s\'e mbulon)', { ts, fab: f.y });
    await p.evaluate(() => document.getElementById('toast').classList.remove('hapur'));

    // 2. Cilësimet → Skenimi
    await p.click('#btnMbrapa'); await p.waitForTimeout(300);
    await skenimi(p);
    const sk = await p.evaluate(() => {
      const s = document.getElementById('seksionVendiFab'), t = document.getElementById('titVendiFab');
      const pill = s.querySelector('.ops-fab-pill'), gj = Array.from(pill.children).map(x => ({ bg: getComputedStyle(x).backgroundColor, svg: !!x.querySelector('svg'), w: Math.round(x.getBoundingClientRect().width) }));
      const btn = Array.from(s.querySelectorAll('#segVendiFab button')).map(b => ({ v: b.getAttribute('data-v'), t: b.innerText.trim(), aktiv: b.classList.contains('aktiv'),
        pressed: b.getAttribute('aria-pressed'), y: Math.round(b.getBoundingClientRect().top), h: Math.round(b.getBoundingClientRect().height), foto: b.querySelectorAll('.ops-mock, svg, img, u').length }));
      return { titulli: t.textContent, duketT: t.offsetParent !== null, duket: s.offsetParent !== null, gj, btn, hint: s.querySelector('.hint').textContent };
    });
    ok(sk.duket && sk.duketT && sk.titulli === 'Butonat e skanimit', tema + ' 2. Skenimi: "Butonat e skanimit"', sk.titulli);
    ok(sk.gj.length === 2 && sk.gj.every(x => x.svg && x.w === 40) && sk.gj[1].bg === 'rgb(232, 169, 46)', tema + ' 2. fotoja e vogël: dy katrorë (blu + i verdhë) me ikona', sk.gj);
    ok(/blu = Skano me kamerë, i verdhë = Skanim i shpejtë/.test(sk.hint), tema + ' 2. shpjegimi: cili buton është', sk.hint);
    ok(sk.btn.map(x => x.t).join() === 'Majtas,Në mes,Djathtas' && sk.btn.every(x => x.y === sk.btn[0].y), tema + ' 2. tri zgjedhje në një rresht', sk.btn.map(x => x.t));
    ok(sk.btn[1].aktiv && sk.btn[1].pressed === 'true' && !sk.btn[0].aktiv && !sk.btn[2].aktiv, tema + ' 2. "Në mes" e zgjedhur');
    ok(sk.btn.every(x => x.foto === 0 && x.h >= 48), tema + ' 2. te tri zgjedhjet vetëm emri, pa foto (pronari), 48 të larta', sk.btn);

    // 3. Majtas / Djathtas
    await p.click('#segVendiFab button[data-v="majtas"]'); await p.waitForTimeout(200);
    ok(await ruajtur(p) === 'majtas', tema + ' 3. "Majtas" u ruajt');
    await p.reload(); await p.waitForTimeout(2000); await pastro(p);
    f = await folderi(p);
    ok(f.x === 20 && f.b === 824, tema + ' 3. pas rihapjes: butoni majtas (20 nga ana)', f);
    await p.click('#btnMbrapa'); await p.waitForTimeout(300);
    await skenimi(p);
    ok(await p.evaluate(() => document.querySelector('#segVendiFab button.aktiv').getAttribute('data-v')) === 'majtas', tema + ' 3. te Skenimi "Majtas" e zgjedhur');
    await p.click('#segVendiFab button[data-v="djathtas"]'); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    await p.click('#btnStoku').catch(() => {}); await p.waitForTimeout(300);
    await p.reload(); await p.waitForTimeout(2000); await pastro(p);
    f = await folderi(p);
    ok(f.r === 370 && f.b === 824 && await ruajtur(p) === 'djathtas', tema + ' 3. "Djathtas": 20 nga ana e djathtë', f);
    await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('stoku:opsione:v1')); o.vendiFab = 'lart'; localStorage.setItem('stoku:opsione:v1', JSON.stringify(o)); });
    await p.reload(); await p.waitForTimeout(2000); await pastro(p);
    f = await folderi(p);
    ok(Math.abs((f.x + f.r) / 2 - 195) <= 1, tema + ' 3. vlerë e panjohur → në mes', f);
    ok(!p.__gab.length, tema + ' 3. pa gabime JS', p.__gab);
    await b.close();
  }

  // 5. PDA dhe pa lejet: s'del as butoni, as zgjedhja
  {
    const { b, p } = await hapFaqen(chromium);
    await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('stoku:opsione:v1') || '{}'); o.pda = true; localStorage.setItem('stoku:opsione:v1', JSON.stringify(o)); });
    await p.reload(); await p.waitForTimeout(2000); await pastro(p);
    const f = await folderi(p);
    await p.click('#btnMbrapa'); await p.waitForTimeout(300);
    await skenimi(p);
    const d = await p.evaluate(() => ({ s: getComputedStyle(document.getElementById('seksionVendiFab')).display, t: getComputedStyle(document.getElementById('titVendiFab')).display }));
    ok(!f.duket && d.s === 'none' && d.t === 'none', '5. PDA: pa butonin dhe pa zgjedhjen e vendit', { f, d });
    await b.close();
  }
  {
    const { b, p } = await hapFaqen(chromium, { uid: 'uB', emri: 'besa', lejet: Object.assign(L.krejt(true), { kamera: false }) });
    await p.waitForTimeout(500); await pastro(p);
    await skenimi(p);
    const d = await p.evaluate(() => getComputedStyle(document.getElementById('seksionVendiFab')).display);
    ok(d === 'none', '5. pa lejen e kamerës: pa zgjedhjen e vendit', d);
    ok(!p.__gab.length, '5. pa gabime JS', p.__gab);
    await b.close();
  }

  // 6. Versionet
  {
    const { b, p } = await hapFaqen(chromium);
    const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 273 && nr(/app-tel\.js\?v=(\d+)/) >= 273 && nr(/teRejat\.js\?v=(\d+)/) >= 273 && nr(/stoku\.css\?v=(\d+)/) >= 58, '6. CACHE, app-tel, teRejat ≥ 273, stoku.css ≥ 58');
    const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
    ok(/\{ v: 273,[^\n]*platforma: 'tel'/.test(tr), '6. teRejat v273 (telefon)');
    await b.close();
  }
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

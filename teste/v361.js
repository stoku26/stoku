// v361 (pronari: "Edhe kontrollo stoku.site faqen 100% pas qdo ndryshimi me u rujt qdo sen ne cloud, gjithashtu edhe ne appet"):
// ruajtjet në cloud që dështojnë provohen vetë sërish (15 s, 30 s, 1 min, ... deri 10 min), jo vetëm me ndryshimin e radhës.
//  1. web: regjistri (produktet e kontrolluara nga administratori): dërgimi dështon një herë (pa lidhje) → arrin vetë në cloud
//  2. web: dëgjimi i regjistrit që dështon riprovohet pas 1 minute; administratori dërgon edhe pa regjistrin
//  3. web: kujtesa e grupit, pritja e të tjerëve, afatet dhe malli për kolegët: riprovim vetë
//  4. Android: si web-i (Regjistri.kt, Grupi.kt)
const { chromium } = require('./pw.js');
const fs = require('fs'), path = require('path');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const RR = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 10000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 250)); } z(false); });
(async () => {
  // ================= 3/4. Kontrolli i kodit =================
  const E = fs.readFileSync(RR + '/ekipa.js', 'utf8');
  ok(/function pritjaERiprovimit\(n\) \{ return Math\.min\(600000, 15000 \* Math\.pow\(2, Math\.min\(n, 6\)\)\); \}/.test(E), '3. web: pritja 15 s ... 10 min');
  ok(/planifikoDergiminEKujteses\(pritjaERiprovimit\(kujtesaGj\.riprovimet\+\+\)\)/.test(E), '3. web: kujtesa e grupit riprovohet vetë');
  ok(/planifikoRegjistrin\(pritjaERiprovimit\(regj\.riprovimet\+\+\)\)/.test(E) && /pasDergimit\(!!\(r2 && r2\.ok\)\)/.test(E), '3. web: regjistri (administratori dhe pritja e të tjerëve) riprovohet vetë');
  ok(/setTimeout\(publikoTani, pritjaERiprovimit/.test(E) && /setTimeout\(publikoMallinTani, pritjaERiprovimit/.test(E), '3. web: afatet dhe malli për kolegët riprovohen vetë');
  ok(/regj\.kohezLeximit = setTimeout\(function \(\) \{ if \(o\.uidIm\(\) === u0 && !d\.regjistri\) degjoRegjistrinTani\(\); \}, 60000\)/.test(E), '2. web: dëgjimi i regjistrit riprovohet pas 1 minute');
  ok(/function mundDergimin\(\) \{ return regj\.adminiDihet && \(regj\.gati \|\| gj\.admin\); \}/.test(E) && /if \(!e\.ruajPritjen \|\| !regj\.gati\) return;/.test(E), '2. web: administratori dërgon edhe pa regjistrin; të tjerët e presin');
  const RG = fs.readFileSync(RR + '/vendas/app/src/main/java/site/stoku/vendas/Regjistri.kt', 'utf8');
  const GR = fs.readFileSync(RR + '/vendas/app/src/main/java/site/stoku/vendas/Grupi.kt', 'utf8');
  ok(/planifikoGrupin\(pritjaERiprovimit\(riprovimetGrupi\+\+\)\)/.test(RG) && /kohezReg = scope\.launch \{ delay\(pritja\); dergoRegjistrin\(\) \} \} \/\/ web v361/.test(RG), '4. Android: kujtesa e grupit dhe pritja riprovohen vetë');
  ok((GR.match(/addOnFailureListener \{ e -> if \(gabimi\(e\) != "leje" && uid == u0\)/g) || []).length === 2, '4. Android: afatet dhe malli për kolegët riprovohen vetë');

  // ================= 1. Regjistri: dërgimi dështon një herë =================
  const t = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t, grupi: '' });
  F.S.docs.set('kujtesa/p0', { p: { '9008700133760': { e: 'Bravo Cranberry 500ml', f: 'Meridian', k: t - 9e8, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0, r: 0 } }, ndryshuarSe: t - 9e8 });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true });
  await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
  await F.lidh(ctx, 'uA', 'mendurberisha@stoku-app.local', 'tel', null);
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); localStorage.setItem('stoku:kujtesa:kontrolli-v238', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(BAZA + '/index.html');
  await p.waitForTimeout(3000);
  ok(await prit(() => p.evaluate(() => !!(window.StokuAfatet && window.StokuAfatet.kujtesa().merr('9008700133760')))), '1. administratori e mori regjistrin');
  // Shkrimet te kujtesa/* dështojnë një herë (si pa lidhje)
  await p.evaluate(() => {
    const vjeter = window.__fs; window.__deshtimet = 0;
    window.__fs = async function (op, a) {
      if (op === 'batch' && window.__deshtimet < 1 && JSON.stringify(a).indexOf('"kujtesa/p') !== -1) { window.__deshtimet++; return { ok: false, code: 'unavailable' }; }
      return vjeter.apply(this, arguments);
    };
  });
  const t1 = Date.now();
  await p.evaluate(() => window.StokuAfatet.kujtesa().vendos('5310000000011', 'Lëng Molle 1L', 'Meridian'));
  ok(await prit(() => p.evaluate(() => window.__deshtimet === 1), 8000), '1. dërgimi i parë dështoi (pa lidhje)');
  const nePrit = () => { const d = F.S.docs.get('kujtesa/p1'); return d && d.p && d.p['5310000000011']; };
  ok(!nePrit(), '1. ende s\'është në cloud');
  ok(await prit(async () => { const x = nePrit(); return x && x.s === 1 && x.e === 'Lëng Molle 1L'; }, 30000), '1. pa asnjë ndryshim tjetër, produkti arriti vetë në cloud (riprovimi pas ~15 s)', [nePrit(), Math.round((Date.now() - t1) / 1000) + ' s']);
  ok(!gab.length, '1. pa gabime JS', gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'TË GJITHA OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.log('GABIM ' + (e && e.stack || e)); process.exit(1); });

// v340 / Android Hyrja 99 (kontrolli i plotë i projektit): kërkimi i Ballinës me pak vonesë dhe malli i kolegëve i zbërthyer një herë
//  (web); malli i ndarë mbahet nën ~900 KB (kufiri 1 MiB i Firestore-it), web + Android.
const pw = require('./pw.js'); pw.meBallina = true;
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:' + (process.env.PORTI || '8765');
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';
(async () => {
  const t = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: t - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'besa', 'g1');
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: t });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: t });
  const pK = []; for (let i = 0; i < 8000; i++) pK.push(String(3800000000000 + i) + '\tProdukt ' + i + '\t' + (i % 50) + '\tFurn ' + (i % 30) + '\tFolder ' + (i % 12));
  F.S.docs.set('grupet/g1/malli/u2', { uid: 'u2', emri: 'besa', ndryshuarSe: t, p: pK });
  // 8000 produkte me emra të gjatë: pa kufi do të kalonin 1 MiB
  const prod = []; for (let i = 0; i < 8000; i++) prod.push({ kategoriaId: 'pije', barkodi: String(3900000000000 + i), emri: 'Ujë mineral natyral shumë i gjatë me emër të gjatë ' + 'x'.repeat(100) + ' ' + i, sasia: 5, furnizuesi: 'Furnizuesi ' + 'y'.repeat(50), ndryshuarSe: t });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [{ id: 'pije', emri: 'Pije' }], produktet: prod, fshira: {}, afatet: [] });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(4000);
  // 1. kërkimi: pas shkronjës s'vizatohet menjëherë, por pas pak
  await p.evaluate(() => { const k = document.getElementById('blKerko'); k.value = 'produkt 7999'; k.dispatchEvent(new Event('input')); });
  const menjehere = await p.evaluate(() => document.querySelectorAll('#blRezultatet .bl-grupi').length);
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => [...document.querySelectorAll('#blRezultatet .bl-grupi')].map(x => ({ t: x.querySelector('h3').textContent, r: [...x.querySelectorAll('.bl-rez b')].map(y => y.textContent) })));
  const mk = r.find(x => /^Malli i kolegëve/.test(x.t));
  ok(menjehere === 0 && mk && mk.r.includes('Produkt 7999'), '1. web tel: kërkimi pak pas shkronjës, gjen në 8000 produkte të kolegut', { menjehere, r });
  const sa = await p.evaluate(() => { const e = window.StokuEkipa || window.Ekipa; const a = performance.now(); for (let i = 0; i < 20; i++) e && e.malliIKolegeve && e.malliIKolegeve(); return { ms: Math.round(performance.now() - a), ka: !!(e && e.malliIKolegeve) }; });
  ok(!sa.ka || sa.ms < 200, '1. malli i kolegëve zbërthehet një herë (20 thirrje shpejt)', sa);
  // 2. malli im: nën 900 KB
  await p.waitForTimeout(5000);
  const im = F.S.docs.get('grupet/g1/malli/' + ADM);
  const bajte = im ? Buffer.byteLength(JSON.stringify(im.p)) : 0;
  ok(im && im.p.length > 1000 && im.p.length < 8000 && bajte < 1000000, '2. web tel: malli i madh mbahet nën kufirin e Firestore-it', { n: im && im.p.length, bajte });
  ok(!gab.length, 'pa gabime JS', gab);
  await b.close();
  const gk = lx(K + 'Grupi.kt');
  ok(/bajte > 900_000/.test(gk) && /\.take\(120\)/.test(gk), '3. Android: malli nën ~900 KB, emrat deri 120 shenja');
  ok(/Hyrja\(99, "2026-11-19"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 99');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

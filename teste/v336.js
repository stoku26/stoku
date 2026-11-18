// v336 (pronari, 18.11.2026): (1) titulli i Cilësimeve në të njëjtën vijë si Malli/Afatet/Grupi; (2) pa butonat e shpejtë të Ballinës
//  (Skano, Afat i ri, Skanim i shpejtë, PDF), as te "Përshtat faqen" (web tel + Android)
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
  F.S.docs.set('perdoruesit/' + ADM, { perdoruesi: 'duli96', kycurSe: t - 6e4, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: t });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: t });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
  // pjesët e ruajtura nga më parë me "butonat" ndezur: s'duhet të dalin më
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); if (!localStorage.getItem('stoku:ballina:pjeset')) localStorage.setItem('stoku:ballina:pjeset', 'butonat:1,afatet:1,malli:1'); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote') && x.id !== 'dlgBallina') x.classList.remove('hapur'); }));
  const bl = await p.evaluate(() => ({
    hapur: document.getElementById('dlgBallina').classList.contains('hapur'),
    butonat: document.querySelectorAll('#blPjeset .bl-butonat, #blPjeset .bl-buton').length,
    tekst: document.getElementById('blPjeset').textContent }));
  ok(bl.hapur && bl.butonat === 0 && !/Skanim i shpejtë|Afat i ri/.test(bl.tekst), '2. web tel: Ballina pa butonat e shpejtë (edhe me "butonat:1" të ruajtur)', bl);
  await p.click('#blPershtat'); await p.waitForTimeout(300);
  const ids = await p.evaluate(() => [...document.querySelectorAll('#blpLista .blp-rresht')].map(x => x.getAttribute('data-id')));
  ok(ids.length > 0 && !ids.includes('butonat'), '2. web tel: "Përshtat faqen" pa "Butonat e shpejtë"', ids);
  await p.click('#blpRuaj'); await p.waitForTimeout(300);
  ok(!/butonat/.test(await p.evaluate(() => localStorage.getItem('stoku:ballina:pjeset'))), '2. web tel: pas "Ruaj" s\'ruhet më "butonat"');
  const at = lx('app-tel.js'), ix = lx('index.html');
  ok(!/blButonat|blSkano|blSkanimShpejt|id: 'butonat'/.test(at) && !/\.bl-buton/.test(ix), '2. web tel: kodi dhe CSS-ja e butonave u hoqën');

  const lart = sel => p.evaluate(i => { const h = document.querySelector(i); const r = h.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), fs: getComputedStyle(h).fontSize }; }, sel);
  await p.click('#btnAfatet'); await p.waitForTimeout(800);
  const af = await lart('#afTitulli');
  await p.click('#btnEkipi'); await p.waitForTimeout(1200);
  const gr = await lart('#ekipiTitulli');
  await p.click('#btnOpsione'); await p.waitForTimeout(800);
  const op = await lart('#opsioneTitulli');
  ok(Math.abs(af.top - op.top) <= 2 && Math.abs(gr.top - op.top) <= 2 && af.fs === op.fs, '1. web tel: titulli i Cilësimeve në vijë me Afatet dhe Grupin', { af, gr, op });
  await p.screenshot({ path: __dirname + '/v336-cilesimet.png' });
  ok(!gab.length, 'web tel: pa gabime JS', gab);

  const be = lx(K + 'ui/BallinaEkrani.kt'), ce = lx(K + 'ui/CilesimetEkrani.kt');
  ok(!/Pjesa\("butonat"|ButonatEShpejte|fun butonat\(\)|"butonat" ->/.test(be), '2. Android: Ballina pa butonat e shpejtë (as te "Përshtat faqen")');
  ok(/padding\(start = 20\.dp, end = 20\.dp, top = 12\.dp\)\.heightIn\(min = 44\.dp\)[^\n]*\n\s*Text\("Cilësimet", style = tx\(26, 700/.test(ce), '1. Android: koka e Cilësimeve si te Afatet (12 + 44 dp, 26/700)');
  ok(/Hyrja\(97, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 97');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

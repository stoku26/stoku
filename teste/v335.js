// v335 / Android Hyrja 96 (pronari: "Po"): malli i kolegëve te kërkimi i Ballinës, vetëm brenda grupit.
//  Secili e ndan mallin e vet te grupet/{g}/malli/{uid} (p = [[barkodi, emri, sasia, furnizuesi, folderi]]); e lexon vetëm grupi (rregull i ri).
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
  // ===== Rregullat (SHENIME) =====
  const rr = require('./emu/rregullat.js').rregullat();
  ok(/match \/malli\/\{u\} \{[\s\S]*?allow read: if request\.auth != null && \(anetarIGrupit\(g\) \|\| eshteAdmin\(\)\);[\s\S]*?request\.auth\.uid == u && !uFshi\(u\) && anetarIGrupit\(g\)[\s\S]*?p\.size\(\) <= 8000/.test(rr), '0. rregullat: grupet/{g}/malli/{u} (lexon grupi, shkruan vetëm ai)');
  const kt = lx(K + 'ui/BallinaEkrani.kt'), gk = lx(K + 'Grupi.kt');
  ok(/"Malli i kolegëve"/.test(kt) && /Grupi\.malli\.value/.test(kt), '3. Android: "Malli i kolegëve" te kërkimi');
  ok(/collection\("malli"\)/.test(gk) && /fun publikoMallin/.test(gk), '3. Android: ndarja dhe leximi i mallit');
  ok(/Hyrja\(96, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 96');

  const t = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: t - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'besa', 'g1'); perd('u9', 'jashte', 'g9');
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: t });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: t });
  F.S.docs.set('grupet/g1/malli/u2', { uid: 'u2', emri: 'besa', ndryshuarSe: t, p: [['3800001', 'Ujë Rugove 1.5L', 24, 'Rugove', 'Pije'], ['3800002', 'Kos Vita', 6, 'Vita', 'Ushqimore']] });
  F.S.docs.set('grupet/g9', { emri: 'Tjetër', pronarUid: 'u9', pronarEmri: 'jashte', krijuarSe: t });
  F.S.docs.set('grupet/g9/anetaret/u9', { emri: 'jashte', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g9/malli/u9', { uid: 'u9', emri: 'jashte', ndryshuarSe: t, p: [['999', 'Ujë Rugove i huaj', 3, 'Rugove', 'Pije']] });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [{ id: 'pije', emri: 'Pije' }], produktet: [{ kategoriaId: 'pije', barkodi: '3800009', emri: 'Ujë Dea', sasia: 12, furnizuesi: 'Dea', ndryshuarSe: t }], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(3000);
  await p.fill('#blKerko', 'rugove'); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => [...document.querySelectorAll('#blRezultatet .bl-grupi')].map(x => ({ t: x.querySelector('h3').textContent, r: [...x.querySelectorAll('.bl-rez b')].map(y => y.textContent), s: [...x.querySelectorAll('.bl-rez small')].map(y => y.textContent) })));
  const mk = r.find(x => /^Malli i kolegëve/.test(x.t));
  ok(mk && mk.r.length === 1 && mk.r[0] === 'Ujë Rugove 1.5L' && /^besa · 3800001 · Pije · 24 copë$/.test(mk.s[0]), '1. web tel: kërkimi gjen mallin e kolegut (pa grupin tjetër)', r);
  // Malli im ndahet me grupin (pas sinkronizimit)
  await p.waitForTimeout(4000);
  const im = F.S.docs.get('grupet/g1/malli/' + ADM);
  ok(im && im.uid === ADM && im.emri === 'duli96' && Array.isArray(im.p) && im.p.some(x => x[0] === '3800009' && x[1] === 'Ujë Dea' && x[2] === 12 && x[4] === 'Pije'), '2. web tel: malli im u nda me grupin', im);
  ok(!F.S.docs.get('grupet/g9/malli/' + ADM), '2. jo te grupi tjetër');
  ok(!gab.length, 'pa gabime JS', gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

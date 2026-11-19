// v341 / Android Hyrja 100 (kontrolli i plotë, pjesa 2): Ballina s'e bllokon më rinisjen pas përditësimit dhe rilidhjen (web tel);
//  PC: toast-i me { ms } dhe zvarritja nga jashtë mbi folder pa gabim; Android: heqja nga grupi / fshirja e llogarisë pastron push-in
//  dhe mallin e grupit.
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
  F.S.docs.set('perdoruesit/' + ADM, { perdoruesi: 'duli96', kycurSe: t - 6e4 });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [{ id: 'pije', emri: 'Pije' }, { id: 'buke', emri: 'Bukë' }],
    produktet: [{ kategoriaId: 'pije', barkodi: '3800000000001', emri: 'Ujë', sasia: 2, ndryshuarSe: t }], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  // 1. web tel: me Ballinën e hapur, kontrolli "a është e qetë" dhe rilidhja s'e shohin si dialog
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(4000);
  const r1 = await p.evaluate(() => ({
    ballina: !!document.querySelector('#dlgBallina.hapur'),
    cast: document.querySelector('.mbulese.hapur:not(#dlgAfatet):not(#dlgOpsione):not(#dlgEkipi):not(#dlgBallina)'),
    rilidhja: document.querySelector('.hapur[id^="dlg"]:not(#dlgBallina), .mbulese.hapur:not(#dlgBallina)')
  }));
  ok(r1.ballina && !r1.cast && !r1.rilidhja, '1. web tel: Ballina e hapur s\'llogaritet si dialog (përditësimi + rilidhja)', r1);
  const tel = lx('app-tel.js');
  ok(/:not\(#dlgEkipi\):not\(#dlgBallina\)'\)\) return false;/.test(tel) && /\.hapur\[id\^="dlg"\]:not\(#dlgBallina\), \.mbulese\.hapur:not\(#dlgBallina\)/.test(tel), '1. app-tel.js: përjashtimi i Ballinës në të dy vendet');
  ok(!gab.length, '1. pa gabime JS (tel)', gab);
  await ctx.close();
  // 2. PC: zvarritja e diçkaje nga jashtë mbi folder (JSON i prishur) s'jep gabim
  const ctx2 = await b.newContext({ viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' });
  await ctx2.route(u => !u.href.startsWith(B), r => r.abort());
  await F.lidh(ctx2, ADM, 'duli96@stoku-app.local', 'pc');
  const q = await ctx2.newPage(); const gab2 = []; q.on('pageerror', e => gab2.push(e.message));
  await q.goto(B + '/pc.html#/stoku'); await q.waitForTimeout(4500);
  const r2 = await q.evaluate(() => {
    const el = [...document.querySelectorAll('[draggable="true"]')].find(x => /Bukë/.test(x.textContent));
    if (!el) return { gjet: false };
    const dt = new DataTransfer(); dt.setData('application/x-stoku-produkte', '{prishur');
    ['dragenter', 'dragover', 'drop'].forEach(k => el.dispatchEvent(new DragEvent(k, { bubbles: true, cancelable: true, dataTransfer: dt })));
    return { gjet: true };
  });
  await q.waitForTimeout(500);
  ok(!gab2.length, '2. PC: zvarritja nga jashtë mbi folder pa gabim JS', { r2, gab2 });
  await ctx2.close();
  await b.close();
  const pc = lx('app-pc.js');
  ok(!/toast\([^;]*?, (4000|6000)\)/.test(pc) && /\{ ms: 4000 \}/.test(pc) && /\{ ms: 6000 \}/.test(pc), '2. app-pc.js: toast me { ms } (jo numër)');
  ok(/try \{ kk = JSON\.parse\(prod\); \}/.test(pc), '2. app-pc.js: JSON.parse i zvarritjes me try');
  // 3. Android
  const gk = lx(K + 'Grupi.kt'), ak = lx(K + 'Admini.kt');
  ok(/collection\("push"\)\.whereEqualTo\("uid", u\)/.test(gk), '3. Android: heqja nga grupi fshin pajisjet push të kolegut');
  ok(/g\.collection\("malli"\)\.document\(u\)\.delete\(\)/.test(ak), '3. Android: fshirja e llogarisë fshin edhe mallin e grupit');
  ok(/Hyrja\(100, "2026-11-19"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 100');
  ok(+(/v: (\d+)/.exec(lx('versioni.js')) || [])[1] >= 341 && +(/stoku-v(\d+)/.exec(lx('sw.js')) || [])[1] >= 341, '0. versioni 341 ose më i ri');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

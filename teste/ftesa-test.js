// v216: rregulli i Firebase-it për ftesat: hyrja në grup (roli "anetar") lejohet vetëm kur ftesa fshihet në të njëjtin
// batch (`!existsAfter(ftesat/{g}_{emri})`). Kështu një ftesë s'përdoret dy herë, as nga një klient i modifikuar.
// Pranimi normal i aplikacionit (batch: anëtari + fshirja e ftesës) punon si më parë.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u2', pronarEmri: 'besa', krijuarSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'pronar', hyriSe: t });
  const ftesa = { gid: 'g1', grupiEmri: 'Market', perdoruesi: 'agim', ngaUid: 'u2', ngaEmri: 'besa', koha: t };
  F.S.docs.set('ftesat/g1_agim', ftesa);
  const doc = k => F.S.docs.get(k);
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel');
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror:', e.message); });
  await p.goto('http://127.0.0.1:' + PORTI + '/index.html');
  await p.waitForTimeout(2500);
  const anetari = { emri: 'agim', roli: 'anetar', hyriSe: t, aktivSe: t, online: true, platforma: 'tel' };
  const shkruaj = ops => p.evaluate(o => window.__fs('batch', o), ops);

  // 1. Klient i modifikuar: hyn në grup pa e fshirë ftesën → refuzohet (ftesa mbetet)
  let r = await shkruaj([['set', 'grupet/g1/anetaret/u1', anetari, false]]);
  ok(!r.ok && r.code === 'permission-denied' && !doc('grupet/g1/anetaret/u1') && !!doc('ftesat/g1_agim'), '1. hyrja pa e fshirë ftesën s\'lejohet', r);

  // 2. Pranimi normal i aplikacionit (anëtari + fshirja e ftesës në një batch) punon
  const rP = await p.evaluate(f => window.__stokuCloud.ekipa.pranoFtesen(f, false), Object.assign({ id: 'g1_agim' }, ftesa));
  ok(rP && rP.ok && doc('grupet/g1/anetaret/u1') && doc('grupet/g1/anetaret/u1').roli === 'anetar' && !doc('ftesat/g1_agim'), '2. "Prano" punon: agimi u bashkua, ftesa u fshi', rP);

  // 3. Pronari e heq agimin; agimi s'mund të rihyjë pa ftesë të re
  F.S.docs.delete('grupet/g1/anetaret/u1');
  r = await shkruaj([['set', 'grupet/g1/anetaret/u1', anetari, false]]);
  ok(!r.ok && !doc('grupet/g1/anetaret/u1'), '3. pa ftesë s\'rihyn', r);

  // 4. Ftesë e re, por klienti s'e fshin: refuzohet; me fshirjen në të njëjtin batch: lejohet (ftesa harxhohet)
  F.S.docs.set('ftesat/g1_agim', Object.assign({}, ftesa, { koha: t + 1 }));
  r = await shkruaj([['set', 'grupet/g1/anetaret/u1', anetari, false]]);
  ok(!r.ok && !!doc('ftesat/g1_agim'), '4a. ftesa e re: hyrja pa e fshirë sërish s\'lejohet', r);
  r = await shkruaj([['set', 'grupet/g1/anetaret/u1', anetari, false], ['delete', 'ftesat/g1_agim']]);
  ok(r.ok && !!doc('grupet/g1/anetaret/u1') && !doc('ftesat/g1_agim'), '4b. hyrja + fshirja e ftesës në një batch lejohet', r);

  // 5. Ftesa e dikujt tjetër s'vlen për agimin (edhe kur e fshin)
  F.S.docs.delete('grupet/g1/anetaret/u1');
  F.S.docs.set('ftesat/g1_drini', Object.assign({}, ftesa, { perdoruesi: 'drini' }));
  r = await shkruaj([['set', 'grupet/g1/anetaret/u1', anetari, false], ['delete', 'ftesat/g1_drini']]);
  ok(!r.ok && !doc('grupet/g1/anetaret/u1') && !!doc('ftesat/g1_drini'), '5. ftesa e drinit s\'e fut agimin', r);

  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

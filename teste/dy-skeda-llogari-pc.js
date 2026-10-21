// v232 (PC): dy skeda të pc.html; si testi i telefonit. Dy dritare të Stoku-t në të njëjtën pajisje (aplikacioni i instaluar + Chrome, ose dy skeda; localStorage dhe
// hyrja e Firebase-it të përbashkëta). Në njërën ndërrohet llogaria: dritarja tjetër s'duhet t'i shkruajë të dhënat e
// llogarisë së vjetër (as fshirjet e saj) te llogaria e re. Para v232: të dhënat përziheshin dhe folderat humbnin.
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const NM = __dirname + '/npm/node_modules';
const CDN = { 'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js' };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
(async () => {
  const F = krijoFirestore();
  const t0 = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t0 });
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'pda34', kycurSe: t0, krijuarSe: t0 });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => {
    const emri = Object.keys(CDN).find(k => r.request().url().endsWith(k));
    if (emri) return r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(CDN[emri]) });
    return r.abort();
  });
  await F.lidh(ctx, 'uA', 'mendurberisha@stoku-app.local', 'pc', { afatet: [] });
  // Administratori: dy folderat e vet; 4 folderat e parazgjedhur i ka fshirë (shënimet e fshirjeve)
  await ctx.addInitScript(() => {
    if (localStorage.getItem('stoku:foldera:v1') || localStorage.getItem('__fsLlogaria')) return;
    const t = Date.now();
    localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'fA1', emri: 'Admin1' }, { id: 'fA2', emri: 'Admin2' }]));
    localStorage.setItem('stoku:produktet:v2', JSON.stringify({ 'fA1::111': { barkodi: '111', emri: 'Produkt i adminit', sasia: 5, kategoriaId: 'fA1', prekurSe: t } }));
    localStorage.setItem('stoku:fshira:v1', JSON.stringify({ produktet: {}, foldera: { ushqimore: t - 864e5, pije: t - 864e5, higjiene: t - 864e5, fresh: t - 864e5 }, afatet: {} }));
  });
  const gab = [];
  const P = await ctx.newPage(); P.on('pageerror', e => gab.push('P: ' + e.message));
  await P.goto(B + '/pc.html'); await P.waitForTimeout(3500);
  const C = await ctx.newPage(); C.on('pageerror', e => gab.push('C: ' + e.message));
  await C.goto(B + '/pc.html'); await C.waitForTimeout(3000);
  const cloudFolderat = uid => { const d = F.S.docs.get('dyqane/' + uid); return d ? (d.foldera || []).map(f => f.emri) : null; };
  ok(JSON.stringify(cloudFolderat('uA')) === '["Admin1","Admin2"]', '0. administratori: Admin1, Admin2 në cloud', cloudFolderat('uA'));

  // 1. Te C (Chrome) hyhet si pda34; Firebase e ndërron llogarinë edhe te P (aplikacioni i instaluar)
  F.faqet.set(C, { uid: 'u5', email: 'pda34@stoku-app.local' });
  await C.evaluate(() => window.__fsNdrroLlogarine('u5', 'pda34@stoku-app.local'));
  
  await C.waitForTimeout(4000);
  ok(JSON.stringify(cloudFolderat('u5')) === '["Ushqimore","Pije","Higjiene","Fresh"]', '1. pda34 (Chrome): 4 folderat e parazgjedhur', cloudFolderat('u5'));
  F.faqet.set(P, { uid: 'u5', email: 'pda34@stoku-app.local' });
  await P.evaluate(() => window.__fsNdrroLlogarine('u5', 'pda34@stoku-app.local')).catch(() => {});
  await P.waitForTimeout(5000);
  const f5 = cloudFolderat('u5');
  ok(!f5.includes('Admin1') && !f5.includes('Admin2'), '1. aplikacioni i instaluar s\'i shkruan folderat e administratorit te pda34', f5);
  ok(f5.includes('Ushqimore') && f5.length === 4, '1. pda34 i mban 4 folderat e vet (fshirjet e administratorit s\'kalojnë)', f5);
  const pFold = await P.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1') || '[]').map(f => f.emri)).catch(() => null);
  ok(JSON.stringify(pFold) === JSON.stringify(f5), '1. aplikacioni i instaluar tregon të dhënat e pda34 (u rifreskua)', pFold);

  F.faqet.set(C, { uid: 'uA', email: 'mendurberisha@stoku-app.local' });
  await C.evaluate(() => window.__fsNdrroLlogarine('uA', 'mendurberisha@stoku-app.local'));
  await C.waitForTimeout(4500);
  F.faqet.set(P, { uid: 'uA', email: 'mendurberisha@stoku-app.local' });
  await P.evaluate(() => window.__fsNdrroLlogarine('uA', 'mendurberisha@stoku-app.local')).catch(() => {});
  await P.waitForTimeout(5000);
  const fA = cloudFolderat('uA');
  ok(JSON.stringify(fA) === '["Admin1","Admin2"]', '2. administratori: Admin1, Admin2 mbeten, pa folderat e pda34', fA);
  const dA = F.S.docs.get('dyqane/uA');
  
  ok(!gab.length, 'pa gabime JavaScript', gab);
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

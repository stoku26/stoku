// v233: dyqani s'mbetet pa foldera. Llogaria (si pda34, pa lejen për të krijuar foldera) ka në cloud shënime fshirjeje
// për 4 folderat e parazgjedhur (të ardhura nga një llogari tjetër para v232): para v233 folderat dilnin dhe hiqeshin
// menjëherë. Tash: kthehen dhe mbeten (telefoni me 0 foldera, pajisje e re, PC). Fshirja e qëllimshme e krejt folderave
// s'kthehet menjëherë (10 minuta), vetëm më vonë.
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
const L = require('../lejet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const NM = __dirname + '/npm/node_modules';
const CDN = { 'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js' };
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const prit = (fn, ms = 9000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
const D = ['ushqimore', 'pije', 'higjiene', 'fresh'];
(async () => {
  const b = await chromium.launch();
  const gab = [];
  async function pajisje(F, uid, emri, pc, seed) {
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: !pc });
    await ctx.route(u => !u.href.startsWith(B), r => {
      const e = Object.keys(CDN).find(k => r.request().url().endsWith(k));
      if (e) return r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(CDN[e]) });
      return r.abort();
    });
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] });
    if (seed) await ctx.addInitScript(seed);
    const p = await ctx.newPage();
    p.on('pageerror', e => gab.push(emri + ': ' + e.message));
    const vargu = [];
    await p.goto(B + (pc ? '/pc.html' : '/index.html'));
    for (let i = 0; i < 20; i++) { // sa foldera sheh përdoruesi gjatë hapjes (para v233: 4 → 0)
      const n = await p.evaluate(pc => pc ? JSON.parse(localStorage.getItem('stoku:foldera:v1') || '[]').length : document.querySelectorAll('.folder-karta').length, pc).catch(() => -1);
      if (!vargu.length || vargu[vargu.length - 1] !== n) vargu.push(n);
      await p.waitForTimeout(200);
    }
    return { p, vargu };
  }
  const helmuar = (F, uid, foldera) => F.S.docs.set('dyqane/' + uid, { app: 'stoku', version: 3, rendiKoha: 0, foldera: foldera || [],
    fshira: { produktet: {}, foldera: Object.fromEntries(D.map(id => [id, Date.now() - 2 * 864e5])), afatet: {} } });
  const cloudF = (F, uid) => ((F.S.docs.get('dyqane/' + uid) || {}).foldera || []);
  const lokalF = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1') || '[]').map(f => f.emri));

  // ===== 1. Telefoni i pda34 (tregon 0 foldera), pa lejen për foldera =====
  const F = krijoFirestore();
  const t = Date.now();
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'pda34', kycurSe: t, krijuarSe: t - 5 * 864e5 });
  F.S.docs.set('lejet/u5', { lejet: Object.assign(L.krejt(true), { afatet: false, grupi: false, stokuFoldera: false }), kontrolluarSe: t, emri: 'pda34' });
  helmuar(F, 'u5');
  const A = await pajisje(F, 'u5', 'pda34', false, () => {
    if (localStorage.getItem('stoku:foldera:v1')) return;
    localStorage.setItem('stoku:foldera:v1', '[]'); localStorage.setItem('stoku:produktet:v2', '{}'); // gjendja e tanishme e pda34
  });
  ok(A.vargu[A.vargu.length - 1] === 4 && !A.vargu.slice(1).includes(0), '1. telefoni i pda34: 4 folderat, pa u zhdukur', A.vargu);
  ok(await prit(async () => cloudF(F, 'u5').length === 4), '1. cloud: 4 folderat', cloudF(F, 'u5').map(f => f.emri));
  ok(cloudF(F, 'u5').every(f => f.ndryshuarSe > t), '1. me kohë të re (fitojnë ndaj shënimeve të vjetra)', cloudF(F, 'u5'));
  ok(!Object.keys(F.S.docs.get('dyqane/u5').fshira.foldera).length, '1. shënimet e vjetra u hoqën nga cloud-i', F.S.docs.get('dyqane/u5').fshira.foldera);
  await A.p.waitForTimeout(2500);
  ok((await A.p.evaluate(() => document.querySelectorAll('.folder-karta').length)) === 4, '1. pas disa sekondash: ende 4');
  await A.p.screenshot({ path: __dirname + '/v233-pda34.png' });
  // 2. pajisje e re (PDA)
  const P = await pajisje(F, 'u5', 'pda34', false);
  ok(P.vargu[P.vargu.length - 1] === 4 && !P.vargu.includes(0), '2. pajisje e re: 4 folderat', P.vargu);
  // 3. rifreskimi i telefonit
  await A.p.reload(); await A.p.waitForTimeout(3000);
  ok((await A.p.evaluate(() => document.querySelectorAll('.folder-karta').length)) === 4, '3. pas rifreskimit: 4');

  // ===== 4. PC (llogari tjetër e helmuar, kompjuteri tregon 0 foldera) =====
  const F2 = krijoFirestore();
  F2.S.docs.set('perdoruesit/u7', { perdoruesi: 'arta', kycurSe: t });
  helmuar(F2, 'u7');
  const K = await pajisje(F2, 'u7', 'arta', true, () => {
    if (localStorage.getItem('stoku:foldera:v1')) return;
    localStorage.setItem('stoku:foldera:v1', '[]'); localStorage.setItem('stoku:produktet:v2', '{}');
  });
  ok(await prit(async () => (await lokalF(K.p)).length === 4) && await prit(async () => cloudF(F2, 'u7').length === 4), '4. PC: 4 folderat, edhe në cloud', [await lokalF(K.p), cloudF(F2, 'u7').map(f => f.emri)]);
  await K.p.waitForTimeout(2500);
  ok((await lokalF(K.p)).length === 4, '4. PC pas disa sekondash: ende 4', await lokalF(K.p));
  const K2 = await pajisje(F2, 'u7', 'arta', true);
  ok(await prit(async () => (await lokalF(K2.p)).length === 4) && !K2.vargu.includes(0), '4. PC i ri: 4 folderat', K2.vargu);

  // ===== 5. Fshirja e qëllimshme e krejt folderave (llogari me leje të plota) =====
  const F3 = krijoFirestore();
  F3.S.docs.set('perdoruesit/u8', { perdoruesi: 'besa', kycurSe: t });
  const X = await pajisje(F3, 'u8', 'besa', false);
  const Y = await pajisje(F3, 'u8', 'besa', false);
  ok(await prit(async () => cloudF(F3, 'u8').length === 4), '5. besa: 4 folderat në cloud');
  await X.p.evaluate(() => { window.__konf = true; });
  for (const emri of ['Ushqimore', 'Pije', 'Higjiene', 'Fresh']) {
    await X.p.evaluate(e => { const k = [...document.querySelectorAll('.folder-karta')].find(x => x.textContent.includes(e)); k.querySelector('.folder-fshij').click(); }, emri);
    await X.p.waitForTimeout(250); await X.p.click('#konfPo'); await X.p.waitForTimeout(350);
  }
  ok(await prit(async () => cloudF(F3, 'u8').length === 0), '5. X i fshiu krejt: 0 në cloud', cloudF(F3, 'u8').map(f => f.emri));
  await X.p.waitForTimeout(3000);
  ok(cloudF(F3, 'u8').length === 0 && (await lokalF(X.p)).length === 0 && (await lokalF(Y.p)).length === 0, '5. fshirja e freskët s\'kthehet (as nga pajisja tjetër)', [await lokalF(X.p), await lokalF(Y.p)]);
  // 11 minuta më vonë (shënimet e fshirjeve plaken): pajisja tjetër i kthen
  const d8 = F3.S.docs.get('dyqane/u8');
  F3.S.docs.set('dyqane/u8', Object.assign({}, d8, { fshira: Object.assign({}, d8.fshira, { foldera: Object.fromEntries(Object.keys(d8.fshira.foldera).map(k => [k, Date.now() - 11 * 60000])) }) }));
  await Y.p.evaluate(() => window.__fs('resync'));
  ok(await prit(async () => cloudF(F3, 'u8').length === 4 && (await lokalF(Y.p)).length === 4), '5. pas 10 minutash: 4 folderat kthehen (Y)', cloudF(F3, 'u8').map(f => f.emri));
  ok(await prit(async () => (await lokalF(X.p)).length === 4), '5. ... edhe te X', await lokalF(X.p));

  ok(!gab.length, 'pa gabime JavaScript', gab);
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

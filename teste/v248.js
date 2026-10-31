// v248: tri rregullime. Kontrollon:
// 0. kujtesa plot: hiqen së pari produktet e mësuara vetë / të kolegëve, të kontrolluarat e administratorit mbeten
// 1. "Produktet e reja": pritja e një kolegu (tonnyaliu) me produkte që administratori i ka kontrolluar tashmë (te regjistri)
//    s'i nxjerr ato sërish për kontroll (edhe në një pajisje të re të administratorit); produkti vërtet i ri del; pajisja e
//    kolegut s'i dërgon më për kontroll
// 2. merchandiseri: te "Krejt marketet" afatet ndahen sipas marketit; çdo afat tregon marketin (tel + PC)
// 3. PC pas rifreskimit: para se Firebase ta dijë hyrjen, s'del "Mirë se erdhe" me hyrjen (llogaria e fundit, "Duke u lidhur…")
const { chromium } = require('./pw.js');
const path = require('path');
const { krijoFirestore } = require('./fs-server.js');
const AF = require('../afatet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 10000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
(async () => {
  // ================= 0. Kujtesa plot =================
  const mem = {}; const ruajtja = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
  mem['stoku:kujtesa:kontrolli-v238'] = '1';
  const K = AF.krijoKujtesen(ruajtja);
  const remote = { '9008700133760': { e: 'Bravo Cranberry 500ml', f: 'Meridian', k: 5, s: 1 } };
  for (let i = 0; i < 20000; i++) remote['b' + i] = { e: 'Produkt ' + i, f: '', k: 1000 + i, a: 1 };
  K.bashko(remote);
  const l0 = K.lista();
  ok(l0.length === 20000 && l0.some(x => x.barkodi === '9008700133760' && x.ngaAdmini) && !l0.some(x => x.barkodi === 'b0'), '0. kujtesa plot (20 000): i kontrolluari (më i vjetri) mbetet, hiqet produkti i mësuar vetë', l0.length);

  // ================= Faqet =================
  const t = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'tonnyaliu', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'meri', kycurSe: t, krijuarSe: t, merchandiser: true });
  // Regjistri: dy produkte të kontrolluara nga administratori kohë më parë
  F.S.docs.set('kujtesa/p0', { p: { '9008700133760': { e: 'Bravo Cranberry 500ml', f: 'Meridian', k: t - 9e8, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0, r: 0 } }, ndryshuarSe: t - 9e8 });
  F.S.docs.set('kujtesa/p9', { p: { '3830000162159': { e: 'Dana Blueberry 1.5L', f: 'Albulena Impex', k: t - 9e8, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0, r: 0 } }, ndryshuarSe: t - 9e8 });
  // Pritja e vjetër e tonnyaliu-t (me produktet e kontrolluara + një të ri)
  F.S.docs.set('kujtesa_pritje/u2', { emri: 'tonnyaliu', ndryshuarSe: t - 5000, p: {
    '9008700133760': { e: 'Bravo Cranberry 500ml', f: 'Meridian', k: t - 6000, a: 0, m: 0, s: 0, n: 'tonnyaliu', x: 0, r: 0 },
    '3830000162159': { e: 'Dana Blueberry 1.5L', f: 'Albulena Impex', k: t - 6000, a: 0, m: 0, s: 0, n: 'tonnyaliu', x: 0, r: 0 },
    '5310000000011': { e: 'Lëng Molle 1L', f: 'Meridian', k: t - 6000, a: 0, m: 0, s: 0, n: 'tonnyaliu', x: 0, r: 0 } } });
  const b = await chromium.launch();
  async function faqe(uid, emri, o) {
    o = o || {};
    const ctx = await b.newContext(o.pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
    if (uid) await F.lidh(ctx, uid, emri + '@stoku-app.local', o.pc ? 'pc' : 'tel', o.lokale || null);
    await ctx.addInitScript(x => {
      try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {}
      if (x.kuj && !sessionStorage.getItem('__kuj')) { sessionStorage.setItem('__kuj', '1'); localStorage.setItem('stoku:kujtesa:v1', JSON.stringify(x.kuj)); localStorage.setItem('stoku:kujtesa:kontrolli-v238', '1'); }
      if (x.ls) Object.keys(x.ls).forEach(k => { if (!sessionStorage.getItem('__ls' + k)) { sessionStorage.setItem('__ls' + k, '1'); localStorage.setItem(k, x.ls[k]); } });
    }, { kuj: o.kuj || null, ls: o.ls || null });
    if (o.init) await ctx.addInitScript(o.init);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/' + (o.pc ? 'pc.html' + (o.hash || '') : 'index.html'));
    await p.waitForTimeout(o.prit === undefined ? 2500 : o.prit);
    return { p, ctx };
  }
  const doc = k => F.S.docs.get(k);
  const kuj = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));

  // ================= 1. Produktet e reja =================
  // tonnyaliu: në pajisjen e tij Bravo ka një kopje të administratorit më të re se regjistri (p.sh. nga grupi)
  const { p: to } = await faqe('u2', 'tonnyaliu', { kuj: {
    '9008700133760': { e: 'Bravo Cranberry 500ml', f: 'Meridian', k: t - 3000, s: 1, n: 'mendurberisha' },
    '5310000000011': { e: 'Lëng Molle 1L', f: 'Meridian', k: t - 6000, n: 'tonnyaliu' } } });
  ok(await prit(async () => { const d = doc('kujtesa_pritje/u2'); return d && d.ndryshuarSe > t && d.p['5310000000011']; }), '1. tonnyaliu: pritja u rishkrua', doc('kujtesa_pritje/u2') && Object.keys(doc('kujtesa_pritje/u2').p));
  ok(!doc('kujtesa_pritje/u2').p['9008700133760'] && !doc('kujtesa_pritje/u2').p['3830000162159'], '1. tonnyaliu s\'i dërgon për kontroll produktet që i ka kontrolluar administratori', Object.keys(doc('kujtesa_pritje/u2').p));
  // Pritja e vjetër (para v248) e kthehet, si të ishte dërguar nga një version i vjetër i aplikacionit
  F.S.docs.set('kujtesa_pritje/u2', { emri: 'tonnyaliu', ndryshuarSe: t, p: {
    '9008700133760': { e: 'Bravo Cranberry 500ml', f: 'Meridian', k: t - 1000, a: 0, m: 0, s: 0, n: 'tonnyaliu', x: 0, r: 0 },
    '3830000162159': { e: 'Dana Blueberry 1.5L', f: 'Albulena Impex', k: t - 1000, a: 0, m: 0, s: 0, n: 'tonnyaliu', x: 0, r: 0 },
    '5310000000011': { e: 'Lëng Molle 1L', f: 'Meridian', k: t - 1000, a: 0, m: 0, s: 0, n: 'tonnyaliu', x: 0, r: 0 } } });
  // Administratori në një telefon të ri (pa kujtesë): s'i ka këto produkte në pajisje
  const { p: ad } = await faqe('uA', 'mendurberisha');
  const pritja = () => ad.evaluate(() => window.StokuAfatet.kujtesa().lista().filter(x => x.nePritje).map(x => x.barkodi + ':' + x.nga));
  ok(await prit(async () => (await pritja()).includes('5310000000011:tonnyaliu')), '1. administratori: "Lëng Molle 1L" (i ri) del për kontroll', await pritja());
  await ad.waitForTimeout(1500);
  ok((await pritja()).length === 1, '1. administratori: Bravo dhe Dana (të kontrolluara) s\'dalin sërish te "Produktet e reja"', await pritja());
  const ka = await kuj(ad);
  ok(ka['9008700133760'] && ka['9008700133760'].s === 1 && !ka['9008700133760'].r && ka['3830000162159'] && ka['3830000162159'].s === 1, '1. Bravo dhe Dana janë te Produktet (të kontrolluara)', [ka['9008700133760'], ka['3830000162159']]);
  await ad.click('#btnOpsione'); await ad.waitForTimeout(400);
  ok(/1 produkt i ri për kontroll/.test(await ad.textContent('#tabListaStatus')), '1. Cilësimet: "1 produkt i ri për kontroll"', await ad.textContent('#tabListaStatus'));
  ok(!ad.__gab.length && !to.__gab.length, '1. pa gabime JS', [ad.__gab, to.__gab]);
  // 1b. Administratori me kujtesë plot (20 000 produkte të mësuara më vonë se kontrolli): para v248 hiqeshin të kontrolluarat
  // (më të vjetrat) dhe pritja e tonnyaliu-t i nxirrte sërish te "Produktet e reja"
  const PLOT = {}; for (let i = 0; i < 20000; i++) PLOT['77' + i] = { e: 'Produkt ' + i, f: '', k: t - 5e8 + i, a: 1 };
  const { p: ad2 } = await faqe('uA', 'mendurberisha', { pc: true, kuj: PLOT });
  const pritja2 = () => ad2.evaluate(() => window.StokuAfatet.kujtesa().lista().filter(x => x.nePritje).map(x => x.barkodi + ':' + x.nga));
  ok(await prit(async () => (await pritja2()).includes('5310000000011:tonnyaliu'), 15000), '1b. kujtesa plot: "Lëng Molle 1L" del për kontroll', await pritja2());
  await ad2.waitForTimeout(2000);
  const ka2 = await kuj(ad2);
  ok((await pritja2()).length === 1 && ka2['9008700133760'] && ka2['9008700133760'].s === 1 && ka2['3830000162159'] && ka2['3830000162159'].s === 1, '1b. kujtesa plot: Bravo dhe Dana mbeten të kontrolluara, s\'dalin te "Produktet e reja"', [await pritja2(), ka2['9008700133760']]);
  ok(Object.keys(ka2).length <= 20000 && !ad2.__gab.length, '1b. kujtesa s\'kalon 20 000; pa gabime JS', [Object.keys(ka2).length, ad2.__gab]);

  // ================= 2. Merchandiseri: afatet sipas marketeve =================
  const sot = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const MK = [{ id: 'm1', emri: 'Albi Mall', ndryshuarSe: t }, { id: 'm2', emri: 'Viva Fresh', ndryshuarSe: t }];
  const AF0 = [
    { id: 'a1', barkodi: '111', emri: 'Kos', data: sot(5), sasia: 2, statusi: 'aktiv', m: 'm1', ndryshuarSe: t },
    { id: 'a2', barkodi: '222', emri: 'Qumësht', data: sot(6), sasia: 3, statusi: 'aktiv', m: 'm2', ndryshuarSe: t },
    { id: 'a3', barkodi: '333', emri: 'Djathë', data: sot(7), sasia: 1, statusi: 'aktiv', m: 'm1', ndryshuarSe: t },
    { id: 'a4', barkodi: '444', emri: 'Bukë', data: sot(8), sasia: 4, statusi: 'aktiv', ndryshuarSe: t }];
  const LS = { 'stoku:marketet:v1': JSON.stringify(MK), 'stoku:marketi:aktiv': JSON.stringify({ id: null, menyra: 'dore', koha: Date.now(), kontrolluarSe: Date.now() }), 'stoku:marketet:pyetur': 'u5' };
  const { p: me } = await faqe('u5', 'meri', { lokale: { afatet: AF0 }, ls: LS });
  await me.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  await me.evaluate(() => document.getElementById('btnAfatet').click()); await me.waitForTimeout(800);
  await me.evaluate(() => document.querySelectorAll('.mbulese.hapur:not(.faqe-e-plote)').forEach(d => d.classList.remove('hapur')));
  const listaTel = () => me.evaluate(() => [...document.querySelectorAll('#afLista > *')].map(x => x.classList.contains('af-grup-market') ? '# ' + x.textContent.trim() : x.classList.contains('af-karta') ? x.querySelector('.af-emri').textContent + ' @ ' + ((x.querySelector('.af-market') || {}).textContent || '-') : x.className));
  ok(await prit(async () => (await listaTel()).length >= 7), '2. tel: Afatet (Krejt marketet)', await listaTel());
  ok((await listaTel()).join(' | ') === '# Albi Mall · 2 | Kos @ Albi Mall | Djathë @ Albi Mall | # Viva Fresh · 1 | Qumësht @ Viva Fresh | # Pa market · 1 | Bukë @ Pa market', '2. tel: afatet të ndara sipas marketit, secili me marketin e vet', await listaTel());
  await me.screenshot({ path: __dirname + '/v248-tel-marketet.png' });
  await me.click('#afMarketi'); await me.waitForTimeout(300);
  await me.evaluate(() => [...document.querySelectorAll('#mkdLista button')].find(x => /Viva Fresh/.test(x.textContent)).click()); await me.waitForTimeout(500);
  ok((await listaTel()).join(' | ') === 'Qumësht @ Viva Fresh', '2. tel: te "Viva Fresh" vetëm afati i tij, me marketin', await listaTel());
  ok(!me.__gab.length, '2. tel: pa gabime JS', me.__gab);
  const { p: mp } = await faqe('u5', 'meri', { pc: true, hash: '#/afatet', lokale: { afatet: AF0 }, ls: LS });
  const listaPc = () => mp.evaluate(() => [...document.querySelectorAll('#afTrup > tr')].map(x => x.classList.contains('af-grup-market') ? '# ' + x.textContent.trim() : x.dataset.id ? x.querySelector('.af-prod > div').textContent + ' @ ' + ((x.querySelector('.af-prod-mk') || {}).textContent || '-') : x.className));
  await mp.evaluate(() => { const s = document.getElementById('afMarketiPc'); s.value = ''; s.dispatchEvent(new Event('change')); }); await mp.waitForTimeout(500);
  ok(await prit(async () => (await listaPc()).length >= 7), '2. PC: Afatet', await listaPc());
  ok((await listaPc()).join(' | ') === '# Albi Mall · 2 produkte | Kos @ Albi Mall | Djathë @ Albi Mall | # Viva Fresh · 1 produkt | Qumësht @ Viva Fresh | # Pa market · 1 produkt | Bukë @ Pa market', '2. PC: të ndara sipas marketit, marketi te çdo rresht', await listaPc());
  await mp.screenshot({ path: __dirname + '/v248-pc-marketet.png' });
  ok(!mp.__gab.length, '2. PC: pa gabime JS', mp.__gab);

  // ================= 3. PC pas rifreskimit =================
  const HYRJA = { 'stoku:porta:hyrja': JSON.stringify({ uid: 'u9', emri: 'testmorina' }), 'stoku:pronari-uid': 'u9' };
  const sinkronizimi = () => { window.__stokuCloud = { authGati: false, perdoruesiAktual: () => null }; }; // Firebase ende pa u përgjigjur
  const gjendja = p => p.evaluate(() => ({ karta: !document.getElementById('kartaMireseardhje').classList.contains('fsheh'), cip: document.getElementById('perdoruesiCip').textContent, sink: document.getElementById('opsNavSub').textContent })); // v271: statusi vetëm te Cilësimet
  const { p: q1 } = await faqe(null, null, { pc: true, ls: HYRJA, init: sinkronizimi, prit: 1200 });
  let gj = await gjendja(q1);
  ok(!gj.karta && gj.cip === 'testmorina' && gj.sink === 'Duke u lidhur…', '3. ishte i kyçur: pa "Mirë se erdhe", "testmorina · Duke u lidhur…"', gj);
  await q1.evaluate(() => { window.__stokuCloud.authGati = true; window.dispatchEvent(new Event('stoku-auth-ndryshoi')); }); await q1.waitForTimeout(500);
  gj = await gjendja(q1);
  ok(gj.karta && gj.cip === 'Hyr' && gj.sink === 'Vetëm në këtë kompjuter', '3. Firebase: s\'je më i kyçur → pamja pa llogari', gj);
  const { p: q2 } = await faqe(null, null, { pc: true, init: sinkronizimi, prit: 1200 });
  gj = await gjendja(q2);
  ok(gj.karta && gj.cip === 'Hyr', '3. s\'ishte i kyçur: "Mirë se erdhe" si më parë', gj);
  const { p: q3 } = await faqe(null, null, { pc: true, ls: HYRJA, init: sinkronizimi, prit: 1200 });
  ok(!(await gjendja(q3)).karta, '3. pa përgjigje nga Firebase: ende "Duke u lidhur…"');
  await q3.waitForTimeout(9600);
  gj = await gjendja(q3);
  ok(gj.karta && gj.cip === 'Hyr', '3. pas 10 s pa përgjigje: pamja e zakonshme', gj);
  ok(!q1.__gab.length && !q2.__gab.length && !q3.__gab.length, '3. pa gabime JS', [q1.__gab, q2.__gab, q3.__gab]);

  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

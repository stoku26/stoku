// v251: çipi i marketit s'zhduket dhe merchandiseri i ndezur nga administratori i merr marketet e Stoku-t. Kontrollon:
// 1. telefoni: administratori e ndez "Merchandiser" te Përdoruesit → pa rifreskim: çipi, marketet e Stoku-t (pikat), GPS-i,
//    "Harta" te Cilësimet
// 2. kompjuteri: e njëjta gjë (zgjedhja e marketit te Afatet me marketet e Stoku-t, "Harta")
// 3. pajisje e re (si aplikacioni Android): gjendja e cloud-it pa marketet s'i fshin marketet e Stoku-t; çipi mbetet
// (Firebase-i i vërtetë: teste/emu/merch-e2e-v251.js, zgjedhja "Punoj si merchandiser" në pajisje të ndryshme)
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
const ALBI = { latitude: 42.6476, longitude: 21.1491, accuracy: 20 };
(async () => {
  const F = krijoFirestore();
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'vesa', kycurSe: t, krijuarSe: t });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, krijuarSe: t });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'drini', kycurSe: t, krijuarSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  F.S.docs.set('pikat/pA', { emri: 'Albi Mall', lat: 42.6476, lng: 21.1491, krijuarNga: 'u9', krijuarNgaEmri: 'arta', krijuarSe: t, ndryshuarSe: t });
  // drini ka dyqan në cloud (nga një pajisje tjetër) pa marketet
  F.S.docs.set('dyqane/u3', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [{ id: 'p1', folderId: 'f1', emri: 'Ujë', barkodi: '123', sasia: 3, ndryshuarSe: t }], afatet: [], marketet: [], fshira: {} });
  const b = await chromium.launch();
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(Object.assign(pc ? { viewport: { width: 1440, height: 900 } } : { userAgent: UA, viewport: { width: 390, height: 844 }, hasTouch: true },
      { serviceWorkers: 'block', geolocation: ALBI, permissions: ['geolocation'] }));
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', null);
    await ctx.addInitScript(() => {
      window.__gpsThirrje = 0;
      const g0 = navigator.geolocation && navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      if (g0) navigator.geolocation.getCurrentPosition = function () { window.__gpsThirrje++; return g0.apply(null, arguments); };
      window.__cipi = [];
      setInterval(() => { const c = !!document.querySelector('.sb-home-krye .mk-chip'); const l = window.__cipi; if (!l.length || l[l.length - 1] !== c) l.push(c); }, 100);
    });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const lsM = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  const cipi = p => p.evaluate(() => { const c = document.querySelector('.sb-home-krye .mk-chip'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : ''; });
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);
  const mbyll = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  async function ndezMerchandiserin(ad, emri) {
    if (!(await duket(ad, '#pdLista'))) {
      if (!(await ad.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')))) { await ad.click('#btnOpsione'); await ad.waitForTimeout(300); }
      await ad.click('#tabPerdoruesit'); await ad.waitForTimeout(500);
    }
    await prit(async () => ad.evaluate(e => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].some(x => x.textContent.indexOf(e) !== -1), emri));
    await ad.evaluate(e => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => x.textContent.indexOf(e) !== -1).click(), emri); await ad.waitForTimeout(400);
    await ad.click('label[for=pdLeja_marketet]'); await ad.waitForTimeout(500);
    await ad.click('#opsPrapa'); await ad.waitForTimeout(300); // kthehu te lista
  }

  // ================= 1. Telefoni: administratori e ndez =================
  const { p: v } = await faqe('u1', 'vesa', false);
  await mbyll(v);
  ok(!(await cipi(v)) && await v.evaluate(() => window.__gpsThirrje) === 0, '1. vesa (jo merchandiser): pa çip, pa GPS');
  const { p: ad } = await faqe('uA', 'mendurberisha', false);
  await ndezMerchandiserin(ad, 'vesa');
  ok(F.S.docs.get('lejet/u1') && F.S.docs.get('lejet/u1').lejet.marketet === true, '1. lejet/u1.marketet = true');
  ok(await prit(async () => !!(await cipi(v))), '1. vesa: çipi del pa rifreskim', await cipi(v));
  ok(await prit(async () => (await lsM(v)).some(m => m.p === 'pA')), '1. v251: marketet e Stoku-t (pikat) vijnë pa rifreskim', await lsM(v));
  ok(await prit(async () => await v.evaluate(() => window.__gpsThirrje) >= 1), '1. v251: GPS-i niset (je te Albi)');
  ok(await prit(async () => /Albi Mall/.test(await cipi(v))), '1. çipi: "Je te Albi Mall"', await cipi(v));
  ok(await v.evaluate(() => !document.getElementById('tabMarketet').classList.contains('leja-ndaluar') && getComputedStyle(document.getElementById('tabMarketet')).display !== 'none'), '1. v251: "Harta" te Cilësimet');

  // ================= 2. Kompjuteri =================
  const { p: pb } = await faqe('u2', 'besa', true);
  await pb.goto(BAZA + '/pc.html#/afatet'); await pb.waitForTimeout(2500);
  ok(!(await duket(pb, '#afMarketiPcKuti')), '2. PC besa (jo merchandiser): pa zgjedhjen e marketit');
  await ndezMerchandiserin(ad, 'besa');
  ok(await prit(async () => (await pb.evaluate(() => [...document.getElementById('afMarketiPc').options].map(o => o.textContent))).includes('Albi Mall') && await duket(pb, '#afMarketiPcKuti')),
    '2. v251: PC besa: "Marketi" me marketet e Stoku-t, pa rifreskim', await pb.evaluate(() => [...document.getElementById('afMarketiPc').options].map(o => o.textContent)));
  ok(await prit(async () => !(await pb.evaluate(() => document.getElementById('opsSkedaHarta').hidden))), '2. v251: PC besa: "Harta" te Cilësimet');

  // ================= 3. Pajisje e re: cloud-i pa marketet =================
  const { p: d } = await faqe('u3', 'drini', false);
  await mbyll(d);
  ok(await prit(async () => (await d.evaluate(() => JSON.parse(localStorage.getItem('stoku:foldera:v1') || '[]'))).some(f => f.id === 'f1')), '3. drini: gjendja e cloud-it u mor (pajisje e re)', await d.evaluate(() => localStorage.getItem('stoku:foldera:v1')));
  ok(await prit(async () => (await lsM(d)).some(m => m.p === 'pA')), '3. v251: marketet e Stoku-t mbeten pas gjendjes së cloud-it', await lsM(d));
  await d.waitForTimeout(3000);
  ok(await d.evaluate(() => { const l = window.__cipi; const i = l.indexOf(true); return i !== -1 && l.slice(i).indexOf(false) === -1; }) && /Albi Mall/.test(await cipi(d)), '3. çipi s\'zhduket ("Je te Albi Mall")', [await d.evaluate(() => window.__cipi), await cipi(d)]);
  await d.reload(); await d.waitForTimeout(4000); await mbyll(d);
  ok(await d.evaluate(() => { const l = window.__cipi; const i = l.indexOf(true); return i !== -1 && l.slice(i).indexOf(false) === -1; }), '3. pas rifreskimit: çipi s\'zhduket', await d.evaluate(() => window.__cipi));

  for (const [n, p] of [['vesa', v], ['admini', ad], ['besa PC', pb], ['drini', d]]) ok(!p.__gab.length, n + ': pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

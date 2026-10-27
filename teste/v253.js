// v253: dy markete afër njëri-tjetrit (p.sh. dy anët e rrugës, rreth 50 m). Kontrollon:
// 0. njësitë: pikaShumeAfer (administratori: vetëm brenda 20 m), kontrolloShtimin (merchandiseri: 20 m = i njëjti;
//    deri në 20 m + pasaktësia = "afer"; më larg lejohet), pikaPerMarketin (marketi i vjetër lidhet vetëm me të njëjtin emër)
// 1. telefoni: administratori shton "Viva Fresh 110" 55 m nga "Viva Fly" (më parë: "Këtu është tashmë marketi"); 10 m s'lejohet
// 2. PC: e njëjta gjë
// 3. merchandiseri 50 m nga "Viva Fly" (pasaktësia 15 m): e shton marketin e ri; 35 m me pasaktësi 30 m: "Afër (35 m)…"
const { chromium } = require('./pw.js');
const fs = require('fs');
const path = require('path');
const { krijoFirestore } = require('./fs-server.js');
const RR = process.env.STOKU_DIR || path.resolve(__dirname, '..');
const MK = require(RR + '/marketet.js');
const SH = require(RR + '/harta.js');
const P = require('./harta-pllakat.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
const MAPLIBRE = fs.readFileSync(path.join(__dirname, 'npm', 'node_modules', 'maplibre-gl', 'dist', 'maplibre-gl.js'));
// Viva Fly; lindje: +0.000122 ≈ 10 m, +0.000427 ≈ 35 m, +0.000611 ≈ 50 m, +0.000672 ≈ 55 m
const VF = { lat: 42.6600, lng: 21.1700 };
const lindje = d => ({ lat: VF.lat, lng: Math.round((VF.lng + d) * 1e6) / 1e6 });
(async () => {
  // ================= 0. Njësitë =================
  const t = Date.now();
  const pVF = { id: 'pVF', emri: 'Viva Fly', lat: VF.lat, lng: VF.lng, krijuarNga: 'uA' };
  ok(MK.AFER_M === 20, '0. kufiri: 20 m', MK.AFER_M);
  ok(MK.pikaShumeAfer([pVF], lindje(0.000672)) === null, '0. administratori: 55 m nga Viva Fly lejohet');
  const sa = MK.pikaShumeAfer([pVF], lindje(0.000122));
  ok(sa && sa.pika.id === 'pVF' && sa.largesia === 10, '0. administratori: 10 m s\'lejohet', sa);
  const poz = (d, sakt) => Object.assign(lindje(d), { sakt });
  ok(MK.kontrolloShtimin(poz(0.000672, 15), [], [pVF]) === null, '0. merchandiseri: 55 m (pasaktësia 15 m) lejohet');
  ok(MK.kontrolloShtimin(poz(0.000611, 15), [], [pVF]) === null, '0. merchandiseri: 50 m (pasaktësia 15 m) lejohet');
  const af = MK.kontrolloShtimin(poz(0.000672, 40), [], [pVF]);
  ok(af && af.arsye === 'afer' && af.emri === 'Viva Fly' && af.largesia === 55 && af.sakt === 40, '0. merchandiseri: 55 m me pasaktësi 40 m: "afer"', af);
  ok(MK.kontrolloShtimin(poz(0.000672, 90), [], [pVF]).arsye === 'afer', '0. pasaktësia e madhe: kufiri 60 m');
  ok(MK.kontrolloShtimin(Object.assign(lindje(0.000962), { sakt: 90 }), [], [pVF]) === null, '0. 79 m me pasaktësi 90 m: lejohet (kufiri 60 m)');
  const ek = MK.kontrolloShtimin(poz(0.000122, 30), [], [pVF]);
  ok(ek && ek.arsye === 'ekziston' && ek.pika.id === 'pVF', '0. 10 m: "ekziston" (zgjidhet Viva Fly)', ek);
  const ekM = MK.kontrolloShtimin(poz(0.000305, 10), [{ id: 'kpVF', emri: 'Viva Fly', lat: VF.lat, lng: VF.lng, p: 'pVF' }], [pVF]);
  ok(ekM && ekM.arsye === 'afer' && ekM.largesia === 25, '0. 25 m me pasaktësi 10 m: "afer" (nga lista)', ekM);
  // marketi i vjetër pa pikë: lidhet vetëm me pikën me të njëjtin emër (ose brenda 20 m)
  const l50 = lindje(0.000611);
  ok(MK.pikaPerMarketin([pVF], Object.assign({ emri: 'Viva Fresh' }, l50)) === null, '0. marketi i vjetër "Viva Fresh" 50 m nga "Viva Fly": s\'lidhet');
  ok((MK.pikaPerMarketin([pVF], Object.assign({ emri: 'viva  FLY' }, l50)) || {}).id === 'pVF', '0. "viva FLY" 50 m larg: lidhet (i njëjti emër)');
  ok((MK.pikaPerMarketin([pVF], Object.assign({ emri: 'Tjetër' }, lindje(0.000122))) || {}).id === 'pVF', '0. 10 m larg: lidhet (i njëjti vend)');
  const p110 = { id: 'p110', emri: 'Viva Fresh 110', lat: lindje(0.000672).lat, lng: lindje(0.000672).lng, krijuarNga: 'uA' };
  const sk = MK.sinkronizoMePikat([{ id: 'mVj', emri: 'Viva Fresh 110', lat: l50.lat, lng: l50.lng, ndryshuarSe: t - 9e6 }], [pVF, p110], [{ id: 'a1', m: 'mVj' }], true, t);
  const mVj = sk.marketet.find(m => m.id === 'mVj');
  ok(mVj && mVj.p === 'p110' && sk.marketet.some(m => m.id === 'kpVF') && !sk.hequr.length, '0. sinkronizimi: marketi i vjetër shkon te pika me emrin e vet (jo te Viva Fly më afër)', sk.marketet);

  const TR = require(RR + '/teRejat.js');
  const tr = (a, l) => TR.teRejatPas(252, 'tel', a, l).filter(h => h.v === 253).map(h => h.titulli); // vetëm hyrjet e v253 (më vonë vijnë të tjera)
  ok(tr(false, () => true).join() === 'Markete afër njëri-tjetrit' && tr(true).length === 2 && !tr(false, k => k !== 'marketet').length,
    '0. "Çka ka të re": merchandiseri 1, administratori 2, të tjerët asnjë', [tr(false, () => true), tr(true)]);

  // ================= Faqet =================
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  F.S.docs.set('pikat/pVF', { emri: 'Viva Fly', lat: VF.lat, lng: VF.lng, krijuarNga: 'uA', krijuarNgaEmri: 'mendurberisha', krijuarSe: t - 9e6, ndryshuarSe: t - 9e6 });
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  async function faqe(uid, emri, pc, geo) {
    const ctx = await b.newContext(Object.assign(pc ? { viewport: { width: 1440, height: 900 } } : { userAgent: UA, viewport: { width: 390, height: 844 }, hasTouch: true },
      { serviceWorkers: 'block', permissions: geo ? ['geolocation'] : [] }, geo ? { geolocation: geo } : {}));
    await ctx.route(u => !u.href.startsWith(BAZA), r => {
      const u = r.request().url();
      if (u === SH.MAPLIBRE_JS) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: MAPLIBRE });
      if (/^https:\/\/tiles\.openfreemap\.org\//.test(u)) return P.rrugaEPllakave(r);
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
    });
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);
  const pikat = () => [...F.S.docs.keys()].filter(k => /^pikat\/[^/]+$/.test(k)).map(k => Object.assign({ id: k.slice(6) }, F.S.docs.get(k)));
  const lsM = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  const qendra = (p, x, z) => p.evaluate(a => window.StokuHarta.eFundit.map.jumpTo({ center: [a[0], a[1]], zoom: a[2] }), [x.lng, x.lat, z]);
  async function hapCilesimet(p, tab) {
    if (!(await p.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')))) { await p.click('#btnOpsione'); await p.waitForTimeout(300); }
    if (await p.evaluate(() => document.getElementById('kategoriMenu').style.display === 'none')) { await p.click('#opsPrapa'); await p.waitForTimeout(200); }
    await p.click(tab); await p.waitForTimeout(400);
  }

  // ================= 1. Telefoni: administratori =================
  const { p: ad } = await faqe('uA', 'mendurberisha', false, null);
  await hapCilesimet(ad, '#tabMarketet');
  ok(await prit(async () => await ad.evaluate(() => { const i = window.StokuHarta && window.StokuHarta.eFundit; return !!(i && i.map.loaded()); }), 30000), '1. harta u hap');
  await ad.click('#htShto'); await ad.waitForTimeout(300);
  await qendra(ad, lindje(0.000122), 18);
  await ad.fill('#htShtoEmri', 'Viva Fresh 110'); await ad.click('#htShtoRuaj'); await ad.waitForTimeout(200);
  ok(/Këtu është tashmë marketi "Viva Fly" \(10 m\)/.test(await ad.textContent('#htShtoGabim')) && !pikat().some(x => x.emri === 'Viva Fresh 110'), '1. 10 m nga Viva Fly: s\'shtohet', await ad.textContent('#htShtoGabim'));
  await qendra(ad, lindje(0.000672), 18);
  await ad.click('#htShtoRuaj');
  ok(await prit(async () => pikat().some(x => x.emri === 'Viva Fresh 110')), '1. 55 m nga Viva Fly (matanë rrugës): "Viva Fresh 110" u shtua', await ad.textContent('#htShtoGabim'));
  const p1 = pikat().find(x => x.emri === 'Viva Fresh 110');
  ok(p1 && Math.round(MK.largesia(VF, p1)) === 55, '1. pika 55 m larg', p1 && MK.largesia(VF, p1));
  ok(await prit(async () => (await ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-emri')].map(x => x.textContent))).filter(e => /^Viva F/.test(e)).length === 2), '1. lista e hartës: të dy');
  ok(!ad.__gab.length, '1. pa gabime JS', ad.__gab);

  // ================= 2. PC: administratori =================
  const { p: apc } = await faqe('uA', 'mendurberisha', true, null);
  await apc.click('#btnOpsione'); await apc.waitForTimeout(400);
  await apc.click('#opsSkedaHarta'); await apc.waitForTimeout(400);
  ok(await prit(async () => await apc.evaluate(() => { const i = window.StokuHarta && window.StokuHarta.eFundit; return !!(i && i.map.loaded()); }), 30000), '2. PC: harta u hap');
  await apc.click('#htShto'); await apc.waitForTimeout(300);
  const pc35 = { lat: VF.lat + 0.000315, lng: VF.lng }; // ~35 m në veri të Viva Fly
  await qendra(apc, { lat: VF.lat + 0.00009, lng: VF.lng }, 18);
  await apc.fill('#htShtoEmri', 'Interex'); await apc.click('#htShtoRuaj'); await apc.waitForTimeout(200);
  ok(/Këtu është tashmë marketi "Viva Fly"/.test(await apc.textContent('#htShtoGabim')), '2. PC: 10 m: s\'shtohet', await apc.textContent('#htShtoGabim'));
  await qendra(apc, pc35, 18);
  await apc.click('#htShtoRuaj');
  ok(await prit(async () => pikat().some(x => x.emri === 'Interex')), '2. PC: 35 m nga Viva Fly: "Interex" u shtua', await apc.textContent('#htShtoGabim'));
  ok(!apc.__gab.length, '2. PC: pa gabime JS', apc.__gab);

  // ================= 3. Merchandiseri =================
  const geo50 = { latitude: VF.lat, longitude: lindje(0.000611).lng, accuracy: 15 }; // 50 m nga Viva Fly, 5 m nga Viva Fresh 110
  const geoJ = { latitude: VF.lat - 0.000855, longitude: VF.lng, accuracy: 15 }; // ~95 m në jug (larg krejt)
  const { p: dr, ctx: cD } = await faqe('u1', 'drini', false, geoJ);
  await dr.evaluate(() => ['dlgMarketi', 'dlgMarketiRi'].forEach(id => document.getElementById(id).classList.remove('hapur')));
  ok(await prit(async () => (await lsM(dr)).filter(m => m.p).length === 3), '3. drini: 3 marketet e Stoku-t', await lsM(dr));
  await hapCilesimet(dr, '#tabMarketet');
  // 35 m nga Viva Fly me pasaktësi 30 m: "afer"
  await cD.setGeolocation({ latitude: VF.lat, longitude: lindje(-0.000427).lng, accuracy: 30 }); // 35 m në perëndim
  await dr.fill('#mkEmriRi', 'Market i Ri'); await dr.click('#mkShto');
  ok(await prit(async () => /Afër \(\d+ m\) është marketi "Viva Fly" dhe vendndodhja ka pasaktësi rreth 30 m/.test(await dr.textContent('#mkGabim'))), '3. 35 m me pasaktësi 30 m: "Afër (N m) është marketi…"', await dr.textContent('#mkGabim'));
  ok(!pikat().some(x => x.emri === 'Market i Ri'), '3. asnjë pikë e re');
  // 50 m nga Viva Fly, por 5 m nga Viva Fresh 110: zgjidhet Viva Fresh 110 (jo Viva Fly)
  await cD.setGeolocation(geo50);
  await dr.click('#mkShto');
  ok(await prit(async () => /Këtu është tashmë marketi "Viva Fresh 110"/.test(await dr.evaluate(() => document.getElementById('toast').textContent))), '3. 5 m nga Viva Fresh 110: zgjidhet ai', await dr.evaluate(() => document.getElementById('toast').textContent));
  // 60 m në jug të Viva Fly (larg të tjerave), pasaktësia 15 m: shtohet
  await cD.setGeolocation({ latitude: VF.lat - 0.00054, longitude: VF.lng, accuracy: 15 });
  await dr.fill('#mkEmriRi', 'Market i Ri'); await dr.click('#mkShto');
  ok(await prit(async () => pikat().some(x => x.emri === 'Market i Ri' && x.krijuarNga === 'u1')), '3. 60 m nga Viva Fly (pasaktësia 15 m): "Market i Ri" u shtua', await dr.textContent('#mkGabim'));
  ok(!dr.__gab.length, '3. pa gabime JS', dr.__gab);

  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

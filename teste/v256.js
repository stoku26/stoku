// v256: (1) "Je te: …" vetëm kur je vërtet brenda marketit: rrezja 60 m + pasaktësia e GPS-it deri 40 m (më parë 250 + 150 m);
//       me pasaktësi mbi 150 m asnjë; zgjedhja me dorë bie kur GPS-i (i saktë) të tregon mbi 300 m larg saj.
//       (2) Harta dhe Marketet: një faqe "Marketet" te Cilësimet (telefoni), "Harta" e PC-së quhet "Marketet".
//  0) njësitë (marketet.js);
//  1) telefoni, merchandiseri në shtëpi 150 m nga marketi: "Krejt marketet" (jo "Je te"); brenda (30 m): "Je te: Albi 34";
//     zgjedhja me dorë e Albit, pastaj GPS-i 2 km larg: bie;
//  2) telefoni: s'ka më rresht "Harta"; "Marketet" i merchandiserit: "Je te", harta, lista me afatet, "Market i ri";
//  3) telefoni, administratori: "Marketet" (pa "Je te", pa "Market i ri", me "+ Shto market në hartë"); agim: pa "Marketet";
//  4) PC: skeda "Marketet" (ikona e marketeve), titulli "Marketet".
const { chromium } = require('./pw.js');
const fs = require('fs');
const path = require('path');
const { krijoFirestore } = require('./fs-server.js');
const MK = require('../marketet.js');
const SH = require('../harta.js');
const P = require('./harta-pllakat.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.BAZA || 'http://127.0.0.1:8765';
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const NM = path.join(__dirname, 'npm', 'node_modules');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 200)); } z(false); });
const MAPLIBRE = fs.readFileSync(NM + '/maplibre-gl/dist/maplibre-gl.js');
const ALBI = { lat: 42.6610, lng: 21.1600 };
const veri = (m, s) => ({ latitude: ALBI.lat + m / 111320, longitude: ALBI.lng, accuracy: s }); // m metra në veri të Albit

(async () => {
  // ================= 0. Njësitë =================
  const L = [{ id: 'mA', emri: 'Albi 34', lat: ALBI.lat, lng: ALBI.lng }, { id: 'mB', emri: 'Pa vend' }];
  const poz = (m, s) => ({ lat: ALBI.lat + m / 111320, lng: ALBI.lng, sakt: s });
  ok(MK.RREZJA_M === 60 && MK.PASAKTESIA_MAKS_M === 40 && MK.PASAKTESIA_E_PRANUESHME_M === 150 && MK.LARG_M === 300, '0. kufijtë: 60 m + 40 m, pasaktësia ≤ 150 m, 300 m');
  ok(!!MK.gjej(L, poz(55, 5)) && !!MK.gjej(L, poz(95, 40)) && !MK.gjej(L, poz(105, 40)) && !MK.gjej(L, poz(105, 140)), '0. brenda 60 m + pasaktësia (deri 40): po; 105 m: jo (edhe me pasaktësi 140)');
  ok(!MK.gjej(L, poz(150, 15)) && !MK.gjej(L, poz(250, 10)), '0. 150 m dhe 250 m larg: s\'je te marketi (më parë po)');
  ok(!MK.gjej(L, poz(10, 151)) && !!MK.gjej(L, poz(10, 150)), '0. pasaktësia mbi 150 m: s\'dihet, asnjë');
  ok(MK.largNgaMarketi(L, 'mA', poz(400, 50)) && !MK.largNgaMarketi(L, 'mA', poz(330, 50)) && !MK.largNgaMarketi(L, 'mA', poz(2000, 500)) && !MK.largNgaMarketi(L, 'mB', poz(2000, 5)) && !MK.largNgaMarketi(L, 'mX', poz(2000, 5)),
    '0. largNgaMarketi: mbi 300 m + pasaktësia, vetëm me pozitë të saktë dhe market me vendndodhje');
  const t0 = Date.now(), dore = { id: 'mA', menyra: 'dore', koha: t0 - 60e3, kontrolluarSe: 0 };
  ok(MK.pasGps(dore, null, t0).id === 'mA' && MK.pasGps(dore, null, t0, true).id === null && MK.pasGps(dore, null, t0, false).id === 'mA', '0. pasGps: zgjedhja me dorë mbetet, përveç kur GPS-i të tregon larg');

  // ================= Faqet =================
  const t = Date.now();
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('pikat/p1', { emri: 'Albi 34', lat: ALBI.lat, lng: ALBI.lng, krijuarNga: 'u1', krijuarNgaEmri: 'drini', krijuarSe: t, ndryshuarSe: t });
  const MK1 = [{ id: 'm1', emri: 'Albi 34', lat: ALBI.lat, lng: ALBI.lng, p: 'p1', ndryshuarSe: t - 9000 }];
  const AF = [{ id: 'a1', emri: 'Kos', data: '2030-01-01', sasia: 2, statusi: 'aktiv', m: 'm1', krijuarSe: t, ndryshuarSe: t }];
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  async function faqe(uid, emri, pc, gps, me) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, permissions: ['geolocation'], geolocation: gps });
    await ctx.route(u => !u.href.startsWith(BAZA), r => {
      const u = r.request().url();
      if (u === SH.MAPLIBRE_JS) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: MAPLIBRE });
      if (/^https:\/\/tiles\.openfreemap\.org\//.test(u)) return P.rrugaEPllakave(r);
      if (u.startsWith(PUSH)) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
      return r.abort();
    });
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', { afatet: me ? AF : [] });
    if (me) await ctx.addInitScript(m => { if (!localStorage.getItem('stoku:marketet:v1')) localStorage.setItem('stoku:marketet:v1', JSON.stringify(m)); }, MK1);
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:marketet:kuje', JSON.stringify({ uid: 'u1', koha: Date.now() })); } catch (e) {} }); // pa "Ku je?" vetë
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);
  const cipi = p => p.evaluate(() => document.getElementById('afMarketiEmri').textContent);
  async function riktheGps(p) { // si hapja e aplikacionit pas 2 minutash
    await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('stoku:marketi:aktiv') || '{}'); a.kontrolluarSe = 0; localStorage.setItem('stoku:marketi:aktiv', JSON.stringify(a)); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(1500);
  }
  async function hapMarketet(p) {
    if (!(await p.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')))) { await p.click('#btnOpsione'); await p.waitForTimeout(300); }
    await p.click('#tabMarketet'); await p.waitForTimeout(1200);
  }

  // ================= 1. "Je te" në metra =================
  const { p: dr, ctx: ctxD } = await faqe('u1', 'drini', false, veri(150, 15), true);
  ok(await prit(async () => (await cipi(dr)) === 'Krejt marketet', 6000), '1. në shtëpi, 150 m nga marketi: "Krejt marketet" (jo "Je te: Albi 34")', await cipi(dr));
  await ctxD.setGeolocation(veri(30, 15)); await riktheGps(dr);
  ok(await prit(async () => (await cipi(dr)) === 'Albi 34'), '1. brenda marketit (30 m): "Je te: Albi 34"', await cipi(dr));
  await ctxD.setGeolocation(veri(90, 60)); await riktheGps(dr);
  ok(await prit(async () => (await cipi(dr)) === 'Albi 34'), '1. 90 m me pasaktësi 60 m (kufiri 100 m): mbetet "Albi 34"', await cipi(dr));
  await ctxD.setGeolocation(veri(2000, 20)); await riktheGps(dr);
  ok(await prit(async () => (await cipi(dr)) === 'Krejt marketet'), '1. 2 km larg: "Krejt marketet"', await cipi(dr));
  // zgjedhja me dorë, pastaj GPS-i larg saj
  await dr.evaluate(() => { localStorage.setItem('stoku:marketi:aktiv', JSON.stringify({ id: 'm1', menyra: 'dore', koha: Date.now(), kontrolluarSe: 0 })); });
  await dr.reload(); await dr.waitForTimeout(2500);
  ok(await prit(async () => (await cipi(dr)) === 'Krejt marketet'), '1. zgjedhur me dorë "Albi 34", por GPS-i 2 km larg: bie', await cipi(dr));
  await ctxD.setGeolocation(veri(200, 20));
  await dr.evaluate(() => { localStorage.setItem('stoku:marketi:aktiv', JSON.stringify({ id: 'm1', menyra: 'dore', koha: Date.now(), kontrolluarSe: 0 })); });
  await dr.reload(); await dr.waitForTimeout(2500);
  ok(await prit(async () => (await cipi(dr)) === 'Albi 34', 4000), '1. zgjedhur me dorë, GPS-i 200 m larg (p.sh. brenda qendrës tregtare): mbetet', await cipi(dr));

  // ================= 2. Faqja "Marketet" e merchandiserit =================
  ok(await dr.evaluate(() => !document.getElementById('tabHarta') && !document.querySelector('.opsione-faqe[data-faqe="harta"]')), '2. s\'ka më rresht/faqe "Harta"');
  ok(await dr.evaluate(() => !document.getElementById('tabMarketet').classList.contains('leja-ndaluar')), '2. drini: "Marketet" te Cilësimet');
  await hapMarketet(dr);
  ok((await dr.textContent('#opsioneTitulli')) === 'Marketet', '2. titulli "Marketet"');
  ok(await duket(dr, '#mkAktivKarta') && /Je te: Albi 34/.test(await dr.textContent('#mkAktivTitull')), '2. "Je te" lart', await dr.textContent('#mkAktivTitull'));
  ok(await prit(async () => await duket(dr, '#htHarta')), '2. harta në të njëjtën faqe');
  ok(await prit(async () => /Albi 34 · je këtu/.test(await dr.textContent('#htLista')) && /1 afat/.test(await dr.textContent('#htLista'))), '2. lista: "je këtu" dhe afatet e marketit', await dr.textContent('#htLista'));
  ok(await duket(dr, '#mkShtoKuti') && await duket(dr, '#mkShto') && !(await duket(dr, '#htShto')), '2. "Market i ri" (shto marketin ku je), pa "+ Shto market në hartë"');
  ok(/vetëm kur je brenda tij/.test(await dr.textContent('#mkIntro')), '2. teksti: GPS-i vetëm kur je brenda marketit');
  ok(!dr.__gab.length, '2. drini: pa gabime JS', dr.__gab);

  // ================= 3. Administratori, agim =================
  const { p: ad } = await faqe('uA', 'mendurberisha', false, veri(5000, 20), false);
  ok(await prit(async () => !(await ad.evaluate(() => document.getElementById('tabMarketet').classList.contains('leja-ndaluar')))), '3. administratori: "Marketet" te Cilësimet');
  ok(await prit(async () => (await ad.textContent('#tabMarketetStatus')) === 'Marketet në hartë'), '3. administratori: "Marketet në hartë"', await ad.textContent('#tabMarketetStatus'));
  await hapMarketet(ad);
  ok(await prit(async () => await duket(ad, '#htShto')) && !(await duket(ad, '#mkAktivKarta')) && !(await duket(ad, '#mkShtoKuti')), '3. administratori: "+ Shto market në hartë", pa "Je te" e pa "Market i ri"');
  ok(await prit(async () => /Albi 34/.test(await ad.textContent('#htLista'))), '3. administratori: lista e pikave');
  ok(!ad.__gab.length, '3. administratori: pa gabime JS', ad.__gab);
  const { p: ag } = await faqe('u3', 'agim', false, veri(5000, 20), false);
  ok(await ag.evaluate(() => document.getElementById('tabMarketet').classList.contains('leja-ndaluar')), '3. agim (s\'është merchandiser): pa "Marketet"');

  // ================= 4. PC =================
  const { p: pa } = await faqe('uA', 'mendurberisha', true, null, false);
  ok(await prit(async () => await pa.evaluate(() => !document.getElementById('opsSkedaHarta').hidden)), '4. PC administratori: skeda e dukshme');
  ok(await pa.evaluate(() => { const b = document.getElementById('opsSkedaHarta'); return /^Marketet/.test(b.querySelector('.ops-nav-tekst').textContent) && !!b.querySelector('.ops-ik.ngj-gjelber'); }), '4. PC: skeda quhet "Marketet", me ikonën e gjelbër');
  ok(await pa.evaluate(() => document.querySelector('.opsione-faqe[data-faqe="harta"] h2').textContent) === 'Marketet', '4. PC: titulli i faqes "Marketet"');

  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

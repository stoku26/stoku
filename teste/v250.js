// v250: marketet e Stoku-t, të njëjtat për krejt merchandiserët. Kontrollon:
// 0. njësitë: kontrolloShtimin (vendndodhja e saktë, jo mbi një market), sinkronizoMePikat (shtimi, emrat, heqja e kujdesshme)
// 1. besa e shton marketin kur është brenda (telefoni): pikë e Stoku-t; drini e merr vetë te lista (pa e vizituar)
// 2. drini: vendndodhja e përafërt refuzohet; 30 m nga Albi s'shtohet market tjetër (zgjidhet Albi); emri i përsëritur
// 3. pika e fshirë nga administratori: marketi pa afate hiqet (kur s'është i ri), ai me afate mbetet
// 4. administratori shton market me dorë në hartë (telefoni): zmadhimi, emri, afër një tjetri; merchandiserët e marrin
// 5. PC: administratori shton market në hartë; drini në PC: marketet e Stoku-t te zgjedhja, harta pa ndryshime
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
const ALBI = { latitude: 42.6476, longitude: 21.1491, accuracy: 20 };
const ALBI30 = { latitude: 42.6478, longitude: 21.1493, accuracy: 20 }; // ~27 m nga Albi
const SHTEPIA = { latitude: 42.6300, longitude: 21.1000, accuracy: 20 };

(async () => {
  // ================= 0. Njësitë =================
  const t = Date.now();
  const pA = { id: 'pA', emri: 'Albi Mall', lat: 42.6476, lng: 21.1491, krijuarNga: 'u2' };
  ok(MK.kontrolloShtimin({ lat: 42.63, lng: 21.1, sakt: 500 }, [], []).arsye === 'pasakte' && MK.kontrolloShtimin({ lat: 42.63, lng: 21.1 }, [], []).arsye === 'pasakte', '0. vendndodhja e përafërt (500 m) ose pa saktësi: s\'shtohet');
  ok(MK.kontrolloShtimin({ lat: 42.63, lng: 21.1, sakt: MK.SAKTESIA_MAKS_M }, [], [pA]) === null, '0. e saktë (≤ ' + MK.SAKTESIA_MAKS_M + ' m) dhe larg çdo marketi: shtohet');
  const k1 = MK.kontrolloShtimin({ lat: 42.6478, lng: 21.1493, sakt: 15 }, [], [pA]);
  ok(k1 && k1.arsye === 'ekziston' && k1.pika.id === 'pA', '0. 30 m nga një pikë e Stoku-t: "ekziston" (zgjidhet ajo)', k1);
  const k2 = MK.kontrolloShtimin({ lat: 42.6478, lng: 21.1493, sakt: 15 }, [{ id: 'm1', emri: 'Imi', lat: 42.6476, lng: 21.1491 }], []);
  ok(k2 && k2.arsye === 'ekziston' && k2.marketi.id === 'm1', '0. 30 m nga një market i listës: "ekziston"');
  ok(!MK.kontrolloShtimin({ lat: 42.6476 + 0.0009, lng: 21.1491, sakt: 15 }, [], [pA]), '0. 100 m larg: lejohet (market tjetër)');
  // sinkronizoMePikat
  const s1 = MK.sinkronizoMePikat([], [pA], [], true, t);
  ok(s1.ndryshuar && s1.marketet.length === 1 && s1.marketet[0].id === 'kpA' && s1.marketet[0].p === 'pA' && s1.marketet[0].emri === 'Albi Mall', '0. pika e re → market "k" + id (i njëjti id në krejt pajisjet)', s1.marketet);
  const s2 = MK.sinkronizoMePikat(s1.marketet, [Object.assign({}, pA, { emri: 'Albi Mall Prishtinë' })], [], true, t);
  ok(s2.ndryshuar && s2.marketet[0].emri === 'Albi Mall Prishtinë' && !s2.hequr.length, '0. emri i ri i pikës (administratori) → te marketi');
  ok(!MK.sinkronizoMePikat(s2.marketet, [Object.assign({}, pA, { emri: 'Albi Mall Prishtinë' })], [], true, t).ndryshuar, '0. pa ndryshime: s\'ruhet asgjë');
  const vjeter = [{ id: 'kpX', emri: 'X', lat: 42.6, lng: 21.1, p: 'pX', ndryshuarSe: t - 20 * 60e3 }];
  ok(MK.sinkronizoMePikat(vjeter, [], [], true, t).hequr.join() === 'kpX', '0. pika u fshi (lista nga serveri), marketi i vjetër pa afate: hiqet');
  ok(!MK.sinkronizoMePikat(vjeter, [], [], false, t).hequr.length, '0. lista nga memoria (pa server): s\'hiqet asgjë');
  ok(!MK.sinkronizoMePikat(vjeter, [], [{ id: 'a1', m: 'kpX' }], true, t).hequr.length, '0. me afate: mbetet');
  ok(!MK.sinkronizoMePikat([Object.assign({}, vjeter[0], { ndryshuarSe: t - 60e3 })], [], [], true, t).hequr.length, '0. i krijuar para 1 minute (pika mund të mos ketë ardhur): mbetet');
  const dy = MK.sinkronizoMePikat([{ id: 'kpA', emri: 'Albi Mall', lat: 42.6476, lng: 21.1491, p: 'pA', ndryshuarSe: t }, { id: 'mVj', emri: 'Albi', lat: 42.6476, lng: 21.1491, ndryshuarSe: t - 9e6 }], [pA], [{ id: 'a1', m: 'mVj' }], true, t);
  ok(dy.hequr.join() === 'kpA' && dy.marketet.length === 1 && dy.marketet[0].id === 'mVj' && dy.marketet[0].p === 'pA' && dy.marketet[0].emri === 'Albi Mall', '0. dy markete për një pikë: mbetet ai me afate (i vjetri), me emrin e pikës', dy);

  // ================= Faqet =================
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  // pika të vjetra që administratori i ka fshirë: drini ka dy markete të tyre (njërin me afat)
  const sot = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const MK_D = [{ id: 'kpOld', emri: 'Market i mbyllur', lat: 42.60, lng: 21.20, p: 'pOld', ndryshuarSe: t - 30 * 60e3 },
    { id: 'kpOld2', emri: 'Market me afate', lat: 42.61, lng: 21.21, p: 'pOld2', ndryshuarSe: t - 30 * 60e3 }];
  const AF_D = [{ id: 'x1', barkodi: '1', emri: 'Kos', data: sot(5), sasia: 2, statusi: 'aktiv', m: 'kpOld2', ndryshuarSe: t - 5000 }];
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  async function faqe(uid, emri, pc, geo, o) {
    o = o || {};
    const ctx = await b.newContext(Object.assign(pc ? { viewport: { width: 1440, height: 900 } } : { userAgent: UA, viewport: { width: 390, height: 844 }, hasTouch: true },
      { serviceWorkers: 'block', permissions: geo ? ['geolocation'] : [] }, geo ? { geolocation: geo } : {}));
    await ctx.route(u => !u.href.startsWith(BAZA), r => {
      const u = r.request().url();
      if (u === SH.MAPLIBRE_JS) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: MAPLIBRE });
      if (/^https:\/\/tiles\.openfreemap\.org\//.test(u)) return P.rrugaEPllakave(r);
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
    });
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', { afatet: o.afatet || [] });
    if (o.marketet) await ctx.addInitScript(m => { if (!localStorage.getItem('stoku:marketet:v1')) localStorage.setItem('stoku:marketet:v1', JSON.stringify(m)); }, o.marketet);
    await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const lsM = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);
  const pikat = () => [...F.S.docs.keys()].filter(k => /^pikat\/[^/]+$/.test(k)).map(k => Object.assign({ id: k.slice(6) }, F.S.docs.get(k)));
  const mbyllDritaret = p => p.evaluate(() => { ['dlgMarketi', 'dlgMarketiRi'].forEach(id => document.getElementById(id).classList.remove('hapur')); });
  async function hapCilesimet(p, tab) {
    if (!(await p.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')))) { await p.click('#btnOpsione'); await p.waitForTimeout(300); }
    if (await p.evaluate(() => document.getElementById('kategoriMenu').style.display === 'none')) { await p.click('#opsPrapa'); await p.waitForTimeout(200); }
    await p.click(tab); await p.waitForTimeout(400);
  }

  // ================= 1. besa e shton Albi Mall kur është brenda; drini e merr vetë =================
  const { p: be } = await faqe('u2', 'besa', false, ALBI);
  await mbyllDritaret(be);
  await hapCilesimet(be, '#tabMarketet');
  await be.fill('#mkEmriRi', 'Albi Mall'); await be.click('#mkShto');
  ok(await prit(async () => (await lsM(be)).some(m => m.emri === 'Albi Mall' && m.p)), '1. besa: "Albi Mall" u shtua me vendndodhjen dhe u bë pikë', await lsM(be));
  const pikaA = pikat().find(x => x.emri === 'Albi Mall');
  ok(!!pikaA && pikaA.krijuarNga === 'u2' && Math.abs(pikaA.lat - ALBI.latitude) < 1e-6, '1. pikat/…: krijuar nga besa, te Albi', pikaA);
  const { p: dr, ctx: cD } = await faqe('u1', 'drini', false, SHTEPIA, { marketet: MK_D, afatet: AF_D });
  ok(await prit(async () => (await lsM(dr)).some(m => m.id === 'k' + pikaA.id && m.emri === 'Albi Mall')), '1. drini e ka "Albi Mall" te lista pa e vizituar (id "k" + pika)', await lsM(dr));
  await mbyllDritaret(dr);

  // ================= 2. drini: e përafërt, afër Albit, emri i përsëritur =================
  await cD.setGeolocation(Object.assign({}, SHTEPIA, { accuracy: 800 }));
  await hapCilesimet(dr, '#tabMarketet');
  await dr.fill('#mkEmriRi', 'Viva Fresh'); await dr.click('#mkShto');
  ok(await prit(async () => /s'është e saktë \(rreth 800 m\)/.test(await dr.textContent('#mkGabim'))) && !(await lsM(dr)).some(m => m.emri === 'Viva Fresh'), '2. vendndodhja e përafërt (800 m): s\'shtohet, me udhëzim', await dr.textContent('#mkGabim'));
  ok(/vendndodhjen e saktë/.test(await dr.textContent('#mkGabim')), '2. udhëzimi: "vendndodhjen e saktë", jo "të përafërt"');
  const n0 = pikat().length;
  await cD.setGeolocation(ALBI30);
  await dr.fill('#mkEmriRi', 'Albi 2'); await dr.click('#mkShto');
  ok(await prit(async () => /Këtu është tashmë marketi "Albi Mall"/.test(await toast(dr))), '2. 30 m nga Albi: s\'shtohet market tjetër, zgjidhet "Albi Mall"', await toast(dr));
  ok(pikat().length === n0 && !(await lsM(dr)).some(m => m.emri === 'Albi 2') && /Je te: Albi Mall/.test(await dr.textContent('#mkAktivTitull')), '2. asnjë pikë e re; "Je te: Albi Mall"', await dr.textContent('#mkAktivTitull'));
  await dr.fill('#mkEmriRi', 'albi  MALL'); await dr.click('#mkShto');
  ok(await prit(async () => /me këtë emër/.test(await dr.textContent('#mkGabim'))), '2. emri i një marketi të Stoku-t (pa dallim shkronjash): refuzohet');
  ok(await dr.evaluate(() => !document.querySelector('#mkLista input, #mkLista .ops-furn-edit') && !document.querySelector('#mkLista button')), '2. Cilësimet → Marketet: vetëm për t\'u parë (pa riemërtim, pa fshirje)');

  // ================= 3. Pikat e fshira: marketi pa afate hiqet, ai me afate mbetet =================
  const ls3 = await lsM(dr);
  ok(!ls3.some(m => m.id === 'kpOld') && ls3.some(m => m.id === 'kpOld2'), '3. "Market i mbyllur" (pika u fshi, pa afate) u hoq; "Market me afate" mbetet', ls3.map(m => m.id));
  ok(await dr.evaluate(() => !!(JSON.parse(localStorage.getItem('stoku:fshira:v1') || '{}').marketet || {}).kpOld), '3. shënimi i fshirjes (që të mos kthehet nga cloud-i)');
  ok(await prit(async () => { const d = F.S.docs.get('dyqane/u1'); return !!d && (d.marketet || []).some(m => m.id === 'k' + pikaA.id) && !(d.marketet || []).some(m => m.id === 'kpOld'); }), '3. dyqani i drinit: me Albi, pa marketin e hequr');

  // ================= 4. Administratori shton market me dorë në hartë (telefoni) =================
  const { p: ad } = await faqe('uA', 'mendurberisha', false, null);
  await hapCilesimet(ad, '#tabHarta');
  ok(await prit(async () => await duket(ad, '#htShto')), '4. admini: "+ Shto market në hartë"');
  ok(await prit(async () => await ad.evaluate(() => { const i = window.StokuHarta && window.StokuHarta.eFundit; return !!(i && i.map.loaded()); }), 30000), '4. harta u hap');
  await ad.click('#htShto'); await ad.waitForTimeout(300);
  ok(await duket(ad, '#htShtoForma') && await duket(ad, '#htHarta .ht-shenjestra') && !(await duket(ad, '#htShto')), '4. forma + shenja në mes të hartës');
  const qendra = (lng, lat, z) => ad.evaluate(a => window.StokuHarta.eFundit.map.jumpTo({ center: [a[0], a[1]], zoom: a[2] }), [lng, lat, z]);
  await qendra(21.1700, 42.6600, 12);
  await ad.fill('#htShtoEmri', 'Viva Fresh Dardani'); await ad.click('#htShtoRuaj'); await ad.waitForTimeout(200);
  ok(/Zmadho hartën/.test(await ad.textContent('#htShtoGabim')) && !pikat().some(x => x.emri === 'Viva Fresh Dardani'), '4. zmadhimi 12: "Zmadho hartën…"', await ad.textContent('#htShtoGabim'));
  await qendra(21.1492, 42.6477, 17);
  await ad.click('#htShtoRuaj'); await ad.waitForTimeout(200);
  ok(/Këtu është tashmë marketi "Albi Mall"/.test(await ad.textContent('#htShtoGabim')), '4. mbi Albi Mall: s\'shtohet', await ad.textContent('#htShtoGabim'));
  await qendra(21.1700, 42.6600, 17);
  await ad.fill('#htShtoEmri', 'ALBI mall'); await ad.click('#htShtoRuaj'); await ad.waitForTimeout(200);
  ok(/me këtë emër/.test(await ad.textContent('#htShtoGabim')), '4. emri i përsëritur: refuzohet');
  await ad.fill('#htShtoEmri', 'Viva Fresh Dardani'); await ad.press('#htShtoEmri', 'Enter');
  ok(await prit(async () => pikat().some(x => x.emri === 'Viva Fresh Dardani')), '4. "Viva Fresh Dardani" u ruajt (Enter)');
  const pV = pikat().find(x => x.emri === 'Viva Fresh Dardani');
  ok(pV && pV.krijuarNga === 'uA' && pV.krijuarNgaEmri === 'mendurberisha' && Math.abs(pV.lat - 42.66) < 1e-5 && Math.abs(pV.lng - 21.17) < 1e-5, '4. pika: te qendra e hartës, e shtoi administratori', pV);
  ok(await prit(async () => !(await duket(ad, '#htShtoForma')) && !(await duket(ad, '#htHarta .ht-shenjestra')) && /u shtua në hartë/.test(await toast(ad))), '4. forma mbyllet, shenja zhduket, njoftimi');
  ok(await prit(async () => (await ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-emri')].map(x => x.textContent))).includes('Viva Fresh Dardani')), '4. lista e hartës e ka');
  ok(await prit(async () => (await lsM(dr)).some(m => m.p === pV.id && m.emri === 'Viva Fresh Dardani') && (await lsM(be)).some(m => m.p === pV.id)), '4. drini dhe besa e marrin vetë');
  ok(!(await ad.evaluate(() => window.__csp)).length && !ad.__gab.length, '4. admini: pa shkelje të CSP-së, pa gabime JS', [await ad.evaluate(() => window.__csp), ad.__gab]);
  // Merchandiseri: harta pa "+ Shto market"
  await hapCilesimet(dr, '#tabHarta');
  ok(await prit(async () => (await dr.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-emri')].map(x => x.textContent))).includes('Viva Fresh Dardani')) && !(await duket(dr, '#htShto')), '4. drini: harta me marketin e ri, pa "+ Shto market"');

  // ================= 5. PC =================
  const { p: apc } = await faqe('uA', 'mendurberisha', true, null);
  await apc.click('#btnOpsione'); await apc.waitForTimeout(400);
  await apc.click('#opsSkedaHarta'); await apc.waitForTimeout(400);
  ok(await prit(async () => await duket(apc, '#htShto')) && await prit(async () => await apc.evaluate(() => { const i = window.StokuHarta && window.StokuHarta.eFundit; return !!(i && i.map.loaded()); }), 30000), '5. PC admini: harta + "+ Shto market në hartë"');
  await apc.click('#htShto'); await apc.waitForTimeout(300);
  ok(await duket(apc, '#htHarta .ht-shenjestra'), '5. PC: shenja në mes të hartës');
  await apc.evaluate(() => window.StokuHarta.eFundit.map.jumpTo({ center: [21.1800, 42.6500], zoom: 16 }));
  await apc.fill('#htShtoEmri', 'Meridian Kalabria'); await apc.click('#htShtoRuaj');
  ok(await prit(async () => pikat().some(x => x.emri === 'Meridian Kalabria' && x.krijuarNga === 'uA' && Math.abs(x.lat - 42.65) < 1e-5)), '5. PC: "Meridian Kalabria" u shtua në hartë');
  await apc.click('#htShto'); await apc.waitForTimeout(200);
  await apc.fill('#htShtoEmri', 'Tjetër'); await apc.click('#htShtoRuaj'); await apc.waitForTimeout(200);
  ok(/Këtu është tashmë marketi "Meridian Kalabria"/.test(await apc.textContent('#htShtoGabim')), '5. PC: në të njëjtin vend s\'shtohet', await apc.textContent('#htShtoGabim'));
  await apc.press('#htShtoEmri', 'Escape'); await apc.waitForTimeout(200);
  ok(!(await duket(apc, '#htShtoForma')) && !(await duket(apc, '#htHarta .ht-shenjestra')), '5. PC: Escape e mbyll formën');
  ok(!(await apc.evaluate(() => window.__csp)).length && !apc.__gab.length, '5. PC admini: pa CSP, pa gabime JS', apc.__gab);
  // drini në PC: marketet e Stoku-t te zgjedhja e Afateve; harta pa ndryshime
  const { p: dpc } = await faqe('u1', 'drini', true, null);
  await dpc.goto(BAZA + '/pc.html#/afatet'); await dpc.waitForTimeout(2500);
  ok(await prit(async () => { const o = await dpc.evaluate(() => [...document.getElementById('afMarketiPc').options].map(x => x.textContent)); return ['Albi Mall', 'Viva Fresh Dardani', 'Meridian Kalabria', 'Market me afate'].every(e => o.includes(e)) && !o.includes('Market i mbyllur'); }), '5. PC drini: marketet e Stoku-t te "Marketi"', await dpc.evaluate(() => [...document.getElementById('afMarketiPc').options].map(x => x.textContent)));
  await dpc.click('#btnOpsione'); await dpc.waitForTimeout(400);
  await dpc.click('#opsSkedaHarta'); await dpc.waitForTimeout(600);
  ok(await prit(async () => /Meridian Kalabria/.test(await dpc.textContent('#htLista'))) && await dpc.evaluate(() => !document.querySelector('#htLista button')) && !(await duket(dpc, '#htShto')), '5. PC drini: harta me krejt marketet, pa ndryshime, pa "+ Shto"');
  ok(/të njëjtat për krejt merchandiserët/.test(await dpc.textContent('#htIntro')), '5. PC drini: teksti "të njëjtat për krejt merchandiserët"');
  for (const [n, p] of [['besa', be], ['drini', dr], ['drini PC', dpc]]) ok(!p.__gab.length, '5. ' + n + ': pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

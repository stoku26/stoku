// v241: marketet (për merchandiserët): lista e marketeve, vendndodhja me GPS, afatet sipas marketit, zgjedhja me dorë,
// sinkronizimi (marketet + fusha `m` e afatit), emri i marketit te serveri, pamja e administratorit (tel + PC), PC.
// Vetëm për merchandiserët: "Punoj si merchandiser" kur hapet llogaria (porta), ose administratori e ndez/fik te lejet.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const RR = process.env.STOKU_DIR || require('path').resolve(__dirname, '..');
const MK = require(RR + '/marketet.js');
const B = require(RR + '/bashkimi.js');
const LJ = require(RR + '/lejet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
const ALBI = { latitude: 42.6476, longitude: 21.1491, accuracy: 20 };
const VIVA = { latitude: 42.6600, longitude: 21.1700, accuracy: 20 };
const SHTEPIA = { latitude: 42.6300, longitude: 21.1000, accuracy: 20 };
// Numëron kërkesat për vendndodhje (kush s'ka markete s'duhet pyetur kurrë)
const NUMERO_GPS = () => {
  window.__gpsThirrje = 0;
  const g0 = navigator.geolocation && navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  if (g0) navigator.geolocation.getCurrentPosition = function () { window.__gpsThirrje++; return g0.apply(null, arguments); };
};

(async () => {
  // ================= 0. Njësitë =================
  const d = MK.largesia({ lat: ALBI.latitude, lng: ALBI.longitude }, { lat: VIVA.latitude, lng: VIVA.longitude });
  ok(d > 2000 && d < 3000, '0. largësia Albi ↔ Viva ~2.6 km', Math.round(d));
  const L = [{ id: 'mA', emri: 'Albi Mall', lat: ALBI.latitude, lng: ALBI.longitude }, { id: 'mV', emri: 'Viva Fresh', lat: VIVA.latitude, lng: VIVA.longitude }, { id: 'mP', emri: 'Pa vend' }];
  const gA = MK.gjej(L, { lat: ALBI.latitude + 0.001, lng: ALBI.longitude, sakt: 30 }); // ~110 m larg
  ok(gA && gA.marketi.id === 'mA' && !MK.gjej(L, { lat: SHTEPIA.latitude, lng: SHTEPIA.longitude, sakt: 30 }), '0. gjej: brenda rrezes → Albi; larg → asnjë', gA && gA.largesia);
  ok(!MK.gjej(L, { lat: ALBI.latitude + 0.0045, lng: ALBI.longitude, sakt: 20 }) && !!MK.gjej(L, { lat: ALBI.latitude + 0.0030, lng: ALBI.longitude, sakt: 120 }), '0. rrezja 250 m + pasaktësia e GPS-it (deri 150 m)');
  const t = Date.now();
  const dore = { id: 'mV', menyra: 'dore', koha: t - 60e3, kontrolluarSe: 0 };
  ok(MK.pasGps(dore, gA, t).id === 'mV' && MK.pasGps(Object.assign({}, dore, { koha: t - MK.DORE_MS - 1 }), gA, t).id === 'mA', '0. zgjedhja me dorë fiton 3 orë, pastaj GPS-i');
  ok(MK.pasGps({ id: 'mA', menyra: 'gps', koha: t - 1, kontrolluarSe: 0 }, null, t).id === null, '0. jashtë marketeve (pas GPS-it) → Krejt marketet');
  ok(MK.duhetKontrolli(L, { kontrolluarSe: 0 }, t) && !MK.duhetKontrolli(L, { kontrolluarSe: t - 1000 }, t) && !MK.duhetKontrolli([{ id: 'x', emri: 'X' }], { kontrolluarSe: 0 }, t), '0. GPS-i: vetëm me markete me vendndodhje, jo më shpesh se 2 min');
  const af = [{ id: 'a1', m: 'mA' }, { id: 'a2', m: 'mV' }, { id: 'a3' }, { id: 'a4', m: 'mX' }];
  ok(MK.filtro(af, 'mA').length === 1 && MK.filtro(af, null).length === 4, '0. filtro sipas marketit / krejt');
  ok(MK.meEmra(af, L)[0].mk === 'Albi Mall' && !MK.meEmra(af, L)[2].mk && !('mk' in af[0]), '0. meEmra: kopje me emrin (pa e prekur origjinalin)');
  const vp = MK.vendosPaMarket(af, L, 'mA', t);
  ok(vp.n === 2 && vp.afatet[2].m === 'mA' && vp.afatet[3].m === 'mA' && vp.afatet[1].m === 'mV', '0. vendosPaMarket: pa market dhe market i fshirë → marketi i ri', vp.n);
  const gr = MK.grupo(af, L);
  ok(gr.map(x => x.emri + ':' + x.afatet.length).join('|') === 'Albi Mall:1|Viva Fresh:1|Pa market:2', '0. grupo: sipas emrit, "Pa market" në fund', gr.map(x => x.emri));
  ok(MK.pastro([{ id: 'a', emri: '  ' + 'x'.repeat(80) }, { id: 'a', emri: 'dyfish' }, null, { emri: 'pa id' }, { id: 'b', emri: 'B', lat: 999, lng: 1 }]).map(x => x.emri.length + ':' + ('lat' in x)).join(',') === '60:false,1:false', '0. pastro: emri ≤ 60, pa dyfishe, koordinata të gabuara hiqen');
  // Bashkimi
  const c = { foldera: [{ id: 'pije', emri: 'Pije' }], afatet: [{ id: 'a1', data: '2026-11-01', m: 'mA', ndryshuarSe: t }], marketet: [{ id: 'mA', emri: 'Albi', ndryshuarSe: t - 10 }], fshira: {} };
  const l = { foldera: [{ id: 'pije', emri: 'Pije' }], afatet: [], marketet: [{ id: 'mA', emri: 'Albi Mall', ndryshuarSe: t - 1 }, { id: 'mV', emri: 'Viva', ndryshuarSe: t - 2 }], fshira: {} };
  const b1 = B.bashko(c, l, t);
  ok(b1.marketet.map(x => x.emri).join('|') === 'Albi Mall|Viva' && b1.afatet[0].m === 'mA', '0. bashkimi: fiton më i riu, afati e mban marketin');
  const b2 = B.bashko(b1, { foldera: l.foldera, afatet: [], marketet: [], fshira: { marketet: { mV: t } } }, t);
  ok(b2.marketet.length === 1 && b2.fshira.marketet.mV === t && !B.eNjejte(b1, b2) && B.eNjejte(b1, b1), '0. bashkimi: marketi i fshirë hiqet; eNjejte i sheh marketet');
  ok(Array.isArray(B.bashko({ foldera: [{ id: 'x', emri: 'X' }] }, { foldera: [{ id: 'x', emri: 'X' }] }, t).marketet), '0. dyqan i vjetër pa marketet: listë bosh');
  // Leja "marketet" (merchandiser): me zgjedhje, e fikur kur mungon (llogaritë e vjetra s'e marrin)
  ok(LJ.ZGJEDHJE.marketet && LJ.PRINDI.marketet === 'afatet' && !LJ.lejohet(null, 'marketet') && !LJ.lejohet({}, 'marketet') && LJ.lejohet({ marketet: true }, 'marketet') && !LJ.lejohet({ marketet: true, afatet: false }, 'marketet'), '0. lejet: "marketet" e fikur kur mungon; e ndezur vetëm kur caktohet (dhe me Afatet)');
  ok(!('marketet' in LJ.pastro({ afatet: true })) && LJ.pastro({ marketet: false }).marketet === false && LJ.pastro(null).stoku === true, '0. pastro: "marketet" ruhet vetëm kur caktohet');
  ok(!('marketet' in LJ.krejt(true)) && !('marketet' in LJ.krejt(false)) && LJ.meZgjedhjet(LJ.krejt(true), { marketet: false }).marketet === false && LJ.meZgjedhjet(LJ.krejt(false), { marketet: true }).marketet === true, '0. "Lejo/Ndalo krejt" s\'e ndërrojnë "Merchandiser"');
  const TR = require(RR + '/teRejat.js');
  const tekstiTR = l => l.map(h => h.titulli + ' ' + h.pikat.join(' ')).join(' ');
  ok(!/market/i.test(tekstiTR(TR.teRejatPas(240, 'tel', false, k => k !== 'marketet'))) && /merchandiser/i.test(tekstiTR(TR.teRejatPas(240, 'tel', false, () => true))) &&
    /Merchandiser/.test(tekstiTR(TR.teRejatPas(240, 'pc', true, () => true))), '0. "Çka ka të re": marketet vetëm për merchandiserët (dhe administratorin)');
  ok(LJ.teNdaluara({ marketet: false }) === 0 && LJ.zgjedhja(null, 'marketet') === null && LJ.zgjedhja({ marketet: true }, 'marketet') === true, '0. "Merchandiser" i fikur s\'është leje e ndaluar');

  // ================= 1. Telefoni: merchandiseri =================
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, krijuarSe: t, merchandiser: true }); // u regjistrua si merchandiser
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  const sot = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const AF0 = [{ id: 'x1', barkodi: '1', emri: 'Kos Abi', data: sot(3), sasia: 4, furnizuesi: 'Abi', statusi: 'aktiv', ndryshuarSe: t - 5000 },
    { id: 'x2', barkodi: '2', emri: 'Bukë', data: sot(-1), sasia: 2, furnizuesi: 'Vipa', statusi: 'aktiv', ndryshuarSe: t - 5000 }];
  const b = await chromium.launch();
  const orari = [];
  async function faqe(uid, emri, pc, geo, lokale) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', geolocation: geo, permissions: ['geolocation'] }
      : { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, geolocation: geo, permissions: ['geolocation'] });
    await ctx.route(u => !u.href.startsWith(BAZA), r => {
      const u = r.request().url();
      if (u.startsWith(PUSH)) { if (/\/orari/.test(u) && r.request().postData()) orari.push(uid + ' ' + r.request().postData()); return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }); }
      return r.abort();
    });
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', lokale || { afatet: [] });
    await ctx.addInitScript(NUMERO_GPS);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);
  const lsAfatet = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]'));
  const lsMarketet = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  const kartat = p => p.evaluate(() => [...document.querySelectorAll('#afLista .af-karta')].map(k => k.querySelector('.af-emri').textContent + ' | ' + ((k.querySelector('.af-nen') || {}).textContent || '')));
  async function hapMarketetNeCilesime(p) {
    if (!(await p.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')))) { await p.click('#btnOpsione'); await p.waitForTimeout(300); }
    if (await p.evaluate(() => document.getElementById('kategoriMenu').style.display === 'none')) { await p.click('#opsPrapa'); await p.waitForTimeout(200); }
    await p.click('#tabMarketet'); await p.waitForTimeout(300);
  }
  async function editoMarketin(p, emri) {
    await p.evaluate(e => [...document.querySelectorAll('#mkLista .ops-furn-rresht')].find(x => x.querySelector('.ops-furn-emri').textContent.startsWith(e)).click(), emri);
    await p.waitForTimeout(200);
  }
  async function riktheGps(p) { // si hapja e aplikacionit pas 2 minutash
    await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('stoku:marketi:aktiv') || '{}'); a.kontrolluarSe = 0; localStorage.setItem('stoku:marketi:aktiv', JSON.stringify(a)); document.dispatchEvent(new Event('visibilitychange')); });
  }

  const { p: dr, ctx: ctxD } = await faqe('u1', 'drini', false, SHTEPIA, { afatet: AF0 });
  // pa markete: asgjë e re, s'pyetet për vendndodhjen
  await dr.waitForTimeout(800);
  // v242: merchandiseri pa markete sheh "Shto marketin ku punon" (jo "Je te"), pa pyetje për vendndodhjen
  ok(/Shto marketin/.test(await dr.textContent('#afMarketiEmri')) && /Shto marketin/.test(await dr.textContent('.sb-home-krye .mk-chip')) && await dr.evaluate(() => window.__gpsThirrje) === 0, '1. pa markete: "Shto marketin ku punon", pa pyetje për vendndodhjen');
  await hapMarketetNeCilesime(dr);
  ok(await dr.evaluate(() => document.getElementById('opsioneTitulli').textContent) === 'Marketet' && /S'ke ende asnjë market/.test(await dr.textContent('#mkLista')), '1. Cilësimet → Marketet: bosh');
  await dr.fill('#mkEmriRi', 'Albi Mall'); await dr.click('#mkShto'); await dr.waitForTimeout(400);
  const t1 = await toast(dr);
  const afA = await lsAfatet(dr), mk1 = await lsMarketet(dr);
  ok(mk1.length === 1 && mk1[0].emri === 'Albi Mall' && afA.every(a => a.m === mk1[0].id) && /2\)/.test(t1), '1. marketi i parë: afatet e deritashme (2) shkojnë te ai', t1);
  const mA = mk1[0].id;
  await dr.fill('#mkEmriRi', 'albi  mall'); await dr.click('#mkShto'); await dr.waitForTimeout(200);
  ok(/me këtë emër/.test(await dr.textContent('#mkGabim')) && (await lsMarketet(dr)).length === 1, '1. emri i përsëritur (pa dallim shkronjash) refuzohet');
  // vendndodhja e Albi (je brenda)
  await ctxD.setGeolocation(ALBI);
  await editoMarketin(dr, 'Albi Mall');
  await dr.evaluate(() => [...document.querySelectorAll('#mkLista .ops-furn-edit button')].find(x => /vendndodhjen/.test(x.textContent)).click());
  ok(await prit(async () => (await lsMarketet(dr))[0].lat), '1. "Ruaj vendndodhjen këtu" ruan pikën e marketit');
  const mkA = (await lsMarketet(dr))[0];
  ok(Math.abs(mkA.lat - ALBI.latitude) < 1e-6 && Math.abs(mkA.lng - ALBI.longitude) < 1e-6 && /U ruajt vendndodhja e Albi Mall/.test(await toast(dr)), '1. koordinatat e sakta', [mkA.lat, mkA.lng]);
  // marketi i dytë, me vendndodhje te Viva
  await dr.fill('#mkEmriRi', 'Viva Fresh'); await dr.click('#mkShto'); await dr.waitForTimeout(300);
  await ctxD.setGeolocation(VIVA);
  await editoMarketin(dr, 'Viva Fresh');
  await dr.evaluate(() => [...document.querySelectorAll('#mkLista .ops-furn-edit button')].find(x => /vendndodhjen/.test(x.textContent)).click());
  await prit(async () => (await lsMarketet(dr)).every(m => m.lat));
  const mV = (await lsMarketet(dr)).find(m => m.emri === 'Viva Fresh').id;
  ok((await lsAfatet(dr)).every(a => a.m === mA), '1. marketi i dytë s\'i merr afatet e të parit');
  ok(/Je te: Viva Fresh/.test(await dr.textContent('#mkAktivTitull')), '1. pas ruajtjes së vendit: je te Viva Fresh', await dr.textContent('#mkAktivTitull'));
  await dr.screenshot({ path: __dirname + '/v241-tel-marketet.png' });
  // Afatet te Viva: bosh; afati i ri ruhet te Viva
  await dr.click('#opsPrapa'); await dr.waitForTimeout(150); await dr.click('#opsPrapa').catch(() => {}); await dr.waitForTimeout(200);
  await dr.evaluate(() => { const o = document.getElementById('dlgOpsione'); if (o.classList.contains('hapur')) document.getElementById('opsMbyll') && document.getElementById('opsMbyll').click(); });
  await dr.evaluate(() => document.getElementById('btnAfatet').click()); await dr.waitForTimeout(500);
  ok(await duket(dr, '#afMarketi') && (await dr.textContent('#afMarketiEmri')) === 'Viva Fresh', '1. Afatet: "Je te Viva Fresh"');
  ok((await kartat(dr)).length === 0 && /S'ka ende afate te ky market/.test(await dr.textContent('#afLista')), '1. Viva: pa afate (ato të Albi s\'shihen)');
  await dr.click('#afShto'); await dr.waitForTimeout(300);
  ok(!(await dr.evaluate(() => document.getElementById('afatMarketiRresht').hidden)) && await dr.inputValue('#afatMarketi') === mV, '1. "Afat i ri": marketi = Viva (ku je)');
  await dr.fill('#afatBarkodi', '3'); await dr.fill('#afatEmri', 'Jogurt'); await dr.fill('#afatData', '15-12-30');
  await dr.click('#afatRuaj'); await dr.waitForTimeout(400);
  const jg = (await lsAfatet(dr)).find(a => a.emri === 'Jogurt');
  ok(jg && jg.m === mV && (await kartat(dr)).length === 1, '1. afati i ri ruhet te Viva dhe shihet këtu', jg && jg.m);
  // GPS: hyn në Albi → ndërrohet vetë
  await ctxD.setGeolocation(ALBI);
  await riktheGps(dr);
  ok(await prit(async () => (await dr.textContent('#afMarketiEmri')) === 'Albi Mall'), '1. GPS: hyre në Albi → "Je te Albi Mall" vetë');
  ok(/Je te: Albi Mall/.test(await toast(dr)) && (await kartat(dr)).length === 2, '1. Albi: 2 afatet e veta', await kartat(dr));
  const shenja = await dr.evaluate(() => document.getElementById('afShenja').textContent);
  ok(shenja === '2', '1. shenja te tabi Afatet: vetëm e marketit (2)', shenja);
  // Zgjedhja me dorë: Krejt marketet
  await dr.click('#afMarketi'); await dr.waitForTimeout(300);
  const opsionet = await dr.evaluate(() => [...document.querySelectorAll('#mkdLista button')].map(x => x.textContent));
  ok(opsionet.join('|') === 'Albi Mall2 afate|Viva Fresh1 afat|Krejt marketet3 afate' && await duket(dr, '#mkdGps'), '1. "Ku je?": marketet me numrat + Krejt + GPS', opsionet);
  await dr.evaluate(() => [...document.querySelectorAll('#mkdLista button')].find(x => /Krejt/.test(x.textContent)).click()); await dr.waitForTimeout(300);
  const kk = await kartat(dr);
  ok(kk.length === 3 && kk.some(x => /Jogurt \| Viva Fresh/.test(x)) && kk.some(x => /Kos Abi \| Albi Mall/.test(x)), '1. Krejt marketet: 3 afate, me emrin e marketit', kk);
  await dr.screenshot({ path: __dirname + '/v241-tel-krejt.png' });
  await dr.click('#afShto'); await dr.waitForTimeout(300);
  ok(await dr.inputValue('#afatMarketi') === '', '1. Krejt marketet: afati i ri s\'ka market të zgjedhur');
  await dr.fill('#afatEmri', 'Qumësht'); await dr.fill('#afatData', '15-12-30'); await dr.click('#afatRuaj'); await dr.waitForTimeout(300);
  ok(/Zgjidh marketin/.test(await toast(dr)) && await dr.evaluate(() => document.getElementById('dlgAfat').classList.contains('hapur')), '1. pa market: s\'ruhet, kërkon marketin');
  await dr.selectOption('#afatMarketi', mA); await dr.click('#afatRuaj'); await dr.waitForTimeout(300);
  ok((await lsAfatet(dr)).find(a => a.emri === 'Qumësht').m === mA, '1. pas zgjedhjes: ruhet te Albi');
  // Zgjedhja me dorë fiton ndaj GPS-it; "Gjej me GPS" e anashkalon
  await dr.click('#afMarketi'); await dr.waitForTimeout(200);
  await dr.evaluate(() => [...document.querySelectorAll('#mkdLista button')].find(x => /Viva/.test(x.textContent)).click()); await dr.waitForTimeout(200);
  await riktheGps(dr); await dr.waitForTimeout(1200);
  ok((await dr.textContent('#afMarketiEmri')) === 'Viva Fresh', '1. zgjedhja me dorë (Viva) s\'ndërrohet nga GPS-i (je në Albi)');
  await dr.click('#afMarketi'); await dr.waitForTimeout(200); await dr.click('#mkdGps');
  ok(await prit(async () => (await dr.textContent('#afMarketiEmri')) === 'Albi Mall'), '1. "Gjej me GPS" → Albi Mall');
  // Jashtë marketeve
  await ctxD.setGeolocation(SHTEPIA); await riktheGps(dr);
  ok(await prit(async () => (await dr.textContent('#afMarketiEmri')) === 'Krejt marketet'), '1. jashtë marketeve → Krejt marketet');
  // Kryefaqja: çipi + të skaduarat
  await dr.evaluate(() => document.getElementById('afPrapa').click()); await dr.waitForTimeout(400);
  ok(await prit(async () => duket(dr, '.sb-home-krye .mk-chip')), '1. kryefaqja: çipi "Je te"');
  // Sinkronizimi + serveri
  ok(await prit(async () => { const d0 = F.S.docs.get('dyqane/u1'); return d0 && Array.isArray(d0.marketet) && d0.marketet.length === 2; }, 10000), '1. cloud: marketet ruhen te dyqani', F.S.docs.get('dyqane/u1') && F.S.docs.get('dyqane/u1').marketet);
  const pjeset = [...F.S.docs.keys()].filter(k => k.startsWith('dyqane/u1/pjeset/')).map(k => F.S.docs.get(k));
  const afCloud = [].concat(...pjeset.map(x => x.afatet || []), (F.S.docs.get('dyqane/u1') || {}).afatet || []);
  ok(afCloud.find(a => a.emri === 'Jogurt' && a.m === mV), '1. cloud: afati e mban marketin (m)');
  ok(await prit(async () => orari.some(x => /^u1 /.test(x) && /"mk":"Viva Fresh"/.test(x) && /"mk":"Albi Mall"/.test(x)), 9000), '1. serveri (/orari) e merr emrin e marketit për njoftimin', orari.map(x => x.slice(0, 300)));
  // Fshirja e marketit: afatet mbeten pa market
  await hapMarketetNeCilesime(dr);
  await editoMarketin(dr, 'Viva Fresh');
  await dr.evaluate(() => [...document.querySelectorAll('#mkLista .ops-furn-edit button')].find(x => x.textContent === 'Fshije').click()); await dr.waitForTimeout(300);
  ok(/Afatet e tij \(1\)/.test(await dr.textContent('#konfTekst')), '1. fshirja: paralajmëron për afatet');
  await dr.click('#konfPo'); await dr.waitForTimeout(300);
  ok((await lsMarketet(dr)).length === 1 && (await lsAfatet(dr)).find(a => a.emri === 'Jogurt') && await dr.evaluate(() => !!JSON.parse(localStorage.getItem('stoku:fshira:v1')).marketet), '1. Viva u fshi, afati mbetet; shënimi i fshirjes ruhet');
  ok(!dr.__gab.length, '1. drini: pa gabime JS', dr.__gab);

  // ================= 2. Llogari e vjetër (pa "Punoj si merchandiser"): asgjë s'ndryshon, edhe me markete =================
  const { p: ag } = await faqe('u2', 'agim', false, ALBI, { afatet: AF0.map(a => Object.assign({}, a, { m: 'mZ' })) });
  await ag.evaluate(() => { localStorage.setItem('stoku:marketet:v1', JSON.stringify([{ id: 'mZ', emri: 'Zeta', lat: 42.6476, lng: 21.1491 }])); });
  await ag.reload(); await ag.waitForTimeout(2500);
  ok(await ag.evaluate(() => { const x = JSON.parse(localStorage.getItem('stoku:merchandiser') || 'null'); return !!x && x.uid === 'u2' && x.v === false; }), '2. agim: s\'është merchandiser (perdoruesit/u2 pa "merchandiser")');
  ok(await ag.evaluate(() => document.getElementById('tabMarketet').classList.contains('leja-ndaluar')), '2. agim: s\'ka "Marketet" te Cilësimet');
  await ag.evaluate(() => document.getElementById('btnAfatet').click()); await ag.waitForTimeout(500);
  ok(!(await duket(ag, '#afMarketi')) && (await kartat(ag)).length === 2 && await ag.evaluate(() => window.__gpsThirrje) === 0, '2. agim: krejt afatet, pa "Je te", pa GPS (edhe pse dyqani ka një market)');
  await ag.click('#afShto'); await ag.waitForTimeout(200);
  ok(await ag.evaluate(() => document.getElementById('afatMarketiRresht').hidden), '2. "Afat i ri" pa fushën e marketit');
  await ag.click('#afatAnulo').catch(() => {}); await ag.evaluate(() => { const d = document.getElementById('dlgAfat'); if (d.classList.contains('hapur')) d.classList.remove('hapur'); }); await ag.waitForTimeout(200);
  ok(!ag.__gab.length, '2. agim: pa gabime JS', ag.__gab);

  // ================= 3. Administratori: afatet e drinit sipas marketeve (tel) =================
  const { p: ad } = await faqe('uA', 'mendurberisha', false, SHTEPIA);
  await ad.click('#btnOpsione'); await ad.waitForTimeout(300);
  await ad.click('#tabPerdoruesit'); await ad.waitForTimeout(500);
  await ad.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => /drini/.test(x.textContent)).click()); await ad.waitForTimeout(400);
  await ad.evaluate(() => [...document.querySelectorAll('#pdDetaje button')].find(x => /Afatet e drini/.test(x.textContent)).click());
  ok(await prit(async () => /Albi Mall · 3/.test(await ad.textContent('#pdAfatet'))), '3. admini: "Albi Mall · 3"', (await ad.textContent('#pdAfatet')).slice(0, 200));
  const tx = await ad.textContent('#pdAfatet');
  ok(/Pa market · 1/.test(tx) && /Jogurt/.test(tx) && (await ad.textContent('#opsioneTitulli')) === 'Afatet e drini', '3. admini: "Pa market · 1" (Viva u fshi), titulli');
  await ad.screenshot({ path: __dirname + '/v241-tel-admin.png' });
  // "Merchandiser" te lejet: drini (nga regjistrimi) i ndezur, agim i fikur; admini e ndez/fik në kohë reale
  await ad.click('#opsPrapa'); await ad.waitForTimeout(300);
  ok(await ad.evaluate(() => document.getElementById('pdLeja_marketet').checked), '3. drini: "Merchandiser" i ndezur (e zgjodhi kur hapi llogarinë)');
  ok(/Merchandiser/.test(await ad.textContent('#pdDetaje')), '3. drini: "Merchandiser" te të dhënat e llogarisë');
  await ad.click('#opsPrapa'); await ad.waitForTimeout(300);
  const rrDrini = await ad.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].map(x => x.textContent).find(x => /drini/.test(x)));
  ok(/merchandiser/.test(rrDrini) && !/merchandiser/.test(await ad.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].map(x => x.textContent).find(x => /agim/.test(x)))), '3. lista: "merchandiser" vetëm te drini', rrDrini);
  await ad.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => /agim/.test(x.textContent)).click()); await ad.waitForTimeout(400);
  ok(await ad.evaluate(() => !document.getElementById('pdLeja_marketet').checked), '3. agim: "Merchandiser" i fikur (llogari e vjetër)');
  await ad.click('label[for=pdLeja_marketet]'); await ad.waitForTimeout(500);
  ok(F.S.docs.get('lejet/u2') && F.S.docs.get('lejet/u2').lejet.marketet === true, '3. lejet/u2.marketet = true');
  ok(await prit(async () => await duket(ag, '#afMarketi') && !(await ag.evaluate(() => document.getElementById('tabMarketet').classList.contains('leja-ndaluar')))), '3. agim: marketet dalin në kohë reale (çipi + Cilësimet → Marketet)');
  await ad.evaluate(() => [...document.querySelectorAll('#pdDetaje .pd-veprime button')].find(x => /Lejo krejt/.test(x.textContent)).click()); await ad.waitForTimeout(400);
  ok(F.S.docs.get('lejet/u2').lejet.marketet === true, '3. "Lejo krejt" s\'e ndërron "Merchandiser"');
  await ad.click('label[for=pdLeja_marketet]'); await ad.waitForTimeout(500);
  ok(F.S.docs.get('lejet/u2').lejet.marketet === false, '3. lejet/u2.marketet = false');
  ok(await prit(async () => !(await duket(ag, '#afMarketi')) && (await kartat(ag)).length === 2), '3. agim: marketet zhduken në kohë reale, krejt afatet');
  // drini: admini ia fik (p.sh. e zgjodhi gabim) → zhduket; ia ndez sërish
  await ad.click('#opsPrapa'); await ad.waitForTimeout(300);
  await ad.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => /drini/.test(x.textContent)).click()); await ad.waitForTimeout(400);
  await ad.click('label[for=pdLeja_marketet]'); await ad.waitForTimeout(500);
  ok(F.S.docs.get('lejet/u1').lejet.marketet === false, '3. lejet/u1.marketet = false (fiton mbi regjistrimin)');
  ok(await prit(async () => await dr.evaluate(() => document.getElementById('tabMarketet').classList.contains('leja-ndaluar')) && !(await duket(dr, '.sb-home-krye .mk-chip'))), '3. drini: marketet zhduken në kohë reale');
  await ad.click('label[for=pdLeja_marketet]'); await ad.waitForTimeout(500);
  ok(F.S.docs.get('lejet/u1').lejet.marketet === true && await prit(async () => !(await dr.evaluate(() => document.getElementById('tabMarketet').classList.contains('leja-ndaluar')))), '3. drini: ia ndez sërish → rikthehen');
  ok(!ad.__gab.length && !ag.__gab.length && !dr.__gab.length, '3. admini, agim, drini: pa gabime JS', [ad.__gab, ag.__gab, dr.__gab]);

  // ================= 4. PC: drini dhe administratori =================
  const { p: pc } = await faqe('u1', 'drini', true, ALBI);
  await pc.goto(BAZA + '/pc.html#/afatet'); await pc.waitForTimeout(2500);
  ok(await prit(async () => duket(pc, '#afMarketiPcKuti')), '4. PC: "Marketi" te Afatet');
  const opsPc = await pc.evaluate(() => [...document.getElementById('afMarketiPc').options].map(o => o.textContent));
  ok(opsPc.join('|') === 'Krejt marketet|Albi Mall', '4. PC: opsionet', opsPc);
  const rr = () => pc.evaluate(() => [...document.querySelectorAll('#afTrup tr')].filter(x => !x.classList.contains('af-grup')).map(x => x.querySelector('.af-prod').textContent));
  const krejtPc = await rr();
  ok(krejtPc.length === 4 && krejtPc.some(x => /Kos Abi.*Albi Mall/.test(x)), '4. PC Krejt: 4 afate, me emrin e marketit', krejtPc);
  await pc.selectOption('#afMarketiPc', mA); await pc.waitForTimeout(300);
  ok((await rr()).length === 3, '4. PC Albi: 3 afate', await rr());
  await pc.click('#afBtnShto'); await pc.waitForTimeout(300);
  ok(await duket(pc, '#afdMarketiKuti') && await pc.inputValue('#afdMarketi') === mA, '4. PC "Afat i ri": marketi = Albi');
  await pc.fill('#afdEmri', 'Djathë'); await pc.fill('#afdData', '20-12-30'); await pc.click('#afdRuaj'); await pc.waitForTimeout(300);
  ok((await lsAfatet(pc)).find(a => a.emri === 'Djathë').m === mA, '4. PC: afati i ri te Albi');
  await pc.screenshot({ path: __dirname + '/v241-pc-afatet.png' });
  ok(!pc.__gab.length, '4. PC drini: pa gabime JS', pc.__gab);
  const { p: apc } = await faqe('uA', 'mendurberisha', true, SHTEPIA);
  await apc.goto(BAZA + '/pc.html#/permbledhja'); await apc.waitForTimeout(2000);
  await apc.click('#btnOpsione'); await apc.waitForTimeout(300);
  await apc.click('#opsSkedaPerdoruesit'); await apc.waitForTimeout(500);
  await apc.evaluate(() => [...document.querySelectorAll('#pdPamja .pd-rresht')].find(x => /drini/.test(x.textContent)).click()); await apc.waitForTimeout(400);
  const hapPd = true, kl = true;
  const kaBtn = await apc.$('#pdAfatetBtn');
  ok(hapPd && kl && !!kaBtn, '4. PC admini: Përdoruesit → drini → "Afatet e drini"');
  if (kaBtn) {
    await apc.click('#pdAfatetBtn');
    ok(await prit(async () => /Albi Mall · 4/.test(await apc.textContent('#pdafLista')) && /Pa market · 1/.test(await apc.textContent('#pdafLista'))), '4. PC admini: afatet sipas marketeve (Albi 4 me Djathin e shtuar në PC, Pa market 1)', (await apc.textContent('#pdafLista')).slice(0, 160));
    await apc.screenshot({ path: __dirname + '/v241-pc-admin.png' });
  }
  ok(!apc.__gab.length, '4. PC admini: pa gabime JS', apc.__gab);

  // ================= 5. Porta: "Punoj si merchandiser" kur hapet llogaria =================
  const MOCK = () => {
    function u() { const x = sessionStorage.getItem('mockUser'); return x ? { uid: x, email: x + '@stoku-app.local' } : null; }
    window.__stokuCloud = { authGati: true, perdoruesiAktual: u, token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {},
      hyr: async () => ({ ok: false, kodi: 'auth/invalid-credential' }),
      // si firebase-tel.js: opsionet.merchandiser → perdoruesit/{uid}.merchandiser + 'stoku:merchandiser'
      regjistrohu: async (emri, fj, opsionet) => {
        sessionStorage.setItem('argsRegjistrimit', JSON.stringify(opsionet === undefined ? 'mungon' : opsionet));
        sessionStorage.setItem('mockUser', 'u_' + emri);
        localStorage.setItem('stoku:merchandiser', JSON.stringify({ uid: 'u_' + emri, v: !!(opsionet && opsionet.merchandiser) }));
        setTimeout(() => window.dispatchEvent(new Event('stoku-auth-ndryshoi')), 30);
        return { ok: true };
      } };
  };
  async function porta(merch) {
    const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await ctx.addInitScript(MOCK);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/index.html'); await p.waitForTimeout(1500);
    ok(!(await duket(p, '#pkMerchLbl')) && await duket(p, '#pkMbajLbl'), '5. "Hyr": pa "Punoj si merchandiser", me "Më mbaj mend emrin"');
    await p.click('#pkTabKrijo'); await p.waitForTimeout(150);
    ok(await duket(p, '#pkMerchLbl') && /Punoj si merchandiser/.test(await p.textContent('#pkMerchLbl')) && !(await p.isChecked('#pkMerch')), '5. "Krijo llogari": "Punoj si merchandiser", e pazgjedhur');
    ok(!(await duket(p, '#pkMbajLbl')), '5. "Krijo llogari": pa "Më mbaj mend emrin e përdoruesit"');
    if (merch) {
      await p.click('#pkMerchLbl'); await p.click('#pkTabHyr'); await p.click('#pkTabKrijo');
      ok(!(await p.isChecked('#pkMerch')), '5. kalimi te "Hyr" e heq zgjedhjen');
      await p.click('#pkTabHyr'); await p.waitForTimeout(100);
      ok(await duket(p, '#pkMbajLbl') && !(await duket(p, '#pkMerchLbl')), '5. kthimi te "Hyr": "Më mbaj mend emrin" rikthehet');
      await p.click('#pkTabKrijo');
      await p.click('#pkMerchLbl');
    }
    const emri = merch ? 'meri' : 'besnik';
    await p.fill('#pkEmri', emri); await p.fill('#pkFjalekalimi', 'sakte123'); await p.fill('#pkPerserit', 'sakte123');
    await p.click('#pkDergo');
    await prit(async () => !!(await p.evaluate(() => sessionStorage.getItem('argsRegjistrimit'))));
    const args = JSON.parse(await p.evaluate(() => sessionStorage.getItem('argsRegjistrimit')));
    ok(args && args.merchandiser === merch, '5. regjistrohu(…, { merchandiser: ' + merch + ' })', args);
    await p.waitForTimeout(2500);
    ok(await prit(async () => !(await duket(p, '#porta'))), '5. ' + emri + ': hyri');
    const ndaluar = await p.evaluate(() => document.getElementById('tabMarketet').classList.contains('leja-ndaluar'));
    ok(ndaluar === !merch, '5. ' + emri + ': "Marketet" te Cilësimet ' + (merch ? 'po' : 'jo'));
    ok(!p.__gab.length, '5. porta: pa gabime JS', p.__gab);
    await ctx.close();
  }
  await porta(true);
  await porta(false);

  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

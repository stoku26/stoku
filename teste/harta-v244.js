// v244: Cilësimet → Harta (harta.js). MapLibre vjen nga teste/npm (si jsDelivr, me SRI), pllakat e rreme të Prishtinës nga
// harta-pllakat.js (skema OpenMapTiles si OpenFreeMap: vendbanime, por edhe shtet, rajon, dyqane, emra rrugësh e uji, që S'DUHET
// të dalin), faqet nga serveri si Cloudflare (CSP e plotë si header). Kontrollon:
// 0. njësitë: stili (vetëm vendbanimet si emra), pikat, mblidhPikat, riemerto, SRI, CSP
// 1. telefoni, administratori: pikat e krejt merchandiserëve; në hartë vetëm vendbanimet + pikat; ndryshimi i emrit shkon te
//    dyqani i merchandiserit dhe te pajisja e tij; emri që e ka tashmë s'pranohet; pa shkelje të CSP-së
// 2. telefoni, merchandiseri: vetëm pikat e veta, riemërtimi i vet; kush s'është merchandiser s'e sheh "Harta"
// 3. PC, administratori: harta, lista, "Ndrysho emrin"; merchandiseri në PC: vetëm të vetat, pa ndryshim
// 4. pllakat s'merren (pa internet, ose Cloudflare ende pa tiles.openfreemap.org): mesazh, lista dhe pikat mbeten
const { chromium } = require('./pw.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { krijoFirestore } = require('./fs-server.js');
const SH = require('../harta.js');
const P = require('./harta-pllakat.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.BAZA || 'http://127.0.0.1:8765';
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const NM = path.join(__dirname, 'npm', 'node_modules');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 200)); } z(false); });
const MAPLIBRE = fs.readFileSync(NM + '/maplibre-gl/dist/maplibre-gl.js');

(async () => {
  // ================= 0. Njësitë =================
  const st = SH.stili({ tema: 'light', pikat: [] });
  const omt = st.layers.filter(l => l.source === 'omt');
  ok(omt.every(l => ['water', 'waterway', 'transportation', 'boundary', 'place'].includes(l['source-layer'])), '0. nga pllakat: vetëm ujë, lumë, rrugë, kufi, vendbanime', omt.map(l => l['source-layer']));
  ok(st.layers.filter(l => l.type === 'symbol').map(l => l.id).join() === 'vendbanimet,pikat-emri', '0. emra vetëm për vendbanimet dhe pikat');
  ok(JSON.stringify(st.layers.find(l => l.id === 'vendbanimet').filter) === JSON.stringify(['in', ['get', 'class'], ['literal', ['city', 'town', 'village', 'hamlet', 'borough', 'suburb', 'quarter', 'neighbourhood']]]), '0. vendbanimet: qytet, qytezë, fshat, lagje (pa shtet, rajon)');
  ok(JSON.stringify(st.layers.find(l => l.id === 'vendbanimet').layout['text-transform']) === JSON.stringify(['match', ['get', 'class'], ['borough', 'suburb', 'quarter', 'neighbourhood'], 'uppercase', 'none']) && SH.ZOOM_LAGJET === 14, '0. v245: lagjet me shkronja të mëdha; zmadhimi i lagjeve 14');
  ok(st.sources.omt.url === 'https://tiles.openfreemap.org/planet' && st.glyphs.startsWith('https://tiles.openfreemap.org/fonts/'), '0. OpenFreeMap (pllakat dhe shkronjat)');
  ok(SH.stili({ tema: 'dark' }).layers[0].paint['background-color'] !== st.layers[0].paint['background-color'], '0. tema e errët ka ngjyrat e veta');
  const gj = SH.pikatGeoJson([{ id: 'a', uid: 'u1', emri: 'A', lat: 42.66, lng: 21.16 }, { id: 'b', uid: 'u1', emri: 'B' }]);
  ok(gj.features.length === 1 && gj.features[0].properties.k === 'u1|a' && gj.features[0].geometry.coordinates[0] === 21.16, '0. pikat pa vendndodhje s\'dalin në hartë', gj);
  const mb = await SH.mblidhPikat([{ uid: 'u1', emri: 'drini' }, { uid: 'u2', emri: 'besa' }, { uid: 'u9', emri: 'gabim' }],
    async u => u === 'u9' ? { ok: false } : { ok: true, gjendja: { marketet: u === 'u1' ? [{ id: 'm1', emri: ' Albi ', lat: 1, lng: 2 }, { id: 'm2', emri: 'Viva' }, null] : [] } }, [{ id: 'x', uid: 'uA', emri: 'Imi', imi: true }]);
  ok(mb.gabime === 1 && mb.pikat.map(p => p.uid + ':' + p.emri + (SH.kaVend(p) ? '@' : '')).join() === 'uA:Imi,u1:Albi@,u1:Viva', '0. mblidhPikat: të miat + të merchandiserëve, gabimet numërohen', mb);
  let dyqani = { marketet: [{ id: 'm1', emri: 'Albi', lat: 1, lng: 2, ndryshuarSe: 1 }, { id: 'm2', emri: 'Viva' }], afatet: [{ id: 'a1' }] };
  const ndrysho = async (u, fn) => { dyqani = fn(dyqani); return { ok: true, gjendja: dyqani }; };
  let r = await SH.riemerto(ndrysho, { id: 'm1', uid: 'u1' }, '  Albi   Mall ');
  ok(r.ok && dyqani.marketet[0].emri === 'Albi Mall' && dyqani.marketet[0].ndryshuarSe > 1 && dyqani.marketet[0].lat === 1 && dyqani.afatet.length === 1, '0. riemerto: emri i ri + ndryshuarSe, pjesa tjetër e dyqanit e paprekur', dyqani);
  r = await SH.riemerto(ndrysho, { id: 'm1', uid: 'u1' }, 'viva');
  ok(!r.ok && r.arsye === 'ekziston' && dyqani.marketet[0].emri === 'Albi Mall', '0. riemerto: emri që e ka një market tjetër i tij s\'pranohet', r);
  r = await SH.riemerto(ndrysho, { id: 'mX', uid: 'u1' }, 'X');
  ok(!r.ok && r.arsye === 'nuk-u-gjet', '0. riemerto: pika e fshirë', r);
  ok((await SH.riemerto(ndrysho, { id: 'm1', uid: 'u1' }, '   ')).arsye === 'emri' && (await SH.riemerto(async () => ({ ok: false }), { id: 'm1', uid: 'u1' }, 'Y')).arsye === 'rrjeti', '0. riemerto: emri bosh, pa internet');
  const sri = 'sha384-' + crypto.createHash('sha384').update(MAPLIBRE).digest('base64');
  const ver = JSON.parse(fs.readFileSync(NM + '/maplibre-gl/package.json', 'utf8')).version;
  ok(sri === SH.MAPLIBRE_SRI && SH.MAPLIBRE_JS === 'https://cdn.jsdelivr.net/npm/maplibre-gl@' + ver + '/dist/maplibre-gl.js', '0. MapLibre ' + ver + ': SRI e skedarit të paketës', sri);
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'maplibre-gl.css'), 'utf8');
  ok(css.endsWith(fs.readFileSync(NM + '/maplibre-gl/dist/maplibre-gl.css', 'utf8')) && SH.MAPLIBRE_CSS.endsWith('?v=' + ver), '0. css/maplibre-gl.css = e paketës ' + ver);
  const shenime = fs.readFileSync(path.join(__dirname, '..', 'SHENIME.md'), 'utf8');
  ok(/CSP_CLOUDFLARE: `[^`]*connect-src [^;`]*https:\/\/tiles\.openfreemap\.org/.test(shenime), '0. CSP_CLOUDFLARE lejon tiles.openfreemap.org');

  // ================= Faqet =================
  const t = Date.now();
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'agim', kycurSe: t });
  const MK1 = [{ id: 'm1', emri: 'Albi 34', lat: 42.6610, lng: 21.1600, ndryshuarSe: t - 9000 }, { id: 'm2', emri: 'Viva', ndryshuarSe: t - 9000 }];
  const MK2 = [{ id: 'm9', emri: 'Meridian', lat: 42.6400, lng: 21.1000, ndryshuarSe: t - 9000 }];
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  async function faqe(uid, emri, pc, marketet, paPllaka) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true });
    await ctx.route(u => !u.href.startsWith(BAZA), r => {
      const u = r.request().url();
      if (u === SH.MAPLIBRE_JS) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: MAPLIBRE });
      if (/^https:\/\/tiles\.openfreemap\.org\//.test(u)) return paPllaka ? r.abort() : P.rrugaEPllakave(r);
      if (u.startsWith(PUSH)) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
      return r.abort();
    });
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] });
    if (marketet) await ctx.addInitScript(m => { if (!localStorage.getItem('stoku:marketet:v1')) localStorage.setItem('stoku:marketet:v1', JSON.stringify(m)); }, marketet);
    await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);
  const rreshtat = p => p.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-rresht:not(.ops-furn-edit)')].map(x => x.querySelector('.ops-furn-emri').textContent + ' | ' + ((x.querySelector('.hint, .ops-furn-nen') || {}).textContent || '')));
  // Harta e vizatuar: emrat që dalin (shtresa:emri(klasa)) dhe a është gati
  const hartaGati = p => p.evaluate(() => { const i = window.StokuHarta && window.StokuHarta.eFundit; return !!(i && i.map.loaded() && i.map.areTilesLoaded()); });
  const emratNeHarte = p => p.evaluate(() => {
    const m = window.StokuHarta.eFundit.map;
    return m.queryRenderedFeatures().filter(f => f.layer.type === 'symbol').map(f => f.layer.id + ':' + (f.properties.emri || f.properties.name) + (f.properties.class ? '(' + f.properties.class + ')' : ''));
  });
  async function hapHarten(p) {
    if (!(await p.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')))) { await p.click('#btnOpsione'); await p.waitForTimeout(300); }
    if (await p.evaluate(() => document.getElementById('kategoriMenu').style.display === 'none')) { await p.click('#opsPrapa'); await p.waitForTimeout(200); }
    await p.click('#tabHarta'); await p.waitForTimeout(400);
  }

  // Merchandiserët i ruajnë marketet (pajisja e tyre i çon te dyqani)
  const { p: dr } = await faqe('u1', 'drini', false, MK1);
  const { p: be } = await faqe('u2', 'besa', false, MK2);
  ok(await prit(async () => ((F.S.docs.get('dyqane/u1') || {}).marketet || []).length === 2 && ((F.S.docs.get('dyqane/u2') || {}).marketet || []).length === 1), 'marketet e drinit dhe besës janë te dyqani i tyre');

  // ================= 1. Telefoni: administratori =================
  const { p: ad } = await faqe('uA', 'mendurberisha', false);
  await ad.click('#btnOpsione'); await ad.waitForTimeout(500);
  ok(await prit(async () => await duket(ad, '#tabHarta')), '1. admini: "Harta" te Cilësimet', await ad.textContent('#tabHartaStatus'));
  await hapHarten(ad);
  ok(await prit(async () => (await rreshtat(ad)).length === 3), '1. lista: 3 pika (2 në hartë, 1 pa vendndodhje)', await rreshtat(ad));
  const rr1 = await rreshtat(ad);
  ok(/^Albi 34 \| Nga drini/.test(rr1[0]) && /^Meridian \| Nga besa/.test(rr1[1]) && /^Viva \| Nga drini/.test(rr1[2]) && /Pa vendndodhje/.test(await ad.textContent('#htLista')), '1. renditja dhe kush e ruajti', rr1);
  ok(/2 pika në hartë · 1 pa vendndodhje/.test(await ad.textContent('#htInfo')) && (await ad.textContent('#opsioneTitulli')) === 'Harta', '1. "2 pika në hartë · 1 pa vendndodhje", titulli "Harta"', await ad.textContent('#htInfo'));
  ok(await prit(async () => await hartaGati(ad), 30000), '1. harta u hap (MapLibre + pllakat)');
  await ad.waitForTimeout(1500);
  let emrat = await emratNeHarte(ad);
  ok(emrat.some(x => x === 'pikat-emri:Albi 34') && emrat.some(x => x === 'pikat-emri:Meridian'), '1. pikat me emra në hartë', emrat);
  ok(emrat.some(x => /^vendbanimet:Prishtinë\(city\)$/.test(x)), '1. emrat e vendbanimeve (Prishtinë)', emrat);
  const teNdaluara = emrat.filter(x => !/^(vendbanimet:.*\((city|town|village|hamlet|suburb|quarter|neighbourhood)\)|pikat-emri:.*)$/.test(x));
  ok(!teNdaluara.length && !emrat.some(x => /POI|EMËR RRUGE|EMËR UJI|Kosova|Rajoni/.test(x)), '1. asgjë tjetër: pa dyqane, emra rrugësh/uji, shtet, rajon', teNdaluara);
  ok(P.kerkuar.some(x => /^\/planet\/.+\.pbf$/.test(x)) && P.kerkuar.some(x => /^\/fonts\//.test(x)), '1. pllakat dhe shkronjat nga OpenFreeMap');
  // v245: nën zmadhimin 14 (pllakat s'i kanë lagjet) del "Zmadho për emrat e lagjeve"; prekja të çon te 14
  const zoomi = () => ad.evaluate(() => window.StokuHarta.eFundit.map.getZoom());
  ok(await zoomi() < 14 && await duket(ad, '#htHarta .ht-udhezim') && /Zmadho për emrat e lagjeve/.test(await ad.textContent('#htHarta .ht-udhezim')), '1. v245: butoni "Zmadho për emrat e lagjeve" (zmadhimi ' + (await zoomi()).toFixed(1) + ')');
  await ad.click('#htHarta .ht-udhezim');
  ok(await prit(async () => await zoomi() >= 13.95 && !(await duket(ad, '#htHarta .ht-udhezim'))), '1. v245: pas prekjes zmadhimi 14, butoni fshihet', await zoomi());
  await ad.evaluate(() => window.StokuHarta.eFundit.map.jumpTo({ center: [21.155, 42.658] }));
  ok(await prit(async () => (await emratNeHarte(ad)).some(x => /^vendbanimet:.*\((neighbourhood|borough)\)$/.test(x))), '1. v245: emrat e lagjeve në hartë', await emratNeHarte(ad));
  await ad.screenshot({ path: __dirname + '/v245-tel-lagjet.png' });
  await ad.evaluate(() => { const i = window.StokuHarta.eFundit; i.pershtat(); });
  await ad.waitForTimeout(800);
  ok(await ad.evaluate(() => /Burimet e hartës|OpenStreetMap/.test(document.getElementById('htHarta').textContent)), '1. atribuimi (OpenStreetMap) në hartë');
  await ad.screenshot({ path: __dirname + '/v244-tel-admin.png' });
  // Prek pikën në hartë → hapet ndryshimi i emrit
  const pik = await ad.evaluate(() => { const m = window.StokuHarta.eFundit.map; const q = m.project([21.1600, 42.6610]); const r = m.getCanvas().getBoundingClientRect(); return { x: r.left + q.x, y: r.top + q.y }; });
  await ad.mouse.click(pik.x, pik.y); await ad.waitForTimeout(500);
  ok(await prit(async () => await ad.evaluate(() => { const i = document.querySelector('#htLista .ops-furn-edit input'); return i && i.value === 'Albi 34'; })), '1. prekja e pikës hap ndryshimin e emrit të saj');
  // Emri që drini e ka tashmë
  await ad.fill('#htLista .ops-furn-edit input', 'viva');
  await ad.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-edit button')].find(x => x.textContent === 'Ruaj').click());
  ok(await prit(async () => /drini e ka edhe një market me këtë emër/.test(await ad.textContent('#htLista .ops-furn-edit'))), '1. "drini e ka edhe një market me këtë emër"');
  await ad.fill('#htLista .ops-furn-edit input', 'Albi Mall Prishtinë');
  await ad.press('#htLista .ops-furn-edit input', 'Enter');
  ok(await prit(async () => ((F.S.docs.get('dyqane/u1') || {}).marketet || []).some(m => m.id === 'm1' && m.emri === 'Albi Mall Prishtinë' && m.ndryshuarSe > t && m.lat === 42.661)), '1. emri i ri te dyqani i drinit (vendndodhja mbetet)', (F.S.docs.get('dyqane/u1') || {}).marketet);
  ok(await prit(async () => (await rreshtat(ad))[0].startsWith('Albi Mall Prishtinë') && /drini e sheh emrin e ri/.test(await ad.textContent('#toast'))), '1. lista dhe njoftimi', await rreshtat(ad));
  ok(await prit(async () => (await emratNeHarte(ad)).includes('pikat-emri:Albi Mall Prishtinë')), '1. emri i ri në hartë');
  ok(await prit(async () => (await dr.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'))).some(m => m.id === 'm1' && m.emri === 'Albi Mall Prishtinë'), 20000), '1. drini e merr emrin e ri në telefonin e tij (sinkronizimi)');
  ok(!(await ad.evaluate(() => window.__csp)).length && !ad.__gab.length, '1. pa shkelje të CSP-së, pa gabime JS', [await ad.evaluate(() => window.__csp), ad.__gab]);

  // ================= 2. Telefoni: merchandiseri dhe kush s'është =================
  await hapHarten(dr);
  ok(await prit(async () => (await rreshtat(dr)).length === 2), '2. drini: vetëm marketet e veta', await rreshtat(dr));
  ok(/Në hartë/.test((await rreshtat(dr))[0]) && /Pa vendndodhje/.test((await rreshtat(dr))[1]), '2. drini: "Në hartë" / "Pa vendndodhje"', await rreshtat(dr));
  ok(await prit(async () => await hartaGati(dr), 30000) && (await emratNeHarte(dr)).includes('pikat-emri:Albi Mall Prishtinë') && !(await emratNeHarte(dr)).some(x => /Meridian/.test(x)), '2. drini: harta vetëm me pikën e vet', await emratNeHarte(dr));
  await dr.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-rresht')].find(x => /Viva/.test(x.textContent)).click()); await dr.waitForTimeout(300);
  await dr.fill('#htLista .ops-furn-edit input', 'Viva Fresh Ulpiana');
  await dr.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-edit button')].find(x => x.textContent === 'Ruaj').click());
  ok(await prit(async () => (await dr.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'))).some(m => m.id === 'm2' && m.emri === 'Viva Fresh Ulpiana')), '2. drini e riemërton marketin e vet nga Harta');
  ok(await prit(async () => ((F.S.docs.get('dyqane/u1') || {}).marketet || []).some(m => m.id === 'm2' && m.emri === 'Viva Fresh Ulpiana')), '2. ... dhe shkon te dyqani');
  await dr.screenshot({ path: __dirname + '/v244-tel-merch.png' });
  ok(!(await dr.evaluate(() => window.__csp)).length && !dr.__gab.length, '2. drini: pa shkelje të CSP-së, pa gabime JS', [await dr.evaluate(() => window.__csp), dr.__gab]);
  const { p: ag } = await faqe('u3', 'agim', false);
  await ag.click('#btnOpsione'); await ag.waitForTimeout(800);
  ok(!(await duket(ag, '#tabHarta')) && !(await ag.evaluate(() => !!document.querySelector('link[data-maplibre]') || !!window.maplibregl)), '2. agim (s\'është merchandiser): pa "Harta", MapLibre s\'ngarkohet');
  await ag.evaluate(() => document.getElementById('tabHarta').click()); await ag.waitForTimeout(300);
  ok(await ag.evaluate(() => !document.querySelector('.opsione-faqe[data-faqe="harta"]').classList.contains('aktiv')), '2. agim: faqja e hartës s\'hapet as me klikim të fshehur');
  ok(!ag.__gab.length && !be.__gab.length, '2. pa gabime JS (agim, besa)', [ag.__gab, be.__gab]);

  // ================= 3. PC =================
  const { p: pa } = await faqe('uA', 'mendurberisha', true);
  await pa.click('#btnOpsione'); await pa.waitForTimeout(500);
  ok(await prit(async () => await duket(pa, '#opsSkedaHarta')), '3. PC admini: "Harta" te Cilësimet');
  await pa.click('#opsSkedaHarta'); await pa.waitForTimeout(400);
  ok(await prit(async () => (await rreshtat(pa)).length === 3), '3. PC: 3 pika', await rreshtat(pa));
  ok(await prit(async () => await hartaGati(pa), 30000), '3. PC: harta u hap');
  await pa.waitForTimeout(1200);
  ok((await emratNeHarte(pa)).filter(x => /^pikat-emri:/.test(x)).length === 2, '3. PC: 2 pika në hartë', await emratNeHarte(pa));
  await pa.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-rresht')].find(x => /Meridian/.test(x.textContent)).querySelector('button').click()); await pa.waitForTimeout(300);
  await pa.fill('#htLista .ops-furn-edit input', 'Meridian Fushë Kosovë');
  await pa.evaluate(() => [...document.querySelectorAll('#htLista .ops-furn-edit button')].find(x => x.textContent === 'Ruaj').click());
  ok(await prit(async () => ((F.S.docs.get('dyqane/u2') || {}).marketet || []).some(m => m.id === 'm9' && m.emri === 'Meridian Fushë Kosovë')), '3. PC: emri i ri te dyqani i besës');
  ok(await prit(async () => (await emratNeHarte(pa)).includes('pikat-emri:Meridian Fushë Kosovë')), '3. PC: emri i ri në hartë');
  await pa.screenshot({ path: __dirname + '/v244-pc-admin.png' });
  ok(!(await pa.evaluate(() => window.__csp)).length && !pa.__gab.length, '3. PC: pa shkelje të CSP-së, pa gabime JS', [await pa.evaluate(() => window.__csp), pa.__gab]);
  // Merchandiseri në PC: vetëm të vetat, pa "Ndrysho emrin"; tema e errët
  const { p: pb, ctx: cb } = await faqe('u2', 'besa', true);
  await pb.evaluate(() => { const o = JSON.parse(localStorage.getItem('stoku:pc:opsione:v1') || '{}'); o.tema = 'dark'; localStorage.setItem('stoku:pc:opsione:v1', JSON.stringify(o)); });
  await pb.reload(); await pb.waitForTimeout(2500);
  await pb.click('#btnOpsione'); await pb.waitForTimeout(400);
  ok(await prit(async () => await duket(pb, '#opsSkedaHarta')), '3. PC besa: "Harta"');
  await pb.click('#opsSkedaHarta'); await pb.waitForTimeout(400);
  ok(await prit(async () => (await rreshtat(pb)).length === 1 && /Meridian Fushë Kosovë/.test((await rreshtat(pb))[0])), '3. PC besa: vetëm marketi i saj, me emrin nga administratori', await rreshtat(pb));
  ok(await pb.evaluate(() => !document.querySelector('#htLista button')), '3. PC besa: pa "Ndrysho emrin" (emrat i ndryshon te telefoni)');
  ok(await prit(async () => await hartaGati(pb), 30000) && await pb.evaluate(() => window.StokuHarta.eFundit.map.getPaintProperty('sfondi', 'background-color') === '#1b1e22'), '3. PC besa: harta me temën e errët');
  await pb.screenshot({ path: __dirname + '/v244-pc-merch-dark.png' });
  ok(!pb.__gab.length && !(await pb.evaluate(() => window.__csp)).length, '3. PC besa: pa gabime, pa CSP', pb.__gab);
  await cb.close();

  // ================= 4. Pllakat s'merren (pa internet, ose Cloudflare pa tiles.openfreemap.org te CSP) =================
  const { p: pp } = await faqe('uA', 'mendurberisha', false, null, true);
  await hapHarten(pp);
  ok(await prit(async () => await duket(pp, '#htGabim') && /Pjesët e hartës s'u morën/.test(await pp.textContent('#htGabim'))), '4. mesazhi "Pjesët e hartës s\'u morën…"', await pp.textContent('#htGabim'));
  ok(await prit(async () => (await rreshtat(pp)).length === 3) && await duket(pp, '#htHarta'), '4. lista dhe pikat mbeten', await rreshtat(pp));
  ok(!pp.__gab.length, '4. pa gabime JS', pp.__gab);

  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

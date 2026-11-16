// v309 (pronari): (1) çdo emër përdoruesi që e ka pasur një llogari mbetet i saj (edhe pasi e ndryshon), askush tjetër s'e merr;
// lirohet vetëm kur administratori e fshin llogarinë (emrat/{emri} → uid). (2) Adresa e Grupit te kompjuteri "#/grupi/…"
// (Kolegët "#/grupi/koleget"); lidhjet e vjetra "#/ekipa/…" punojnë. (3) Skedarët nga telefoni: afatet te faqja Afatet, stoku te
// Stoku → Përmbledhja. (4) Tekstet "anëtar" → "kolegët" / "në grup".
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const ADMIN = 'USfaW6Lbm3dbxEF95aKMKadIaok1';
(async () => {
  const R = __dirname + '/../', lx = f => fsN.readFileSync(R + f, 'utf8');
  const tel = lx('app-tel.js'), pc = lx('app-pc.js'), ft = lx('firebase-tel.js'), fp = lx('firebase-pc.js'), ek = lx('ekipa.js');
  const ll = lx('vendas/app/src/main/java/site/stoku/vendas/Llogaria.kt'), ad = lx('vendas/app/src/main/java/site/stoku/vendas/Admini.kt');
  const sh = lx('SHENIME.md');
  // 0) statike
  ok(/if \(await pronariIEmrit\(emriPerdoruesit\)\) return \{ ok: false, kodi: 'auth\/email-already-in-use'/.test(ft) && /if \(await pronariIEmrit\(u\)\) return \{ ok: false, kodi: 'auth\/email-already-in-use'/.test(fp),
    '0. web: regjistrimi s\'e merr emrin e zënë (telefon + PC)');
  ok(/prE && prE !== auth\.currentUser\.uid\) return \{ ok: false, kodi: 'auth\/email-already-in-use'/.test(ft) && /prE && prE !== auth\.currentUser\.uid\) return \{ ok: false, kodi: 'auth\/email-already-in-use'/.test(fp),
    '0. web: ndryshimi i emrit lejohet vetëm te emri i lirë ose i vetes');
  ok(!/iMeparshmi && iMeparshmi !== em/.test(ek) && /if \(!s\.exists\(\)\) await fs\.setDoc\(fs\.doc\(db, 'emrat', em\)/.test(ek), '0. ekipa.js: emri i vjetër s\'fshihet, i zëni s\'mbishkruhet');
  ok(/if \(!pronariIEmrit\(emri\)\.isNullOrEmpty\(\)\) return EMRI_I_ZENE/.test(ll) && /if \(!pr\.isNullOrEmpty\(\) && pr != u\.uid\) return "zene"/.test(ll) && !/iMeparshmi/.test(ll),
    '0. Android: regjistrimi, ndryshimi i emrit dhe emri i vjetër');
  ok(/fshijTeGjitha\(db\.collection\("emrat"\)\.whereEqualTo\("uid", u\), numero = false\)/.test(ad) && /private fun zeEmratEVjeter\(l: List<Llogaria>\)/.test(ad), '0. Android: fshirja i liron emrat, administratori i zë emrat e vjetër');
  ok(/allow get: if true;\n      allow list: if request\.auth != null && eshteAdmin\(\);/.test(sh) && /allow delete: if request\.auth != null && eshteAdmin\(\);\n    \}/.test(sh), '0. rregullat e reja te SHENIME (emrat)');
  ok(/Kolegët e grupit tënd/.test(lx('privatesia.html')) && !/Anëtarët e grupit tënd/.test(lx('privatesia.html')) && /\(ishe ende në grup\)/.test(tel) && /\(ishe ende në grup\)/.test(pc) &&
    /\(ishe ende në grup\)/.test(lx('vendas/app/src/main/java/site/stoku/vendas/ui/GrupiEkrani.kt')), '0. tekstet "anëtar" u ndërruan');
  ok(/function kuNePc\(titulli\) \{ return titulli === 'Afatet' \? 'te Afatet'/.test(tel) && /val kuNePc = if \(sk\.titulli == "Afatet"\) "te Afatet"/.test(lx('vendas/app/src/main/java/site/stoku/vendas/ui/EksportetUI.kt')),
    '0. telefoni dhe Android thonë ku del skedari në PC');
  const ep = lx('eksportet.js'), ekt = lx('vendas/app/src/main/java/site/stoku/vendas/EksportiPdf.kt');
  // v313: gjerësia e logos sipas raportit të logos 60 (apRaporti), jo 15.35 mm e logos së vjetër
  ok(/MESI: 18\.5 \}/.test(ep) && /'PNG', X, AP\.MESI - 2\.1, 4\.2 \* apRaporti\(\), 4\.2\)/.test(ep) && /d\.text\(o\.data, X \+ WI, AP\.MESI \+ 1\.09/.test(ep) &&
    /'Lista e afateve', AP\.W \/ 2, AP\.MESI - 1\.56, \{ align: 'center' \}/.test(ep) && /xi, AP\.MESI \+ 5\.72\)/.test(ep) &&
    /private const val MESI = 18\.5f/.test(ekt) && /cv\.logo\(v\.p, X, MESI - 2\.1f/.test(ekt) && /W \/ 2, MESI - 1\.56f, INK, qendra = true/.test(ekt) && /xi, MESI \+ 5\.72f/.test(ekt),
    '0. PDF e afateve: titulli në mes, logoja dhe data në të njëjtën vijë (web + Android)');
  ok(lx('sw.js').includes('#\\/?(ekipa|grupi)') && /anetaret\|koleget/.test(lx('sw.js')) && /'\.\/index\.html#grupi-'/.test(tel), '0. njoftimet: lidhjet e reja dhe të vjetrat');

  // 1) emrat: rregullat (Firebase i rremë me rregullat e reja)
  const tani = Date.now();
  const F = krijoFirestore({ rregullat: 'reja', adminVetemUid: true });
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: ADMIN, pronarEmri: 'duli96', krijuarSe: tani });
  [[ADMIN, 'duli96', 'pronar'], ['u2', 'blerta', 'anetar'], ['u3', 'agim', 'anetar']].forEach(([id, e, r]) => {
    F.S.docs.set('grupet/ekipa/anetaret/' + id, { emri: e, roli: r, hyriSe: tani, aktivSe: tani });
    F.S.docs.set('perdoruesit/' + id, { perdoruesi: e, kycurSe: tani, grupi: 'ekipa', ekipaMigruarSe: tani });
    F.S.docs.set('dyqane/' + id, { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [], afatet: [], fshira: {} });
  });
  // emri i vjetër i blertës (pa u zënë ende), i njohur nga Aktiviteti; "agim_vjeter" i zënë tashmë nga agimi
  F.S.docs.set('grupet/ekipa/feed/n1', { lloji: 'lajmerim', uid: 'u2', emri: 'blerta_vjeter', koha: tani - 9e5, tekst: 'Përshëndetje' });
  F.S.docs.set('emrat/agim_vjeter', { uid: 'u3', ndryshuarSe: tani - 9e5 });
  F.S.docs.set('dyqane/' + ADMIN + '/skedaret/s1', { emri: 'afatet_2026-11-15.pdf', lloji: 'pdf', titulli: 'Afatet', pajisja: 'Telefoni', madhesia: 90000, pjeset: 1, krijuarSe: tani - 6e4, skadon: tani + 6 * 864e5 });
  F.S.docs.set('dyqane/' + ADMIN + '/skedaret/s2', { emri: 'malli_pije_2026-11-15.xlsx', lloji: 'xlsx', titulli: 'Malli', pajisja: 'Telefoni', madhesia: 12000, pjeset: 1, krijuarSe: tani - 5e4, skadon: tani + 6 * 864e5 });
  const b = await chromium.launch();
  async function faqe(uid, email, pc, hash) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, email, pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' + (hash || '') : 'index.html'));
    await p.waitForTimeout(3500);
    return p;
  }
  // agimi (u3) hyn: emri i tij i tanishëm zihet, i vjetri mbetet i tij
  const agim = await faqe('u3', 'agim@stoku-app.local', false);
  await agim.waitForTimeout(2500);
  ok((F.S.docs.get('emrat/agim') || {}).uid === 'u3' && (F.S.docs.get('emrat/agim_vjeter') || {}).uid === 'u3', '1. emri i tanishëm zihet; emri i vjetër mbetet i llogarisë', [F.S.docs.get('emrat/agim'), F.S.docs.get('emrat/agim_vjeter')]);
  // blerta (u2) s'mund ta marrë emrin e agimit (as me shkrim direkt)
  const blerta = await faqe('u2', 'blerta@stoku-app.local', false);
  const r1 = await blerta.evaluate(async () => {
    const fs = window.__fsTest;
    try { await fs.setDoc(fs.doc({}, 'emrat', 'agim_vjeter'), { uid: 'u2', ndryshuarSe: Date.now() }); return 'u-shkrua'; } catch (x) { return 'u-refuzua'; }
  }).catch(() => 'pa-qasje');
  const rr = F.S.docs.get('emrat/agim_vjeter') || {};
  ok(rr.uid === 'u3', '1. llogaria tjetër s\'e mbishkruan emrin e zënë', { r1, rr });

  // 2) PC i administratorit: adresa "#/grupi/…", skedarët sipas llojit, emrat e vjetër zihen
  const adm = await faqe(ADMIN, 'duli96@stoku-app.local', true, '#/ekipa/anetaret');
  const h1 = await adm.evaluate(() => location.hash);
  ok(h1 === '#/grupi/koleget', '2. "#/ekipa/anetaret" (lidhje e vjetër) → "#/grupi/koleget"', h1);
  const kol = await adm.evaluate(() => !document.getElementById('ekVAnetaret').classList.contains('fsheh'));
  ok(kol, '2. hapet faqja Kolegët');
  await adm.click('#ekMenu button[data-n="aktiviteti"]'); await adm.waitForTimeout(500);
  ok(await adm.evaluate(() => location.hash) === '#/grupi/aktiviteti', '2. Aktiviteti → "#/grupi/aktiviteti"', await adm.evaluate(() => location.hash));
  await adm.evaluate(() => { location.hash = '#/grupi/kalendari'; }); await adm.waitForTimeout(500);
  ok(await adm.evaluate(() => !document.getElementById('ekVKalendari').classList.contains('fsheh')), '2. "#/grupi/kalendari" hapet direkt');
  await adm.evaluate(() => { location.hash = '#/permbledhja'; }); await adm.waitForTimeout(600);
  const sk = await adm.evaluate(() => ({ stok: document.getElementById('skedaretTel').innerText, af: document.getElementById('afSkedaretTel').innerText,
    nrStok: document.getElementById('stokTabSkedaret').innerText.trim(), nrAf: document.getElementById('afPllSkedaret').innerText.trim() }));
  ok(/malli_pije/.test(sk.stok) && !/afatet_/.test(sk.stok) && /afatet_2026/.test(sk.af) && !/malli/.test(sk.af) && sk.nrStok === '1' && sk.nrAf === '1',
    '3. skedari i afateve te Afatet (numri te pllaka Afatet), i stokut te Përmbledhja', sk);
  await adm.waitForTimeout(7000); // zënia e emrave të vjetër (pas 5 s)
  ok((F.S.docs.get('emrat/mendurberisha') || {}).uid === ADMIN, '4. "mendurberisha" zihet për administratorin', F.S.docs.get('emrat/mendurberisha'));
  ok((F.S.docs.get('emrat/blerta_vjeter') || {}).uid === 'u2', '4. emri i vjetër i blertës (nga Aktiviteti) zihet për të', F.S.docs.get('emrat/blerta_vjeter'));
  ok((F.S.docs.get('emrat/agim_vjeter') || {}).uid === 'u3', '4. emri i zënë tashmë s\'preket');
  // 5) administratori e fshin llogarinë e blertës: krejt emrat e saj lirohen
  const rf = await adm.evaluate(async () => window.__stokuCloud.ekipa.fshijLlogarine('u2', 'blerta'));
  const mbetenB = [...F.S.docs.entries()].filter(([k, v]) => k.startsWith('emrat/') && v && v.uid === 'u2').map(x => x[0]);
  ok(rf && rf.ok && !mbetenB.length, '5. fshirja nga administratori i liron krejt emrat e llogarisë', { rf, mbetenB });
  ok((F.S.docs.get('emrat/agim') || {}).uid === 'u3', '5. emrat e të tjerëve s\'preken');
  const gab = [agim, blerta, adm].flatMap(x => x.__gab);
  ok(!gab.length, '6. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

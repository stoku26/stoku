// v252: kopja e marketeve dhe e regjistrit në pajisje, merchandiseri pa furnizues, sugjerimet e furnizuesit, puna pa internet.
// 1. kopja: hapja e dytë lexon vetëm ndryshimet (pyetje me `ndryshuarSe >`); emri i ri dhe fshirja nga administratori
//    arrijnë edhe me kopjen; kopja më e vjetër se 24 orë → lexim i plotë
// 2. merchandiseri pa furnizues: forma e afatit, ruajtja e mban furnizuesin, kartat, Excel-i (telefoni) + PC
// 3. jo-merchandiseri: sugjerimet nën fushë (pa <datalist>), furnizuesi i ri me shkrim, "Mbyll"
// 4. pa internet: service worker-i e ruan Firebase-in; pa Firebase faqja rihapet vetë kur kthehet interneti
const { chromium } = require('./pw.js');
const fs = require('fs');
const path = require('path');
const { krijoFirestore } = require('./fs-server.js');
const RR = process.env.STOKU_DIR || path.resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
const SHTEPIA = { latitude: 42.6300, longitude: 21.1000, accuracy: 20 };
(async () => {
  const F = krijoFirestore();
  const t = Date.now(), DITE = 864e5;
  const sot = n => new Date(Date.now() + n * DITE).toISOString().slice(0, 10);
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'drini', kycurSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'agim', kycurSe: t });
  for (let j = 0; j < 6; j++) F.S.docs.set('pikat/p' + j, { emri: 'Market ' + j, lat: 42.5 + j * 0.02, lng: 21.0 + j * 0.02, krijuarNga: 'u9', krijuarNgaEmri: 'besa', krijuarSe: t - 3 * DITE, ndryshuarSe: t - 3 * DITE });
  F.S.docs.set('kujtesa/p1', { p: { '5551': { e: 'Kos Abi', f: 'Abi', k: t - 3 * DITE, s: 1 } }, ndryshuarSe: t - 3 * DITE });
  const AF_D = [{ id: 'a1', barkodi: '5551', emri: 'Kos Abi', data: sot(5), sasia: 3, furnizuesi: 'Abi', statusi: 'aktiv', m: 'kp0', ndryshuarSe: t - 5000 }];
  const AF_A = [{ id: 'b1', barkodi: '777', emri: 'Bukë', data: sot(4), sasia: 2, furnizuesi: 'Vipa', statusi: 'aktiv', ndryshuarSe: t - 5000 },
    { id: 'b2', barkodi: '778', emri: 'Ujë', data: sot(40), sasia: 2, furnizuesi: 'Abi', statusi: 'aktiv', ndryshuarSe: t - 5000 }];
  const b = await chromium.launch();
  async function faqe(uid, emri, pc, lokale, opt) {
    opt = opt || {};
    const ctx = await b.newContext(Object.assign(pc ? { viewport: { width: 1440, height: 900 } } : { userAgent: UA, viewport: { width: 390, height: 844 }, hasTouch: true },
      { serviceWorkers: 'block', geolocation: SHTEPIA, permissions: ['geolocation'] }));
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel', lokale || { afatet: [] });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(3000);
    return { p, ctx };
  }
  const lsM = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  const kopja = (p, k) => p.evaluate(x => JSON.parse(localStorage.getItem(x) || 'null'), k);
  const subPikat = p => F.subs.filter(s => s.page === p && s.path === 'pikat');
  const mbyll = p => p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);

  // ================= 1. Kopja e marketeve dhe e regjistrit =================
  const { p: d } = await faqe('u1', 'drini', false, { afatet: AF_D });
  ok(await prit(async () => (await lsM(d)).length === 6), '1. drini: 6 marketet e Stoku-t', (await lsM(d)).map(m => m.id));
  const k1 = await kopja(d, 'stoku:kopja:pikat');
  ok(!!k1 && Object.keys(k1.docs).length === 6 && k1.plotaSe > 0, '1. kopja e pikave në pajisje (6, me kohën e leximit të plotë)');
  ok(subPikat(d).some(s => !(s.c || []).some(x => x.lloji === 'where')), '1. hapja e parë: lexim i plotë (pa kopje)');
  ok(!!(await kopja(d, 'stoku:kopja:regjistri')), '1. kopja e regjistrit në pajisje');
  // ndërkohë (Stoku i mbyllur): administratori ndërron një emër
  F.S.docs.set('pikat/p1', Object.assign({}, F.S.docs.get('pikat/p1'), { emri: 'Market Një', emriNgaAdmini: true, ndryshuarSe: Date.now() }));
  let para = new Set(F.subs.map(s => s.id));
  await d.reload(); await d.waitForTimeout(2500);
  const teRe = () => subPikat(d).filter(s => !para.has(s.id));
  ok(teRe().length > 0 && teRe().every(s => (s.c || []).some(x => x.lloji === 'where' && x.f === 'ndryshuarSe' && x.op === '>')), '1. hapja e dytë: pyetje vetëm për ndryshimet', teRe().map(s => s.c));
  ok(await prit(async () => (await lsM(d)).some(m => m.id === 'kp1' && m.emri === 'Market Një')), '1. emri i ri arrin me kopjen (vetëm pika e ndryshuar lexohet)', (await lsM(d)).map(m => m.emri));
  // administratori fshin një pikë (pa afate; marketi i saj në pajisje është i vjetër)
  F.S.docs.delete('pikat/p5');
  await d.evaluate(() => { const l = JSON.parse(localStorage.getItem('stoku:marketet:v1')); l.forEach(m => { m.ndryshuarSe = Date.now() - 20 * 60000; }); localStorage.setItem('stoku:marketet:v1', JSON.stringify(l)); });
  const dq = F.S.docs.get('dyqane/u1'); if (dq && Array.isArray(dq.marketet)) dq.marketet.forEach(m => { m.ndryshuarSe = Date.now() - 20 * 60000; }); // edhe kopja te cloud-i
  para = new Set(F.subs.map(s => s.id));
  await d.reload(); await d.waitForTimeout(2500);
  ok(teRe().some(s => !(s.c || []).some(x => x.lloji === 'where')), '1. numri i pikave ndryshoi (fshirje): lexim i plotë', teRe().map(s => s.c));
  ok(await prit(async () => !(await lsM(d)).some(m => m.id === 'kp5') && !Object.keys((await kopja(d, 'stoku:kopja:pikat')).docs).includes('p5')), '1. pika e fshirë: marketi hiqet edhe me kopjen', (await lsM(d)).map(m => m.id));
  ok((await lsM(d)).some(m => m.id === 'kp0'), '1. marketi me afat mbetet');
  // gjatë punës: administratori ndërron emrin → vjen menjëherë (pyetja e ndryshimeve dëgjon)
  await d.waitForTimeout(500);
  F.S.docs.set('pikat/p2', Object.assign({}, F.S.docs.get('pikat/p2'), { emri: 'Market Dy', ndryshuarSe: Date.now() }));
  await d.evaluate(() => window.__fs && window.__fs('resync'));
  ok(await prit(async () => (await lsM(d)).some(m => m.id === 'kp2' && m.emri === 'Market Dy')), '1. ndryshimi gjatë punës vjen vetë', (await lsM(d)).map(m => m.emri));
  // kopja më e vjetër se 24 orë → lexim i plotë
  await d.evaluate(() => { const k = JSON.parse(localStorage.getItem('stoku:kopja:pikat')); k.plotaSe = Date.now() - 25 * 3600e3; localStorage.setItem('stoku:kopja:pikat', JSON.stringify(k)); });
  para = new Set(F.subs.map(s => s.id));
  await d.reload(); await d.waitForTimeout(2500);
  ok(teRe().length > 0 && teRe().some(s => !(s.c || []).some(x => x.lloji === 'where')), '1. kopja mbi 24 orë: lexim i plotë', teRe().map(s => s.c));
  ok(await prit(async () => (await kopja(d, 'stoku:kopja:pikat')).plotaSe > Date.now() - 60000), '1. koha e leximit të plotë u rinovua');

  // ================= 2. Merchandiseri pa furnizues =================
  await mbyll(d);
  ok(await d.evaluate(() => document.body.classList.contains('pa-furnizues')), '2. drini (merchandiser): body.pa-furnizues');
  await d.evaluate(() => document.getElementById('btnAfatet').click()); await d.waitForTimeout(600);
  await mbyll(d);
  const nen = await d.evaluate(() => [...document.querySelectorAll('#afLista .af-karta')].map(k => (k.querySelector('.af-nen') || {}).textContent || ''));
  ok(nen.length >= 1 && !nen.some(x => /Abi/.test(x)), '2. kartat pa furnizuesin', nen);
  await d.evaluate(() => [...document.querySelectorAll('#afLista .af-karta')].find(k => /Kos Abi/.test(k.textContent)).click()); await d.waitForTimeout(400);
  ok(await d.evaluate(() => document.getElementById('dlgAfat').classList.contains('hapur')) && !(await duket(d, '#afatFurnizuesi')) && !(await duket(d, '#afatFurnKuti')), '2. forma e afatit pa fushën e furnizuesit');
  await d.fill('#afatSasia', '7'); await d.click('#afatRuaj'); await d.waitForTimeout(400);
  const a1 = (await d.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]'))).find(a => a.id === 'a1');
  ok(a1 && a1.sasia === 7 && a1.furnizuesi === 'Abi', '2. ruajtja e mban furnizuesin që kishte afati', a1);
  // afat i ri me barkod që kujtesa e njeh me furnizues: pa furnizues
  await d.click('#afShto'); await d.waitForTimeout(300);
  await d.fill('#afatBarkodi', '5551'); await d.press('#afatBarkodi', 'Enter'); await d.waitForTimeout(200);
  await d.fill('#afatData', '15-12-30');
  if (await d.evaluate(() => !document.getElementById('afatMarketiRresht').hidden)) await d.selectOption('#afatMarketi', 'kp0');
  await d.click('#afatRuaj'); await d.waitForTimeout(400);
  const iRi = (await d.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]'))).find(a => a.id !== 'a1' && a.barkodi === '5551');
  ok(iRi && !iRi.furnizuesi, '2. afati i ri pa furnizues (edhe kur barkodi njihet)', iRi);
  // Excel: pa kolonën e furnizuesit
  ok(await d.evaluate(() => { const l = [...document.querySelectorAll('#axLista label')].find(x => x.querySelector('input').value === 'furnizuesi'); return !!l && getComputedStyle(l).display === 'none'; }), '2. Excel: kolona "Furnizuesi" e fshehur');
  ok(!d.__gab.length, '2. drini: pa gabime JS', d.__gab);
  // PC
  const { p: dpc } = await faqe('u1', 'drini', true, { afatet: AF_D });
  await dpc.goto(BAZA + '/pc.html#/afatet'); await dpc.waitForTimeout(3000);
  ok(await dpc.evaluate(() => document.body.classList.contains('pa-furnizues')) && (await dpc.textContent('#afKolProdukti')) === 'Produkti', '2. PC drini: pa furnizues, kolona "Produkti"');
  ok(!(await duket(dpc, '#afGrupo')), '2. PC: pa "Grupo sipas furnizuesit"');
  await dpc.click('#afBtnShto'); await dpc.waitForTimeout(300);
  ok(!(await duket(dpc, '#afdFurnizuesi')), '2. PC: "Afat i ri" pa furnizues');
  ok(!dpc.__gab.length, '2. PC drini: pa gabime JS', dpc.__gab);

  // ================= 3. Jo-merchandiseri: sugjerimet e furnizuesit =================
  const { p: a } = await faqe('u2', 'agim', false, { afatet: AF_A });
  await mbyll(a);
  ok(!(await a.evaluate(() => document.body.classList.contains('pa-furnizues'))), '3. agim: me furnizues');
  ok(await a.evaluate(() => !document.getElementById('afatFurnizuesi').hasAttribute('list') && !document.getElementById('dlgFurnizuesi').hasAttribute('list')), '3. fushat pa <datalist> (Android-i s\'hap më listën pa shkrim)');
  await a.evaluate(() => document.getElementById('btnAfatet').click()); await a.waitForTimeout(500);
  await mbyll(a);
  await a.click('#afShto'); await a.waitForTimeout(300);
  ok(await duket(a, '#afatFurnizuesi') && (await a.evaluate(() => document.getElementById('afatFurnizuesi').getBoundingClientRect().height)) >= 44, '3. fusha e furnizuesit (lartësia e plotë)', await a.evaluate(() => document.getElementById('afatFurnizuesi').getBoundingClientRect().height));
  await a.click('#afatFurnizuesi'); await a.waitForTimeout(200);
  const sugj = () => a.evaluate(() => [...document.querySelectorAll('#afatFurnSugj button')].map(x => x.textContent));
  ok(await duket(a, '#afatFurnSugj') && (await sugj()).includes('Abi') && (await sugj()).includes('Vipa') && (await sugj()).includes('Mbyll'), '3. sugjerimet dalin (Abi, Vipa, Mbyll)', await sugj());
  await a.fill('#afatFurnizuesi', 'vi'); await a.waitForTimeout(150);
  ok((await sugj()).filter(x => x !== 'Mbyll').join() === 'Vipa,+ Furnizues i ri: "vi"', '3. filtrimi sipas shkronjave + "Furnizues i ri"', await sugj());
  await a.evaluate(() => [...document.querySelectorAll('#afatFurnSugj button')].find(x => x.textContent === 'Vipa').click()); await a.waitForTimeout(200);
  ok((await a.inputValue('#afatFurnizuesi')) === 'Vipa' && !(await duket(a, '#afatFurnSugj')), '3. zgjedhja: "Vipa", lista mbyllet');
  await a.fill('#afatFurnizuesi', 'Furnitori i Ri'); await a.waitForTimeout(150);
  ok((await sugj()).includes('+ Furnizues i ri: "Furnitori i Ri"'), '3. furnizues që s\'është në listë: shkruhet lirisht');
  await a.evaluate(() => [...document.querySelectorAll('#afatFurnSugj button')].find(x => x.textContent === 'Mbyll').click()); await a.waitForTimeout(200);
  ok(!(await duket(a, '#afatFurnSugj')) && (await a.inputValue('#afatFurnizuesi')) === 'Furnitori i Ri', '3. "Mbyll" e mbyll listën, teksti mbetet');
  await a.fill('#afatBarkodi', '999'); await a.fill('#afatEmri', 'Lëng'); await a.fill('#afatData', '20-12-30');
  await a.click('#afatRuaj'); await a.waitForTimeout(400);
  ok((await a.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]'))).some(x => x.emri === 'Lëng' && x.furnizuesi === 'Furnitori i Ri'), '3. afati ruhet me furnizuesin e ri');
  ok(!a.__gab.length, '3. agim: pa gabime JS', a.__gab);

  // ================= 4. Pa internet =================
  const sw = fs.readFileSync(path.join(RR, 'sw.js'), 'utf8');
  ok(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].every(f => sw.includes('https://www.gstatic.com/firebasejs/12.19.0/' + f)), '4. service worker-i e ruan Firebase-in (hapje pa internet pas përditësimit)');
  const vf = fs.readFileSync(path.join(RR, 'firebase-tel.js'), 'utf8').match(/firebasejs\/([\d.]+)\//);
  ok(vf && sw.includes('firebasejs/' + vf[1] + '/'), '4. versioni i Firebase-it te service worker-i = ai i faqes', vf && vf[1]);
  // Faqja pa Firebase (s'u ngarkua pa internet): kur vjen "online", rihapet
  const ctxO = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctxO.route(u => !u.href.startsWith(BAZA), r => r.abort());
  const po = await ctxO.newPage(); let ngarkime = 0; po.on('load', () => { ngarkime++; });
  await po.goto(BAZA + '/index.html'); await po.waitForTimeout(1000);
  ok(await po.evaluate(() => !window.__stokuCloud), '4. faqja pa Firebase (s\'u ngarkua)');
  const paPorte = () => po.evaluate(() => { const x = document.getElementById('porta'); if (x) x.remove(); if (document.activeElement) document.activeElement.blur(); }); // si pajisja e kyçur
  await paPorte();
  await po.evaluate(() => window.dispatchEvent(new Event('online')));
  ok(await prit(async () => ngarkime >= 2, 20000), '4. pa Firebase: kur kthehet interneti faqja rihapet vetë', ngarkime);
  const n0 = ngarkime;
  await po.waitForTimeout(1500); await paPorte();
  await po.evaluate(() => window.dispatchEvent(new Event('online')));
  await po.waitForTimeout(12000);
  ok(ngarkime === n0, '4. jo më shpesh se një herë në 5 minuta', ngarkime);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

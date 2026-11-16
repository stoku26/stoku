// v311 / Android Hyrja 73: (1) pamja (tema + ngjyrat) ruhet te llogaria (perdoruesit/{uid}.pamja), e njëjtë në web tel, PC dhe Android;
// (2) PDF e afateve: "https://stoku.site" në fund; (3) dritarja e njoftimeve = kuti në mes të ekranit (e detyrueshme, pa vijë);
// (4) dritaret "bottom sheet" mbyllen me rrëshqitje poshtë (edhe shpejt), pronari: "ajo vija nuk bohet slide poshtë".
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const pritje = ms => new Promise(r => setTimeout(r, ms));
const prit = async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await pritje(100); } return false; };
(async () => {
  const R = __dirname + '/../', lx = f => fsN.readFileSync(R + f, 'utf8');
  const K = 'vendas/app/src/main/java/site/stoku/vendas/';
  // 0) statike
  // v313 (pronari): poshtë vetëm adresa, pa "Krijuar me Stoku"
  ok(!/stoku\.site/.test(lx('eksportet.js').split('function apPdf')[1].split('root.StokuEksportet')[0]) &&
    !/"https:\/\/stoku\.site"/.test(lx(K + 'EksportiPdf.kt')), '0. PDF: v317 pa "https://stoku.site" në fund (web + Android)');
  ok(/fun ruajPamjen\(\)/.test(lx(K + 'Llogaria.kt')) && /degjoPamjen\(p\)/.test(lx(K + 'Llogaria.kt')) && /zbatoPamjenNgaLlogaria/.test(lx(K + 'Opsionet.kt')) &&
    /Opsionet\.tema\.collectAsState\(\)/.test(lx(K + 'MainActivity.kt')) && /Llogaria\.ruajPamjen\(\)/.test(lx(K + 'Opsionet.kt')), '0. Android: pamja nga llogaria dhe te llogaria');
  const ek = lx('ekipa.js');
  ok(/degjoPamjen: function/.test(ek) && /ruajPamjen: function/.test(ek) && /function nisPamjen\(\)/.test(ek) && /pamjaNdryshoi: function/.test(ek) && /ndal\('pamja'\)/.test(ek), '0. ekipa.js: nisPamjen / pamjaNdryshoi');
  ok(!/id="dlgNjoftimet"[^]*?class="nj-ikona"[^]*?<\/div>\s*<h2 id="njTitulli"/.test('') && /#dlgNjoftimet\.mbulese:not\(\.faqe-e-plote\) > \.dialog::before \{ content: none/.test(lx('css/stoku.css')), '0. css: kuti në mes, pa vijën (njoftimet)');

  ok(!/njTeksti">[^<]*orë/.test(lx('index.html')) && !/Stoku të lajmëron me njoftim në telefon \(edhe në orë\)/.test(lx(K + 'ui/NjoftimetUI.kt')), '0. dritarja e njoftimeve: pa "(edhe në orë)" (web + Android)');

  const ihtml = lx('index.html'), nkt = lx(K + 'ui/NjoftimetUI.kt');
  ok(/id="njTeksti">Njoftimet janë të detyrueshme, sepse Stoku të lajmëron:<\/p>/.test(ihtml) && /"Njoftimet janë të detyrueshme, sepse Stoku të lajmëron:"/.test(nkt), '0. teksti: "Njoftimet janë të detyrueshme, sepse Stoku të lajmëron:" (web + Android)');
  ok(/për produktet që <b>skadojnë sot<\/b>/.test(ihtml) && /për produktet që <b>kanë skaduar<\/b>/.test(ihtml) && /për kërkesat dhe njoftimet e <b>grupit<\/b>/.test(ihtml) &&
    !/nj-rr-tekst"><b>/.test(ihtml) && /"për produktet që " to "skadojnë sot"/.test(nkt) && /"për produktet që " to "kanë skaduar"/.test(nkt) && /"për kërkesat dhe njoftimet e " to "grupit"/.test(nkt) && !/nga rafti\/pozita/.test(nkt),
    '0. tre rreshta me një tekst secili, pa nëntekstet (web + Android)');

  // 1) Ngjyrat te llogaria
  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: tani });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'blerta', kycurSe: tani });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'drini', kycurSe: tani, pamja: { tema: 'dark', e: 3, c: 4, t: tani } });
  F.S.docs.set('dyqane/u3', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  const b = await chromium.launch();
  const TEL = { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' };
  async function faqe(uid, emri, pc, init) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : TEL);
    if (init) await ctx.addInitScript(init);
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(2500);
    return p;
  }
  const gj = p => p.evaluate(() => ({ tema: document.documentElement.getAttribute('data-tema'), e: document.documentElement.getAttribute('data-ngj-e'), c: document.documentElement.getAttribute('data-ngj-c'),
    ruajtur: localStorage.getItem('stoku:ngjyrat'), temaLokale: localStorage.getItem('stoku:tema') }));
  const doc = k => F.S.docs.get(k);

  // 1a) llogaria ka pamje, pajisja e re (parazgjedhja): zbatohet
  const d = await faqe('u3', 'drini', false);
  ok(await prit(async () => { const s = await gj(d); return s.tema === 'dark' && s.e === '3' && s.c === '4'; }), '1a. tel: hyrja merr pamjen e llogarisë (E errët, Oqeani, Mente)', await gj(d));
  const sd = await gj(d);
  ok(sd.ruajtur === '{"e":3,"c":4}' && sd.temaLokale === 'dark', '1a. ruhet edhe në pajisje', sd);
  // 1b) pajisja ka zgjedhje, llogaria jo: ngarkohet te llogaria
  const l = await faqe('u2', 'blerta', false, () => { try { localStorage.setItem('stoku:tema', 'light'); localStorage.setItem('stoku:ngjyrat', JSON.stringify({ e: 1, c: 6 })); } catch (e) { /* ok */ } });
  ok(await prit(() => doc('perdoruesit/u2').pamja && doc('perdoruesit/u2').pamja.c === 6 && doc('perdoruesit/u2').pamja.tema === 'light'), '1b. pajisja ka zgjedhje, llogaria jo: ngarkohet te llogaria', doc('perdoruesit/u2').pamja);
  // 1c) ndryshimi nga përdoruesi ruhet te llogaria
  const a = await faqe('u1', 'agim', false);
  ok(!doc('perdoruesit/u1').pamja, '1c. llogaria e re: asgjë e ruajtur sa s\'ka zgjedhje');
  await a.click('#btnOpsione'); await a.waitForTimeout(300); await a.click('#tabPamja'); await a.waitForTimeout(400);
  await a.click('#segTema button[data-v="dark"]'); await a.waitForTimeout(300);
  await a.click('.tm-grupi[data-k="e"] .tm-krye'); await a.waitForTimeout(200);
  await a.click('.tm-grupi[data-k="e"] .tm-karta[data-n="5"]');
  ok(await prit(() => doc('perdoruesit/u1').pamja && doc('perdoruesit/u1').pamja.e === 5 && doc('perdoruesit/u1').pamja.tema === 'dark'), '1c. tel: "E errët" + Ametisti ruhen te llogaria', doc('perdoruesit/u1').pamja);
  // 1d) hyrja e njëjtë nga një pajisje tjetër e re (PC): e merr pamjen
  const pc = await faqe('u1', 'agim', true);
  ok(await prit(async () => { const s = await gj(pc); return s.tema === 'dark' && s.e === '5'; }), '1d. PC e re: hyn dhe merr pamjen (E errët, Ametisti)', await gj(pc));
  // 1e) PC e ndryshon, telefoni (i hapur) e merr
  await pc.click('#btnOpsione'); await pc.waitForTimeout(400);
  await pc.click('.tm-grupi[data-k="e"] .tm-krye'); await pc.waitForTimeout(200);
  await pc.click('.tm-grupi[data-k="e"] .tm-karta[data-n="9"]');
  ok(await prit(() => doc('perdoruesit/u1').pamja && doc('perdoruesit/u1').pamja.e === 9), '1e. PC: Akull ruhet te llogaria', doc('perdoruesit/u1').pamja);
  ok(await prit(async () => (await gj(a)).e === '9'), '1e. telefoni i hapur e merr ndryshimin (Akull)', await gj(a));
  ok(!a.__gab.length && !pc.__gab.length && !d.__gab.length && !l.__gab.length, '1. pa gabime JS', [a.__gab, pc.__gab, d.__gab, l.__gab]);

  // 2) Dritarja e njoftimeve: kuti në mes, e detyrueshme
  await a.evaluate(() => { window.__stokuPaNjoftime = true; });
  await a.click('#tabPamja').catch(() => {});
  const nj = await a.evaluate(() => { const o = document.getElementById('dlgNjoftimet'); o.classList.add('hapur');
    const r = o.querySelector('.dialog').getBoundingClientRect(), v = getComputedStyle(o.querySelector('.dialog'), '::before');
    return { qendraY: Math.round(r.top + r.height / 2), vh: innerHeight, majtas: Math.round(r.left), djathtas: Math.round(innerWidth - r.right), vija: v.content, rreshta: o.querySelectorAll('.nj-lista li').length }; });
  ok(Math.abs(nj.qendraY - nj.vh / 2) < 60 && nj.majtas >= 12 && nj.djathtas >= 12 && (nj.vija === 'none' || nj.vija === 'normal') && nj.rreshta === 3, '2. njoftimet: kuti në mes, pa vijë, 3 rreshta', nj);
  await a.waitForTimeout(500); await a.screenshot({ path: __dirname + '/v311-njoftimet.png' });
  async function rrezhqit(p, x, y0, y1, ms) { // rrëshqitje me prekje të vërtetë (CDP)
    const c = await p.context().newCDPSession(p);
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    const n = 6;
    for (let i = 1; i <= n; i++) { await pritje(ms / n); await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * i / n }] }); }
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  const hapur = (p, id) => p.evaluate(i => document.getElementById(i).classList.contains('hapur'), id);
  const kokaY = (p, id) => p.evaluate(i => { const r = document.querySelector('#' + i + ' > .dialog').getBoundingClientRect(); return Math.round(r.top + 14); }, id);
  await rrezhqit(a, 195, nj.qendraY - 100, nj.qendraY + 300, 120); await a.waitForTimeout(500);
  ok(await hapur(a, 'dlgNjoftimet'), '2. njoftimet e detyrueshme: rrëshqitja s\'e mbyll');
  await a.evaluate(() => document.getElementById('dlgNjoftimet').classList.remove('hapur'));

  // 3) Rrëshqitja poshtë mbyll dritaret me vijë
  async function hap(id) { await a.evaluate(i => document.getElementById(i).classList.add('hapur'), id); await a.waitForTimeout(500); }
  await hap('dlgTeRejat');
  let y = await kokaY(a, 'dlgTeRejat');
  await rrezhqit(a, 195, y, y + 30, 300); await a.waitForTimeout(500); // e shkurtër dhe ngadaltë: kthehet
  ok(await hapur(a, 'dlgTeRejat') && !(await a.evaluate(() => document.querySelector('#dlgTeRejat > .dialog').style.transform)), '3. rrëshqitje e shkurtër e ngadaltë: kthehet në vend');
  await rrezhqit(a, 195, y, y + 220, 500); await a.waitForTimeout(700);
  ok(!(await hapur(a, 'dlgTeRejat')), '3. rrëshqitje e gjatë poshtë e mbyll');
  ok(!(await a.evaluate(() => document.querySelector('#dlgTeRejat > .dialog').style.transform)), '3. stili i tërheqjes pastrohet (hapja tjetër normale)');
  await hap('dlgTeRejat'); y = await kokaY(a, 'dlgTeRejat');
  await rrezhqit(a, 195, y, y + 70, 70); await a.waitForTimeout(700); // e shkurtër por SHPEJT: mbyllet direkt
  ok(!(await hapur(a, 'dlgTeRejat')), '3. rrëshqitje e shpejtë (70 px në 70 ms) e mbyll direkt');
  // Rrëshqitje lart nuk mbyll
  await hap('dlgTeRejat'); y = await kokaY(a, 'dlgTeRejat');
  await rrezhqit(a, 195, y + 100, y - 40, 150); await a.waitForTimeout(400);
  ok(await hapur(a, 'dlgTeRejat'), '3. rrëshqitja lart s\'mbyll');
  await a.evaluate(() => document.getElementById('dlgTeRejat').classList.remove('hapur'));
  ok(!a.__gab.length, '3. pa gabime JS', a.__gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})();

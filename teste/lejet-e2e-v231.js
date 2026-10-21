// v231: lejet e përdoruesve në telefon. Çka s'lejohet zhduket krejt, PA ASNJË MESAZH (as "s'të lejohet", as lista te
// Llogaria, as "Administratori t'i ndryshoi lejet"). Pa "Stoku": faqja bazë (Afatet/Grupi/Cilësimet), "mbrapa" s'e mbyll.
// Skanimi pa "Shto"/"Ndrysho": neutral. Pa "pc": pa "Dërgo në PC". "Çka ka të re" e lejeve: vetëm administratori.
// Edhe: administratori te Cilësimet → Përdoruesit (lista, nënfaqja, kohë reale), rregullat para v230.
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
const L = require('../lejet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const NM = __dirname + '/npm/node_modules';
const CDN = { 'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js' };
async function rrugetE(ctx) {
  await ctx.route(u => !u.href.startsWith(B), r => {
    const emri = Object.keys(CDN).find(k => r.request().url().endsWith(k));
    if (emri) return r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(CDN[emri]) });
    return r.abort();
  });
}
const FARA = () => {
  if (localStorage.getItem('stoku:foldera:v1')) return;
  const t = Date.now();
  localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'pije', emri: 'Pije' }, { id: 'ushqimore', emri: 'Ushqimore' }]));
  const p = {};
  [['3800123456789', 'Ujë Rugove 0.5L', 12], ['3800000000017', 'Lëng portokalli 1L', 4]].forEach(([b, e, s], i) => { p['pije::' + b] = { barkodi: b, emri: e, sasia: s, kategoriaId: 'pije', prekurSe: t - i }; });
  localStorage.setItem('stoku:produktet:v2', JSON.stringify(p));
};
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const duket = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, sel);
const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
// Asnjë fjalë që e zbulon lejen (toast, faqja e dukshme)
const ZBULON = /lejohet|lejuar|administrator|ndalua|ndaluar/i;
const tekstiIDukshem = p => p.evaluate(() => document.body.innerText);
const hapur = (p, id) => p.evaluate(i => document.getElementById(i).classList.contains('hapur'), id);

(async () => {
  const F = krijoFirestore();
  const t0 = Date.now(), d = n => new Date(t0 + n * 864e5).toISOString().slice(0, 10);
  const AF = [{ id: 'a1', barkodi: '1', emri: 'Kos', data: d(-2), sasia: 5, furnizuesi: 'Meridian', statusi: 'aktiv', ndryshuarSe: t0 },
    { id: 'a2', barkodi: '2', emri: 'Bukë', data: d(20), sasia: 1, furnizuesi: 'Vipa', statusi: 'aktiv', ndryshuarSe: t0 }];
  // agim (u1): i kontrolluar, me kufizime; besa (u2): llogari e re (pa dokument lejesh)
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t0 - 3600e3 });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t0 - 60e3, krijuarSe: t0 - 120e3 });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'vjeter', kycurSe: t0 - 864e5 * 30 }); // llogari e vjetër, pa krijuarSe
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t0 });
  F.S.docs.set('lejet/u1', { lejet: Object.assign(L.krejt(true), { stokuFshi: false, stokuFoldera: false, eksportPdf: false, kamera: false, afatetNdrysho: false, afatetFshi: false, grupi: false, ora: false, dergoNePc: false }),
    kontrolluarSe: t0 - 864e5, kontrolluarNga: 'mendurberisha', emri: 'agim' });
  const b = await chromium.launch();

  // ================= 1. agim: llogari e kufizuar =================
  const ctxA = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, acceptDownloads: true });
  await rrugetE(ctxA);
  await F.lidh(ctxA, 'u1', 'agim@stoku-app.local', 'tel', { afatet: AF });
  await ctxA.addInitScript(FARA);
  const a = await ctxA.newPage();
  const gabA = []; a.on('pageerror', e => gabA.push(e.message));
  let shkA = 0; a.on('download', () => shkA++);
  await a.goto(B + '/index.html'); await a.waitForTimeout(2500);
  ok(!(await duket(a, '#btnEkipi')) && await duket(a, '#btnAfatet') && await duket(a, '#tabStoku'), '1. pa "Grupi": tabi Grupi s\'duket (Stoku dhe Afatet po)');
  ok(!(await a.$('.folder-karta .folder-fshij')), '1. pa "Fshi": s\'ka ✕ te folderat');
  ok(!(await a.evaluate(() => [...document.querySelectorAll('.sb-link')].some(x => /Folder i ri/.test(x.textContent)))), '1. pa "Krijo folderat": s\'ka "+ Folder i ri"');
  ok(await duket(a, '#kryeButonatImport'), '1. importi nga fotoja duket (i lejuar)');
  await a.evaluate(() => [...document.querySelectorAll('.folder-karta')].find(x => /Pije/.test(x.textContent)).click());
  await a.waitForTimeout(400);
  ok(!(await duket(a, '#btnKamera')) && !(await duket(a, '#btnEksportPdf')) && !(await duket(a, '#btnFshiTeGjitha')), '1. në folder: pa kamerë, pa PDF, pa "Fshi krejt"');
  ok(await duket(a, '#btnEksport'), '1. "Eksporto në Excel" duket');
  // Excel pa "Dërgo në PC": pa dritaren, shkarkohet direkt
  const [dlA] = await Promise.all([a.waitForEvent('download', { timeout: 8000 }).catch(() => null), a.click('#btnEksport')]);
  ok(!!dlA && !(await a.evaluate(() => document.getElementById('dlgKuSkedari').classList.contains('hapur'))), '1. Excel pa "Dërgo në PC": shkarkohet direkt, pa dritaren', dlA && dlA.suggestedFilename());
  // Produkti ekzistues: dialogu pa "Fshi"
  await a.evaluate(() => [...document.querySelectorAll('#lista .artikull')].find(x => /Ujë Rugove/.test(x.textContent)).click());
  await a.waitForTimeout(300);
  ok(await a.evaluate(() => document.getElementById('dlgProdukt').classList.contains('hapur')) && !(await duket(a, '#dlgFshij')), '1. produkti: dialogu hapet (Ndrysho lejohet), pa "Fshi"');
  await a.fill('#dlgSasia', '3'); await a.click('#dlgRuaj'); await a.waitForTimeout(300);
  ok(await a.evaluate(() => JSON.parse(localStorage.getItem('stoku:produktet:v2'))['pije::3800123456789'].sasia === 15), '1. sasia u ruajt (12 + 3)');
  // Thirrjet e drejtpërdrejta bllokohen
  await a.evaluate(() => { document.getElementById('btnFshiTeGjitha').click(); });
  await a.waitForTimeout(200);
  ok(!(await a.evaluate(() => document.getElementById('dlgFshirje').classList.contains('hapur'))), '1. "Fshi krejt" (klik i drejtpërdrejtë) s\'hapet');
  await a.evaluate(() => document.getElementById('btnKamera').click()); await a.waitForTimeout(300);
  ok(!(await a.evaluate(() => document.getElementById('kamera').classList.contains('hapur'))) && !ZBULON.test(await toast(a)), '1. kamera s\'hapet, pa asnjë njoftim për lejet', await toast(a));
  // Afatet: pa "U hoq nga rafti", afati vetëm për t'u parë, pa "Fshi"
  await a.goto(B + '/index.html'); await a.waitForTimeout(2000);
  await a.click('#btnAfatet'); await a.waitForTimeout(500);
  ok(await a.evaluate(() => document.getElementById('dlgAfatet').classList.contains('hapur')), '1. Afatet hapen');
  ok(!(await a.$('#afLista .af-pill')), '1. pa "Ndrysho afatet": s\'ka "U hoq nga rafti" te kartat');
  await a.evaluate(() => document.querySelector('#afLista .af-karta').click()); await a.waitForTimeout(300);
  const lex = await a.evaluate(() => ({ hapur: document.getElementById('dlgAfat').classList.contains('hapur'), ro: document.getElementById('afatEmri').readOnly,
    info: document.getElementById('afatInfo').textContent, anulo: document.getElementById('afatAnulo').textContent }));
  ok(lex.hapur && lex.ro && !/Vetëm për t'u parë/.test(lex.info) && !ZBULON.test(lex.info) && lex.anulo === 'Mbyll', '1. afati: vetëm për t\'u parë (readOnly, "Mbyll"), pa shënim për lejet', lex);
  ok(!(await duket(a, '#afatRuaj')) && !(await duket(a, '#afatFshij')) && !(await duket(a, '#afatSkano')), '1. afati: pa "Ruaj", pa "Fshi", pa kamerë');
  await a.click('#afatAnulo'); await a.waitForTimeout(200);
  ok(await duket(a, '#afShto') && await duket(a, '#afFotografo'), '1. "Shto" dhe fotografimi duken (të lejuara)');
  // Cilësimet: pa "Ora e dorës", pa "Përdoruesit"; Llogaria s'thotë asgjë për lejet
  await a.click('#btnOpsione'); await a.waitForTimeout(300);
  ok(!(await duket(a, '#tabOra')) && !(await duket(a, '#tabPerdoruesit')), '1. Cilësimet: pa "Ora e dorës", pa "Përdoruesit"');
  ok(!ZBULON.test(await tekstiIDukshem(a)), '1. menuja e Cilësimeve pa asnjë fjalë për lejet');
  await a.click('#tabLlogaria'); await a.waitForTimeout(300);
  ok(!(await a.$('#llLejetSeksion')) && !ZBULON.test(await tekstiIDukshem(a)), '1. Llogaria: pa seksionin "Lejet e llogarisë", pa asnjë fjalë për lejet');
  // "Çka ka të re": hyrjet e lejeve s'i dalin (vetëm administratorit)
  await a.click('#opsPrapa'); await a.waitForTimeout(200);
  await a.click('#opsTeRejat'); await a.waitForTimeout(300);
  const trA = await a.textContent('#trLista');
  ok(await hapur(a, 'dlgTeRejat') && !/Lejet e përdoruesve|Lejet: pa asnjë mesazh|Përdoruesit/.test(trA), '1. "Çka ka të re": pa hyrjet e lejeve', trA.slice(0, 80));
  ok(trA.length > 50 && !/[Gg]rup|koleg|[Kk]amer|Dërgo në PC|\bora e dorës/.test(trA), '1. "Çka ka të re": pa shënime për Grupin, kamerën, "Dërgo në PC", orën', (trA.match(/[Gg]rup|koleg|[Kk]amer|Dërgo në PC/) || [''])[0]);
  await a.click('#trMbyll'); await a.waitForTimeout(200);
  // Grupi nga njoftimi: s'hapet
  await a.evaluate(() => window.__stokuHapNgaNjoftimi('#ekipa-aktiviteti')); await a.waitForTimeout(300);
  ok(!(await a.evaluate(() => document.getElementById('dlgEkipi').classList.contains('hapur'))), '1. njoftimi i Grupit s\'e hap Grupin');
  ok(await a.evaluate(() => { const x = JSON.parse(localStorage.getItem('stoku:lejet:v1')); return x.uid === 'u1' && x.lejet.grupi === false; }), '1. lejet ruhen në pajisje (për hapjen pa internet)');
  await a.screenshot({ path: __dirname + '/v231-tel-kufizuar.png' });

  // ================= 2. besa: llogari e re (pa dokument) =================
  const ctxB = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true });
  await rrugetE(ctxB);
  await F.lidh(ctxB, 'u2', 'besa@stoku-app.local', 'tel', { afatet: AF });
  await ctxB.addInitScript(FARA);
  const bs = await ctxB.newPage();
  const gabB = []; bs.on('pageerror', e => gabB.push(e.message));
  await bs.goto(B + '/index.html'); await bs.waitForTimeout(2500);
  ok(await duket(bs, '#btnEkipi') && await duket(bs, '#btnAfatet') && !!(await bs.$('.folder-karta .folder-fshij')), '2. llogari e re: krejt lejet (Grupi, Afatet, ✕)');
  await bs.click('#btnOpsione'); await bs.waitForTimeout(300);
  ok(await duket(bs, '#tabOra') && !(await duket(bs, '#tabPerdoruesit')), '2. Cilësimet: "Ora e dorës" po, "Përdoruesit" jo (s\'është admin)');
  await bs.evaluate(() => { document.getElementById('dlgOpsione').classList.remove('hapur'); });

  // ================= 3. administratori =================
  const ctxM = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true });
  await rrugetE(ctxM);
  await F.lidh(ctxM, 'uA', 'mendurberisha@stoku-app.local', 'tel', { afatet: [] });
  await ctxM.addInitScript(FARA);
  const m = await ctxM.newPage();
  const gabM = []; m.on('pageerror', e => gabM.push(e.message));
  await m.goto(B + '/index.html'); await m.waitForTimeout(4500);
  ok(/Llogari e re: besa/.test(await toast(m)), '3. admini: njoftimi "Llogari e re: besa" (jo për llogarinë e vjetër)', await toast(m));
  ok((await m.textContent('#opsShenja')) === '1' && await duket(m, '#opsShenja'), '3. shenja 1 te tabi i Cilësimeve', await m.textContent('#opsShenja'));
  await m.click('#btnOpsione'); await m.waitForTimeout(300);
  ok(await duket(m, '#tabPerdoruesit'), '3. "Përdoruesit" duket te Aplikacioni');
  ok(await m.evaluate(() => document.getElementById('tabPerdoruesit').parentNode.previousElementSibling.textContent === 'Aplikacioni'), '3. rreshti është te grupi "Aplikacioni"');
  ok(/2 pa u kontrolluar/.test(await m.textContent('#tabPerdoruesitStatus')), '3. statusi: "2 pa u kontrolluar"', await m.textContent('#tabPerdoruesitStatus'));
  await m.click('#tabPerdoruesit'); await m.waitForTimeout(400);
  const lista = await m.evaluate(() => ({ titujt: [...document.querySelectorAll('#pdLista .ops-grupi-titull')].map(x => x.textContent),
    rreshtat: [...document.querySelectorAll('#pdLista .ops-furn-rresht')].map(x => x.querySelector('.ops-furn-emri').textContent + ' | ' + x.querySelector('.hint').textContent),
    titulli: document.getElementById('opsioneTitulli').textContent }));
  ok(lista.titulli === 'Përdoruesit' && lista.titujt[0] === 'Pa u kontrolluar · 2' && lista.titujt[1] === 'Të kontrolluar · 1', '3. lista: "Pa u kontrolluar · 2", "Të kontrolluar · 1"', lista);
  ok(/^besa \| Llogari e re/.test(lista.rreshtat[0]) && /^vjeter \| Pa u kontrolluar/.test(lista.rreshtat[1]) && /^agim \| 9 leje të ndaluara/.test(lista.rreshtat[2]), '3. besa (e re) e para, pastaj vjeter; agim me 9 të ndaluara', lista.rreshtat);
  ok(!lista.rreshtat.some(x => /mendurberisha/.test(x)), '3. administratori s\'del në listë');
  ok(!(await duket(m, '#opsShenja')), '3. pasi e pa listën, shenja zhduket');
  await m.screenshot({ path: __dirname + '/v231-tel-lista.png' });
  // besa: ndalo "Afatet" → në kohë reale te telefoni i besës
  await m.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => /besa/.test(x.textContent)).click());
  await m.waitForTimeout(400);
  ok((await m.textContent('#opsioneTitulli')) === 'besa' && /Pa u kontrolluar/.test(await m.textContent('#pdDetaje .kat-status')), '3. nënfaqja e besës: titulli "besa", "Pa u kontrolluar"');
  const nrLejeve = await m.evaluate(() => document.querySelectorAll('#pdDetaje .pd-lejet input[type=checkbox]').length);
  ok(nrLejeve === L.CELESAT.length && await m.evaluate(() => [...document.querySelectorAll('#pdDetaje .pd-lejet input')].every(x => x.checked)), '3. ' + L.CELESAT.length + ' leje, krejt të ndezura', nrLejeve);
  await m.screenshot({ path: __dirname + '/v231-tel-besa.png', fullPage: false });
  await m.click('label[for=pdLeja_afatet]'); await m.waitForTimeout(500);
  const dB = F.S.docs.get('lejet/u2');
  ok(dB && dB.lejet.afatet === false && dB.lejet.stoku === true && dB.kontrolluarNga === 'mendurberisha' && dB.emri === 'besa' && Object.keys(dB.lejet).length === L.CELESAT.length, '3. lejet/u2: afatet=false, kontrolluarNga, emri', dB && { afatet: dB.lejet.afatet, nga: dB.kontrolluarNga });
  ok(await m.evaluate(() => document.getElementById('pdLeja_afatetShto').disabled && document.getElementById('pdLeja_afatetShto').closest('.seksion').classList.contains('pd-joaktiv')), '3. veprimet e Afateve çaktivizohen (pa pjesën)');
  ok(await prit(async () => !(await duket(bs, '#btnAfatet'))), '3. besa: tabi Afatet zhduket në kohë reale');
  ok(!ZBULON.test(await toast(bs)), '3. besa: asnjë njoftim për ndryshimin e lejeve', await toast(bs));
  // Afatet e hapura mbyllen kur ndalohen
  await m.click('label[for=pdLeja_afatet]'); await m.waitForTimeout(400);
  ok(await prit(async () => await duket(bs, '#btnAfatet')), '3. afatet lejohen sërish → tabi rikthehet');
  await bs.click('#btnAfatet'); await bs.waitForTimeout(400);
  await m.click('label[for=pdLeja_afatet]'); await m.waitForTimeout(400);
  ok(await prit(async () => !(await bs.evaluate(() => document.getElementById('dlgAfatet').classList.contains('hapur')))), '3. besa: Afatet e hapura mbyllen kur ndalohen');
  // "Stoku" i ndaluar (Afatet janë ndaluar më lart) → faqja bazë = Grupi; tabi Stoku zhduket, pa asnjë kartë/mesazh
  await m.click('label[for=pdLeja_stoku]'); await m.waitForTimeout(400);
  ok(await prit(async () => await hapur(bs, 'dlgEkipi')), '3. besa pa "Stoku" (pa Afate): hapet Grupi si faqja bazë');
  ok(!(await duket(bs, '#tabStoku')) && !(await duket(bs, '#btnAfatet')) && await duket(bs, '#btnEkipi') && await duket(bs, '#btnOpsione'), '3. tabet: vetëm Grupi dhe Cilësimet (pa Stoku)');
  ok(await bs.evaluate(() => document.getElementById('btnEkipi').classList.contains('aktiv')), '3. tabi Grupi është aktiv');
  ok(!(await bs.$('.leja-mbyllur')) && !/Stoku s'është/.test(await tekstiIDukshem(bs)) && !ZBULON.test(await tekstiIDukshem(bs)), '3. pa kartën "Stoku s\'është i lejuar", pa asnjë fjalë për lejet');
  ok(await bs.evaluate(() => document.getElementById('tabLista').classList.contains('leja-ndaluar')), '3. besa pa "Stoku": s\'ka "Stoku" te Cilësimet');
  ok(await bs.evaluate(() => history.state === null || !history.state.stokuNiveli), '3. faqja bazë s\'shton nivel në histori (si kryefaqja)', await bs.evaluate(() => history.state));
  await bs.click('#btnOpsione'); await bs.waitForTimeout(400);
  ok(await hapur(bs, 'dlgOpsione') && !(await hapur(bs, 'dlgEkipi')), '3. Cilësimet hapen në vend të Grupit');
  await bs.evaluate(() => history.back()); await bs.waitForTimeout(600);
  ok(!(await hapur(bs, 'dlgOpsione')) && await hapur(bs, 'dlgEkipi'), '3. "mbrapa" nga Cilësimet → kthehet te Grupi (faqja bazë)');
  await bs.screenshot({ path: __dirname + '/v231-tel-pa-stok.png' });
  // "Lejo krejt"
  await m.evaluate(() => [...document.querySelectorAll('#pdDetaje .pd-veprime button')].find(x => /Lejo krejt/.test(x.textContent)).click());
  await m.waitForTimeout(400);
  ok(L.teNdaluara(F.S.docs.get('lejet/u2').lejet) === 0, '3. "Lejo krejt": asnjë e ndaluar');
  ok(await prit(async () => !!(await bs.$('.folder-karta')) && await duket(bs, '#btnAfatet')), '3. besa: folderat dhe Afatet rikthehen');
  // "Ndalo krejt" (me konfirmim)
  await m.evaluate(() => [...document.querySelectorAll('#pdDetaje .pd-veprime button')].find(x => /Ndalo krejt/.test(x.textContent)).click());
  await m.waitForTimeout(300); await m.click('#konfPo'); await m.waitForTimeout(400);
  ok(L.teNdaluara(F.S.docs.get('lejet/u2').lejet) === L.CELESAT.length, '3. "Ndalo krejt": krejt të ndaluara');
  ok(await prit(async () => !(await duket(bs, '#btnAfatet')) && !(await duket(bs, '#btnEkipi')) && !(await duket(bs, '#tabStoku')) && await hapur(bs, 'dlgOpsione')), '3. besa pa asgjë: faqja bazë = Cilësimet, tabi i vetëm');
  ok(!ZBULON.test(await tekstiIDukshem(bs)) && !ZBULON.test(await toast(bs)), '3. pa asnjë fjalë për lejet (as njoftim)', await toast(bs));
  await bs.click('#opsTeRejat'); await bs.waitForTimeout(300);
  const trZ = await bs.textContent('#trLista');
  ok(await hapur(bs, 'dlgTeRejat') && trZ.length > 30 && !/[Gg]rup|koleg|[Aa]fat|[Ff]older|[Pp]rodukt|[Kk]amer|Excel|PDF|kompjuter|skad/.test(trZ), '3. "Çka ka të re" pa asgjë të lejuar: vetëm shënime të përgjithshme', (trZ.match(/[Gg]rup|koleg|[Aa]fat|[Ff]older|[Pp]rodukt|[Kk]amer|Excel|PDF|kompjuter|skad/) || [''])[0]);
  await bs.click('#trMbyll'); await bs.waitForTimeout(200);
  await bs.click('#tabPamja'); await bs.waitForTimeout(300);
  await bs.evaluate(() => history.back()); await bs.waitForTimeout(600);
  ok(await hapur(bs, 'dlgOpsione') && await bs.evaluate(() => document.getElementById('kategoriMenu').style.display !== 'none'), '3. "mbrapa" nga "Pamja": kthehet te menuja e Cilësimeve (faqja bazë s\'mbyllet)');
  await bs.screenshot({ path: __dirname + '/v231-tel-asgje.png' });
  // Kthehu te lista: besa tani te "Të kontrolluar"
  await m.click('#opsPrapa'); await m.waitForTimeout(300);
  const lista2 = await m.evaluate(() => [...document.querySelectorAll('#pdLista .ops-grupi-titull')].map(x => x.textContent));
  ok(lista2[0] === 'Pa u kontrolluar · 1' && lista2[1] === 'Të kontrolluar · 2', '3. "←": lista, besa te "Të kontrolluar"', lista2);
  // "U kontrollua" për llogarinë e vjetër
  await m.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => /vjeter/.test(x.textContent)).click());
  await m.waitForTimeout(300);
  await m.click('#pdDetaje .pd-kontrollua'); await m.waitForTimeout(400);
  const dV = F.S.docs.get('lejet/u3');
  ok(dV && L.teNdaluara(dV.lejet) === 0 && dV.kontrolluarSe > 0, '3. "U kontrollua": vjeter me krejt lejet, e shënuar');
  await m.click('#opsPrapa'); await m.waitForTimeout(300);
  ok(!(await m.evaluate(() => [...document.querySelectorAll('#pdLista .ops-grupi-titull')].some(x => /Pa u kontrolluar/.test(x.textContent)))), '3. s\'mbetet asnjë "Pa u kontrolluar"');
  ok(/3 llogari/.test(await m.textContent('#tabPerdoruesitStatus')), '3. statusi: "3 llogari"', await m.textContent('#tabPerdoruesitStatus'));
  // Llogari e re ndërsa admini punon → njoftim + shenjë
  await m.click('#opsPrapa'); await m.click('#tabStoku'); await m.waitForTimeout(300);
  const ctxK = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await rrugetE(ctxK);
  await F.lidh(ctxK, 'u9', 'kujtim@stoku-app.local', 'tel', { afatet: [] });
  const k = await ctxK.newPage();
  await k.goto(B + '/index.html'); await k.waitForTimeout(1500);
  await k.evaluate(() => window.__fsTest.setDoc(window.__fsTest.doc(null, 'perdoruesit', 'u9'), { krijuarSe: Date.now() }, { merge: true }));
  ok(await prit(async () => /Llogari e re: kujtim/.test(await toast(m))), '3. llogari e re gjatë punës: "Llogari e re: kujtim…"', await toast(m));
  ok(await prit(async () => (await m.textContent('#opsShenja')) === '1'), '3. shenja 1 te Cilësimet');
  // Kërkimi (me 8+ llogari duket; këtu 4: i fshehur)
  ok(!(await duket(m, '#pdKerkoKuti')), '3. kërkimi fshihet kur ka pak llogari');
  // Bulk: "Shëno krejt" (2 të pakontrolluara: kujtim + një tjetër)
  await k.evaluate(() => window.__fsTest.setDoc(window.__fsTest.doc(null, 'perdoruesit', 'u9'), { krijuarSe: Date.now() }, { merge: true }));
  F.S.docs.delete('lejet/u3'); // vjeter rikthehet "pa u kontrolluar" (për bulk-un)
  await m.click('#btnOpsione'); await m.waitForTimeout(200); await m.click('#tabPerdoruesit'); await m.waitForTimeout(400);
  await m.evaluate(() => window.__fsTest && null);
  // rifresko listën (fshirja direkte te serveri s'njofton): hap faqen sërish
  await m.goto(B + '/index.html'); await m.waitForTimeout(4500);
  await m.click('#btnOpsione'); await m.waitForTimeout(200); await m.click('#tabPerdoruesit'); await m.waitForTimeout(500);
  const bulk = await m.$('#pdLista .pd-krejt');
  ok(!!bulk, '3. butoni "Shëno krejt … si të kontrolluar" (2+ të pakontrolluara)');
  if (bulk) { await bulk.click(); await m.waitForTimeout(300); await m.click('#konfPo'); await m.waitForTimeout(600); }
  ok(!!F.S.docs.get('lejet/u3') && !!F.S.docs.get('lejet/u9') && L.teNdaluara(F.S.docs.get('lejet/u9').lejet) === 0, '3. bulk: vjeter + kujtim të kontrolluar, me krejt lejet');
  ok(F.S.refuzime.filter(x => /^lejet\//.test(x.path)).length === 0, '3. asnjë refuzim nga rregullat për lejet', F.S.refuzime.filter(x => /^lejet\//.test(x.path)));

  // ================= 5. dren: pa "Shto", pa "Ndrysho", pa "Afatet", pa "Stoku në kompjuter" =================
  F.S.docs.set('perdoruesit/u8', { perdoruesi: 'dren', kycurSe: t0 });
  F.S.docs.set('lejet/u8', { lejet: Object.assign(L.krejt(true), { stokuShto: false, stokuNdrysho: false, afatet: false, pc: false }), kontrolluarSe: t0, emri: 'dren' });
  const ctxD = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, acceptDownloads: true });
  await rrugetE(ctxD);
  await F.lidh(ctxD, 'u8', 'dren@stoku-app.local', 'tel', { afatet: AF });
  await ctxD.addInitScript(FARA);
  const dr = await ctxD.newPage();
  const gabD = []; dr.on('pageerror', e => gabD.push(e.message));
  await dr.goto(B + '/index.html'); await dr.waitForTimeout(2500);
  const stat = await dr.evaluate(() => [...document.querySelectorAll('.sb-stats .sb-stat__label')].map(x => x.textContent));
  ok(stat.join('|') === 'Folderat|Sasi 0', '5. pa Afate: kryefaqja pa "Të skaduara"', stat);
  ok(!(await duket(dr, '#btnAfatet')) && await duket(dr, '#tabStoku') && !(await hapur(dr, 'dlgAfatet')), '5. Stoku është kryefaqja (pa tabin Afatet)');
  await dr.evaluate(() => [...document.querySelectorAll('.folder-karta')].find(x => /Pije/.test(x.textContent)).click());
  await dr.waitForTimeout(400);
  await dr.evaluate(() => [...document.querySelectorAll('#lista .artikull')].find(x => /Ujë Rugove/.test(x.textContent)).click());
  await dr.waitForTimeout(300);
  ok(!(await hapur(dr, 'dlgProdukt')) && !ZBULON.test(await toast(dr)), '5. pa "Ndrysho": prekja e produktit s\'hap asgjë, pa mesazh');
  ok(!(await dr.$('#lista .sasia-hap')), '5. pa butonat +/-');
  await dr.fill('#barkodi', '3800123456789'); await dr.press('#barkodi', 'Enter'); await dr.waitForTimeout(400);
  const gjetur = await dr.evaluate(() => ({ kerko: document.getElementById('kerko').value, n: document.querySelectorAll('#lista .artikull').length, dlg: document.getElementById('dlgProdukt').classList.contains('hapur') }));
  ok(!gjetur.dlg && gjetur.kerko === '3800123456789' && gjetur.n === 1 && !ZBULON.test(await toast(dr)), '5. skanimi i produktit që ekziston: gjendet në listë, pa dritare, pa mesazh', gjetur);
  await dr.fill('#barkodi', '5901234123457'); await dr.press('#barkodi', 'Enter'); await dr.waitForTimeout(400);
  ok(!(await hapur(dr, 'dlgProdukt')) && /Ky barkod s'është në këtë folder/.test(await toast(dr)) && !ZBULON.test(await toast(dr)), '5. barkod i ri pa "Shto": "Ky barkod s\'është në këtë folder."', await toast(dr));
  // Pa "pc": Excel-i shkarkohet direkt (pa "Dërgo në PC"), edhe pse "Dërgo skedarët në PC" është e lejuar
  const [dlD] = await Promise.all([dr.waitForEvent('download', { timeout: 8000 }).catch(() => null), dr.click('#btnEksport')]);
  ok(!!dlD && !(await hapur(dr, 'dlgKuSkedari')), '5. pa "Stoku në kompjuter": Excel-i pa "Dërgo në PC"', dlD && dlD.suggestedFilename());
  ok(!ZBULON.test(await tekstiIDukshem(dr)), '5. faqja pa asnjë fjalë për lejet');
  await dr.screenshot({ path: __dirname + '/v231-tel-dren.png' });
  // "Çka ka të re" sipas rolit (teRejat.js)
  const tr = await dr.evaluate(() => ({ jo: window.StokuTeRejat.teRejatPas(229, 'tel', false).map(h => h.v), po: window.StokuTeRejat.teRejatPas(229, 'tel', true).map(h => h.v) }));
  ok(!tr.jo.includes(230) && !tr.jo.includes(231) && tr.po.includes(230) && tr.po.includes(231), '5. teRejat: hyrjet e lejeve vetëm për administratorin', tr);

  // ================= 4. rregullat para v230 =================
  F.S.paLejet = true;
  const ctxV = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true });
  await rrugetE(ctxV);
  await F.lidh(ctxV, 'u1', 'agim@stoku-app.local', 'tel', { afatet: AF });
  await ctxV.addInitScript(FARA);
  const v = await ctxV.newPage();
  const gabV = []; v.on('pageerror', e => gabV.push(e.message));
  await v.goto(B + '/index.html'); await v.waitForTimeout(2500);
  ok(await duket(v, '#btnEkipi') && !!(await v.$('.folder-karta .folder-fshij')), '4. pa rregullat v230 (pajisje e re): krejt lejet');
  await m.goto(B + '/index.html'); await m.waitForTimeout(4500);
  await m.click('#btnOpsione'); await m.waitForTimeout(200); await m.click('#tabPerdoruesit'); await m.waitForTimeout(500);
  ok(/rregullat e Firestore duhet të përditësohen \(v230\)/.test(await m.textContent('#pdLista')), '4. admini: paralajmërimi për rregullat v230');
  await m.evaluate(() => [...document.querySelectorAll('#pdLista .ops-furn-rresht')].find(x => /besa/.test(x.textContent)).click());
  await m.waitForTimeout(300);
  await m.click('label[for=pdLeja_ora]'); await m.waitForTimeout(500);
  ok(/S'u ruajt: rregullat e Firestore duhet të përditësohen \(v230\)/.test(await toast(m)), '4. ruajtja: "S\'u ruajt: rregullat … (v230)"', await toast(m));
  ok(await prit(async () => m.evaluate(() => document.getElementById('pdLeja_ora').checked)), '4. çelësi kthehet si ishte (s\'u ruajt)');
  // agim, pajisja ku lejet ishin ruajtur më parë: kufizimet mbeten (nga localStorage)
  await a.goto(B + '/index.html'); await a.waitForTimeout(2500);
  ok(!(await duket(a, '#btnEkipi')), '4. pajisja me lejet e ruajtura: kufizimet mbeten pa internet/rregulla');
  F.S.paLejet = false;

  ok(!gabA.length && !gabB.length && !gabM.length && !gabV.length && !gabD.length, 'pa gabime JavaScript', gabA.concat(gabB, gabM, gabV, gabD));
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

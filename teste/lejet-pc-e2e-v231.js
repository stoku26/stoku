// v231: lejet e përdoruesve në PC (pc.html). Çka s'lejohet zhduket krejt, PA ASNJË MESAZH. Pa "Stoku në kompjuter":
// pc.html → versioni i telefonit (index.html s'kthehet te pc.html), dhe mbrapsht kur leja kthehet. Asgjë e lejuar: vetëm
// logoja. Pa Afate: pa "Të skaduara në raft". Edhe: administratori te Cilësimet → Përdoruesit, rregullat para v230.
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
const L = require('../lejet.js');
// v241: lejet "me zgjedhje" (p.sh. "marketet" = merchandiser) s'janë ndalime dhe s'ruhen me "Ndalo krejt"
const NR_LEJEVE = L.CELESAT.filter(k => !L.ZGJEDHJE[k]).length;
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
const duket = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0 && !e.closest('[hidden]'); }, sel);
const toast = p => p.evaluate(() => document.getElementById('toastTekst').textContent);
const ZBULON = /lejohet|lejuar|administrator|ndalua|ndaluar/i;
const tekstiIDukshem = p => p.evaluate(() => document.body.innerText).catch(() => '');
const faqja = p => { try { return new URL(p.url()).pathname; } catch (e) { return ''; } };
const siTelefon = p => p.evaluate(() => !!document.getElementById('tabStoku') && !document.getElementById('btnAkordStoku')).catch(() => false);
const siPc = p => p.evaluate(() => !!document.getElementById('btnAkordStoku')).catch(() => false);
const VP = { width: 1440, height: 900 };

(async () => {
  const F = krijoFirestore();
  const t0 = Date.now(), d = n => new Date(t0 + n * 864e5).toISOString().slice(0, 10);
  const AF = [{ id: 'a1', barkodi: '1', emri: 'Kos', data: d(-2), sasia: 5, furnizuesi: 'Meridian', statusi: 'aktiv', ndryshuarSe: t0 },
    { id: 'a2', barkodi: '2', emri: 'Bukë', data: d(20), sasia: 1, furnizuesi: 'Vipa', statusi: 'aktiv', ndryshuarSe: t0 }];
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t0 - 3600e3 });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t0 - 60e3, krijuarSe: t0 - 120e3 });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', kycurSe: t0 });
  F.S.docs.set('lejet/u1', { lejet: Object.assign(L.krejt(true), { stokuFshi: false, stokuFoldera: false, eksportPdf: false, afatetNdrysho: false, afatetFshi: false, grupi: false, stokuImporto: false }),
    kontrolluarSe: t0 - 864e5, kontrolluarNga: 'mendurberisha', emri: 'agim' });
  const b = await chromium.launch();

  // ================= 1. agim në PC: i kufizuar =================
  const ctxA = await b.newContext({ viewport: VP, serviceWorkers: 'block', acceptDownloads: true });
  await rrugetE(ctxA);
  await F.lidh(ctxA, 'u1', 'agim@stoku-app.local', 'pc', { afatet: AF });
  await ctxA.addInitScript(FARA);
  const a = await ctxA.newPage();
  const gabA = []; a.on('pageerror', e => gabA.push(e.message));
  await a.goto(B + '/pc.html'); await a.waitForTimeout(3000);
  ok(await duket(a, '#btnAkordStoku') && await duket(a, '#btnAkordAfatet') && !(await duket(a, '#btnAkordEkipi')), '1. PC: pllaka "Grupi" s\'duket (Stoku dhe Afatet po)');
  ok(!(await duket(a, '#btnFolderIRi')), '1. pa "Krijo folderat": s\'ka "+" te Folderat');
  ok(await a.evaluate(() => [...document.querySelectorAll('.folder-rresht')].every(r => !r.draggable)), '1. folderat s\'zvarriten (renditja)');
  // Menuja e folderit
  await a.evaluate(() => document.querySelector('.folder-rresht .me-shume').click()); await a.waitForTimeout(200);
  const menu = await a.evaluate(() => [...document.querySelectorAll('#menu button')].map(x => x.textContent));
  ok(menu.join('|') === 'Hap folderin|Eksporto në Excel', '1. menuja e folderit: vetëm "Hap" dhe "Excel"', menu);
  ok(await a.evaluate(() => { const m = document.getElementById('menu'); return !m.firstElementChild || m.firstElementChild.tagName !== 'HR'; }) && await a.evaluate(() => document.querySelectorAll('#menu hr').length <= 1), '1. menuja pa ndarës të tepërt');
  await a.keyboard.press('Escape');
  await a.evaluate(() => { location.hash = '#/f/pije'; }); await a.waitForTimeout(600);
  ok(await duket(a, '#btnShto') && await duket(a, '#pamjaTabela [data-eksport="excel"]') && !(await duket(a, '#pamjaTabela [data-eksport="pdf"]')), '1. folderi: "Shto" + Excel, pa PDF');
  const veprimet = await a.evaluate(() => [...document.querySelectorAll('#tabelaTrup tr:first-child .veprime-rreshti button')].map(x => x.dataset.v));
  ok(veprimet.join(',') === 'ndrysho,zhvendos', '1. rreshti: "Ndrysho" + "Zhvendos", pa "Fshi"', veprimet);
  // Delete me tastierë → s'fshihet
  await a.evaluate(() => document.querySelector('#tabelaTrup tr').click()); await a.waitForTimeout(300);
  await a.keyboard.press('Escape'); await a.waitForTimeout(200);
  await a.evaluate(() => { document.activeElement && document.activeElement.blur(); });
  const n0 = await a.evaluate(() => document.querySelectorAll('#tabelaTrup tr').length);
  await a.keyboard.press('ArrowDown'); await a.keyboard.press('Delete'); await a.waitForTimeout(300);
  ok((await a.evaluate(() => document.querySelectorAll('#tabelaTrup tr').length)) === n0 && !ZBULON.test(await toast(a)), '1. "Delete" s\'fshin, pa asnjë njoftim për lejet', await toast(a));
  // Eksporti: dritarja pa PDF
  await a.click('#pamjaTabela [data-eksport="excel"]'); await a.waitForTimeout(300);
  ok(await duket(a, '#ekFormatet [data-v="excel"]') && !(await duket(a, '#ekFormatet [data-v="pdf-lista"]')) && !(await duket(a, '#ekFormatet [data-v="pdf-etiketa"]')), '1. dritarja e eksportit: vetëm Excel');
  await a.keyboard.press('Escape'); await a.waitForTimeout(200);
  await a.keyboard.press('Control+p'); await a.waitForTimeout(300);
  ok(!(await a.evaluate(() => document.getElementById('dlgEksport').classList.contains('hapur') && document.querySelector('#ekFormatet .zgjedhje.aktiv').dataset.v !== 'excel')), '1. Ctrl+P s\'hap PDF');
  await a.keyboard.press('Escape');
  await a.keyboard.press('Control+i'); await a.waitForTimeout(300);
  ok(!(await a.evaluate(() => document.getElementById('dlgImport').classList.contains('hapur'))), '1. Ctrl+I (importi) s\'hapet pa "Importo stokun"');
  // Grupi nga adresa → kthehet
  await a.evaluate(() => { location.hash = '#/ekipa'; }); await a.waitForTimeout(600);
  ok(!(await duket(a, '#pamjaEkipi')), '1. "#/ekipa" pa lejen e Grupit: s\'hapet', await a.evaluate(() => location.hash));
  // Afatet
  await a.click('#btnAkordAfatet'); await a.waitForTimeout(500);
  ok(await duket(a, '#pamjaAfatet') && await duket(a, '#afBtnShto') && await duket(a, '#afBtnExcel') && await duket(a, '#afBtnFoto'), '1. Afatet: "Shto", Excel, foto');
  const afv = await a.evaluate(() => { const tr = document.querySelector('#afTrup tr.skaduar'); return { heq: !!tr.querySelector('.af-btn'), fshi: !!tr.querySelector('.btn-ikone.rrezik'), ed: tr.querySelector('.btn-ikone').title }; });
  ok(!afv.heq && !afv.fshi && afv.ed === 'Shiko', '1. afati i skaduar: pa "Shëno të hequr", pa "Fshi", "Shiko"', afv);
  await a.evaluate(() => document.querySelector('#afTrup tr.skaduar').click()); await a.waitForTimeout(300);
  const dl = await a.evaluate(() => ({ ro: document.getElementById('afdData').readOnly, ruaj: !document.getElementById('afdRuaj').classList.contains('fsheh'), info: document.getElementById('afdInfo').textContent }));
  ok(dl.ro && !dl.ruaj && !/Vetëm për t'u parë/.test(dl.info) && !ZBULON.test(dl.info), '1. afati: vetëm për t\'u parë, pa shënim për lejet', dl);
  await a.keyboard.press('Escape'); await a.waitForTimeout(200);
  // Cilësimet
  await a.click('#btnOpsione'); await a.waitForTimeout(300);
  ok(!(await duket(a, '#opsSkedaPerdoruesit')), '1. Cilësimet: pa "Përdoruesit"');
  await a.click('#opsSkeda button[data-faqe="llogaria"]'); await a.waitForTimeout(300);
  ok(!(await a.$('#opsLejet')) && !ZBULON.test(await a.textContent('.opsione-faqe[data-faqe="llogaria"]')), '1. Llogaria: pa kartën "Lejet e llogarisë", pa asnjë fjalë për lejet');
  await a.keyboard.press('Escape');
  ok(!ZBULON.test(await tekstiIDukshem(a)), '1. faqja pa asnjë fjalë për lejet');
  const shkA = await a.evaluate(() => [...document.querySelectorAll('#tabShkurtoret tr td:first-child')].map(x => x.textContent));
  ok(!shkA.includes('Eksporto në PDF') && !shkA.includes('Fshi të zgjedhurat (ose rreshtin)') && shkA.includes('Eksporto në Excel') && shkA.includes('Importo'), '1. shkurtoret: pa PDF, pa Fshi (Excel dhe Importo po)', shkA.length);
  ok(await a.evaluate(() => !window.StokuTeRejat.teRejatPas(229, 'pc', false).some(h => h.v === 230 || h.v === 231) && window.StokuTeRejat.teRejatPas(229, 'pc', true).some(h => h.v === 231)), '1. "Çka ka të re" e lejeve: vetëm administratori');
  await a.click('#btnOpsione'); await a.waitForTimeout(300); await a.click('#opsTeRejat'); await a.waitForTimeout(300);
  const trPc = await a.textContent('#trLista');
  ok(trPc.length > 50 && !/[Gg]rup|koleg|[Ii]mport|\bPDF/.test(trPc), '1. "Çka ka të re": pa shënime për Grupin, importin, PDF-në', (trPc.match(/[Gg]rup|koleg|[Ii]mport|\bPDF/) || [''])[0]);
  await a.keyboard.press('Escape'); await a.waitForTimeout(200);
  await a.screenshot({ path: __dirname + '/v231-pc-kufizuar.png' });

  // ================= 2. besa: pa "Stoku në kompjuter" =================
  F.S.docs.set('lejet/u2', { lejet: Object.assign(L.krejt(true), { pc: false }), kontrolluarSe: t0, kontrolluarNga: 'mendurberisha', emri: 'besa' });
  const ctxB = await b.newContext({ viewport: VP, serviceWorkers: 'block' });
  await rrugetE(ctxB);
  await F.lidh(ctxB, 'u2', 'besa@stoku-app.local', 'pc', { afatet: AF });
  await ctxB.addInitScript(FARA);
  const bs = await ctxB.newPage();
  const gabB = []; bs.on('pageerror', e => gabB.push(e.message));
  await bs.goto(B + '/pc.html'); 
  ok(await prit(async () => faqja(bs) === '/' && await siTelefon(bs), 10000), '2. pa lejen e PC-së: kalon vetë te versioni i telefonit', bs.url());
  await bs.waitForTimeout(2500);
  ok(faqja(bs) === '/' && await siTelefon(bs), '2. index.html s\'kthehet te pc.html (s\'ka qark)', bs.url());
  ok(!(await bs.$('#lejaPcMbulese')) && !ZBULON.test(await tekstiIDukshem(bs)), '2. pa dritaren "s\'është i lejuar", pa asnjë fjalë për lejet');
  ok(await bs.evaluate(() => !!document.querySelector('.folder-karta')), '2. versioni i telefonit punon (folderat)');
  await bs.screenshot({ path: __dirname + '/v231-pc-pa-pc.png' });
  // Hapja e drejtpërdrejtë e pc.html (leja e ruajtur): kthehet te telefoni para se të vizatohet
  await bs.goto(B + '/pc.html');
  ok(await prit(async () => faqja(bs) === '/' && await siTelefon(bs), 10000), '2. pc.html sërish → versioni i telefonit', bs.url());
  // Leja kthehet → versioni për kompjuter
  F.S.docs.set('lejet/u2', { lejet: L.krejt(true), kontrolluarSe: t0, kontrolluarNga: 'mendurberisha', emri: 'besa' });
  await bs.evaluate(() => window.__fs('resync')).catch(() => {});
  ok(await prit(async () => await siPc(bs), 10000), '2. leja kthehet: hapet vetë versioni për kompjuter', bs.url());
  await bs.waitForTimeout(1500);
  ok(await siPc(bs) && await duket(bs, '#btnAkordStoku'), '2. PC-ja punon sërish (pllakat)');

  // ================= 3. kerim: asgjë e lejuar; vjosa: pa Stok =================
  F.S.docs.set('perdoruesit/u6', { perdoruesi: 'kerim', kycurSe: t0 });
  F.S.docs.set('lejet/u6', { lejet: Object.assign(L.krejt(true), { stoku: false, afatet: false, grupi: false }), kontrolluarSe: t0, emri: 'kerim' });
  const ctxK = await b.newContext({ viewport: VP, serviceWorkers: 'block' });
  await rrugetE(ctxK);
  await F.lidh(ctxK, 'u6', 'kerim@stoku-app.local', 'pc', { afatet: AF });
  await ctxK.addInitScript(FARA);
  const k = await ctxK.newPage();
  const gabK = []; k.on('pageerror', e => gabK.push(e.message));
  await k.goto(B + '/pc.html'); await k.waitForTimeout(3000);
  ok(await duket(k, '#pamjaMbyllur') && !(await duket(k, '#pamjaPermbledhja')) && !(await duket(k, '#btnAkordStoku')) && !(await duket(k, '.krye-kerko')), '3. asgjë e lejuar: faqja bosh, pa pllaka, pa kërkim');
  ok((await k.textContent('#pamjaMbyllur')).trim() === '' && !(await k.$('.leja-mbyllur')) && !ZBULON.test(await tekstiIDukshem(k)), '3. pa asnjë tekst (vetëm logoja), pa fjalë për lejet');
  ok(!(await duket(k, '#akordStokuTrupi')) && !(await duket(k, '#folderat')), '3. pa menynë e Stokut anash');
  const shkK = await k.evaluate(() => [...document.querySelectorAll('#tabShkurtoret tr td:first-child')].map(x => x.textContent));
  ok(shkK.join('|') === 'Mbyll dritaren / pastro|Kjo listë', '3. shkurtoret: vetëm "Mbyll" dhe "Kjo listë"', shkK);
  await k.screenshot({ path: __dirname + '/v231-pc-asgje.png' });
  F.S.docs.set('perdoruesit/u7', { perdoruesi: 'vjosa', kycurSe: t0 });
  F.S.docs.set('lejet/u7', { lejet: Object.assign(L.krejt(true), { stoku: false }), kontrolluarSe: t0, emri: 'vjosa' });
  const ctxV = await b.newContext({ viewport: VP, serviceWorkers: 'block' });
  await rrugetE(ctxV);
  await F.lidh(ctxV, 'u7', 'vjosa@stoku-app.local', 'pc', { afatet: AF });
  await ctxV.addInitScript(FARA);
  const v = await ctxV.newPage();
  const gabV = []; v.on('pageerror', e => gabV.push(e.message));
  await v.goto(B + '/pc.html#/te-gjitha'); await v.waitForTimeout(3000);
  ok(await duket(v, '#pamjaAfatet') && !(await duket(v, '#pamjaTabela')) && (await v.evaluate(() => location.hash)) === '#/afatet', '3. pa Stok: "#/te-gjitha" → Afatet', await v.evaluate(() => location.hash));
  ok(await v.evaluate(() => document.querySelector('#opsSkeda button[data-faqe="stoku"]').classList.contains('leja-ndaluar')), '3. pa Stok: s\'ka "Stoku" te Cilësimet');
  await v.keyboard.press('Alt+1'); await v.waitForTimeout(300);
  ok(await duket(v, '#pamjaAfatet') && !ZBULON.test(await toast(v)), '3. Alt+1 (folderi) s\'hapet, pa njoftim', await toast(v));
  ok(!ZBULON.test(await tekstiIDukshem(v)), '3. pa Stok: pa asnjë fjalë për lejet');
  // dren: pa Afate → Përmbledhja pa "Të skaduara në raft"
  F.S.docs.set('perdoruesit/u8', { perdoruesi: 'dren', kycurSe: t0 });
  F.S.docs.set('lejet/u8', { lejet: Object.assign(L.krejt(true), { afatet: false, stokuShto: false, stokuNdrysho: false }), kontrolluarSe: t0, emri: 'dren' });
  const ctxD = await b.newContext({ viewport: VP, serviceWorkers: 'block' });
  await rrugetE(ctxD);
  await F.lidh(ctxD, 'u8', 'dren@stoku-app.local', 'pc', { afatet: AF });
  await ctxD.addInitScript(FARA);
  const dr = await ctxD.newPage();
  const gabD = []; dr.on('pageerror', e => gabD.push(e.message));
  await dr.goto(B + '/pc.html'); await dr.waitForTimeout(3000);
  const kpiD = await dr.textContent('#kpiRrjeti');
  ok(await duket(dr, '#pamjaPermbledhja') && /Produkte gjithsej/.test(kpiD) && !/skaduara/i.test(kpiD), '3. dren pa Afate: Përmbledhja pa "Të skaduara në raft"', kpiD);
  ok(!(await duket(dr, '#btnAkordAfatet')), '3. dren: pa pllakën Afatet');
  // Pa "Shto"/"Ndrysho": skaneri USB (fusha e barkodit) dhe kërkimi, neutralë
  await dr.evaluate(() => { location.hash = '#/f/pije'; }); await dr.waitForTimeout(600);
  ok(!(await duket(dr, '#btnShto')), '3. dren: pa "Shto produkt"');
  await dr.focus('#barkodi'); await dr.keyboard.type('3800123456789'); await dr.keyboard.press('Enter'); await dr.waitForTimeout(400);
  const fD = await dr.evaluate(() => ({ kerko: document.getElementById('kerko').value, n: document.querySelectorAll('#tabelaTrup tr').length, dlg: document.getElementById('dlgProdukt').classList.contains('hapur') }));
  ok(!fD.dlg && fD.kerko === '3800123456789' && fD.n === 1 && !ZBULON.test(await toast(dr)), '3. dren: barkodi që ekziston → filtrohet në tabelë, pa dritare, pa mesazh', fD);
  await dr.focus('#barkodi'); await dr.keyboard.type('5901234123457'); await dr.keyboard.press('Enter'); await dr.waitForTimeout(400);
  ok(!(await dr.evaluate(() => document.getElementById('dlgProdukt').classList.contains('hapur'))) && /Ky barkod s'është në këtë folder/.test(await toast(dr)), '3. dren: barkod i ri → "Ky barkod s\'është në këtë folder."', await toast(dr));
  await dr.evaluate(() => { location.hash = '#/permbledhja'; }); await dr.waitForTimeout(500);
  await dr.click('#kerkoGlobal'); await dr.keyboard.type('Lëng'); await dr.waitForTimeout(400); await dr.keyboard.press('ArrowDown'); await dr.keyboard.press('Enter'); await dr.waitForTimeout(600);
  const kD = await dr.evaluate(() => ({ hash: location.hash, kerko: document.getElementById('kerko').value, dlg: document.getElementById('dlgProdukt').classList.contains('hapur') }));
  ok(!kD.dlg && kD.hash === '#/f/pije' && kD.kerko === '3800000000017', '3. dren: rezultati i kërkimit → folderi, i filtruar (pa dritare)', kD);
  ok(!ZBULON.test(await tekstiIDukshem(dr)), '3. dren: pa asnjë fjalë për lejet');

  // ================= 4. administratori në PC =================
  const ctxM = await b.newContext({ viewport: VP, serviceWorkers: 'block' });
  await rrugetE(ctxM);
  await F.lidh(ctxM, 'uA', 'mendurberisha@stoku-app.local', 'pc', { afatet: [] });
  await ctxM.addInitScript(FARA);
  const m = await ctxM.newPage();
  const gabM = []; m.on('pageerror', e => gabM.push(e.message));
  F.S.docs.delete('lejet/u2'); // besa: llogari e re, pa u kontrolluar
  await m.goto(B + '/pc.html'); await m.waitForTimeout(5000);
  ok(/Llogari e re: besa/.test(await toast(m)) && (await m.textContent('#toastBtn')) === 'Shiko', '3. admini: "Llogari e re: besa" + "Shiko"', await toast(m));
  await m.click('#toastBtn'); await m.waitForTimeout(400);
  ok(await m.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur') && document.querySelector('.opsione-faqe[data-faqe="perdoruesit"]').classList.contains('aktiv')), '4. "Shiko" hap Cilësimet → Përdoruesit');
  ok(await duket(m, '#opsSkedaPerdoruesit') && /1 pa u kontrolluar/.test(await m.textContent('#opsPerdoruesitNen')), '4. skeda "Përdoruesit" · "1 pa u kontrolluar"', await m.textContent('#opsPerdoruesitNen'));
  const lst = await m.evaluate(() => [...document.querySelectorAll('#pdPamja .ops-karta')].map(k => k.querySelector('.ops-titull') ? k.querySelector('.ops-titull').textContent + ': ' + [...k.querySelectorAll('.pd-emri')].map(x => x.textContent).join(',') : ''));
  ok(lst[0] === 'Pa u kontrolluar1: besa' && /^Të kontrolluar4: agim,dren,kerim,vjosa$/.test(lst[1]), '4. lista: besa te "Pa u kontrolluar"; agim, dren, kerim, vjosa te "Të kontrolluar"', lst);
  await m.screenshot({ path: __dirname + '/v231-pc-lista.png' });
  // agim: lejo PDF-në → te PC-ja e agimit del butoni PDF në kohë reale
  await m.evaluate(() => [...document.querySelectorAll('#pdPamja .pd-rresht')].find(x => /agim/.test(x.textContent)).click());
  await m.waitForTimeout(300);
  ok((await m.textContent('#pdTitulli')) === 'agim' && await duket(m, '#pdMbrapa'), '4. nënfaqja "agim" me "← Krejt përdoruesit"');
  ok((await m.evaluate(() => document.querySelectorAll('#pdPamja .lj-ndez input').length)) === L.CELESAT.length, '4. ' + L.CELESAT.length + ' leje');
  ok(await m.evaluate(() => !document.getElementById('pdLeja_eksportPdf').checked && document.getElementById('pdLeja_grupiHeq').disabled), '4. PDF e fikur; veprimet e Grupit çaktivizuar (pa Grupin)');
  await m.screenshot({ path: __dirname + '/v231-pc-agim.png', fullPage: true });
  await a.evaluate(() => { location.hash = '#/f/pije'; }); await a.waitForTimeout(400);
  await m.click('label[for=pdLeja_eksportPdf]'); await m.waitForTimeout(500);
  ok(F.S.docs.get('lejet/u1').lejet.eksportPdf === true, '4. lejet/u1.eksportPdf = true');
  ok(await prit(async () => await duket(a, '#pamjaTabela [data-eksport="pdf"]')), '4. agim: butoni PDF del në kohë reale');
  ok(!ZBULON.test(await toast(a)), '4. agim: asnjë njoftim për ndryshimin e lejeve', await toast(a));
  // Grupi për agimin
  await m.click('label[for=pdLeja_grupi]'); await m.waitForTimeout(500);
  ok(await prit(async () => await duket(a, '#btnAkordEkipi')), '4. agim: pllaka "Grupi" del');
  ok(await m.evaluate(() => !document.getElementById('pdLeja_grupiHeq').disabled), '4. veprimet e Grupit aktivizohen');
  // "Ndalo krejt" për vjosën → asgjë
  await m.click('#pdMbrapa'); await m.waitForTimeout(200);
  await m.evaluate(() => [...document.querySelectorAll('#pdPamja .pd-rresht')].find(x => /vjosa/.test(x.textContent)).click()); await m.waitForTimeout(300);
  await m.click('#pdNdaloKrejt'); await m.waitForTimeout(300); await m.click('#kfPo'); await m.waitForTimeout(500);
  ok(L.teNdaluara(F.S.docs.get('lejet/u7').lejet) === NR_LEJEVE, '4. "Ndalo krejt": vjosa pa asnjë leje');
  ok(await prit(async () => await siTelefon(v), 10000), '4. vjosa pa asnjë leje: kalon te versioni i telefonit');
  await v.waitForTimeout(1500);
  ok(await siTelefon(v) && await v.evaluate(() => document.getElementById('dlgOpsione').classList.contains('hapur')) && !ZBULON.test(await tekstiIDukshem(v)), '4. vjosa: versioni i telefonit me Cilësimet si faqe bazë, pa fjalë për lejet');
  await m.click('#pdLejoKrejt'); await m.waitForTimeout(500);
  ok(await prit(async () => await siPc(v) && await duket(v, '#btnAkordStoku'), 10000), '4. "Lejo krejt": vjosa kthehet vetë te PC-ja, me krejt pjesët');
  // besa: "U kontrollua"
  await m.click('#pdMbrapa'); await m.waitForTimeout(200);
  await m.evaluate(() => [...document.querySelectorAll('#pdPamja .pd-rresht')].find(x => /besa/.test(x.textContent)).click()); await m.waitForTimeout(300);
  await m.click('#pdKontrollua'); await m.waitForTimeout(500);
  ok(!!F.S.docs.get('lejet/u2') && L.teNdaluara(F.S.docs.get('lejet/u2').lejet) === 0, '4. "U kontrollua": besa me krejt lejet');
  ok(/Lejet e llogarive/.test(await m.textContent('#opsPerdoruesitNen')), '4. skeda: s\'ka më të pakontrolluar', await m.textContent('#opsPerdoruesitNen'));
  ok(F.S.refuzime.filter(x => /^lejet\//.test(x.path)).length === 0, '4. asnjë refuzim nga rregullat');
  // Rregullat para v230: ruajtja dështon dhe çelësi kthehet si ishte
  F.S.paLejet = true;
  await m.evaluate(() => [...document.querySelectorAll('#pdPamja .pd-rresht')].length ? null : null);
  await m.click('#pdMbrapa').catch(() => {}); await m.waitForTimeout(200);
  await m.evaluate(() => [...document.querySelectorAll('#pdPamja .pd-rresht')].find(x => /kerim/.test(x.textContent)).click()); await m.waitForTimeout(300);
  await m.click('label[for=pdLeja_ora]'); await m.waitForTimeout(600);
  ok(/S'u ruajt: rregullat e Firestore/.test(await toast(m)) && await m.evaluate(() => document.getElementById('pdLeja_ora').checked), '4. pa rregullat v230: "S\'u ruajt…" dhe çelësi kthehet', await toast(m));
  F.S.paLejet = false;

  ok(!gabA.length && !gabB.length && !gabK.length && !gabV.length && !gabM.length && !gabD.length, 'pa gabime JavaScript', gabA.concat(gabB, gabK, gabV, gabM, gabD));
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

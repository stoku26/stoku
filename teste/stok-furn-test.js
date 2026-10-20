// v212: (1) Cilësimet → Stoku: furnizuesit dhe produktet që i ruan administratori dalin në krye (më i riu i pari);
// (2) furnitori opsional te produkti i stokut: dialogu (PC + telefon), importi nga Excel/CSV, eksporti në Excel.
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  const adm = (e, f, k) => ({ e, f, k, a: 0, m: 1, s: 1, n: 'mendurberisha', x: 0 });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'mendurberisha', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u2', pronarEmri: 'mendurberisha' });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'mendurberisha', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/kujtesa/p1', { p: {
    '1001': adm('Old A', 'Abi', t - 9e6), '1002': adm('Zeta recent', 'Zeta', t - 1000),
    '1003': { e: 'Auto B', f: 'Beta', k: t, a: 1, m: 0, s: 0, n: '', x: 0 },
    'furnizuesi Abi': { e: 'Abi', f: '', k: 1, a: 0, m: 0, s: 1, n: '', x: 0 },
    'furnizuesi Zeta': { e: 'Zeta', f: '', k: t - 1000, a: 0, m: 0, s: 1, n: '', x: 0 },
    'furnizuesi Beta': { e: 'Beta', f: '', k: t - 50000, a: 0, m: 0, s: 1, n: '', x: 0 }
  }, ndryshuarSe: t - 60000 });
  const foldera = [{ id: 'f1', emri: 'Ushqimore', ndryshuarSe: t - 9e6 }, { id: 'f2', emri: 'Pije', ndryshuarSe: t - 9e6 }];
  const produktet = [{ barkodi: '3001', emri: 'Me furnitor', sasia: 4, kategoriaId: 'f1', prekurSe: t - 5e6, furnizuesi: 'Abi' }];
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera, produktet, afatet: [], fshira: {} });
  const b = await chromium.launch();
  async function faqe(pc, hash) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', acceptDownloads: true }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u2', 'mendurberisha@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + (pc ? 'pc' : 'tel') + '] pageerror:', e.message); });
    await p.goto('http://127.0.0.1:' + PORTI + '/' + (pc ? 'pc.html' : 'index.html') + (hash || ''));
    await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    return p;
  }
  const lokale = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}'));
  async function pcStoku(p) {
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#opsSkeda [data-faqe="stoku"]'); await p.waitForTimeout(300);
    await p.click('#opsKujSeksion .ops-palos'); await p.click('#opsFurnSeksion .ops-palos');
    for (const s of ['#opsKujPritjeSeksion', '#opsFurnPritjeSeksion']) if (await p.isVisible(s + ' .ops-palos')) await p.click(s + ' .ops-palos');
    await p.waitForTimeout(200);
  }
  async function telFaqe(p, nen) {
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabLista'); await p.waitForTimeout(200); await p.click('#' + nen); await p.waitForTimeout(300);
  }
  const emrat = (p, sel) => p.$$eval(sel + ' .ops-furn-rresht .ops-furn-emri', x => x.map(e => e.textContent.trim()));
  const pc = await faqe(true);

  // 1. Renditja fillestare
  await pcStoku(pc);
  let fu = await emrat(pc, '#opsFurnLista'), pr = await emrat(pc, '#opsKujLista');
  ok(fu.slice(0, 3).join() === 'Zeta,Beta,Abi', '1. PC Furnizuesit: të ruajturit nga administratori sipas kohës (Zeta, Beta), pastaj të tjerët', fu);
  ok(pr[0] === 'Zeta recent' && pr[1] === 'Old A' && pr.indexOf('Auto B') > 1, '1. PC Produktet: të ruajturat nga administratori në krye, ajo e mësuar vetë (edhe pse më e reja) pas tyre', pr);

  // 2. PC: produkt i ri me furnitor të ri → furnitori dhe produkti dalin në krye
  await pc.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await pc.evaluate(() => { location.hash = '#/f/f1'; }); await pc.waitForTimeout(500);
  await pc.click('#btnShto'); await pc.waitForTimeout(300);
  ok(await pc.isVisible('#prFurnizuesi') && /Furnizuesi \(opsional\)/.test(await pc.textContent('#dlgProdukt')), '2. PC: dialogu "Produkt i ri" ka fushën Furnitori (opsionale)');
  await pc.fill('#prBarkodi', '2001'); await pc.fill('#prEmri', 'Produkt me furnitor'); await pc.fill('#prFurnizuesi', 'Mrekullia'); await pc.fill('#prSasia', '5');
  await pc.click('#prRuaj'); await pc.waitForTimeout(600);
  let L = await lokale(pc);
  ok(L['f1::2001'] && L['f1::2001'].furnizuesi === 'Mrekullia' && L['f1::2001'].sasia === 5, '2. PC: produkti u ruajt me furnitorin', L['f1::2001']);
  ok(/Mrekullia/.test(await pc.textContent('#tabelaTrup tr[data-k="f1::2001"] .k-emri')), '2. PC: tabela e tregon furnitorin pranë emrit');
  // pa furnitor: fusha mbetet bosh, produkti s'ka furnizues
  await pc.click('#btnShto'); await pc.waitForTimeout(300);
  ok((await pc.inputValue('#prFurnizuesi')) === '', '2. PC: te një produkt i ri i panjohur fusha është bosh');
  await pc.fill('#prBarkodi', '2002'); await pc.fill('#prEmri', 'Pa furnitor'); await pc.fill('#prSasia', '2');
  await pc.click('#prRuaj'); await pc.waitForTimeout(600);
  L = await lokale(pc);
  ok(L['f1::2002'] && !('furnizuesi' in L['f1::2002']), '2. PC: pa furnitor → mbetet bosh', L['f1::2002']);
  await pcStoku(pc);
  // v214: të rejat e administratorit presin kontrollin (në krye të "të rejave"); "Ruaj" i kalon në krye të listave kryesore
  fu = await emrat(pc, '#opsFurnPritjeLista'); pr = await emrat(pc, '#opsKujPritjeLista');
  ok(fu[0] === 'Mrekullia' && !(await emrat(pc, '#opsFurnLista')).includes('Mrekullia'), '2. PC: "Mrekullia" pret kontrollin (te Furnizuesit e rinj)', fu.slice(0, 4));
  ok(pr[0] === 'Pa furnitor' && pr[1] === 'Produkt me furnitor', '2. PC: produktet e reja presin kontrollin, më e reja e para', pr.slice(0, 4));
  await pc.click('#opsFurnPritjeLista .ops-furn-rresht:has-text("Mrekullia") button:has-text("Ruaj")'); await pc.waitForTimeout(300);
  await pc.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Produkt me furnitor") button:has-text("Ruaj")'); await pc.waitForTimeout(300);
  await pc.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Pa furnitor") button:has-text("Ruaj")'); await pc.waitForTimeout(300);
  fu = await emrat(pc, '#opsFurnLista'); pr = await emrat(pc, '#opsKujLista');
  ok(fu[0] === 'Mrekullia', '2. PC Furnizuesit: "Mrekullia" (i sapo ruajtur) në krye', fu.slice(0, 4));
  ok(pr[0] === 'Pa furnitor' && pr[1] === 'Produkt me furnitor', '2. PC Produktet: të sapo ruajturat në krye, më e reja e para', pr.slice(0, 4));

  // 3. Ndrysho: furnitori i zbrazur hiqet; zhvendosja e ruan furnitorin
  await pc.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await pc.click('#tabelaTrup tr[data-k="f1::3001"] .k-emri'); await pc.waitForTimeout(300);
  ok((await pc.inputValue('#prFurnizuesi')) === 'Abi', '3. PC: ndrysho e tregon furnitorin e produktit');
  await pc.fill('#prFurnizuesi', ''); await pc.click('#prRuaj'); await pc.waitForTimeout(500);
  L = await lokale(pc);
  ok(L['f1::3001'] && !('furnizuesi' in L['f1::3001']) && L['f1::3001'].emri === 'Me furnitor', '3. PC: fusha e zbrazur e heq furnitorin', L['f1::3001']);
  await pc.click('#tabelaTrup tr[data-k="f1::2001"] button[data-v="zhvendos"]'); await pc.waitForTimeout(300);
  await pc.click('#zhLista >> text=Pije'); await pc.waitForTimeout(500);
  L = await lokale(pc);
  ok(L['f2::2001'] && L['f2::2001'].furnizuesi === 'Mrekullia' && !L['f1::2001'], '3. PC: zhvendosja në "Pije" e ruan furnitorin', L['f2::2001']);

  // 4. Importi nga CSV me kolonën e furnitorit
  await pc.evaluate(() => { location.hash = '#/f/f1'; }); await pc.waitForTimeout(400);
  await pc.keyboard.press('Control+i'); await pc.waitForTimeout(300);
  const csv = 'Barkodi;Emri;Sasia;Furnizuesi\n4001;Import me furnitor;3;Frutex\n4002;Import pa furnitor;7;\n';
  await pc.setInputFiles('#imSkedari', { name: 'lista.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) }); await pc.waitForTimeout(500);
  const kol = await pc.$eval('#imKolFurnizuesi', s => s.options[s.selectedIndex].textContent);
  ok(kol === 'Furnizuesi', '4. PC importi: kolona e furnitorit gjendet vetë', kol);
  ok(/Frutex/.test(await pc.textContent('#imParapamje')), '4. PC importi: parapamja e tregon furnitorin');
  await pc.click('#imBtn'); await pc.waitForTimeout(600);
  L = await lokale(pc);
  ok(L['f1::4001'] && L['f1::4001'].furnizuesi === 'Frutex' && L['f1::4002'] && !('furnizuesi' in L['f1::4002']), '4. PC importi: me furnitor kur ka, bosh kur s\'ka', [L['f1::4001'], L['f1::4002']]);

  // 5. Eksporti në Excel: kolona "Furnizuesi", bosh kur s'ka
  await pc.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await pc.keyboard.press('Control+e'); await pc.waitForTimeout(300);
  const [dl] = await Promise.all([pc.waitForEvent('download'), pc.click('#ekBtn')]);
  const buf = fs.readFileSync(await dl.path());
  const fletet = await pc.evaluate(async b64 => {
    const u = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return (await window.StokuXlsx.read(u.buffer)).map(sh => ({ name: sh.name, rows: sh.rows }));
  }, buf.toString('base64'));
  const rr = fletet[0].rows, koka = rr[0].map(String);
  const iF = koka.indexOf('Furnizuesi'), iB = koka.indexOf('Barkodi');
  const sipas = {}; rr.slice(1).forEach(r => { sipas[String(r[iB])] = r[iF]; });
  ok(iF > 0 && sipas['4001'] === 'Frutex' && (sipas['4002'] === '' || sipas['4002'] === undefined) && (sipas['3001'] === '' || sipas['3001'] === undefined), '5. PC eksporti: kolona Furnizuesi (bosh kur s\'ka)', { koka, sipas });

  // 5b. Afat pa barkod me furnitor të ri (administratori): furnitori del në krye te Furnizuesit
  await pc.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await pc.evaluate(() => { location.hash = '#/afatet'; }); await pc.waitForTimeout(500);
  await pc.keyboard.press('n'); await pc.waitForTimeout(300);
  await pc.fill('#afdEmri', 'Afat pa barkod'); await pc.fill('#afdData', '31-12-27'); await pc.fill('#afdFurnizuesi', 'Vetëm afat');
  await pc.click('#afdRuaj'); await pc.waitForTimeout(600);
  await pcStoku(pc);
  fu = await emrat(pc, '#opsFurnPritjeLista');
  ok(fu[0] === 'Vetëm afat', '5b. PC: furnitori i ri te një afat pa barkod del në krye të Furnizuesve të rinj', fu.slice(0, 4));

  // 6. Telefoni: dialogu i produktit me furnitor (opsional), lista e tregon
  const tel = await faqe(false);
  await tel.click('#folderaLista >> text=Ushqimore'); await tel.waitForTimeout(500);
  await tel.fill('#barkodi', '5001'); await tel.press('#barkodi', 'Enter'); await tel.waitForTimeout(400);
  ok(await tel.isVisible('#dlgFurnizuesi') && (await tel.getAttribute('#dlgFurnizuesi', 'placeholder')) === 'Furnizuesi (opsional)', '6. telefoni: dialogu ka fushën "Furnitori (opsionale)"');
  await tel.fill('#dlgEmri', 'Tel me furnitor'); await tel.press('#dlgEmri', 'Enter');
  ok(await tel.evaluate(() => document.activeElement.id) === 'dlgFurnizuesi', '6. telefoni: Enter nga emri kalon te furnitori');
  await tel.fill('#dlgFurnizuesi', 'Mrekullia'); await tel.press('#dlgFurnizuesi', 'Enter');
  await tel.fill('#dlgSasia', '6'); await tel.press('#dlgSasia', 'Enter'); await tel.waitForTimeout(500);
  L = await lokale(tel);
  ok(L['f1::5001'] && L['f1::5001'].furnizuesi === 'Mrekullia' && L['f1::5001'].sasia === 6, '6. telefoni: produkti u ruajt me furnitorin', L['f1::5001']);
  ok(/5001 · Mrekullia/.test(await tel.textContent('#lista')), '6. telefoni: lista e tregon furnitorin nën emër');
  await tel.fill('#barkodi', '5002'); await tel.press('#barkodi', 'Enter'); await tel.waitForTimeout(400);
  ok((await tel.inputValue('#dlgFurnizuesi')) === '', '6. telefoni: produkt i ri i panjohur → furnitori bosh');
  await tel.fill('#dlgEmri', 'Tel pa furnitor'); await tel.fill('#dlgSasia', '1'); await tel.click('#dlgRuaj'); await tel.waitForTimeout(500);
  L = await lokale(tel);
  ok(L['f1::5002'] && !('furnizuesi' in L['f1::5002']), '6. telefoni: pa furnitor → bosh', L['f1::5002']);
  const xl = await tel.evaluate(async () => {
    const x = StokuXlsx.build([{ barkodi: '1', emri: 'A', sasia: 2, furnizuesi: 'Abi' }, { barkodi: '2', emri: 'B', sasia: 0 }]);
    return (await StokuXlsx.read(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)))[0].rows;
  });
  ok(xl[0][3] === 'Furnizuesi' && xl[1][3] === 'Abi' && (xl[2][3] === '' || xl[2][3] === undefined), '6. telefoni: Excel-i i folderit ka kolonën Furnizuesi', xl);
  await tel.click('#btnMbrapa'); await tel.waitForTimeout(300);
  await telFaqe(tel, 'stFurnizuesit');
  const ft = await emrat(tel, '#furnLista');
  // Frutex u ruajt me importin (pas Mrekullisë); Mrekullia e rishkruar te telefoni s'e ndryshon kohën e ruajtjes
  ok(ft.slice(0, 4).join() === 'Mrekullia,Zeta,Beta,Abi', '6. telefoni Furnizuesit: i ruajturi i fundit në krye (edhe nga PC)', ft.slice(0, 6));
  await tel.click('#opsPrapa'); await tel.waitForTimeout(300); await tel.click('#stFurnPritje'); await tel.waitForTimeout(300);
  const ftp = await emrat(tel, '#furnPritjeLista');
  ok(ftp.slice(0, 2).join() === 'Vetëm afat,Frutex', '6. telefoni Furnizuesit e rinj: më i riu në krye (afati pa barkod, importi)', ftp);
  await telFaqe(tel, 'stProduktet');
  const pt = await emrat(tel, '#kujtesaLista');
  // v238: "Me furnitor" Stoku e mësoi vetë nga stoku (s'u kontrollua kurrë): ndryshimi në PC e lë në pritje
  ok(pt.slice(0, 2).join() === 'Pa furnitor,Produkt me furnitor' && !pt.includes('Me furnitor'), '6. telefoni Produktet: të ruajturat e fundit në krye (nga PC)', pt.slice(0, 5));
  await tel.click('#opsPrapa'); await tel.waitForTimeout(300); await tel.click('#stPritje'); await tel.waitForTimeout(300);
  const ptp = await emrat(tel, '#kujPritjeLista');
  ok(ptp[0] === 'Tel pa furnitor' && ptp[1] === 'Tel me furnitor' && ptp.includes('Me furnitor'), '6. telefoni Produktet e reja: të shtuarat e fundit në krye (v238: edhe i mësuari vetë)', ptp.slice(0, 5));
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();

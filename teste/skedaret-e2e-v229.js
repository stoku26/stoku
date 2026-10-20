// v229: "Eksporto në Excel/PDF" → zgjedhja "Dërgo në PC" ose "Shkarko këtu" për të gjithë (jo vetëm PDA) → PC: "Shkarko"
const { chromium } = require('./pw.js');
const fs = require('fs'), path = require('path');
const { krijoFirestore } = require('./fs-server.js');
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
  [['3800123456789', 'Ujë Rugove 0.5L', 12], ['3800000000017', 'Lëng portokalli 1L', 4], ['5449000000996', 'Coca-Cola 0.33L', 30]].forEach(([b, e, s], i) => { p['pije::' + b] = { barkodi: b, emri: e, sasia: s, kategoriaId: 'pije', prekurSe: t - i }; });
  localStorage.setItem('stoku:produktet:v2', JSON.stringify(p));
};
const docsSkedaret = F => [...F.S.docs.keys()].filter(k => /^dyqane\/u1\/skedaret\/[^/]+$/.test(k)).map(k => Object.assign({ id: k.split('/').pop() }, F.S.docs.get(k)));
const copat = (F, id) => [...F.S.docs.keys()].filter(k => k.startsWith('dyqane/u1/skedaret/' + id + '/pjeset/'));
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
const dritarja = p => p.evaluate(() => { const d = document.getElementById('dlgKuSkedari'); const v = id => { const e = document.getElementById(id); return e && e.style.display !== 'none' && !e.hidden; };
  return { hapur: d.classList.contains('hapur'), titulli: document.getElementById('ksTitulli').textContent, statusi: document.getElementById('ksStatusi').textContent, klasa: document.getElementById('ksStatusi').className,
    pc: v('ksPc') ? document.getElementById('ksPc').textContent.trim() : null, pcAktiv: !document.getElementById('ksPc').disabled, ketu: v('ksKetu'), hint: document.getElementById('ksHint').textContent, anulo: document.getElementById('ksAnulo').textContent }; });

(async () => {
  const F = krijoFirestore();
  const t0 = Date.now(), d = n => new Date(t0 + n * 864e5).toISOString().slice(0, 10);
  const b = await chromium.launch();
  // ---------------- Telefoni i zakonshëm (jo PDA) ----------------
  const ctxT = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, acceptDownloads: true });
  await rrugetE(ctxT);
  await F.lidh(ctxT, 'u1', 'agim@stoku-app.local', 'tel', { afatet: [
    { id: 'a1', barkodi: '1', emri: 'Kos', data: d(3), sasia: 5, furnizuesi: 'Meridian', statusi: 'aktiv', ndryshuarSe: t0 },
    { id: 'a2', barkodi: '2', emri: 'Bukë', data: d(4), sasia: 1, furnizuesi: 'Vipa', statusi: 'aktiv', ndryshuarSe: t0 }] });
  await ctxT.addInitScript(FARA);
  const t = await ctxT.newPage();
  const gabT = []; t.on('pageerror', e => gabT.push(e.message));
  let shkarkimeT = 0; t.on('download', () => shkarkimeT++);
  await t.goto(B + '/index.html'); await t.waitForTimeout(2500);
  ok(!(await t.$('#opsSkedaretPc')), 'tel: s\'ka çelës te Cilësimet (zgjedhja bëhet te butoni)');
  await t.evaluate(() => { const k = [...document.querySelectorAll('.folder-karta')].find(x => /Pije/.test(x.textContent)); k.click(); });
  await t.waitForTimeout(500);
  ok((await t.textContent('#btnEksport')) === 'Eksporto në Excel' && (await t.textContent('#btnEksportPdf')) === 'Eksporto në PDF', 'tel: butonat si më parë ("Eksporto në Excel/PDF")');

  // 1. Excel → dritarja me dy zgjedhjet
  await t.click('#btnEksport'); await t.waitForTimeout(300);
  let dr = await dritarja(t);
  ok(dr.hapur && dr.titulli === 'Excel-i është gati' && /^malli_pije_\d{4}-\d\d-\d\d_\d{4}\.xlsx \(\d+ KB\)$/.test(dr.statusi), '1. dritarja: "Excel-i është gati" + emri dhe madhësia', dr);
  ok(dr.pc === 'Dërgo në PC' && dr.pcAktiv && dr.ketu && /Përmbledhja/.test(dr.hint) && dr.anulo === 'Anulo', '1. "Dërgo në PC" + "Shkarko këtu" + shpjegimi', dr);
  ok(shkarkimeT === 0 && docsSkedaret(F).length === 0, '1. asgjë s\'ndodh pa zgjedhur');
  await t.screenshot({ path: __dirname + '/v229-dritarja.png' });
  // 2. "Dërgo në PC"
  await t.click('#ksPc');
  ok(await prit(() => docsSkedaret(F).length === 1), '2. "Dërgo në PC": skedari në cloud');
  ok(await prit(async () => (await dritarja(t)).titulli === 'U dërgua në PC'), '2. dritarja: "U dërgua në PC"', (await dritarja(t)).statusi);
  ok(await prit(async () => !(await dritarja(t)).hapur, 4000), '2. dritarja mbyllet vetë');
  let doc = docsSkedaret(F)[0];
  ok(doc.pajisja === 'Telefoni' && doc.titulli === 'Malli' && /^malli_pije_/.test(doc.emri) && copat(F, doc.id).length === doc.pjeset, '2. të dhënat: "Telefoni", "Malli", copat e plota', { emri: doc.emri, pajisja: doc.pajisja, pjeset: doc.pjeset });
  ok(shkarkimeT === 0, '2. s\'shkarkohet në telefon');
  // 3. "Shkarko këtu" → si më parë
  await t.click('#btnEksport'); await t.waitForTimeout(300);
  const [dl1] = await Promise.all([t.waitForEvent('download', { timeout: 8000 }).catch(() => null), t.click('#ksKetu')]);
  ok(!!dl1 && /^malli_pije_.*\.xlsx$/.test(dl1.suggestedFilename()) && docsSkedaret(F).length === 1, '3. "Shkarko këtu": shkarkohet në telefon, s\'shkon në PC', dl1 && dl1.suggestedFilename());
  ok(!(await dritarja(t)).hapur, '3. dritarja mbyllet');
  // 4. "Anulo" → asgjë
  const sh0 = shkarkimeT;
  await t.click('#btnEksport'); await t.waitForTimeout(300);
  await t.click('#ksAnulo'); await t.waitForTimeout(500);
  ok(!(await dritarja(t)).hapur && shkarkimeT === sh0 && docsSkedaret(F).length === 1, '4. "Anulo": asgjë s\'shkarkohet e s\'dërgohet');
  // 5. PDF → "PDF-ja është gati" → "Dërgo në PC"
  await t.click('#btnEksportPdf');
  ok(await prit(async () => (await dritarja(t)).titulli === 'PDF-ja është gati', 15000), '5. PDF: "PDF-ja është gati"', (await dritarja(t)).statusi);
  await t.click('#ksPc');
  ok(await prit(() => docsSkedaret(F).some(x => x.lloji === 'pdf' && x.titulli === 'Etiketa'), 10000), '5. PDF-ja në cloud (Etiketa)');
  ok(await prit(async () => !(await t.isDisabled('#btnEksportPdf')), 6000), '5. butoni i PDF-së aktivizohet sërish pas dritares');
  // 6. Afatet → Excel → dritarja → "Dërgo në PC" (nga faqja kryesore, ku duken tabet)
  await t.goto(B + '/index.html'); await t.waitForTimeout(2000);
  await t.click('#btnAfatet'); await t.waitForTimeout(500);
  await t.click('#afExcel'); await t.waitForTimeout(200); await t.click('#afEksporto'); await t.waitForTimeout(300);
  await t.click('#axEksporto');
  ok(await prit(async () => (await dritarja(t)).hapur && /^afatet_/.test((await dritarja(t)).statusi)), '6. Afatet: dritarja me afatet_….xlsx', (await dritarja(t)).statusi);
  await t.click('#ksPc');
  ok(await prit(() => docsSkedaret(F).some(x => /^afatet_/.test(x.emri) && x.titulli === 'Afatet')), '6. Excel-i i afateve në cloud');
  await prit(async () => !(await dritarja(t)).hapur, 4000);
  await t.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => x.classList.remove('hapur')));
  await t.goto(B + '/index.html'); await t.waitForTimeout(2000);

  // ---------------- PC ----------------
  const ctxP = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
  await rrugetE(ctxP);
  await F.lidh(ctxP, 'u1', 'agim@stoku-app.local', 'pc');
  const p = await ctxP.newPage();
  const gabP = []; p.on('pageerror', e => gabP.push(e.message));
  await p.goto(B + '/pc.html'); await p.waitForTimeout(3000);
  ok(await prit(async () => (await p.$$('#skedaretTel .fleta-tel')).length === 3), 'PC: 3 kartat te Përmbledhja');
  ok((await p.textContent('#stokTabSkedaret')).trim() === '3', 'PC: numri 3 te pllaka "Stoku"', await p.textContent('#stokTabSkedaret'));
  ok(/Ke 3 skedarë nga telefoni/.test(await p.textContent('#toastTekst')), 'PC: njoftimi "Ke 3 skedarë nga telefoni"', await p.textContent('#toastTekst'));
  const kartaExcel = p.locator('#skedaretTel .fleta-tel', { hasText: 'malli_pije_' });
  ok(/Excel nga Telefoni: malli_pije_/.test(await kartaExcel.textContent()), 'PC: karta "Excel nga Telefoni: …"', (await kartaExcel.textContent()).slice(0, 80));
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), kartaExcel.locator('button', { hasText: 'Shkarko' }).click()]);
  const fx = path.join(__dirname, 'v229-shkarkuar.xlsx'); await dl.saveAs(fx);
  const rreshtat = await p.evaluate(async (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); const sh = await window.StokuXlsx.read(u.buffer); return sh[0].rows.map(r => r.join(' | ')); }, fs.readFileSync(fx).toString('base64'));
  ok(rreshtat.some(r => /Ujë Rugove/.test(r)) && rreshtat.some(r => /Coca-Cola/.test(r)), 'PC: "Shkarko" jep Excel-in me produktet e telefonit', rreshtat.slice(0, 3));
  ok(await prit(async () => /shkarkuar/.test(await kartaExcel.getAttribute('class')) && (await p.textContent('#stokTabSkedaret')).trim() === '2'), 'PC: "U shkarkua", numri 2');
  await p.screenshot({ path: __dirname + '/v229-pc.png' });
  // Skedar i ri ndërsa PC-ja është e hapur → njoftim me "Shkarko"
  await t.evaluate(() => { const k = [...document.querySelectorAll('.folder-karta')].find(x => /Pije/.test(x.textContent)); k.click(); });
  await t.waitForTimeout(400);
  await t.click('#btnEksport'); await t.waitForTimeout(300); await t.click('#ksPc');
  ok(await prit(async () => /Mbërriti nga Telefoni: malli_pije_/.test(await p.textContent('#toastTekst'))), 'PC: "Mbërriti nga Telefoni: …"', await p.textContent('#toastTekst'));
  const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.click('#toastBtn')]);
  ok(/^malli_pije_/.test(dl2.suggestedFilename()), 'PC: "Shkarko" te njoftimi', dl2.suggestedFilename());
  // Fshi PDF-në
  const pdf = docsSkedaret(F).find(x => x.lloji === 'pdf');
  await p.locator('#skedaretTel .fleta-tel', { hasText: 'etiketa_' }).locator('button', { hasText: 'Fshi' }).click();
  await p.waitForTimeout(200); await p.click('#kfPo');
  ok(await prit(() => !docsSkedaret(F).some(x => x.id === pdf.id) && copat(F, pdf.id).length === 0), 'PC: "Fshi" e heq PDF-në me krejt copat');

  // ---------------- Rastet e tjera në telefon ----------------
  await prit(async () => !(await dritarja(t)).hapur, 4000);
  // 7. Pa internet: gabim në dritare, pastaj "Shkarko këtu"
  await ctxT.setOffline(true);
  await t.click('#btnEksport'); await t.waitForTimeout(300); await t.click('#ksPc'); await t.waitForTimeout(400);
  dr = await dritarja(t);
  ok(dr.hapur && /gabim/.test(dr.klasa) && /internetin/.test(dr.statusi) && dr.pc === 'Provo sërish në PC' && dr.ketu, '7. pa internet: gabimi + "Provo sërish në PC" + "Shkarko këtu"', dr);
  const [dl3] = await Promise.all([t.waitForEvent('download', { timeout: 8000 }).catch(() => null), t.click('#ksKetu')]);
  ok(!!dl3, '7. "Shkarko këtu" pas gabimit e shkarkon në telefon');
  await ctxT.setOffline(false);
  // 8. Rregullat ende pa u publikuar
  F.S.paSkedare = true;
  await t.click('#btnEksport'); await t.waitForTimeout(300); await t.click('#ksPc');
  ok(await prit(async () => /rregullat/.test((await dritarja(t)).statusi)), '8. rregullat pa u publikuar: "rregullat duhet të përditësohen"', (await dritarja(t)).statusi);
  await t.click('#ksAnulo'); F.S.paSkedare = false;
  ok(![...F.S.docs.keys()].some(k => /skedaret\/[^/]+\/pjeset\//.test(k) && !F.S.docs.has(k.split('/pjeset/')[0])), '8. s\'mbeten copa pa skedar');
  // 9. PDA: e njëjta dritare (jo dërgim automatik), pajisja "PDA"
  await t.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = true; c.dispatchEvent(new Event('change')); });
  await t.waitForTimeout(300);
  const n9 = docsSkedaret(F).length;
  await t.click('#btnEksport'); await t.waitForTimeout(300);
  ok((await dritarja(t)).hapur && docsSkedaret(F).length === n9, '9. PDA: edhe aty del zgjedhja (s\'dërgohet vetë)');
  await t.click('#ksPc');
  ok(await prit(() => docsSkedaret(F).some(x => x.pajisja === 'PDA')), '9. PDA: "Dërgo në PC" me pajisjen "PDA"');
  // 10. "Mbyll" gjatë dërgimit: rezultati del si njoftim
  await prit(async () => !(await dritarja(t)).hapur, 4000);
  await t.evaluate(() => { const fs = window.__fsTest, o = fs.setDoc; window.__setDocOrig = o; fs.setDoc = async (...a) => { await new Promise(r => setTimeout(r, 700)); return o(...a); }; });
  await t.click('#btnEksport'); await t.waitForTimeout(300);
  await t.click('#ksPc'); await t.waitForTimeout(150);
  const gjatë = await dritarja(t);
  ok(gjatë.titulli === 'Duke e dërguar në PC…' && gjatë.anulo === 'Mbyll' && !gjatë.ketu && gjatë.pc === null, '10. gjatë dërgimit: "Duke e dërguar në PC…" + vetëm "Mbyll"', gjatë);
  const n10 = docsSkedaret(F).length;
  await t.click('#ksAnulo');
  ok(!(await dritarja(t)).hapur, '10. "Mbyll" e mbyll dritaren menjëherë');
  ok(await prit(async () => /U dërgua në PC/.test(await t.textContent('#toast'))), '10. dërgimi vazhdon dhe del njoftimi "U dërgua në PC"', await t.textContent('#toast'));
  ok(docsSkedaret(F).length === n10 + 1, '10. skedari arriti në cloud');
  await t.evaluate(() => { window.__fsTest.setDoc = window.__setDocOrig; });
  ok(!gabT.length, 'tel: pa gabime në faqe', gabT);
  ok(!gabP.length, 'PC: pa gabime në faqe', gabP);
  await ctxT.close(); await ctxP.close();

  // ---------------- Vizitori ----------------
  const ctxV = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, acceptDownloads: true });
  await rrugetE(ctxV);
  await ctxV.addInitScript(() => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => null, token: async () => 't', merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {}, hyr: async () => ({ ok: false }), regjistrohu: async () => ({ ok: false }) };
  });
  const v = await ctxV.newPage();
  const gabV = []; v.on('pageerror', e => gabV.push(e.message));
  await v.goto(B + '/index.html'); await v.waitForTimeout(1200);
  await v.click('#pkVizitor'); await v.waitForTimeout(2000);
  await v.click('.folder-karta >> nth=0'); await v.waitForTimeout(500);
  await v.click('#btnEksport'); await v.waitForTimeout(300);
  dr = await dritarja(v);
  ok(dr.hapur && !dr.pcAktiv && /duhet llogari/.test(dr.hint), 'vizitor: "Dërgo në PC" i çaktivizuar, "duhet llogari"', dr);
  await v.screenshot({ path: __dirname + '/v229-vizitor.png' });
  const [dl5] = await Promise.all([v.waitForEvent('download', { timeout: 8000 }).catch(() => null), v.click('#ksKetu')]);
  ok(!!dl5, 'vizitor: "Shkarko këtu" punon', dl5 && dl5.suggestedFilename());
  ok(!gabV.length, 'vizitor: pa gabime në faqe', gabV);
  await b.close();
  console.log(g ? '✖ ' + g + ' GABIME' : '✔ Krejt në rregull');
})();

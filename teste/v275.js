// v275: pronari: "qaty te qaj butoni eksporto, bone edhe me i eksportu afatet krejt qka i ke skenu ose te ni muaji te caktum etj me pas
// opsione tjera, me i eksportu ne pdf file per me printu ... veq ne white mode". Zgjodhi "ideja 1" (tabela) dhe opsionet "A" (rreshta);
// "te periudha kur osht e selektume per krejt mujt leje me thon 'te gjitha' jo krejt".
//  1) menuja "Excel" te Afatet: Importo Excel, Eksporto Excel, Eksporto PDF, Eksporto si foto;
//  2) dritarja "PDF për printim": katër rreshta (Periudha "Të gjitha", Gjendja, Furnizuesi, Renditja) me zgjedhjet dhe numrat;
//  3) zgjedhjet ndryshojnë sa afate dhe sa faqe; pa afate "Krijo PDF-në" s'punon;
//  4) PDF-ja: A4; faqja 1 ("koka 1"): logoja e vogël, data djathtas (pa "Printuar"), "Lista e afateve" në mes, poshtë
//     "Periudha: Të gjitha · 11 produkte · 80 copë"; faqet e tjera me kokë të ngushtë; "Faqja 1 nga 1"; pa kolonën "Gjendja" (pronari: "nuk i duhet se
//     ... del diferenc ditore"); me një muaj: emri i muajit dhe i skedarit;
//  5) shumë afate: disa faqe ("Faqja 3 nga 3"), koka e tabelës në çdo faqe;
//  6) pa lejen "eksportPdf": s'del opsioni;
//  7) versionet.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const L = require('../lejet.js');
const fs = require('fs');
const PORTI = process.env.PORTI || '8765';
const NM = __dirname + '/npm/node_modules';
const CDN = { 'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js' };
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
const sot = new Date(), dita = sot.getFullYear() + '-' + String(sot.getMonth() + 1).padStart(2, '0') + '-' + String(sot.getDate()).padStart(2, '0');

function teDhenat(n) {
  const A = [];
  const shto = (emri, f, dn, s, st) => A.push({ id: 'a' + A.length, emri, barkodi: '38900100' + String(1000 + A.length), data: d(dn), sasia: s, furnizuesi: f,
    statusi: st || 'aktiv', krijuarSe: t - 9e6, ndryshuarSe: t - 9e6 });
  if (n) { for (let i = 0; i < n; i++) shto('Produkti ' + (i + 1), i % 2 ? 'Agro Fresh' : 'Meridian Group', i - 5, i + 1); return A; }
  [['Kos 500g', -2, 3], ['Ajran 250ml', -1, 8], ['Qumësht i freskët 1L', 0, 6], ['Djathë i bardhë 400g', 2, 2], ['Jogurt me dredhëz 150g', 4, 12],
    ['Gjalpë 250g', 38, 10], ['Kaçkavall 300g', 66, 7]].forEach(([e, dn, s]) => shto(e, 'Meridian Group', dn, s));
  shto('Kos i hequr', 'Meridian Group', -5, 1, 'hequr');
  shto('Lëng portokalli 1L', 'Agro Fresh', 5, 6); shto('Ujë 0.5L', 'Agro Fresh', 40, 24); shto('Çaj i ftohtë', 'Agro Fresh', -3, '');
  shto('Bukë', '', 1, 2);
  return A;
}

async function faqe(b, af) {
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => {
    const emri = Object.keys(CDN).find(k => r.request().url().endsWith(k));
    if (emri) return r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(CDN[emri]) });
    return r.abort();
  });
  await ctx.addInitScript(af => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
      degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
    localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
    localStorage.setItem('stoku:afatet:v1', JSON.stringify(af));
    window.__ndare = null;
    navigator.canShare = x => !!(x && x.files && x.files.length);
    navigator.share = async x => { window.__ndare = { title: x.title, files: x.files }; };
  }, af);
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:madhesia:v296', '1'); const o = JSON.parse(localStorage.getItem('stoku:opsione:v1') || '{}'); if (!o.madhesia) { o.madhesia = 'normale'; localStorage.setItem('stoku:opsione:v1', JSON.stringify(o)); } } catch (e) {} }); // v296: zoom 1 ("E madhe"), si kur u shkrua testi
  const p = await ctx.newPage();
  p.__gab = [];
  p.on('pageerror', e => p.__gab.push(e.message));
  await p.goto('http://127.0.0.1:' + PORTI + '/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
  await p.click('#btnAfatet'); await p.waitForTimeout(800);
  return { p, ctx };
}
const dritarja = p => p.evaluate(() => ({ hapur: document.getElementById('dlgAfPdf').classList.contains('hapur'), nen: document.getElementById('apNen').textContent,
  rr: Array.from(document.querySelectorAll('#dlgAfPdf .ap-rresht')).filter(x => x.offsetParent).map(x => x.querySelector('.ap-em').textContent + '=' + x.querySelector('.ap-v').textContent),
  ops: Object.fromEntries(['apPeriudha', 'apGjendja', 'apFurn', 'apRend'].map(id => [id, Array.from(document.getElementById(id).options).map(o => o.textContent)])),
  pa: document.getElementById('apKrijo').disabled }));
// Krijo → "Shkarko këtu" (ose direkt) → skedari i ndarë: emri, lloji, teksti i PDF-së (latin1)
async function krijo(p) {
  await p.click('#apKrijo'); await p.waitForTimeout(800);
  if (await p.evaluate(() => document.getElementById('dlgKuSkedari').classList.contains('hapur'))) { await p.click('#ksKetu'); await p.waitForTimeout(800); }
  return p.evaluate(async () => {
    const n = window.__ndare; if (!n) return null;
    const f = n.files[0], b = new Uint8Array(await f.arrayBuffer());
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    let b64 = ''; for (let i = 0; i < b.length; i += 0x8000) b64 += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return { emri: f.name, lloji: f.type, madh: f.size, tekst: s, b64: btoa(b64) };
  });
}
const faqet = s => (s.match(/\/Type \/Page[^s]/g) || []).length;

(async () => {
  const b = await chromium.launch();

  // ===== 1–4 =====
  {
    const { p, ctx } = await faqe(b, teDhenat());
    await p.click('#afExcel'); await p.waitForTimeout(200);
    const menu = await p.evaluate(() => Array.from(document.querySelectorAll('#afExcelMenu .sb-menu__item')).filter(x => x.offsetParent).map(x => x.textContent.trim()));
    ok(menu.join() === 'Eksporto Excel,Eksporto PDF,Eksporto si foto', '1. menuja "Eksporto" me "Eksporto PDF" (v277: pa importin)', menu);
    await p.click('#afEksPdf'); await p.waitForTimeout(400);
    let dr = await dritarja(p);
    ok(dr.hapur && dr.rr.join(' | ') === 'Periudha=Të gjitha | Gjendja=Të gjitha | Furnizuesi=Të gjithë | Renditja=Sipas datës', '2. katër rreshtat, Periudha "Të gjitha" (jo "Krejt")', dr.rr);
    ok(dr.nen === '11 afate · 1 faqe A4' && !dr.pa, '2. 11 afate aktive, 1 faqe', dr.nen);
    ok(dr.ops.apGjendja.join() === 'Të gjitha (11),Të skaduara (3),Afër skadimit (5),Në rregull (3),Të hequra (1)', '2. Gjendja me numrat', dr.ops.apGjendja);
    ok(dr.ops.apFurn.join() === 'Të gjithë,Agro Fresh (3),Meridian Group (7),Pa furnizues (1)' && dr.ops.apRend.join() === 'Sipas datës,Sipas furnizuesit,Sipas emrit', '2. Furnizuesi dhe Renditja', [dr.ops.apFurn, dr.ops.apRend]);
    ok(dr.ops.apPeriudha[0] === 'Të gjitha' && dr.ops.apPeriudha.length >= 3, '2. Periudha: "Të gjitha" + muajt', dr.ops.apPeriudha);
    const st = await p.evaluate(() => { const r = document.querySelector('#dlgAfPdf .ap-rresht'), s = r.querySelector('select'), x = r.getBoundingClientRect(), y = s.getBoundingClientRect();
      return { h: Math.round(x.height), mbulon: Math.abs(x.width - y.width) < 1 && Math.abs(x.height - y.height) < 1, op: getComputedStyle(s).opacity }; });
    ok(st.h >= 56 && st.mbulon && st.op === '0', '2. secili rresht hap zgjedhjen (lista e padukshme mbulon krejt rreshtin)', st);
    // 3. Gjendja + furnizuesi ndryshojnë numrin
    await p.selectOption('#apGjendja', 'skaduar'); await p.waitForTimeout(100);
    dr = await dritarja(p);
    ok(dr.nen === '3 afate · 1 faqe A4' && dr.rr[1] === 'Gjendja=Të skaduara', '3. "Të skaduara": 3 afate', dr);
    await p.selectOption('#apFurn', { label: 'Agro Fresh (1)' }); await p.waitForTimeout(100);
    dr = await dritarja(p);
    ok(dr.nen === '1 afat · 1 faqe A4' && dr.rr[2] === 'Furnizuesi=Agro Fresh', '3. + "Agro Fresh": 1 afat', dr);
    await p.selectOption('#apGjendja', 'ok'); await p.waitForTimeout(100);
    dr = await dritarja(p);
    ok(dr.nen === '1 afat · 1 faqe A4' && dr.rr[2] === 'Furnizuesi=Agro Fresh', '3. "Në rregull" + Agro Fresh: 1 (Ujë)', dr);
    await p.click('#apAnulo'); await p.waitForTimeout(200);
    // 4. PDF-ja me "Të gjitha"
    await p.click('#afExcel'); await p.click('#afEksPdf'); await p.waitForTimeout(300);
    dr = await dritarja(p);
    ok(dr.nen === '11 afate · 1 faqe A4' && dr.rr[0] === 'Periudha=Të gjitha', '4. hapet sërish me zgjedhjet fillestare', dr.nen);
    const f = await krijo(p);
    ok(f && f.emri === 'afatet_' + dita + '.pdf' && f.lloji === 'application/pdf' && f.tekst.startsWith('%PDF'), '4. PDF-ja (emri, lloji)', f && [f.emri, f.lloji]);
    ok(faqet(f.tekst) === 1 && /\(Lista e afateve\)/.test(f.tekst) && /\(Periudha: \)/.test(f.tekst) && /\(T\xeb gjitha\)/.test(f.tekst) && /\(11\)/.test(f.tekst) && /\( produkte\)/.test(f.tekst) && /\(80\)/.test(f.tekst) && !/Printuar/.test(f.tekst) && /\(Faqja 1 nga 1\)/.test(f.tekst), '4. 1 faqe: "Lista e afateve", "Periudha: Të gjitha", "Faqja 1 nga 1"');
    ok(/\(Kos 500g\)/.test(f.tekst) && /\(Kaçkavall 300g\)/.test(f.tekst.replace(/\xe7/g, 'ç')) && !/Kos i hequr/.test(f.tekst) && /\(SKADON\)/.test(f.tekst) && /\(FURNIZUESI\)/.test(f.tekst),
      '4. rreshtat (pa të hequrin), kolonat deri te "SKADON"');
    ok(!/GJENDJA|Ka skaduar|Para 2 dit|\(Dje\)|\(Sot\)/.test(f.tekst), '4. pa kolonën "Gjendja" dhe pa legjendën (pronari: ditët s\'vlejnë të nesërmen)');
    fs.writeFileSync(__dirname + '/v275-te-gjitha.pdf', Buffer.from(f.b64, 'base64'));
    // Me një muaj
    await p.evaluate(() => { window.__ndare = null; });
    await p.click('#afExcel'); await p.click('#afEksPdf'); await p.waitForTimeout(300);
    const muaji = await p.evaluate(() => { const o = document.getElementById('apPeriudha').options[1]; return { v: o.value, t: o.textContent.replace(/\s*\(\d+\)$/, '') }; });
    await p.selectOption('#apPeriudha', muaji.v); await p.waitForTimeout(100);
    const f2 = await krijo(p);
    const slug = muaji.t.toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '_');
    ok(f2 && f2.emri === 'afatet_' + slug + '_' + dita + '.pdf' && f2.tekst.includes('(' + muaji.t.replace(/ë/g, '\xeb') + ')'), '4. me një muaj: emri i muajit te Periudha dhe te skedari', f2 && [f2.emri, muaji.t]);
    ok(!p.__gab.length, '4. pa gabime JS', p.__gab);
    await ctx.close();
  }

  // ===== 5. Shumë afate: disa faqe =====
  {
    const { p, ctx } = await faqe(b, teDhenat(80));
    await p.click('#afExcel'); await p.click('#afEksPdf'); await p.waitForTimeout(300);
    const dr = await dritarja(p);
    ok(dr.nen === '80 afate · 3 faqe A4', '5. 80 afate · 3 faqe', dr.nen);
    const f = await krijo(p);
    ok(f && faqet(f.tekst) === 3 && /\(Faqja 1 nga 3\)/.test(f.tekst) /* v300: fundi vetëm te faqja 1 */ && /\(Periudha: \)/.test(f.tekst) && /\(80\)/.test(f.tekst) && /\(3240\)/.test(f.tekst) /* v299: të dhënat vetëm te faqja 1 */ && (f.tekst.match(/\(PRODUKTI\)/g) || []).length === 3 && /\(Produkti 80\)/.test(f.tekst), '5. 3 faqe, koka e tabelës në secilën, i fundit "Produkti 80"',
      f && { faqe: faqet(f.tekst), koka: (f.tekst.match(/\(PRODUKTI\)/g) || []).length });
    fs.writeFileSync(__dirname + '/v275-shume.pdf', Buffer.from(f.b64, 'base64'));
    ok(!p.__gab.length, '5. pa gabime JS', p.__gab);
    await ctx.close();
  }
  await b.close();

  // ===== 6. Pa lejen e PDF-së =====
  {
    const { b: b2, p } = await hapFaqen(chromium, { uid: 'uB', emri: 'besa', lejet: Object.assign(L.krejt(true), { eksportPdf: false }) });
    await p.waitForTimeout(500);
    const v = await p.evaluate(() => { const e = document.getElementById('afEksPdf'); return { ndaluar: e.classList.contains('leja-ndaluar'), display: getComputedStyle(e).display }; });
    ok(v.ndaluar && v.display === 'none', '6. pa lejen "eksportPdf": s\'del "Eksporto PDF"', v);
    const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 275 && nr(/app-tel\.js\?v=(\d+)/) >= 275 && nr(/teRejat\.js\?v=(\d+)/) >= 275, '7. CACHE, app-tel, teRejat ≥ 275');
    const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
    ok(/\{ v: 275,[^\n]*platforma: 'tel'/.test(tr), '7. teRejat v275 (telefon)');
    await b2.close();
  }
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

// v301 (pronari, foto e PC-së): "Butoni excel qe osht ne pc bone identik edhe emertoje eksporto sikur ne web app tel qe osht me qato
// opsione". PC: butoni "Eksporto" → menyja Eksporto Excel / Eksporto PDF / Eksporto si foto; PDF-ja dhe fotoja si te telefoni
// (eksportet.js i përbashkët). Ndihmësit e v275.js (afatet shembull), faqja pc.html.
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
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
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
  await p.goto('http://127.0.0.1:' + PORTI + '/pc.html#/afatet');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
  return { p, ctx };
}
const shkarkimi = async (p, fn) => { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), fn()]);
  if (!d) return null; const f = await d.path(); return { emri: d.suggestedFilename(), b: fs.readFileSync(f) }; };
(async () => {
  const b = await chromium.launch();
  const { p } = await faqe(b, teDhenat());
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => x.classList.remove('hapur')));
  const tx = (await p.textContent('#afBtnExcel')).trim();
  ok(tx === 'Eksporto', '1. butoni quhet "Eksporto"', tx);
  const ik = await p.evaluate(() => [...document.querySelectorAll('#afBtnImport svg path, #afBtnExcel svg path')].map(x => x.getAttribute('d')).join('|'));
  ok(/M12 3v12M7 10l5 5 5-5/.test(ik) && /M12 15V3M7 8l5-5 5 5/.test(ik), '1. ikonat si te telefoni: "Importo" shigjeta poshtë, "Eksporto" shigjeta lart', ik);
  await p.click('#afBtnExcel'); await p.waitForTimeout(300);
  const menu = await p.$$eval('#menu.hapur button', l => l.map(x => x.textContent.trim()));
  ok(menu.join() === 'Eksporto Excel,Eksporto PDF,Eksporto si foto', '1. menyja si te telefoni', menu);
  await p.screenshot({ path: __dirname + '/v301-menu.png' });
  // Excel: dritarja e vjetër e eksportit
  await p.click('#menu button:has-text("Eksporto Excel")'); await p.waitForTimeout(400);
  const hapurE = await p.evaluate(() => [...document.querySelectorAll('.mbulese.hapur')].map(x => x.id));
  ok(hapurE.length === 1, '2. "Eksporto Excel" hap eksportin e Excel-it', hapurE);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => x.classList.remove('hapur')));
  // PDF
  await p.click('#afBtnExcel'); await p.click('#menu button:has-text("Eksporto PDF")'); await p.waitForTimeout(400);
  const ap = await p.evaluate(() => ({ hapur: document.getElementById('dlgAfPdf').classList.contains('hapur'), nen: document.getElementById('apNen').textContent,
    gj: [...document.getElementById('apGjendja').options].map(o => o.textContent), r: [...document.getElementById('apRend').options].map(o => o.textContent),
    per: document.getElementById('apPeriudha').options[0].textContent }));
  ok(ap.hapur && ap.nen === '11 afate · 1 faqe A4' && ap.gj[0] === 'Të gjitha (11)' && ap.r.join() === 'Sipas datës,Sipas furnizuesit,Sipas emrit' && ap.per === 'Të gjitha',
    '3. "PDF për printim": Periudha, Gjendja, Furnizuesi, Renditja si te telefoni', ap);
  await p.screenshot({ path: __dirname + '/v301-pdf.png' });
  await p.selectOption('#apGjendja', 'skaduar'); await p.waitForTimeout(150);
  ok(await p.textContent('#apNen') === '3 afate · 1 faqe A4', '3. zgjedhja ndryshon numrin', await p.textContent('#apNen'));
  const pdf = await shkarkimi(p, () => p.click('#apKrijo'));
  const s = pdf && pdf.b.toString('latin1');
  ok(pdf && /^afatet_\d{4}-\d{2}-\d{2}\.pdf$/.test(pdf.emri) && /^%PDF/.test(s) && /\(Lista e afateve\)/.test(s) && /\(Kos 500g\)/.test(s) && !/\(Gjalp/.test(s) && /\(COP\xcb\)/.test(s),
    '3. PDF-ja shkarkohet: vetëm të skaduarat, e njëjta faqe si te telefoni', pdf && pdf.emri);
  // Foto
  await p.click('#afBtnExcel'); await p.click('#menu button:has-text("Eksporto si foto")'); await p.waitForTimeout(400);
  const af = await p.evaluate(() => ({ hapur: document.getElementById('dlgAfEksFoto').classList.contains('hapur'), nen: document.getElementById('aefNen').textContent,
    rr: [...document.querySelectorAll('#aefLista .aef-rresht')].map(r => r.textContent), et: [...document.querySelectorAll('#aefLista .aef-etiketa')].map(e => e.textContent),
    krijo: document.getElementById('aefKrijo').disabled }));
  ok(af.hapur && af.nen === 'Një foto për secilin furnizues.' && af.rr.length === 3 && af.et[0] === 'Me afate të skaduara' && af.krijo, '4. "Eksporto si foto": furnizuesit, me të skaduarat lart', af);
  await p.click('#aefKrejt'); await p.waitForTimeout(100);
  ok(await p.textContent('#aefKrijoT') === 'Krijo 3 foto', '4. "Të gjithë" → "Krijo 3 foto" (bashkë me "Pa furnizues")');
  await p.screenshot({ path: __dirname + '/v301-foto.png' });
  const shk = [];
  p.on('download', d => shk.push(d.suggestedFilename()));
  await p.click('#aefKrijo'); await p.waitForTimeout(2500);
  ok(shk.length === 3 && shk.every(x => /^afatet_.+_\d{4}-\d{2}-\d{2}\.jpg$/.test(x)), '4. tri foto JPG shkarkohen', shk);
  ok(!p.__gab.length, '5. pa gabime JS', p.__gab);
  await b.close();
  const sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8'), pc = fs.readFileSync(__dirname + '/../pc.html', 'utf8'), ix = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  ok(/eksportet\.js\?v=\d+/.test(sw) && /eksportet\.js\?v=\d+/.test(pc) && /eksportet\.js\?v=\d+/.test(ix), '6. eksportet.js te sw.js, pc.html, index.html');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

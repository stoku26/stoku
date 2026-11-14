// v299 (pronari, foto e PDF-së së afateve, faqja 2): "qato duhet mos mu kon ne faqe tjera ... veq te faqja e par" (logoja, "Lista e
// afateve", "Periudha … produkte … copë") dhe "cope ... qoje pak ma ntmajt se osht shum afer skadon". Faqet 2+ nisin me kokën e tabelës
// (36 rreshta), kolona COPË më majtas. Android: EksportiPdf.kt (Hyrja 61). Ndihmësit e njëjtë me teste/v275.js.
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
  const { p } = await faqe(b, teDhenat(80));
  await p.click('#afExcel'); await p.click('#afEksPdf'); await p.waitForTimeout(300);
  const dr = await dritarja(p);
  ok(dr.nen === '80 afate · 3 faqe A4', '1. 80 afate · 3 faqe', dr.nen);
  const f = await krijo(p);
  const s = f.tekst;
  const sa = rx => (s.match(rx) || []).length;
  ok(faqet(s) === 3 && sa(/\(Lista e afateve\)/g) === 1 && sa(/\(Periudha: /g) === 1 && sa(/\(PRODUKTI\)/g) === 3,
    '2. "Lista e afateve" dhe "Periudha" vetëm në faqen 1; koka e tabelës në të 3 faqet', { faqe: faqet(s), titulli: sa(/\(Lista e afateve\)/g), periudha: sa(/\(Periudha: /g), koka: sa(/\(PRODUKTI\)/g) });
  ok(/\(Produkti 70\)/.test(s) && /\(Produkti 80\)/.test(s) && /\(Faqja 1 nga 3\)/.test(s), '3. 33 + 37 + 10 rreshta (v300)');
  const x = t => { const m = s.match(new RegExp('([0-9.]+) [0-9.]+ Td\\s*\\(' + t + '\\) Tj')); return m ? Number(m[1]) : null; };
  const xc = x('COP\xcb'), xs = x('SKADON');
  ok(xc !== null && xs !== null && xs - xc > 30, '4. "COPË" më larg nga "SKADON" (> 30 pt)', { xc, xs, dif: xs && xc ? +(xs - xc).toFixed(1) : null });
  fs.writeFileSync(__dirname + '/v299.pdf', Buffer.from(f.b64, 'base64'));
  ok(!p.__gab.length, '5. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

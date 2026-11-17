// v317 (pronari, foto e PDF-së dhe e dritares): (1) "Hiqja krejt qeto mos le kurgjo ne fund te fletave te eksportume si pdf afate";
// (2) "gjeje arsyjen pse pdf e web appit ntel ka ma shum kb": jsPDF pa compress i shkruante faqet dhe logon pa i ngjeshur (një PDF me
// 11 afate ~660 KB), tani compress: true (~26 KB), si PdfDocument i Android-it; (3) "hiqe gjendjen qite ni opsion me mujt me eksportu
// nkohen kur jan shtu afatet ... me zgjedh dita ti vet": rreshti "Shtuar" (Të gjitha, Sot, Dje, 7/14/30 ditët e fundit, Zgjidh datat).
// Web telefon + PC + Android (EksportiPdf.kt, EksportetUI.kt, Hyrja 79).
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

const DITA = 864e5;
function teDhenat(n) {
  const A = [];
  const shto = (emri, f, dn, s, kur, st) => A.push(Object.assign({ id: 'a' + A.length, emri, barkodi: '38900100' + String(1000 + A.length), data: d(dn), sasia: s, furnizuesi: f,
    statusi: st || 'aktiv', ndryshuarSe: t - 6e4 }, kur === null ? {} : { krijuarSe: kur }));
  if (n) { for (let i = 0; i < n; i++) shto('Produkti ' + (i + 1), i % 2 ? 'Agro Fresh' : 'Meridian Group', i - 5, i + 1, t - 6e4); return A; }
  shto('Sot 1', 'Meridian Group', 3, 2, t - 6e4);
  shto('Dje 1', 'Meridian Group', 4, 3, t - DITA);
  shto('Para 5 ditesh', 'Agro Fresh', 5, 4, t - 5 * DITA);
  shto('Para 20 ditesh', 'Agro Fresh', 6, 5, t - 20 * DITA);
  shto('Para 40 ditesh', 'Agro Fresh', 7, 6, t - 40 * DITA);
  shto('Hequr sot', 'Agro Fresh', 2, 1, t - 6e4, 'hequr');
  shto('Pa kohe', 'Agro Fresh', 8, 1, null);
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
  ops: Object.fromEntries(['apPeriudha', 'apFurn', 'apRend'].map(id => [id, Array.from(document.getElementById(id).options).map(o => o.textContent)])),
  pa: document.getElementById('apKrijo').disabled }));
// Krijo → "Shkarko këtu" (ose direkt) → skedari i ndarë: emri, lloji, teksti i PDF-së (latin1)
async function krijo(p) {
  await p.click('#apKrijo'); await p.waitForTimeout(800);
  if (await p.evaluate(() => document.getElementById('dlgKuSkedari').classList.contains('hapur'))) { await p.click('#ksKetu'); await p.waitForTimeout(800); }
  const r = await p.evaluate(async () => {
    const n = window.__ndare; if (!n) return null;
    const f = n.files[0], b = new Uint8Array(await f.arrayBuffer());
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    let b64 = ''; for (let i = 0; i < b.length; i += 0x8000) b64 += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return { emri: f.name, lloji: f.type, madh: f.size, tekst: s, b64: btoa(b64) };
  });
  if (r) r.tekst = require('./pdf-tekst.js')(r.b64); // v317: PDF-ja e ngjeshur
  return r;
}

(async () => {
  // ===== 0. Kodi: pa fund, compress, lista e njëjtë web + Android =====
  const lx = f => fs.readFileSync(__dirname + '/../' + f, 'utf8');
  const K = 'vendas/app/src/main/java/site/stoku/vendas/';
  const eks = lx('eksportet.js'), pdfF = eks.split('function apPdf')[1].split('root.StokuEksportet')[0], kPdf = lx(K + 'EksportiPdf.kt'), kUi = lx(K + 'ui/EksportetUI.kt');
  ok(!/stoku\.site/.test(pdfF) && /compress: true/.test(pdfF) && /FUND: 290, FUND2: 290/.test(eks), '0. web: pa asgjë poshtë, compress: true, faqja 1 deri te 290');
  ok(!/"https:\/\/stoku\.site"/.test(kPdf) && /FUND = 290f/.test(kPdf) && !/GJENDJET/.test(kPdf + kUi), '0. Android: pa fund, pa Gjendja (v319: "Shtuar" u bë kalendar, shih v319.js)');
  const E = (() => { global.window = global; require('../afatet.js'); require('../eksportet.js'); return global.StokuEksportet; })();
  const b = await chromium.launch();
  // ===== 5. Madhësia: 80 afate (3 faqe) =====
  {
    const { p, ctx } = await faqe(b, teDhenat(80));
    await p.click('#afExcel'); await p.click('#afEksPdf'); await p.waitForTimeout(300);
    const f = await krijo(p);
    const faqet = s => (s.match(/\/Type \/Page\b(?!s)/g) || []).length;
    ok(f && faqet(f.tekst) === 3 && f.madh < 80000, '5. 80 afate: 3 faqe dhe nën 80 KB (pa compress ishte ~725 KB)', f && { faqe: faqet(f.tekst), kb: Math.round(f.madh / 1024) });
    // faqja 1 tani deri te 290: 34 rreshta (Produkti 34 te faqja 1, Produkti 35 te faqja 2)
    const faqja1 = f.tekst.split(/\/Type \/Page\b(?!s)/)[0] + '';
    ok(/\(Produkti 34\)/.test(f.tekst) && /\(Produkti 80\)/.test(f.tekst), '5. 34 + 37 + 9 rreshta');
    ok(!p.__gab.length, '5. pa gabime JS', p.__gab);
    await ctx.close();
  }
  // ===== 7. Versionet =====
  {
    const sw = lx('sw.js');
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 317 && nr(/eksportet\.js\?v=(\d+)/) >= 317 && nr(/app-tel\.js\?v=(\d+)/) >= 317 && nr(/app-pc\.js\?v=(\d+)/) >= 317, '7. CACHE dhe versionet ≥ 317');
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

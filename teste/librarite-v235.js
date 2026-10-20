// v235: libraritë e përditësuara (jsPDF 4.2.1, JsBarcode 3.12.3, barcode-detector 3.2.3 + zxing-wasm 3.1.6), me SRI:
// PC: PDF-ja (lista dhe etiketat me barkode) shkarkohet; telefoni: ZXing (wasm) e lexon barkodin e vizatuar me JsBarcode
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const NM = __dirname + '/npm/node_modules';
const CDN = { 'html5-qrcode.min.js': NM + '/html5-qrcode/html5-qrcode.min.js', 'ponyfill.js': NM + '/barcode-detector/dist/iife/ponyfill.js',
  'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js',
  'zxing_reader.wasm': NM + '/zxing-wasm/dist/reader/zxing_reader.wasm' };
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 9000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
const FARA = () => {
  if (localStorage.getItem('stoku:foldera:v1')) return;
  const t = Date.now();
  localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'pije', emri: 'Pije' }, { id: 'ushqimore', emri: 'Ushqimore' }]));
  const p = {};
  [['3800123456789', 'Ujë Rugove 0.5L', 12], ['5901234123457', 'Lëng portokalli 1L', 4]].forEach(([b, e, s], i) => { p['pije::' + b] = { barkodi: b, emri: e, sasia: s, kategoriaId: 'pije', prekurSe: t - i }; });
  localStorage.setItem('stoku:produktet:v2', JSON.stringify(p));
};
const kerkuar = [];
async function rruget(ctx) {
  await ctx.route(u => !u.href.startsWith(B), r => {
    const e = Object.keys(CDN).find(k => r.request().url().endsWith(k));
    if (e) { kerkuar.push(r.request().url()); return r.fulfill({ status: 200, contentType: e.endsWith('.wasm') ? 'application/wasm' : 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(CDN[e]) }); }
    return r.abort();
  });
}
(async () => {
  const b = await chromium.launch();
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: Date.now() });
  // ===== PC: PDF =====
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
  await rruget(ctx);
  await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'pc', { afatet: [] });
  await ctx.addInitScript(FARA);
  const p = await ctx.newPage(); const gab = [], kons = [];
  p.on('pageerror', e => gab.push(e.message)); p.on('console', m => { if (m.type() === 'error') kons.push(m.text()); });
  await p.goto(B + '/pc.html'); await p.waitForTimeout(3000);
  const v = await p.evaluate(() => ({ jspdf: window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.version, jsb: typeof window.JsBarcode }));
  ok(v.jspdf === '4.2.1' && v.jsb === 'function', 'PC: jsPDF 4.2.1 dhe JsBarcode ngarkohen (SRI)', v);
  ok(kerkuar.some(u => /jspdf@4\.2\.1/.test(u)) && kerkuar.some(u => /jsbarcode@3\.12\.3/.test(u)), 'PC: adresat e reja të CDN-së', kerkuar);
  await p.evaluate(() => { const r = [...document.querySelectorAll('.folder-rresht')].find(x => /Pije/.test(x.textContent)); r.click(); });
  await p.waitForTimeout(600);
  async function shkarko(formati) {
    await p.click('#pamjaTabela [data-eksport="pdf"]'); await p.waitForTimeout(300);
    await p.click('#ekFormatet [data-v="' + formati + '"]'); await p.waitForTimeout(150);
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#ekBtn')]);
    const s = fs.readFileSync(await d.path()); fs.writeFileSync(__dirname + '/v235-' + formati + '.pdf', s); return { emri: d.suggestedFilename(), n: s.length, tekst: s.toString('latin1') };
  }
  const L = await shkarko('pdf-lista').catch(e => ({ gabim: e.message }));
  ok(L.n > 1500 && /^%PDF-/.test(L.tekst) && /%%EOF\s*$/.test(L.tekst) && /\.pdf$/.test(L.emri), 'PC: PDF-ja (lista) shkarkohet', [L.emri, L.n, L.gabim]);
  await p.waitForTimeout(500);
  const E = await shkarko('pdf-etiketa').catch(e => ({ gabim: e.message }));
  ok(E.n > 1500 && /^%PDF-/.test(E.tekst) && /\/Subtype \/Image/.test(E.tekst || ''), 'PC: PDF-ja (etiketat me barkode) shkarkohet, me figura', [E.emri, E.n, E.gabim]);
  ok(!gab.length && !kons.some(t => /integrity|Refused/i.test(t)), 'PC: pa gabime JS / SRI', [gab, kons]);
  await ctx.close();
  // ===== Telefoni: ZXing (wasm 3.1.6) lexon barkodin =====
  const ct = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await rruget(ct);
  const t = await ct.newPage(); const gabT = [];
  t.on('pageerror', e => gabT.push(e.message));
  await t.goto(B + '/index.html'); await t.waitForTimeout(3500);
  const r = await t.evaluate(async () => {
    const api = window.BarcodeDetectionAPI;
    if (!api) return { gabim: 'pa-api' };
    await api.prepareZXingModule({ overrides: { locateFile: (s, pf) => /\.wasm$/.test(s) ? 'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.6/dist/reader/zxing_reader.wasm' : pf + s }, fireImmediately: true });
    const c = document.createElement('canvas');
    window.JsBarcode(c, '5901234123457', { format: 'EAN13', width: 3, height: 120 });
    const d = new api.BarcodeDetector({ formats: ['ean_13', 'code_128'] });
    const x = await d.detect(c);
    return { lexuar: x.map(y => y.rawValue + ':' + y.format) };
  }).catch(e => ({ gabim: e.message }));
  ok(r.lexuar && r.lexuar[0] === '5901234123457:ean_13', 'tel: ZXing 3.1.6 e lexon EAN-13 nga JsBarcode 3.12.3', r);
  ok(kerkuar.some(u => /barcode-detector@3\.2\.3/.test(u)) && kerkuar.some(u => /zxing-wasm@3\.1\.6/.test(u)), 'tel: ponyfill 3.2.3 dhe wasm 3.1.6');
  ok(!gabT.length, 'tel: pa gabime JS', gabT);
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

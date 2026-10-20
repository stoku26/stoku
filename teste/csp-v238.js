// v238: CSP e plotë (pa 'unsafe-inline' te skriptat): asnjë shkelje gjatë punës së zakonshme (hyrja, Cilësimet, eksporti PDF,
// skaneri ZXing/wasm, Excel, faqet 404/android/privatësia); skriptet inline të injektuara s'ekzekutohen; faqet s'kanë skripta inline
const { chromium } = require('./pw.js');
const fs = require('fs');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = process.env.STOKU_B || 'http://127.0.0.1:8765';
const RR = process.env.STOKU_DIR || require('path').resolve(__dirname, '..');
const NM = __dirname + '/npm/node_modules';
const CDN = { 'html5-qrcode.min.js': NM + '/html5-qrcode/html5-qrcode.min.js', 'ponyfill.js': NM + '/barcode-detector/dist/iife/ponyfill.js',
  'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js', 'zxing_reader.wasm': NM + '/zxing-wasm/dist/reader/zxing_reader.wasm' };
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const FARA = () => {
  if (localStorage.getItem('stoku:foldera:v1')) return;
  localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'pije', emri: 'Pije' }]));
  localStorage.setItem('stoku:produktet:v2', JSON.stringify({ 'pije::5901234123457': { barkodi: '5901234123457', emri: 'Lëng', sasia: 3, kategoriaId: 'pije', prekurSe: Date.now() } }));
};
const VEZHGO = () => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || '') + ' ' + (e.sourceFile || '') + ':' + e.lineNumber)); };
(async () => {
  // 0. asnjë skript inline në faqe; CSP pa unsafe-inline/unsafe-eval te script-src
  for (const f of ['index.html', 'pc.html', '404.html', 'android.html', 'privatesia.html']) {
    const s = fs.readFileSync(RR + '/' + f, 'utf8');
    const inline = (s.match(/<script(?![^>]*\bsrc=)[^>]*>/g) || []);
    const csp = (/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(s) || [])[1] || '';
    const sc = (/script-src ([^;]+)/.exec(csp) || [])[1] || '';
    ok(!inline.length && /default-src 'self'/.test(csp) && sc && !/unsafe-inline|unsafe-eval'/.test(sc.replace("'wasm-unsafe-eval'", '')) && /object-src 'none'/.test(csp), '0. ' + f + ': pa skripta inline, CSP e plotë', { inline, sc });
  }
  const b = await chromium.launch();
  const F = krijoFirestore();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: Date.now() });
  async function faqe(pc, rruga, meLlogari) {
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: true });
    await ctx.route(u => !u.href.startsWith(B), r => {
      const e = Object.keys(CDN).find(k => r.request().url().endsWith(k));
      if (e) return r.fulfill({ status: 200, contentType: e.endsWith('.wasm') ? 'application/wasm' : 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(CDN[e]) });
      return r.abort();
    });
    if (meLlogari) { await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel', { afatet: [] }); await ctx.addInitScript(FARA); }
    await ctx.addInitScript(VEZHGO);
    const p = await ctx.newPage(); const gab = [], refuz = [];
    p.on('pageerror', e => gab.push(e.message)); p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) refuz.push(m.text().slice(0, 200)); });
    await p.goto(B + rruga); await p.waitForTimeout(3000);
    return { p, ctx, gab, refuz, csp: () => p.evaluate(() => window.__csp || []) };
  }
  // 1. telefoni pa llogari (porta) dhe me llogari
  for (const meL of [false, true]) {
    const T = await faqe(false, '/index.html', meL);
    const d = await T.p.evaluate(() => ({ porta: !!document.getElementById('porta'), app: typeof window.StokuAfatet, vjeter: document.body.innerText.includes('shumë i vjetër') }));
    ok(d.app === 'object' && !d.vjeter && (meL || d.porta), 'tel ' + (meL ? 'me llogari' : 'porta') + ': aplikacioni ngarkohet, s\'thotë "shfletues i vjetër"', d);
    if (meL) {
      await T.p.click('#btnOpsione'); await T.p.waitForTimeout(500);
      const r = await T.p.evaluate(async () => {
        const api = window.BarcodeDetectionAPI;
        await api.prepareZXingModule({ overrides: { locateFile: (s, pf) => /\.wasm$/.test(s) ? 'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.6/dist/reader/zxing_reader.wasm' : pf + s }, fireImmediately: true });
        const c = document.createElement('canvas'); window.JsBarcode(c, '5901234123457', { format: 'EAN13' });
        const x = await new api.BarcodeDetector({ formats: ['ean_13'] }).detect(c);
        const pdf = new window.jspdf.jsPDF(); pdf.text('Stoku', 10, 10); pdf.addImage(c.toDataURL('image/png'), 'PNG', 10, 20, 50, 20);
        const xl = window.StokuXlsx && window.StokuXlsx.build ? 'xlsx' : '';
        return { lexuar: x.map(y => y.rawValue)[0], pdf: pdf.output('arraybuffer').byteLength, xl, qr: typeof window.Html5Qrcode };
      }).catch(e => ({ gabim: e.message }));
      ok(r.lexuar === '5901234123457' && r.pdf > 1000 && r.qr === 'function', 'tel: ZXing (wasm), JsBarcode, jsPDF dhe html5-qrcode punojnë nën CSP', r);
    }
    const v = await T.csp();
    ok(!v.length && !T.refuz.length && !T.gab.length, 'tel ' + (meL ? 'me llogari' : 'porta') + ': asnjë shkelje e CSP-së, pa gabime', { v, refuz: T.refuz, gab: T.gab });
    if (meL) {
      // skripti inline i injektuar (si XSS) s'ekzekutohet
      const x = await T.p.evaluate(() => new Promise(z => { window.__xss = 0; const d = document.createElement('div'); d.innerHTML = '<img src=x onerror="window.__xss=1">'; document.body.appendChild(d);
        const s = document.createElement('script'); s.textContent = 'window.__xss=2'; document.body.appendChild(s); setTimeout(() => z(window.__xss), 500); }));
      ok(x === 0, 'tel: skripti inline / onerror i injektuar s\'ekzekutohet (mbrojtje nga XSS)', x);
    }
    await T.ctx.close();
  }
  // 2. PC me llogari: Cilësimet, eksporti PDF
  {
    const P = await faqe(true, '/pc.html', true);
    await P.p.evaluate(() => { const r = [...document.querySelectorAll('.folder-rresht')].find(x => /Pije/.test(x.textContent)); r && r.click(); }); await P.p.waitForTimeout(500);
    await P.p.click('#pamjaTabela [data-eksport="pdf"]'); await P.p.waitForTimeout(300);
    await P.p.click('#ekFormatet [data-v="pdf-etiketa"]');
    const [d] = await Promise.all([P.p.waitForEvent('download', { timeout: 15000 }).catch(() => null), P.p.click('#ekBtn')]);
    ok(!!d, 'PC: PDF-ja me barkode shkarkohet nën CSP');
    await P.p.keyboard.press('Escape'); await P.p.click('#btnOpsione').catch(() => {}); await P.p.waitForTimeout(500);
    const v = await P.csp();
    ok(!v.length && !P.refuz.length && !P.gab.length, 'PC: asnjë shkelje e CSP-së, pa gabime', { v, refuz: P.refuz, gab: P.gab });
    await P.ctx.close();
    const P0 = await faqe(true, '/pc.html', false);
    const v0 = await P0.csp();
    ok(!v0.length && !P0.refuz.length && !P0.gab.length && await P0.p.evaluate(() => !!document.getElementById('porta')), 'PC porta: pa shkelje', { v0, r: P0.refuz, g: P0.gab });
    await P0.ctx.close();
  }
  // 3. faqet e tjera
  for (const r of ['/privatesia.html', '/404.html', '/android.html']) {
    const X = await faqe(false, r, false);
    const v = await X.csp();
    const t = await X.p.evaluate(() => document.documentElement.getAttribute('data-tema') || document.title);
    ok(!v.length && !X.refuz.length && !X.gab.length && !!t, r + ': pa shkelje, skriptet punojnë', { v, refuz: X.refuz, gab: X.gab, t });
    await X.ctx.close();
  }
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

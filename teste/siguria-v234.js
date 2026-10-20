// v234: SRI te skriptat e CDN-së (ngarkohen me hash-in e saktë, refuzohen kur ndryshojnë), faqja s'shfaqet brenda iframe,
// CSP minimale (object-src/base-uri/form-action), njoftimi hap vetëm adresa të Stoku-t
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const NM = __dirname + '/npm/node_modules';
const CDN = { 'html5-qrcode.min.js': NM + '/html5-qrcode/html5-qrcode.min.js', 'ponyfill.js': NM + '/barcode-detector/dist/iife/ponyfill.js',
  'jspdf.umd.min.js': NM + '/jspdf/dist/jspdf.umd.min.js', 'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js' };
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
(async () => {
  const b = await chromium.launch();
  async function hap(pc, ndrysho) {
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => {
      const e = Object.keys(CDN).find(k => r.request().url().endsWith(k));
      if (e) { let body = fs.readFileSync(CDN[e]); if (ndrysho) body = Buffer.concat([body, Buffer.from('\nwindow.__helmuar=1;')]);
        return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body }); }
      return r.abort();
    });
    const p = await ctx.newPage(); const gab = [], kons = [];
    p.on('pageerror', e => gab.push(e.message)); p.on('console', m => { if (m.type() === 'error') kons.push(m.text()); });
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2500);
    return { p, ctx, gab, kons };
  }
  for (const pc of [false, true]) {
    const em = pc ? 'PC' : 'tel';
    const A = await hap(pc);
    const s = await A.p.evaluate(() => ({ dukshme: getComputedStyle(document.documentElement).display !== 'none', stili: !!document.getElementById('paKornize'),
      jspdf: !!(window.jspdf && window.jspdf.jsPDF), jsb: typeof window.JsBarcode === 'function', qr: typeof window.Html5Qrcode, bd: typeof window.BarcodeDetectionAPI }));
    ok(s.dukshme && !s.stili, em + ': faqja shfaqet (s\'është në iframe)', s);
    ok(s.jspdf && s.jsb, em + ': jsPDF dhe JsBarcode ngarkohen me integrity', s);
    if (!pc) ok(s.qr === 'function', em + ': html5-qrcode ngarkohet me integrity', s);
    ok(!A.gab.length && !A.kons.some(t => /integrity|Content Security|Refused/i.test(t)), em + ': pa gabime JS / SRI / CSP', [A.gab, A.kons.filter(t => /integrity|Content Security|Refused/i.test(t))]);
    await A.ctx.close();
    const H = await hap(pc, true);
    const h = await H.p.evaluate(() => ({ helmuar: !!window.__helmuar, jsb: typeof window.JsBarcode }));
    ok(!h.helmuar && h.jsb === 'undefined', em + ': skripti i ndryshuar në CDN refuzohet', h);
    await H.ctx.close();
    // brenda iframe nga një faqe e huaj (serveri i dytë: keq/ në portin 8766, që regresioni.sh e nis)
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B) && !u.href.startsWith('http://localhost:8766/'), r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8766/' + (pc ? 'pc' : 'tel') + '.html'); await p.waitForTimeout(2500);
    const fr = p.frames().find(f => f.url().startsWith(B));
    // Me header-in e Cloudflare (CSP frame-ancestors 'none', v239) shfletuesi s'e ngarkon fare: korniza mbetet faqe gabimi
    const bllokuar = !fr && p.frames().some(f => f !== p.mainFrame() && /^chrome-error:/.test(f.url()));
    const d = fr ? await fr.evaluate(() => getComputedStyle(document.documentElement).display).catch(() => 'pa-akses') : bllokuar ? 'bllokuar' : 'pa-frame';
    ok(p.url().startsWith('http://localhost:8766/') && (d === 'none' || d === 'bllokuar'), em + ': brenda iframe të huaj: e fshehur ose e bllokuar', [p.url(), d]);
    await ctx.close();
  }
  // sw.js: njoftimi me adresë të huaj hap Stoku-n
  const sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8');
  const m = /self\.addEventListener\('notificationclick', function \(e\) \{([\s\S]*?)\n\}\);/.exec(sw);
  const hapura = [];
  const provo = async (url) => { const fn = new Function('e', 'self', 'URL', m[1]); let pr; fn({ notification: { close() {}, data: { url } }, waitUntil(x) { pr = x; } },
    { location: { href: 'https://stoku.site/sw.js', origin: 'https://stoku.site' }, clients: { matchAll: async () => [], openWindow: async u => hapura.push(u) } }, URL); await pr; return hapura.pop(); };
  ok(await provo('https://keq.test/x') === './index.html#afatet', 'sw: adresë e huaj → index.html#afatet');
  ok(await provo('javascript:alert(1)') === './index.html#afatet', 'sw: javascript: → index.html#afatet');
  ok(await provo('./pc.html#/ekipa/njoftimet') === './pc.html#/ekipa/njoftimet', 'sw: adresa e Stoku-t mbetet');
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

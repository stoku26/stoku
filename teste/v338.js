// v338 (pronari, 18.11.2026, iPhone 5s: "kamera nuk u hap ska kerkun opsion me ja leju kameren"): kur shfletuesi s'ka kamerë direkte
// (iOS 12: pa navigator.mediaDevices), butoni i skanimit hap kamerën për foto dhe barkodi lexohet nga fotoja (ZXing; html5-qrcode rezervë).
const pw = require('./pw.js');
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:' + (process.env.PORTI || '8765');
const NM = __dirname + '/npm/node_modules';
const CDN = { 'html5-qrcode.min.js': NM + '/html5-qrcode/html5-qrcode.min.js', 'ponyfill.js': NM + '/barcode-detector/dist/iife/ponyfill.js',
  'JsBarcode.all.min.js': NM + '/jsbarcode/dist/JsBarcode.all.min.js', 'zxing_reader.wasm': NM + '/zxing-wasm/dist/reader/zxing_reader.wasm' };
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';
const SC = process.env.SC || '/tmp/';
const prit = (fn, ms = 9000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/' + ADM, { perdoruesi: 'duli96', kycurSe: Date.now() - 6e4 });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [], produktet: [], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  async function faqe(paZxing) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1',
      viewport: { width: 320, height: 568 }, serviceWorkers: 'block', hasTouch: true, isMobile: true });
    await ctx.route(u => !u.href.startsWith(B), r => {
      const e = Object.keys(CDN).find(k => r.request().url().endsWith(k));
      if (e && !(paZxing && e === 'ponyfill.js')) return r.fulfill({ status: 200, contentType: e.endsWith('.wasm') ? 'application/wasm' : 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(CDN[e]) });
      return r.abort();
    });
    await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
    // si iOS 12: pa kamerë direkte në web
    await ctx.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'mediaDevices', { get: () => undefined, configurable: true }); } catch (e) {} try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/index.html'); await p.waitForTimeout(3500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  }
  async function fotoBarkodi(p, kodi) {
    const d = await p.evaluate(k => { const c = document.createElement('canvas'); JsBarcode(c, k, { format: 'EAN13', width: 3, height: 120 });
      const c2 = document.createElement('canvas'); c2.width = c.width + 200; c2.height = c.height + 300; const x = c2.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c2.width, c2.height); x.drawImage(c, 100, 150);
      return c2.toDataURL('image/png').split(',')[1]; }, kodi);
    const f = SC + 'v338-' + kodi + '.png'; fs.writeFileSync(f, Buffer.from(d, 'base64')); return f;
  }
  async function bosh(p) {
    const d = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d'); x.fillStyle = '#ddd'; x.fillRect(0, 0, 400, 300); return c.toDataURL('image/png').split(',')[1]; });
    const f = SC + 'v338-bosh.png'; fs.writeFileSync(f, Buffer.from(d, 'base64')); return f;
  }

  // ===== 1. Afatet → Shto: forma hapet, kamera për foto; barkodi nga fotoja =====
  const p = await faqe(false);
  ok(await p.evaluate(() => !navigator.mediaDevices), '0. si iPhone 5s: pa kamerë direkte');
  await p.click('#btnAfatet'); await p.waitForTimeout(600);
  let [zgj] = await Promise.all([p.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), p.click('#afShto')]);
  ok(!!zgj, '1. "Shto" te Afatet hap kamerën për foto (jo "Kamera nuk u hap")');
  await p.waitForTimeout(400);
  const st = await p.evaluate(() => ({ forma: document.getElementById('dlgAfat').classList.contains('hapur'), kamera: document.getElementById('kamera').classList.contains('hapur'), toast: document.getElementById('toast').classList.contains('hapur') ? document.getElementById('toast').textContent : '' }));
  ok(st.forma && !st.kamera && !/Kamera nuk u hap/.test(st.toast), '1. forma "Afat i ri" hapet menjëherë, pa dritaren e kamerës direkte', st);
  if (zgj) await zgj.setFiles(await fotoBarkodi(p, '4006381333931'));
  ok(await prit(() => p.evaluate(() => document.getElementById('afatBarkodi').value === '4006381333931')), '1. barkodi lexohet nga fotoja (ZXing) dhe del te forma',
    await p.evaluate(() => document.getElementById('afatBarkodi').value));
  await p.screenshot({ path: __dirname + '/v338-afati.png' });
  // butoni i barkodit brenda formës
  [zgj] = await Promise.all([p.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), p.click('#afatSkano')]);
  ok(!!zgj, '1. butoni i barkodit te forma hap kamerën për foto');
  if (zgj) await zgj.setFiles(await bosh(p));
  ok(await prit(() => p.evaluate(() => /S'u gjet barkod në foto/.test(document.getElementById('toast').textContent))), '1. foto pa barkod: "S\'u gjet barkod në foto"');
  ok(await p.evaluate(() => document.getElementById('afatBarkodi').value === '4006381333931'), '1. barkodi i mëparshëm s\'preket');
  ok(!p.__gab.length, '1. pa gabime JS', p.__gab);

  // ===== 2. Pa ZXing: html5-qrcode e lexon fotonë =====
  const p2 = await faqe(true);
  ok(await p2.evaluate(() => !window.BarcodeDetectionAPI && typeof Html5Qrcode !== 'undefined'), '2. pa ZXing, me html5-qrcode');
  await p2.click('#btnAfatet'); await p2.waitForTimeout(600);
  [zgj] = await Promise.all([p2.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), p2.click('#afShto')]);
  if (zgj) await zgj.setFiles(await fotoBarkodi(p2, '5901234123457'));
  ok(await prit(() => p2.evaluate(() => document.getElementById('afatBarkodi').value === '5901234123457'), 15000), '2. html5-qrcode e lexon barkodin nga fotoja',
    await p2.evaluate(() => document.getElementById('afatBarkodi').value));
  ok(!p2.__gab.length, '2. pa gabime JS', p2.__gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

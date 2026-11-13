// v298 (pronari: "leje 10 foto ne dite"): Worker-i stoku-afatet kthen { gabim: 'kufiri' } (429) pas 10 leximeve në ditë dhe
// { gabim: 'leje' } (403) pa lejen. Telefoni dhe PC-ja e tregojnë mesazhin e qartë (jo "Fleta s'u lexua (kufiri)").
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const zlib = require('zlib');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
// PNG 2×2 e bardhë
const crc = b => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const pjese = (l, d) => { const b = Buffer.alloc(8 + d.length + 4); b.writeUInt32BE(d.length, 0); b.write(l, 4); d.copy(b, 8); b.writeUInt32BE(crc(Buffer.concat([Buffer.from(l), d])), 8 + d.length); return b; };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(2, 4); ihdr[8] = 8; ihdr[9] = 2;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pjese('IHDR', ihdr), pjese('IDAT', zlib.deflateSync(Buffer.from([0, 255, 255, 255, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255]))), pjese('IEND', Buffer.alloc(0))]);
const AI = 'http://127.0.0.1:8765/__ai-prove';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: tani });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  const b = await chromium.launch();
  let pergjigja = { status: 429, body: { gabim: 'kufiri', kufiri: 10, mbeten: 0 } };
  async function faqe(pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.route(u => u.href.startsWith(AI), r => r.fulfill({ status: pergjigja.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(pergjigja.body) }));
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(a => { try { localStorage.setItem('stoku:ai-url', a); localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} }, AI);
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('pageerror:', e.message); });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/afatet' : 'index.html')); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    return p;
  }
  // Telefoni
  const t = await faqe(false);
  await t.click('#btnAfatet'); await t.waitForTimeout(500);
  const lexoTel = async () => {
    await t.setInputFiles('#afFotoGaleria', { name: 'f.png', mimeType: 'image/png', buffer: png }); await t.waitForTimeout(500);
    if (await t.isVisible('#kfhKetu')) { await t.click('#kfhKetu'); }
    await t.waitForTimeout(1500);
    return (await t.textContent('#lxStatusi')).trim();
  };
  let s = await lexoTel();
  ok(/kufirin e leximit me AI \(10 fletë në ditë\)/.test(s) && /Provo nesër/.test(s) && !/\(kufiri\)/.test(s), '1. telefoni: mesazhi i kufirit', s);
  await t.screenshot({ path: __dirname + '/v298-tel.png' });
  await t.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  pergjigja = { status: 403, body: { gabim: 'leje' } };
  await t.evaluate(() => { const d = document.getElementById('dlgAfatLexim'); if (d) d.classList.remove('hapur'); });
  s = await lexoTel();
  ok(/s'lejohet për këtë llogari/.test(s), '1. telefoni: mesazhi i lejes', s);
  // PC
  pergjigja = { status: 429, body: { gabim: 'kufiri', kufiri: 10, mbeten: 0 } };
  const c = await faqe(true);
  await c.setInputFiles('#afFoto', { name: 'f.png', mimeType: 'image/png', buffer: png }); await c.waitForTimeout(2000);
  s = (await c.textContent('#lxStatusi')).trim();
  ok(/kufirin e leximit me AI \(10 fletë në ditë\)/.test(s), '2. PC: mesazhi i kufirit', s);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

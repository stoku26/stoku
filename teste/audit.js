const { chromium } = require('./pw.js');
const fs = require('fs');
const NM = __dirname + '/npm/node_modules/';
const HARTA = { 'html5-qrcode@2.3.8/html5-qrcode.min.js': NM + 'html5-qrcode/html5-qrcode.min.js', 'jsbarcode@3.11.5/dist/JsBarcode.all.min.js': NM + 'jsbarcode/dist/JsBarcode.all.min.js',
  'jspdf@3.0.3/dist/jspdf.umd.min.js': NM + 'jspdf/dist/jspdf.umd.min.js',
  'barcode-detector@3.2.2/dist/iife/ponyfill.js': NM + 'barcode-detector/dist/iife/ponyfill.js', 'zxing-wasm@3.1.3/dist/reader/zxing_reader.wasm': NM + 'zxing-wasm/dist/reader/zxing_reader.wasm' };
const AI = { ok: true, rreshtat: [{ barkodi: '3904434241749', emri: 'Çaj hibiskus', data: '2026-12-31', data_origjinale: '12.2026', sasia: '18+1', furnizuesi: 'Albi', dyshim: false },
  { barkodi: '5304000146399', emri: 'Kraco çaj limon', data: '2026-10-07', data_origjinale: '07.10.2026', sasia: '1', furnizuesi: 'Arjeta', dyshim: true }] };
const MOCK = () => {
  const lexo = () => JSON.parse(localStorage.getItem('__mc') || 'null');
  window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'market1@stoku-app.local' }), token: async () => 't',
    hyr: async () => ({ ok: true }), regjistrohu: async () => ({ ok: true }), dil: async () => {},
    merr: async () => ({ ok: true, gjendja: lexo() }), bashkoDheRuaj: async fn => { const e = fn(lexo()); localStorage.setItem('__mc', JSON.stringify(e)); return { ok: true, gjendja: e }; },
    ruaj: async () => ({ ok: true }), degjo: () => () => {}, degjoFletet: cb => { window.__cbF = cb; return () => {}; }, fshijFleten: async () => ({ ok: true }), dergoFleten: async () => ({ ok: true }) };
  localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:te-rejat:pare', '999');
};
const gabime = [];
async function faqe(b, opt, emri) {
  const ctx = await b.newContext({ ...opt, serviceWorkers: 'block', acceptDownloads: true });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), async r => {
    const u = r.request().url(); const k = Object.keys(HARTA).find(k => u.includes(k));
    if (k) return r.fulfill({ status: 200, body: fs.readFileSync(HARTA[k]), headers: { 'content-type': k.endsWith('.wasm') ? 'application/wasm' : 'application/javascript', 'access-control-allow-origin': '*' } });
    if (u.includes('workers.dev')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(AI) });
    return r.abort();
  });
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage();
  p.on('pageerror', e => gabime.push(`[${emri}] pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) gabime.push(`[${emri}] console: ${m.text().slice(0, 200)}`); });
  p.on('dialog', d => d.accept());
  return p;
}
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
(async () => {
  const b = await chromium.launch();
  const k = async (p, s, emri) => { try { await p.click(s, { timeout: 2500 }); await p.waitForTimeout(220); return true; } catch (e) { gabime.push(`[${emri}] s'u klikua ${s}: ${e.message.split('\n')[0].slice(0, 120)}`); return false; } };
  const hapur = p => p.evaluate(() => [...document.querySelectorAll('.mbulese.hapur')].map(d => d.id).join(','));
  // ===== TELEFONI =====
  let t = await faqe(b, { userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'tel');
  await t.goto('http://127.0.0.1:8765/'); await t.waitForTimeout(1200);
  console.log('tel porta mbyllur:', await t.evaluate(() => !window.StokuPorta.eHapur()));
  await k(t, '.folder-karta', 'tel');
  for (const [bk, em, s] of [['5304000146399', 'Kraco çaj limon', '3'], ['3858881083813', 'Franch Forest', '2']]) {
    await t.fill('#barkodi', bk); await t.press('#barkodi', 'Enter'); await t.waitForTimeout(250);
    await t.fill('#dlgEmri', em); await t.fill('#dlgSasia', s); await k(t, '#dlgRuaj', 'tel');
  }
  await t.fill('#barkodi', '5304000146399'); await t.press('#barkodi', 'Enter'); await t.waitForTimeout(250);
  await t.fill('#dlgSasia', '2'); await k(t, '#dlgRuaj', 'tel');
  console.log('tel produktet:', await t.evaluate(() => Object.values(JSON.parse(localStorage.getItem('stoku:produktet:v2'))).map(p => p.emri + '=' + p.sasia).join(', ')));
  await t.fill('#kerko', 'kraco'); await t.waitForTimeout(200); console.log('tel kërkimi:', await t.$$eval('#lista > *', a => a.length)); await t.fill('#kerko', '');
  let [dl] = await Promise.all([t.waitForEvent('download', { timeout: 5000 }).catch(() => null), k(t, '#btnEksport', 'tel')]);
  console.log('tel excel:', dl ? dl.suggestedFilename() : 'JO');
  [dl] = await Promise.all([t.waitForEvent('download', { timeout: 8000 }).catch(() => null), k(t, '#btnEksportPdf', 'tel')]);
  console.log('tel pdf:', dl ? dl.suggestedFilename() : 'JO', '| dialogë:', await hapur(t));
  await t.goBack(); await t.waitForTimeout(300);
  await k(t, '#btnOpsione', 'tel'); console.log('tel opsionet hapur:', await hapur(t)); await t.goBack(); await t.waitForTimeout(300);
  await k(t, '#btnAfatet', 'tel'); await k(t, '#afShto', 'tel');
  await t.fill('#afatBarkodi', '5304000146399'); await t.press('#afatBarkodi', 'Enter');
  await t.focus('#afatData'); await t.keyboard.type('05102026'); await t.fill('#afatSasia', '20+5'); await t.press('#afatSasia', 'Tab');
  await k(t, '#afatRuaj', 'tel');
  console.log('tel afati:', await t.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1')).map(a => a.emri + ' ' + a.data + ' ' + a.sasia).join('; ')));
  await k(t, '#afLista .af-karta', 'tel'); console.log('tel afati hapet për ndryshim:', await t.inputValue('#afatData')); await k(t, '#afatAnulo', 'tel');
  // (butoni "Lajmërova" u hoq te v121; pill-i "U hoq nga rafti" del vetëm te afatet e skaduara)
  if (await t.$('#afLista .af-karta.skaduar .af-pill')) await k(t, '#afLista .af-karta.skaduar .af-pill', 'tel');
  await t.setInputFiles('#afFotoGaleria', { name: 'f.png', mimeType: 'image/png', buffer: png }); await t.waitForTimeout(400);
  console.log('tel pas fotos:', await hapur(t));
  await k(t, '#kfhKetu', 'tel'); await t.waitForTimeout(1200);
  console.log('tel kontrolli i fletës:', await hapur(t), '| rreshta:', await t.$$eval('#lxRreshtat .lx-rresht', a => a.length));
  await k(t, '#lxRuaj', 'tel'); await t.waitForTimeout(300);
  console.log('tel afatet pas fletës:', await t.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1')).length));
  await t.screenshot({ path: 'audit-tel.png' });
  console.log('tel cloud ka afatet:', await t.evaluate(() => (JSON.parse(localStorage.getItem('__mc') || '{}').afatet || []).length));
  // ===== PC =====
  const c = await faqe(b, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140', viewport: { width: 1440, height: 900 } }, 'pc');
  await c.goto('http://127.0.0.1:8765/'); await c.waitForTimeout(1500);
  console.log('pc porta mbyllur:', await c.evaluate(() => !window.StokuPorta.eHapur()), c.url());
  await k(c, '#folderat > *', 'pc'); await k(c, '#btnShto', 'pc');
  await c.fill('#prBarkodi', '5901086000104'); await c.fill('#prEmri', 'Peppermint'); await c.fill('#prSasia', '4'); await k(c, '#prRuaj', 'pc');
  for (const s of ['#navTeGjitha', '#navPermbledhja']) { await k(c, s, 'pc'); }
  await c.keyboard.press('Control+i'); await c.waitForTimeout(300); // v133: butoni i anësores u hoq — importi me Ctrl+I / menyja e folderit
  console.log('pc import hapur:', await hapur(c)); await c.keyboard.press('Escape'); await c.waitForTimeout(200);
  await k(c, '#btnShkurtoret', 'pc'); console.log('pc shkurtoret:', await hapur(c)); await c.keyboard.press('Escape'); await c.waitForTimeout(200);
  await k(c, '#btnOpsione', 'pc'); console.log('pc opsionet:', await hapur(c)); await c.keyboard.press('Escape'); await c.waitForTimeout(200);
  await k(c, '#btnLlogaria', 'pc'); console.log('pc llogaria:', await hapur(c)); await c.keyboard.press('Escape'); await c.waitForTimeout(200);
  await c.keyboard.press('Control+k'); await c.keyboard.type('pepper'); await c.waitForTimeout(300); console.log('pc kërkimi global:', await c.inputValue('#kerkoGlobal')); await c.keyboard.press('Escape');
  await k(c, '#btnAkordAfatet', 'pc'); await k(c, '#afBtnShto', 'pc');
  await c.fill('#afdBarkodi', '5901086000104'); await c.press('#afdBarkodi', 'Tab'); await c.focus('#afdData'); await c.keyboard.type('01112026'); await c.fill('#afdSasia', '10+2'); await c.press('#afdSasia', 'Tab');
  await k(c, '#afdRuaj', 'pc');
  console.log('pc afati:', await c.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1')).map(a => a.emri + ' ' + a.data + ' ' + a.sasia).join('; ')));
  await c.check('#afGrupo').catch(() => {}); await c.waitForTimeout(200); await c.uncheck('#afGrupo').catch(() => {});
  await k(c, '#afBtnExcel', 'pc'); // që nga v120: dialogu "Cili muaj?", pastaj Eksporto
  [dl] = await Promise.all([c.waitForEvent('download', { timeout: 5000 }).catch(() => null), k(c, '#aeBtn', 'pc')]);
  console.log('pc excel afatet:', dl ? dl.suggestedFilename() : 'JO');
  await c.setInputFiles('#afFoto', { name: 'f.png', mimeType: 'image/png', buffer: png }); await c.waitForTimeout(1500);
  console.log('pc lexim:', await hapur(c), '| rreshta:', await c.$$eval('#lxTrup tr', a => a.length));
  await k(c, '#lxLaps', 'pc'); await k(c, '#lxLaps', 'pc');
  await k(c, '#lxRuaj', 'pc'); await c.waitForTimeout(300);
  console.log('pc afatet pas fletës:', await c.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1')).length));
  // fletë nga telefoni
  await c.evaluate(() => window.__cbF([{ id: 'x1', nga: 'tel', krijuarSe: Date.now(), foto: '', rreshtat: [{ barkodi: '1', emri: 'Z', data: '2026-12-01', sasia: 3 }] }])); await c.waitForTimeout(300);
  console.log('pc njoftimi:', await c.textContent('#afTabFleta'));
  [dl] = await Promise.all([c.waitForEvent('download', { timeout: 8000 }).catch(() => null), c.click('#btnAkordStoku').then(() => c.click('#pamjaPermbledhja [data-eksport="excel"]')).catch(e => gabime.push('pc eksport: ' + e.message.split('\n')[0]))]);
  await c.waitForTimeout(400); console.log('pc eksport (dialog/shkarkim):', dl ? dl.suggestedFilename() : await hapur(c));
  await c.screenshot({ path: 'audit-pc.png' });
  console.log('\nGABIME (' + gabime.length + '):\n' + gabime.join('\n'));
  await b.close();
})();

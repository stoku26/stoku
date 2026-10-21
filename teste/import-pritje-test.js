// v209: importet nga Excel (tel: afatet; PC: stoku) nga një koleg → produktet presin kontrollin te Cilësimet → Stoku
const { chromium } = require('./pw.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const mock = ([emri, pc]) => {
  window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: emri + '@stoku-app.local' }), token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
  if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1');
  localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri })); localStorage.setItem('stoku:te-rejat:pare', '999');
  localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }])); localStorage.setItem('stoku:produktet:v2', '{}');
  localStorage.setItem('stoku:afatet:v1', '[]');
};
(async () => {
  const b = await chromium.launch(); const err = [];
  // 1. Telefoni, koleg: importi i afateve nga Excel
  for (const [emri, admin] of [['agim', false], ['mendurberisha', true]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(mock, [emri, false]);
    const p = await ctx.newPage(); p.on('pageerror', e => err.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(1500);
    await p.evaluate(() => document.getElementById('btnAfatet').click()); await p.waitForTimeout(500);
    await p.click('#afExcel'); await p.click('#afImporto'); await p.waitForTimeout(300);
    await p.setInputFiles('#aiSkedari', __dirname + '/afatet-test.xlsx'); await p.waitForTimeout(800);
    await p.click('#aiBtn'); await p.waitForTimeout(2500);
    const k = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));
    const prod = Object.keys(k).filter(x => !/furnizuesi /.test(x)).map(x => k[x]);
    const T = '[tel ' + emri + ']';
    if (!admin) {
      ok(prod.length >= 3 && prod.every(x => x.n === 'agim' && !x.s), T + ' produktet e importuara presin kontrollin (nga agim)', prod);
      await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
      await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabLista'); await p.waitForTimeout(300);
      ok(await p.isVisible('#stPritje') && /presin kontrollin/.test(await p.textContent('#stPritjeStatus')), T + ' te Cilësimet → Stoku: "Produktet e reja"', await p.textContent('#stPritjeStatus'));
    } else {
      ok(prod.length >= 3 && prod.every(x => x.s), T + ' importi i administratorit ruhet si i kontrolluar', prod.map(x => x.e));
    }
    await ctx.close();
  }
  // 2. PC, koleg: importi i stokut nga CSV
  const csv = 'Barkodi;Emri;Sasia\n3860001234567;Ujë Rugove 1.5L;150\n5449000000996;Coca-Cola 0.5L;120\n';
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(mock, ['agim', true]);
  const p = await ctx.newPage(); p.on('pageerror', e => err.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://127.0.0.1:8765/pc.html'); await p.waitForTimeout(1500);
  await p.keyboard.press('Control+i'); await p.waitForTimeout(300);
  await p.setInputFiles('#imSkedari', { name: 'stoku.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) }); await p.waitForTimeout(800);
  ok(!(await p.isDisabled('#imBtn')), '[pc agim] importi i stokut gati', await p.textContent('#imBtn'));
  await p.click('#imBtn'); await p.waitForTimeout(2500);
  const k = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));
  ok(k['3860001234567'] && k['3860001234567'].n === 'agim' && !k['3860001234567'].s && k['5449000000996'] && k['5449000000996'].n === 'agim', '[pc agim] produktet e importuara presin kontrollin', [k['3860001234567'], k['5449000000996']]);
  await ctx.close();
  ok(!err.length, 'pa gabime në faqe', err);
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();

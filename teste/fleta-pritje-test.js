// v210: "Anulo" te fleta nga telefoni: mesazhi tregon vendin e saktë (stoku → Përmbledhja; afatet → Afatet e produkteve)
const { chromium } = require('./pw.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch(); const err = [];
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(() => {
    window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'mendurberisha@stoku-app.local' }), token: async () => 't',
      merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
      degjo: () => () => {}, degjoFletet: cb => { window.__cbFletet = cb; return () => {}; }, fshijFleten: async () => ({ ok: true }) };
    localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', '1'); localStorage.setItem('stoku:te-rejat:pare', '999');
    localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }])); localStorage.setItem('stoku:produktet:v2', '{}');
  });
  const p = await ctx.newPage(); p.on('pageerror', e => err.push(e.message));
  await p.goto('http://127.0.0.1:8765/pc.html'); await p.waitForTimeout(1200);
  const fletet = [{ id: 'flS', lloji: 'stok', krijuarSe: Date.now(), nga: 'agim', foto: '', rreshtat: [{ barkodi: '3860001234567', emri: 'Ujë', sasia: 5, furnizuesi: '' }] },
    { id: 'flA', lloji: 'afatet', krijuarSe: Date.now(), nga: 'agim', foto: '', rreshtat: [{ barkodi: '3860001234568', emri: 'Kos', data: '2027-01-01', sasia: 2, furnizuesi: '' }] }];
  await p.evaluate(f => window.__cbFletet(f), fletet); await p.waitForTimeout(400);
  for (const [lista, pritet, emri] of [['#stokFletetTel', /Fleta e stokut mbeti në pritje\. E gjen te "Përmbledhja"/, 'stoku'], ['#afFletetTel', /Fleta mbeti në pritje\. E gjen te "Afatet e produkteve"/, 'afatet']]) {
    if (emri === 'afatet') { await p.evaluate(() => { location.hash = '#/afatet'; }); await p.waitForTimeout(600); }
    await p.click(lista + ' button:has-text("Hape")'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.getElementById('dlgLexim').classList.contains('hapur')), '[' + emri + '] fleta u hap');
    await p.click('#lxAnulo'); await p.waitForTimeout(300);
    const t = await p.textContent('#toast');
    ok(pritet.test(t) && await p.isVisible(lista + ' button:has-text("Hape")'), '[' + emri + '] mesazhi pas "Anulo"; fleta mbetet në listë', t);
  }
  ok(!err.length, 'pa gabime në faqe', err);
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();

// v210: "Ke 1 fletë … që pret kontrollin" / "Ke 2 fleta … që presin kontrollin"; rreshtat: "1 rresht pret" / "N rreshta presin"
const { chromium } = require('./pw.js');
const PORTI = process.env.PORTI || '8765';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const rr = n => Array.from({ length: n }, (_, i) => ({ barkodi: '386000000000' + i, emri: 'Produkt ' + i, data: '2027-01-01', sasia: 2, furnizuesi: '' }));
(async () => {
  const b = await chromium.launch(); const err = [];
  const raste = [
    ['stoku', [{ id: 's1', lloji: 'stok', nga: 'agim', rreshtat: rr(1) }, { id: 's2', lloji: 'stok', nga: 'pda34', rreshtat: rr(4) }], /^Ke 2 fleta nga telefoni që presin kontrollin\./, '#stokFletetTel'],
    ['afatet', [{ id: 'a1', lloji: 'afatet', nga: 'agim', rreshtat: rr(1) }], /^Ke 1 fletë nga telefoni që pret kontrollin\./, '#afFletetTel']
  ];
  for (const [emri, fletet, pritet, lista] of raste) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, serviceWorkers: 'block', colorScheme: 'dark' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(() => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'mendurberisha@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
        degjo: () => () => {}, degjoFletet: cb => { window.__cbFletet = cb; return () => {}; }, fshijFleten: async () => ({ ok: true }) };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', '1'); localStorage.setItem('stoku:te-rejat:pare', '999');
      localStorage.setItem('stoku:foldera:v1', JSON.stringify([{ id: 'f1', emri: 'Ushqimore' }])); localStorage.setItem('stoku:produktet:v2', '{}');
    });
    const p = await ctx.newPage(); p.on('pageerror', e => err.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/pc.html' + (emri === 'afatet' ? '#/afatet' : '')); await p.waitForTimeout(1300);
    await p.evaluate(f => window.__cbFletet(f.map(x => Object.assign({ krijuarSe: Date.now(), foto: '' }, x))), fletet);
    await p.waitForFunction(() => document.getElementById('toast').classList.contains('hapur'), null, { timeout: 3000 }).catch(() => {});
    await p.waitForTimeout(350);
    await p.screenshot({ path: __dirname + '/fleta-numri-' + emri + '.png' });
    const t = await p.textContent('#toastTekst');
    const rreshtat = await p.$$eval(lista + ' b', x => x.map(e => e.textContent));
    ok(pritet.test(t.trim()), '[' + emri + '] njoftimi', t);
    ok(rreshtat.length === fletet.length && rreshtat.every((x, i) => fletet[i].rreshtat.length === 1 ? /: 1 rresht pret kontrollin$/.test(x) : new RegExp(': ' + fletet[i].rreshtat.length + ' rreshta presin kontrollin$').test(x)), '[' + emri + '] rreshtat e fletëve', rreshtat);
    await ctx.close();
  }
  ok(!err.length, 'pa gabime në faqe', err);
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();

// v258: të dhënat shembull të provës si vizitor (porta.js mbushProven: "Furnizuesi A/B/C" dhe 13 barkodet 2000…) s'janë
// produkte të vërteta. Aplikacioni Android (para vendas-v72) i dërgonte te pritja (kujtesa_pritje) pas provës, dhe te
// administratori dilnin te "Produktet e reja" (13) dhe "Furnizuesit e rinj" (3). Tash:
//   1. llogaria që i ka ende në kujtesë s'i dërgon te pritja (vetëm produktet e vërteta);
//   2. administratori i fshin vetë ato që erdhën nga pritja e një telefoni të vjetër (fshirja shkon te regjistri),
//      ndërsa produktet e vërteta në pritje mbeten për kontroll;
//   3. Cilësimet → Stoku te administratori: pa produktet e provës, "Produktet e reja" vetëm 1;
//   4. "Çka ka të re" v258 vetëm për administratorin.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const prit = (fn, ms = 12000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 150)); } z(false); });

const PROVA = {
  '2000100000014': ['Bukë e bardhë 500g', 'Furnizuesi A'], '2000100000021': ['Oriz 1kg', 'Furnizuesi B'], '2000100000038': ['Makarona 500g', 'Furnizuesi B'],
  '2000100000045': ['Vaj luledielli 1L', 'Furnizuesi B'], '2000200000013': ['Ujë natyral 1.5L', 'Furnizuesi C'], '2000200000020': ['Lëng portokalli 1L', 'Furnizuesi C'],
  '2000200000037': ['Pije e gazuar 0.5L', 'Furnizuesi C'], '2000300000012': ['Sapun i lëngshëm 500ml', 'Furnizuesi B'], '2000300000029': ['Pastë dhëmbësh 75ml', 'Furnizuesi B'],
  '2000400000011': ['Qumësht 1L', 'Furnizuesi A'], '2000400000028': ['Kos 500g', 'Furnizuesi A'], '2000400000035': ['Djathë i bardhë 400g', 'Furnizuesi A'],
  '2000400000042': ['Jogurt frutash 150g', 'Furnizuesi A']
};
const FURN = ['Furnizuesi A', 'Furnizuesi B', 'Furnizuesi C'];

(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'testmorina', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'agim', kycurSe: t, grupi: '' });
  const KUJ_ADMIN = {
    '3800001': { e: 'Kos Vita 1kg', f: 'Vita', k: t - 5000, m: 1, s: 1, n: 'mendurberisha' },
    'furnizuesi Vita': { e: 'Vita', f: '', k: t - 5000, s: 1 }
  };
  // Kujtesa e një llogarie pas provës (si telefoni Android para v72): produktet e provës + një produkt i vërtetë
  const pritjaEVjeter = {};
  Object.keys(PROVA).forEach((b, i) => { pritjaEVjeter[b] = { e: PROVA[b][0], f: PROVA[b][1], k: t - 60000 + i, a: 1, m: 0, s: 0, n: '', x: 0, r: 0 }; });
  FURN.forEach((f, i) => { pritjaEVjeter['furnizuesi ' + f] = { e: f, f: '', k: t - 60000 + i, a: 0, m: 0, s: 0, n: '', x: 0, r: 0 }; });
  const kujTm = Object.assign({}, pritjaEVjeter, { '3800099': { e: 'Ujë Rugove 0.5L', f: 'Rugove', k: t - 1000, m: 1 } });

  const b = await chromium.launch();
  async function faqe(uid, emri, pc, kuj) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(k => {
      try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {}
      if (k && !sessionStorage.getItem('__kuj')) { sessionStorage.setItem('__kuj', '1'); localStorage.setItem('stoku:kujtesa:v1', JSON.stringify(k)); localStorage.setItem('stoku:kujtesa:kontrolli-v238', '1'); }
    }, kuj || null);
    const p = await ctx.newPage(); p.__gab = [];
    p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/' + (pc ? 'pc.html#/afatet' : 'index.html'));
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    return p;
  }
  const doc = k => F.S.docs.get(k);
  const regjistri = () => { const h = {}; [...F.S.docs.keys()].filter(k => /^kujtesa\/p[0-9x]$/.test(k)).forEach(k => Object.assign(h, (doc(k) || {}).p || {})); return h; };
  const kuj = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));

  // 1. testmorina (telefon) i ka ende produktet e provës në kujtesë: te pritja shkon vetëm produkti i vërtetë
  const tm = await faqe('u2', 'testmorina', false, kujTm);
  ok(await prit(() => { const d = doc('kujtesa_pritje/u2'); return d && d.p && d.p['3800099']; }), '1. pritja e testmorinës: 3800099', doc('kujtesa_pritje/u2') && Object.keys(doc('kujtesa_pritje/u2').p));
  const p1 = (doc('kujtesa_pritje/u2') || {}).p || {};
  ok(!Object.keys(PROVA).some(b => p1[b]) && !FURN.some(f => p1['furnizuesi ' + f]), '1. pa produktet dhe furnizuesit e provës', Object.keys(p1));

  // 2. agim: pritja e vjetër (nga një telefon Android para v72) me krejt provën + një produkt i vërtetë
  F.S.docs.set('kujtesa_pritje/u3', { emri: 'agim', ndryshuarSe: t - 30000, p: Object.assign({}, pritjaEVjeter, { '3800077': { e: 'Lëng Molle 1L', f: 'Vita', k: t - 2000, a: 0, m: 1, s: 0, n: '', x: 0, r: 0 } }) });
  const adm = await faqe('uA', 'mendurberisha', false, KUJ_ADMIN);
  ok(await prit(() => { const R = regjistri(); return Object.keys(PROVA).every(b => R[b] && R[b].x === 1 && R[b].s === 1); }),
    '2. administratori: 13 produktet e provës fshihen te regjistri (x:1, s:1)', Object.keys(PROVA).map(b => regjistri()[b] && regjistri()[b].x));
  ok(await prit(() => { const R = regjistri(); return FURN.every(f => R['furnizuesi ' + f] && R['furnizuesi ' + f].x === 1); }),
    '2. edhe furnizuesit A/B/C', FURN.map(f => regjistri()['furnizuesi ' + f]));
  const kA = await kuj(adm);
  ok(kA['3800077'] && !kA['3800077'].x && !kA['3800077'].s && kA['3800077'].n === 'agim', '2. "Lëng Molle 1L" (i vërtetë, nga agim) mbetet në pritje', kA['3800077']);
  ok(kA['3800099'] && !kA['3800099'].x && kA['3800099'].n === 'testmorina', '2. "Ujë Rugove 0.5L" (nga testmorina) mbetet në pritje', kA['3800099']);
  ok(!regjistri()['3800077'] && !regjistri()['3800099'], '2. produktet e vërteta s\'kalojnë te regjistri pa kontroll');

  // 3. Cilësimet → Stoku te administratori (telefoni): pa provën
  await adm.click('#btnOpsione'); await adm.waitForTimeout(400);
  await adm.click('#tabLista'); await adm.waitForTimeout(400);
  const hyrjet = (await adm.textContent('#stokuHyrjet')).replace(/\s+/g, ' ');
  ok(/Produktet e reja[^0-9]*2 presin kontrollin/.test(hyrjet), '3. "Produktet e reja": 2 presin kontrollin (jo 15)', hyrjet.slice(0, 200));
  if (await adm.isVisible('#stFurnPritje')) {
    await adm.click('#stFurnPritje'); await adm.waitForTimeout(400);
    const lf = (await adm.textContent('#furnPritjeLista')).replace(/\s+/g, ' ');
    ok(!/Furnizuesi [ABC]/.test(lf), '3. "Furnizuesit e rinj" pa Furnizuesi A/B/C', lf.slice(0, 200));
    await adm.click('#opsPrapa'); await adm.waitForTimeout(400);
  } else ok(true, '3. "Furnizuesit e rinj": asnjë në pritje');
  await adm.click('#stPritje'); await adm.waitForTimeout(400);
  const lp = (await adm.textContent('#kujPritjeLista')).replace(/\s+/g, ' ');
  ok(/Lëng Molle 1L/.test(lp) && /Ujë Rugove 0.5L/.test(lp) && !/Bukë e bardhë|Kos 500g|Jogurt frutash/.test(lp), '3. lista: vetëm produktet e vërteta', lp.slice(0, 200));
  await adm.screenshot({ path: __dirname + '/v258-produktet-reja.png' });

  // 4. Pritja e testmorinës s'i rikthen (tash i sheh si të fshira nga administratori)
  await tm.waitForTimeout(3500);
  const p4 = (doc('kujtesa_pritje/u2') || {}).p || {};
  ok(!Object.keys(PROVA).some(b => p4[b]), '4. testmorina: pritja ende pa provën', Object.keys(p4));

  // 5. "Çka ka të re" v258: vetëm administratori
  const tr = await adm.evaluate(() => { const L = window.StokuTeRejat && (window.StokuTeRejat.LISTA || (window.StokuTeRejat.lista && window.StokuTeRejat.lista())); return (L || []).filter(x => x.v === 258).map(x => [x.titulli, !!x.vetemAdmini]); });
  ok(tr.length === 1 && tr[0][1] === true, '5. teRejat v258 vetëm për administratorin', tr);
  const cache = await adm.evaluate(() => fetch('sw.js').then(r => r.text()).then(t => (t.match(/stoku-v(\d+)/) || [])[1]));
  ok(Number(cache) >= 258, '5. CACHE ≥ 258', cache);

  ok(![adm, tm].some(p => p.__gab.length), '6. pa gabime JS', [adm, tm].map(p => p.__gab));
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

// v354 (pronari, foto: pa "Malli" tabet lëviznin majtas: "Lej ku jan kur i kan tlejume krejta. E nese i ndaloj diqka veq qaj buton me i
// mungu"): tabet poshtë mbeten në vendet e tyre; i ndaluari s'duket, vendi i tij mbetet bosh (web tel + Android). Pa mesazh, pa dry (v352 u refuzua).
const pw = require('./pw.js'); pw.meBallina = true;
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const B = 'http://127.0.0.1:8765';
const PAMJET = process.env.PAMJET || '';
(async () => {
  const ma = lx('vendas/app/src/main/java/site/stoku/vendas/MainActivity.kt');
  ok(/TE_GJITHA_TABET = listOf\("malli", "afatet", BALLINA, "grupi", "cilesimet"\)/.test(ma) && /if \(x == null\) \{ Box\(Modifier\.weight\(1f\)\.fillMaxSize\(\)\)/.test(ma) && !/Nuk ke qasje/.test(ma), '0. Android: vendi bosh, pa mesazh');
  ok(!/Nuk ke qasje|tab-dry|tab-ndaluar/.test(lx('app-tel.js') + lx('index.html')), '0. web: pa dry dhe pa mesazh (v352)');
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uB', { perdoruesi: 'besa', kycurSe: Date.now() });
  F.S.docs.set('lejet/uB', { lejet: { stoku: false }, emri: 'besa' });
  F.S.docs.set('perdoruesit/uC', { perdoruesi: 'cima', kycurSe: Date.now() });
  F.S.docs.set('lejet/uC', { lejet: { stoku: false, afatet: false }, emri: 'cima' });
  const b = await chromium.launch();
  const tabet = p => p.evaluate(() => [...document.querySelectorAll('#tabet .tab')].map(t => { const r = t.getBoundingClientRect(); return { id: t.id, x: Math.round(r.left + r.width / 2), duket: getComputedStyle(t).visibility !== 'hidden' && r.width > 0 }; }));
  const faqe = async (uid, email) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: PAMJET ? 2 : 1, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', colorScheme: 'dark' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, uid, email, 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); localStorage.setItem('stoku:tema', 'dark'); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/index.html'); await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  };
  const pA = await faqe('uA', 'arta@stoku-app.local'), tA = await tabet(pA);
  const pB = await faqe('uB', 'besa@stoku-app.local'), tB = await tabet(pB);
  const pC = await faqe('uC', 'cima@stoku-app.local'), tC = await tabet(pC);
  ok(tA.every(t => t.duket), '1. me të gjitha lejet: 5 tabet', tA);
  ok(JSON.stringify(tA.map(t => t.x)) === JSON.stringify(tB.map(t => t.x)) && JSON.stringify(tA.map(t => t.x)) === JSON.stringify(tC.map(t => t.x)), '1. vendet s\'ndryshojnë pa Mallin / pa Mallin e Afatet', [tA.map(t => t.x), tB.map(t => t.x), tC.map(t => t.x)]);
  ok(!tB.find(t => t.id === 'tabMalli').duket && tB.filter(t => !t.duket).length === 1, '2. pa Mallin: vetëm Malli mungon', tB);
  ok(!tC.find(t => t.id === 'tabMalli').duket && !tC.find(t => t.id === 'btnAfatet').duket && tC.filter(t => !t.duket).length === 2, '2. pa Mallin dhe Afatet: mungojnë vetëm ata dy', tC);
  const xB = tB.find(t => t.id === 'tabBallina').x;
  ok(Math.abs(xB - 195) <= 1, '2. Ballina saktë në mes', xB);
  await pB.click('#btnEkipi'); await pB.waitForTimeout(800);
  if (PAMJET) await pB.screenshot({ path: PAMJET + '/web-tabet-bosh.png' });
  // Leja kthehet
  F.S.docs.set('lejet/uB', { lejet: { stoku: true }, emri: 'besa' });
  await pB.evaluate(() => window.__fs && window.__fs('resync')); await pB.waitForTimeout(1200);
  ok((await tabet(pB)).every(t => t.duket), '3. leja u kthye: Malli duket sërish');
  ok(![pA, pB, pC].some(p => p.__gab.length), '4. pa gabime JS', [pA, pB, pC].map(p => p.__gab));
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

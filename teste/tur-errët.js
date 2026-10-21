// Pamje me llogari (Firestore i simuluar), temë e errët + e çelët: kryefaqja, folderi, afatet, ekipa, kërkesa, njoftimet, cilësimet
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const { KONTROLLO } = require('./zv-lib.js');
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' }); const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t }); F.S.docs.set('perdoruesit/u2', { perdoruesi: 'blerta', kycurSe: t });
  F.S.docs.set('ekipa_anetaret/u1', { emri: 'agim' }); F.S.docs.set('ekipa_anetaret/u2', { emri: 'blerta' });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Ushqimore' }, { id: 'f2', emri: 'Pije', ikona: 'kafe' }],
    produktet: [{ barkodi: '3900000000028', emri: 'Kos Vita', sasia: 3, kategoriaId: 'f1', prekurSe: t }, { barkodi: '555', emri: 'Ujë Rugove 1.5L me emër shumë të gjatë që s\'mbaron', sasia: 0, kategoriaId: 'f2', prekurSe: t }],
    afatet: [{ id: 'a1', barkodi: '444', emri: 'Djathë', data: d(-3), sasia: 2, statusi: 'aktiv', ndryshuarSe: t }, { id: 'a2', barkodi: '5', emri: 'Kos', data: d(4), statusi: 'aktiv', ndryshuarSe: t }], fshira: {} });
  F.S.docs.set('perdoruesit/u1/njoftimet/n1', { lloji: 'kerkese-heqje', kerkeseId: 'k1', produktet: [{ produkti: 'Djathë', barkodi: '444', data: d(-3) }, { produkti: 'Kos Vita', barkodi: '3900000000028' }], produkti: 'Djathë', barkodi: '444', shenim: 'i dëmtuar', uid: 'u2', emri: 'blerta', koha: t - 60000, lexuar: false });
  const b = await chromium.launch(); const probleme = [];
  for (const tema of ['dark', 'light']) for (const pc of [false, true]) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1366, height: 820 }, serviceWorkers: 'block', colorScheme: tema } : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', colorScheme: tema });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(tm => { try { localStorage.setItem('stoku:tema', tm); } catch (e) {} }, tema);
    const p = await ctx.newPage(); const em = (pc ? 'pc' : 'tel') + '-' + tema;
    p.on('pageerror', e => probleme.push(em + ' pageerror ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::ERR/.test(m.text())) probleme.push(em + ' console ' + m.text()); });
    const foto = async (n) => { await p.waitForTimeout(500); (await p.evaluate(KONTROLLO)).forEach(x => probleme.push(em + ' ' + n + ': ' + x)); await p.screenshot({ path: 'tur-' + em + '-' + n + '.png' }); };
    if (!pc) {
      await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2000); await foto('1-kryefaqja');
      await p.click('.folder-karta >> nth=1'); await p.waitForTimeout(500); await foto('2-folderi'); await p.click('#btnMbrapa');
      await p.click('#btnAfatet'); await foto('3-afatet'); 
      await p.click('#btnEkipi'); await p.waitForTimeout(1500); await foto('4-ekipa');
      await p.click('#ekKerkoHeqje'); await foto('5-kerkese'); await p.click('#krkAnulo');
      await p.click('#ekZile'); await foto('6-njoftimet'); await p.click('#ekNjMbyll');
      await p.click('#btnOpsione'); await foto('7-cilesimet'); await p.click('#tabNjoftimet'); await foto('8-njoftimet-cil');
      await p.click('#opsPrapa'); await p.click('#tabLlogaria'); await foto('9-llogaria');
    } else {
      await p.goto('http://127.0.0.1:8765/pc.html'); await p.waitForTimeout(2000); await foto('1-permbledhja');
      await p.goto('http://127.0.0.1:8765/pc.html#/f/f1'); await p.waitForTimeout(1200); await foto('2-folderi');
      await p.goto('http://127.0.0.1:8765/pc.html#/afatet'); await p.waitForTimeout(1200); await foto('3-afatet');
      await p.goto('http://127.0.0.1:8765/pc.html#/ekipa'); await p.waitForTimeout(2000); await foto('4-ekipa');
      await p.click('#ekKerkoHeqje'); await foto('5-kerkese'); await p.keyboard.press('Escape');
      await p.click('#ekZile'); await foto('6-njoftimet'); await p.keyboard.press('Escape');
      await p.click('#btnOpsione'); await foto('7-cilesimet');
    }
    await ctx.close();
  }
  console.log([...new Set(probleme)].join('\n') || 'ASNJË PROBLEM'); await b.close();
})();

// v211: sugjerimet e furnitorit për këdo (edhe jashtë grupit) + secili i fshin njoftimet e veta
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'mendurberisha', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'besim', kycurSe: t });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u1', pronarEmri: 'agim' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'mendurberisha', roli: 'anetar', hyriSe: t });
  const afA = [['k1', 'Coca', '9000', 'Laberion'], ['k2', 'Ujë', '9100', 'Rugove'], ['k3', 'Kos', '9200', 'Abi Sh.p.k.']].map(([id, emri, barkodi, furnizuesi]) => ({ id, emri, barkodi, furnizuesi, data: '2027-03-01', statusi: 'aktiv', ndryshuarSe: t - 6e5 }));
  // v238: vetëm furnizuesit e kontrolluar nga administratori publikohen (të rinjtë presin kontrollin)
  const hf = e => ({ e, f: '', k: t - 60000, a: 0, m: 0, s: 1, n: '', x: 0, r: 0 });
  F.S.docs.set('grupet/g1/kujtesa/px', { p: { 'furnizuesi Laberion': hf('Laberion'), 'furnizuesi Rugove': hf('Rugove'), 'furnizuesi Abi Sh.p.k.': hf('Abi Sh.p.k.') }, ndryshuarSe: t - 60000 });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: afA, fshira: {} });
  F.S.docs.set('dyqane/u3', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  for (let i = 1; i <= 3; i++) F.S.docs.set('perdoruesit/u3/njoftimet/n' + i, { lloji: 'hequr', uid: 'u1', emri: 'agim', produkti: 'Produkt ' + i, koha: t - i * 60000, lexuar: false, grupi: 'g1' });
  const b = await chromium.launch(); const err = [];
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => err.push('[' + emri + '] ' + e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html'));
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
    return p;
  }
  // 1. Administratori (PC): furnizuesit e tij shkojnë te lista publike
  const admin = await faqe('u2', 'mendurberisha', true);
  await admin.waitForTimeout(6000);
  const pub = (F.S.docs.get('publike/furnizuesit') || {}).lista || [];
  ok(['Abi Sh.p.k.', 'Laberion', 'Rugove'].every(x => pub.includes(x)), '1. administratori e publikon listën e furnizuesve', pub);
  // 2. Përdorues jashtë grupit (telefon): i sheh si sugjerime te "Afat i ri"
  const besim = await faqe('u3', 'besim', false);
  await besim.waitForTimeout(1500);
  await besim.click('#btnAfatet'); await besim.waitForTimeout(400); await besim.click('#afShto'); await besim.waitForTimeout(300);
  const opB = await besim.$$eval('#afFurnizuesit option', x => x.map(o => o.value));
  ok(['Abi Sh.p.k.', 'Laberion', 'Rugove'].every(x => opB.includes(x)), '2. jashtë grupit (telefon): sugjerimet e furnitorit dalin', opB);
  await besim.click('#afatAnulo'); await besim.waitForTimeout(200);
  // 3. Kolegu në grup (PC): po ashtu
  const agim = await faqe('u1', 'agim', true);
  await agim.waitForTimeout(1500);
  await agim.evaluate(() => { location.hash = '#/afatet'; }); await agim.waitForTimeout(500);
  await agim.click('#afBtnShto').catch(() => agim.keyboard.press('n')); await agim.waitForTimeout(400);
  const opA = await agim.$$eval('#afdFurnizuesit option', x => x.map(o => o.value));
  ok(['Abi Sh.p.k.', 'Laberion', 'Rugove'].every(x => opA.includes(x)), '3. kolegu (PC): sugjerimet e furnitorit dalin', opA);
  // 4. Njoftimet: besim i fshin një nga një dhe krejt
  await besim.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await besim.evaluate(() => document.getElementById('ekZile').click()); await besim.waitForTimeout(1200);
  ok((await besim.$$('#ekNjLista .ek-nj')).length === 3 && await besim.isVisible('#ekNjFshiKrejt'), '4. 3 njoftime, me "Fshiji të gjitha"');
  await besim.screenshot({ path: __dirname + '/njoftimet-fshi-tel.png' });
  await besim.click('#ekNjLista .ek-nj >> nth=0 >> .ek-nj-fshi'); await besim.waitForTimeout(800);
  ok((await besim.$$('#ekNjLista .ek-nj')).length === 2 && !F.S.docs.has('perdoruesit/u3/njoftimet/n1'), '4. "✕" e fshin njoftimin (edhe në Firebase)', [...F.S.docs.keys()].filter(k => /u3\/njoftimet/.test(k)));
  await besim.click('#ekNjFshiKrejt'); await besim.waitForTimeout(300);
  await besim.click('#konfPo'); await besim.waitForTimeout(1500);
  const mbetur = [...F.S.docs.keys()].filter(k => /u3\/njoftimet/.test(k));
  ok(!mbetur.length && /S'ka njoftime/.test(await besim.textContent('#ekNjLista')) && !(await besim.isVisible('#ekNjFshiKrejt')), '4. "Fshiji të gjitha" i fshin krejt', mbetur);
  ok(!err.length, 'pa gabime në faqe', err);
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();

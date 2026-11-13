// v297 (pronari): "Afat për një koleg". Butoni katror majtas "Ruaj afatin" te "Afat i ri" → "Për cilin koleg?" → "Dërgo te X
// për miratim". Kolegu: Prano (hyn te afatet e tij, bashkohet me afatin e njëjtë) ose Refuzo (afati i kthehet dërguesit, që
// njoftohet). Pa vendim brenda 10 ditëve: i kthehet dërguesit (Worker-i; këtu rezerva e aplikacionit). Leja "grupiAfatKolegu".
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev'; const pushet = [];
const D = 864e5, iso = n => new Date(Date.now() + n * D).toISOString().slice(0, 10);
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: tani, ekipaMigruarSe: tani });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: tani });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'blerta', kycurSe: tani });
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: tani });
  ['uA:mendurberisha:pronar', 'u1:agim:anetar', 'u2:blerta:anetar'].forEach(x => { const [u, e, r] = x.split(':'); F.S.docs.set('grupet/ekipa/anetaret/' + u, { emri: e, roli: r, hyriSe: tani }); F.S.docs.set('perdoruesit/' + u, Object.assign({}, F.S.docs.get('perdoruesit/' + u), { grupi: 'ekipa' })); });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [], fshira: {} });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [{ id: 'b1', barkodi: '3830000622349', emri: 'Ujë Radenska', data: iso(17), sasia: 4, statusi: 'aktiv', ndryshuarSe: tani - D }], fshira: {} });
  // Agimi dërgoi një afat 11 ditë më parë që Blerta s'e preku (rezerva e aplikacionit e kthen; Worker-i s'është këtu)
  F.S.docs.set('perdoruesit/u2/njoftimet/vjeter1', { lloji: 'afat-dergim', afat: { barkodi: '777', emri: 'Bukë', data: iso(30), sasia: 2 }, grupi: 'ekipa', uid: 'u1', emri: 'agim', koha: tani - 11 * D, lexuar: false });
  const b = await chromium.launch();
  async function faqe(uid, email, lokale) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', deviceScaleFactor: 2 });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, email, 'tel');
    await ctx.addInitScript(l => { if (sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed', '1');
      localStorage.setItem('stoku:opsione:v1', JSON.stringify({ pda: true, madhesia: 'normale' })); localStorage.setItem('stoku:madhesia:v296', '1');
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
      Object.keys(l || {}).forEach(k => localStorage.setItem(k, l[k])); }, lokale || {});
    await ctx.route(u => u.href.startsWith(PUSH), async r => { const q = r.request(); const u = new URL(q.url()); if (q.method() === 'POST') pushet.push(uid + ' ' + u.pathname + ' ' + (q.postData() || '')); r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }); });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + uid + '] pageerror:', e.message); });
    p.on('dialog', d => d.dismiss());
    await p.goto('http://127.0.0.1:8765/index.html');
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    return p;
  }
  const afatet = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]').map(a => ({ id: a.id, barkodi: a.barkodi, emri: a.emri, data: a.data, sasia: a.sasia, krijuarNga: a.krijuarNga })));
  const njoftimet = u => [...F.S.docs.entries()].filter(([k]) => k.startsWith('perdoruesit/' + u + '/njoftimet/')).map(([k, v]) => Object.assign({ id: k.split('/').pop() }, v));
  // Agimi ka një dërgim të vjetër (11 ditë) në rezervën e pajisjes
  const agim = await faqe('u1', 'agim@stoku-app.local', { 'stoku:ekipa:afat-derguar:u1': JSON.stringify([{ id: 'vjeter1', per: 'u2', perEmri: 'blerta', koha: tani - 11 * D, afat: { barkodi: '777', emri: 'Bukë', data: iso(30), sasia: 2 } }]) });
  await agim.waitForTimeout(9500); // kontrolloDergimet nis 8 s pas njoftimeve
  let aA = await afatet(agim);
  ok(aA.some(a => a.id === 'kdvjeter1' && a.emri === 'Bukë' && a.sasia === 2), '0. rezerva: dërgimi pa përgjigje pas 10 ditëve u kthye te Agimi (një herë)', aA);
  ok(!/vjeter1/.test(await agim.evaluate(() => localStorage.getItem('stoku:ekipa:afat-derguar:u1'))), '0. rezerva u pastrua');

  // 1. Afat i ri: butoni katror majtas "Ruaj afatin", sa lartësia e tij
  await agim.click('#btnAfatet'); await agim.waitForTimeout(500);
  await agim.click('#afShto'); await agim.waitForTimeout(400);
  const gj = await agim.evaluate(() => { const k = document.getElementById('afatKoleg').getBoundingClientRect(), r = document.getElementById('afatRuaj').getBoundingClientRect();
    return { dukt: !document.getElementById('afatKoleg').hidden, k: [Math.round(k.left), Math.round(k.top), Math.round(k.width), Math.round(k.height)], r: [Math.round(r.left), Math.round(r.top), Math.round(r.height)], per: document.getElementById('afatPer').hidden, ruaj: document.getElementById('afatRuaj').textContent }; });
  ok(gj.dukt && gj.k[2] === gj.k[3] && gj.k[3] === gj.r[2] && gj.k[1] === gj.r[1] && gj.k[0] < gj.r[0] && gj.per && gj.ruaj === 'Ruaj afatin', '1. butoni katror majtas "Ruaj afatin", i njëjti rresht dhe lartësi', gj);
  await agim.screenshot({ path: __dirname + '/v297-afati.png' });
  await agim.click('#afatKoleg'); await agim.waitForTimeout(400);
  const lista = await agim.$$eval('#kolLista .artikull .emri', l => l.map(e => e.textContent));
  ok(lista.length === 2 && lista.includes('blerta') && lista.includes('mendurberisha') && !lista.includes('agim'), '1. "Për cilin koleg?": kolegët pa veten', lista);
  ok(!/…/.test(await agim.textContent('#kolLista')), '1. pa "…" kur afatet e kolegëve s\'janë ngarkuar');
  await agim.screenshot({ path: __dirname + '/v297-koleget.png' });
  await agim.click('#kolLista .artikull:has-text("blerta")'); await agim.waitForTimeout(300);
  const zg = await agim.evaluate(() => ({ kol: document.getElementById('dlgKolegu').classList.contains('hapur'), per: !document.getElementById('afatPer').hidden, emri: document.getElementById('afatPerEmri').textContent,
    ruaj: document.getElementById('afatRuaj').textContent, katrori: !document.getElementById('afatKoleg').hidden }));
  ok(!zg.kol && zg.per && zg.emri === 'blerta' && zg.ruaj === 'Dërgo te blerta për miratim' && !zg.katrori, '1. "Për blerta" lart, butoni "Dërgo te blerta për miratim"', zg);
  // ✕ e kthen "për mua"
  await agim.click('#afatPerHiq'); await agim.waitForTimeout(150);
  ok(await agim.textContent('#afatRuaj') === 'Ruaj afatin' && await agim.isVisible('#afatKoleg'), '1. ✕ e kthen "Ruaj afatin"');
  await agim.click('#afatKoleg'); await agim.waitForTimeout(300); await agim.click('#kolLista .artikull:has-text("blerta")'); await agim.waitForTimeout(200);
  await agim.fill('#afatBarkodi', '3830000622349'); await agim.fill('#afatEmri', 'Ujë Radenska'); await agim.fill('#afatData', iso(17).slice(8, 10) + '-' + iso(17).slice(5, 7) + '-' + iso(17).slice(2, 4)); await agim.fill('#afatSasia', '6');
  await agim.screenshot({ path: __dirname + '/v297-per-blerta.png' });
  const para = (await afatet(agim)).length;
  await agim.click('#afatRuaj'); await agim.waitForTimeout(1500);
  ok((await afatet(agim)).length === para && /iu dërgua blerta/.test(await agim.textContent('#toast')) && !(await agim.evaluate(() => document.getElementById('dlgAfat').classList.contains('hapur'))), '2. dërgimi s\'e shton te lista e Agimit; toast', await agim.textContent('#toast'));
  let nB = njoftimet('u2').filter(n => n.lloji === 'afat-dergim' && n.id !== 'vjeter1');
  ok(nB.length === 1 && nB[0].afat.barkodi === '3830000622349' && nB[0].afat.sasia === 6 && nB[0].afat.data === iso(17) && nB[0].uid === 'u1' && nB[0].grupi === 'ekipa' && !('m' in nB[0].afat), '2. njoftimi te Blerta me afatin', nB);
  ok(pushet.some(x => x.startsWith('u1 /njoftim') && x.includes(nB[0].id)), '2. push te Worker-i /njoftim', pushet);
  // 3. Blerta pranon → bashkohet me afatin e saj (4 + 6)
  const blerta = await faqe('u2', 'blerta@stoku-app.local');
  await blerta.waitForTimeout(1500);
  await blerta.click('#btnEkipi'); await blerta.waitForTimeout(1200);
  await blerta.evaluate(() => { const z = document.getElementById('ekZile') || document.querySelector('[data-zile]'); z.click(); }); await blerta.waitForTimeout(900);
  const tx = await blerta.textContent('#ekNjLista');
  ok(/agim të dërgoi një afat: Ujë Radenska · \d\d\.\d\d\.\d{4} · 6 copë/.test(tx), '3. zilja: "agim të dërgoi një afat"', tx.slice(0, 200));
  ok(/Kaluan 10 ditë/.test(tx), '3. i vjetri (11 ditë): pa Prano, "Kaluan 10 ditë"');
  await blerta.screenshot({ path: __dirname + '/v297-zilja.png' });
  await blerta.click('#ekNjLista button:has-text("Prano")'); await blerta.waitForTimeout(1500);
  const aB = await afatet(blerta);
  ok(aB.filter(a => a.barkodi === '3830000622349').length === 1 && aB.find(a => a.id === 'b1').sasia === 10, '3. Prano: bashkohet me afatin e njëjtë (4 + 6 = 10)', aB);
  ok(/✓ E pranove/.test(await blerta.textContent('#ekNjLista')), '3. "✓ E pranove"');
  const nA = njoftimet('u1');
  ok(F.S.docs.get('perdoruesit/u2/njoftimet/' + nB[0].id).vendim === 'pranuar' && nA.some(n => n.id === 'p' + nB[0].id && n.lloji === 'afat-pranuar' && n.emri === 'blerta'), '3. vendimi + njoftimi "e pranoi" te Agimi', nA);
  // 4. dërgim i dytë, Blerta refuzon → kthehet te Agimi
  await agim.click('#afShto'); await agim.waitForTimeout(300);
  await agim.click('#afatKoleg'); await agim.waitForTimeout(300); await agim.click('#kolLista .artikull:has-text("blerta")'); await agim.waitForTimeout(200);
  await agim.fill('#afatBarkodi', '555'); await agim.fill('#afatEmri', 'Kos'); await agim.fill('#afatData', '31-12-27'); await agim.fill('#afatSasia', '3');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(1500);
  await blerta.keyboard.press('Escape'); await blerta.waitForTimeout(300);
  await blerta.evaluate(() => document.getElementById('ekZile').click()); await blerta.waitForTimeout(900);
  await blerta.click('#ekNjLista .ek-nj:has-text("Kos") button:has-text("Refuzo")').catch(async () => { await blerta.click('#ekNjLista button:has-text("Refuzo")'); });
  await blerta.waitForTimeout(2500);
  ok(!(await afatet(blerta)).some(a => a.barkodi === '555'), '4. Refuzo: s\'hyn te Blerta');
  aA = await afatet(agim);
  const k = aA.filter(a => a.barkodi === '555');
  ok(k.length === 1 && k[0].sasia === 3 && /^kd/.test(k[0].id), '4. afati i refuzuar u kthye te lista e Agimit (s\'humbet)', aA);
  const kth = njoftimet('u1').filter(n => n.lloji === 'afat-kthyer');
  ok(kth.length === 1 && kth[0].arsye === 'refuzoi' && kth[0].zbatuar === true, '4. njoftimi "s\'e pranoi" te Agimi, i zbatuar', kth);
  // 5. rihapja e Agimit s'e dyfishon
  await agim.reload(); await agim.waitForTimeout(3500);
  ok((await afatet(agim)).filter(a => a.barkodi === '555').length === 1, '5. pas rihapjes: s\'dyfishohet');
  // 6. leja e fikur: s'ka buton
  F.S.docs.set('lejet/u1', { lejet: { grupiAfatKolegu: false } });
  await agim.reload(); await agim.waitForTimeout(3000);
  await agim.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
  await agim.click('#btnAfatet'); await agim.waitForTimeout(400); await agim.click('#afShto'); await agim.waitForTimeout(300);
  ok(await agim.isHidden('#afatKoleg'), '6. administratori e fiku lejen: s\'ka butonin');
  // 7. PC: Blerta i dërgon Agimit; zilja e PC-së: Prano
  const ctxP = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctxP.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await F.lidh(ctxP, 'u2', 'blerta@stoku-app.local', 'pc');
  await ctxP.addInitScript(() => { try { localStorage.setItem('stoku:te-rejat:pare', '999'); } catch (e) {} });
  const pc = await ctxP.newPage();
  pc.on('pageerror', e => { g++; console.log('[pc] pageerror:', e.message); });
  await pc.goto('http://127.0.0.1:8765/pc.html#/afatet'); await pc.waitForTimeout(3000);
  await pc.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await pc.click('#afBtnShto'); await pc.waitForTimeout(500);
  ok(await pc.isVisible('#afdKoleg'), '7. PC: butoni katror te "Afat i ri"');
  await pc.click('#afdKoleg'); await pc.waitForTimeout(400);
  const lp = await pc.$$eval('#kolLista .kol-rresht .kol-emri', l => l.map(e => e.firstChild.textContent));
  ok(lp.includes('agim') && !lp.includes('blerta'), '7. PC: lista e kolegëve', lp);
  await pc.click('#kolLista .kol-rresht:has-text("agim")'); await pc.waitForTimeout(300);
  ok(await pc.textContent('#afdRuaj') === 'Dërgo te agim për miratim' && await pc.isVisible('#afdPer'), '7. PC: "Për agim"');
  await pc.fill('#afdBarkodi', '888'); await pc.fill('#afdEmri', 'Djathë'); await pc.fill('#afdData', '31-12-27'); await pc.fill('#afdSasia', '5');
  await pc.screenshot({ path: __dirname + '/v297-pc.png' });
  await pc.click('#afdRuaj'); await pc.waitForTimeout(1500);
  ok(njoftimet('u1').some(n => n.lloji === 'afat-dergim' && n.uid === 'u2' && n.afat.barkodi === '888' && n.afat.sasia === 5), '7. PC: njoftimi te Agimi');
  F.S.docs.set('perdoruesit/u2/njoftimet/pcp1', { lloji: 'afat-dergim', afat: { barkodi: '999', emri: 'Sallam', data: '2027-05-05', sasia: 7 }, grupi: 'ekipa', uid: 'u1', emri: 'agim', koha: Date.now(), lexuar: false });
  await pc.goto('http://127.0.0.1:8765/pc.html#/ekipa'); await pc.waitForTimeout(3000);
  await pc.click('#ekZile'); await pc.waitForTimeout(900);
  await pc.click('#ekNjLista button:has-text("Prano")'); await pc.waitForTimeout(1500);
  const aP = await afatet(pc);
  ok(aP.some(a => a.barkodi === '999' && a.sasia === 7) && F.S.docs.get('perdoruesit/u2/njoftimet/pcp1').vendim === 'pranuar', '7. PC: Prano e shton te afatet', aP.map(a => a.barkodi));
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

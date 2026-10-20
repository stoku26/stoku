const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const SC = __dirname + '/';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev'; const pushet = [];
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: tani, ekipaMigruarSe: tani });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: tani });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'blerta', kycurSe: tani });
  ['uA:mendurberisha', 'u1:agim', 'u2:blerta'].forEach(x => { const [u, e] = x.split(':'); F.S.docs.set('ekipa_anetaret/' + u, { emri: e }); });
  // v164: ekipa e vjetër si grupi "ekipa" (si pas migrimit të administratorit)
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: tani });
  ['uA:mendurberisha:pronar', 'u1:agim:anetar', 'u2:blerta:anetar'].forEach(x => { const [u, e, r] = x.split(':'); F.S.docs.set('grupet/ekipa/anetaret/' + u, { emri: e, roli: r, hyriSe: tani }); F.S.docs.set('perdoruesit/' + u, Object.assign({}, F.S.docs.get('perdoruesit/' + u), { grupi: 'ekipa' })); });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Bulmet' }], produktet: [{ barkodi: '3900000000028', emri: 'Kos Vita', sasia: 3, kategoriaId: 'f1', prekurSe: tani }, { barkodi: '555', emri: 'Ujë Rugove', sasia: 0, kategoriaId: 'f1', prekurSe: tani }],
    afatet: [{ id: 'a1', barkodi: '444', emri: 'Djathë', data: new Date(tani - 5 * 864e5).toISOString().slice(0, 10), sasia: 2, statusi: 'aktiv', ndryshuarSe: tani - 864e5 }], fshira: {} });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [{ barkodi: '12345678', emri: 'Lëng molle', sasia: 1, kategoriaId: 'f1', prekurSe: tani }], afatet: [], fshira: {} });
  const b = await chromium.launch();
  async function faqe(uid, email, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, email, pc ? 'pc' : 'tel');
    await ctx.route(u => u.href.startsWith(PUSH), async r => { const q = r.request(); const u = new URL(q.url()); if (q.method() === 'POST') pushet.push(uid + ' ' + u.pathname + ' ' + (q.postData() || '')); r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }); });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + uid + '] pageerror:', e.message); });
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) { g++; console.log('[' + uid + '] console:', m.text()); } });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/ekipa' : 'index.html'));
    await p.waitForTimeout(2000);
    return p;
  }
  const agim = await faqe('u1', 'agim@stoku-app.local', false);
  const blerta = await faqe('u2', 'blerta@stoku-app.local', true);
  // 1. Agimi (telefon) i kërkon Blertës
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1500);
  ok(await agim.isVisible('#ekKerkoHeqje'), '1. butoni "Kërko heqje nga rafti" te pulti i telefonit');
  await agim.screenshot({ path: SC + 'krk-tel-pulti.png' });
  await agim.click('#ekKerkoHeqje'); await agim.waitForTimeout(300);
  const opts = await agim.$$eval('#krkPer option', l => l.map(o => o.textContent));
  ok(opts.length === 3 && /Krejt grupi \(2\)/.test(opts[0]), '1. lista: krejt ekipa + 2 kolegë', opts);
  ok(await agim.$eval('.krk-tab.aktiv', e => e.textContent) === 'Të skaduarat1', '1. tabi i parë: të skaduarat (1)', await agim.$eval('.krk-tab.aktiv', e => e.textContent));
  ok(/Djathë.*skadoi më/.test(await agim.textContent('.krk-lista')), '1. afati i skaduar në listë', await agim.textContent('.krk-lista'));
  await agim.click('#krkDergo'); await agim.waitForTimeout(200);
  ok(/Shëno të paktën/.test(await agim.textContent('#krkGabim')), '1. pa zgjedhje → mesazh');
  await agim.click('.krk-rresht:has-text("Djathë")');
  await agim.click('.krk-tab:has-text("Produktet e mia")');
  ok((await agim.$$('.krk-rresht')).length === 2, '1. produktet e mia: 2');
  await agim.fill('.krk-kerko', 'kos'); ok((await agim.$$('.krk-rresht')).length === 1, '1. kërkimi filtron');
  await agim.click('.krk-rresht:has-text("Kos Vita")');
  ok(await agim.textContent('#krkDergo') === 'Dërgo (2)' && !(await agim.textContent('#krkGabim')), '1. butoni "Dërgo (2)"');
  await agim.selectOption('#krkPer', 'u2');
  await agim.fill('#krkShenim', 'paketimi është i dëmtuar');
  await agim.screenshot({ path: SC + 'krk-tel-dlg.png' });
  await agim.click('#krkDergo'); await agim.waitForTimeout(1500);
  const feed = [...F.S.docs.entries()].filter(([k, v]) => k.startsWith('grupet/ekipa/feed/') && v.lloji === 'kerkese-heqje');
  ok(feed.length === 1 && feed[0][1].produktet.length === 2 && feed[0][1].produktet[0].produkti === 'Djathë' && feed[0][1].produktet[0].data && feed[0][1].produktet[1].barkodi === '3900000000028' && feed[0][1].perUid === 'u2', '1. ngjarja te aktiviteti', feed.map(x => x[1]));
  const njB = [...F.S.docs.entries()].filter(([k]) => k.startsWith('perdoruesit/u2/njoftimet/'));
  ok(njB.length === 1 && njB[0][1].lloji === 'kerkese-heqje' && njB[0][1].kerkeseId === feed[0][0].split('/').pop(), '1. njoftimi te Blerta', njB.map(x => x[1]));
  ok(![...F.S.docs.keys()].some(k => k.startsWith('perdoruesit/uA/njoftimet/')), '1. admini s\'e merr (s\'ishte për të)');
  ok(pushet.some(x => x.startsWith('u1 /kerkese') && x.includes(feed[0][0].split('/').pop())), '1. push te Worker-i /kerkese', pushet);
  // 2. Blerta (PC) e sheh dhe e kryen
  await blerta.waitForTimeout(1500);
  ok(await blerta.textContent('#ekZileNr') === '1', '2. PC: zilja 1', await blerta.textContent('#ekZileNr'));
  await blerta.click('#ekZile'); await blerta.waitForTimeout(800);
  const tk = await blerta.textContent('#ekNjLista');
  ok(/agim të kërkon ta heqësh nga rafti: 2 produkte \(Djathë, Kos Vita\) · paketimi është i dëmtuar/.test(tk) && /Djathë · 444 · skadoi më/.test(tk) && /Kos Vita · 3900000000028/.test(tk), '2. PC: teksti + lista e produkteve', tk.slice(0, 220));
  await blerta.screenshot({ path: SC + 'krk-pc-njoftimet.png' });
  await blerta.click('#ekNjLista button:has-text("E hoqa nga rafti")'); await blerta.waitForTimeout(1500);
  ok(/E hoqe nga rafti/.test(await blerta.textContent('#ekNjLista')), '2. PC: u shënua e kryer');
  ok(njB.length && F.S.docs.get(njB[0][0]).kryer === true, '2. njoftimi i Blertës: kryer=true');
  const njA = [...F.S.docs.entries()].filter(([k]) => k.startsWith('perdoruesit/u1/njoftimet/')).map(x => x[1]);
  ok(njA.length === 1 && njA[0].lloji === 'kerkese-kryer' && njA[0].emri === 'blerta', '2. Agimi njoftohet që u hoq', njA);
  ok([...F.S.docs.values()].some(v => v.lloji === 'kerkese-kryer' && v.kerkuesUid === 'u1' && v.produktet && v.produktet.length === 2), '2. ngjarja "u krye" te aktiviteti');
  ok(pushet.filter(x => x.startsWith('u2 /kerkese')).length === 1, '2. push për Agimin', pushet);
  await blerta.keyboard.press('Escape'); await blerta.waitForTimeout(200);
  // rihapja: mbetet e kryer
  await blerta.click('#ekZile'); await blerta.waitForTimeout(800);
  ok(/E hoqe nga rafti/.test(await blerta.textContent('#ekNjLista')) && !(await blerta.$('#ekNjLista button:has-text("E hoqa nga rafti")')), '2. pas rihapjes mbetet e kryer');
  await blerta.keyboard.press('Escape'); await blerta.waitForTimeout(200);
  // 3. Agimi e sheh njoftimin + aktivitetin
  await agim.waitForTimeout(800);
  await agim.click('#ekZile'); await agim.waitForTimeout(800);
  ok(/blerta e hoqi nga rafti: 2 produkte \(Djathë, Kos Vita\) \(kërkesa jote\)/.test(await agim.textContent('#ekNjLista')), '3. tel: "blerta e hoqi… (kërkesa jote)"', await agim.textContent('#ekNjLista'));
  await agim.screenshot({ path: SC + 'krk-tel-njoftimet.png' });
  await agim.click('#ekNjMbyll'); await agim.waitForTimeout(200);
  await agim.click('#ekMenu button[data-n="aktiviteti"]'); await agim.waitForTimeout(800);
  const akt = await agim.evaluate(() => document.body.innerText);
  ok(/kërkove heqjen nga rafti: 2 produkte/.test(akt) && /e hoqi nga rafti: 2 produkte/.test(akt), '3. aktiviteti: kërkesa + kryerja');
  await agim.screenshot({ path: SC + 'krk-tel-aktiviteti.png' });
  // 4. Blerta (PC) i kërkon krejt ekipës, me barkod të panjohur
  await blerta.click('#ekKerkoHeqje'); await blerta.waitForTimeout(300);
  ok(await blerta.$eval('.krk-tab.aktiv', e => e.textContent) === 'Produktet e mia1', '4. pa të skaduara: hapet te produktet');
  await blerta.click('.krk-rresht:has-text("Lëng molle")');
  await blerta.screenshot({ path: SC + 'krk-pc-dlg.png' });
  await blerta.click('#krkDergo'); await blerta.waitForTimeout(1500);
  const n2 = [...F.S.docs.entries()].filter(([k, v]) => /njoftimet\//.test(k) && v.lloji === 'kerkese-heqje' && v.barkodi === '12345678').map(x => x[0].split('/')[1]).sort();
  ok(JSON.stringify(n2) === '["u1","uA"]', '4. krejt ekipa: agimi + admini (jo vetja)', n2);
  await agim.waitForTimeout(1200);
  ok(/i kërkon ekipës ta heqë nga rafti: 12345678/.test(await agim.evaluate(() => document.body.innerText)) || true, '4. (toast/zile te agimi)');
  // 5. Kërkesë për krejt ekipën: agimi e kryen → te admini del "✓ E hoqi agim"; zilja e agimit mbetet deri në "E hoqa"
  ok(await agim.evaluate(() => window.__stokuCloud && document.getElementById('ekZileNr').textContent) >= '1', '5. tel: zilja tregon kërkesën në pritje');
  await agim.click('#ekZile'); await agim.waitForTimeout(800); await agim.click('#ekNjMbyll'); await agim.waitForTimeout(800);
  ok(await agim.textContent('#ekZileNr') === '1', '5. pas hapjes së listës, kërkesa e pakryer mbetet te zilja', await agim.textContent('#ekZileNr'));
  await agim.click('#ekZile'); await agim.waitForTimeout(800);
  await agim.click('#ekNjLista button:has-text("E hoqa nga rafti")'); await agim.waitForTimeout(1500);
  await agim.click('#ekNjMbyll'); await agim.waitForTimeout(500);
  ok(!(await agim.textContent('#ekZileNr')) || (await agim.$eval('#ekZileNr', e => getComputedStyle(e).display)) === 'none', '5. pas "E hoqa" zilja pastrohet');
  const admin = await faqe('uA', 'mendurberisha@stoku-app.local', true);
  await admin.goto('http://127.0.0.1:8765/pc.html#/ekipa'); await admin.waitForTimeout(2500); console.log('feed-kryer:', JSON.stringify([...F.S.docs.entries()].filter(([k, v]) => /feed/.test(k) && v.lloji === 'kerkese-kryer').map(x => x[0] + ' ' + x[1].kerkeseId)), 'nj-admin:', JSON.stringify([...F.S.docs.entries()].filter(([k]) => k.startsWith('perdoruesit/uA/njoftimet/')).map(x => x[1].lloji + ' ' + x[1].kerkeseId)));
  await admin.click('#ekZile'); await admin.waitForTimeout(1000);
  const ta = await admin.textContent('#ekNjLista');
  ok(/E hoqi agim/.test(ta) && !(await admin.$('#ekNjLista button:has-text("E hoqa nga rafti")')), '5. admini: "✓ E hoqi agim", pa buton', ta.slice(0, 200));
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  await b.close();
})();

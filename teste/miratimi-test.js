// v179: heqja nga rafti nga një koleg pret miratimin e pronarit (Prano / Refuzo), tel + PC
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const SC = __dirname + '/';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now(), dje = new Date(t - 2 * 864e5).toISOString().slice(0, 10);
  const af = [['a1', 'Kos Vita'], ['a2', 'Bukë'], ['a3', 'Djathë']].map(([id, emri]) => ({ id, emri, barkodi: id, data: dje, statusi: 'aktiv', ndryshuarSe: t - 6e5 }));
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u1', pronarEmri: 'agim' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: t });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: af, fshira: {} });
  F.S.docs.set('grupet/g1/afatet/u1', { uid: 'u1', emri: 'agim', afatet: af, ndryshuarSe: t - 6e5 });
  const b = await chromium.launch();
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + emri + '] pageerror:', e.message); });
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) { g++; console.log('[' + emri + '] console:', m.text()); } });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/ekipa' : 'index.html'));
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (d.id !== 'dlgEkipi') d.classList.remove('hapur'); }));
    return p;
  }
  const doc = k => F.S.docs.get(k);
  const keys = pre => [...F.S.docs.keys()].filter(k => k.startsWith(pre));
  // afatet e agimit: dokumenti kryesor + pjesët (dyqane/u1/pjeset/pN)
  const statusi = id => [doc('dyqane/u1') || {}].concat(keys('dyqane/u1/pjeset/').map(k => doc(k))).flatMap(d => d.afatet || [])
    .filter(a => a.id === id).map(a => a.statusi + (a.hequrNga ? ':' + a.hequrNga : '')).pop();
  const njAgim = () => keys('perdoruesit/u1/njoftimet/').map(k => doc(k));
  const njBesa = () => keys('perdoruesit/u2/njoftimet/').map(k => doc(k));

  // 1. Besa (tel) e heq produktin e agimit → s'hiqet, por shkon për miratim
  const besa = await faqe('u2', 'besa', false);
  await besa.click('#btnEkipi'); await besa.waitForTimeout(1500);
  const kartat = await besa.locator('.ek-kart:has-text("Kos Vita") .ek-kart-hiq').count();
  ok(kartat === 1, '1. besa sheh "Unë e hoqa" te Kos Vita i agimit', kartat);
  await besa.click('.ek-kart:has-text("Kos Vita") .ek-kart-hiq'); await besa.waitForTimeout(300);
  const pyetja = await besa.textContent('#dlgKonfirmo');
  ok(/vetëm kur ai e pranon/.test(pyetja), '1. pyetja thotë që hiqet vetëm kur pronari e pranon', pyetja.replace(/\s+/g, ' ').slice(0, 160));
  await besa.click('#konfPo'); await besa.waitForTimeout(1500);
  ok(njAgim().some(n => n.lloji === 'hequr' && n.afatId === 'a1' && !n.vendim), '1. agimit i shkoi njoftimi (pa vendim)', njAgim());
  ok(statusi('a1') === 'aktiv', '1. Kos Vita mbetet aktiv te agimi', statusi('a1'));
  ok(/Në pritje/.test(await besa.textContent('.ek-kart:has-text("Kos Vita")')), '1. te besa: "Në pritje"');
  await besa.screenshot({ path: SC + 'mir-besa-pritje.png' });

  // 2. Agimi (tel) hyn: s'zbatohet vetë; te zilja Prano / Refuzo
  const agim = await faqe('u1', 'agim', false);
  await agim.waitForTimeout(2500);
  ok(statusi('a1') === 'aktiv', '2. pas hapjes, agimit s\'i hiqet vetë', statusi('a1'));
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1200);
  await agim.click('#ekZile'); await agim.waitForTimeout(1200);
  const zilja = await agim.textContent('#ekNjLista');
  ok(/besa e hoqi nga rafti: Kos Vita/.test(zilja) && await agim.isVisible('#ekNjLista button:has-text("Prano")') && await agim.isVisible('#ekNjLista button:has-text("Refuzo")'), '2. zilja: teksti + Prano + Refuzo', zilja.replace(/\s+/g, ' ').slice(0, 200));
  await agim.screenshot({ path: SC + 'mir-agim-zilja.png' });
  await agim.click('#ekNjLista button:has-text("Prano")'); await agim.waitForTimeout(2500);
  ok(statusi('a1') === 'hequr:besa', '2. Prano → Kos Vita i hequr (nga besa) te agimi', statusi('a1'));
  ok(njAgim().some(n => n.afatId === 'a1' && n.vendim === 'pranuar' && n.lexuar), '2. njoftimi: vendim pranuar');
  ok(njBesa().some(n => n.lloji === 'heqje-pranuar' && n.afatId === 'a1'), '2. besa u njoftua: heqje-pranuar', njBesa().map(n => n.lloji));
  ok(keys('grupet/g1/feed/').some(k => doc(k).lloji === 'heqje-pranuar'), '2. aktiviteti: heqje-pranuar');
  ok(/✓ E pranove/.test(await agim.textContent('#ekNjLista')), '2. zilja: "✓ E pranove"');

  // 3. Refuzo: besa heq Bukë, agimi e refuzon → mbetet në raft
  await besa.click('.ek-kart:has-text("Bukë") .ek-kart-hiq'); await besa.waitForTimeout(300);
  await besa.click('#konfPo'); await besa.waitForTimeout(1500);
  await agim.click('#ekNjMbyll'); await agim.waitForTimeout(800);
  await agim.click('#ekZile'); await agim.waitForTimeout(1200);
  await agim.click('.ek-nj:has-text("Bukë") button:has-text("Refuzo")'); await agim.waitForTimeout(2500);
  ok(statusi('a2') === 'aktiv', '3. Refuzo → Bukë mbetet aktiv', statusi('a2'));
  ok(njAgim().some(n => n.afatId === 'a2' && n.vendim === 'refuzuar'), '3. njoftimi: vendim refuzuar');
  ok(njBesa().some(n => n.lloji === 'heqje-refuzuar' && n.afatId === 'a2'), '3. besa u njoftua: heqje-refuzuar');
  await besa.waitForTimeout(1500);
  const bukeBesa = await besa.textContent('.ek-kart:has-text("Bukë")');
  ok(!/Në pritje/.test(bukeBesa) && /Unë e hoqa/.test(bukeBesa), '3. te besa Bukë s\'është më "Në pritje"', bukeBesa.replace(/\s+/g, ' '));

  // 4. PC: besa heq Djathë nga tel, agimi e pranon nga kompjuteri
  await besa.click('.ek-kart:has-text("Djathë") .ek-kart-hiq'); await besa.waitForTimeout(300);
  await besa.click('#konfPo'); await besa.waitForTimeout(1500);
  const agimPc = await faqe('u1', 'agim', true);
  await agimPc.waitForTimeout(2000);
  ok(statusi('a3') === 'aktiv', '4. PC: s\'zbatohet vetë', statusi('a3'));
  await agimPc.click('#ekZile'); await agimPc.waitForTimeout(1500);
  ok(await agimPc.isVisible('.ek-nj:has-text("Djathë") button:has-text("Prano")'), '4. PC zilja: Prano te Djathë');
  await agimPc.screenshot({ path: SC + 'mir-pc-zilja.png' });
  await agimPc.click('.ek-nj:has-text("Djathë") button:has-text("Prano")'); await agimPc.waitForTimeout(2500);
  ok(statusi('a3') === 'hequr:besa', '4. PC Prano → Djathë i hequr', statusi('a3'));

  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK'); await b.close();
})();

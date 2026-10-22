// v197: kujtesa e produkteve e përbashkët për grupin (grupet/{g}/kujtesa), tel + PC
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const SC = __dirname + '/';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now(), dje = new Date(t - 2 * 864e5).toISOString().slice(0, 10);
  const af = [['a1', 'Kos Vita'], ['a2', 'Bukë'], ['a3', 'Djathë']].map(([id, emri]) => ({ id, emri, barkodi: id, data: dje, statusi: 'aktiv', ndryshuarSe: t - 6e5 }));
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'mendurberisha', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u1', pronarEmri: 'agim' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'mendurberisha', roli: 'anetar', hyriSe: t });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: af, fshira: {} });
  F.S.docs.set('grupet/g1/afatet/u1', { uid: 'u1', emri: 'agim', afatet: af, ndryshuarSe: t - 6e5 });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: [{ id: 'b1', emri: 'Ujë Rugove 0.5L', barkodi: '777', furnizuesi: 'Rugove', data: '2027-01-01', statusi: 'aktiv', ndryshuarSe: t - 1e5 }], fshira: {} });
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
    await p.goto((process.env.STOKU_B || 'http://127.0.0.1:8765') + '/' + (pc ? 'pc.html#/ekipa' : 'index.html'));
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (d.id !== 'dlgEkipi') d.classList.remove('hapur'); }));
    return p;
  }
  const doc = k => F.S.docs.get(k);
  const grupi = () => { const h = {}; [...F.S.docs.keys()].filter(k => k.startsWith('grupet/g1/kujtesa/')).forEach(k => Object.assign(h, (doc(k) || {}).p || {})); return h; };
  const kuj = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:kujtesa:v1') || '{}'));
  const agim = await faqe('u1', 'agim', false);
  const besa = await faqe('u2', 'mendurberisha', true); // administratori i Stoku-t, në PC
  await agim.waitForTimeout(3500);
  // 1. besa i ka afatet me barkodin 777: mësohet në sfond dhe shkon te grupi (si automatike)
  let G = grupi();
  ok(G['777'] && G['777'].e === 'Ujë Rugove 0.5L' && G['777'].f === 'Rugove' && G['777'].a === 1, '1. produktet nga afatet e administratorit shkojnë te grupi', G['777']);
  ok(doc('grupet/g1/kujtesa/p7') && doc('grupet/g1/kujtesa/p7').p['777'] && !(doc('grupet/g1/kujtesa/p1') || { p: {} }).p['777'], '1. ndarja sipas shifrës së fundit (777 → p7)', [...F.S.docs.keys()].filter(k => k.includes('kujtesa')));
  let ka = await kuj(agim);
  ok(ka['777'] && ka['777'].e === 'Ujë Rugove 0.5L', '1. agimi e merr në kohë reale (pa e pasur në afatet e tij)', ka['777']);

  // 2. agimi (tel) ruan një afat të ri → te grupi → besa (PC) e plotëson vetë
  await agim.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await agim.click('#btnAfatet'); await agim.waitForTimeout(400);
  await agim.click('#afShto'); await agim.waitForTimeout(300);
  await agim.fill('#afatBarkodi', '3900001'); await agim.fill('#afatEmri', 'Coca Cola 1.25L'); await agim.fill('#afatData', '31-12-27'); await agim.fill('#afatFurnizuesi', 'Laberion');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(3500);
  G = grupi();
  ok(G['3900001'] && G['3900001'].e === 'Coca Cola 1.25L' && G['3900001'].f === 'Laberion' && G['3900001'].a === 0 && G['3900001'].m === 0 && G['3900001'].x === 0, '2. afati i agimit → kujtesa e grupit (me krejt fushat)', G['3900001']);
  const v2 = await besa.evaluate(() => { const b = document.getElementById('afdBarkodi'); b.value = '3900001'; document.getElementById('afdEmri').value = ''; document.getElementById('afdFurnizuesi').value = ''; b.dispatchEvent(new Event('change')); return [document.getElementById('afdEmri').value, document.getElementById('afdFurnizuesi').value]; });
  ok(v2[0] === 'Coca Cola 1.25L' && v2[1] === 'Laberion', '2. administratori (PC) e skanon: emri dhe furnitori plotësohen', v2);

  // 3. besa e ndryshon me dorë (Cilësimet → Stoku → Produktet) → agimi e merr
  await besa.click('#btnOpsione'); await besa.waitForTimeout(400); await besa.click('#dlgOpsione [data-faqe="stoku"]'); await besa.waitForTimeout(400); await besa.click('#opsFurnSeksion .ops-palos');await besa.click('#opsKujSeksion .ops-palos');
  ok(!/Coca Cola/.test(await besa.textContent('#opsKujLista')), '3. v201: produkti i agimit s\'është te lista kryesore para kontrollit');
  await besa.click('#opsKujPritjeSeksion .ops-palos');
  await besa.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Coca Cola") button:has-text("Ndrysho")'); await besa.waitForTimeout(200);
  await besa.locator('#opsKujPritjeLista .ops-furn-edit input').nth(0).fill('Coca-Cola 1.25 L');
  await besa.click('#opsKujPritjeLista .ops-furn-edit button:has-text("Ruaj")'); await besa.waitForTimeout(3500);
  G = grupi(); ka = await kuj(agim);
  ok(G['3900001'].e === 'Coca-Cola 1.25 L' && G['3900001'].m === 1 && G['3900001'].s === 1 && G['3900001'].n === 'mendurberisha' && ka['3900001'] && ka['3900001'].e === 'Coca-Cola 1.25 L' && ka['3900001'].s === 1, '3. ndryshimi i administratorit arrin te grupi dhe te agimi', [G['3900001'], ka['3900001']]);
  await agim.click('#afShto'); await agim.waitForTimeout(200);
  await agim.fill('#afatBarkodi', '3900001'); await agim.dispatchEvent('#afatBarkodi', 'change');
  const v3 = await agim.evaluate(() => document.getElementById('afatEmri').value);
  ok(v3 === 'Coca-Cola 1.25 L', '3. agimi e skanon: merr emrin e ndryshuar nga administratori', v3);
  await agim.click('#afatAnulo');

  // 4. v198: agimi s'e mbishkruan versionin e administratorit (vetëm afati i tij merr emrin që shkruan)
  await agim.click('#afShto'); await agim.waitForTimeout(200);
  await agim.fill('#afatBarkodi', '3900001'); await agim.dispatchEvent('#afatBarkodi', 'change');
  await agim.fill('#afatEmri', 'cola e agimit'); await agim.fill('#afatData', '30-11-27');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(3500);
  G = grupi(); ka = await kuj(agim);
  const afAgim = (doc('dyqane/u1') || {}).afatet || [];
  ok(G['3900001'].e === 'Coca-Cola 1.25 L' && G['3900001'].s === 1 && ka['3900001'].e === 'Coca-Cola 1.25 L', '4. kujtesa mbetet si e ndryshoi administratori', [G['3900001'], ka['3900001']]);
  const tani2 = await agim.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]').filter(a => a.barkodi === '3900001').map(a => a.emri));
  ok(tani2.includes('cola e agimit'), '4. afati i agimit u ruajt me emrin që e shkroi ai', tani2);
  // 5. agimi shton produkt të ri → del te administratori "nga agim"
  await agim.click('#afShto'); await agim.waitForTimeout(200);
  await agim.fill('#afatBarkodi', '5550005'); await agim.fill('#afatEmri', 'Biskota Plazma'); await agim.fill('#afatData', '30-11-27');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(3500);
  await besa.click('#dlgOpsione [data-faqe="pamja"]').catch(() => {}); await besa.click('#dlgOpsione [data-faqe="stoku"]'); await besa.waitForTimeout(400); await besa.click('#opsFurnSeksion .ops-palos');await besa.click('#opsKujSeksion .ops-palos');
  const lb2 = await besa.textContent('#opsKujPritjeLista');
  ok(await besa.isVisible('#opsKujPritjeSeksion') && /Biskota Plazma.*nga agim/.test(lb2.replace(/\s+/g, ' ')) && !/Biskota/.test(await besa.textContent('#opsKujLista')), '5. v201: produkti i ri i agimit pret te "Produktet e reja", jo te lista kryesore', lb2.replace(/\s+/g, ' ').slice(0, 200));
  const nen = await besa.textContent('#opsStokuNen');
  ok(/për kontroll/.test(nen), '5. menyja e Cilësimeve tregon sa produkte presin kontrollin', nen);
  await besa.click('#opsKujPritjeSeksion .ops-palos'); await besa.waitForTimeout(150);
  await besa.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Biskota Plazma") button:has-text("Ndrysho")'); await besa.waitForTimeout(200);
  await besa.locator('#opsKujPritjeLista .ops-furn-edit input').nth(0).fill('Biskota Plazma 300g');
  await besa.click('#opsKujPritjeLista .ops-furn-edit button:has-text("Ruaj")'); await besa.waitForTimeout(3500);
  G = grupi(); ka = await kuj(agim);
  ok(G['5550005'] && G['5550005'].e === 'Biskota Plazma 300g' && G['5550005'].s === 1 && ka['5550005'] && ka['5550005'].s === 1, '5. administratori e ndryshon dhe e ruan: arrin te grupi dhe te agimi', [G['5550005'], ka['5550005']]);
  ok(/Biskota Plazma 300g/.test(await besa.textContent('#opsKujLista')) && !/Biskota/.test(await besa.textContent('#opsKujPritjeLista')), '5. pas ruajtjes kalon te lista kryesore');
  // 6. administratori e harron 777 → për krejt grupin; mësimi në sfond s'e kthen
  // v238: 777 u mësua vetë nga afatet: pret te "Produktet e reja" (jo te lista kryesore)
  ok(/Ujë Rugove/.test(await besa.textContent('#opsKujPritjeLista')) && !/Ujë Rugove/.test(await besa.textContent('#opsKujLista')), '6. v238: i mësuari vetë pret kontrollin');
  await besa.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Ujë Rugove") button:has-text("Ndrysho")'); await besa.waitForTimeout(200);
  await besa.click('#opsKujPritjeLista .ops-furn-edit button:has-text("Fshije")'); await besa.waitForTimeout(3500);
  G = grupi(); ka = await kuj(agim);
  ok(G['777'] && G['777'].x === 1 && ka['777'] && ka['777'].x === 1, '6. "Harroje" e administratorit vlen për krejt grupin', [G['777'], ka['777']]);
  // 6b. v201: agimi shton edhe një produkt; e sheh te "Produktet e reja" pa mundësi ndryshimi; administratori e ruan me një klik
  await agim.click('#afShto'); await agim.waitForTimeout(200);
  await agim.fill('#afatBarkodi', '5550006'); await agim.fill('#afatEmri', 'Çokollatë Milka'); await agim.fill('#afatData', '30-12-27');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(3500);
  // 7. agimi (jo administrator)
  await agim.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => d.classList.remove('hapur')));
  await agim.click('#btnOpsione'); await agim.waitForTimeout(400);
  ok(await agim.isVisible('#tabLista'), '7. agimi e sheh Cilësimet → Stoku (v199)');
  await agim.click('#tabLista'); await agim.waitForTimeout(400);
  ok(await agim.isVisible('#stPritje') && /\d+ (pret|presin) kontrollin/.test(await agim.textContent('#stPritjeStatus')), '7. v202: rreshti "Produktet e reja" te Stoku tregon sa presin (v238: edhe të mësuarat vetë)', await agim.textContent('#stPritjeStatus'));
  await agim.click('#stProduktet'); await agim.waitForTimeout(300);
  const lAg = await agim.textContent('#kujtesaLista');
  ok(await agim.isVisible('#kujtesaLista') && /Biskota Plazma/.test(lAg), '7. agimi i sheh produktet', lAg.replace(/\s+/g, ' ').slice(0, 160));
  ok(!(await agim.$('#kujtesaLista button')) && !(await agim.$('#kujtesaLista .ops-furn-laps')), '7. por s\'mund t\'i ndryshojë (pa laps)');
  await agim.click('#kujtesaLista .ops-furn-rresht:has-text("Biskota Plazma")'); await agim.waitForTimeout(200);
  ok(!(await agim.$('#kujtesaLista .ops-furn-edit')), '7. klikimi s\'hap editimin');
  await agim.click('#opsPrapa'); await agim.click('#stPritje'); await agim.waitForTimeout(300);
  const pAg = await agim.textContent('#kujPritjeLista');
  ok(await agim.isVisible('#kujPritjeSeksion') && /Çokollatë Milka/.test(pAg) && !/Çokollatë/.test(lAg) && !(await agim.$('#kujPritjeLista button')) && /administratori/.test(await agim.textContent('#kujPritjeIntro')), '7. v201: agimi e sheh produktin e vet te "Produktet e reja", vetëm për t\'u parë', pAg.replace(/\s+/g, ' '));
  ok(!/për kontroll/.test(await agim.textContent('#tabListaStatus')), '7. menyja te agimi s\'thotë "për kontroll" (vetëm administratori)');
  await besa.click('#dlgOpsione [data-faqe="pamja"]'); await besa.click('#dlgOpsione [data-faqe="stoku"]'); await besa.waitForTimeout(300);
  await besa.click('#opsKujPritjeSeksion .ops-palos'); await besa.waitForTimeout(150);
  await besa.click('#opsKujPritjeLista .ops-furn-rresht:has-text("Çokollatë Milka") button:has-text("Ruaj")'); await besa.waitForTimeout(3500);
  G = grupi();
  ok(G['5550006'] && G['5550006'].e === 'Çokollatë Milka' && G['5550006'].s === 1 && !/Çokollatë Milka/.test(await besa.textContent('#opsKujPritjeLista')) && /Çokollatë Milka/.test(await besa.textContent('#opsKujLista')), '7. "Ruaj" me një klik: kalon te Produktet (v238: të mësuarat vetë mbeten në pritje)', G['5550006']);

  // 8. shkrimet te grupi: pak (të bashkuara), jo një për çdo produkt
  // v242: vetëm te grupi (regjistri i përbashkët kujtesa/* dhe kujtesa_pritje/* numërohen më vete)
  const nShkrime = F.S.shkrime.filter(x => /^grupet\/g1\/kujtesa\//.test(x.path)).length;
  ok(nShkrime > 0 && nShkrime <= 20, '5. shkrime te kujtesa e grupit: ' + nShkrime, F.S.shkrime.filter(x => /^grupet\/g1\/kujtesa\//.test(x.path)).map(x => x.uid + ' ' + x.path));
  const nRegj = F.S.shkrime.filter(x => /^kujtesa(_pritje)?\//.test(x.path)).length;
  ok(nRegj <= 16, '5. v242: shkrime te regjistri dhe pritja: ' + nRegj);
  ok(!F.S.refuzime.filter(x => /kujtesa/.test(x.path)).length, '5. asnjë refuzim nga rregullat', F.S.refuzime.filter(x => /kujtesa/.test(x.path)));
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();

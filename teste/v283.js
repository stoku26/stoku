// v283: pronari: "kur klikon te ni produkt ose 1 afat qe u shtu me ta hap direkt qat produkt ose afat" (telefon, PC, Android).
//  1) ekipa.js objektiINgjarjes: heqje → afati i saj; "shtove N afate" → id-të (ruhen te ngjarja); kërkesat → kërkimi te i gjithë grupi;
//  2) telefoni: ngjarja e afatit tim hap dritaren e afatit; ngjarja e kolegut ("shtoi 2 afate") hap Afatet e tij vetëm me ato 2;
//  3) PC: njësoj (dritarja e afatit / tabela e kolegut me "Nga aktiviteti"); 4) ngjarja e re "afate-te-reja" i ka id-të; 5) versionet.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const EK = require('../ekipa.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  // 1) logjika
  const o1 = EK.objektiINgjarjes({ lloji: 'hequr', uid: 'u1', pronariUid: 'u1', afatId: 'a1', produkti: 'Djathë' });
  const o2 = EK.objektiINgjarjes({ lloji: 'afate-te-reja', uid: 'u2', n: 2, ids: ['b1', 'b2'] });
  const o3 = EK.objektiINgjarjes({ lloji: 'kerkese-heqje', uid: 'u2', produktet: [{ produkti: 'Kos', barkodi: '39' }] });
  const o4 = EK.objektiINgjarjes({ lloji: 'lajmerim', uid: 'u2', tekst: 'x' });
  ok(o1.pronari === 'u1' && o1.ids.join() === 'a1' && o2.pronari === 'u2' && o2.ids.join() === 'b1,b2' && o3.pronari === '' && o3.kerko === '39' && o4 === null, '1. objekti i ngjarjes', { o1, o2, o3, o4 });

  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now(), dita = n => new Date(tani + n * 864e5).toISOString().slice(0, 10);
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: tani, ekipaMigruarSe: tani });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: tani });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'blerta', kycurSe: tani });
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: tani });
  ['uA:mendurberisha:pronar', 'u1:agim:anetar', 'u2:blerta:anetar'].forEach(x => { const [u, e, r] = x.split(':'); F.S.docs.set('grupet/ekipa/anetaret/' + u, { emri: e, roli: r, hyriSe: tani }); F.S.docs.set('perdoruesit/' + u, Object.assign({}, F.S.docs.get('perdoruesit/' + u), { grupi: 'ekipa' })); });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Bulmet' }], produktet: [],
    afatet: [{ id: 'a1', barkodi: '444', emri: 'Djathë', data: dita(-5), sasia: 2, statusi: 'hequr', hequrSe: tani - 6e5, ndryshuarSe: tani - 6e5 }, { id: 'a2', barkodi: '445', emri: 'Kos', data: dita(9), statusi: 'aktiv', ndryshuarSe: tani - 864e5 }], fshira: {} });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [],
    afatet: [{ id: 'b1', barkodi: '901', emri: 'Lëng molle', data: dita(12), statusi: 'aktiv', ndryshuarSe: tani }, { id: 'b2', barkodi: '902', emri: 'Ujë', data: dita(40), statusi: 'aktiv', ndryshuarSe: tani },
      { id: 'b3', barkodi: '903', emri: 'Çaj', data: dita(3), statusi: 'aktiv', ndryshuarSe: tani }], fshira: {} });
  F.S.docs.set('grupet/ekipa/feed/n1', { lloji: 'afate-te-reja', uid: 'u2', emri: 'blerta', koha: tani - 2e5, n: 2, ids: ['b1', 'b2'] });
  F.S.docs.set('grupet/ekipa/feed/n2', { lloji: 'hequr', uid: 'u1', emri: 'agim', koha: tani - 6e5, pronariUid: 'u1', pronariEmri: 'agim', afatId: 'a1', produkti: 'Djathë', barkodi: '444', data: dita(-5), sasia: 2 });
  F.S.docs.set('grupet/ekipa/feed/n3', { lloji: 'lajmerim', uid: 'u2', emri: 'blerta', koha: tani - 1e5, tekst: 'Mbledhje' });
  const b = await chromium.launch();
  async function faqe(uid, email, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, email, pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = [];
    p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/ekipa' : 'index.html'));
    await p.waitForTimeout(2500);
    return p;
  }
  const blerta = await faqe('u2', 'blerta@stoku-app.local', true); // publikon afatet e saj te grupi
  await blerta.waitForTimeout(1500);
  const agim = await faqe('u1', 'agim@stoku-app.local', false);
  // 2) telefoni
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1500);
  await agim.click('#ekMenu button[data-n="aktiviteti"]'); await agim.waitForTimeout(900);
  const rr = await agim.evaluate(() => Array.from(document.querySelectorAll('#ekipiTrup .ek-ngjarje')).map(r => ({ t: r.innerText.replace(/\s+/g, ' ').slice(0, 50), p: r.classList.contains('prekshme') })));
  ok(rr.filter(x => x.p).length === 2 && rr.some(x => /Mbledhje|njoftoi/.test(x.t) && !x.p), '2. tel: dy ngjarje me afat janë të prekshme, lajmërimi jo', rr);
  await agim.click('#ekipiTrup .ek-ngjarje.prekshme:has-text("Djathë")'); await agim.waitForTimeout(500);
  const d1 = await agim.evaluate(() => ({ hapur: document.getElementById('dlgAfat').classList.contains('hapur'), t: document.getElementById('afatTitulli').textContent }));
  ok(d1.hapur && d1.t === 'Djathë', '2. tel: "Ti e hoqe… Djathë" hap afatin tënd', d1);
  await agim.evaluate(() => document.getElementById('dlgAfat').classList.remove('hapur')); await agim.waitForTimeout(200);
  await agim.click('#ekipiTrup .ek-ngjarje.prekshme:has-text("shtoi 2 afate")'); await agim.waitForTimeout(800);
  const v2 = await agim.evaluate(() => ({ titulli: document.getElementById('ekipiTitulli').textContent, chip: (document.querySelector('.ek-ids-chip') || {}).innerText,
    kartat: Array.from(document.querySelectorAll('#ekipiRreshtat .af-karta')).map(k => k.innerText.split('\n')[0].trim()) }));
  ok(v2.titulli === 'blerta' && /Nga aktiviteti · 2 afate/.test(v2.chip || '') && v2.kartat.length === 2, '2. tel: "blerta shtoi 2 afate" hap afatet e saj, vetëm ato 2', v2);
  await agim.click('.ek-ids-chip'); await agim.waitForTimeout(400);
  ok(await agim.evaluate(() => !document.querySelector('.ek-ids-chip') && document.querySelectorAll('#ekipiRreshtat .af-karta').length === 3), '2. tel: ✕ i shfaq të gjitha (3)');
  ok(!agim.__gab.length, '2. tel pa gabime JS', agim.__gab);
  // 3) PC (agimi)
  const agimPc = await faqe('u1', 'agim@stoku-app.local', true);
  await agimPc.evaluate(() => { location.hash = '#/ekipa/aktiviteti'; }); await agimPc.waitForTimeout(1200);
  if (!(await agimPc.$('#ekAktLista .ek-ngjarje'))) { await agimPc.click('text=Aktiviteti').catch(() => {}); await agimPc.waitForTimeout(800); }
  await agimPc.click('#ekAktLista .ek-ngjarje.prekshme:has-text("Djathë")'); await agimPc.waitForTimeout(500);
  const d3 = await agimPc.evaluate(() => ({ hapur: !!document.querySelector('#dlgAfat[open], #dlgAfat.hapur') || getComputedStyle(document.getElementById('dlgAfat')).display !== 'none', b: (document.getElementById('afdBarkodi') || {}).value }));
  ok(d3.b === '444', '3. PC: "Ti e hoqe… Djathë" hap afatin tënd', d3);
  await agimPc.keyboard.press('Escape'); await agimPc.waitForTimeout(300);
  await agimPc.evaluate(() => { location.hash = '#/ekipa/aktiviteti'; }); await agimPc.waitForTimeout(800);
  await agimPc.click('#ekAktLista .ek-ngjarje.prekshme:has-text("shtoi 2 afate")'); await agimPc.waitForTimeout(800);
  const v3 = await agimPc.evaluate(() => ({ chip: !document.getElementById('ekIdsChip').hidden, rr: document.querySelectorAll('#ekTrup tr').length, h: location.hash }));
  ok(v3.chip && v3.rr === 2, '3. PC: "blerta shtoi 2 afate" → tabela e saj vetëm me 2', v3);
  ok(!agimPc.__gab.length, '3. PC pa gabime JS', agimPc.__gab);
  // 4) ngjarja e re me id-të (afat i ri te telefoni)
  await agim.goto('http://127.0.0.1:8765/index.html'); await agim.waitForTimeout(2000);
  await agim.click('#btnAfatet'); await agim.waitForTimeout(600);
  await agim.click('#afShto'); await agim.waitForTimeout(400);
  await agim.fill('#afatEmri', 'Bukë'); await agim.fill('#afatData', '31-12-26');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(500);
  await agim.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await agim.waitForTimeout(1500);
  const ng = [...F.S.docs.entries()].filter(([k, v]) => k.startsWith('grupet/ekipa/feed/') && v.lloji === 'afate-te-reja' && v.uid === 'u1').map(x => x[1]);
  ok(ng.length === 1 && Array.isArray(ng[0].ids) && ng[0].ids.length === 1 && /^a/.test(ng[0].ids[0]), '4. "shtove 1 afat të ri" ruhet me id-në e afatit', ng);
  // 5) versionet
  const sw = require('fs').readFileSync(__dirname + '/../sw.js', 'utf8');
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 283 && nr(/ekipa\.js\?v=(\d+)/) >= 283 && nr(/app-tel\.js\?v=(\d+)/) >= 283 && nr(/app-pc\.js\?v=(\d+)/) >= 283, '5. versionet ≥ 283');
  ok(/\{ v: 283,[^\n]*platforma: 'tel'/.test(require('fs').readFileSync(__dirname + '/../teRejat.js', 'utf8')), '5. teRejat v283');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

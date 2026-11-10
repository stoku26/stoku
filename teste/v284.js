// v284: pronari: "kur po klikoj 'ti shtove 1 afat të ri' ose 'filani shtoi një afat të ri' nuk po e qet bash qat afat… Bone te krejt
// opsionet kur klikon te aktiviteti me mujt me pa qka ka shtu, jo me mujt me ndryshu po veq me pa, edhe krejt pjesëtarët e grupit".
//  1) ekipa.js detajetENgjarjes: afati i tanishëm sipas id-së, fotografia e ngjarjes kur afati s'gjendet, ngjarjet e vjetra sipas kohës;
//  2) telefoni: ÇDO ngjarje është e prekshme dhe hap dritaren "vetëm shiko" (pa fusha, pa butona veç "Mbyll"); 3) PC njësoj;
//  4) ngjarja e re "afate-te-reja" e mban fotografinë (`artikujt`, me emrin e marketit); 5) versionet.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const EK = require('../ekipa.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const tani = Date.now(), dita = n => new Date(tani + n * 864e5).toISOString().slice(0, 10);
  // 1) logjika
  const an = [{ uid: 'u2', emri: 'blerta', ngarkuar: true, afatet: [{ id: 'b1', emri: 'Lëng', barkodi: '901', data: dita(12), sasia: 6, mk: 'Viva', pronariUid: 'u2', pronariEmri: 'blerta' },
    { id: 'v1', emri: 'I vjetër', data: dita(5), ndryshuarSe: tani - 3600e3 - 10e3 }] }];
  const d1 = EK.detajetENgjarjes({ lloji: 'afate-te-reja', uid: 'u2', emri: 'blerta', koha: tani - 3600e3, n: 2, ids: ['b1', 'zz'], artikujt: [{ id: 'zz', emri: 'Fshirë', data: dita(2) }] }, 'u1', an, tani);
  ok(d1.kush === 'blerta' && d1.artikujt.length === 2 && d1.artikujt[0].emri === 'Lëng' && d1.artikujt[0].mk === 'Viva' && d1.artikujt[0].st === 'afer' && d1.artikujt[0].mesazh === 'Skadon për 12 ditë.' &&
    d1.artikujt[1].emri === 'Fshirë' && d1.artikujt[1].shenim === 'Nuk gjendet më në listë.', '1. afati i tanishëm + fotografia kur afati s\'gjendet', d1);
  const d2 = EK.detajetENgjarjes({ lloji: 'afate-te-reja', uid: 'u2', emri: 'blerta', koha: tani - 3600e3, n: 1 }, 'u1', an, tani);
  ok(d2.artikujt.length === 1 && d2.artikujt[0].emri === 'I vjetër' && /Aktivitet i vjetër/.test(d2.shenim), '1. ngjarja e vjetër (pa id) gjen afatin sipas kohës', d2);
  const d3 = EK.detajetENgjarjes({ lloji: 'afate-te-reja', uid: 'u9', emri: 'ikur', koha: tani - 9e6, n: 1 }, 'u1', an, tani);
  ok(!d3.artikujt.length && /nuk gjendet më/.test(d3.shenim), '1. pa afat: mesazh i qartë', d3.shenim);
  const d4 = EK.detajetENgjarjes({ lloji: 'kerkese-heqje', uid: 'u2', emri: 'blerta', koha: tani, produktet: [{ produkti: 'Kos', barkodi: '39', data: dita(-1) }, { barkodi: '40' }], perUid: 'u1', shenim: 'sot' }, 'u1', an, tani);
  ok(d4.artikujt.length === 2 && d4.artikujt[0].mesazh === 'Skadoi dje.' && d4.artikujt[1].st === '' && d4.rreshtat[0].e === 'Për' && d4.rreshtat[0].v === 'ty' && d4.tekst === 'sot', '1. kërkesa: produktet, "Për: ty", shënimi', d4);
  const tx = JSON.stringify([d1, d2, d3, d4]);
  ok(!/duhet të hiqet|Plotësoje/.test(tx), '1. pa udhëzime për pronarin (vetëm shikim)');

  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: tani, ekipaMigruarSe: tani });
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: tani });
  ['uA:mendurberisha:pronar', 'u1:agim:anetar', 'u2:blerta:anetar'].forEach(x => { const [u, e, r] = x.split(':'); F.S.docs.set('grupet/ekipa/anetaret/' + u, { emri: e, roli: r, hyriSe: tani });
    F.S.docs.set('perdoruesit/' + u, Object.assign({ perdoruesi: e, kycurSe: tani }, F.S.docs.get('perdoruesit/' + u) || {}, { grupi: 'ekipa' })); });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Bulmet' }], produktet: [], marketet: [{ id: 'm1', emri: 'Viva Fresh' }],
    afatet: [{ id: 'a1', barkodi: '444', emri: 'Djathë', data: dita(-5), sasia: 2, statusi: 'hequr', hequrSe: tani - 6e5, ndryshuarSe: tani - 6e5 }, { id: 'a2', barkodi: '445', emri: 'Kos', data: dita(9), statusi: 'aktiv', ndryshuarSe: tani - 864e5 }], fshira: {} });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [],
    afatet: [{ id: 'b1', barkodi: '901', emri: 'Lëng molle', data: dita(12), sasia: 6, furnizuesi: 'Frutex', statusi: 'aktiv', ndryshuarSe: tani }, { id: 'b2', barkodi: '902', emri: 'Ujë', data: dita(40), statusi: 'aktiv', ndryshuarSe: tani },
      { id: 'b3', barkodi: '903', emri: 'Çaj', data: dita(3), statusi: 'aktiv', ndryshuarSe: tani }], fshira: {} });
  F.S.docs.set('grupet/ekipa/feed/n1', { lloji: 'afate-te-reja', uid: 'u2', emri: 'blerta', koha: tani - 2e5, n: 1, ids: ['b1'] });
  F.S.docs.set('grupet/ekipa/feed/n2', { lloji: 'hequr', uid: 'u1', emri: 'agim', koha: tani - 6e5, pronariUid: 'u1', pronariEmri: 'agim', afatId: 'a1', produkti: 'Djathë', barkodi: '444', data: dita(-5), sasia: 2 });
  F.S.docs.set('grupet/ekipa/feed/n3', { lloji: 'lajmerim', uid: 'u2', emri: 'blerta', koha: tani - 1e5, tekst: 'Mbledhje nesër në 9' });
  F.S.docs.set('grupet/ekipa/feed/n4', { lloji: 'afate-te-reja', uid: 'u2', emri: 'blerta', koha: tani - 9e5, n: 1, ids: ['zz'], artikujt: [{ id: 'zz', emri: 'Salcë e fshirë', barkodi: '777', data: dita(20), sasia: 3, mk: 'Meridian' }] });
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
  const lexo = (p) => p.evaluate(() => { const d = document.getElementById('dlgEkNgjarja'); return { hapur: d.classList.contains('hapur'), t: document.getElementById('ekDtTrup').innerText.replace(/\s+/g, ' ').trim(),
    siper: (function () { const r = document.getElementById('ekDtTrup').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + 12); return !!e && d.contains(e); })(),
    fusha: d.querySelectorAll('input, select, textarea').length, butona: Array.from(d.querySelectorAll('button')).map(x => (x.textContent || '').trim()) }; });
  // 2) telefoni
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1500);
  await agim.click('#ekMenu button[data-n="aktiviteti"]'); await agim.waitForTimeout(900);
  const rr = await agim.evaluate(() => Array.from(document.querySelectorAll('#ekipiTrup .ek-ngjarje')).map(r => r.classList.contains('prekshme')));
  ok(rr.length === 4 && rr.every(Boolean), '2. tel: të 4 ngjarjet janë të prekshme (edhe lajmërimi)', rr);
  await agim.click('#ekipiTrup .ek-ngjarje:has-text("shtoi 1 afat"):has-text("blerta") >> nth=0'); await agim.waitForTimeout(500);
  const t1 = await lexo(agim);
  ok(t1.hapur && /blerta shtoi 1 afat të ri/.test(t1.t) && /Lëng molle/.test(t1.t) && /901/.test(t1.t) && /6 copë/.test(t1.t) && /Skadon për 12 ditë\./.test(t1.t) && !/Ujë|Çaj/.test(t1.t),
    '2. tel: "blerta shtoi 1 afat të ri" tregon BASH atë afat (Lëng molle), jo afatet e tjera', t1);
  ok(t1.fusha === 0 && t1.butona.join() === 'Mbyll', '2. tel: vetëm shikim (pa fusha, vetëm "Mbyll")', t1.butona);
  ok(t1.siper, '2. tel: dritarja del SIPËR faqes së Grupit (duket)');
  ok(await agim.evaluate(() => !document.getElementById('dlgAfat').classList.contains('hapur') && document.getElementById('ekipiTitulli').textContent !== 'blerta'), '2. tel: s\'hapet as dritarja e ndryshimit, as lista e kolegut');
  await agim.click('#ekDtMbyll'); await agim.waitForTimeout(200);
  await agim.click('#ekipiTrup .ek-ngjarje:has-text("Djathë")'); await agim.waitForTimeout(400);
  const t2 = await lexo(agim);
  ok(t2.hapur && /Ti e hoqe nga rafti: Djathë/.test(t2.t) && /444/.test(t2.t) && /U hoq nga rafti/.test(t2.t) && !(await agim.evaluate(() => document.getElementById('dlgAfat').classList.contains('hapur'))), '2. tel: afati im i hequr hapet vetëm për shikim', t2);
  await agim.evaluate(() => history.back()); await agim.waitForTimeout(400);
  ok(!(await lexo(agim)).hapur, '2. tel: butoni "prapa" e mbyll dritaren');
  await agim.click('#ekipiTrup .ek-ngjarje:has-text("njoftoi")'); await agim.waitForTimeout(400);
  const t3 = await lexo(agim);
  ok(t3.hapur && /Mbledhje nesër në 9/.test(t3.t), '2. tel: lajmërimi hapet me tekstin e plotë', t3.t);
  await agim.click('#ekDtMbyll'); await agim.waitForTimeout(200);
  await agim.click('#ekipiTrup .ek-ngjarje:has-text("shtoi 1 afat") >> nth=1'); await agim.waitForTimeout(400);
  const t4 = await lexo(agim);
  ok(t4.hapur && /Salcë e fshirë/.test(t4.t) && /Meridian/.test(t4.t) && /3 copë/.test(t4.t), '2. tel: afati i fshirë shihet nga fotografia e ngjarjes', t4.t);
  await agim.click('#ekDtMbyll'); await agim.waitForTimeout(200);
  ok(!agim.__gab.length, '2. tel pa gabime JS', agim.__gab);
  // 3) PC (agimi)
  const agimPc = await faqe('u1', 'agim@stoku-app.local', true);
  await agimPc.evaluate(() => { location.hash = '#/ekipa/aktiviteti'; }); await agimPc.waitForTimeout(1200);
  if (!(await agimPc.$('#ekAktLista .ek-ngjarje'))) { await agimPc.click('text=Aktiviteti').catch(() => {}); await agimPc.waitForTimeout(800); }
  const rp = await agimPc.evaluate(() => Array.from(document.querySelectorAll('#ekAktLista .ek-ngjarje')).map(r => r.classList.contains('prekshme')));
  ok(rp.length === 4 && rp.every(Boolean), '3. PC: të 4 ngjarjet janë të klikueshme', rp);
  await agimPc.click('#ekAktLista .ek-ngjarje:has-text("shtoi 1 afat") >> nth=0'); await agimPc.waitForTimeout(500);
  const p1 = await lexo(agimPc);
  ok(p1.hapur && /Lëng molle/.test(p1.t) && /901/.test(p1.t) && /Frutex/.test(p1.t) && /Skadon për 12 ditë\./.test(p1.t) && !/Ujë|Çaj/.test(p1.t) && p1.fusha === 0 && p1.butona.join() === '✕,Mbyll' && /aktiviteti/.test(await agimPc.evaluate(() => location.hash)),
    '3. PC: "blerta shtoi 1 afat të ri" tregon bash atë afat, vetëm për shikim', p1);
  ok(p1.siper, '3. PC: dritarja duket sipër');
  await agimPc.keyboard.press('Escape'); await agimPc.waitForTimeout(300);
  ok(!(await lexo(agimPc)).hapur, '3. PC: Escape e mbyll');
  await agimPc.click('#ekAktLista .ek-ngjarje:has-text("Djathë")'); await agimPc.waitForTimeout(400);
  const p2 = await lexo(agimPc);
  ok(p2.hapur && /Djathë/.test(p2.t) && /U hoq nga rafti/.test(p2.t) && !(await agimPc.evaluate(() => document.getElementById('dlgAfat').classList.contains('hapur'))), '3. PC: afati im i hequr vetëm për shikim', p2.t);
  await agimPc.click('#dlgEkNgjarja .dialog-fund [data-mbyll]'); await agimPc.waitForTimeout(300);
  ok(!agimPc.__gab.length, '3. PC pa gabime JS', agimPc.__gab);
  // 4) ngjarja e re e mban fotografinë e afatit (me emrin e marketit)
  await agim.goto('http://127.0.0.1:8765/index.html'); await agim.waitForTimeout(2000);
  await agim.click('#btnAfatet'); await agim.waitForTimeout(600);
  await agim.click('#afShto'); await agim.waitForTimeout(400);
  await agim.fill('#afatEmri', 'Bukë'); await agim.fill('#afatData', '31-12-26');
  await agim.click('#afatRuaj'); await agim.waitForTimeout(500);
  await agim.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await agim.waitForTimeout(1500);
  const ng = [...F.S.docs.entries()].filter(([k, v]) => k.startsWith('grupet/ekipa/feed/') && v.lloji === 'afate-te-reja' && v.uid === 'u1').map(x => x[1]);
  ok(ng.length === 1 && Array.isArray(ng[0].artikujt) && ng[0].artikujt.length === 1 && ng[0].artikujt[0].emri === 'Bukë' && ng[0].artikujt[0].data === '2026-12-31' && ng[0].artikujt[0].id === ng[0].ids[0], '4. "shtove 1 afat të ri" ruhet me fotografinë e afatit', ng);
  // 5) versionet
  const fs = require('fs'), sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8');
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 284 && nr(/ekipa\.js\?v=(\d+)/) >= 284 && nr(/app-tel\.js\?v=(\d+)/) >= 284 && nr(/app-pc\.js\?v=(\d+)/) >= 284, '5. versionet ≥ 284');
  const tr = fs.readFileSync(__dirname + '/../teRejat.js', 'utf8');
  ok(/\{ v: 284,[^\n]*platforma: 'tel'/.test(tr) && /\{ v: 284,[^\n]*platforma: 'pc'/.test(tr), '5. teRejat v284 (tel + pc)');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

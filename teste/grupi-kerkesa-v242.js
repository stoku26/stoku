// v242: "Hyr në një grup": kërkimi i grupit me emër (grupet_publike), kërkesa (kerkesat_grupi), pranimi nga admini i grupit
// (ftesë → hyrja vetë), refuzimi, anulimi, lista publike (publikimi, riemërtimi, grupi i fshirë), siguria; tel + PC
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const SC = __dirname + '/';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u3', { perdoruesi: 'drini', kycurSe: t, grupi: '' });
  F.S.docs.set('perdoruesit/u4', { perdoruesi: 'vjosa', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u5', { perdoruesi: 'zana', kycurSe: t, grupi: '' });
  F.S.docs.set('grupet/g1', { emri: 'Market Agimi', pronarUid: 'u1', pronarEmri: 'agim', krijuarSe: t - 864e5 });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t - 864e5 });
  F.S.docs.set('grupet/g1/anetaret/u4', { emri: 'vjosa', roli: 'anetar', hyriSe: t - 864e5 });
  F.S.docs.set('grupet/g2', { emri: 'Viva Fresh', pronarUid: 'u9', pronarEmri: 'dren', krijuarSe: t });
  F.S.docs.set('grupet/g2/anetaret/u9', { emri: 'dren', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet_publike/g2', { emri: 'Viva Fresh', pronarEmri: 'dren', ndryshuarSe: t });
  F.S.docs.set('grupet_publike/gX', { emri: 'Market i vjetër', pronarEmri: 'askush', ndryshuarSe: t - 9e9 }); // grupi s'ekziston më
  const doc = k => F.S.docs.get(k);
  const b = await chromium.launch();
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.route(u => u.href.startsWith(PUSH), r => r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }));
    const p = await ctx.newPage(); p.__gab = [];
    p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/' + (pc ? 'pc.html#/ekipa' : 'index.html'));
    await p.waitForTimeout(2500);
    return p;
  }
  const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
  const kerkuarat = p => p.evaluate(() => { const x = JSON.parse(localStorage.getItem('stoku:grupi:kerkuar') || 'null'); return x ? Object.keys(x.g || {}) : []; });

  // 1. Admini i grupit (agim, tel): grupi del te lista publike (grupi ishte krijuar para v242)
  const agim = await faqe('u1', 'agim', false);
  ok(await prit(() => !!doc('grupet_publike/g1')), '1. agim (pronar): "Market Agimi" te lista publike', doc('grupet_publike/g1'));
  ok(doc('grupet_publike/g1') && doc('grupet_publike/g1').emri === 'Market Agimi' && doc('grupet_publike/g1').pronarEmri === 'agim', '1. emri + admini');
  const vjosa = await faqe('u4', 'vjosa', true);
  await vjosa.waitForTimeout(800);
  ok(!F.S.shkrime.some(x => x.uid === 'u4' && /grupet_publike/.test(x.path)), '1. vjosa (koleg, jo admin) s\'e shkruan listën publike');

  // 2. Besa (e re, tel, pa grup): kërkon grupin, dërgon kërkesë
  const besa = await faqe('u2', 'besa', false);
  await besa.click('#btnEkipi'); await besa.waitForTimeout(1200);
  ok(await besa.isVisible('#ekGrupiKerko') && /Hyr në një grup/.test(await besa.textContent('#ekipiLista')) && await besa.isVisible('#ekGrupiKrijo'), '2. besa pa grup: "Hyr në një grup" (kërkimi) + "Ose krijo grupin tënd"');
  await besa.fill('#ekGrupiKerko', 'a');
  await besa.waitForTimeout(500);
  ok((await besa.textContent('#ekGrupiRezultatet')).trim() === '', '2. një shkronjë: pa rezultate');
  await besa.fill('#ekGrupiKerko', 'agimi');
  ok(await prit(async () => /Market Agimi/.test(await besa.textContent('#ekGrupiRezultatet'))), '2. "agimi" → "Market Agimi"');
  ok(/Admini: agim/.test(await besa.textContent('#ekGrupiRezultatet')) && !/Viva/.test(await besa.textContent('#ekGrupiRezultatet')), '2. me adminin, pa grupet e tjera');
  await besa.fill('#ekGrupiKerko', 'mark');
  await prit(async () => /vjetër/.test(await besa.textContent('#ekGrupiRezultatet')));
  const rez = await besa.evaluate(() => [...document.querySelectorAll('#ekGrupiRezultatet .ek-ftesa b')].map(x => x.textContent));
  ok(rez.join('|') === 'Market Agimi|Market i vjetër', '2. "mark": dy grupe (sipas emrit)', rez);
  await besa.screenshot({ path: SC + 'v242-tel-kerko.png' });
  // grupi që s'ekziston më: kërkesa refuzohet nga rregullat dhe grupi hiqet nga lista
  await besa.evaluate(() => [...document.querySelectorAll('#ekGrupiRezultatet .ek-ftesa')].find(x => /vjetër/.test(x.textContent)).querySelector('button').click());
  ok(await prit(() => !doc('grupet_publike/gX')), '2. grupi i fshirë: kërkesa s\'kalon, hiqet nga lista publike');
  ok(!doc('kerkesat_grupi/gX_u2') && /s'ekziston më/.test(await toast(besa)), '2. mesazhi "ky grup s\'ekziston më"', await toast(besa));
  await besa.evaluate(() => [...document.querySelectorAll('#ekGrupiRezultatet .ek-ftesa')].find(x => /Agimi/.test(x.textContent)).querySelector('button').click());
  ok(await prit(() => !!doc('kerkesat_grupi/g1_u2')), '2. kërkesa: kerkesat_grupi/g1_u2', doc('kerkesat_grupi/g1_u2'));
  const kr = doc('kerkesat_grupi/g1_u2') || {};
  ok(kr.gid === 'g1' && kr.uid === 'u2' && kr.emri === 'besa' && kr.grupiEmri === 'Market Agimi', '2. fushat e kërkesës');
  ok(await prit(async () => /Kur ta pranojë admini/.test(await toast(besa))), '2. "Kërkesa u dërgua…"', await toast(besa));
  ok(await prit(async () => /Pret pranimin/.test(await besa.textContent('#ekipiLista'))), '2. besa: "Kërkesa u dërgua… Pret pranimin"');
  ok((await kerkuarat(besa)).join() === 'g1', '2. pajisja e mban mend grupin e kërkuar');
  ok(!doc('grupet/g1/anetaret/u2') && !doc('ftesat/g1_besa'), '2. ende jo në grup');

  // 3. Agim (tel): kërkesa del te pulti dhe te Kolegët; e pranon → besa hyn vetë
  ok(await prit(async () => /besa kërkon të hyjë/.test(await toast(agim))), '3. agim: njoftimi "besa kërkon të hyjë në grupin tënd"', await toast(agim));
  ok(await prit(async () => (await agim.textContent('#ekTabShenja')) === '1'), '3. shenja te tabi Grupi', await agim.textContent('#ekTabShenja'));
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1000);
  ok(/besa/.test(await agim.textContent('#ekipiLista')) && /kërkon të hyjë/.test(await agim.textContent('#ekipiLista')), '3. pulti: kërkesa e besës');
  await agim.click('#ekMenu [data-n="anetaret"]'); await agim.waitForTimeout(800);
  ok(/Një kërkesë për t'u futur/.test(await agim.textContent('#ekipiLista')), '3. Kolegët: "Një kërkesë për t\'u futur"');
  await agim.screenshot({ path: SC + 'v242-tel-admini-kerkesa.png' });
  await agim.evaluate(() => [...document.querySelectorAll('#ekipiLista .ek-kerkesa-grupi')].find(x => /besa/.test(x.textContent)).querySelector('.btn:not(.tekst)').click());
  ok(await prit(() => !!doc('grupet/g1/anetaret/u2'), 10000), '3. besa u fut vetë në grup (pa shtypur asgjë)');
  ok(!doc('kerkesat_grupi/g1_u2') && !doc('ftesat/g1_besa') && doc('perdoruesit/u2').grupi === 'g1', '3. kërkesa dhe ftesa u fshinë; treguesi i grupit');
  ok(await prit(async () => /Admini të pranoi/.test(await toast(besa))), '3. besa: "Admini të pranoi: tash je në grupin…"', await toast(besa));
  ok(await prit(async () => (await besa.textContent('#ekipiTitulli')) !== 'Grupi' && !(await besa.isVisible('#ekGrupiKerko'))), '3. besa: pamja e grupit (jo më "Hyr në një grup")');
  ok((await kerkuarat(besa)).length === 0, '3. pajisja s\'mban më kërkesa');

  // 4. Drini (PC): kërkon, anulon, kërkon sërish; agim e refuzon
  const drini = await faqe('u3', 'drini', true);
  ok(await drini.isVisible('#ekHyrKarta') && await drini.isVisible('#ekGrupiKerko'), '4. PC pa grup: karta "Hyr në një grup"');
  await drini.fill('#ekGrupiKerko', 'MARKET agimi');
  ok(await prit(async () => /Market Agimi/.test(await drini.textContent('#ekGrupiRezultatet'))), '4. PC: kërkimi pa dallim shkronjash');
  await drini.screenshot({ path: SC + 'v242-pc-kerko.png' });
  await drini.click('#ekGrupiRezultatet .ek-grupi-rez button');
  ok(await prit(() => !!doc('kerkesat_grupi/g1_u3')), '4. PC: kërkesa u dërgua');
  ok(await prit(async () => /Pret pranimin/.test(await drini.textContent('#ekKerkesatEMia'))), '4. PC: "Kërkesë: grupi "Market Agimi""');
  ok(await prit(async () => (await drini.textContent('#ekGrupiRezultatet .ek-grupi-rez button')) === 'U dërgua'), '4. PC: butoni "U dërgua"');
  await drini.click('#ekKerkesatEMia button'); // Anulo kërkesën
  ok(await prit(() => !doc('kerkesat_grupi/g1_u3')), '4. PC: anulimi e fshin kërkesën');
  await drini.waitForTimeout(3800);
  ok(!/s'e pranoi/.test(await toast(drini)) && (await kerkuarat(drini)).length === 0, '4. anulimi s\'del si refuzim', await toast(drini));
  await drini.click('#ekGrupiRezultatet .ek-grupi-rez button');
  ok(await prit(() => !!doc('kerkesat_grupi/g1_u3')), '4. kërkesa sërish');
  await agim.waitForTimeout(800);
  ok(await prit(async () => /drini/.test(await agim.textContent('#ekipiLista'))), '4. agim e sheh kërkesën e drinit');
  await agim.evaluate(() => [...document.querySelectorAll('#ekipiLista .ek-kerkesa-grupi')].find(x => /drini/.test(x.textContent)).querySelector('.btn.tekst').click());
  ok(await prit(() => !doc('kerkesat_grupi/g1_u3')), '4. agim e refuzoi (kërkesa u fshi)');
  ok(await prit(async () => /s'e pranoi kërkesën/.test(await toast(drini)), 9000), '4. drini: "Admini i grupit "Market Agimi" s\'e pranoi kërkesën tënde."', await toast(drini));
  ok(!doc('grupet/g1/anetaret/u3') && (await kerkuarat(drini)).length === 0, '4. drini mbetet pa grup');

  // 5. Admini i grupit në PC: kërkesa te Pulti dhe te Kolegët; e pranon
  const agimPc = await faqe('u1', 'agim', true);
  await drini.click('#ekGrupiRezultatet .ek-grupi-rez button');
  ok(await prit(() => !!doc('kerkesat_grupi/g1_u3')), '5. drini kërkon sërish');
  ok(await prit(async () => await agimPc.isVisible('#ekPultKerkesat') && /drini kërkon të hyjë/.test(await agimPc.textContent('#ekPultKerkesat'))), '5. PC admini: karta te Pulti');
  ok(/1 kërkesë/.test(await agimPc.textContent('#ekNavOnline')), '5. PC: "1 kërkesë" te anësorja', await agimPc.textContent('#ekNavOnline'));
  await agimPc.click('#ekMenu [data-n="anetaret"]'); await agimPc.waitForTimeout(800);
  ok(/drini kërkon të hyjë/.test(await agimPc.textContent('#ekKerkesatEGrupit')), '5. PC: kërkesa te Kolegët');
  await agimPc.screenshot({ path: SC + 'v242-pc-admini-kerkesa.png' });
  await agimPc.click('#ekKerkesatEGrupit .btn:not(.tekst)');
  ok(await prit(() => !!doc('grupet/g1/anetaret/u3'), 10000), '5. drini u fut vetë në grup');
  ok(await prit(async () => !(await drini.isVisible('#ekPaGrup'))), '5. PC drini: pamja e grupit');

  // 6. Siguria (rregullat): koleg jo-admin s'pranon; kërkesë për dikë tjetër; hyrje pa ftesë
  F.S.docs.set('kerkesat_grupi/g1_u5', { gid: 'g1', grupiEmri: 'Market Agimi', uid: 'u5', emri: 'zana', koha: Date.now() });
  const rV = await vjosa.evaluate(() => window.__stokuCloud.ekipa.pranoKerkesen({ id: 'g1_u5', gid: 'g1', uid: 'u5', emri: 'zana' }, 'Market Agimi'));
  ok(!rV.ok && !doc('ftesat/g1_zana') && doc('kerkesat_grupi/g1_u5'), '6. vjosa (koleg) s\'mund ta pranojë kërkesën', rV);
  const zana = await faqe('u5', 'zana', true);
  const rZ = await zana.evaluate(() => window.__stokuCloud.ekipa.dergoKerkesen({ id: 'g1', emri: 'Market Agimi' }));
  ok(rZ.ok, '6. zana: kërkesa e vet lejohet');
  const rZ2 = await zana.evaluate(async () => { try { await window.__stokuCloud.ekipa.pranoKerkesen({ id: 'g1_u5', gid: 'g1', uid: 'u5', emri: 'zana' }); return 'ok'; } catch (e) { return 'gabim'; } });
  ok(!doc('ftesat/g1_zana'), '6. zana s\'e pranon vetë kërkesën', rZ2);
  const nRef = F.S.refuzime.length;
  const rZ3 = await zana.evaluate(() => window.__stokuCloud.ekipa.pranoFtesen({ id: 'g1_zana', gid: 'g1' }));
  ok(!rZ3.ok && !doc('grupet/g1/anetaret/u5') && F.S.refuzime.length > nRef, '6. pa ftesë s\'hyn në grup (edhe me kërkesë)', rZ3);

  // 7. Lista publike: riemërtimi (admini), grupi i ri, largimi i të fundit e heq
  await agimPc.evaluate(() => window.__stokuEkipaK.riemertoGrupin('Market Agimi Qendër'));
  ok(await prit(() => doc('grupet_publike/g1') && doc('grupet_publike/g1').emri === 'Market Agimi Qendër'), '7. riemërtimi ndryshon edhe listën publike');
  await zana.evaluate(() => window.__stokuEkipaK.anuloKerkesen({ gid: 'g1' }));
  const rK = await zana.evaluate(() => window.__stokuEkipaK.krijoGrupin('Grupi Zana'));
  const gZ = rK && rK.grupi;
  ok(rK.ok && await prit(() => doc('grupet_publike/' + gZ) && doc('grupet_publike/' + gZ).emri === 'Grupi Zana'), '7. grupi i ri del menjëherë te lista publike', gZ);
  ok(await prit(() => !doc('kerkesat_grupi/g1_u5')), '7. krijimi i grupit fshin kërkesat e mia');
  await zana.waitForTimeout(800);
  const rL = await zana.evaluate(() => window.__stokuEkipaK.largohuNgaGrupi());
  ok(rL.ok && await prit(() => !doc('grupet/' + gZ) && !doc('grupet_publike/' + gZ)), '7. i fundit largohet: grupi dhe lista publike fshihen', rL);

  ok(![agim, vjosa, besa, drini, agimPc, zana].some(p => p.__gab.length), '8. pa gabime JS', [agim, vjosa, besa, drini, agimPc, zana].map(p => p.__gab));
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

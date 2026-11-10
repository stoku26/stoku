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
  // 2) dhe 3) (lundrimi te afatet e kolegut me "Nga aktiviteti") u zëvendësuan në v284 nga dritarja "vetëm shiko": teste/v284.js
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

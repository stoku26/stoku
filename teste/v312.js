// v312 / Android Hyrja 74: pronari: pllakat me numra te Grupi i ndërrojmë (vetëm telefoni: web + Android; PC mbetet):
//  - Grupi → Përmbledhja: "zgjedhe 3shin": një fjali e madhe (e kuqe kur ka të skaduara, e verdhë kur ka që skadojnë këtë javë, e gjelbër kur s'ka)
//    + rresht me numrat e prekshëm (84 në raft, 46 afër skadimit, 15 të hequr këtë muaj);
//  - Grupi → Afatet: "bone 2shin": shirit segmentuar me 5 pjesë (Të gjitha, Skaduara, Afër, Rregull, Hequra), e zgjedhura ngrihet.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise(r => setTimeout(r, 100)); } return false; };
(async () => {
  const R = __dirname + '/../', lx = f => fsN.readFileSync(R + f, 'utf8');
  const K = lx('vendas/app/src/main/java/site/stoku/vendas/ui/GrupiEkrani.kt'), tel = lx('app-tel.js'), pc = lx('app-pc.js');
  // 0) statike
  ok(/private fun ShiritiINumrave\(/.test(K) /* v319: pa fjalinë */ && /private fun ShiritiSegmentuar\(/.test(K) && /ShiritiSegmentuar\(listOf\(/.test(K), '0. Android: fjalia e madhe dhe shiriti segmentuar');
  ok(!/P\("", if \(ng\) st\.aktive\.toString\(\)/.test(K) && !/"Të hequra", filtri == "hequr"/.test(K), '0. Android: pa pllakat e vjetra te Përmbledhja dhe Afatet');
  ok(/"Të gjitha"/.test(K) && /"Skaduara"/.test(K) && /"Rregull"/.test(K) && /"Hequra"/.test(K), '0. Android: 5 pjesët e shiritit');
  ok(/'ek-segm ek-segm--permb'/.test(tel) /* v319: shiriti edhe te Përmbledhja */ && /'ek-segm'/.test(tel) && !/'af-permb ek-permb-nr'/.test(tel) && !/'af-permb ek-permb'/.test(tel), '0. web telefon: fjalia dhe shiriti, pa kutitë e vjetra');
  ok(!/ek-segm/.test(pc), '0. PC: pa ndryshim (vetëm telefoni)');

  const tani = Date.now(), dita = n => ((x) => { x = new Date(x); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })(new Date(tani + n * 864e5));
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: tani, ekipaMigruarSe: tani });
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'uA', pronarEmri: 'mendurberisha', krijuarSe: tani });
  ['uA:mendurberisha:pronar', 'u1:agim:anetar', 'u2:blerta:anetar'].forEach(x => { const [u, e, r] = x.split(':'); F.S.docs.set('grupet/ekipa/anetaret/' + u, { emri: e, roli: r, hyriSe: tani });
    F.S.docs.set('perdoruesit/' + u, Object.assign({ perdoruesi: e, kycurSe: tani }, F.S.docs.get('perdoruesit/' + u) || {}, { grupi: 'ekipa' })); });
  const dyqan = (afatet) => ({ app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [], afatet, fshira: {} });
  // agim: një i hequr dhe një aktiv (+9 ditë); blerta: +12, +40 dhe +3 ditë (një skadon këtë javë)
  F.S.docs.set('dyqane/u1', dyqan([{ id: 'a1', barkodi: '444', emri: 'Djathë', data: dita(-5), sasia: 2, statusi: 'hequr', hequrSe: tani - 6e5, ndryshuarSe: tani - 6e5 },
    { id: 'a2', barkodi: '445', emri: 'Kos', data: dita(9), statusi: 'aktiv', ndryshuarSe: tani - 864e5 }]));
  F.S.docs.set('dyqane/u2', dyqan([{ id: 'b1', barkodi: '901', emri: 'Lëng molle', data: dita(12), sasia: 6, statusi: 'aktiv', ndryshuarSe: tani },
    { id: 'b2', barkodi: '902', emri: 'Ujë', data: dita(40), statusi: 'aktiv', ndryshuarSe: tani }, { id: 'b3', barkodi: '903', emri: 'Çaj', data: dita(3), statusi: 'aktiv', ndryshuarSe: tani }]));
  const b = await chromium.launch();
  async function faqe(uid, email, pcF) {
    const ctx = await b.newContext(pcF ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, email, pcF ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pcF ? 'pc.html#/grupi' : 'index.html')); await p.waitForTimeout(2500);
    return p;
  }
  const blerta = await faqe('u2', 'blerta@stoku-app.local', true); // publikon afatet e saj te grupi
  await blerta.waitForTimeout(1500);
  const agim = await faqe('u1', 'agim@stoku-app.local', false);
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1500);
  // v319 (pronari): Përmbledhja pa fjalinë e madhe, me shiritin e numrave si te Afatet
  const rez = () => agim.evaluate(() => { const r = document.querySelector('#ekipiTrup #ekPermbNumrat'); return r ? { pjeset: Array.from(r.querySelectorAll('.ek-segm__s')).map(x => x.querySelector('b').textContent + ' ' + x.querySelector('span').textContent),
    fjalia: !!document.querySelector('#ekipiTrup .ek-rez'), kuti: document.querySelectorAll('#ekipiTrup .af-numer').length } : null; });
  // 1) Përmbledhja
  ok(await prit(async () => { const r = await rez(); return r && r.pjeset[0] === '4 Në raft'; }), '1. Përmbledhja: shiriti me numra', await rez());
  const r1 = await rez();
  ok(/^4 Në raft\|0 Skaduara\|1 Këtë javë\|\d+ Afër\|1 Hequra$/.test(r1.pjeset.join('|')) && !r1.fjalia && r1.kuti === 0, '1. Në raft 4, Skaduara 0, Këtë javë 1, Afër, Hequra 1; pa fjalinë e madhe', r1);
  await agim.screenshot({ path: __dirname + '/v312-permbledhja.png' });
  await agim.click('#ekPermbNumrat .ek-segm__s >> nth=0'); await agim.waitForTimeout(700);
  ok(await agim.evaluate(() => document.getElementById('ekipiTitulli').textContent === 'Afatet' && !!document.querySelector('#ekPermb .ek-segm__s')), '1. prekja te "Në raft" hap Afatet e grupit', await agim.textContent('#ekipiTitulli'));
  // 2) Afatet: shiriti segmentuar
  const seg = () => agim.evaluate(() => ({ pjeset: Array.from(document.querySelectorAll('#ekPermb .ek-segm__s')).map(x => x.querySelector('b').textContent + ' ' + x.querySelector('span').textContent + (x.classList.contains('on') ? ' *' : '')),
    lista: Array.from(document.querySelectorAll('#ekipiRreshtat .artikull .emri, #ekipiRreshtat .af-karta .af-emri')).map(x => x.textContent.trim()), kuti: document.querySelectorAll('#ekipiTrup .af-numer').length }));
  let s = await seg();
  ok(s.pjeset.join('|') === '4 Të gjitha *|0 Skaduara|3 Afër|1 Rregull|1 Hequra' && s.kuti === 0, '2. shiriti: Të gjitha 4 (e zgjedhur), Skaduara 0, Afër 3, Rregull 1, Hequra 1', s);
  await agim.screenshot({ path: __dirname + '/v312-afatet.png' });
  await agim.click('#ekPermb .ek-segm__s.c-hequr'); await agim.waitForTimeout(500);
  s = await seg();
  ok(s.pjeset.some(x => /Hequra.*\*/.test(x)) && s.lista.length === 1 && /Djathë/.test(s.lista[0]), '2. "Hequra": e zgjedhur ngrihet, lista tregon vetëm Djathë', s);
  await agim.click('#ekPermb .ek-segm__s.c-afer'); await agim.waitForTimeout(500);
  s = await seg();
  ok(s.pjeset.some(x => /Afër.*\*/.test(x)) && s.lista.length === 3 && s.lista.join() === 'Çaj,Kos,Lëng molle', '2. "Afër": Çaj, Kos, Lëng molle (brenda 30 ditëve)', s);
  await agim.click('#ekPermb .ek-segm__s.c-gj'); await agim.waitForTimeout(500);
  s = await seg();
  ok(s.pjeset[0].endsWith('*') && s.lista.length === 4, '2. "Të gjitha": kthehet lista e plotë (4 aktive, pa të hequrat)', s);
  // 3) Me të skaduar (v319: shiriti, pa fjalinë)
  F.S.docs.set('dyqane/u2', dyqan([{ id: 'b9', barkodi: '999', emri: 'Qumësht', data: dita(-2), sasia: 1, statusi: 'aktiv', ndryshuarSe: tani }, { id: 'b2', barkodi: '902', emri: 'Ujë', data: dita(40), statusi: 'aktiv', ndryshuarSe: tani }]));
  await blerta.reload(); await blerta.waitForTimeout(3500);
  await agim.click('#ekMenu button[data-n="permbledhja"]'); await agim.waitForTimeout(800);
  // v319: pa fjalinë; "Skaduara" te shiriti tregon të skaduarin
  ok(await prit(async () => { const r = await rez(); return r && r.pjeset.includes('1 Skaduara'); }, 9000), '3. me të skaduar: "1 Skaduara" te shiriti', await rez());
  ok(!agim.__gab.length && !blerta.__gab.length, '3. pa gabime JS', [agim.__gab, blerta.__gab]);
  // PC: pllakat e vjetra mbeten
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})();

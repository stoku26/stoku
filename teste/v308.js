// v308: pronari: "ne ngjarjet e vjetra qiti edhe emrin e ri, kudo qe ka gjurm qaj person qe e ka ndrru emrin me dal me emer te ri,
// e jo sikur tjeter kush me e lon se i njejti person osht lidhi me uid". ekipa.js Emrat: emri i tanishëm sipas uid-së; fushat
// vetëm me emër (krijuarNga, hequrNga…) sipas emrave të vjetër të mësuar nga dokumentet me uid, vetëm kur emri i përket një personi.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const EK = require('../ekipa.js');
const fsN = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  // 1) logjika
  const h = { aktual: { u1: 'duli96', u2: 'blerta' }, aliaset: { mendurberisha: ['u1'], duli96: ['u1'], ana: ['u1', 'u3'] } };
  const r = EK.meEmratAktuale({ lloji: 'hequr', uid: 'u1', emri: 'mendurberisha', pronariUid: 'u2', pronariEmri: 'blerta_e_vjeter', hequrNga: 'mendurberisha', krijuarNga: 'ana', nga: ['mendurberisha', 'tjeter'] }, h);
  ok(r.emri === 'duli96' && r.pronariEmri === 'blerta' && r.hequrNga === 'duli96', '1. fushat me uid dhe emri i vjetër pa uid → emri i ri', r);
  ok(r.krijuarNga === 'ana' && r.nga[0] === 'duli96' && r.nga[1] === 'tjeter', '1. emri që u ka përkitur dy personave mbetet siç është (pa ngatërrim)', r);
  const pika = EK.meEmratAktuale({ id: 'p1', krijuarNga: 'u1', krijuarNgaEmri: 'mendurberisha' }, h);
  ok(pika.krijuarNga === 'u1' && pika.krijuarNgaEmri === 'duli96', '1. pikat: krijuarNga mbetet uid, emri bëhet i ri', pika);
  const pa = { uid: 'u9', emri: 'iku' };
  ok(EK.meEmratAktuale(pa, h) === pa, '1. uid e panjohur: dokumenti s\'ndryshon');
  ok(EK.ciftetEEmrave({ uid: 'u1', emri: 'a', kerkuesUid: 'u2', kerkuesEmri: 'b' }).length === 2, '1. çiftet (uid, emri) mësohen');
  const R = __dirname + '/../', lx = f => fsN.readFileSync(R + f, 'utf8');
  ok(/fun meEmratAktuale\(/.test(lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/GrupiLogjika.kt')), '1. Android: binjaku Kotlin');

  // 2) telefoni: blerta (u2) sheh ngjarjet e vjetra të "mendurberisha" (u1, tani "agim") me emrin e ri
  const tani = Date.now(), dita = n => new Date(tani + n * 864e5).toISOString().slice(0, 10);
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'u1', pronarEmri: 'mendurberisha', krijuarSe: tani });
  ['u1:agim:pronar', 'u2:blerta:anetar'].forEach(x => { const [id, e, ro] = x.split(':');
    F.S.docs.set('grupet/ekipa/anetaret/' + id, { emri: e, roli: ro, hyriSe: tani, aktivSe: tani });
    F.S.docs.set('perdoruesit/' + id, { perdoruesi: e, kycurSe: tani, grupi: 'ekipa', ekipaMigruarSe: tani }); });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [], fshira: {},
    afatet: [{ id: 'a1', barkodi: '39', emri: 'Jaffa', data: dita(-3), statusi: 'hequr', hequrSe: tani - 6e5, hequrNga: 'mendurberisha', krijuarNga: 'mendurberisha', ndryshuarSe: tani }] });
  F.S.docs.set('grupet/ekipa/afatet/u1', { uid: 'u1', emri: 'mendurberisha', ndryshuarSe: tani, afatet: [{ id: 'a1', barkodi: '39', emri: 'Jaffa', data: dita(-3), statusi: 'hequr', hequrSe: tani - 6e5, hequrNga: 'mendurberisha', krijuarNga: 'mendurberisha', ndryshuarSe: tani }] });
  F.S.docs.set('dyqane/u2', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [], fshira: {},
    afatet: [{ id: 'b1', barkodi: '40', emri: 'Kos', data: dita(9), statusi: 'aktiv', krijuarNga: 'mendurberisha', ndryshuarSe: tani }] });
  F.S.docs.set('grupet/ekipa/feed/n1', { lloji: 'hequr', uid: 'u1', emri: 'mendurberisha', koha: tani - 6e5, pronariUid: 'u1', pronariEmri: 'mendurberisha', afatId: 'a1', produkti: 'Jaffa', barkodi: '39', data: dita(-3) });
  F.S.docs.set('grupet/ekipa/feed/n2', { lloji: 'lajmerim', uid: 'u1', emri: 'mendurberisha', koha: tani - 5e5, tekst: 'Mbledhje' });
  F.S.docs.set('perdoruesit/u2/njoftimet/j1', { lloji: 'lajmerim', uid: 'u1', emri: 'mendurberisha', tekst: 'Mbledhje', grupi: 'ekipa', koha: tani - 5e5, lexuar: true });
  const b = await chromium.launch();
  async function faqe(pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u2', 'blerta@stoku-app.local', pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/ekipa/aktiviteti' : 'index.html'));
    await p.waitForTimeout(4000);
    return p;
  }
  const tel = await faqe(false);
  await tel.click('#btnEkipi'); await tel.waitForTimeout(1500);
  await tel.click('#ekMenu button[data-n="aktiviteti"]'); await tel.waitForTimeout(1200);
  const t1 = await tel.evaluate(() => Array.from(document.querySelectorAll('.ek-ngjarje')).filter(x => x.offsetParent).map(x => x.innerText.replace(/\s+/g, ' ')).join(' | '));
  ok(/agim e hoqi nga rafti: Jaffa/.test(t1) && /agim njoftoi/.test(t1) && !/mendurberisha/.test(t1), '2. telefoni: Aktiviteti me emrin e ri', t1);
  const kr = await tel.evaluate(() => { const E = window.StokuEkipa.Emrat; return [E.emri(null, 'mendurberisha'), E.emri('u1', 'mendurberisha')]; });
  ok(kr[0] === 'agim' && kr[1] === 'agim', '2. telefoni: emri i vjetër pa uid (p.sh. "Shtuar nga") → emri i ri', kr);
  const pc = await faqe(true);
  const t2 = await pc.evaluate(() => document.getElementById('ekAktLista').innerText.replace(/\s+/g, ' '));
  ok(/agim e hoqi nga rafti: Jaffa/.test(t2) && !/mendurberisha/.test(t2), '3. PC: Aktiviteti me emrin e ri', t2);
  await pc.evaluate(() => { location.hash = '#/ekipa/afatet'; }); await pc.waitForTimeout(1200);
  await pc.click('#ekFiltrat button[data-f="hequr"]').catch(() => {}); await pc.waitForTimeout(800);
  const t3 = await pc.evaluate(() => document.getElementById("ekTrup").innerText.replace(/\s+/g, " ") + " / " + document.getElementById("ekBosh").innerText + " / " + location.hash + " / " + Array.from(document.querySelectorAll("#ekFiltrat button")).map(b => b.dataset.f + (b.classList.contains("aktiv") ? "*" : "")).join(","));
  ok(/U hoq nga agim/.test(t3) && !/mendurberisha/.test(t3), '3. PC: afati i kolegut "U hoq nga" me emrin e ri', t3);
  await pc.evaluate(() => { location.hash = '#/afatet'; }); await pc.waitForTimeout(1200);
  const t4 = await pc.evaluate(() => { const tr = document.querySelector('#afTrup tr[data-id="b1"] .af-prod'); return tr ? tr.title : ''; });
  ok(/Shtuar nga: agim/.test(t4), '3. PC: afati im "Shtuar nga" me emrin e ri', t4);
  const gab = [tel, pc].flatMap(x => x.__gab);
  ok(!gab.length, '4. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

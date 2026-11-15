// v307: pronari (foto e Aktivitetit): "qaty posht pa foto osht kur e kom pas userin mendurberisha, tash nese tjert e ndrrojn userin spo
// ja qitka foton". Fotoja e avatarit te Aktiviteti, te njoftimet dhe te ftesat kërkohej sipas emrit të shkruar te ngjarja; pas
// ndryshimit të emrit të përdoruesit, ngjarjet e vjetra mbeteshin pa foto. Tani sipas uid-së (ekipa.js uidIAvatarit + Kotlin).
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const EK = require('../ekipa.js');
const fsN = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const u = EK.uidIAvatarit;
  ok(u({ lloji: 'hequr', uid: 'u1', emri: 'mendurberisha' }) === 'u1' && u({ lloji: 'anetar-i-ri', uid: 'u1', anetariUid: 'u2' }) === 'u2' &&
    u({ lloji: 'anetar-i-ri', uid: 'u1', anetariUid: 'u1' }) === 'u1' && u({ lloji: 'hequr', uid: 'u1', anetariUid: 'u2' }) === 'u1' && u({ emri: 'a' }) === '' && u(null) === '',
    '1. uidIAvatarit: autori, ose i riu te pranimi në grup');
  const R = __dirname + '/../', lx = f => fsN.readFileSync(R + f, 'utf8');
  const kt = lx('vendas/app/src/main/java/site/stoku/vendas/ui/GrupiEkrani.kt');
  ok(/fun uidIAvatarit\(ng: Obj\?\): String/.test(lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/GrupiLogjika.kt')) &&
    (kt.match(/uid = GrupiLogjika\.uidIAvatarit\(x\)/g) || []).length === 2 && /AvatariLehte\(nj\["emri"\] as\? String, uid = /.test(kt), '1. Android: aktiviteti, detajet dhe njoftimet me uid');
  ok(!/ekAvatar\(\{ emri:/.test(lx('app-tel.js')) && !/ekAvatar\(\{ emri:/.test(lx('app-pc.js')), '1. web: asnjë avatar vetëm me emër');

  const tani = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('grupet/ekipa', { emri: 'Ekipa', pronarUid: 'u1', pronarEmri: 'agim', krijuarSe: tani });
  ['u1:agim:pronar', 'u2:blerta:anetar'].forEach(x => { const [id, e, r] = x.split(':');
    F.S.docs.set('grupet/ekipa/anetaret/' + id, { emri: e, roli: r, hyriSe: tani });
    F.S.docs.set('perdoruesit/' + id, { perdoruesi: e, kycurSe: tani, grupi: 'ekipa', ekipaMigruarSe: tani });
    F.S.docs.set('dyqane/' + id, { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [], afatet: [], fshira: {} }); });
  // ngjarje të vjetra me emrin e vjetër (para ndryshimit të emrit)
  F.S.docs.set('grupet/ekipa/feed/n1', { lloji: 'hequr', uid: 'u1', emri: 'mendurberisha', koha: tani - 9e5, pronariUid: 'u1', produkti: 'Jaffa', barkodi: '39' });
  F.S.docs.set('grupet/ekipa/feed/n2', { lloji: 'anetar-i-ri', uid: 'u1', emri: 'mendurberisha', anetariUid: 'u2', anetariEmri: 'blerta_e_vjeter', koha: tani - 8e5 });
  const b = await chromium.launch();
  async function faqe(pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { try {
      localStorage.setItem('stoku:fotot:indeksi', JSON.stringify({ u1: 5, u2: 7 }));
      localStorage.setItem('stoku:fotot:emrat', JSON.stringify({ agim: 'u1', blerta: 'u2' }));
    } catch (e) { /* ok */ } });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/ekipa/aktiviteti' : 'index.html'));
    await p.waitForTimeout(3500);
    return p;
  }
  const avatarat = p => p.evaluate(() => Array.from(document.querySelectorAll('.ek-ngjarje .ek-avatar')).filter(a => a.offsetParent)
    .map(a => ({ t: a.closest('.ek-ngjarje').innerText.replace(/\s+/g, ' ').slice(0, 60), foto: a.classList.contains('me-foto'), bg: a.style.backgroundImage })));
  const tel = await faqe(false);
  await tel.click('#btnEkipi'); await tel.waitForTimeout(1500);
  await tel.click('#ekMenu button[data-n="aktiviteti"]'); await tel.waitForTimeout(1200);
  const a1 = await avatarat(tel);
  const hq = a1.find(x => /hoqe/.test(x.t)), an = a1.find(x => /bashkua/.test(x.t));
  ok(hq && hq.foto && /foto\/u1/.test(hq.bg), '2. telefoni: ngjarja me emrin e vjetër ka foton (sipas uid-së)', a1);
  ok(an && an.foto && /foto\/u2/.test(an.bg), '2. telefoni: pranimi në grup: fotoja e të riut', an);
  const pc = await faqe(true);
  const a2 = await avatarat(pc);
  ok(a2.length >= 2 && a2.every(x => x.foto) && a2.some(x => /foto\/u1/.test(x.bg)) && a2.some(x => /foto\/u2/.test(x.bg)), '3. PC: të njëjtat foto', a2);
  const gab = [tel, pc].flatMap(x => x.__gab);
  ok(!gab.length, '4. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

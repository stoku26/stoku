// v320 / Android Hyrja 82 (pronari, 3 foto):
//  1. "Grupi yt": karta, "+" dhe "⋮" me të njëjtën lartësi; "Ndrysho emrin" = laps i vogël
//  2. "⋮" hap "Cilësimet e grupit": Menaxho kolegët + Llogaritë e tjera (vetëm administratori)
//  3. "Njoftim për të gjithë grupin" u fshi krejt (web tel, PC, Android, ekipa.js); ato të vjetrat s'dalin
//  + pajisja e shkëputur ndërsa ishte e mbyllur del kur hapet (teste te v319.js pjesa 6)
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise(r => setTimeout(r, 100)); } return false; };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const SC = '/tmp/claude-0/-home-user-stoku/e6bed5df-a3f5-5158-8183-d77a3d2bc01d/scratchpad/';
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';

(async () => {
  // ===== 0. Kodi: asnjë gjurmë e njoftimit për krejt grupin =====
  const kode = ['app-tel.js', 'app-pc.js', 'index.html', 'pc.html', 'ekipa.js', K + 'Grupi.kt', K + 'ui/GrupiEkrani.kt', 'vendas/logjika/src/main/kotlin/site/stoku/logjika/GrupiLogjika.kt'];
  const mbet = kode.filter(f => /lajmeroEkipen|ekAdminTekst|ekAdminDergo|ek-admin-njoftim|Njoftim për të gjithë grupin|Dërgo te i gjithë grupi|njoftoi të gjithë grupin|FushaShumeRreshta/.test(lx(f)));
  ok(mbet.length === 0, '0. pa "Njoftim për të gjithë grupin" askund', mbet);
  ok(/function paLajmerime\(/.test(lx('ekipa.js')) && /fun paLajmerime\(/.test(lx(K + 'Grupi.kt')), '0. ato të vjetrat fshihen (web + Android)');
  const ge = lx(K + 'ui/GrupiEkrani.kt');
  ok(/Cilësimet e grupit/.test(ge) && /Ik\.TrePika/.test(ge) && /Ik\.Laps/.test(ge) && !/Pill\("Ndrysho emrin"\)/.test(ge) && /if \(cilesimet\) Flete\(/.test(ge), '0. Android: ⋮ + laps + dritarja "Cilësimet e grupit"');
  const sw = lx('sw.js');
  ok(/stoku-v32\d/.test(sw) && /app-tel\.js\?v=3[2-9]\d/.test(sw) && /ekipa\.js\?v=3[2-9]\d/.test(sw), '0. sw.js: CACHE, app-tel, ekipa ≥ 320');

  // ===== Faqet =====
  const tani = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: tani - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'besa', 'g1'); perd('u3', 'drini', 'g1'); perd('u9', 'testmorina', 'g9');
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: tani });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: tani });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: tani });
  F.S.docs.set('grupet/g1/anetaret/u3', { emri: 'drini', roli: 'anetar', hyriSe: tani });
  F.S.docs.set('grupet/g1/feed/n1', { lloji: 'lajmerim', uid: 'u2', emri: 'besa', koha: tani - 5e4, tekst: 'NJOFTIMI-I-VJETER' });
  F.S.docs.set('grupet/g1/feed/n2', { lloji: 'hequr', uid: 'u2', emri: 'besa', koha: tani - 4e4, produkti: 'Kos', barkodi: '1' });
  F.S.docs.set('perdoruesit/' + ADM + '/njoftimet/j1', { lloji: 'lajmerim', uid: 'u2', emri: 'besa', tekst: 'NJOFTIMI-I-VJETER', grupi: 'g1', koha: tani - 5e4, lexuar: false });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [], produktet: [], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  async function faqe(pcF, uid, em) {
    const ctx = await b.newContext(pcF ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', deviceScaleFactor: 2 });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, em + '@stoku-app.local', pcF ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pcF ? 'pc.html' : 'index.html')); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  }
  const tel = await faqe(false, ADM, 'duli96');
  await tel.click('#btnEkipi'); await tel.waitForTimeout(1200);
  await tel.click('#ekMenu button[data-n="aktiviteti"]'); await tel.waitForTimeout(700);
  const akt = await tel.evaluate(() => document.getElementById('ekipiTrup').textContent);
  ok(!/NJOFTIMI-I-VJETER|njoftoi të gjithë grupin/.test(akt) && /Kos/.test(akt), '3. Aktiviteti: njoftimi i vjetër s\'del (ngjarjet e tjera po)');
  const zilja = await tel.evaluate(() => ((window.__stokuEkipaK && window.__stokuEkipaK.gj && window.__stokuEkipaK.gj.njoftimetPalexuara) || [{ lloji: 'pa-ekK' }]).map(x => x.lloji));
  ok(!zilja.includes('lajmerim') && !zilja.includes('pa-ekK'), '3. Zilja: njoftimi i vjetër s\'del', zilja);
  await tel.click('#ekMenu button[data-n="anetaret"]'); await tel.waitForTimeout(800);
  const r = await tel.evaluate(() => {
    const bx = id => { const e = document.querySelector(id); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; };
    const t = document.getElementById('ekipiTrup').textContent;
    return { karta: bx('.ek-grupi-rresht .ek-grupi-karta'), plus: bx('#ekFtoHap'), cil: bx('#ekGrupiCil'), laps: bx('#ekRiemerto'),
      pill: /Ndrysho emrin/.test(t), menaxho: /Menaxho kolegët/.test(t), llog: /Llogaritë e tjera/.test(t), njoft: /Njoftim për të gjithë|Dërgo te i gjithë grupi/.test(t),
      ta: !!document.getElementById('ekAdminTekst') };
  });
  ok(r.karta && r.plus && r.cil && r.karta.h === r.plus.h && r.plus.h === r.cil.h && r.plus.w === r.plus.h && r.cil.w === r.cil.h && r.plus.h >= 40 && r.plus.h <= 56 && r.karta.top === r.plus.top && r.plus.top === r.cil.top,
    '1. karta, + dhe ⋮: e njëjta lartësi (56, më e hollë), katrorë, në të njëjtën vijë', r);
  ok(r.laps && r.laps.w <= 40 && !r.pill, '1. "Ndrysho emrin" = laps i vogël (pa tekst)', r.laps);
  ok(!r.menaxho && !r.llog && !r.njoft && !r.ta, '2/3. te faqja: pa "Menaxho kolegët", pa "Llogaritë e tjera", pa njoftimin e grupit', r);
  await tel.screenshot({ path: SC + 'v320-koleget.png' });
  await tel.click('#ekRiemerto'); await tel.waitForTimeout(300);
  ok(await tel.evaluate(() => !!document.getElementById('ekGrupiEmriRi') && Math.abs(document.querySelector('.ek-grupi-rresht').getBoundingClientRect().height - document.getElementById('ekFtoHap').getBoundingClientRect().height) < 1), '1. lapsi hap fushën e emrit (rreshti s\'ndryshon lartësi)');
  await tel.keyboard.press('Escape'); await tel.waitForTimeout(300);
  await tel.click('#ekGrupiCil'); await tel.waitForTimeout(500);
  const d = await tel.evaluate(() => { const t = document.getElementById('gcTrup').textContent; return { hapur: document.getElementById('dlgGrupiCil').classList.contains('hapur'), titulli: document.getElementById('gcTitulli').textContent, nen: document.getElementById('gcNen').textContent,
    menaxho: /Menaxho kolegët/.test(t), besa: /besa/.test(t) && /Bëje admin/.test(t) && /Hiq/.test(t), llog: /Llogaritë e tjera/.test(t) }; });
  ok(d.hapur && d.titulli === 'Cilësimet e grupit' && d.nen === 'Albi Market 34' && d.menaxho && d.besa && !d.llog, '2. ⋮ hap "Cilësimet e grupit": Menaxho kolegët (v321: pa "Llogaritë e tjera")', d);
  await tel.screenshot({ path: SC + 'v320-cilesimet.png' });
  // "Hiq" pyet mbi dritaren
  await tel.evaluate(() => { const b = [...document.querySelectorAll('#gcTrup button')].find(x => x.textContent === 'Hiq'); b.click(); });
  await tel.waitForTimeout(400);
  ok(await tel.evaluate(() => { const k = document.getElementById('dlgKonfirmo'); return k.classList.contains('hapur') && +getComputedStyle(k).zIndex > +getComputedStyle(document.getElementById('dlgGrupiCil')).zIndex; }), '2. "Hiq" pyet mbi dritaren e cilësimeve');
  await tel.click('#konfJo'); await tel.waitForTimeout(300);
  await tel.click('#gcMbyll'); await tel.waitForTimeout(300);
  ok(await tel.evaluate(() => !document.getElementById('dlgGrupiCil').classList.contains('hapur')), '2. "Mbyll" e mbyll dritaren');
  ok(!tel.__gab.length, '2. pa gabime JS', tel.__gab);
  // Koleg i thjeshtë: pa + dhe pa ⋮
  const ko = await faqe(false, 'u3', 'drini');
  await ko.click('#btnEkipi'); await ko.waitForTimeout(1200);
  await ko.click('#ekMenu button[data-n="anetaret"]'); await ko.waitForTimeout(800);
  ok(await ko.evaluate(() => !document.getElementById('ekFtoHap') && !!document.getElementById('ekGrupiCil') && !document.getElementById('ekRiemerto') && document.querySelector('.ek-grupi-karta').getBoundingClientRect().height >= 40),
    '1. kolegu (jo admin): karta dhe ⋮ (v321: aty "Largohu"), pa + dhe laps');
  ok(!ko.__gab.length, '1. pa gabime JS', ko.__gab);
  // PC
  const pc = await faqe(true, ADM, 'duli96');
  ok(await pc.evaluate(() => !document.getElementById('ekAdminTekst') && !document.getElementById('ekAdminDergo') && !!document.getElementById('ekAdminPastroAkt')), '3. PC: pa njoftimin e grupit ("Pastro aktivitetin" mbetet)');
  ok(!pc.__gab.length, '3. PC: pa gabime JS', pc.__gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

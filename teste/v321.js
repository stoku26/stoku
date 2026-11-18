// v321 / Android (pronari, 5 foto, 17.11.2026):
//  1. "Grupi yt": "+" pa blu, rreshti më i vogël (48); "Largohu nga grupi" si buton i kuq te "⋮" (Cilësimet e grupit), "⋮" për çdo koleg;
//     "Llogaritë e tjera" u hoq krejt (web tel, PC, Android); ftesa mbetet me emrin te butoni "+"
//  2. Ora e dorës: zgjedhja Galaxy Watch / Apple Watch s'del kur ora është e lidhur (web + Android)
//  4. PC "PDF për printim": "Ditët e skanimit" si fushat e tjera (jo butoni i shfletuesit)
//  5. PDF: pa "Periudha"; numri i furnizuesve në vend të saj (web tel, PC, Android)
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765', PUSH = 'https://stoku-push.mendurb.workers.dev';
const SC = '/tmp/claude-0/-home-user-stoku/e6bed5df-a3f5-5158-8183-d77a3d2bc01d/scratchpad/';
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';

(async () => {
  // ===== 0. Kodi =====
  const kode = ['app-tel.js', 'app-pc.js', 'index.html', 'pc.html', K + 'ui/GrupiEkrani.kt'];
  ok(kode.every(f => !/Llogaritë e tjera|vizatoLlogariteETjera|ekLlogarite/.test(lx(f))), '1. pa "Llogaritë e tjera" askund', kode.filter(f => /Llogaritë e tjera|vizatoLlogariteETjera|ekLlogarite/.test(lx(f))));
  const ge = lx(K + 'ui/GrupiEkrani.kt');
  const fl = ge.slice(ge.indexOf('if (cilesimet) Flete('));
  ok(/Buton\("Largohu nga grupi"/.test(fl) && (ge.match(/Buton\("Largohu nga grupi"/g) || []).length === 1, '1. Android: "Largohu" vetëm te "Cilësimet e grupit"');
  ok(/height\(48\.dp\)/.test(ge) && !/else n\.accent\)\.border\(if \(ftoHapur\)/.test(ge) && !/val meCilesime/.test(ge), '1. Android: rreshti 48, "+" pa blu, "⋮" për çdo koleg');
  ok(/if \((gati && )?oret\.isEmpty\(\)\) Row\(/.test(lx(K + 'ui/NjoftimetUI.kt')), '2. Android: Galaxy/Apple vetëm pa orë të lidhur');
  ok(['app-tel.js', 'app-pc.js', K + 'ui/EksportetUI.kt'].every(f => !/"Periudha: "|'Periudha: '/.test(lx(f))) && /fun nrFurnizuesve/.test(lx(K + 'EksportiPdf.kt')) && /EksportiPdf\.nrFurnizuesve\(lista\)/.test(lx(K + 'ui/EksportetUI.kt')),
    '5. PDF: pa "Periudha: " (web tel, PC, Android), me numrin e furnizuesve');
  ok(/stoku-v3(2[1-9]|[3-9]\d)/.test(lx('sw.js')) && /app-tel\.js\?v=3(2[1-9]|[3-9]\d)/.test(lx('sw.js')) && /eksportet\.js\?v=3(2[1-9]|[3-9]\d)/.test(lx('sw.js')), '0. versionet');

  const tani = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: tani - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'besa', 'g1'); perd('u3', 'drini', 'g1'); perd('u9', 'testmorina', 'g9');
  F.S.docs.set('emrat/testmorina', { uid: 'u9', ndryshuarSe: tani });
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: tani });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: tani });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: tani });
  F.S.docs.set('grupet/g1/anetaret/u3', { emri: 'drini', roli: 'anetar', hyriSe: tani });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [], produktet: [], fshira: {}, afatet: [] });
  let oret = [];
  const b = await chromium.launch();
  async function faqe(pcF, uid, em, ua) {
    const ctx = await b.newContext(pcF ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: ua || 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', deviceScaleFactor: 2 });
    await ctx.route(u => !u.href.startsWith(B) && !u.href.startsWith(PUSH), r => r.abort());
    await ctx.route(u => u.href.startsWith(PUSH), r => {
      const u = new URL(r.request().url()), h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
      if (u.pathname === '/ora/oret') return r.fulfill({ status: 200, headers: h, body: JSON.stringify({ ok: true, oret }) });
      return r.fulfill({ status: 200, headers: h, body: '{"ok":true}' });
    });
    await F.lidh(ctx, uid, em + '@stoku-app.local', pcF ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/' + (pcF ? 'pc.html' : 'index.html')); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  }

  // ===== 1. Grupi yt (web tel, admini i grupit) =====
  const tel = await faqe(false, ADM, 'duli96');
  await tel.click('#btnEkipi'); await tel.waitForTimeout(1200);
  await tel.click('#ekMenu button[data-n="anetaret"]'); await tel.waitForTimeout(800);
  const r = await tel.evaluate(() => {
    const bx = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; };
    const fto = document.getElementById('ekFtoHap'), cil = document.getElementById('ekGrupiCil');
    const t = document.getElementById('ekipiTrup').textContent;
    return { karta: bx('.ek-grupi-rresht .ek-grupi-karta'), plus: bx('#ekFtoHap'), cil: bx('#ekGrupiCil'), sfFto: getComputedStyle(fto).backgroundColor, sfCil: getComputedStyle(cil).backgroundColor,
      ngjFto: getComputedStyle(fto).color, ngjCil: getComputedStyle(cil).color, largohu: !!document.getElementById('ekLargohu'), llog: /Llogaritë e tjera/.test(t) };
  });
  const z = r.cil && r.cil.h / 48; // zmadhimi "Normale" (0.9)
  ok(r.karta && r.plus && r.cil && r.karta.h === r.plus.h && r.plus.h === r.cil.h && r.plus.w === r.plus.h && r.plus.h < 50 && r.plus.h >= 40, '1. rreshti më i vogël (48, më parë 56): karta, + dhe ⋮ njësoj', r);
  ok(r.sfFto === r.sfCil && r.ngjFto === r.ngjCil, '1. "+" pa blu: njësoj si "⋮"', [r.sfFto, r.sfCil]);
  ok(!r.largohu && !r.llog, '1. faqja: pa "Largohu" poshtë, pa "Llogaritë e tjera"', r);
  await tel.screenshot({ path: SC + 'v321-koleget.png' });
  // "+" hap fushën: shkruan emrin dhe fton
  await tel.click('#ekFtoHap'); await tel.waitForTimeout(300);
  await tel.fill('#ekFtoEmri', 'testmorina'); await tel.click('#ekFtoBtn'); await tel.waitForTimeout(1200);
  ok(await tel.evaluate(() => /Ftesa në pritje \(1\)/.test(document.getElementById('ekipiTrup').textContent) && /testmorina/.test(document.getElementById('ekipiTrup').textContent)), '1. "+": shkruan emrin, ftesa del te "Ftesa në pritje"');
  await tel.click('#ekFtoHap'); await tel.waitForTimeout(300);
  await tel.click('#ekGrupiCil'); await tel.waitForTimeout(500);
  const d = await tel.evaluate(() => { const t = document.getElementById('gcTrup').textContent, l = document.getElementById('ekLargohu');
    return { hapur: document.getElementById('dlgGrupiCil').classList.contains('hapur'), menaxho: /Menaxho kolegët/.test(t), llog: /Llogaritë e tjera/.test(t),
      largohu: !!l && document.getElementById('gcTrup').contains(l) && !!l.offsetParent, ngj: l && getComputedStyle(l).color, hije: l && getComputedStyle(l).boxShadow, pas: l && !l.nextElementSibling }; });
  ok(d.hapur && d.menaxho && !d.llog && d.largohu && d.pas, '1. ⋮: Menaxho kolegët + "Largohu nga grupi" në fund, pa "Llogaritë e tjera"', d);
  ok(/rgb\((19[0-9]|2\d\d), \d{1,2}, \d{1,2}\)/.test(d.ngj) && /inset/.test(d.hije), '1. "Largohu" buton i kuq (si "Shkëput orën")', [d.ngj, d.hije]);
  await tel.screenshot({ path: SC + 'v321-cilesimet.png' });
  await tel.click('#ekLargohu'); await tel.waitForTimeout(400);
  ok(await tel.evaluate(() => !document.getElementById('dlgGrupiCil').classList.contains('hapur') && /Të largohesh nga grupi/.test(document.getElementById('dlgKonfirmo').textContent) && document.getElementById('dlgKonfirmo').classList.contains('hapur')),
    '1. "Largohu" mbyll dritaren dhe pyet');
  await tel.click('#konfJo'); await tel.waitForTimeout(300);
  ok(!!F.S.docs.get('grupet/g1/anetaret/' + ADM), '1. "Jo": mbetet në grup');
  ok(!tel.__gab.length, '1. pa gabime JS', tel.__gab);
  // Koleg i thjeshtë: ⋮ me vetëm "Largohu"
  const ko = await faqe(false, 'u3', 'drini');
  await ko.click('#btnEkipi'); await ko.waitForTimeout(1200);
  await ko.click('#ekMenu button[data-n="anetaret"]'); await ko.waitForTimeout(800);
  ok(await ko.evaluate(() => !document.getElementById('ekFtoHap') && !!document.getElementById('ekGrupiCil') && !document.getElementById('ekLargohu')), '1. kolegu: pa "+", me "⋮"');
  await ko.click('#ekGrupiCil'); await ko.waitForTimeout(400);
  ok(await ko.evaluate(() => { const t = document.getElementById('gcTrup').textContent; return !/Menaxho/.test(t) && !!document.getElementById('ekLargohu') && !!document.getElementById('ekLargohu').offsetParent; }), '1. kolegu: ⋮ ka vetëm "Largohu nga grupi"');
  await ko.click('#ekLargohu'); await ko.waitForTimeout(300); await ko.click('#konfPo'); await ko.waitForTimeout(1500);
  ok(!F.S.docs.get('grupet/g1/anetaret/u3'), '1. kolegu u largua nga grupi');
  ok(!ko.__gab.length, '1. kolegu: pa gabime JS', ko.__gab);

  // ===== 2. Ora e dorës =====
  async function ora(ua) {
    const p = await faqe(false, ADM, 'duli96', ua);
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabOra'); await p.waitForTimeout(1200);
    return p.evaluate(() => ({ seg: !document.getElementById('segOra').hidden && !!document.getElementById('segOra').offsetParent, karta: !document.getElementById('oraLidhur').hidden,
      galaxy: !document.querySelector('.ops-ora-faqe[data-ora="galaxy"]').hidden }));
  }
  let o = await ora();
  ok(o.seg && !o.karta, '2. pa orë: Galaxy Watch / Apple Watch del', o);
  oret = [{ id: 'abcdef0123456789', model: 'SM-L705F', koha: tani - 864e5, aktiv: tani - 864e5, v: 78 }];
  o = await ora();
  ok(!o.seg && o.karta && o.galaxy, '2. me orë të lidhur: pa Galaxy/Apple, vetëm karta e orës', o);
  o = await ora('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
  ok(!o.seg && o.karta && o.galaxy, '2. iPhone me orë të lidhur: karta e orës (jo faqja e Apple)', o);

  // ===== 4/5. PC: "Ditët e skanimit" + numri i furnizuesve =====
  const pc = await faqe(true, ADM, 'duli96');
  const s = await pc.evaluate(() => {
    document.getElementById('dlgAfPdf').classList.add('hapur');
    const st = id => { const c = getComputedStyle(document.getElementById(id)); return [c.backgroundColor, c.boxShadow, c.borderRadius, c.height, c.color].join(' | '); };
    return { per: st('apPeriudha'), dit: st('apDitetRr'), shigjeta: getComputedStyle(document.getElementById('apDitetRr')).backgroundImage.slice(0, 20) };
  });
  ok(s.per === s.dit && /url/.test(s.shigjeta), '4. PC: "Ditët e skanimit" njësoj si "Periudha" (sfondi, korniza, lartësia, shigjeta)', s);
  await pc.screenshot({ path: SC + 'v321-pc-pdf.png' });
  await pc.evaluate(() => document.getElementById('dlgAfPdf').classList.remove('hapur'));
  const n = await pc.evaluate(() => [
    window.StokuEksportet.nrFurnizuesve([{ furnizuesi: 'Laberion' }, { furnizuesi: ' laberion ' }, { furnizuesi: 'Albi' }, { furnizuesi: '' }, {}, { furnizuesi: 'Devolli' }]),
    window.StokuEksportet.nrFurnizuesve([])]);
  ok(n[0] === 3 && n[1] === 0, '5. numri i furnizuesve (pa të përsëriturit dhe pa të zbrazëtit)', n);
  ok(!pc.__gab.length, '4. PC: pa gabime JS', pc.__gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

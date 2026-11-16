// v313 / Android Hyrja 75 (pronari): "Boni krejta qeto te cilesimet > pamja ni opsion minimized qe kur klikon dikush kshyr me ja
// ndrru logot me ju bo synced ne llogari ... Si tbohen login me ju kthy edhe me ju vendos kudo qajo qe e ka zgjedh. Edhe kshyri
// njoftimet ... nese i ka nal njoftimet ma heret lypja edhe bonja te detyrushme secilit mi pas njoftimet aktiv perndryshe mos e le
// me kalu ne dritare tjeter pa i aktivizu njoftimet".
//  - logoja 60 ("Lista e kontrollit") e parazgjedhur kudo; 25 kombinime ngjyrash te Cilësimet → Pamja → Logoja (grup i mbyllur);
//    zgjedhja ruhet te llogaria (perdoruesit/{uid}.pamja.logo), kthehet pas hyrjes dhe zbatohet në kokë, hyrje, skedë (favicon),
//    faqen bosh të PC-së, PDF/foto (web) dhe Android (Logo.kt, eksportet, Pamja);
//  - njoftimet: "Njoftimi ditor" s'fiket më; kush e kishte fikur pyetet sërish; iPhone në Safari → si shtohet në ekranin bazë.
const pw = require('./pw.js');
pw.meNjoftime = true; // pjesa e njoftimeve e provon vetë dritaren (pa shenjën e testeve)
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
const R = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise(r => setTimeout(r, 100)); } return false; };
const B = process.env.STOKU_B || 'http://127.0.0.1:8765';
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const UA = 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile';
const UA_IPHONE = v => 'Mozilla/5.0 (iPhone; CPU iPhone OS ' + v + ' like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const rgb = h => 'rgb(' + [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')';

(async () => {
  const lx = f => fsN.readFileSync(R + f, 'utf8');
  // 0) statike
  // v314: kontrollet e 25 logove (v313) u hoqën bashkë me zgjedhjen; logoja dhe ikonat e reja te teste/v314.js
  const nju = lx('vendas/app/src/main/java/site/stoku/vendas/ui/NjoftimetUI.kt'), nj = lx('vendas/app/src/main/java/site/stoku/vendas/Njoftimet.kt'), tel = lx('app-tel.js');
  ok(/fun ditoriMungon\(\)/.test(nju) && /s'mund të fiket/.test(nju) && /IMPORTANCE_NONE\) return "bllokuar"/.test(nj), '0. Android: njoftimi ditor i detyrueshëm, kanali i fikur = i bllokuar');
  ok(/function ditoriMungon\(\)/.test(tel) && /function iphonePaEkranBaze\(\)/.test(tel) && /i detyrueshëm dhe s\\'mund të fiket/.test(tel), '0. web tel: njoftimi ditor i detyrueshëm + iPhone pa ekran bazë');
  // Pronari (foto e fundit të PDF-së): "krijuar me stoku hiqe ... veq webin leje": PDF poshtë vetëm adresa; fotoja pa "Krijuar me Stoku"
  const eks = lx('eksportet.js'), kPdf = lx('vendas/app/src/main/java/site/stoku/vendas/EksportiPdf.kt'), kFoto = lx('vendas/app/src/main/java/site/stoku/vendas/EksportiFoto.kt');
  ok(!/d\.text\('https:\/\/stoku\.site'/.test(eks) /* v317: asgjë poshtë */ && !/d\.text\('Krijuar|'Faqja 1 nga '|, ora ' \+ o\.ora/.test(eks) && /aefTekst\(c, 'stoku\.site', P \+ 26/.test(eks) && !/aefTekst\(c, 'Krijuar/.test(eks),
    '0. web: PDF poshtë vetëm "https://stoku.site", fotoja "stoku.site" (pa "Krijuar me Stoku")');
  ok(!/v\.tekst\("https:\/\/stoku\.site"/.test(kPdf) /* v317 */ && !/v\.tekst\("(Krijuar|Faqja)/.test(kPdf) && /cv\.tekst\(p, "stoku\.site", P \+ 26f/.test(kFoto) && !/tekst\(p, "Krijuar/.test(kFoto),
    '0. Android: i njëjti fund te PDF-ja dhe fotoja');

  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'agim', kycurSe: tani });
  const b = await chromium.launch();
  // faqja: pa dritaren e njoftimeve (leja + njoftimi ditor të ndezura), përveç kur provohen vetë njoftimet
  async function faqe(uid, opt) {
    opt = opt || {};
    const ctx = await b.newContext(opt.pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: opt.ua || UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await ctx.route(u => u.href.startsWith(PUSH), r => r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }));
    if (opt.paNjoftime) await ctx.addInitScript(() => { try { delete window.Notification; } catch (e) { /* ok */ } });
    else {
      await ctx.addInitScript(() => { try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); } catch (e) { /* ok */ } });
      if (!opt.paDitor) await ctx.addInitScript(u => { try { localStorage.setItem('stoku:orari', JSON.stringify({ uid: u, aktiv: true, ora: '08:00', koha: Date.now() })); } catch (e) { /* ok */ } }, uid);
    }
    if (opt.logo) await ctx.addInitScript(l => { try { localStorage.setItem('stoku:logoja', l); } catch (e) { /* ok */ } }, opt.logo);
    if (uid) await F.lidh(ctx, uid, 'agim@stoku-app.local', opt.pc ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/' + (opt.pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(3500);
    return p;
  }
  const gjendja = p => p.evaluate(() => {
    const f = document.querySelector('#logoButon .lg-f');
    return { logo: document.documentElement.getAttribute('data-logo'), ls: localStorage.getItem('stoku:logoja'), fav: (document.querySelector('link[rel=icon]') || {}).href || '',
      f: f ? getComputedStyle(f).fill : null };
  });
  const cloud = () => ((F.S.docs.get('perdoruesit/uA') || {}).pamja || {});

  // 6) Njoftimet: leja e dhënë, por njoftimi ditor i fikur → dritarja pyet; butoni e ndez; te Cilësimet s'fiket më
  const p6 = await faqe('uA', { paDitor: true });
  ok(await prit(() => p6.evaluate(() => document.getElementById('dlgNjoftimet').classList.contains('hapur')), 8000), '6. njoftimi ditor i fikur: dritarja e detyrueshme hapet');
  ok(await p6.evaluate(() => document.getElementById('njIphone').hidden && document.getElementById('njBllokuar').hidden && /Aktivizo njoftimet/.test(document.getElementById('njAktivizo').textContent)),
    '6. "Aktivizo njoftimet" (pa udhëzimet e bllokimit)');
  await p6.evaluate(() => {
    const e = window.__stokuCloud.ekipa;
    e.vendosOrarin = async o => { localStorage.setItem('stoku:orari', JSON.stringify({ uid: 'uA', aktiv: true, ora: o.ora, koha: Date.now() })); return { ok: true }; };
  });
  await p6.click('#njAktivizo'); await p6.waitForTimeout(800);
  ok(!(await p6.evaluate(() => document.getElementById('dlgNjoftimet').classList.contains('hapur'))) && /aktivizuan/.test(await p6.textContent('#toast')), '6. pas butonit: njoftimi ditor u ndez, dritarja u mbyll', await p6.textContent('#toast'));
  await p6.click('#btnOpsione'); await p6.waitForTimeout(400);
  await p6.click('#tabNjoftimet'); await p6.waitForTimeout(500);
  ok(await p6.isChecked('#njDitor'), '6. Cilësimet → Njoftimet: "Njoftimi ditor" i ndezur');
  await p6.click('label[for="njDitor"]'); await p6.waitForTimeout(400);
  ok(await p6.isChecked('#njDitor') && /i detyrueshëm/.test(await p6.textContent('#toast')), '6. s\'fiket: "Njoftimi ditor është i detyrueshëm"', await p6.textContent('#toast'));

  // 7) iPhone në Safari (pa Notification, iOS 17): udhëzimi për ekranin bazë, pa buton; iOS 15: s'detyrohet
  {
    const pi = await faqe('uA', { ua: UA_IPHONE('17_1'), paNjoftime: true });
    const r = await pi.evaluate(() => ({ hapur: document.getElementById('dlgNjoftimet').classList.contains('hapur'), iph: !document.getElementById('njIphone').hidden,
      buton: !document.getElementById('njAktivizo').hidden }));
    ok(r.hapur && r.iph && !r.buton, '7. iPhone iOS 17 në Safari: si shtohet në ekranin bazë, pa buton', r);
    await pi.screenshot({ path: __dirname + '/v313-iphone.png' });
    const pv = await faqe('uA', { ua: UA_IPHONE('15_4'), paNjoftime: true });
    ok(!(await pv.evaluate(() => document.getElementById('dlgNjoftimet').classList.contains('hapur'))), '7. iPhone iOS 15 (pa njoftime në web): s\'detyrohet');
    ok(!pi.__gab.length && !pv.__gab.length, '7. iPhone: pa gabime JS', [pi.__gab, pv.__gab]);
  }

  const gab = [p6].flatMap(x => x.__gab || []);
  ok(!gab.length, '8. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

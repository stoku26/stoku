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
  const logot = lx('logot.js'), css = lx('css/stoku-logot.css'), html = lx('index.html'), pc = lx('pc.html'), kt = lx('vendas/app/src/main/java/site/stoku/vendas/ui/Logot.kt');
  ok((logot.match(/\{ id: '60(-\d+)?'/g) || []).length === 25 && /LOGOT-FILLIMI \*\/\n  var DATA/.test(logot), '0. logot.js: 25 kombinime (60, 60-1 … 60-24)');
  ok((css.match(/\[data-logo="60-\d+"\]/g) || []).length === 48 && /\.stk-logo \.lg-t \{ fill: currentColor; \}/.test(css), '0. stoku-logot.css: ngjyrat për 24 variantet (e çelët + e errët)');
  ok([html, pc].every(h => /<!-- LOGO-FILLIMI --><svg class="stk-logo stk-logo--22 stk-etiketa__logo"/.test(h) && !/stk-etiketa__barkodi/.test(h) && /logot\.js\?v=1/.test(h) && /stoku-logot\.css\?v=1/.test(h)),
    '0. index.html + pc.html: logoja 60 në kokë (pa "STOKU" + barkodin), logot.js + stoku-logot.css');
  ok(/id="pamjaLogoja"/.test(html) && /id="opsLogoja"/.test(pc) && /id="pamjaBoshLogo"/.test(pc), '0. vendi i "Logoja" te Pamja (telefon + PC) dhe logoja e faqes bosh te PC-ja');
  ok(/data-logo/.test(lx('fillimi-tel.js')) && /data-logo/.test(lx('fillimi-pc.js')), '0. fillimi-*.js: data-logo para vizatimit');
  ok((kt.match(/Varianti\("60(-\d+)?"/g) || []).length === 25 && /const val FJALA/.test(kt), '0. Android Logot.kt: 25 kombinime + fjala');
  const op = lx('vendas/app/src/main/java/site/stoku/vendas/Opsionet.kt'), ll = lx('vendas/app/src/main/java/site/stoku/vendas/Llogaria.kt');
  ok(/fun vendosLogon\(/.test(op) && /"logo" to Opsionet\.logoja\.value/.test(ll) && /x\["logo"\] as\? String/.test(ll), '0. Android: logoja ruhet te llogaria dhe merret prej saj');
  const cil = lx('vendas/app/src/main/java/site/stoku/vendas/ui/CilesimetEkrani.kt'), lg = lx('vendas/app/src/main/java/site/stoku/vendas/ui/Logo.kt');
  ok(/private fun GrupiLogos\(/.test(cil) && /GrupiLogos\(\)/.test(cil) && /Logot\.logoShenja/.test(lg) && !/STOKU/.test(lg), '0. Android: Pamja → Logoja dhe koka me logon 60');
  ok(/Logot\.FJALA/.test(lx('vendas/app/src/main/java/site/stoku/vendas/EksportiFoto.kt')) && /StokuLogot/.test(lx('eksportet.js')) && !/AEF_SHIRITAT/.test(lx('eksportet.js')), '0. PDF/foto: logoja e zgjedhur (web + Android)');
  ok(/ic_launcher_monochrome/.test(lx('vendas/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml')) && /#2E7D4F/.test(lx('vendas/app/src/main/res/values/colors.xml')) &&
    /#2E7D4F/.test(lx('ora/app/src/main/res/drawable/ikona_sfondi.xml')) && /R\.drawable\.logo_stoku/.test(lx('ora/app/src/main/java/site/stoku/ora/MainActivity.kt')), '0. ikonat: Android (sfondi i gjelbër, njëngjyrëshja) dhe ora');
  ok(/"src": "icon-192\.png\?v=4"/.test(lx('manifest.webmanifest')) && /badge-96\.png\?v=2/.test(lx('sw.js')), '0. ikonat e reja me ?v=4 (manifest, sw.js)');
  const nju = lx('vendas/app/src/main/java/site/stoku/vendas/ui/NjoftimetUI.kt'), nj = lx('vendas/app/src/main/java/site/stoku/vendas/Njoftimet.kt'), tel = lx('app-tel.js');
  ok(/fun ditoriMungon\(\)/.test(nju) && /s'mund të fiket/.test(nju) && /IMPORTANCE_NONE\) return "bllokuar"/.test(nj), '0. Android: njoftimi ditor i detyrueshëm, kanali i fikur = i bllokuar');
  ok(/function ditoriMungon\(\)/.test(tel) && /function iphonePaEkranBaze\(\)/.test(tel) && /i detyrueshëm dhe s\\'mund të fiket/.test(tel), '0. web tel: njoftimi ditor i detyrueshëm + iPhone pa ekran bazë');
  // Pronari (foto e fundit të PDF-së): "krijuar me stoku hiqe ... veq webin leje": PDF poshtë vetëm adresa; fotoja pa "Krijuar me Stoku"
  const eks = lx('eksportet.js'), kPdf = lx('vendas/app/src/main/java/site/stoku/vendas/EksportiPdf.kt'), kFoto = lx('vendas/app/src/main/java/site/stoku/vendas/EksportiFoto.kt');
  ok(/d\.text\('https:\/\/stoku\.site', X, 290\.6\);/.test(eks) && !/d\.text\('Krijuar|'Faqja 1 nga '|, ora ' \+ o\.ora/.test(eks) && /aefTekst\(c, 'stoku\.site', P \+ 26/.test(eks) && !/aefTekst\(c, 'Krijuar/.test(eks),
    '0. web: PDF poshtë vetëm "https://stoku.site", fotoja "stoku.site" (pa "Krijuar me Stoku")');
  ok(/v\.tekst\("https:\/\/stoku\.site", X, 290\.6f, FAINT\)/.test(kPdf) && !/v\.tekst\("Krijuar|"Faqja 1 nga/.test(kPdf) && /cv\.tekst\(p, "stoku\.site", P \+ 26f/.test(kFoto) && !/tekst\(p, "Krijuar/.test(kFoto),
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

  // 1) Telefoni: koka me logon 60, "Logoja" e mbyllur te Pamja, zgjedhja ndryshon ngjyrat dhe ruhet te llogaria
  const p1 = await faqe('uA');
  let gj = await gjendja(p1);
  ok(gj.logo === null && gj.f === rgb('#2e7d4f') && /favicon\.svg\?v=4/.test(gj.fav), '1. parazgjedhja "60": koka e gjelbër, favicon i zakonshëm', gj);
  await p1.click('#btnOpsione'); await p1.waitForTimeout(500);
  await p1.click('#tabPamja'); await p1.waitForTimeout(500);
  const mbyllur = await p1.evaluate(() => ({ krye: document.querySelector('#pamjaLogoja .tm-krye').getAttribute('aria-expanded'), rr: document.querySelector('#pamjaLogoja .tm-rrjeta').hidden,
    n: document.querySelectorAll('#pamjaLogoja .lg-karta').length, tx: document.querySelector('#pamjaLogoja .tm-krye-tekst').textContent }));
  ok(mbyllur.krye === 'false' && mbyllur.rr === true && mbyllur.n === 25 && /Logoja60 · Gjelbër/.test(mbyllur.tx), '1. "Logoja" e mbyllur, me 25 kartat brenda', mbyllur);
  await p1.click('#pamjaLogojaKrye'); await p1.waitForTimeout(300);
  ok(await p1.isVisible('#pamjaLogoja .lg-karta[data-id="60-12"]'), '1. prekja e hap grupin');
  await p1.screenshot({ path: __dirname + '/v313-pamja.png' });
  await p1.click('#pamjaLogoja .lg-karta[data-id="60-12"]'); await p1.waitForTimeout(600);
  gj = await gjendja(p1);
  ok(gj.logo === '60-12' && gj.ls === '60-12' && gj.f === rgb('#4c1d95') && /^data:image\/svg\+xml/.test(gj.fav), '1. "60-12": koka me ngjyrat e reja, favicon i ri, ruajtur në pajisje', gj);
  ok(await prit(() => cloud().logo === '60-12'), '1. ruhet te llogaria (pamja.logo)', cloud());
  ok(await p1.evaluate(() => document.querySelector('#pamjaLogoja .lg-karta[aria-pressed="true"]').getAttribute('data-id') === '60-12' && /60-12 · Vjollcë \+ mente/.test(document.querySelector('#pamjaLogoja .tm-krye-tekst').textContent)),
    '1. karta e zgjedhur dhe titulli "60-12 · Vjollcë + mente"');
  await p1.click('#segTema button[data-v="dark"]'); await p1.waitForTimeout(400);
  gj = await gjendja(p1);
  ok(gj.f === rgb('#c4b5fd'), '1. tema e errët: ngjyrat e errëta të logos', gj.f);
  await p1.click('#segTema button[data-v="auto"]'); await p1.waitForTimeout(300);

  // 2) Pajisje tjetër (hyrje e re): logoja vjen nga llogaria
  const p2 = await faqe('uA');
  ok(await prit(async () => (await gjendja(p2)).logo === '60-12', 8000), '2. pajisja tjetër pas hyrjes: "60-12" nga llogaria', await gjendja(p2));

  // 3) PC: zgjedhja te Pamja → llogaria → telefoni i hapur e merr vetë; faqja bosh me logon
  const pp = await faqe('uA', { pc: true });
  ok(await prit(async () => (await pp.evaluate(() => document.documentElement.getAttribute('data-logo'))) === '60-12', 8000), '3. PC: "60-12" nga llogaria');
  ok(await pp.evaluate(() => !!document.querySelector('#pamjaBoshLogo svg.stk-logo') && document.querySelectorAll('#opsLogoja .lg-karta').length === 25), '3. PC: logoja te faqja bosh + 25 kartat te Pamja');
  await pp.evaluate(() => { document.querySelector('#opsLogojaKrye').click(); document.querySelector('#opsLogoja .lg-karta[data-id="60-3"]').click(); });
  ok(await prit(() => cloud().logo === '60-3'), '3. PC: "60-3" ruhet te llogaria', cloud());
  ok(await prit(async () => (await gjendja(p1)).logo === '60-3', 8000), '3. telefoni i hapur e merr "60-3" vetë', await gjendja(p1));

  // 4) Hyrja (porta) para hyrjes: logoja e kësaj pajisjeje
  {
    const ph = await faqe(null, { logo: '60-5' });
    const r = await ph.evaluate(() => ({ porta: !!document.querySelector('#porta .pk-logo svg.stk-logo'), logo: document.documentElement.getAttribute('data-logo'),
      f: getComputedStyle(document.querySelector('#porta .pk-logo .lg-f')).fill }));
    ok(r.porta && r.logo === '60-5' && r.f === rgb('#172554'), '4. hyrja: logoja 60-5 e kësaj pajisjeje', r);
    await ph.context().close();
  }

  // 5) PDF dhe foto: logoja vizatohet me ngjyrat e zgjedhura
  const ex = await p1.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 40; const c = cv.getContext('2d');
    const w = window.StokuEksportet.logo(c, 0, 0, 40, { logo: '#14161b', erret: false });
    const d = c.getImageData(0, 0, 200, 40).data; let n = 0, ngjyra = false;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 200) { n++; if (d[i] === 0x03 && d[i + 1] === 0x69 && d[i + 2] === 0xa1) ngjyra = true; } }
    return { w: Math.round(w), n, ngjyra };
  });
  ok(ex.w === Math.round(40 * 158.53 / 43.2) && ex.n > 800 && ex.ngjyra, '5. eksporti: logoja (gjerësia sipas raportit) me ngjyrën e "60-3"', ex);

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

  const gab = [p1, p2, pp, p6].flatMap(x => x.__gab || []);
  ok(!gab.length, '8. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

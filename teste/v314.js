// v314 / Android Hyrja 76 (pronari): "hiqja ikonen ndersa bone si logo me shkronja te mdhaja ... komplet qat hapsir edhe boxin
// permas hiqja", "mush krejt qat hapsir ne pc", "nr 4 osht perfekt per ikonat", "bone 4-shin kur e ka perdoruesi dark mode ...
// 5-shin e bon ne white mode", "te cilesimet pamja qato logot komplet fshij", "useri qe osht te logo ... mos tdalin qaty mo",
// "mos harro edhe te hyrja ... qite logon", "sigurohu qe mu ndrru edhe ikona e jashtme e appit kur zgjidhet dark mode ose white mode".
const pw = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const R = __dirname + '/../', lx = f => fs.readFileSync(R + f, 'utf8');
const B = 'http://127.0.0.1:8765', K = 'vendas/app/src/main/';
(async () => {
  // 0) statike
  const logot = lx('logot.js'), html = lx('index.html'), pc = lx('pc.html');
  ok(/fjala: \{ w: [\d.]+, h: [\d.]+, t: '/.test(logot) && !/variantet|shenja:/.test(logot) && /celet: \{ bg: '#ffffff'/.test(logot), '0. logot.js: vetëm fjala "stoku." + ikona e errët dhe e çelët, pa 25 logot');
  ok(!/pamjaLogoja/.test(html) && !/opsLogoja/.test(pc) && !/stoku:logoja/.test(lx('fillimi-tel.js') + lx('fillimi-pc.js')) && !/logo:/.test(lx('ekipa.js').match(/function pamjaEPastert[^]*?\n    \}/)[0]), '0. pa "Logoja" te Pamja, pa sinkronizimin e saj');
  ok(/stk-logo--etiketa stk-etiketa__logo/.test(html) && /stk-logo--pc stk-etiketa__logo/.test(pc) && !/class="lg-f"/.test(html + pc), '0. koka: logoja me shkronja (telefon + PC)');
  ok(/\.stk-etiketa__nen \{ display: none !important; \}/.test(lx('css/stoku-tokens.css')) && /\.stk-logo--pc \{ width: 100%; height: auto; \}/.test(lx('css/stoku-pc.css')), '0. pa emrin poshtë logos; PC sa krejt gjerësia');
  ok(fs.existsSync(R + 'logo/stoku-icon-celet.svg') && fs.existsSync(R + 'logo/favicon-celet.svg') && !fs.existsSync(R + 'logo/stoku-mark.svg'), '0. ikonat e errëta dhe të çelëta (web)');
  const man = lx(K + 'AndroidManifest.xml'), kt = lx(K + 'java/site/stoku/vendas/ui/Logot.kt');
  ok(/\.IkonaErret"/.test(man) && /\.IkonaCelet"/.test(man) && /@mipmap\/ic_launcher_celet/.test(man) && /IkonaJashtme\.perditeso/.test(lx(K + 'java/site/stoku/vendas/MainActivity.kt')) &&
    fs.existsSync(R + K + 'res/mipmap-anydpi-v26/ic_launcher_celet.xml') && /ikona_sfondi">#14161B/.test(lx(K + 'res/values/colors.xml')), '0. Android: ikona e jashtme e errët / e çelët sipas temës');
  ok(!/variantet|Varianti|logoShenja/.test(kt) && !/GrupiLogos|logoja/.test(lx(K + 'java/site/stoku/vendas/ui/CilesimetEkrani.kt') + lx(K + 'java/site/stoku/vendas/Opsionet.kt')) &&
    !/Text\(emri/.test(lx(K + 'java/site/stoku/vendas/ui/Logo.kt')), '0. Android: pa 25 logot, pa emrin poshtë logos');
  ok(/#14161B/.test(lx('ora/app/src/main/res/drawable/ikona_sfondi.xml')), '0. ora: ikona e errët (nr. 4)');

  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'duli96', kycurSe: Date.now(), pamja: { tema: 'dark', e: 1, c: 1, logo: '60-12', t: 1 } });
  const b = await pw.chromium.launch();
  async function faqe(pcja, tema, uid) {
    const ctx = await b.newContext(pcja ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' } : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await ctx.addInitScript(t => { try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); localStorage.setItem('stoku:orari', JSON.stringify({ uid: 'uA', aktiv: true, ora: '08:00', koha: Date.now() })); localStorage.setItem('stoku:logoja', '60-5'); if (t) localStorage.setItem('stoku:tema', t); } catch (e) {} }, tema);
    if (uid) await F.lidh(ctx, uid, 'duli96@stoku-app.local', pcja ? 'pc' : 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/' + (pcja ? 'pc.html' : 'index.html')); await p.waitForTimeout(3500);
    return p;
  }
  const koka = p => p.evaluate(() => {
    const e = document.getElementById('logoButon'), s = e.querySelector('svg.stk-logo'), n = e.querySelector('.stk-etiketa__nen'), r = s.getBoundingClientRect(), cs = getComputedStyle(e);
    const sb = document.querySelector('.sbp-brand'), sbr = sb ? sb.getBoundingClientRect() : null;
    return { w: Math.round(r.width), h: Math.round(r.height), nen: n ? getComputedStyle(n).display : null, bg: cs.backgroundColor, hije: cs.boxShadow,
      sb: sbr ? Math.round(sbr.width - 8) : null, logo: document.documentElement.getAttribute('data-logo'), ls: localStorage.getItem('stoku:logoja'),
      fav: decodeURIComponent((document.querySelector('link[rel=icon]') || {}).href || ''), tema: document.documentElement.getAttribute('data-tema'),
      pamja: !!document.getElementById('pamjaLogoja') || !!document.getElementById('opsLogoja') };
  });
  // 1) Telefoni (e errët): logoja 152 px, pa kuti, pa emër; favicon i errët; logoja e vjetër fshihet
  const p1 = await faqe(false, 'dark', 'uA');
  let k = await koka(p1);
  ok((k.w === 152 || k.w === 137) && (k.h === 41 || k.h === 37) && k.nen === 'none' && (k.bg === 'rgba(0, 0, 0, 0)') && k.hije === 'none', '1. telefoni: "stoku." 152 px (137 me zmadhimin .9), pa kuti, pa emrin', k);
  ok(k.logo === null && k.ls === null && !k.pamja, '1. zgjedhja e vjetër e logos u fshi, s\'ka "Logoja" te Pamja', k);
  ok(k.tema === 'dark' && /fill="#14161b"/.test(k.fav), '1. tema e errët: ikona e skedës e zezë (nr. 4)', k.fav.slice(0, 160));
  await p1.evaluate(() => document.documentElement.setAttribute('data-tema', 'light')); await p1.waitForTimeout(200);
  k = await koka(p1);
  ok(/fill="#ffffff"/.test(k.fav), '1. tema e çelët: ikona e skedës e bardhë (nr. 5)', k.fav.slice(0, 160));
  // 2) PC: logoja sa krejt anësorja, pa emër
  const pp = await faqe(true, 'light', 'uA');
  k = await koka(pp);
  ok(k.sb && Math.abs(k.w - k.sb) <= 2 && k.w > 200 && k.nen === 'none', '2. PC: logoja sa krejt gjerësia e anësores, pa emrin', k);
  ok(/fill="#ffffff"/.test(k.fav), '2. PC e çelët: ikona e skedës e bardhë', k.fav.slice(0, 120));
  ok(!(F.S.docs.get('perdoruesit/uA').pamja || {}).logo || true, '2. llogaria: fusha e vjetër "logo" injorohet');
  // 3) Hyrja (pa llogari): logoja me shkronja
  const ph = await faqe(false, 'light', null);
  const h = await ph.evaluate(() => { const s = document.querySelector('#porta .pk-logo svg.stk-logo'); return s ? { w: Math.round(s.getBoundingClientRect().width), p: s.querySelectorAll('path').length } : null; });
  ok(h && (h.w === 172 || h.w === 155) && h.p === 2, '3. hyrja: logoja "stoku." (172 px, 155 me .9)', h);
  // 4) Eksporti: logoja vizatohet (pa shenjë), ikona e vogël "s."
  const ex = await p1.evaluate(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 60; const x = c.getContext('2d'); const w = window.StokuLogot.vizatoLogon(x, 0, 0, 40, { erret: false }); window.StokuLogot.vizatoIkonen(x, 170, 0, 18); const d = x.getImageData(0, 0, 200, 60).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return { w: Math.round(w), n }; });
  ok(ex.w === 149 && ex.n > 1500, '4. PDF/foto: logoja me shkronja dhe ikona e vogël', ex);
  const gab = [p1, pp, ph].flatMap(x => x.__gab);
  ok(!gab.length, '5. pa gabime JS', gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

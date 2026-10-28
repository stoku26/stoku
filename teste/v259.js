// v259: logoja e re e Stoku-t (paketa Stoku_brand_assets): ikonat e web-it (favicon, apple-touch, manifesti, badge),
// logoja e hyrjes (porta), logoja e vogël lart (.stk-etiketa, në vend të "STOKU" + barkodit), e çelëta/e errëta sipas temës,
// 404 dhe privatësia; versionet e reja (?v=4, badge ?v=2) dhe SHELL i sw.js pa skedarë që mungojnë.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA_TEL = 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140';
// Cloud-i i rremë pa përdorues: del porta
const PA_HYRJE = () => { window.__stokuCloud = { authGati: true, perdoruesiAktual: () => null, token: async () => 't', merr: async () => ({ ok: true, gjendja: null }),
  bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {}, hyr: async () => ({ ok: false }), regjistrohu: async () => ({ ok: false }) }; };

// gjerësia/lartësia e një PNG-je nga bajtet e para
const masaPng = async (p, url) => p.evaluate(async u => { const r = await fetch(u); if (!r.ok) return [r.status]; const b = new DataView(await r.arrayBuffer()); return [r.status, b.getUint32(16), b.getUint32(20)]; }, url);
const eDukshme = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const st = getComputedStyle(e); const r = e.getBoundingClientRect();
  return { duket: st.display !== 'none' && r.width > 0, ngarkuar: e.complete && e.naturalWidth > 0, src: e.getAttribute('src'), w: Math.round(r.width), h: Math.round(r.height), x: r.left + r.width / 2 }; }, sel);

(async () => {
  const b = await chromium.launch();
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: Date.now() });
  const gabimet = [];

  // 1. Ikonat e web-it dhe manifesti
  {
    const ctx = await b.newContext({ userAgent: UA_TEL, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await ctx.addInitScript(PA_HYRJE);
    const p = await ctx.newPage(); p.on('pageerror', e => gabimet.push(e.message));
    await p.goto(BAZA + '/index.html'); await p.waitForTimeout(1500);
    const lidhjet = await p.evaluate(() => [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')].map(l => l.getAttribute('href')));
    ok(lidhjet.includes('logo/favicon.svg?v=4') && lidhjet.includes('logo/favicon-32.png?v=4') && lidhjet.includes('apple-touch-icon.png?v=4') && lidhjet.includes('manifest.webmanifest?v=88'),
      '1. index.html: ikonat ?v=4 dhe manifesti ?v=88', lidhjet);
    const fav = await p.evaluate(() => fetch('logo/favicon.svg?v=4').then(r => r.text()));
    ok(/#2563FF/i.test(fav) && /#00D4FF/i.test(fav), '1. favicon.svg: shenja e re (blu + cian)');
    ok(JSON.stringify(await masaPng(p, 'logo/favicon-32.png?v=4')) === '[200,32,32]', '1. favicon-32.png 32 x 32');
    ok(JSON.stringify(await masaPng(p, 'apple-touch-icon.png?v=4')) === '[200,180,180]', '1. apple-touch-icon.png 180 x 180');
    ok(JSON.stringify(await masaPng(p, 'logo/badge-96.png?v=2')) === '[200,96,96]', '1. badge-96.png 96 x 96');
    const m = await p.evaluate(() => fetch('manifest.webmanifest?v=88').then(r => r.json()));
    const ik = m.icons.map(i => i.src + ' ' + i.sizes + ' ' + i.purpose);
    ok(ik.join('|') === 'icon-192.png?v=4 192x192 any|icon-512.png?v=4 512x512 any|logo/icon-maskable-512.png?v=4 512x512 maskable', '1. manifesti: ikonat e reja', ik);
    for (const i of m.icons) { const [s, w, h] = await masaPng(p, i.src); ok(s === 200 && i.sizes === w + 'x' + h, '1. ' + i.src + ' ka masën ' + i.sizes, [s, w, h]); }
    // ikonat e njoftimeve
    const nj = await p.evaluate(() => Promise.all(['njoftimet.js?v=259', 'app-tel.js?v=259', 'app-pc.js?v=259', 'sw.js'].map(u => fetch(u).then(r => r.text()))));
    ok(nj.every(t => /icon-192\.png\?v=4/.test(t) && /badge-96\.png\?v=2/.test(t) && !/icon-192\.png\?v=3|badge-96\.png\?v=1/.test(t)), '1. njoftimet: icon-192 ?v=4 dhe badge ?v=2');

    // 2. sw.js: CACHE, SHELL me logot e reja; asnjë skedar i SHELL-it s'mungon
    const sw = nj[3];
    ok(Number((sw.match(/stoku-v(\d+)/) || [])[1]) >= 259, '2. CACHE ≥ 259');
    const shell = (sw.match(/'\.\/[^']+'/g) || []).map(x => x.slice(1, -1)).filter(x => x !== './');
    ok(shell.includes('./logo/stoku-logo-small.svg?v=4') && shell.includes('./logo/stoku-logo-small-dark.svg?v=4') && shell.includes('./logo/stoku-logo.svg?v=4'), '2. SHELL: logot e reja');
    ok(!shell.some(x => /(logo|icon|favicon)[^?]*\?v=3$/.test(x)), '2. SHELL: pa ikonat e vjetra ?v=3', shell.filter(x => /\?v=3$/.test(x)));
    const mungojne = await p.evaluate(async l => { const m = []; for (const u of l) { if (/\.html$|^\.\/$/.test(u)) continue; const r = await fetch(u); if (!r.ok) m.push(u + ' ' + r.status); } return m; }, shell);
    ok(!mungojne.length, '2. krejt skedarët e SHELL-it ekzistojnë', mungojne);

    // 3. Porta (hyrja): logoja e re, e çelët
    const pk = await eDukshme(p, '#porta .pk-logo-cel');
    ok(pk && pk.duket && pk.ngarkuar && pk.src === 'logo/stoku-logo.svg?v=4', '3. hyrja (e çelët): logoja e re duket', pk);
    ok(pk && Math.abs(pk.w / pk.h - 142 / 52) < 0.08, '3. ... me përmasat 142 x 52 (pa hapësirën bosh djathtas)', pk && [pk.w, pk.h]);
    const pkE = await eDukshme(p, '#porta .pk-logo-err');
    ok(pkE && !pkE.duket, '3. ... e errëta e fshehur');
    await p.screenshot({ path: __dirname + '/v259-hyrja-e-celet.png' });
    await ctx.close();
  }
  // 3b. Porta në temën e errët
  {
    const ctx = await b.newContext({ userAgent: UA_TEL, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', colorScheme: 'dark' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await ctx.addInitScript(PA_HYRJE);
    const p = await ctx.newPage(); p.on('pageerror', e => gabimet.push(e.message));
    await p.goto(BAZA + '/index.html'); await p.waitForTimeout(1500);
    const tema = await p.evaluate(() => document.documentElement.getAttribute('data-tema'));
    const pkE = await eDukshme(p, '#porta .pk-logo-err'), pkC = await eDukshme(p, '#porta .pk-logo-cel');
    ok(tema === 'dark' && pkE && pkE.duket && pkE.ngarkuar && pkE.src === 'logo/stoku-logo-dark.svg?v=4' && pkC && !pkC.duket, '3b. hyrja (e errët): logoja e errët', { tema, pkE });
    await p.screenshot({ path: __dirname + '/v259-hyrja-e-erret.png' });
    await ctx.close();
  }

  // 4. Pas hyrjes: logoja e vogël lart, telefon dhe PC, e çelët dhe e errët
  for (const pc of [false, true]) for (const tema of ['light', 'dark']) {
    const em = (pc ? 'PC' : 'tel') + ' ' + tema;
    const ctx = await b.newContext(pc ? { userAgent: UA_PC, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', colorScheme: tema }
      : { userAgent: UA_TEL, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', colorScheme: tema });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await F.lidh(ctx, 'uA', 'mendurberisha@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'uA', emri: 'mendurberisha' })); localStorage.setItem('stoku:pronari-uid', 'uA'); } catch (e) {} });
    const p = await ctx.newPage(); p.on('pageerror', e => gabimet.push(em + ': ' + e.message));
    await p.goto(BAZA + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(2800);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));
    const kjo = tema === 'dark' ? '--err' : '--cel', tjetra = tema === 'dark' ? '--cel' : '--err';
    const l = await eDukshme(p, '#logoButon .stk-etiketa__logo' + kjo), t = await eDukshme(p, '#logoButon .stk-etiketa__logo' + tjetra);
    const et = await p.evaluate(() => { const e = document.getElementById('logoButon'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, w: Math.round(r.width), h: Math.round(r.height), vjeter: !!e.querySelector('.stk-etiketa__emri, .stk-etiketa__barkodi'), nen: (e.querySelector('.stk-etiketa__nen') || {}).textContent }; });
    ok(l && l.duket && l.ngarkuar && t && !t.duket, em + ': lart del logoja e vogël ' + (tema === 'dark' ? 'e errët' : 'e çelët'), { l, t });
    ok(l && l.h === 36 && Math.abs(l.x - et.x) < 1.5, em + ': 36 px e lartë, në mes të etiketës', l && { h: l.h, dx: l.x - et.x });
    ok(!et.vjeter && et.w === 152 && et.nen, em + ': pa "STOKU" + barkodin e vjetër; etiketa 152 px me rreshtin poshtë', et);
    await p.screenshot({ path: __dirname + '/v259-lart-' + (pc ? 'pc' : 'tel') + '-' + tema + '.png' });
    await ctx.close();
  }

  // 5. 404 dhe privatësia
  for (const faqja of ['/privatesia.html', '/nuk-ekziston-v259']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    const p = await ctx.newPage();
    await p.goto(BAZA + faqja); await p.waitForTimeout(800);
    const img = await p.evaluate(() => { const e = document.querySelector('img.logo-e-celet'); return e && { src: e.getAttribute('src'), ngarkuar: e.complete && e.naturalWidth > 0, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }; });
    const ikona = await p.evaluate(() => (document.querySelector('link[rel="icon"]') || {}).href || '');
    ok(img && img.ngarkuar && /stoku-logo\.svg\?v=4$/.test(img.src) && Math.abs(img.w / img.h - 142 / 52) < 0.08 && /favicon\.svg\?v=4$/.test(ikona), '5. ' + faqja + ': logoja dhe ikona e re', { img, ikona });
    await ctx.close();
  }

  // 6. "Çka ka të re" v259 për të dy (telefon dhe PC)
  {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const p = await ctx.newPage();
    await p.goto(BAZA + '/teRejat.js?v=259');
    const t = await p.evaluate(() => fetch('/teRejat.js?v=259').then(r => r.text()));
    const h = (t.match(/\{ v: 259,[^\n]*/) || [''])[0];
    ok(h && !/platforma|vetemAdmini/.test(h) && /Logoja e re/.test(h), '6. teRejat v259 "Logoja e re e Stoku-t" për krejt', h.slice(0, 120));
    await ctx.close();
  }

  ok(!gabimet.length, '7. pa gabime JS', gabimet);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

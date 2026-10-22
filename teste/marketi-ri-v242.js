// v242: merchandiseri i ri: "Shto marketin ku punon" (çipi te Afatet dhe kryefaqja), pyetja "Në cilin market je?" herën e
// parë që hap Afatet (emri + vendndodhja me GPS), "+ Market i ri" te "Ku je?", pa vendndodhje, llogaria jo-merchandiser
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
const ALBI = { latitude: 42.6476, longitude: 21.1491, accuracy: 20 };
(async () => {
  const F = krijoFirestore();
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'meri', kycurSe: t, krijuarSe: t, merchandiser: true });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'agim', kycurSe: t });
  const sot = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const AF0 = [{ id: 'x1', barkodi: '1', emri: 'Kos', data: sot(3), sasia: 4, statusi: 'aktiv', ndryshuarSe: t - 5000 }];
  const b = await chromium.launch();
  async function faqe(uid, emri) {
    const ctx = await b.newContext({ userAgent: UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: true, geolocation: ALBI, permissions: ['geolocation'] });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' }));
    await F.lidh(ctx, uid, emri + '@stoku-app.local', 'tel', { afatet: AF0 });
    await ctx.addInitScript(() => {
      window.__gpsThirrje = 0;
      const g0 = navigator.geolocation && navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      if (g0) navigator.geolocation.getCurrentPosition = function () { window.__gpsThirrje++; return g0.apply(null, arguments); };
    });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/index.html'); await p.waitForTimeout(2500);
    return { p, ctx };
  }
  const duket = (p, s) => p.evaluate(x => { const e = document.querySelector(x); if (!e) return false; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0 && r.height > 0; }, s);
  const hapur = (p, id) => p.evaluate(x => document.getElementById(x).classList.contains('hapur'), id);
  const toast = p => p.evaluate(() => document.getElementById('toast').textContent);
  const lsMarketet = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:marketet:v1') || '[]'));
  const lsAfatet = p => p.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]'));

  // 1. Merchandiseri i ri, pa markete
  const { p: m } = await faqe('u1', 'meri');
  ok(await prit(async () => await duket(m, '.sb-home-krye .mk-chip')), '1. kryefaqja: çipi i marketit');
  ok(/Shto marketin ku punon/.test(await m.textContent('.sb-home-krye .mk-chip')) && await m.evaluate(() => window.__gpsThirrje) >= 1, '1. "Shto marketin ku punon"; v246: vendndodhja kërkohet vetë', await m.textContent('.sb-home-krye .mk-chip'));
  await m.evaluate(() => document.getElementById('btnAfatet').click());
  ok(await prit(() => hapur(m, 'dlgMarketiRi'), 4000), '1. hapja e parë e Afateve: "Në cilin market je?" del vetë');
  ok((await m.textContent('#mkrTitulli')) === 'Në cilin market je?' && await m.isChecked('#mkrVendi'), '1. titulli + "Jam brenda këtij marketi tani" i zgjedhur');
  const siper = id => m.evaluate(x => { const q = document.getElementById(x).getBoundingClientRect(); const e = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2); return !!e && (e.id === x || document.getElementById(x).contains(e)) ? true : (e ? (e.id || e.className) + ' @' + Math.round(q.x) + ',' + Math.round(q.y) : 'asgjë'); }, id);
  await m.waitForTimeout(400);
  ok((await siper('mkrRuaj')) === true, '1. dritarja është mbi faqen e Afateve (preket)', await siper('mkrRuaj'));
  await m.screenshot({ path: __dirname + '/v242-marketi-ri.png' });
  await m.click('#mkrRuaj'); await m.waitForTimeout(200);
  ok(/Shkruaj emrin/.test(await m.textContent('#mkrGabim')) && await hapur(m, 'dlgMarketiRi'), '1. pa emër: s\'ruhet');
  await m.fill('#mkrEmri', 'Albi Mall'); await m.click('#mkrRuaj');
  ok(await prit(async () => !(await hapur(m, 'dlgMarketiRi'))), '1. u ruajt, dritarja mbyllet');
  ok(await prit(async () => { const l = await lsMarketet(m); return l.length === 1 && l[0].lat; }), '1. marketi me vendndodhjen (GPS)', await lsMarketet(m));
  const mk = (await lsMarketet(m))[0];
  ok(mk.emri === 'Albi Mall' && Math.abs(mk.lat - ALBI.latitude) < 1e-6 && (await lsAfatet(m)).every(a => a.m === mk.id), '1. emri, koordinatat; afatet e deritashme te ky market');
  ok(/u shtua me vendndodhjen/.test(await toast(m)) && (await m.textContent('#afMarketiEmri')) === 'Albi Mall', '1. "u shtua me vendndodhjen" + "Je te Albi Mall"', await toast(m));
  // nuk pyet më
  await m.evaluate(() => document.getElementById('afPrapa').click()); await m.waitForTimeout(400);
  await m.evaluate(() => document.getElementById('btnAfatet').click()); await m.waitForTimeout(1200);
  ok(!(await hapur(m, 'dlgMarketiRi')), '1. s\'pyet sërish');
  // "Ku je?" → "+ Market i ri", pa vendndodhje
  await m.click('#afMarketi'); await m.waitForTimeout(300);
  await m.evaluate(() => { document.getElementById('toast').style.visibility = 'hidden'; }); // njoftimi i fundit mbulon mesin
  ok(await duket(m, '#mkdIRi') && (await siper('mkdAnulo')) === true && (await siper('mkdLista')) === true, '2. "Ku je?" mbi Afatet, me "+ Market i ri"', [await siper('mkdAnulo'), await siper('mkdLista')]);
  await m.evaluate(() => { document.getElementById('toast').style.visibility = ''; });
  await m.click('#mkdIRi'); await m.waitForTimeout(300);
  ok(await hapur(m, 'dlgMarketiRi') && !(await hapur(m, 'dlgMarketi')) && (await m.textContent('#mkrTitulli')) === 'Market i ri', '2. dritarja "Market i ri"');
  await m.fill('#mkrEmri', 'albi mall'); await m.click('#mkrRuaj'); await m.waitForTimeout(200);
  ok(/me këtë emër/.test(await m.textContent('#mkrGabim')), '2. emri i përsëritur refuzohet');
  const gps0 = await m.evaluate(() => window.__gpsThirrje);
  await m.fill('#mkrEmri', 'Viva Fresh'); await m.click('label[for=mkrVendi]'); await m.click('#mkrRuaj');
  ok(await prit(async () => (await lsMarketet(m)).length === 2), '2. "Viva Fresh" u shtua');
  const viva = (await lsMarketet(m)).find(x => x.emri === 'Viva Fresh');
  ok(viva && !('lat' in viva) && await m.evaluate(() => window.__gpsThirrje) === gps0 && /ruaje vendndodhjen te Cilësimet/.test(await toast(m)), '2. pa vendndodhje (s\'pyet GPS-in)', await toast(m));
  ok((await m.textContent('#afMarketiEmri')) === 'Viva Fresh', '2. aktiv: Viva Fresh');
  ok(!m.__gab.length, '2. pa gabime JS', m.__gab);

  // 3. Llogari e zakonshme (jo merchandiser): asgjë
  const { p: a } = await faqe('u2', 'agim');
  await a.evaluate(() => document.getElementById('btnAfatet').click()); await a.waitForTimeout(1200);
  ok(!(await duket(a, '#afMarketi')) && !(await a.$('.sb-home-krye .mk-chip')) && !(await hapur(a, 'dlgMarketiRi')) && await a.evaluate(() => window.__gpsThirrje) === 0, '3. agim: pa çip, pa pyetje, pa GPS');
  ok(!a.__gab.length, '3. pa gabime JS', a.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

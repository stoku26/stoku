// v195: njoftimet personale të grupit i lajmërohen Worker-it (/njoftim) që t'i dërgojë si push
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const SC = __dirname + '/';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now(), dje = new Date(t - 2 * 864e5).toISOString().slice(0, 10);
  const af = [['a1', 'Kos Vita'], ['a2', 'Bukë'], ['a3', 'Djathë']].map(([id, emri]) => ({ id, emri, barkodi: id, data: dje, statusi: 'aktiv', ndryshuarSe: t - 6e5 }));
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'besa', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u1', pronarEmri: 'agim' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: t });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [], produktet: [], afatet: af, fshira: {} });
  F.S.docs.set('grupet/g1/afatet/u1', { uid: 'u1', emri: 'agim', afatet: af, ndryshuarSe: t - 6e5 });
  const b = await chromium.launch(); const thirrjet = [];
  async function faqe(uid, emri, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, emri + '@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.route(u => /workers\.dev/.test(u.href), async r => {
      const q = r.request(), u = new URL(q.url());
      if (q.method() === 'POST') thirrjet.push({ nga: emri, rruga: u.pathname, trup: JSON.parse(q.postData() || '{}') });
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(q.method() === 'GET' ? { ok: true, sherbimi: 'stoku-push', versioni: 161, celesat: true } : { ok: true }) });
    });
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); } catch (e) {} });
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('[' + emri + '] pageerror:', e.message); });
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) { g++; console.log('[' + emri + '] console:', m.text()); } });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html#/ekipa' : 'index.html'));
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (d.id !== 'dlgEkipi') d.classList.remove('hapur'); }));
    return p;
  }
  const doc = k => F.S.docs.get(k);
  const keys = pre => [...F.S.docs.keys()].filter(k => k.startsWith(pre));
  // afatet e agimit: dokumenti kryesor + pjesët (dyqane/u1/pjeset/pN)
  const statusi = id => [doc('dyqane/u1') || {}].concat(keys('dyqane/u1/pjeset/').map(k => doc(k))).flatMap(d => d.afatet || [])
    .filter(a => a.id === id).map(a => a.statusi + (a.hequrNga ? ':' + a.hequrNga : '')).pop();
  const njAgim = () => keys('perdoruesit/u1/njoftimet/').map(k => doc(k));
  const njBesa = () => keys('perdoruesit/u2/njoftimet/').map(k => doc(k));

  const besa = await faqe('u2', 'besa', false);
  await besa.click('#btnEkipi'); await besa.waitForTimeout(1500);
  await besa.click('.ek-kart:has-text("Kos Vita") .ek-kart-hiq'); await besa.waitForTimeout(300);
  await besa.click('#konfPo'); await besa.waitForTimeout(2000);
  const n1 = keys('perdoruesit/u1/njoftimet/').map(k => k.split('/').pop());
  const t1 = thirrjet.filter(x => x.rruga === '/njoftim');
  ok(t1.length === 1 && t1[0].nga === 'besa' && t1[0].trup.per === 'u1' && t1[0].trup.grupi === 'g1' && n1.includes(t1[0].trup.id), '1. besa e heq produktin e agimit → /njoftim { id, per: agimi, grupi }', { t1, n1 });

  const agim = await faqe('u1', 'agim', false);
  await agim.waitForTimeout(2000);
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1200);
  await agim.click('#ekZile'); await agim.waitForTimeout(1200);
  thirrjet.length = 0;
  await agim.click('#ekNjLista button:has-text("Prano")'); await agim.waitForTimeout(2500);
  const n2 = keys('perdoruesit/u2/njoftimet/').filter(k => doc(k).lloji === 'heqje-pranuar').map(k => k.split('/').pop());
  const t2 = thirrjet.filter(x => x.rruga === '/njoftim');
  ok(t2.length === 1 && t2[0].nga === 'agim' && t2[0].trup.per === 'u2' && n2.includes(t2[0].trup.id), '2. agimi pranon → /njoftim te besa', { t2, n2 });
  ok(!thirrjet.some(x => x.rruga === '/kerkese'), '2. pa /kerkese për këto njoftime', thirrjet.map(x => x.rruga));

  // 3. Kërkesa "Hiqe nga rafti" te agimi: vetëm /kerkese (jo edhe /njoftim, që të mos vijë dy herë)
  thirrjet.length = 0;
  const lsV = await agim.evaluate(async () => { await window.__stokuCloud.ekipa.kontrolloServerin(); return localStorage.getItem('stoku:push:versioni'); });
  ok(lsV === '161', '3. aplikacioni e mban mend versionin e Worker-it (161)', lsV);
  const ngaPush = await agim.evaluate(() => { const e = window.__stokuCloud && window.__stokuCloud.ekipa; return !!(e && e.pushPerNjoftimet); });
  ok(ngaPush, '3. pushPerNjoftimet ekziston');
  console.log('gabime', g); await b.close(); process.exit(g ? 1 : 0);
})();

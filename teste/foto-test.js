const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const SC = __dirname + '/';
let gabime = 0;
const ok = (k, m, x) => { if (!k) gabime++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + (typeof x === 'string' ? x : JSON.stringify(x)) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const KV = new Map(); let kvAktiv = true; const thirrjet = [];
async function worker(route) {
  const q = route.request(), u = new URL(q.url()), h = { 'Access-Control-Allow-Origin': '*' };
  thirrjet.push(q.method() + ' ' + u.pathname);
  if (q.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...h, 'Access-Control-Allow-Methods': 'GET,PUT,DELETE,POST', 'Access-Control-Allow-Headers': 'Authorization,Content-Type' } });
  const json = (o, s) => route.fulfill({ status: s || 200, headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
  if (u.pathname === '/') return json({ ok: true, celesat: true, fotot: kvAktiv });
  if (!kvAktiv) return json({ ok: false, arsye: 'mungon-kv' }, 500);
  if (q.method() === 'GET' && u.pathname.startsWith('/foto/')) {
    const f = KV.get(decodeURIComponent(u.pathname.slice(6)));
    return f ? route.fulfill({ status: 200, headers: { ...h, 'Content-Type': 'image/jpeg' }, body: f.b }) : route.fulfill({ status: 404, headers: h, body: '' });
  }
  const tok = (q.headers()['authorization'] || '').replace('Bearer ', '');
  let uid; try { uid = JSON.parse(Buffer.from(tok.split('.')[1], 'base64').toString()).user_id; } catch (e) { return json({ ok: false, arsye: 'pa-hyrje' }, 401); }
  if (u.pathname === '/fotot') { const o = {}; KV.forEach((v, k) => o[k] = v.koha); return json({ ok: true, fotot: o }); }
  if (u.pathname === '/foto' && q.method() === 'PUT') {
    const b = q.postDataBuffer(); if (!(b[0] === 0xFF && b[1] === 0xD8)) return json({ ok: false, arsye: 'jo-foto' }, 415);
    const koha = Date.now(); KV.set(uid, { b, koha }); return json({ ok: true, koha });
  }
  if (u.pathname === '/foto' && q.method() === 'DELETE') { KV.delete(uid); return json({ ok: true }); }
  return json({ ok: false }, 404);
}
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const tani = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: tani, ekipaMigruarSe: tani });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: tani });
  F.S.docs.set('ekipa_anetaret/uA', { emri: 'mendurberisha' }); F.S.docs.set('ekipa_anetaret/u1', { emri: 'agim' });
  F.S.docs.set('ekipa_chat/m1', { uid: 'u1', emri: 'agim', tekst: 'Tung', koha: tani - 1000 });
  const b = await chromium.launch();
  async function faqe(uid, email, pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1500, height: 950 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, uid, email, pc ? 'pc' : 'tel');
    await ctx.route(u => u.href.startsWith(PUSH), worker);
    const p = await ctx.newPage();
    p.on('pageerror', e => { gabime++; console.log('[' + uid + '] pageerror:', e.message); });
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) { gabime++; console.log('[' + uid + '] console:', m.text()); } });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html'));
    await p.waitForTimeout(1800);
    return p;
  }
  const agim = await faqe('u1', 'agim@stoku-app.local', false);
  ok(thirrjet.includes('GET /fotot'), '0. indeksi merret pas hyrjes', thirrjet);
  // 1. Agimi vendos foto në telefon
  await agim.click('#btnOpsione'); await agim.waitForTimeout(400);
  ok(await agim.$eval('#opsProfilAv', e => !e.classList.contains('me-foto') && e.textContent === 'A'), '1. pa foto: shkronja');
  await agim.click('#opsProfil'); await agim.waitForTimeout(300);
  ok(await agim.$eval('#opsFotoNdrysho', e => e.textContent) === 'Shto foto' && await agim.$eval('#opsFotoHiq', e => getComputedStyle(e).display === 'none'), '1. butoni "Shto foto", pa "Hiq"');
  await agim.screenshot({ path: SC + 'foto-tel-pa.png' });
  await agim.setInputFiles('#opsFotoSkedari', SC + 'foto-prove.png'); await agim.waitForTimeout(1200);
  const f1 = KV.get('u1');
  ok(f1 && f1.b.length < 150 * 1024, '1. u ngarkua JPEG < 150KB', f1 && f1.b.length);
  const dim = await agim.evaluate(async (u) => { const i = new Image(); i.src = u; await i.decode(); return i.naturalWidth + 'x' + i.naturalHeight; }, PUSH + '/foto/u1?v=1');
  ok(dim === '256x256', '1. fotoja 256×256', dim);
  ok(await agim.$eval('#opsLlAv', e => e.classList.contains('me-foto') && /foto\/u1\?v=/.test(e.style.backgroundImage)), '1. avatari te Llogaria me foto');
  ok(await agim.$eval('#opsFotoNdrysho', e => e.textContent) === 'Ndrysho foton' && await agim.$eval('#opsFotoHiq', e => getComputedStyle(e).display !== 'none'), '1. "Ndrysho foton" + "Hiq foton"');
  await agim.screenshot({ path: SC + 'foto-tel-me.png' });
  await agim.click('#opsPrapa'); await agim.waitForTimeout(300);
  ok(await agim.$eval('#opsProfilAv', e => e.classList.contains('me-foto')), '1. karta e profilit me foto');
  await agim.screenshot({ path: SC + 'foto-tel-menu.png' });
  // 2. Admini në PC e sheh foton e agimit
  const admin = await faqe('uA', 'mendurberisha@stoku-app.local', true);
  await admin.goto('http://127.0.0.1:8765/pc.html#/ekipa'); await admin.waitForTimeout(2000);
  await admin.click('#ekMenu button[data-n="anetaret"]').catch(() => {}); await admin.waitForTimeout(800);
  const avA = await admin.$$eval('.ek-avatar', l => l.map(e => e.getAttribute('data-foto-emri') + ':' + e.classList.contains('me-foto')));
  ok(avA.some(x => x === 'agim:true') && !avA.some(x => x === 'agim:false'), '2. PC: avatarët e agimit me foto', avA);
  ok(avA.some(x => x === 'mendurberisha:false'), '2. PC: admini pa foto (shkronja)');
  await admin.screenshot({ path: SC + 'foto-pc-ekipa.png' });
  // 3. Admini vendos foto te PC
  await admin.click('#btnOpsione'); await admin.waitForTimeout(400);
  await admin.click('#opsSkeda [data-faqe="llogaria"]'); await admin.waitForTimeout(300);
  await admin.setInputFiles('#opsFotoSkedari', SC + 'foto-prove.png'); await admin.waitForTimeout(1200);
  ok(KV.has('uA'), '3. PC: u ngarkua');
  ok(await admin.evaluate(() => ['sbpAvatar', 'opsLlAv', 'opsNavAv'].every(i => document.getElementById(i).classList.contains('me-foto'))), '3. PC: 3 avatarët e vetes me foto');
  await admin.screenshot({ path: SC + 'foto-pc-llogaria.png' });
  // 4. Agimi e merr foton e adminit (rifreskim) te Ekipa e telefonit
  await agim.evaluate(() => window.__stokuCloud.ekipa.rifreskoFotot(true)); await agim.waitForTimeout(300);
  await agim.reload(); await agim.waitForTimeout(1500);
  await agim.click('#btnEkipi'); await agim.waitForTimeout(1500);
  await agim.click('#ekMenu button[data-n="anetaret"]').catch(() => {}); await agim.waitForTimeout(800);
  const avT = await agim.$$eval('[data-foto-emri]', l => l.filter(e => e.offsetParent).map(e => e.getAttribute('data-foto-emri') + ':' + e.classList.contains('me-foto')));
  console.log('      telefoni, avatarët e dukshëm:', JSON.stringify(avT));
  ok(avT.length && avT.every(x => x.endsWith(':true')), '4. telefoni: krejt avatarët e dukshëm me foto');
  await agim.screenshot({ path: SC + 'foto-tel-ekipa.png' });
  // 5. Heqja
  await agim.click('#btnOpsione').catch(() => {}); await agim.waitForTimeout(400);
  await agim.click('#opsProfil'); await agim.waitForTimeout(300);
  await agim.click('#opsFotoHiq'); await agim.waitForTimeout(300);
  await agim.click('#konfPo'); await agim.waitForTimeout(1000);
  ok(!KV.has('u1'), '5. fotoja u fshi në server');
  ok(await agim.$eval('#opsLlAv', e => !e.classList.contains('me-foto') && e.textContent === 'A'), '5. kthehet shkronja');
  // 6. Skedar jo-foto
  require('fs').writeFileSync(SC + 'jo-foto.png', 'abc');
  await agim.setInputFiles('#opsFotoSkedari', SC + 'jo-foto.png'); await agim.waitForTimeout(800);
  ok(/nuk është foto/.test(await agim.$eval('#opsFotoHint', e => e.textContent)), '6. mesazh për skedar jo-foto', await agim.$eval('#opsFotoHint', e => e.textContent));
  // 7. Serveri pa KV
  kvAktiv = false;
  await agim.setInputFiles('#opsFotoSkedari', SC + 'foto-prove.png'); await agim.waitForTimeout(1000);
  ok(/aktivizuar/.test(await agim.$eval('#opsFotoHint', e => e.textContent)), '7. mesazh kur serveri s\'ka KV', await agim.$eval('#opsFotoHint', e => e.textContent));
  // 8. Pas rifreskimit të faqes (indeksi lokal) fotoja e adminit del menjëherë
  kvAktiv = true;
  await admin.reload(); await admin.waitForTimeout(300);
  ok(await admin.$eval('#sbpAvatar', e => e.classList.contains('me-foto')), '8. PC: pas rifreskimit fotoja del nga indeksi lokal');
  console.log(gabime ? '\n' + gabime + ' GABIME' : '\nKREJT OK');
  await b.close();
})();

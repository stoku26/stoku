const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t }); F.S.docs.set('ekipa_anetaret/u1', { emri: 'agim' });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Bulmet' }], produktet: [],
    afatet: [{ id: 'a1', barkodi: '444', emri: 'Djathë', data: d(0), sasia: 2, statusi: 'aktiv', ndryshuarSe: t }, { id: 'a2', barkodi: '5', emri: 'Kos', data: d(0), statusi: 'aktiv', ndryshuarSe: t }], fshira: {} });
  const b = await chromium.launch();
  const thirrje = []; let lidhur = false, hequrat = [];
  async function worker(r) {
    const q = r.request(), u = new URL(q.url()), h = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: h });
    const j = (o, s) => r.fulfill({ status: s || 200, contentType: 'application/json', headers: h, body: JSON.stringify(o) });
    const trup = q.postData() ? JSON.parse(q.postData()) : {};
    thirrje.push(u.pathname + ' ' + JSON.stringify(trup).slice(0, 80));
    if (u.pathname === '/ora/lidh') { if (trup.kodi !== '482913') return j({ ok: false, arsye: 'kodi' }, 404); lidhur = true; return j({ ok: true }); }
    if (u.pathname === '/ora/hequrat') { if (trup.pastro) { hequrat = hequrat.filter(x => !trup.pastro.includes(x.i)); } return j({ ok: true, hequrat }); }
    if (u.pathname === '/orari' && trup.afatet) return j(trup.vetemMeOrar && !lidhur ? { ok: true, paOrar: true } : { ok: true });
    if (q.method() === 'GET') return j({ ok: true, fotot: {} });
    return j({ ok: true });
  }
  async function faqe(pc) {
    const ctx = await b.newContext(pc ? { viewport: { width: 1400, height: 900 }, serviceWorkers: 'block', timezoneId: 'Europe/Belgrade' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', timezoneId: 'Europe/Belgrade' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', pc ? 'pc' : 'tel');
    await ctx.route(u => u.href.startsWith(PUSH), worker);
    const p = await ctx.newPage();
    p.on('pageerror', e => { g++; console.log('pageerror:', e.message); });
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::ERR/.test(m.text())) { g++; console.log('console:', m.text()); } });
    await p.goto('http://127.0.0.1:8765/' + (pc ? 'pc.html' : 'index.html')); await p.waitForTimeout(3000);
    return p;
  }
  const p = await faqe(false);
  await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabOra'); await p.waitForTimeout(400);
  await p.click('#segOra button[data-v="galaxy"]').catch(() => {}); await p.waitForTimeout(200);
  ok(await p.isVisible('#oraKodi') && await p.isVisible('#oraLidh'), '1. fusha "Lidh sahatin" duket');
  await p.fill('#oraKodi', '12'); await p.click('#oraLidh'); await p.waitForTimeout(300);
  ok(/6 shifra/.test(await p.textContent('#oraLidhHint')), '2. kod i shkurtër → mesazh', await p.textContent('#oraLidhHint'));
  await p.fill('#oraKodi', '111111'); await p.click('#oraLidh'); await p.waitForTimeout(800);
  ok(/s'u gjet/.test(await p.textContent('#oraLidhHint')), '3. kod i gabuar → mesazh', await p.textContent('#oraLidhHint'));
  thirrje.length = 0;
  await p.fill('#oraKodi', '482 913'); await p.press('#oraKodi', 'Enter'); await p.waitForTimeout(1500);
  ok(lidhur && /u lidh/.test(await p.textContent('#oraLidhHint')), '4. lidhja me sukses', await p.textContent('#oraLidhHint'));
  const af = thirrje.find(x => x.startsWith('/orari {"afatet"'));
  ok(!!af && /"i":"a1"/.test(af), '4. afatet (me id) i dërgohen serverit pas lidhjes', thirrje);
  await p.screenshot({ path: 'ora-lidh.png' });
  // heqja nga sahati → zbatohet në telefon
  hequrat = [{ i: 'a1', koha: t }, { i: 'zzz', koha: t }];
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(400);
  // throttle 2 min: thirrja me detyro
  await p.evaluate(() => window.dispatchEvent(new Event('stoku-cloud-gati'))); await p.waitForTimeout(5500);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1')).map(a => a.id + ':' + a.statusi));
  ok(st.includes('a1:hequr') && st.includes('a2:aktiv'), '5. a1 u shënua i hequr nga sahati', st);
  ok(hequrat.length === 1 && hequrat[0].i === 'zzz', '5. pastrohet vetëm ajo që u zbatua (zzz mbetet)', hequrat);
  // PC
  hequrat = [{ i: 'a2', koha: t }];
  const pc = await faqe(true); await pc.waitForTimeout(5000);
  const st2 = await pc.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1')).map(a => a.id + ':' + a.statusi));
  ok(st2.includes('a2:hequr'), '6. PC e zbaton heqjen nga sahati', st2);
  ok(hequrat.length === 0, '6. PC e pastron');
  console.log(g ? g + ' GABIME' : 'KREJT OK'); await b.close();
})();

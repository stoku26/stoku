// v231: lejet edhe jashtë faqes. Pa "Grupi": pajisja s'regjistrohet te grupet/{g}/push (Worker-i s'i dërgon asgjë të
// grupit) dhe s'del asnjë njoftim i grupit; Cilësimet → Njoftimet pa tekstin për Grupin. Pa "Afatet": serveri merr listë
// bosh afatesh (s'vjen njoftimi ditor, ora pa produkte). Kur lejet kthehen: pajisja rregjistrohet, lista e vërtetë dërgohet.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const L = require('../lejet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
const prit = (fn, ms = 8000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return z(true); await new Promise(r => setTimeout(r, 100)); } z(false); });
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  const AF = [{ id: 'a1', barkodi: '1', emri: 'Kos', data: d(0), sasia: 5, statusi: 'aktiv', ndryshuarSe: t },
    { id: 'a2', barkodi: '2', emri: 'Bukë', data: d(20), sasia: 1, statusi: 'aktiv', ndryshuarSe: t }];
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'blerta', kycurSe: t });
  F.S.docs.set('ekipa_anetaret/u1', { emri: 'agim' }); F.S.docs.set('ekipa_anetaret/u2', { emri: 'blerta' });
  F.S.docs.set('lejet/u1', { lejet: Object.assign(L.krejt(true), { grupi: false, afatet: false }), kontrolluarSe: t, emri: 'agim' });
  const b = await chromium.launch();
  const thirrjet = [];
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.grantPermissions(['notifications'], { origin: 'http://127.0.0.1:8765' });
  await ctx.route(u => u.href.startsWith(PUSH), async r => {
    const q = r.request();
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
    if (q.method() === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"celesat":true,"versioni":164}' });
    let trup = null; try { trup = JSON.parse(q.postData() || 'null'); } catch (e) { /* ok */ }
    thirrjet.push({ url: q.url(), trup });
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' });
  });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1') && !u.href.startsWith(PUSH), r => r.abort());
  await ctx.addInitScript(() => {
    window.__njoftimet = [];
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/u1', options: { applicationServerKey: null },
      toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'BPku1', auth: 'auu1' } }; }, unsubscribe: async () => true };
    let abonuar = null;
    const reg = { pushManager: { getSubscription: async () => abonuar, subscribe: async () => { abonuar = sub; return sub; } },
      showNotification: async (t, o) => { window.__njoftimet.push(t + ' | ' + (o && o.body)); }, periodicSync: null };
    Object.defineProperty(ServiceWorkerContainer.prototype, 'ready', { get() { return Promise.resolve(reg); } });
    if (!window.PushManager) window.PushManager = function () {};
    try { Object.defineProperty(Notification, 'permission', { get: () => 'granted', configurable: true }); } catch (e) {}
  });
  await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel', { afatet: AF });
  const p = await ctx.newPage();
  const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(4500);
  const pajisjet = () => [...F.S.docs.keys()].filter(k => k.startsWith('grupet/ekipa/push/u1_'));
  const listat = () => thirrjet.filter(x => /\/orari$/.test(x.url) && x.trup && Array.isArray(x.trup.afatet)).map(x => x.trup.afatet.length);

  // ---- 1. pa Grup, pa Afate ----
  ok(await prit(async () => !pajisjet().length, 6000), '1. pa "Grupi": pajisja s\'mbetet e regjistruar te grupi (s\'merr push të grupit)', pajisjet());
  ok(await prit(async () => listat().includes(0), 6000), '1. pa "Afatet": serveri merr listë bosh afatesh', listat());
  ok(!listat().some(n => n > 0), '1. lista e vërtetë s\'i dërgohet serverit', listat());
  // Njoftim personal i grupit (kërkesë për heqje) → s'del asgjë
  F.S.docs.set('perdoruesit/u1/njoftimet/n1', { uid: 'u2', grupi: 'ekipa', lloji: 'kerkese-heqje', emri: 'blerta', produkti: 'Kos', barkodi: '1', koha: Date.now(), lexuar: false });
  await p.evaluate(() => window.__fs('resync')); await p.waitForTimeout(800);
  const tst = await p.evaluate(() => document.getElementById('toast').textContent);
  ok(!/Kos|blerta|rafti/.test(tst) && !(await p.evaluate(() => window.__njoftimet.length)), '1. njoftimi i grupit s\'del (as në faqe, as në sfond)', tst);
  await p.click('#btnOpsione'); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => !document.getElementById('tabNjoftimet').classList.contains('leja-ndaluar'))), '1. pa Grup dhe pa Afate: s\'ka "Njoftimet" te Cilësimet');
  await p.click('#btnOpsione').catch(() => {}); await p.waitForTimeout(200);

  // ---- 2. vetëm Afatet kthehen (pa Grup) ----
  F.S.docs.set('lejet/u1', { lejet: Object.assign(L.krejt(true), { grupi: false }), kontrolluarSe: t, emri: 'agim' });
  await p.evaluate(() => window.__fs('resync'));
  ok(await prit(async () => listat().some(n => n > 0), 9000), '2. "Afatet" lejohen: serveri merr sërish listën e vërtetë', listat());
  ok(!pajisjet().length, '2. pa "Grupi" ende: pajisja s\'regjistrohet te grupi');
  await p.evaluate(() => { const o = document.getElementById('dlgOpsione'); if (!o.classList.contains('hapur')) document.getElementById('btnOpsione').click(); });
  await p.waitForTimeout(300);
  await p.click('#tabNjoftimet'); await p.waitForTimeout(300);
  const nj = await p.evaluate(() => ({ t: document.getElementById('njGjendjaTitulli').textContent, x: document.getElementById('njGjendjaTeksti').textContent, intro: document.getElementById('njIntro').textContent, btn: getComputedStyle(document.getElementById('njBtnAktivizo')).display }));
  ok(nj.t === 'Aktive' && !/Grup/.test(nj.x + nj.intro) && nj.btn === 'none', '2. Cilësimet → Njoftimet: "Aktive", pa asnjë fjalë për Grupin', nj);
  await p.screenshot({ path: __dirname + '/v231-njoftimet-pa-grup.png' });

  // ---- 3. Grupi kthehet ----
  F.S.docs.set('lejet/u1', { lejet: L.krejt(true), kontrolluarSe: t, emri: 'agim' });
  await p.evaluate(() => window.__fs('resync'));
  ok(await prit(async () => pajisjet().length === 1, 9000), '3. "Grupi" lejohet: pajisja regjistrohet sërish te grupi', pajisjet());
  const intro3 = await p.textContent('#njIntro');
  ok(/Grupit dhe të afateve/.test(intro3), '3. Njoftimet: teksti i plotë (Grupi + afatet)', intro3);

  // ---- 4. Grupi ndalohet sërish gjatë punës ----
  F.S.docs.set('lejet/u1', { lejet: Object.assign(L.krejt(true), { grupi: false }), kontrolluarSe: t, emri: 'agim' });
  await p.evaluate(() => window.__fs('resync'));
  ok(await prit(async () => !pajisjet().length, 9000), '4. "Grupi" ndalohet gjatë punës: pajisja hiqet nga grupi', pajisjet());
  ok(F.S.refuzime.filter(x => /grupet\/ekipa\/push/.test(x.path)).length === 0, '4. asnjë refuzim nga rregullat për push-in', F.S.refuzime.filter(x => /push/.test(x.path)));
  ok(!gab.length, 'pa gabime JavaScript', gab);
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

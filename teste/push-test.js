const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const ok = (c, m) => console.log(c ? 'OK ' : 'GABIM', m);
const PUSH = 'https://stoku-push.mendurb.workers.dev';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: t });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t });
  F.S.docs.set('perdoruesit/u2', { perdoruesi: 'blerta', kycurSe: t });
  F.S.docs.set('ekipa_anetaret/u1', { emri: 'agim' }); F.S.docs.set('ekipa_anetaret/u2', { emri: 'blerta' });
  const b = await chromium.launch();
  const thirrjet = []; let serveriGati = true;
  async function faqe(uid, emri, platforma, url) {
    const ctx = await b.newContext({ userAgent: platforma === 'pc' ? 'Mozilla/5.0 (Windows NT 10.0) Chrome/140' : 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.grantPermissions(['notifications'], { origin: 'http://127.0.0.1:8765' });
    await ctx.route(u => u.href.startsWith(PUSH), async r => {
      const q = r.request();
      if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
      if (!serveriGati) return r.abort();
      if (q.method() === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"celesat":true}' });
      thirrjet.push({ nga: uid, url: q.url(), auth: q.headers()['authorization'], trup: q.postData() });
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"pajisje":1,"derguar":1}' });
    });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1') && !u.href.startsWith(PUSH), r => r.abort());
    await ctx.addInitScript(([uid]) => {
      window.__njoftimet = [];
      const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/' + uid, options: { applicationServerKey: null },
        toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'BPk' + uid, auth: 'au' + uid } }; }, unsubscribe: async () => true };
      let abonuar = null;
      const reg = { pushManager: { getSubscription: async () => abonuar, subscribe: async (o) => { window.__abonimi = o; abonuar = sub; return sub; } },
        showNotification: async (t, o) => { window.__njoftimet.push(t + ' | ' + (o && o.body)); }, periodicSync: null };
      Object.defineProperty(ServiceWorkerContainer.prototype, 'ready', { get() { return Promise.resolve(reg); } });
      if (!window.PushManager) window.PushManager = function () {};
      try { Object.defineProperty(Notification, 'permission', { get: () => 'granted', configurable: true }); } catch (e) {}
    }, [uid]);
    await F.lidh(ctx, uid, emri + '@stoku-app.local', platforma);
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('[' + emri + '] pageerror:', e.message));
    await p.goto('http://127.0.0.1:8765/' + (url || 'index.html')); await p.waitForTimeout(2200);
    return { p, ctx };
  }
  const A = await faqe('u1', 'agim', 'tel');
  const B = await faqe('u2', 'blerta', 'pc', 'pc.html');
  await A.p.waitForTimeout(800);
  console.log('debug:', await A.p.evaluate(async () => { const e = window.__stokuCloud.ekipa; return JSON.stringify([!!e, e && e.pushMbeshtetet(), Notification.permission, await e.aktivizoPush()]); }));
  const docs = [...F.S.docs.keys()].filter(k => k.startsWith('grupet/ekipa/push/'));
  ok(docs.some(k => k.startsWith('grupet/ekipa/push/u1_')) && docs.some(k => k.startsWith('grupet/ekipa/push/u2_')), 'të dy pajisjet u regjistruan: ' + docs.join(', '));
  const dA = F.S.docs.get(docs.find(k => k.startsWith('grupet/ekipa/push/u1_')));
  ok(dA.endpoint.endsWith('/u1') && dA.p256dh === 'BPku1' && dA.auth === 'auu1' && dA.platforma === 'tel' && dA.emri === 'agim', 'të dhënat e pajisjes: ' + JSON.stringify(dA).slice(0, 140));
  ok(F.S.docs.get(docs.find(k => k.startsWith('grupet/ekipa/push/u2_'))).platforma === 'pc', 'PC regjistrohet si pc');
  const abon = await A.p.evaluate(() => window.__abonimi && window.__abonimi.userVisibleOnly && window.__abonimi.applicationServerKey && window.__abonimi.applicationServerKey.length);
  ok(abon === 65, 'subscribe me userVisibleOnly + çelës VAPID 65 bajt: ' + abon);
  ok(await A.p.evaluate(() => window.__stokuCloud.ekipa.pushAktiv()), 'push aktiv te agimi');
  // v221: chat-i u hoq krejt: s'ka API në ekipa.js (tel + PC) dhe s'thirret kurrë /chat
  const apiA = await A.p.evaluate(() => { const e = window.__stokuCloud.ekipa; return [typeof e.dergoMesazh, typeof e.degjoChatin, typeof e.fshijMesazhin]; });
  ok(apiA.every(x => x === 'undefined'), 'v221: pa API të chat-it te cloud-i (tel): ' + JSON.stringify(apiA));
  const apiB = await B.p.evaluate(() => { const k = window.__stokuEkipaK; return k ? [typeof k.hapChatin, typeof k.dergoMesazh, typeof k.pastroChatin, typeof k.kaChatTePalexuar] : ['pa-K']; });
  ok(apiB.every(x => x === 'undefined'), 'v221: pa API të chat-it te kontrolluesi (PC): ' + JSON.stringify(apiB));
  ok(!(await B.p.$('#ekChatBtn')) && !(await B.p.$('#navEkChat')) && !(await B.p.$('#ekVChat')) && !(await A.p.$('#ekChatBtn')) && !(await A.p.$('#ekChatFund')), 'v221: s\'ka më elemente të chat-it (tel + PC)');
  // Prova nga Cilësimet
  await A.p.evaluate(() => localStorage.setItem('stoku:push:server', String(Date.now())));
  await A.p.click('#btnOpsione'); await A.p.waitForTimeout(400);
  ok(/Aktive/.test(await A.p.textContent('#tabNjoftimetStatus')), 'statusi te menuja: ' + await A.p.textContent('#tabNjoftimetStatus'));
  await A.p.click('#tabNjoftimet'); await A.p.waitForTimeout(300);
  await A.p.screenshot({ path: __dirname + '/push-njoftimet.png', fullPage: false });
  ok((await A.p.textContent('#njGjendjaTitulli')) === 'Aktive', 'gjendja: ' + await A.p.textContent('#njGjendjaTitulli'));
  ok(!(await A.p.$('#njBtnProve')) && !thirrjet.some(x => x.url.endsWith('/prove')), 'butoni i provës s\'ekziston më');
  await A.p.evaluate(() => { const t = document.querySelector('.opsione-trup'); t.scrollTop = 9999; }); await A.p.waitForTimeout(200);
  await A.p.screenshot({ path: __dirname + '/push-njoftimet-2.png' });
  // Dalja fshin pajisjen
  await A.p.evaluate(() => window.__stokuCloud.ekipa.caktivizoPush());
  ok(![...F.S.docs.keys()].some(k => k.startsWith('grupet/ekipa/push/u1_')), 'dalja: pajisja e agimit u hoq');
  ok(!thirrjet.some(x => /\/chat$/.test(x.url)), 'v221: asnjë thirrje /chat: ' + JSON.stringify(thirrjet.map(x => x.url)));
  ok(F.S.refuzime.filter(x => /grupet\/ekipa\/push/.test(x.path)).length === 0, 'asnjë refuzim nga rregullat: ' + JSON.stringify(F.S.refuzime.filter(x => /grupet\/ekipa\/push/.test(x.path))));
  await b.close();
})();

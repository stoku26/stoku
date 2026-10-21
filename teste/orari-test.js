const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const PUSH = 'https://stoku-push.mendurb.workers.dev';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t }); F.S.docs.set('ekipa_anetaret/u1', { emri: 'agim' });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Bulmet' }], produktet: [],
    afatet: [{ id: 'a1', barkodi: '444', emri: 'Djathë', data: d(-3), sasia: 2, statusi: 'aktiv', ndryshuarSe: t }, { id: 'a2', barkodi: '5', emri: 'Kos', data: d(4), statusi: 'aktiv', ndryshuarSe: t },
      { id: 'a3', barkodi: '6', emri: 'Hequr', data: d(-9), statusi: 'hequr', ndryshuarSe: t }], fshira: {} });
  const b = await chromium.launch();
  const orari = []; let kvGati = true; let ekziston = true; let health = { ok: true, celesat: true, fotot: true }; let kvProva = null, kvThirrje = 0;
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block', timezoneId: 'Europe/Belgrade' });
  await ctx.grantPermissions(['notifications'], { origin: 'http://127.0.0.1:8765' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel');
  await ctx.route(u => u.href.startsWith(PUSH), async r => {
    const q = r.request(), h = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: h });
    if (q.method() === 'GET' && q.url() === PUSH + '/?kv=1') { kvThirrje++; return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify(Object.assign({}, health, { kv: kvProva })) }); }
    if (q.method() === 'GET' && q.url().replace(/\/$/, '') === PUSH) return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify(health) });
    if (q.method() === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: '{"ok":true,"fotot":{}}' });
    if (q.url().endsWith('/orari') && JSON.parse(q.postData()).statusi) return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify({ ok: true, ekziston: (() => { const e = ekziston; ekziston = true; return e; })(), ora: '18:47', dita: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' }), rez: 'asgje', afatet: 2 }) });
    if (q.url().endsWith('/orari')) { if (!kvGati) return r.fulfill({ status: 500, contentType: 'application/json', headers: h, body: '{"ok":false,"arsye":"mungon-kv"}' }); orari.push(JSON.parse(q.postData())); return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: '{"ok":true}' }); }
    return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: '{"ok":true}' });
  });
  await ctx.addInitScript(() => {
    window.__njoftimet = [];
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/u1', options: { applicationServerKey: null }, toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'BPku1', auth: 'auu1' } }; }, unsubscribe: async () => true };
    let abonuar = null;
    const reg = { pushManager: { getSubscription: async () => abonuar, subscribe: async () => { abonuar = sub; return sub; } }, showNotification: async (t, o) => { window.__njoftimet.push(t + ' | ' + (o && o.body)); }, periodicSync: null };
    Object.defineProperty(ServiceWorkerContainer.prototype, 'ready', { get() { return Promise.resolve(reg); } });
    if (!window.PushManager) window.PushManager = function () {};
    try { Object.defineProperty(Notification, 'permission', { get: () => 'granted', configurable: true }); } catch (e) {}
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror:', e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::ERR/.test(m.text())) { g++; console.log('console:', m.text()); } });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(3000);
  const njPara = await p.evaluate(() => window.__njoftimet.slice());
  ok(njPara.some(x => /Djathë/.test(x)), '0. pa orar: njoftimet e menjëhershme si më parë', njPara);
  await p.click('#btnOpsione'); await p.waitForTimeout(300);
  await p.click('[data-faqe="njoftimet"]'); await p.waitForTimeout(400);
  ok(!(await p.$('#njBtnProve')) && !/provë/i.test(await p.textContent('[data-faqe="njoftimet"].opsione-faqe')), '1. s\'ka më "Dërgo njoftim provë"');
  ok(!(await p.isChecked('#njDitor')) && await p.inputValue('#njOra') === '08:00', '1. fillimisht: e fikur, 08:00');
  ok(await p.$eval('#njOra', e => e.inputMode) === 'numeric', '1. fusha e orës: tekst 24-orësh');
  await p.click('#njOra'); await p.fill('#njOra', ''); await p.keyboard.type('1705'); 
  ok(await p.inputValue('#njOra') === '17:05', '1. "1705" → "17:05" gjatë shkrimit', await p.inputValue('#njOra'));
  await p.fill('#njOra', ''); await p.keyboard.type('2599'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  ok(await p.inputValue('#njOra') !== '25:99', '1. ora e pavlefshme refuzohet', await p.inputValue('#njOra'));
  await p.fill('#njOra', ''); await p.keyboard.type('9'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  ok(await p.inputValue('#njOra') === '09:00', '1. "9" → "09:00"', await p.inputValue('#njOra'));
  await p.screenshot({ path: 'orari-1.png', fullPage: false });
  await p.fill('#njOra', '07:30'); await p.press('#njOra', 'Enter'); await p.waitForTimeout(200);
  ok(!orari.some(x => 'aktiv' in x), '2. pa ndezur: ora vetëm ruhet lokalisht');
  await p.click('label[for="njDitor"]'); await p.waitForTimeout(1500);
  const v = orari.find(x => 'aktiv' in x), af = orari.find(x => x.afatet);
  ok(v && v.aktiv === true && v.ora === '07:30' && v.tz === 'Europe/Belgrade' && v.platforma === 'tel' && v.pajisja.endpoint.endsWith('/u1') && v.pajisja.p256dh === 'BPku1', '3. ndezja → /orari me orën dhe pajisjen', v);
  ok(af && af.afatet.length === 2 && af.afatet.some(x => x.e === 'Djathë' && x.d === d(-3)) && !af.afatet.some(x => x.e === 'Hequr'), '3. afatet dërgohen (pa të hequrat)', af && af.afatet);
  ok(/Çdo ditë në 07:30/.test(await p.textContent('#njOraHint')) && /ditore 07:30/.test(await p.textContent('#tabNjoftimetStatus')), '3. teksti: "Çdo ditë në 07:30"');
  await p.screenshot({ path: 'orari-2.png' });
  // ndryshimi i orës
  orari.length = 0; await p.fill('#njOra', '18:47'); await p.press('#njOra', 'Enter'); await p.waitForTimeout(1200);
  ok(orari.length && orari[0].aktiv && orari[0].ora === '18:47', '4. ndryshimi i orës dërgohet', orari);
  // serveri me kod të vjetër (pa Cron): paralajmërim, dhe njoftimet e zakonshme vazhdojnë (s'mbetet pa asgjë)
  ok(/kodin e vjetër/.test(await p.textContent('#njOraServer')), '5a. kodi i vjetër te serveri → paralajmërim', await p.textContent('#njOraServer'));
  await p.evaluate(() => { indexedDB.deleteDatabase('stoku-njoftimet'); });
  await p.reload(); await p.waitForTimeout(3000);
  ok((await p.evaluate(() => window.__njoftimet)).some(x => /Djathë/.test(x)), '5b. pa Cron të konfirmuar: njoftimet e zakonshme vijnë si më parë', await p.evaluate(() => window.__njoftimet));
  const kutia = async () => { await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabNjoftimet'); await p.waitForTimeout(1200);
    const t = await p.textContent('#njOraServer'); await p.click('#opsPrapa'); await p.click('#opsPrapa', { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300); return t; };
  health = Object.assign({}, health, { versioni: 161, cron: Date.now() - 600000, cronShprehja: '* * * * *' });
  let tk = await kutia();
  ok(/kodin e vjetër: ngjite kodin e ri te stoku-push\.$/.test(tk), '5a2. serveri 161 (aplikacioni pret 164) → paralajmërim', tk);
  health = Object.assign({}, health, { versioni: 163 });
  tk = await kutia();
  ok(/kodin e vjetër: ngjite kodin e ri te stoku-push\.$/.test(tk), '5a3. serveri 163 (aplikacioni pret 164, pa chat) → paralajmërim', tk);
  health = Object.assign({}, health, { versioni: 166, cron: Date.now() - 600000, cronShprehja: '0,15,30,45 * * * *' });
  tk = await kutia();
  ok(/punon çdo 15 minuta, jo çdo minutë/.test(tk) && /"Every minute"/.test(tk) && !tk.includes('*'), '5c0. Cron çdo 15 min + ora 18:47 → paralajmërim me fjalë (pa yje)', tk);
  ok(kvThirrje === 0, '5c0. Cron-i punon → pa provë të KV-së');
  health = Object.assign({}, health, { cron: Date.now() - 30 * 60000 }); kvProva = { ok: false, koha: Date.now(), mesazh: 'KV put() limit exceeded for the day.' };
  tk = await kutia();
  ok(kvThirrje === 1 && /limitin falas/.test(tk) && /Rifillon vetë në \d\d:\d\d/.test(tk), '5c1. Cron i ndalur + KV pa shkrime → limiti', tk);
  kvProva = { ok: true, koha: Date.now() };
  tk = await kutia();
  ok(/s'ka punuar që nga \d\d:\d\d \(atëherë ishte çdo 15 minuta\)/.test(tk) && /Logs/.test(tk), '5c2. Cron i ndalur, KV në rregull → "s\'ka punuar që nga"', tk);
  health = Object.assign({}, health, { cron: Date.now() - 60000, cronShprehja: '* * * * *', cronGabim: { koha: Date.now() - 30000, mesazh: 'TypeError: x is undefined\n    at dergo (worker.js:10)' } });
  tk = await kutia();
  ok(/Serveri pati gabim në \d\d:\d\d: TypeError: x is undefined\./.test(tk), '5c3. gabimi i Cron-it shfaqet', tk);
  health = Object.assign({}, health, { cronGabim: { koha: Date.now() - 2 * 3600000, mesazh: 'i vjetër' } });
  health = Object.assign({}, health, { cronShprehja: '* * * * *' });
  await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabNjoftimet'); await p.waitForTimeout(1200);
  ok(/Serveri punon\. Sot s'skadon asnjë/.test(await p.textContent('#njOraServer')), '5c. serveri gati → "Serveri punon"', await p.textContent('#njOraServer'));
  await p.screenshot({ path: 'orari-3.png' });
  await p.evaluate(() => { indexedDB.deleteDatabase('stoku-njoftimet'); localStorage.removeItem('stoku:orari:cron-ok'); });
  await p.reload(); await p.waitForTimeout(3500);
  ok(await p.evaluate(() => window.__njoftimet.length) === 0, '5. me orar dhe Cron që punon (pa kontroll të mëparshëm): s\'ka njoftime të menjëhershme', await p.evaluate(() => window.__njoftimet));
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:orari')).ora) === '18:47', '5. pas rifreskimit orari mbetet');
  // afati i ri → dërgohet kopja e re
  orari.length = 0;
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('stoku:afatet:v1')); a.push({ id: 'a9', emri: 'Bukë', barkodi: '9', data: '2026-01-01', statusi: 'aktiv', ndryshuarSe: Date.now() }); localStorage.setItem('stoku:afatet:v1', JSON.stringify(a)); });
  await p.reload(); await p.waitForTimeout(3000);
  ok(orari.some(x => x.afatet && x.afatet.some(a => a.e === 'Bukë')), '6. lista e re e afateve dërgohet', orari.map(x => x.afatet ? x.afatet.length : x));
  // serveri e ka fshirë orarin (p.sh. pas riinstalimit) → regjistrohet vetë
  ekziston = false; orari.length = 0;
  await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabNjoftimet'); await p.waitForTimeout(2000);
  ok(orari.some(x => x.aktiv === true && x.ora === '18:47') && orari.some(x => x.afatet), '6c. orari i fshirë te serveri → regjistrohet vetë (+ afatet)', orari.map(x => x.statusi ? 'statusi' : x.afatet ? 'afatet' : x.ora));
  ok(/Serveri punon/.test(await p.textContent('#njOraServer')), '6c. pas rinovimit: "Serveri punon"', await p.textContent('#njOraServer'));
  await p.click('#opsPrapa'); await p.click('#opsPrapa', { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300);
  // fikja
  health = Object.assign({}, health, { cron: null });
  await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('[data-faqe="njoftimet"]'); await p.waitForTimeout(1200);
  ok(/Cron/.test(await p.textContent('#njOraServer')), '6b. pa Cron → paralajmërim', await p.textContent('#njOraServer'));
  ok(await p.isChecked('#njDitor') && await p.inputValue('#njOra') === '18:47', '7. pas rihapjes: ndezur, 18:47');
  orari.length = 0; await p.click('label[for="njDitor"]'); await p.waitForTimeout(1200);
  ok(orari.some(x => x.aktiv === false) && await p.evaluate(() => localStorage.getItem('stoku:orari')) === null, '7. fikja → aktiv:false');
  // serveri pa KV
  kvGati = false; await p.click('label[for="njDitor"]'); await p.waitForTimeout(1200);
  ok(!(await p.isChecked('#njDitor')), '8. serveri pa KV: mbetet e fikur');
  // dalja nga llogaria heq orarin
  kvGati = true; await p.click('label[for="njDitor"]'); await p.waitForTimeout(1200);
  orari.length = 0;
  await p.evaluate(() => window.__stokuCloud.ekipa.caktivizoPush()); await p.waitForTimeout(500);
  ok(orari.some(x => x.aktiv === false), '9. dalja nga llogaria e heq orarin e kësaj pajisjeje');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK'); await b.close();
})();

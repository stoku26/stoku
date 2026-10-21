// v167: Stoku brenda aplikacionit Android (window.StokuAndroid i simuluar)
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const SC = __dirname + '/';
(async () => {
  const F = krijoFirestore({ rregullat: 'reja' });
  const t = Date.now();
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: t, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'u1', pronarEmri: 'agim' });
  F.S.docs.set('grupet/g1/anetaret/u1', { emri: 'agim', roli: 'pronar', hyriSe: t });
  F.S.docs.set('dyqane/u1', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [{ id: 'p1', folderId: 'f1', emri: 'Ujë', barkodi: '123', sasia: 3, ndryshuarSe: t }], afatet: [], fshira: {} });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36 StokuAndroid/3', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await ctx.addInitScript(() => {
    window.__ura = [];
    let leja = 'default', token = '';
    window.StokuAndroid = {
      versioni: () => 3, tokenFcm: () => token, leja: () => leja,
      kerkoLejen: () => { window.__ura.push('kerkoLejen'); setTimeout(() => { leja = 'granted'; window.__stokuLejaCb && window.__stokuLejaCb('granted'); }, 30); },
      njofto: (a, b, c, d) => window.__ura.push('njofto:' + a + '|' + b + '|' + c),
      ndaj: (emri, mime, b64, tit) => window.__ura.push('ndaj:' + emri + ':' + mime + ':' + b64.length),
      ngjyrat: c => window.__ura.push('ngjyrat:' + c),
      kontrolloPerditesimin: () => window.__ura.push('perditesim')
    };
    window.__vendosToken = x => { token = x; window.dispatchEvent(new CustomEvent('stoku-android-token', { detail: x })); };
  });
  await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel');
  const p = await ctx.newPage();
  p.on('pageerror', e => { g++; console.log('pageerror:', e.message); });
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2500);
  ok(await p.evaluate(() => document.documentElement.classList.contains('android-app') && Notification.permission === 'default' && navigator.standalone === true), '1. android.js: klasa, Notification, standalone');
  ok((await p.evaluate(() => window.__ura)).some(x => /^ngjyrat:#/.test(x)), '1. ngjyra e shiritave i dërgohet aplikacionit', await p.evaluate(() => window.__ura));
  // 2. Leja + tokeni → pajisja te grupi
  ok(await p.isVisible('#dlgNjoftimet'), '2. web-i pyet për njoftimet (aplikacion i instaluar)');
  await p.screenshot({ path: SC + 'android-pyetja.png' });
  await p.click('#njAktivizo'); await p.waitForTimeout(500);
  ok((await p.evaluate(() => window.__ura)).includes('kerkoLejen') && await p.evaluate(() => Notification.permission) === 'granted', '2. "Aktivizo" → leja e Android-it');
  await p.evaluate(() => window.__vendosToken('tokenFCM_' + 'a'.repeat(40)));
  await p.waitForTimeout(1500);
  const pj = [...F.S.docs.keys()].filter(k => k.startsWith('grupet/g1/push/')).map(k => F.S.docs.get(k));
  ok(pj.length === 1 && pj[0].fcm === 'tokenFCM_' + 'a'.repeat(40) && pj[0].endpoint === 'fcm:' + pj[0].fcm && pj[0].uid === 'u1' && !pj[0].p256dh, '2. pajisja Android te grupi (fcm)', pj);
  // 3. Njoftim lokal → aplikacioni
  await p.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.getRegistration ? 0 : 0);
  await p.evaluate(() => { new Notification('Provë', { body: 'tekst', tag: 'x' }); });
  ok((await p.evaluate(() => window.__ura)).includes('njofto:Provë|tekst|x'), '3. new Notification → njoftimi i Android-it');
  // 4. Eksporti në Excel → "Ndaj"
  await p.click('#btnStoku').catch(() => {});
  const nd = await p.evaluate(async () => { const f = new File([new Uint8Array([80, 75, 3, 4, 9, 9])], 'malli_pije.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const c = navigator.canShare({ files: [f] }); await navigator.share({ files: [f], title: 'Malli' }); return c; });
  await p.waitForTimeout(300);
  ok(nd === true && (await p.evaluate(() => window.__ura)).some(x => /^ndaj:malli_pije\.xlsx:application\/vnd\.openxml/.test(x)), '4. navigator.share me skedar → "Ndaj" e Android-it', await p.evaluate(() => window.__ura.filter(x => x.startsWith('ndaj'))));
  await p.evaluate(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['abc'], { type: 'text/plain' })); a.download = 'test.txt'; a.click(); });
  await p.waitForTimeout(300);
  ok((await p.evaluate(() => window.__ura)).some(x => /^ndaj:test\.txt:text\/plain/.test(x)), '4. <a download> blob → "Ndaj"');
  // 5. Cilësimet: butoni i hollë i aplikacionit poshtë 'Çka ka të re' (Cilësimet hapen 3 herë: s'duhet të shumëfishohet)
  for (let i = 0; i < 2; i++) { await p.click('#btnOpsione'); await p.waitForTimeout(250); await p.evaluate(() => document.getElementById('dlgOpsione').click()); await p.waitForTimeout(250); }
  await p.click('#btnOpsione'); await p.waitForTimeout(300);
  ok(await p.isVisible('#njAndroidBtn') && /Kontrollo për përditësim/.test(await p.textContent('#njAndroidBtn')), '5. menuja: butoni "Kontrollo për përditësim"', await p.textContent('#njAndroidBtn'));
  ok(await p.evaluate(() => { const b = document.getElementById('njAndroidBtn'), t = document.getElementById('opsTeRejat').getBoundingClientRect(), v = document.querySelector('.ops-fundi').getBoundingClientRect(), r = b.getBoundingClientRect(); return r.top > t.bottom && r.bottom < v.top && r.height < 44; }), '5. butoni i hollë mes "Çka ka të re" dhe versionit');
  ok(await p.textContent('#tabOra .kat-tekst') === 'Ora e dorës', '5. kategoria quhet "Ora e dorës"');
  await p.screenshot({ path: SC + 'android-menu.png' });
  await p.click('#njAndroidBtn'); await p.waitForTimeout(200);
  ok((await p.evaluate(() => window.__ura)).filter(x => x === 'perditesim').length === 1, '5. kontrolli i përditësimit → aplikacioni (një herë)', (await p.evaluate(() => window.__ura)).filter(x => x === 'perditesim').length);
  await p.click('#tabOra'); await p.waitForTimeout(400);
  ok(await p.isVisible('#oraKodi') && !(await p.isVisible('#njAndroidBtn')) && !(await p.evaluate(() => /Aplikacioni Android|Aplikacioni Stoku për Android/.test(document.querySelector('.opsione-faqe[data-faqe="ora"]').textContent))), '5. "Ora e dorës": vetëm ora');
  await p.screenshot({ path: SC + 'android-ora.png' });
  // 6. Njoftimi ditor me tokenin e Android-it
  let trupi = null;
  await ctx.route('https://stoku-push.mendurb.workers.dev/**', async rt => { const q = rt.request(); if (q.method() === 'POST' && /orari$/.test(q.url())) { const b = JSON.parse(q.postData() || '{}'); if (b.pajisja) trupi = b; } rt.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, aktiv: true }) }); });
  const rr = await p.evaluate(() => window.__stokuCloud.ekipa.vendosOrarin({ aktiv: true, ora: '08:00' }));
  ok(rr.ok && trupi && trupi.pajisja.fcm === 'tokenFCM_' + 'a'.repeat(40) && !trupi.pajisja.p256dh, '6. njoftimi ditor regjistrohet me tokenin e Android-it', trupi && trupi.pajisja);
  await ctx.close();
  // 7. Chrome Android (pa aplikacion): karta me shkarkimin
  const ctx2 = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx2.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
  await F.lidh(ctx2, 'u1', 'agim@stoku-app.local', 'tel');
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => { g++; console.log('pageerror2:', e.message); });
  await p2.goto('http://127.0.0.1:8765/index.html'); await p2.waitForTimeout(2000);
  await p2.click('#btnOpsione'); await p2.waitForTimeout(300);
  ok(await p2.isVisible('#njAndroidBtn') && /Shkarko aplikacionin Android/.test(await p2.textContent('#njAndroidBtn')), '7. Chrome Android: "Shkarko aplikacionin Android"');
  for (let i = 0; i < 2; i++) { await p2.evaluate(() => document.getElementById('dlgOpsione').click()); await p2.waitForTimeout(250); await p2.click('#btnOpsione'); await p2.waitForTimeout(250); }
  let dritare = 0; ctx2.on('page', () => dritare++);
  await p2.click('#njAndroidBtn'); await p2.waitForTimeout(800);
  ok(dritare === 1, '7. "Shkarko" hap vetëm një dritare', dritare);
  await p2.screenshot({ path: SC + 'android-chrome.png' });
  await ctx2.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK'); await b.close();
})();

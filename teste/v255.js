// v255: aplikacioni i vjetër i telefonit (tel/, WebView me window.StokuAndroid) u fshi; mbetet vetëm aplikacioni Stoku (vendas/).
//  A) skedarët: s'ka më android.js / android.json / tel-apk.yml / kodin e tel/; mbeten vetëm çelësat e nënshkrimit;
//  B) telefoni (Chrome Android): "Shkarko aplikacionin Android" hap android.html; edhe me një window.StokuAndroid të rremë
//     asnjë kod s'e thërret urën e vjetër dhe butoni s'bëhet "Kontrollo për përditësim";
//  C) iPhone / kompjuteri: butoni s'del;
//  D) android.html: lidhja shkon te APK-ja më e re "vendas-vNN" (jo "tel-vNN"), "Versioni 0.1.NN".
const { chromium } = require('./pw.js');
const fs = require('fs'), path = require('path');
const RR = path.join(__dirname, '..');
const PORTI = process.env.PORTI || '8765';
const B = 'http://127.0.0.1:' + PORTI;
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };

const MOCK = ([ura]) => {
  window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
    degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
  localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
  localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
  window.__ura = [];
  if (ura) window.StokuAndroid = new Proxy({}, { get: (o, k) => { window.__ura.push(String(k)); return () => ''; } });
  window.__hapur = [];
  window.open = u => { window.__hapur.push(String(u)); return null; };
};

async function faqe(b, ua, ura, url) {
  const ctx = await b.newContext({ userAgent: ua, viewport: { width: 390, height: 844 }, serviceWorkers: 'block', hasTouch: /Mobile/.test(ua) });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await ctx.addInitScript(MOCK, [ura]);
  const p = await ctx.newPage(); p.__gab = [];
  p.on('pageerror', e => p.__gab.push(e.message));
  await p.goto(B + (url || '/index.html')); await p.waitForTimeout(2000);
  return { p, ctx };
}

(async () => {
  // ---------- A) skedarët ----------
  for (const f of ['android.js', 'android.json', '.github/workflows/tel-apk.yml', 'tel/app', 'tel/build.gradle.kts', 'tel/settings.gradle.kts', 'teste/android-test.js'])
    ok(!fs.existsSync(path.join(RR, f)), 'A: s\'ekziston ' + f);
  for (const f of ['tel/stoku-tel.jks', 'tel/celesi-i-ri.p12.enc', 'tel/celesi.lineage'])
    ok(fs.existsSync(path.join(RR, f)), 'A: çelësi i nënshkrimit mbetet: ' + f);
  ok(fs.readdirSync(path.join(RR, 'tel')).sort().join() === 'README.md,celesi-i-ri.p12.enc,celesi.lineage,stoku-tel.jks', 'A: te tel/ vetëm çelësat dhe README', fs.readdirSync(path.join(RR, 'tel')));
  const gradle = fs.readFileSync(path.join(RR, 'vendas/app/build.gradle.kts'), 'utf8');
  ok(/storeFile = file\("\.\.\/\.\.\/tel\/stoku-tel\.jks"\)/.test(gradle), 'A: aplikacioni Stoku nënshkruhet ende me tel/stoku-tel.jks');
  for (const f of ['index.html', 'pc.html', 'sw.js', 'app-tel.js', 'app-pc.js', 'ekipa.js', 'fillimi-tel.js', 'firebase-tel.js', 'porta.js']) {
    const t = fs.readFileSync(path.join(RR, f), 'utf8');
    ok(!/StokuAndroid|android\.js|android\.json|tokenFcm/.test(t), 'A: ' + f + ' pa urën e aplikacionit të vjetër');
  }
  const sw = fs.readFileSync(path.join(RR, 'sw.js'), 'utf8');
  ok(/var CACHE = 'stoku-v255'/.test(sw), 'A: sw.js CACHE v255');
  const TR = require(path.join(RR, 'teRejat.js'));
  const tel = TR.teRejatPas(254, 'tel', false, () => true).map(h => h.titulli), pc = TR.teRejatPas(254, 'pc', false, () => true).map(h => h.titulli);
  ok(tel.includes('Aplikacioni i ri Stoku për Android') && !pc.length, 'A: "Çka ka të re": vetëm telefoni', { tel, pc });

  const b = await chromium.launch();
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36';
  // ---------- B) Chrome Android, edhe me urë të rreme ----------
  for (const ura of [false, true]) {
    const { p, ctx } = await faqe(b, ANDROID, ura);
    const em = ura ? 'B (me StokuAndroid të rremë)' : 'B';
    const btn = await p.evaluate(() => ({ hidden: document.getElementById('njAndroidBtn').hidden, tekst: document.getElementById('njAndroidTekst').textContent }));
    ok(!btn.hidden && btn.tekst === 'Shkarko aplikacionin Android', em + ': butoni "Shkarko aplikacionin Android"', btn);
    await p.click('#btnOpsione'); await p.waitForTimeout(400);
    await p.click('#njAndroidBtn'); await p.waitForTimeout(200);
    ok((await p.evaluate(() => window.__hapur)).join() === 'android.html', em + ': hap android.html', await p.evaluate(() => window.__hapur));
    // Njoftimet (Web Push) s'kalojnë më nga ura
    await p.evaluate(async () => { try { const e = window.__stokuCloud && window.__stokuCloud.ekipa; if (e && e.aktivizoPush) await e.aktivizoPush(true); } catch (x) { /* ok */ } });
    ok((await p.evaluate(() => window.__ura)).length === 0, em + ': asnjë thirrje e urës së vjetër', await p.evaluate(() => window.__ura));
    ok(!p.__gab.length, em + ': pa gabime JavaScript', p.__gab);
    await ctx.close();
  }
  // ---------- C) iPhone / kompjuteri ----------
  {
    const { p, ctx } = await faqe(b, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1', false);
    ok(await p.evaluate(() => document.getElementById('njAndroidBtn').hidden), 'C: iPhone: butoni s\'del');
    await ctx.close();
  }
  // ---------- D) android.html ----------
  {
    const ctx = await b.newContext({ userAgent: ANDROID, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B) && !u.href.startsWith('https://api.github.com/'), r => r.abort());
    await ctx.route('https://api.github.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify([
      { tag_name: 'tel-v99', assets: [{ name: 'stoku-tel-99.apk', browser_download_url: 'https://example.invalid/stoku-tel-99.apk' }] },
      { tag_name: 'vendas-v48', assets: [{ name: 'stoku-48.apk', browser_download_url: 'https://example.invalid/stoku-48.apk' }] },
      { tag_name: 'vendas-v46', assets: [{ name: 'stoku-46.apk', browser_download_url: 'https://example.invalid/stoku-46.apk' }] },
      { tag_name: 'ora-v12', assets: [{ name: 'stoku-ora-12.apk', browser_download_url: 'https://example.invalid/stoku-ora-12.apk' }] }
    ]) }));
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + '/android.html'); await p.waitForTimeout(1200);
    const d = await p.evaluate(() => ({ href: document.getElementById('shkarko').href, info: document.getElementById('info').textContent, tekst: document.body.textContent }));
    ok(d.href === 'https://example.invalid/stoku-48.apk', 'D: lidhja te APK-ja më e re e aplikacionit Stoku (vendas-v48)', d.href);
    ok(d.info === 'Versioni 0.1.48', 'D: "Versioni 0.1.48"', d.info);
    ok(/çinstaloje/.test(d.tekst), 'D: këshilla për ta çinstaluar aplikacionin e vjetër');
    ok(!gab.length, 'D: pa gabime JavaScript', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

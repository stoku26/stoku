// v362 (pronari: "osht tu pas probleme kur ruhet cache ... logoja e gjithqka fillon qysh ka pas mbet tana mas refreshit ... bohet
// komplet refresh ... me bo njo kishe osht tu u mush ose loading"): përditësimi i service worker-it pa rindezje të kota.
//  1. Hapet Stoku pasi ka dalë versioni i ri (faqja vjen nga interneti, pra është tashmë e reja): s'rindizet më pas pak sekondash
//  2. Stoku i hapur kohë më parë, del versioni i ri: rindizet një herë, me ekranin e përditësimit (logoja + rrethi) para dhe pas,
//     që zbehet kur faqja e re është gati
//  3. tel + PC
// Simulimi: një kopje e faqes në një dosje të përkohshme; "publikimi" = rritet CACHE te sw.js dhe v te versioni.js.
const { chromium } = require('./pw.js');
const fs = require('fs'), path = require('path'), os = require('os'), { spawn, execSync } = require('child_process');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = path.resolve(__dirname, '..');
const prit = (fn, ms = 10000) => new Promise(async z => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn().catch(() => false)) return z(true); await new Promise(r => setTimeout(r, 200)); } z(false); });
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
(async () => {
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'stoku-v362-'));
  execSync(`cd "${RR}" && git ls-files -z | grep -zv '^teste/' | grep -zv '^vendas/' | grep -zv '^ora/' | xargs -0 cp --parents -t "${D}"`, { shell: '/bin/bash' });
  // Skedarët e ndryshuar por ende pa commit (gjatë punës)
  ['sw.js', 'versioni.js', 'index.html', 'pc.html', 'app-tel.js', 'app-pc.js', 'fillimi-tel.js', 'fillimi-pc.js', 'SHENIME.md'].forEach(f => fs.copyFileSync(path.join(RR, f), path.join(D, f)));
  const PORT = 8792, BAZA = 'http://127.0.0.1:' + PORT;
  const srv = spawn('python3', [path.join(__dirname, 'server-cloudflare.py'), String(PORT), D], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const V0 = Number(/var CACHE = 'stoku-v(\d+)'/.exec(fs.readFileSync(path.join(D, 'sw.js'), 'utf8'))[1]);
  ok(V0 === require(path.join(RR, 'versioni.js')).v, '0. CACHE te sw.js = v te versioni.js (krahasimi i v362 mbështetet te kjo)', V0);
  function publiko(v) {
    const sw = path.join(D, 'sw.js'), ve = path.join(D, 'versioni.js');
    fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/var CACHE = 'stoku-v\d+'/, "var CACHE = 'stoku-v" + v + "'"));
    fs.writeFileSync(ve, fs.readFileSync(ve, 'utf8').replace(/v: \d+,/, 'v: ' + v + ','));
    // versioni.js me ?v= të ri (si në çdo publikim), që faqja e re ta marrë nga interneti
    ['index.html', 'pc.html'].forEach(f => { const p = path.join(D, f); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/versioni\.js\?v=\d+/, 'versioni.js?v=' + v)); });
    fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/\.\/versioni\.js\?v=\d+/, './versioni.js?v=' + v));
  }
  const b = await chromium.launch();
  let v = V0;
  for (const pc of [false, true]) {
    const em = pc ? 'PC' : 'tel';
    const ctx = await b.newContext(pc ? { viewport: { width: 1440, height: 900 } } : { userAgent: UA, viewport: { width: 390, height: 844 }, hasTouch: true });
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    // Gjendja e ekranit në çastin kur faqja sapo është ndërtuar (para se të zbehet)
    await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
      const h = document.documentElement, s = getComputedStyle(h, '::after');
      window.__neHapje = { ekrani: h.classList.contains('stk-perditesim'), stili: [s.position, s.zIndex, s.backgroundImage.includes('stoku-icon.svg')] };
    }));
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => { if (!/firebasejs/.test(e.message)) gab.push(e.message); }); // Firebase këtu është bosh
    let ngarkime = 0; p.on('load', () => ngarkime++);
    const faqja = BAZA + '/' + (pc ? 'pc.html' : 'index.html');
    await p.goto(faqja);
    ok(await prit(() => p.evaluate(() => !!navigator.serviceWorker.controller), 20000), '1. ' + em + ': service worker-i u instalua');
    await p.waitForTimeout(800);
    // ---- 1. Versioni i ri del; Stoku hapet sërish (faqja nga interneti = e reja) ----
    publiko(++v);
    ngarkime = 0;
    await p.goto(faqja);
    ok(await p.evaluate(() => window.StokuVersioni.v), '1. ' + em + ': faqja u hap direkt me versionin e ri');
    ok(await prit(() => p.evaluate(x => caches.keys().then(k => k.includes('stoku-v' + x)), v), 20000), '1. ' + em + ': service worker-i i ri u aktivizua', v);
    await p.waitForTimeout(3000);
    ok(ngarkime === 1, '1. ' + em + ': faqja s\'u rindez prapë pas përditësimit (më parë: logoja dhe krejt nga fillimi)', ngarkime);
    ok(!(await p.evaluate(() => document.documentElement.classList.contains('stk-perditesim'))), '1. ' + em + ': pa ekranin e përditësimit');
    // ---- 2. Stoku i hapur; del versioni i ri pa e rihapur ----
    publiko(++v);
    ngarkime = 0;
    const vPara = await p.evaluate(() => window.StokuVersioni.v);
    await p.evaluate(() => { window.__ekrani = []; new MutationObserver(() => { if (document.documentElement.classList.contains('stk-perditesim')) window.__ekrani.push(1); }).observe(document.documentElement, { attributes: true }); });
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    ok(await prit(async () => ngarkime >= 1, 25000), '2. ' + em + ': faqja e vjetër u rindez një herë për versionin e ri', ngarkime);
    await p.waitForLoadState('load');
    ok((await p.evaluate(() => window.StokuVersioni.v)) === v && vPara === v - 1, '2. ' + em + ': tani versioni i ri', [vPara, v]);
    const nh = await p.evaluate(() => window.__neHapje);
    ok(nh && nh.ekrani, '2. ' + em + ': pas rindezjes del ekrani i përditësimit (logoja + rrethi), jo faqja duke u ndërtuar', nh);
    ok(nh && nh.stili[0] === 'fixed' && Number(nh.stili[1]) > 1e9 && nh.stili[2], '2. ' + em + ': ekrani mbulon krejt faqen me logon', nh && nh.stili);
    if (!pc) { await p.evaluate(() => document.documentElement.classList.add('stk-perditesim')); await p.waitForTimeout(200); await p.screenshot({ path: path.join(__dirname, 'v362-ekrani.png') }); await p.evaluate(() => document.documentElement.classList.remove('stk-perditesim')); }
    ok(await prit(() => p.evaluate(() => !document.documentElement.classList.contains('stk-perditesim')), 4000), '2. ' + em + ': ekrani zbehet vetë kur faqja është gati');
    ok(await p.evaluate(() => { try { return sessionStorage.getItem('stoku:perditesimi') === null; } catch (e) { return false; } }), '2. ' + em + ': shenja u hoq (rifreskimi i radhës pa ekran)');
    await p.waitForTimeout(2500);
    ok(ngarkime === 1, '2. ' + em + ': vetëm një rindezje', ngarkime);
    ok(!gab.length, em + ': pa gabime JS', gab);
    await ctx.close();
  }
  await b.close(); srv.kill();
  try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) { /* ok */ }
  console.log(g ? 'GABIME: ' + g : 'TË GJITHA OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.log('GABIM ' + (e && e.stack || e)); process.exit(1); });

// v305 (kontrolli i plotë): njoftimi ditor ndizej vetë sa herë hapej Stoku (v304), edhe pasi përdoruesi e kishte fikur.
// Tani vetëm një herë për llogari: web (app-tel.js, KEY_NJ_DITOR_AUTO) dhe Android (ndizDitorinNjeHere, pref "ditori_auto").
const pw = require('./pw.js'); pw.meNjoftime = true;
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fsN = require('fs');
const R = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const PUSH = 'https://stoku-push.mendurb.workers.dev';
(async () => {
  const lexo = f => fsN.readFileSync(R + f, 'utf8');
  const tel = lexo('app-tel.js'), kt = lexo('vendas/app/src/main/java/site/stoku/vendas/ui/NjoftimetUI.kt');
  ok(/KEY_NJ_DITOR_AUTO = 'stoku:nj:ditor-auto'/.test(tel) && /if \(bere === u\.uid\) return;/.test(tel) && /if \(e\.orariIm\(\)\) \{ sheno\(\); return; \}/.test(tel), '0. web: njoftimi ditor ndizet vetë vetëm një herë për llogari');
  ok(/private suspend fun ndizDitorinNjeHere\(\)/.test(kt) && /prefsOse\("ditori_auto", ""\) == u/.test(kt) && !/Push\.orariIm\(\) == null && Llogaria\.leja\("afatet"\)\) (try \{ )?Push\.vendosOrarin/.test(kt), '0. Android: ndizDitorinNjeHere (pa ndezjen në çdo nisje)');
  ok(/kanë skaduar e duhen hequr nga rafti, edhe kur Stoku/.test(lexo('index.html')) && /kanë skaduar e duhen hequr nga rafti, edhe kur Stoku/.test(kt), '0. teksti i "Njoftimi ditor" përmend të skaduarat');
  ok(/finally \{ gpsDukePunuar = false \}/.test(lexo('vendas/app/src/main/java/site/stoku/vendas/Merchandiseri.kt')), '0. Android: GPS-i s\'mbetet i bllokuar pas një gabimi');

  // Sjellja te web-i: me leje të dhënë, pa orar → një thirrje /orari {aktiv:true}; pas shënjës (ose pas fikjes) → asnjë
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: Date.now() });
  const b = await chromium.launch();
  const thirrjet = [];
  async function faqe(para) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); } catch (e) { /* ok */ } });
    if (para) await ctx.addInitScript(para);
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await ctx.route(u => u.href.startsWith(PUSH), r => {
      const u = new URL(r.request().url());
      if (r.request().method() === 'POST') { try { thirrjet.push({ rruga: u.pathname, trup: JSON.parse(r.request().postData() || '{}') }); } catch (e) { /* ok */ } }
      r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) });
    });
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/index.html'); await p.waitForTimeout(7000);
    return p;
  }
  // 1. Llogaria e ka shënjën (e ka pasur njoftimin ditor dhe e ka fikur): s'ndizet më vetë
  thirrjet.length = 0;
  const p1 = await faqe(() => { try { localStorage.setItem('stoku:nj:ditor-auto', 'u1'); } catch (e) { /* ok */ } });
  ok(!thirrjet.some(x => x.rruga === '/orari' && x.trup.aktiv === true), '1. me shënjën (e fikur nga përdoruesi): asnjë ndezje vetë', thirrjet.map(x => x.rruga));
  // 2. Pa shënjë: funksioni provon ta ndezë (nëse pajisja ka push) ose s'bën asgjë; kurrë më shumë se një herë
  thirrjet.length = 0;
  const p2 = await faqe(null);
  const n2 = thirrjet.filter(x => x.rruga === '/orari' && x.trup.aktiv === true).length;
  ok(n2 <= 1, '2. pa shënjë: më së shumti një ndezje', n2);
  const gab = [p1, p2].flatMap(x => x.__gab || []);
  ok(!gab.length, '3. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

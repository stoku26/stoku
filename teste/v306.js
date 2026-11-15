// v306 (kontrolli i plotë i projektit): (1) njoftimi ditor s'ndizej kurrë vetë te web-i për ata që e kishin lejen e njoftimeve:
// kushti kontrollohej kur ngarkohej faqja, para Firebase-it (përdoruesi = null). Tani pas 4 s dhe pas çdo hyrjeje.
// (2) VERSIONI_WORKER 172 (si Android), (3) teksti "s'skadon dhe s'ka skaduar", (4) "Zgjidh marketin" me pozicionin e fundit,
// (5) PC: marketet te dëgjuesi "storage" dhe te fshirjet e pa dërguara, kalendari i Grupit pa "Unë e hoqa" pa lejen.
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
  const tel = lexo('app-tel.js'), pc = lexo('app-pc.js'), ek = lexo('ekipa.js'), wk = lexo('worker/stoku-push.js');
  const vW = (wk.match(/VERSIONI_WORKER = (\d+)/) || [])[1], vE = (ek.match(/VERSIONI_WORKER: (\d+)/) || [])[1];
  const vK = (lexo('vendas/app/src/main/java/site/stoku/vendas/Push.kt').match(/VERSIONI_WORKER = (\d+)/) || [])[1];
  ok(vW && vW === vE && vE === vK, '0. VERSIONI_WORKER i njëjtë: Worker, ekipa.js, Android', [vW, vE, vK]);
  ok(/s\\'skadon dhe s\\'ka skaduar asnjë produkt/.test(tel) && !/Sot s\\'skadon asnjë produkt, prandaj/.test(tel), '0. teksti i njoftimit ditor përmend të skaduarat');
  ok(/\$\('mkZgjidh'\)\.addEventListener\('click', function \(\) \{ hapZgjedhjenEMarketit\(pozEFundit\(\)\); \}\)/.test(tel), '0. "Zgjidh marketin" s\'e jep klikimin si pozicion');
  ok(/MK\.KEY_LISTA\]\.indexOf\(e\.key\)/.test(pc) && /\['produktet', 'foldera', 'afatet', 'marketet'\]\.some/.test(pc), '0. PC: marketet te "storage" dhe te fshirjet');
  ok(/else if \(st === 'skaduar' && ekLejohetHeqja\(a\)\) \{ \/\/ v306/.test(pc), '0. PC: kalendari kontrollon lejen e heqjes');
  ok(!/perdoruesiAktual\(\) && !ngaVizitori\(\)\) setTimeout\(ndizDitorinNeseSKaOrar/.test(tel) && /function provoDitorin\(\)/.test(tel), '0. web: kushti i njoftimit ditor s\'vlerësohet më kur ngarkohet faqja');

  // Sjellja: leje e dhënë, pa orar e pa shënjë → vendosOrarin({aktiv:true}) thirret saktësisht një herë (pajisja e testit
  // s'ka push: vendosOrarin zëvendësohet me një që numëron thirrjet dhe kthen ok)
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/u1', { perdoruesi: 'agim', kycurSe: Date.now() });
  const b = await chromium.launch();
  async function faqe(para) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => {
      try { Object.defineProperty(Notification, 'permission', { get: () => 'granted' }); } catch (e) { /* ok */ }
      window.__orari = [];
      var t = setInterval(function () {
        var e = window.__stokuCloud && window.__stokuCloud.ekipa;
        if (!e || e.__ngjitur) return;
        e.__ngjitur = true; clearInterval(t);
        var orari = null;
        e.orariIm = function () { return orari; };
        e.vendosOrarin = function (o) { window.__orari.push(o); orari = o.aktiv ? { aktiv: true, ora: o.ora } : null; return Promise.resolve({ ok: true }); };
      }, 5);
    });
    if (para) await ctx.addInitScript(para);
    await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
    await ctx.route(u => u.href.startsWith(PUSH), r => r.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, fotot: {} }) }));
    await F.lidh(ctx, 'u1', 'agim@stoku-app.local', 'tel');
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(BAZA + '/index.html'); await p.waitForTimeout(9000);
    return p;
  }
  const p1 = await faqe(null);
  const o1 = await p1.evaluate(() => ({ th: window.__orari, sh: localStorage.getItem('stoku:nj:ditor-auto') }));
  ok(o1.th.filter(x => x.aktiv === true).length === 1, '1. pa shënjë: njoftimi ditor ndizet vetë saktësisht një herë', o1.th);
  ok(o1.sh === 'u1', '1. shënja ruhet për llogarinë', o1.sh);
  await p1.reload(); await p1.waitForTimeout(9000);
  const o1b = await p1.evaluate(() => window.__orari);
  ok(!o1b.length, '2. pas rihapjes (shënja ekziston): s\'ndizet sërish', o1b);
  const p2 = await faqe(() => { try { localStorage.setItem('stoku:nj:ditor-auto', 'u1'); } catch (e) { /* ok */ } });
  const o2 = await p2.evaluate(() => window.__orari);
  ok(!o2.length, '3. përdoruesi e kishte fikur (shënja): s\'ndizet', o2);
  const gab = [p1, p2].flatMap(x => x.__gab || []);
  ok(!gab.length, '4. pa gabime JS', gab);
  await b.close();
  console.log(g ? g + ' GABIME' : 'KREJT OK');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

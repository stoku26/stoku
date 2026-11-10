// v286: pronari: "bëji të tejdukshme pak, si xham… kudo që ka dritare që dalin mbi faqe" (zgjodhi shkallën C; "nëse s'më pëlqen e heqim").
//  1) telefoni: dritarja nga poshtë, menyja e eksportit dhe njoftimi i shkurtër janë gjysmë të tejdukshëm me turbullim (të dy temat);
//     faqet e plota (Afatet, Grupi) dhe Cilësimet mbeten me ngjyrë të plotë; teksti i dritares mbetet i lexueshëm (ngjyra e plotë);
//  2) blloku te css/stoku.css është i vetëm dhe i shënuar (hiqet lehtë); 3) versionet.
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
(async () => {
  const b = await chromium.launch();
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  const AF = [['Kos', -2], ['Qumësht', 0], ['Djathë', 4]].map((x, i) => ({ id: 'a' + i, emri: x[0], barkodi: '38900' + i, data: d(x[1]), sasia: 3, statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t }));
  for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 800 }, serviceWorkers: 'block', colorScheme: tema });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await ctx.addInitScript(([af, tema]) => {
      if (location.protocol !== 'http:') return;
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't', merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), ruaj: async () => ({ ok: true }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:te-rejat:pare', '999'); localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); localStorage.setItem('stoku:tema', tema);
      if (!localStorage.getItem('__n')) { localStorage.setItem('__n', '1'); localStorage.setItem('stoku:afatet:v1', JSON.stringify(af)); }
    }, [AF, tema]);
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForTimeout(2500);
    const alfa = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const x = m[1].split(',').map(Number); return x.length > 3 ? x[3] : 1; };
    const stili = sel => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return { bg: c.backgroundColor, bf: c.backdropFilter || c.webkitBackdropFilter || '', tx: c.color }; }, sel);
    await p.click('#btnAfatet'); await p.waitForTimeout(700);
    const faqja = await stili('#dlgAfatet > *');
    ok(faqja && alfa(faqja.bg) !== 0.6 && !/blur/.test(faqja.bf) && (await p.evaluate(() => document.getElementById('dlgAfatet').classList.contains('faqe-e-plote'))), '1. ' + tema + ': faqja e plotë e Afateve mbetet me ngjyrë të plotë', faqja);
    await p.click('#afShto'); await p.waitForTimeout(700);
    const dr = await stili('#dlgAfat > .dialog'), mb = await stili('#dlgAfat');
    ok(dr && Math.abs(alfa(dr.bg) - 0.6) < 0.02 && /blur\(28px\)/.test(dr.bf), '1. ' + tema + ': dritarja "Afat i ri" është xham (60% + turbullim 28 px)', dr);
    ok(alfa(dr.tx) === 1, '1. ' + tema + ': teksti i dritares mbetet me ngjyrë të plotë', dr.tx);
    ok(mb && alfa(mb.bg) < 0.4, '1. ' + tema + ': hija mbi faqe është më e lehtë (që xhami të duket)', mb.bg);
    await p.evaluate(() => document.getElementById('dlgAfat').classList.remove('hapur')); await p.waitForTimeout(300);
    await p.click('#afExcel'); await p.waitForTimeout(400);
    const me = await stili('#afExcelMenu');
    ok(me && Math.abs(alfa(me.bg) - 0.6) < 0.02 && /blur/.test(me.bf), '1. ' + tema + ': menyja e eksportit është xham', me);
    await p.keyboard.press('Escape'); await p.evaluate(() => document.body.click());
    const to = await stili('#toast');
    ok(to && alfa(to.bg) < 0.9 && alfa(to.bg) > 0.6 && /blur/.test(to.bf), '1. ' + tema + ': njoftimi i shkurtër është xham i lehtë', to);
    const op = await stili('#dlgOpsione .dialog');
    ok(op && alfa(op.bg) === 1, '1. ' + tema + ': Cilësimet (faqe) mbeten me ngjyrë të plotë', op && op.bg);
    ok(!gab.length, '1. ' + tema + ' pa gabime JS', gab);
    await ctx.close();
  }
  // 2) blloku i vetëm, i shënuar
  const css = fs.readFileSync(__dirname + '/../css/stoku.css', 'utf8');
  const a = css.indexOf('v286: XHAMI'), f = css.lastIndexOf('FUNDI I XHAMIT');
  ok(a > 0 && f > a && css.slice(0, a).indexOf('--sb-xham') === -1 && css.slice(f).indexOf('--sb-xham') === -1 && /@supports \(\(backdrop-filter/.test(css.slice(a, f)), '2. xhami është një bllok i vetëm te css/stoku.css (hiqet lehtë), vetëm ku njihet backdrop-filter');
  // 3) versionet
  const sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8'), ix = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const nr = (s, rx) => Number((s.match(rx) || [])[1]);
  ok(nr(sw, /stoku-v(\d+)/) >= 286 && nr(sw, /css\/stoku\.css\?v=(\d+)/) >= 64 && nr(ix, /css\/stoku\.css\?v=(\d+)/) === nr(sw, /css\/stoku\.css\?v=(\d+)/), '3. versionet (CACHE ≥ 286, stoku.css njësoj te index.html dhe sw.js)');
  ok(/\{ v: 286,[^\n]*platforma: 'tel'/.test(fs.readFileSync(__dirname + '/../teRejat.js', 'utf8')), '3. teRejat v286 (tel)');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

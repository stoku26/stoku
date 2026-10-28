// v261: votim më i rreptë (kërkesa: "Votim më i rreptë"): 5 lexime të njëjta nga deri në 10 brenda 1 s (më parë 3 nga 5).
// 1. rregulli: 4 të njëjta s'mjaftojnë (pritet sekonda), i 5-ti fiton; me 10 lexime fiton ai në krye vetëm kur është i vetëm;
// 2. kamera e rreme: 5 herë A → dritarja hapet menjëherë (para se të mbarojë sekonda); 4 herë A → vetëm pas sekondës;
//    B + 4 A → s'hapet B; 3. versionet dhe "Çka ka të re" v261.
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const BAZA = process.env.STOKU_B || 'http://127.0.0.1:8765';
const A = '3800001000019', B = '3800001000026', C = '3800001000033'; // EAN-13 me shifër kontrolli të saktë

(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'mendurberisha', emri: 'mendurberisha', kycurSe: Date.now() });
  const gabimet = [];
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.grantPermissions(['camera'], { origin: BAZA });
  await ctx.route(u => !u.href.startsWith(BAZA), r => r.abort());
  await F.lidh(ctx, 'uA', 'mendurberisha@stoku-app.local', 'tel');
  await ctx.addInitScript(() => {
    try { localStorage.setItem('stoku:njoftimet:pyetur', '1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'uA', emri: 'mendurberisha' })); localStorage.setItem('stoku:pronari-uid', 'uA'); } catch (e) {}
    // BarcodeDetector i rremë: leximet nga window.__leximet; koha e leximit të parë dhe e hapjes së dritares
    window.__leximet = []; window.__tPare = 0;
    window.BarcodeDetector = class { constructor() {} static async getSupportedFormats() { return ['ean_13']; }
      async detect() { const x = window.__leximet.length ? window.__leximet.shift() : null; if (x && !window.__tPare) window.__tPare = performance.now();
        return x ? [{ rawValue: x[0], format: x[1], boundingBox: { x: 0, y: 0, width: 10, height: 10 } }] : []; } };
    window.addEventListener('DOMContentLoaded', () => {
      const d = document.getElementById('dlgProdukt');
      new MutationObserver(() => { if (d.classList.contains('hapur') && !window.__tDritare) window.__tDritare = performance.now(); }).observe(d, { attributes: true, attributeFilter: ['class'] });
    });
  });
  const p = await ctx.newPage(); p.on('pageerror', e => gabimet.push(e.message));
  await p.goto(BAZA + '/index.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));

  // 1. Rregulli
  const r = await p.evaluate(([A, B, C]) => {
    const lexo = (v, l, t0) => l.map((k, i) => v.shto(k, 'EAN_13', true, (t0 || 0) + i * 40)), q = x => x && x.kodi ? x.kodi : x;
    const o = {}; let v;
    v = StokuVotimi(); o.kater = lexo(v, [A, A, A, A]).map(q).concat([v.aktiv(), q(v.shto(A, 'EAN_13', true, 160))]);
    v = StokuVotimi(); o.barazim = lexo(v, [A, B, A, B, A, B, A, B, C, C]).map(q).concat([q(v.shto(A, 'EAN_13', true, 400))]);
    v = StokuVotimi(); o.dhjete = lexo(v, [A, B, C, A, B, C, A, B, C, A]).map(q);
    v = StokuVotimi(); lexo(v, [A, A, A, A]); o.mbarimi = [q(v.skado(999)), q(v.skado(1000))];
    return o;
  }, [A, B, C]);
  ok(JSON.stringify(r.kater) === JSON.stringify([null, null, null, null, true, A]), '1. 4 lexime të njëjta s\'mjaftojnë; i 5-ti fiton', r.kater);
  ok(JSON.stringify(r.barazim) === JSON.stringify(Array(10).fill(null).concat([A])), '1. 10 lexime me barazim (A=4, B=4): pritet; A fiton kur arrin 5', r.barazim);
  ok(JSON.stringify(r.dhjete) === JSON.stringify([null, null, null, null, null, null, null, null, null, A]), '1. 10 lexime: A=4 vetëm në krye → A', r.dhjete);
  ok(JSON.stringify(r.mbarimi) === JSON.stringify([null, A]), '1. 4 lexime pa të 5-tin: A kur mbaron sekonda', r.mbarimi);

  // 2. Kamera e rreme
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  async function skano(leximet, pritje) {
    await p.evaluate(l => { window.__leximet = l.slice(); window.__tPare = 0; window.__tDritare = 0; }, leximet);
    await p.click('#btnKamera');
    await p.waitForTimeout(pritje);
    return p.evaluate(() => ({ dialogu: document.getElementById('dlgProdukt').classList.contains('hapur'), kodi: document.getElementById('dlgKodi').textContent,
      pas: window.__tDritare && window.__tPare ? Math.round(window.__tDritare - window.__tPare) : null }));
  }
  async function mbyllDialogun() { await p.evaluate(() => document.getElementById('dlgProdukt').classList.remove('hapur')); await p.waitForTimeout(200); }

  let s = await skano(Array(5).fill([A, 'ean_13']), 1800);
  ok(s.dialogu && s.kodi.includes(A) && s.pas !== null && s.pas < 700, '2a. 5 herë A: hapet menjëherë (para se të mbarojë sekonda)', s);
  await mbyllDialogun();
  s = await skano(Array(4).fill([A, 'ean_13']), 1800);
  ok(s.dialogu && s.kodi.includes(A) && s.pas !== null && s.pas >= 950, '2b. 4 herë A: hapet vetëm pas sekondës', s);
  await mbyllDialogun();
  s = await skano([[B, 'ean_13']].concat(Array(4).fill([A, 'ean_13'])), 1800);
  ok(s.dialogu && s.kodi.includes(A) && !s.kodi.includes(B), '2c. B pastaj 4 herë A: hapet A, jo B', s);
  await mbyllDialogun();

  // 3. Versionet
  const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
  ok(Number((sw.match(/stoku-v(\d+)/) || [])[1]) >= 261 && /app-tel\.js\?v=261/.test(sw) && /teRejat\.js\?v=261/.test(sw), '3. CACHE ≥ 261, app-tel.js?v=261, teRejat.js?v=261');
  const tr = await p.evaluate(() => fetch('teRejat.js?v=261').then(x => x.text()));
  ok(/\{ v: 261,[^\n]*platforma: 'tel'/.test(tr), '3. teRejat v261 (telefon)');

  ok(!gabimet.length, '4. pa gabime JS', gabimet);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

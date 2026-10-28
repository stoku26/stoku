// v260: votimi i leximeve të kamerës (app-tel.js krijoVotimin; Android: VotimiIBarkodit te vendas/logjika, VotimiTest.kt me
// të njëjtat raste). Brenda 1 s deri në 5 lexime; fiton ai që doli më shpesh: 3 vota menjëherë, pas 5 leximeve ai në krye
// (me barazim pritet), në mbarim ai në krye (barazim: i sigurti, pastaj i pari); 1 votë vetëm kur është EAN/UPC i sigurt.
// Pjesa 2: kamera e rreme (Chromium) + BarcodeDetector i rremë me lexime të përgatitura: leximi i gabuar s'kalon, kamera e
// mbyllur s'hap më dritaren, një lexim i vetëm pa shifër kontrolli s'pranohet.
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
    // BarcodeDetector i rremë: çdo thirrje e detect() merr leximin e radhës nga window.__leximet ([kodi, formati] ose null)
    window.__leximet = []; window.__thirrje = 0;
    window.BarcodeDetector = class { constructor() {} static async getSupportedFormats() { return ['ean_13', 'code_128']; }
      async detect() { window.__thirrje++; const x = window.__leximet.length ? window.__leximet.shift() : null; return x ? [{ rawValue: x[0], format: x[1], boundingBox: { x: 0, y: 0, width: 10, height: 10 } }] : []; } };
  });
  const p = await ctx.newPage(); p.on('pageerror', e => gabimet.push(e.message));
  await p.goto(BAZA + '/index.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(d => { if (!d.classList.contains('faqe-e-plote')) d.classList.remove('hapur'); }));

  // 1. Rregulli (si VotimiTest.kt)
  const r = await p.evaluate(([A, B, C]) => {
    const o = {}; let v;
    v = StokuVotimi(); o.tre = [v.shto(A, 'EAN_13', true, 0), v.shto(A, 'EAN_13', true, 40), v.shto(A, 'EAN_13', true, 80), v.aktiv()];
    v = StokuVotimi(); o.gabimi = [v.shto(B, 'EAN_13', true, 0), v.shto(A, 'EAN_13', true, 40), v.shto(A, 'EAN_13', true, 80), v.shto(A, 'EAN_13', true, 120)];
    v = StokuVotimi(); o.pese = [A, B, A, C].map((k, i) => v.shto(k, 'EAN_13', true, i * 40)).concat([v.shto('4000000000000', 'EAN_13', false, 160)]);
    v = StokuVotimi(); o.barazim = [A, B, A, B, C].map((k, i) => v.shto(k, 'EAN_13', true, i * 40)).concat([v.shto(C, 'EAN_13', true, 200), v.shto(B, 'EAN_13', true, 240)]);
    v = StokuVotimi(); [A, B, A, B].forEach((k, i) => v.shto(k, 'EAN_13', true, i * 40)); o.mbarimi = [v.skado(999), v.skado(1000)];
    v = StokuVotimi(); o.nje = [v.shto(A, 'EAN_13', true, 0), v.mbetur(0), v.mbetur(700), v.skado(999), v.skado(1000), v.aktiv()];
    v = StokuVotimi(); o.code128 = [v.shto('ABC-123', 'CODE_128', false, 0), v.skado(1000), v.aktiv(), v.shto('ABC-123', 'CODE_128', false, 1100), v.shto('ABC-123', 'CODE_128', false, 1150), v.skado(2100)];
    v = StokuVotimi(); o.iSigurti = [v.shto('ABC-123', 'CODE_128', false, 0), v.shto(A, 'EAN_13', true, 40), v.skado(1000)];
    v = StokuVotimi(); o.skadoi = [v.shto(A, 'EAN_13', true, 0), v.shto(B, 'EAN_13', true, 1200), v.aktiv(), v.skado(2200)];
    v = StokuVotimi(); v.shto(A, 'EAN_13', true, 0); v.shto(A, 'EAN_13', true, 40); v.rinis(); o.rinis = [v.aktiv(), v.shto(A, 'EAN_13', true, 80)];
    return JSON.parse(JSON.stringify(o, (k, x) => x && x.kodi ? x.kodi : x));
  }, [A, B, C]);
  ok(JSON.stringify(r.tre) === JSON.stringify([null, null, A, false]), '1. 3 lexime të njëjta: fiton menjëherë', r.tre);
  ok(JSON.stringify(r.gabimi) === JSON.stringify([null, null, null, A]), '1. leximi i gabuar (B) humbet ndaj A-së', r.gabimi);
  ok(JSON.stringify(r.pese) === JSON.stringify([null, null, null, null, A]), '1. pas 5 leximeve fiton ai në krye (A=2)', r.pese);
  ok(JSON.stringify(r.barazim) === JSON.stringify([null, null, null, null, null, null, B]), '1. me barazim pritet; B me 3 vota fiton', r.barazim);
  ok(JSON.stringify(r.mbarimi) === JSON.stringify([null, A]), '1. barazim në mbarim: fiton i pari', r.mbarimi);
  ok(JSON.stringify(r.nje) === JSON.stringify([null, 1000, 300, null, A, false]), '1. 1 lexim EAN i sigurt: pranohet kur mbaron sekonda', r.nje);
  ok(JSON.stringify(r.code128) === JSON.stringify([null, null, false, null, null, 'ABC-123']), '1. 1 lexim pa shifër kontrolli: s\'pranohet; 2 të njëjta: po', r.code128);
  ok(JSON.stringify(r.iSigurti) === JSON.stringify([null, null, A]), '1. barazim: fiton i sigurti', r.iSigurti);
  ok(JSON.stringify(r.skadoi) === JSON.stringify([null, A, true, B]), '1. votimi që skadoi vendoset te leximi i radhës', r.skadoi);
  ok(JSON.stringify(r.rinis) === JSON.stringify([false, null]), '1. rinisja', r.rinis);

  // 2. Kamera me lexime të përgatitura
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  async function skano(leximet, pritje) {
    await p.evaluate(l => { window.__leximet = l.slice(); window.__thirrje = 0; }, leximet);
    await p.click('#btnKamera');
    await p.waitForTimeout(pritje);
    return p.evaluate(() => ({ dialogu: document.getElementById('dlgProdukt').classList.contains('hapur'), kodi: document.getElementById('dlgKodi').textContent,
      kamera: document.getElementById('kamera').classList.contains('hapur'), thirrje: window.__thirrje, mbetur: window.__leximet.length }));
  }
  async function mbyllDialogun() { await p.evaluate(() => document.getElementById('dlgProdukt').classList.remove('hapur')); await p.waitForTimeout(200); }

  let s = await skano([[B, 'ean_13'], [A, 'ean_13'], [A, 'ean_13'], [A, 'ean_13']], 1800);
  ok(s.thirrje >= 4, '2a. kamera e rreme punon (detect() u thirr)', s.thirrje);
  ok(s.dialogu && s.kodi.includes(A) && !s.kodi.includes(B) && !s.kamera, '2a. B (i gabuar) pastaj 3 herë A: hapet A', s);
  await mbyllDialogun();

  s = await skano([[A, 'ean_13']], 1800);
  ok(s.dialogu && s.kodi.includes(A), '2b. një lexim EAN i sigurt: hapet pas sekondës', s);
  await mbyllDialogun();

  s = await skano([['ABC-123', 'code_128']], 1800);
  ok(!s.dialogu && s.kamera, '2c. një lexim Code 128 i vetëm: s\'pranohet, kamera mbetet', s);
  await p.click('#mbyllKamere'); await p.waitForTimeout(300);

  s = await skano([['ABC-123', 'code_128'], ['ABC-123', 'code_128']], 1800);
  ok(s.dialogu && s.kodi.includes('ABC-123'), '2d. Code 128 dy herë: pranohet', s);
  await mbyllDialogun();

  // 2e. Kamera mbyllet para se të vendoset votimi: dritarja s'hapet më vonë
  await p.evaluate(l => { window.__leximet = l.slice(); }, [[C, 'ean_13']]);
  await p.click('#btnKamera'); await p.waitForTimeout(400);
  await p.click('#mbyllKamere'); await p.waitForTimeout(1500);
  const e = await p.evaluate(() => ({ dialogu: document.getElementById('dlgProdukt').classList.contains('hapur'), kamera: document.getElementById('kamera').classList.contains('hapur') }));
  ok(!e.dialogu && !e.kamera, '2e. kamera e mbyllur para vendimit: pa dritare', e);

  // 3. Versionet
  const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
  ok(Number((sw.match(/stoku-v(\d+)/) || [])[1]) >= 260 && /app-tel\.js\?v=260/.test(sw), '3. CACHE ≥ 260, app-tel.js?v=260');
  const tr = await p.evaluate(() => fetch('teRejat.js?v=260').then(x => x.text()));
  ok(/\{ v: 260,[^\n]*platforma: 'tel'/.test(tr), '3. teRejat v260 (telefon)');

  ok(!gabimet.length, '4. pa gabime JS', gabimet);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

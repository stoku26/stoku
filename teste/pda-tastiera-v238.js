// v238: PDA "Fshih tastierën" aktiv: tastiera në ekran s'del askund (fushat e reja para fokusit, prekja e dytë, aplikacioni Android)
const { chromium } = require('./pw.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = process.env.STOKU_B || 'http://127.0.0.1:8765';
const MOCK = () => {
  window.__stokuCloud = { authGati: true, perdoruesiAktual: () => null, token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
    degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {}, hyr: async () => ({ ok: false }), regjistrohu: async () => ({ ok: false }) };
  // aplikacioni Android (APK e re): ura me thirrjet e tastierës
  window.__ura = []; window.StokuAndroid = { versioni: () => 200, tastieraFshehur: po => window.__ura.push('fshehur:' + po), fshihTastieren: () => window.__ura.push('fshih') };
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 11; TC26) Chrome/140 Mobile', viewport: { width: 360, height: 640 }, serviceWorkers: 'block', hasTouch: true });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await ctx.addInitScript(MOCK);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('stoku:opsione:v1')) localStorage.setItem('stoku:opsione:v1', JSON.stringify({ pda: true, tastieraFshehur: true })); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(1500);
  // porta (para hyrjes): edhe fushat e saj
  const porta = await p.evaluate(() => ['pkEmri', 'pkFjalekalimi'].map(id => { const e = document.getElementById(id); return e && e.getAttribute('inputmode'); }));
  ok(porta.every(x => x === 'none'), '1. porta: emri dhe fjalëkalimi pa tastierë në ekran', porta);
  await p.click('#pkVizitor'); await p.waitForTimeout(1800);
  ok(await p.evaluate(() => window.__ura.includes('fshehur:true')), '2. aplikacioni Android: i thuhet që tastiera është e fshehur', await p.evaluate(() => window.__ura));
  // fushë e re (si një dritare që krijohet dhe fokusohet menjëherë): inputmode="none" para fokusit
  const ri = await p.evaluate(() => new Promise(z => { const d = document.createElement('div'); d.innerHTML = '<input id="fRe" type="text"><textarea id="tRe"></textarea>'; document.body.appendChild(d);
    setTimeout(() => z([document.getElementById('fRe').getAttribute('inputmode'), document.getElementById('tRe').getAttribute('inputmode')]), 30); }));
  ok(ri[0] === 'none' && ri[1] === 'none', '3. fushat e reja e marrin inputmode="none" pa u prekur', ri);
  // prekja e dytë në një fushë tashmë të fokusuar: readonly për një çast + mbyllja nga Android-i
  await p.click('.folder-karta >> nth=0'); await p.waitForTimeout(500);
  await p.tap('#barkodi'); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__ura.length = 0; });
  const ro = await p.evaluate(() => new Promise(z => { const e = document.getElementById('barkodi'); e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); z(e.readOnly); }));
  await p.waitForTimeout(400);
  ok(ro === true && await p.evaluate(() => !document.getElementById('barkodi').readOnly), '4. prekja e dytë: readonly për 120 ms, pastaj sërish e shkrueshme', ro);
  ok(await p.evaluate(() => window.__ura.filter(x => x === 'fshih').length >= 2), '4. ... dhe Android-i e mbyll tastierën (disa herë)', await p.evaluate(() => window.__ura));
  // tastiera fizike (skaneri) shkruan normalisht
  await p.focus('#barkodi'); await p.keyboard.type('3800123');
  ok((await p.inputValue('#barkodi')) === '3800123', '5. tastiera fizike / skaneri shkruan', await p.inputValue('#barkodi'));
  // fikja: fushat kthehen
  await p.evaluate(() => { const c = document.getElementById('opsTastiera'); c.checked = false; c.dispatchEvent(new Event('change')); }); await p.waitForTimeout(300);
  const pas = await p.evaluate(() => [document.getElementById('barkodi').getAttribute('inputmode'), window.__ura.includes('fshehur:false')]);
  ok(pas[0] !== 'none' && pas[1], '6. "Shfaq tastierën": fushat kthehen, Android-it i thuhet', pas);
  const ri2 = await p.evaluate(() => new Promise(z => { const d = document.createElement('div'); d.innerHTML = '<input id="fRe2">'; document.body.appendChild(d); setTimeout(() => z(document.getElementById('fRe2').getAttribute('inputmode')), 30); }));
  ok(ri2 === null, '6. fushat e reja pa ndryshim kur tastiera lejohet', ri2);
  ok(!gab.length, 'pa gabime JavaScript', gab);
  await b.close();
  console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
  process.exit(g ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

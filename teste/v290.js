// v290: pronari (5 foto):
//  1) "Kërko heqje nga rafti": vetëm të skaduarat (pa tabin "Produktet e mia"), telefon + PC;
//  2) "Asnjë produkt i skaduar në raft." pa "Shumë mirë!" kudo;
//  3) (Android: zbehja në skajet e rreshtave me çipa, si te web-i; s'provohet këtu);
//  4) "Shto" te Afatet hap direkt skanimin; pas barkodit del "Afat i ri" me barkodin; ✕ s'hap asgjë; pa kamerë → forma direkt;
//  5) kutia e skanerit lart, menjëherë nën kontrollet (edhe kamera e zakonshme), leximi ndjek kutinë.
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../';
(async () => {
  // 2) "Shumë mirë" s'mbetet askund
  const burimet = ['app-tel.js', 'app-pc.js', 'index.html', 'pc.html', 'ekipa.js', 'vendas/app/src/main/java/site/stoku/vendas/ui/GrupiEkrani.kt', 'vendas/app/src/main/java/site/stoku/vendas/ui/AfatetEkrani.kt'];
  const me = burimet.filter(f => /Shumë mirë/.test(fs.readFileSync(RR + f, 'utf8')));
  ok(!me.length, '2. "Shumë mirë" s\'gjendet më në kod', me);
  // 1) zgjedhësi: pa tabe; pa të skaduara → mesazhi
  const EK = require('../ekipa.js');
  const paKomente = t => t.split('\n').map(r => r.replace(/\/\/.*$/, '')).join('\n'); // vetëm kodi, jo komentet
  ok(!/Produktet e mia/.test(paKomente(fs.readFileSync(RR + 'ekipa.js', 'utf8'))) && !/Produktet e mia/.test(paKomente(fs.readFileSync(RR + 'vendas/app/src/main/java/site/stoku/vendas/ui/GrupiEkrani.kt', 'utf8'))), '1. tabi "Produktet e mia" s\'ekziston më (web + Android)');

  const { b, p } = await hapFaqen(chromium);
  // 5) kutia e skanerit lart (kamera e zakonshme, nga folderi)
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  await p.evaluate(() => { window.__leximet = []; });
  await p.click('#btnKamera'); await p.waitForTimeout(900);
  const k = await p.evaluate(() => { const r = document.querySelector('.skan-korniza').getBoundingClientRect(), m = document.getElementById('mbyllKamere').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: innerHeight, kontrollet: Math.round(m.bottom) }; });
  ok(k.top >= k.kontrollet && k.top <= k.kontrollet + 40 && k.top < k.h * 0.25, '5. kutia e barkodit lart, menjëherë nën kontrollet (jo në mes)', k);
  await p.click('#mbyllKamere'); await p.waitForTimeout(300);
  await p.click('#btnMbrapa').catch(() => {}); await p.waitForTimeout(400);
  // 4) "Shto": kamera e para; ✕ s'hap asgjë
  await p.click('#btnAfatet'); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__leximet = []; });
  await p.click('#afShto'); await p.waitForTimeout(900);
  let st = await p.evaluate(() => ({ kamera: document.getElementById('kamera').classList.contains('hapur'), forma: document.getElementById('dlgAfat').classList.contains('hapur') }));
  ok(st.kamera && !st.forma, '4. "Shto" hap direkt skanimin (jo formën)', st);
  await p.click('#mbyllKamere'); await p.waitForTimeout(500);
  st = await p.evaluate(() => ({ kamera: document.getElementById('kamera').classList.contains('hapur'), forma: document.getElementById('dlgAfat').classList.contains('hapur') }));
  ok(!st.kamera && !st.forma, '4. ✕ te kamera: s\'hapet asgjë', st);
  // pas barkodit: "Afat i ri" me barkodin, fokusi te emri
  await p.evaluate(() => { for (let i = 0; i < 9; i++) window.__leximet.push(['3830000622349', 'ean_13', 'brenda']); });
  await p.click('#afShto');
  await p.waitForFunction(() => document.getElementById('dlgAfat').classList.contains('hapur'), null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(400);
  st = await p.evaluate(() => ({ kamera: document.getElementById('kamera').classList.contains('hapur'), forma: document.getElementById('dlgAfat').classList.contains('hapur'),
    titulli: document.getElementById('afatTitulli').textContent, barkodi: document.getElementById('afatBarkodi').value, fokus: document.activeElement && document.activeElement.id }));
  ok(!st.kamera && st.forma && st.titulli === 'Afat i ri' && st.barkodi === '3830000622349' && /afatEmri|afatData/.test(st.fokus), '4. pas barkodit: "Afat i ri" me barkodin, gati për emrin / datën', st);
  // ruhet si zakonisht
  await p.fill('#afatEmri', 'Ujë Radenska'); await p.fill('#afatData', '31-12-27'); await p.click('#afatRuaj'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('stoku:afatet:v1') || '[]').some(a => a.barkodi === '3830000622349' && a.emri === 'Ujë Radenska' && a.data === '2027-12-31')), '4. afati ruhet me barkodin e skanuar');
  // pa kamerë: forma direkt
  await p.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('pa kamerë')); });
  await p.click('#afShto');
  await p.waitForFunction(() => document.getElementById('dlgAfat').classList.contains('hapur'), null, { timeout: 8000 }).catch(() => {});
  st = await p.evaluate(() => ({ kamera: document.getElementById('kamera').classList.contains('hapur'), forma: document.getElementById('dlgAfat').classList.contains('hapur'), barkodi: document.getElementById('afatBarkodi').value }));
  ok(!st.kamera && st.forma && st.barkodi === '', '4. kamera s\'hapet → forma direkt, si më parë', st);
  await p.evaluate(() => document.getElementById('dlgAfat').classList.remove('hapur'));
  ok(!p.__gab.length, 'tel pa gabime JS', p.__gab);
  await b.close();

  // 1) zgjedhësi në DOM: pa tabe; pa të skaduara → mesazhi
  const b2 = await chromium.launch(); const ctx = await b2.newContext(); const q = await ctx.newPage();
  await q.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const r = await q.evaluate(() => {
    const EKL = window.StokuEkipa, d = document.createElement('div'); document.body.appendChild(d);
    EKL.zgjedhesIKerkeses(d, { skaduara: [], produktet: [{ produkti: 'Kos', barkodi: '1' }] });
    const bosh = { tabe: d.querySelectorAll('.krk-tab, .krk-tabet').length, tekst: d.textContent, rreshta: d.querySelectorAll('.krk-rresht').length };
    d.textContent = '';
    const z = EKL.zgjedhesIKerkeses(d, { skaduara: [{ produkti: 'Djathë', barkodi: '444', data: '2026-11-01', nen: 'skadoi' }], produktet: [{ produkti: 'Kos', barkodi: '1' }] });
    d.querySelector('.krk-rresht').click();
    return { bosh, rreshta: d.querySelectorAll('.krk-rresht').length, zgjedhur: z.zgjedhur() };
  });
  ok(r.bosh.tabe === 0 && /S'ke produkte të skaduara në raft/.test(r.bosh.tekst) && r.bosh.rreshta === 0, '1. pa të skaduara: s\'ka tabe dhe s\'shfaqen produktet e tjera', r.bosh);
  ok(r.rreshta === 1 && r.zgjedhur.length === 1 && r.zgjedhur[0].produkti === 'Djathë', '1. vetëm të skaduarat në listë', r);
  await b2.close();
  // versionet
  const sw = fs.readFileSync(RR + 'sw.js', 'utf8'), ix = fs.readFileSync(RR + 'index.html', 'utf8');
  const nr = (s, rx) => Number((s.match(rx) || [])[1]);
  ok(nr(sw, /stoku-v(\d+)/) >= 290 && nr(sw, /app-tel\.js\?v=(\d+)/) >= 290 && nr(sw, /app-pc\.js\?v=(\d+)/) >= 290 && nr(sw, /ekipa\.js\?v=(\d+)/) >= 290 && nr(ix, /app-tel\.js\?v=(\d+)/) >= 290, 'versionet ≥ 290');
  const tr = fs.readFileSync(RR + 'teRejat.js', 'utf8');
  ok(/\{ v: 290,[^\n]*platforma: 'tel'/.test(tr) && /\{ v: 290,[^\n]*platforma: 'pc'/.test(tr), 'teRejat v290 (tel + pc)');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

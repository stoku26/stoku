// v330 / Android Hyrja 92 (pronari, 2 foto, 18.11.2026):
//  1. Android: faqja e shkarkimit të përditësimit tregon "Çfarë ka të re" edhe gjatë shkarkimit (si më parë)
//  2. Ora e dorës: Galaxy Watch / Apple Watch dhe kutia e kodit s'dalin për një moment kur ora është e lidhur: derisa vjen përgjigjja
//     del "Duke kontrolluar orën…"; ora e fundit ruhet për llogarinë (web tel + Android)
//  3. "Kodi nga ora": teksti i zbehtë pa hapësira mes shkronjave (Android)
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765', PUSH = 'https://stoku-push.mendurb.workers.dev';
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';

(async () => {
  // ===== Kodi (Android) =====
  const pu = lx(K + 'ui/PerditesimiUI.kt'), nj = lx(K + 'ui/NjoftimetUI.kt'), pb = lx(K + 'ui/Perberesit.kt');
  ok(/if \(pikat\.isNotEmpty\(\)\) \{/.test(pu) && !/pikat\.isNotEmpty\(\) && !shkarkim/.test(pu) && /"ÇFARË KA TË RE"/.test(pu), '1. Android: "Çfarë ka të re" edhe gjatë shkarkimit');
  ok(/var gati by remember/.test(nj) && /if \(gati && oret\.isEmpty\(\)\) Row\(/.test(nj) && /if \(gati && oret\.isEmpty\(\)\) Column\(/.test(nj) && /Duke kontrolluar orën…/.test(nj) && /private var oretKujtesa/.test(nj),
    '2. Android: pa Galaxy/Apple e pa kod derisa vjen përgjigjja; kujtesa e orëve');
  ok(/stiliPlaceholder = tx\(14, 500\)/.test(nj) && /\(stiliPlaceholder \?: st\)\.copy\(color = n\.faint\)/.test(pb), '3. Android: "Kodi nga ora" me tekst normal');
  ok(/Hyrja\(92, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 92');
  // 4. Excel-i i mallit: sasia majtas (web + Kotlin, fikstura e njëjtë)
  const X = require(RR + 'xlsx.js');
  const zb = Buffer.from(X.build([{ barkodi: '123', emri: 'hehe', sasia: 56, furnizuesi: 'hiji' }])).toString('latin1');
  ok(/<c s="1"><v>56<\/v><\/c>/.test(zb) && /xl\/styles\.xml/.test(zb) && /<alignment horizontal="left"\/>/.test(zb) && /Target="styles\.xml"/.test(zb) && /\/xl\/styles\.xml/.test(zb),
    '4. web: Excel-i i mallit me sasinë majtas (styles.xml + s="1")');
  ok(/<c s=\\"1\\"><v>/.test(lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/Xlsx.kt')) && /STILET_E_MALLIT/.test(lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/Xlsx.kt')),
    '4. Android: i njëjti Excel (Xlsx.kt)');

  const tani = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/' + ADM, { perdoruesi: 'duli96', kycurSe: tani - 6e4, grupi: '' });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [], produktet: [], fshira: {}, afatet: [] });
  let oret = [], vonesa = 0;
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B) && !u.href.startsWith(PUSH), r => r.abort());
  await ctx.route(u => u.href.startsWith(PUSH), async r => {
    const u = new URL(r.request().url()), h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (u.pathname === '/ora/oret') { if (vonesa) await new Promise(x => setTimeout(x, vonesa)); return r.fulfill({ status: 200, headers: h, body: JSON.stringify({ ok: true, oret }) }); }
    return r.fulfill({ status: 200, headers: h, body: '{"ok":true}' });
  });
  await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  const gj = () => p.evaluate(() => {
    const d = id => { const e = document.getElementById(id); return !e.hidden && !!e.offsetParent; };
    return { seg: d('segOra'), kodi: d('oraLidhKuti'), karta: d('oraLidhur'), pritje: d('oraPritje') };
  });
  async function hapOren() {
    await p.goto(B + '/index.html'); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    await p.click('#btnOpsione'); await p.waitForTimeout(300); await p.click('#tabOra'); await p.waitForTimeout(250);
  }
  // Ora e lidhur, serveri përgjigjet me vonesë, pa kujtesë: asgjë e gabuar për një moment
  oret = [{ id: 'abcdef0123456789', model: 'SM-L705F', koha: tani - 864e5, aktiv: tani - 864e5, v: 84 }]; vonesa = 1500;
  await hapOren();
  let s = await gj();
  ok(!s.seg && !s.kodi && !s.karta && s.pritje, '2. web tel: gjatë pritjes s\'del Galaxy/Apple as kutia e kodit, vetëm "Duke kontrolluar orën…"', s);
  await p.waitForTimeout(1800);
  s = await gj();
  ok(!s.seg && !s.kodi && s.karta && !s.pritje, '2. web tel: pas përgjigjes vetëm karta e orës', s);
  // Hapja e dytë (rifreskim i faqes): nga kujtesa, karta menjëherë, edhe pse serveri vonon
  await hapOren();
  s = await gj();
  ok(!s.seg && !s.kodi && s.karta && !s.pritje, '2. web tel: hapja tjetër: karta menjëherë (kujtesa)', s);
  await p.waitForTimeout(1800);
  // Ora u shkëput diku tjetër: pas përgjigjes del zgjedhja dhe kutia e kodit
  oret = []; vonesa = 300;
  await hapOren(); await p.waitForTimeout(800);
  s = await gj();
  ok(s.seg && s.kodi && !s.karta && !s.pritje, '2. web tel: pa orë: Galaxy/Apple + kutia e kodit', s);
  ok(!gab.length, 'pa gabime JS', gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

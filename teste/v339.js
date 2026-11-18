// v339 / Android Hyrja 98: malli i kolegëve (v335) s'shkruhej dot në Firestore të vërtetë: lista brenda liste ("Nested arrays are not
//  supported"). Tani çdo produkt është një tekst "barkodi⇥emri⇥sasia⇥furnizuesi⇥folderi". fs-server.js e refuzon tani listën brenda listës.
//  Android: kërkimi i Ballinës jashtë fillit të ekranit + publikimi i mallit në sfond.
const pw = require('./pw.js'); pw.meBallina = true;
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:' + (process.env.PORTI || '8765');
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';
(async () => {
  const t = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: t - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'besa', 'g1');
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: t });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: t });
  F.S.docs.set('grupet/g1/malli/u2', { uid: 'u2', emri: 'besa', ndryshuarSe: t, p: ['3800001\tUjë Rugove 1.5L\t24\tRugove\tPije', '3800002\tKos Vita\t6\tVita\tUshqimore'] });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [{ id: 'pije', emri: 'Pije' }], produktet: [{ kategoriaId: 'pije', barkodi: '3800009', emri: 'Ujë\tDea', sasia: 12, furnizuesi: 'Dea', ndryshuarSe: t }], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(3000);
  // 0. fs-server si Firestore: listë brenda liste refuzohet
  const nl = await p.evaluate(async () => { try { await window.__fs('batch', [['set', 'grupet/g1/malli/' + 'USfaW6Lbm3dbxEF95aKMKadIaok1', { uid: 'x', p: [['a', 'b']] }, false]]).then(r => { if (!r.ok) throw new Error(r.code); }); return 'u shkrua'; } catch (e) { return e.message; } });
  ok(nl === 'invalid-argument', '0. Firestore i simuluar: listë brenda liste s\'pranohet (si i vërteti)', nl);
  F.S.refuzime.length = 0;
  await p.fill('#blKerko', 'rugove'); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => [...document.querySelectorAll('#blRezultatet .bl-grupi')].map(x => ({ t: x.querySelector('h3').textContent, r: [...x.querySelectorAll('.bl-rez b')].map(y => y.textContent), s: [...x.querySelectorAll('.bl-rez small')].map(y => y.textContent) })));
  const mk = r.find(x => /^Malli i kolegëve/.test(x.t));
  ok(mk && mk.r[0] === 'Ujë Rugove 1.5L' && /^besa · 3800001 · Pije · 24 copë$/.test(mk.s[0]), '1. web tel: kërkimi lexon formatin e ri (tekst me ⇥)', r);
  await p.waitForTimeout(4000);
  const im = F.S.docs.get('grupet/g1/malli/' + ADM);
  ok(im && Array.isArray(im.p) && im.p.every(x => typeof x === 'string') && im.p.includes('3800009\tUjë Dea\t12\tDea\tPije'), '2. web tel: malli im shkruhet (tekst; ⇥ brenda emrit bëhet hapësirë)', im && im.p);
  ok(!F.S.refuzime.some(x => /\/malli\//.test(x.path)), '2. pa refuzime nga Firestore për mallin', F.S.refuzime);
  ok(!gab.length, 'pa gabime JS', gab);
  await b.close();
  // 3. Android
  const gk = lx(K + 'Grupi.kt'), be = lx(K + 'ui/BallinaEkrani.kt');
  ok(/joinToString\("\\t"\)/.test(gk) && /suspend fun publikoMallin/.test(gk) && /withContext\(kotlinx\.coroutines\.Dispatchers\.Default\)/.test(gk), '3. Android: malli publikohet si tekst me ⇥, në sfond');
  ok(/\(r as\? String\)\?\.split\('\\t'\)/.test(be), '3. Android: kërkimi lexon formatin e ri (dhe të vjetrin)');
  ok(/produceState<List<GrupiIRezultateve>\?>/.test(be) && /Dispatchers\.Default\) \{ try \{ kerkoKudo/.test(be) && /private val SHENJAT = Regex/.test(be), '3. Android: kërkimi i Ballinës jashtë fillit të ekranit, Regex një herë');
  ok(/Hyrja\(98, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 98');
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

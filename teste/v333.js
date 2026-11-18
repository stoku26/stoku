// v333 / Android Hyrja 94 (pronari, 18.11.2026): "Kreu", "shtëpia" → "Ballina" kudo (web tel, Android, kodi; te shiriti vetëm ikona)
//  + kërkimi te Ballina gjen edhe afatet e kolegëve të grupit (vetëm brenda grupit)
const pw = require('./pw.js'); pw.meBallina = true;
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765';
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';

(async () => {
  // ===== Kodi: pa "Kreu" =====
  const kodi = ['app-tel.js', 'index.html', 'app-pc.js', 'pc.html', 'teste/pw.js'].concat(fs.readdirSync(RR + K + 'ui').map(f => K + 'ui/' + f)).concat([K + 'MainActivity.kt', K + 'Grupi.kt']);
  const meKreu = kodi.filter(f => /Kreu|kreu/.test(lx(f).replace(/'stoku:' \+ 'kreu:pjeset'|"k" \+ "reu_pjeset"/g, '')));
  ok(!meKreu.length, '1. asnjë "Kreu" në kod (web tel, PC, Android)', meKreu);
  ok(fs.existsSync(RR + K + 'ui/BallinaEkrani.kt') && !fs.existsSync(RR + K + 'ui/KreuEkrani.kt'), '1. Android: BallinaEkrani.kt');
  ok(/Triple\(BALLINA, "Ballina", Ik\.Ballina\)/.test(lx(K + 'MainActivity.kt')), '1. Android: tabi "Ballina" me ikonën');
  ok(/"Afatet e kolegëve"/.test(lx(K + 'ui/BallinaEkrani.kt')) && /Grupi\.permbledhjet\.value/.test(lx(K + 'ui/BallinaEkrani.kt')), '2. Android: kërkimi me afatet e kolegëve');
  ok(/Hyrja\(94, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 94');

  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: t - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'besa', 'g1'); perd('u9', 'jashte', 'g9');
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: t });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: t });
  F.S.docs.set('grupet/g1/afatet/u2', { uid: 'u2', emri: 'besa', ndryshuarSe: t, afatet: [
    { id: 'b1', emri: 'Jogurt Vishnje', barkodi: '3890777', data: d(2), sasia: 4, furnizuesi: 'Abi', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
    { id: 'b2', emri: 'Jogurt i hequr', barkodi: '3890778', data: d(2), sasia: 1, statusi: 'hequr', krijuarSe: t, ndryshuarSe: t }] });
  F.S.docs.set('grupet/g9', { emri: 'Tjetër', pronarUid: 'u9', pronarEmri: 'jashte', krijuarSe: t });
  F.S.docs.set('grupet/g9/anetaret/u9', { emri: 'jashte', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g9/afatet/u9', { uid: 'u9', emri: 'jashte', ndryshuarSe: t, afatet: [{ id: 'x1', emri: 'Jogurt i huaj', barkodi: '999', data: d(2), sasia: 1, statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t }] });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [], produktet: [], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route(u => !u.href.startsWith(B), r => r.abort());
  await F.lidh(ctx, ADM, 'duli96@stoku-app.local', 'tel');
  await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
  const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
  await p.goto(B + '/index.html'); await p.waitForTimeout(2500);
  const tab = await p.evaluate(() => { const b = document.getElementById('tabBallina'); return { a: b.getAttribute('aria-label'), tekst: b.textContent.trim(), hapur: document.getElementById('dlgBallina').classList.contains('hapur') }; });
  ok(tab.a === 'Ballina' && tab.tekst === '' && tab.hapur, '1. web tel: butoni "Ballina" (vetëm ikona), Ballina hapet e para', tab);
  await p.fill('#blKerko', 'jogurt'); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => [...document.querySelectorAll('#blRezultatet .bl-grupi')].map(x => ({ t: x.querySelector('h3').textContent, r: [...x.querySelectorAll('.bl-rez b')].map(y => y.textContent), s: [...x.querySelectorAll('.bl-rez small')].map(y => y.textContent) })));
  const ak = r.find(x => /^Afatet e kolegëve/.test(x.t));
  ok(ak && ak.r.length === 1 && ak.r[0] === 'Jogurt Vishnje' && /^besa · 3890777/.test(ak.s[0]), '2. web tel: kërkimi gjen afatin e kolegut (pa të hequrin, pa grupin tjetër)', r);
  await p.click('#blRezultatet .bl-grupi:has(h3:text-matches("^Afatet e kolegëve")) .bl-rez'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.getElementById('dlgEkipi').classList.contains('hapur') && !document.getElementById('dlgBallina').classList.contains('hapur')), '2. prekja hap Grupi → afatet e kolegut');
  ok(!gab.length, 'pa gabime JS', gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

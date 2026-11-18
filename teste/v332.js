// v332 / Android Hyrja 93 (pronari, 2 foto, 18.11.2026):
//  1. Grupi → Përmbledhja: pa "Online tani" (rrathët e kolegëve), mbetet vetëm te Kolegët (web tel, PC, Android)
//  2. Web tel: "Dil" te karta e profilit në krye të Cilësimeve (si Android), jo brenda faqes Llogaria
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:8765';
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';

(async () => {
  const ge = lx(K + 'ui/GrupiEkrani.kt');
  ok(!/Seksion\("Online tani"/.test(ge) && /online nga/.test(ge), '1. Android: pa "Online tani" te Përmbledhja; Kolegët e kanë ende');
  ok(/Hyrja\(93, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 93');
  const ix = lx('index.html');
  ok((ix.match(/id="cloudDilBtn"/g) || []).length === 1 && /id="opsProfilRresht"[\s\S]{0,900}id="cloudDilBtn"/.test(ix), '2. web tel: "Dil" vetëm te karta e profilit');

  const tani = Date.now();
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: tani - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'besa', 'g1');
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: tani });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: tani });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'besa', roli: 'anetar', hyriSe: tani, aktivSe: tani, online: true });
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [], produktet: [], fshira: {}, afatet: [] });
  const b = await chromium.launch();
  async function faqe(pcF) {
    const ctx = await b.newContext(pcF ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, ADM, 'duli96@stoku-app.local', pcF ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/' + (pcF ? 'pc.html' : 'index.html')); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  }
  // ===== Web tel =====
  const tel = await faqe(false);
  await tel.click('#btnEkipi'); await tel.waitForTimeout(1500);
  const pr = await tel.evaluate(() => ({ online: !!document.querySelector('.ek-online-rrip'), tekst: /Online tani/.test(document.getElementById('dlgEkipi').textContent), kerko: !!document.getElementById('ekKerkoHeqje') }));
  ok(!pr.online && !pr.tekst && pr.kerko, '1. web tel: Përmbledhja pa "Online tani" (Kërko heqje mbetet)', pr);
  await tel.click('#ekMenu button[data-n="anetaret"]'); await tel.waitForTimeout(800);
  ok(await tel.evaluate(() => /online nga/.test(document.getElementById('dlgEkipi').textContent)), '1. web tel: Kolegët tregon kush është online');
  await tel.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => x.classList.remove('hapur')));
  await tel.click('#btnOpsione'); await tel.waitForTimeout(500);
  const d = await tel.evaluate(() => { const b = document.getElementById('cloudDilBtn'), k = document.getElementById('opsProfil'), rb = b.getBoundingClientRect(), rk = k.getBoundingClientRect();
    return { duket: !b.hidden && !!b.offsetParent, tekst: b.textContent.trim(), brenda: rb.top >= rk.top && rb.bottom <= rk.bottom && rb.right <= rk.right && rb.left > rk.left + rk.width / 2,
      ngjyra: getComputedStyle(b).color, emri: document.getElementById('opsProfilEmri').textContent }; });
  ok(d.duket && d.tekst === 'Dil' && d.brenda && d.emri === 'duli96', '2. web tel: "Dil" duket në kartën e profilit, djathtas', d);
  await tel.click('#cloudDilBtn'); await tel.waitForTimeout(400);
  ok(await tel.evaluate(() => document.getElementById('dlgKonfirmo').classList.contains('hapur')), '2. "Dil" pyet para se të dalë');
  await tel.click('#konfJo'); await tel.waitForTimeout(300);
  await tel.click('#opsProfil'); await tel.waitForTimeout(500);
  ok(await tel.evaluate(() => !document.querySelector('.ops-dil#cloudDilBtn')), '2. faqja Llogaria pa butonin e vjetër "Dil nga llogaria"');
  ok(!tel.__gab.length, '1-2. web tel: pa gabime JS', tel.__gab);
  // ===== PC =====
  const pc = await faqe(true);
  await pc.evaluate(() => { location.hash = '#/grupi'; }); await pc.waitForTimeout(1500);
  const kpi = await pc.evaluate(() => document.getElementById('ekPultKpi').textContent);
  ok(!/Online tani/.test(kpi) && /Të skaduara/.test(kpi), '1. PC: Përmbledhja e Grupit pa "Online tani"', kpi.slice(0, 120));
  ok(!pc.__gab.length, '1. PC: pa gabime JS', pc.__gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

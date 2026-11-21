// v352 (pronari: "Leje qysh osht te ni person qe i ka krejta te lejume. Veq te kta qka i ndalohet diqka me ja qit qe nuk ki akses ne ket
// sherbim"): shiriti poshtë mbetet me 5 vende; tabi i ndaluar zbehet me dry; prekja → "Nuk ke qasje në këtë shërbim." (web tel + Android)
const pw = require('./pw.js'); pw.meBallina = true; // Kreu në mes, si në telefonin e vërtetë
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const B = 'http://127.0.0.1:8765';
const PAMJET = process.env.PAMJET || '';
(async () => {
  const ma = lx('vendas/app/src/main/java/site/stoku/vendas/MainActivity.kt');
  ok(/val ndaluar = setOfNotNull\(/.test(ma) && /Toast\.trego\("Nuk ke qasje në këtë shërbim\."\)/.test(ma) && /Triple\("malli", "Malli", Ik\.Malli\),/.test(ma), '0. Android: 5 tabet gjithmonë, i ndaluari me mesazh');
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uB', { perdoruesi: 'besa', kycurSe: Date.now() });
  F.S.docs.set('lejet/uB', { lejet: { stoku: false }, emri: 'besa' });
  const b = await chromium.launch();
  const tabet = p => p.evaluate(() => [...document.querySelectorAll('#tabet .tab')].map(t => { const r = t.getBoundingClientRect(); return { id: t.id, x: Math.round(r.left + r.width / 2), duket: r.width > 0, nd: t.classList.contains('tab-ndaluar') }; }));
  const faqe = async (uid, email) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: PAMJET ? 2 : 1, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', colorScheme: 'dark' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, uid, email, 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); localStorage.setItem('stoku:tema', 'dark'); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/index.html'); await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  };
  // Me të gjitha lejet (krahasimi)
  const pA = await faqe('uA', 'arta@stoku-app.local');
  const tA = await tabet(pA);
  // Pa Malli
  const p = await faqe('uB', 'besa@stoku-app.local');
  const tB = await tabet(p);
  ok(tB.length === 5 && tB.every(t => t.duket), '1. shiriti ka 5 tabet edhe pa Mallin', tB);
  ok(JSON.stringify(tA.map(t => t.x)) === JSON.stringify(tB.map(t => t.x)), '1. vendet njësoj si te llogaria me të gjitha lejet (Kreu në mes)', [tA.map(t => t.x), tB.map(t => t.x)]);
  ok(tB.find(t => t.id === 'tabMalli').nd && tB.filter(t => t.nd).length === 1, '1. vetëm Malli i ndaluar');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#tabMalli .tab-dry')).display === 'flex' && +getComputedStyle(document.querySelector('#tabMalli .tab-ikona')).opacity < .5), '1. Malli i zbehur me dry');
  await p.click('#btnAfatet'); await p.waitForTimeout(600);
  if (PAMJET) await p.screenshot({ path: PAMJET + '/web-tabet-ndaluar.png' });
  await p.click('#tabMalli', { force: true }); await p.waitForTimeout(250);
  const pas = await p.evaluate(() => ({ toast: (document.getElementById('toast') || {}).textContent || document.body.innerText.match(/Nuk ke qasje[^\n]*/)?.[0], afatet: document.getElementById('dlgAfatet').classList.contains('hapur') }));
  ok(/Nuk ke qasje në këtë shërbim\./.test(pas.toast || '') && pas.afatet, '2. prekja: mesazhi, faqja s\'ndërrohet', pas);
  if (PAMJET) await p.screenshot({ path: PAMJET + '/web-tabet-mesazhi.png' });
  // Leja rikthehet
  F.S.docs.set('lejet/uB', { lejet: { stoku: true }, emri: 'besa' });
  await p.evaluate(() => window.__fs && window.__fs('resync')); await p.waitForTimeout(1200);
  const tC = await tabet(p);
  ok(!tC.some(t => t.nd), '3. leja u kthye: Malli normal', tC);
  ok(!p.__gab.length && !pA.__gab.length, '4. pa gabime JS', p.__gab.concat(pA.__gab));
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

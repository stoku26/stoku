// v347 / Android Hyrja 105: "Krijo llogari" kërkon pranimin e Kushteve të përdorimit (kutia), pa të s'krijohet llogaria
const { chromium } = require('./pw.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const B = 'http://127.0.0.1:8765';
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const MOCK = () => {
  function u() { const x = sessionStorage.getItem('mockUser'); return x ? { uid: x, email: x + '@stoku-app.local' } : null; }
  window.__thirrje = [];
  window.__stokuCloud = { authGati: true, perdoruesiAktual: u, token: async () => 't',
    merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }),
    degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {}, hyr: async () => ({ ok: false, kodi: 'auth/invalid-credential' }),
    regjistrohu: async (emri, fj, opsionet) => { window.__thirrje.push(opsionet || null); return { ok: false, kodi: 'auth/email-already-in-use' }; } };
};
const duket = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('.pk-fsheh'); }, s);
(async () => {
  // 0. statike: vetë regjistrimi e refuzon pa Kushtet (web tel + PC + Android)
  ok(/if \(!\(opsionet && opsionet\.kushtet\)\) return \{ ok: false, kodi: 'stoku\/kushtet'/.test(lx('firebase-tel.js')) && /if \(!\(opsionet && opsionet\.kushtet\)\) return \{ ok: false, kodi: 'stoku\/kushtet'/.test(lx('firebase-pc.js')), '0a. firebase-tel/pc: pa Kushtet s\'krijohet llogari');
  ok(/kushtetPranuarSe = fillimi\.krijuarSe/.test(lx('firebase-tel.js')) && /kushtetPranuarSe = fillimi\.krijuarSe/.test(lx('firebase-pc.js')), '0b. ruhet koha e pranimit (perdoruesit/{uid}.kushtetPranuarSe)');
  const K = 'vendas/app/src/main/java/site/stoku/vendas/', pk = lx(K + 'ui/Porta.kt'), ll = lx(K + 'Llogaria.kt');
  ok(/krijo && !kushtet -> "Për të vazhduar, shëno që pajtohesh me Kushtet e përdorimit\."/.test(pk) && /KutiaEKushteve\(kushtet\)/.test(pk) && /https:\/\/stoku\.site\/kushtet\.html/.test(pk), '0c. Android: kutia + mesazhi te Porta');
  ok(/if \(!kushtet\) return "Për të vazhduar, shëno që pajtohesh me Kushtet e përdorimit\."/.test(ll) && /fillimi\["kushtetPranuarSe"\]/.test(ll), '0d. Android: Llogaria.regjistrohu e refuzon pa Kushtet dhe e ruan kohën');
  ok(+/v: (\d+)/.exec(lx('versioni.js'))[1] >= 347 && /Hyrja\(105,/.test(lx(K + 'TeRejat.kt')), '0e. versionet');
  const b = await chromium.launch();
  for (const pc of [false, true]) {
    const em = pc ? 'PC' : 'tel';
    const ctx = await b.newContext({ userAgent: pc ? UA_PC : UA, viewport: pc ? { width: 1440, height: 900 } : { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await ctx.addInitScript(MOCK);
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto(B + (pc ? '/pc.html' : '/index.html')); await p.waitForTimeout(1500);
    ok(!(await duket(p, '#pkKushtetLbl')), em + ': te "Hyr" s\'del kutia');
    await p.click('#pkTabKrijo'); await p.waitForTimeout(150);
    ok(await duket(p, '#pkKushtetLbl') && !(await p.isChecked('#pkKushtet')), em + ': te "Krijo llogari" del, e pashënuar');
    ok(await p.evaluate(() => document.getElementById('pkKushtetLbl').nextElementSibling === document.getElementById('pkMerchLbl')), em + ': kutia e Kushteve është e para, mbi "Punoj si merchandiser"');
    const l = await p.evaluate(() => { const a = document.getElementById('pkKushtetLidhja'); return { href: a.getAttribute('href'), target: a.target, tekst: a.parentElement.textContent }; });
    ok(l.href === 'kushtet.html' && l.target === '_blank' && l.tekst === 'Pajtohem me Kushtet e përdorimit', em + ': "Pajtohem me Kushtet e përdorimit" me lidhje', l);
    // klikimi i lidhjes e hap faqen dhe s'e shënon kutinë
    const [faqja] = await Promise.all([ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null), p.click('#pkKushtetLidhja')]);
    ok(faqja && /\/kushtet\.html$/.test(faqja.url()) && !(await p.isChecked('#pkKushtet')), em + ': lidhja e hap kushtet.html, kutia mbetet e pashënuar', faqja && faqja.url());
    if (faqja) await faqja.close();
    await p.fill('#pkEmri', 'besnik'); await p.fill('#pkFjalekalimi', 'sakte123'); await p.fill('#pkPerserit', 'sakte123');
    await p.click('#pkDergo'); await p.waitForTimeout(300);
    const g1 = await p.textContent('#pkGabim'), t1 = await p.evaluate(() => window.__thirrje.length);
    ok(g1 === 'Për të vazhduar, shëno që pajtohesh me Kushtet e përdorimit.' && t1 === 0, em + ': pa kutinë s\'krijohet llogaria', [g1, t1]);
    if (!pc) await p.screenshot({ path: __dirname + '/v347-krijo-tel.png' });
    await p.click('#pkKushtetLbl .pk-tick'); await p.waitForTimeout(100);
    ok(await p.isChecked('#pkKushtet'), em + ': klikimi i kutisë e shënon');
    await p.click('#pkDergo'); await p.waitForTimeout(500);
    const th = await p.evaluate(() => window.__thirrje);
    ok(th.length === 1 && th[0] && th[0].kushtet === true && th[0].merchandiser === false, em + ': me kutinë: regjistrohu(…, { kushtet: true })', th);
    await p.click('#pkTabHyr'); await p.click('#pkTabKrijo'); await p.waitForTimeout(100);
    ok(!(await p.isChecked('#pkKushtet')), em + ': kalimi te "Hyr" e heq zgjedhjen');
    ok(!gab.length, em + ': pa gabime JS', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

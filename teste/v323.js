// v323 / Android Hyrja 85 (pronari):
//  1. "Çfarë ka të re" u rikthye: web telefon + PC vetëm te Cilësimet afër Privatësisë; Android te faqja e përditësimit + Cilësimet;
//     s'del më vetë pas përditësimit (teste/v318.js)
//  2. Excel: "Bone thjesht kur e zgjedh excel sikur ne pc": pa zgjedhjen e kolonave; vetëm Barkodi, Emri, Sasia, Furnizuesi, Skadon më
//     (pa Statusi, Ditë të mbetura, Çfarë duhet bërë, Hequr nga rafti, Shtuar nga); PC pa faqen "Për furnizuesit"; numrat/datat majtas
const { chromium } = require('./pw.js');
const fs = require('fs');
const PORTI = process.env.PORTI || '8765';
const RR = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const paKom = t => t.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');

(async () => {
  // ===== 0. Kodi =====
  const TR = require(RR + 'teRejat.js');
  ok(TR.versioni() >= 323 && TR.teRejatPas(0, 'pc', false, () => true).some(h => h.titulli === 'Excel më i thjeshtë'), '1. teRejat.js: hyrja e v323');
  const tk = lx(K + 'TeRejat.kt');
  ok(/Hyrja\(85, "2026-11-17", "Excel më i thjeshtë"/.test(tk), '1. TeRejat.kt: Hyrja 85');
  const ce = lx(K + 'ui/CilesimetEkrani.kt');
  const iT = ce.indexOf('"Çfarë ka të re", "Ndryshimet e fundit në Stoku"'), iP = ce.indexOf('"Privatësia", "Çfarë ruan Stoku');
  ok(iT > 0 && iP > iT && iP - iT < 400 && /TeRejatFlete\(TeRejat\.LISTA\.take\(6\)/.test(ce), '1. Android: rreshti te Cilësimet, afër Privatësisë');
  ok(!/TeRejatFlete|TeRejat\.teReja\(\)/.test(paKom(lx(K + 'MainActivity.kt'))), '1. Android: s\'del vetë pas përditësimit');
  ok(/teReja/.test(lx(K + 'ui/PerditesimiUI.kt')) && /fun teReja\(body: String\)/.test(lx('vendas/app/src/github/java/site/stoku/vendas/Perditesimi.kt')) && /TeRejat\.kt/.test(lx('.github/workflows/vendas-apk.yml')),
    '1. Android: "Çfarë ka të re" te faqja e përditësimit (nga Release-i)');
  ok(/'\.\/teRejat\.js\?v=3\d\d'/.test(lx('sw.js')) && /teRejat\.js\?v=3\d\d/.test(lx('index.html')) && /teRejat\.js\?v=3\d\d/.test(lx('pc.html')), '1. web: teRejat.js në faqe dhe te sw.js');
  const ek = lx(K + 'Eksportet.kt'), eu = lx(K + 'ui/EksportetUI.kt'), pc = lx('app-pc.js'), tel = lx('app-tel.js');
  const kolHequra = /Statusi|Ditë të mbetura|Çfarë duhet bërë|Hequr nga rafti|Shtuar nga/;
  ok(!kolHequra.test(paKom(ek.slice(ek.indexOf('val KOLONAT_E_AFATEVE'), ek.indexOf('fun excelIAfateve')))) && !/RreshtiIKutise|kolonatERuajtura|Lidhje\("Barkodi, emri, sasia"/.test(eu), '2. Android: 5 kolona, pa kutitë e zgjedhjes');
  const pcEks = pc.slice(pc.indexOf('function eksportoAfatet('), pc.indexOf('setInterval(function () { if (!document.hidden) renderAfatetAnesore'));
  ok(!kolHequra.test(paKom(pcEks)) && !/Për furnizuesit/.test(paKom(pcEks)), '2. PC: 5 kolona, pa faqen "Për furnizuesit"', pcEks.length);
  ok(!kolHequra.test(paKom(tel.slice(tel.indexOf('var AX_KOLONAT'), tel.indexOf('function axTeZgjedhurat')))), '2. telefoni: 5 kolona');
  const X = require(RR + 'xlsx.js');
  const zip = Buffer.from(X.buildWorkbook([{ name: 'A', columns: [{ title: 'S', type: 'number' }, { title: 'D', type: 'day' }], rows: [[5, '2026-12-01']] }])).toString('latin1');
  ok((zip.match(/<alignment horizontal="left"\/>/g) || []).length === 5 && /numFmtId="1"[^>]*applyAlignment="1"><alignment horizontal="left"\/><\/xf>/.test(zip), '2. Excel: numrat dhe datat nga e majta');
  ok(/applyAlignment=\\"1\\"><alignment horizontal=\\"left\\"\/><\/xf>/.test(lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/Xlsx.kt')), '2. Kotlin: e njëjta (fikstura e krahason)');

  const b = await chromium.launch();
  // ===== Telefoni =====
  {
    const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => {
      window.__stokuCloud = { authGati: true, perdoruesiAktual: () => ({ uid: 'u1', email: 'agim@stoku-app.local' }), token: async () => 't',
        merr: async () => ({ ok: true, gjendja: null }), bashkoDheRuaj: async fn => ({ ok: true, gjendja: fn(null) }), degjo: () => () => {}, degjoFletet: () => () => {}, dil: async () => {} };
      localStorage.setItem('stoku:pronari-uid', 'u1'); localStorage.setItem('stoku:porta:hyrja', JSON.stringify({ uid: 'u1', emri: 'agim' }));
      localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now()));
      localStorage.setItem('stoku:afatet:excel-kolonat', JSON.stringify(['statusi']));
    });
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/index.html'); await p.waitForTimeout(3500);
    const r = await p.evaluate(() => {
      const t = document.getElementById('opsTeRejat'), pv = document.getElementById('opsPrivatesia');
      return { fqinj: !!t && t.nextElementSibling === pv, kol: window.__stokuAxKolonat && window.__stokuAxKolonat(), ls: localStorage.getItem('stoku:afatet:excel-kolonat'),
        dlg: document.getElementById('axTitulli').textContent, kuti: document.querySelectorAll('#dlgAfExcel input[type=checkbox]').length };
    });
    ok(r.fqinj, '1. telefoni: "Çfarë ka të re" menjëherë para Privatësisë');
    ok(JSON.stringify(r.kol) === JSON.stringify(['barkodi', 'emri', 'sasia', 'furnizuesi', 'data']) && r.ls === null && r.dlg === 'Eksporto afatet në Excel' && !r.kuti,
      '2. telefoni: Excel pa zgjedhje kolonash, 5 kolonat, zgjedhja e vjetër fshihet', r);
    await p.evaluate(() => { document.getElementById('btnOpsione').click(); });
    await p.waitForTimeout(300);
    await p.click('#opsTeRejat'); await p.waitForTimeout(300);
    const d = await p.evaluate(() => ({ hapur: document.getElementById('dlgTeRejat').classList.contains('hapur'), nen: document.getElementById('trNen').textContent,
      tit: [...document.querySelectorAll('#trLista .tr-version-titulli')].map(x => x.textContent) }));
    ok(d.hapur && d.nen === 'Përditësimet e fundit' && d.tit.length >= 1 && d.tit.length <= 6 && !d.tit.includes('Excel me një faqe') && !d.tit.includes('Malli edhe në kompjuter') && !d.tit.includes('Fusha e barkodit'), '1. telefoni: hapet nga Cilësimet, pa hyrjet e PC-së', d);
    await p.click('#trMbyll'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !document.getElementById('dlgTeRejat').classList.contains('hapur')), '1. "Në rregull" e mbyll');
    ok(!gab.length, 'telefoni: pa gabime JS', gab);
    await ctx.close();
  }
  // ===== PC =====
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const gab = []; p.on('pageerror', e => gab.push(e.message));
    await p.goto('http://127.0.0.1:' + PORTI + '/pc.html'); await p.waitForTimeout(3000);
    ok(await p.evaluate(() => { const t = document.getElementById('opsTeRejat'); return !!t && t.nextElementSibling === document.getElementById('opsPrivatesia'); }), '1. PC: "Çfarë ka të re" afër Privatësisë');
    await p.evaluate(() => document.getElementById('opsTeRejat').click()); await p.waitForTimeout(300);
    // v344: pritjet llogariten nga teRejat.js (më parë titujt ishin të shkruar me dorë dhe dilnin nga 6 të fundit me çdo version)
    const d = await p.evaluate(() => {
      const TR = window.StokuTeRejat, pa = h => !h.vetemAdmini;
      return { hapur: document.getElementById('dlgTeRejat').classList.contains('hapur'), tit: [...document.querySelectorAll('#trLista .tr-version-titulli')].map(x => x.textContent),
        pritur: TR.LISTA.filter(h => h.platforma !== 'tel' && pa(h)).slice(0, 6).map(h => h.titulli),
        vetemTel: TR.LISTA.filter(h => h.platforma === 'tel').slice(0, 6).map(h => h.titulli) };
    });
    ok(d.hapur && d.tit.length >= 1 && d.tit.length <= 6 && JSON.stringify(d.tit) === JSON.stringify(d.pritur), '1. PC: hapet nga Cilësimet, 6 hyrjet e fundit të PC-së', d);
    ok(!gab.length, 'PC: pa gabime JS', gab);
    await ctx.close();
  }
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

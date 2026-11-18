// v334 (pronari, 18.11.2026): (1) PC Ballina sipas idesë 2 (Grupi te anësorja, grafiku djathtas poshtë); (2) Grupi pa datë, titulli
//  në lartësinë e Malli/Afatet/Cilësimet (web tel + Android)
const pw = require('./pw.js'); pw.meBallina = true;
const { chromium } = pw;
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const B = 'http://127.0.0.1:' + (process.env.PORTI || '8765');
const SC = process.env.SC || '/tmp/';
const ADM = 'USfaW6Lbm3dbxEF95aKMKadIaok1';
(async () => {
  const t = Date.now(), d = n => new Date(t + n * 864e5).toISOString().slice(0, 10);
  const F = krijoFirestore({ rregullat: 'reja' });
  const perd = (u, em, gr) => F.S.docs.set('perdoruesit/' + u, { perdoruesi: em, kycurSe: t - 6e4, grupi: gr || '' });
  perd(ADM, 'duli96', 'g1'); perd('u2', 'pda34', 'g1'); perd('u3', 'tonnyaliu', 'g1');
  F.S.docs.set('grupet/g1', { emri: 'Albi Market 34', pronarUid: ADM, pronarEmri: 'duli96', krijuarSe: t });
  F.S.docs.set('grupet/g1/anetaret/' + ADM, { emri: 'duli96', roli: 'pronar', hyriSe: t });
  F.S.docs.set('grupet/g1/anetaret/u2', { emri: 'pda34', roli: 'anetar', hyriSe: t, aktivSe: t - 2 * 36e5 });
  F.S.docs.set('grupet/g1/anetaret/u3', { emri: 'tonnyaliu', roli: 'anetar', hyriSe: t, aktivSe: t - 864e5 });
  F.S.docs.set('grupet/g1/feed/n1', { lloji: 'hequr', uid: 'u3', emri: 'tonnyaliu', koha: t - 2 * 36e5, artikuj: [{ emri: 'Kos Vita' }], pronariUid: 'u3' });
  const AFT = [
    { id: 'a1', emri: 'EKO Vishnje 1L', barkodi: '1', data: d(0), sasia: 1, furnizuesi: 'Laberion', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
    { id: 'a2', emri: 'Eko Fr Mali 250ml', barkodi: '2', data: d(1), sasia: 7, furnizuesi: 'Laberion', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
    { id: 'a3', emri: 'Eko Multi 250ml', barkodi: '3', data: d(1), sasia: 20, furnizuesi: 'Laberion', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
    { id: 'a4', emri: 'Fruc Lemonade 1.5L', barkodi: '4', data: d(2), sasia: 35, furnizuesi: 'Albi', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t },
    { id: 'a5', emri: 'Lëng Frutti', barkodi: '5', data: d(40), sasia: 2, furnizuesi: 'Devolli', statusi: 'aktiv', krijuarSe: t, ndryshuarSe: t }];
  F.S.docs.set('dyqane/' + ADM, { app: 'stoku', version: 3, foldera: [], produktet: [], fshira: {}, afatet: AFT });
  const b = await chromium.launch();
  async function faqe(pcF) {
    const ctx = await b.newContext(pcF ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', colorScheme: 'dark' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith(B), r => r.abort());
    await F.lidh(ctx, ADM, 'duli96@stoku-app.local', pcF ? 'pc' : 'tel');
    await ctx.addInitScript(([a]) => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); if (!localStorage.getItem('stoku:afatet:v1')) localStorage.setItem('stoku:afatet:v1', JSON.stringify(a)); } catch (e) {} }, [AFT]);
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto(B + '/' + (pcF ? 'pc.html' : 'index.html')); await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  }
  // ===== PC =====
  const pc = await faqe(true);
  ok(/#\/ballina$/.test(pc.url()), '1. PC: hapet Ballina', pc.url());
  const s = await pc.evaluate(() => ({
    fjalia: document.querySelector('#blPjeset .bl-fjalia') && document.querySelector('#blPjeset .bl-fjalia').textContent,
    butonat: [...document.querySelectorAll('#blPjeset .bl-btn')].map(x => x.textContent.trim()),
    numrat: [...document.querySelectorAll('#blPjeset .bl-hero-nr')].map(x => x.textContent),
    tabela: [...document.querySelectorAll('#blPjeset .bl-tabela tr')].slice(1).map(x => x.firstChild.textContent),
    kartat: [...document.querySelectorAll('#blPjeset .bl-karta h3')].map(x => x.textContent),
    anesore: !document.getElementById('blAnesore').hidden, kolege: [...document.querySelectorAll('#blAnesore .bl-an-emri')].map(x => x.textContent),
    akt: [...document.querySelectorAll('#blAnesore .bl-an-ngjarje')].map(x => x.textContent), data: document.getElementById('blNen').textContent }));
  ok(/^1 produkt skadon sot, 2 nesër$/.test(s.fjalia), '1. PC: fjalia e ditës', s.fjalia);
  ok(s.butonat.includes('Afat i ri') && s.butonat.includes('PDF për printim') && s.butonat.includes('Importo Excel'), '1. PC: butonat', s.butonat);
  ok(s.tabela.length === 4 && s.tabela[0] === 'EKO Vishnje 1L' && !s.tabela.includes('Lëng Frutti'), '1. PC: tabela e 14 ditëve (pa atë pas 40 ditësh)', s.tabela);
  ok(['Afatet e 14 ditëve të ardhshme', 'Furnizuesit', 'Afatet në 6 muajt e ardhshëm'].every(x => s.kartat.includes(x)) && !s.kartat.includes('Grupi'), '1. PC: tabela, furnizuesit, grafiku (pa kartën Grupi)', s.kartat);
  ok(s.anesore && s.kolege[0] === 'duli96' && s.kolege.includes('pda34') && s.kolege.includes('tonnyaliu'), '1. PC: anësorja me kolegët (online së pari)', s.kolege);
  await pc.screenshot({ path: SC + 'v334-pc-ballina.png' });
  await pc.click('#blPjeset .bl-btn:has-text("PDF për printim")'); await pc.waitForTimeout(400);
  ok(await pc.evaluate(() => document.getElementById('dlgAfPdf').classList.contains('hapur')), '1. PC: "PDF për printim" hap dritaren');
  await pc.keyboard.press('Escape'); await pc.waitForTimeout(300);
  await pc.click('#btnAkordStoku'); await pc.waitForTimeout(400);
  ok(await pc.evaluate(() => document.getElementById('blAnesore').hidden), '1. PC: anësorja e Ballinës fshihet te Malli');
  ok(!pc.__gab.length, '1. PC: pa gabime JS', pc.__gab);
  // ===== Web tel: koka e Grupit =====
  const tel = await faqe(false);
  const lart = id => tel.evaluate(i => { const h = document.querySelector(i); const r = h.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), fs: getComputedStyle(h).fontSize }; }, id);
  await tel.click('#btnAfatet'); await tel.waitForTimeout(800);
  const af = await lart('#afTitulli');
  await tel.click('#btnEkipi'); await tel.waitForTimeout(1200);
  const gr = await lart('#ekipiTitulli');
  const data = await tel.evaluate(() => { const e = document.getElementById('ekipiData'); return !e || getComputedStyle(e).display === 'none' || !e.textContent; });
  ok(data, '2. web tel: Grupi pa datë');
  ok(Math.abs(af.top - gr.top) <= 2 && af.fs === gr.fs, '2. web tel: titulli i Grupit si i Afateve (lartësia, madhësia)', { af, gr });
  ok(!tel.__gab.length, '2. web tel: pa gabime JS', tel.__gab);
  const ge = lx(K + 'ui/GrupiEkrani.kt');
  ok(!/dataSot/.test(ge) && /Hyrja 95/.test(ge) && /Text\(titulli, style = tx\(26, 700/.test(ge), '2. Android: koka e Grupit pa datë, titulli 26/700');
  ok(/Hyrja\(95, "2026-11-18"/.test(lx(K + 'TeRejat.kt')), '0. TeRejat.kt: Hyrja 95');
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

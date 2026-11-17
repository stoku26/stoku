// v319 / Android Hyrja 81 (pronari, 5 foto):
//  1. Cilësimet → Llogaria: "Pajisjet ku je i kyçur" + "Shkëput" nga distanca (pajisjet.js; perdoruesit/{uid}/pajisjet/{id})
//  2. PDF: "Shtuar" → "Ditët e skanimit" me kalendar (shumë ditë me prekje); pa "Shtuar:" te PDF-ja
//  3. Afatet: "Eksporto" hap dritare si "Importo"
//  4. Grupi: Përmbledhja dhe Aktiviteti me shiritin e numrave si te Afatet; Kolegët: "Fto" si butoni + te "Grupi yt";
//     "Pastro të gjithë aktivitetin" te Aktiviteti
//  5. Ikona maskable e web app-it me zonën e sigurt si te Android-i
const { chromium } = require('./pw.js');
const { krijoFirestore } = require('./fs-server.js');
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const prit = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise(r => setTimeout(r, 100)); } return false; };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const SC = '/tmp/claude-0/-home-user-stoku/e6bed5df-a3f5-5158-8183-d77a3d2bc01d/scratchpad/';

(async () => {
  // ===== 0. Kodi =====
  const P = require(RR + 'pajisjet.js');
  ok(P.emriNgaUA('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile') === 'Chrome në Android' &&
    P.emriNgaUA('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605 Version/18.0 Mobile/15E148 Safari/604.1') === 'Safari në iPhone' &&
    P.emriNgaUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140 Safari/537.36 Edg/140') === 'Edge në Windows', '0. emri i pajisjes nga shfletuesi');
  ok(P.renditLista([{ id: 'a', paraSe: 5 }, { id: 'b', paraSe: 9 }, { id: 'c', paraSe: 1 }], 'c').map(x => x.id).join() === 'c,b,a', '0. renditja: kjo pajisje e para, pastaj e fundit aktive');
  const kt = lx(K + 'Pajisjet.kt');
  ok(/"pajisjet"/.test(kt) && /fun shkeput\(/.test(kt) && /Pajisjet ku je i kyçur/.test(lx(K + 'ui/CilesimetEkrani.kt')), '0. Android: Pajisjet.kt + seksioni te Llogaria');
  const gr = lx(K + 'ui/GrupiEkrani.kt'), eu = lx(K + 'ui/EksportetUI.kt'), af = lx(K + 'ui/AfatetEkrani.kt'), ep = lx(K + 'EksportiPdf.kt');
  ok(/private fun ShiritiINumrave\(/.test(gr) && !/FjaliaERezymese/.test(gr) && /Ik\.FtoKoleg/.test(gr) && (gr.match(/Pastro të gjithë aktivitetin/g) || []).length === 1 && !/Krye\("Pastrimi"\)/.test(gr),
    '0. Android: Grupi (shiriti, Fto me plus, Pastrimi te Aktiviteti)');
  ok(/Ditët e skanimit/.test(eu) && /KalendariIDiteve/.test(eu) && !/"Shtuar: /.test(eu) && /fun tekstiDiteve\(/.test(ep) && !/SHTUAR/.test(ep), '0. Android: kalendari "Ditët e skanimit", pa "Shtuar"');
  ok(/private fun EksportoFlete\(/.test(af) && !/DropdownMenu\(hapur/.test(af), '0. Android: "Eksporto" si dritare');
  ok(/viewBox="10\.8 10\.8 86\.4 86\.4"/.test(lx('logo/stoku-icon-maskable.svg')) && /icon-maskable-512\.png\?v=6/.test(lx('manifest.webmanifest')), '0. ikona maskable me zonën e sigurt');
  const sw = lx('sw.js');
  ok(/stoku-v319/.test(sw) && /pajisjet\.js\?v=1/.test(sw) && /app-tel\.js\?v=319/.test(sw) && /firebase-tel\.js\?v=319/.test(sw), '0. sw.js: CACHE v319, pajisjet.js');
  ok(/match \/pajisjet\/\{p\}/.test(lx('SHENIME.md')), '0. SHENIME: rregulli i Firestore për pajisjet');

  // ===== Faqet =====
  const tani = Date.now(), dita = n => new Date(tani + n * 864e5).toISOString().slice(0, 10);
  const F = krijoFirestore({ rregullat: 'reja' });
  F.S.docs.set('perdoruesit/uA', { perdoruesi: 'agim', kycurSe: tani, grupi: 'g1' });
  F.S.docs.set('grupet/g1', { emri: 'Market', pronarUid: 'uA', pronarEmri: 'agim', krijuarSe: tani });
  F.S.docs.set('grupet/g1/anetaret/uA', { emri: 'agim', roli: 'pronar', hyriSe: tani });
  F.S.docs.set('dyqane/uA', { app: 'stoku', version: 3, foldera: [{ id: 'f1', emri: 'Pije' }], produktet: [], fshira: {},
    afatet: [{ id: 'a1', barkodi: '1', emri: 'Kos', data: dita(3), statusi: 'aktiv', krijuarSe: tani - 6e4, ndryshuarSe: tani }] });
  const b = await chromium.launch();
  async function faqe(pcF) {
    const ctx = await b.newContext(pcF ? { viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }
      : { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/140 Mobile', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route(u => !u.href.startsWith('http://127.0.0.1'), r => r.abort());
    await F.lidh(ctx, 'uA', 'agim@stoku-app.local', pcF ? 'pc' : 'tel');
    await ctx.addInitScript(() => { try { localStorage.setItem('stoku:njoftimet:jo-tani', String(Date.now())); } catch (e) {} });
    const p = await ctx.newPage(); p.__gab = []; p.on('pageerror', e => p.__gab.push(e.message));
    await p.goto('http://127.0.0.1:8765/' + (pcF ? 'pc.html' : 'index.html')); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
    return p;
  }
  const tel = await faqe(false);
  const pc = await faqe(true);

  // ===== 1. Pajisjet =====
  const docsPaj = () => [...F.S.docs.keys()].filter(k => k.startsWith('perdoruesit/uA/pajisjet/'));
  ok(await prit(() => docsPaj().length === 2), '1. dy pajisje te perdoruesit/uA/pajisjet', docsPaj());
  const d = docsPaj().map(k => F.S.docs.get(k));
  ok(d.some(x => x.lloji === 'tel' && x.emri === 'Chrome në Android') && d.some(x => x.lloji === 'pc') && d.every(x => x.paraSe > 0 && x.krijuarSe > 0), '1. emri, lloji, kohët', d);
  ok(await prit(() => tel.evaluate(() => document.querySelectorAll('#llPajisjet .ll-paj').length === 2)), '1. telefoni: lista me 2 pajisje');
  const lista = await tel.evaluate(() => [...document.querySelectorAll('#llPajisjet .ll-paj')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
  ok(/Kjo pajisje/.test(lista[0]) && /Aktive/.test(lista[1]) && /Shkëput/.test(lista[1]) && !/Shkëput/.test(lista[0]), '1. kjo pajisje e para (pa "Shkëput"), tjetra me "Shkëput"', lista);
  await tel.click('#btnOpsione').catch(() => {}); await tel.waitForTimeout(300);
  await tel.evaluate(() => { const b = document.getElementById('tabLlogaria') || document.getElementById('opsProfil'); if (b) b.click(); }); await tel.waitForTimeout(500);
  await tel.evaluate(() => document.getElementById('llPajisjet').scrollIntoView({ block: 'center' })); await tel.waitForTimeout(200);
  await tel.screenshot({ path: SC + 'v319-pajisjet.png' });
  await tel.evaluate(() => document.querySelector('#llPajisjet .ll-paj-shkeput').click()); await tel.waitForTimeout(300);
  ok(await tel.evaluate(() => document.getElementById('dlgKonfirmo').classList.contains('hapur')), '1. "Shkëput" pyet para');
  await tel.click('#konfPo'); await tel.waitForTimeout(300);
  ok(await prit(() => docsPaj().length === 1), '1. dokumenti i PC-së u fshi', docsPaj());
  ok(await prit(() => pc.evaluate(() => (window.__dalur || 0) >= 1)), '1. PC-ja doli vetë nga llogaria');
  ok(/U shkëpute nga llogaria nga një pajisje tjetër/.test(await pc.textContent('#toast')), '1. PC: mesazhi i shkëputjes', await pc.textContent('#toast'));
  ok(await prit(() => tel.evaluate(() => document.querySelectorAll('#llPajisjet .ll-paj').length === 1)), '1. telefoni: lista mbetet vetëm me këtë pajisje');
  ok(!tel.__gab.length && !pc.__gab.length, '1. pa gabime JS', [tel.__gab, pc.__gab]);
  await tel.evaluate(() => document.querySelectorAll('.mbulese.hapur').forEach(x => { if (!x.classList.contains('faqe-e-plote')) x.classList.remove('hapur'); }));
  await tel.evaluate(() => { if (document.getElementById('dlgOpsione').classList.contains('hapur')) document.getElementById('dlgOpsione').classList.remove('hapur'); });

  // ===== 2. Grupi =====
  await tel.click('#btnEkipi'); await tel.waitForTimeout(1200);
  const pm = await tel.evaluate(() => ({ nr: [...document.querySelectorAll('#ekPermbNumrat .ek-segm__s span')].map(x => x.textContent), fjalia: !!document.querySelector('#ekipiTrup .ek-rez') }));
  ok(pm.nr.join() === 'Në raft,Skaduara,Këtë javë,Afër,Hequra' && !pm.fjalia, '2. Përmbledhja: shiriti me 5 numra, pa fjalinë e madhe', pm);
  await tel.screenshot({ path: SC + 'v319-permbledhja.png' });
  await tel.click('#ekMenu button[data-n="aktiviteti"]'); await tel.waitForTimeout(700);
  const ak = await tel.evaluate(() => ({ nr: [...document.querySelectorAll('#ekAktNumrat .ek-segm__s span')].map(x => x.textContent), pastro: !!document.getElementById('ekPastroAkt'), kuti: document.querySelectorAll('#ekipiTrup .af-numer').length }));
  ok(ak.nr.join() === 'Skadojnë sot,Skaduara,Hequr sot' && ak.pastro && ak.kuti === 0, '2. Aktiviteti: shiriti me 3 numra + "Pastro të gjithë aktivitetin" (admini i grupit)', ak);
  await tel.click('#ekMenu button[data-n="anetaret"]'); await tel.waitForTimeout(700);
  const kl = await tel.evaluate(() => ({ plus: !!document.getElementById('ekFtoHap'), fusha: !!document.getElementById('ekFtoEmri'), pastrimi: /Pastro të gjithë aktivitetin|Pastrimi/.test(document.getElementById('ekipiTrup').textContent),
    hint: /Shkruaj emrin e përdoruesit/.test(document.getElementById('ekipiTrup').textContent) }));
  ok(kl.plus && !kl.fusha && !kl.pastrimi && !kl.hint, '2. Kolegët: butoni + te "Grupi yt", pa fushën e ftesës dhe pa "Pastrimi"', kl);
  await tel.screenshot({ path: SC + 'v319-koleget.png' });
  await tel.click('#ekFtoHap'); await tel.waitForTimeout(300);
  ok(await tel.evaluate(() => !!document.getElementById('ekFtoEmri') && document.getElementById('ekFtoHap').getAttribute('aria-expanded') === 'true'), '2. prekja te + hap fushën e ftesës');
  await tel.click('#ekFtoHap'); await tel.waitForTimeout(300);
  ok(await tel.evaluate(() => !document.getElementById('ekFtoEmri')), '2. prekja sërish e mbyll');

  // ===== 3. Eksporto si Importo =====
  await tel.click('#btnAfatet'); await tel.waitForTimeout(700);
  await tel.click('#afExcel'); await tel.waitForTimeout(400);
  const ek = await tel.evaluate(() => ({ hapur: document.getElementById('dlgAfEksporto').classList.contains('hapur'), titulli: document.getElementById('aeTitulli').textContent,
    op: [...document.querySelectorAll('#afExcelMenu .ae-op .ap-em')].map(x => x.textContent) }));
  ok(ek.hapur && ek.titulli === 'Eksporto afatet' && ek.op.join() === 'Excel,PDF për printim,Si foto', '3. "Eksporto" hap dritaren si "Importo"', ek);
  await tel.screenshot({ path: SC + 'v319-eksporto.png' });
  // ===== 4. PDF: "Ditët e skanimit" =====
  await tel.click('#afEksPdf'); await tel.waitForTimeout(400);
  ok(await tel.evaluate(() => !document.getElementById('dlgAfEksporto').classList.contains('hapur') && document.getElementById('dlgAfPdf').classList.contains('hapur')), '4. PDF-ja hapet, dritarja e eksportit mbyllet');
  const rr = await tel.evaluate(() => [...document.querySelectorAll('#dlgAfPdf .ap-rresht')].filter(x => x.offsetParent).map(x => x.querySelector('.ap-em').textContent));
  ok(rr.includes('Ditët e skanimit') && !rr.includes('Shtuar'), '4. rreshti "Ditët e skanimit" (pa "Shtuar")', rr);
  ok(!tel.__gab.length, '4. pa gabime JS', tel.__gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

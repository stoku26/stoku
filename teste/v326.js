// v326 / Android (pronari, 17.11.2026):
//  1. Kamera e web app-it si te aplikacioni Android: kutia e bardhë e plotë (jo qoshet), X lart majtas, zmadhimi dhe drita lart
//     djathtas, "Vendos vetëm një barkod brenda kutisë" nën kuti, "Drejtoje kamerën te barkodi" poshtë
//  2. Fokusi i kamerës vetëm brenda kutisë: pika e fokusit = mesi i kutisë (në koordinatat e figurës); prekja jashtë kutisë
//     kufizohet brenda saj (web + Android me FocusMeteringAction)
//  3. Android: Kreu (shtëpia në mes, hapet i pari, "Përshtat faqen"), "Stoku" → "Malli" në kod, logoja e kokës pa qoshe të rrumbullakëta
const { chromium } = require('./pw.js');
const { hapFaqen } = require('./kamera-e-rreme.js');
const fs = require('fs');
const RR = __dirname + '/../';
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
const paKom = t => t.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');

(async () => {
  // ===== 3. Android (kodi) =====
  const ma = paKom(lx(K + 'MainActivity.kt')), kreu = lx(K + 'ui/KreuEkrani.kt'), sk = paKom(lx(K + 'ui/Skaneri.kt')), logo = paKom(lx(K + 'ui/Logo.kt'));
  ok(/mutableStateOf\("kreu"\)/.test(ma) && /Triple\(KREU, "Kreu", Ik\.Kreu\)/.test(ma) && /tabi = KREU/.test(ma), '3. Android: Kreu hapet i pari (edhe "Mbrapa" kthen te Kreu)');
  const iA = ma.indexOf('Triple("afatet"'), iK = ma.indexOf('Triple(KREU'), iG = ma.indexOf('Triple("grupi"');
  ok(iA > 0 && iK > iA && iG > iK, '3. Android: shtëpia në mes (pas Afatet, para Grupi)');
  ok(/KreuButoni\(/.test(ma) && /KREU_MBI_SHIRIT/.test(kreu) && /fun KreuButoni/.test(kreu), '3. Android: rrethi i shtëpisë pak mbi shiritin');
  ok(!/"stoku" ->|Triple\("stoku"|StokuEkrani|Ik\.Stoku\b/.test(ma) && fs.existsSync(RR + K + 'ui/MalliEkrani.kt') && !fs.existsSync(RR + K + 'ui/StokuEkrani.kt') &&
    /Triple\("malli", "Malli", Ik\.Malli\)/.test(ma) && /leja\("stoku"\)\) Triple\("malli"/.test(ma), '3. Android: "Stoku" → "Malli" (tabi, ekrani, ikona); leja mbetet "stoku"');
  ok(/if \(k == "stoku"\) "malli"/.test(ma), '3. Android: njoftimet e vjetra me tabin "stoku" hapin Mallin');
  const pj = ['butonat', 'afatet', 'skadojne', 'grafiku', 'malli', 'furnizuesit', 'grupi', 'marketi', 'ora'];
  ok(pj.every(x => kreu.includes('Pjesa("' + x + '"')) && /"Përshtat faqen"/.test(kreu) && /"Si në fillim"/.test(kreu) && /detectDragGestures/.test(kreu) && /kreu_pjeset/.test(kreu),
    '3. Android: 9 pjesët e Kreut + "Përshtat faqen" (çelësat, zvarritja, Si në fillim)');
  ok(!/Mirë se vjen/.test(paKom(kreu)), '3. Android: pa "Mirë se vjen"');
  ok(!/clip\(RoundedCornerShape\(6\.dp\)\)/.test(logo.slice(logo.indexOf('fun EtiketaStoku'))), '3. Android: logoja e kokës pa qoshe të rrumbullakëta (barkodi s\'pritet)');
  ok(/disableAutoCancel\(\)/.test(sk) && /FLAG_AF or FocusMeteringAction\.FLAG_AE/.test(sk) && /coerceIn\(k\.left, k\.right\)/.test(sk) && /FOKUSI_CDO_MS/.test(sk),
    '2. Android: fokusi vetëm brenda kutisë (mesi i saj, çdo 2 s; prekja kufizohet brenda)');
  ok(/Hyrja\(88, "2026-11-17", "Kreu/.test(lx(K + 'TeRejat.kt')), '3. TeRejat.kt: Hyrja 88');

  // ===== 4. Dritaret e eksportit si "PDF për printim" (web tel + Android) + PC: fusha e barkodit =====
  const ix = lx('index.html'), eu = lx(K + 'ui/EksportetUI.kt');
  const dx = ix.slice(ix.indexOf('id="dlgAfExcel"'), ix.indexOf('id="dlgAfEksFoto"')), df = ix.slice(ix.indexOf('id="dlgAfEksFoto"'), ix.indexOf('id="dlgAfImport"'));
  ok(/class="ap-lista" id="axRreshtat"/.test(dx) && /class="ap-rresht"/.test(dx) && /id="axHint"/.test(dx) && !/type="checkbox"/.test(dx), '4. web: Excel me rreshta si te PDF-ja');
  ok(/id="aefRr"/.test(df) && /id="aefPanel" hidden/.test(df) && /id="aefHint"/.test(df), '4. web: "Si foto" me rreshtin "Furnizuesit" që hap listën');
  const exF = eu.slice(eu.indexOf('fun AfatetExcelFlete'), eu.indexOf('fun AfatetExcelFlete') + 6000), foF = eu.slice(eu.indexOf('fun AfatetFotoFlete'), eu.indexOf('fun AfatetFotoFlete') + 7000);
  ok(/RreshtiIOpsionit\(/.test(exF) && /RreshtiIButonit\(/.test(foF), '4. Android: Excel dhe foto me rreshta si te PDF-ja');
  ok(/\.sbp input\.inp\.mono \{ font-size: inherit; \}/.test(lx('css/stoku-pc.css')), '4. PC: fusha e barkodit me shkronja si fushat e tjera');

  // ===== 1 + 2. Web =====
  const { b, p } = await hapFaqen(chromium);
  await p.evaluate(() => {
    window.__kerkesat = [];
    const P = MediaStreamTrack.prototype, gc = P.getCapabilities;
    P.getCapabilities = function () { const c = Object.assign({}, gc ? gc.call(this) : {}); c.focusMode = ['continuous', 'single-shot']; c.zoom = { min: 1, max: 4, step: 0.1 }; c.torch = true; return c; };
    P.applyConstraints = function (k) { window.__kerkesat.push(JSON.parse(JSON.stringify(k))); return Promise.resolve(); };
  });
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  await p.click('#btnKamera'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const R = s => { const e = typeof s === 'string' ? document.querySelector(s) : s; const x = e.getBoundingClientRect(); return { l: Math.round(x.left), r: Math.round(x.right), t: Math.round(x.top), b: Math.round(x.bottom) }; };
    const k = document.querySelector('.skan-korniza'), cs = getComputedStyle(k);
    return { w: innerWidth, kutia: R(k), x: R('#mbyllKamere'), zoom: R('#kameraZoom'), drita: R('#kameraDrita'), hint: R('#skanHint'), poshte: R('.kamera-tekst'),
      vija: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, rrezja: cs.borderTopLeftRadius, qoshe: document.querySelectorAll('.skan-qoshe').length,
      xTekst: document.getElementById('mbyllKamere').textContent.trim(), xEmri: document.getElementById('mbyllKamere').getAttribute('aria-label'),
      hintT: document.getElementById('skanHint').textContent, poshteT: document.getElementById('kameraDrejtoje').textContent };
  });
  ok(r.qoshe === 0 && /^[23][.\d]*px solid rgb\(255, 255, 255\)$/.test(r.vija) && r.rrezja === '24px', '1. kutia e bardhë e plotë (pa qoshet), qoshet e rrumbullakëta', r);
  ok(Math.abs((r.kutia.r - r.kutia.l) - r.w * 0.78) < 3 && Math.abs((r.kutia.b - r.kutia.t) - (r.kutia.r - r.kutia.l) * 0.55) < 3, '1. kutia 78% e gjerësisë, lartësia 0.55 e saj (si Android)', r.kutia);
  ok(r.x.l < 30 && r.x.b < r.kutia.t && !r.xTekst && r.xEmri === 'Mbyll', '1. X lart majtas (pa tekst, "Mbyll" për lexuesin e ekranit)', { x: r.x, t: r.xTekst, e: r.xEmri });
  ok(r.zoom.l > r.w * 0.6 && r.drita.l > r.zoom.r && r.drita.b < r.kutia.t && Math.abs(r.drita.t - r.x.t) < 3, '1. zmadhimi dhe drita lart djathtas, në një vijë me X', { z: r.zoom, d: r.drita });
  ok(r.hint.t > r.kutia.b && r.hint.t < r.kutia.b + 40 && r.hintT === 'Vendos vetëm një barkod brenda kutisë', '1. "Vendos vetëm një barkod brenda kutisë" nën kuti', r.hint);
  ok(r.poshteT === 'Drejtoje kamerën te barkodi' && r.poshte.t > 844 * 0.8, '1. "Drejtoje kamerën te barkodi" poshtë', r.poshte);

  // 2. Fokusi: pika = mesi i kutisë (koordinatat e figurës)
  const f = await p.evaluate(() => {
    const v = document.getElementById('kameraVideo'), rv = v.getBoundingClientRect(), k = document.querySelector('.skan-korniza').getBoundingClientRect();
    const s = Math.max(rv.width / v.videoWidth, rv.height / v.videoHeight), ox = (rv.width - v.videoWidth * s) / 2, oy = (rv.height - v.videoHeight * s) / 2;
    const neFig = (x, y) => ({ x: (x - rv.left - ox) / s / v.videoWidth, y: (y - rv.top - oy) / s / v.videoHeight });
    const pikat = window.__kerkesat.flatMap(k => (k.advanced || []).filter(a => a.pointsOfInterest).map(a => a.pointsOfInterest[0]));
    return { pikat, mesi: neFig(k.left + k.width / 2, k.top + k.height / 2), majtas: neFig(k.left, k.top), djathtas: neFig(k.right, k.bottom), n: window.__kerkesat.length,
      menyra: window.__kerkesat.map(k => (k.advanced || [])[0] && k.advanced[0].focusMode).filter(Boolean) };
  });
  const brenda = q => q && q.x >= f.majtas.x - 0.001 && q.x <= f.djathtas.x + 0.001 && q.y >= f.majtas.y - 0.001 && q.y <= f.djathtas.y + 0.001;
  ok(f.pikat.length >= 2 && f.pikat.every(brenda) && f.pikat.every(q => Math.abs(q.x - f.mesi.x) < 0.01 && Math.abs(q.y - f.mesi.y) < 0.01) && f.menyra.includes('continuous'),
    '2. fokusi (continuous) me pikën në mes të kutisë, disa herë pas nisjes', f);
  // prekja jashtë kutisë (poshtë majtas) → pika brenda kutisë
  await p.evaluate(() => { window.__kerkesat = []; });
  await p.mouse.click(10, 700); await p.waitForTimeout(300);
  const f2 = await p.evaluate(() => window.__kerkesat.flatMap(k => (k.advanced || []).filter(a => a.pointsOfInterest).map(a => a.pointsOfInterest[0])));
  ok(f2.length >= 1 && f2.every(brenda) && Math.abs(f2[0].x - f.majtas.x) < 0.03 && Math.abs(f2[0].y - f.djathtas.y) < 0.03, '2. prekja jashtë kutisë: fokusi në skajin më të afërt brenda kutisë', { f2, f });
  // pas 2.5 s rikthehet te mesi
  await p.evaluate(() => { window.__kerkesat = []; }); await p.waitForTimeout(4200);
  const f3 = await p.evaluate(() => window.__kerkesat.flatMap(k => (k.advanced || []).filter(a => a.pointsOfInterest).map(a => a.pointsOfInterest[0])));
  ok(f3.length >= 1 && f3.every(q => Math.abs(q.x - f.mesi.x) < 0.01 && Math.abs(q.y - f.mesi.y) < 0.01), '2. pas prekjes fokusi kthehet te mesi i kutisë (rivendoset çdo 2.5 s)', f3);
  await p.screenshot({ path: __dirname + '/v326-kamera.png' });
  await p.click('#mbyllKamere'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !document.getElementById('kamera').classList.contains('hapur')), '1. X e mbyll kamerën');
  ok(!p.__gab.length, 'pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
  process.exit(g ? 1 : 0);
})();

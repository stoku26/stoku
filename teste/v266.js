// v266: (1) skaneri njeh krejt llojet e barkodeve përveç QR-së (përdoruesi: "mi njoft krejta barkodet qe egzistojn perveq qr
// code"): edhe Data Matrix, PDF417, Aztec (dhe te ZXing GS1 DataBar, MaxiCode); QR-ja vetëm njoftohet. Kodet 2D me tekst të
// gjatë (p.sh. GS1 Data Matrix i ilaçeve) pranohen nga kamera, edhe te Skanimi i shpejtë. (2) Afatet pa pllaka (si para v265).
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const DM = '0104012345678901 17271231 10LOT42'; // Data Matrix me hapësira, më i gjatë se 30 shenja
const PDF = 'PDF417-STOKU-12345';
const AZ = 'AZTEC-98765';

(async () => {
  const { b, p } = await hapFaqen(chromium);
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);

  // 1. Formatet që i kërkohen detektorit
  await p.evaluate(() => { window.__leximet = []; });
  await p.click('#btnKamera'); await p.waitForTimeout(800);
  const f = await p.evaluate(() => window.__formatet || []);
  const duhen = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'data_matrix', 'pdf417', 'aztec', 'qr_code'];
  ok(duhen.every(x => f.includes(x)) && !f.includes('micro_qr_code') && !f.includes('rm_qr_code'), '1. detektori: krejt formatet e standardit (edhe Data Matrix, PDF417, Aztec)', f);
  await mbyll(p);

  // 2. Data Matrix me tekst të gjatë: pranohet si barkod
  let s = await skano(p, Array(7).fill([DM, 'data_matrix', 'brenda']), 300);
  ok(s.dialogu && s.kodi.includes(DM), '2. Data Matrix (tekst i gjatë me hapësira): hap dritaren e produktit', s);
  await mbyll(p);
  s = await skano(p, Array(7).fill([PDF, 'pdf417', 'brenda']), 300);
  ok(s.dialogu && s.kodi.includes(PDF), '3. PDF417: pranohet', s);
  await mbyll(p);
  s = await skano(p, Array(7).fill([AZ, 'aztec', 'brenda']), 300);
  ok(s.dialogu && s.kodi.includes(AZ), '4. Aztec: pranohet', s);
  await mbyll(p);

  // 5. QR: vetëm njoftimi, si më parë
  s = await skano(p, Array(7).fill(['https://shembull.al', 'qr_code', 'brenda']), 300);
  const toast = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
  ok(!s.dialogu && /kod QR/.test(toast), '5. QR: s\'pranohet, vetëm "Ke skenuar një kod QR"', { s, toast });
  await mbyll(p);

  // 6. Skanimi i shpejtë: Data Matrix shtohet te lista
  await p.evaluate(() => { window.__leximet = []; window.__thirrje = 0; });
  await p.click('#btnSkanimShpejt');
  await p.waitForFunction(() => window.__thirrje > 3, null, { timeout: 8000 }).catch(() => {});
  await p.evaluate(l => { window.__leximet = l; }, Array(7).fill([DM, 'data_matrix', 'brenda']));
  await p.waitForFunction(() => window.__leximet.length === 0, null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(300);
  const rr = await p.evaluate(() => Array.from(document.querySelectorAll('#ssLista .ss-rresht')).map(r => r.getAttribute('data-barkodi')));
  ok(rr.length === 1 && rr[0] === DM, '6. Skanimi i shpejtë: Data Matrix shtohet te lista', rr);
  await p.click('#ssMbaro'); await p.waitForTimeout(300);

  // 7. Afatet: "Shto" dhe "Excel" si para v265; v268: folderi ka butonin lundrues (kamera + i shpejtë) dhe Excel/PDF lart
  const fp = await p.evaluate(() => Array.from(document.querySelectorAll('#skanFab button, #kryeButonatFolderi .btn-ikone')).filter(x => x.offsetParent).length);
  await p.click('#btnMbrapa'); await p.waitForTimeout(400);
  await p.click('#btnAfatet'); await p.waitForTimeout(800);
  const af = await p.evaluate(() => ({ pllaka: document.querySelectorAll('#afVeprime .sb-pllaka').length, shto: document.getElementById('afShto').className,
    excel: document.getElementById('afExcel').className, kolonat: getComputedStyle(document.getElementById('afVeprime')).gridTemplateColumns }));
  ok(fp === 4 && af.pllaka === 0 && af.shto === 'sb-action' && af.excel === 'sb-action', '7. butonat e rinj vetëm te Stoku; Afatet si më parë', { fp, af });

  const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 266 && nr(/app-tel\.js\?v=(\d+)/) >= 266 && nr(/teRejat\.js\?v=(\d+)/) >= 266 && nr(/stoku\.css\?v=(\d+)/) >= 51, '8. CACHE, app-tel.js, teRejat.js ≥ 266, stoku.css ≥ 51');
  const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
  ok(/\{ v: 266,[^\n]*platforma: 'tel'/.test(tr), '8. teRejat v266 (telefon)');

  ok(!p.__gab.length, '9. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

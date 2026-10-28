// v262: barkodi lexohet vetëm kur është i tëri brenda kutisë së bardhë (fotoja e përdoruesit: web-i e kapte barkodin poshtë
// kutisë, sepse figura që lexohet ka edhe hapësirë rreth saj). Me kamerën e rreme: brenda → pranohet; poshtë kutisë ose
// pjesërisht jashtë → s'merret fare (as "Skano përsëri", sepse brenda kutisë s'u lexua asgjë); dy barkode (njëri brenda,
// tjetri jashtë) → merret ai brenda. Edhe versionet, "Çka ka të re" v262 dhe stili i "Skano përsëri".
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const A = '3800001000019', B = '3800001000026';

(async () => {
  const { b, p } = await hapFaqen(chromium);
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);

  let s = await skano(p, Array(7).fill([A, 'ean_13', 'brenda']), 300);
  ok(s.dialogu && s.kodi.includes(A), '1. barkodi brenda kutisë: pranohet', s);
  await mbyll(p);

  s = await skano(p, Array(12).fill([B, 'ean_13', 'jashte']), 300);
  ok(!s.dialogu && s.kamera && s.perseri === 0 && s.bip === 0, '2. barkodi poshtë kutisë (si te fotoja): s\'merret fare', s);
  await mbyll(p);

  s = await skano(p, Array(12).fill([B, 'ean_13', 'gjysme']), 300);
  ok(!s.dialogu && s.kamera && s.perseri === 0, '3. barkodi që del pjesërisht jashtë kutisë: s\'merret', s);
  await mbyll(p);

  s = await skano(p, Array(7).fill([[B, 'ean_13', 'jashte'], [A, 'ean_13', 'brenda']]), 300);
  ok(s.dialogu && s.kodi.includes(A) && !s.kodi.includes(B), '4. dy barkode (B jashtë, A brenda): merret A', s);
  await mbyll(p);

  // 5. QR brenda kutisë: njoftohet si më parë dhe s'hap dritare
  s = await skano(p, Array(7).fill(['https://shembull.al', 'qr_code', 'brenda']), 300);
  const toast = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || '');
  ok(!s.dialogu && /kod QR/.test(toast), '5. kodi QR: njoftimi "Ke skenuar një kod QR"', { s, toast });
  await mbyll(p);

  // 6. Stili dhe versionet
  const stil = await p.evaluate(() => { const h = document.getElementById('skanHint'); h.classList.add('perseri'); const c = getComputedStyle(h).backgroundColor; h.classList.remove('perseri'); return c; });
  ok(stil === 'rgb(255, 82, 82)', '6. "Skano përsëri" me sfond të kuq', stil);
  const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
  ok(Number((sw.match(/stoku-v(\d+)/) || [])[1]) >= 262 && /app-tel\.js\?v=262/.test(sw) && /teRejat\.js\?v=262/.test(sw), '6. CACHE ≥ 262, app-tel.js?v=262, teRejat.js?v=262');
  const tr = await p.evaluate(() => fetch('teRejat.js?v=262').then(x => x.text()));
  ok(/\{ v: 262,[^\n]*platforma: 'tel'/.test(tr), '6. teRejat v262 (telefon)');

  ok(!p.__gab.length, '7. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

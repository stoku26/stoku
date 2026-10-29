// v264: Skanimi i shpejtë në web (foto e përdoruesit): kamera deri lart, me kontrollet ("Skanim i shpejtë", 1×, Mbyll) mbi të si
// në Android (jo shirit i zi më vete), dhe vetëm sa duhet: kontrollet, kutia dhe teksti nën të, pa hapësirë bosh poshtë (lista merr
// më shumë vend). Kamera e zakonshme ("Skano me kamerë") mbetet si ishte. Me kamerën e rreme (teste/kamera-e-rreme.js).
const { chromium } = require('./pw.js');
const { hapFaqen, mbyll } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const A = '3800001000019';

(async () => {
  const { b, p } = await hapFaqen(chromium);
  const masat = () => p.evaluate(() => {
    const r = s => { const e = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(e.top), b: Math.round(e.bottom), h: Math.round(e.height) }; };
    return { krye: r('#kamera .kamera-krye'), video: r('#kamera .kamera-video-shtrat'), kutia: r('#kamera .skan-korniza'), hint: r('#skanHint'),
      paneli: r('#skanShpejt'), pozita: getComputedStyle(document.querySelector('#kamera .kamera-krye')).position };
  });
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);

  await p.evaluate(() => { window.__leximet = []; window.__thirrje = 0; });
  await p.click('#btnSkanimShpejt');
  await p.waitForFunction(() => window.__thirrje > 3, null, { timeout: 8000 }).catch(() => {});
  let m = await masat();
  ok(m.video.t === 0 && m.pozita === 'absolute' && m.krye.t === 0 && m.krye.b > m.video.t, '1. kamera nis që lart; kontrollet janë mbi kamerë (pa shirit të zi më vete)', m);
  ok(m.kutia.t >= m.krye.b, '2. kutia nis nën kontrollet (s\'mbulohet nga butonat)', m);
  const bosh = m.video.b - m.hint.b;
  ok(bosh >= 4 && bosh <= 30, '3. nën tekstin "Vendos vetëm një barkod..." s\'mbetet hapësirë bosh', { bosh, m });
  ok(Math.abs(m.paneli.t - m.video.b) <= 1 && m.video.h < 340, '4. kamera më e vogël, lista nis menjëherë poshtë saj', m);

  // Leximi punon edhe me kutinë lart
  await p.evaluate(l => { window.__leximet = l; }, Array(7).fill([A, 'ean_13', 'brenda']));
  await p.waitForFunction(() => window.__leximet.length === 0, null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(300);
  const nr = await p.evaluate(() => document.querySelectorAll('#ssLista .ss-rresht').length);
  ok(nr === 1, '5. barkodi brenda kutisë shtohet te lista', nr);
  await p.click('#ssMbaro'); await p.waitForTimeout(400);

  // Kamera e zakonshme: si më parë (shiriti me kontrollet sipër, kamera poshtë tij, kutia në mes)
  await p.click('#btnKamera'); await p.waitForTimeout(800);
  m = await masat();
  ok(m.pozita !== 'absolute' && m.video.t >= m.krye.b && m.video.h > 500, '6. "Skano me kamerë" mbetet si ishte', m);
  await mbyll(p);

  const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
  const nrV = rx => Number((sw.match(rx) || [])[1]);
  ok(nrV(/stoku-v(\d+)/) >= 264 && nrV(/teRejat\.js\?v=(\d+)/) >= 264, '7. CACHE dhe teRejat.js ≥ 264');
  const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
  ok(/\{ v: 264,[^\n]*platforma: 'tel'/.test(tr), '7. teRejat v264 (telefon)');

  ok(!p.__gab.length, '8. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

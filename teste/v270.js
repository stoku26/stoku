// v270: kamera në web zë krejt ekranin si te Android-i (përdoruesi, 2 foto: "a pe sheh zi nalt ... mundohu mi eliminu let doket kamera
// komplet nqat hapsiren e zez"). Kamera e zakonshme: kontrollet mbi kamerë (jo shirit i zi më vete). Në telefon (ekran prekës), sa është
// kamera e hapur, faqja kalon në ekran të plotë (fshihet edhe shiriti i orës); kur mbyllet kthehet si ishte. PDA-ja s'preket.
const { chromium } = require('./pw.js');
const { hapFaqen, mbyll } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const gjendja = p => p.evaluate(() => {
  const r = s => { const e = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(e.top), b: Math.round(e.bottom), h: Math.round(e.height) }; };
  return { hapur: document.getElementById('kamera').classList.contains('hapur'), fs: document.fullscreenElement === document.documentElement,
    krye: r('#kamera .kamera-krye'), video: r('#kamera .kamera-video-shtrat'), kutia: r('#kamera .skan-korniza'),
    pozita: getComputedStyle(document.querySelector('#kamera .kamera-krye')).position, sfondi: getComputedStyle(document.querySelector('#kamera .kamera-krye')).backgroundColor };
});

(async () => {
  // Telefon me ekran prekës
  {
    const { b, p } = await hapFaqen(chromium, { prekje: true });
    await p.tap('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
    let s = await gjendja(p);
    ok(!s.fs, '1. para kamerës: pa ekran të plotë', s);
    await p.tap('#btnKamera'); await p.waitForTimeout(900);
    s = await gjendja(p);
    ok(s.hapur && s.fs, '2. "Skano me kamerë": ekran i plotë (fshihet edhe shiriti i orës)', s);
    ok(s.pozita === 'absolute' && s.krye.t === 0 && s.video.t === 0 && s.video.h === 844 && s.sfondi === 'rgba(0, 0, 0, 0)', '2. kamera nga lart deri poshtë, kontrollet mbi të pa shirit të zi', s);
    const mes = Math.round((s.kutia.t + s.kutia.b) / 2);
    ok(s.kutia.t >= s.krye.b && mes >= 380 && mes <= 460, '2. kutia në mes të ekranit, nën kontrollet', { mes, s });
    await p.tap('#mbyllKamere'); await p.waitForTimeout(600);
    s = await gjendja(p);
    ok(!s.hapur && !s.fs, '3. "Mbyll": kthehet si ishte (pa ekran të plotë)', s);

    await p.tap('#btnSkanimShpejt'); await p.waitForTimeout(900);
    s = await gjendja(p);
    ok(s.hapur && s.fs && s.video.t === 0 && s.krye.t === 0, '4. Skanimi i shpejtë: edhe ai në ekran të plotë, kamera nga lart', s);
    await p.tap('#ssMbaro'); await p.waitForTimeout(600);
    s = await gjendja(p);
    ok(!s.hapur && !s.fs, '4. "Mbaro": kthehet si ishte', s);

    // Kur faqja është tashmë në ekran të plotë (p.sh. kyçja e PDA-së), kamera s'e mbyll atë
    await p.evaluate(() => { const b = document.createElement('button'); b.id = 'provaFs'; b.textContent = 'fs'; b.style.cssText = 'position:fixed;top:0;left:0;z-index:99;width:40px;height:40px';
      b.addEventListener('click', () => { document.documentElement.requestFullscreen(); b.remove(); }); document.body.appendChild(b); });
    await p.tap('#provaFs'); await p.waitForTimeout(500);
    await p.tap('#btnKamera'); await p.waitForTimeout(800);
    await mbyll(p); await p.waitForTimeout(400);
    s = await gjendja(p);
    ok(!s.hapur && s.fs, '5. ekrani i plotë i hapur nga diçka tjetër mbetet pas mbylljes së kamerës', s);
    ok(!p.__gab.length, '6. pa gabime JS (telefon)', p.__gab);
    await b.close();
  }
  // Kompjuter (pa ekran prekës): pa ekran të plotë, por kamera po ashtu nga lart
  {
    const { b, p } = await hapFaqen(chromium);
    await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
    await p.click('#btnKamera'); await p.waitForTimeout(900);
    const s = await gjendja(p);
    ok(s.hapur && !s.fs && s.video.t === 0 && s.pozita === 'absolute', '7. pa ekran prekës: s\'kalon në ekran të plotë; kamera nga lart', s);
    await mbyll(p);
    const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
    const nr = rx => Number((sw.match(rx) || [])[1]);
    ok(nr(/stoku-v(\d+)/) >= 270 && nr(/app-tel\.js\?v=(\d+)/) >= 270 && nr(/teRejat\.js\?v=(\d+)/) >= 270, '8. CACHE, app-tel.js, teRejat.js ≥ 270');
    const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
    ok(/\{ v: 270,[^\n]*platforma: 'tel'/.test(tr), '8. teRejat v270 (telefon)');
    ok(!p.__gab.length, '9. pa gabime JS', p.__gab);
    await b.close();
  }
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

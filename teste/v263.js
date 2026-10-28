// v263: "Skanim i shpejtë" brenda folderit (telefoni). Kamera lart s'mbyllet; çdo barkod i pranuar (votimi 7 nga 10, vetëm
// brenda kutisë) ruhet menjëherë në folder (+1, edhe pa emër); i njëjti barkod s'del dy herë në listë, i rritet sasia jo më
// shpesh se çdo 1.5 s; fusha "+ copë" te çdo produkt (pa dritare); gjithsej. Me kamerën e rreme (teste/kamera-e-rreme.js).
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const A = '3800001000019', B = '3800001000026', C = '3800001000033';
const n = (k, x, poz) => Array(x).fill([k, 'ean_13', poz || 'brenda']);

(async () => {
  const { b, p } = await hapFaqen(chromium);
  const gjendja = () => p.evaluate(() => {
    const ls = JSON.parse(localStorage.getItem('stoku:produktet:v2') || '{}');
    const stoku = {}; Object.keys(ls).forEach(k => { stoku[ls[k].barkodi] = ls[k].sasia; });
    return {
      kamera: document.getElementById('kamera').classList.contains('hapur'), shpejt: document.getElementById('kamera').classList.contains('shpejt'),
      paneli: getComputedStyle(document.getElementById('skanShpejt')).display !== 'none',
      dialogu: document.getElementById('dlgProdukt').classList.contains('hapur'),
      gjithsej: document.getElementById('ssGjithsej').textContent, nen: document.getElementById('ssNen').textContent,
      bosh: getComputedStyle(document.getElementById('ssBosh')).display !== 'none',
      rreshtat: Array.from(document.querySelectorAll('#ssLista .ss-rresht')).map(r => ({ emri: r.querySelector('.ss-emri').textContent,
        kodi: r.querySelector('.ss-kodi').textContent, nr: r.querySelector('.ss-nr b').textContent, fundit: r.classList.contains('ss-fundit') })),
      stoku, bip: window.__bip, toast: (document.getElementById('toast') || {}).textContent || ''
    };
  });
  const ushqe = async (l, pas) => {
    await p.evaluate(l => { window.__leximet = window.__leximet.concat(l); }, l);
    await p.waitForFunction(() => window.__leximet.length === 0, null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(pas == null ? 250 : pas);
  };
  const hapShpejt = async () => {
    await p.evaluate(() => { window.__leximet = []; window.__thirrje = 0; window.__bip = 0; });
    await p.click('#btnSkanimShpejt');
    await p.waitForFunction(() => window.__thirrje > 3, null, { timeout: 8000 }).catch(() => {});
  };
  const fusha = (kodi) => `#ssLista .ss-rresht[data-barkodi="${kodi}"] .ss-shto`;

  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  const btn = await p.evaluate(() => { const x = document.getElementById('btnSkanimShpejt'); return { t: x.textContent, duket: !!x.offsetParent }; });
  ok(btn.t === 'Skanim i shpejtë' && btn.duket, '1. butoni "Skanim i shpejtë" brenda folderit', btn);

  // Produkti B me emër dhe 10 copë (me kamerën e zakonshme dhe dritaren)
  let s = await skano(p, n(B, 7), 300);
  ok(s.dialogu, '2. (përgatitja) kamera e zakonshme hap dritaren për B', s);
  await p.fill('#dlgEmri', 'Ujë Rugove'); await p.fill('#dlgSasia', '10'); await p.click('#dlgRuaj'); await p.waitForTimeout(300);

  await hapShpejt();
  let x = await gjendja();
  ok(x.kamera && x.shpejt && x.paneli && x.bosh && x.rreshtat.length === 0 && x.gjithsej === 'Gjithsej: 0 copë', '3. hapet: kamera lart, paneli poshtë, lista bosh', x);
  const kutia = await p.evaluate(() => { const v = document.querySelector('#kamera .kamera-video-shtrat').getBoundingClientRect(), k = document.getElementById('skanShpejt').getBoundingClientRect(); return { v: Math.round(v.bottom), k: Math.round(k.top), h: Math.round(v.height) }; });
  ok(kutia.h > 150 && kutia.h < 844 * 0.6 && Math.abs(kutia.v - kutia.k) <= 1, '3. kamera zë pjesën e sipërme, lista menjëherë poshtë', kutia);

  await ushqe(n(A, 7));
  x = await gjendja();
  ok(x.kamera && !x.dialogu && x.rreshtat.length === 1 && x.rreshtat[0].nr === '1' && x.rreshtat[0].emri === '(pa emër)' && x.stoku[A] === 1 && x.bip === 1,
    '4. barkod i ri: ruhet menjëherë (1 copë, pa emër), pa dritare, kamera mbetet', x);

  await ushqe(n(A, 14));
  x = await gjendja();
  ok(x.rreshtat.length === 1 && x.rreshtat[0].nr === '1' && x.stoku[A] === 1, '5. i njëjti barkod brenda 1.5 s: s\'shtohet sërish', x);

  await p.waitForTimeout(1400);
  await ushqe(n(A, 7));
  x = await gjendja();
  ok(x.rreshtat.length === 1 && x.rreshtat[0].nr === '2' && x.stoku[A] === 2, '6. pas 1.5 s: +1 (një rresht, 2 copë)', x);

  await ushqe(n(B, 7));
  x = await gjendja();
  ok(x.rreshtat.length === 2 && x.rreshtat[0].kodi.startsWith(B) && x.rreshtat[0].emri === 'Ujë Rugove' && x.rreshtat[0].nr === '1' && x.stoku[B] === 11 &&
    /në stok 11/.test(x.rreshtat[0].kodi) && x.gjithsej === 'Gjithsej: 3 copë' && /2 produkte/.test(x.nen), '7. produkti që ekziston: me emër, stoku 10 → 11, lart në listë; gjithsej 3', x);

  await ushqe(n(A, 7));
  x = await gjendja();
  ok(x.rreshtat.length === 2 && x.rreshtat[1].kodi.startsWith(A) && x.rreshtat[1].nr === '3' && x.rreshtat[1].fundit && !x.rreshtat[0].fundit,
    '8. A sërish: s\'del dy herë, mbetet në vend dhe shënohet si i fundit (3 copë)', x);

  // Fusha "+ copë" (pa dritare)
  const btnDuket = () => p.evaluate(k => getComputedStyle(document.querySelector(`#ssLista .ss-rresht[data-barkodi="${k}"] .ss-btn`)).display !== 'none', A);
  ok(!(await btnDuket()), '9. butoni "Shto" fshihet kur fusha është bosh');
  await p.fill(fusha(A), '5');
  ok(await btnDuket(), '9. ... del kur shkruhet numri');
  await p.press(fusha(A), 'Enter'); await p.waitForTimeout(250);
  x = await gjendja();
  const vlera = await p.inputValue(fusha(A));
  ok(x.rreshtat[1].nr === '8' && x.stoku[A] === 8 && vlera === '' && x.kamera && !x.dialogu && x.gjithsej === 'Gjithsej: 9 copë', '10. "+5" me Enter: 8 copë, stoku 8, fusha zbrazet, kamera mbetet', { x, vlera });

  await p.fill(fusha(A), '-1'); await p.click(`#ssLista .ss-rresht[data-barkodi="${A}"] .ss-btn`); await p.waitForTimeout(250);
  x = await gjendja();
  ok(x.rreshtat[1].nr === '7' && x.stoku[A] === 7 && x.gjithsej === 'Gjithsej: 8 copë', '11. "-1" (korrigjim) me butonin Shto: 7 copë', x);

  await p.type(fusha(A), 'ab'); const v2 = await p.inputValue(fusha(A));
  ok(v2 === '', '12. fusha pranon vetëm numra', v2);

  await ushqe(n(C, 12, 'jashte'));
  x = await gjendja();
  ok(x.rreshtat.length === 2 && x.stoku[C] === undefined, '13. barkodi jashtë kutisë s\'merret', x);

  await ushqe(Array(7).fill(['https://shembull.al', 'qr_code', 'brenda']), 300);
  x = await gjendja();
  ok(x.rreshtat.length === 2 && /kod QR/.test(x.toast), '14. kodi QR: njoftimi, pa rresht të ri', x);

  await p.click('#ssMbaro'); await p.waitForTimeout(400);
  x = await gjendja();
  ok(!x.kamera && !x.shpejt && x.stoku[A] === 7 && x.stoku[B] === 11, '15. "Mbaro" e mbyll; sasitë mbeten të ruajtura', x);
  const lista = await p.evaluate(() => document.getElementById('lista').textContent);
  ok(lista.includes('Ujë Rugove') && lista.includes(A), '15. ... dhe duken te lista e folderit', lista.slice(0, 200));

  await hapShpejt();
  x = await gjendja();
  ok(x.kamera && x.shpejt && x.rreshtat.length === 0 && x.gjithsej === 'Gjithsej: 0 copë', '16. hapja e re: lista e re (bosh)', x);
  await p.click('#mbyllKamere'); await p.waitForTimeout(400);
  x = await gjendja();
  ok(!x.kamera && !x.shpejt, '16. X e mbyll', x);

  // Kamera e zakonshme pas Skanimit të shpejtë: pa panelin; produkti që ekziston numërohet si më parë (+1, pa dritare)
  s = await skano(p, n(B, 7), 300);
  x = await gjendja();
  ok(s.kamera && !x.shpejt && !x.paneli && !s.dialogu && x.stoku[B] === 12, '17. "Skano me kamerë" mbetet si më parë (pa panelin)', { s, x });
  await mbyll(p);

  // PDA: butoni s'duket
  await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = true; c.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(200);
  const pda = await p.evaluate(() => !!document.getElementById('btnSkanimShpejt').offsetParent);
  ok(!pda, '18. PDA: pa "Skanim i shpejtë"', pda);
  await p.evaluate(() => { const c = document.getElementById('opsPda'); c.checked = false; c.dispatchEvent(new Event('change')); });

  const sw = await p.evaluate(() => fetch('sw.js').then(x => x.text()));
  const nr = rx => Number((sw.match(rx) || [])[1]);
  ok(nr(/stoku-v(\d+)/) >= 263 && nr(/app-tel\.js\?v=(\d+)/) >= 263 && nr(/teRejat\.js\?v=(\d+)/) >= 263, '19. CACHE, app-tel.js dhe teRejat.js ≥ 263');
  const tr = await p.evaluate(() => fetch('teRejat.js?v=' + Date.now()).then(x => x.text()));
  ok(/\{ v: 263,[^\n]*platforma: 'tel'/.test(tr), '19. teRejat v263 (telefon)');

  ok(!p.__gab.length, '20. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

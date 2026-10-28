// Shpejtësia dhe leximet e përziera të votimit (v261 e nisi me 5 nga 10; v262: 7 të njëjta nga 10 tentime), me kamerën e rreme:
// 7 lexime rresht → dritarja hapet menjëherë; një lexim i gabuar në mes s'e pengon; leximet e gabuara s'fitojnë kurrë;
// pas "Skano përsëri" skanimi vazhdon dhe barkodi pranohet kur lexohet mirë.
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const A = '3800001000019', B = '3800001000026', C = '3800001000033';
const n = (k, x) => Array(x).fill([k, 'ean_13']);

(async () => {
  const { b, p } = await hapFaqen(chromium);
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);

  let s = await skano(p, n(A, 7), 300);
  ok(s.dialogu && s.kodi.includes(A) && s.tentimeNeDritare === 7, '1. 7 lexime rresht: hapet menjëherë, te tentimi i 7-të (pa pritur sekondën)', s);
  await mbyll(p);

  s = await skano(p, [[B, 'ean_13']].concat(n(A, 3), [null], n(A, 4)), 300);
  ok(s.dialogu && s.kodi.includes(A) && !s.kodi.includes(B), '2. B, 3 A, një kuadër bosh, 4 A: hapet A (7 nga 9)', s);
  await mbyll(p);

  s = await skano(p, [[B, 'ean_13'], [C, 'ean_13']].concat(n(A, 2), [[B, 'ean_13']], n(A, 2), [[C, 'ean_13']], n(A, 2)), 300);
  ok(!s.dialogu && s.perseri >= 1 && s.bip === 0, '3. leximet e përziera (A=6, B=2, C=2): asgjë s\'pranohet, "Skano përsëri"', s);
  await mbyll(p);

  // 4. Pas "Skano përsëri" (dështim) kamera vazhdon: leximi i mirë pranohet
  s = await skano(p, n(A, 4).concat([null, null, null, null], n(A, 7)), 300);
  ok(s.dialogu && s.kodi.includes(A) && s.perseri >= 1, '4. pas "Skano përsëri" barkodi pranohet kur lexohet 7 herë', s);
  await mbyll(p);

  ok(!p.__gab.length, '5. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

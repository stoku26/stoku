// Votimi i leximeve të kamerës (app-tel.js krijoVotimin; Android: VotimiIBarkodit te vendas/logjika, VotimiTest.kt me të njëjtat
// raste). v260 e nisi; v262 (rregulli i tanishëm): nga leximi i parë, te 10 tentimet e radhës (çdo kuadër, edhe pa barkod) barkodi
// duhet të dalë 7 herë njësoj; përndryshe "Skano përsëri", pa zë. Pjesa 2: kamera e rreme (teste/kamera-e-rreme.js).
const { chromium } = require('./pw.js');
const { hapFaqen, skano, mbyll } = require('./kamera-e-rreme.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const A = '3800001000019', B = '3800001000026'; // EAN-13 me shifër kontrolli të saktë
const N = n => Array(n).fill(null);

(async () => {
  const { b, p } = await hapFaqen(chromium);

  // 1. Rregulli (si VotimiTest.kt)
  const r = await p.evaluate(([A, B]) => {
    const tento = (v, l) => l.map(k => { const x = v.tentim(k, 'EAN_13'); return x ? (x.deshtoi ? 'DESHTOI' : x.kodi) : null; });
    const o = {}; let v;
    v = StokuVotimi(); o.shtate = tento(v, Array(7).fill(A)).concat([v.aktiv()]);
    v = StokuVotimi(); o.paLexim = tento(v, [null, null, null, null, null]).concat([v.aktiv()]);
    v = StokuVotimi(); o.gjashte = tento(v, Array(6).fill(A).concat([null, null, null, null])).concat([v.aktiv()]);
    v = StokuVotimi(); o.gabimet = tento(v, [B, A, A, B, A, A, A, A, A]);
    v = StokuVotimi(); o.here = tento(v, [A, null, null, null, null]).concat(tento(v, [A]), [v.aktiv()]);
    v = StokuVotimi(); o.ndare = tento(v, [A, B, A, B, A, B, A, B]);
    v = StokuVotimi(); tento(v, Array(6).fill(A)); v.rinis(); o.rinis = [v.aktiv()].concat(tento(v, [A]), [v.aktiv()]);
    return o;
  }, [A, B]);
  ok(JSON.stringify(r.shtate) === JSON.stringify(N(6).concat([A, false])), '1. 7 herë njësoj: pranohet', r.shtate);
  ok(JSON.stringify(r.paLexim) === JSON.stringify(N(5).concat([false])), '1. para leximit të parë s\'ka votim', r.paLexim);
  ok(JSON.stringify(r.gjashte) === JSON.stringify(N(9).concat(['DESHTOI', false])), '1. 6 herë njësoj nga 10: Skano përsëri', r.gjashte);
  ok(JSON.stringify(r.gabimet) === JSON.stringify(N(8).concat([A])), '1. leximet e gabuara s\'e pengojnë A-në që arrin 7', r.gabimet);
  ok(JSON.stringify(r.here) === JSON.stringify(N(4).concat(['DESHTOI', null, true])), '1. dështon herët kur 7 s\'arrihet dot; leximi i radhës nis votim të ri', r.here);
  ok(JSON.stringify(r.ndare) === JSON.stringify(N(7).concat(['DESHTOI'])), '1. dy kode të ndara (4 + 4): Skano përsëri', r.ndare);
  ok(JSON.stringify(r.rinis) === JSON.stringify([false, null, true]), '1. rinisja', r.rinis);

  // 2. Kamera e rreme
  await p.click('.folder-karta >> text=Pije'); await p.waitForTimeout(600);
  let s = await skano(p, Array(7).fill([A, 'ean_13']), 300);
  ok(s.dialogu && s.kodi.includes(A) && !s.kamera && s.bip >= 1, '2a. 7 herë A: hapet A, me tingull', s);
  await mbyll(p);
  s = await skano(p, Array(6).fill([A, 'ean_13']), 100);
  ok(!s.dialogu && s.kamera && s.perseri >= 1 && s.bip === 0, '2b. 6 herë A: s\'pranohet; "Skano përsëri", pa tingull', s);
  ok(/Skano përsëri/.test(s.hint), '2b. ... teksti nën kuti: "Skano përsëri"', s.hint);
  await p.waitForTimeout(1700);
  ok(await p.evaluate(() => document.getElementById('skanHint').textContent === 'Vendos vetëm një barkod brenda kutisë'), '2b. ... pas 1.5 s kthehet udhëzimi');
  await mbyll(p);
  s = await skano(p, [[A, 'ean_13']], 300);
  ok(!s.dialogu && s.kamera && s.bip === 0, '2c. një lexim i vetëm (edhe EAN i saktë): s\'pranohet më', s);
  await mbyll(p);
  s = await skano(p, Array(7).fill(['ABC-123', 'code_128']), 300);
  ok(s.dialogu && s.kodi.includes('ABC-123'), '2d. Code 128 7 herë: pranohet', s);
  await mbyll(p);
  // 2e. Kamera mbyllet para vendimit: dritarja s'hapet më vonë
  await p.evaluate(l => { window.__leximet = l.slice(); }, Array(3).fill([B, 'ean_13']));
  await p.click('#btnKamera'); await p.waitForTimeout(60);
  await p.click('#mbyllKamere'); await p.waitForTimeout(1200);
  const e = await p.evaluate(() => ({ dialogu: document.getElementById('dlgProdukt').classList.contains('hapur'), kamera: document.getElementById('kamera').classList.contains('hapur') }));
  ok(!e.dialogu && !e.kamera, '2e. kamera e mbyllur para vendimit: pa dritare', e);

  ok(!p.__gab.length, '3. pa gabime JS', p.__gab);
  await b.close();
  console.log(g ? 'GABIME: ' + g : 'Krejt në rregull');
  process.exit(g ? 1 : 0);
})();

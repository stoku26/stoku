// v216 (kontrolli i plotë me rishikim): funksionet e përbashkëta (afatet.js, xlsx.js, ruajtja.js, njoftimet.js)
const AF = require('../afatet.js');
const X = require('../xlsx.js');
const RJ = require('../ruajtja.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
function ruajtje(fillim) { const m = { 'stoku:kujtesa:v1': JSON.stringify(fillim || {}) }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, m }; }
const lexo = r => JSON.parse(r.m['stoku:kujtesa:v1']);
(async () => {
  // 1) Excel: "12.10" (dita.muaji) e ruajtur si numri 12.1 → 12 tetor (jo 12 janar); "10.30" → fundi i tetorit 2030
  const v = new Date().getFullYear();
  const d1 = AF.dataNgaQeliza(12.1), d2 = AF.dataNgaQeliza(10.203), d3 = AF.dataNgaQeliza(5.11);
  ok(/^\d{4}-10-12$/.test(d1), '1. 12.1 nga Excel-i = 12 tetor', d1);
  ok(d2 === '2030-10-31', '1b. 10.203 ("10.2030" muaji.viti) = fundi i tetorit 2030', d2);
  ok(/^\d{4}-11-05$/.test(d3), '1c. 5.11 = 5 nëntor', d3);
  ok(/^\d{4}-05-12$/.test(AF.dataNgaQeliza(12.5)) && /^\d{4}-03-15$/.test(AF.dataNgaQeliza(15.3)) && AF.dataNgaQeliza(5.2026) === '2026-05-31', '1e. 12.5, 15.3, 5.2026 si më parë', [AF.dataNgaQeliza(12.5), AF.dataNgaQeliza(15.3), AF.dataNgaQeliza(5.2026)]);
  ok(AF.dataNgaQeliza(46300) && /^\d{4}-\d{2}-\d{2}$/.test(AF.dataNgaQeliza(46300)), '1d. numri serial i Excel-it punon si më parë', AF.dataNgaQeliza(46300));

  // 2) "Furnitori" njihet si kolona e furnizuesit
  const k = AF.hamendesoKolonatEAfateve([['Barkodi', 'Emri', 'Data e skadimit', 'Sasia', 'Furnitori'], ['123', 'Kos', '12.10.2026', '3', 'Vita']], true);
  ok(k.furnizuesi === 4, '2. titulli "Furnitori" → kolona e furnizuesit', k);

  // 3) "para N ditësh" (rasa rrjedhore)
  const sot = AF.sot(), dt = new Date(); dt.setDate(dt.getDate() - 5);
  const para5 = AF.isoNgaData(dt);
  ok(/Ka skaduar para 5 ditësh\./.test(AF.pershkrimi({ data: para5, statusi: 'aktiv' })), '3. "Ka skaduar para 5 ditësh"', AF.pershkrimi({ data: para5, statusi: 'aktiv' }));
  ok(AF.ditetParaTekst(1) === '1 dite' && AF.ditetParaTekst(7) === '7 ditësh' && AF.ditetTekst(7) === '7 ditë', '3b. ditetParaTekst');

  // 4) Riemërtimi i furnizuesit: hapësirat e dyfishta njësohen
  const r4 = AF.riemertoFurnizuesin([{ id: 'a', furnizuesi: 'Meridian  Group' }, { id: 'b', furnizuesi: 'Meridian Group' }, { id: 'c', furnizuesi: 'Tjetër' }],
    { 'f::1': { barkodi: '1', kategoriaId: 'f', furnizuesi: ' Meridian\tGroup ' } }, 'Meridian Group', 'Meridian', 1);
  ok(r4.nAfate === 2 && r4.nProdukte === 1 && r4.afatet[0].furnizuesi === 'Meridian' && r4.afatet[2].furnizuesi === 'Tjetër', '4. "Meridian  Group" riemërtohet bashkë me "Meridian Group"', r4);

  // 5) Fshirja e furnizuesit: produkti që kishte vetëm furnizuesin (pa emër) s'e mban më
  (function () {
    const r = ruajtje({ '111': { e: '', f: 'Meridian', k: 5 }, '222': { e: 'Caj', f: 'Meridian', k: 5 }, 'furnizuesi Meridian': { e: 'Meridian', f: '', k: 1, s: 1 } });
    const K = AF.krijoKujtesen(r); K.vendosAutorin('mendurberisha', true);
    const n = K.fshijFurnizuesin('Meridian'); const H = lexo(r);
    ok(n === 2 && H['111'].x === 1 && H['222'].f === '' && H['222'].e === 'Caj' && !K.merr('111'), '5. 111 (pa emër) harrohet, 222 mbetet pa furnizues', { n, H });
  })();

  // 6) Kujtesa e madhe: bashkimi me grupin dhe mësimi i shumë rreshtave s'e kalojnë krejt kujtesën për çdo rresht
  (function () {
    const h = {};
    for (let i = 0; i < 18000; i++) h['8' + String(i).padStart(7, '0')] = { e: 'P' + i, f: 'F' + (i % 300), k: 100 + i, n: 'agim' };
    for (let i = 0; i < 1500; i++) h['9' + String(i).padStart(7, '0')] = { e: 'Q' + i, f: 'R' + i, k: 50000 + i, n: 'besa' }; // në pritje, pa hyrje furnizuesi
    const r = ruajtje(h); const K = AF.krijoKujtesen(r); K.vendosAutorin('mendurberisha', true);
    let t = Date.now(); K.bashko({ '70000001': { e: 'X', f: 'Y', k: 1e12, n: 'drini' } }); const tb = Date.now() - t;
    const H = lexo(r);
    ok(H['furnizuesi R0'] && H['furnizuesi R1499'] && H['furnizuesi Y'], '6. furnizuesit e produkteve në pritje krijohen (si më parë)');
    ok(tb < 2500, '6b. bashkimi me grupin: ' + tb + ' ms (më parë disa sekonda)', tb);
    const lista = []; for (let i = 0; i < 2000; i++) lista.push({ barkodi: '6' + String(i).padStart(7, '0'), emri: 'Z' + i, furnizuesi: 'S' + (i % 50) });
    t = Date.now(); K.mesoShume(lista, 'mbishkruaj'); const tm = Date.now() - t;
    ok(tm < 2500, '6c. mësimi i 2000 rreshtave: ' + tm + ' ms', tm);
    ok(K.furnizuesit().filter(f => /^S\d+$/.test(f.emri)).length === 50, '6d. 50 furnizuesit e rinj, pa dyfishime');
  })();

  // 7) Importi: rreshtat e përsëritur bashkohen (sasitë mblidhen) — tani me hartë, jo n²
  (function () {
    const rows = [['Barkodi', 'Emri', 'Data', 'Sasia']];
    for (let i = 0; i < 3000; i++) rows.push(['5' + String(i % 1000).padStart(6, '0'), 'P', '12.10.2030', '2']);
    const plan = AF.planiImportitAfateve([{ name: 'F', rows }], { meKoke: true, kol: AF.hamendesoKolonatEAfateve(rows, true) });
    let t = Date.now(); const out = AF.afatetNgaPlani(plan); const ta = Date.now() - t;
    ok(out.length === 1000 && out.every(a => a.sasia === 6), '7. 3000 rreshta → 1000 afate me sasi 6 (2+2+2)', [out.length, out[0] && out[0].sasia]);
    ok(ta < 1000, '7b. ' + ta + ' ms', ta);
  })();

  // 8) Emri i fletës në Excel: s'fillon e s'mbaron me apostrof edhe pas shkurtimit
  const bytes = X.buildWorkbook(["Distributori kryesor i pijeve 'Coca Cola'", " 'Vita' ", "Pije'", "'''"].map(n => ({ name: n, columns: [{ title: 'A' }], rows: [['x']] })));
  const emrat = (Buffer.from(bytes).toString('latin1').match(/<sheet name="[^"]*"/g) || []).map(s => s.slice(13, -1));
  ok(emrat.every(e => e.length <= 31 && !/^'|'$/.test(e) && e.length), '8. emrat e fletëve pa apostrof në skaje', emrat);

  // 9) Ruajtja: kryesori s'rishkruhet kur ndryshon vetëm "koha"; "permission-denied" i rastësishëm s'kalon në mënyrën e vjetër
  (async function () {
    const docs = new Map(); let shkrime = [], mohoP0 = false;
    const ref = (...p) => ({ path: p.join('/') });
    const snap = (path) => ({ exists: () => docs.has(path), data: () => JSON.parse(JSON.stringify(docs.get(path))) });
    const fs = {
      doc: (db, ...p) => ref(...p), collection: (db, ...p) => ref(...p),
      getDoc: async r => { if (mohoP0 && /pjeset\/p0$/.test(r.path)) { const e = new Error('Missing or insufficient permissions'); e.code = 'permission-denied'; throw e; } return snap(r.path); },
      runTransaction: async (db, fn) => {
        const tx = { get: async r => snap(r.path), set: (r, v) => { shkrime.push(r.path); docs.set(r.path, JSON.parse(JSON.stringify(v))); } };
        return fn(tx);
      },
      onSnapshot: () => () => {}
    };
    const R = RJ.krijo(fs, {}, () => 'u1');
    const B = { bashko: (c, l) => Object.assign({}, l, { koha: new Date().toISOString() }) };
    const lok = { app: 'stoku', foldera: [{ id: 'f1', emri: 'A' }], produktet: [{ kategoriaId: 'f1', barkodi: '1', sasia: 2, prekurSe: 5 }], afatet: [], fshira: { produktet: {}, foldera: {}, afatet: {} }, rendiKoha: 0 };
    let r = await R.bashkoDheRuaj(c => B.bashko(c, lok));
    ok(r.ok && shkrime.indexOf('dyqane/u1') !== -1, '9. ruajtja e parë: shkruhet kryesori', shkrime);
    shkrime = [];
    await new Promise(z => setTimeout(z, 5));
    r = await R.bashkoDheRuaj(c => B.bashko(c, lok));
    ok(r.ok && shkrime.length === 0, '9b. sinkronizim pa ndryshime (vetëm "koha" e re): asnjë shkrim', shkrime);
    shkrime = [];
    const lok2 = Object.assign({}, lok, { foldera: lok.foldera.concat([{ id: 'f2', emri: 'B' }]) });
    r = await R.bashkoDheRuaj(c => B.bashko(c, lok2));
    ok(r.ok && shkrime.length === 1 && shkrime[0] === 'dyqane/u1', '9c. folder i ri: vetëm kryesori (pjesët s\'ndryshuan)', shkrime);
    // "permission-denied" vetëm për p0 (rregullat e vjetra) → merr() kalon në mënyrën e vjetër; kur s'lexohet as kryesori, jo
    mohoP0 = true;
    const m1 = await R.merr();
    ok(m1.ok && R.modaPjeseve() === false, '9d. rregullat e vjetra (p0 s\'lejohet, kryesori po): mënyra me një dokument', [m1.ok, R.modaPjeseve()]);
    const R2 = RJ.krijo(Object.assign({}, fs, { getDoc: async r2 => { const e = new Error('Missing or insufficient permissions'); e.code = 'permission-denied'; throw e; } }), {}, () => 'u1');
    const m2 = await R2.merr();
    ok(!m2.ok && R2.modaPjeseve() === true, '9e. llogari pa qasje fare: gabim, por mbetet mënyra me pjesë', [m2.ok, R2.modaPjeseve()]);
    console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
    process.exit(g ? 1 : 0);
  })();
})();

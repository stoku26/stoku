// v215 (kontrolli i plotë): kujtesa e produkteve
//  1) kur kujtesa kalon kufirin (20 000), hiqen produktet më të vjetra, kurrë furnizuesit e ruajtur më vete (kanë kohën 1);
//  2) importet (mbishkruaj): rreshti pa barkod me furnizues të ri e ruan furnizuesin më vete, në pritje;
//     mësimi në sfond (plotëso) s'e bën këtë (një afat i vjetër s'e kthen një furnizues të fshirë).
const AF = require('../afatet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
function ruajtje(fillim) { const m = { 'stoku:kujtesa:v1': JSON.stringify(fillim || {}) }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, m }; }
const lexo = r => JSON.parse(r.m['stoku:kujtesa:v1']);

// 1) Kufiri: 20 000 produkte + 3 furnizues me kohën 1 → shtohen 5 të reja → hiqen 5 produktet më të vjetra, furnizuesit mbeten
(function () {
  const h = {};
  for (let i = 0; i < 20000; i++) h['b' + i] = { e: 'P' + i, f: '', k: 1000 + i };
  ['Frutex', 'Rugove', 'Vipa'].forEach(f => { h['furnizuesi ' + f] = { e: f, f: '', k: 1, s: 1 }; });
  const r = ruajtje(h);
  const K = AF.krijoKujtesen(r);
  K.vendosAutorin('mendurberisha', true);
  K.mesoShume([1, 2, 3, 4, 5].map(i => ({ barkodi: 'r' + i, emri: 'I ri ' + i, furnizuesi: '' })), 'mbishkruaj');
  const H = lexo(r), ks = Object.keys(H);
  ok(ks.length === 20000, 'kufiri 20 000 mbahet', ks.length);
  ok(['Frutex', 'Rugove', 'Vipa'].every(f => H['furnizuesi ' + f] && !H['furnizuesi ' + f].x), 'furnizuesit (koha 1) s\'hiqen kur kujtesa kalon kufirin');
  ok(!H.b0 && !H.b7 && !!H.b8, 'hiqen produktet më të vjetra (b0..b7: 20 008 − 20 000), mbetet b8');
  ok(['r1', 'r5'].every(b => !!H[b]), 'produktet e reja mbeten');
  ok(K.furnizuesit().filter(f => !f.fshire).length === 3, 'lista e furnizuesve: 3', K.furnizuesit().length);
})();

// 2) Import: rresht pa barkod me furnizues të ri → furnizuesi në pritje (koleg: me autorin)
(function () {
  const r = ruajtje({});
  const K = AF.krijoKujtesen(r);
  K.vendosAutorin('agim', false);
  let njoftuar = [];
  K.degjo(l => { njoftuar = njoftuar.concat(l); });
  K.mesoShume([{ barkodi: '', emri: 'Qumësht', furnizuesi: 'Furn Ri' }, { barkodi: '  ', emri: 'Kos', furnizuesi: 'Furn Ri' }], 'mbishkruaj');
  const H = lexo(r);
  const x = H['furnizuesi Furn Ri'];
  ok(!!x && x.n === 'agim' && !x.x, 'importi pa barkod: furnizuesi i ri ruhet më vete, në pritje (nga agim)', x);
  ok(K.furnizuesit().some(f => f.emri === 'Furn Ri' && f.nePritje), 'del te furnizuesit në pritje');
  ok(njoftuar.indexOf('furnizuesi Furn Ri') !== -1, 'shkon edhe te grupi (dëgjuesit njoftohen)', njoftuar);
  ok(Object.keys(H).length === 1, 'asnjë "produkt" pa barkod s\'ruhet', Object.keys(H));
})();

// 3) Mësimi në sfond (plotëso): rreshti pa barkod s'e krijon furnizuesin, edhe kur është i fshirë më parë
(function () {
  const r = ruajtje({ 'furnizuesi Furn Vjetër': { x: 1, k: 5000, s: 1 } });
  const K = AF.krijoKujtesen(r);
  K.vendosAutorin('mendurberisha', true);
  K.mesoShume([{ barkodi: '', emri: 'Afat i vjetër', furnizuesi: 'Furn Vjetër' }, { barkodi: '', emri: 'Tjetër', furnizuesi: 'Furn Krejt i Ri' }], 'plotëso');
  const H = lexo(r);
  ok(H['furnizuesi Furn Vjetër'] && H['furnizuesi Furn Vjetër'].x === 1, 'plotëso: i fshiri mbetet i fshirë');
  ok(!H['furnizuesi Furn Krejt i Ri'], 'plotëso: s\'krijohet furnizues nga rreshta pa barkod');
})();

// 4) Import nga administratori: rreshti pa barkod me furnizues ekzistues (pa dallim shkronjash) s'krijon dyfish
(function () {
  const r = ruajtje({ 'furnizuesi Frutex': { e: 'Frutex', f: '', k: 7000, s: 1 } });
  const K = AF.krijoKujtesen(r);
  K.vendosAutorin('mendurberisha', true);
  K.mesoShume([{ barkodi: '', emri: 'Lëng', furnizuesi: 'FRUTEX' }, { barkodi: '', emri: 'Lëng 2', furnizuesi: 'Furn Admin' }], 'mbishkruaj');
  const H = lexo(r);
  ok(!H['furnizuesi FRUTEX'], 'furnizuesi i njohur (shkronja të tjera) s\'dyfishohet');
  const a = H['furnizuesi Furn Admin'];
  ok(!!a && a.s === 1 && a.r === 1, 'furnizuesi i ri i administratorit pret kontrollin (s + r)', a);
})();

console.log(g ? '\n✖ ' + g + ' GABIME' : '\n✔ Krejt në rregull');
process.exit(g ? 1 : 0);

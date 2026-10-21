// v238: çdo produkt dhe furnizues i ri pret kontrollin e administratorit, nga çdo rrugë (mësimi në sfond, importet, pa llogari)
const AF = require((process.env.STOKU_DIR || '..') + '/afatet.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const ruajtja = (m = {}) => ({ m, getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } });
const ri = (r) => { const s = ruajtja(); s.m['stoku:kujtesa:kontrolli-v238'] = '1'; const K = AF.krijoKujtesen(s); if (r) K.vendosAutorin(r[0], r[1]); return { K, s }; };
const pr = (K, b) => K.lista().find(x => x.barkodi === b);
const fu = (K, e) => K.furnizuesit().find(x => x.emri === e);

// 1. Mësimi në sfond (plotëso): afatet, stoku, afatet e kolegëve
for (const [emri, admin] of [['mendurberisha', true], ['agim', false]]) {
  const { K } = ri([emri, admin]);
  K.mesoShume([{ barkodi: '111', emri: 'Kos 1L', furnizuesi: 'Meridian' }], 'plotëso');
  ok(pr(K, '111') && pr(K, '111').nePritje && K.numriNePritje() === 1, '1. ' + emri + ': i mësuar vetë → "Produktet e reja"', pr(K, '111'));
  K.mesoShume([{ barkodi: '111', emri: '', furnizuesi: 'Meridian' }], 'plotëso');
  ok(pr(K, '111').nePritje, '1. ' + emri + ': plotësimi i dytë s\'e nxjerr nga pritja');
}
// 2. Pa llogari të njohur (autori bosh): skanimi, ruajtja me dorë, importi
{
  const { K } = ri(['', false]);
  K.meso('222', 'Bukë', 'Vipa');
  ok(pr(K, '222').nePritje, '2. pa llogari: produkti i ruajtur pret kontrollin', pr(K, '222'));
  ok(fu(K, 'Vipa') && fu(K, 'Vipa').nePritje, '2. pa llogari: furnizuesi i ri pret kontrollin', K.furnizuesit());
  K.mesoShume([{ barkodi: '', emri: 'Pa barkod', furnizuesi: 'Rugove' }], 'mbishkruaj');
  ok(fu(K, 'Rugove') && fu(K, 'Rugove').nePritje, '2. pa llogari: furnizuesi i rreshtit pa barkod pret kontrollin');
  K.vendos('333', 'Djathë', '');
  ok(pr(K, '333').nePritje, '2. pa llogari: "vendos" pret kontrollin');
}
// 3. Koleg mbi një produkt të mësuar vetë (me të njëjtin emër): mbetet në pritje
{
  const { K } = ri(['agim', false]);
  K.mesoShume([{ barkodi: '444', emri: 'Ujë', furnizuesi: '' }], 'plotëso');
  K.meso('444', 'Ujë', '');
  ok(pr(K, '444').nePritje, '3. koleg, i njëjti emër mbi të mësuarin vetë: ende në pritje', pr(K, '444'));
}
// 4. Administratori: importi/skanimi (mbishkruaj) në pritje; "Ruaj" (vendos) e kalon; "Fshije" e heq
{
  const { K } = ri(['mendurberisha', true]);
  K.mesoShume([{ barkodi: '555', emri: 'Sallam', furnizuesi: 'Kabi' }], 'mbishkruaj');
  ok(pr(K, '555').nePritje && fu(K, 'Kabi').nePritje, '4. administratori: importi → produkti dhe furnizuesi në pritje');
  K.vendos('555', 'Sallam', 'Kabi'); K.regjistroFurnizuesit(['Kabi'], true);
  ok(!pr(K, '555').nePritje && !fu(K, 'Kabi').nePritje && K.numriNePritje() === 0, '4. "Ruaj" → kalon te Produktet / Furnizuesit');
  K.mesoShume([{ barkodi: '556', emri: 'Mish', furnizuesi: '' }], 'plotëso'); K.fshij('556');
  ok(!pr(K, '556') && K.numriNePritje() === 0, '4. "Fshije" → s\'del askund');
  K.mesoShume([{ barkodi: '556', emri: 'Mish', furnizuesi: '' }], 'plotëso');
  ok(!pr(K, '556'), '4. i fshiri s\'kthehet nga mësimi në sfond');
}
// 5. Sfondi i administratorit: furnizuesit pa hyrje → në pritje (kohë 1), të njohurit s'preken
{
  const { K } = ri(['mendurberisha', true]);
  K.regjistroFurnizuesit(['Lajthia'], true); K.regjistroFurnizuesit(['Fshire'], true); K.fshijFurnizuesin('Fshire');
  ok(K.regjistroFurnizuesitNePritje(['Lajthia', 'fshire', 'Iri', 'iri']) === 1, '5. vetëm "Iri" (pa dallim shkronjash, pa të njohurit)');
  const i = fu(K, 'Iri');
  ok(i && i.nePritje && i.koha === 1 && !fu(K, 'Lajthia').nePritje && fu(K, 'Fshire').fshire, '5. "Iri" në pritje me kohën 1; të tjerët siç ishin', K.furnizuesit());
  // nga grupi vjen versioni i kontrolluar (nga pajisja tjetër e administratorit): fiton
  const r = {}; r['furnizuesi Iri'] = { e: 'Iri', f: '', k: Date.now(), s: 1 };
  K.bashko(r);
  ok(!fu(K, 'Iri').nePritje, '5. i kontrolluari nga pajisja tjetër e mund hyrjen në pritje të sfondit');
  ok(K.regjistroFurnizuesitNePritje(['X']) === 1 && ri(['agim', false]).K.regjistroFurnizuesitNePritje(['X']) === 0, '5. vetëm administratori');
}
// 6. Lista e furnizuesve: pa hyrje = në pritje; me hyrje të kontrolluar = te Furnizuesit
{
  const l = AF.listaEFurnizuesve([{ furnizuesi: 'Afat F' }], { 'pije::1': { barkodi: '1', furnizuesi: 'Stok F' } }, [], [{ emri: 'Ok F', koha: 5 }]);
  const m = Object.fromEntries(l.map(x => [x.emri, x.nePritje]));
  ok(m['Afat F'] === true && m['Stok F'] === true && m['Ok F'] === false, '6. pa hyrje → në pritje (afatet, stoku); me hyrje → i kontrolluar', m);
}
// 7. Grupi: pritja (r) shkon dhe kthehet
{
  const { K } = ri(['agim', false]);
  K.mesoShume([{ barkodi: '777', emri: 'Lëng', furnizuesi: '' }], 'plotëso');
  const o = K.hyrjePerGrup(['777']);
  ok(o['777'].r === 1 && o['777'].a === 1, '7. hyrjePerGrup: r=1 te i mësuari vetë', o['777']);
  const { K: A } = ri(['mendurberisha', true]);
  A.bashko(o);
  ok(pr(A, '777') && pr(A, '777').nePritje, '7. administratori e merr nga grupi: në pritje', pr(A, '777'));
}
// 8. Produkti në pritje pa autor me furnizues pa hyrje → furnizuesi në pritje (siguroFurnizuesitNePritje)
{
  const { K } = ri(['mendurberisha', true]);
  K.bashko({ '888': { e: 'Vaj', f: 'Floil', k: 5, a: 1, r: 1 } });
  ok(fu(K, 'Floil') && fu(K, 'Floil').nePritje, '8. furnizuesi i produktit të mësuar vetë: në pritje', K.furnizuesit());
}
// 9. Të vjetrat (para v238): të mësuarat vetë në 30 ditët e fundit kthehen në pritje, një herë; më të vjetrat jo
{
  const t = Date.now(), s = ruajtja();
  s.m['stoku:kujtesa:v1'] = JSON.stringify({ a1: { e: 'Re', f: '', k: t - 5 * 864e5, a: 1 }, a2: { e: 'Vjeter', f: '', k: t - 40 * 864e5, a: 1 },
    a3: { e: 'Admini', f: '', k: t - 864e5, s: 1, m: 1 }, a4: { e: 'Meso', f: '', k: t - 864e5, a: 1, m: 1 } });
  const K = AF.krijoKujtesen(s); K.vendosAutorin('mendurberisha', true);
  ok(pr(K, 'a1').nePritje && !pr(K, 'a2').nePritje && !pr(K, 'a3').nePritje && !pr(K, 'a4').nePritje, '9. migrimi: vetëm i mësuari vetë i 5 ditëve', K.lista().map(x => [x.barkodi, x.nePritje]));
  ok(s.m['stoku:kujtesa:kontrolli-v238'] === '1', '9. migrimi shënohet');
  K.vendos('a1', 'Re', '');
  const K2 = AF.krijoKujtesen(s);
  ok(!pr(K2, 'a1').nePritje, '9. pas "Ruaj" s\'kthehet në pritje herën tjetër');
}
console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
process.exit(g ? 1 : 0);

// v233: sigurojFolderat (bashkimi.js): dyqani s'mbetet pa asnjë folder
const B = require('../bashkimi.js');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const tani = Date.now(), dite = 864e5;
const D = ['ushqimore', 'pije', 'higjiene', 'fresh'];
const fshiD = t => ({ produktet: {}, foldera: Object.fromEntries(D.map(id => [id, t])), afatet: {} });
const def = () => [{ id: 'ushqimore', emri: 'Ushqimore' }, { id: 'pije', emri: 'Pije' }, { id: 'higjiene', emri: 'Higjiene' }, { id: 'fresh', emri: 'Fresh' }];
// 1. pda34: cloud pa foldera + shënime të vjetra për 4 të parazgjedhurit; pajisja e re krijon 4 të parazgjedhurit
let r = B.sigurojFolderat(B.bashko({ foldera: [], produktet: [], fshira: fshiD(tani - 2 * dite) }, { foldera: def(), produktet: [], fshira: {} }, tani), tani);
ok(r.foldera.map(f => f.id).join() === D.join() && r.foldera.every(f => f.ndryshuarSe === tani), '1. kthehen 4 folderat me kohë të re', r.foldera);
ok(!Object.keys(r.fshira.foldera).length, '1. shënimet e vjetra të 4 folderave hiqen', r.fshira.foldera);
// 2. bashkimi i radhës (pajisje tjetër me 4 të parazgjedhurit pa kohë): mbeten
let r2 = B.sigurojFolderat(B.bashko(r, { foldera: def(), produktet: [], fshira: fshiD(tani - 2 * dite) }, tani + 1000), tani + 1000);
ok(r2.foldera.length === 4 && r2.foldera.every(f => f.ndryshuarSe === tani), '2. pajisja tjetër (me shënimet e vjetra lokale) s\'i heq më', r2.foldera);
// 3. dyqan bosh, pa asnjë shënim
let r3 = B.sigurojFolderat(B.bashko(null, { foldera: [], produktet: [], fshira: {} }, tani), tani);
ok(r3.foldera.length === 4, '3. dyqan bosh: 4 folderat', r3.foldera.length);
// 4. fshirje e freskët (dikush sapo fshiu folderin e fundit): s'kthehen
let r4 = B.sigurojFolderat(B.bashko({ foldera: [{ id: 'x', emri: 'X', ndryshuarSe: tani - dite }], produktet: [], fshira: {} },
  { foldera: [], produktet: [], fshira: { foldera: { x: tani - 60000 } } }, tani), tani);
ok(r4.foldera.length === 0, '4. fshirja e qëllimshme (1 min më parë) mbetet: pa foldera', r4.foldera);
// 5. e njëjta pas 11 minutash: kthehen
let r5 = B.sigurojFolderat(r4, tani + 11 * 60000);
ok(r5.foldera.length === 4 && r5.fshira.foldera.x === tani - 60000, '5. pas 10 minutash: 4 folderat; shënimi i "X" mbetet', r5);
// 6. me foldera: asgjë s'ndryshon (edhe kur 4 të parazgjedhurit janë fshirë qëllimisht)
const g6 = B.bashko({ foldera: [{ id: 'a1', emri: 'Admin1', ndryshuarSe: tani }], produktet: [], fshira: fshiD(tani - dite) }, { foldera: def(), produktet: [], fshira: {} }, tani);
ok(B.sigurojFolderat(g6, tani) === g6 && g6.foldera.map(f => f.emri).join() === 'Admin1', '6. llogari me foldera: të parazgjedhurit e fshirë s\'kthehen', g6.foldera);
// 7. produktet brenda folderave të kthyer (pa shënim fshirjeje për produktin) mbeten
let r7 = B.sigurojFolderat(B.bashko({ foldera: [], produktet: [{ barkodi: '1', emri: 'Ujë', sasia: 2, kategoriaId: 'pije', prekurSe: tani - dite }], fshira: fshiD(tani - 3 * dite) }, { foldera: [], produktet: [], fshira: {} }, tani), tani);
ok(r7.foldera.length === 4, '7. pa foldera (edhe me një produkt pa folder në cloud): 4 folderat', r7.foldera.map(f => f.id));
// 8. ora e gabuar (fshirje "në të ardhmen" larg): s'bllokon
let r8 = B.sigurojFolderat({ foldera: [], produktet: [], fshira: { foldera: { pije: tani + 30 * dite } } }, tani);
ok(r8.foldera.length === 4 && !('pije' in r8.fshira.foldera), '8. shënimi me kohë në të ardhmen s\'i heq sërish', r8.fshira.foldera);
ok(B.sigurojFolderat(null) === null, '9. null mbetet null');
console.log(g ? '✘ ' + g + ' gabime' : '✔ Krejt në rregull');
process.exit(g ? 1 : 0);

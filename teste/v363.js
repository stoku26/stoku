// v363 (pronari: "kontrollon per drejtshkrim ne anglisht ... nese ka hala fjal shqip"): anglishtja e telefonit, orës dhe web-it.
//  1. Aktiviteti i grupit ("Ti" + teksti veç, ose bashkë si te Ballina): pa "You you", pa fjalë shqip.
//  2. Njoftimet e Worker-it/ekipa.js: "s'e pranoi afatin ... E ke te lista jote.", "e fshiu", "e 2 të tjera", "produkt".
//  3. Emrat e produkteve s'përkthehen ("Kos 500g" mbetet "Kos 500g", jo emri i produktit shembull).
//  4. Pyetjet e telefonit: fshirja e folderit, rikthimi nga cloud, eksporti, bashkimi i furnizuesve, marketi ekzistues.
//  5. Versioni: CACHE = versioni.js = VERSIONI_FJALORIT; hyrja te teRejat.js dhe TeRejat.kt.
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + '/' + f, 'utf8');
global.window = global; global.localStorage = { getItem: () => 'en', setItem() {} };
window.STOKU_FJALORI_EN = JSON.parse(lx('perkthimi/en.json'));
require(RR + '/perkthimi.js');
const t = window.StokuGjuha.t;
const PRITET = [
  // 1. aktiviteti: subjekti dhe teksti veç (Compose/HTML: <b>Ti</b> + " e hoqe…")
  ['Ti', 'You'],
  ['e hoqe nga rafti: Kos 500g', 'removed it from the shelf: Kos 500g'],
  ['e hoqi nga rafti: produkt', 'removed it from the shelf: product'],
  ['e ktheve në raft: Kos 500g', 'returned it to the shelf: Kos 500g'],
  ['e pranove heqjen nga rafti: Kos 500g', 'accepted the shelf removal: Kos 500g'],
  ['e refuzoi heqjen nga rafti: Kos 500g', 'declined the shelf removal: Kos 500g'],
  ['e fshive: Kos 500g', 'deleted: Kos 500g'],
  ['ndryshoi: Kos 500g', 'changed: Kos 500g'],
  ['kërkoi heqjen nga rafti: 3 produkte', 'requested shelf removal: 3 products'],
  ['shtove 1 afat të ri', 'added 1 new expiry date'],
  ['shtoi 5 afate të reja', 'added 5 new expiry dates'],
  ['u pranove në grup', 'were accepted into the group'],
  ['u bashkove me grupin', 'joined the group'],
  ['e hoqe ti', 'removed by you'],
  ['e hoqi agim', 'removed by agim'],
  ['pranuar nga ti', 'accepted by you'],
  ['për ty', 'for you'],
  ['për agim', 'for agim'],
  ['mbetet në raft · e kishte hequr agim', 'stays on the shelf · had been removed by agim'],
  ['i përket: kolegut · pret miratimin', 'belongs to: a colleague · waiting for approval'],
  // 1b. bashkë në një rresht (Ballina)
  ['Ti e hoqe nga rafti: Kos 500g · para 5 min', 'You removed it from the shelf: Kos 500g · 5 min ago'],
  ['Ti shtove 3 afate të reja · dje 10:00', 'You added 3 new expiry dates · yesterday 10:00'],
  ['Ti e fshive: Kos 500g', 'You deleted: Kos 500g'],
  ['Administratori e fshiu: Kos 500g', 'The administrator deleted: Kos 500g'],
  ['Pije · u bashkua me grupin', 'Drinks · joined the group'],
  // 2. njoftimet (Worker-i, ekipa.js, GrupiLogjika)
  ["agim s'e pranoi brenda 10 ditëve afatin: Kos 500g · 30.11.2026. E ke te lista jote.", "agim didn't accept the expiry date within 10 days: Kos 500g · 30.11.2026. It's back in your list."],
  ["agim s'e pranoi afatin: Kos 500g · 30.11.2026 · 2 copë. E ke te lista jote.", "agim didn't accept the expiry date: Kos 500g · 30.11.2026 · 2 pcs. It's back in your list."],
  ['duli96 e fshiu: Kos Vita', 'duli96 deleted: Kos Vita'],
  ['tonnyaliu i kërkon grupit ta heqë nga rafti: 5 produkte (Kos, Bukë, Qumësht e 2 të tjera) · rafti i dytë', 'tonnyaliu asks the group to remove from the shelf: 5 products (Kos, Bukë, Qumësht and 2 more) · rafti i dytë'],
  ['tonnyaliu i kërkon grupit ta heqë nga rafti: 4 produkte (Kos, Bukë, Qumësht e 1 tjetër)', 'tonnyaliu asks the group to remove from the shelf: 4 products (Kos, Bukë, Qumësht and 1 more)'],
  ['Një koleg të dërgoi një afat: produkt', 'A colleague sent you an expiry date: product'],
  // 4. pyetjet e telefonit
  ['Do të fshihet folderi "Pije" bashkë me 3 produktet brenda tij.\n\nKy veprim NUK mund të kthehet.', 'The folder "Pije" will be deleted along with the 3 products inside it.\n\nThis CAN\'T be undone.'],
  ['Do të fshihet folderi "Pije". Është bosh.', 'The folder "Pije" will be deleted. It\'s empty.'],
  ['Do të fshihen të gjitha 5 produktet nga folderi "Pije". Ky veprim NUK mund të kthehet.', 'All 5 products in the folder "Pije" will be deleted. This CAN\'T be undone.'],
  ['Do të zëvendësohen të gjitha 5 produktet aktuale me ato të ruajtura në cloud për këtë llogari.\n\nKy veprim nuk kthehet.', 'All 5 current products will be replaced with the ones saved in the cloud for this account.\n\nThis can\'t be undone.'],
  ['Do të eksportohen 3 afate (të skaduara) të furnizuesit Viva', '3 expiry dates (expired) from the supplier Viva will be exported'],
  ['Do të eksportohen 1 afat', '1 expiry date will be exported'],
  ["S'ka afate të skaduara për këtë zgjedhje", 'No expired expiry dates for this selection'],
  ['"Kos" (i përket: agim) fshihet krejt. agim njoftohet.', '"Kos" (belongs to: agim) is deleted completely. agim will be notified.'],
  ['"Kos" (i përket: kolegut) fshihet krejt. Kolegu njoftohet.', '"Kos" (belongs to: a colleague) is deleted completely. Your colleague will be notified.'],
  ['"Viva" (2 produkte) dhe "Supplier A" (Pa produkte) do të bashkohen në një furnizues: "Viva".', '"Viva" (2 products) and "Supplier A" (No products) will be merged into one supplier: "Viva".'],
  ['Këtu është tashmë marketi "Viva" (40 m). Vendose shenjën mbi marketin e ri.', 'The market "Viva" is already here (40 m). Place the pin on the new market.'],
  ['Fjalëkalimi i harruar', 'Forgot password'],
  ['Afatet që skadojnë dhe kërkesat e grupit', 'Expiry dates and group requests'],
];
for (const [s, e] of PRITET) { const r = t(s); ok(r === e, '1-4. ' + JSON.stringify(s).slice(0, 70), r === e ? undefined : r); }
// 3. emri i produktit shembull ("Kos 500g" → "Yogurt 500g" vetëm si tekst i vetëm, jo brenda njoftimeve)
ok(t('Kos 500g') !== 'Kos 500g' && t("agim s'e pranoi afatin: Kos 500g. E ke te lista jote.").includes('Kos 500g'), '3. emri i produktit mbetet në njoftim');
// 5. versioni
const v = +/stoku-v(\d+)/.exec(lx('sw.js'))[1];
ok(v >= 363 && +/v: (\d+)/.exec(lx('versioni.js'))[1] === v && +/VERSIONI_FJALORIT = (\d+)/.exec(lx('perkthimi.js'))[1] === v, '5. CACHE = versioni.js = VERSIONI_FJALORIT', v);
ok(lx('sw.js').includes("'./perkthimi-en.js?v=" + v + "'") && lx('index.html').includes('perkthimi.js?v=' + v) && lx('pc.html').includes('perkthimi.js?v=' + v), '5a. ?v= e fjalorit');
ok(/\{ v: 363, versioni: '1\.76\.8'/.test(lx('teRejat.js')) && /Hyrja\(123, /.test(lx('vendas/app/src/main/java/site/stoku/vendas/TeRejat.kt')), '5b. hyrjet "Çfarë ka të re"');
// Kopjet e fjalorit (web, telefoni, ora) janë të njëjta me perkthimi/en.json
const d = JSON.parse(lx('perkthimi/en.json')), a1 = JSON.parse(lx('vendas/app/src/main/assets/en.json')), a2 = JSON.parse(lx('ora/app/src/main/assets/en.json'));
ok(JSON.stringify(a1.modelet) === JSON.stringify(d.modelet) && JSON.stringify(a2) === JSON.stringify(a1) && Object.keys(a1.fjalet).length === Object.keys(d.fjalet).length, '5c. fjalori i njëjtë te telefoni dhe ora');
console.log(g ? 'GABIME: ' + g : 'KREJT OK');
process.exit(g ? 1 : 0);

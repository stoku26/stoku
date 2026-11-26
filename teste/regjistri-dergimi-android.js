// 2026-11-26 (pronari, foto e "Produktet e reja": "Gjeje pse pas kontrolles nuk i rujti ne cloud edhe pse i hina ruaj"):
// Android (vendas/Regjistri.kt): produktet që administratori i kontrollon dhe i ruan duhet të arrijnë te regjistri (kujtesa/p0..px).
//  1. Kur leximi i regjistrit dështonte një herë, dëgjimi s'nisej më deri në rihapje dhe ruajtjet e administratorit s'dërgoheshin fare
//     (planifikoRegjistrin priste regjGati). Tani: dëgjimi provohet sërish pas 1 minute dhe administratori dërgon edhe pa regjistrin.
//  2. Kur dërgimi dështonte, provohej vetëm me ndryshimin e radhës, pa asnjë njoftim. Tani: riprovim vetë (15 s ... 10 min),
//     njoftim me arsyen dhe te "Produktet e reja" / "Produktet" del sa s'kanë arritur ende në cloud, me "Provo tani".
//  3. Dërgimi që po punon s'ndërpritet nga një ndryshim i ri (pas tij planifikohet sërish); ndërprerja s'numërohet si dështim.
//  4. Tekstet e reja edhe anglisht.
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + '/' + f, 'utf8');
const R = lx('vendas/app/src/main/java/site/stoku/vendas/Regjistri.kt');
const UI = lx('vendas/app/src/main/java/site/stoku/vendas/ui/RegjistriUI.kt');
const fn = (s, emri) => { const i = s.indexOf('fun ' + emri + '('); if (i < 0) return ''; const j = s.indexOf('\n    }\n', i); return s.slice(i, j); };

const deg = fn(R, 'degjoRegjistrin');
ok(/delay\(60_000\)/.test(deg) && /degjoRegjistrin\(\)/.test(deg.slice(deg.indexOf('delay'))) && /planifikoRegjistrin\(\)/.test(deg), '1. leximi i regjistrit që dështon provohet sërish pas 1 minute dhe dërgimi s\'mbetet i ndalur');
ok(/regjGabim = false/.test(deg), '1a. kur leximi kthehet, gabimi hiqet');
const pl = fn(R, 'planifikoRegjistrin');
ok(/if \(!regjGati && !admin\) return/.test(pl) && !/if \(!regjGati\) return/.test(pl), '1b. administratori dërgon edhe pa regjistrin; të tjerët e presin');
ok(/if \(!regjGati && !admin\) return/.test(fn(R, 'dergoRegjistrin')), '1c. dergoRegjistrin: njësoj');
const dg = fn(R, 'dergoRegjistrin');
ok(/regjNdryshuar\.addAll\(bs\)/.test(dg) && /delay\(pritja\); dergoRegjistrin\(\)/.test(dg) && /pritjaERiprovimit\(riprovimet\+\+\)/.test(dg) && /minOf\(600_000L, 15_000L shl minOf\(n, 6\)\)/.test(R), '2. dështimi: riprovim vetë 15 s ... 10 min');
ok(/Toast\.trego\("Produktet s'u ruajtën në cloud \(\$gabim\)\. Provohet sërish vetë\."/.test(dg) && /_gabimi\.value = gabim/.test(dg), '2a. njoftimi me arsyen');
ok(/riprovimet = 0; _gabimi\.value = ""; _paDerguar\.value = 0/.test(dg), '2b. pas suksesit pastrohet gjendja');
const rp = fn(R, 'ruajNePjese');
ok(/\): String\? \{/.test(rp) && /catch \(e: CancellationException\) \{ throw e \}/.test(rp) && /if \(ok == true\) null else/.test(rp), '2c. ruajNePjese kthen arsyen; ndërprerja s\'është dështim');
ok(/if \(dukeDerguar\) return/.test(pl) && /try \{ ruajNePjese\(db\.collection\("kujtesa"\), te\) \} finally \{ dukeDerguar = false \}/.test(dg), '3. dërgimi që po punon s\'ndërpritet');
ok(/fun provoTani\(\)/.test(R) && /Lidhje\("Provo tani", \{ Regjistri\.provoTani\(\) \}\)/.test(UI) && /if \(admin\) PaDerguarNeCloud\(\)/.test(UI), '2d. "Produktet": sa s\'kanë arritur në cloud + Provo tani');
ok(/ruajNePjese\(db\.collection\("grupet"\)\.document\(g\)\.collection\("kujtesa"\), kujtesa\.hyrjePerGrup\(bs\)\)/.test(R) && /grupiPritje\.addAll\(bs\)\n\s*planifikoGrupin\(pritjaERiprovimit\(riprovimetGrupi\+\+\)\)/.test(R), '2e. kujtesa e grupit: riprovim vetë (web v361)');
ok(/kohezLeximit\?\.cancel\(\)/.test(fn(R, 'ndalRegjistrin')), '1d. ndërrimi i llogarisë e ndal riprovimin e leximit');

global.window = global; global.localStorage = { getItem: () => 'en', setItem() {} };
window.STOKU_FJALORI_EN = JSON.parse(lx('perkthimi/en.json'));
require(RR + '/perkthimi.js');
const t = window.StokuGjuha.t;
const RASTE = {
  "1 produkt i kontrolluar s'ka arritur ende në cloud.": "1 checked product hasn't reached the cloud yet.",
  "7 produkte të kontrolluara s'kanë arritur ende në cloud.": "7 checked products haven't reached the cloud yet.",
  "Arsyeja: serveri s'u përgjigj brenda 30 sekondave": "Reason: the server didn't respond within 30 seconds",
  "Arsyeja: s'u lexua regjistri: UNAVAILABLE: x": "Reason: couldn't read the registry: UNAVAILABLE: x",
  "Arsyeja: gabim i panjohur": "Reason: unknown error",
  "Provohet sërish vetë.": "Retrying automatically.",
  "Provo tani": "Try now",
  "Produktet s'u ruajtën në cloud (serveri s'u përgjigj brenda 30 sekondave). Provohet sërish vetë.": "Products weren't saved to the cloud (the server didn't respond within 30 seconds). Retrying automatically.",
};
Object.keys(RASTE).forEach(s => ok(t(s) === RASTE[s], '4. anglisht: ' + s, t(s)));
const en = JSON.parse(lx('vendas/app/src/main/assets/en.json'));
ok(en.fjalet && en.fjalet['Provo tani'] === 'Try now', '4a. fjalori i Android-it u rigjenerua');
console.log(g ? 'GABIME: ' + g : 'TË GJITHA OK');
process.exit(g ? 1 : 0);

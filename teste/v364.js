// v364 (pronari, 28.11.2026, me foto nga telefoni):
//  1. "nese shkrun dat tpasakt ... nuk te thot hiq qe so mir cili muj i ka 33 dit": Afatet.gabimiIDates (afatet.js = Afatet.kt)
//     te "Afat i ri" (telefoni web, PC, Android) dhe te rreshtat e "Kontrollo fletën".
//  2. "hiqe mbyll kur i fshin krejt shkronjat mu mshel vet ... mos e le me ra ner tastier": sugjerimet e furnizuesit pa "Mbyll",
//     vetëm kur ka shkronja, mbi fushë (web tel + Android). Prova në shfletues: v252.js.
//  3. Android "Kontrollo fletën": shiriti i statusit dhe butonat poshtë (hapësirat e sistemit edhe nga dritarja e aktivitetit).
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + '/' + f, 'utf8');
const A = require(RR + '/afatet.js');
const R = [['33-05-426', 'Dita duhet të jetë nga 1 deri 31.'], ['33', 'Dita duhet të jetë nga 1 deri 31.'], ['3', ''], ['31-13', 'Muaji duhet të jetë nga 1 deri 12.'],
  ['31-04-26', 'Ky muaj ka vetëm 30 ditë.'], ['29-02-27', 'Ky muaj ka vetëm 28 ditë.'], ['29-02-28', ''], ['31-12-202', 'Viti shkruhet me 2 shifra (26) ose me 4 (2026).'],
  ['31-12-2026', ''], ['31-12-26', ''], ['1a-2', 'Shkruaje datën si DD-MM-VV, p.sh. 31-12-26.'], ['', ''], ['00-05-26', 'Dita duhet të jetë nga 1 deri 31.']];
for (const [t, e] of R) ok(A.gabimiIDates(t) === e, '1. gabimiIDates(' + JSON.stringify(t) + ')', A.gabimiIDates(t));
const kt = lx('vendas/logjika/src/main/kotlin/site/stoku/logjika/Afatet.kt');
ok(/fun gabimiIDates\(v: String\?\): String/.test(kt) && /"gabimiDates"/.test(lx('vendas/logjika/src/test/kotlin/site/stoku/logjika/AfatetTest.kt')), '1. Kotlin: gabimiIDates + testi me fiksturën');
ok(JSON.parse(lx('vendas/logjika/src/test/resources/fikstura.json')).afatet.gabimiDates.length >= 20, '1. fikstura ka rastet e datës');
const tel = lx('app-tel.js'), pc = lx('app-pc.js'), ae = lx('vendas/app/src/main/java/site/stoku/vendas/ui/AfatetEkrani.kt');
ok(/AF\.gabimiIDates\(\$\('afatData'\)\.value\)/.test(tel) && /gd\.textContent = AF\.gabimiIDates\(v\)/.test(tel), '1. web telefoni: "Afat i ri" + "Kontrollo fletën"');
ok(/AF\.gabimiIDates\(\$\('afdData'\)\.value\)/.test(pc) && /AF\.gabimiIDates\(v\) \|\| 'Shkruaj datën/.test(pc), '1. PC: "Afat i ri" + "Kontrollo fletën"');
ok(/Afatet\.gabimiIDates\(data\)/.test(ae) && /Afatet\.gabimiIDates\(r\.data\)/.test(lx('vendas/app/src/main/java/site/stoku/vendas/ui/FletaEkrani.kt')), '1. Android: "Afat i ri" + "Kontrollo fletën"');
// 2. sugjerimet
ok(!/'Mbyll', 'sugj-mbyll'/.test(tel) && /if \(!q\) \{ mbyll\(\); return; \}/.test(tel) && !/sugj-mbyll/.test(lx('css/stoku.css')), '2. web: pa "Mbyll", mbyllet kur fusha zbrazet');
const sg = ae.slice(ae.indexOf('fun SugjerimetEFurnizuesit'));
ok(!/"Mbyll"/.test(sg.slice(0, 1500)) && /if \(q\.isEmpty\(\)\) return/.test(sg) && /take\(5\)/.test(sg), '2. Android: pa "Mbyll", vetëm me shkronja, më së shumti 5');
const ru = lx('vendas/app/src/main/java/site/stoku/vendas/ui/RegjistriUI.kt');
ok(ru.indexOf('SugjerimetEFurnizuesit(furn)') < ru.indexOf('"Furnizuesi", lartesia = 46.dp'), '2. Android (Produktet): lista mbi fushë');
// 3. Kontrollo fletën (Android)
const fe = lx('vendas/app/src/main/java/site/stoku/vendas/ui/FletaEkrani.kt');
ok(/DialogWindowProvider/.test(fe) && /getRootWindowInsets/.test(fe) && /WindowInsetsSides\.Bottom/.test(fe) && !/statusBarsPadding\(\)/.test(fe), '3. Android: dialogu nën shiritat, butonat mbi navigim');
// Versioni
const v = +/stoku-v(\d+)/.exec(lx('sw.js'))[1];
ok(v === 364 && +/v: (\d+)/.exec(lx('versioni.js'))[1] === v && lx('sw.js').includes("'./afatet.js?v=364'") && lx('index.html').includes('afatet.js?v=364') && lx('pc.html').includes('afatet.js?v=364'), '4. versioni 364 dhe afatet.js?v=364', v);
ok(/\{ v: 364, versioni: '1\.76\.9'/.test(lx('teRejat.js')) && /Hyrja\(125, /.test(lx('vendas/app/src/main/java/site/stoku/vendas/TeRejat.kt')), '4. "Çfarë ka të re"');
console.log(g ? 'GABIME: ' + g : 'KREJT OK');
process.exit(g ? 1 : 0);

// v357 / Android Hyrja 117 (pronari: "Versionit per playstore bonja ne com.stoku.app edhe kshyr mos prish naj sen 100% mir bone.
// Edhe kshyre versionin per playstore 100% qdo cep kontrolloje per gabime drejtshkrimore ne anglisht edhe bone anglishten default ne start."):
// versioni play = app.stoku.android (v358; com.stoku.app ishte i zënë në Play), vetëm ai, nis në anglisht; përkthehen edhe TalkBack-u, eksportet, njoftimet nga serveri; motori
// përkthen çdo pjesë të " · " me copat dhe modelet.
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
global.window = global; global.localStorage = { getItem: () => 'en', setItem() {} };
require(RR + '/perkthimi-en.js'); require(RR + '/perkthimi.js');
const t = window.StokuGjuha.t;
const lex = f => fs.readFileSync(RR + '/' + f, 'utf8');
ok(t('5 afate · 1 faqe A4') === '5 expiry dates · 1 A4 page', '1. çdo pjesë e " · " përkthehet (copat + numrat)', t('5 afate · 1 faqe A4'));
ok(t('Ke 3 ftesa') === 'You have 3 invitations' && t('Krijo 2 foto') === 'Create 2 photos', '1a. modelet e reja me numra');
ok(t('3 produkte skadojnë sot: Kos, Bukë. 2 produkte kanë skaduar: Jogurt. Hiqi nga rafti.') === '3 products expire today: Kos, Bukë. 2 products have expired: Jogurt. Remove them from the shelf.', '2. njoftimi ditor i serverit në anglisht', t('3 produkte skadojnë sot: Kos, Bukë. 2 produkte kanë skaduar: Jogurt. Hiqi nga rafti.'));
ok(t('Besa të fton në grupin "Viva". Hape Grupin për ta pranuar.') === 'Besa invites you to the group "Viva". Open Group to accept.', '2a. ftesa nga serveri në anglisht');
const gr = lex('vendas/app/build.gradle.kts');
ok(/create\("play"\) \{[^}]*applicationId = "app\.stoku\.android"/.test(gr) && /applicationId = "site\.stoku\.vendas"/.test(gr) && !/create\("github"\) \{[^}]*applicationId/.test(gr), '3. play = app.stoku.android, github mbetet site.stoku.vendas');
ok(!/"site\.stoku\.vendas\.(skedaret|fileprovider)"/.test(fs.readdirSync(RR + '/vendas/app/src/main/java/site/stoku/vendas').filter(f => f.endsWith('.kt')).map(f => lex('vendas/app/src/main/java/site/stoku/vendas/' + f)).join('\n')) &&
  /\$\{applicationId\}\.skedaret/.test(lex('vendas/app/src/main/AndroidManifest.xml')), '3a. FileProvider sipas paketës (jo emër i ngulitur)');
ok(/getString\("gjuha", if \(site\.stoku\.vendas\.BuildConfig\.PLAY\) "en" else "sq"\)/.test(lex('vendas/app/src/main/java/site/stoku/vendas/ui/Gjuha.kt')), '4. versioni play nis në anglisht, github në shqip');
ok(/fun Icon\(imageVector: ImageVector, contentDescription: String\?/.test(lex('vendas/app/src/main/java/site/stoku/vendas/ui/Gjuha.kt')), '5. Icon me përshkrim të përkthyer (TalkBack)');
ok(/Xlsx\.build\(te\) \{ site\.stoku\.vendas\.ui\.Gjuha\.t\(it\) \}/.test(lex('vendas/app/src/main/java/site/stoku/vendas/Eksportet.kt')) && /Gjuha\.t\(t\), x, y, p\)/.test(lex('vendas/app/src/main/java/site/stoku/vendas/EksportiPdf.kt')), '6. eksportet Android (Excel, PDF) në gjuhën e pamjes');
ok(/app\.stoku\.android/.test(lex('.github/apk/aab.sh')) && /testPlayDebugUnitTest --tests site\.stoku\.vendas\.PlayTest/.test(lex('.github/workflows/vendas-apk.yml')), '7. CI: AAB me app.stoku.android + PlayTest');
ok(/'worker\/stoku-push\.js'/.test(lex('teste/perkthimi-nxirr.py')) && /cancelled/.test(JSON.stringify(require(RR + '/perkthimi/en.json').fjalet)) === false, '8. tekstet e serverit kontrollohen; drejtshkrimi amerikan (canceled)');
console.log(g ? 'GABIME: ' + g : 'KREJT OK'); process.exit(g ? 1 : 0);

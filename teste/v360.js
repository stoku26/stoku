// v360 (pronari: "Kontrolloje versionin .aab qe osht per playstore per bugs 100% ... rregulloje qdo problem"): kontrolli i versionit Play.
//  1. AAB-ja e Play-it pa kodin e vetë-përditësimit (GitHub, APK, MANAGE_UNKNOWN_APP_SOURCES): github/Perditesimi.kt, play/Perditesimi.kt.
//  2. CameraX 1.4.2 (libraria native me faqe 16 KB, që Play e kërkon) + kontrolli te .github/apk/aab.sh.
//  3. Hyrja (Porta.kt): lidhjet Privatësia · Kushtet e përdorimit, sipas gjuhës.
//  4. Tekstet e përbëra (emra, numra) në anglisht pa mbetje shqip: modelet e reja te perkthimi/en.json; folderat e parazgjedhur anglisht.
const fs = require('fs'), path = require('path'), RR = path.resolve(__dirname, '..');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const lx = f => fs.readFileSync(RR + '/' + f, 'utf8'), ka = f => fs.existsSync(RR + '/' + f);
const V = 'vendas/app/src/';
ok(!ka(V + 'main/java/site/stoku/vendas/Perditesimi.kt') && ka(V + 'github/java/site/stoku/vendas/Perditesimi.kt'), '1. vetë-përditësimi vetëm te versioni github');
const pp = lx(V + 'play/java/site/stoku/vendas/Perditesimi.kt').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); // pa komentet
ok(!/github|\.apk|package-archive|UNKNOWN_APP|FileProvider/i.test(pp) && /PerditesimiPlay\.kontrollo/.test(pp), '1a. play/Perditesimi.kt: vetëm Play, pa GitHub/APK');
ok(!ka(V + 'github/java/site/stoku/vendas/PerditesimiPlay.kt') && ka(V + 'play/java/site/stoku/vendas/PerditesimiPlay.kt'), '1b. PerditesimiPlay vetëm te play');
const aab = lx('.github/apk/aab.sh');
ok(/MANAGE_UNKNOWN_APP_SOURCES/.test(aab) && /api\.github\.com\/repos\/stoku26/.test(aab) && /package-archive/.test(aab), '1c. aab.sh e ndal AAB-në me kod të vetë-përditësimit');
ok(/camera-camera2:1\.4\.2/.test(lx('vendas/app/build.gradle.kts')) && /16384/.test(aab) && /arm64-v8a/.test(aab), '2. CameraX 1.4.2 + kontrolli i 16 KB te aab.sh');
const po = lx(V + 'main/java/site/stoku/vendas/ui/Porta.kt');
ok(/Lidhje\("Privatësia", \{ hap\(if \(Gjuha\.en\) "privacy\.html" else "privatesia\.html"\) \}/.test(po) && /hap\(if \(Gjuha\.en\) "terms\.html" else "kushtet\.html"\)/.test(po), '3. hyrja: Privatësia · Kushtet sipas gjuhës');
global.window = global; global.localStorage = { getItem: () => 'en', setItem() {} };
window.STOKU_FJALORI_EN = JSON.parse(lx('perkthimi/en.json'));
require(RR + '/perkthimi.js');
const t = window.StokuGjuha.t;
const SHQIP = /[ëçËÇ]|\b(dhe|të|nuk|për|nga|një|ose|janë|është|Shto|Ruaj|Fshi|Hiq|Krejt|Kërko|Afatet|Malli|Grupi|Sot|Nesër|copë|ditë|ora|u|më|te|në|ka|pa|produkte|foldera|afate|afat|kolegë|koleg|muaj|dje|sot|para|rreshta|rresht|Dërgo|grupi|fshi|prova|provë|stok|jo|kyç|Kodi|tashmë)\b|s'/;
const RASTE = [
"Pije · ora 14:30",
"S'u hy (ERROR_INTERNAL_ERROR). Provo përsëri pas pak.",
"Je te: Viva Fresh (u shtua te marketet e tua)",
"\"Viva Fresh\" u shtua me vendndodhjen. Afatet e deritashme (3) u vendosën te ky market. Tani e shohin të gjithë merchandiserët.",
"\"Viva Fresh\" u shtua me vendndodhjen. Tani e shohin të gjithë merchandiserët.",
"Këtu është tashmë marketi \"Viva Fresh\". Tani je te ai.",
"Vendndodhja s'është e saktë (rreth 45 m). Lejo \"vendndodhjen e saktë\" për Stoku-n te leja e vendndodhjes së telefonit (jo \"të përafërt\") dhe provo sërish brenda marketit.",
"Afër (30 m) është marketi \"Viva Fresh\" dhe vendndodhja ka pasaktësi rreth 25 m. Nëse je te ai, zgjidhe te \"Ku je?\". Përndryshe prit pak brenda marketit dhe provo sërish.",
"Në Stoku ka tashmë një market me këtë emër. Shto edhe vendin, p.sh. \"Viva Qendër\".",
"U fshinë 5 afate.",
"Dërgo te agim për miratim",
"Në PC del te Afatet, me butonin \"Shkarko\". Duhet e njëjta llogari në kompjuter.",
"Në PC del te Malli, te Përmbledhja, me butonin \"Shkarko\". Duhet e njëjta llogari në kompjuter.",
"U dërgua në PC. E gjen në kompjuter te Afatet.",
"E gjen në kompjuter te Malli, te Përmbledhja, me butonin \"Shkarko\".",
"Do të eksportohen 5 afate (të skaduara) të furnizuesit Supplier A",
"Do të eksportohen 1 afat",
"S'ka afate të skaduara për këtë zgjedhje",
"5 afate të zgjedhura",
"1 afat i zgjedhur",
"5 afate · një foto për secilin furnizues",
"Të gjitha afatet aktive (5) në një foto.",
"Viva Fresh · dërgoi agim",
"Afatet: Supplier A",
"U lexuan 5 rreshta. Në kompjuter (me të njëjtën llogari) do të dalë njoftimi për fletën. Mund ta kontrollosh kur të kesh kohë.",
"U lexuan 1 rresht. Në kompjuter (me të njëjtën llogari) do të dalë njoftimi për fletën. Mund ta kontrollosh kur të kesh kohë.",
"U ruajtën 5 afate (2 ekzistonin tashmë) · 1 ka skaduar! · 3 skadojnë brenda 30 ditëve.",
"U ruajt 1 afat (1 ekzistonte tashmë) · 2 kanë skaduar! · 1 skadon brenda 30 ditëve.",
"Ruaj 5 afate",
"para 3 ditësh",
"për 5 ditë",
"për 2 muaj",
"U hoq nga rafti nga agim · sot 12:30.",
"U hoq nga rafti · dje 09:15.",
"E hoqe nga rafti para 5 min. Pret miratimin e besa.",
"E hoqi agim sot 12:30. Pret miratimin e kolegut.",
"\"Kos 500g\" u fshi. besa u njoftua.",
"\"Kos 500g\" u kthye në raft. Kolegu u njoftua.",
"\"Kos 500g\" u shënua si i hequr. besa u njoftua.",
"Largohesh nga grupi \"Viva\" (admin bëhet besa). Malli dhe afatet e tua s'preken.",
"Largohesh nga grupi \"Viva\" (je i fundit në grup: grupi fshihet bashkë me aktivitetin). Malli dhe afatet e tua s'preken.",
"Largohesh nga grupi \"Viva\". Malli dhe afatet e tua s'preken.",
"Të kalosh te grupi \"Viva 2\"?",
"Afatet e agim shfaqen këtu sapo ta hapë Stoku-n (versionin e ri) në telefon ose kompjuter.",
"Shfaqen 300 nga 450. Kërko për t'i gjetur të tjerat.",
"Hiq agim nga grupi",
"U fshinë 12 rreshta.",
"3 online nga 5 kolegë",
"1 online nga 1 koleg",
"Llogaria e agim u fshi.",
"Llogaria e agim u fshi (disa të dhëna s'u fshinë, provo përsëri më vonë).",
"Grupi \"Viva\" u krijua. Tani fto shokët te Kolegët.",
"Kërkesa u dërgua para 5 min. Pret pranimin nga admini i grupit.",
"Kërkesa u dërgua. Pret pranimin nga admini i grupit.",
"Të 5 njoftimet fshihen vetëm për ty.",
"Njoftimi fshihet vetëm për ty.",
"U fshinë 5 njoftime.",
"Dërgo (3)",
"3 foldera dhe 45 produkte u fshinë nga një pajisje tjetër. Kopja u ruajt në këtë telefon më 24.11.2026, ora 12:30. \"Rikthe\" i kthen në të gjitha pajisjet.",
"1 produkt u fshi nga një pajisje tjetër. Kopja u ruajt në këtë telefon më 24.11.2026, ora 12:30. \"Rikthe\" e kthen në të gjitha pajisjet.",
"1 folder (\"Pije\") u fshi nga një pajisje tjetër. Kopja u ruajt në këtë telefon më 24.11.2026, ora 12:30. \"Rikthe\" e kthen në të gjitha pajisjet.",
"U rikthyen: 3 foldera dhe 45 produkte.",
"U rikthye: 1 produkt.",
"Kthehen 3 foldera dhe 45 produkte në të gjitha pajisjet e llogarisë.",
"Kthehet 1 produkt në të gjitha pajisjet e llogarisë.",
"24.11.2026, ora 12:30",
"Kodi s'është i saktë. Të kanë mbetur 3 prova.",
"Kodi s'është i saktë. Të ka mbetur 1 provë.",
"Kodi u bllokua pas 5 provave të gabuara. Kërko kod të ri pas orës 14:30.",
"Kodi u bllokua pas 5 provave të gabuara. Kërko kod të ri pas 30 minutash.",
"5901234123457 · në stok 3",
"Ora automatike (Cron) s'ka punuar që nga 14:30. Te Cloudflare → stoku-push → Settings → Trigger Events duhet të jetë \"Every minute\".",
"Serveri ka ende orën 08:00 (jo 09:00). Zgjidhe orën sërish.",
"u kyç sot 12:30",
"Afatet e agim",
"Shtuar nga: agim",
"Kërkesa u dërgua te administratori. Kur ta marrësh kodin 6-shifror prej tij, shkruaje këtu (vlen deri në 14:30).",
"Kodi është dërguar tashmë te administratori. Kur ta marrësh kodin 6-shifror prej tij, shkruaje këtu.",
"Fshi llogarinë (5)",
"Aktivizo (3)"
];
const keq = RASTE.map(s => [s, t(s)]).filter(([s, r]) => SHQIP.test(r.replace(/"[^"]*"/g, '""').replace(/\b(agim|besa|Viva[^.,"]*|Pije|Kos 500g|Supplier A)\b/g, '')));
ok(!keq.length, '4. ' + RASTE.length + ' tekste të përbëra pa mbetje shqip në anglisht', keq.slice(0, 5));
ok(t('Ushqimore') === 'Groceries' && t('Pije') === 'Drinks' && t('Higjiene') === 'Hygiene' && t('Kos 500g') === 'Yogurt 500g', '4a. folderat e parazgjedhur dhe të dhënat shembull anglisht');
ok(t('Afatet e produkteve (datat e skadimit) · Ti') === 'Product expiry dates · You' && t('nga galeria') === t('nga galeria'.toLowerCase()), '4b. modelet e reja s\'i prishin përkthimet e vjetra');
ok(/isMinifyEnabled = true/.test(lx('vendas/app/build.gradle.kts')) && /-keep class site\.stoku\.\*\* \{ \*; \}/.test(lx('vendas/app/proguard-rules.pro')), '2a. R8 për release, kodi i Stoku-t i paprekur');
const kt = lx(V + 'main/java/site/stoku/vendas/TeRejat.kt');
ok(/Hyrja\(120, "2026-11-25", "Gjuha anglisht dhe Google Play"/.test(kt), '5. TeRejat.kt: Hyrja 120');
console.log(g ? 'GABIME: ' + g : 'KREJT OK'); process.exit(g ? 1 : 0);

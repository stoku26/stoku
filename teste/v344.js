// v344 / Android Hyrja 102 / Worker 174: fshirja e llogarisë fshin edhe të dhënat te serveri i njoftimeve; përmirësime shpejtësie në Android
const fs = require('fs');
let g = 0; const ok = (k, m, x) => { if (!k) g++; console.log((k ? 'OK    ' : 'GABIM ') + m + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); };
const RR = __dirname + '/../', lx = f => fs.readFileSync(RR + f, 'utf8');
const K = 'vendas/app/src/main/java/site/stoku/vendas/';
// 1. Web (ekipa.js): fshijLlogarine thërret /admin/fshi pas fshirjes në Firebase, pa e prishur rezultatin kur Worker-i s'përgjigjet
const ek = lx('ekipa.js');
const f = /fshijLlogarine: async function \(u, emriTjeter\) \{[\s\S]*?return \{ ok: true, mbetur: mbetur \};/.exec(ek);
ok(!!f, '1a. ekipa.js ka fshijLlogarine');
ok(f && /try \{ await thirrPush\('\/admin\/fshi', \{ uid: u \}\); \} catch \(e\)/.test(f[0]), '1b. fshijLlogarine → /admin/fshi (brenda try)');
// 2. Worker
const w = lx('worker/stoku-push.js');
ok(/rrugaF === '\/admin\/fshi'\) return meKap\(trajtoFshirjenEAdminit/.test(w), '2a. Worker: rruga /admin/fshi');
ok(/VERSIONI_WORKER = (\d+)/.exec(w)[1] >= 174, '2b. Worker ≥ 174');
ok(/admini !== ADMIN_UID\) return pergjigju\(\{ ok: false, arsye: 'leje' \}, 403\)/.test(w) && /u === ADMIN_UID\) return pergjigju/.test(w), '2c. vetëm administratori; administratori s\'fshihet');
// 3. Android: e njëjta thirrje
const push = lx(K + 'Push.kt'), adm = lx(K + 'Admini.kt');
ok(/suspend fun fshiLlogarineTeServeri\(u: String\): Boolean = kerkese\("\/admin\/fshi", mapOf\("uid" to u\)\)\.ok/.test(push), '3a. Push.kt fshiLlogarineTeServeri');
ok(/try \{ Push\.fshiLlogarineTeServeri\(u\) \} catch \(e: Exception\)/.test(adm), '3b. Admini.fshijLlogarine e thërret');
// 4. Android: leja e njoftimeve para Android 13 hap cilësimet
const gr = lx(K + 'ui/GrupiEkrani.kt');
ok(/Njoftimet\.duhetLeja\(\)\) try \{ kerkoLejen\.launch[\s\S]{0,200}ACTION_APP_NOTIFICATION_SETTINGS/.test(gr), '4. "Lejo njoftimet" para Android 13 → cilësimet');
// 5. Android: llogaritjet e rënda brenda remember
ok(/val skaduara = remember\(an, ctx\.tani\)/.test(gr) && /val javes = remember\(an, ctx\.tani\)/.test(gr), '5a. Grupi Përmbledhja: remember');
const af = lx(K + 'ui/AfatetEkrani.kt');
ok(/val lista = remember\(te, filtri, kerkimi, muaji, sotK\)/.test(af) && /val muajtBaze = remember\(/.test(af) && /val te = remember\(g\.afatet/.test(af), '5b. Afatet: remember');
const ma = lx(K + 'ui/MalliEkrani.kt');
ok(/val zero = remember\(te\)/.test(ma) && /val sotN = remember\(te, sot\)/.test(ma) && /val tefundit = remember\(te\)/.test(ma), '5c. Malli: remember');
const em = lx(K + 'Emrat.kt');
ok(/hartaRuajtur/.test(em) && /celesiHartes\[it \+ 1\] === b\[it\]/.test(em) && /ndryshime\+\+/.test(em), '5d. Emrat: harta ruhet derisa ndryshojnë burimet');
// 6. Versionet
const sw = lx('sw.js');
ok(+/stoku-v(\d+)/.exec(sw)[1] >= 344 && +/v: (\d+)/.exec(lx('versioni.js'))[1] >= 344, '6a. versioni ≥ 344');
ok(['index.html', 'pc.html', 'sw.js'].every(x => +/ekipa\.js\?v=(\d+)/.exec(lx(x))[1] >= 344), '6b. ekipa.js?v ≥ 344 kudo');
ok(/Hyrja\(102,/.test(lx(K + 'TeRejat.kt')) && /v: 344,/.test(lx('teRejat.js')), '6c. hyrjet te TeRejat.kt dhe teRejat.js');
ok(/admin-fshi-prova\.mjs/.test(lx('teste/regresioni.sh')), '6d. prova e Worker-it te regresioni');
console.log(g ? '\n' + g + ' GABIME' : '\nKREJT OK');
process.exit(g ? 1 : 0);

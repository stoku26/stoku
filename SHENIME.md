# Shënime për Claude — Stoku (stoku.site)

Ky skedar ekziston që **çdo bisedë e re** (edhe nëse s'e ka memorien e bisedave të kaluara) të mund ta
lexojë dhe ta kuptojë menjëherë projektin: çka është, si punon, çka është bërë deri tash, dhe çka duhet
respektuar kur shtohet diçka e re. Lexoje këtë skedar TË PARIN, para se të bësh çfarëdo ndryshimi.

Përditësoje këtë skedar sa herë bën një ndryshim domethënës (jo për çdo "typo fix", por për çdo veçori
të re, ndryshim arkitekture, apo mësim të rëndësishëm) — në të njëjtin PR me ndryshimin, ose në një PR
më vete menjëherë pas.

## Çka është Stoku

App web (PWA) për menaxhimin e stokut në një market/dyqan: skanim barkodesh, foldera/kategori, eksport
Excel/PDF, dhe modulin "Afatet" (datat e skadimit të produkteve, me lexim automatik të fletëve të
shkruara me dorë përmes AI-së). Pronari (menaxherja) e përdor kryesisht në kompjuter; punëtorët e
telefonit/PDA-së skanojnë mallin. Të dhënat sinkronizohen automatikisht mes pajisjeve përmes Firebase.

- **Faqja e vërtetë:** https://stoku.site (GitHub Pages, degë `main`, skedari `CNAME`)
- **Repo:** stoku26/stoku
- **Gjuha:** vetëm shqip, edhe në UI edhe në kod (komente, emra ndryshoresh/funksionesh). Mos e ndrysho
  këtë — as identifikuesit teknikë s'janë në anglisht, është vendim i qëllimshëm.
- **Përdoruesi (pronari i repo-s) flet shqip (dialekti i Kosovës), joformal, shkurt.** Përgjigju gjithmonë
  shqip, në të njëjtin regjistër — jo shqipe letrare e ngurtë.

## Struktura e skedarëve

| Skedar | Çka është |
|---|---|
| `index.html` | Versioni për **telefon/PDA** (~5000+ rreshta: HTML+CSS+JS gjithçka në një skedar). |
| `pc.html` | Versioni për **kompjuter** (~4600+ rreshta, e njëjta bazë e të dhënave, UI ndryshe: tabelë, shirit anësor, shkurtore tastiere). |
| `afatet.js` | Logjika e përbashkët për "Afatet" (data, statuse, lexim AI, formatim). Përdoret nga të dy faqet **dhe** nga `sw.js` (për njoftimet në sfond). |
| `bashkimi.js` | Logjika e bashkimit të të dhënave mes pajisjeve (LWW me kohë, fshirjet si tombstones). E përbashkët. |
| `ruajtja.js` | Ndarja e dyqanit në Firestore në disa dokumente (shih më poshtë "Firebase"). |
| `porta.js` | Ekrani i hyrjes/kyçjes (login gate) — hapet para faqes kryesore te të dyja versionet. |
| `njoftimet.js` | Njoftimet push për afatet (30 ditë para skadimit, dhe kur skadon) — logjikë e përbashkët për faqen dhe `sw.js`. |
| `teRejat.js` | Lista "Çka ka të re" (shënimet e versioneve) — tregohet në hyrje. **Shto këtu një hyrje për çdo ndryshim domethënës të ri**, shih udhëzimin brenda skedarit. |
| `xlsx.js` | Ndërton dhe lexon skedarë `.xlsx` pa librari të jashtme. |
| `sw.js` | Service worker: cache për punë pa internet + **përditësim automatik** (shih poshtë). |
| `manifest.webmanifest` | PWA manifest (emri "Stoku", ikonat). |

## Rregulla teknike THEMELORE (mos i harro)

0. **PA VIZË TË GJATË ("—") në asnjë tekst që e sheh përdoruesi** (tituj, mesazhe, toast, "Çka ka të re",
   njoftime, placeholder). Përdoruesi e sheh si shenjë që teksti është shkruar me AI (v117 u pastruan krejt).
   Në fjali: presje, pikë, dy pika ose kllapa. Si ndarës: "·" (p.sh. "Sinkronizuar · 12:21") ose "•" (titulli
   i dritares: "Ekipa • Përmbledhja • Stoku"). Qelizë bosh në tabelë: "–" (vizë e shkurtër). Te komentet e kodit
   s'ka rëndësi. Kontrolli: `gjej-vizat.js` (scratchpad) duhet të japë "gjithsej 0".

0000. **Afatet: importi nga Excel + muajt (v120)**: logjika e përbashkët në `afatet.js`: `muajiNgaEmri` ("Nëntor2" → 11,
   numrat/shenjat harrohen; "Marketi" s'është muaj), `dataNgaQeliza` (serial Excel, tekst, ose vetëm dita + muaji i
   fletës), `hamendesoKolonatEAfateve` (sipas titujve ose përmbajtjes), `planiImportitAfateve` (ekzistuese = i njëjti
   barkod/emër + datë, kalohen; të përsëriturat bashkohen, sasitë mblidhen), `afatetNgaPlani`, `muajtELista`,
   `celesiMuajit`. PC: `#afBtnImport` → `#dlgAfImport`, filtri `af.muaji` (`#afMuajt`), eksporti `#dlgAfEksport`.
   Telefon: `#afImporto`/`#afEksporto`, `afMuaji`, `#dlgAfImport`, muaji te `#dlgAfExcel` (`axKrejt`). Filtri i
   muajit është sipas DATËS SË SKADIMIT (jo foldera). Testet: `import-af-njesi.js`, `import-af-pc.js`, `import-af-tel.js`.
000. **"Çka ka të re" (v119)**: shfaqet me `tregoTeRejatKurGati()`: jo kur faqja është në sfond, jo kur një service
   worker po instalohet (pret rifreskimin); shënohet si e parë (`stoku:te-rejat:pare`) VETËM kur dritarja mbyllet
   (MutationObserver te `#dlgTeRejat`), jo kur shfaqet. Më parë rifreskimi i përditësimit e zhdukte dhe s'dilte më.
   Testi me service worker real: `swtest/sw-test2.js` (scratchpad, server në portin 8766).
00. **Tabelat e PC-së me `table-layout: fixed`**: kolona e emrit s'ka gjerësi, merr çka mbetet. Nëse kolonat fikse
   i kalojnë gjerësisë së tabelës, emri ZHDUKET pa asnjë gabim (ndodhi te 1024–1280px, v118). Kur shton kolonë
   fikse, kontrollo me `skano-gjeresi.js` (scratchpad, `GJ=1024,1280,1366`) dhe shto rregull te blloqet
   `@media (max-width: 1440/1366/1180px)` në fund të stilit të pc.html. Rrjetet (grid) me `minmax(0, 1fr)`, jo `1fr`.

1. **Cache-busting është MANUAL dhe i domosdoshëm.** Kur ndryshon një skedar JS të përbashkët
   (`afatet.js`, `bashkimi.js`, `ruajtja.js`, `porta.js`, `njoftimet.js`, `teRejat.js`, `xlsx.js`), duhet
   me dorë:
   - të rrisësh numrin `?v=NN` te çdo `<script src="...">` që e ngarkon (index.html, pc.html) **dhe**
     te lista `SHELL` në `sw.js` **dhe** te `importScripts(...)` në krye të `sw.js` nëse skedari importohet
     atje (afatet.js dhe njoftimet.js importohen nga sw.js).
   - të rrisësh `var CACHE = 'stoku-vNN'` në `sw.js` (numri kryesor i versionit të krejt aplikacionit).
   - **NUK duhet të harmonizosh numrat `?v=` të skedarëve të ndryshëm me njëri-tjetrin** — secili ka
     numrin e vet, i pavarur nga numri i CACHE dhe nga numrat e skedarëve të tjerë. P.sh. tani (shih
     `git log` për numrin aktual) CACHE mund të jetë v9x ndërsa `xlsx.js?v=58`, `bashkimi.js?v=81`, etj.
     Kontrollo numrat AKTUALË me `grep -n "CACHE = \|\.js?v=" sw.js index.html pc.html` para se të fillosh,
     mos supozo bazuar në këtë skedar (mund të jetë vjetëruar).
   - Nëse harron ndonjë nga këto, telefonat/kompjuterat me app-in e instaluar (PWA) do të vazhdojnë të
     përdorin kopjen e vjetër të ruajtur, sepse service worker-i shërben nga cache.

2. **Përditësimi automatik (që nga versioni ~91):** aplikacioni tani e kontrollon vetë në sfond (në hyrje,
   kur rikthehesh në skedë, dhe çdo 30 min) a ka version të ri të `sw.js`. Nëse ka, e shkarkon dhe **rinis
   vetë faqen** në çastin e parë të qetë (pa dialog të hapur, pa fushë ku po shkruhet, pa ruajtje në cloud
   në pritje) ose sapo kalon në sfond. **Kjo do të thotë: pas çdo merge në `main`, brenda ~10 minutash
   (koha e cache-it HTTP të GitHub Pages) çdo pajisje e hap vetë versionin e ri, pa u dashur me e mbyllë
   dhe rihapë me dorë.** Kjo ishte kërkesë eksplicite e përdoruesit (s'donte "background sync" për vetë
   idenë e sfondit — donte thjesht mos me pritë deri sa cache të skadojë vetë).

3. **"Çka ka të re" (teRejat.js):** sa herë shton një ndryshim që ia vlen përdoruesi ta dijë (veçori e re,
   përmirësim i dukshëm), SHTO NJË HYRJE në krye të `LISTA` në `teRejat.js`, me `v` = numri i ri i CACHE,
   `data`, `titulli` i shkurtër, dhe `pikat` — fjali të thjeshta për punëtorë/menaxhere, jo teknike, në
   shqip. Kjo shfaqet automatikisht si dritare "Çka ka të re" në hyrje të parë pas versionit të ri.
   **Që nga v109: `platforma: 'tel'` ose `'pc'`** te hyrjet që vlejnë vetëm për njërën (p.sh. "Kompjuteri: …"
   → `'pc'`); pa `platforma` = të dyja. Telefoni thërret `teRejatPas(v, 'tel')`, PC-ja `teRejatPas(v, 'pc')`
   — kërkesë e përdoruesit: "në telefon mos i shfaq të rejat e PC-së, dhe anasjelltas".

4. **Firebase (projekti `stoku-appi`):**
   - Auth me emër përdoruesi (jo email): shndërrohet vetë në `emri@stoku-app.local` për Firebase Auth,
     përdoruesi kurrë s'e sheh/shkruan email.
   - Firestore, `initializeFirestore(app, { ignoreUndefinedProperties: true })`.
   - **Sharding:** dyqani (produktet + afatet) NUK është në një dokument të vetëm (kufiri 1MB i Firestore),
     por i ndarë: `dyqane/{uid}` (kryesori: foldera, fshira, rendiKoha, numri i pjesëve) +
     `dyqane/{uid}/pjeset/p0..pN` (produktet/afatet, ~600KB/pjesë). Logjika është në `ruajtja.js`.
     Kompatibël prapa: dokument i vjetër (para sharding) lexohet dhe migrohet vetë.
   - `dyqane/{uid}/fletet` — fletët e fotografuara në telefon, dërguar për kontroll në PC (jo hapen
     automatikisht, del si njoftim/kartë).
   - Rregullat e Firestore i mban dhe i vendos vetë përdoruesi (unë s'kam akses direkt); duhet lejuar
     nënkoleksioni `pjeset` dhe `fletet`, plus rregulla ekzistuese për `perdoruesit/{uid}` dhe admin
     (`mendurberisha`). **Mos i propozoj kurrë rregulla që heqin admin-in ose `perdoruesit`.**
   - **Që nga "Ekipi" (v105):** klienti SHKRUAN vetë te `perdoruesit/{uid}` (`{perdoruesi, kycurSe}` — kurrë
     `emri`) në çdo `regjistrohu`/`hyr`/`onAuthStateChanged` (pa dyfishim: `regjistroPerdoruesin` mban një
     premtim për uid, v110).
   - **Që nga v110 dyqani (`dyqane/{uid}` + `pjeset`) lexohet sërish VETËM nga pronari dhe admin-i.** Kolegët
     s'e lexojnë më stokun e tjetrit: Ekipa lexon `ekipa_afatet/{uid}` (përmbledhje vetëm e afateve, shih pikën 10).
     Shih rregullat aktuale në fund të këtij skedari.
   - **ruajtja.js (v110):** një pjesë rishkruhet vetëm nëse ndryshoi — krahasimi bëhet me `pjesaKanonike()`
     (fushat e renditura + listat pa rend), sepse Firestore i kthen fushat me rend tjetër nga objekti lokal
     (me `JSON.stringify` çdo sinkronizim i rishkruante KREJT pjesët dhe çdo pajisje i shkarkonte sërish).
     Leximet e pjesëve në transaksion bëhen njëkohësisht (`Promise.all`).
   - **S'kam Firebase real as pajisje reale për testim.** Krejt testimi bëhet me Playwright + mock
     `window.__stokuCloud` (shih "Testimi" poshtë).

5. **Bashkimi i të dhënave (bashkimi.js):** LWW (last-write-wins) sipas kohës (`prekurSe`/`ndryshuarSe`);
   fshirjet ruhen si "tombstones" (kohë fshirjeje) 120 ditë, që një pajisje me kopje të vjetër të mos
   "ringjallë" diçka të fshirë; asgjë që thjesht mungon (pa u fshi qëllimisht) s'fshihet kurrë.
   **Pastrimi (v113):** `bashko()` i pastron vetë hyrjet (`pastroFolderat`/`pastroProduktet`/`pastroAfatet` — rreshtat
   null/pa id hiqen, sasia tekst → numër, barkodi numër → tekst); faqet i përdorin edhe kur lexojnë localStorage dhe
   kur marrin gjendjen e cloud-it "ashtu siç është" (pajisje e re). Më parë një `null` te folderat e rrëzonte telefonin.
   Testi: `fuzz-te-dhena.js` (scratchpad). "Dil" pa internet paralajmëron (porta i fshin të dhënat lokale kur hyn
   llogari tjetër).
   Dy ndryshime të njëkohshme të sasisë së TË NJËJTIT produkt nga dy pajisje: fiton më i riu (s'mblidhen) —
   vendim i qëllimshëm (bashkimi me 3 anë do të kërkonte "bazën" për çdo produkt dhe rrezikon dyfishime).
   **Dëgjuesi i cloud-it (v110, tel `__remoteNePritje` / PC `sink.remoteNePritje`):** një gjendje nga cloud-i
   që mbërrin ndërsa ruajtja jonë është në rrugë NUK hidhet më — ruhet dhe bashkohet sapo mbaron ruajtja
   (më parë ndryshimi i një pajisjeje tjetër, i ruajtur menjëherë pas nesh, s'shfaqej deri në ndryshimin e
   radhës). Kur pret vetëm kohëmatësi i ruajtjes, gjendja e cloud-it bashkohet menjëherë (bashkimi s'humb
   asgjë lokale). Testi: `sink-pritje.js` (scratchpad).

6. **Porta (porta.js):** ekran hyrjeje i detyrueshëm para faqes kryesore (telefon dhe PC). Lejon punë pa
   internet vetëm nëse kjo pajisje ka hyrë më parë. Kur hyn një llogari tjetër në të njëjtën pajisje, të
   dhënat lokale të llogarisë së mëparshme hiqen (janë të ruajtura në cloud-in e saj).
   **v115 ("userat s'po mund të kyçen"):** Firebase v12 kërkon ES2020 (Chrome/WebView 80+, Safari 13.1+) —
   në shfletues të vjetër moduli s'ngarkohet fare; porta e zbulon (`SHFLETUES_I_VJETER`, provë me `?.`/`??`)
   dhe thotë "përditëso Chrome / Android System WebView", jo "s'ka internet". Kur Firebase vonon (>7 s),
   mesazhi është "lidhja po zgjat" dhe "Hyr" PRET deri 25 s (`pritCloudin`) në vend që të dështojë menjëherë.
   Gabimet e panjohura tregojnë kodin (p.sh. "(auth/…)") që përdoruesi ta raportojë. Nëse shkrimi i
   `stoku:pronari-uid` dështon (memoria plot) gjatë ndërrimit të llogarisë, pronari zbrazet → pa rifreskime
   pa fund. Testi: `porta-v115.js` + `porta-test.js` (scratchpad). Kujdes: me rregullat v110+ një llogari e re
   HYN normalisht, por Ekipa i thotë "Në pritje të miratimit" derisa administratori ta pranojë — v115 i tregon
   adminit një baner "X pret miratimin · Prano" në krye të Pultit (tel + PC). Migrimi (një herë) tani i pranon
   krejt llogaritë që mungojnë, jo vetëm kur `ekipa_anetaret` është bosh. Testi: `kerkesat-v115.js`.

7. **Butoni "mbrapa" i Android-it / historia e shfletuesit** (index.html): çdo "shtresë" e hapur (folder,
   dialog, kamerë, tab) i shton një hyrje historisë; "mbrapa" mbyll vetëm shtresën e fundit, kurrë s'del
   nga app-i. Logjika: `niveletEHapura()`, `sinkronizoHistorineEDritareve()`, `ANULO_SIPAS_DIALOGUT`.
   Kur shtohet një dialog/tab i ri, duhet përfshirë në këtë logjikë (shiko si janë `dlgTeRejat`,
   `dlgNjoftimet` etj. në `ANULO_SIPAS_DIALOGUT`).

8. **Shiriti me tabe (telefon, që nga v90; 4 tabe që nga v105):** navigimi kryesor në telefon tani është
   4 tabe poshtë ekranit (Stoku / Afatet / Ekipi / Cilësimet), jo butona në kokë. Shiriti fshihet
   automatikisht brenda një folderi, te kamera, te leximi i fletës, dhe kur një fushë ka fokusin
   (tastiera hapur). Shiko `#tabet` në CSS/JS të index.html nëse ndryshon navigimin.

9. **"Opsionet" quhet tani "Cilësimet"** (që nga v90) — mos e kthe mbrapsht pa u pyetur.

10. **"Ekipa" (v105 si "Ekipi"; rindërtuar krejt në v109; siguria në v110).** Tab/seksion për llogaritë e Stoku-t
    si një ekip i vetëm (s'ka ftesa/grupe — kërkesë eksplicite). **Vetëm afatet, jo stoku** (v109, kërkesë e
    përdoruesit).
    - **Anëtarësia me miratim (v110):** regjistrimi është i hapur për këdo, prandaj një llogari e re e sheh Ekipën
      vetëm pasi ta pranojë administratori (`mendurberisha`) — `ekipa_anetaret/{uid}` (e shkruan vetëm admin-i).
      Llogaria në pritje sheh "Në pritje të miratimit"; stoku/afatet e saj punojnë normalisht. Admin-i sheh
      kërkesat te Ekipa → Anëtarët ("Prano" / "Prano krejt"), shenjë te tabi/anësorja dhe një njoftim; "Hiq nga
      ekipa" (tel: poshtë listës së anëtarit; PC: kolona e fundit te Anëtarët). **Migrimi:** herën e parë që
      aplikacioni i admin-it gjen rregullat e reja dhe `ekipa_anetaret` bosh, i pranon krejt llogaritë ekzistuese
      njëherësh (shënohet `perdoruesit/{admin}.ekipaMigruarSe`, bëhet vetëm një herë). "X u bashkua me ekipën" te
      aktiviteti e shkruan admin-i kur pranon (`anetariUid`/`anetariEmri`), jo më llogaria e re.
      **Me rregullat e vjetra** (para se përdoruesi t'i vendosë): `ekipa_anetaret` s'lexohet → `anetaresia =
      'pa-rregulla'` → gjithçka punon si në v109 (krejt llogaritë = ekipa, afatet nga dyqanet).
    - **`ekipa_afatet/{uid}` (v110):** përmbledhja e afateve të secilit (`permbledhjaEAfateve`: vetëm fushat që
      duhen, afatet në raft + të hequrat e 40 ditëve, ≤700 KB), e publikon pronari pas çdo sinkronizimi të
      suksesshëm (`ekK.publikoAfatet(afatet)`, vetëm kur ndryshon nënshkrimi). Ekipa e dëgjon në kohë reale.
      Koleg pa përmbledhje (s'e ka hapur ende versionin e ri) → provohet dyqani i tij (vetëm me rregullat e
      vjetra/admin); ndryshe "Pa të dhëna ende".
    - **Radha e dërgimit (v110):** aktiviteti, chat-i dhe njoftimet shkruhen me `setDoc` me id të caktuar dhe
      ruhen te `stoku:ekipa:radha:{uid}` derisa serveri t'i pranojë → pa internet s'humbin, edhe nëse
      aplikacioni mbyllet. Rregullat lejojnë vetëm krijimin, kështu një ridërgim i së njëjtës id refuzohet (s'ka
      dyfishime) dhe hiqet nga radha. "Unë e hoqa" pa internet: "njoftohet sapo të ketë internet".
    - **Emrat s'falsifikohen (rregullat v110):** `emri` te aktiviteti/chat-i/njoftimet dhe `perdoruesi` te
      `perdoruesit/{uid}` duhet të jenë = emri i llogarisë (`request.auth.token.email`). Admin-i mund të fshijë
      çdo mesazh të chat-it.
    - Heqja e mbivendosur (`mbivendosHeqjen`) vlen vetëm për afate të SKADUARA — njësoj si `duhetZbatuarHeqja`.
    - **Administratori 100% (v112)** — vetëm `mendurberisha` (`ekK.eshteAdmin()`): (1) pamja "Stoku" (tel: çipi
      `#ekChipStoku`, PC: segmenti `#ekSegStoku`, `#/ekipa/stoku`) — stoku i plotë i secilit, vetëm lexim, + Excel
      (`fletetEStokut`); (2) te afatet e kolegëve: "Shëno të hequr"/"Ktheje"/"Fshije" (`adminNdryshoAfatin` →
      `__stokuCloud.ndryshoDyqaninEPerdoruesit(uid, fn)` = transaksion direkt në dyqanin e tij, `ndryshoAfatinNeGjendje`
      me `ndryshuarSe`/tombstone që bashkimi te pronari ta pranojë; pastaj ripublikon `ekipa_afatet/{uid}` dhe e
      njofton pronarin `lloji:'admin-afat'`); (3) te Anëtarët: leja +/- për secilin (`perdoruesit/{uid}.sasiaShpejte`,
      `false` = e hequr qëllimisht — "fara" me emër s'e rikthen; lokalisht `stoku:leja:sasia-shpejte = '!uid'`; vlen
      herën tjetër që hapet aplikacioni); (4) njoftim për krejt ekipën (`lloji:'lajmerim'` te zilja e secilit + aktiviteti)
      dhe "Pastro krejt chat-in/aktivitetin". Testi: `ekipa-admin-test.js` (scratchpad). Telefon: tabi i tretë `#btnEkipi`/`#dlgEkipi`; PC: seksioni i tretë i akordionit
    (`#btnAkordEkipi`) me nën-zëra `[data-ek]`, faqja `#pamjaEkipi`, adresa `#/ekipa[/<nën-pamja>]`
    (`#/ekipi` i vjetër pranohet). ID-të e brendshme mbetën "ekipi" — vetëm tekstet u bënë "Ekipa".
    - **`ekipa.js` (i ri, i përbashkët tel+PC)**: (1) `krijoCloud(fs, db, auth, platforma)` → `__stokuCloud.ekipa`
      (prania, aktiviteti, chat-i, njoftimet personale); (2) funksione të pastra të testueshme me node
      (`kohaRelative`, `eshteOnline`, `kalendari`, `statistikat`, `tekstiNgjarjes`, `duhetZbatuarHeqja`…);
      (3) `krijoKontrollues(o)` — mban gjendjen + dëgjuesit; faqet (index/pc) VETËM vizatojnë kur thirret
      `o.ndryshoi(cfare)`. Çdo ndryshim logjike bëje TE ekipa.js, jo dy herë.
    - **Firestore**: `perdoruesit/{uid}` (+ `aktivSe`, `online`, `platforma` për praninë — rrahje çdo 90 s kur
      aplikacioni është përpara; "online" = `online:true` dhe rrahja < 4 min), `perdoruesit/{uid}/njoftimet`
      (njoftimet personale; pronari i lexon/shënon `lexuar`), `ekipa_feed` (aktiviteti), `ekipa_chat`.
      Asnjë indeks i përbërë s'nevojitet (vetëm `orderBy('koha')` ose `where('lexuar','==',false)`).
    - **Dyqani i secilit mbetet i PRONARIT.** "Unë e hoqa" te një afat i SKADUAR i kolegut: shkruan një
      njoftim te `perdoruesit/{pronari}/njoftimet` + një ngjarje te `ekipa_feed`. Aplikacioni i pronarit (kur
      hapet, ose menjëherë nëse është hapur) e zbaton vetë (`zbatoHeqjetEKolegeve` tel / `ekZbatoHeqjet` PC):
      `statusi:'hequr'`, `hequrNga` = emri i kolegut — VETËM nëse `duhetZbatuarHeqja()` (afati ka skaduar
      vërtet dhe s'është ndryshuar pas heqjes). Deri atëherë, të tjerët e shohin si "të hequr" nga aktiviteti
      (`mbivendosHeqjen`). Kështu askush s'ka nevojë për leje shkrimi te dyqani i tjetrit.
    - **Aktiviteti** mbushet nga: `shenoHequr`, `shenoLajmeruar`/lista e furnizuesit, `riktheAktiv`, afatet e
      reja (mblidhen 20 s → "shtoi N afate"), anëtar i ri. Afatet e kolegëve lexohen (jo dëgjohen) kur hapet
      Ekipa, dhe rifreskohen vetëm për kolegun që ka një ngjarje të re (stoku ndryshon shpesh — s'ia vlen).
    - **Zilja** = njoftimet personale; **njoftim i sistemit** vetëm kur aplikacioni është HAPUR në sfond (s'ka
      server/FCM — kur aplikacioni është krejt i mbyllur, njoftimi del te zilja herën tjetër që hapet).
      SW-ja (`notificationclick`) i dërgon dritares `hap-ekipa` (tel: `#ekipa-<pamja>`, PC: `#/ekipa/…`).
    - **Dizajni "Pulti" (v114, opsioni A nga 5 dizajne që përdoruesi i zgjodhi — mos e ndrysho pa pyetur):**
      tel: faqja kryesore e Ekipës = `ekEshteShtepi()` (pamja 'afatet' pa anëtar) → `vizatoPultin()`: koka blu me datën
      (`#ekipiData`), karta e madhe me 3 numrat + shiritin me ngjyra (klik → lista e krejt ekipës me filtër), pllakat me
      ikona (`.ek-pult-pllakat`, `ekPllaka()`), "Online tani" (`.ek-online-rrip`, klik → afatet e atij), "Duhet hequr nga
      rafti" (me "Unë e hoqa") dhe "Skadojnë këtë javë". Në çdo pamje tjetër pllakat dalin si shirit sipër (`#ekMenu`, i
      fshehur te faqja kryesore) dhe `ne-anetar` e bën "mbrapa" të kthehet te Pulti. PC: nën-pamja `pulti` ("Përmbledhja",
      e parazgjedhura; `#/ekipa` = pulti, `#/ekipa/afatet` = afatet) me 4 KPI, tabelën "Duhet vepruar" (`ekRreshtAfati(x, true,
      true)`) dhe listën e anëtarëve djathtas.
    - **Pamjet** (tel: pllakat `#ekMenu`; PC: `.segmente#ekMenu` + anësorja): Afatet (kartat e anëtarëve →
      lista/tabela me "Unë e hoqa"), Aktiviteti, Chat, Kalendari (ngjyra për ditë: e kuqe/verdhë/gjelbër,
      e ndërprerë = të hequra), Anëtarët (online/parë së fundi, pajisja), Statistika. **Chat-i (v111) s'është më çip te menuja:** hapet nga ikona/butoni lart djathtas pranë ziles (`#ekChatBtn`, pika `#ekChatPike`; prekja sërish kthen te pamja e mëparshme) — kërkesë e përdoruesit. Dizajni përdor VETËM pjesët
      ekzistuese (folder-karta, af-numer, af-karta, artikull, af-filtrat / kpi, segmente, tabela, shiritat e
      Përmbledhjes) — 5 dizajne të veçanta u refuzuan si "palidhje" para këtij.
    - Testi me dy përdorues: `ekipa-server.js` (Firebase i simuluar në node, `exposeBinding`) +
      `ekipa-tel-test.js` / `ekipa-pc-test.js` (scratchpad) — agimi në telefon, blerta në PC.
    - **Testi me kodin e VËRTETË (v110):** `fs-server.js` (scratchpad) = Firestore i simuluar me rregullat
      (`rregullat: 'reja'` ose `'vjetra'`); faqet përdorin `ruajtja.js` + `ekipa.js` të vërteta mbi një `fs` të rremë
      (`__stokuCloud` ndërtohet te `DOMContentLoaded`). `ekipa-v110-test.js` (miratimi, migrimi, përmbledhjet,
      radha offline me rihapje, mashtrimet e refuzuara, admin-i) dhe `ekipa-v110-vjetra-test.js` (rregullat e vjetra).

11. **Leja e "sasisë së shpejtë" (butonat +/- te lista) ndjek LLOGARINË, jo emrin (v108).** Më parë ishte e
    lidhur me emrin `albidepo34` në kod — kur ai e ndërroi emrin në `tonnyaliu`, e humbi. Tani: flamuri
    `sasiaShpejte:true` te `perdoruesit/{uid}` + kopje lokale `stoku:leja:sasia-shpejte` (= uid). Emrat në
    `SASIA_SHPEJTE_EMRAT`/`EMRAT_FARE_SASIA` (vetëm `tonnyaliu` që nga v110 — `albidepo34` u hoq, sepse emri u
    lirua dhe kushdo që regjistrohej me të do ta merrte lejen) janë vetëm "farë": sapo llogaria hyn me
    njërin, flamuri ruhet dhe e mban edhe pas çdo ndërrimi emri. Për t'ia dhënë këtë leje dikujt tjetër:
    shto emrin e tij në të dyja listat (index.html + pc.html), ose vendos `sasiaShpejte: true` te dokumenti i tij
    në Firebase. `ndryshoEmrin()` tani përditëson menjëherë `perdoruesit/{uid}.perdoruesi` (lista e Ekipit).
    Rregulla: kurrë mos lidh leje/veçori me emër përdoruesi — përdor uid ose flamur te `perdoruesit/{uid}`.

## Historiku i shkurtër i veçorive kryesore (kronologjik, PR-të kryesore)

- Skanimi i barkodeve: BarcodeDetector nativ (Android), ZXing-WASM me rezolucion të plotë për iPhone
  (html5-qrcode ishte shumë i ngadaltë/i pasaktë për Safari — historia e vjetër).
- Foldera/kategori, eksport Excel (xlsx.js vetjak, pa librari), eksport PDF me etiketa+barkod (JsBarcode).
- Sinkronizim automatik telefon↔PC↔PDA përmes Firebase, me sharding (pika 4 lart) pasi u arrit kufiri 1MB.
- Moduli "Afatet": foto → lexim me AI (Cloudflare Worker, jo në këtë repo) → kontroll nga përdoruesi →
  ruaj. Ngjyra: e kuqe=skaduar, e verdhë=brenda 30 ditësh, e gjelbër=ok, gri=hequr nga rafti.
- "U hoq nga rafti" — buton që del VETËM për produktet e skaduara (jo për "afër skadimit").
- Data e skadimit shkruhet me vit 2-shifror (`DD-MM-VV`, p.sh. `01-12-26` = 2026); pranohet edhe 4-shifror.
- Eksport Excel i afateve të zgjedhura, me zgjedhje të kolonave (checkbox-a, mbahen mend).
- Njoftime push (Notification API) për afatet — 30 ditë para dhe kur skadon, jo më shpesh se 1x/produkt/datë.
- Login i detyrueshëm (porta.js) para faqes kryesore.
- Ridizajnimi i Opsioneve/Cilësimeve në telefon (grupe, ikona me ngjyra) — **u ANULUA** një herë me kërkesë
  të përdoruesit ("palidhje"), pastaj u ri-implementua ndryshe (shirit tabesh) dhe u pranua.
- Shiriti me tabe poshtë ekranit (telefon), riemërtimi "Cilësimet".
- Përditësimi automatik në sfond + "Çka ka të re" (kjo bisedë/PR më e fundit, ~v91).
- Skedar shënimesh `SHENIME.md` (ky skedar).
- Importi i stokut nga foto (faqja kryesore, ikonat lart djathtas): fotografo/zgjidh nga galeria →
  AF.lexoMeAI() (i njëjti endpoint AI si Afatet, me `ekstra: {synim:'stok'}` — Worker-i aktual s'e
  përdor ende, është përgatitje) → kontrollo/korrigjo rreshtat (barkodi+emri+sasia+furnizuesi, jo
  data) → zgjidh folderin (ose "+ Folder i ri…" aty për aty, hap dlgFolder mbi dlgImportStok) → ruaj
  (bashkohet me barkodin ekzistues në atë folder: sasia mblidhet, emri/furnizuesi ekzistues mbeten
  nëse janë vendosur). **Konfirmuar me AI real** (~19 rreshta të lexuar saktë nga një faturë e vërtetë).
  Pas fotos, telefoni pyet "Ku do ta kontrollosh fletën?" (dialogu i përbashkët `dlgKuFleta`, njësoj si
  te Afatet): "Vazhdo këtu" → dlgImportStok si më sipër; "Dërgo në PC" → e lexon këtu (me
  `synim:'stok'`), e dërgon te `dyqane/{uid}/fletet` me `lloji:'stok'`, dhe kompjuteri (i njëjti
  llogari) e hap vetë dialogun ekzistues `dlgLexim` në "modin stok" (`lx.lloji`): heq kolonën e
  datës, shton kutinë e zgjedhjes së folderit (`#lxFolderKuti`/`#lxFolderi`, kujtohet si
  `stoku:import-stok:folderi`), dhe ruajtja (`ruajLeximinStok()`) bashkohet me `produktet` njësoj si
  në telefon. Folderi NUK zgjidhet në telefon para dërgimit — zgjidhet vetëm në anën ku kontrollohet
  (telefon ose PC). (~v94; furnizuesi + dërgo-në-PC janë ~v94, pjesa bazë ~v92-93.)
  **Radhitja e rreshtave në fotot me disa kolona**: udhëzimi (`UDHEZIMI`) i Worker-it (kopja lokale në
  scratchpad, JO në këtë depo) u përditësua për të kërkuar leximin kolonë-për-kolonë (majtas→djathtas,
  secila kolonë lart→poshtë) në vend të rresht-për-rresht përgjatë gjithë gjerësisë. **Kjo ËSHTË
  DEPLOYED** (përdoruesi e konfirmoi "version saved" pas kopjimit të kodit në Cloudflare).
- **Numrat mbi foto** (~v96-97, i njëjti update i Worker-it si radhitja më sipër — **gjithashtu DEPLOYED**):
  Worker-i tani i kërkohet edhe pozicionin `x`/`y` (0..1, fraksion i gjerësisë/lartësisë) të secilit
  rresht në foto — shtuar te `SKEMA`, `UDHEZIMI` dhe të tri format-hints-et (`meWorkersAI`/`meGemini`/
  `meClaude`) të kopjes lokale të Worker-it. `AF.normalizoRreshtin()` (afatet.js) i kalon tej si `r.x`/
  `r.y` (ose `null` nëse mungojnë/kopje e vjetër e Worker-it). Klienti (telefon: `vizatoNumratMbiFoton()`
  në index.html, mbi `#impFoto`/`#lxFoto`; PC: `fotoPamja.vendosNumrat()` në pc.html, si SVG e veçantë
  `lexim-numrat` mbi lapsin, me TË NJËJTIN transform zoom/pan si foto+lapsi) vizaton nga këto koordinata
  një numër (1, 2, 3…, sipas rendit në tabelë/listë) të kuq mbi foto, pranë fillimit të rreshtit — që
  përdoruesi ta krahasojë lehtë rreshtin e tabelës me rreshtin në foto. Rreshtat pa `x`/`y` (shtuar me
  dorë, ose lexuar me kopje të vjetër të Worker-it) thjesht s'kanë numër mbi foto — nuk është gabim.
  **Deri sa Worker-i i ri të vendoset (deploy), fusha `x`/`y` do të vijnë bosh nga AI-ja aktuale dhe
  asnjë numër s'do të shfaqet** — kodi klientit është gati dhe pret vetëm updatin e Worker-it.
- **Furnizuesi i shpikur**: përdoruesi raportoi që AI-ja po vendoste TË NJËJTIN emër furnizuesi (të
  shpikur, s'ekzistonte në fletë) te ÇDO rresht. Udhëzimi (`UDHEZIMI`, fusha `furnizuesi`) u fortësua
  eksplicit: "KURRË MOS E SHPIK... lëre bosh te ÇDO rresht" nëse s'shkruhet askund në fletë.
- **Saktësia e `y`**: me fleta të gjata (50+ rreshta reale), numrat mbi foto dilnin dukshëm mbi rreshtin e
  vet (jo saktë në vijë). Udhëzimi i `y` u bë më eksplicit: "SAKTËSISHT në QENDRËN E SHKRONJAVE, jo maja
  e rreshtit", dhe theksohet të mos llogaritet si distancë e barabartë mes rreshtash (shkrimi dorë s'është
  i barabartë) — çdo rresht të kontrollohet veç e veç.
  **As furnizuesi-i-shpikur, as saktësia e `y` NUK janë ende të konfirmuara si deployed** — ia dhashë
  përdoruesit skedarin e ri (të konsoliduar me krejt ndryshimet deri tash), por s'e kam konfirmimin
  "u ngjit" për këta të dy specifikisht (ndryshe nga radhitja+x/y bazë, që u konfirmua me "version saved").

## Konventat e testimit (S'KA Firebase real, s'ka telefon real)

Meqë s'ka akses te Firebase-i i vërtetë as te pajisje fizike, çdo veçori testohet me **Playwright**:

- Server lokal: `python3 -m http.server 8765` (ose port tjetër) brenda `/home/user/stoku`.
- Mock i cloud-it: `page.addInitScript(() => { window.__stokuCloud = { authGati: true,
  perdoruesiAktual: () => ({...}), merr: async () => ({ok:true, gjendja:...}), bashkoDheRuaj: async fn =>
  {...}, degjo: () => () => {} }; localStorage.setItem('stoku:pronari-uid', 'u1');
  localStorage.setItem('stoku:porta:hyrja', '1'); })` — kjo e anashkalon `porta.js` (login gate) dhe
  Firebase-in e vërtetë.
- CDN-të e jashtme (jsdelivr, workers.dev) bllokohen te rrjeti i vërtetë i kësaj mjedisi — route-ohen te
  kopje lokale (npm/node_modules) me `ctx.route(...)`.
- Për të testuar **service worker-in real** (përditësimin automatik, cache): duhet `serviceWorkers: 'allow'`
  (jo `'block'`) dhe një kopje e vërtetë e skedarëve në disk (jo route-im), sepse SW punon me `fetch` të
  vërtetë ndaj serverit lokal. Shih historinë e bisedës për skriptet `perditesim.js`/`perditesim2.js` si
  shembull (simulojnë ndryshimin e `CACHE` në `sw.js` dhe kontrollojnë rinisjen).
  - viewport telefoni: `{ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }`,
    userAgent Android Chrome.
  - viewport PC: `{ width: 1280-1600, height: 700-800 }`, pa userAgent special (ridrejtohet vetë te
    pc.html sipas rregullit "kompjuter = ka maus / s'është touch-only").
- **Gjithmonë bëhet edhe një regresion i plotë** (folderat, skanimi, eksporti, afatet, sinkronizimi) para
  se të hapet PR, jo vetëm testi i veçorisë së re — disa gabime u zbuluan kështu (jo nga testi i
  synuar, por nga regresioni i plotë).
- Screenshot-et u dërgohen përdoruesit (SendUserFile) si provë vizuale — e vlerëson shumë këtë, sidomos
  për ndryshime UI.

## Rrjedha e punës (git/PR)

- Branch pune: `claude/qysh-funksionon-ilbmdw` (emër fiks, mos e ndrysho pa u kërkuar).
- Pas çdo ndryshimi: commit + push + hap PR, pastaj shpjegoj shqip çka ndryshoi dhe pse, thjesht, si për dikë
  jo-teknik. Kur përdoruesi e kërkon ("bone merge"), e bëj vetë merge-in me mjetin e GitHub-it
  (p.sh. PR #45–#50 u bënë merge kështu).
- Nëse PR paraardhëse u bë merge para se të fillonte puna e re: `git fetch origin main` dhe
  `git checkout -B claude/qysh-funksionon-ilbmdw origin/main` (rifillo nga main i pastër), mos vazhdo mbi
  histori të vjetruar.
- Commits/PR MOS përfshijnë identifikues modeli (asnjë "Claude Opus/Sonnet/...", "generated by model X")
  brenda mesazhit apo kodit — vetëm rreshtat e atribuimit standarde në fund (Co-Authored-By / Claude-Session
  / linku "Generated with Claude Code") sipas udhëzimit të sistemit në atë bisedë.
- Çdo PR duhet përshkrim të plotë shqip: çka ndryshoi, si u testua, çfarë numrash versioni u prekën.

## Gjëra që përdoruesi i ka refuzuar/anuluar shprehimisht (mos i propozo/rikthe pa pyetur)

- Marking/vijëzim automatik i rreshtave në fletë (u keqkuptua kërkesa origjinale; u zëvendësua me "laps"
  të kuq të vizatuar me dorë nga përdoruesi mbi foton, që mbetet gjatë zoom-it).
- Butoni "versioni për telefon" te pc.html (u hoq krejt).
- Placeholder-a tip "p.sh." në fusha — përdoruesi i pëlqen hint-e përshkruese, jo shembuj konkretë.
- Teksti "ose komercialistin" te mesazhet e afateve — u hoq, mbetet vetëm "furnizuesin".
- Zoom me pinch-to-zoom në telefon — u ç'aktivizua (maximum-scale=1, user-scalable=no, touch-action).
- Kompjuteri, ndarja Stoku/Afatet — HISTORIA (mos e rifillo pa pyetur, thjesht respekto gjendjen aktuale):
  1) taba lart me `#tabStoku`/`#tabAfatet` (PR #32) → 2) u ANULUA ("tepër palidhje", PR #33, mbrapa te
  `#navAfatet` në fund të anësores) → 3) u kërkua sërish (PR #37, tabet lart) → 4) u ANULUA PËRSËRI
  ("tmerr u doka") dhe u kërkua "Stoku"/"Afatet" si dy tituj statikë në anësore, secili me nën-artikujt
  gjithmonë të dukshëm poshtë emrit (PR #38) → 5) u kërkua NJË RREGULLIM I FUNDIT: jo dy seksione
  gjithmonë të hapura njëkohësisht (dukeshin "të ndara"/larg njëra-tjetrës) — në vend të kësaj, **AKORDION**:
  të dyja titujt ("Stoku"/"Afatet", butona `#btnAkordStoku`/`#btnAkordAfatet`, klasë `.akordion-krye`,
  me shigjetë `.akordion-shigjeta` që rrotullohet) ngjitur njëri pas tjetrit lart në anësore; kliko njërin
  → hapet VETËM ai (nën-artikujt e tij shfaqen poshtë, brenda `.akordion-trup.hapur`) dhe tjetri mbyllet
  automatikisht; gjendja e hapur/mbyllur ndiqet nga `pamja` (`vendosAkordionin()`, e thirrur nga
  `renderAnesoren()`). **v117 (kërkesë e përdoruesit):** secili titull (Stoku/Afatet/Ekipa) është
  `div.akordion-krye.ak-{stoku|afatet|ekipi}` me DY butona: emri `#btnAkordX` (`.akordion-emri`, me ikonë me
  ngjyrë `.akordion-ikona`: blu/portokalli/jeshile) të çon te kategoria (ose e hap/mbyll kur je aty), dhe
  shigjeta `#btnAkordXShigjeta` (`.akordion-shigjeta-btn`, me kornizë) vetëm e hap/mbyll PA navigim. Vijë
  ndarëse sipër çdo kategorie (përveç të parës). Testi: `anesorja-v117.js`. "Stoku" i hapur → kthehet gjithmonë te "Përmbledhja" (jo te pamja e fundit — u hoq
  qëllimisht kompleksiteti i `fundiPamjesStoku`). `#navAfatet` mbetet brenda `#akordAfatetTrupi`.
  **PAS PROVËS REALE, 3 rregullime shtesë (~v102-103)**: (a) tranzicioni u bë "slide" i vërtetë me
  `grid-template-rows: 0fr→1fr` (jo `max-height` që s'animohet në CSS) + `.anesore-fund{margin-top:auto}`
  që footer-i të mbetet gjithmonë në fund; (b) të dyja seksionet mund të jenë të hapura NJËKOHËSISHT tani
  (`akordoniStokuHapur`/`akordoniAfatetHapur`, dy boolean të pavarur — jo më "vetëm njëri i hapur"; klikimi
  i titullit kur je TASHMË te ajo pamje thjesht e hap/mbyll atë, pa e prekur tjetrin; navigimi nga një pamje
  tjetër e hap tjetrin PA e mbyllur këtë); (c) nën "Afatet" u shtuan edhe "Të skaduara"/"Afër skadimit"
  (`#navAfSkaduara`/`#navAfAfer`, vendosin `af.filtri` dhe lundrojnë te 'afatet'); (d) **RREGULLIM I
  RËNDËSISHËM**: fletët e dërguara nga telefoni ndaheshin vetëm me TEKST ("Fletë stoku" vs "Fletë afatesh")
  por të dyja llojet shfaqeshin GJITHMONË brenda faqes së Afateve (`#afFletetTel`, i vetmi kontejner që
  ekzistonte) — përdoruesi e pa këtë si "gabim, fletë stoku po del te Afatet". Tani ka DY kontejnerë të
  veçantë: `#stokFletetTel` (brenda `#pamjaPermbledhja`, vetëm fletë `lloji==='stok'`) dhe `#afFletetTel`
  (vetëm afatet), me badge-e të veçanta `#stokTabFleta` (mbi titullin "Stoku") dhe `#afTabFleta`, filtruar
  brenda `renderFletetETelefonit()`.
  **KJO ËSHTË GJENDJA PËRFUNDIMTARE (~v103)**. Testet Playwright që lidhen me këtë zonë duhet të klikojnë
  `#btnAkordStoku`/`#btnAkordAfatet` PARA se të klikojnë diçka brenda tyre (p.sh. `#navPermbledhja`,
  `#afBtnShto`) — një seksion i mbyllur mund të hapet pa e mbyllur tjetrin, por elementet brenda TIJ vetë
  s'janë të klikueshme derisa të hapet.
  Nëse ndonjëherë duket sikur duhet ndryshuar përsëri kjo zonë, PYET së pari çka saktësisht don ndryshe,
  në vend që të provosh dizajne të reja vetë — kjo zonë ka ndryshuar 4 herë tashmë.

## Rregullat e Firestore — "Ekipa" (v116) — i vendos PËRDORUESI (unë s'kam qasje)

Teksti i plotë që iu dha përdoruesit (zëvendëson krejt skedarin e rregullave). Krahasuar me v109: dyqani lexohet
vetëm nga pronari/admin-i; Ekipa (anëtarët, aktiviteti, chat-i, `ekipa_afatet`) vetëm nga anëtarët e pranuar
(`ekipa_anetaret/{uid}`, i shkruan vetëm admin-i); `emri`/`perdoruesi` s'falsifikohen (= emri i llogarisë);
admin-i fshin çdo mesazh. Vazhdon mbrojtja e vjetër: aplikacioni s'mund ta shtojë/ndryshojë fushën `emri` te
`perdoruesit/{uid}` (admin-i ndreqet vetëm nga Console).
**v116 (fshirja e llogarisë nga admin-i):** `ekipa_fshire/{uid}` (shkruan vetëm admin-i, lexon vetë llogaria) —
llogaria e shënuar s'ka më qasje te dyqani/profili/`ekipa_afatet` (s'mund t'i rikrijojë); admin-i fshin
`perdoruesit/{uid}` dhe njoftimet e tij. Aplikacioni i llogarisë së fshirë (`degjoFshirjen` te ekipa.js) i fshin
të dhënat lokale, thërret `deleteUser` (emri lirohet; nëse Firebase kërkon hyrje të freskët, vetëm del dhe
provohet herën tjetër) dhe tregon "Kjo llogari u fshi nga administratori." te porta. Llogaria e hyrjes (Auth)
S'MUND të fshihet nga admin-i pa server — fshihet vetëm kur vetë pajisja e tij e hap Stoku-n. Testi:
`fshirja-v116.js` (scratchpad).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function eshteAdmin() {
      return get(/databases/$(database)/documents/perdoruesit/$(request.auth.uid)).data.emri == 'mendurberisha';
    }
    // Anëtar i pranuar i ekipës (ose administratori)
    function neEkipe() {
      return exists(/databases/$(database)/documents/ekipa_anetaret/$(request.auth.uid)) || eshteAdmin();
    }
    // Llogari e fshirë nga administratori: s'ka më qasje në asgjë
    function uFshi(uid) {
      return exists(/databases/$(database)/documents/ekipa_fshire/$(uid));
    }
    // Emri i llogarisë (emri@stoku-app.local) — s'mund të falsifikohet nga aplikacioni
    function emriIm() {
      return request.auth.token.email.split('@')[0];
    }
    match /dyqane/{kodi} {
      allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      match /pjeset/{pjesa} {
        allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      }
      match /fletet/{fleta} {
        allow read, write: if request.auth != null && ((request.auth.uid == kodi && !uFshi(kodi)) || eshteAdmin());
      }
    }
    match /perdoruesit/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || neEkipe());
      allow create: if request.auth != null && request.auth.uid == uid && !uFshi(uid)
        && !request.resource.data.keys().hasAny(['emri'])
        && (!('perdoruesi' in request.resource.data) || request.resource.data.perdoruesi == emriIm());
      allow update: if request.auth != null && ((request.auth.uid == uid && !uFshi(uid)
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['emri'])
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['perdoruesi'])
            || request.resource.data.perdoruesi == emriIm()))
        || (eshteAdmin() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['sasiaShpejte'])));
      allow delete: if request.auth != null && eshteAdmin();
      match /njoftimet/{nid} {
        allow read, delete: if request.auth != null && (request.auth.uid == uid || eshteAdmin());
        allow update: if request.auth != null && request.auth.uid == uid;
        allow create: if request.auth != null && neEkipe()
          && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm();
      }
    }
    match /ekipa_fshire/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || eshteAdmin());
      allow write: if request.auth != null && eshteAdmin();
    }
    match /ekipa_anetaret/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || neEkipe());
      allow write: if request.auth != null && eshteAdmin();
    }
    match /ekipa_afatet/{uid} {
      allow read: if request.auth != null && neEkipe();
      allow write: if request.auth != null && ((request.auth.uid == uid && !uFshi(uid)) || eshteAdmin());
    }
    match /ekipa_feed/{id} {
      allow read: if request.auth != null && neEkipe();
      allow create: if request.auth != null && neEkipe()
        && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm();
      allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || eshteAdmin());
    }
    match /ekipa_chat/{id} {
      allow read: if request.auth != null && neEkipe();
      allow create: if request.auth != null && neEkipe()
        && request.resource.data.uid == request.auth.uid && request.resource.data.emri == emriIm()
        && request.resource.data.tekst is string
        && request.resource.data.tekst.size() > 0 && request.resource.data.tekst.size() <= 2000;
      allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || eshteAdmin());
    }
  }
}
```

Pas vendosjes: admin-i duhet ta hapë aplikacionin një herë (telefon ose PC) — migrimi i pranon vetë krejt
llogaritë ekzistuese. Deri atëherë anëtarët shohin "Në pritje të miratimit" te Ekipa (stoku/afatet punojnë).
Pa këto rregulla (me v109): aplikacioni punon si më parë; vetëm `ekipa_afatet` s'shkruhet (heshtje, riprovon pas
10 min).

## Kontakte/aksese që s'i kam

- Cloudflare Worker-i që lexon fotot me AI (`afatet-worker.js`) — **s'është në këtë repo**; përdoruesi e
  bën deploy vetë manualisht kur i jap kodin. Mos supozo qasje direkte në Cloudflare.
- Firebase console (rregullat, konfigurimi) — vetëm përdoruesi ka qasje; unë i jap tekstin e rregullave,
  ai i ngjit vetë.
- Pajisje reale (telefon/PDA/tablet) — asnjë provë s'është bërë në pajisje fizike, gjithçka është
  Playwright/mock. Thuaje këtë çdo herë kur raportosh se diçka "u testua" — sqaro se s'është provuar në
  pajisje reale.

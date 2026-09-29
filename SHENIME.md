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
   - **S'kam Firebase real as pajisje reale për testim.** Krejt testimi bëhet me Playwright + mock
     `window.__stokuCloud` (shih "Testimi" poshtë).

5. **Bashkimi i të dhënave (bashkimi.js):** LWW (last-write-wins) sipas kohës (`prekurSe`/`ndryshuarSe`);
   fshirjet ruhen si "tombstones" (kohë fshirjeje) 120 ditë, që një pajisje me kopje të vjetër të mos
   "ringjallë" diçka të fshirë; asgjë që thjesht mungon (pa u fshi qëllimisht) s'fshihet kurrë.

6. **Porta (porta.js):** ekran hyrjeje i detyrueshëm para faqes kryesore (telefon dhe PC). Lejon punë pa
   internet vetëm nëse kjo pajisje ka hyrë më parë. Kur hyn një llogari tjetër në të njëjtën pajisje, të
   dhënat lokale të llogarisë së mëparshme hiqen (janë të ruajtura në cloud-in e saj).

7. **Butoni "mbrapa" i Android-it / historia e shfletuesit** (index.html): çdo "shtresë" e hapur (folder,
   dialog, kamerë, tab) i shton një hyrje historisë; "mbrapa" mbyll vetëm shtresën e fundit, kurrë s'del
   nga app-i. Logjika: `niveletEHapura()`, `sinkronizoHistorineEDritareve()`, `ANULO_SIPAS_DIALOGUT`.
   Kur shtohet një dialog/tab i ri, duhet përfshirë në këtë logjikë (shiko si janë `dlgTeRejat`,
   `dlgNjoftimet` etj. në `ANULO_SIPAS_DIALOGUT`).

8. **Shiriti me tabe (telefon, që nga v90):** navigimi kryesor në telefon tani është 3 tabe poshtë ekranit
   (Stoku / Afatet / Cilësimet), jo butona në kokë. Shiriti fshihet automatikisht brenda një folderi, te
   kamera, te leximi i fletës, dhe kur një fushë ka fokusin (tastiera hapur). Shiko `#tabet` në CSS/JS
   të index.html nëse ndryshon navigimin.

9. **"Opsionet" quhet tani "Cilësimet"** (që nga v90) — mos e kthe mbrapsht pa u pyetur.

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
- Kompjuteri: dy taba lart (poshtë kërkimit globalit), `#tabStoku` / `#tabAfatet`, ndajnë faqen përgjysmë —
  zëvendësojnë linkun e vjetër "Afatet e produkteve" që ishte në fund të anësores. Anësorja (folderat)
  mbetet gjithmonë e dukshme, pavarësisht cilit tab je. `#tabStoku` kthehet te `fundiPamjesStoku` (pamja
  e fundit jo-Afatet, e mbajtur në `rivizato()`), jo gjithmonë te "Përmbledhja". Ikonat/numrat e fletëve
  në pritje dhe afateve të skaduara/afërta janë tani te `#afTabFleta`/`#afTabKuqe`/`#afTabVerdhe` (jo më
  `#afNav*`). (~v95)
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
  secila kolonë lart→poshtë) në vend të rresht-për-rresht përgjatë gjithë gjerësisë — **por kjo NUK
  është ende e dërguar (deployed) në Cloudflare**, sepse s'kam qasje ta bëj vetë; përdoruesi duhet ta
  ngjesë kodin e ri në Cloudflare Workers kur t'i vijë radha, ose të ma japë kodin aktual nëse ka
  ndryshuar që nga kopja ime lokale.

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
- Përdoruesi VETË i bën merge PR-të (jo unë — provat për merge janë refuzuar nga sistemi). Pas çdo
  ndryshimi: commit + push + hap PR, pastaj shpjegoj shqip çka ndryshoi dhe pse, thjesht, si për dikë
  jo-teknik.
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

## Kontakte/aksese që s'i kam

- Cloudflare Worker-i që lexon fotot me AI (`afatet-worker.js`) — **s'është në këtë repo**; përdoruesi e
  bën deploy vetë manualisht kur i jap kodin. Mos supozo qasje direkte në Cloudflare.
- Firebase console (rregullat, konfigurimi) — vetëm përdoruesi ka qasje; unë i jap tekstin e rregullave,
  ai i ngjit vetë.
- Pajisje reale (telefon/PDA/tablet) — asnjë provë s'është bërë në pajisje fizike, gjithçka është
  Playwright/mock. Thuaje këtë çdo herë kur raportosh se diçka "u testua" — sqaro se s'është provuar në
  pajisje reale.

# Stoku (stoku.site): udhëzimet për Claude

**Para çdo pune lexo `SHENIME.md`** (memoria e projektit): të paktën "Rregulla teknike THEMELORE", hyrjet e fundit
`0000000.` në krye, "Gjëra që përdoruesi i ka refuzuar/anuluar", "Rrjedha e punës (git/PR)" dhe "Konventat e testimit".
Përditësoje në të njëjtin PR me çdo ndryshim domethënës.

## Komunikimi
- Përgjigju gjithmonë **shqip** (Kosovë, joformal) dhe thjesht, si për dikë jo-teknik.
- Pa vizë të gjatë ("—") në asnjë tekst që e sheh përdoruesi (në aplikacion dhe në përgjigje).
- Mos e përdor fjalën "sahat": ora, orën, orës.
- Thuaj gjithmonë që ndryshimi s'është testuar në pajisje të vërteta (s'kemi telefon, PDA, orë as Firebase real).

## Projekti
- "Krejt projekti" = web (`index.html` telefoni/PDA, `pc.html` kompjuteri; kodi te `app-tel.js` / `app-pc.js`) +
  aplikacioni Android `tel/` (WebView) + aplikacioni native `vendas/` (Kotlin/Compose, pa WebView) + aplikacioni i orës
  `ora/` + Worker-i `worker/stoku-push.js`.
- `vendas/logjika` = bashkimi.js/ruajtja.js/afatet.js/lejet.js në Kotlin: kur ndryshon ndonjëri, `node teste/vendas-fikstura.js`
  dhe përshtat Kotlinin (testet e krahasojnë me web-in).
- stoku.site = GitHub Pages pas Cloudflare. Worker-in, rregullat e Firebase-it dhe Cloudflare-in i vendos **pronari**
  (unë s'kam qasje): jepja kodin ose hapat.

## Rregulla që s'thyhen
- Asnjë sekret në repo: çelësi privat VAPID, JSON-i i service account-it të FCM (vetëm te Cloudflare, `FCM_SA`),
  fjalëkalimi i APK-ve (sekreti `APK_FJALEKALIMI` në GitHub: mos e kërko, mos e ndrysho, mos e fshi).
  Mbeten në repo: `tel/stoku-tel.jks`, `ora/stoku-ora.jks`, `celesi-i-ri.p12.enc`, `celesi.lineage`.
- Mos e hiq kurrë administratorin `mendurberisha` as koleksionin `perdoruesit`.
- Mos i rikthe gjërat e refuzuara (lista e plotë te SHENIME), p.sh. chat-i, mesazhet e furnizuesve, "Jepja vetëm
  pasi ta njohësh personin", "Mos dil kur i fshin të dhënat", PDA v227, ngjyrat e çelëta te manifest-i.
- CSP: pa skripta inline dhe pa `onclick=` në HTML; kodi i ri te `app-tel.js` / `app-pc.js`. Shërbim i ri i jashtëm =
  CSP në meta të 5 faqeve + rreshti `CSP_CLOUDFLARE` te SHENIME + pronari e ndryshon rregullën "siguria" te Cloudflare.
- Ora e dorës: pa fusha teksti brenda aplikacionit (hyrja e sistemit, RemoteInput).
- Mos i ndrysho identifikuesit `stoku:ekipa:*`, grupin "ekipa", `anetaret`, `#/ekipa/anetaret`.
- Pa emra ose identifikues modelesh të AI-së në commit, PR, kod ose skedarë.

## Çdo ndryshim në web
1. `git fetch origin main && git checkout -B claude/qysh-funksionon-ilbmdw origin/main` (ose dega e bisedës).
2. Ndryshimi + test i ri te `teste/` (shtoje edhe te lista e `teste/regresioni.sh`).
3. Rrit `CACHE` te `sw.js` dhe `?v=` të çdo skedari të ndryshuar: `index.html`, `pc.html` dhe SHELL te `sw.js`.
4. Hyrje e re në krye të `LISTA` te `teRejat.js` ("Çka ka të re"; `platforma: 'tel'|'pc'`, `vetemAdmini` sipas nevojës).
5. Hyrje e re në krye të listës `0000000.` te `SHENIME.md`.
6. `node teste/gjej-vizat.js index.html pc.html app-tel.js app-pc.js fillimi-tel.js fillimi-pc.js firebase-tel.js
   firebase-pc.js teRejat.js porta.js afatet.js privatesia.html 404.html android.html` duhet të japë "gjithsej 0".
7. Regresioni i plotë: `bash teste/regresioni.sh > teste/regresioni-vNNN.txt` (rreth 30 min, në sfond); krahasoje me
   të fundit. Mos i ndrysho skedarët ndërsa punon.
8. Commit, push, PR (përshkrim shqip), merge me SHA-në e plotë, sinkronizo degën me main, prit deploy-in e Pages.

Ndryshimet vetëm në `tel/` ose `ora/` (Kotlin): pa version të web-it, vetëm shënim te SHENIME; APK-të i ndërton
GitHub Actions (në push të degës për kontroll, në main për publikim).

## Testet (`teste/`)
- Playwright + Firestore i rremë (`fs-server.js`); `teste/wp/` për Worker-in. Herën e parë në kontejner të ri:
  `(cd teste/npm && npm ci) && (cd teste/wp && npm ci)`.
- `teste/server-cloudflare.py` (porti 8765) i shton çdo përgjigjeje header-at si Cloudflare (CSP nga `CSP_CLOUDFLARE`).
- `teste/` s'publikohet në stoku.site (`_config.yml`). Dalja e testeve (pamjet, `r5-*.txt`) s'futet në git.

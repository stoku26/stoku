# Stoku për telefon (Android)

Aplikacion që e hap **stoku.site** brenda vetes, me hapësirë të vetën:
- **S'del nga llogaria** kur i fshin "Cookies, cache, and other site data" në Chrome (Chrome s'e prek këtë aplikacion).
- **Njoftimet** (chat-i, kërkesat, njoftimi ditor i afateve) vijnë menjëherë me Firebase Cloud Messaging,
  edhe kur aplikacioni është mbyllur.
- **Përditësimet:** pamja dhe veçoritë vijnë gjithmonë nga stoku.site (si te web-i, njëkohësisht në telefon,
  kompjuter dhe aplikacion). Kur del APK e re (ndryshon kjo dosje), aplikacioni e ofron vetë ("Përditëso").

## Ndërtimi
GitHub Actions (`.github/workflows/tel-apk.yml`) e ndërton në çdo ndryshim te `tel/`; në `main` del si Release
`tel-vNN` (NN = versionCode). Faqja e shkarkimit: https://stoku.site/android.html

## Instalimi
1. Në telefon hape https://stoku.site/android.html → **Shkarko aplikacionin** → hape skedarin.
2. Lejo "Instalo aplikacione të panjohura" për Chrome-in, pastaj **Instalo**.
3. Hape **Stoku**, hyr një herë, dhe lejo njoftimet.

## Njoftimet (një herë, nga administratori)
1. Firebase Console → Project settings → **Add app → Android**, paketa `site.stoku.app` → Register.
   "App ID" (`1:107114545225:android:…`) shkon te `android.json` në rrënjë të faqes (`appId`).
2. Firebase Console → Project settings → **Service accounts → Generate new private key**: përmbajtja e skedarit JSON
   vendoset te Cloudflare → Worker `stoku-push` → Settings → Variables and Secrets → sekret **`FCM_SA`**.
   (Mos e ngjit askund tjetër: ky çelës jep qasje të plotë në projektin Firebase.)

## Nënshkrimi (vula e aplikacionit)
Android-i e pranon një APK si përditësim vetëm kur ka të njëjtën vulë (çelës nënshkrimi) si aplikacioni i instaluar.
- `stoku-tel.jks` (fjalëkalimi te `app/build.gradle.kts`) është **çelësi i vjetër**: publik në repo, prandaj s'mbron më.
- **Vula e re** krijohet **një herë** nga workflow-i **"Çelësat e rinj të APK-ve (një herë)"** (Actions → Run workflow),
  pasi pronari e vendos sekretin **`APK_FJALEKALIMI`** (Settings → Secrets and variables → Actions, së paku 24 shenja).
  Në repo ruhet vetëm e enkriptuar (`celesi-i-ri.p12.enc`), bashkë me zinxhirin e ndërrimit (`celesi.lineage`).
- GitHub Actions e nënshkruan çdo APK me `.github/apk/nenshkruaj.sh`: v2 me çelësin e vjetër (Android 8), v3 me vulën e re
  + zinxhirin (Android 9+). Aplikacioni përditësohet pa u çinstaluar; pas përditësimit, Android 9+ s'pranon më APK të
  nënshkruara vetëm me çelësin e vjetër.
- **Sekreti `APK_FJALEKALIMI` s'duhet humbur dhe s'duhet ndërruar**: pa të, versionet e reja s'nënshkruhen dot me vulën e re
  (aplikacioni do të duhej të çinstalohej dhe të instalohej sërish në çdo pajisje).

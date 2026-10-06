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

# Çelësat e nënshkrimit të aplikacionit Stoku për Android

Aplikacioni i vjetër i telefonit (WebView, paketa `site.stoku.app`) **u fshi** më 27.10.2026. Aplikacioni i vetëm për
Android tash është **Stoku** te `vendas/` (Kotlin, pa WebView).

Në këtë dosje kanë mbetur vetëm çelësat me të cilët nënshkruhet aplikacioni `vendas/`. **Mos i fshi dhe mos i zhvendos**:
pa ta, telefonat s'e pranojnë më përditësimin e aplikacionit (duhet çinstaluar dhe instaluar sërish në çdo pajisje).

## Nënshkrimi (vula e aplikacionit)
Android-i e pranon një APK si përditësim vetëm kur ka të njëjtën vulë (çelës nënshkrimi) si aplikacioni i instaluar.
- `stoku-tel.jks` (fjalëkalimi te `vendas/app/build.gradle.kts`) është **çelësi i vjetër**: publik në repo, prandaj s'mbron më.
- **Vula e re** u krijua **një herë** nga workflow-i **"Çelësat e rinj të APK-ve (një herë)"** (`apk-celesat.yml`), pasi
  pronari e vendosi sekretin **`APK_FJALEKALIMI`** (Settings → Secrets and variables → Actions). Në repo ruhet vetëm e
  enkriptuar (`celesi-i-ri.p12.enc`), bashkë me zinxhirin e ndërrimit (`celesi.lineage`).
- GitHub Actions (`vendas-apk.yml`) e nënshkruan çdo APK me `.github/apk/nenshkruaj.sh tel …`: v2 me çelësin e vjetër
  (Android 8), v3 me vulën e re + zinxhirin (Android 9+).
- **Sekreti `APK_FJALEKALIMI` s'duhet humbur dhe s'duhet ndërruar**: pa të, versionet e reja s'nënshkruhen dot me vulën e re.

## Njoftimet push
Aplikacioni `vendas/` i merr me Firebase Cloud Messaging nga Worker-i `stoku-push`. Çelësi i service account-it të FCM
është vetëm te Cloudflare (sekreti **`FCM_SA`**), asnjëherë në repo.

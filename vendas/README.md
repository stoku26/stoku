# Stoku Native (Android, pa WebView)

Aplikacioni i Stoku-t për telefon Android, i shkruar krejt në Kotlin (Jetpack Compose), pa WebView. Të njëjtat të dhëna si
stoku.site dhe aplikacioni `tel/`: hyrja me të njëjtën llogari, dyqani (`dyqane/{uid}` + `pjeset`), lejet (`lejet/{uid}`),
regjistri i produkteve (`kujtesa/*`).

- **Pamja**: e njëjtë me web-in e telefonit (ngjyrat e `css/stoku-tokens.css`, shkronjat Onest dhe JetBrains Mono, ikonat e
  `index.html`), e çelët dhe e errët.
- **Kamera**: CameraX + ML Kit (njohja e barkodeve e Google-it, i njëjti motor si te Google Lens), punon pa internet.
- **Pa internet**: dyqani ruhet në telefon (`dyqani.json`); ndryshimet dërgohen vetë sa kthehet lidhja.
- **Përditësimet**: GitHub Actions (`.github/workflows/vendas-apk.yml`) e ndërton në çdo ndryshim te `vendas/`; në `main` del si
  Release `vendas-vNN`. Aplikacioni e kontrollon vetë (1 herë në 6 orë) dhe e ofron ("Version i ri i Stoku-t").
- **Paketa** `site.stoku.vendas` (e ndarë nga `site.stoku.app`, që të dy aplikacionet të mund të provohen njëkohësisht).
  Nënshkrimi: si `tel/` (`.github/apk/nenshkruaj.sh tel`).

## Moduli `logjika/`
Logjika pa Android, e përkthyer nga web-i: `bashkimi.js` → `Bashkimi.kt`, `ruajtja.js` (pjesët, hash-i) → `Ruajtja.kt`,
`afatet.js` (statuset, datat, tekstet) → `Afatet.kt`, `lejet.js` → `Lejet.kt`. Testet (`logjika/src/test`) e krahasojnë me
kodin e vërtetë të web-it në qindra raste (`src/test/resources/fikstura.json`, krijuar nga `node teste/vendas-fikstura.js`):
kur ndryshon logjika e web-it, rikrijo fiksturat dhe përshtate Kotlinin derisa testet të kalojnë.

## Çka ka (faza 1)
Hyrja / krijimi i llogarisë (me "Punoj si merchandiser"), Stoku (folderat, produktet, kërkimi, +/-, skanimi, zhvendosja,
fshirja, folder i ri), Afatet (lista me ngjyra, filtrat, muajt, afat i ri / ndryshimi, "U hoq nga rafti", zgjedhja e
shumëfishtë), Cilësimet (pamja, renditja, llogaria, versioni), sinkronizimi me Firebase dhe lejet e llogarisë.

## Çka mungon ende (fazat e ardhshme)
Grupi (kolegët), marketet e merchandiserëve (GPS, harta), fotografimi i fletës me AI, importet, Excel/PDF, njoftimet push,
ora e dorës, faqja e administratorit (Përdoruesit, Furnizuesit, Produktet), "Ke harruar fjalëkalimin?".

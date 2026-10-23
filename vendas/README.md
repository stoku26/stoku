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
`afatet.js` (statuset, datat, tekstet, rreshtat e AI-së) → `Afatet.kt`, `lejet.js` → `Lejet.kt`, `marketet.js` (pikat, kufiri
20 m, shtimi, sinkronizimi me pikat) → `Marketet.kt`, `ekipa.js` (prania, përmbledhja e afateve, heqjet në pritje, kalendari,
statistikat, tekstet e aktivitetit) → `GrupiLogjika.kt`. Testet (`logjika/src/test`) e krahasojnë me
kodin e vërtetë të web-it në qindra raste (`src/test/resources/fikstura.json`, krijuar nga `node teste/vendas-fikstura.js`):
kur ndryshon logjika e web-it, rikrijo fiksturat dhe përshtate Kotlinin derisa testet të kalojnë.

## Çka ka (faza 1)
Hyrja / krijimi i llogarisë (me "Punoj si merchandiser") dhe "Ke harruar fjalëkalimin?", Stoku (folderat, produktet,
kërkimi, +/-, skanimi, zhvendosja, fshirja, folder i ri, **importi i stokut nga foto** me AI), Afatet (lista me ngjyra, filtrat, muajt, afat i ri / ndryshimi,
"U hoq nga rafti", zgjedhja e shumëfishtë, **"Fotografo fletën"**: fotoja (kamera ose galeria) lexohet me AI nga Worker-i
`stoku-afatet`, rreshtat kontrollohen dhe ruhen si te web-i), Cilësimet (pamja, renditja, llogaria, versioni), sinkronizimi
me Firebase dhe lejet e llogarisë.

**Marketet e merchandiserit**: GPS kur hapet aplikacioni, "Ku je?" me marketet afër, "Je te: …", "Market i ri", afatet sipas
marketit, Cilësimet → Marketet (`Merchandiseri.kt`, `ui/MarketetUI.kt`).

**Grupi** (`Grupi.kt`, `ui/GrupiEkrani.kt`): Përmbledhja (numrat, online tani, çka duhet hequr, aktiviteti i fundit,
statistikat), Afatet e krejt grupit ose të një kolegu, Aktiviteti, Kalendari, Kolegët (ftesat, kërkesat për t'u futur,
emri i grupit, admini, njoftimi për krejt grupin, largimi), zilja me njoftimet (prano/refuzo heqjen e kolegut), "Kërko heqje
nga rafti", pa grup: ftesat, "Hyr në një grup" dhe "Krijo grupin tënd". Të dhënat janë të njëjtat që shkruan web-i.

**Leximi me AI**: aplikacioni dërgon foton te `https://stoku-afatet.mendurb.workers.dev` me tokenin e llogarisë dhe me
`Origin: https://stoku.site` (si web-i). Nëse Worker-i kthen "origjina", i duhet lejuar kjo kërkesë (pronari, te Cloudflare).

## Pamjet (pa telefon)
`app/src/test/.../PamjetTest.kt` (Robolectric + Roborazzi) i vizaton ekranet me të dhënat shembull të pamjeve të web-it.
GitHub Actions (job-i `pamjet`, vetëm jashtë `main`) i ruan PNG-të si blob-e të git-it dhe i shënon te "annotations".

## Çka mungon ende (fazat e ardhshme)
Harta e marketeve, importet nga Excel, Excel/PDF, "Dërgo në PC", njoftimet push, ora e dorës, faqja e administratorit
(Përdoruesit, Furnizuesit, Produktet) dhe veprimet e administratorit te Grupi.

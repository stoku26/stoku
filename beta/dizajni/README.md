# Handoff: Stoku, ridizajni (telefon + kompjuter)

## Përmbledhje

Ridizajn premium i Stoku, aplikacionit për stokun dhe afatet e skadimit, në dy versione:

- **Telefoni / PDA:** `stoku.site/` (PWA)
- **Kompjuteri:** `stoku.site/pc.html`

Dizajni ndryshon vetëm pamjen. Funksionet, të dhënat, llogaritë, sinkronizimi, skanimi, Excel/PDF dhe njoftimet mbeten siç janë.

Implementimi bëhet si **faqe paralele** (`/beta/`). Aplikacioni kryesor nuk preket derisa beta të testohet plotësisht.

**Radha:** 1) telefoni në `/beta/`, 2) kompjuteri në `/beta/pc.html`.

## Për skedarët e dizajnit

Skedarët në `design/` janë **referenca dizajni në HTML**, jo kod për produksion. Ato tregojnë pamjen dhe sjelljen e synuar. Detyra është këtë dizajn ta rikrijosh **në kodin ekzistues të Stoku**, me strukturën, JS-in dhe të dhënat që ka tashmë.

- `design/*.dc.html` hapen direkt në shfletues. `support.js` duhet të jetë në të njëjtin folder.
- Vlerat e sakta (ngjyra, madhësi, hapësira) janë si `style="…"` inline në këto skedarë. Kur ka dyshim, ato vlejnë.
- Të dhënat në dizajn (produkte, emra, numra) janë shembuj.
- `telefoni/stoku-beta.css` dhe `telefoni/shembull.html` janë të gatshme për përdorim: stili i telefonit si klasa `sb-`, dhe markup-i shembull për çdo ekran.

## Fidelity

**Hi-fi.** Ngjyrat, tipografia, hapësirat, rrezet dhe tekstet janë përfundimtare. Rikrijoji me saktësi.

## Skedarët

```
design_handoff_stoku_redesign/
├── README.md
├── design/
│   ├── Stoku Premium.dc.html   ← telefoni: 4 ekrane (1a Stoku, 1b Afatet, 1c Ekipa, 1d Afat i ri)
│   ├── Stoku PC.dc.html        ← kompjuteri: sidebar + 4 pamje (Përmbledhja, Produktet, Afatet, Ekipa)
│   └── support.js              ← duhet vetëm për t'i hapur .dc.html në shfletues
└── telefoni/
    ├── stoku-beta.css          ← stili i telefonit, klasa me prefiks sb-, ngjyra hex
    └── shembull.html           ← markup statik i çdo ekrani me klasat sb-
```

---

## 1. Rregulla që të mos prishet asgjë

1. **Asnjë ndryshim jashtë `/beta/`** derisa të bëhet kalimi (seksioni 9).
2. **Ndryshohet vetëm pamja.** Mos e ndrysho asnjë `id`, `name`, `data-*`, `onclick` / event listener, funksion JS, thirrje API ose çelës të `localStorage` / `IndexedDB`.
3. **Klasat e reja u shtohen elementeve ekzistuese.** Klasat e vjetra hiqen vetëm nëse nuk i përdor JS-i (kontrollo me kërkim në kod para se ta heqësh).
4. **Asnjë element që e përdor JS nuk fshihet.** Nëse nuk duhet vizualisht, fshihet me `hidden` ose CSS dhe mbetet në DOM.
5. **`hidden` fsheh gjithmonë.** `stoku-beta.css` ka `.sb-app [hidden]{display:none !important}`. Nëse JS-i ekzistues fsheh ekranet ose modalët me klasë (p.sh. `.hide`, `.active`), sigurohu që ajo ka përparësi mbi klasat `sb-`.
6. **Të dhënat janë të përbashkëta.** Beta dhe root-i janë në të njëjtin domen, prandaj e ndajnë `localStorage` dhe `IndexedDB`. Beta nuk bën migrime dhe nuk e ndryshon formatin e të dhënave.
7. **Ngjyrat në hex, jo `oklch()`.** Shfletuesit e vjetër të PDA-ve nuk e njohin `oklch`.

## 2. Ngritja e `/beta/`

1. Kopjo skedarët e aplikacionit (`index.html`, `pc.html`, JS, CSS, ikonat, `manifest`, `sw.js`) në `/beta/`.
2. **Shtigjet:** kontrollo çdo `fetch(...)`, `src` dhe `href`. Shtigjet relative pa `/` në fillim për API (p.sh. `api/sync`) nga `/beta/` bëhen `/beta/api/sync` dhe dështojnë. Për API ose backend përdor shtigje absolute (`/api/…`) ose URL të plotë. Skedarët statikë brenda `/beta/` mund të mbeten relativë.
3. **Service worker i veçantë:** `/beta/sw.js`, i regjistruar me `navigator.serviceWorker.register('/beta/sw.js', { scope: '/beta/' })`. Cache-i ka emrin `stoku-beta-v1`. Në `activate` fshihen vetëm cache-t `stoku-beta-*`, **kurrë ato të root-it**.
4. **Manifest i veçantë** `/beta/manifest.json`: `"name": "Stoku Beta"`, `"short_name": "Stoku β"`, `"start_url": "/beta/"`, `"scope": "/beta/"`.
5. **Fontet:** Onest (400, 500, 600, 700, 800) dhe JetBrains Mono (400, 500). Për punë pa internet shkarkoji si `.woff2` në `/beta/fonts/`, deklaroji me `@font-face` dhe shtoji në cache-in e SW-së. Përndryshe:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
   ```
6. **Njoftimet:** beta ka SW-në e vet, pra edhe abonim tjetër. Testoji vetëm me llogari ose ekipë testi.
7. **Testimi:** backend-i është i njëjtë, prandaj fshirjet dhe heqjet në beta prekin të dhënat reale. Përdor llogari ose ekipë testi.

---

## 3. Tokenat e dizajnit

### Ngjyrat (tema e çelët, e dizajnuar)

| Token | Hex | Përdorimi |
|---|---|---|
| `--sb-bg` | `#f6f5f2` | sfondi i faqes |
| `--sb-surface` | `#ffffff` | kartat, tabelat, fushat |
| `--sb-surface-2` | `#f1efeb` | butonat sekondarë, kbd, stepper − |
| `--sb-sunken` | `#ebe9e4` | sfondi i skedave (segmented) |
| sidebar (PC) | `#efede9` | sfondi i sidebar-it; kufiri `#e3e1db` |
| koka e tabelës (PC) | `#faf9f7` | koka e tabelave dhe rreshtat e grupeve |
| `--sb-ink` | `#14161b` | teksti kryesor, karta e errët, chip aktiv |
| `--sb-ink-2` | `#3a3d44` | teksti i chip-eve joaktive |
| `--sb-ink-3` | `#5b5e66` | etiketat e fushave |
| `--sb-muted` | `#7a7d85` | teksti sekondar |
| `--sb-faint` | `#8a8d94` | barkodet, placeholder, tab joaktiv |
| `--sb-line` | `#e6e4df` | kufiri i kartave (si `box-shadow: 0 0 0 1px`) |
| `--sb-line-2` | `#efede9` | ndarësit mes rreshtave |
| `--sb-accent` | `#1f5fc4` | ngjyra kryesore; e shtypur `#16479a`; e zbehtë `#eef3fc` |
| `--sb-dark-2` | `#1c1f25` | qelizat brenda kartës së errët |
| `--sb-dark-muted` | `#a3a6ae` | teksti sekondar mbi të errët |

### Statuset

| Statusi | Teksti | Sfondi | Mbi të errët |
|---|---|---|---|
| Të skaduara / Sasi 0 | `#c23a33` | `#fdecea` | `#f07a6f` |
| Afër skadimit / Sasi e ulët | `#a45f10` | `#fcefd9` | `#f0b95a` |
| Në rregull / Online | `#2e7d4f` | `#e6f5ea` | `#4fbf7f` |
| Të hequra | `#6b6e76` | `#f1efeb` | |

### Ngjyrat e folderave

Katrori ose pika e folderit, e zbehtë / e plotë:

| Folderi | E zbehtë | E plotë |
|---|---|---|
| Bulmet | `#d9e4f7` | `#5b86c9` |
| Pije | `#d5eedc` | `#4f9a6e` |
| Ëmbëlsira | `#f6e3c4` | `#c08a3e` |
| Pastë | `#f6d9d6` | `#c46a5f` |
| Pastrim | `#e6dcf3` | `#8a6cc0` |
| Mish | `#f3d8e0` | `#b85f7c` |
| Fruta & perime | `#dcebc9` | `#6f9a45` |
| Bukë | `#f3dfcb` | `#b27a45` |

Folderat e rinj marrin ngjyrat me radhë.

### Tema e errët (PC ka cilësimin "Tema")

E propozuar, e padizajnuar vizualisht. Mbaje funksionin ekzistues dhe ndërro vetëm variablat:

| Token | Hex |
|---|---|
| `--sb-bg` | `#0f1115` |
| `--sb-surface` | `#171a20` |
| `--sb-surface-2` | `#1e2229` |
| `--sb-sunken` | `#1a1d23` |
| `--sb-line` | `#2a2e36` |
| `--sb-line-2` | `#23272e` |
| `--sb-ink` | `#eceef2` |
| `--sb-ink-2` | `#c9ccd3` |
| `--sb-muted` | `#9aa0aa` |
| `--sb-faint` | `#7d828c` |
| `--sb-accent` | `#4d8ae8` |

Për statuset, teksti merr kolonën "Mbi të errët"; sfondet bëhen `#3a1f1e` / `#3a2c16` / `#18321f`. Karta e errët e përmbledhjes merr `#0a0c0f`.

**"Ngjyra kryesore"** (cilësim ekzistues) vendos `--sb-accent`. Varianti i shtypur del duke e errësuar rreth 15%.

### Tipografia

Onest për gjithë UI-n, JetBrains Mono për barkodet, shkurtoret (Ctrl K), etiketat XLS/PDF dhe titujt e grupeve të sidebar-it.

| Roli | Madhësia / pesha | Shënim |
|---|---|---|
| Titulli i faqes, PC | 34 / 700 | letter-spacing −0.03em, line-height 1 |
| Titulli i faqes, telefon | 26 / 700 | −0.025em |
| Numri i madh (KPI) | 36–40 / 700 | −0.03em |
| Titulli i seksionit / kartës | 16–17 / 700 | |
| Teksti bazë | 14 / 500–600 | tabelat, lista |
| Teksti sekondar | 12–13 / 400–500 | |
| Koka e tabelës | 12 / 600 | `#7a7d85` |
| Grupi i sidebar-it | 10.5 mono | uppercase, letter-spacing .1em |

### Rrezet, hapësirat, hijet

- **Rrezet:** 5–6 (checkbox, kbd), 9–10 (butona, fusha, elementet e sidebar-it), 12–14, 16–18 (kartat, tabelat), 20–22 (kartat e mëdha), 32 (bottom sheet), 50% (avatarët).
- **Kufijtë:** kartat përdorin `box-shadow: 0 0 0 1px #e6e4df` (jo `border`), ndarësit `1px solid #efede9`.
- **Hija e butonit kryesor:** telefon `0 14px 30px -12px rgba(31,95,196,.8)`, PC `0 8px 18px -10px rgba(31,95,196,.9)`.
- **Skeda aktive:** `0 1px 3px rgba(0,0,0,.08)`.
- **Hapësirat:** telefon me padding anësor 20 dhe hapësirë 14–18 mes seksioneve. PC me main padding `28px 40px 64px`, `max-width:1440px`, hapësirë 24 mes blloqeve dhe 14–16 mes kartave.
- **Prekja (telefon):** çdo element i klikueshëm të paktën 44×44. Fushat me font 16px, që iOS të mos bëjë zoom.

---

## 4. Telefoni: ekranet

Referenca: `design/Stoku Premium.dc.html`. Stili i gatshëm është në `telefoni/stoku-beta.css`, markup-i shembull në `telefoni/shembull.html`.

Struktura: `.sb-app` → `.sb-main` (ekrani) → menyja poshtë `.sb-tabbar` (fixed, `safe-area-inset-bottom`).

### 1a · Stoku

- **Header:** logo 36×36 r11 (`logo.png` brenda `.sb-logo`). Mbi titullin, "Market Qendra · Prishtinë" (12, muted), pastaj titulli "Stoku" (22/700). Djathtas: zilja e njoftimeve (44, e bardhë, me pikë të kuqe kur ka të palexuara) dhe "+" Produkt i ri (44, blu).
- **Kërkimi:** 48px, r14, placeholder "Kërko produkt ose barkod", etiketa "SKANO" djathtas.
- **Karta e errët:** "Produkte gjithsej" + numri (40/700) + pill "+N sot". Poshtë, grid 3 kolona: Folderat / Sasi e ulët (`#f0b95a`) / Sasi 0 (`#f07a6f`). Çdo qelizë hap listën e filtruar.
- **Folderat:** rresht horizontal, karta 118px, katror ngjyre 28, emri, "N produkte". Djathtas titullit: "+ Folder i ri".
- **Ndryshuar së fundi:** kartë-listë. Rreshti: emri (14/600), barkodi (11 mono), sasia djathtas (0 e kuqe, nën kufi portokalli).

### 1b · Afatet

- Titulli "Afatet" + muaji djathtas.
- **Veprimet:** grid `1.4fr 1fr`. Majtas "Fotografo fletën" (blu, 132px e lartë, nëntitulli "Afatet lexohen nga foto automatikisht"). Djathtas "Shto" dhe "Excel" njëri mbi tjetrin. "Excel" hap një menu me **Importo Excel** dhe **Eksporto Excel**, me funksionet ekzistuese.
- **Filtrat:** chips 36px, horizontal: Të gjitha · Të skaduara · Afër skadimit · Në rregull · Të hequra, secili me numër. Aktivi është i zi.
- **Karta e afatit:** majtas kutia 52×52 r14 me ditët (`Sot`, `N ditë`, `N ditë më parë`, `N muaj`, `✓ hequr`), me ngjyrën e statusit. Djathtas emri (15/600), "Furnizuesi · N copë · data", dhe rreshti i veprimit (12/600, ngjyra e statusit):

  | Statusi | Teksti i veprimit |
  |---|---|
  | Skaduar | "Hiqe nga rafti tani" |
  | Skadon sot | "Hiqe nga rafti sot" |
  | ≤ 30 ditë | "Vendose përpara në raft" |
  | > 30 ditë | "Në rregull" |
  | Hequr | "Hequr nga rafti · Emri" |

- Menyja poshtë: badge i kuq te "Afatet" me numrin e të skaduarave.

### 1c · Ekipa

- Titulli "Ekipa", poshtë tij "Market Qendra · N anëtarë". Djathtas 3 avatarë të mbivendosur (32, -8px).
- **Skedat (segmented):** sfond `#ebe9e4`, aktivja e bardhë. **Mbaji të 5 skedat ekzistuese:** Afatet, Aktiviteti, Kalendari, Anëtarët, Statistika. Kur nuk nxënë, lëvizin horizontalisht.
- **Duhet vepruar:** kartë me 3 pllaka: Të skaduara / Afër skadimit / Në rregull. Djathtas titullit: "Krejt afatet →".
- **Anëtarët:** avatari 38, emri, "Roli · N në raft", 2 tag-e (të skaduara e kuqe, afër skadimit portokalli).
- **Aktiviteti:** timeline me pikë 10px me ngjyrën e veprimit. Rreshti: "**Emri** çfarë bëri", koha (12, faint).

### 1d · Afat i ri (bottom sheet)

- Sheet r32 lart, me dorezën 40×5.
- Header: "Afat i ri" (22/700) + "Anulo".
- **Karta e skanimit** (e errët): statusi "Skano barkodin me skanerin e PDA-së." me pikë jeshile, barkodi (15 mono), emri (16/600), furnizuesi.
- **Data e skadimit:** 4 butona të shpejtë (grid 4). Aktivi është blu. **Mbaje `<input type="date">` ekzistues**; butonat vetëm ia vendosin vlerën. Poshtë, një tekst ndihmës me ditët deri në skadim.
- **Sasia:** stepper, − (`#f1efeb`), vlera 24/700, + (blu), secili 44×44 r12.
- **"Ruaj"** 56px, blu, gjerësi e plotë. "Fshij" mbetet në modalitetin e ndryshimit (`.sb-btn--danger`).

### Dialogët e tjerë

Këta nuk u ridizajnuan veçmas. Përdor `.sb-sheet` + `.sb-btn` + `.sb-input` + `.sb-field-label`:

- Produkt i ri
- Kontrollo listën / fletën
- "Ku do ta kontrollosh fletën?"
- "Çka të përfshihet në Excel?"
- Importo afate nga Excel
- Njoftimet për afatet
- Çka ka të re
- Njoftimet

### Tabela: elementet ekzistuese → klasat e reja

| Ekzistuese | E re |
|---|---|
| Header STOKU + logo | `.sb-header .sb-brand .sb-logo .sb-title`, butoni + `.sb-iconbtn--accent` |
| Fusha e kërkimit / skanimit | `.sb-search`. **Logjika e fokusit nuk ndryshon**: skaneri i PDA-së shkruan si tastierë. |
| Lista e produkteve | `.sb-list > .sb-row` |
| Filtrat e afateve | `.sb-chip[aria-pressed]` ose `.is-active` |
| Rreshti i afatit | `.sb-exp-card` + `.sb-days--exp/near/ok/rem` |
| Skedat e ekipës | `.sb-segmented > button[aria-selected]` |
| Menyja poshtë | `.sb-tabbar > .sb-tab[aria-current="page"]` + `.sb-tab__badge` |
| Modalët | `.sb-sheet-backdrop > .sb-sheet` |
| "Hap versionin për kompjuter ›" | `.sb-link`, mbetet |

---

## 5. Kompjuteri: pamjet

Referenca: `design/Stoku PC.dc.html`. Në `/beta/pc.html` stili shkon në `stoku-beta-pc.css`, me klasa `sbp-` dhe të njëjtat tokena si më lart.

### Struktura

Grid me 2 kolona `264px minmax(0,1fr)`, `min-height:100vh`.

**Sidebar-i** (`#efede9`, kufi djathtas `#e3e1db`, `position:sticky; top:0; height:100vh; overflow:auto`, padding `20px 14px`, hapësirë 22):

1. **Logo + "Stoku" + emri i dyqanit.** Klikimi hap Përmbledhjen.
2. **Kërkimi global** (38px, r10, i bardhë): "Kërko kudo" + kbd "Ctrl K". Lidhet me shkurtoren ekzistuese.
3. **Grupet**, secili me titull mono uppercase:
   - **Stoku:** Përmbledhja · Të gjitha produktet (numri) · Folderat (numri, "+" për folder të ri; folderat ekzistues si nën-elementë)
   - **Afatet:** Afatet e produkteve (aktive) · Të skaduara (pikë e kuqe) · Afër skadimit (pikë portokalli)
   - **Ekipa:** Përmbledhja · Afatet e ekipës · Chat (numri i të palexuarave) · Aktiviteti · Kalendari · Anëtarët · Statistika

   **Elementi i menysë:** 34px, r9, 14px, teksti `#4a4d55`. Aktivi është i bardhë, 600, me `box-shadow: 0 0 0 1px #e3e1db, 0 1px 2px rgba(0,0,0,.04)`. Majtas pikë 7px (opsionale), djathtas numri (11 mono).
4. **Poshtë** (`margin-top:auto`): "Importo nga Excel / CSV", "Shkurtoret e tastierës", dhe karta e llogarisë (avatar 32, emri, "● Sinkronizuar tani"). Pa llogari, karta tregon "Vetëm në këtë kompjuter" + butonin **Hyr**.

**Koka e çdo pamjeje:** majtas etiketa e vogël (13, muted) mbi titull (34/700). Djathtas butonat, 38px e lartë, r10:

- **Kryesor:** blu, i bardhë, 600, hija blu.
- **Sekondar:** i bardhë, me unazë `#e6e4df`.
- **I errët:** `#14161b`, p.sh. "Eksporto krejt stokun".

### Përmbledhja

- Djathtas kokës: pill jeshil "Skanimet nga telefoni dalin këtu menjëherë" dhe "Eksporto krejt stokun".
- **Pa llogari:** kartë "Mirë se erdhe në Stoku për kompjuter" me formën e hyrjes, mbi KPI-të. Stili: kartë e bardhë r18 dhe fusha `.sb-input`.
- **KPI** (grid `repeat(auto-fit,minmax(210px,1fr))`, hapësirë 14, karta r18 me padding 20):
  1. **Produkte gjithsej:** kartë e errët me pill "+N sot".
  2. **Sasi e ulët:** numri portokalli, "5 copë ose më pak". Kufiri merret nga cilësimi.
  3. **Sasi 0:** numri i kuq, "duhen porositur".
  4. **Të skaduara në raft:** numri i kuq, "Shiko afatet →".

  Kartat 2–4 hapin listën e filtruar.
- **Tri karta** (grid `auto-fit,minmax(300px,1fr)`):
  - **Produktet sipas folderave:** emri + numri (mono), shirit 6px me ngjyrën e folderit. Gjerësia është proporcionale me folderin më të madh.
  - **Ndryshuar së fundi:** 6 rreshta, emri + koha + sasia. Djathtas titullit: "Shih të gjitha".
  - **Sasia më e ulët:** 6 rreshta, emri + folderi + sasia në pill me ngjyrën e statusit.

### Të gjitha produktet

- **Koka:** Excel (etiketa XLS jeshile), PDF (etiketa PDF e kuqe), **+ Shto produkt** (kryesor). Butonat ekzistues "B" / etiketat mbeten si sekondarë.
- **Shiriti i veglave:** kërkimi 38px (min 280px) "Kërko sipas emrit ose barkodit" + kbd "Ctrl F". Chips 34px r17: Të gjitha · Sasi 0 · Sasi e ulët · Pa emër · Në disa foldera, me numra; aktivi i zi.
- **Tabela:** kartë r16 me `overflow:hidden`, e brendshme `overflow-x:auto; min-width:860px`.
  - Kolonat: `48px 170px minmax(220px,1fr) 160px 90px 130px`, pra checkbox · Barkodi (mono 12.5) · Emri i produktit (600) · Folderi (katror 8px me ngjyrë + emri + "+N" kur është në disa foldera) · Sasia (djathtas, 700, ngjyra e statusit) · Ndryshuar (djathtas, 13 muted) · (veprimet ekzistuese të rreshtit).
  - **Koka:** 42px, `#faf9f7`, 12/600 muted. Klikimi te titujt rendit, si tani.
  - **Rreshti:** ndarës `#efede9`. I zgjedhuri ka sfond `#eef3fc` dhe checkbox 18px r5 blu me ✓. Pa emër shfaqet "Pa emër" me italik `#9a9da4`.
- **Shiriti i zgjedhjes** (kur ka rreshta të zgjedhur, i errët, mbi tabelë): "N të zgjedhura" · Zhvendos në folder… · Eksporto… · **Fshij** (i kuq) · djathtas "Hiq zgjedhjen". Fshirja përdor konfirmimin ekzistues.
- **Fundi:** "Duke shfaqur X nga Y" · "Rreshta për faqe" (50/100/250/500/Të gjitha, zgjedhja ekzistuese) · ‹ ›.
- **Dendësia e tabelës** (cilësim ekzistues), padding i rreshtit dhe madhësia e fontit:

  | Dendësia | Padding | Fonti |
  |---|---|---|
  | Kompakte | `7px 16px` | 13 |
  | Normale | `11px 16px` | 14 |
  | E gjerë | `16px 16px` | 15 |

  **Madhësia e shkronjave "E madhe"** shton +1px te të gjitha.

### Afatet e produkteve

- **Koka:** Importo · Excel · + Shto afat · **Lexo fletën nga foto** (kryesor).
- **Skedat:** segmented me sfond `#ebe9e4` dhe skedën aktive të bardhë: Aktive · Të skaduara · Afër skadimit · Në rregull · Të hequra, secila me pikë ngjyre dhe numër mono. Djathtas, çelësi **"Grupo sipas furnizuesit"** (36×22, blu kur është aktiv).
- **Tabela** (`min-width:920px`), kolonat `150px minmax(240px,1fr) 80px 130px minmax(220px,1fr) 150px`:
  - **Statusi:** pill r20 me pikë. Tekstet: "Skadoi N ditë", "Skadon sot", "N ditë", "N muaj", "Hequr".
  - **Produkti · Furnizuesi:** emri 600, poshtë "Furnizuesi · barkodi mono".
  - **Sasia**, **Skadon më** (mono, `dd.mm.yyyy`).
  - **Çfarë duhet bërë:**

    | Statusi | Teksti |
    |---|---|
    | Skaduar | "Hiqe nga rafti/pozita" (e kuqe, 600) |
    | ≤ 7 ditë | "Vendose përpara, ul çmimin" |
    | ≤ 30 ditë | "Vendose përpara në raft" |
    | Në rregull | "Asgjë për momentin" (faint) |
    | Hequr | "Hequr nga Emri · data" |

  - **Veprimi:** te të skaduarat, butoni i errët "Shëno të hequr". Ai thërret funksionin ekzistues të heqjes, dhe afati kalon te "Të hequra".
- **Grupimi:** kur është aktiv, çdo grup fillon me rresht `#faf9f7` (emri i furnizuesit uppercase + numri mono). Furnizuesit renditen A–Z, afatet brenda grupit sipas datës.
- Renditja e parazgjedhur: sipas datës, më e afërta së pari.

### Ekipa

- **Koka:** "Market Qendra · N anëtarë" dhe "Ekipa". Djathtas: "Njoftim për krejt ekipën" dhe "Shkarko Excel" (vetëm për administratorin).
- **Skedat me vijë poshtë:** Përmbledhja · Afatet · Aktiviteti · Chat · Kalendari · Anëtarët · Statistika. Aktivja ka vijë 2px `#14161b` dhe peshë 600. Kur nuk nxënë, kalojnë në rresht të ri (`flex-wrap`); **nuk ka `overflow` scroll**. "Njoftimet" mbetet si ikonë ose buton te koka.
- **Përmbajtja** (grid `auto-fit,minmax(340px,1fr)`):
  - **Majtas:**
    1. **"Kërkojnë të bashkohen me ekipën":** kartë blu e zbehtë `#eef3fc` me unazë `#d6e2f5`. Avatari, "Emri kërkon të bashkohet me ekipën", koha, butonat Refuzo dhe **Prano**. Kur ka disa kërkesa, shfaqet edhe "Prano krejt".
    2. **Duhet vepruar:** 3 pllaka dhe "Krejt afatet e ekipës →".
    3. **Tabela e anëtarëve** (`min-width:640px`), kolonat `minmax(190px,1fr) 110px 70px 90px 100px 100px`: Anëtari (avatar 32 + emri + roli) · Statusi (pikë jeshile Online / gri + "Para N orësh") · Në raft · Të skaduara (e kuqe) · Afër skadimit (portokalli) · Hequr (30 ditë).
  - **Djathtas, Chat:** kartë r18, 560px e lartë.
    - Koka: "Chat" + "● N online".
    - Mesazhet: të tjerëve majtas me sfond `#f1efeb` dhe "Emri · ora" sipër; të miat djathtas me sfond blu dhe tekst të bardhë. r14, padding `10px 13px`, maks. 82% gjerësi.
    - Fusha: 40px `#f6f5f2` + "Dërgo". Enter e dërgon.
- **Administratori:** Njoftim për krejt ekipën, Pastro krejt chat-in, Pastro krejt aktivitetin, Shkarko Excel. Si kartë në fund të Përmbledhjes, me butona sekondarë. "Pastro…" ka tekst të kuq dhe konfirmim.
- **Statistika** (skeda): "Sipas anëtarëve", "Furnizuesit me më shumë produkte që skadojnë", "Kush hoqi më shumë nga rafti (30 ditët e fundit)". Përdor kartat dhe shiritat 6px të "Produktet sipas folderave".

### Dialogët (PC)

- **Overlay:** `rgba(20,22,27,.45)`.
- **Dialogu:** i bardhë, r20, `max-width:560px` (Kontrollo fletën: 1100px), padding 24, hija `0 30px 80px -20px rgba(0,0,0,.35)`.
- **Koka:** titulli 20/700 + ✕ 36×36 r10.
- **Fundi:** butonat djathtas. Anulo është sekondar, veprimi kryesor blu, Fshij me tekst të kuq në të majtë.
- **Fushat:** 40px r10, unazë `#e6e4df`, në fokus unazë 2px blu. Etiketat 13/600 `#5b5e66`.
- **Radio "Po / Jo"** dhe zgjedhjet: segmented si te Afatet.
- **Eksporto:** 3 opsione si karta të zgjedhshme: Excel (.xlsx) / PDF • raport / PDF • etiketa. Opsioni aktiv ka unazë 2px blu.
- **Kontrollo fletën e lexuar:** majtas foto me zoom dhe Laps, djathtas tabela. **Rreshtat e paqartë kanë sfond `#fcefd9`.**
- **Cilësimet:** të gjitha opsionet ekzistuese mbeten: Tema, Ngjyra kryesore, Dendësia, Madhësia e shkronjave, Kufiri i sasisë së ulët, Renditja fillestare.

---

## 6. Ndërveprimet dhe gjendja

Të gjitha lidhen me logjikën ekzistuese. Dizajni shton vetëm gjendjet vizuale:

- **Navigimi:** elementi aktiv i menysë (sidebar / tabbar) sipas pamjes aktuale. "Të skaduara" dhe "Afër skadimit" në sidebar hapin "Afatet e produkteve" me skedën përkatëse.
- **KPI-të dhe "Shih të gjitha":** hapin listën e filtruar (Sasi e ulët, Sasi 0, Të skaduara).
- **Filtrat / skedat:** gjendja aktive me `aria-pressed` / `aria-selected`; numrat llogariten nga të dhënat.
- **Zgjedhja në tabelë:** klikimi në rresht ose checkbox; checkbox-i i kokës zgjedh të gjithë rreshtat e dukshëm. Shiriti i zgjedhjes shfaqet kur ka ≥ 1 të zgjedhur. Ndërrimi i filtrit e pastron zgjedhjen.
- **Grupo sipas furnizuesit:** çelës me gjendje. Mund të ruhet në `localStorage` me çelës të ri `stoku-beta:groupBySupplier`, pa prekur çelësat ekzistues.
- **Chat:** Enter ose "Dërgo" thërret funksionin ekzistues të dërgimit; fusha pastrohet pas dërgimit.
- **Tranzicionet:** `150ms ease` për sfondin dhe ngjyrën e butonave, chip-eve, skedave dhe rreshtave. Sheet-i (telefon) hyn nga poshtë me `transform: translateY(100%) → 0`, `240ms cubic-bezier(.2,.8,.2,1)`. Dialogët (PC) hyjnë me fade + scale `.98 → 1`, 160ms. Respekto `prefers-reduced-motion`.
- **Hover (PC):**

  | Elementi | Hover |
  |---|---|
  | Rreshti i tabelës | `#faf9f7` |
  | Elementi i sidebar-it | `rgba(255,255,255,.6)` |
  | Butoni kryesor | `#16479a` |

- **Gjendjet boshe:** "Asnjë produkt nuk përputhet me filtrin." / "Asnjë afat në këtë listë." (14, faint, qendër, padding 48).
- **Ngarkimi:** rreshta skeleton `#f1efeb`, r6, në lartësinë e rreshtit.

## 7. Asetet

- **Logo:** `https://stoku.site/logo.png` (ekzistuese). Në dizajn është zëvendësuar me katrorin blu "S".
- **Ikonat:** përdor ikonat ekzistuese të aplikacionit, ose një set të vetëm linjash 1.75px. Dizajni përdor forma të thjeshta si vendmbajtëse.
- Nuk ka imazhe të tjera.

## 8. Lista e testimit (për secilin version)

- [ ] Hyrja me llogari ekzistuese; të dhënat dalin njësoj si në root. Pa llogari (PC): "Vetëm në këtë kompjuter".
- [ ] Skanimi me PDA; skanimi nga telefoni del në PC pa rifreskim.
- [ ] Shto / ndrysho / fshij produkt dhe afat; sasia − / +; zhvendos në folder; folder i ri.
- [ ] Fotografo / lexo fletën nga foto; "Kontrollo fletën"; "Dërgo në PC" / "Vazhdo këtu në telefon".
- [ ] Importo / Eksporto Excel dhe CSV; PDF raport dhe etiketa.
- [ ] Filtrat, skedat dhe numrat; grupimi sipas furnizuesit; "Shëno të hequr".
- [ ] Ekipa: të gjitha skedat, kërkesat për bashkim, chat, njoftim për krejt ekipën, veprimet e administratorit.
- [ ] Cilësimet: tema e çelët / e errët / automatike, ngjyra kryesore, dendësia, madhësia e shkronjave, kufiri i sasisë, renditja.
- [ ] Shkurtoret e tastierës (Ctrl K, Ctrl F dhe të tjerat).
- [ ] Pa internet, pastaj sinkronizimi kur kthehet interneti.
- [ ] iPhone Safari, Android Chrome, PDA; Chrome, Edge, Firefox në kompjuter.
- [ ] **`stoku.site/` dhe `stoku.site/pc.html` punojnë njësoj si më parë.**

## 9. Kalimi dhe kthimi mbrapa

- **Kalimi:** ruaj kopjen e root-it (`index-v1.html`, `pc-v1.html`, CSS). Kopjo ndryshimet nga `/beta/` në root. **Rrite versionin e cache-it në `sw.js` të root-it** (p.sh. `stoku-v12` → `stoku-v13`), që telefonat ta marrin pamjen e re.
- **Kthimi mbrapa:** rikthe kopjen e vjetër dhe rrite përsëri versionin e cache-it.

## 10. Prompt për Claude Code

```
Në këtë repo është aplikacioni Stoku (telefoni: index.html, kompjuteri: pc.html).
Lexo design_handoff_stoku_redesign/README.md nga fillimi deri në fund, pastaj
telefoni/stoku-beta.css, telefoni/shembull.html dhe design/*.dc.html (vlerat inline).

Hapi 1: krijo /beta/ si kopje të aplikacionit dhe apliko dizajnin e telefonit (seksioni 4).
Hapi 2 (pasi ta konfirmoj hapin 1): apliko dizajnin e kompjuterit në /beta/pc.html (seksioni 5).

Rregulla: mos ndrysho asnjë skedar jashtë /beta/; mos ndrysho id, name, data-*, event
handlers, thirrjet e API-së ose çelësat e localStorage/IndexedDB; SW i beta me scope
/beta/ dhe cache "stoku-beta-v1"; ngjyrat në hex. Para se të ndryshosh diçka, më trego
planin dhe listën e skedarëve që do t'i prekësh.
```

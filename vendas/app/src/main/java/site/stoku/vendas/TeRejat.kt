package site.stoku.vendas

/**
 * "Çfarë ka të re" te aplikacioni Stoku për Android (si teRejat.js te web-i, por vetëm për aplikacionin).
 * Hyrja 80 u fshi, web v323 u rikthye (pronari): del te faqja e përditësimit (nga trupi i Release-it) dhe te Cilësimet afër
 * Privatësisë; s'del më vetë pas përditësimit.
 * Hyrja e re shtohet NË KRYE me `nr` më të madh se e para; përdoruesi i sheh një herë hyrjet që s'i ka parë.
 */
object TeRejat {
    class Hyrja(val nr: Int, val data: String, val titulli: String, val pikat: List<String>)

    val LISTA = listOf(
        Hyrja(93, "2026-11-18", "Grupi", listOf(
            "Te Grupi → Përmbledhja s'del më \"Online tani\" me rrathët e kolegëve: kush është online e sheh te Kolegët."
        )),
        Hyrja(92, "2026-11-18", "Përditësimi dhe ora", listOf(
            "Gjatë shkarkimit të versionit të ri, poshtë shiritit del prapë \"Çfarë ka të re\".",
            "Kur ora është e lidhur, te Cilësimet → Ora e dorës s'del më për një moment zgjedhja Galaxy Watch / Apple Watch as kutia e kodit.",
            "Fusha \"Kodi nga ora\" tani lexohet mirë (pa hapësira mes shkronjave).",
            "Excel-i i mallit: sasia tani fillon nga ana e majtë, si te afatet."
        )),
        Hyrja(91, "2026-11-18", "Malli te lejet", listOf(
            "Te lejet e kolegëve dhe te Grupi, pjesa e produkteve tani quhet \"Malli\" kudo (më parë \"Stoku\")."
        )),
        Hyrja(90, "2026-11-18", "Android 17", listOf(
            "Stoku tani është ndërtuar për Android 17 (më parë Android 14). Punon si më parë në telefonat me Android 8 e më të rinj.",
            "Në telefonat e rinj s'del më paralajmërimi \"This app was designed for an older version of Android\". Stoku s'ka nevojë për lejen \"Nearby devices\": mund ta ndalosh pa problem."
        )),
        Hyrja(89, "2026-11-18", "Kërko kudo", listOf(
            "Te Kreu ka fushën e re \"Kërko kudo\": shkruaj një barkod, produkt, afat, furnizues, koleg ose një faqe të Cilësimeve dhe e hap me një prekje.",
            "Te Malli lart ka vetëm titullin \"Malli\"; logoja është te Kreu."
        )),
        Hyrja(88, "2026-11-17", "Kreu dhe Malli", listOf(
            "Në mes të shiritit poshtë ka butonin e ri me shtëpinë: Kreu. Hapet i pari sa hyn në llogari ose e hap aplikacionin.",
            "Te Kreu sheh me një shikim afatet, çfarë skadon së pari, grafikun e muajve, mallin, furnizuesit, grupin, marketin dhe orën. Me butonin lart djathtas zgjedh çfarë del dhe me çfarë radhe.",
            "Tabi \"Stoku\" tani quhet \"Malli\".",
            "Kamera fokusohet vetëm brenda kutisë së bardhë, ku vendos barkodin.",
            "Dritaret \"Eksporto në Excel\" dhe \"Eksporto si foto\" tani janë si \"PDF për printim\": rreshta me ikonë që i prek për t'i ndryshuar."
        )),
        Hyrja(87, "2026-11-17", "Logoja", listOf(
            "Barkodi kthehet në logo vetëm një herë: te hyrja pas 1 sekonde, dhe lart pas çdo hyrjeje në llogari. Pastaj mbetet logoja, edhe kur e mbyll dhe e hap aplikacionin."
        )),
        Hyrja(86, "2026-11-17", "Hyrja dhe logoja e re", listOf(
            "Logoja e Stoku-t lart dhe te hyrja tani nis si barkod: një vijë e gjelbër skanimi e kalon dhe e kthen në \"stoku.\".",
            "Hyrja ka gjithmonë të njëjtat ngjyra (e zezë me vjollcë), cilado temë që ke zgjedhur, dhe teksti i ri: \"Malli dhe afatet, nën kontroll.\""
        )),
        Hyrja(85, "2026-11-17", "Excel më i thjeshtë", listOf(
            "Kur eksporton afatet në Excel, zgjedh vetëm muajin dhe furnizuesin. Excel-i ka gjithmonë të njëjtat kolona: Barkodi, Emri i produktit, Sasia, Furnizuesi dhe Skadon më.",
            "Numrat (sasia) dhe datat në Excel nisin nga ana e majtë, si teksti.",
            "\"Çfarë ka të re\" u kthye te Cilësimet, afër Privatësisë, dhe te faqja e përditësimit."
        )),
        Hyrja(84, "2026-11-17", "Logoja me valë", listOf(
            "Kur hapet Stoku, shkronjat e logos \"stoku.\" bëjnë një valë të shkurtër dhe ndalen në vendin e tyre. Edhe në orë."
        )),
        Hyrja(83, "2026-11-17", "Grupi dhe PDF-ja", listOf(
            "Grupi yt: rreshti është më i vogël dhe butoni për të ftuar një shok s'është më blu.",
            "\"Largohu nga grupi\" tani është te butoni me tri pika (Cilësimet e grupit), si buton i kuq.",
            "Te Cilësimet → Ora e dorës, kur ora është e lidhur, s'del më zgjedhja Galaxy Watch / Apple Watch.",
            "Lart te PDF-ja e afateve, në vend të \"Periudha\", del sa furnizues ka lista."
        )),
        Hyrja(82, "2026-11-17", "Grupi yt", listOf(
            "Te Kolegët, \"Grupi yt\" është një rresht i hollë: emri i grupit, lapsi i vogël për ta ndryshuar, butoni për të ftuar dhe butoni me tri pika për \"Cilësimet e grupit\".",
            "Kur e shkëput telefonin nga Cilësimet → Llogaria në një pajisje tjetër, aplikacioni del nga llogaria edhe nëse ishte i mbyllur atë kohë."
        )),
        Hyrja(81, "2026-11-17", "PDF, Grupi dhe pajisjet", listOf(
            "Te PDF-ja e afateve, \"Shtuar\" u zëvendësua me \"Ditët e skanimit\": zgjedh në kalendar ditët kur i ke shtuar afatet.",
            "Te Cilësimet → Llogaria shihen pajisjet ku je i kyçur, dhe secila mund të shkëputet nga larg.",
            "Grupi → Përmbledhja dhe Aktiviteti kanë shiritin me numra si te Afatet. Te Kolegët, shoku ftohet me butonin me plus te \"Grupi yt\"."
        )),
        Hyrja(79, "2026-11-16", "PDF e afateve", listOf(
            "Te \"Eksporto PDF\" rreshti \"Gjendja\" u zëvendësua me \"Shtuar\": zgjedh afatet sipas ditës kur i ke shtuar (Sot, Dje, 7, 14 ose 30 ditët e fundit), ose \"Zgjidh datat\" për një ditë a disa ditë sipas dëshirës.",
            "Poshtë faqeve të PDF-së s'del më asgjë, dhe tabela e faqes së parë shkon deri poshtë."
        )),
        Hyrja(78, "2026-11-16", "Ora e dorës", listOf(
            "Te Cilësimet → Ora e dorës, kur ora është e lidhur, tani del cila orë është, kur u lidh, kur ishte aktive dhe versioni. Ora shkëputet direkt nga telefoni me \"Shkëput orën\".",
            "Kur e ndryshon emrin e përdoruesit, ora e merr vetë emrin e ri, pa e lidhur prapë.",
            "Në orë: \"8 deri 30 ditë\" është tani një buton që hapet me prekje, dhe titulli \"Për t'u hequr\" u hoq. Kur s'ka asgjë për t'u hequr këtë javë, lart del me të gjelbër."
        )),
        Hyrja(77, "2026-11-16", "Heqja nga rafti dhe ngjyrat", listOf(
            "Kur i kërkon një kolegu ta heqë një produkt nga rafti dhe ai shtyp \"E hoqa nga rafti\", produkti te Afatet e tua tani shënohet vetë i hequr (me emrin e tij).",
            "Te Cilësimet → Pamja → Ngjyrat: \"Trëndafili\" u zëvendësua me \"Portokalli\" (edhe te temat e çelëta) dhe \"Mokë\" me \"Cyan\". Secila ngjyrë tani tregohet me \"stoku.\" dhe një buton me ngjyrën e saj."
        )),
        Hyrja(76, "2026-11-16", "Logoja me shkronja", listOf(
            "Logoja e Stoku-t tani është vetëm me shkronja: \"stoku.\" e madhe lart, pa kuti dhe pa emrin e përdoruesit poshtë saj.",
            "Ikona e aplikacionit në ekranin e telefonit ndërron sipas temës: e zezë me temën e errët, e bardhë me të çelëtën. Ndërrohet kur del nga aplikacioni; në disa telefona duhet ta vendosësh prapë në ekranin kryesor.",
            "Zgjedhja e 25 ngjyrave të logos te Cilësimet → Pamja u hoq."
        )),
        Hyrja(75, "2026-11-16", "Logoja e re dhe njoftimet", listOf(
            "Stoku ka logo të re: lista me shenjë. Te Cilësimet → Pamja → Logoja zgjedh njërën nga 25 ngjyrat e saj. Logoja e zgjedhur del kudo: lart në Stoku, në hyrje, te PDF-ja dhe fotoja e afateve.",
            "Logoja që zgjedh ruhet te llogaria: kur hyn prapë, ose në një pajisje tjetër (edhe te web-i), e gjen të njëjtën.",
            "Njoftimet janë të detyrueshme: edhe \"Njoftimi ditor\" s'fiket më. Kush i kishte fikur, Stoku e pyet sërish dhe s'vazhdon pa i aktivizuar.",
            "PDF-ja e afateve poshtë ka vetëm adresën https://stoku.site (pa \"Krijuar me Stoku\", datën me orën dhe numrin e faqes). Edhe fotoja s'ka më \"Krijuar me Stoku\"."
        )),
        Hyrja(74, "2026-11-15", "Grupi më i qartë", listOf(
            "Grupi → Përmbledhja: në vend të 6 kutive me numra, tani del një fjali e madhe që të thotë çfarë ka rëndësi (\"9 produkte skadojnë këtë javë\"). Numrat e tjerë poshtë janë të prekshëm.",
            "Grupi → Afatet: në vend të 4 kutive, një shirit me pjesë (Të gjitha, Skaduara, Afër, Rregull, Hequra). Prek një pjesë dhe lista filtrohet."
        )),
        Hyrja(73, "2026-11-15", "Ngjyrat e tua kudo", listOf(
            "Ngjyrat që i zgjedh te Cilësimet → Pamja ruhen te llogaria jote: kur hyn prapë, ose në një pajisje tjetër (edhe te web-i), i gjen të njëjtat.",
            "PDF-ja e afateve: poshtë shkruan adresën e plotë, https://stoku.site."
        )),
        Hyrja(72, "2026-11-15", "20 tema ngjyrash", listOf(
            "Te Cilësimet → Pamja ke \"Ngjyrat\": 10 tema për pamjen e errët dhe 10 për të çelëtën. Prek rreshtin që të hapet, zgjidh një temë dhe krejt aplikacioni ndërron ngjyrat menjëherë.",
            "Te \"E errët\" dalin vetëm temat e errëta, te \"E çelët\" vetëm të çelëtat. Me \"Automatike\" zgjedh një për ditën dhe një për natën.",
            "Zgjedhja ruhet vetëm në këtë telefon."
        )),
        Hyrja(71, "2026-11-15", "Emrat e përdoruesve mbeten të tutë", listOf(
            "Çdo emër përdoruesi që e ke pasur mbetet i yti: askush tjetër s'mund ta marrë, as kur ti e ndryshon emrin. Nëse do, mund të kthehesh te një emër i yti i vjetër.",
            "Kur dërgon një skedar te kompjuteri, aplikacioni të tregon ku del: lista e afateve te Afatet, malli te Stoku.",
            "PDF-ja e afateve: titulli në mes të faqes, logoja dhe data në të njëjtën vijë me të."
        )),
        Hyrja(70, "2026-11-15", "Emri i ri kudo", listOf(
            "Kur një koleg e ndryshon emrin e përdoruesit, emri i ri del kudo: te Aktiviteti (edhe te ngjarjet e vjetra), njoftimet, ftesat, afatet (\"Shtuar nga\", \"U hoq nga\"), produktet dhe marketet.",
            "Stoku e njeh personin nga llogaria e tij, jo nga emri: dikush tjetër që merr emrin e vjetër s'ngatërrohet me të."
        )),
        Hyrja(69, "2026-11-15", "Fotot te Aktiviteti", listOf(
            "Te Grupi → Aktiviteti, njoftimet dhe ftesat, fotoja e kolegut del edhe te ngjarjet e vjetra, edhe pasi ai ta ketë ndryshuar emrin e përdoruesit."
        )),
        Hyrja(68, "2026-11-15", "Rregullime të vogla", listOf(
            "Te \"Eksporto si foto\" butoni \"Anulo\" duket sërish (poshtë butonit \"Krijo foton\").",
            "Te Marketet, mesazhi \"Harta s'u hap\" zhduket vetë sapo harta hapet.",
            "Një afat i vjetër me barkod të ruajtur si numër s'e humb më barkodin kur e ndryshon."
        )),
        Hyrja(67, "2026-11-15", "Njoftimi ditor mbetet i fikur kur e fik", listOf(
            "Rregullim: nëse e fikje \"Njoftimi ditor\", ai ndizej vetë herën tjetër që hapje Stoku-n. Tani ndizet vetë vetëm herën e parë; pasi ta fikësh, mbetet i fikur."
        )),
        Hyrja(66, "2026-11-14", "Njoftimet: të detyrueshme dhe më të qarta", listOf(
            "Pas hyrjes me llogari, Stoku të kërkon t'i aktivizosh njoftimet dhe s'mund të vazhdosh pa to.",
            "Njoftimi \"skadon brenda 30 ditëve\" u hoq. Vijnë vetëm produktet që skadojnë sot dhe, çdo ditë, ato që kanë skaduar e duhen hequr nga rafti.",
            "Njoftimi ditor ndizet vetë (ora 08:00, mund ta ndryshosh te Cilësimet → Njoftimet)."
        )),
        Hyrja(65, "2026-11-14", "Njoftimet: arsyeja e saktë", listOf(
            "Te Cilësimet → Njoftimet, kur telefoni s'lidhet me njoftimet e grupit, tani del arsyeja e vërtetë (jo gjithmonë \"Kontrollo internetin\").",
            "Regjistrimi i telefonit për njoftimet pret më gjatë dhe, nëse Firebase vonohet, provohet sërish vetë herën tjetër."
        )),
        Hyrja(64, "2026-11-14", "Krejt njoftimet edhe me Stoku të mbyllur", listOf(
            "Çdo njoftim i grupit nga ky aplikacion (kërkesa për heqje nga rafti, \"U krye\", heqjet, pranimet, njoftimi për grupin, ndryshimet e administratorit) u vjen kolegëve si njoftim në telefon, si nga web-i.",
            "Edhe ftesa në grup dhe kërkesa për t'u futur në grup vijnë si njoftim, edhe kur Stoku është i mbyllur.",
            "Ftesa i dërgohet vetëm llogarisë së personit: nëse ai s'e ka hapur ende Stoku-n pas përditësimit, le ta hapë një herë dhe provo përsëri."
        )),
        Hyrja(63, "2026-11-14", "Llogaria njihet nga ID-ja e saj", listOf(
            "Secila llogari njihet nga ID-ja e saj e përhershme, jo nga emri i përdoruesit: emrin mund ta ndryshosh pa i humbur lejet dhe të dhënat.",
            "Ftesa në grup i shkon llogarisë së personit: edhe nëse ai e ndryshon emrin, ftesa mbetet e tij dhe s'mund ta marrë dikush tjetër me emrin e vjetër."
        )),
        Hyrja(62, "2026-11-14", "PDF e afateve: fundi i faqeve", listOf(
            "Faqja e parë s'ka më vijë të dyfishtë poshtë tabelës.",
            "Faqet e tjera s'kanë më \"Krijuar me Stoku\" poshtë: tabela vazhdon deri në fund të faqes, pa zbrazëti."
        )),
        Hyrja(61, "2026-11-13", "PDF e afateve më e pastër", listOf(
            "Te PDF-ja e afateve, logoja, titulli dhe të dhënat dalin vetëm në faqen e parë; faqet e tjera nisin direkt me tabelën.",
            "Kolona \"Copë\" është pak më majtas, larg datës së skadimit."
        )),
        Hyrja(60, "2026-11-13", "Leximi i fletës me AI: 10 në ditë", listOf(
            "Leximi i fletës me AI (\"Fotografo fletën\") lejohet deri në 10 fletë në ditë për çdo llogari.",
            "Kur e arrin kufirin, del një mesazh i qartë: provo nesër, ose shkruaji rreshtat me dorë."
        )),
        Hyrja(59, "2026-11-13", "Afat për një koleg", listOf(
            "Te \"Afat i ri\", butoni katror majtas \"Ruaj afatin\" e dërgon afatin te një koleg i grupit: zgjedh kolegun dhe prek \"Dërgo te ... për miratim\".",
            "Kolegu e sheh te zilja dhe e pranon (hyn te lista e tij) ose e refuzon. Kur e refuzon, ose s'e pranon brenda 10 ditëve, afati kthehet te lista jote dhe të vjen njoftim.",
            "Te \"Sasia\" numri 0 s'del më përzier me kursorin; furnizuesit e sugjeruar dalin mbi fushë, që të zgjidhen lehtë."
        )),
        Hyrja(58, "2026-11-13", "Butoni \"Krijo PDF-në\"", listOf(
            "Te Afatet → Eksporto → PDF për printim duket tani butoni \"Krijo PDF-në\" (me \"Anulo\" pranë), si te web-i."
        )),
        Hyrja(57, "2026-11-12", "Afatet e produktit kur e skanon", listOf(
            "Te \"Afat i ri\", sapo skanon ose shkruan barkodin, del lista e afateve që ka ai produkt (data, copët, sa ditë kanë mbetur).",
            "Prek një afat nga lista dhe merr datën e tij.",
            "Kur ruan të njëjtin produkt me të njëjtën datë, copët i shtohen atij afati dhe s'krijohet rresht i ri."
        )),
        Hyrja(56, "2026-11-12", "Zëri i skanimit si më parë", listOf(
            "Zgjedhja e zërit te Cilësimet → Skanimi u hoq: skanimi bën prapë bip-in e zakonshëm."
        )),
        Hyrja(55, "2026-11-12", "Rregullime të vogla", listOf(
            "Kodi i vendndodhjes dhe i kamerës përdor versionet e reja të Android-it (pa ndryshim në pamje)."
        )),
        Hyrja(54, "2026-11-11", "10 zëra për skanimin", listOf(
            "Te Cilësimet → Skanimi zgjidh njërin nga 10 zërat që bie kur skanohet një barkod. Prek një zë për ta dëgjuar."
        )),
        Hyrja(53, "2026-11-11", "\"Shto\" me skanim, kutia lart", listOf(
            "Te Afatet, \"Shto\" hap direkt kamerën: skano barkodin dhe pastaj del \"Afat i ri\" për datën dhe të dhënat e tjera.",
            "Kutia ku vendoset barkodi te kamera është tani lart, nën butonat, jo në mes.",
            "\"Kërko heqje nga rafti\" tregon vetëm produktet e skaduara.",
            "Rreshtat me butona që rrëshqasin anash (p.sh. filtrat te Afatet) zbehen në skaje, si te web-i."
        )),
        Hyrja(52, "2026-11-11", "Ora e saktë e heqjes edhe pa internet në orë", listOf(
            "Kur hiqni një produkt nga rafti në orën e dorës pa internet, te Aktiviteti del ora kur e shtypët, jo ora kur ora e dorës u lidh sërish."
        )),
        Hyrja(51, "2026-11-11", "Ora e saktë e heqjes te Aktiviteti", listOf(
            "Kur një produkt hiqet nga rafti në orën e dorës, te Grupi → Aktiviteti del ora kur u hoq vërtet, jo ora kur telefoni e mori heqjen."
        )),
        Hyrja(50, "2026-11-10", "Dritaret si më parë", listOf(
            "Dritaret që dalin mbi faqe janë prapë me ngjyrë të plotë, si më parë. Pamja \"si xham\" u hoq."
        )),
        Hyrja(47, "2026-11-10", "Më i shpejtë me shumë të dhëna", listOf(
            "Listat e afateve renditen dhe hapen më shpejt kur ke qindra ose mijëra afate.",
            "Sinkronizimi i një dyqani të madh nuk e ngrin më ekranin: llogaritjet e rënda bëhen në sfond.",
            "Kërkimi i grupeve dhe i marketeve, si dhe importi nga Excel, janë më të lehtë për telefonin."
        )),
        Hyrja(46, "2026-11-10", "Më i qëndrueshëm", listOf(
            "Kur sinkronizimi i parë pas hyrjes nuk arrin te serveri, aplikacioni e provon vetë përsëri pas pak, pa pasur nevojë ta mbyllësh e ta hapësh.",
            "Te Grupi, listat e afateve janë më të sigurta kur të dhënat e një kolegu vijnë të paplota."
        )),
        Hyrja(45, "2026-11-10", "Shiko çfarë u shtua te Aktiviteti", listOf(
            "Te Grupi, prek cilindo rresht te Aktiviteti (p.sh. \"shtoi 1 afat të ri\") dhe hapet saktësisht ai afat ose produkt: emri, barkodi, sasia, data dhe gjendja.",
            "Dritarja është vetëm për shikim: aty nuk ndryshohet asgjë. E sheh çdo anëtar i grupit, edhe kur afati fshihet më vonë."
        )),
        Hyrja(44, "2026-11-09", "Aktiviteti hap afatin", listOf(
            "Te Grupi, kur prek një rresht te \"Aktiviteti i fundit\" (p.sh. \"shtoi 2 afate\" ose \"hoqi Kos\"), hapen direkt ato afate.",
            "Nëse është afati yt, hapet vetë afati; përndryshe hapen afatet e atij anëtari vetëm me ato afate. Me ✕ i sheh të gjitha."
        )),
        Hyrja(43, "2026-11-09", "Ora e Kosovës kudo", listOf(
            "Oraret në Stoku (aktiviteti, njoftimet, \"sot\", skedarët) janë tani gjithmonë sipas orës së Kosovës, në format 24-orësh, pavarësisht si është vendosur ora në telefon.",
            "Ndërrimi i orës verore dhe dimërore bëhet vetë. Njësoj edhe në orën e dorës."
        )),
        Hyrja(42, "2026-11-08", "Tekstet në shqipe standarde", listOf(
            "Tekstet e aplikacionit u rregulluan sipas shqipes standarde, p.sh. \"të gjitha afatet\", \"tani\", \"Çfarë ka të re\".",
            "Edhe ora i ka tekstet e rregulluara."
        )),
        Hyrja(41, "2026-11-08", "Menyja e Eksportit dhe importi", listOf(
            "Menyja e \"Eksporto\" është tani aq e gjerë sa teksti.",
            "Te importi nga Excel, teksti është më i shkurtër dhe më i qartë."
        )),
        Hyrja(40, "2026-11-07", "Eksporto si foto më e qartë", listOf(
            "Te \"Eksporto si foto\", furnizuesit me afate të skaduara dalin lart, të tjerët poshtë.",
            "Mund ta kërkosh furnizuesin, \"Të gjithë\" është pranë titullit dhe butoni \"Krijo\" mbetet gjithmonë poshtë.",
            "Te importi nga Excel, fleta e jep muajin vetëm kur quhet saktë si muaji (p.sh. \"Nëntor\", \"Dhjetor\"), jo \"Nëntor2\".",
            "Menyja e \"Eksporto\" ka tani ikonat për Excel, PDF dhe foto."
        )),
        Hyrja(39, "2026-11-07", "Butonat e Afateve më të qartë", listOf(
            "\"Shto\" është tani njësoj si \"Importo\" dhe \"Eksporto\", pa vijën e kaltër.",
            "Menyja e \"Eksporto\" dallohet më mirë në temën e errët."
        )),
        Hyrja(38, "2026-11-07", "Importo dhe Eksporto te Afatet", listOf(
            "Te Afatet, \"Shto\" ka tani kornizë blu dhe ikonën e barkodit.",
            "Poshtë tij janë dy butona: \"Importo\" e hap direkt zgjedhjen e Excel-it, \"Eksporto\" hap Excel, PDF ose foto."
        )),
        Hyrja(37, "2026-11-07", "Butonat e rinj te Afatet", listOf(
            "Te Afatet, \"Shto\" dhe \"Excel\" janë tani dy katrorë vetëm me ikona: kalendari me \"+\" shton një afat, dosja me shigjetat hap Importo / Eksporto (Excel, PDF, foto)."
        )),
        Hyrja(36, "2026-11-07", "Afatet në PDF për printim", listOf(
            "Te Afatet → Excel ka tani edhe \"Eksporto PDF\": një listë e bardhë A4 me afatet, gati për printim.",
            "Para krijimit zgjedh periudhën (të gjitha ose një muaj), gjendjen, furnizuesin dhe renditjen.",
            "Barkodet dalin kudo me shifra më të qarta: zeroja s'ngjan më me 8."
        )),
        Hyrja(35, "2026-11-07", "Afatet si foto për furnizuesin", listOf(
            "Te Afatet → Excel ka tani edhe \"Eksporto si foto\": zgjedh një ose disa furnizues dhe për secilin del një foto me të gjitha afatet e tij, gati për ta dërguar me Viber ose WhatsApp.",
            "Fotoja tregon lart sa produkte kanë skaduar, sa janë afër skadimit dhe sa në rregull, pastaj çdo produkt me datën, copët dhe barkodin. Del e errët ose e çelët, si e ke aplikacionin."
        )),
        Hyrja(34,"2026-11-05", "Data shkruhet si duhet", listOf(
            "Kur shkruan datën e skadimit, viza \"-\" shtohet vetë dhe kursori kalon pas saj, kështu që shifrat dalin në rendin që i shkruan (p.sh. 23-01-26)."
        )),
        Hyrja(33, "2026-11-04", "Përditësimi me faqe të re", listOf(
            "Kur del version i ri, Stoku të tregon një faqe të plotë me versionin e ri dhe çfarë ka të re në të, sa herë hyn në aplikacion.",
            "Shkarkimi shihet në të njëjtën faqe, me shiritin dhe sa MB janë shkarkuar."
        )),
        Hyrja(32, "2026-11-04", "Butonat e rinj të skanimit", listOf(
            "Butonat e skanimit brenda folderit janë tani dy katrorë të ndarë me ikona më të mëdha: blu për kamerën, i verdhë për Skanimin e shpejtë. Dalin në mes, poshtë.",
            "Te Cilësimet → Skenimi → \"Butonat e skanimit\" zgjedh vetë ku të dalin: majtas, në mes ose djathtas. Aty i sheh edhe në një foto të vogël."
        )),
        Hyrja(31, "2026-10-31", "Afatet pa butonin e cloud-it", listOf(
            "Lart te Afatet s'ka më muajin dhe butonin e cloud-it. Ndryshimet ruhen dhe sinkronizohen vetë pas çdo ndryshimi; gjendjen e sheh te Cilësimet → Llogaria.",
            "Cilësimet → Njoftimet: kur s'je në asnjë grup s'del më \"S'u lidh me serverin e njoftimeve\". Gabimet e tjera tregohen me arsyen e vërtetë, jo gjithmonë \"kontrollo internetin\"."
        )),
        Hyrja(30, "2026-10-30", "Rregullime", listOf(
            "Sasia që e shkruan direkt te lista e folderit ruhet edhe kur prek diku tjetër, jo vetëm me \"Done\".",
            "Kamera s'mbetet më e ndezur në sfond kur e hap dhe e mbyll shumë shpejt.",
            "Folderat dhe listat me shumë produkte punojnë më shpejt.",
            "Në telefonat me Android 8, fotoja e profilit nga një foto e madhe s'e mbyll më aplikacionin.",
            "\"Dil\" kryhet edhe kur kalon në një faqe tjetër ndërsa pritet interneti."
        )),
        Hyrja(29, "2026-10-29", "Folderi më i pastër", listOf(
            "Lart te folderi shkruan vetëm emri i folderit, pa numrin e produkteve.",
            "Brenda folderit ka vetëm fushën \"Barkodi\" dhe pranë saj butonin 🔍. Fusha \"Kërko\" del kur e prek dhe mbyllet kur e prek prapë."
        )),
        Hyrja(28, "2026-10-29", "Butoni i ri i skanimit", listOf(
            "Brenda folderit, poshtë djathtas, ka një buton të vetëm: gjysma blu hap kamerën, gjysma e verdhë hap Skanimin e shpejtë.",
            "\"Eksporto Excel\" dhe \"Eksporto PDF\" janë tani dy ikona lart, pranë emrit të folderit.",
            "\"Fshi të gjitha\" është tani me të kuqe mbi listën e produkteve. Kur të pyet \"A je i sigurt?\", butoni për fshirje aktivizohet pas 5 sekondash."
        )),
        Hyrja(27, "2026-10-29", "Emrat e qartë te butonat", listOf(
            "Pllakat brenda folderit kanë tani emrat e plotë: \"Skano me kamerë\", \"Skanim i shpejtë\", \"Eksporto Excel\" dhe \"Eksporto PDF\", me një tekst të vetëm."
        )),
        Hyrja(26, "2026-10-29", "Kamera njeh të gjitha barkodet", listOf(
            "Kamera tani njeh të gjitha llojet e barkodeve, edhe kodet katrore Data Matrix (p.sh. te ilaçet), PDF417 dhe Aztec. Vetëm kodi QR s'merret si barkod produkti.",
            "Te Afatet butonat \"Shto\" dhe \"Excel\" janë si më parë; pllakat me ngjyra mbeten vetëm brenda folderit te Stoku."
        )),
        Hyrja(25, "2026-10-29", "Butonat e rinj me ngjyra", listOf(
            "Brenda folderit butonat janë tani pllaka me ngjyra: Skano (blu), I shpejtë (e verdhë), Excel (e gjelbër) dhe PDF (e kuqe), secila me një shpjegim të shkurtër."
        )),
        Hyrja(24, "2026-10-29", "Skanim i shpejtë: kamera më e vogël, lista më e madhe", listOf(
            "Kamera e Skanimit të shpejtë zë vetëm sa duhet për kutinë (pa hapësirën bosh poshtë saj). Lista e produkteve ka më shumë vend."
        )),
        Hyrja(23, "2026-10-28", "Skanim i shpejtë: butonat − dhe +", listOf(
            "Te lista e Skanimit të shpejtë, anash numrit janë butonat − dhe + për ta ulur ose rritur sasinë me një prekje.",
            "Administratori mund ta ndalojë Skanimin e shpejtë për dikë te Cilësimet → Përdoruesit (leja \"Skanim i shpejtë\", nën \"Skano me kamerë\")."
        )),
        Hyrja(22, "2026-10-28", "Skanim i shpejtë", listOf(
            "Brenda një folderi te Stoku ka butonin e ri \"Skanim i shpejtë\": kamera hapet lart dhe s'mbyllet, kështu skanon produktet njërin pas tjetrit.",
            "Çdo barkod shtohet menjëherë në folder (+1), edhe pa emër. I njëjti produkt s'del dy herë në listë: i rritet sasia (sa kohë e mban para kamerës, +1 çdo 1.5 sekonda).",
            "Poshtë kamerës del lista me sasitë dhe gjithsej. Për më shumë copë shkruaj numrin te produkti (p.sh. 5), pa asnjë dritare tjetër."
        )),
        Hyrja(21, "2026-10-28", "Skanimi: 7 herë njësoj, vetëm brenda kutisë", listOf(
            "Kur skanon me kamerë, barkodi pranohet vetëm kur lexohet 7 herë njësoj nga 10 tentime (rreth gjysmë sekonde). Përndryshe poshtë kutisë del \"Skano përsëri\", pa zë, dhe mund ta provosh sërish menjëherë.",
            "Lexohet vetëm barkodi që është i tëri brenda kutisë së bardhë. Barkodi i produktit ngjitur, ose ai që del jashtë kutisë, s'merret më."
        )),
        Hyrja(20, "2026-10-28", "Skanimi edhe më i saktë", listOf(
            "Skanimi me kamerë tani e pranon barkodin kur lexohet 5 herë njësoj (nga deri në 10 lexime brenda një sekonde), në vend të 3 herëve. Mund të zgjasë pak më shumë, por gabimet janë edhe më të rralla."
        )),
        Hyrja(19, "2026-10-28", "Skanimi më i saktë", listOf(
            "Kur skanon me kamerë, Stoku s'e merr barkodin nga një shikim i vetëm: brenda një sekonde e lexon disa herë dhe zgjedh numrin që ka dalë më shpesh. Kështu një lexim i gabuar (p.sh. kur dridhet dora) s'kalon, dhe barkodi s'humbet edhe kur shihet vetëm për një çast."
        )),
        Hyrja(18, "2026-10-27", "Më i qëndrueshëm", listOf(
            "Pas mesnatës afatet rifreskohen vetë (\"Sot\", \"Nesër\", ngjyrat dhe numrat), edhe kur aplikacioni ka mbetur i hapur. Nëse po shkruan diçka, pret derisa ta mbyllësh dritaren.",
            "Përditësimi tregon shiritin e shkarkimit (sa MB dhe përqindjen), me butonin \"Anulo\". Kontrollohet edhe kur kthehesh në aplikacion, jo vetëm kur e hap.",
            "Importi nga Excel s'e ngrin më ekranin te skedarët e mëdhenj.",
            "\"Duke e gjetur vendndodhjen…\" zhduket sapo GPS-i e gjen vendin.",
            "Një gabim i papritur s'e mbyll më aplikacionin: del \"Diçka s'shkoi mirë. Provo përsëri.\" dhe arsyeja ruhet te Cilësimet, poshtë versionit."
        )),
        Hyrja(17, "2026-10-27", "Dritaret pa u fshehur nën kamerë", listOf(
            "Dritaret që dalin nga poshtë (p.sh. \"Çfarë ka të re\") s'shkojnë më deri lart nën kamerë dhe orë: mbeten pak më poshtë, me qoshet e rrumbullakëta të dukshme."
        )),
        Hyrja(16, "2026-10-27", "Afatet më të thjeshta, roli te kolegët", listOf(
            "Afatet: butoni \"Skano\" u hoq (skanimi me kamerë është brenda \"Shto\"). \"Importo Excel\" dhe \"Eksporto Excel\" janë tani në një buton \"Excel\", si te web-i.",
            "Grupi → Kolegët: kur e prek kurorën (ose mburojën), emri i rolit del mbi ikonë, si te web-i.",
            "Prova si vizitor: produktet dhe furnizuesit shembull s'dalin më te \"Produktet e reja\" dhe \"Furnizuesit e rinj\". Ato që kishin hyrë fshihen vetë."
        )),
        Hyrja(15, "2026-10-27", "Dalja nga llogaria", listOf(
            "Butoni \"Dil\" është tani te Cilësimet, në kartën me emrin tënd (djathtas). Brenda faqes Llogaria s'është më."
        )),
        Hyrja(14, "2026-10-27", "Të gjitha opsionet e web-it", listOf(
            "Kamera: zmadhimi 1×, 2×, 3× dhe fokusi me prekje. Kur e mban kamerën te një produkt që e ke në folder, sasia rritet +1 vetë, pa u mbyllur kamera.",
            "Folderat: mbaje gishtin te një folder, pastaj lëvize për t'i renditur.",
            "Fotografo fletën: \"Ku do ta kontrollosh fletën?\" (Dërgo në PC ose vazhdo këtu). Fotoja e zmadhuar tregon numrat e rreshtave.",
            "Hyr si vizitor: provë pa llogari me të dhëna shembull. Te hyrja: \"Më mbaj mend emrin e përdoruesit\".",
            "Njoftimet: pyetja kur hapet Stoku dhe \"Lejo njoftimet në telefon\" te zilja e Grupit.",
            "PDA: te \"Afat i ri\" barkodi vjen nga skaneri i PDA-së (pa kamerë) dhe te folderi butoni \"Fshih tastierën\".",
            "Administratori: te Grupi i heq, i kthen ose i fshin afatet e kolegëve, fshin llogari dhe i sheh \"Llogaritë e tjera\". Llogaria e fshirë del vetë nga aplikacioni."
        )),
        Hyrja(13, "2026-10-27", "Marketi me shkrim, kamera pa dritare sipër", listOf(
            "Te \"Afat i ri\" marketi s'zgjidhet më nga një rresht me butona anash: shkruan disa shkronja të emrit dhe poshtë dalin marketet që përputhen. Kur e shkruan emrin saktë, zgjidhet vetë.",
            "Kur skanon barkodin me kamerë nga \"Afat i ri\", dritarja fshihet derisa të mbyllet kamera, pastaj del sërish me barkodin e plotësuar."
        )),
        Hyrja(12, "2026-10-27", "Marketet fqinje", listOf(
            "Kur dy markete janë afër njëri-tjetrit (p.sh. matanë rrugës) dhe GPS-i brenda ndërtesës s'i dallon dot, Stoku s'zgjedh më vetë fqinjin e gabuar: mbetet marketi ku je, ose të pyet \"Ku je?\" me të dy marketet në krye. Zgjedhja jote mbetet."
        )),
        Hyrja(11, "2026-10-27", "Marketet me hartë, fotot e kolegëve", listOf(
            "Cilësimet → Marketet tani ka edhe hartën e marketeve (si te web-i): marketi ku je, harta, lista e marketeve dhe shtimi, të gjitha në një faqe.",
            "Administratori i sheh marketet në hartë, shton një market të ri në hartë, ua ndryshon emrin ose e fshin një market të gabuar.",
            "\"Je te: …\" del vetëm kur je vërtet brenda marketit (deri rreth 100 m). Në shtëpi ose larg marketeve s'del më.",
            "Grupi: te kolegët (Online tani, Kolegët, aktiviteti) dalin fotot e profilit."
        )),
        Hyrja(10, "2026-10-27", "Afat i ri më i thjeshtë", listOf(
            "Te \"Afat i ri\" u hoqën datat e shpejta (1 javë, 2 javë, 1 muaj, 3 muaj). Data shkruhet te fusha dhe poshtë saj del sa ditë ka deri në skadim."
        )),
        Hyrja(9, "2026-10-27", "Cilësimet si te web-i", listOf(
            "Cilësimet hapen si faqe të plota (me \"←\" kthehesh mbrapa), me të njëjtat rreshta, ikona dhe tekste si te web-i.",
            "Cilësimet → Stoku: renditja e produkteve, Furnizuesit dhe Produktet e regjistrit të Stoku-t (emri dhe furnizuesi për çdo barkod, të njëjtë për të gjitha llogaritë).",
            "Administratori kontrollon \"Produktet e reja\" dhe \"Furnizuesit e rinj\", ndryshon emrat ose i bashkon dy furnizues në një.",
            "Llogaria: foto e profilit (shto, ndrysho, hiq), dhe kopja e të dhënave që u fshinë nga një pajisje tjetër (mund t'i rikthesh brenda 30 ditëve).",
            "Stoku i mban mend barkodet: kur ruan një afat, një produkt ose importon, herën tjetër emri dhe furnizuesi plotësohen vetë."
        )),
        Hyrja(8, "2026-10-23", "Përdoruesit (administratori)", listOf(
            "Cilësimet → Përdoruesit: të gjitha llogaritë, lejet e secilës (ruhen vetë), \"U kontrollua\", \"Lejo të gjitha\" dhe \"Ndalo të gjitha\".",
            "Afatet e një llogarie (p.sh. merchandiser), sipas marketeve, vetëm për t'u parë."
        )),
        Hyrja(7, "2026-10-23", "Njoftimet dhe ora e dorës", listOf(
            "Njoftimet e Grupit (kërkesat, heqjet nga rafti) vijnë edhe kur Stoku është i mbyllur.",
            "Njoftimi ditor për afatet në orën që zgjedh (Cilësimet → Njoftimet), me kontrollin e serverit.",
            "Ora e dorës (Galaxy Watch): lidhja me kodin 6-shifror; heqjet nga rafti të bëra në orë zbatohen këtu."
        )),
        Hyrja(6, "2026-10-23", "Excel, PDF dhe Dërgo në PC", listOf(
            "Stoku: \"Eksporto në Excel\" dhe \"Eksporto në PDF\" (etiketa me barkod për printim) te çdo folder.",
            "Afatet: \"Eksporto Excel\" me kolonat, muajin dhe furnizuesin që zgjedh, edhe vetëm për afatet e zgjedhura.",
            "Afatet: \"Importo Excel\" nga skedarë .xlsx ose .csv, me parapamje para importit.",
            "Çdo skedar mund ta dërgosh në PC (te Përmbledhja, me \"Shkarko\"), ta ruash në telefon ose ta ndash."
        )),
        Hyrja(5, "2026-10-23", "Cilësimet e plota", listOf(
            "Pamja: madhësia e shkronjave (Normale ose E madhe).",
            "Skanimi: PDA me skaner të brendshëm (ekrani në portret, pa butonin e kamerës, kursori te barkodi), fshih tastierën në ekran, tingulli i skanimit, kursori te fusha e barkodit për skanerët me USB ose Bluetooth, dhe regjistrimi pa emër.",
            "Llogaria: ndrysho emrin e përdoruesit ose fjalëkalimin, dhe rikthe të dhënat nga cloud.",
            "Çfarë ka të re: kjo listë."
        )),
        Hyrja(4, "2026-10-23", "Hyrja punon", listOf(
            "Aplikacioni s'mbyllet më menjëherë pas hyrjes.",
            "Nëse aplikacioni mbyllet papritur, herën tjetër të tregon arsyen, që ta dërgosh për rregullim."
        )),
        Hyrja(3, "2026-10-23", "Grupi dhe marketet", listOf(
            "Grupi: përmbledhja, afatet e kolegëve, aktiviteti, kalendari, kolegët, zilja me njoftimet dhe \"Kërko heqje nga rafti\".",
            "Merchandiserët: marketet, \"Ku je?\" me vendndodhjen dhe afatet sipas marketit."
        )),
        Hyrja(2, "2026-10-23", "Fotografo fletën", listOf(
            "Afatet lexohen nga fotoja e fletës (me kamerë ose nga galeria) dhe kontrollohen para ruajtjes.",
            "Stoku importohet nga fotoja e një liste."
        )),
        Hyrja(1, "2026-10-22", "Stoku për Android", listOf(
            "Aplikacioni i ri, pa shfletues: Stoku, Afatet dhe Cilësimet, me të njëjtat të dhëna si stoku.site.",
            "Kamera lexon barkodin me motorin e Google-it, edhe pa internet."
        ))
    )

    private const val PREF = "te_rejat_pare"
    /** Instalimet e para (para kësaj liste) i shohin vetëm hyrjet pas nr 4 */
    private const val PARAZGJEDHUR = 4

    fun eParaFundit(): Int = try { StokuApp.prefs(StokuApp.app).getInt(PREF, PARAZGJEDHUR) } catch (e: Exception) { Int.MAX_VALUE }
    fun teReja(): List<Hyrja> { val p = eParaFundit(); return LISTA.filter { it.nr > p } }
    fun shenoTeLexuara() { try { StokuApp.prefs(StokuApp.app).edit().putInt(PREF, LISTA.maxOf { it.nr }).apply() } catch (e: Exception) { } }
}

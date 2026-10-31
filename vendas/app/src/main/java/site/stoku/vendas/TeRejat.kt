package site.stoku.vendas

/**
 * "Çka ka të re" te aplikacioni Stoku për Android (si teRejat.js te web-i, por vetëm për aplikacionin).
 * Hyrja e re shtohet NË KRYE me `nr` më të madh se e para; përdoruesi i sheh një herë hyrjet që s'i ka parë.
 */
object TeRejat {
    class Hyrja(val nr: Int, val data: String, val titulli: String, val pikat: List<String>)

    val LISTA = listOf(
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
            "\"Eksporto Excel\" dhe \"Eksporto PDF\" janë tash dy ikona lart, pranë emrit të folderit.",
            "\"Fshi të gjitha\" është tash me të kuqe mbi listën e produkteve. Kur të pyet \"A je i sigurt?\", butoni për fshirje aktivizohet pas 5 sekondash."
        )),
        Hyrja(27, "2026-10-29", "Emrat e qartë te butonat", listOf(
            "Pllakat brenda folderit kanë tash emrat e plotë: \"Skano me kamerë\", \"Skanim i shpejtë\", \"Eksporto Excel\" dhe \"Eksporto PDF\", me një tekst të vetëm."
        )),
        Hyrja(26, "2026-10-29", "Kamera njeh krejt barkodet", listOf(
            "Kamera tash njeh krejt llojet e barkodeve, edhe kodet katrore Data Matrix (p.sh. te ilaçet), PDF417 dhe Aztec. Vetëm kodi QR s'merret si barkod produkti.",
            "Te Afatet butonat \"Shto\" dhe \"Excel\" janë si më parë; pllakat me ngjyra mbeten vetëm brenda folderit te Stoku."
        )),
        Hyrja(25, "2026-10-29", "Butonat e rinj me ngjyra", listOf(
            "Brenda folderit butonat janë tash pllaka me ngjyra: Skano (blu), I shpejtë (e verdhë), Excel (e gjelbër) dhe PDF (e kuqe), secila me një shpjegim të shkurtër."
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
            "Skanimi me kamerë tash e pranon barkodin kur lexohet 5 herë njësoj (nga deri në 10 lexime brenda një sekonde), në vend të 3 herëve. Mund të zgjasë pak më shumë, por gabimet janë edhe më të rralla."
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
            "Dritaret që dalin nga poshtë (p.sh. \"Çka ka të re\") s'shkojnë më deri lart nën kamerë dhe orë: mbeten pak më poshtë, me qoshet e rrumbullakëta të dukshme."
        )),
        Hyrja(16, "2026-10-27", "Afatet më të thjeshta, roli te kolegët", listOf(
            "Afatet: butoni \"Skano\" u hoq (skanimi me kamerë është brenda \"Shto\"). \"Importo Excel\" dhe \"Eksporto Excel\" janë tash në një buton \"Excel\", si te web-i.",
            "Grupi → Kolegët: kur e prek kurorën (ose mburojën), emri i rolit del mbi ikonë, si te web-i.",
            "Prova si vizitor: produktet dhe furnizuesit shembull s'dalin më te \"Produktet e reja\" dhe \"Furnizuesit e rinj\". Ato që kishin hyrë fshihen vetë."
        )),
        Hyrja(15, "2026-10-27", "Dalja nga llogaria", listOf(
            "Butoni \"Dil\" është tash te Cilësimet, në kartën me emrin tënd (djathtas). Brenda faqes Llogaria s'është më."
        )),
        Hyrja(14, "2026-10-27", "Krejt opsionet e web-it", listOf(
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
            "Cilësimet → Marketet tash ka edhe hartën e marketeve (si te web-i): marketi ku je, harta, lista e marketeve dhe shtimi, krejt në një faqe.",
            "Administratori i sheh marketet në hartë, shton një market të ri në hartë, ua ndryshon emrin ose e fshin një market të gabuar.",
            "\"Je te: …\" del vetëm kur je vërtet brenda marketit (deri rreth 100 m). Në shtëpi ose larg marketeve s'del më.",
            "Grupi: te kolegët (Online tani, Kolegët, aktiviteti) dalin fotot e profilit."
        )),
        Hyrja(10, "2026-10-27", "Afat i ri më i thjeshtë", listOf(
            "Te \"Afat i ri\" u hoqën datat e shpejta (1 javë, 2 javë, 1 muaj, 3 muaj). Data shkruhet te fusha dhe poshtë saj del sa ditë ka deri në skadim."
        )),
        Hyrja(9, "2026-10-27", "Cilësimet si te web-i", listOf(
            "Cilësimet hapen si faqe të plota (me \"←\" kthehesh mbrapa), me të njëjtat rreshta, ikona dhe tekste si te web-i.",
            "Cilësimet → Stoku: renditja e produkteve, Furnizuesit dhe Produktet e regjistrit të Stoku-t (emri dhe furnizuesi për çdo barkod, të njëjtë për krejt llogaritë).",
            "Administratori kontrollon \"Produktet e reja\" dhe \"Furnizuesit e rinj\", ndryshon emrat ose i bashkon dy furnizues në një.",
            "Llogaria: foto e profilit (shto, ndrysho, hiq), dhe kopja e të dhënave që u fshinë nga një pajisje tjetër (mund t'i rikthesh brenda 30 ditëve).",
            "Stoku i mban mend barkodet: kur ruan një afat, një produkt ose importon, herën tjetër emri dhe furnizuesi plotësohen vetë."
        )),
        Hyrja(8, "2026-10-23", "Përdoruesit (administratori)", listOf(
            "Cilësimet → Përdoruesit: krejt llogaritë, lejet e secilës (ruhen vetë), \"U kontrollua\", \"Lejo krejt\" dhe \"Ndalo krejt\".",
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
            "Çka ka të re: kjo listë."
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

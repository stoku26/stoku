package site.stoku.vendas

/**
 * "Çka ka të re" te aplikacioni Stoku për Android (si teRejat.js te web-i, por vetëm për aplikacionin).
 * Hyrja e re shtohet NË KRYE me `nr` më të madh se e para; përdoruesi i sheh një herë hyrjet që s'i ka parë.
 */
object TeRejat {
    class Hyrja(val nr: Int, val data: String, val titulli: String, val pikat: List<String>)

    val LISTA = listOf(
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

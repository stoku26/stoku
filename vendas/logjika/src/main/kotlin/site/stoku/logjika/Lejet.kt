package site.stoku.logjika

/*
 * Lejet e përdoruesve (lejet.js): çka mund të përdorë secila llogari. Dokumenti lejet/{uid} = { lejet: { çelësi: bool } }.
 *  - Pa dokument: krejt të lejuara (llogari e pakontrolluar). Çelësi që mungon: i lejuar.
 *  - Leja e një pjese vlen edhe për veprimet brenda saj (zinxhiri i prindërve).
 *  - Lejet "me zgjedhje" (marketet = merchandiser) janë të fikura kur mungojnë.
 * Çka s'lejohet zhduket krejt, pa asnjë mesazh.
 */
object Lejet {
    class Leja(val k: String, val emri: String, val prindi: String? = null, val zgjedhje: Boolean = false)

    val KATALOGU = listOf(
        Leja("stoku", "Stoku"),
        Leja("stokuShto", "Shto produkte të reja", "stoku"),
        Leja("stokuNdrysho", "Ndrysho produktet", "stoku"),
        Leja("stokuPlusMinus", "Sasia e shpejtë (+/-)", "stokuNdrysho"),
        Leja("stokuFshi", "Fshi produkte dhe foldera", "stoku"),
        Leja("stokuFoldera", "Krijo dhe ndrysho folderat", "stoku"),
        Leja("stokuImporto", "Importo stokun", "stoku"),
        Leja("afatet", "Afatet"),
        Leja("afatetShto", "Shto afate", "afatet"),
        Leja("afatetNdrysho", "Ndrysho afatet", "afatet"),
        Leja("afatetFshi", "Fshi afate", "afatet"),
        Leja("afatetAI", "Lexo fletën me AI", "afatet"),
        Leja("afatetImporto", "Importo afate nga Excel", "afatet"),
        Leja("marketet", "Merchandiser (disa markete)", "afatet", zgjedhje = true),
        Leja("grupi", "Grupi"),
        Leja("grupiHeq", "Hiq nga rafti produktet e kolegëve", "grupi"),
        Leja("grupiKerkesat", "Kërkesat për heqje", "grupi"),
        Leja("kamera", "Skano me kamerë"),
        Leja("eksportExcel", "Eksporto në Excel"),
        Leja("eksportPdf", "Eksporto në PDF"),
        Leja("dergoNePc", "Dërgo skedarët në PC"),
        Leja("ora", "Ora e dorës"),
        Leja("pc", "Stoku në kompjuter")
    )
    private val SIPAS = KATALOGU.associateBy { it.k }

    /** lejet: null (pa dokument) ose { çelësi: bool } */
    fun lejohet(lejet: Obj?, k: String): Boolean {
        val l = SIPAS[k]
        if (l != null && l.zgjedhje) return zgjedhja(lejet, k) == true && (l.prindi == null || lejohet(lejet, l.prindi))
        if (lejet == null) return true
        if (lejet[k] == false) return false
        val p = l?.prindi
        return if (p != null) lejohet(lejet, p) else true
    }

    fun zgjedhja(lejet: Obj?, k: String): Boolean? = lejet?.get(k) as? Boolean

    /** Vetëm çelësat e katalogut, gjithmonë bool; ato me zgjedhje vetëm kur janë caktuar */
    fun pastro(lejet: Obj?): MObj {
        val o = MObj()
        KATALOGU.forEach { l ->
            if (l.zgjedhje) { zgjedhja(lejet, l.k)?.let { o[l.k] = it }; return@forEach }
            o[l.k] = lejet?.get(l.k) != false
        }
        return o
    }

    const val ADMINI = "mendurberisha"
    fun eshteAdmin(perdoruesi: String?): Boolean = perdoruesi?.trim()?.lowercase() == ADMINI
}

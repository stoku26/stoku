package site.stoku.logjika

/*
 * Lejet e përdoruesve (lejet.js): çka mund të përdorë secila llogari. Dokumenti lejet/{uid} = { lejet: { çelësi: bool } }.
 *  - Pa dokument: krejt të lejuara (llogari e pakontrolluar). Çelësi që mungon: i lejuar.
 *  - Leja e një pjese vlen edhe për veprimet brenda saj (zinxhiri i prindërve).
 *  - Lejet "me zgjedhje" (marketet = merchandiser) janë të fikura kur mungojnë.
 * Çka s'lejohet zhduket krejt, pa asnjë mesazh.
 */
object Lejet {
    class Leja(val k: String, val emri: String, val prindi: String? = null, val zgjedhje: Boolean = false, val grupi: String = "", val pershkrim: String = "")

    val KATALOGU = listOf(
        Leja("stoku", "Stoku", grupi = "Stoku", pershkrim = "Sheh folderat dhe produktet."),
        Leja("stokuShto", "Shto produkte të reja", "stoku", grupi = "Stoku", pershkrim = "Një barkod që s'është ende në folder."),
        Leja("stokuNdrysho", "Ndrysho produktet", "stoku", grupi = "Stoku", pershkrim = "Sasia, emri, furnizuesi dhe zhvendosja në folder tjetër."),
        Leja("stokuPlusMinus", "Sasia e shpejtë (+/-)", "stokuNdrysho", grupi = "Stoku", pershkrim = "Butonat + dhe - te lista e produkteve dhe numërimi kur skanon me kamerë një produkt që e ke."),
        Leja("stokuFshi", "Fshi produkte dhe foldera", "stoku", grupi = "Stoku", pershkrim = "Edhe \"Fshi krejt\" brenda një folderi."),
        Leja("stokuFoldera", "Krijo dhe ndrysho folderat", "stoku", grupi = "Stoku", pershkrim = "\"Folder i ri\", emri, ikona dhe renditja e folderave."),
        Leja("stokuImporto", "Importo stokun", "stoku", grupi = "Stoku", pershkrim = "Nga fotoja e një flete (me AI) ose nga Excel në kompjuter."),
        Leja("afatet", "Afatet", grupi = "Afatet", pershkrim = "Sheh afatet e skadimit të produkteve."),
        Leja("afatetShto", "Shto afate", "afatet", grupi = "Afatet"),
        Leja("afatetNdrysho", "Ndrysho afatet", "afatet", grupi = "Afatet", pershkrim = "Data, sasia, \"U hoq nga rafti\" dhe \"Rikthe si aktiv\"."),
        Leja("afatetFshi", "Fshi afate", "afatet", grupi = "Afatet"),
        Leja("afatetAI", "Lexo fletën me AI", "afatet", grupi = "Afatet", pershkrim = "Fotoja e fletës me afate (edhe fletët që vijnë nga telefoni te kompjuteri)."),
        Leja("afatetImporto", "Importo afate nga Excel", "afatet", grupi = "Afatet"),
        Leja("marketet", "Merchandiser (disa markete)", "afatet", zgjedhje = true, grupi = "Afatet",
            pershkrim = "Afatet sipas marketeve, me GPS. E zgjedh vetë kur hap llogarinë (\"Punoj si merchandiser\"); këtu ia ndez ose ia fik."),
        Leja("grupi", "Grupi", grupi = "Grupi", pershkrim = "Kolegët, afatet e grupit, aktiviteti dhe kalendari."),
        Leja("grupiHeq", "Hiq nga rafti produktet e kolegëve", "grupi", grupi = "Grupi", pershkrim = "\"Unë e hoqa\" te afatet e skaduara të kolegëve (kolegu e miraton)."),
        Leja("grupiKerkesat", "Kërkesat për heqje", "grupi", grupi = "Grupi", pershkrim = "Kërkoji një kolegu ose krejt grupit ta heqë një produkt nga rafti."),
        Leja("kamera", "Skano me kamerë", grupi = "Skanimi dhe skedarët", pershkrim = "Barkodi me kamerën e telefonit, te stoku dhe te afatet."),
        Leja("eksportExcel", "Eksporto në Excel", grupi = "Skanimi dhe skedarët", pershkrim = "Stoku dhe afatet."),
        Leja("eksportPdf", "Eksporto në PDF", grupi = "Skanimi dhe skedarët", pershkrim = "Etiketat me barkod (në kompjuter edhe raporti)."),
        Leja("dergoNePc", "Dërgo skedarët në PC", grupi = "Skanimi dhe skedarët", pershkrim = "Excel-i dhe PDF-ja nga telefoni te Stoku në kompjuter (kërkon edhe \"Stoku në kompjuter\")."),
        Leja("ora", "Ora e dorës", grupi = "Pajisjet", pershkrim = "Lidhja e Galaxy Watch ose Apple Watch."),
        Leja("pc", "Stoku në kompjuter", grupi = "Pajisjet", pershkrim = "Versioni për kompjuter. Pa të, në kompjuter hapet versioni i telefonit.")
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

    /** "Lejo krejt" (true) / "Ndalo krejt" (false): krejt lejet pa ato me zgjedhje */
    fun krejt(vlera: Boolean): MObj { val o = MObj(); KATALOGU.forEach { if (!it.zgjedhje) o[it.k] = vlera }; return o }

    /** "Lejo krejt" / "Ndalo krejt" s'e ndërrojnë zgjedhjen e caktuar më parë (p.sh. merchandiser) */
    fun meZgjedhjet(lejetERe: Obj, teVjetrat: Obj?): MObj {
        val o = LinkedHashMap(lejetERe)
        KATALOGU.filter { it.zgjedhje }.forEach { l -> if (zgjedhja(o, l.k) == null) zgjedhja(teVjetrat, l.k)?.let { o[l.k] = it } }
        return o
    }

    /** Sa leje janë ndaluar (ato me zgjedhje s'janë ndalime) */
    fun teNdaluara(lejet: Obj?): Int = if (lejet == null) 0 else KATALOGU.count { !it.zgjedhje && lejet[it.k] == false }

    /** Statusi i një llogarie për administratorin: "ri" (pa u kontrolluar) | "krejt" | "kufizuar"; dok = lejet/{uid} */
    fun statusi(dok: Obj?): String {
        if (dok == null || !eVertete(dok["kontrolluarSe"])) return "ri"
        return if (teNdaluara(dok["lejet"].siObj()) > 0) "kufizuar" else "krejt"
    }

    const val ADMINI = "mendurberisha"
    fun eshteAdmin(perdoruesi: String?): Boolean = perdoruesi?.trim()?.lowercase() == ADMINI
}

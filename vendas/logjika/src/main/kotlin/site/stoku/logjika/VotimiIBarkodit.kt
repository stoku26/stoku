package site.stoku.logjika

/**
 * Votimi i leximeve të kamerës (v260, i njëjti rregull si `krijoVotimin` te app-tel.js): një barkod s'pranohet nga një kuadër
 * i vetëm. Nga leximi i parë, brenda [kohaMs] mblidhen lexime dhe fiton ai që doli më shpesh:
 *  - kodi që arrin [fiton] vota fiton menjëherë (nga [maks] lexime s'e kalon dot më asnjë tjetër);
 *  - pas [maks] leximeve fiton ai në krye, nëse është vetëm (me barazim pritet);
 *  - kur mbaron koha fiton ai në krye (barazim: i sigurti, pastaj i pari).
 * Kodi me 1 votë pranohet vetëm kur është "i sigurt" (EAN/UPC me shifrën e kontrollit të saktë): barkodi s'humbet kur shihet
 * vetëm për një çast, por një lexim i gabuar nga një kuadër i turbullt s'kalon. Koha jepet nga jashtë (testet).
 */
class VotimiIBarkodit(private val kohaMs: Long = 1000, private val maks: Int = 5, private val fiton: Int = 3) {
    private class Vota(val kodi: String, val iSigurt: Boolean) { var n = 0 }
    private val votat = ArrayList<Vota>()
    private var fillimi = -1L
    private var gjithsej = 0

    val aktiv: Boolean get() = fillimi >= 0
    /** Sa ms kanë mbetur deri në mbarim të votimit (0 kur s'ka votim) */
    fun mbetur(tani: Long): Long = if (fillimi < 0) 0 else maxOf(0L, fillimi + kohaMs - tani)
    fun rinis() { votat.clear(); fillimi = -1; gjithsej = 0 }

    /** Shton një lexim; kthen barkodin fitues kur vendoset (dhe e rinis votimin), përndryshe null */
    fun shto(kodi: String, iSigurt: Boolean, tani: Long): String? {
        val vendim = if (fillimi >= 0 && tani - fillimi >= kohaMs) fituesi(true) else null
        if (fillimi < 0) fillimi = tani
        val v = votat.firstOrNull { it.kodi == kodi } ?: Vota(kodi, iSigurt).also { votat.add(it) }
        v.n++; gjithsej++
        if (vendim != null) return vendim
        if (v.n >= fiton) { rinis(); return kodi }
        if (gjithsej >= maks) return fituesi(false)
        return null
    }

    /** Kur mbaron koha (kohëmatësi): fituesi ose null */
    fun skado(tani: Long): String? = if (fillimi >= 0 && tani - fillimi >= kohaMs) fituesi(true) else null

    /** [perfundimtar]: koha mbaroi (barazimi zgjidhet); përndryshe me barazim pritet (null, pa e rinisur) */
    private fun fituesi(perfundimtar: Boolean): String? {
        var m: Vota? = null
        var barazim = false
        for (v in votat) {
            val mm = m
            if (mm == null || v.n > mm.n) { m = v; barazim = false }
            else if (v.n == mm.n) {
                if (v.iSigurt && !mm.iSigurt) { m = v; barazim = false } else if (v.iSigurt == mm.iSigurt) barazim = true
            }
        }
        if (!perfundimtar && barazim) return null
        val f = m?.takeIf { it.n >= 2 || it.iSigurt }?.kodi
        rinis()
        return f
    }
}

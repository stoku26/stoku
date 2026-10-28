package site.stoku.logjika

/**
 * Votimi i leximeve të kamerës (v262, i njëjti rregull si `krijoVotimin` te app-tel.js): nga leximi i parë, te [tentime] tentimet
 * e radhës (çdo kuadër i shqyrtuar është një tentim, edhe kur brenda kutisë s'gjen asgjë; në një telefon të zakonshëm rreth
 * gjysmë sekonde) barkodi duhet të dalë të paktën [fiton] herë njësoj. Kur s'arrihet, ose s'mund të arrihet më: [Vendimi.Deshtoi]
 * ("Skano përsëri", pa zë) dhe votimi nis sërish me leximin e radhës. S'ka pranim me 1 lexim.
 */
class VotimiIBarkodit(private val tentime: Int = 10, private val fiton: Int = 7) {
    sealed class Vendimi {
        data class Pranuar(val kodi: String) : Vendimi()
        object Deshtoi : Vendimi()
    }

    private val votat = HashMap<String, Int>()
    private var bere = 0
    var aktiv = false
        private set

    fun rinis() { votat.clear(); bere = 0; aktiv = false }

    /** Një tentim: [kodi] i lexuar brenda kutisë ose null. Kthen vendimin, ose null kur votimi vazhdon (ose s'ka nisur) */
    fun tentim(kodi: String?): Vendimi? {
        if (!aktiv) { if (kodi == null) return null; aktiv = true } // para leximit të parë: ende po drejtohet kamera
        bere++
        if (kodi != null) {
            val n = (votat[kodi] ?: 0) + 1
            votat[kodi] = n
            if (n >= fiton) { rinis(); return Vendimi.Pranuar(kodi) }
        }
        val max = votat.values.maxOrNull() ?: 0
        if (max + (tentime - bere) < fiton) { rinis(); return Vendimi.Deshtoi } // s'arrin dot më
        return null
    }
}

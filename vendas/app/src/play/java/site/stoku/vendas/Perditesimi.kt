package site.stoku.vendas

import android.app.Activity
import kotlinx.coroutines.flow.MutableStateFlow

/**
 * Versioni "play": përditësimi vetëm nga Google Play (PerditesimiPlay.kt). Ky skedar ka të njëjtin API si github/Perditesimi.kt
 * (MainActivity, Cilësimet, PerditesimiUI), por pa GitHub, pa shkarkim APK-je dhe pa instalues: rregullat e Play-it ndalojnë kodin që
 * instalon aplikacione nga jashtë Play-it, edhe kur s'thirret kurrë. Faqja e përditësimit (PerditesimiUI) s'del kurrë këtu.
 */
object Perditesimi {
    data class Hyrja(val nr: Int, val titulli: String, val pikat: List<String>)
    data class Gjendja(val n: Int, val url: String, val teReja: List<Hyrja>, val faza: String = "pyet",
                       val lexuar: Long = 0, val gjithsej: Long = 0, val mesazhi: String = "")
    /** Gjithmonë null: Play e tregon vetë faqen e përditësimit */
    val gjendja = MutableStateFlow<Gjendja?>(null)

    fun kontrollo(a: Activity, detyro: Boolean) = PerditesimiPlay.kontrollo(a, detyro)
    fun mbyll() { gjendja.value = null }
    fun anulo() { }
    fun mb(n: Long): String = String.format(java.util.Locale.ROOT, "%.1f", n / (1024.0 * 1024.0)).replace('.', ',') + " MB"
    @Suppress("UNUSED_PARAMETER") fun shkarko(a: Activity) { }
    @Suppress("UNUSED_PARAMETER") fun vazhdoNesePritej(a: Activity) { }
}

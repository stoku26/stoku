package site.stoku.ora

import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Versioni "play" (Google Play, pronari 26.11.2026: ora "100% identik" me versionin github, bashkë me telefonin te Play Store):
 * i njëjti API si src/github/Perditesimi.kt, por pa GitHub dhe pa shkarkim APK-je (rregullat e Play-it). Përditësimet i bën vetë
 * Google Play; "Kontrollo për përditësim" te Cilësimet e hap faqen e Stoku-t te Play Store i orës.
 */
object Perditesimi {
    /** Cilësimet: butoni hap Google Play (pa "Ke versionin më të ri ✓", që s'kontrollohet këtu) */
    const val NGA_PLAY = true
    @Volatile var deshtoi = false

    /** Play e përditëson vetë: s'ka kurrë "version të ri" për t'u shkarkuar këtu. detyro (Cilësimet): hapet Play Store. */
    @Suppress("RedundantSuspendModifier")
    suspend fun kontrollo(ctx: Context, detyro: Boolean = false): Pair<Int, String>? {
        deshtoi = false
        if (detyro) {
            val p = ctx.packageName
            try { ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$p")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
            catch (e: Exception) { }
        }
        return null
    }

    @Suppress("UNUSED_PARAMETER", "RedundantSuspendModifier")
    suspend fun instalo(ctx: Context, url: String): String? = null
}

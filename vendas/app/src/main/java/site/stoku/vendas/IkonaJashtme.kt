package site.stoku.vendas

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration

/**
 * Hyrja 76 (web v314, pronari: "sigurohu qe mu ndrru edhe ikona e jashtme e appit kur zgjidhet dark mode ose white mode"):
 * ikona në ekranin bazë ndjek temën e Stoku-t: e errët (nr. 4, "stoku." e bardhë mbi të zezë) ose e çelët (nr. 5).
 * Me "Automatike" ndjek temën e telefonit. Ndërrohet kur aplikacioni del në sfond (MainActivity.onStop), që të mos mbyllet
 * gjatë punës; disa launcher-a e rivendosin ikonën në fund të listës ose duhet ta vendosësh prapë në ekranin bazë.
 */
object IkonaJashtme {
    private const val ERRET = "site.stoku.vendas.IkonaErret"
    private const val CELET = "site.stoku.vendas.IkonaCelet"

    fun eErret(ctx: Context): Boolean = when (Opsionet.tema.value) {
        "dark" -> true
        "light" -> false
        else -> (ctx.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
    }

    fun perditeso(ctx: Context) {
        try {
            val erret = eErret(ctx)
            vendos(ctx, ERRET, erret, true)
            vendos(ctx, CELET, !erret, false)
        } catch (e: Exception) { }
    }

    /** ndezur: si duhet të jetë; nëManifest: si është në AndroidManifest (gjendja DEFAULT) */
    private fun vendos(ctx: Context, emri: String, ndezur: Boolean, neManifest: Boolean) {
        val pm = ctx.packageManager
        val c = ComponentName(ctx.packageName, emri)
        val tani = when (pm.getComponentEnabledSetting(c)) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
            PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> neManifest
            else -> false
        }
        if (tani == ndezur) return
        pm.setComponentEnabledSetting(c, if (ndezur) PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP)
    }
}

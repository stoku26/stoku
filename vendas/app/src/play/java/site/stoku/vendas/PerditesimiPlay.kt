package site.stoku.vendas

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability

/**
 * Versioni "play" (Google Play, pronari 21.11.2026: "aty duhet update me u bo prej playstore"): pa shkarkimin e APK-së nga GitHub.
 * Kur Play ka version të ri, del faqja e Play-it për përditësim brenda aplikacionit (IMMEDIATE: si faqja e plotë e përditësimit te
 * versioni "github"); nëse s'mundet, hapet faqja e Stoku-t te Play Store. Kontrollohet sa herë hyn (jo më shpesh se 2 min) dhe
 * me "Kontrollo për përditësim" te Cilësimet. Përditësimi i nisur dhe i ndërprerë vazhdon vetë kur kthehesh.
 */
object PerditesimiPlay {
    private const val PUSHIMI_MS = 2 * 60_000L
    @Volatile private var dukeKontrolluar = false

    fun kontrollo(a: Activity, detyro: Boolean) {
        val pr = StokuApp.prefs(a)
        if (!detyro && System.currentTimeMillis() - pr.getLong("perditesimi_play_koha", 0) < PUSHIMI_MS) return
        if (dukeKontrolluar) return
        dukeKontrolluar = true
        if (detyro) toast(a, "Duke kontrolluar te Google Play…")
        val m = try { AppUpdateManagerFactory.create(a.applicationContext) } catch (e: Exception) { dukeKontrolluar = false; return }
        m.appUpdateInfo.addOnSuccessListener { info ->
            dukeKontrolluar = false
            pr.edit().putLong("perditesimi_play_koha", System.currentTimeMillis()).apply()
            val gj = info.updateAvailability()
            val ka = gj == UpdateAvailability.UPDATE_AVAILABLE || gj == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
            if (a.isFinishing || a.isDestroyed) return@addOnSuccessListener
            when {
                ka && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE) ->
                    try { m.startUpdateFlow(info, a, AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()) } catch (e: Exception) { hapPlay(a) }
                ka -> if (detyro) hapPlay(a)
                detyro -> toast(a, "Ke versionin më të ri nga Google Play")
            }
        }.addOnFailureListener {
            dukeKontrolluar = false
            // P.sh. aplikacioni s'është instaluar nga Play: te Cilësimet hapet faqja e Stoku-t te Play Store
            if (detyro && !a.isFinishing) hapPlay(a)
        }
    }

    private fun hapPlay(a: Activity) {
        val p = a.packageName
        try { a.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$p")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
        catch (e: Exception) {
            try { a.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$p"))) } catch (e2: Exception) { toast(a, "S'u hap Play Store.") }
        }
    }

    private fun toast(a: Activity, t: String) = a.runOnUiThread { Toast.makeText(a.applicationContext, site.stoku.vendas.ui.Gjuha.t(t), Toast.LENGTH_SHORT).show() }
}

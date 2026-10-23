package site.stoku.vendas

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/** Njoftimet e telefonit (si Njoftimet.kt te aplikacioni i vjetër): kanali "stoku", leja (Android 13+) dhe shfaqja. */
object Njoftimet {
    const val KANALI = "stoku"
    const val EXTRA_TABI = "stoku_tabi"

    fun krijoKanalin(ctx: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val k = NotificationChannel(KANALI, "Njoftimet e Stoku-t", NotificationManager.IMPORTANCE_HIGH)
        k.description = "Afatet që skadojnë dhe kërkesat e grupit"
        k.enableVibration(true)
        ctx.getSystemService(NotificationManager::class.java)?.createNotificationChannel(k)
    }

    fun duhetLeja(): Boolean = Build.VERSION.SDK_INT >= 33
    /** "lejuar" | "fikur" (ende pa u pyetur) | "bllokuar" (të fikura te cilësimet e telefonit) */
    fun gjendja(ctx: Context): String {
        val lejuarTeSistemi = NotificationManagerCompat.from(ctx).areNotificationsEnabled()
        if (duhetLeja() && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            return if (StokuApp.prefsOseB("njoftimet_pyetur", false)) "bllokuar" else "fikur"
        return if (lejuarTeSistemi) "lejuar" else "bllokuar"
    }
    fun lejuar(ctx: Context): Boolean = gjendja(ctx) == "lejuar"

    /** Tabi që hapet kur preket njoftimi, nga adresa e web-it ("./index.html#ekipa-njoftimet" → Grupi) */
    fun tabiNgaUrl(url: String): String = when {
        url.contains("ekipa") || url.contains("grupi") -> "grupi"
        url.contains("afat") -> "afatet"
        else -> ""
    }

    fun shfaq(ctx: Context, titulli: String, teksti: String, tag: String, url: String) {
        if (!lejuar(ctx)) return
        krijoKanalin(ctx)
        val hap = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_TABI, tabiNgaUrl(url))
        }
        val pi = PendingIntent.getActivity(ctx, (tag + url).hashCode(), hap, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(ctx, KANALI)
            .setSmallIcon(R.drawable.ic_njoftim)
            .setColor(0xFF14161B.toInt())
            .setContentTitle(titulli.ifBlank { "Stoku" })
            .setContentText(teksti)
            .setStyle(NotificationCompat.BigTextStyle().bigText(teksti))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build()
        try { NotificationManagerCompat.from(ctx).notify(tag.ifBlank { "stoku" }, 1, n) } catch (e: SecurityException) { /* pa leje */ }
    }
}

/** Njoftimet nga Worker-i (stoku-push): mesazhe "data" me titullin, tekstin, tag-un dhe adresën. */
class FcmSherbimi : FirebaseMessagingService() {
    override fun onNewToken(token: String) { Push.tokeniIRi(token) }

    override fun onMessageReceived(m: RemoteMessage) {
        val d = m.data
        Njoftimet.shfaq(applicationContext, d["titulli"] ?: "Stoku", d["teksti"] ?: "", d["tag"] ?: "stoku", d["url"] ?: "")
    }
}

package site.stoku.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object Njoftimet {
    const val KANALI = "stoku"

    fun krijoKanalin(ctx: Context) {
        val k = NotificationChannel(KANALI, "Njoftimet e Stoku-t", NotificationManager.IMPORTANCE_HIGH)
        k.description = "Afatet që skadojnë, chat-i dhe kërkesat e ekipës"
        k.enableVibration(true)
        ctx.getSystemService(NotificationManager::class.java).createNotificationChannel(k)
    }

    fun lejuar(ctx: Context): Boolean = NotificationManagerCompat.from(ctx).areNotificationsEnabled()

    /** url: adresa që hapet kur preket njoftimi (relative ndaj stoku.site, p.sh. "./index.html#ekipa-chat"). */
    fun shfaq(ctx: Context, titulli: String, teksti: String, tag: String, url: String) {
        if (!lejuar(ctx)) return
        val hap = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(MainActivity.EXTRA_URL, url)
        }
        val pi = PendingIntent.getActivity(ctx, (tag + url).hashCode(), hap,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
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
        try {
            NotificationManagerCompat.from(ctx).notify(tag.ifBlank { "stoku" }, 1, n)
        } catch (e: SecurityException) { /* pa leje */ }
    }

    fun duhetLeja(): Boolean = Build.VERSION.SDK_INT >= 33
}

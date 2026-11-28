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
        val k = NotificationChannel(KANALI, site.stoku.vendas.ui.Gjuha.t("Njoftimet e Stoku-t"), NotificationManager.IMPORTANCE_HIGH)
        k.description = site.stoku.vendas.ui.Gjuha.t("Afatet që skadojnë dhe kërkesat e grupit")
        k.enableVibration(true)
        ctx.getSystemService(NotificationManager::class.java)?.createNotificationChannel(k)
    }

    fun duhetLeja(): Boolean = Build.VERSION.SDK_INT >= 33
    /** "lejuar" | "fikur" (ende pa u pyetur) | "bllokuar" (të fikura te cilësimet e telefonit) */
    fun gjendja(ctx: Context): String {
        val lejuarTeSistemi = NotificationManagerCompat.from(ctx).areNotificationsEnabled()
        if (duhetLeja() && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            return if (StokuApp.prefsOseB("njoftimet_pyetur", false)) "bllokuar" else "fikur"
        if (!lejuarTeSistemi) return "bllokuar"
        // Hyrja 75: edhe kanali "Njoftimet e Stoku-t" i fikur te cilësimet e telefonit = të bllokuara (njoftimet s'dalin)
        if (Build.VERSION.SDK_INT >= 26) {
            val k = ctx.getSystemService(NotificationManager::class.java)?.getNotificationChannel(KANALI)
            if (k != null && k.importance == NotificationManager.IMPORTANCE_NONE) return "bllokuar"
        }
        return "lejuar"
    }
    fun lejuar(ctx: Context): Boolean = gjendja(ctx) == "lejuar"

    /** Tabi që hapet kur preket njoftimi, nga adresa e web-it ("./index.html#ekipa-njoftimet" → Grupi) */
    fun tabiNgaUrl(url: String): String = when {
        url.contains("ekipa") || url.contains("grupi") -> "grupi"
        url.contains("afat") -> "afatet"
        else -> ""
    }

    /**
     * Pronari (28.11.2026): "qdo lloj njoftimi qe duhet me ta qu stoku me mujt ti me selektu se qka po do met njoftu e qka jo".
     * Llojet (Cilësimet → Njoftimet → "Llojet e njoftimeve"); zgjedhja ruhet në këtë telefon (pref "njoftimi_<k>", parazgjedhur: po).
     * Njoftimi ditor dhe kodi i fjalëkalimit s'fiken (i pari është i detyrueshëm, i dyti duhet për rivendosjen).
     */
    data class Lloji(val k: String, val titulli: String, val pershkrimi: String, val iDetyrueshem: Boolean = false)
    val LLOJET = listOf(
        Lloji("ditor", "Afatet e ditës", "I detyrueshëm: njoftimi ditor për produktet që skadojnë dhe ato të skaduara.", true),
        Lloji("kerkesa", "Kërkesat për heqje nga rafti", "Kur një koleg të kërkon (ty ose grupit) të heqësh një produkt nga rafti, dhe kur e heq ai që e kërkove."),
        Lloji("heqje", "Heqjet nga rafti", "Kur një koleg e heq nga rafti një produkt tëndin, e pranon ose e refuzon heqjen."),
        Lloji("afate", "Afatet nga kolegët", "Kur një koleg të dërgon një afat, e pranon atë që i dërgove, ose afati të kthehet."),
        Lloji("admini", "Nga administratori", "Lajmërimet e administratorit dhe ndryshimet që ai bën te afatet e tua."),
        Lloji("grupi", "Ftesat dhe kërkesat e grupit", "Ftesat në grup, kërkesat për t'u bashkuar dhe kur bëhesh admin i grupit."),
        Lloji("fjalekalimi", "Kodi i fjalëkalimit", "Gjithmonë i ndezur: kodi për rivendosjen e fjalëkalimit.", true),
    )
    fun lejohetLloji(k: String?): Boolean {
        val l = LLOJET.firstOrNull { it.k == k } ?: return true // lloj i panjohur: del
        return l.iDetyrueshem || site.stoku.vendas.StokuApp.prefsOseB("njoftimi_" + l.k, true)
    }
    fun vendosLlojin(k: String, po: Boolean) = site.stoku.vendas.StokuApp.vendosPrefB("njoftimi_$k", po)
    /** Lloji i njoftimit: nga fusha "nl" e Worker-it (lloji i dokumentit), përndryshe nga tag-u / titulli (Worker-i i vjetër). */
    fun llojiINjoftimit(nl: String?, tag: String?, lloji: String?, titulli: String?): String? = when {
        nl == "ditor" || lloji == "afatet" || tag == "stoku-ditor" -> "ditor"
        nl == "fjalekalimi" || titulli == "Stoku · Fjalëkalimi" -> "fjalekalimi"
        nl != null && nl.startsWith("kerkese-") && nl != "kerkese-grupi" -> "kerkesa"
        nl == "hequr" || nl == "heqje-pranuar" || nl == "heqje-refuzuar" -> "heqje"
        nl == "afat-dergim" || nl == "afat-pranuar" || nl == "afat-kthyer" -> "afate"
        nl == "admin-afat" || nl == "lajmerim" -> "admini"
        nl == "ftese" || nl == "kerkese-grupi" || nl == "admin-i-ri" -> "grupi"
        lloji == "kerkese" || tag?.startsWith("ek-kerkese-") == true -> "kerkesa"
        tag?.startsWith("ek-ft-") == true || tag?.startsWith("ek-kr-") == true -> "grupi"
        else -> null
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
            .setColor(site.stoku.vendas.ui.Logot.IKONA_AC.toInt()) // Hyrja 76: e gjelbra e pikës së logos
            // web v355: në anglisht edhe njoftimet (teksti vjen shqip nga serveri; përkthehet me fjalorin)
            .setContentTitle(site.stoku.vendas.ui.Gjuha.t(titulli.ifBlank { "Stoku" }))
            .setContentText(site.stoku.vendas.ui.Gjuha.t(teksti))
            .setStyle(NotificationCompat.BigTextStyle().bigText(site.stoku.vendas.ui.Gjuha.t(teksti)))
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
        // Pronari (28.11.2026): vetëm llojet e zgjedhura te Cilësimet → Njoftimet (ora i merr nga telefoni, ndaj filtrohen edhe aty)
        if (!Njoftimet.lejohetLloji(Njoftimet.llojiINjoftimit(d["nl"], d["tag"], d["lloji"], d["titulli"]))) return
        Njoftimet.shfaq(applicationContext, d["titulli"] ?: "Stoku", d["teksti"] ?: "", d["tag"] ?: "stoku", d["url"] ?: "")
    }
}

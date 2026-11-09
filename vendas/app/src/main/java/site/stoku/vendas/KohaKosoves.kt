package site.stoku.vendas

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import java.util.TimeZone

/**
 * v282 (pronari): ora e Stoku-t është GJITHMONË ora e Kosovës (Europe/Belgrade: 24 orë, ora verore/dimërore ndërrohet vetë),
 * jo ajo që e ka vendosur telefoni ose ora e dorës. Zona vendoset për krejt aplikacionin (orët, datat, "sot", njoftimet, skedarët);
 * kur sistemi e ndërron zonën (cilësimet e telefonit), rivendoset menjëherë.
 */
object KohaKosoves {
    const val ZONA = "Europe/Belgrade"

    fun vendos() {
        try { if (TimeZone.getDefault().id != ZONA) TimeZone.setDefault(TimeZone.getTimeZone(ZONA)) } catch (e: Exception) { }
    }

    fun nis(ctx: Context) {
        vendos()
        try {
            val f = IntentFilter().apply { addAction(Intent.ACTION_TIMEZONE_CHANGED); addAction(Intent.ACTION_TIME_CHANGED); addAction(Intent.ACTION_DATE_CHANGED) }
            val r = object : BroadcastReceiver() {
                override fun onReceive(c: Context?, i: Intent?) { vendos(); Handler(Looper.getMainLooper()).post { vendos() } }
            }
            if (Build.VERSION.SDK_INT >= 33) ctx.applicationContext.registerReceiver(r, f, Context.RECEIVER_NOT_EXPORTED)
            else ctx.applicationContext.registerReceiver(r, f)
        } catch (e: Exception) { }
    }
}

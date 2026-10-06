package site.stoku.app

import android.app.Application
import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Aplikacioni Stoku për telefon: stoku.site brenda një WebView me hapësirë të vetën (Chrome s'e prek kur i fshin
 * të dhënat e tij), njoftime me Firebase Cloud Messaging dhe përditësim vetë nga GitHub Releases.
 *
 * Konfigurimi i Firebase-it për Android (appId, apiKey...) merret nga https://stoku.site/android.json, që të mos
 * duhet ndërtuar APK e re kur ndryshon. Ruhet në telefon, që njoftimet të punojnë edhe kur aplikacioni është mbyllur.
 */
class StokuApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Njoftimet.krijoKanalin(this)
        nisFirebase(this, lexoKonfigurimin(this))
    }

    companion object {
        const val BAZA = "https://stoku.site/"
        private const val PREFS = "stoku"

        fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        fun lexoKonfigurimin(ctx: Context): JSONObject? =
            prefs(ctx).getString("firebase", null)?.let { runCatching { JSONObject(it) }.getOrNull() }

        private fun eVlefshme(j: JSONObject?) = j != null &&
            j.optString("appId").isNotBlank() && j.optString("apiKey").isNotBlank() &&
            j.optString("projectId").isNotBlank() && j.optString("senderId").isNotBlank()

        /** Nis Firebase-in (një herë) dhe kërkon tokenin e njoftimeve. */
        fun nisFirebase(ctx: Context, j: JSONObject?) {
            if (!eVlefshme(j) || FirebaseApp.getApps(ctx).isNotEmpty()) return
            try {
                val opt = FirebaseOptions.Builder()
                    .setApplicationId(j!!.optString("appId"))
                    .setApiKey(j.optString("apiKey"))
                    .setProjectId(j.optString("projectId"))
                    .setGcmSenderId(j.optString("senderId"))
                    .build()
                FirebaseApp.initializeApp(ctx, opt)
                FirebaseMessaging.getInstance().token.addOnSuccessListener { t -> ruajTokenin(ctx, t) }
            } catch (e: Exception) { /* konfigurim i gabuar: aplikacioni punon pa njoftime */ }
        }

        fun ruajTokenin(ctx: Context, t: String?) {
            if (t.isNullOrBlank()) return
            prefs(ctx).edit().putString("fcm", t).apply()
            MainActivity.tokeniIRi(t)
        }

        fun tokeni(ctx: Context): String = prefs(ctx).getString("fcm", "") ?: ""

        /** Merr android.json nga faqja (në sfond) dhe e nis Firebase-in nëse s'është nisur ende. */
        fun rifreskoKonfigurimin(ctx: Context) {
            Thread {
                try {
                    val c = URL(BAZA + "android.json?t=" + System.currentTimeMillis()).openConnection() as HttpURLConnection
                    c.connectTimeout = 10000; c.readTimeout = 10000; c.useCaches = false
                    if (c.responseCode == 200) {
                        val j = JSONObject(c.inputStream.bufferedReader().readText())
                        if (eVlefshme(j)) {
                            prefs(ctx).edit().putString("firebase", j.toString()).apply()
                            nisFirebase(ctx.applicationContext, j)
                        }
                    }
                    c.disconnect()
                } catch (e: Exception) { /* pa internet: provohet herën tjetër */ }
            }.start()
        }
    }
}

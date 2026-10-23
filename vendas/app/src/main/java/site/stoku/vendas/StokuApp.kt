package site.stoku.vendas

import android.app.Application
import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.PersistentCacheSettings

/**
 * Stoku: aplikacioni i telefonit (Android, pa WebView). Të njëjtat të dhëna si stoku.site (Firebase "stoku-appi"):
 * llogaria, dyqani (dyqane/{uid} + pjeset), lejet. Logjika e bashkimit është e njëjtë me web-in (moduli :logjika).
 */
class StokuApp : Application() {
    override fun onCreate() {
        super.onCreate()
        app = this
        ruajRrezimet()
        nisFirebase(this)
        Dyqani.nis(this)
        Sinkronizimi.nis(this)
        Merchandiseri.nis(this)
        Grupi.nis()
    }

    /** Kur aplikacioni mbyllet nga një gabim, arsyeja ruhet dhe tregohet herën tjetër (s'kemi telefon për ta parë ndryshe) */
    private fun ruajRrezimet() {
        val iMeparshmi = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            try {
                val sw = java.io.StringWriter(); e.printStackTrace(java.io.PrintWriter(sw))
                val rreshtat = sw.toString().lines().filter { it.isNotBlank() }
                val tekst = (rreshtat.take(1) + rreshtat.filter { it.contains("site.stoku") }.take(6)).joinToString("\n").take(1500)
                prefs(this).edit().putString("rrezimi_i_fundit", "versioni " + BuildConfig.VERSION_NAME + "\n" + tekst).commit()
            } catch (x: Throwable) { }
            iMeparshmi?.uncaughtException(t, e)
        }
    }

    companion object {
        private const val PREFS = "stoku"
        lateinit var app: Context
            private set
        /** Vetëm për testet (Robolectric): konteksti pa Firebase */
        fun vendosPerProve(c: Context) { app = c }
        fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        fun prefsOse(k: String, ose: String): String = prefs(app).getString(k, ose) ?: ose
        fun prefsOseB(k: String, ose: Boolean): Boolean = prefs(app).getBoolean(k, ose)
        fun vendosPref(k: String, v: String) { prefs(app).edit().putString(k, v).apply() }

        // I njëjti projekt si web-i dhe aplikacioni tel/ (çelësi është publik; mbrojtja = rregullat e Firestore-it)
        private const val PROJEKTI = "stoku-appi"
        private const val CELESI = "AIzaSyCttsCATjbQQ8LaspIb1BnFrsnzusKy6IY"
        private const val APP_ID = "1:107114545225:android:c661e53203861d1877bf98"
        private const val DERGUESI = "107114545225"

        fun nisFirebase(ctx: Context) {
            if (FirebaseApp.getApps(ctx).isNotEmpty()) return
            val opt = FirebaseOptions.Builder()
                .setApplicationId(APP_ID)
                .setApiKey(CELESI)
                .setProjectId(PROJEKTI)
                .setGcmSenderId(DERGUESI)
                .setStorageBucket("$PROJEKTI.firebasestorage.app")
                .build()
            FirebaseApp.initializeApp(ctx, opt)
            // Kopja e Firestore-it në telefon: dëgjuesit punojnë edhe pa internet
            FirebaseFirestore.getInstance().firestoreSettings = FirebaseFirestoreSettings.Builder()
                .setLocalCacheSettings(PersistentCacheSettings.newBuilder().setSizeBytes(100L * 1024 * 1024).build())
                .build()
        }
    }
}

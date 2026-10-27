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
        Njoftimet.krijoKanalin(this)
        // Pas një mbylljeje të papritur: pjesët e tjera nisen vetëm pasi përdoruesi ta ketë parë arsyen (MainActivity),
        // që aplikacioni të mos mbyllet prapë para se të lexohet
        if (prefsOse("rrezimi_i_fundit", "").isEmpty()) nisModulet()
    }

    /** Kur aplikacioni mbyllet nga një gabim, arsyeja ruhet dhe tregohet herën tjetër (s'kemi telefon për ta parë ndryshe) */
    private fun ruajRrezimet() {
        val iMeparshmi = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            try {
                val sw = java.io.StringWriter(); e.printStackTrace(java.io.PrintWriter(sw))
                val rreshtat = sw.toString().lines().filter { it.isNotBlank() }.map { it.trim() }
                val zgjedhur = LinkedHashSet<String>()
                rreshtat.take(4).forEach { zgjedhur.add(it) }
                rreshtat.forEachIndexed { i, r -> if (r.startsWith("Caused by")) rreshtat.drop(i).take(3).forEach { zgjedhur.add(it) } }
                rreshtat.filter { it.contains("site.stoku") }.take(8).forEach { zgjedhur.add(it) }
                val tekst = (listOf("thread " + t.name) + zgjedhur).joinToString("\n").take(2500)
                prefs(this).edit().putString("rrezimi_i_fundit", "versioni " + BuildConfig.VERSION_NAME + "\n" + tekst).commit()
            } catch (x: Throwable) { }
            iMeparshmi?.uncaughtException(t, e)
        }
    }

    companion object {
        var moduletNisur = false
            private set
        /** Dyqani, sinkronizimi (me llogarinë), marketet dhe grupi */
        fun nisModulet() {
            if (moduletNisur) return
            moduletNisur = true
            Dyqani.nis(app)
            Sinkronizimi.nis(app)
            Merchandiseri.nis(app)
            Grupi.nis()
            Regjistri.nis(app) // kujtesa e produkteve: regjistri i përbashkët, pritja, grupi
            try { Push.nis() } catch (e: Exception) { } // njoftimet push (pa Firebase Messaging aplikacioni punon njësoj)
            Admini.nis() // vetëm për administratorin: krejt llogaritë dhe lejet
        }

        private const val PREFS = "stoku"
        lateinit var app: Context
            private set
        /** Vetëm për testet (Robolectric): konteksti pa Firebase */
        fun vendosPerProve(c: Context) { app = c }
        fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        fun prefsOse(k: String, ose: String): String = prefs(app).getString(k, ose) ?: ose
        fun prefsOseB(k: String, ose: Boolean): Boolean = prefs(app).getBoolean(k, ose)
        fun vendosPref(k: String, v: String) { prefs(app).edit().putString(k, v).apply() }
        fun vendosPrefB(k: String, v: Boolean) { prefs(app).edit().putBoolean(k, v).apply() }

        // I njëjti projekt si web-i (çelësi është publik; mbrojtja = rregullat e Firestore-it). APP_ID është aplikacioni Android
        // i regjistruar te Firebase (fillimisht për aplikacionin e vjetër site.stoku.app): mos e fshi te Firebase Console.
        private const val PROJEKTI = "stoku-appi"
        private const val CELESI = "AIzaSyCttsCATjbQQ8LaspIb1BnFrsnzusKy6IY"
        /** Çelësi publik i Firebase-it (si te web-i; mbrojtja = rregullat), për thirrjet direkte të API-së */
        const val CELESI_PUBLIK = CELESI
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

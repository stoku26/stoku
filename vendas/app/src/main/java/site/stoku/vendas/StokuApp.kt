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
        nisFirebase(this)
        Dyqani.nis(this)
        Sinkronizimi.nis(this)
        Merchandiseri.nis(this)
        Grupi.nis()
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

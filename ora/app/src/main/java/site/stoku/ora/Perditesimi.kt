package site.stoku.ora

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Versioni i ri i aplikacionit të orës: GitHub Actions e nxjerr si Release "ora-vNN" (NN = versionCode).
 * Ora e kontrollon vetë (më së shumti një herë në 6 orë) dhe e tregon te lista; instalimi kërkon konfirmim.
 */
object Perditesimi {
    private const val RELEASES = "https://api.github.com/repos/stoku26/stoku/releases?per_page=100"
    /** Kontrolli i fundit dështoi (pa internet / GitHub s'u përgjigj). */
    @Volatile var deshtoi = false

    /** (numri, adresa e APK-së) nëse ka version më të ri se ky; përndryshe null. */
    suspend fun kontrollo(ctx: Context, detyro: Boolean = false): Pair<Int, String>? = withContext(Dispatchers.IO) {
        val pr = ctx.getSharedPreferences("perditesimi", Context.MODE_PRIVATE)
        val ruajtur = pr.getInt("numri", 0)
        val versioni = ctx.packageManager.getPackageInfo(ctx.packageName, 0).longVersionCode.toInt()
        if (!detyro && System.currentTimeMillis() - pr.getLong("koha", 0) < 6 * 3600_000L)
            return@withContext if (ruajtur > versioni) ruajtur to (pr.getString("url", "") ?: "") else null
        deshtoi = false
        try {
            val c = URL(RELEASES).openConnection() as HttpURLConnection
            c.setRequestProperty("Accept", "application/vnd.github+json")
            c.connectTimeout = 10000; c.readTimeout = 15000
            if (c.responseCode != 200) { deshtoi = true; return@withContext null }
            val l = JSONArray(c.inputStream.bufferedReader().readText())
            var m: Pair<Int, String>? = null
            for (i in 0 until l.length()) {
                val r = l.getJSONObject(i)
                val tag = r.optString("tag_name")
                if (!tag.startsWith("ora-v") || r.optBoolean("draft")) continue
                val n = tag.removePrefix("ora-v").toIntOrNull() ?: continue
                val a = r.optJSONArray("assets") ?: continue
                for (j in 0 until a.length()) {
                    val s = a.getJSONObject(j)
                    if (s.optString("name").endsWith(".apk") && (m == null || n > m.first)) m = n to s.optString("browser_download_url")
                }
            }
            pr.edit().putLong("koha", System.currentTimeMillis()).putInt("numri", m?.first ?: 0).putString("url", m?.second ?: "").apply()
            if (m != null && m.first > versioni) m else null
        } catch (e: Exception) { deshtoi = true; null }
    }

    /** Shkarkon APK-në dhe hap instaluesin. Kthen tekstin për ekranin kur s'mund të vazhdojë. */
    suspend fun instalo(ctx: Context, url: String): String? = withContext(Dispatchers.IO) {
        if (!ctx.packageManager.canRequestPackageInstalls()) {
            try {
                ctx.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.packageName)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                return@withContext "Lejo instalimin për Stoku, pastaj shtyp prapë Përditëso."
            } catch (e: Exception) { return@withContext "Ora s'e lejon. Përditësoje me Bugjaeger (shih udhëzimin)." }
        }
        try {
            val dir = File(ctx.cacheDir, "perditesim").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
            val f = File(dir, "stoku-ora.apk")
            var adresa = url; var hapa = 0
            var c: HttpURLConnection
            while (true) {
                c = URL(adresa).openConnection() as HttpURLConnection
                c.instanceFollowRedirects = false
                c.connectTimeout = 15000; c.readTimeout = 60000
                val k = c.responseCode
                if (k in 300..399 && hapa++ < 5) { adresa = c.getHeaderField("Location"); c.disconnect(); continue }
                if (k != 200) return@withContext "Shkarkimi dështoi. Provo prapë."
                break
            }
            c.inputStream.use { i -> f.outputStream().use { o -> i.copyTo(o) } }
            c.disconnect()
            val uri = FileProvider.getUriForFile(ctx, ctx.packageName + ".skedaret", f)
            ctx.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK))
            null
        } catch (e: Exception) { "Ora s'e hapi instaluesin. Përditësoje me Bugjaeger (shih udhëzimin)." }
    }
}

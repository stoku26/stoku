package site.stoku.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import org.json.JSONArray
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Përditësimi i aplikacionit: GitHub Actions e nxjerr çdo version si Release "tel-vNN" (NN = versionCode).
 * Pamja dhe veçoritë vijnë gjithmonë nga stoku.site (përditësohen vetë); APK-ja e re duhet vetëm kur ndryshon
 * pjesa e Android-it. Kontrollohet më së shumti një herë në 6 orë; Android-i e kërkon konfirmimin e instalimit.
 */
object Perditesimi {
    private const val RELEASES = "https://api.github.com/repos/stoku26/stoku/releases?per_page=40"
    private var apkNePritje: File? = null

    fun kontrollo(a: Activity, detyro: Boolean) {
        val pr = StokuApp.prefs(a)
        if (!detyro && System.currentTimeMillis() - pr.getLong("perditesimi_koha", 0) < 6 * 3600_000L) return
        pr.edit().putLong("perditesimi_koha", System.currentTimeMillis()).apply()
        Thread {
            try {
                val c = URL(RELEASES).openConnection() as HttpURLConnection
                c.setRequestProperty("Accept", "application/vnd.github+json")
                c.connectTimeout = 10000; c.readTimeout = 15000
                if (c.responseCode != 200) { if (detyro) toast(a, "S'u kontrollua (internet?)"); return@Thread }
                val l = JSONArray(c.inputStream.bufferedReader().readText())
                var meIRi: Pair<Int, String>? = null
                for (i in 0 until l.length()) {
                    val r = l.getJSONObject(i)
                    val tag = r.optString("tag_name")
                    if (!tag.startsWith("tel-v") || r.optBoolean("draft") || r.optBoolean("prerelease")) continue
                    val n = tag.removePrefix("tel-v").toIntOrNull() ?: continue
                    val asets = r.optJSONArray("assets") ?: continue
                    for (j in 0 until asets.length()) {
                        val s = asets.getJSONObject(j)
                        if (s.optString("name").endsWith(".apk") && (meIRi == null || n > meIRi.first)) meIRi = n to s.optString("browser_download_url")
                    }
                }
                val m = meIRi
                if (m != null && m.first > BuildConfig.VERSION_CODE) a.runOnUiThread { pyet(a, m.first, m.second) }
                else if (detyro) toast(a, "Aplikacioni është i përditësuar")
            } catch (e: Exception) { if (detyro) toast(a, "S'u kontrollua (internet?)") }
        }.start()
    }

    private fun toast(a: Activity, t: String) = a.runOnUiThread { Toast.makeText(a, t, Toast.LENGTH_SHORT).show() }

    private fun pyet(a: Activity, n: Int, url: String) {
        if (a.isFinishing) return
        AlertDialog.Builder(a)
            .setTitle("Version i ri i Stoku-t")
            .setMessage("Ka dalë versioni 1.0.$n i aplikacionit. Të dhënat dhe hyrja mbeten siç janë.")
            .setPositiveButton("Përditëso") { _, _ -> shkarko(a, url) }
            .setNegativeButton("Më vonë", null)
            .show()
    }

    private fun shkarko(a: Activity, url: String) {
        toast(a, "Duke e shkarkuar versionin e ri…")
        Thread {
            try {
                val dir = File(a.cacheDir, "perditesim").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
                val f = File(dir, "stoku.apk")
                var adresa = url
                var c: HttpURLConnection
                var hapa = 0
                while (true) {
                    c = URL(adresa).openConnection() as HttpURLConnection
                    c.instanceFollowRedirects = false
                    c.connectTimeout = 15000; c.readTimeout = 60000
                    val k = c.responseCode
                    if (k in 300..399 && hapa++ < 5) { adresa = c.getHeaderField("Location"); c.disconnect(); continue }
                    if (k != 200) throw Exception("http $k")
                    break
                }
                c.inputStream.use { i -> f.outputStream().use { o -> i.copyTo(o) } }
                c.disconnect()
                a.runOnUiThread { instalo(a, f) }
            } catch (e: Exception) { toast(a, "Shkarkimi dështoi. Provo sërish më vonë.") }
        }.start()
    }

    private fun instalo(a: Activity, f: File) {
        if (!a.packageManager.canRequestPackageInstalls()) {
            // Herën e parë: Android kërkon lejen "Instalo aplikacione të panjohura" për Stoku-n
            apkNePritje = f
            Toast.makeText(a, "Lejo \"Instalo aplikacione\" për Stoku-n, pastaj kthehu mbrapa", Toast.LENGTH_LONG).show()
            try { a.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.packageName))) }
            catch (e: Exception) { /* ok */ }
            return
        }
        apkNePritje = null
        val uri = FileProvider.getUriForFile(a, a.packageName + ".skedaret", f)
        val i = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        try { a.startActivity(i) } catch (e: Exception) { toast(a, "S'u hap instaluesi.") }
    }

    /** Pas kthimit nga leja "Instalo aplikacione": vazhdon instalimi. */
    fun vazhdoNesePritej(a: Activity) {
        val f = apkNePritje ?: return
        if (a.packageManager.canRequestPackageInstalls() && f.exists()) instalo(a, f)
    }
}

package site.stoku.vendas

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.FileProvider
import org.json.JSONArray
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Përditësimi i aplikacionit: GitHub Actions e nxjerr çdo version si Release "vendas-vNN" (NN = versionCode).
 * Aplikacioni (pa WebView) s'merr pamjen nga stoku.site: çdo ndryshim vjen me një APK të re.
 * Kontrollohet më së shumti një herë në 6 orë; Android-i e kërkon konfirmimin e instalimit.
 */
object Perditesimi {
    private const val RELEASES = "https://api.github.com/repos/stoku26/stoku/releases?per_page=100"
    // APK-ja e shkarkuar që pret lejen "Instalo aplikacione": ruhet edhe te prefs, sepse Android-i mund ta mbyllë
    // aplikacionin ndërsa përdoruesi është te Cilësimet (pa këtë, pas kthimit s'ndodhte asgjë për 6 orë)
    private var apkNePritje: File? = null
    @Volatile private var dukeKontrolluar = false

    fun kontrollo(a: Activity, detyro: Boolean) {
        val pr = StokuApp.prefs(a)
        if (!detyro && System.currentTimeMillis() - pr.getLong("perditesimi_koha", 0) < 6 * 3600_000L) return
        if (dukeKontrolluar) { if (detyro) toast(a, "Po kontrollohet…"); return }
        dukeKontrolluar = true
        Thread {
            try {
                val c = URL(RELEASES).openConnection() as HttpURLConnection
                c.setRequestProperty("Accept", "application/vnd.github+json")
                c.connectTimeout = 10000; c.readTimeout = 15000
                if (c.responseCode != 200) { provoPasPak(a); if (detyro) toast(a, "S'u kontrollua (internet?)"); return@Thread }
                // Koha ruhet vetëm pas një kontrolli të suksesshëm: pa internet (ose me kufirin e GitHub-it) provohet sërish
                pr.edit().putLong("perditesimi_koha", System.currentTimeMillis()).apply()
                val l = JSONArray(c.inputStream.bufferedReader().readText())
                var meIRi: Pair<Int, String>? = null
                for (i in 0 until l.length()) {
                    val r = l.getJSONObject(i)
                    val tag = r.optString("tag_name")
                    if (!tag.startsWith("vendas-v") || r.optBoolean("draft") || r.optBoolean("prerelease")) continue
                    val n = tag.removePrefix("vendas-v").toIntOrNull() ?: continue
                    val asets = r.optJSONArray("assets") ?: continue
                    for (j in 0 until asets.length()) {
                        val s = asets.getJSONObject(j)
                        if (s.optString("name").endsWith(".apk") && (meIRi == null || n > meIRi.first)) meIRi = n to s.optString("browser_download_url")
                    }
                }
                val m = meIRi
                if (m != null && m.first > BuildConfig.VERSION_CODE) a.runOnUiThread { pyet(a, m.first, m.second) }
                else if (detyro) toast(a, "Aplikacioni është i përditësuar")
            } catch (e: Exception) { provoPasPak(a); if (detyro) toast(a, "S'u kontrollua (internet?)") }
            finally { dukeKontrolluar = false }
        }.start()
    }

    // Pas një kontrolli të dështuar (pa internet, kufiri i GitHub-it) provohet sërish pas 30 min, jo në çdo rikthim
    private fun provoPasPak(a: Activity) {
        StokuApp.prefs(a).edit().putLong("perditesimi_koha", System.currentTimeMillis() - 6 * 3600_000L + 30 * 60_000L).apply()
    }

    private fun toast(a: Activity, t: String) = a.runOnUiThread { Toast.makeText(a.applicationContext, t, Toast.LENGTH_SHORT).show() }

    private fun pyet(a: Activity, n: Int, url: String) {
        if (a.isFinishing || a.isDestroyed) return // aktiviteti u rikrijua ndërkohë (p.sh. u ndryshua madhësia e shkronjave)
        AlertDialog.Builder(a)
            .setTitle("Version i ri i Stoku-t")
            .setMessage("Ka dalë versioni 0.1.$n i aplikacionit. Të dhënat dhe hyrja mbeten siç janë.")
            .setPositiveButton("Përditëso") { _, _ -> shkarko(a, n, url) }
            .setNegativeButton("Më vonë", null)
            .show()
    }

    private fun mb(n: Long): String = String.format(java.util.Locale.ROOT, "%.1f", n / (1024.0 * 1024.0)).replace('.', ',') + " MB"

    /** Shkarkimi me shirit (sa MB, përqindja) dhe "Anulo": më parë s'dukej asgjë për gjysmë minute në internet të ngadaltë. */
    private fun shkarko(a: Activity, n: Int, url: String) {
        if (a.isFinishing || a.isDestroyed) return
        val anulo = AtomicBoolean(false)
        val dp = a.resources.displayMetrics.density
        val shiriti = ProgressBar(a, null, android.R.attr.progressBarStyleHorizontal).apply { isIndeterminate = true; max = 100 }
        val teksti = TextView(a).apply { text = "Duke u lidhur…"; setPadding(0, (8 * dp).toInt(), 0, 0) }
        val kutia = LinearLayout(a).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((24 * dp).toInt(), (12 * dp).toInt(), (24 * dp).toInt(), 0)
            addView(shiriti); addView(teksti)
        }
        val d = AlertDialog.Builder(a)
            .setTitle("Duke e shkarkuar versionin 0.1.$n")
            .setView(kutia)
            .setCancelable(false)
            .setNegativeButton("Anulo") { _, _ -> anulo.set(true) }
            .show()
        fun mbyll() = a.runOnUiThread { try { if (d.isShowing) d.dismiss() } catch (e: Exception) { /* aktiviteti u mbyll */ } }
        Thread {
            var f: File? = null
            try {
                val dir = File(a.cacheDir, "perditesim").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
                val apk = File(dir, "stoku.apk")
                f = apk
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
                val gjithsej = c.contentLengthLong
                var lexuar = 0L
                var iFundit = 0L
                c.inputStream.use { i -> apk.outputStream().use { o ->
                    val buf = ByteArray(64 * 1024)
                    while (!anulo.get()) {
                        val k = i.read(buf)
                        if (k < 0) break
                        o.write(buf, 0, k)
                        lexuar += k
                        val tani = System.currentTimeMillis()
                        if (tani - iFundit >= 250) {
                            iFundit = tani
                            val l = lexuar
                            a.runOnUiThread {
                                if (gjithsej > 0) {
                                    val pq = (l * 100 / gjithsej).toInt().coerceIn(0, 100)
                                    shiriti.isIndeterminate = false; shiriti.progress = pq
                                    teksti.text = mb(l) + " nga " + mb(gjithsej) + " (" + pq + "%)"
                                } else teksti.text = mb(l)
                            }
                        }
                    }
                } }
                c.disconnect()
                if (anulo.get()) { apk.delete(); return@Thread }
                if (gjithsej > 0 && lexuar != gjithsej) throw Exception("i paplotë $lexuar/$gjithsej")
                a.runOnUiThread {
                    try { if (d.isShowing) d.dismiss() } catch (e: Exception) { /* ok */ }
                    instalo(a, apk, n)
                }
            } catch (e: Exception) {
                f?.delete()
                mbyll()
                if (!anulo.get()) toast(a, "Shkarkimi dështoi. Provo sërish më vonë.")
            }
        }.start()
    }

    private fun instalo(a: Activity, f: File, n: Int) {
        if (!a.packageManager.canRequestPackageInstalls()) {
            // Herën e parë: Android kërkon lejen "Instalo aplikacione të panjohura" për Stoku-n
            apkNePritje = f
            StokuApp.prefs(a).edit().putString("perditesimi_apk", f.absolutePath).putInt("perditesimi_apk_n", n).apply()
            Toast.makeText(a, "Lejo \"Instalo aplikacione\" për Stoku-n, pastaj kthehu mbrapa", Toast.LENGTH_LONG).show()
            try { a.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.packageName))) }
            catch (e: Exception) { /* ok */ }
            return
        }
        apkNePritje = null
        StokuApp.prefs(a).edit().remove("perditesimi_apk").remove("perditesimi_apk_n").apply()
        val uri = FileProvider.getUriForFile(a, a.packageName + ".skedaret", f)
        val i = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        try { a.startActivity(i) } catch (e: Exception) { toast(a, "S'u hap instaluesi.") }
    }

    /** Pas kthimit nga leja "Instalo aplikacione": vazhdon instalimi. */
    fun vazhdoNesePritej(a: Activity) {
        val pr = StokuApp.prefs(a)
        val f = apkNePritje ?: pr.getString("perditesimi_apk", null)?.let { File(it) } ?: return
        val n = pr.getInt("perditesimi_apk_n", 0)
        // Skedari mungon, ose aplikacioni u përditësua ndërkohë në një mënyrë tjetër (APK-ja e vjetër s'instalohet më)
        if (!f.exists() || n <= BuildConfig.VERSION_CODE) {
            apkNePritje = null; pr.edit().remove("perditesimi_apk").remove("perditesimi_apk_n").apply()
            f.delete(); return
        }
        if (a.packageManager.canRequestPackageInstalls()) instalo(a, f, n)
    }
}

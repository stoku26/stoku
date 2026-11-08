package site.stoku.vendas

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import kotlinx.coroutines.flow.MutableStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Përditësimi i aplikacionit: GitHub Actions e nxjerr çdo version si Release "vendas-vNN" (NN = versionCode).
 * Aplikacioni (pa WebView) s'merr pamjen nga stoku.site: çdo ndryshim vjen me një APK të re.
 * Hyrja 33 (pronari, "ideja 5"): kontrollohet sa herë hyn në aplikacion (jo më shpesh se 2 min, me ETag) dhe versioni i ri del si
 * faqe e plotë (ui/PerditesimiUI.kt: "Përditëso Stoku-n", versionet, "Çfarë ka të re" nga trupi i Release-it, shkarkimi me shirit).
 * Android-i e kërkon konfirmimin e instalimit.
 */
object Perditesimi {
    private const val RELEASES = "https://api.github.com/repos/stoku26/stoku/releases?per_page=20"
    /** Kalimet e shpejta jashtë dhe brenda (leja e kamerës, zgjedhja e skedarit) s'e përsërisin kontrollin */
    private const val PUSHIMI_MS = 2 * 60_000L
    // APK-ja e shkarkuar që pret lejen "Instalo aplikacione": ruhet edhe te prefs, sepse Android-i mund ta mbyllë
    // aplikacionin ndërsa përdoruesi është te Cilësimet (pa këtë, pas kthimit s'ndodhte asgjë)
    private var apkNePritje: File? = null
    @Volatile private var dukeKontrolluar = false
    private val anuluar = AtomicBoolean(false)

    /** Një hyrje e "Çfarë ka të re" nga trupi i Release-it (rreshtat "[nr] titulli" dhe "• pika", nga TeRejat.kt te workflow-i) */
    data class Hyrja(val nr: Int, val titulli: String, val pikat: List<String>)
    /** faza: "pyet" (ka version të ri), "shkarkim", "gabim" */
    data class Gjendja(val n: Int, val url: String, val teReja: List<Hyrja>, val faza: String = "pyet",
                       val lexuar: Long = 0, val gjithsej: Long = 0, val mesazhi: String = "")
    /** null = faqja e përditësimit s'duket */
    val gjendja = MutableStateFlow<Gjendja?>(null)

    fun kontrollo(a: Activity, detyro: Boolean) {
        val pr = StokuApp.prefs(a)
        if (gjendja.value != null) return // faqja është e hapur (ose po shkarkohet)
        if (!detyro && System.currentTimeMillis() - pr.getLong("perditesimi_koha", 0) < PUSHIMI_MS) return
        if (dukeKontrolluar) { if (detyro) toast(a, "Po kontrollohet…"); return }
        dukeKontrolluar = true
        Thread {
            try {
                val c = URL(RELEASES).openConnection() as HttpURLConnection
                c.setRequestProperty("Accept", "application/vnd.github+json")
                // ETag: pa publikim të ri GitHub-i kthen 304, që s'numërohet te kufiri 60 kërkesa në orë për IP (në një market me
                // disa telefona në të njëjtin Wi-Fi kontrolli "sa herë hyn" përndryshe e mbaronte shpejt)
                val etag = pr.getString("perditesimi_etag", null)
                val rez0 = pr.getString("perditesimi_rez", null)
                if (etag != null && rez0 != null) c.setRequestProperty("If-None-Match", etag)
                c.connectTimeout = 10000; c.readTimeout = 15000
                val k = c.responseCode
                val rez = when (k) {
                    304 -> try { JSONObject(rez0 ?: "") } catch (e: Exception) { null }
                    200 -> {
                        val r = meIRi(JSONArray(c.inputStream.bufferedReader().use { it.readText() }))
                        pr.edit().putString("perditesimi_etag", c.getHeaderField("ETag")).putString("perditesimi_rez", r.toString()).apply()
                        r
                    }
                    else -> null
                }
                c.disconnect()
                if (rez == null) {
                    if (k == 304) pr.edit().remove("perditesimi_etag").apply() // kopja u prish: herën tjetër pa ETag
                    provoPasPak(a); if (detyro) toast(a, "S'u kontrollua (internet?)"); return@Thread
                }
                // Koha ruhet vetëm pas një kontrolli të suksesshëm: pa internet (ose me kufirin e GitHub-it) provohet sërish
                pr.edit().putLong("perditesimi_koha", System.currentTimeMillis()).apply()
                val n = rez.optInt("n"); val url = rez.optString("url")
                if (n > BuildConfig.VERSION_CODE && url.isNotEmpty()) {
                    val reja = teReja(rez.optString("body"))
                    a.runOnUiThread { if (gjendja.value == null) gjendja.value = Gjendja(n, url, reja) }
                } else if (detyro) toast(a, "Aplikacioni është i përditësuar")
            } catch (e: Exception) { provoPasPak(a); if (detyro) toast(a, "S'u kontrollua (internet?)") }
            finally { dukeKontrolluar = false }
        }.start()
    }

    /** Release-i më i ri "vendas-vNN" me APK: { n, url, body } (n = 0 kur s'ka) */
    private fun meIRi(l: JSONArray): JSONObject {
        var m = JSONObject().put("n", 0)
        for (i in 0 until l.length()) {
            val r = l.getJSONObject(i)
            val tag = r.optString("tag_name")
            if (!tag.startsWith("vendas-v") || r.optBoolean("draft") || r.optBoolean("prerelease")) continue
            val n = tag.removePrefix("vendas-v").toIntOrNull() ?: continue
            if (n <= m.optInt("n")) continue
            val asets = r.optJSONArray("assets") ?: continue
            for (j in 0 until asets.length()) {
                val s = asets.getJSONObject(j)
                if (s.optString("name").endsWith(".apk")) { m = JSONObject().put("n", n).put("url", s.optString("browser_download_url")).put("body", r.optString("body")); break }
            }
        }
        return m
    }

    /** "Çfarë ka të re" e versionit të ri: vetëm hyrjet që ky aplikacion s'i ka (nr më i madh se e fundit te TeRejat) */
    fun teReja(body: String): List<Hyrja> {
        val ime = TeRejat.LISTA.maxOfOrNull { it.nr } ?: 0
        val dalja = ArrayList<Hyrja>()
        var nr = -1; var titulli = ""; var pikat = ArrayList<String>()
        fun mbyll() { if (nr > ime && pikat.isNotEmpty()) dalja.add(Hyrja(nr, titulli, pikat)); nr = -1; pikat = ArrayList() }
        val koka = Regex("^\\[(\\d+)\\] (.+)$")
        for (r0 in body.lines()) {
            val r = r0.trim()
            val m = koka.find(r)
            if (m != null) { mbyll(); nr = m.groupValues[1].toInt(); titulli = m.groupValues[2] }
            else if (r.startsWith("• ") && nr >= 0) pikat.add(r.removePrefix("• ").trim())
        }
        mbyll()
        return dalja.sortedByDescending { it.nr }
    }

    // Pas një kontrolli të dështuar (pa internet, kufiri i GitHub-it) provohet sërish pas 5 min, jo në çdo rikthim
    private fun provoPasPak(a: Activity) {
        StokuApp.prefs(a).edit().putLong("perditesimi_koha", System.currentTimeMillis() - PUSHIMI_MS + 5 * 60_000L).apply()
    }

    private fun toast(a: Activity, t: String) = a.runOnUiThread { Toast.makeText(a.applicationContext, t, Toast.LENGTH_SHORT).show() }

    /** "Më vonë": faqja mbyllet; del sërish herën tjetër që hyn në aplikacion */
    fun mbyll() { if (gjendja.value?.faza != "shkarkim") gjendja.value = null }
    fun anulo() { anuluar.set(true) }

    fun mb(n: Long): String = String.format(java.util.Locale.ROOT, "%.1f", n / (1024.0 * 1024.0)).replace('.', ',') + " MB"

    /** Shkarkimi brenda faqes (shiriti, sa MB, "Anulo"); në fund hapet instaluesi i Android-it */
    fun shkarko(a: Activity) {
        val g = gjendja.value ?: return
        if (g.faza == "shkarkim" || a.isFinishing || a.isDestroyed) return
        anuluar.set(false)
        gjendja.value = g.copy(faza = "shkarkim", lexuar = 0, gjithsej = 0, mesazhi = "")
        Thread {
            var f: File? = null
            try {
                val dir = File(a.cacheDir, "perditesim").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
                val apk = File(dir, "stoku.apk")
                f = apk
                var adresa = g.url
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
                    while (!anuluar.get()) {
                        val k = i.read(buf)
                        if (k < 0) break
                        o.write(buf, 0, k)
                        lexuar += k
                        val tani = System.currentTimeMillis()
                        if (tani - iFundit >= 250) { iFundit = tani; gjendja.value = gjendja.value?.copy(lexuar = lexuar, gjithsej = gjithsej) }
                    }
                } }
                c.disconnect()
                if (anuluar.get()) { apk.delete(); gjendja.value = gjendja.value?.copy(faza = "pyet"); return@Thread }
                if (gjithsej > 0 && lexuar != gjithsej) throw Exception("i paplotë $lexuar/$gjithsej")
                a.runOnUiThread { gjendja.value = null; if (!a.isFinishing && !a.isDestroyed) instalo(a, apk, g.n) }
            } catch (e: Exception) {
                f?.delete()
                gjendja.value = gjendja.value?.copy(faza = if (anuluar.get()) "pyet" else "gabim", mesazhi = "Shkarkimi dështoi. Kontrollo internetin dhe provo prapë.")
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

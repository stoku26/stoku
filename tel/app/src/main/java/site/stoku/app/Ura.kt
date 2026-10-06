package site.stoku.app

import android.content.Intent
import android.graphics.Color
import android.util.Base64
import android.webkit.JavascriptInterface
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import java.io.File

/**
 * Ura mes web-it (stoku.site) dhe telefonit: window.StokuAndroid te faqja.
 * WebView hap vetëm stoku.site (adresat e tjera hapen jashtë), ndaj kjo urë s'arrihet nga faqe të tjera.
 */
class Ura(private val a: MainActivity) {
    @JavascriptInterface fun versioni(): Int = BuildConfig.VERSION_CODE
    @JavascriptInterface fun tokenFcm(): String = StokuApp.tokeni(a)
    @JavascriptInterface fun leja(): String = a.gjendjaELejes()
    @JavascriptInterface fun kerkoLejen() { a.runOnUiThread { a.kerkoLejenNjoftimeve() } }

    @JavascriptInterface fun njofto(titulli: String?, teksti: String?, tag: String?, url: String?) {
        Njoftimet.shfaq(a, titulli ?: "Stoku", teksti ?: "", tag ?: "stoku", url ?: "")
    }

    /** Skedar nga web-i (eksporti në Excel, PDF...): ruhet përkohësisht dhe hapet menyja "Ndaj" e Android-it. */
    @JavascriptInterface fun ndaj(emri: String?, mime: String?, base64: String?, titulli: String?) {
        try {
            val bajtet = Base64.decode(base64 ?: return, Base64.DEFAULT)
            val dir = File(a.cacheDir, "ndarje").apply { mkdirs() }
            dir.listFiles()?.forEach { if (System.currentTimeMillis() - it.lastModified() > 3600_000) it.delete() }
            val emriI = (emri ?: "skedar").replace(Regex("[^A-Za-z0-9._ -]"), "_").ifBlank { "skedar" }
            val f = File(dir, emriI)
            f.writeBytes(bajtet)
            val uri = FileProvider.getUriForFile(a, a.packageName + ".skedaret", f)
            val i = Intent(Intent.ACTION_SEND).setType(mime?.ifBlank { null } ?: "application/octet-stream")
                .putExtra(Intent.EXTRA_STREAM, uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            a.runOnUiThread { a.startActivity(Intent.createChooser(i, titulli?.ifBlank { null } ?: emriI)) }
        } catch (e: Exception) { /* skedar i prishur */ }
    }

    /** Ngjyra e sfondit të Stoku-t (tema e çelët / e errët) → shiritat e sistemit sipër dhe poshtë. */
    @JavascriptInterface fun ngjyrat(ngjyra: String?) {
        val c = try { Color.parseColor(ngjyra ?: return) } catch (e: Exception) { return }
        val ielet = (Color.red(c) * 299 + Color.green(c) * 587 + Color.blue(c) * 114) / 1000 > 140
        a.runOnUiThread {
            a.window.statusBarColor = c
            a.window.navigationBarColor = c
            val k = WindowCompat.getInsetsController(a.window, a.window.decorView)
            k.isAppearanceLightStatusBars = ielet
            k.isAppearanceLightNavigationBars = ielet
        }
    }

    @JavascriptInterface fun kontrolloPerditesimin() { a.runOnUiThread { Perditesimi.kontrollo(a, true) } }
}

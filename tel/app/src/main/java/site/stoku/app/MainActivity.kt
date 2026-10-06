package site.stoku.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.view.View
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File

class MainActivity : Activity() {
    private lateinit var web: WebView
    private var skedarCb: ValueCallback<Array<Uri>>? = null
    private var fotoUri: Uri? = null
    private var kerkesaKamere: PermissionRequest? = null
    private var pritKamerenPerSkedar: WebChromeClient.FileChooserParams? = null

    companion object {
        const val EXTRA_URL = "url"
        private const val K_SKEDARI = 11
        private const val L_KAMERA = 21
        private const val L_NJOFTIMET = 22
        private const val L_KAMERA_SKEDAR = 23

        @Volatile var nePerpara = false
        private var aktive: MainActivity? = null
        private val ui = Handler(Looper.getMainLooper())

        /** Tokeni i ri i njoftimeve → web-i e regjistron te grupi dhe te njoftimi ditor. */
        fun tokeniIRi(t: String) {
            ui.post { aktive?.thirrJs("window.dispatchEvent(new CustomEvent('stoku-android-token',{detail:" + JSONObject.quote(t) + "}))") }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        aktive = this
        web = WebView(this)
        web.setBackgroundColor(Color.TRANSPARENT)
        setContentView(web)

        val s = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.databaseEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        s.allowFileAccess = false
        s.allowContentAccess = true
        s.cacheMode = WebSettings.LOAD_DEFAULT
        s.setSupportMultipleWindows(false)
        s.userAgentString = s.userAgentString + " StokuAndroid/" + BuildConfig.VERSION_CODE
        CookieManager.getInstance().setAcceptCookie(true)
        web.addJavascriptInterface(Ura(this), "StokuAndroid")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val u = req.url
                if (eStokut(u)) return false
                hapJashte(u); return true
            }
            override fun onReceivedError(view: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) faqjaPaInternet()
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(r: PermissionRequest) {
                ui.post {
                    if (!eStokut(r.origin) || !r.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) { r.deny(); return@post }
                    if (kaLeje(Manifest.permission.CAMERA)) r.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
                    else { kerkesaKamere = r; requestPermissions(arrayOf(Manifest.permission.CAMERA), L_KAMERA) }
                }
            }
            override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
                skedarCb?.onReceiveValue(null)
                skedarCb = cb
                val foto = p.acceptTypes.any { it.startsWith("image") }
                if (foto && p.isCaptureEnabled) {
                    if (kaLeje(Manifest.permission.CAMERA)) hapKameren()
                    else { pritKamerenPerSkedar = p; requestPermissions(arrayOf(Manifest.permission.CAMERA), L_KAMERA_SKEDAR) }
                } else hapZgjedhesin(p)
                return true
            }
        }
        web.setDownloadListener { url, _, _, _, _ -> if (url.startsWith("http")) hapJashte(Uri.parse(url)) }

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl(adresaNga(intent) ?: (StokuApp.BAZA + "index.html"))

        StokuApp.rifreskoKonfigurimin(this)
        kerkoLejenNjoftimeveHerenEPare()
        Perditesimi.kontrollo(this, false)
    }

    private fun eStokut(u: Uri?): Boolean = u != null && u.scheme == "https" && (u.host == "stoku.site" || u.host == "www.stoku.site")

    private fun adresaNga(i: Intent?): String? {
        val e = i?.getStringExtra(EXTRA_URL)
        if (!e.isNullOrBlank()) {
            val u = try { java.net.URI(StokuApp.BAZA).resolve(e).toString() } catch (x: Exception) { null }
            return if (u != null && eStokut(Uri.parse(u))) u else null
        }
        val d = i?.data
        return if (eStokut(d)) d.toString() else null
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        adresaNga(intent)?.let { web.loadUrl(it) }
    }

    fun thirrJs(js: String) { if (this::web.isInitialized) web.evaluateJavascript(js, null) }

    private fun hapJashte(u: Uri) {
        try { startActivity(Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: ActivityNotFoundException) { /* s'ka aplikacion */ }
    }

    private fun faqjaPaInternet() {
        val html = "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head>" +
            "<body style='font-family:sans-serif;background:#f6f5f2;color:#14161b;display:flex;align-items:center;justify-content:center;height:90vh;text-align:center'>" +
            "<div><h2>S'ka lidhje me internetin</h2><p>Hapja e parë e Stoku-t kërkon internet.</p>" +
            "<p><a href='" + StokuApp.BAZA + "index.html' style='display:inline-block;padding:12px 22px;background:#1f5fd1;color:#fff;border-radius:12px;text-decoration:none'>Provo sërish</a></p></div></body></html>"
        web.loadDataWithBaseURL(StokuApp.BAZA, html, "text/html", "utf-8", null)
    }

    // ---------- Lejet ----------
    private fun kaLeje(p: String) = checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED

    private fun kerkoLejenNjoftimeveHerenEPare() {
        val pr = StokuApp.prefs(this)
        if (Njoftimet.duhetLeja() && !kaLeje(Manifest.permission.POST_NOTIFICATIONS) && !pr.getBoolean("pyetur_njoftimet", false)) {
            pr.edit().putBoolean("pyetur_njoftimet", true).apply()
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), L_NJOFTIMET)
        }
    }

    fun kerkoLejenNjoftimeve() {
        if (Njoftimet.duhetLeja() && !kaLeje(Manifest.permission.POST_NOTIFICATIONS)) {
            StokuApp.prefs(this).edit().putBoolean("pyetur_njoftimet", true).apply()
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), L_NJOFTIMET)
        } else lajmeroLejen()
    }

    fun gjendjaELejes(): String = when {
        Njoftimet.lejuar(this) -> "granted"
        Njoftimet.duhetLeja() && !StokuApp.prefs(this).getBoolean("pyetur_njoftimet", false) -> "default"
        else -> "denied"
    }

    private fun lajmeroLejen() {
        thirrJs("window.__stokuLejaCb && window.__stokuLejaCb(" + JSONObject.quote(gjendjaELejes()) + ")")
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, rez: IntArray) {
        super.onRequestPermissionsResult(code, perms, rez)
        val ok = rez.isNotEmpty() && rez[0] == PackageManager.PERMISSION_GRANTED
        when (code) {
            L_KAMERA -> {
                val r = kerkesaKamere; kerkesaKamere = null
                if (r != null) { if (ok) r.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) else r.deny() }
            }
            L_KAMERA_SKEDAR -> {
                val p = pritKamerenPerSkedar; pritKamerenPerSkedar = null
                if (ok) hapKameren() else if (p != null) hapZgjedhesin(p) else { skedarCb?.onReceiveValue(null); skedarCb = null }
            }
            L_NJOFTIMET -> lajmeroLejen()
        }
    }

    // ---------- Skedarët: foto nga kamera, galeria, Excel ----------
    private fun hapKameren() {
        try {
            val dir = File(cacheDir, "foto").apply { mkdirs() }
            val f = File(dir, "foto_" + System.currentTimeMillis() + ".jpg")
            fotoUri = FileProvider.getUriForFile(this, "$packageName.skedaret", f)
            val i = Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, fotoUri)
                .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            startActivityForResult(i, K_SKEDARI)
        } catch (e: Exception) { skedarCb?.onReceiveValue(null); skedarCb = null }
    }

    private fun hapZgjedhesin(p: WebChromeClient.FileChooserParams) {
        fotoUri = null
        try { startActivityForResult(p.createIntent(), K_SKEDARI) }
        catch (e: Exception) {
            try { startActivityForResult(Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*"), K_SKEDARI) }
            catch (e2: Exception) { skedarCb?.onReceiveValue(null); skedarCb = null }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(code: Int, rez: Int, data: Intent?) {
        super.onActivityResult(code, rez, data)
        if (code != K_SKEDARI) return
        val cb = skedarCb; skedarCb = null
        if (cb == null) return
        val u = fotoUri
        val res: Array<Uri>? = when {
            rez != RESULT_OK -> null
            u != null -> arrayOf(u)
            data?.clipData != null -> Array(data.clipData!!.itemCount) { data.clipData!!.getItemAt(it).uri }
            data?.data != null -> arrayOf(data.data!!)
            else -> null
        }
        fotoUri = null
        cb.onReceiveValue(res)
    }

    // ---------- Cikli i jetës ----------
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
    override fun onResume() {
        super.onResume(); nePerpara = true; web.onResume()
        Perditesimi.vazhdoNesePritej(this)
    }
    override fun onPause() {
        nePerpara = false; web.onPause(); CookieManager.getInstance().flush(); super.onPause()
    }
    override fun onSaveInstanceState(out: Bundle) { super.onSaveInstanceState(out); web.saveState(out) }
    override fun onDestroy() {
        if (aktive === this) aktive = null
        web.visibility = View.GONE
        super.onDestroy()
    }
}

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
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
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
    // v241: faqja kërkon vendndodhjen (marketet): pret lejen e Android-it
    private var kerkesaVendi: Pair<String, GeolocationPermissions.Callback>? = null
    // Ngarkimet që i nis vetë aplikacioni (njoftimi, "Provo sërish" pas faqes pa internet): kur faqja hapet mirë, historia
    // e vjetër fshihet, që "Mbrapa" te faqja kryesore ta mbyllë aplikacionin e jo të kthejë te faqja pa internet
    private var pastroHistorine = false
    private var gabimNeNgarkim = false

    // v238 (PDA, "Fshih tastierën" te Stoku): dritarja s'e hap vetë tastierën në ekran, dhe faqja e mbyll sa herë që preket
    // një fushë (inputmode="none" s'mjafton te disa WebView/Zebra). Tastiera fizike dhe skaneri punojnë si zakonisht.
    fun vendosTastierenFshehur(po: Boolean) {
        val adjust = window.attributes.softInputMode and android.view.WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST
        window.setSoftInputMode(adjust or (if (po) android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN else android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_UNSPECIFIED))
        if (po) fshihTastieren()
    }
    fun fshihTastieren() {
        if (!::web.isInitialized) return
        try { androidx.core.view.WindowCompat.getInsetsController(window, web).hide(androidx.core.view.WindowInsetsCompat.Type.ime()) } catch (e: Exception) { /* ok */ }
        try { (getSystemService(INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager).hideSoftInputFromWindow(web.windowToken, 0) } catch (e: Exception) { /* ok */ }
    }
    // Procesi i faqes ra: kjo WebView s'përdoret më (vetëm hiqet), aktiviteti rikrijohet me një të re
    private var webRa = false

    companion object {
        const val EXTRA_URL = "url"
        private const val RIPROVO = "stoku-riprovo"
        private const val K_SKEDARI = 11
        private const val L_KAMERA = 21
        private const val L_NJOFTIMET = 22
        private const val L_KAMERA_SKEDAR = 23
        private const val L_VENDI = 24

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
        s.setGeolocationEnabled(true) // v241: marketet (GPS)
        s.userAgentString = s.userAgentString + " StokuAndroid/" + BuildConfig.VERSION_CODE
        CookieManager.getInstance().setAcceptCookie(true)
        web.addJavascriptInterface(Ura(this), "StokuAndroid")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val u = req.url
                if (eStokut(u) && u.fragment == RIPROVO) { pastroHistorine = true; view.loadUrl(StokuApp.BAZA + "index.html"); return true }
                if (eStokut(u)) return false
                hapJashte(u); return true
            }
            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) { gabimNeNgarkim = false }
            override fun onReceivedError(view: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) { gabimNeNgarkim = true; faqjaPaInternet() }
            }
            override fun onPageFinished(view: WebView, url: String?) {
                if (pastroHistorine && !gabimNeNgarkim) { pastroHistorine = false; view.clearHistory() }
            }
            // Procesi i WebView-it ra (p.sh. pa memorie gjatë skanimit ose një importi të madh): faqja rihapet,
            // në vend që Android-i ta mbyllë krejt aplikacionin
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                if (view === web && !webRa) {
                    webRa = true
                    (web.parent as? ViewGroup)?.removeView(web)
                    web.destroy()
                    recreate()
                }
                return true
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
            // v241: vetëm stoku.site e merr vendndodhjen (marketet); leja e Android-it kërkohet herën e parë
            override fun onGeolocationPermissionsShowPrompt(origin: String?, cb: GeolocationPermissions.Callback?) {
                if (origin == null || cb == null) return
                if (!eStokut(Uri.parse(origin))) { cb.invoke(origin, false, false); return }
                if (kaLeje(Manifest.permission.ACCESS_FINE_LOCATION) || kaLeje(Manifest.permission.ACCESS_COARSE_LOCATION)) { cb.invoke(origin, true, false); return }
                kerkesaVendi?.let { it.second.invoke(it.first, false, false) }
                kerkesaVendi = Pair(origin, cb)
                requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), L_VENDI)
            }
            override fun onGeolocationPermissionsHidePrompt() { kerkesaVendi = null }
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

        // restoreState kthen null kur s'u ruajt asgjë (p.sh. aplikacioni u mbyll para se faqja e parë të ngarkohej)
        val rikthyer = savedInstanceState != null && (try { web.restoreState(savedInstanceState) } catch (e: Exception) { null }) != null
        if (!rikthyer) web.loadUrl(adresaNga(intent) ?: (StokuApp.BAZA + "index.html"))

        StokuApp.rifreskoKonfigurimin(this)
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
        val u = adresaNga(intent) ?: return
        val tani = web.url
        // Stoku është tashmë i hapur: hapet vetëm pamja (njoftimet, afatet…), pa e ringarkuar faqen
        if (tani != null && eStokut(Uri.parse(tani)) && u.contains("#")) {
            val hash = "#" + u.substringAfter("#")
            web.evaluateJavascript("(function(){try{return window.__stokuHapNgaNjoftimi?(window.__stokuHapNgaNjoftimi(" +
                JSONObject.quote(hash) + ")!==false):false}catch(e){return false}})()") { r ->
                if (r != "true") { pastroHistorine = true; web.loadUrl(u) }
            }
        } else { pastroHistorine = true; web.loadUrl(u) }
    }

    fun thirrJs(js: String) { if (this::web.isInitialized && !webRa) web.evaluateJavascript(js, null) }

    private fun hapJashte(u: Uri) {
        try { startActivity(Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: ActivityNotFoundException) { /* s'ka aplikacion */ }
    }

    private fun faqjaPaInternet() {
        // Ngarkimi dështoi: historia e mëparshme s'fshihet (pastrohet vetëm kur faqja e Stoku-t hapet mirë, p.sh. pas "Provo sërish")
        pastroHistorine = false
        val html = "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head>" +
            "<body style='font-family:sans-serif;background:#f6f5f2;color:#14161b;display:flex;align-items:center;justify-content:center;height:90vh;text-align:center'>" +
            "<div><h2>S'ka lidhje me internetin</h2><p>Hapja e parë e Stoku-t kërkon internet.</p>" +
            "<p><a href='" + StokuApp.BAZA + "index.html#" + RIPROVO + "' style='display:inline-block;padding:12px 22px;background:#1f5fd1;color:#fff;border-radius:12px;text-decoration:none'>Provo sërish</a></p></div></body></html>"
        web.loadDataWithBaseURL(StokuApp.BAZA, html, "text/html", "utf-8", null)
    }

    // ---------- Lejet ----------
    private fun kaLeje(p: String) = checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED

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
            L_VENDI -> {
                val k = kerkesaVendi; kerkesaVendi = null
                val ndonje = rez.any { it == PackageManager.PERMISSION_GRANTED } // edhe "afërsisht" mjafton për marketin
                k?.second?.invoke(k.first, ndonje, false)
            }
        }
    }

    // ---------- Skedarët: foto nga kamera, galeria, Excel ----------
    private fun hapKameren() {
        try {
            val dir = File(cacheDir, "foto").apply { mkdirs() }
            dir.listFiles()?.forEach { if (System.currentTimeMillis() - it.lastModified() > 86400_000L) it.delete() }
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
        if (!webRa && web.canGoBack()) web.goBack() else super.onBackPressed()
    }
    override fun onResume() {
        super.onResume(); if (!webRa) web.onResume()
        Perditesimi.vazhdoNesePritej(this)
        Perditesimi.kontrollo(this, false) // më së shumti një herë në 6 orë (aplikacioni mund të rrijë i hapur me ditë)
    }
    override fun onPause() {
        if (!webRa) web.onPause(); CookieManager.getInstance().flush(); super.onPause()
    }
    override fun onSaveInstanceState(out: Bundle) {
        super.onSaveInstanceState(out)
        if (!webRa) try { web.saveState(out) } catch (e: Exception) { /* hapet nga fillimi */ }
    }
    override fun onDestroy() {
        if (aktive === this) aktive = null
        if (!webRa) {
            web.visibility = View.GONE
            (web.parent as? ViewGroup)?.removeView(web)
            web.destroy()
        }
        super.onDestroy()
    }
}

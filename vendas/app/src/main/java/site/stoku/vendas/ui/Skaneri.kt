package site.stoku.vendas.ui

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.os.SystemClock
import android.view.MotionEvent
import androidx.camera.core.FocusMeteringAction
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.ui.draw.shadow
import java.util.concurrent.TimeUnit
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.statusBars
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import site.stoku.logjika.VotimiIBarkodit
import site.stoku.vendas.StokuApp
import java.util.concurrent.Executors

/*
 * Skaneri me kamerë: CameraX + ML Kit (njohja e barkodeve e Google-it, i njëjti motor si Google Lens; punon pa internet).
 * Kamera e pasme kryesore, rezolucion i lartë dhe autofokus i vazhdueshëm. v262: lexohet vetëm barkodi që është i tëri brenda
 * kutisë së bardhë; pranohet me votim (VotimiIBarkodit): 7 herë njësoj nga 10 tentime (përndryshe "Skano përsëri", pa zë),
 * pastaj bip + dridhje dhe dritarja mbyllet. v263: me `shpejt` + `paneli` (Skanimi i shpejtë) kamera zë pjesën e sipërme,
 * s'mbyllet dhe çdo barkod i pranuar i jepet `shpejt`; paneli (lista) poshtë.
 */
@Composable
fun Skaneri(mbyll: () -> Unit, shtoNjeCope: ((String) -> Boolean)? = null, shpejt: ((String) -> Boolean)? = null,
            paneli: (@Composable () -> Unit)? = null, uLexua: (String) -> Unit = {}) {
    val ctx = LocalContext.current
    var leje by remember { mutableStateOf(ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    var refuzuar by remember { mutableStateOf(false) }
    val kerko = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { po -> leje = po; refuzuar = !po }
    LaunchedEffect(Unit) { if (!leje) kerko.launch(Manifest.permission.CAMERA) }
    BackHandler(onBack = mbyll)
    // Dritarja nga e cila u hap kamera (p.sh. "Afat i ri") fshihet derisa kamera të mbyllet, pastaj del sërish
    val tastiera = LocalSoftwareKeyboardController.current
    DisposableEffect(Unit) {
        tastiera?.hide()
        SkaneriIHapur.hapur = true
        onDispose { SkaneriIHapur.hapur = false }
    }

    // Kamera me kontrollet lart (X, zmadhimi, drita)
    // kutiaSiper: Skanimi i shpejtë, kutia menjëherë nën kontrollet (null = kamera e plotë, kutia pak mbi mes)
    val kamera: @Composable (Modifier, Modifier, Dp?) -> Unit = { m, mKontrollet, kutiaSiper ->
        Box(m.background(Color.Black)) {
            if (leje) KameraPamja(shtoNjeCope, shpejt, uLexua, kutiaSiper)
            else if (refuzuar) Column(Modifier.align(Alignment.Center).padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Stoku s'ka leje për kamerën. Lejoje te cilësimet e telefonit (Aplikacionet → Stoku → Lejet → Kamera).",
                    style = tx(15, 500, Color.White), textAlign = TextAlign.Center)
                Buton("Provo sërish", { kerko.launch(Manifest.permission.CAMERA) })
            }
            Row(mKontrollet.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Box(Modifier.size(46.dp).clip(CircleShape).background(Color(0x66000000)).clickable(onClick = mbyll), contentAlignment = Alignment.Center) {
                    Icon(Ik.X, "Mbyll", Modifier.size(24.dp), tint = Color.White)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Zmadhimi 1× / 2× / 3× (si #kameraZoom te web-i): vetëm kur kamera e lejon
                    if (DritaKamere.nivelet.size > 1) {
                        val aktiv = DritaKamere.zoomI > 0
                        Box(Modifier.size(46.dp).clip(CircleShape).background(if (aktiv) Color.White else Color(0x66000000))
                            .clickable { DritaKamere.nderroZoomin() }, contentAlignment = Alignment.Center) {
                            Text(DritaKamere.tekstiIZoomit(), style = tx(14, 700, if (aktiv) Color.Black else Color.White))
                        }
                    }
                    if (DritaKamere.kaDrite) Box(Modifier.size(46.dp).clip(CircleShape).background(if (DritaKamere.ndezur) Color.White else Color(0x66000000))
                        .clickable { DritaKamere.nderro() }, contentAlignment = Alignment.Center) {
                        Icon(Ik.Drita, "Drita", Modifier.size(22.dp), tint = if (DritaKamere.ndezur) Color.Black else Color.White)
                    }
                }
            }
        }
    }

    if (paneli == null) Box(Modifier.fillMaxSize().background(Color.Black)) {
        kamera(Modifier.fillMaxSize(), Modifier.systemBarsPadding(), null)
        Text("Drejtoje kamerën te barkodi", style = tx(15, 600, Color.White), textAlign = TextAlign.Center,
            modifier = Modifier.align(Alignment.BottomCenter).systemBarsPadding().padding(bottom = 48.dp)
                .clip(RoundedCornerShape(14.dp)).background(Color(0x80000000)).padding(horizontal = 16.dp, vertical = 10.dp))
        ToastPamja(Modifier.align(Alignment.BottomCenter), poshte = 110.dp)
    }
    // Skanimi i shpejtë: kamera lart (s'mbyllet), paneli poshtë
    else BoxWithConstraints(Modifier.fillMaxSize().background(N.bg)) {
        // Kamera nën shiritin e sipërm (ora, bateria) dhe e hijezuar si pjesa jashtë kutisë (si kamera e zakonshme); më parë pamja
        // e kamerës dilte aty pa hije, sepse kuadri i PreviewView-it del jashtë kufijve të vet
        val siper = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
        // Vetëm sa duhet: kontrollet (X, zmadhimi, drita), kutia dhe teksti nën të, pa hapësirë bosh poshtë (lista merr më shumë vend)
        val kutiaSiper = siper + KONTROLLET_LART
        val lartesia = kutiaSiper + maxWidth * KUTIA_GJERESIA * KUTIA_RAPORTI + NEN_KUTI
        Column(Modifier.fillMaxSize()) {
            kamera(Modifier.fillMaxWidth().background(Color.Black).height(lartesia), Modifier.statusBarsPadding(), kutiaSiper)
            Box(Modifier.fillMaxWidth().weight(1f).navigationBarsPadding().imePadding()) { paneli() }
        }
        ToastPamja(Modifier.align(Alignment.BottomCenter), poshte = 40.dp)
    }
}

/** A është kamera e skanimit e hapur (Flete fshihet ndërkohë, sepse dritaret dalin mbi kamerën) */
object SkaneriIHapur {
    var hapur by mutableStateOf(false)
}

/** Drita (blici) dhe zmadhimi i kamerës */
object DritaKamere {
    var kamera: Camera? = null
    var ndezur by mutableStateOf(false)
    var kaDrite by mutableStateOf(false)
    /** Nivelet e zmadhimit (si te web-i: 1×, pastaj 2× dhe 3× sa i lejon kamera; përndryshe maksimumi) */
    var nivelet by mutableStateOf(listOf(1f))
    var zoomI by mutableStateOf(0)
    fun nderro() {
        val k = kamera ?: return
        if (k.cameraInfo.hasFlashUnit()) { ndezur = !ndezur; k.cameraControl.enableTorch(ndezur) }
    }
    fun pergatitZoomin(min: Float, max: Float) {
        val baza = maxOf(1f, min) // jo kamera ultra e gjerë (min < 1): barkodi lexohet më mirë me kamerën kryesore
        if (max < 1.5f) { nivelet = listOf(1f); zoomI = 0; return }
        val l = mutableListOf(baza)
        listOf(2f, 3f).filter { it > baza && it <= max }.forEach { l.add(it) }
        if (l.size == 1) l.add(max)
        nivelet = l; zoomI = 0
    }
    fun nderroZoomin() {
        val k = kamera ?: return
        if (nivelet.size < 2) return
        val i = (zoomI + 1) % nivelet.size
        try { k.cameraControl.setZoomRatio(nivelet[i]); zoomI = i } catch (e: Exception) { }
    }
    fun tekstiIZoomit(): String {
        val v = Math.round(nivelet.getOrElse(zoomI) { 1f } * 10) / 10f
        return (if (v == Math.floor(v.toDouble()).toFloat()) v.toInt().toString() else v.toString()) + "×"
    }
    fun pastro() { kamera = null; ndezur = false; kaDrite = false; nivelet = listOf(1f); zoomI = 0 }
}

@androidx.annotation.OptIn(markerClass = [androidx.camera.core.ExperimentalGetImage::class])
@Composable
private fun KameraPamja(shtoNjeCope: ((String) -> Boolean)?, shpejt: ((String) -> Boolean)?, uLexua: (String) -> Unit, kutiaSiper: Dp?) {
    val ctx = LocalContext.current
    val siperPx = kutiaSiper?.let { with(LocalDensity.current) { it.toPx() } }
    val siperAktual by rememberUpdatedState(siperPx)
    val shpejtAktual by rememberUpdatedState(shpejt)
    val pronari = LocalLifecycleOwner.current
    val ekzekutuesi = remember { Executors.newSingleThreadExecutor() }
    val skaneri: BarcodeScanner = remember {
        // v266: krejt formatet që njeh ML Kit (edhe Data Matrix, PDF417, Aztec), përveç QR-së: ajo lexohet vetëm që të njoftohet
        BarcodeScanning.getClient(BarcodeScannerOptions.Builder().setBarcodeFormats(
            Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E, Barcode.FORMAT_CODE_128,
            Barcode.FORMAT_CODE_39, Barcode.FORMAT_CODE_93, Barcode.FORMAT_ITF, Barcode.FORMAT_CODABAR, Barcode.FORMAT_DATA_MATRIX,
            Barcode.FORMAT_PDF417, Barcode.FORMAT_AZTEC, Barcode.FORMAT_QR_CODE
        ).build())
    }
    var perfunduar by remember { mutableStateOf(false) }
    // Numërimi i vazhdueshëm (si te web-i): sa copë u shtuan pa e mbyllur kamerën
    var numeruar by remember { mutableStateOf(0) }
    // v262: "Skano përsëri" nën kuti (deri kur, ms e SystemClock), kur votimi s'arrin 7 të njëjta
    var perseriDeri by remember { mutableStateOf(0L) }
    LaunchedEffect(perseriDeri) { if (perseriDeri > 0L) { kotlinx.coroutines.delay(1500); perseriDeri = 0L } }
    val pamja = remember { PreviewView(ctx).apply { scaleType = PreviewView.ScaleType.FILL_CENTER } }

    DisposableEffect(Unit) {
        val fut = ProcessCameraProvider.getInstance(ctx)
        var ofruesi: ProcessCameraProvider? = null
        var qrFundit = 0L
        // v262: votimi me tentime (si te web-i): 7 të njëjta nga 10 tentime
        val votimi = VotimiIBarkodit()
        var kameraELidhur: Camera? = null
        // Barkodi që po numërohet: +1 sa herë shihet, jo më shpesh se NUMRIM_INTERVALI_MS; ndalet kur s'shihet NUMRIM_PUSHIMI_MS
        var nrBarkodi: String? = null; var nrFundit = 0L
        val ndalNumerimin = Runnable { nrBarkodi = null; nrFundit = 0L; numeruar = 0 }
        fun vazhdoNumerimin() { pamja.removeCallbacks(ndalNumerimin); pamja.postDelayed(ndalNumerimin, NUMRIM_PUSHIMI_MS) }
        // Barkodi që fitoi votimin
        fun pranoje(v: String, tash: Long) {
            if (perfunduar) return
            // v263 Skanimi i shpejtë: çdo barkod shtohet te lista dhe kamera s'mbyllet; i njëjti barkod sa kohë shihet merr
            // +1 jo më shpesh se NUMRIM_INTERVALI_MS (si numërimi i vazhdueshëm)
            val sh = shpejtAktual
            if (sh != null) {
                if (nrBarkodi == v) {
                    if (tash - nrFundit >= NUMRIM_INTERVALI_MS) { nrFundit = tash; if (sh(v)) bip(ctx) }
                } else {
                    ndalNumerimin.run()
                    nrBarkodi = v; nrFundit = tash
                    if (sh(v)) bip(ctx)
                }
                vazhdoNumerimin()
                return
            }
            // Produkti që ekziston në folder: +1 pa e mbyllur kamerën, sa kohë barkodi shihet
            if (shtoNjeCope != null) {
                if (nrBarkodi == v) {
                    if (tash - nrFundit >= NUMRIM_INTERVALI_MS) {
                        nrFundit = tash
                        if (shtoNjeCope(v)) { numeruar += 1; bip(ctx) } else { ndalNumerimin.run(); return }
                    }
                    vazhdoNumerimin()
                    return
                }
                ndalNumerimin.run()
                if (shtoNjeCope(v)) { nrBarkodi = v; nrFundit = tash; numeruar = 1; bip(ctx); vazhdoNumerimin(); return }
            }
            perfunduar = true
            bip(ctx)
            pamja.post { uLexua(v) }
        }
        // Votimi s'arriti 7 të njëjta: "Skano përsëri" (pa zë), jo më shpesh se sa zgjat (1.5 s)
        fun skanoPerseri(tash: Long) { if (perseriDeri == 0L) perseriDeri = tash + 1500 }
        fut.addListener({
            val o = fut.get(); ofruesi = o
            // Pamja dhe analiza me të njëjtin raport (16:9), që kutia në ekran të përputhet me pjesën e figurës që lexohet
            val rez = ResolutionSelector.Builder().setAspectRatioStrategy(AspectRatioStrategy.RATIO_16_9_FALLBACK_AUTO_STRATEGY).setResolutionStrategy(
                ResolutionStrategy(android.util.Size(1920, 1080), ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER)).build()
            val preview = Preview.Builder().setResolutionSelector(rez).build().also { it.setSurfaceProvider(pamja.surfaceProvider) }
            val analiza = ImageAnalysis.Builder().setResolutionSelector(rez).setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
            analiza.setAnalyzer(ekzekutuesi) { img ->
                val media = img.image
                if (media == null || perfunduar) { img.close(); return@setAnalyzer }
                val rrot = img.imageInfo.rotationDegrees
                val hyrja = InputImage.fromMediaImage(media, rrot)
                // Madhësia e figurës së drejtë (ML Kit i jep kutitë e barkodeve në këto koordinata)
                val iw = if (rrot % 180 == 0) img.width else img.height
                val ih = if (rrot % 180 == 0) img.height else img.width
                skaneri.process(hyrja).addOnSuccessListener { l ->
                    if (perfunduar) return@addOnSuccessListener
                    val tash = SystemClock.elapsedRealtime()
                    // v262: vetëm barkodi i tëri brenda kutisë; kur ka disa, ai më afër mesit. Çdo kuadër është një tentim.
                    val vw = pamja.width.toFloat(); val vh = pamja.height.toFloat()
                    val b = l.filter { !it.rawValue.isNullOrBlank() && brendaKutise(it.boundingBox, iw, ih, vw, vh, siperAktual) }
                        .minByOrNull { largesiaNgaMesi(it.boundingBox!!, iw, ih, vw, vh, siperAktual) }
                    var kodi = b?.rawValue?.trim()
                    // Kodi QR s'është barkod produkti: njoftohet (jo më shpesh se çdo 2 s); për barkodin s'vlen
                    if (b != null && b.format == Barcode.FORMAT_QR_CODE) {
                        if (tash - qrFundit > 2000) { qrFundit = tash; Toast.trego("Ke skenuar një kod QR. Skano barkodin e produktit.") }
                        kodi = null
                    }
                    when (val vendimi = votimi.tentim(kodi)) {
                        is VotimiIBarkodit.Vendimi.Pranuar -> pranoje(vendimi.kodi, tash)
                        VotimiIBarkodit.Vendimi.Deshtoi -> skanoPerseri(tash)
                        null -> {}
                    }
                }.addOnCompleteListener { img.close() }
            }
            try {
                o.unbindAll()
                val k = o.bindToLifecycle(pronari, CameraSelector.DEFAULT_BACK_CAMERA, preview, analiza)
                DritaKamere.pastro()
                DritaKamere.kamera = k
                kameraELidhur = k
                DritaKamere.kaDrite = k.cameraInfo.hasFlashUnit()
                k.cameraInfo.zoomState.observe(pronari) { z -> if (DritaKamere.kamera === k && DritaKamere.nivelet.size < 2) DritaKamere.pergatitZoomin(z.minZoomRatio, z.maxZoomRatio) }
            } catch (e: Exception) { Toast.trego("Kamera s'u hap. Provo sërish.") }
        }, ContextCompat.getMainExecutor(ctx))
        // Prek figurën: fokusohet aty, pas 1.5 s kthehet te autofokusi i vazhdueshëm (si te web-i)
        pamja.setOnTouchListener { v, e ->
            if (e.action == MotionEvent.ACTION_UP) {
                val k = DritaKamere.kamera
                if (k != null) try {
                    val pika = pamja.meteringPointFactory.createPoint(e.x, e.y)
                    k.cameraControl.startFocusAndMetering(FocusMeteringAction.Builder(pika).setAutoCancelDuration(1500, TimeUnit.MILLISECONDS).build())
                } catch (x: Exception) { }
                v.performClick()
            }
            true
        }
        onDispose {
            pamja.removeCallbacks(ndalNumerimin)
            votimi.rinis()
            try { kameraELidhur?.cameraInfo?.zoomState?.removeObservers(pronari) } catch (e: Exception) { }
            try { ofruesi?.unbindAll() } catch (e: Exception) { }
            DritaKamere.pastro()
            skaneri.close(); ekzekutuesi.shutdown()
        }
    }
    Box(Modifier.fillMaxSize()) {
        AndroidView({ pamja }, Modifier.fillMaxSize())
        // Korniza në mes (zona ku lexohet barkodi)
        Canvas(Modifier.fillMaxSize().graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)) {
            val k = kutiaESkanimit(size.width, size.height, siperPx)
            drawRect(Color(0x99000000))
            drawRoundRect(Color.Transparent, k.topLeft, k.size, CornerRadius(24.dp.toPx()), blendMode = BlendMode.Clear)
            drawRoundRect(Color.White, k.topLeft, k.size, CornerRadius(24.dp.toPx()), style = Stroke(3.dp.toPx()))
        }
        // Nën kornizë (si #skanHint te web-i)
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val w = maxWidth * KUTIA_GJERESIA; val h = if (kutiaSiper != null) w * KUTIA_RAPORTI else minOf(w * KUTIA_RAPORTI, maxHeight * 0.5f)
            val poshte = (kutiaSiper ?: ((maxHeight - h) / 2.3f)) + h
            val perseri = perseriDeri > 0L
            Text(if (perseri) "Skano përsëri" else "Vendos vetëm një barkod brenda kutisë", style = tx(13, if (perseri) 700 else 400, Color.White), textAlign = TextAlign.Center,
                modifier = Modifier.align(Alignment.TopCenter).padding(top = poshte + 22.dp).clip(RoundedCornerShape(16.dp))
                    .background(if (perseri) Color(0xFFFF5252) else Color(0x80000000)).padding(horizontal = 16.dp, vertical = 7.dp))
        }
        // "+N" mbi kornizë (si .skan-numrim te web-i)
        if (numeruar > 0) BoxWithConstraints(Modifier.fillMaxSize()) {
            val w = maxWidth * KUTIA_GJERESIA; val h = if (kutiaSiper != null) w * KUTIA_RAPORTI else minOf(w * KUTIA_RAPORTI, maxHeight * 0.5f)
            val siper = kutiaSiper ?: ((maxHeight - h) / 2.3f)
            Text("+$numeruar", style = tx(17, 700, Color.White), modifier = Modifier.align(Alignment.TopCenter).padding(top = maxOf(0.dp, siper - 46.dp))
                .shadow(8.dp, RoundedCornerShape(16.dp)).clip(RoundedCornerShape(16.dp)).background(Color(0xFFFF5252)).padding(horizontal = 16.dp, vertical = 6.dp))
        }
    }
}

/** Kutia e bardhë në pikselat e pamjes (e njëjta me vizatimin): 78% e gjerësisë, lartësia 0.55 e saj, pak mbi mes (jo më e
 *  lartë se gjysma e pamjes). siper (px): Skanimi i shpejtë, kutia fillon aty (nën kontrollet) */
private fun kutiaESkanimit(vw: Float, vh: Float, siper: Float? = null): Rect {
    val w = vw * KUTIA_GJERESIA; val h = if (siper != null) w * KUTIA_RAPORTI else minOf(w * KUTIA_RAPORTI, vh * 0.5f)
    val l = (vw - w) / 2; val t = siper ?: ((vh - h) / 2.3f)
    return Rect(l, t, l + w, t + h)
}
private const val KUTIA_GJERESIA = 0.78f
private const val KUTIA_RAPORTI = 0.55f
/** Skanimi i shpejtë: nga shiriti i sipërm deri te kutia (kontrollet 16 + 46 dp dhe pak hapësirë) dhe nën kuti (teksti + pak) */
private val KONTROLLET_LART = 76.dp
private val NEN_KUTI = 68.dp

/** Kutia e barkodit (figura e drejtë iw x ih) në pikselat e pamjes: PreviewView FILL_CENTER = shkallë "cover" dhe në mes */
private fun neEkran(b: android.graphics.Rect, iw: Int, ih: Int, vw: Float, vh: Float): Rect {
    val s = maxOf(vw / iw, vh / ih)
    val ox = (vw - iw * s) / 2; val oy = (vh - ih * s) / 2
    return Rect(b.left * s + ox, b.top * s + oy, b.right * s + ox, b.bottom * s + oy)
}

/** v262: barkodi është i tëri brenda kutisë së bardhë (me 4% lejim për skajet); ai që del jashtë, edhe pjesërisht, s'merret */
private fun brendaKutise(b: android.graphics.Rect?, iw: Int, ih: Int, vw: Float, vh: Float, siper: Float?): Boolean {
    if (b == null || iw <= 0 || ih <= 0 || vw <= 0f || vh <= 0f) return false
    val r = neEkran(b, iw, ih, vw, vh); val k = kutiaESkanimit(vw, vh, siper)
    val tx = k.width * 0.04f; val ty = k.height * 0.04f
    return r.left >= k.left - tx && r.right <= k.right + tx && r.top >= k.top - ty && r.bottom <= k.bottom + ty
}

private fun largesiaNgaMesi(b: android.graphics.Rect, iw: Int, ih: Int, vw: Float, vh: Float, siper: Float?): Float {
    val r = neEkran(b, iw, ih, vw, vh); val k = kutiaESkanimit(vw, vh, siper)
    val dx = r.center.x - k.center.x; val dy = r.center.y - k.center.y
    return dx * dx + dy * dy
}

/** Numërimi i vazhdueshëm (si te web-i): +1 jo më shpesh se 1.5 s; mbaron kur barkodi s'shihet 3 s */
private const val NUMRIM_INTERVALI_MS = 1500L
private const val NUMRIM_PUSHIMI_MS = 3000L

/** Shifra e kontrollit e EAN-13/EAN-8/UPC-A */
fun kontrolliEAN(v: String): Boolean {
    if (!v.all { it.isDigit() } || v.length !in listOf(8, 12, 13)) return false
    val d = v.map { it - '0' }
    val trup = d.dropLast(1).reversed()
    val s = trup.mapIndexed { i, x -> if (i % 2 == 0) x * 3 else x }.sum()
    return (10 - s % 10) % 10 == d.last()
}

private var toni: ToneGenerator? = null
fun bip(ctx: Context) {
    try {
        val v = if (Build.VERSION.SDK_INT >= 31) (ctx.getSystemService(VibratorManager::class.java))?.defaultVibrator
        else @Suppress("DEPRECATION") ctx.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        v?.vibrate(VibrationEffect.createOneShot(70, VibrationEffect.DEFAULT_AMPLITUDE))
    } catch (e: Exception) { }
    if (!StokuApp.prefsOseB("tingull", true)) return
    try {
        if (toni == null) toni = ToneGenerator(AudioManager.STREAM_MUSIC, 80)
        toni?.startTone(ToneGenerator.TONE_PROP_BEEP, 150)
    } catch (e: Exception) { }
}

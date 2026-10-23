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
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
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
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import site.stoku.vendas.StokuApp
import java.util.concurrent.Executors

/*
 * Skaneri me kamerë: CameraX + ML Kit (njohja e barkodeve e Google-it, i njëjti motor si Google Lens; punon pa internet).
 * Kamera e pasme kryesore, rezolucion i lartë dhe autofokus i vazhdueshëm. Barkodi pranohet kur lexohet 2 herë rresht
 * (EAN/UPC me shifrën e kontrollit të saktë: menjëherë), pastaj bip + dridhje dhe dritarja mbyllet.
 */
@Composable
fun Skaneri(mbyll: () -> Unit, uLexua: (String) -> Unit) {
    val ctx = LocalContext.current
    var leje by remember { mutableStateOf(ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    var refuzuar by remember { mutableStateOf(false) }
    val kerko = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { po -> leje = po; refuzuar = !po }
    LaunchedEffect(Unit) { if (!leje) kerko.launch(Manifest.permission.CAMERA) }
    BackHandler(onBack = mbyll)

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        if (leje) KameraPamja(uLexua)
        else if (refuzuar) Column(Modifier.align(Alignment.Center).padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Stoku s'ka leje për kamerën. Lejoje te cilësimet e telefonit (Aplikacionet → Stoku → Lejet → Kamera).",
                style = tx(15, 500, Color.White), textAlign = TextAlign.Center)
            Buton("Provo sërish", { kerko.launch(Manifest.permission.CAMERA) })
        }
        Row(Modifier.systemBarsPadding().fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Box(Modifier.size(46.dp).clip(CircleShape).background(Color(0x66000000)).clickable(onClick = mbyll), contentAlignment = Alignment.Center) {
                Icon(Ik.X, "Mbyll", Modifier.size(24.dp), tint = Color.White)
            }
            Box(Modifier.size(46.dp).clip(CircleShape).background(if (DritaKamere.ndezur) Color.White else Color(0x66000000))
                .clickable { DritaKamere.nderro() }, contentAlignment = Alignment.Center) {
                Icon(Ik.Drita, "Drita", Modifier.size(22.dp), tint = if (DritaKamere.ndezur) Color.Black else Color.White)
            }
        }
        Text("Drejtoje kamerën te barkodi", style = tx(15, 600, Color.White), textAlign = TextAlign.Center,
            modifier = Modifier.align(Alignment.BottomCenter).systemBarsPadding().padding(bottom = 48.dp)
                .clip(RoundedCornerShape(14.dp)).background(Color(0x80000000)).padding(horizontal = 16.dp, vertical = 10.dp))
    }
}

/** Drita (blici) e kamerës */
object DritaKamere {
    var kamera: Camera? = null
    var ndezur by mutableStateOf(false)
    fun nderro() {
        val k = kamera ?: return
        if (k.cameraInfo.hasFlashUnit()) { ndezur = !ndezur; k.cameraControl.enableTorch(ndezur) }
    }
}

@androidx.annotation.OptIn(markerClass = [androidx.camera.core.ExperimentalGetImage::class])
@Composable
private fun KameraPamja(uLexua: (String) -> Unit) {
    val ctx = LocalContext.current
    val pronari = LocalLifecycleOwner.current
    val ekzekutuesi = remember { Executors.newSingleThreadExecutor() }
    val skaneri: BarcodeScanner = remember {
        BarcodeScanning.getClient(BarcodeScannerOptions.Builder().setBarcodeFormats(
            Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E, Barcode.FORMAT_CODE_128,
            Barcode.FORMAT_CODE_39, Barcode.FORMAT_CODE_93, Barcode.FORMAT_ITF, Barcode.FORMAT_CODABAR, Barcode.FORMAT_QR_CODE
        ).build())
    }
    var perfunduar by remember { mutableStateOf(false) }
    val pamja = remember { PreviewView(ctx).apply { scaleType = PreviewView.ScaleType.FILL_CENTER } }

    DisposableEffect(Unit) {
        val fut = ProcessCameraProvider.getInstance(ctx)
        var ofruesi: ProcessCameraProvider? = null
        var iFundit = ""; var hera = 0
        fut.addListener({
            val o = fut.get(); ofruesi = o
            val rez = ResolutionSelector.Builder().setResolutionStrategy(
                ResolutionStrategy(android.util.Size(1920, 1080), ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER)).build()
            val preview = Preview.Builder().setResolutionSelector(rez).build().also { it.setSurfaceProvider(pamja.surfaceProvider) }
            val analiza = ImageAnalysis.Builder().setResolutionSelector(rez).setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
            analiza.setAnalyzer(ekzekutuesi) { img ->
                val media = img.image
                if (media == null || perfunduar) { img.close(); return@setAnalyzer }
                val hyrja = InputImage.fromMediaImage(media, img.imageInfo.rotationDegrees)
                skaneri.process(hyrja).addOnSuccessListener { l ->
                    val b = l.firstOrNull { !it.rawValue.isNullOrBlank() } ?: return@addOnSuccessListener
                    val v = b.rawValue!!.trim()
                    hera = if (v == iFundit) hera + 1 else 1
                    iFundit = v
                    val iSigurt = (b.format == Barcode.FORMAT_EAN_13 || b.format == Barcode.FORMAT_EAN_8 || b.format == Barcode.FORMAT_UPC_A) && kontrolliEAN(v)
                    if ((iSigurt || hera >= 2) && !perfunduar) {
                        perfunduar = true
                        bip(ctx)
                        pamja.post { uLexua(v) }
                    }
                }.addOnCompleteListener { img.close() }
            }
            try {
                o.unbindAll()
                DritaKamere.kamera = o.bindToLifecycle(pronari, CameraSelector.DEFAULT_BACK_CAMERA, preview, analiza)
                DritaKamere.ndezur = false
            } catch (e: Exception) { Toast.trego("Kamera s'u hap. Provo sërish.") }
        }, ContextCompat.getMainExecutor(ctx))
        onDispose {
            try { ofruesi?.unbindAll() } catch (e: Exception) { }
            DritaKamere.kamera = null; DritaKamere.ndezur = false
            skaneri.close(); ekzekutuesi.shutdown()
        }
    }
    Box(Modifier.fillMaxSize()) {
        AndroidView({ pamja }, Modifier.fillMaxSize())
        // Korniza në mes (zona ku lexohet barkodi)
        Canvas(Modifier.fillMaxSize().graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)) {
            val w = size.width * 0.78f; val h = w * 0.55f
            val tl = Offset((size.width - w) / 2, (size.height - h) / 2.3f)
            drawRect(Color(0x99000000))
            drawRoundRect(Color.Transparent, tl, Size(w, h), CornerRadius(24.dp.toPx()), blendMode = BlendMode.Clear)
            drawRoundRect(Color.White, tl, Size(w, h), CornerRadius(24.dp.toPx()), style = Stroke(3.dp.toPx()))
        }
    }
}

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

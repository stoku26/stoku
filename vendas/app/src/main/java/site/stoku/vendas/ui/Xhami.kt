package site.stoku.vendas.ui

import android.os.Build
import android.view.ViewParent
import android.view.WindowManager
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.DialogWindowProvider

/**
 * v286 (pronari zgjodhi shkallën "C", si te web-i: css/stoku.css "XHAMI"): dritaret që dalin MBI faqe (dritarja nga poshtë,
 * konfirmimet, zgjedhja e marketit) janë gjysmë të tejdukshme dhe e turbullojnë atë që kanë pas.
 * Turbullimi i vërtetë pas dritares punon vetëm në Android 12 e lart dhe kur telefoni e lejon (jo në kursim baterie);
 * përndryshe dritarja mbetet me ngjyrë të plotë, që teksti të lexohet.
 * PËR TA HEQUR KREJT: AKTIV = false.
 */
object Xhami {
    const val AKTIV = true
    /** Sa e plotë është ngjyra e dritares kur ka turbullim (0.60 = shkalla "C") */
    const val ALFA = 0.60f
    val ERRET = Color(0xFF2C313E)
    val CELET = Color(0xFFFFFFFF)
    /** Hija mbi faqe më e lehtë, që xhami të duket (si --sb-xham-mbulese te web-i) */
    val MBULESA_ERRET = Color(0x57000000)
    val MBULESA_CELET = Color(0x4214161B)
}

/**
 * Thirret BRENDA përmbajtjes së një dritareje (Dialog ose ModalBottomSheet): turbullon gjithçka pas saj.
 * Kthen true kur turbullimi u vendos (atëherë dritarja mund të jetë gjysmë e tejdukshme).
 */
@Composable
fun turbulloPasDritares(): Boolean {
    if (!Xhami.AKTIV || Build.VERSION.SDK_INT < 31) return false
    val pamja = LocalView.current
    val rrezja = with(LocalDensity.current) { 22.dp.roundToPx() }
    var vendosur by remember { mutableStateOf(false) }
    DisposableEffect(pamja) {
        try {
            var prind: ViewParent? = pamja.parent
            var dritarja = (pamja as? DialogWindowProvider)?.window
            while (dritarja == null && prind != null) {
                dritarja = (prind as? DialogWindowProvider)?.window
                prind = prind.parent
            }
            val wm = pamja.context.getSystemService(WindowManager::class.java)
            if (dritarja != null && wm != null && wm.isCrossWindowBlurEnabled) {
                dritarja.addFlags(WindowManager.LayoutParams.FLAG_BLUR_BEHIND)
                val a = dritarja.attributes
                a.blurBehindRadius = rrezja
                dritarja.attributes = a
                vendosur = true
            }
        } catch (e: Throwable) { /* telefoni s'e lejon: mbetet ngjyra e plotë */ }
        onDispose { }
    }
    return vendosur
}

/** Sfondi i dritares: xham kur ka turbullim, përndryshe ngjyra e plotë e sipërfaqes */
@Composable
fun ngjyraEDritares(turbull: Boolean): Color =
    if (turbull) (if (N.erret) Xhami.ERRET else Xhami.CELET).copy(alpha = Xhami.ALFA) else N.surface

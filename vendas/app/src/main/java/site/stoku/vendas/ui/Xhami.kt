package site.stoku.vendas.ui

import android.os.Build
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * v286 (pronari zgjodhi shkallën "C", si te web-i: css/stoku.css "XHAMI"): dritaret që dalin MBI faqe (dritarja nga poshtë,
 * konfirmimet, zgjedhja e marketit) janë gjysmë të tejdukshme dhe faqja pas tyre turbullohet.
 * Hyrja 49: turbullohet VETË FAQJA E APLIKACIONIT (Modifier.blur te rrënja, MainActivity) sa kohë është hapur një dritare.
 * Mënyra e parë (turbullimi i sistemit pas dritares, FLAG_BLUR_BEHIND) s'dukej fare: dritarja nga poshtë e Material 3 s'është
 * Dialog, dhe shumë telefona e kanë të fikur atë turbullim. Kjo mënyrë punon në çdo telefon me Android 12 e lart; në më të
 * vjetrit dritaret mbeten me ngjyrë të plotë, që teksti të lexohet.
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

    /** A mund të turbullohet faqja në këtë telefon (Android 12+) */
    val mundet: Boolean get() = AKTIV && Build.VERSION.SDK_INT >= 31
    /** Sa dritare janë hapur tani (rrënja turbullohet kur është mbi 0) */
    var hapura by mutableStateOf(0)
        private set
    internal fun hap() { hapura++ }
    internal fun mbyll() { if (hapura > 0) hapura-- }
}

/** Për rrënjën e aplikacionit (MainActivity): faqja turbullohet sa kohë është hapur një dritare me xham */
fun Modifier.turbullKurKaDritare(): Modifier = if (Xhami.mundet && Xhami.hapura > 0) this.blur(22.dp) else this

/**
 * Thirret BRENDA përmbajtjes së një dritareje (Dialog ose ModalBottomSheet): sa kohë ajo është hapur, faqja pas saj turbullohet.
 * Kthen true kur telefoni e mbështet (atëherë dritarja mund të jetë gjysmë e tejdukshme).
 */
@Composable
fun turbulloPasDritares(): Boolean {
    if (!Xhami.mundet) return false
    DisposableEffect(Unit) { Xhami.hap(); onDispose { Xhami.mbyll() } }
    return true
}

/** Sfondi i dritares: xham kur ka turbullim, përndryshe ngjyra e plotë e sipërfaqes */
@Composable
fun ngjyraEDritares(turbull: Boolean): Color =
    if (turbull) (if (N.erret) Xhami.ERRET else Xhami.CELET).copy(alpha = Xhami.ALFA) else N.surface

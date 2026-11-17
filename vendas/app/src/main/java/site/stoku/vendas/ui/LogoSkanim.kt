package site.stoku.vendas.ui

import android.provider.Settings
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import kotlin.math.pow

/** Web v324 (pronari zgjodhi GIF-in 02: "bone sa ma high quality ... edhe tjen nloop mos tdoket keq ne nisje edhe mbarim. Kudo qe osht
 *  qashtu e madhe logoja"): një barkod kthehet në "stoku." me një vijë skanimi të gjelbër, në loop (6 s) pa kërcim. Të njëjtat kohë dhe
 *  shtylla si `stkSkL/stkSkB/stkSkV` te logot.js: dy drejtkëndësha 150 të gjerë presin barkodin dhe logon; kur kalon nga një pjesë e
 *  loop-it te tjetra secili mbulon krejt logon ose asgjë. "Hiq animacionet" e sistemit: vetëm logoja, pa lëvizje. */
object SkanimiILogos {
    const val SEK = 6
    /** Shtyllat e barkodit (x, gjerësia) në njësitë e logos 100.52 x 26.97 (si BARKODI te logot.js) */
    val BARKODI: List<Pair<Float, Float>> = run {
        var s = 7L
        fun r(): Double { s = (s * 9301 + 49297) % 233280; return s / 233280.0 }
        val w = floatArrayOf(0.9f, 1.8f, 2.7f)
        val l = ArrayList<Pair<Float, Float>>()
        var x = 2f
        while (x < 98f) { val g = w[(r() * 3).toInt()]; l.add(x to g); x += g + w[(r() * 3).toInt()] }
        l
    }
    private fun eio(t: Float) = if (t < .5f) 4 * t * t * t else 1 - (-2 * t + 2).pow(3) / 2
    private fun lerp(a: Float, b: Float, t: Float) = a + (b - a) * t
    private fun seg(p: Float, a: Float, b: Float) = ((p - a) / (b - a)).coerceIn(0f, 1f)
    /** p ∈ [0, 1): [zhvendosja e logos, zhvendosja e barkodit, vija x (NaN = s'duket)] */
    fun gjendja(p: Float): FloatArray {
        val l = when { p < .15f -> -153f; p < .32f -> lerp(-153f, -46f, eio(seg(p, .15f, .32f))); p < .80f -> lerp(-46f, -3f, seg(p, .32f, .80f))
            p < .97f -> lerp(-3f, 104f, eio(seg(p, .80f, .97f))); else -> 104f }
        val b = when { p < .15f -> lerp(-38.83f, -3f, seg(p, 0f, .15f)); p < .32f -> lerp(-3f, 104f, eio(seg(p, .15f, .32f))); p < .80f -> 104f
            p < .97f -> lerp(-153f, -46f, eio(seg(p, .80f, .97f))); else -> lerp(-46f, -38.83f, seg(p, .97f, 1f)) }
        val v = when { p >= .15f && p < .32f -> lerp(-3f, 104f, eio(seg(p, .15f, .32f))); p >= .80f && p < .97f -> lerp(-3f, 104f, eio(seg(p, .80f, .97f))); else -> Float.NaN }
        return floatArrayOf(l, b, v)
    }
}

/** Logoja "stoku." me skanimin në loop (koka e Stoku-t dhe hyrja) */
@Composable
fun LogoMeSkanim(ink: Color, pika: Color, pershkrimi: String, modifier: Modifier = Modifier) {
    val ctx = LocalContext.current
    val paLevizje = remember { try { Settings.Global.getFloat(ctx.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f } catch (e: Exception) { false } }
    val t = remember { PathParser().parsePathString(Logot.FJ_T).toPath() }
    val pk = remember { PathParser().parsePathString(Logot.FJ_P).toPath() }
    val p = if (paLevizje) .5f else rememberInfiniteTransition(label = "skanimi").animateFloat(0f, 1f,
        infiniteRepeatable(tween(SkanimiILogos.SEK * 1000, easing = LinearEasing), RepeatMode.Restart), label = "p").value
    val gj = SkanimiILogos.gjendja(p)
    val gjelber = Color(0xFF4ADE80)
    Canvas(modifier.semantics { contentDescription = pershkrimi }) {
        val k = size.width / Logot.FJ_W
        withTransform({ scale(k, k, pivot = Offset.Zero) }) {
            clipRect(gj[1], -8f, gj[1] + 150f, 37f) {
                SkanimiILogos.BARKODI.forEach { (x, w) -> drawRect(ink, Offset(x, 0f), Size(w, Logot.FJ_H)) }
            }
            clipRect(gj[0], -8f, gj[0] + 150f, 37f) { drawPath(t, ink); drawPath(pk, pika) }
            if (!gj[2].isNaN()) {
                drawRect(gjelber.copy(alpha = .12f), Offset(gj[2] - 6f, -4f), Size(6f, 35f))
                drawRect(gjelber, Offset(gj[2] - .35f, -4f), Size(.7f, 35f))
            }
        }
    }
}

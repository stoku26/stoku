package site.stoku.vendas.ui

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.LaunchedEffect
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
    /** Web v325 (pronari: "nonstop po rrin tu u bo her barkod her logo ... prej barkodit ne logo veq niher per 1 login pas 1 sekonde"):
     *  pa loop. p ∈ [0, 1]: barkodi deri 0.5 (1 s), skanimi 0.5 → 1 (1 s), pastaj logoja. [logoja, barkodi, vija x (NaN = s'duket)] */
    /** Web v349: barkodi deri 0.6 (1.5 s nga 2.5 s), skanimi 0.6 → 1 (1 s) */
    const val KOHA_MS = 2500
    private const val NIS = .6f
    fun gjendja(p: Float): FloatArray {
        if (p >= 1f) return floatArrayOf(-20f, 104f, Float.NaN)
        if (p < NIS) return floatArrayOf(-153f, -3f, Float.NaN)
        val e = eio(seg(p, NIS, 1f))
        return floatArrayOf(lerp(-153f, -46f, e), lerp(-3f, 104f, e), lerp(-3f, 104f, e))
    }
    /** Web v349 (pronari: "... edhe mo me met veq logo stoku deri sa te mbyllet e hapet prap"): koka e bën skanimin NJË herë për çdo hapje
     *  të aplikacionit (MainActivity.onCreate pa gjendje të ruajtur e fshin) dhe sërish pas çdo hyrjeje (Porta e fshin). Vetëm në memorie. */
    @Volatile var kokaLuajti = false
    /** Hyrja u shfaq ose aplikacioni u hap rishtas: koka e bën sërish skanimin (një herë) */
    fun harro() { kokaLuajti = false }
}

/** Logoja "stoku." me skanimin: `luaj` = barkodi → logo një herë (2.5 s); përndryshe vetëm logoja. kurNis: thirret kur nis skanimi */
@Composable
fun LogoMeSkanim(ink: Color, pika: Color, pershkrimi: String, modifier: Modifier = Modifier, luaj: Boolean = false, kurNis: () -> Unit = {}) {
    val ctx = LocalContext.current
    val paLevizje = remember { try { Settings.Global.getFloat(ctx.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f } catch (e: Exception) { false } }
    val t = remember { PathParser().parsePathString(Logot.FJ_T).toPath() }
    val pk = remember { PathParser().parsePathString(Logot.FJ_P).toPath() }
    val anim = remember { Animatable(if (luaj && !paLevizje) 0f else 1f) }
    LaunchedEffect(Unit) { if (anim.value < 1f) { kurNis(); anim.animateTo(1f, tween(SkanimiILogos.KOHA_MS, easing = LinearEasing)) } }
    val gj = SkanimiILogos.gjendja(anim.value)
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

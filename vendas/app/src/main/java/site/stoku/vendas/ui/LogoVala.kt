package site.stoku.vendas.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import kotlin.math.pow

/** Web v321 (pronari: "bone logon 17 ne krejta ... masi ta kryn me u nal pa u vrejt si loop, me perfundu sakt"): shkronjat e
 *  "stoku." anohen si valë NJË herë (njëra pas tjetrës, 0.08 s), me lëkundje që zvogëlohet deri në 0°: ndalet butë në pozitën
 *  normale. Të njëjtat pika kyçe si `@keyframes stkVale` te logot.js. */
object ValaELogos {
    const val ZGJATJA = 1.4f
    const val VONESA = 0.08f
    const val KOHA = ZGJATJA + VONESA * 4
    private val K = floatArrayOf(0f, .15f, .35f, .55f, .75f, 1f)
    private val V = floatArrayOf(0f, 9f, -7f, 4f, -1.5f, 0f)

    /** Këndi (gradë) i shkronjës i në kohën t (sekonda); jashtë [0, 1] gjithmonë 0 */
    fun kendi(t: Float, i: Int): Float {
        val p = (t - i * VONESA) / ZGJATJA
        if (p <= 0f || p >= 1f) return 0f
        var j = 0
        while (j < K.size - 2 && p > K[j + 1]) j++
        val q = (p - K[j]) / (K[j + 1] - K[j])
        val e = if (q < .5f) 2 * q * q else 1 - (-2 * q + 2).pow(2) / 2 // ease-in-out si te CSS-ja
        return V[j] + (V[j + 1] - V[j]) * e
    }

    class Shkronja(val path: Path, val pivot: Offset)

    /** Ndan shtigjet e "stoku" në shkronja: nën-shtigjet që nisin afër njëra-tjetrës (vrima e "o") janë një shkronjë */
    fun ndaj(t: String): List<Shkronja> {
        val pjeset = Regex("M[^M]*").findAll(t).map { it.value }
            .map { (Regex("^M\\s*(-?[\\d.]+)").find(it)?.groupValues?.get(1)?.toFloatOrNull() ?: 0f) to it }.sortedBy { it.first }.toList()
        val grupet = ArrayList<MutableList<Pair<Float, String>>>()
        pjeset.forEach { p -> if (grupet.isNotEmpty() && p.first - grupet.last().last().first < 2f) grupet.last().add(p) else grupet.add(mutableListOf(p)) }
        return grupet.map { g ->
            val path = PathParser().parsePathString(g.joinToString("") { it.second }).toPath()
            val b = path.getBounds()
            Shkronja(path, Offset(b.center.x, b.bottom))
        }
    }
}

private val logotELuajtura = HashSet<String>()

/** Logoja "stoku." me valën (një herë për çdo vend, `celesi`, sa herë hapet aplikacioni) */
@Composable
fun LogoMeVale(celesi: String, ink: Color, pika: Color, pershkrimi: String, modifier: Modifier = Modifier) {
    val shkronjat = remember { ValaELogos.ndaj(Logot.FJ_T) }
    val pk = remember { PathParser().parsePathString(Logot.FJ_P).toPath() }
    val t = remember { Animatable(if (celesi in logotELuajtura) ValaELogos.KOHA else 0f) }
    LaunchedEffect(Unit) {
        if (logotELuajtura.add(celesi)) t.animateTo(ValaELogos.KOHA, tween((ValaELogos.KOHA * 1000).toInt(), easing = LinearEasing))
    }
    Canvas(modifier.semantics { contentDescription = pershkrimi }) {
        val k = size.width / Logot.FJ_W
        withTransform({ scale(k, k, pivot = Offset.Zero) }) {
            shkronjat.forEachIndexed { i, s -> rotate(ValaELogos.kendi(t.value, i), s.pivot) { drawPath(s.path, ink) } }
            drawPath(pk, pika)
        }
    }
}

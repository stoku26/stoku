package site.stoku.vendas.ui

import site.stoku.vendas.Opsionet

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.graphics.vector.group
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Hyrja 75 (web v313): logoja 60 (shenja + "stoku" + pika) me kombinimin e ngjyrave të zgjedhur (Logot.kt, si logot.js).
 *  E çelët: ngjyra br/acL; e errët: dk/acD; shkronjat me ngjyrën e tekstit të temës. */
fun logoStoku(erret: Boolean, ink: Color = if (erret) Color(0xFFF5F5F7) else Color(0xFF14161B), id: String? = Opsionet.logoja.value): ImageVector {
    val v = Logot.varianti(id)
    val f = Color(if (erret) v.dk else v.br)
    val a = Color(if (erret) v.acD else v.acL)
    val b = ImageVector.Builder(defaultWidth = Logot.LOGO_W.dp, defaultHeight = Logot.LOGO_H.dp, viewportWidth = Logot.LOGO_W, viewportHeight = Logot.LOGO_H)
    Logot.logoShenja.forEach { sh -> b.addPath(PathParser().parsePathString(sh.d).toNodes(), fill = SolidColor(if (sh.rol == 'a') a else f), fillAlpha = sh.o) }
    b.addPath(PathParser().parsePathString(Logot.FJALA).toNodes(), fill = SolidColor(ink))
    b.addPath(PathParser().parsePathString(Logot.PIKA).toNodes(), fill = SolidColor(a))
    return b.build()
}

/** Ikona e aplikacionit (katror i rrumbullakosur + shenja) me ngjyrat e një varianti: te Cilësimet → Pamja → Logoja */
fun ikonaStoku(id: String): ImageVector {
    val v = Logot.varianti(id)
    val b = ImageVector.Builder(defaultWidth = 64.dp, defaultHeight = 64.dp, viewportWidth = 64f, viewportHeight = 64f)
    b.addPath(PathParser().parsePathString("M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H15A15 15 0 0 1 0 49V15A15 15 0 0 1 15 0Z").toNodes(),
        fill = SolidColor(Color(v.bg)), stroke = if (ndricimi(v.bg) > 0.6f) SolidColor(Color(0xFFD9D7D2)) else null, strokeLineWidth = 1.5f)
    b.group(translationX = 6.4f, translationY = 6.4f, scaleX = 0.8f, scaleY = 0.8f) {
        Logot.shenja.forEach { sh -> addPath(PathParser().parsePathString(sh.d).toNodes(), fill = SolidColor(Color(if (sh.rol == 'a') v.ac else v.fg)), fillAlpha = sh.o) }
    }
    return b.build()
}

private fun ndricimi(c: Long): Float {
    fun l(x: Long): Float { val v = (x and 0xFF) / 255f; return if (v <= 0.03928f) v / 12.92f else Math.pow(((v + 0.055f) / 1.055f).toDouble(), 2.4).toFloat() }
    return 0.2126f * l(c shr 16) + 0.7152f * l(c shr 8) + 0.0722f * l(c)
}

@Composable
fun LogoEPlote(modifier: Modifier = Modifier) {
    val erret = N.erret
    val ink = N.ink
    val id by Opsionet.logoja.collectAsState()
    val v = remember(erret, ink, id) { logoStoku(erret, ink, id) }
    Image(v, "Stoku", modifier)
}

/** Etiketa në krye të Stoku-t (stk-etiketa): logoja 60 me ngjyrat e zgjedhura (Hyrja 75, si web-i v313) dhe emri i përdoruesit */
@Composable
fun EtiketaStoku(emri: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val n = N
    val forma = RoundedCornerShape(10.dp)
    val id by Opsionet.logoja.collectAsState()
    val logo = remember(n.erret, n.ink, id) { logoStoku(n.erret, n.ink, id) }
    Column(
        modifier.width(152.dp).clip(forma).background(n.surface).border(1.dp, n.line, forma).clickable(onClick = onClick).padding(start = 14.dp, end = 14.dp, top = 7.dp, bottom = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        Image(logo, "Stoku", Modifier.padding(top = 1.dp, bottom = 2.dp).height(22.dp).width((22f * Logot.LOGO_W / Logot.LOGO_H).dp))
        Text(emri, style = txMono(10f, n.muted, 500).copy(letterSpacing = 1.sp),
            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.height(13.dp))
    }
}
}

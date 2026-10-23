package site.stoku.vendas.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.graphics.vector.group
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Logoja e plotë "stoku" (logo/stoku-logo.svg): shenja me barkod + fjala */
fun logoStoku(erret: Boolean): ImageVector {
    val ink = if (erret) Color(0xFFECEEF2) else Color(0xFF14161B)
    val katror = if (erret) Color(0xFF252A33) else Color(0xFF14161B)
    val b = ImageVector.Builder(defaultWidth = 190.dp, defaultHeight = 52.dp, viewportWidth = 190f, viewportHeight = 52f)
    b.group(translationY = 4f, scaleX = 0.6875f, scaleY = 0.6875f) {
        addPath(PathParser().parsePathString("M15 0h34a15 15 0 0 1 15 15v34a15 15 0 0 1-15 15H15A15 15 0 0 1 0 49V15A15 15 0 0 1 15 0Z").toNodes(), fill = SolidColor(katror))
        listOf(14f to 3f, 19f to 2f, 23f to 4f, 29f to 2f, 38f to 2f, 42f to 4f, 48f to 2f).forEach { (x, w) ->
            addPath(PathParser().parsePathString("M${x} 16h${w}v32h-${w}Z").toNodes(), fill = SolidColor(Color.White))
        }
        addPath(PathParser().parsePathString("M33 16h3v32h-3Z").toNodes(), fill = SolidColor(Color(0xFFF5B942)))
    }
    listOf("M76 20H65a5 5 0 0 0 0 10h6a5 5 0 0 1 0 10H60", "M91 12v23a5 5 0 0 0 5 5h3", "M86 20h11",
        "M109.5 30a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z", "M140.5 12v28", "M152.5 20l-12 11", "M145 26.9l8.5 13.1",
        "M164.5 20v10a10 10 0 0 0 20 0", "M184.5 20v20").forEach { d ->
        b.addPath(PathParser().parsePathString(d).toNodes(), stroke = SolidColor(ink), strokeLineWidth = 5f,
            strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round)
    }
    return b.build()
}

@Composable
fun LogoEPlote(modifier: Modifier = Modifier) {
    val erret = N.erret
    val v = remember(erret) { logoStoku(erret) }
    Image(v, "Stoku", modifier)
}

/** Etiketa në krye të Stoku-t (stk-etiketa): STOKU, barkodi (me një shufër portokalli) dhe emri i përdoruesit */
@Composable
fun EtiketaStoku(emri: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val n = N
    val forma = RoundedCornerShape(10.dp)
    Column(
        modifier.width(152.dp).clip(forma).background(n.surface).border(1.dp, n.line, forma).clickable(onClick = onClick).padding(start = 14.dp, end = 14.dp, top = 7.dp, bottom = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        Text("STOKU", style = tx(18, 800, n.ink).copy(letterSpacing = 3.sp),
            modifier = Modifier.padding(start = 3.dp))
        val ink = n.ink; val qel = n.qelibar
        Canvas(Modifier.size(104.dp, 14.dp)) {
            val sh = size.width / 36f
            listOf(0f to 3f, 5f to 2f, 9f to 4f, 15f to 2f, 19f to 3f, 24f to 2f, 28f to 4f, 34f to 2f).forEachIndexed { i, (x, w) ->
                drawRoundRect(if (i == 4) qel else ink, Offset(x * sh, 0f), Size(w * sh, size.height), CornerRadius(0f))
            }
        }
        Text(emri, style = txMono(10f, n.muted, 500).copy(letterSpacing = 1.sp),
            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.height(13.dp))
    }
}

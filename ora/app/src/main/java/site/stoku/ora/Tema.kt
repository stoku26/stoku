package site.stoku.ora

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Icon

// Ngjyra kryesore e aplikacionit të orës (Cilësimet → Pamja). Ruhet në orë; e verdha është ajo e Stoku-t.
object Tema {
    data class Ngjyra(val emri: String, val c: Color)

    val NGJYRAT = listOf(
        Ngjyra("E verdhë", Color(0xFFF5B70A)),
        Ngjyra("Portokalli", Color(0xFFFF8A3D)),
        Ngjyra("E kuqe", Color(0xFFFF6B6B)),
        Ngjyra("Rozë", Color(0xFFFF7EB6)),
        Ngjyra("Vjollcë", Color(0xFFB28CFF)),
        Ngjyra("Blu", Color(0xFF5AA9FF)),
        Ngjyra("Bruz", Color(0xFF2ED3C6)),
        Ngjyra("E gjelbër", Color(0xFF5BD97A)),
    )

    var zgjedhur by mutableStateOf(0)
        private set

    val theks: Color get() = NGJYRAT[zgjedhur].c

    fun ngarko(ctx: Context) {
        zgjedhur = ctx.getSharedPreferences("stoku-pamja", Context.MODE_PRIVATE).getInt("ngjyra", 0).coerceIn(0, NGJYRAT.size - 1)
    }

    fun ruaj(ctx: Context, i: Int) {
        zgjedhur = i.coerceIn(0, NGJYRAT.size - 1)
        ctx.getSharedPreferences("stoku-pamja", Context.MODE_PRIVATE).edit().putInt("ngjyra", zgjedhur).apply()
    }
}

// Shigjeta "mbrapa", e njëjta me atë të telefonit (SVG: M15 18l-6-6 6-6, vija 2.4, cepat e rrumbullakët)
val ShigjetaMbrapa: ImageVector by lazy {
    ImageVector.Builder(name = "mbrapa", defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f)
        .path(stroke = SolidColor(Color.White), strokeLineWidth = 2.4f, strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round) {
            moveTo(15f, 18f); lineTo(9f, 12f); lineTo(15f, 6f)
        }
        .build()
}

// Butoni i rrumbullakët "mbrapa" (si te telefoni: rreth me sfond, shigjeta në mes)
@Composable
fun ButoniMbrapa(onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.size(ButtonDefaults.SmallButtonSize),
        colors = ButtonDefaults.buttonColors(backgroundColor = Kartela, contentColor = Color.White),
    ) {
        Icon(imageVector = ShigjetaMbrapa, contentDescription = "Mbrapa", modifier = Modifier.size(20.dp))
    }
}

// Rrethi i ngjyrës te Pamja (me shenjë kur është i zgjedhur)
@Composable
fun RrethiNgjyres(c: Color, zgjedhur: Boolean) {
    Box(Modifier.size(22.dp).background(c, CircleShape), contentAlignment = Alignment.Center) {
        if (zgjedhur) Box(Modifier.size(8.dp).background(Color.Black, CircleShape))
    }
}

package site.stoku.ora

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Icon

// Ngjyra kryesore e aplikacionit të orës: e verdha e Stoku-t. v238: pa zgjedhje ngjyre (Cilësimet → Pamja u hoq):
// ngjyrat e produkteve ndjekin datën e afatit (e kuqe, e verdhë, e gjelbër), jo një ngjyrë të zgjedhur
object Tema {
    val theks: Color = Color(0xFFF5B70A)

    // Zgjedhja e vjetër e ngjyrës (para v238) fshihet nga ora
    fun ngarko(ctx: Context) {
        ctx.getSharedPreferences("stoku-pamja", Context.MODE_PRIVATE).edit().clear().apply()
    }
}

// Ikona e Cilësimeve: e njëjta ingranazh si te shiriti i telefonit (rrethi + dhëmbët, vija 2)
private const val GEAR_D = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
private const val RRETHI_D = "M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0z"

val IkonaCilesimet: ImageVector by lazy {
    val b = ImageVector.Builder(name = "cilesimet", defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f)
    for (d in listOf(RRETHI_D, GEAR_D)) {
        b.addPath(
            pathData = PathParser().parsePathString(d).toNodes(),
            stroke = SolidColor(Color.White), strokeLineWidth = 2f, strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round,
        )
    }
    b.build()
}

// Ikona e rifreskimit (shigjetë rrethore, vija 2, stili i ikonave të telefonit)
val IkonaRifresko: ImageVector by lazy {
    val b = ImageVector.Builder(name = "rifresko", defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f)
    for (d in listOf("M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", "M21 3v5h-5")) {
        b.addPath(
            pathData = PathParser().parsePathString(d).toNodes(),
            stroke = SolidColor(Color.White), strokeLineWidth = 2f, strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round,
        )
    }
    b.build()
}

// Butoni i rrumbullakët i rifreskimit: gjatë ngarkimit vetë ikona sillet rreth vetes (pa e ndërruar butonin)
@Composable
fun ButoniRifresko(duke: Boolean, onClick: () -> Unit) {
    val kendi = remember { Animatable(0f) }
    LaunchedEffect(duke) {
        if (duke) {
            while (true) kendi.animateTo(kendi.value + 360f, tween(durationMillis = 800, easing = LinearEasing))
        } else if (kendi.value % 360f != 0f) {
            // e përfundon rrotullimin e nisur, që ikona të ndalet drejt
            kendi.animateTo((kendi.value / 360f).toInt() * 360f + 360f, tween(durationMillis = 300, easing = LinearEasing))
        }
    }
    Button(
        onClick = { if (!duke) onClick() },
        modifier = Modifier.size(ButtonDefaults.DefaultButtonSize),
        colors = ButtonDefaults.buttonColors(backgroundColor = Kartela, contentColor = if (duke) Verdhe else Color.White),
    ) {
        Icon(imageVector = IkonaRifresko, contentDescription = "Rifresko", modifier = Modifier.size(22.dp).rotate(kendi.value))
    }
}

// v238: ikona e kërkimit (thjerrëza, vija 2, si ikonat e tjera)
val IkonaKerko: ImageVector by lazy {
    val b = ImageVector.Builder(name = "kerko", defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f)
    for (d in listOf("M18 11a7 7 0 1 1-14 0a7 7 0 1 1 14 0z", "M21 21l-4.35-4.35")) {
        b.addPath(
            pathData = PathParser().parsePathString(d).toNodes(),
            stroke = SolidColor(Color.White), strokeLineWidth = 2f, strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round,
        )
    }
    b.build()
}

// v238: butoni i rrumbullakët i kërkimit (produkti, furnizuesi ose barkodi), mes rifreskimit dhe Cilësimeve
@Composable
fun ButoniKerko(onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.size(ButtonDefaults.DefaultButtonSize),
        colors = ButtonDefaults.buttonColors(backgroundColor = Kartela, contentColor = Color.White),
    ) {
        Icon(imageVector = IkonaKerko, contentDescription = "Kërko", modifier = Modifier.size(22.dp))
    }
}

// Butoni i rrumbullakët i Cilësimeve (ingranazhi), me pikë kur ka version të ri
@Composable
fun ButoniCilesimet(kaTeRe: Boolean, onClick: () -> Unit) {
    Box(contentAlignment = Alignment.TopEnd) {
        Button(
            onClick = onClick,
            modifier = Modifier.size(ButtonDefaults.DefaultButtonSize),
            colors = ButtonDefaults.buttonColors(backgroundColor = Kartela, contentColor = Color.White),
        ) {
            Icon(imageVector = IkonaCilesimet, contentDescription = "Cilësimet", modifier = Modifier.size(24.dp))
        }
        if (kaTeRe) Box(Modifier.size(12.dp).background(Verdhe, CircleShape))
    }
}

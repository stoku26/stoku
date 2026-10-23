@file:OptIn(ExperimentalTextApi::class)

package site.stoku.vendas.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import site.stoku.vendas.R

/*
 * Ngjyrat dhe shkronjat e Stoku-t: të njëjtat me css/stoku-tokens.css ("Stoku Premium"), e çelët dhe e errët.
 */
@Immutable
data class Ngjyrat(
    val bg: Color, val surface: Color, val surface2: Color, val sunken: Color, val head: Color,
    val line: Color, val line2: Color,
    val ink: Color, val ink2: Color, val ink3: Color, val ink4: Color, val muted: Color, val faint: Color, val faint2: Color,
    val disabled: Color, val control: Color, val track: Color,
    val accent: Color, val accentPress: Color, val accentText: Color, val accentTint: Color, val accentLine: Color,
    val invBg: Color, val invFg: Color, val hero: Color, val hero2: Color, val heroMuted: Color,
    val tabbar: Color, val overlay: Color,
    val exp: Color, val expTint: Color, val expInk: Color,
    val near: Color, val nearTint: Color, val nearInk: Color,
    val ok: Color, val okTint: Color, val okInk: Color, val okDot: Color,
    val rem: Color, val remTint: Color, val badge: Color,
    val cardExp: Color, val cardExpLine: Color, val cardNear: Color, val cardNearLine: Color,
    val cardOk: Color, val cardOkLine: Color, val cardRem: Color, val cardRemLine: Color,
    val qelibar: Color,
    val ikonat: Map<String, Pair<Color, Color>>, // emri → (sfondi, ngjyra)
    val erret: Boolean
)

private fun c(h: Long) = Color(h or 0xFF000000)

val NgjyratECelet = Ngjyrat(
    bg = c(0xf6f5f2), surface = c(0xffffff), surface2 = c(0xf1efeb), sunken = c(0xebe9e4), head = c(0xfaf9f7),
    line = c(0xe6e4df), line2 = c(0xefede9),
    ink = c(0x14161b), ink2 = c(0x3a3d44), ink3 = c(0x5b5e66), ink4 = c(0x6b6e76), muted = c(0x7a7d85), faint = c(0x8a8d94), faint2 = c(0x9a9da4),
    disabled = c(0xb3b5ba), control = c(0xc9c7c1), track = c(0xd9d7d2),
    accent = c(0x1f5fc4), accentPress = c(0x16479a), accentText = c(0x1f5fc4), accentTint = c(0xeef3fc), accentLine = c(0xd6e2f5),
    invBg = c(0x14161b), invFg = c(0xffffff), hero = c(0x14161b), hero2 = c(0x1c1f25), heroMuted = c(0xa3a6ae),
    tabbar = Color(0xEBFFFFFF), overlay = Color(0x8014161B),
    exp = c(0xc23a33), expTint = c(0xfdecea), expInk = c(0x8f2c27),
    near = c(0xa45f10), nearTint = c(0xfcefd9), nearInk = c(0x7a4e14),
    ok = c(0x2e7d4f), okTint = c(0xe6f5ea), okInk = c(0x2a5e3f), okDot = c(0x3fae6c),
    rem = c(0x6b6e76), remTint = c(0xf1efeb), badge = c(0xd13c32),
    cardExp = c(0xfff6f5), cardExpLine = c(0xf5d8d4), cardNear = c(0xfffaf0), cardNearLine = c(0xf1e0c0),
    cardOk = c(0xf5fbf7), cardOkLine = c(0xd5ecdc), cardRem = c(0xf7f6f3), cardRemLine = c(0xe6e4df),
    qelibar = c(0xe3a42e),
    ikonat = mapOf(
        "blu" to (c(0xe8f0fc) to c(0x1f5fc4)), "vjollce" to (c(0xefeafd) to c(0x6a4bd1)), "portokalli" to (c(0xfdf0e1) to c(0xb5600f)),
        "gjelber" to (c(0xe5f4ea) to c(0x2e7d4f)), "roze" to (c(0xfce8f0) to c(0xc0306b)), "gri" to (c(0xeceae6) to c(0x5b5e66)),
        "kuqe" to (c(0xfdecea) to c(0xc23a33))
    ),
    erret = false
)

val NgjyratEErreta = Ngjyrat(
    bg = c(0x0f1115), surface = c(0x171a20), surface2 = c(0x1f232a), sunken = c(0x1b1e25), head = c(0x1b1e24),
    line = c(0x2a2e36), line2 = c(0x22262d),
    ink = c(0xeceef2), ink2 = c(0xc9ccd3), ink3 = c(0xa9adb5), ink4 = c(0x9ca1aa), muted = c(0x8f949e), faint = c(0x858a94), faint2 = c(0x6f747e),
    disabled = c(0x4a4f58), control = c(0x4a4f59), track = c(0x3a3f48),
    accent = c(0x2f6fd8), accentPress = c(0x255bb8), accentText = c(0x7aaaf2), accentTint = c(0x16223a), accentLine = c(0x24406a),
    invBg = c(0xeceef2), invFg = c(0x14161b), hero = c(0x1e232c), hero2 = c(0x272d37), heroMuted = c(0xa3a6ae),
    tabbar = Color(0xEB171A20), overlay = Color(0x99000000),
    exp = c(0xf07a6f), expTint = c(0x35191a), expInk = c(0xf2a39b),
    near = c(0xf0b95a), nearTint = c(0x33260f), nearInk = c(0xeec989),
    ok = c(0x5cc98b), okTint = c(0x13301f), okInk = c(0x9ad9b1), okDot = c(0x4fbf7f),
    rem = c(0x9ca1aa), remTint = c(0x1f232a), badge = c(0xd13c32),
    cardExp = c(0x1e1517), cardExpLine = c(0x46262a), cardNear = c(0x1e1a12), cardNearLine = c(0x45361b),
    cardOk = c(0x131b17), cardOkLine = c(0x1f3a2a), cardRem = c(0x171a20), cardRemLine = c(0x2a2e36),
    qelibar = c(0xf5b942),
    ikonat = mapOf(
        "blu" to (c(0x16223a) to c(0x7aaaf2)), "vjollce" to (c(0x241e3b) to c(0xb4a2f6)), "portokalli" to (c(0x33250f) to c(0xf0b95a)),
        "gjelber" to (c(0x13301f) to c(0x5cc98b)), "roze" to (c(0x351a27) to c(0xf08bb3)), "gri" to (c(0x23272e) to c(0xa9adb5)),
        "kuqe" to (c(0x35191a) to c(0xf07a6f))
    ),
    erret = true
)

val LocalNgjyrat = staticCompositionLocalOf { NgjyratECelet }
val N: Ngjyrat @Composable get() = LocalNgjyrat.current

private fun onest(w: Int) = Font(R.font.onest, FontWeight(w), variationSettings = FontVariation.Settings(FontVariation.weight(w)))
val Onest = FontFamily(onest(400), onest(500), onest(600), onest(700), onest(800))
private fun mono(w: Int) = Font(R.font.jetbrains_mono, FontWeight(w), variationSettings = FontVariation.Settings(FontVariation.weight(w)))
val Mono = FontFamily(mono(400), mono(500), mono(700))

/** Teksti: Onest (si te web-i) */
fun tx(madhesia: Int, pesha: Int = 400, ngjyra: Color = Color.Unspecified, gjeresia: Double = 0.0) =
    TextStyle(fontFamily = Onest, fontSize = madhesia.sp, fontWeight = FontWeight(pesha), color = ngjyra, letterSpacing = (gjeresia * madhesia).sp)

fun txF(madhesia: Float, pesha: Int = 400, ngjyra: Color = Color.Unspecified) =
    TextStyle(fontFamily = Onest, fontSize = madhesia.sp, fontWeight = FontWeight(pesha), color = ngjyra)

/** Barkodet: JetBrains Mono */
fun txMono(madhesia: Float, ngjyra: Color = Color.Unspecified, pesha: Int = 400) =
    TextStyle(fontFamily = Mono, fontSize = madhesia.sp, fontWeight = FontWeight(pesha), color = ngjyra)

/** Tema: "auto" (si telefoni), "light", "dark" */
@Composable
fun StokuTema(zgjedhja: String, content: @Composable () -> Unit) {
    val erret = when (zgjedhja) { "dark" -> true; "light" -> false; else -> isSystemInDarkTheme() }
    val n = if (erret) NgjyratEErreta else NgjyratECelet
    val skema = if (erret) darkColorScheme(primary = n.accent, background = n.bg, surface = n.surface, onSurface = n.ink, onBackground = n.ink, error = n.exp)
    else lightColorScheme(primary = n.accent, background = n.bg, surface = n.surface, onSurface = n.ink, onBackground = n.ink, error = n.exp)
    CompositionLocalProvider(LocalNgjyrat provides n) {
        MaterialTheme(colorScheme = skema, typography = MaterialTheme.typography.copy(
            bodyLarge = tx(16), bodyMedium = tx(14), labelLarge = tx(14, 600)
        ), content = content)
    }
}

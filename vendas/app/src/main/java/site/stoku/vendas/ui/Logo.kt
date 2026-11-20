package site.stoku.vendas.ui

import site.stoku.vendas.Opsionet

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
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

/** Hyrja 76 (web v314, pronari: "hiqja ikonen ... bone si logo me shkronja te mdhaja"): logoja vetëm me shkronja "stoku.",
 *  shkronjat me ngjyrën e tekstit të temës, pika e gjelbër (Logot.kt, si logot.js). */
fun logoStoku(erret: Boolean, ink: Color = if (erret) Color(0xFFF5F5F7) else Color(0xFF14161B)): ImageVector {
    val a = Color(if (erret) Logot.PIKA_ERRET else Logot.PIKA_CELET)
    val b = ImageVector.Builder(defaultWidth = Logot.FJ_W.dp, defaultHeight = Logot.FJ_H.dp, viewportWidth = Logot.FJ_W, viewportHeight = Logot.FJ_H)
    b.addPath(PathParser().parsePathString(Logot.FJ_T).toNodes(), fill = SolidColor(ink))
    b.addPath(PathParser().parsePathString(Logot.FJ_P).toNodes(), fill = SolidColor(a))
    return b.build()
}

@Composable
fun LogoEPlote(modifier: Modifier = Modifier) {
    val erret = N.erret
    val ink = N.ink
    // web v325: hyrja: barkodi → logo një herë sa herë del (LogoSkanim.kt)
    LogoMeSkanim(ink, Color(if (erret) Logot.PIKA_ERRET else Logot.PIKA_CELET), "Stoku", modifier.aspectRatio(Logot.FJ_W / Logot.FJ_H), luaj = true)
}

/** Etiketa në krye të Stoku-t (stk-etiketa): vetëm logoja me shkronja, pa kuti dhe pa emrin e përdoruesit (Hyrja 76, si web-i v314).
 *  `emri` mbetet vetëm për lexuesin e ekranit. */
@Composable
fun EtiketaStoku(emri: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val n = N
    // web v349: koka e bën skanimin NJË herë për çdo hapje të aplikacionit dhe pas çdo hyrjeje, pastaj vetëm logoja
    val luaj = remember { !SkanimiILogos.kokaLuajti }
    LogoMeSkanim(n.ink, Color(if (n.erret) Logot.PIKA_ERRET else Logot.PIKA_CELET), if (emri.isBlank()) "Stoku" else "Stoku, $emri",
        modifier.clickable(interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }, indication = null, onClick = onClick).width(152.dp).height((152f * Logot.FJ_H / Logot.FJ_W).dp),
        luaj = luaj, kurNis = { SkanimiILogos.kokaLuajti = true })
}

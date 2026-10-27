package site.stoku.vendas.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em

/*
 * Pjesët e faqeve të Cilësimeve, njësoj si te web-i (css/stoku.css: .opsione-krye, .ops-grupi, .kategori-rresht,
 * .opsion-rresht, .ops-radio, .ops-karta, .ops-intro, .ops-furn-rresht, .btn.ops-btn-dyte).
 */

/** Teksti me lartësinë e rreshtit si te CSS-i (line-height) */
fun txR(madhesia: Float, pesha: Int, ngjyra: Color, rreshti: Float = 1.45f): TextStyle = txF(madhesia, pesha, ngjyra).copy(lineHeight = rreshti.em)

/** Faqja e Cilësimeve: butoni i rrumbullakët "mbrapa" (40 px) + titulli 26 px, poshtë përmbajtja që lëviz */
@Composable
fun FaqjaECilesimeve(titulli: String, mbrapa: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    val n = N
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().heightIn(min = 58.dp).padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(40.dp).clip(CircleShape).background(n.surface).border(1.dp, n.line, CircleShape).clickable(onClick = mbrapa),
                contentAlignment = Alignment.Center) { Icon(Ik.Mbrapa, "Mbrapa", Modifier.size(20.dp), tint = n.ink) }
            Spacer(Modifier.width(14.dp))
            Text(titulli, style = tx(26, 700, n.ink, -0.025), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().padding(horizontal = 20.dp).padding(top = 8.dp, bottom = 28.dp),
            content = content)
    }
}

/** .ops-intro: teksti hyrës gri i faqes */
@Composable
fun IntroOps(teksti: String, modifier: Modifier = Modifier) {
    Text(teksti, style = txR(14f, 400, N.ink4), modifier = modifier.padding(start = 4.dp, end = 4.dp, top = 2.dp, bottom = 16.dp))
}

/** .ops-grupi-titull: "APLIKACIONI", "NJOFTIMI DITOR PËR AFATET" */
@Composable
fun TitulliGrupit(teksti: String, pare: Boolean = false) {
    Text(teksti.uppercase(), style = tx(12, 700, N.faint, 0.06), modifier = Modifier.padding(start = 4.dp, end = 4.dp, top = if (pare) 4.dp else 22.dp, bottom = 8.dp))
}

/** .ops-grupi: kutia e bardhë me rreshta të ndarë me vijë */
@Composable
fun GrupiOps(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val n = N
    val f = RoundedCornerShape(20.dp)
    Column(modifier.fillMaxWidth().clip(f).background(n.surface).border(1.dp, n.line, f), content = content)
}

/** .ops-karta: karta e bardhë me hapësirë 16 px */
@Composable
fun KartaOps(modifier: Modifier = Modifier, hapesira: Dp = 16.dp, content: @Composable ColumnScope.() -> Unit) {
    val n = N
    val f = RoundedCornerShape(20.dp)
    Column(modifier.padding(bottom = 12.dp).fillMaxWidth().clip(f).background(n.surface).border(1.dp, n.line, f).padding(hapesira), content = content)
}

/** Vija ndarëse brenda grupit (nga 66 px, pas ikonës) */
@Composable
fun VijaGrupit(fillimi: Dp = 66.dp) {
    Box(Modifier.padding(start = fillimi).fillMaxWidth().height(1.dp).background(N.line2))
}

/** .kat-ikona-badge: katrori 36 px me ikonën */
@Composable
fun IkonaEKategorise(ikona: ImageVector, ngj: String, madhesia: Dp = 36.dp, rrezja: Dp = 11.dp, ikonaMadhesia: Dp = 18.dp) =
    IkonaMeNgjyre(ikona, ngj, madhesia = madhesia, rrezja = rrezja, ikonaMadhesia = ikonaMadhesia)

/** .kategori-rresht: ikona, titulli, statusi dhe "›" */
@Composable
fun RreshtKategorie(ikona: ImageVector, ngj: String, titulli: String, statusi: String, pritje: Boolean = false, vije: Boolean = false, onClick: () -> Unit) {
    val n = N
    Column {
        if (vije) VijaGrupit()
        Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 13.dp), verticalAlignment = Alignment.CenterVertically) {
            IkonaEKategorise(ikona, ngj)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(titulli, style = txF(15.5f, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (statusi.isNotEmpty()) Text(statusi, style = txF(12.5f, if (pritje) 600 else 400, if (pritje) n.ikonat["portokalli"]!!.second else n.muted),
                    maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 2.dp))
            }
            Spacer(Modifier.width(8.dp))
            Text("›", style = tx(20, 400, n.faint2))
        }
    }
}

/** .ndez: çelësi (i gjelbër kur është i ndezur) */
@Composable
fun Ndezesi(ndezur: Boolean, aktiv: Boolean = true, ndrysho: (Boolean) -> Unit) {
    val n = N
    Switch(ndezur, ndrysho, enabled = aktiv, colors = SwitchDefaults.colors(
        checkedTrackColor = n.okDot, checkedThumbColor = Color.White, checkedBorderColor = n.okDot,
        uncheckedTrackColor = n.track, uncheckedThumbColor = Color.White, uncheckedBorderColor = n.track,
        disabledCheckedTrackColor = n.okDot.copy(alpha = 0.45f), disabledCheckedThumbColor = Color.White,
        disabledUncheckedTrackColor = n.track.copy(alpha = 0.6f), disabledUncheckedThumbColor = Color.White, disabledUncheckedBorderColor = Color.Transparent))
}

/** label.opsion-rresht: ikona (lart), titulli me shpjegimin dhe çelësi */
@Composable
fun RreshtNdezes(ikona: ImageVector?, ngj: String, titulli: String, hint: String, ndezur: Boolean, vije: Boolean = false, aktiv: Boolean = true,
                 fillimiIVijes: Dp = 66.dp, ndrysho: (Boolean) -> Unit) {
    val n = N
    Column {
        if (vije) VijaGrupit(if (ikona == null) 0.dp else fillimiIVijes)
        Row(Modifier.fillMaxWidth().clickable(enabled = aktiv) { ndrysho(!ndezur) }.padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically) {
            if (ikona != null) {
                Box(Modifier.align(Alignment.Top)) { IkonaEKategorise(ikona, ngj) }
                Spacer(Modifier.width(14.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(titulli, style = txR(15f, 600, if (aktiv) n.ink else n.disabled, 1.3f))
                if (hint.isNotEmpty()) Text(hint, style = txR(12.5f, 400, if (aktiv) n.muted else n.disabled, 1.4f), modifier = Modifier.padding(top = 3.dp))
            }
            Spacer(Modifier.width(12.dp))
            Ndezesi(ndezur, aktiv, ndrysho)
        }
    }
}

/** .ops-radio: rreshti me rreth zgjedhjeje */
@Composable
fun RreshtRadio(ikona: ImageVector, ngj: String, titulli: String, hint: String, aktiv: Boolean, vije: Boolean = false, onClick: () -> Unit) {
    val n = N
    Column {
        if (vije) VijaGrupit()
        Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 13.dp), verticalAlignment = Alignment.CenterVertically) {
            IkonaEKategorise(ikona, ngj)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(titulli, style = txR(15f, 600, n.ink, 1.3f))
                if (hint.isNotEmpty()) Text(hint, style = txR(12.5f, 400, n.muted, 1.4f), modifier = Modifier.padding(top = 3.dp))
            }
            Spacer(Modifier.width(12.dp))
            // box-shadow: inset 0 0 0 2px (i pazgjedhur) / 7px blu (i zgjedhur)
            Box(Modifier.size(22.dp).clip(CircleShape).background(if (aktiv) n.accent else Color.Transparent)
                .border(2.dp, if (aktiv) n.accent else n.control, CircleShape), contentAlignment = Alignment.Center) {
                if (aktiv) Box(Modifier.size(8.dp).clip(CircleShape).background(n.surface))
            }
        }
    }
}

/** .btn.ops-btn-dyte: butoni gri me tekst blu (ose të kuq) */
@Composable
fun ButonOps(teksti: String, onClick: () -> Unit, modifier: Modifier = Modifier, aktiv: Boolean = true, kuqe: Boolean = false, lartesia: Dp = 44.dp) {
    val n = N
    val f = RoundedCornerShape(14.dp)
    Box(modifier.heightIn(min = lartesia).clip(f).background(n.surface2).clickable(enabled = aktiv, onClick = onClick).padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center) {
        Text(teksti, style = txF(14.5f, 600, if (!aktiv) n.disabled else if (kuqe) n.exp else n.accentText), maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** .ops-furn-rresht: shkronja me ngjyrë, emri, nënteksti dhe (opsionale) lapsi ose "›" */
@Composable
fun RreshtListe(shkronja: String, ngj: String, titulli: String, nen: String, nenPritje: Boolean = false, vije: Boolean = false,
                djathtas: String? = null, onClick: (() -> Unit)? = null) {
    val n = N
    Column {
        if (vije) VijaGrupit()
        var m = Modifier.fillMaxWidth()
        if (onClick != null) m = m.clickable(onClick = onClick)
        Row(m.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            val (sf, ng) = n.ikonat[ngj] ?: n.ikonat["gri"]!!
            Box(Modifier.size(36.dp).clip(RoundedCornerShape(11.dp)).background(sf), contentAlignment = Alignment.Center) {
                Text(shkronja, style = tx(15, 700, ng))
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(titulli, style = tx(15, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (nen.isNotEmpty()) Text(nen, style = txR(12.5f, if (nenPritje) 600 else 400, if (nenPritje) n.ikonat["portokalli"]!!.second else n.muted, 1.4f),
                    modifier = Modifier.padding(top = 2.dp))
            }
            when (djathtas) {
                "laps" -> { Spacer(Modifier.width(10.dp)); Icon(Ik.Laps, null, Modifier.size(18.dp), tint = n.faint) }
                "shigjeta" -> { Spacer(Modifier.width(10.dp)); Text("›", style = tx(20, 400, n.faint2)) }
            }
        }
    }
}

/** .ops-furn-bosh: teksti kur lista është bosh */
@Composable
fun BoshOps(teksti: String) {
    Text(teksti, style = tx(14, 400, N.muted), modifier = Modifier.padding(16.dp))
}

/** .ops-ll-krye: ikona e madhe (48 px) me titullin dhe statusin */
@Composable
fun KokaEKartes(ikona: ImageVector, ngj: String, titulli: String, statusi: String, modifier: Modifier = Modifier) {
    val n = N
    Row(modifier.fillMaxWidth().padding(bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
        IkonaMeNgjyre(ikona, ngj, madhesia = 48.dp, rrezja = 15.dp, ikonaMadhesia = 22.dp)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(titulli, style = tx(18, 700, n.ink, -0.01), maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (statusi.isNotEmpty()) Text(statusi, style = txR(12.5f, 400, n.muted, 1.4f))
        }
    }
}

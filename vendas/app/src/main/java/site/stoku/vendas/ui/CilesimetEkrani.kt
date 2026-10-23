package site.stoku.vendas.ui

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import site.stoku.vendas.BuildConfig
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Perditesimi
import site.stoku.vendas.Sinkronizimi
import site.stoku.vendas.StokuApp

private val TEMAT = listOf("auto" to "Automatike", "light" to "E çelët", "dark" to "E errët")
private val RENDET = listOf("i_ri" to "Më të rejat së pari", "emri" to "Emri (A–Z)", "emriZA" to "Emri (Z–A)", "sasiaUlet" to "Sasia (nga më e vogla)", "sasiaLart" to "Sasia (nga më e madhja)")

/** Cilësimet: llogaria, pamja, renditja e stokut, versioni */
@Composable
fun CilesimetEkrani(tema: String, ndryshoTemen: (String) -> Unit) {
    val n = N
    val ctx = LocalContext.current
    val p by Llogaria.perdoruesi.collectAsState()
    val statusi by Sinkronizimi.statusi.collectAsState()
    var flete by remember { mutableStateOf("") }
    var rendi by remember { mutableStateOf(rendi()) }
    var dil by remember { mutableStateOf(false) }
    val hapMarketet by site.stoku.vendas.Merchandiseri.hapFaqen.collectAsState()
    LaunchedEffect(hapMarketet) { if (hapMarketet) { flete = "marketet"; site.stoku.vendas.Merchandiseri.hapFaqen.value = false } }
    site.stoku.vendas.Dyqani.gjendja.collectAsState().value
    site.stoku.vendas.Merchandiseri.aktivi.collectAsState().value

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(top = 12.dp, bottom = 24.dp)) {
        Text("Cilësimet", style = tx(26, 700, n.ink, -0.025))
        Hapesire(18.dp)
        // Llogaria
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(22.dp))
            .clickable { flete = "llogaria" }.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(52.dp).shadow(10.dp, CircleShape, spotColor = n.accent).clip(CircleShape)
                .background(Brush.linearGradient(listOf(Color(0xFF3A7BE0), n.accent))), contentAlignment = Alignment.Center) {
                Text((p?.emri?.firstOrNull() ?: 'S').uppercase(), style = tx(22, 700, Color.White))
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(p?.emri ?: "", style = tx(18, 700, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(statusi.ifEmpty { "Ende s'është sinkronizuar." }, style = tx(13, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Text("›", style = tx(20, 400, n.faint))
        }
        Seksioni("Aplikacioni") {
            Rreshti(Ik.Hena, "vjollce", "Pamja", TEMAT.first { it.first == tema }.second) { flete = "tema" }
            if (Llogaria.leja("stoku")) Rreshti(Ik.Rendi, "portokalli", "Stoku", RENDET.first { it.first == rendi }.second, vije = true) { flete = "rendi" }
            if (Llogaria.leja("marketet")) Rreshti(Ik.Vendi, "gjelber", "Marketet", statusiIMarketeve(), vije = true) { flete = "marketet" }
        }
        Seksioni("Llogaria") {
            Rreshti(Ik.Re, "gjelber", "Llogaria", p?.emri ?: "") { flete = "llogaria" }
        }
        Seksioni("Rreth Stoku") {
            Rreshti(Ik.Telefon, "blu", "Aplikacioni Stoku", "Versioni " + BuildConfig.VERSION_NAME) { (ctx as? Activity)?.let { Perditesimi.kontrollo(it, true) } }
            Rreshti(Ik.Mburoja, "blu", "Privatësia", "Si i ruan Stoku të dhënat", vije = true) {
                try { ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://stoku.site/privatesia.html"))) } catch (e: Exception) { }
            }
        }
        Hapesire(16.dp)
        Text("Stoku për Android. Të dhënat janë të njëjtat si te stoku.site dhe në kompjuter.",
            style = tx(12, 400, n.muted), modifier = Modifier.padding(horizontal = 4.dp))
    }

    when (flete) {
        "marketet" -> MarketetFlete { flete = "" }
        "tema" -> Flete({ flete = "" }) {
            Text("Pamja", style = tx(22, 700, n.ink, -0.02))
            Zgjedhjet(TEMAT, tema) { ndryshoTemen(it); flete = "" }
        }
        "rendi" -> Flete({ flete = "" }) {
            Text("Renditja e produkteve", style = tx(22, 700, n.ink, -0.02))
            Zgjedhjet(RENDET, rendi) { StokuApp.vendosPref("rendi", it); rendi = it; flete = "" }
        }
        "llogaria" -> Flete({ flete = "" }) {
            Text("Llogaria", style = tx(22, 700, n.ink, -0.02))
            Text("Lista ruhet në internet dhe sinkronizohet vetë në krejt pajisjet e llogarisë (telefon, PDA, kompjuter), që të mos humbet nëse fshihet aplikacioni ose ndërrohet telefoni.",
                style = tx(14, 400, n.ink2))
            Text("Përdoruesi: " + (p?.emri ?: ""), style = tx(15, 600, n.ink))
            Text(statusi.ifEmpty { "Ende s'është sinkronizuar." }, style = tx(14, 400, n.muted))
            Buton("Sinkronizo tani", { Sinkronizimi.rifresko() }, Modifier.fillMaxWidth(), lloji = "dyte", ikona = Ik.RePune)
            Buton("Dil nga llogaria", { dil = true }, Modifier.fillMaxWidth(), lloji = "rrezik", ikona = Ik.Dil)
        }
    }
    if (dil) Konfirmo("Të dilet nga llogaria?", "Të dhënat mbeten të ruajtura në llogari (cloud). Pas daljes, aplikacioni kërkon përsëri emrin e përdoruesit dhe fjalëkalimin.",
        "Dil", mbyll = { dil = false }) { flete = ""; Sinkronizimi.dergoNesePret(); Llogaria.dil() }
}

@Composable
private fun Seksioni(titulli: String, content: @Composable () -> Unit) {
    val n = N
    Hapesire(22.dp)
    Text(titulli.uppercase(), style = tx(13, 700, n.muted, 0.08), modifier = Modifier.padding(start = 8.dp, bottom = 10.dp))
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(22.dp))) { content() }
}

@Composable
private fun Rreshti(ikona: ImageVector, ngj: String, titulli: String, nen: String, vije: Boolean = false, onClick: () -> Unit) {
    val n = N
    Column {
        if (vije) Box(Modifier.padding(start = 66.dp).fillMaxWidth().height(1.dp).background(n.line2))
        Row(Modifier.fillMaxWidth().clickable(onClick = onClick).heightIn(min = 64.dp).padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            IkonaMeNgjyre(ikona, ngj, madhesia = 36.dp, rrezja = 10.dp, ikonaMadhesia = 19.dp)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(titulli, style = tx(16, 600, n.ink))
                if (nen.isNotEmpty()) Text(nen, style = tx(13, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Text("›", style = tx(20, 400, n.faint))
        }
    }
}

@Composable
private fun Zgjedhjet(lista: List<Pair<String, String>>, aktiv: String, zgjidh: (String) -> Unit) {
    val n = N
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).border(1.dp, n.line, RoundedCornerShape(16.dp))) {
        lista.forEachIndexed { i, (k, t) ->
            if (i > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
            Row(Modifier.fillMaxWidth().clickable { zgjidh(k) }.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Text(t, style = tx(15, if (k == aktiv) 600 else 500, n.ink))
                if (k == aktiv) Icon(Ik.Kontroll, null, Modifier.size(20.dp), tint = n.accent)
            }
        }
    }
}

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
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
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
import site.stoku.vendas.Opsionet
import site.stoku.vendas.TeRejat
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
    var rikthe by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val madhesia by Opsionet.madhesia.collectAsState()
    val pda by Opsionet.pda.collectAsState()
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
            Rreshti(Ik.Hena, "vjollce", "Pamja", TEMAT.first { it.first == tema }.second + (if (madhesia == "e_madhe") " · E madhe" else "")) { flete = "tema" }
            Rreshti(Ik.Skano, "blu", "Skanimi", if (pda) "PDA i ndezur" else "Kamera dhe skaneri", vije = true) { flete = "skanimi" }
            if (Llogaria.leja("stoku")) Rreshti(Ik.Rendi, "portokalli", "Stoku", RENDET.first { it.first == rendi }.second, vije = true) { flete = "rendi" }
            if (Llogaria.leja("marketet")) Rreshti(Ik.Vendi, "gjelber", "Marketet", statusiIMarketeve(), vije = true) { flete = "marketet" }
        }
        Seksioni("Llogaria") {
            Rreshti(Ik.Re, "gjelber", "Llogaria", p?.emri ?: "") { flete = "llogaria" }
        }
        Seksioni("Rreth Stoku") {
            Rreshti(Ik.TeRejat, "roze", "Çka ka të re", TeRejat.LISTA.first().titulli) { flete = "terejat" }
            Rreshti(Ik.Telefon, "blu", "Aplikacioni Stoku", "Versioni " + BuildConfig.VERSION_NAME, vije = true) { (ctx as? Activity)?.let { Perditesimi.kontrollo(it, true) } }
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
            Text("Tema", style = tx(13, 700, n.muted, 0.06))
            Zgjedhjet(TEMAT, tema) { ndryshoTemen(it) }
            Text("\"Automatike\" ndjek cilësimin e telefonit.", style = tx(13, 400, n.muted))
            Text("Madhësia e shkronjave", style = tx(13, 700, n.muted, 0.06), modifier = Modifier.padding(top = 6.dp))
            Zgjedhjet(listOf("normale" to "Normale", "e_madhe" to "E madhe"), madhesia) { Opsionet.vendosMadhesine(it) }
            Text("Rrit pak madhësinë e gjithë tekstit dhe butonave, për lexueshmëri më të lehtë.", style = tx(13, 400, n.muted))
        }
        "skanimi" -> SkanimiFlete { flete = "" }
        "terejat" -> TeRejatFlete(TeRejat.LISTA) { flete = "" }
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
            Buton("Rikthe nga cloud", { rikthe = true }, Modifier.fillMaxWidth(), lloji = "dyte", ikona = Ik.Shkarko)
            NdryshimiILlogarise()
            Buton("Dil nga llogaria", { dil = true }, Modifier.fillMaxWidth(), lloji = "rrezik", ikona = Ik.Dil)
        }
    }
    if (rikthe) {
        val nr = site.stoku.vendas.Dyqani.g.produktet.size
        Konfirmo("Të rikthehen të dhënat nga cloud?",
            (if (nr == 1) "Do të zëvendësohet produkti aktual" else "Do të zëvendësohen të gjitha $nr produktet aktuale") +
                " me ato të ruajtura në cloud për këtë llogari.\n\nKy veprim nuk kthehet.", "Rikthe", mbyll = { rikthe = false }) {
            scope.launch {
                Toast.trego("Duke rikthyer nga cloud…", 2000)
                val r = Sinkronizimi.riktheNgaCloud()
                Toast.trego(when (r) { null -> "S'u lexua cloud-i. Kontrollo internetin dhe provo përsëri."; -1 -> "S'ka asnjë të dhënë të ruajtur në cloud për këtë llogari."; else -> "U rikthye nga cloud." }, 4000)
            }
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

// ---------------- Skanimi (si Cilësimet → Skanimi te web-i) ----------------
@Composable
private fun SkanimiFlete(mbyll: () -> Unit) {
    val n = N
    val pda by Opsionet.pda.collectAsState()
    val paTastiere by Opsionet.paTastiere.collectAsState()
    val paEmer by Opsionet.paEmer.collectAsState()
    val tingulli by Opsionet.tingulli.collectAsState()
    val kursori by Opsionet.kursori.collectAsState()
    var pyetPaEmer by remember { mutableStateOf(false) }
    Flete(mbyll) {
        Text("Skanimi", style = tx(22, 700, n.ink, -0.02))
        Text("Si punon skanimi me kamerë, me PDA ose me skaner të lidhur.", style = tx(14, 400, n.muted))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).border(1.dp, n.line, RoundedCornerShape(16.dp))) {
            RreshtiNdezes("Ky është PDA (skaner i brendshëm)", "Kur është ndezur: ekrani kyçet në portret (pa u rrotulluar anash ose përmbys), fshihet butoni i kamerës dhe kursori qëndron te fusha e barkodit.",
                pda) { Opsionet.vendosPda(it) }
            if (pda) RreshtiNdezes("Fshih tastierën në ekran", "Tastiera e Android-it s'del më te Stoku: shkruan me tastierën e PDA-së dhe me skanerin. Vlen vetëm kur është ndezur PDA.",
                paTastiere, vije = true) { Opsionet.vendosPaTastiere(it); Toast.trego(if (it) "Tastiera në ekran s'del më. Shkruaj me tastierën e PDA-së." else "Tastiera në ekran del përsëri.") }
            if (Llogaria.leja("stoku")) RreshtiNdezes("Skano vetëm barkodin dhe sasinë (pa emër)", "Nuk rekomandohet. Produktet e reja regjistrohen pa emër dhe fusha e emrit fshihet.",
                paEmer, vije = true) { if (it) pyetPaEmer = true else Opsionet.vendosPaEmer(false) }
            if (!pda) RreshtiNdezes("Tingulli kur skanon me kamerë", "Një bip i shkurtër sa herë lexohet një barkod.", tingulli, vije = true) { Opsionet.vendosTingullin(it) }
            if (!pda) RreshtiNdezes("Kursori te fusha e barkodit", "Për skanerët me USB ose Bluetooth që shkruajnë barkodin vetë: pas ruajtjes kursori kthehet te barkodi.",
                kursori, vije = true) { Opsionet.vendosKursorin(it) }
        }
    }
    if (pyetPaEmer) PaEmerKonfirmo({ pyetPaEmer = false }) { Opsionet.vendosPaEmer(true) }
}

@Composable
private fun RreshtiNdezes(titulli: String, nen: String, ndezur: Boolean, vije: Boolean = false, ndrysho: (Boolean) -> Unit) {
    val n = N
    Column {
        if (vije) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
        Row(Modifier.fillMaxWidth().clickable { ndrysho(!ndezur) }.padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(titulli, style = tx(15, 600, n.ink))
                Text(nen, style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 3.dp))
            }
            Spacer(Modifier.width(12.dp))
            androidx.compose.material3.Switch(ndezur, ndrysho, colors = androidx.compose.material3.SwitchDefaults.colors(
                checkedTrackColor = n.accent, checkedThumbColor = Color.White, uncheckedTrackColor = n.track, uncheckedThumbColor = Color.White, uncheckedBorderColor = n.track))
        }
    }
}

/** "Pa emër" ndizet vetëm pas paralajmërimit dhe 5 sekondave (si te web-i) */
@Composable
private fun PaEmerKonfirmo(mbyll: () -> Unit, po: () -> Unit) {
    val n = N
    var mbetur by remember { mutableStateOf(5) }
    LaunchedEffect(Unit) { while (mbetur > 0) { kotlinx.coroutines.delay(1000); mbetur-- } }
    androidx.compose.ui.window.Dialog(onDismissRequest = mbyll) {
        Column(Modifier.clip(RoundedCornerShape(24.dp)).background(n.surface).padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Të regjistrohen produktet pa emër?", style = tx(20, 700, n.ink, -0.02))
            Text("Nuk rekomandohet të regjistrohen produktet pa emër. Në listë dhe në Excel do të shihet vetëm barkodi, kështu që është më e vështirë të gjesh, të kontrollosh ose të njohësh një produkt më vonë, sidomos nëse ndonjë barkod është skenuar gabim.\n\nProdukteve që kanë tashmë emër nuk u fshihet emri.\n\nNëse je i sigurt, prit 5 sekonda dhe shtyp \"Aktivizo\".",
                style = tx(15, 400, n.ink2))
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Buton("Anulo", mbyll, Modifier.weight(1f), lloji = "dyte")
                Buton(if (mbetur > 0) "Aktivizo ($mbetur)" else "Aktivizo", { mbyll(); po() }, Modifier.weight(1f), aktiv = mbetur == 0, lloji = "kuqe")
            }
        }
    }
}

// ---------------- Llogaria: emri dhe fjalëkalimi ----------------
@Composable
private fun NdryshimiILlogarise() {
    val n = N
    val scope = rememberCoroutineScope()
    var emriRi by remember { mutableStateOf("") }
    var fjRi by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf("") }
    var duke by remember { mutableStateOf(false) }
    // Veprimi që pret konfirmimin e fjalëkalimit aktual ("emri" ose "fjalekalimi")
    var ritentim by remember { mutableStateOf<String?>(null) }
    var fjAktual by remember { mutableStateOf("") }

    fun emri() {
        val e = emriRi.trim()
        if (e.isEmpty()) { gabim = "Shkruaj emrin e ri të përdoruesit."; return }
        if (!Regex("^[a-zA-Z0-9_.-]{3,40}$").matches(e)) { gabim = "Emri i përdoruesit duhet të ketë të paktën 3 shkronja/numra (a–z, 0–9, _ . -)."; return }
        duke = true; gabim = ""
        scope.launch {
            val r = Llogaria.ndryshoEmrin(e)
            duke = false
            when (r) {
                null -> { emriRi = ""; ritentim = null; Toast.trego("Emri i përdoruesit u ndryshua.") }
                "rihyrje" -> { ritentim = "emri"; gabim = "Për siguri, konfirmo fjalëkalimin aktual për ta vazhduar ndryshimin." }
                "zene" -> gabim = "Ky emër përdoruesi është zënë tashmë. Provo një tjetër."
                "konfigurim" -> gabim = "Ndryshimi i emrit s'lejohet nga cilësimet e Firebase-it (Email enumeration protection). Administratori duhet ta fikë te Firebase console → Authentication → Settings → User actions."
                "emri" -> gabim = "Emri i përdoruesit duhet të ketë të paktën 3 shkronja/numra (a–z, 0–9, _ . -)."
                else -> gabim = "Diçka shkoi keq. Kontrollo internetin dhe provo përsëri."
            }
        }
    }
    fun fjalekalimi() {
        if (fjRi.isEmpty()) { gabim = "Shkruaj fjalëkalimin e ri."; return }
        if (fjRi.length < 6) { gabim = "Fjalëkalimi duhet të ketë të paktën 6 shkronja/numra."; return }
        duke = true; gabim = ""
        scope.launch {
            val r = Llogaria.ndryshoFjalekalimin(fjRi)
            duke = false
            when (r) {
                null -> { fjRi = ""; ritentim = null; Toast.trego("Fjalëkalimi u ndryshua.") }
                "rihyrje" -> { ritentim = "fjalekalimi"; gabim = "Për siguri, konfirmo fjalëkalimin aktual për ta vazhduar ndryshimin." }
                "i-dobet" -> gabim = "Fjalëkalimi duhet të ketë të paktën 6 shkronja/numra."
                else -> gabim = "Diçka shkoi keq. Kontrollo internetin dhe provo përsëri."
            }
        }
    }

    Text("TË DHËNAT E HYRJES", style = tx(13, 700, n.muted, 0.06), modifier = Modifier.padding(top = 8.dp))
    Text("Emri i përdoruesit", style = tx(14, 600, n.ink2))
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Fusha(emriRi, { emriRi = it.trim() }, Modifier.weight(1f), "Emri i ri", kurVeprim = { emri() }, lartesia = 46.dp)
        Buton("Ndrysho", { emri() }, aktiv = !duke, lloji = "dyte", lartesia = 46.dp)
    }
    Text("Fjalëkalimi", style = tx(14, 600, n.ink2))
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Fusha(fjRi, { fjRi = it }, Modifier.weight(1f), "Fjalëkalimi i ri", fjalekalim = true, kurVeprim = { fjalekalimi() }, lartesia = 46.dp)
        Buton("Ndrysho", { fjalekalimi() }, aktiv = !duke, lloji = "dyte", lartesia = 46.dp)
    }
    if (gabim.isNotEmpty()) Text(gabim, style = tx(13, 600, n.exp))
    if (ritentim != null) {
        Fusha(fjAktual, { fjAktual = it }, Modifier.fillMaxWidth(), "Fjalëkalimi aktual", fjalekalim = true, lartesia = 46.dp)
        Buton("Konfirmo dhe vazhdo", {
            duke = true
            scope.launch {
                val ok = Llogaria.riautentifikohu(fjAktual)
                duke = false
                if (!ok) { gabim = "Fjalëkalimi aktual s'është i saktë."; return@launch }
                fjAktual = ""
                if (ritentim == "emri") emri() else fjalekalimi()
            }
        }, Modifier.fillMaxWidth(), aktiv = !duke && fjAktual.isNotEmpty())
    }
}

// ---------------- Çka ka të re ----------------
@Composable
fun TeRejatFlete(lista: List<TeRejat.Hyrja>, mbyll: () -> Unit) {
    val n = N
    Flete({ TeRejat.shenoTeLexuara(); mbyll() }) {
        Text("Çka ka të re", style = tx(22, 700, n.ink, -0.02))
        lista.forEach { h ->
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(n.surface2).padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(h.titulli, style = tx(16, 700, n.ink))
                Text(h.data.split("-").reversed().joinToString("."), style = tx(12, 500, n.muted))
                h.pikat.forEach { p ->
                    Row { Text("•", style = tx(14, 700, n.accentText)); Spacer(Modifier.width(8.dp)); Text(p, style = tx(14, 400, n.ink2)) }
                }
            }
        }
        Buton("Mbyll", { TeRejat.shenoTeLexuara(); mbyll() }, Modifier.fillMaxWidth())
    }
}

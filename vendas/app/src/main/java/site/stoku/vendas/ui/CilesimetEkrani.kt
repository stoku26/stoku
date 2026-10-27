package site.stoku.vendas.ui

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import site.stoku.vendas.BuildConfig
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Opsionet
import site.stoku.vendas.Perditesimi
import site.stoku.vendas.Sinkronizimi
import site.stoku.vendas.StokuApp
import site.stoku.vendas.TeRejat

private val TEMAT = listOf("auto" to "Automatike", "light" to "E çelët", "dark" to "E errët")

/** Renditja e produkteve (si #rendiLista te web-i): çelësi, titulli, shpjegimi, ikona, ngjyra */
private class Rendi(val k: String, val titulli: String, val hint: String, val ikona: ImageVector, val ngj: String)
private val RENDET = listOf(
    Rendi("i_ri", "Më të rejat së pari", "Ato që i ke shtuar ose ndryshuar së fundi dalin lart.", Ik.Kohe, "blu"),
    Rendi("emri", "Emri (A–Z)", "Sipas alfabetit, nga A te Zh.", Ik.RendiAZ, "vjollce"),
    Rendi("emriZA", "Emri (Z–A)", "Sipas alfabetit, së prapthi.", Ik.RendiZA, "vjollce"),
    Rendi("sasiaUlet", "Sasia: nga më e vogla", "Produktet që po mbarojnë dalin lart.", Ik.SasiaUlet, "portokalli"),
    Rendi("sasiaLart", "Sasia: nga më e madhja", "Produktet me më shumë copë dalin lart.", Ik.SasiaLart, "gjelber")
)

/** Faqet brenda faqeve (PRINDI_I_FAQES te app-tel.js): "mbrapa" kthehet te prindi */
private val PRINDI = mapOf("furnPritje" to "lista", "furnizuesit" to "lista", "pritje" to "lista", "produktet" to "lista",
    "perdoruesi" to "perdoruesit", "perdoruesiAfatet" to "perdoruesi")

/** Rreshti i menysë (ikona, ngjyra, titulli, statusi, a pret kontrollin, faqja që hap) */
private class RreshtiMenyse(val ik: ImageVector, val ngj: String, val titulli: String, val statusi: String, val pritje: Boolean, val hap: () -> Unit)

/** Cilësimet: menyja dhe faqet e saj, si te web-i (secila faqe me "mbrapa" dhe titull) */
@Composable
fun CilesimetEkrani(tema: String, ndryshoTemen: (String) -> Unit) {
    var faqja by rememberSaveable { mutableStateOf("") }
    var pdUid by rememberSaveable { mutableStateOf<String?>(null) }
    var teRejat by remember { mutableStateOf(false) }
    val hapMarketet by site.stoku.vendas.Merchandiseri.hapFaqen.collectAsState()
    LaunchedEffect(hapMarketet) { if (hapMarketet) { faqja = "marketet"; site.stoku.vendas.Merchandiseri.hapFaqen.value = false } }
    val p by Llogaria.perdoruesi.collectAsState()
    site.stoku.vendas.Dyqani.gjendja.collectAsState().value
    val mbrapa: () -> Unit = { faqja = PRINDI[faqja] ?: "" }
    BackHandler(enabled = faqja.isNotEmpty()) { mbrapa() }
    // Leja u hoq ndërsa faqja ishte e hapur: kthehu te menyja (si aktivizoTabin te web-i)
    val lejuar = when (faqja) {
        "ora" -> Llogaria.leja("ora")
        "marketet" -> Llogaria.leja("marketet") || Llogaria.eshteAdmin() // v256: edhe administratori (harta)
        "lista", "furnPritje", "furnizuesit", "pritje", "produktet" -> Llogaria.leja("stoku")
        "perdoruesit", "perdoruesi", "perdoruesiAfatet" -> site.stoku.vendas.Admini.eshteAdmin()
        "llogaria" -> p != null || Llogaria.eshteVizitor()
        else -> true
    }
    LaunchedEffect(lejuar, faqja) { if (!lejuar) faqja = "" }

    when (faqja) {
        "pamja" -> FaqjaECilesimeve("Pamja", mbrapa) { Pamja(tema, ndryshoTemen) }
        "skenimi" -> FaqjaECilesimeve("Skenimi", mbrapa) { Skenimi() }
        "njoftimet" -> NjoftimetFaqja(mbrapa)
        "ora" -> OraFaqja(mbrapa)
        "marketet" -> MarketetFaqja(mbrapa)
        "lista" -> FaqjaECilesimeve("Stoku", mbrapa) { StokuCilesimet { faqja = it } }
        "furnPritje" -> FurnizuesitFaqja(true, mbrapa)
        "furnizuesit" -> FurnizuesitFaqja(false, mbrapa)
        "pritje" -> ProduktetFaqja(true, mbrapa)
        "produktet" -> ProduktetFaqja(false, mbrapa)
        "perdoruesit" -> PerdoruesitFaqja(mbrapa) { pdUid = it; faqja = "perdoruesi" }
        "perdoruesi" -> PerdoruesiFaqja(pdUid, mbrapa) { faqja = "perdoruesiAfatet" }
        "perdoruesiAfatet" -> PerdoruesiAfatetFaqja(pdUid, mbrapa)
        "llogaria" -> LlogariaFaqja(mbrapa)
        else -> Menyja(tema, { faqja = it }, { teRejat = true })
    }
    if (teRejat) TeRejatFlete(TeRejat.LISTA.take(6), ngaCilesimet = true) { teRejat = false }
}

// ---------------- Menyja ----------------
@Composable
private fun Menyja(tema: String, hap: (String) -> Unit, hapTeRejat: () -> Unit) {
    val n = N
    val ctx = LocalContext.current
    val p by Llogaria.perdoruesi.collectAsState()
    val statusi by Sinkronizimi.statusi.collectAsState()
    val pda by Opsionet.pda.collectAsState()
    val njVersioni by site.stoku.vendas.Push.versioni.collectAsState()
    site.stoku.vendas.Merchandiseri.aktivi.collectAsState().value
    val kujtesa by KujtesaUI.versioni.collectAsState()
    val ll by site.stoku.vendas.Admini.llogarite.collectAsState()
    val lj by site.stoku.vendas.Admini.lejet.collectAsState()
    LaunchedEffect(p?.uid) { site.stoku.vendas.Fotot.rifresko() }
    val nP = remember(kujtesa) { KujtesaUI.numriPerKontroll() }
    val stPd = remember(ll, lj) { statusiIPerdoruesve() }
    val stNj = remember(njVersioni) { statusiINjoftimeve(ctx) }
    // Rreshtat e "Aplikacioni" (si #kategoriMenu te web-i), vetëm ata që lejohen
    val rreshtat = listOfNotNull(
        RreshtiMenyse(Ik.Hena, "vjollce", "Pamja", TEMAT.first { it.first == tema }.second, false) { hap("pamja") },
        RreshtiMenyse(Ik.Skano, "blu", "Skenimi", if (pda) "PDA i ndezur" else "PDA i fikur", false) { hap("skenimi") },
        RreshtiMenyse(Ik.Zile, "vjollce", "Njoftimet", stNj, false) { hap("njoftimet") },
        if (Llogaria.leja("ora")) RreshtiMenyse(Ik.Ora, "blu", "Ora e dorës", "Galaxy Watch, Apple Watch", false) { hap("ora") } else null,
        if (Llogaria.leja("marketet") || Llogaria.eshteAdmin()) RreshtiMenyse(Ik.Vendi, "gjelber", "Marketet", statusiIMarketeve(), false) { hap("marketet") } else null,
        if (Llogaria.leja("stoku")) RreshtiMenyse(Ik.Rendi, "portokalli", "Stoku", if (nP > 0) (if (nP == 1) "1 produkt i ri për kontroll" else "$nP produkte të reja për kontroll")
            else RENDET.first { it.k == rendi() }.titulli, nP > 0) { hap("lista") } else null,
        if (site.stoku.vendas.Admini.eshteAdmin()) RreshtiMenyse(Ik.Perdoruesit, "kuqe", "Përdoruesit", stPd, stPd.contains("pa u kontrolluar")) { hap("perdoruesit") } else null
    )
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().heightIn(min = 58.dp).padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("Cilësimet", style = tx(26, 700, n.ink, -0.025))
        }
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(top = 8.dp, bottom = 28.dp)) {
            // .ops-profil
            Row(Modifier.padding(top = 4.dp).fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(22.dp))
                .clickable { hap("llogaria") }.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                AvatariMadh(p?.emri ?: "?", madhesia = 52, uid = p?.uid)
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    val viz = p == null && Llogaria.eshteVizitor()
                    Text(p?.emri ?: if (viz) "Vizitor" else "Pa llogari", style = tx(18, 700, n.ink, -0.01), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(if (viz) "Provë pa llogari, vetëm në këtë telefon" else statusi.ifEmpty { "Ende s'është sinkronizuar." }, style = txF(12.5f, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Text("›", style = tx(20, 400, n.faint2))
            }
            TitulliGrupit("Aplikacioni")
            GrupiOps { rreshtat.forEachIndexed { i, r -> RreshtKategorie(r.ik, r.ngj, r.titulli, r.statusi, r.pritje, i > 0, r.hap) } }
            TitulliGrupit("Llogaria")
            GrupiOps { RreshtKategorie(Ik.Re, "gjelber", "Llogaria", p?.emri ?: if (Llogaria.eshteVizitor()) "Vizitor · provë" else "Jo i kyçur") { hap("llogaria") } }
            TitulliGrupit("Rreth Stoku")
            GrupiOps {
                RreshtKategorie(Ik.TeRejat, "roze", "Çka ka të re", "Ndryshimet e fundit në Stoku", onClick = hapTeRejat)
                RreshtKategorie(Ik.Mburoja, "blu", "Privatësia", "Çka ruan Stoku dhe kush e sheh", vije = true) {
                    try { ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://stoku.site/privatesia.html"))) } catch (e: Exception) { }
                }
            }
            // .ops-app-btn: brenda aplikacionit "Kontrollo për përditësim"
            Row(Modifier.padding(top = 18.dp).align(Alignment.CenterHorizontally).heightIn(min = 34.dp).clip(RoundedCornerShape(50))
                .border(1.dp, n.line, RoundedCornerShape(50)).clickable { (ctx as? Activity)?.let { Perditesimi.kontrollo(it, true) } }
                .padding(horizontal = 16.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Ik.Telefon, null, Modifier.size(16.dp), tint = n.muted)
                Spacer(Modifier.width(7.dp))
                Text("Kontrollo për përditësim", style = tx(13, 600, n.ink2))
            }
            // .ops-fundi
            Text(buildAnnotatedString {
                withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = n.ink2)) { append("Stoku") }
                append(" " + BuildConfig.VERSION_NAME)
            }, style = tx(13, 400, n.muted), textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 6.dp))
        }
    }
}

// ---------------- Pamja ----------------
@Composable
private fun Pamja(tema: String, ndryshoTemen: (String) -> Unit) {
    val n = N
    val madhesia by Opsionet.madhesia.collectAsState()
    IntroOps("Zgjidh si duket Stoku në këtë telefon. Ndryshimet shihen menjëherë në shembullin poshtë.")
    // .ops-shembull: një afat si shembull
    Box(Modifier.padding(bottom = 12.dp).fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(n.sunken).padding(12.dp)) {
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(n.cardNear).border(1.dp, n.cardNearLine, RoundedCornerShape(18.dp)).padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            KutiaEDiteve("afer", 3)
            Column(Modifier.weight(1f)) {
                Text("Qumësht i freskët 1L", style = tx(15, 600, n.ink))
                Text("Furnizuesi · 12 copë · 04.10.2026", style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 3.dp))
                Text("Skadon pas 3 ditësh.", style = tx(12, 600, n.near), modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
    KartaOps {
        Text("Tema", style = tx(15, 700, n.ink, -0.005), modifier = Modifier.padding(bottom = 12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            TEMAT.forEach { (k, t) -> ZgjedhjaEPamjes(t, tema == k, Modifier.weight(1f), { ndryshoTemen(k) }) { MockETemes(k) } }
        }
        Text("\"Automatike\" ndjek cilësimin e telefonit.", style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(top = 12.dp))
    }
    KartaOps {
        Text("Madhësia e shkronjave", style = tx(15, 700, n.ink, -0.005), modifier = Modifier.padding(bottom = 12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf("normale" to "Normale", "e_madhe" to "E madhe").forEach { (k, t) ->
                ZgjedhjaEPamjes(t, madhesia == k, Modifier.weight(1f), { Opsionet.vendosMadhesine(k) }) {
                    Box(Modifier.height(52.dp), contentAlignment = Alignment.Center) { Text("Aa", style = tx(if (k == "e_madhe") 30 else 20, 700, n.ink, -0.02)) }
                }
            }
        }
        Text("Rrit pak madhësinë e gjithë tekstit dhe butonave, për lexueshmëri më të lehtë.", style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(top = 12.dp))
    }
}

/** .ops-tema / .ops-madhesia button: pllaka me shembullin dhe emrin */
@Composable
private fun ZgjedhjaEPamjes(emri: String, aktiv: Boolean, modifier: Modifier, zgjidh: () -> Unit, shembulli: @Composable () -> Unit) {
    val n = N
    val f = RoundedCornerShape(16.dp)
    Column(modifier.clip(f).background(if (aktiv) n.accentTint else n.surface2).then(if (aktiv) Modifier.border(2.dp, n.accent, f) else Modifier)
        .clickable(onClick = zgjidh).padding(start = 8.dp, end = 8.dp, top = 10.dp, bottom = 11.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(9.dp)) {
        shembulli()
        Text(emri, style = txF(13.5f, 600, if (aktiv) n.accentText else n.ink3), maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** .ops-mock: ekrani i vogël i temës (e çelët, e errët ose gjysmë-gjysmë) */
@Composable
private fun MockETemes(lloji: String) {
    val celet = Color(0xFFF6F5F2); val erret = Color(0xFF0F1115)
    val inkC = Color(0xFF14161B); val inkE = Color(0xFFECEEF2)
    val rC = Color.White; val rE = Color(0xFF1F232A); val vijaR = Color(0xFFE6E4DF); val qelibar = Color(0xFFF0B95A)
    Canvas(Modifier.widthIn(max = 84.dp).fillMaxWidth().height(66.dp).clip(RoundedCornerShape(11.dp))) {
        val dp = density
        val w = size.width
        when (lloji) {
            "light" -> drawRect(celet)
            "dark" -> drawRect(erret)
            else -> { drawRect(celet, size = Size(w / 2, size.height)); drawRect(erret, Offset(w / 2, 0f), Size(w / 2, size.height)) }
        }
        val p = 8 * dp
        val brenda = w - 2 * p
        // vija e titullit
        if (lloji == "auto") {
            val gj = brenda * 0.92f
            drawRoundRect(inkC, Offset(p, p), Size(gj * 0.46f, 6 * dp), CornerRadius(3 * dp))
            drawRoundRect(inkE, Offset(p + gj * 0.54f, p), Size(gj * 0.46f, 6 * dp), CornerRadius(3 * dp))
        } else drawRoundRect(if (lloji == "dark") inkE else inkC, Offset(p, p), Size(brenda * 0.46f, 6 * dp), CornerRadius(3 * dp))
        // dy rreshtat
        listOf(21f, 42f).forEachIndexed { i, y ->
            val top = y * dp
            if (lloji == "auto") {
                drawRoundRect(Brush.horizontalGradient(0f to rC, 0.5f to rC, 0.5f to rE, 1f to rE, startX = p, endX = p + brenda), Offset(p, top), Size(brenda, 16 * dp), CornerRadius(5 * dp))
            } else drawRoundRect(if (lloji == "dark") rE else rC, Offset(p, top), Size(brenda, 16 * dp), CornerRadius(5 * dp))
            if (lloji == "light") drawRoundRect(vijaR, Offset(p, top), Size(brenda, 16 * dp), CornerRadius(5 * dp), style = Stroke(1 * dp))
            if (i == 0) drawRoundRect(qelibar, Offset(p + 4 * dp, top + 4 * dp), Size(8 * dp, 8 * dp), CornerRadius(3 * dp))
        }
        drawRoundRect(if (lloji == "dark") Color(0x1AFFFFFF) else Color(0x14000000), Offset.Zero, size, CornerRadius(11 * dp), style = Stroke(1 * dp))
    }
}

// ---------------- Skenimi ----------------
@Composable
private fun Skenimi() {
    val pda by Opsionet.pda.collectAsState()
    val paTastiere by Opsionet.paTastiere.collectAsState()
    val paEmer by Opsionet.paEmer.collectAsState()
    val tingulli by Opsionet.tingulli.collectAsState()
    val kursori by Opsionet.kursori.collectAsState()
    var pyetPaEmer by remember { mutableStateOf(false) }
    IntroOps("Si punon skanimi me kamerë, me PDA ose me skaner të lidhur.")
    GrupiOps {
        RreshtNdezes(Ik.Pda, "blu", "Ky është PDA (skaner i brendshëm)", "Kur është ndezur: ekrani kyçet në portret (pa u rrotulluar anash ose përmbys), fshihet butoni i kamerës dhe kursori qëndron te fusha e barkodit.",
            pda) { Opsionet.vendosPda(it) }
        if (pda) RreshtNdezes(Ik.Tastiera, "gri", "Fshih tastierën në ekran", "Tastiera e Android-it s'del më te Stoku: shkruan me tastierën e PDA-së dhe me skanerin. Vlen vetëm kur është ndezur PDA.",
            paTastiere, vije = true) { Opsionet.vendosPaTastiere(it); Toast.trego(if (it) "Tastiera në ekran s'del më. Shkruaj me tastierën e PDA-së." else "Tastiera në ekran del përsëri.") }
        if (Llogaria.leja("stoku")) RreshtNdezes(Ik.Etiketa, "portokalli", "Skano vetëm barkodin dhe sasinë (pa emër)", "Nuk rekomandohet. Produktet e reja regjistrohen pa emër dhe fusha e emrit fshihet.",
            paEmer, vije = true) { if (it) pyetPaEmer = true else Opsionet.vendosPaEmer(false) }
        if (!pda) RreshtNdezes(Ik.Tingull, "vjollce", "Tingulli kur skanon me kamerë", "Një bip i shkurtër sa herë lexohet një barkod.", tingulli, vije = true) { Opsionet.vendosTingullin(it) }
        if (!pda) RreshtNdezes(Ik.Kursori, "gjelber", "Kursori te fusha e barkodit", "Për skanerët me USB ose Bluetooth që shkruajnë barkodin vetë.",
            kursori, vije = true) { Opsionet.vendosKursorin(it) }
    }
    if (pyetPaEmer) PaEmerKonfirmo({ pyetPaEmer = false }) { Opsionet.vendosPaEmer(true) }
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

// ---------------- Stoku: renditja + furnizuesit dhe produktet ----------------
@Composable
private fun StokuCilesimet(hap: (String) -> Unit) {
    var rendi by remember { mutableStateOf(rendi()) }
    val kujtesa by KujtesaUI.versioni.collectAsState()
    TitulliGrupit("Renditja e produkteve", pare = true)
    IntroOps("Si renditen produktet brenda një folderi. Zgjedhja ruhet në këtë telefon.")
    GrupiOps {
        RENDET.forEachIndexed { i, r ->
            RreshtRadio(r.ikona, r.ngj, r.titulli, r.hint, rendi == r.k, vije = i > 0) { StokuApp.vendosPref("rendi", r.k); rendi = r.k }
        }
    }
    val h = remember(kujtesa) { KujtesaUI.hyrjetEStokut() }
    TitulliGrupit("Furnizuesit dhe produktet")
    GrupiOps {
        var vije = false
        if (h.furnPritje > 0) { RreshtKategorie(Ik.Kamion, "vjollce", "Furnizuesit e rinj", if (h.furnPritje == 1) "1 pret kontrollin" else "${h.furnPritje} presin kontrollin", pritje = true) { hap("furnPritje") }; vije = true }
        RreshtKategorie(Ik.Kamion, "portokalli", "Furnizuesit", if (h.furnizues > 0) (if (h.furnizues == 1) "1 furnizues" else "${h.furnizues} furnizues") else "Ende s'ka", vije = vije) { hap("furnizuesit") }
        if (h.produktePritje > 0) RreshtKategorie(Ik.Kuti, "portokalli", "Produktet e reja", if (h.produktePritje == 1) "1 pret kontrollin" else "${h.produktePritje} presin kontrollin", pritje = true, vije = true) { hap("pritje") }
        RreshtKategorie(Ik.Barkod, "blu", "Produktet", if (h.produkte > 0) (if (h.produkte == 1) "1 produkt" else "${h.produkte} produkte") else "Ende s'ka", vije = true) { hap("produktet") }
    }
}

// ---------------- Llogaria ----------------
@Composable
private fun LlogariaFaqja(mbrapa: () -> Unit) {
    val n = N
    val scope = rememberCoroutineScope()
    val p by Llogaria.perdoruesi.collectAsState()
    val statusi by Sinkronizimi.statusi.collectAsState()
    val gabimS by Sinkronizimi.gabim.collectAsState()
    var dil by remember { mutableStateOf(false) }
    var rikthe by remember { mutableStateOf(false) }
    var rinis by remember { mutableStateOf(false) }
    // Prova si vizitor (si #cloudHyrjeSeksion.si-vizitor te web-i): hyrja/llogaria e re, ose prova nga e para
    if (p == null) {
        FaqjaECilesimeve("Llogaria", mbrapa) {
            KartaOps {
                Text("Je si vizitor", style = tx(18, 700, n.ink, -0.01))
                Text("Këto janë të dhëna shembull dhe ruhen vetëm në këtë telefon: provo lirisht. Me llogari ruhen në cloud, i sheh në çdo pajisje dhe punon me Grupin. Kur hyn, prova fshihet.",
                    style = tx(14, 400, n.ink2), modifier = Modifier.padding(top = 6.dp, bottom = 14.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Buton("Hyr ose krijo llogari", { Llogaria.hapHyrjenNgaProva() }, Modifier.fillMaxWidth())
                    ButonOps("Fillo nga e para", { rinis = true }, Modifier.fillMaxWidth())
                }
            }
        }
        if (rinis) Konfirmo("Të fillojë prova nga e para?", "Ndryshimet e tua në provë fshihen dhe kthehen të dhënat shembull.", "Fillo nga e para",
            mbyll = { rinis = false }) { Llogaria.rinisProven(); Toast.trego("Prova filloi nga e para.") }
        return
    }
    FaqjaECilesimeve("Llogaria", mbrapa) {
        KartaOps {
            Row(Modifier.fillMaxWidth().padding(bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                AvatariMadh(p?.emri ?: "?", uid = p?.uid)
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(p?.emri ?: "", style = tx(18, 700, n.ink, -0.01), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                        // .ops-pika: pika e gjelbër me unazë
                        Box(Modifier.size(14.dp).clip(CircleShape).background(if (gabimS) n.expTint else n.okTint), contentAlignment = Alignment.Center) {
                            Box(Modifier.size(8.dp).clip(CircleShape).background(if (gabimS) n.exp else n.okDot))
                        }
                        Spacer(Modifier.width(6.dp))
                        Text(statusi.ifEmpty { "Ende s'është sinkronizuar." }, style = txF(12.5f, 400, n.muted))
                    }
                }
            }
            FotoJaProfilit()
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ButonOps("Sinkronizo tani", { Sinkronizimi.rifresko() }, Modifier.weight(1f))
                ButonOps("Rikthe nga cloud", { rikthe = true }, Modifier.weight(1f))
            }
        }
        KopjaEFshirave()
        TitulliGrupit("Të dhënat e hyrjes")
        NdryshimiILlogarise()
        // .ops-dil
        Box(Modifier.padding(top = 4.dp).fillMaxWidth().heightIn(min = 50.dp).clip(RoundedCornerShape(18.dp)).background(n.surface)
            .border(1.dp, n.line, RoundedCornerShape(18.dp)).clickable { dil = true }, contentAlignment = Alignment.Center) {
            Text("Dil nga llogaria", style = tx(15, 700, n.exp))
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
        "Dil", mbyll = { dil = false }) {
            Sinkronizimi.dergoNesePret()
            // Kjo pajisje s'merr më njoftimet e kësaj llogarie (orari ditor dhe Grupi); pa internet s'e ndal daljen
            Toast.trego("Duke dalë…")
            scope.launch { try { kotlinx.coroutines.withTimeoutOrNull(9000) { site.stoku.vendas.Push.caktivizo() } } catch (e: Exception) { }; Llogaria.dil() }
        }
}

@Composable
private fun TitulliIFushes(ik: ImageVector, ngj: String, t: String) {
    Row(Modifier.padding(bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        IkonaMeNgjyre(ik, ngj, madhesia = 28.dp, rrezja = 9.dp, ikonaMadhesia = 16.dp)
        Spacer(Modifier.width(10.dp))
        Text(t, style = txF(14.5f, 700, N.ink))
    }
}

/** Të dhënat e hyrjes (si #llogariaBrendaSeksion): emri i përdoruesit dhe fjalëkalimi */
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
    KartaOps {
        TitulliIFushes(Ik.Personi, "blu", "Emri i përdoruesit")
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Fusha(emriRi, { emriRi = it.trim() }, Modifier.weight(1f), "Emri i ri", kurVeprim = { emri() }, lartesia = 46.dp)
            ButonOps("Ndrysho", { emri() }, aktiv = !duke, lartesia = 46.dp)
        }
        // .ops-ndares: vija nga skaji në skaj i kartës
        Box(Modifier.padding(top = 16.dp, bottom = 14.dp).layout { m, c -> // margin: 16px -16px 14px
            val pd = 16.dp.roundToPx(); val w = c.maxWidth + 2 * pd
            val pl = m.measure(c.copy(minWidth = w, maxWidth = w))
            layout(c.maxWidth, pl.height) { pl.place(-pd, 0) }
        }.height(1.dp).background(n.line2))
        TitulliIFushes(Ik.Celesi, "portokalli", "Fjalëkalimi")
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Fusha(fjRi, { fjRi = it }, Modifier.weight(1f), "Fjalëkalimi i ri", fjalekalim = true, kurVeprim = { fjalekalimi() }, lartesia = 46.dp)
            ButonOps("Ndrysho", { fjalekalimi() }, aktiv = !duke, lartesia = 46.dp)
        }
        if (gabim.isNotEmpty()) Text(gabim, style = txR(12.5f, 600, n.exp), modifier = Modifier.padding(top = 10.dp))
        if (ritentim != null) {
            Fusha(fjAktual, { fjAktual = it }, Modifier.fillMaxWidth().padding(top = 12.dp), "Fjalëkalimi aktual", fjalekalim = true, lartesia = 46.dp)
            Buton("Konfirmo dhe vazhdo", {
                duke = true
                scope.launch {
                    val ok = Llogaria.riautentifikohu(fjAktual)
                    duke = false
                    if (!ok) { gabim = "Fjalëkalimi aktual s'është i saktë."; return@launch }
                    fjAktual = ""
                    if (ritentim == "emri") emri() else fjalekalimi()
                }
            }, Modifier.fillMaxWidth().padding(top = 8.dp), aktiv = !duke && fjAktual.isNotEmpty())
        }
    }
}

// ---------------- Çka ka të re (si #dlgTeRejat) ----------------
private val MUAJT = listOf("janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor")
/** "2026-10-23" → "23 tetor 2026" (si dataEPlote te teRejat.js) */
private fun dataEPlote(iso: String): String {
    val m = Regex("^(\\d{4})-(\\d{2})-(\\d{2})$").matchEntire(iso) ?: return iso
    return m.groupValues[3].toInt().toString() + " " + MUAJT[m.groupValues[2].toInt() - 1] + " " + m.groupValues[1]
}

@Composable
fun TeRejatFlete(lista: List<TeRejat.Hyrja>, ngaCilesimet: Boolean = false, mbyll: () -> Unit) {
    val n = N
    val nen = if (ngaCilesimet) "Përditësimet e fundit" else if (lista.size == 1) dataEPlote(lista[0].data) else "${lista.size} përditësime të reja"
    Flete({ TeRejat.shenoTeLexuara(); mbyll() }) {
        Row(Modifier.padding(bottom = 2.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(52.dp).shadow(12.dp, RoundedCornerShape(16.dp), spotColor = n.accent).clip(RoundedCornerShape(16.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF6B97DB), n.accent))), contentAlignment = Alignment.Center) {
                Icon(Ik.TeRejat, null, Modifier.size(26.dp), tint = Color.White)
            }
            Spacer(Modifier.width(14.dp))
            Column {
                Text("Çka ka të re", style = tx(22, 700, n.ink, -0.02))
                Text(nen, style = tx(13, 600, n.muted), modifier = Modifier.padding(top = 2.dp))
            }
        }
        Column {
            lista.forEachIndexed { i, h ->
                if (i > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
                Column(Modifier.padding(top = if (i == 0) 2.dp else 12.dp, bottom = 8.dp)) {
                    Text(h.titulli, style = txF(15.5f, 700, n.ink))
                    Text(dataEPlote(h.data), style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 2.dp, bottom = 8.dp))
                    h.pikat.forEach { p ->
                        Row(Modifier.padding(vertical = 4.dp)) {
                            Box(Modifier.padding(start = 4.dp, top = 7.dp).size(8.dp).clip(CircleShape).background(n.accent))
                            Spacer(Modifier.width(12.dp))
                            Text(p, style = txR(14.5f, 400, n.ink2))
                        }
                    }
                }
            }
        }
        Buton("Në rregull", { TeRejat.shenoTeLexuara(); mbyll() }, Modifier.fillMaxWidth())
    }
}

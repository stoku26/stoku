package site.stoku.vendas.ui

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import kotlinx.coroutines.launch
import site.stoku.logjika.Marketet
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Merchandiseri
import kotlin.math.roundToLong

/** Çipi "Je te: X" / "Po sheh: Krejt marketet" / "Marketi: Shto marketin ku punon" (si .mk-chip te web-i) */
@Composable
fun CipiIMarketit(modifier: Modifier = Modifier) {
    val n = N
    Dyqani.gjendja.collectAsState().value
    Merchandiseri.aktivi.collectAsState().value
    Llogaria.lejet.collectAsState().value
    Llogaria.merchandiserIRegjistrimit.collectAsState().value
    val ka = Merchandiseri.kaMarkete()
    val pa = Merchandiseri.paMarkete()
    if (!ka && !pa) return
    val id = Merchandiseri.idAktiv()
    val forma = RoundedCornerShape(16.dp)
    Row(modifier.fillMaxWidth().clip(forma).background(n.surface).border(1.dp, n.line, forma).clickable { Merchandiseri.prekCipin() }
        .padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(Ik.Vendi, null, Modifier.size(18.dp), tint = n.ikonat["gjelber"]!!.second)
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(if (pa) "Marketi" else if (id != null) "Je te" else "Po sheh", style = txF(11.5f, 600, n.muted))
            Text(if (pa) "Shto marketin ku punon" else if (id != null) Merchandiseri.emri(id) else "Krejt marketet", style = tx(15, 700, n.ink),
                maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Icon(Ik.Poshte, null, Modifier.size(16.dp), tint = n.muted)
    }
}

/** Shenja e marketit te karta e afatit (si .af-market) */
@Composable
fun ShenjaEMarketit(emri: String, modifier: Modifier = Modifier) {
    val (sf, ng) = N.ikonat["gjelber"]!!
    Row(modifier.clip(RoundedCornerShape(999.dp)).background(sf).padding(start = 6.dp, end = 8.dp, top = 2.dp, bottom = 2.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(Ik.Vendi, null, Modifier.size(13.dp), tint = ng)
        Spacer(Modifier.width(4.dp))
        Text(emri, style = tx(12, 700, ng), maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** Titulli i grupit të marketit te "Krejt marketet" (si .af-grup-market) */
@Composable
fun TitulliIMarketit(teksti: String) {
    val ng = N.ikonat["gjelber"]!!.second
    Row(Modifier.padding(top = 6.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(Ik.Vendi, null, Modifier.size(13.dp), tint = ng)
        Spacer(Modifier.width(6.dp))
        Text(teksti, style = tx(13, 800, ng, 0.04))
    }
}

private fun largesiaTekst(d: Long) = if (d < 1000) "$d m" else String.format(java.util.Locale.US, "%.1f", d / 1000.0).replace('.', ',') + " km"

/**
 * Dritaret e marketeve (në rrënjë të aplikacionit): "Ku je?", "Market i ri" dhe leja e vendndodhjes. hapMarketet: "Marketet"
 * te "Ku je?" hap Cilësimet → Marketet.
 */
@Composable
fun DritaretEMarketeve(hapMarketet: () -> Unit) {
    val dr by Merchandiseri.dritarja.collectAsState()
    val kerko by Merchandiseri.kerkoLejen.collectAsState()
    val leja = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { r -> Merchandiseri.pasLejes(r.values.any { it }) }
    LaunchedEffect(kerko) {
        if (kerko) try { leja.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) } catch (e: Exception) { Merchandiseri.pasLejes(false) }
    }
    when (val d = dr) {
        is Merchandiseri.Dritarja.KuJe -> KuJe(d, hapMarketet)
        Merchandiseri.Dritarja.MarketIRi -> MarketIRi()
        null -> {}
    }
}

private class Opsioni(val id: String?, val emri: String, val n: Int?, val d: Long?)

/** "Ku je?" / "Në cilin market?" (si dlgMarketi te web-i) */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun KuJe(d: Merchandiseri.Dritarja.KuJe, hapMarketet: () -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val pikat by Merchandiseri.pikat.collectAsState()
    val perTeReja = d.qellimi == "te-reja"
    val marketet = Marketet.pastro(g.marketet)
    val aktiv = Merchandiseri.idAktiv()
    val poz = d.poz
    fun mbyll(v: String?, zgjedhur: Boolean) {
        Merchandiseri.dritarja.value = null
        if (!zgjedhur) return
        if (d.kurZgjedh != null) d.kurZgjedh.invoke(v) else Merchandiseri.zgjidh(v)
    }
    var opsionet = Marketet.rendit(marketet).map { m ->
        Opsioni(m["id"] as String, m["emri"] as String, Merchandiseri.afateAktive(m["id"] as String),
            if (poz != null && Marketet.kaVend(m)) Marketet.largesia((m["lat"] as Number).toDouble(), (m["lng"] as Number).toDouble(), poz.lat, poz.lng).roundToLong() else null)
    }
    var afer = emptyList<Opsioni>()
    if (!perTeReja && poz != null) {
        afer = (opsionet.filter { it.d != null && it.d <= 2000 } + Marketet.pikatAfer(pikat, poz, 2000.0, 6).filter { Marketet.sipasPikes(marketet, it.pika["id"]) == null }
            .map { Opsioni("p:" + it.pika["id"], it.pika["emri"] as String, null, it.largesia) }).sortedBy { it.d }.take(6)
        opsionet = opsionet.filter { o -> afer.none { it === o } }
    }
    val kaTjera = opsionet.isNotEmpty()
    if (!perTeReja) opsionet = opsionet + Opsioni(null, "Krejt marketet", Merchandiseri.afateAktive(null), null)

    Dialog(onDismissRequest = { mbyll(null, false) }) {
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(n.surface).padding(20.dp)) {
            Text(if (perTeReja) "Në cilin market?" else "Ku je?", style = tx(20, 700, n.ink, -0.02))
            val nen = if (perTeReja) "Zgjidh marketin ku i ke këto afate."
            else if (poz != null && d.panjohur) "S'je te asnjë market i njohur. Zgjidh ku je, ose shto këtë vend si market të ri."
            else "Afatet dhe numrat tregohen për marketin që zgjedh. Nëse GPS-i s'e ka gjetur mirë, zgjidhe vetë."
            Text(nen, style = txF(13.5f, 400, n.muted), modifier = Modifier.padding(top = 6.dp, bottom = 10.dp))
            Column(Modifier.heightIn(max = 380.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                @Composable fun titulli(t: String) = Text(t.uppercase(), style = txF(11.5f, 700, n.muted), modifier = Modifier.padding(start = 2.dp, top = 6.dp))
                @Composable fun butoni(o: Opsioni, iAfert: Boolean) {
                    val iZgjedhur = !perTeReja && o.id == aktiv
                    val forma = RoundedCornerShape(14.dp)
                    val ngjVije = if (iZgjedhur) n.accent else n.line
                    Row(Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(forma).background(n.surface)
                        .then(if (iAfert) Modifier.drawBehind {
                            drawRoundRect(ngjVije, cornerRadius = CornerRadius(14.dp.toPx()), style = Stroke(1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f))))
                        } else Modifier.border(if (iZgjedhur) 2.dp else 1.dp, ngjVije, forma))
                        .clickable { mbyll(o.id, true) }.padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(o.emri, style = tx(15, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                        val sh = listOfNotNull(if (iAfert && o.d != null) largesiaTekst(o.d) else null, o.n?.let { if (it == 1) "1 afat" else "$it afate" }).joinToString(" · ")
                        if (sh.isNotEmpty()) Text(sh, style = tx(12, 600, n.muted), modifier = Modifier.padding(start = 8.dp))
                    }
                }
                if (afer.isNotEmpty()) {
                    titulli("Afër teje")
                    afer.forEach { butoni(it, true) }
                    if (kaTjera) titulli("Marketet e tjera")
                }
                opsionet.forEach { butoni(it, false) }
            }
            FlowRow(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.End) {
                Lidhje("+ Market i ri", { mbyll(null, false); Merchandiseri.dritarja.value = Merchandiseri.Dritarja.MarketIRi }, Modifier.padding(10.dp), madhesia = 15)
                if (!perTeReja) Lidhje("Marketet", { mbyll(null, false); hapMarketet() }, Modifier.padding(10.dp), madhesia = 15)
                if (!perTeReja && (Marketet.kaPika(marketet) || pikat.isNotEmpty())) Lidhje("Gjej me GPS", { mbyll(null, false); Merchandiseri.kontrolloGps(true) }, Modifier.padding(10.dp), madhesia = 15)
                Lidhje("Mbyll", { mbyll(null, false) }, Modifier.padding(10.dp), madhesia = 15)
            }
        }
    }
}

/** "Në cilin market je?" / "Market i ri" (si dlgMarketiRi): emri + vendndodhja e tanishme */
@Composable
private fun MarketIRi() {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    var emri by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf("") }
    var punon by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    fun mbyll() { Merchandiseri.dritarja.value = null }
    fun ruaj() {
        if (punon) return
        Merchandiseri.gabimiIEmrit(Merchandiseri.emriIMarketitTeRi(emri))?.let { gabim = it; return }
        gabim = ""
        punon = true
        scope.launch {
            val (gab, r) = Merchandiseri.shtoMarketKetu(emri)
            punon = false
            if (gab != null || r == null) { gabim = gab ?: ""; return@launch }
            mbyll()
            Toast.trego(Merchandiseri.tekstiIMarketitTeRi(r), 7000)
        }
    }
    val leja = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { r ->
        if (r.values.any { it }) ruaj() else gabim = Marketet.tekstiGabimit("leje")
    }
    Dialog(onDismissRequest = { if (!punon) mbyll() }) {
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(n.surface).padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(if (g.marketet.isNotEmpty()) "Market i ri" else "Në cilin market je?", style = tx(20, 700, n.ink, -0.02))
            Text("Shkruaj emrin e marketit ku je tani. Stoku e ruan vendndodhjen e tij (duhet vendndodhja e saktë e telefonit) dhe e shohin krejt merchandiserët.",
                style = txF(13.5f, 400, n.muted))
            Fusha(emri, { emri = it.take(60); gabim = "" }, Modifier.fillMaxWidth(), "Emri i marketit", kurVeprim = { ruaj() })
            if (gabim.isNotEmpty()) Text(gabim, style = tx(13, 600, n.exp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Buton("Më vonë", { mbyll() }, Modifier.weight(1f), lloji = "tekst", aktiv = !punon)
                Buton(if (punon) "Duke e gjetur vendndodhjen…" else "Ruaj marketin", {
                    if (!Merchandiseri.kaLeje()) {
                        try { leja.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) } catch (e: Exception) { ruaj() }
                    } else ruaj()
                }, Modifier.weight(1.6f), aktiv = !punon)
            }
        }
    }
}

/** Cilësimet → Marketet (si faqja "marketet" te web-i): marketi ku je, marketet e Stoku-t, marketi i ri */
@Composable
fun MarketetFlete(mbyll: () -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val aktivi by Merchandiseri.aktivi.collectAsState()
    var emri by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf("") }
    var punon by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val marketet = Marketet.pastro(g.marketet)
    val id = Merchandiseri.idAktiv()
    fun shto() {
        if (punon) return
        Merchandiseri.gabimiIEmrit(Merchandiseri.emriIMarketitTeRi(emri))?.let { gabim = it; return }
        gabim = ""; punon = true
        scope.launch {
            val (gab, r) = Merchandiseri.shtoMarketKetu(emri)
            punon = false
            if (gab != null || r == null) { gabim = gab ?: ""; return@launch }
            emri = ""
            Toast.trego(Merchandiseri.tekstiIMarketitTeRi(r), 7000)
        }
    }
    val leja = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { r ->
        if (r.values.any { it }) shto() else gabim = Marketet.tekstiGabimit("leje")
    }
    Flete(mbyll) {
        Text("Marketet", style = tx(22, 700, n.ink, -0.02))
        if (marketet.isNotEmpty()) {
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(n.surface2).padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(if (id != null) "Je te: " + Merchandiseri.emri(id) else "Krejt marketet", style = tx(16, 700, n.ink))
                Text(if (!Marketet.kaPika(marketet)) "Asnjë market s'ka ende vendndodhje: shtoje kur je brenda marketit."
                    else if (aktivi.menyra == "dore" && id != null) "E zgjodhe me dorë. GPS-i e ndërron vetë pas disa orësh." else "Me GPS, sa herë hap Stoku-n.",
                    style = tx(13, 400, n.muted))
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Buton("Ndrysho", { mbyll(); Merchandiseri.dritarja.value = Merchandiseri.Dritarja.KuJe("zgjidh", Merchandiseri.pozEFundit(), false) }, lloji = "dyte", lartesia = 40.dp)
                    if (Marketet.kaPika(marketet)) Buton("Gjej me GPS", { Merchandiseri.kontrolloGps(true) }, lloji = "dyte", lartesia = 40.dp)
                }
            }
            Text("MARKETET E STOKU-T", style = tx(12, 700, n.muted, 0.06), modifier = Modifier.padding(start = 4.dp, top = 4.dp))
        }
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).border(1.dp, n.line, RoundedCornerShape(18.dp))) {
            if (marketet.isEmpty()) Text("S'ke ende asnjë market. Shto të parin më poshtë.", style = tx(14, 400, n.muted), modifier = Modifier.padding(16.dp))
            Marketet.rendit(marketet).forEachIndexed { i, m ->
                if (i > 0) Box(Modifier.fillMaxWidth().padding(start = 64.dp).heightIn(min = 1.dp).background(n.line2))
                val kaVend = Marketet.kaVend(m)
                val (sf, ng) = n.ikonat[if (kaVend) "gjelber" else "gri"]!!
                val nA = Merchandiseri.afateAktive(m["id"] as String)
                Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(sf), contentAlignment = Alignment.Center) {
                        Text(((m["emri"] as String).firstOrNull() ?: '?').uppercase(), style = tx(15, 700, ng))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text((m["emri"] as String) + if (m["id"] == id) " · je këtu" else "", style = tx(15, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text((if (kaVend) "Me vendndodhje" else "Pa vendndodhje: shtoje sërish me këtë emër kur je brenda tij") + " · " + (if (nA == 1) "1 afat" else "$nA afate"),
                            style = tx(12, 400, n.muted))
                    }
                }
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Fusha(emri, { emri = it.take(60); gabim = "" }, Modifier.weight(1f), "Emri i marketit ku je tani", kurVeprim = { shto() })
            Buton(if (punon) "…" else "Shto", {
                if (!Merchandiseri.kaLeje()) {
                    try { leja.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) } catch (e: Exception) { shto() }
                } else shto()
            }, aktiv = !punon, lartesia = 50.dp)
        }
        if (gabim.isNotEmpty()) Text(gabim, style = tx(13, 600, n.exp))
        Text("Marketet janë të përbashkëta për krejt merchandiserët e Stoku-t. Emrin e ndryshon dhe marketin e fshin vetëm administratori.",
            style = tx(12, 400, n.muted))
    }
}

/** Teksti i rreshtit "Marketet" te Cilësimet */
fun statusiIMarketeve(): String {
    val te = Merchandiseri.marketet()
    val id = Merchandiseri.idAktiv()
    return if (te.isEmpty()) "Për disa markete" else if (id != null) "Je te: " + Merchandiseri.emri(id) else if (te.size == 1) "1 market" else "${te.size} markete"
}

/** Opsionet e marketit te afati (si select#afatMarketi) */
@Composable
fun ZgjedhjaEMarketit(m: String?, iRi: Boolean, vetemLexim: Boolean, ndrysho: (String?) -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val marketet = Marketet.rendit(Marketet.pastro(g.marketet))
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Marketi", style = tx(13, 600, n.ink3))
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Cip(if (iRi) "Zgjidh marketin" else "Pa market", null, m == null) { if (!vetemLexim) ndrysho(null) }
            marketet.forEach { x -> val id = x["id"] as String; Cip(x["emri"] as String, null, m == id) { if (!vetemLexim) ndrysho(id) } }
        }
    }
}

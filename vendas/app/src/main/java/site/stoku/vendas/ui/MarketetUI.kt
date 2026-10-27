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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.ui.platform.LocalFocusManager
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
            else if (poz != null && d.paqarte) "Je afër disa marketeve dhe GPS-i s'i dallon dot. Zgjidh ku je: zgjedhja jote mbetet." // v257
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
    val scope = rememberFusha()
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
/** Një rresht i listës së marketeve (pika e Stoku-t ose marketi im pa pikë) */
private class RreshtiIMarketit(val pika: PikaEHartes, val pikaId: String?, val origjina: String, val market: site.stoku.logjika.Obj?)

/**
 * Cilësimet → Marketet (v256: Marketet + Harta në një faqe, si te web-i): lart "Je te" (merchandiseri), harta, lista e marketeve
 * të Stoku-t (merchandiseri: "je këtu" dhe afatet; administratori: ndryshimi i emrit dhe fshirja e pikës), poshtë shtimi:
 * merchandiseri shton marketin ku është, administratori vendos një market në hartë.
 */
@Composable
fun MarketetFaqja(mbyll: () -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val aktivi by Merchandiseri.aktivi.collectAsState()
    val pikatL by Merchandiseri.pikat.collectAsState()
    val p by Llogaria.perdoruesi.collectAsState()
    Llogaria.lejet.collectAsState().value
    Llogaria.merchandiserIRegjistrimit.collectAsState().value
    val admin = Llogaria.eshteAdmin()
    val merch = Llogaria.leja("marketet")
    val uid = p?.uid.orEmpty()
    var emri by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf("") }
    var punon by remember { mutableStateOf(false) }
    var zgjedhur by remember { mutableStateOf("") }
    var neEditim by remember { mutableStateOf("") }
    var shtoHapur by remember { mutableStateOf(false) }
    var fshirja by remember { mutableStateOf<RreshtiIMarketit?>(null) }
    val kontrolli = remember { HartaKontrolli() }
    val scope = rememberFusha()
    val marketet = Marketet.pastro(g.marketet)
    val id = Merchandiseri.idAktiv()
    // Pikat e hartës dhe rreshtat (si htPikatESistemit / htPikatEMerchandiserit te web-i)
    val rreshtat = remember(pikatL, marketet, admin, merch, uid) {
        val l = ArrayList<RreshtiIMarketit>()
        pikatL.forEach { x ->
            val pid = x["id"] as String
            val nga = (x["krijuarNgaEmri"] as? String).orEmpty()
            val origj = if (admin) (if (nga.isNotEmpty()) "E shtoi $nga" else "Pikë e Stoku-t") + (if (x["emriNgaAdmini"] == true) " · emri nga ti" else "")
                else if (x["krijuarNga"] == uid && uid.isNotEmpty()) "E shtove ti" else if (nga.isNotEmpty()) "E shtoi $nga" else "Market i Stoku-t"
            l.add(RreshtiIMarketit(PikaEHartes("pika|$pid", (x["emri"] as? String).orEmpty(), (x["lat"] as? Number)?.toDouble(), (x["lng"] as? Number)?.toDouble()), pid, origj,
                if (merch) Marketet.sipasPikes(marketet, pid) else null))
        }
        if (merch) {
            val kaPike = pikatL.map { it["id"] }.toSet()
            marketet.filter { it["p"] == null || it["p"] !in kaPike }.forEach { m ->
                val kaVend = Marketet.kaVend(m)
                l.add(RreshtiIMarketit(PikaEHartes(uid + "|" + m["id"], (m["emri"] as? String).orEmpty(), (m["lat"] as? Number)?.toDouble(), (m["lng"] as? Number)?.toDouble()), null,
                    if (kaVend) "Marketi yt" else "Pa vendndodhje: shtoje sërish me këtë emër kur je brenda tij", m))
            }
        }
        l.sortedWith { a, b -> site.stoku.logjika.Afatet.KOLATORI.compare(a.pika.emri, b.pika.emri) }
    }
    val pikatEHartes = remember(rreshtat) { rreshtat.map { it.pika } }
    fun zgjidh(k: String, ngaLista: Boolean) {
        zgjedhur = k
        val r = rreshtat.firstOrNull { it.pika.k == k }
        neEditim = if (admin && r?.pikaId != null) k else ""
        if (ngaLista) kontrolli.fluturo(r?.pika)
    }
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
    FaqjaECilesimeve("Marketet", mbyll) {
        IntroOps(if (admin && !merch) "Marketet e Stoku-t, të njëjtat për krejt merchandiserët. Në hartë dalin vetëm emrat e qyteteve, fshatrave dhe lagjeve. Prek një market në hartë ose te lista për t'ia ndryshuar emrin për krejt Stoku-n. Me \"+ Shto market në hartë\" e vendos një market të ri."
            else "Marketet e Stoku-t, të njëjtat për krejt merchandiserët. Afatet ndahen sipas marketit: te çdo market i sheh vetëm afatet e tij. Stoku e njeh vetë marketin ku je (GPS), vetëm kur je brenda tij. Kur je brenda një marketi që s'është ende këtu, shtoje më poshtë. Emrat i ndryshon vetëm administratori. Vendndodhja jote s'ruhet askund, vetëm ajo e marketeve.")
        if (merch && marketet.isNotEmpty()) {
            KartaOps {
                Text(if (id != null) "Je te: " + Merchandiseri.emri(id) else "Krejt marketet", style = txF(15.5f, 600, n.ink))
                Text(if (!Marketet.kaPika(marketet)) "Asnjë market s'ka ende vendndodhje: shtoje kur je brenda marketit."
                    else if (aktivi.menyra == "dore" && id != null) "E zgjodhe me dorë. GPS-i e ndërron vetë pas disa orësh, ose kur largohesh nga ai market." else "Me GPS, kur je brenda marketit.",
                    style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(top = 2.dp, bottom = 10.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ButonOps("Ndrysho", { Merchandiseri.dritarja.value = Merchandiseri.Dritarja.KuJe("zgjidh", Merchandiseri.pozEFundit(), false) }, Modifier.weight(1f))
                    if (Marketet.kaPika(marketet)) ButonOps("Gjej me GPS", { Merchandiseri.kontrolloGps(true) }, Modifier.weight(1f))
                }
            }
        }
        // Harta
        HartaEMarketeve(pikatEHartes, zgjedhur, shtoHapur, kontrolli, { k -> zgjidh(k, false) }, Modifier.padding(top = 2.dp, bottom = 10.dp))
        if (admin) ShtoNeHarte(shtoHapur, { shtoHapur = it }, kontrolli, pikatL)
        TitulliGrupit("Marketet e Stoku-t")
        val meVend = rreshtat.filter { it.pika.kaVend }; val paVend = rreshtat.filter { !it.pika.kaVend }
        Text((if (meVend.size == 1) "1 pikë në hartë" else "${meVend.size} pika në hartë") + (if (paVend.isNotEmpty()) " · ${paVend.size} pa vendndodhje" else "") + ".",
            style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(start = 4.dp, bottom = 8.dp))
        GrupiOps {
            if (rreshtat.isEmpty()) BoshOps(if (admin && !merch) "Asnjë merchandiser s'ka ruajtur ende market." else "S'ke ende asnjë market. Kur je brenda një marketi, shtoje më poshtë.")
            var i = 0
            meVend.forEach { r -> RreshtiIListes(r, i++ > 0, admin, id, zgjedhur, neEditim, { zgjidh(r.pika.k, true) }, { neEditim = "" }, { fshirja = r }) }
        }
        if (paVend.isNotEmpty()) {
            TitulliGrupit("Pa vendndodhje (s'dalin në hartë)")
            GrupiOps { paVend.forEachIndexed { j, r -> RreshtiIListes(r, j > 0, admin, id, zgjedhur, neEditim, { zgjidh(r.pika.k, true) }, { neEditim = "" }, { fshirja = r }) } }
        }
        if (merch) {
            TitulliGrupit("Market i ri")
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Fusha(emri, { emri = it.take(60); gabim = "" }, Modifier.weight(1f), "Emri i marketit ku je tani", kurVeprim = { shto() }, lartesia = 46.dp)
                Buton(if (punon) "Duke e gjetur vendndodhjen…" else "Shto", {
                    if (!Merchandiseri.kaLeje()) {
                        try { leja.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) } catch (e: Exception) { shto() }
                    } else shto()
                }, aktiv = !punon, lartesia = 46.dp)
            }
            if (gabim.isNotEmpty()) Text(gabim, style = txR(12.5f, 600, n.exp), modifier = Modifier.padding(top = 6.dp))
        }
    }
    fshirja?.let { r ->
        Konfirmo("Të fshihet marketi?", "\"${r.pika.emri}\" hiqet nga harta dhe nga lista e merchandiserëve (te ata që kanë afate aty, mbetet me afatet). Afatet s'fshihen.",
            "Fshije", mbyll = { fshirja = null }) {
            val pid = r.pikaId ?: return@Konfirmo
            scope.launch {
                if (Merchandiseri.fshiPiken(pid)) { neEditim = ""; Toast.trego("Pika u fshi.") }
                else Toast.trego("S'u fshi. Kontrollo internetin dhe provo sërish.", 4000)
            }
        }
    }
}

/** Rreshti i marketit (si htRreshti te web-i); administratori: prekja hap ndryshimin e emrit */
@Composable
private fun RreshtiIListes(r: RreshtiIMarketit, vije: Boolean, admin: Boolean, idAktiv: String?, zgjedhur: String, neEditim: String,
                           prek: () -> Unit, anulo: () -> Unit, fshij: () -> Unit) {
    val n = N
    if (admin && neEditim == r.pika.k && r.pikaId != null) {
        if (vije) VijaGrupit()
        var emri by remember(r.pika.k) { mutableStateOf(r.pika.emri) }
        var gabim by remember(r.pika.k) { mutableStateOf("") }
        var punon by remember { mutableStateOf(false) }
        val scope = rememberFusha()
        fun ruaj() {
            val e = emri.trim().replace(Regex("\\s+"), " ").take(Marketet.EMRI_MAKS)
            if (e.isEmpty()) { gabim = "Shkruaj emrin e pikës."; return }
            if (e == r.pika.emri) { anulo(); return }
            if (Marketet.ekzistonEmri(Merchandiseri.pikat.value.filter { it["id"] != r.pikaId }, e)) { gabim = "Në Stoku ka tashmë një market me këtë emër."; return }
            punon = true; gabim = ""
            scope.launch {
                val ok = Merchandiseri.ndryshoEmrinEPikes(r.pikaId, e)
                punon = false
                if (!ok) { gabim = "Emri s'u ndryshua. Kontrollo internetin dhe provo sërish."; return@launch }
                anulo(); Toast.trego("Emri u ndryshua. Merchandiserët e shohin emrin e ri.", 3500)
            }
        }
        Column(Modifier.fillMaxWidth().background(n.accentTint).padding(horizontal = 16.dp, vertical = 14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Emri i pikës" + (if (r.origjina.startsWith("E shtoi ")) " (" + r.origjina.substringBefore(" · ").lowercase() + ")" else ""), style = txR(12.5f, 400, n.ink4))
            Fusha(emri, { emri = it.take(Marketet.EMRI_MAKS); gabim = "" }, Modifier.fillMaxWidth(), lartesia = 46.dp, kurVeprim = { ruaj() })
            if (gabim.isNotEmpty()) Text(gabim, style = txR(12.5f, 600, n.exp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ButonOps("Fshije pikën", fshij, Modifier.weight(1.2f), kuqe = true)
                ButonOps("Anulo", anulo, Modifier.weight(1f), aktiv = !punon)
                Buton("Ruaj", { ruaj() }, Modifier.weight(1f), aktiv = !punon, lartesia = 44.dp)
            }
        }
        return
    }
    val mm = r.market
    val nA = mm?.let { Merchandiseri.afateAktive(it["id"] as String) } ?: 0
    val zgj = zgjedhur == r.pika.k
    Column(if (zgj) Modifier.background(n.accentTint) else Modifier) {
        RreshtListe(((r.pika.emri.trim().firstOrNull() ?: '?').uppercase()), if (r.pika.kaVend) "blu" else "gri",
            r.pika.emri + if (mm != null && mm["id"] == idAktiv) " · je këtu" else "",
            r.origjina + if (mm != null) " · " + (if (nA == 1) "1 afat" else "$nA afate") else "",
            vije = vije, djathtas = if (admin && r.pikaId != null) "laps" else null, onClick = prek)
    }
}

/** Administratori: "+ Shto market në hartë" (si htShtoRuaj te web-i): pika = qendra e hartës, nën shenjën */
@Composable
private fun ShtoNeHarte(hapur: Boolean, vendos: (Boolean) -> Unit, kontrolli: HartaKontrolli, pikat: List<site.stoku.logjika.Obj>) {
    val n = N
    var emri by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf("") }
    var punon by remember { mutableStateOf(false) }
    val scope = rememberFusha()
    if (!hapur) {
        ButonOps("+ Shto market në hartë", { emri = ""; gabim = ""; vendos(true) }, Modifier.padding(bottom = 4.dp))
        return
    }
    fun ruaj() {
        val e = emri.trim().replace(Regex("\\s+"), " ").take(Marketet.EMRI_MAKS)
        if (!Llogaria.eshteAdmin() || punon) return
        if (e.isEmpty()) { gabim = "Shkruaj emrin e marketit."; return }
        val q = kontrolli.qendra() ?: run { gabim = "Harta s'është hapur ende."; return }
        if (q.third < 15) { gabim = "Zmadho hartën (sa të shihen rrugët) që marketi të vendoset saktë."; return }
        if (Marketet.ekzistonEmri(pikat, e)) { gabim = "Në Stoku ka tashmë një market me këtë emër. Shto edhe vendin, p.sh. \"$e Qendër\"."; return }
        Marketet.pikaShumeAfer(pikat, Marketet.Pozita(q.first, q.second, null))?.let { af ->
            gabim = "Këtu është tashmë marketi \"" + af.pika["emri"] + "\" (" + af.largesia + " m). Vendose shenjën mbi marketin e ri."; return
        }
        punon = true; gabim = ""
        scope.launch {
            val idRe = Merchandiseri.shtoPikenNgaAdmini(e, q.first, q.second)
            punon = false
            if (idRe == null) { gabim = "S'u ruajt. Kontrollo internetin dhe provo sërish."; return@launch }
            vendos(false)
            Toast.trego("\"$e\" u shtua në hartë. Merchandiserët e shohin menjëherë.", 4000)
        }
    }
    Column(Modifier.padding(bottom = 4.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Lëviz hartën derisa shenja në mes të jetë mbi market (zmadho sa të shihen rrugët), shkruaj emrin dhe ruaje.", style = txR(12.5f, 400, n.ink4))
        Fusha(emri, { emri = it.take(Marketet.EMRI_MAKS); gabim = "" }, Modifier.fillMaxWidth(), "Emri i marketit", lartesia = 46.dp, kurVeprim = { ruaj() })
        if (gabim.isNotEmpty()) Text(gabim, style = txR(12.5f, 600, n.exp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ButonOps("Anulo", { vendos(false) }, Modifier.weight(1f), aktiv = !punon)
            Buton("Ruaj këtu", { ruaj() }, Modifier.weight(1f), aktiv = !punon, lartesia = 44.dp)
        }
    }
}

/** Teksti i rreshtit "Marketet" te Cilësimet */
fun statusiIMarketeve(): String {
    if (!Llogaria.leja("marketet")) return "Marketet në hartë" // v256: administratori (harta është brenda Marketeve)
    val te = Merchandiseri.marketet()
    val id = Merchandiseri.idAktiv()
    return if (te.isEmpty()) "Për disa markete" else if (id != null) "Je te: " + Merchandiseri.emri(id) else if (te.size == 1) "1 market" else "${te.size} markete"
}

/** Sa markete dalin njëherësh nën fushë; për të tjerët shkruhen më shumë shkronja */
private const val SUGJERIMET_MAKS = 6

/** Emri pa shkronja të mëdha, pa ë/ç dhe me një hapësirë: "Viva Fresh" = "viva  fresh" = "VIVA FRESH" */
internal fun emriPerKerkim(e: String): String =
    java.text.Normalizer.normalize(e, java.text.Normalizer.Form.NFD).replace(Regex("[\\u0300-\\u036f]"), "")
        .lowercase().replace(Regex("\\s+"), " ").trim()

/**
 * Marketi te afati (si select#afatMarketi te web-i). Fusha ku shkruhet emri; poshtë dalin marketet që e përmbajnë
 * (pa marrë parasysh shkronjat e mëdha, ë/ç). Kur teksti përputhet saktë me një market, ai zgjidhet vetë.
 */
@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun ZgjedhjaEMarketit(m: String?, iRi: Boolean, vetemLexim: Boolean, ndrysho: (String?) -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val marketet = Marketet.rendit(Marketet.pastro(g.marketet))
    val emriZgj = m?.let { Marketet.emri(marketet, it) }.orEmpty()
    var teksti by remember { mutableStateOf(emriZgj) }
    var hapur by remember { mutableStateOf(false) }
    val fokusi = LocalFocusManager.current
    val lista = remember { androidx.compose.foundation.relocation.BringIntoViewRequester() }
    LaunchedEffect(m, emriZgj) { if (m != null) teksti = emriZgj }
    // Lista del poshtë fushës: e sjell në pamje mbi tastierë
    LaunchedEffect(hapur) { if (hapur) { kotlinx.coroutines.delay(350); try { lista.bringIntoView() } catch (e: Exception) { } } }
    fun zgjidh(x: site.stoku.logjika.Obj?) {
        ndrysho(x?.get("id") as? String)
        teksti = x?.let { site.stoku.logjika.jsString(it["emri"]) }.orEmpty()
        hapur = false
        fokusi.clearFocus()
    }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("Marketi", style = tx(13, 600, n.ink3))
        Fusha(teksti, { v ->
            teksti = v; hapur = true
            val q = emriPerKerkim(v)
            val sakte = marketet.filter { emriPerKerkim(site.stoku.logjika.jsString(it["emri"])) == q }
            if (q.isNotEmpty() && sakte.size == 1) { if (sakte[0]["id"] != m) ndrysho(sakte[0]["id"] as String) }
            else if (m != null) ndrysho(null)
        }, Modifier.fillMaxWidth().onFocusChanged { if (it.isFocused && !vetemLexim) hapur = true },
            if (vetemLexim || !iRi) "Pa market" else "Shkruaj emrin e marketit", ikona = Ik.Vendi, vetemLexim = vetemLexim,
            kurVeprim = { hapur = false; fokusi.clearFocus() },
            djathtas = if (!vetemLexim && teksti.isNotEmpty()) ({
                Icon(Ik.X, "Pastro marketin", Modifier.size(28.dp).clip(RoundedCornerShape(8.dp)).clickable { zgjidh(null) }.padding(4.dp), tint = n.faint)
            }) else null)
        if (hapur && !vetemLexim) {
            val q = emriPerKerkim(teksti)
            // Kur fusha ka marketin e zgjedhur, dalin krejt (për ta ndërruar); përndryshe vetëm ata që e përmbajnë tekstin
            val te = if (m != null && q == emriPerKerkim(emriZgj)) marketet
                else marketet.filter { q.isEmpty() || emriPerKerkim(site.stoku.logjika.jsString(it["emri"])).contains(q) }
            Column(Modifier.fillMaxWidth().bringIntoViewRequester(lista).clip(RoundedCornerShape(14.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(14.dp)).padding(6.dp)) {
                if (te.isEmpty()) Text("Asnjë market me këtë emër.", style = tx(14, 400, n.muted), modifier = Modifier.padding(12.dp))
                te.take(SUGJERIMET_MAKS).forEach { x ->
                    val zgj = x["id"] == m
                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(if (zgj) n.accentTint else androidx.compose.ui.graphics.Color.Transparent)
                        .clickable { zgjidh(x) }.padding(horizontal = 12.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Ik.Vendi, null, Modifier.size(16.dp), tint = if (zgj) n.accentText else n.faint)
                        Spacer(Modifier.width(10.dp))
                        Text(site.stoku.logjika.jsString(x["emri"]), style = tx(15, if (zgj) 700 else 500, if (zgj) n.accentText else n.ink),
                            modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        if (zgj) Icon(Ik.Kontroll, null, Modifier.size(18.dp), tint = n.accentText)
                    }
                }
                if (te.size > SUGJERIMET_MAKS) Text("Edhe " + (te.size - SUGJERIMET_MAKS) + " të tjerë: shkruaj më shumë shkronja.",
                    style = tx(13, 400, n.muted), modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
                Text("Mbyll", style = tx(14, 500, n.muted), modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
                    .clickable { hapur = false; fokusi.clearFocus() }.padding(12.dp))
            }
        }
    }
}

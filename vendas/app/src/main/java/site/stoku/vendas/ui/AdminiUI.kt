package site.stoku.vendas.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import site.stoku.logjika.Afatet
import site.stoku.logjika.GrupiLogjika
import site.stoku.logjika.Lejet
import site.stoku.logjika.Marketet
import site.stoku.logjika.Obj
import site.stoku.logjika.jsString
import site.stoku.vendas.Admini

/** Teksti i rreshtit "Përdoruesit" te Cilësimet */
fun statusiIPerdoruesve(): String {
    if (!Admini.gati()) return "Lejet e secilës llogari"
    val l = Admini.lista()
    val rinj = l.count { it.statusi == "ri" }
    return if (rinj > 0) (if (rinj == 1) "1 pa u kontrolluar" else "$rinj pa u kontrolluar") else if (l.size == 1) "1 llogari" else "${l.size} llogari"
}

private fun nenTeksti(r: Admini.Rreshti): String {
    val n = Lejet.teNdaluara(r.lejet)
    val p1 = when (r.statusi) {
        "ri" -> if (r.a.krijuarSe > 0) "Llogari e re, " + GrupiLogjika.kohaRelative(r.a.krijuarSe) else "Pa u kontrolluar: krejt lejet"
        "kufizuar" -> if (n == 1) "1 leje e ndaluar" else "$n leje të ndaluara"
        else -> "Krejt lejet"
    }
    return listOf(p1, if (Admini.merchandiser(r)) "merchandiser" else "", if (r.a.kycurSe > 0) "u kyç " + GrupiLogjika.kohaRelative(r.a.kycurSe) else "")
        .filter { it.isNotEmpty() }.joinToString(" · ")
}

@Composable
private fun Shkronja(emri: String, ngj: String, madhesia: Int = 40) {
    val (sf, ng) = N.ikonat[ngj] ?: N.ikonat["gri"]!!
    Box(Modifier.size(madhesia.dp).clip(CircleShape).background(sf), contentAlignment = Alignment.Center) {
        Text((emri.firstOrNull() ?: '?').uppercase(), style = tx(if (madhesia > 44) 22 else 16, 700, ng))
    }
}

@Composable
private fun Info(t: String, kujdes: Boolean = false) {
    val n = N
    Text(t, style = tx(14, 400, if (kujdes) n.nearInk else n.ink2), modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
        .background(if (kujdes) n.nearTint else n.surface2).padding(14.dp))
}

private fun mesazhGabimi(a: String?) = if (a == "leje") "S'u ruajt: rregullat e Firestore duhet të përditësohen (v230)." else "S'u ruajt. Kontrollo internetin dhe provo sërish."

/** Cilësimet → Përdoruesit: lista → lejet e një llogarie → afatet e saj (vetëm për t'u parë) */
@Composable
fun PerdoruesitFlete(mbyll: () -> Unit) {
    val n = N
    val scope = rememberCoroutineScope()
    val ll by Admini.llogarite.collectAsState()
    val lj by Admini.lejet.collectAsState()
    val gabimL by Admini.gabimLlogari.collectAsState()
    val gabimLe by Admini.gabimLejet.collectAsState()
    var uid by remember { mutableStateOf<String?>(null) }
    var afatetUid by remember { mutableStateOf<String?>(null) }
    var kerkimi by remember { mutableStateOf("") }
    var konfirmoKrejt by remember { mutableStateOf(false) }
    var ndaloKrejt by remember { mutableStateOf<Admini.Rreshti?>(null) }
    DisposableEffect(Unit) { Admini.faqjaHapur = true; onDispose { Admini.faqjaHapur = false } }
    LaunchedEffect(ll, lj) { Admini.shenoTeParet() }
    remember(ll, lj) { 0 }
    if (!Admini.eshteAdmin()) { mbyll(); return }

    fun ruaj(r: Admini.Rreshti, l: Obj, mesazh: String?) {
        scope.launch {
            val g = Admini.ruaj(r.a.uid, l, r.a.emri)
            if (g != null) Toast.trego(mesazhGabimi(g), 4500) else if (mesazh != null) Toast.trego(mesazh)
        }
    }

    Flete({ if (afatetUid != null) afatetUid = null else if (uid != null) uid = null else mbyll() }) {
        val lista = Admini.lista()
        val r = uid?.let { u -> lista.firstOrNull { it.a.uid == u } }
        val ra = afatetUid?.let { u -> lista.firstOrNull { it.a.uid == u } }
        when {
            ra != null -> AfatetELlogarise(ra) { afatetUid = null }
            uid != null -> {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ButonIkone(Ik.Mbrapa, "Përdoruesit", { uid = null }, madhesia = 38.dp)
                    Spacer(Modifier.width(10.dp))
                    Text(r?.a?.emri ?: "Përdoruesi", style = tx(22, 700, n.ink, -0.02), maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                if (r == null) { Info(if (ll != null) "Kjo llogari s'ekziston më." else "Duke e marrë llogarinë…"); return@Flete }
                Detajet(r, { l, m -> ruaj(r, l, m) }, { afatetUid = r.a.uid }, { ndaloKrejt = r })
            }
            else -> {
                Text("Përdoruesit", style = tx(22, 700, n.ink, -0.02))
                Text("Lejet e secilës llogari. Ndryshimet ruhen vetë dhe vlejnë menjëherë te telefoni dhe kompjuteri i përdoruesit.", style = tx(14, 400, n.muted))
                if (!Admini.gati()) { Info(if (gabimL) "Llogaritë s'u lexuan. Kontrollo internetin dhe provo sërish." else "Duke i marrë llogaritë…"); return@Flete }
                if (gabimLe) Info("Firebase s'i lejon ende lejet: rregullat e Firestore duhet të përditësohen (v230). Deri atëherë krejt llogaritë i kanë krejt lejet.", true)
                if (lista.size >= 8 || kerkimi.isNotEmpty()) Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), "Kërko përdoruesin", ikona = Ik.Kerko)
                val q = kerkimi.trim().lowercase()
                val fil = if (q.isEmpty()) lista else lista.filter { it.a.emri.lowercase().contains(q) }
                if (fil.isEmpty()) { Info(if (q.isNotEmpty()) "Asnjë përdorues me këtë emër." else "Ende s'ka llogari të tjera."); return@Flete }
                val rinj = fil.filter { it.statusi == "ri" }.sortedByDescending { maxOf(it.a.krijuarSe, it.a.kycurSe) }
                val tjeret = fil.filter { it.statusi != "ri" }.sortedWith { x, y -> Afatet.KOLATORI.compare(x.a.emri, y.a.emri) }
                listOf("Pa u kontrolluar" to rinj, "Të kontrolluar" to tjeret).forEach { (titulli, l) ->
                    if (l.isEmpty()) return@forEach
                    Text("${titulli.uppercase()} · ${l.size}", style = tx(13, 700, n.muted, 0.06))
                    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).border(1.dp, n.line, RoundedCornerShape(18.dp))) {
                        l.forEachIndexed { i, x ->
                            if (i > 0) Box(Modifier.padding(start = 66.dp).fillMaxWidth().height(1.dp).background(n.line2))
                            Row(Modifier.fillMaxWidth().clickable { uid = x.a.uid }.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Shkronja(x.a.emri, when (x.statusi) { "ri" -> "portokalli"; "kufizuar" -> "kuqe"; else -> "gjelber" })
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(x.a.emri, style = tx(15, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(nenTeksti(x), style = tx(12, 400, if (x.statusi == "ri") n.nearInk else n.muted), maxLines = 2)
                                }
                                Text("›", style = tx(20, 400, n.faint))
                            }
                        }
                    }
                }
                if (rinj.size > 1 && q.isEmpty()) Buton("Shëno krejt \"Pa u kontrolluar\" si të kontrolluar", { konfirmoKrejt = true }, Modifier.fillMaxWidth(), lloji = "dyte")
            }
        }
    }
    if (konfirmoKrejt) {
        val rinj = Admini.lista().filter { it.statusi == "ri" }
        Konfirmo("T'i shënosh të kontrolluar?", "${rinj.size} llogari mbeten me krejt lejet dhe s'dalin më te \"Pa u kontrolluar\". Lejet mund t'i ndryshosh kurdo.",
            "Po, shënoji", rrezik = false, mbyll = { konfirmoKrejt = false }) {
            scope.launch {
                var ok = 0; var gab: String? = null
                rinj.forEach { x -> val g = Admini.ruaj(x.a.uid, Lejet.krejt(true), x.a.emri); if (g == null) ok++ else gab = g }
                Toast.trego(if (gab == null) (if (ok == 1) "1 llogari u shënua e kontrolluar." else "$ok llogari u shënuan të kontrolluara.") else mesazhGabimi(gab), 4500)
            }
        }
    }
    ndaloKrejt?.let { x ->
        Konfirmo("T'i ndalohen krejt lejet?", x.a.emri + " do të mund vetëm të hyjë në llogari: s'do ta shohë as stokun, as afatet, as grupin.", "Ndalo krejt",
            mbyll = { ndaloKrejt = null }) { ruaj(x, Admini.krejtPer(x, false), x.a.emri + " s'ka më asnjë leje.") }
    }
}

@Composable
private fun Detajet(r: Admini.Rreshti, ruaj: (Obj, String?) -> Unit, hapAfatet: () -> Unit, ndaloKrejt: () -> Unit) {
    val n = N
    val lejet = r.lejet
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).border(1.dp, n.line, RoundedCornerShape(18.dp)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Shkronja(r.a.emri, when (r.statusi) { "ri" -> "portokalli"; "kufizuar" -> "kuqe"; else -> "gjelber" }, 52)
            Spacer(Modifier.width(12.dp))
            Column {
                Text(r.a.emri, style = tx(17, 700, n.ink))
                val nd = Lejet.teNdaluara(lejet)
                Text(when (r.statusi) { "ri" -> "Pa u kontrolluar: i ka krejt lejet"; "kufizuar" -> if (nd == 1) "1 leje e ndaluar" else "$nd leje të ndaluara"; else -> "Krejt lejet" },
                    style = tx(13, 500, if (r.statusi == "ri") n.nearInk else n.muted))
            }
        }
        val dok = r.dok
        val kontrolluar = (dok?.get("kontrolluarSe") as? Number)?.toLong() ?: 0L
        val info = listOf(
            if (r.a.krijuarSe > 0) "U regjistrua " + GrupiLogjika.kohaRelative(r.a.krijuarSe) else "",
            if (r.a.kycurSe > 0) "U kyç " + GrupiLogjika.kohaRelative(r.a.kycurSe) else "",
            if (r.a.grupi != null) "Në një grup" else "Pa grup",
            if (Admini.merchandiser(r)) "Merchandiser" else "",
            if (kontrolluar > 0) "Kontrolluar " + GrupiLogjika.kohaRelative(kontrolluar) + ((dok?.get("kontrolluarNga") as? String)?.takeIf { it.isNotEmpty() }?.let { " nga $it" } ?: "") else ""
        ).filter { it.isNotEmpty() }
        Text(info.joinToString(" · ") + ".", style = tx(13, 400, n.muted))
        if (r.statusi == "ri") {
            Text("Ndalo çka s'duhet të përdorë (ruhet vetë), ose shtyp \"U kontrollua\" që t'i mbajë krejt lejet.", style = tx(13, 400, n.ink2))
            Buton("U kontrollua", { ruaj(Admini.krejtPer(r, true), r.a.emri + " u shënua i kontrolluar.") }, Modifier.fillMaxWidth())
        }
    }
    Buton("Afatet e " + r.a.emri, hapAfatet, Modifier.fillMaxWidth(), lloji = "dyte", ikona = Ik.Afatet)
    Lejet.KATALOGU.groupBy { it.grupi }.forEach { (grupi, l) ->
        Text(grupi.uppercase(), style = tx(13, 700, n.muted, 0.06), modifier = Modifier.padding(top = 4.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).border(1.dp, n.line, RoundedCornerShape(16.dp))) {
            l.forEachIndexed { i, leja ->
                if (i > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
                val ndezur = if (leja.zgjedhje) Admini.merchandiser(r) else lejet?.get(leja.k) != false
                val aktiv = leja.prindi == null || Lejet.lejohet(lejet, leja.prindi)
                Row(Modifier.fillMaxWidth().clickable(enabled = aktiv) { ndrysho(r, leja.k, !ndezur, ruaj) }
                    .padding(start = if (leja.prindi != null) 28.dp else 16.dp, end = 16.dp, top = 12.dp, bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(leja.emri, style = tx(15, 600, if (aktiv) n.ink else n.disabled))
                        if (leja.pershkrim.isNotEmpty()) Text(leja.pershkrim, style = tx(12, 400, if (aktiv) n.muted else n.disabled), modifier = Modifier.padding(top = 2.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    androidx.compose.material3.Switch(ndezur, { ndrysho(r, leja.k, it, ruaj) }, enabled = aktiv, colors = androidx.compose.material3.SwitchDefaults.colors(
                        checkedTrackColor = n.accent, checkedThumbColor = Color.White, uncheckedTrackColor = n.track, uncheckedThumbColor = Color.White, uncheckedBorderColor = n.track))
                }
            }
        }
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Buton("Lejo krejt", { ruaj(Admini.krejtPer(r, true), r.a.emri + " i ka tani krejt lejet.") }, Modifier.weight(1f), lloji = "dyte")
        Buton("Ndalo krejt", ndaloKrejt, Modifier.weight(1f), lloji = "rrezik")
    }
    Text("Ndryshimet ruhen vetë dhe vlejnë menjëherë te telefoni dhe kompjuteri i ${r.a.emri}. Çka s'i lejohet, i zhduket krejt, pa asnjë mesazh.",
        style = tx(13, 400, n.muted))
}

/** Gjendja më e fundit (jo ajo e vizatimit): dy prekje të shpejta s'e fshijnë njëra-tjetrën */
private fun ndrysho(r: Admini.Rreshti, k: String, vlera: Boolean, ruaj: (Obj, String?) -> Unit) {
    val tani = Admini.lejet.value?.get(r.a.uid)?.get("lejet") as? Obj
    val l = Lejet.pastro(tani)
    l[k] = vlera
    ruaj(l, null)
}

/** Afatet e një llogarie (p.sh. merchandiser), të grupuara sipas marketeve; vetëm lexim */
@Composable
private fun AfatetELlogarise(r: Admini.Rreshti, mbrapa: () -> Unit) {
    val n = N
    var rez by remember(r.a.uid) { mutableStateOf<Pair<List<Obj>, List<Obj>>?>(null) }
    var gabim by remember(r.a.uid) { mutableStateOf(false) }
    var teHequrat by remember(r.a.uid) { mutableStateOf(false) }
    var provo by remember { mutableStateOf(0) }
    LaunchedEffect(r.a.uid, provo) { gabim = false; rez = Admini.afatetE(r.a.uid); if (rez == null) gabim = true }
    Row(verticalAlignment = Alignment.CenterVertically) {
        ButonIkone(Ik.Mbrapa, r.a.emri, mbrapa, madhesia = 38.dp)
        Spacer(Modifier.width(10.dp))
        Text("Afatet e " + r.a.emri, style = tx(22, 700, n.ink, -0.02), maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
    val x = rez
    if (x == null) {
        if (gabim) { Info("Afatet s'u morën. Kontrollo internetin dhe provo sërish."); Buton("Provo sërish", { provo++ }, Modifier.fillMaxWidth(), lloji = "dyte") }
        else Info("Duke i marrë afatet e ${r.a.emri}…")
        return
    }
    val teGjitha = x.first.filter { it["id"] != null }
    val nr = Afatet.numero(teGjitha)
    val nH = teGjitha.count { it["statusi"] == "hequr" }
    Info((if (nr.aktive == 1) "1 afat aktiv" else "${nr.aktive} afate aktive") + (if (nr.skaduar > 0) " · ${nr.skaduar} të skaduara" else "") +
        (if (nr.afer > 0) " · ${nr.afer} afër skadimit" else "") + (if (x.second.isNotEmpty()) " · ${x.second.size} " + (if (x.second.size == 1) "market" else "markete") else "") + ".")
    if (nH > 0) Buton(if (teHequrat) "Fshih të hequrat" else "Shfaq edhe të hequrat ($nH)", { teHequrat = !teHequrat }, Modifier.fillMaxWidth(), lloji = "dyte")
    val lista = teGjitha.filter { teHequrat || it["statusi"] != "hequr" }.sortedWith { a, b -> Afatet.krahaso(a, b) }
    if (lista.isEmpty()) { Info("S'ka afate."); return }
    Marketet.grupo(lista, x.second).forEach { gr ->
        Text(gr.emri + " · " + gr.afatet.size, style = tx(13, 700, n.muted, 0.04), modifier = Modifier.padding(top = 4.dp))
        gr.afatet.forEach { a -> KartaELexuar(a) }
    }
}

@Composable
private fun KartaELexuar(a: Obj) {
    val n = N
    val st = Afatet.statusi(a)
    val (sf, vija) = when (st) { "skaduar", "pa-date" -> n.cardExp to n.cardExpLine; "afer" -> n.cardNear to n.cardNearLine; "hequr" -> n.cardRem to n.cardRemLine; else -> n.cardOk to n.cardOkLine }
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(sf).border(1.dp, vija, RoundedCornerShape(18.dp)).padding(14.dp)) {
        KutiaEDiteve(st, Afatet.ditetDeri(a["data"]))
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text((a["emri"] as? String)?.ifEmpty { null } ?: jsString(a["barkodi"] ?: "").ifEmpty { "(pa emër)" }, style = tx(15, 700, n.ink))
            val nen = listOf((a["furnizuesi"] as? String).orEmpty(), Afatet.sasiaTekst(a), if (a["data"] is String) Afatet.formato(a["data"]) else "",
                (a["krijuarNga"] as? String)?.takeIf { it.isNotEmpty() }?.let { "nga $it" } ?: "").filter { it.isNotEmpty() }.joinToString(" · ")
            if (nen.isNotEmpty()) Text(nen, style = tx(13, 400, n.muted))
            Text(Afatet.pershkrimi(a), style = tx(13, 500, n.ink2), modifier = Modifier.padding(top = 4.dp))
        }
    }
}

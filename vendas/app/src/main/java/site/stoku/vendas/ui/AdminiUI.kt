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
import androidx.compose.ui.text.style.TextAlign
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

/** .ops-karta.pd-info: kartë me tekst të vogël (ose paralajmërim) */
@Composable
private fun Info(t: String, kujdes: Boolean = false) {
    val n = N
    val f = RoundedCornerShape(20.dp)
    Text(t, style = txR(13f, 400, if (kujdes) n.nearInk else n.muted), modifier = Modifier.padding(bottom = 12.dp).fillMaxWidth().clip(f)
        .background(if (kujdes) n.nearTint else n.surface).border(1.dp, if (kujdes) n.cardNearLine else n.line, f).padding(16.dp))
}

private fun mesazhGabimi(a: String?) = if (a == "leje") "S'u ruajt: rregullat e Firestore duhet të përditësohen (v230)." else "S'u ruajt. Kontrollo internetin dhe provo sërish."

private fun ngjyraEStatusit(st: String) = when (st) { "ri" -> "portokalli"; "kufizuar" -> "kuqe"; else -> "gjelber" }

/** Cilësimet → Përdoruesit (vetëm administratori): krejt llogaritë, të ndara "Pa u kontrolluar" / "Të kontrolluar" */
@Composable
fun PerdoruesitFaqja(mbrapa: () -> Unit, hap: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    val ll by Admini.llogarite.collectAsState()
    val lj by Admini.lejet.collectAsState()
    val gabimL by Admini.gabimLlogari.collectAsState()
    val gabimLe by Admini.gabimLejet.collectAsState()
    var kerkimi by remember { mutableStateOf("") }
    var konfirmoKrejt by remember { mutableStateOf(false) }
    DisposableEffect(Unit) { Admini.faqjaHapur = true; onDispose { Admini.faqjaHapur = false } }
    LaunchedEffect(ll, lj) { Admini.shenoTeParet() }
    remember(ll, lj) { 0 }
    if (!Admini.eshteAdmin()) { LaunchedEffect(Unit) { mbrapa() }; return }
    FaqjaECilesimeve("Përdoruesit", mbrapa) {
        IntroOps("Krejt llogaritë e Stoku-t. Prek një përdorues për t'i caktuar çka mund të përdorë. Llogaritë e reja i kanë krejt lejet derisa t'i kontrollosh. Këtë faqe e sheh vetëm administratori.")
        val lista = Admini.lista()
        if (!Admini.gati()) { Info(if (gabimL) "Llogaritë s'u lexuan. Kontrollo internetin dhe provo sërish." else "Duke i marrë llogaritë…"); return@FaqjaECilesimeve }
        if (gabimLe) Info("Firebase s'i lejon ende lejet: rregullat e Firestore duhet të përditësohen (v230). Deri atëherë krejt llogaritë i kanë krejt lejet.", true)
        if (lista.size >= 8 || kerkimi.isNotEmpty()) Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth().padding(bottom = 12.dp), "Kërko përdoruesin", ikona = Ik.Kerko)
        val q = kerkimi.trim().lowercase()
        val fil = if (q.isEmpty()) lista else lista.filter { it.a.emri.lowercase().contains(q) }
        if (fil.isEmpty()) { Info(if (q.isNotEmpty()) "Asnjë përdorues me këtë emër." else "Ende s'ka llogari të tjera."); return@FaqjaECilesimeve }
        val rinj = fil.filter { it.statusi == "ri" }.sortedByDescending { if (it.a.krijuarSe > 0) it.a.krijuarSe else it.a.kycurSe }
        val tjeret = fil.filter { it.statusi != "ri" }.sortedWith { x, y -> Afatet.KOLATORI.compare(x.a.emri, y.a.emri) }
        listOf("Pa u kontrolluar" to rinj, "Të kontrolluar" to tjeret).forEachIndexed { i, (titulli, l) ->
            if (l.isEmpty()) return@forEachIndexed
            TitulliGrupit("$titulli · ${l.size}", pare = i == 0 || rinj.isEmpty())
            GrupiOps {
                l.forEachIndexed { j, x ->
                    RreshtListe((x.a.emri.trim().firstOrNull() ?: '?').uppercase(), ngjyraEStatusit(x.statusi), x.a.emri, nenTeksti(x), nenPritje = x.statusi == "ri",
                        vije = j > 0, djathtas = "shigjeta") { hap(x.a.uid) }
                }
            }
        }
        if (rinj.size > 1 && q.isEmpty()) ButonOps("Shëno krejt \"Pa u kontrolluar\" si të kontrolluar", { konfirmoKrejt = true }, Modifier.fillMaxWidth().padding(top = 12.dp))
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
}

/** Cilësimet → Përdoruesit → një llogari: lejet sipas grupeve (ruhen vetë) */
@Composable
fun PerdoruesiFaqja(uid: String?, mbrapa: () -> Unit, hapAfatet: () -> Unit) {
    val n = N
    val scope = rememberCoroutineScope()
    val ll by Admini.llogarite.collectAsState()
    val lj by Admini.lejet.collectAsState()
    var ndaloKrejt by remember { mutableStateOf(false) }
    remember(ll, lj) { 0 }
    if (!Admini.eshteAdmin()) { LaunchedEffect(Unit) { mbrapa() }; return }
    val r = uid?.let { u -> Admini.lista().firstOrNull { it.a.uid == u } }
    fun ruaj(l: Obj, mesazh: String?) {
        val x = r ?: return
        scope.launch {
            val g = Admini.ruaj(x.a.uid, l, x.a.emri)
            if (g != null) Toast.trego(mesazhGabimi(g), 4500) else if (mesazh != null) Toast.trego(mesazh)
        }
    }
    FaqjaECilesimeve(r?.a?.emri ?: "Përdoruesi", mbrapa) {
        if (r == null) { Info(if (ll != null) "Kjo llogari s'ekziston më." else "Duke e marrë llogarinë…"); return@FaqjaECilesimeve }
        val lejet = r.lejet
        KartaOps {
            Row(Modifier.fillMaxWidth().padding(bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                AvatariMadh(r.a.emri, uid = r.a.uid)
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(r.a.emri, style = tx(18, 700, n.ink, -0.01), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    val nd = Lejet.teNdaluara(lejet)
                    Text(when (r.statusi) { "ri" -> "Pa u kontrolluar: i ka krejt lejet"; "kufizuar" -> if (nd == 1) "1 leje e ndaluar" else "$nd leje të ndaluara"; else -> "Krejt lejet" },
                        style = txF(12.5f, if (r.statusi == "ri") 600 else 400, if (r.statusi == "ri") n.ikonat["portokalli"]!!.second else n.muted))
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
            Text(info.joinToString(" · ") + ".", style = txR(12.5f, 400, n.muted))
            if (r.statusi == "ri") {
                Text("Ndalo çka s'duhet të përdorë (ruhet vetë), ose shtyp \"U kontrollua\" që t'i mbajë krejt lejet.", style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(top = 12.dp))
                Buton("U kontrollua", { ruaj(Admini.krejtPer(r, true), r.a.emri + " u shënua i kontrolluar.") }, Modifier.fillMaxWidth().padding(top = 12.dp))
            }
        }
        ButonOps("Afatet e " + r.a.emri, hapAfatet)
        Lejet.KATALOGU.groupBy { it.grupi }.forEach { (grupi, l) ->
            TitulliGrupit(grupi)
            GrupiOps {
                l.forEachIndexed { i, leja ->
                    val ndezur = if (leja.zgjedhje) Admini.merchandiser(r) else lejet?.get(leja.k) != false
                    val prindi = leja.prindi
                    val aktiv = prindi == null || Lejet.lejohet(lejet, prindi)
                    if (i > 0) VijaGrupit(0.dp)
                    Row(Modifier.fillMaxWidth().clickable(enabled = aktiv) { ndrysho(r, leja.k, !ndezur) { x, m -> ruaj(x, m) } }
                        .padding(start = if (prindi != null) 32.dp else 16.dp, end = 16.dp, top = 14.dp, bottom = 14.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(leja.emri, style = txR(15f, 600, if (aktiv) n.ink else n.disabled, 1.3f))
                            if (leja.pershkrim.isNotEmpty()) Text(leja.pershkrim, style = txR(12.5f, 400, if (aktiv) n.muted else n.disabled, 1.4f), modifier = Modifier.padding(top = 3.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Ndezesi(ndezur, aktiv) { ndrysho(r, leja.k, it) { x, m -> ruaj(x, m) } }
                    }
                }
            }
        }
        Row(Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            ButonOps("Lejo krejt", { ruaj(Admini.krejtPer(r, true), r.a.emri + " i ka tani krejt lejet.") }, Modifier.weight(1f))
            ButonOps("Ndalo krejt", { ndaloKrejt = true }, Modifier.weight(1f), kuqe = true)
        }
        Text("Ndryshimet ruhen vetë dhe vlejnë menjëherë te telefoni dhe kompjuteri i ${r.a.emri}. Çka s'i lejohet, i zhduket krejt, pa asnjë mesazh.",
            style = txR(14f, 400, n.ink4), textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(start = 4.dp, end = 4.dp, top = 14.dp))
    }
    if (ndaloKrejt && r != null) Konfirmo("T'i ndalohen krejt lejet?", r.a.emri + " do të mund vetëm të hyjë në llogari: s'do ta shohë as stokun, as afatet, as grupin.", "Ndalo krejt",
        mbyll = { ndaloKrejt = false }) { ruaj(Admini.krejtPer(r, false), r.a.emri + " s'ka më asnjë leje.") }
}

/** Gjendja më e fundit (jo ajo e vizatimit): dy prekje të shpejta s'e fshijnë njëra-tjetrën */
private fun ndrysho(r: Admini.Rreshti, k: String, vlera: Boolean, ruaj: (Obj, String?) -> Unit) {
    val tani = Admini.lejet.value?.get(r.a.uid)?.get("lejet") as? Obj
    val l = Lejet.pastro(tani)
    l[k] = vlera
    ruaj(l, null)
}

/** Cilësimet → Përdoruesit → Afatet e një llogarie (p.sh. merchandiser), të grupuara sipas marketeve; vetëm lexim */
@Composable
fun PerdoruesiAfatetFaqja(uid: String?, mbrapa: () -> Unit) {
    val n = N
    val r = uid?.let { u -> Admini.lista().firstOrNull { it.a.uid == u } }
    var rez by remember(uid) { mutableStateOf<Pair<List<Obj>, List<Obj>>?>(null) }
    var gabim by remember(uid) { mutableStateOf(false) }
    var teHequrat by remember(uid) { mutableStateOf(false) }
    var provo by remember { mutableStateOf(0) }
    LaunchedEffect(uid, provo) { if (uid != null) { gabim = false; rez = Admini.afatetE(uid); if (rez == null) gabim = true } }
    if (!Admini.eshteAdmin() || r == null) { LaunchedEffect(Unit) { mbrapa() }; return }
    FaqjaECilesimeve("Afatet e " + r.a.emri, mbrapa) {
        val x = rez
        if (x == null) {
            if (gabim) { Info("Afatet s'u morën. Kontrollo internetin dhe provo sërish."); ButonOps("Provo sërish", { provo++ }) }
            else Info("Duke i marrë afatet e ${r.a.emri}…")
            return@FaqjaECilesimeve
        }
        val teGjitha = x.first.filter { it["id"] != null }
        val nr = Afatet.numero(teGjitha)
        val nH = teGjitha.count { it["statusi"] == "hequr" }
        Info((if (nr.aktive == 1) "1 afat aktiv" else "${nr.aktive} afate aktive") + (if (nr.skaduar > 0) " · ${nr.skaduar} të skaduara" else "") +
            (if (nr.afer > 0) " · ${nr.afer} afër skadimit" else "") + (if (x.second.isNotEmpty()) " · ${x.second.size} " + (if (x.second.size == 1) "market" else "markete") else "") + ".")
        if (nH > 0) ButonOps(if (teHequrat) "Fshih të hequrat" else "Shfaq edhe të hequrat ($nH)", { teHequrat = !teHequrat }, Modifier.padding(bottom = 12.dp))
        val lista = teGjitha.filter { teHequrat || it["statusi"] != "hequr" }.sortedWith { a, b -> Afatet.krahaso(a, b) }
        if (lista.isEmpty()) { Info("S'ka afate."); return@FaqjaECilesimeve }
        Marketet.grupo(lista, x.second).forEach { gr ->
            Text(gr.emri + " · " + gr.afatet.size, style = tx(13, 700, n.ink3), modifier = Modifier.padding(start = 4.dp, top = 6.dp, bottom = 8.dp))
            gr.afatet.forEach { a -> KartaELexuar(a); Spacer(Modifier.height(10.dp)) }
        }
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

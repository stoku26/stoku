package site.stoku.vendas.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import site.stoku.logjika.Afatet
import site.stoku.logjika.GrupiLogjika
import site.stoku.logjika.Obj
import site.stoku.logjika.jsString
import site.stoku.logjika.numerOse0
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Grupi
import site.stoku.vendas.Llogaria
import site.stoku.vendas.MainActivity
import site.stoku.vendas.Merchandiseri
import site.stoku.vendas.Opsionet
import site.stoku.vendas.Push
import site.stoku.vendas.StokuApp
import site.stoku.vendas.Sinkronizimi

/**
 * Ballina (pronari, 17.11.2026): tabi kryesor, me shtëpinë në mes të shiritit poshtë (rreth pak mbi shirit). Hapet i pari pas hyrjes
 * dhe sa herë hapet aplikacioni. Lart logoja (si te Malli) dhe djathtas "Përshtat faqen": secili përdorues zgjedh cilat pjesë
 * dalin dhe me çfarë radhe (ruhet në këtë telefon, `ballina_pjeset`). Çdo pjesë del vetëm kur përdoruesi ka lejen përkatëse.
 */
const val BALLINA = "ballina"
/** Rrethi i shtëpisë (me unazën që e ndan nga faqja) dhe sa del mbi shiritin poshtë (64 dp) */
val BALLINA_MADHESIA: Dp = 62.dp
val BALLINA_MBI_SHIRIT: Dp = 16.dp

/** Pjesët e Ballinës: id, emri te "Përshtat faqen", shpjegimi (bosh = s'ka) */
object PjesetEBallines {
    class Pjesa(val id: String, val emri: String, val shpjegimi: String = "")
    val TE_GJITHA = listOf(
        Pjesa("butonat", "Butonat e shpejtë", "Skano, Afat i ri, Skanim i shpejtë, PDF"),
        Pjesa("afatet", "Numrat e afateve"),
        Pjesa("skadojne", "Skadojnë së pari", "3 produktet që skadojnë më herët"),
        Pjesa("grafiku", "Grafiku i muajve", "Sa afate skadojnë në 6 muajt e ardhshëm"),
        Pjesa("malli", "Numrat e mallit"),
        Pjesa("furnizuesit", "Furnizuesit", "Me më shumë produkte që skadojnë"),
        Pjesa("grupi", "Grupi", "Kërkesat dhe aktiviteti i fundit"),
        Pjesa("marketi", "Marketi", "Del vetëm kur ke markete"),
        Pjesa("ora", "Ora e dorës", "Del vetëm kur ke orë të lidhur")
    )
    const val KEY = "ballina_pjeset"
    /** Hyrja 94: çelësi i vjetër (para emrit "Ballina"), që radha e ruajtur të mos humbë */
    private const val KEY_VJETER = "k" + "reu_pjeset"
    fun emri(id: String) = TE_GJITHA.firstOrNull { it.id == id }?.emri ?: id
    /** "id:1,id:0,…" → radha me gjendjen (ndezur/fikur); të rejat (që s'janë ruajtur ende) shtohen në fund, të ndezura */
    fun lexo(teksti: String = StokuApp.prefsOse(KEY, "").ifEmpty { StokuApp.prefsOse(KEY_VJETER, "") }): List<Pair<String, Boolean>> {
        val njihen = TE_GJITHA.map { it.id }.toSet()
        val l = teksti.split(",").mapNotNull { c ->
            val p = c.trim().split(":")
            if (p.size == 2 && p[0] in njihen) p[0] to (p[1] == "1") else null
        }.distinctBy { it.first }
        return l + TE_GJITHA.filter { p -> l.none { it.first == p.id } }.map { it.id to true }
    }
    fun ruaj(l: List<Pair<String, Boolean>>) = StokuApp.vendosPref(KEY, l.joinToString(",") { it.first + ":" + (if (it.second) "1" else "0") })
    fun siNeFillim(): List<Pair<String, Boolean>> = TE_GJITHA.map { it.id to true }
    /** Pjesët që i lejon llogaria (pa lejen e afateve s'ka pjesë afatesh etj.) */
    fun lejohet(id: String): Boolean {
        val af = Llogaria.leja("afatet")
        return when (id) {
            "butonat" -> butonat().isNotEmpty()
            "afatet", "skadojne", "grafiku" -> af
            "furnizuesit" -> af && !Llogaria.eshteMerchandiser()
            "malli" -> Llogaria.leja("stoku")
            "grupi" -> Llogaria.leja("grupi") && !Llogaria.eshteVizitor()
            else -> true
        }
    }
    /** Butonat e shpejtë që lejohen: "skano", "afat", "shpejt", "pdf" */
    fun butonat(): List<String> {
        val kamera = Llogaria.leja("kamera") && !Opsionet.pda.value
        val shtoAfat = Llogaria.leja("afatet") && Llogaria.leja("afatetShto")
        return listOfNotNull(
            if (kamera && (Llogaria.leja("stoku") || shtoAfat)) "skano" else null,
            if (shtoAfat) "afat" else null,
            if (kamera && Llogaria.leja("stoku") && Llogaria.leja("skanimShpejt") && (Llogaria.leja("stokuShto") || Llogaria.leja("stokuNdrysho"))) "shpejt" else null,
            if (Llogaria.leja("afatet") && Llogaria.leja("eksportPdf")) "pdf" else null
        )
    }
}

/** Rrethi me shtëpinë në mes të shiritit poshtë: unaza me ngjyrën e faqes e ndan nga ajo; i gjelbër kur je te Ballina */
@Composable
fun BallinaButoni(aktiv: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val n = N
    val gjelber = Color(if (n.erret) Logot.PIKA_ERRET else Logot.PIKA_CELET)
    Box(modifier.size(BALLINA_MADHESIA).shadow(10.dp, CircleShape).clip(CircleShape).background(n.bg).padding(4.dp).clip(CircleShape)
        .background(n.surface).border(2.dp, if (aktiv) gjelber else n.line, CircleShape).clickable(onClick = onClick)
        .semantics { contentDescription = "Ballina" }, contentAlignment = Alignment.Center) {
        Icon(Ik.Ballina, null, Modifier.size(27.dp), tint = if (aktiv) n.ink else n.faint)
    }
}

@Composable
fun BallinaEkrani(skano: ((String) -> Unit) -> Unit, hapTabin: (String) -> Unit, skanoShpejt: (String) -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val p by Llogaria.perdoruesi.collectAsState()
    val lejet by Llogaria.lejet.collectAsState()
    val aktiviM by Merchandiseri.aktivi.collectAsState()
    Opsionet.pda.collectAsState().value
    remember(lejet, aktiviM) { 0 }
    var pjeset by remember { mutableStateOf(PjesetEBallines.lexo()) }
    var pershtat by remember { mutableStateOf(false) }
    var zgjidhFolderin by remember { mutableStateOf(false) }
    var kerkimi by remember { mutableStateOf("") } // v327: kërkimi kudo
    val te = remember(g, aktiviM, lejet) { Merchandiseri.afatetEMarketit(g.afatet) }
    val nr = remember(te, site.stoku.vendas.Dita.sot) { Afatet.numero(te) }

    fun hapAfatin(id: String?) { if (id != null) MainActivity.afatiKerkuar.value = id; hapTabin("afatet") }
    fun afatIRi(barkodi: String = "") { MainActivity.veprimiIAfateve.value = if (barkodi.isEmpty()) "i-ri" else "i-ri:$barkodi"; hapTabin("afatet") }
    // Skano: produkti që është te malli hapet atje; përndryshe "Afat i ri" me këtë barkod
    fun skanoBarkodin() = skano { b ->
        val pr = if (Llogaria.leja("stoku")) Dyqani.g.produktet.values.firstOrNull { jsString(it["barkodi"]) == b } else null
        val fid = pr?.get("kategoriaId") as? String
        when {
            fid != null -> { MainActivity.produktiKerkuar.value = fid to b; hapTabin("malli") }
            Llogaria.leja("afatet") && Llogaria.leja("afatetShto") -> afatIRi(b)
            else -> Toast.trego("Ky barkod s'është te malli.")
        }
    }

    val dukshme = if (kerkimi.isNotBlank()) emptyList() else pjeset.filter { it.second && PjesetEBallines.lejohet(it.first) }.map { it.first }
    val rezultatet = remember(kerkimi, g, lejet, aktiviM) { if (kerkimi.isBlank()) emptyList() else kerkoKudo(kerkimi) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 24.dp + BALLINA_MBI_SHIRIT),
        verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                EtiketaStoku(p?.emri ?: if (Llogaria.eshteVizitor()) "Vizitor · provë" else "", { Sinkronizimi.rifresko(); Toast.trego("Duke sinkronizuar…", 1500) })
                Spacer(Modifier.weight(1f))
                ButonIkone(Ik.Pershtat, "Përshtat faqen", { pershtat = true })
            }
        }
        // v327 (pronari): "qite ni search bar qe kur te lyp qaty diqka ne krejt projektin me ta qit qaty"
        item(key = "kerkimi") { Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), "Kërko kudo: barkod, produkt, afat…", ikona = Ik.Kerko) }
        if (kerkimi.isNotBlank()) {
            if (rezultatet.isEmpty()) item { Text("S'u gjet asgjë për \"" + kerkimi.trim() + "\".", style = tx(14, 400, n.muted), textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(vertical = 18.dp)) }
            rezultatet.forEach { gr ->
                item(key = "g:" + gr.titulli) { Text(gr.titulli + (if (gr.n > gr.rreshtat.size) " (${gr.n})" else ""), style = tx(13, 600, n.muted), modifier = Modifier.padding(top = 4.dp)) }
                gr.rreshtat.forEachIndexed { i, x ->
                    item(key = "r:" + gr.titulli + ":" + i) {
                        Karta(Modifier.fillMaxWidth(), onClick = {
                            when (val v = x.veprimi) {
                                is Veprimi.Produkti -> { MainActivity.produktiKerkuar.value = v.folderi to v.barkodi; hapTabin("malli") }
                                is Veprimi.Folderi -> { MainActivity.produktiKerkuar.value = v.id to ""; hapTabin("malli") }
                                is Veprimi.Afati -> hapAfatin(v.id)
                                is Veprimi.Kerko -> { MainActivity.veprimiIAfateve.value = "kerko:" + v.teksti; hapTabin("afatet") }
                                is Veprimi.Tabi -> hapTabin(v.tabi)
                                is Veprimi.Cilesimi -> { MainActivity.cilesimiKerkuar.value = v.faqja; hapTabin("cilesimet") }
                            }
                        }) {
                            Row(Modifier.padding(horizontal = 14.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
                                IkonaMeNgjyre(gr.ikona, gr.ngj, 36.dp, 11.dp, 19.dp)
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(x.emri, style = tx(15, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    if (x.nen.isNotEmpty()) Text(x.nen, style = tx(12, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                            }
                        }
                    }
                }
            }
        }
        if (kerkimi.isBlank() && dukshme.isEmpty()) item {
            Karta(Modifier.fillMaxWidth(), rrezja = 22.dp, onClick = { pershtat = true }) {
                Column(Modifier.padding(18.dp)) {
                    Text("Faqja është bosh", style = tx(16, 700, n.ink))
                    Text("Shtyp butonin lart djathtas dhe zgjidh çfarë do të shohësh këtu.", style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 4.dp))
                }
            }
        }
        dukshme.forEach { id ->
            item(key = id) {
                when (id) {
                    "butonat" -> ButonatEShpejte(PjesetEBallines.butonat()) { b ->
                        when (b) {
                            "skano" -> skanoBarkodin()
                            "afat" -> afatIRi()
                            "pdf" -> { MainActivity.veprimiIAfateve.value = "pdf"; hapTabin("afatet") }
                            "shpejt" -> when {
                                g.foldera.isEmpty() -> Toast.trego("Krijo fillimisht një folder te Malli.")
                                g.foldera.size == 1 -> skanoShpejt(g.foldera.first()["id"] as String)
                                else -> zgjidhFolderin = true
                            }
                        }
                    }
                    "afatet" -> PjesaEBallines("Afatet", "Hape", { hapAfatin(null) }) {
                        TreNumra(Triple(nr.skaduar.toString(), "Të skaduara", n.exp), Triple(nr.afer.toString(), "Skadojnë së shpejti", n.near),
                            Triple(nr.paDate.toString(), "Pa datë", n.ink))
                    }
                    "skadojne" -> {
                        val lista = remember(te, site.stoku.vendas.Dita.sot) {
                            te.filter { val s = Afatet.statusi(it); s == "skaduar" || s == "afer" }.sortedWith { a, b -> Afatet.krahaso(a, b) }.take(3)
                        }
                        PjesaEBallines("Skadojnë së pari", "Krejt", { hapAfatin(null) }) {
                            if (lista.isEmpty()) Text("Asnjë produkt që skadon së shpejti.", style = tx(14, 600, n.ok), modifier = Modifier.padding(vertical = 4.dp))
                            lista.forEachIndexed { i, a -> RreshtiIAfatit(a, i > 0) { hapAfatin(a["id"] as? String) } }
                        }
                    }
                    "grafiku" -> PjesaEBallines("Afatet në 6 muajt e ardhshëm", null, { hapAfatin(null) }) { GrafikuIMuajve(te) }
                    "malli" -> {
                        val sasia = remember(g.produktet) { g.produktet.values.sumOf { sasiaE(it) } }
                        PjesaEBallines("Malli", "Hape", { hapTabin("malli") }) {
                            TreNumra(Triple(numerMeHapesire(g.produktet.size.toLong()), "Produkte", n.ink), Triple(g.foldera.size.toString(), "Folderat", n.ink),
                                Triple(numerMeHapesire(sasia), "Sasia", n.ink))
                        }
                    }
                    "furnizuesit" -> {
                        val f = remember(te, site.stoku.vendas.Dita.sot) {
                            Afatet.furnizuesitELista(te.filter { val s = Afatet.statusi(it); s == "skaduar" || s == "afer" })
                                .filter { it.celes != Afatet.PA_FURNIZUES }.sortedByDescending { it.n }.take(3)
                        }
                        PjesaEBallines("Furnizuesit me më shumë produkte që skadojnë", null, { hapAfatin(null) }) {
                            if (f.isEmpty()) Text("Asnjë produkt që skadon me furnizues të shënuar.", style = tx(14, 400, n.muted))
                            val max = (f.maxOfOrNull { it.n } ?: 1).coerceAtLeast(1)
                            f.forEach { x ->
                                Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(x.emri, style = tx(14, 500, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.width(96.dp))
                                    Box(Modifier.weight(1f).height(8.dp).clip(RoundedCornerShape(4.dp)).background(n.track)) {
                                        Box(Modifier.fillMaxHeight().fillMaxWidth(x.n / max.toFloat()).clip(RoundedCornerShape(4.dp)).background(n.near))
                                    }
                                    Text(x.n.toString(), style = tx(14, 700, n.ink), textAlign = TextAlign.End, modifier = Modifier.width(36.dp))
                                }
                            }
                        }
                    }
                    "grupi" -> PjesaEGrupit { hapTabin("grupi") }
                    "marketi" -> CipiIMarketit()
                    "ora" -> PjesaEOres(nr.skaduar)
                }
            }
        }
    }

    if (pershtat) PershtatFaqen(pjeset, mbyll = { pershtat = false }) { l -> PjesetEBallines.ruaj(l); pjeset = l; pershtat = false }
    if (zgjidhFolderin) Flete({ zgjidhFolderin = false }) {
        Text("Skanim i shpejtë", style = tx(20, 700, n.ink))
        Text("Në cilin folder?", style = tx(14, 400, n.muted))
        g.foldera.forEach { f ->
            Karta(Modifier.fillMaxWidth(), onClick = { zgjidhFolderin = false; skanoShpejt(f["id"] as String) }) {
                Text((f["emri"] as? String).orEmpty(), style = tx(16, 600, n.ink), modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp))
            }
        }
    }
}

/** Karta e një pjese: titulli majtas, lidhja djathtas ("Hape", "Krejt") */
@Composable
private fun PjesaEBallines(titulli: String, lidhja: String?, prek: () -> Unit, permbajtja: @Composable () -> Unit) {
    val n = N
    Karta(Modifier.fillMaxWidth(), rrezja = 22.dp, onClick = prek) {
        Column(Modifier.padding(horizontal = 18.dp, vertical = 16.dp)) {
            Row(Modifier.fillMaxWidth().padding(bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(titulli, style = tx(14, 500, n.muted), modifier = Modifier.weight(1f))
                if (lidhja != null) Text(lidhja, style = tx(14, 600, n.accentText))
            }
            permbajtja()
        }
    }
}

@Composable
private fun TreNumra(vararg numrat: Triple<String, String, Color>) {
    val n = N
    Row(Modifier.fillMaxWidth()) {
        numrat.forEach { (v, e, c) ->
            Column(Modifier.weight(1f)) {
                Text(v, style = tx(26, 700, c))
                Text(e, style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 2.dp))
            }
        }
    }
}

@Composable
private fun ButonatEShpejte(butonat: List<String>, prek: (String) -> Unit) {
    val n = N
    val te = mapOf("skano" to (Ik.Skano to "Skano"), "afat" to (Ik.Plus to "Afat i ri"), "shpejt" to (Ik.Rrufe to "Skanim i shpejtë"), "pdf" to (Ik.Pdf to "PDF"))
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        butonat.forEachIndexed { i, b ->
            val (ik, t) = te.getValue(b)
            val kryesor = i == 0
            val forma = RoundedCornerShape(16.dp)
            Column(Modifier.weight(1f).heightIn(min = 76.dp).clip(forma).background(if (kryesor) n.accent else n.surface, forma)
                .then(if (kryesor) Modifier else Modifier.border(1.dp, n.line, forma)).clickable { prek(b) }.padding(horizontal = 4.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically)) {
                val ngj = if (kryesor) Color.White else n.ink
                Icon(ik, null, Modifier.size(22.dp), tint = ngj)
                Text(t, style = tx(12, 600, ngj), textAlign = TextAlign.Center, maxLines = 2)
            }
        }
    }
}

@Composable
private fun RreshtiIAfatit(a: Obj, vije: Boolean, prek: () -> Unit) {
    val n = N
    val d = Afatet.ditetDeri(a["data"])
    val ngj = if (Afatet.statusi(a) == "skaduar") n.exp else n.near
    val koha = when {
        d == null -> ""
        d < 0 -> "Skadoi"
        d == 0 -> "Sot"
        d == 1 -> "Nesër"
        else -> Afatet.ditetTekst(d)
    }
    if (vije) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
    Row(Modifier.fillMaxWidth().clickable(onClick = prek).padding(vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(ngj))
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text((a["emri"] as? String).orEmpty().ifEmpty { jsString(a["barkodi"] ?: "") }, style = tx(15, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
            val nen = listOf((a["furnizuesi"] as? String).orEmpty().trim(), Afatet.sasiaTekst(a)).filter { it.isNotEmpty() }.joinToString(" · ")
            if (nen.isNotEmpty()) Text(nen, style = tx(12, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Text(koha, style = tx(13, 700, ngj))
    }
}

/** Shtyllat: afatet aktive (jo të hequra) që skadojnë në secilin nga 6 muajt (ky muaj e 5 të ardhshmit) */
@Composable
private fun GrafikuIMuajve(te: List<Obj>) {
    val n = N
    val sot = site.stoku.vendas.Dita.sot
    val muajt = remember(te, sot) {
        val fillimi = sot.withDayOfMonth(1)
        (0 until 6).map { i ->
            val m = fillimi.plusMonths(i.toLong())
            val k = m.year.toString() + "-" + (if (m.monthValue < 10) "0" else "") + m.monthValue
            Triple(Afatet.MUAJT_SHKURT[m.monthValue - 1], te.count { Afatet.statusi(it) != "hequr" && Afatet.celesiMuajit(it) == k }, i == 0)
        }
    }
    val max = (muajt.maxOfOrNull { it.second } ?: 0).coerceAtLeast(1)
    Row(Modifier.fillMaxWidth().height(120.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Bottom) {
        muajt.forEach { (emri, nr, ky) ->
            Column(Modifier.weight(1f).fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Bottom) {
                Text(nr.toString(), style = tx(11, 700, if (nr > 0) n.ink2 else n.faint))
                Spacer(Modifier.height(4.dp))
                Box(Modifier.fillMaxWidth().height((70f * nr / max).coerceAtLeast(3f).dp).clip(RoundedCornerShape(6.dp))
                    .background(if (nr == 0) n.track else if (ky) n.near else n.accent))
                Spacer(Modifier.height(6.dp))
                Text(emri, style = tx(11, 500, n.muted))
            }
        }
    }
}

@Composable
private fun PjesaEGrupit(prek: () -> Unit) {
    val n = N
    val gj by Grupi.gjendja.collectAsState()
    val ngj by Grupi.ngjarjet.collectAsState()
    val gati by Grupi.ngjarjetGati.collectAsState()
    Grupi.njoftimet.collectAsState().value; Grupi.ftesatEMia.collectAsState().value; Grupi.kerkesatEGrupit.collectAsState().value
    val ne = gj.qasja == "anetar"
    val kerkesa = Grupi.numriKerkesave() + Grupi.numriNjoftimeve()
    PjesaEBallines("Grupi", "Hape", prek) {
        if (!ne && kerkesa == 0) { Text("S'je ende në një grup. Hape për të krijuar ose për t'u bashkuar.", style = tx(14, 400, n.muted)); return@PjesaEBallines }
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (kerkesa > 0) { Shenja(if (kerkesa > 99) "99+" else kerkesa.toString()); Spacer(Modifier.width(8.dp)) }
            Text(when (kerkesa) { 0 -> "Asnjë kërkesë e re"; 1 -> "1 kërkesë ose njoftim i ri"; else -> "$kerkesa kërkesa ose njoftime të reja" }, style = tx(15, 500, n.ink))
        }
        if (gati) {
            val tani = System.currentTimeMillis()
            ngj.take(2).forEach { x ->
                val t = GrupiLogjika.tekstiNgjarjes(x, Grupi.uidIm())
                Text(t.kush + " " + t.cfare + " · " + GrupiLogjika.kohaRelative(numerOse0(x["koha"]).toLong(), tani), style = tx(12, 400, n.muted),
                    maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 8.dp))
            }
        }
    }
}

/** Ora e dorës: vetëm kur ka orë të lidhur (pyetet serveri një herë kur hapet Ballina) */
@Composable
private fun PjesaEOres(skaduara: Int) {
    val n = N
    var oret by remember { mutableStateOf<List<Push.OraELidhur>>(emptyList()) }
    LaunchedEffect(Unit) { if (!StokuApp.neProve && !Llogaria.eshteVizitor()) Push.oretELidhura()?.let { oret = it } }
    val o = oret.firstOrNull() ?: return
    PjesaEBallines("Ora e dorës", null, {}) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Ik.OraDore, null, Modifier.size(20.dp), tint = n.okDot)
            Spacer(Modifier.width(8.dp))
            Text("E lidhur · " + o.model.ifBlank { "Ora e dorës" } + (if (skaduara > 0) " · $skaduara për t'u hequr" else ""), style = tx(15, 500, n.ink),
                maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

/** "Përshtat faqen": çelësi ndez/fik secilën pjesë; radha ndryshohet duke e zvarritur rreshtin nga ☰ */
@Composable
private fun PershtatFaqen(fillimi: List<Pair<String, Boolean>>, mbyll: () -> Unit, ruaj: (List<Pair<String, Boolean>>) -> Unit) {
    val n = N
    val lista = remember { mutableStateListOf<Pair<String, Boolean>>().apply { addAll(fillimi.filter { PjesetEBallines.lejohet(it.first) }) } }
    val tePalejuara = remember { fillimi.filter { !PjesetEBallines.lejohet(it.first) } }
    var zvarritet by remember { mutableStateOf<String?>(null) }
    var zhvendosja by remember { mutableFloatStateOf(0f) }
    val lartesia = with(LocalDensity.current) { RRESHTI_PERSHTAT.toPx() }
    Flete(mbyll) {
        Column {
            Text("Përshtat faqen", style = tx(20, 700, n.ink))
            Text("Zgjidh çfarë del. Mbaje gishtin te ☰ dhe lëvize për radhën.", style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 4.dp))
        }
        Column {
            lista.forEachIndexed { i, (id, ndezur) ->
                val pj = PjesetEBallines.TE_GJITHA.first { it.id == id }
                val kjo = zvarritet == id
                Row(Modifier.fillMaxWidth().height(RRESHTI_PERSHTAT).zIndex(if (kjo) 1f else 0f)
                    .graphicsLayer { translationY = if (kjo) zhvendosja else 0f; shadowElevation = if (kjo) 12f else 0f }
                    .background(n.surface),
                    verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(44.dp).pointerInput(id) {
                        detectDragGestures(
                            onDragStart = { zvarritet = id; zhvendosja = 0f },
                            onDrag = { ndr, d ->
                                ndr.consume()
                                zhvendosja += d.y
                                val k = lista.indexOfFirst { it.first == id }
                                if (zhvendosja > lartesia / 2 && k < lista.lastIndex) { lista.add(k + 1, lista.removeAt(k)); zhvendosja -= lartesia }
                                else if (zhvendosja < -lartesia / 2 && k > 0) { lista.add(k - 1, lista.removeAt(k)); zhvendosja += lartesia }
                            },
                            onDragEnd = { zvarritet = null; zhvendosja = 0f },
                            onDragCancel = { zvarritet = null; zhvendosja = 0f }
                        )
                    }.semantics { contentDescription = "Lëvize " + pj.emri }, contentAlignment = Alignment.Center) {
                        Icon(Ik.Kapja, null, Modifier.size(20.dp), tint = n.faint)
                    }
                    Column(Modifier.weight(1f)) {
                        Text(pj.emri, style = tx(15, 600, if (ndezur) n.ink else n.muted))
                        if (pj.shpjegimi.isNotEmpty()) Text(pj.shpjegimi, style = tx(12, 400, n.faint), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Ndezesi(ndezur) { v -> val k = lista.indexOfFirst { it.first == id }; if (k >= 0) lista[k] = id to v }
                }
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Buton("Si në fillim", { lista.clear(); lista.addAll(PjesetEBallines.siNeFillim().filter { PjesetEBallines.lejohet(it.first) }) }, Modifier.weight(1f), lloji = "dyte")
            Buton("Ruaj", { ruaj(lista.toList() + tePalejuara) }, Modifier.weight(1f))
        }
    }
}

private val RRESHTI_PERSHTAT = 60.dp

/** v327: kërkimi kudo te Ballina: malli, folderat, afatet, furnizuesit, kolegët, marketet dhe faqet e Cilësimeve (si blKerko te app-tel.js) */
sealed class Veprimi {
    class Produkti(val folderi: String, val barkodi: String) : Veprimi()
    class Folderi(val id: String) : Veprimi()
    class Afati(val id: String) : Veprimi()
    class Kerko(val teksti: String) : Veprimi()
    class Tabi(val tabi: String) : Veprimi()
    class Cilesimi(val faqja: String) : Veprimi()
}
class Rezultati(val emri: String, val nen: String, val veprimi: Veprimi)
class GrupiIRezultateve(val titulli: String, val ikona: androidx.compose.ui.graphics.vector.ImageVector, val ngj: String, val n: Int, val rreshtat: List<Rezultati>)

private fun normalizo(t: Any?): String = java.text.Normalizer.normalize(jsString(t ?: "").lowercase(), java.text.Normalizer.Form.NFD)
    .replace(Regex("\\p{Mn}+"), "").trim()

fun kerkoKudo(q: String): List<GrupiIRezultateve> {
    val k = normalizo(q)
    if (k.isEmpty()) return emptyList()
    fun ka(t: Any?) = t != null && normalizo(t).contains(k)
    val MAX = 5
    val g = Dyqani.g
    val l = ArrayList<GrupiIRezultateve>()
    val emriF = g.foldera.associate { (it["id"] as? String).orEmpty() to (it["emri"] as? String).orEmpty() }
    if (Llogaria.leja("stoku")) {
        val pr = g.produktet.values.filter { ka(it["emri"]) || ka(it["barkodi"]) || ka(it["furnizuesi"]) }
            .sortedBy { (it["emri"] as? String).orEmpty().lowercase() }
        if (pr.isNotEmpty()) l.add(GrupiIRezultateve("Malli", Ik.Malli, "blu", pr.size, pr.take(MAX).map {
            val f = (it["kategoriaId"] as? String).orEmpty()
            Rezultati((it["emri"] as? String).orEmpty().ifEmpty { "Pa emër" }, jsString(it["barkodi"] ?: "") + " · " + emriF[f].orEmpty() + " · " + sasiaE(it) + " copë",
                Veprimi.Produkti(f, jsString(it["barkodi"] ?: "")))
        }))
        val fo = g.foldera.filter { ka(it["emri"]) }
        if (fo.isNotEmpty()) l.add(GrupiIRezultateve("Folderat", Ik.Folder, "portokalli", fo.size, fo.take(MAX).map {
            Rezultati((it["emri"] as? String).orEmpty(), "Folder", Veprimi.Folderi((it["id"] as? String).orEmpty()))
        }))
    }
    if (Llogaria.leja("afatet")) {
        val af = Merchandiseri.afatetEMarketit(g.afatet).filter { ka(it["emri"]) || ka(it["barkodi"]) || ka(it["furnizuesi"]) }.sortedWith { a, b -> Afatet.krahaso(a, b) }
        if (af.isNotEmpty()) l.add(GrupiIRezultateve("Afatet", Ik.Afatet, "kuqe", af.size, af.take(MAX).map { a ->
            val d = Afatet.ditetDeri(a["data"])
            val kur = when {
                Afatet.statusi(a) == "hequr" -> "U hoq nga rafti"
                d == null -> "Pa datë"
                else -> Afatet.formato(a["data"]) + " · " + (if (d < 0) "Skadoi" else if (d == 0) "Sot" else if (d == 1) "Nesër" else Afatet.ditetTekst(d))
            }
            Rezultati((a["emri"] as? String).orEmpty().ifEmpty { jsString(a["barkodi"] ?: "") }, listOf(jsString(a["barkodi"] ?: ""), kur).filter { it.isNotEmpty() }.joinToString(" · "),
                Veprimi.Afati((a["id"] as? String).orEmpty()))
        }))
    }
    // Hyrja 94 (pronari: "me mujt me lyp qdo sen ... krejt kolegt qe jan ne qat grup ... veq brenda grupit"): afatet e kolegëve të grupit
    if (Llogaria.leja("grupi") && !Llogaria.eshteVizitor()) {
        val uIm = Llogaria.perdoruesi.value?.uid
        val afK = ArrayList<Pair<Obj, String>>()
        (Grupi.permbledhjet.value ?: emptyMap()).forEach { (u, p) ->
            if (u == uIm) return@forEach
            val emriK = (p["emri"] as? String).orEmpty()
            (p["afatet"] as? List<*>)?.forEach { x ->
                @Suppress("UNCHECKED_CAST") val a = x as? Obj ?: return@forEach
                if (Afatet.statusi(a) != "hequr" && (ka(a["emri"]) || ka(a["barkodi"]) || ka(a["furnizuesi"]))) afK.add(a to emriK)
            }
        }
        afK.sortWith { x, y -> Afatet.krahaso(x.first, y.first) }
        if (afK.isNotEmpty()) l.add(GrupiIRezultateve("Afatet e kolegëve", Ik.Afatet, "kuqe", afK.size, afK.take(MAX).map { (a, emriK) ->
            val d = Afatet.ditetDeri(a["data"])
            val kur = if (d == null) "Pa datë" else Afatet.formato(a["data"]) + " · " + (if (d < 0) "Skadoi" else if (d == 0) "Sot" else if (d == 1) "Nesër" else Afatet.ditetTekst(d))
            Rezultati((a["emri"] as? String).orEmpty().ifEmpty { jsString(a["barkodi"] ?: "") },
                listOf(emriK, jsString(a["barkodi"] ?: ""), kur).filter { it.isNotEmpty() }.joinToString(" · "), Veprimi.Tabi("grupi"))
        }))
    }
    // Hyrja 96 (web v335): malli i kolegëve të grupit (vetëm lexim; vetëm kolegët që janë ende në grup)
    if (Llogaria.leja("grupi") && !Llogaria.eshteVizitor()) {
        val uIm = Llogaria.perdoruesi.value?.uid
        val emrat = Grupi.anetaret.value.associate { (it["uid"] as? String).orEmpty() to (it["emri"] as? String).orEmpty() }
        val mK = ArrayList<Pair<List<*>, String>>()
        Grupi.malli.value.forEach { (u, x) ->
            if (u == uIm || u !in emrat) return@forEach
            val emriK = emrat[u].orEmpty().ifEmpty { (x["emri"] as? String).orEmpty() }
            (x["p"] as? List<*>)?.forEach { r -> val rr = r as? List<*> ?: return@forEach; if (ka(rr.getOrNull(1)) || ka(rr.getOrNull(0)) || ka(rr.getOrNull(3))) mK.add(rr to emriK) }
        }
        mK.sortWith(compareBy<Pair<List<*>, String>> { jsString(it.first.getOrNull(1) ?: "").lowercase() }.thenBy { it.second.lowercase() })
        if (mK.isNotEmpty()) l.add(GrupiIRezultateve("Malli i kolegëve", Ik.Malli, "blu", mK.size, mK.take(MAX).map { (r, emriK) ->
            val bk = jsString(r.getOrNull(0) ?: ""); val em = jsString(r.getOrNull(1) ?: "")
            Rezultati(em.ifEmpty { bk }, listOf(emriK, bk, jsString(r.getOrNull(4) ?: ""), numerOse0(r.getOrNull(2)).toLong().toString() + " copë").filter { it.isNotEmpty() }.joinToString(" · "), Veprimi.Tabi("grupi"))
        }))
    }
    // Furnizuesit (nga afatet dhe malli)
    val furn = LinkedHashMap<String, Triple<String, Int, Int>>()
    fun shtoF(e: Any?, afat: Boolean) {
        val emri = (e as? String)?.trim().orEmpty()
        if (emri.isEmpty() || !ka(emri)) return
        val c = normalizo(emri); val x = furn[c] ?: Triple(emri, 0, 0)
        furn[c] = if (afat) x.copy(second = x.second + 1) else x.copy(third = x.third + 1)
    }
    if (Llogaria.leja("afatet")) g.afatet.forEach { shtoF(it["furnizuesi"], true) }
    if (Llogaria.leja("stoku")) g.produktet.values.forEach { shtoF(it["furnizuesi"], false) }
    val fl = furn.values.sortedBy { it.first.lowercase() }
    if (fl.isNotEmpty()) l.add(GrupiIRezultateve("Furnizuesit", Ik.Kamion, "gjelber", fl.size, fl.take(MAX).map { (e, a, p) ->
        Rezultati(e, listOf(if (a > 0) (if (a == 1) "1 afat" else "$a afate") else "", if (p > 0) (if (p == 1) "1 produkt" else "$p produkte") else "").filter { it.isNotEmpty() }.joinToString(" · "),
            if (a > 0 && Llogaria.leja("afatet")) Veprimi.Kerko(e) else Veprimi.Tabi("malli"))
    }))
    if (Llogaria.leja("grupi") && !Llogaria.eshteVizitor()) {
        val an = Grupi.anetaret.value.filter { ka(it["emri"]) }
        if (an.isNotEmpty()) l.add(GrupiIRezultateve("Kolegët", Ik.Personi, "vjollce", an.size, an.take(MAX).map {
            Rezultati((it["emri"] as? String).orEmpty(), if (it["pronar"] == true || it["roli"] == "pronar") "Admin i grupit" else "Koleg", Veprimi.Tabi("grupi"))
        }))
    }
    if (Llogaria.eshteMerchandiser()) {
        val mk = Merchandiseri.marketet().filter { ka(it["emri"]) }
        if (mk.isNotEmpty()) l.add(GrupiIRezultateve("Marketet", Ik.Vendi, "gjelber", mk.size, mk.take(MAX).map {
            Rezultati((it["emri"] as? String).orEmpty(), "Market", Veprimi.Cilesimi("marketet"))
        }))
    }
    val ci = listOfNotNull(
        "pamja" to "Pamja", "skenimi" to "Skenimi", "njoftimet" to "Njoftimet",
        if (Llogaria.leja("ora")) "ora" to "Ora e dorës" else null,
        if (Llogaria.leja("marketet") || Llogaria.eshteAdmin()) "marketet" to "Marketet" else null,
        if (Llogaria.leja("stoku")) "lista" to "Malli" else null,
        if (Llogaria.leja("stoku")) "furnizuesit" to "Furnizuesit" else null,
        if (Llogaria.leja("stoku")) "produktet" to "Produktet" else null,
        if (site.stoku.vendas.Admini.eshteAdmin()) "perdoruesit" to "Përdoruesit" else null,
        if (Llogaria.perdoruesi.value != null || Llogaria.eshteVizitor()) "llogaria" to "Llogaria" else null
    ).filter { ka(it.second) }
    if (ci.isNotEmpty()) l.add(GrupiIRezultateve("Cilësimet", Ik.Cilesimet, "gri", ci.size, ci.take(MAX).map { Rezultati(it.second, "Cilësimet", Veprimi.Cilesimi(it.first)) }))
    return l
}

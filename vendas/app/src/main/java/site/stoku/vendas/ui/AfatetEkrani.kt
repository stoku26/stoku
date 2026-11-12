package site.stoku.vendas.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import site.stoku.logjika.Afatet
import site.stoku.logjika.Marketet
import site.stoku.logjika.Obj
import site.stoku.logjika.jsString
import site.stoku.logjika.obj
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Grupi
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Merchandiseri


/** Afatet: lista me ngjyra sipas statusit, filtrat, kërkimi, "+ Shto" */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun AfatetEkrani(skano: ((String) -> Unit) -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    var filtri by remember { mutableStateOf("aktive") }
    var muaji by remember { mutableStateOf("") }
    var kerkimi by remember { mutableStateOf("") }
    var hapur by remember { mutableStateOf<String?>(null) } // id, ose "" = afat i ri
    val kontekstiShto = androidx.compose.ui.platform.LocalContext.current
    // v283: prekja e një ngjarjeje te Aktiviteti (Grupi) e hap afatin këtu
    val afatiKerkuar by site.stoku.vendas.MainActivity.afatiKerkuar.collectAsState()
    LaunchedEffect(afatiKerkuar) {
        val id = afatiKerkuar ?: return@LaunchedEffect
        if (g.afatet.any { it["id"] == id }) hapur = id
        site.stoku.vendas.MainActivity.afatiKerkuar.value = null
    }
    var zgjedhja by remember { mutableStateOf<Set<String>?>(null) }
    var fshiZgjedhjen by remember { mutableStateOf(false) }
    var fleta by remember { mutableStateOf<android.net.Uri?>(null) } // fotoja e fletës për leximin me AI
    var excel by remember { mutableStateOf<String?>(null) } // "krejt" = e gjithë lista (me muajin), "zgjedhura" = vetëm të zgjedhurat
    var importi by remember { mutableStateOf(false) }
    var foto by remember { mutableStateOf(false) } // Hyrja 35: "Eksporto si foto"
    var pdf by remember { mutableStateOf(false) } // Hyrja 36: "Eksporto PDF" (për printim)
    var skedari by remember { mutableStateOf<site.stoku.vendas.Skedari?>(null) }
    var kuFleta by remember { mutableStateOf<android.net.Uri?>(null) } // "Ku do ta kontrollosh fletën?" (PC ose këtu)
    val (fotografo, ngaGaleria) = rememberFotoEFletes { if (mundDergoFletenNePc()) kuFleta = it else fleta = it }
    LaunchedEffect(Unit) { Merchandiseri.pyetMarketinEPare() } // merchandiseri pa asnjë market: pyetet një herë
    if (!Llogaria.leja("afatet")) return

    val aktiviM by Merchandiseri.aktivi.collectAsState()
    val lejet by Llogaria.lejet.collectAsState()
    remember(aktiviM, lejet) { 0 }
    val kaM = Merchandiseri.kaMarkete()
    val idM = Merchandiseri.idAktiv()
    val te = Merchandiseri.afatetEMarketit(g.afatet) // v241: afatet e marketit ku je ("Të gjitha marketet" = të gjitha)
    val nr = Afatet.numero(te)
    val numrat = mapOf("aktive" to nr.aktive, "skaduar" to nr.skaduar + nr.paDate, "afer" to nr.afer, "ok" to nr.ok, "hequr" to nr.hequr)
    fun eFiltruara(mu: String): List<Obj> {
        val k = kerkimi.trim().lowercase()
        return te.filter { a ->
            if (mu.isNotEmpty() && Afatet.celesiMuajit(a) != mu) return@filter false
            val st = Afatet.statusi(a)
            when (filtri) {
                "aktive" -> if (st == "hequr") return@filter false
                "skaduar" -> if (st != "skaduar" && st != "pa-date") return@filter false
                else -> if (st != filtri) return@filter false
            }
            if (k.isNotEmpty()) {
                val t = ((a["emri"] as? String).orEmpty() + " " + jsString(a["barkodi"] ?: "") + " " + (a["furnizuesi"] as? String).orEmpty()).lowercase()
                if (!t.contains(k)) return@filter false
            }
            true
        }.sortedWith { a, b -> Afatet.krahaso(a, b) }
    }
    val lista = eFiltruara(muaji)
    val muajt = Afatet.muajtELista(eFiltruara("")).toMutableList()
    if (muaji.isNotEmpty() && muajt.none { it.celes == muaji }) muajt.add(Afatet.Muaji(muaji, 0, Afatet.emriMuajit(muaji)))
    val paFurnizues = Llogaria.eshteMerchandiser()

    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 24.dp)) {
            item {
                // Hyrja 31: pa muajin dhe pa ikonën e cloud-it (pronari): sinkronizimi bëhet vetë pas çdo ndryshimi (Dyqani.kurNdryshon →
                // Sinkronizimi.planifiko), statusi mbetet te Cilësimet → Llogaria. Rreshti mbetet 44 i lartë, që kartat të mos lëvizin.
                Row(Modifier.heightIn(min = 44.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Afatet", style = tx(26, 700, n.ink, -0.025), modifier = Modifier.weight(1f))
                }
                Hapesire(16.dp)
                CipiIMarketit(Modifier.padding(bottom = 12.dp))
                val ai = Llogaria.leja("afatetAI")
                val shto = Llogaria.leja("afatetShto")
                val lejaImp = Llogaria.leja("afatetImporto")
                val lejaEks = Llogaria.leja("eksportExcel")
                val lejaPdf = Llogaria.leja("eksportPdf")
                val kaExcel = lejaImp || lejaEks || lejaPdf // menyja "Excel" s'ka kuptim pa asnjë nga këto
                // Si .sb-actions te web-i: majtas "Fotografo fletën", djathtas "Shto" dhe poshtë tij "Importo" / "Eksporto"
                if (ai || shto || kaExcel) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        // Karta kryesore: "Fotografo fletën" (afatet lexohen me AI) + galeria; pa këtë leje: "Afat i ri"
                        if (ai || shto) Column(Modifier.weight(1.4f).heightIn(min = 140.dp).shadow(14.dp, RoundedCornerShape(22.dp), spotColor = n.accent, ambientColor = n.accent)
                            .clip(RoundedCornerShape(22.dp)).background(n.accent).clickable { if (ai) fotografo() else hapur = "" }.padding(16.dp)) {
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                                Box(Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).border(1.5.dp, Color(0x80FFFFFF), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                                    Icon(if (ai) Ik.Kamera else Ik.Plus, null, Modifier.size(22.dp), tint = Color.White)
                                }
                                Spacer(Modifier.weight(1f))
                                if (ai) Box(Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(Color(0x29FFFFFF)).clickable { ngaGaleria() },
                                    contentAlignment = Alignment.Center) { Icon(Ik.Foto, "Zgjidh foto nga galeria", Modifier.size(20.dp), tint = Color.White) }
                            }
                            Spacer(Modifier.weight(1f))
                            Text(if (ai) "Fotografo fletën" else "Afat i ri", style = tx(17, 700, Color.White))
                            Text(if (ai) "Afatet lexohen nga foto automatikisht" else "Skano barkodin ose shkruaje, pastaj zgjidh datën", style = tx(12, 400, Color(0xD9FFFFFF)))
                        }
                        // v277 (Hyrja 38, ideja 10 "B"): "Shto" me kornizë blu; poshtë "Importo" dhe "Eksporto" pranë njëri-tjetrit
                        if (shto || kaExcel) Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            // v290 (pronari): "Shto" hap direkt skanimin; pas barkodit del "Afat i ri" me të. PDA, pa leje për kamerën ose pa
                            // lejen e telefonit për kamerën ende: dritarja direkt (aty butoni i skanimit e kërkon lejen), si më parë
                            if (shto) ButoniShto {
                                val kaKamere = !site.stoku.vendas.Opsionet.pda.value && Llogaria.leja("kamera") &&
                                    androidx.core.content.ContextCompat.checkSelfPermission(kontekstiShto, android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED
                                if (kaKamere) skano { b -> skanuar = b; hapur = "" } else hapur = ""
                            }
                            val kaEks = lejaEks || lejaPdf
                            if (kaExcel) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (lejaImp) ButoniKatror("Importo", Ik.Importo, Modifier.weight(1f)) { importi = true }
                                if (kaEks) MenyjaEksportit(lejaEks, lejaPdf, Modifier.weight(1f), {
                                    if (te.isEmpty()) Toast.trego("S'ka afate për eksport.") else excel = "krejt"
                                }, { if (te.isEmpty()) Toast.trego("S'ka afate për eksport.") else pdf = true }) { if (te.none { Afatet.statusi(it) != "hequr" }) Toast.trego("S'ka afate për eksport.") else foto = true }
                            }
                        }
                    }
                    Hapesire(12.dp)
                }
                Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), "Kërko emër, barkod ose furnizues", ikona = Ik.Kerko)
                Hapesire(12.dp)
                Row(Modifier.fillMaxWidth().rrotullimMeZbehje(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("aktive" to "Të gjitha", "skaduar" to "Të skaduara", "afer" to "Afër skadimit", "ok" to "Në rregull", "hequr" to "Të hequra").forEach { (f, t) ->
                        Cip(t, numrat[f]?.takeIf { it > 0 }?.toString(), filtri == f) { filtri = f; zgjedhja = null }
                    }
                }
                if (muajt.size >= 2 || muaji.isNotEmpty()) {
                    Hapesire(10.dp)
                    Row(Modifier.fillMaxWidth().rrotullimMeZbehje(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Cip("Të gjithë muajt", null, muaji.isEmpty()) { muaji = "" }
                        muajt.forEach { m -> Cip(m.emri, m.n.toString(), muaji == m.celes) { muaji = m.celes } }
                    }
                }
                Hapesire(14.dp)
                if (lista.isEmpty()) {
                    val (titulli, teksti) = when {
                        te.isEmpty() && idM != null -> "S'ka ende afate te ky market" to "Fotografo fletën ose shtoji me \"Shto\": ruhen te " + Merchandiseri.emri(idM) + "."
                        te.isEmpty() -> "S'ka ende asnjë afat" to "Fotografo fletën ku janë shkruar afatet, ose shtoji me \"Shto\"."
                        kerkimi.isNotBlank() -> "Asgjë s'u gjet" to "Provo një kërkim tjetër."
                        filtri == "skaduar" -> "Asnjë produkt i skaduar" to ""
                        filtri == "afer" -> "Asnjë produkt afër skadimit" to "Asgjë nuk skadon brenda 30 ditëve."
                        filtri == "hequr" -> "Asnjë produkt i hequr ende" to ""
                        filtri == "ok" -> "Asnjë" to ""
                        else -> "Asnjë afat aktiv" to ""
                    }
                    Column(Modifier.fillMaxWidth().padding(vertical = 32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(titulli, style = tx(16, 700, n.ink))
                        if (teksti.isNotEmpty()) Text(teksti, style = tx(14, 400, n.muted), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
            if (kaM && idM == null) {
                // v248: merchandiseri te "Të gjitha marketet": secili market me afatet e veta
                Marketet.grupo(lista, Merchandiseri.marketet()).forEach { gr ->
                    item(key = "m:" + gr.id) { TitulliIMarketit((gr.id.ifEmpty { null }?.let { gr.emri } ?: "Pa market") + " · " + gr.afatet.size) }
                    items(gr.afatet, key = { "a:" + it["id"] }) { a -> KartaEAfatit(a, zgjedhja, paFurnizues, { hapur = a["id"] as String }, { zgjedhja = ndryshoZgjedhjen(zgjedhja, a["id"] as String) }) }
                }
            } else if (filtri == "afer" && !paFurnizues) {
                lista.groupBy { (it["furnizuesi"] as? String).orEmpty() }.toSortedMap { a, b -> if (a.isEmpty()) 1 else if (b.isEmpty()) -1 else Afatet.KOLATORI.compare(a, b) }
                    .forEach { (f, l) ->
                        item(key = "g:$f") { Text(f.ifEmpty { "Pa furnizues" } + " · " + l.size, style = tx(13, 700, n.ink3), modifier = Modifier.padding(top = 6.dp, bottom = 8.dp)) }
                        items(l, key = { "a:" + it["id"] }) { a -> KartaEAfatit(a, zgjedhja, paFurnizues, { hapur = a["id"] as String }, { zgjedhja = ndryshoZgjedhjen(zgjedhja, a["id"] as String) }) }
                    }
            } else items(lista, key = { "a:" + it["id"] }) { a ->
                KartaEAfatit(a, zgjedhja, paFurnizues, { hapur = a["id"] as String }, { zgjedhja = ndryshoZgjedhjen(zgjedhja, a["id"] as String) })
            }
        }
        // Shiriti i zgjedhjes (mbaj gishtin te një afat)
        zgjedhja?.let { z ->
            Row(Modifier.align(Alignment.BottomCenter).padding(16.dp).fillMaxWidth().shadow(10.dp, RoundedCornerShape(18.dp)).clip(RoundedCornerShape(18.dp))
                .background(n.invBg).padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Ik.X, "Anulo", Modifier.size(32.dp).clip(CircleShape).clickable { zgjedhja = null }.padding(6.dp), tint = n.invFg)
                Text(if (z.size == 1) "1 e zgjedhur" else "${z.size} të zgjedhura", style = tx(14, 600, n.invFg), modifier = Modifier.weight(1f).padding(start = 6.dp))
                // "Zgjidh të gjitha" (sërish = asnjë), si afZgjTeGjitha te web-i
                val idsLista = lista.mapNotNull { it["id"] as? String }
                Icon(Ik.Kontroll, "Zgjidh të gjitha", Modifier.size(36.dp).clip(CircleShape).clickable {
                    zgjedhja = if (idsLista.isNotEmpty() && idsLista.all { z.contains(it) }) emptySet() else idsLista.toSet()
                }.padding(8.dp), tint = n.invFg)
                if (Llogaria.leja("eksportExcel")) Row(Modifier.clip(RoundedCornerShape(10.dp)).clickable { if (z.isNotEmpty()) excel = "zgjedhura" }.padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Icon(Ik.Excel, null, Modifier.size(18.dp), tint = n.invFg); Spacer(Modifier.width(6.dp)); Text("Excel", style = tx(14, 600, n.invFg))
                }
                if (Llogaria.leja("afatetFshi")) Row(Modifier.clip(RoundedCornerShape(10.dp)).clickable { fshiZgjedhjen = true }.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Ik.Kosh, null, Modifier.size(18.dp), tint = n.exp); Spacer(Modifier.width(6.dp)); Text("Fshi", style = tx(14, 600, n.exp))
                }
            }
        }
    }

    hapur?.let { id -> AfatiFlete(id.ifEmpty { null }, skanuar.also { skanuar = "" }, skano) { hapur = null } }
    kuFleta?.let { u -> KuFletaDritarja(u, stok = false, mbyll = { kuFleta = null }) { fleta = u } }
    fleta?.let { u -> FletaEkrani(u, mbyll = { fleta = null }) { f -> filtri = f; muaji = ""; zgjedhja = null } }
    excel?.let { lloji ->
        val zgj = if (lloji == "zgjedhura") zgjedhja.orEmpty().let { z -> te.filter { a -> (a["id"] as? String)?.let { z.contains(it) } == true } } else null
        AfatetExcelFlete(zgj, { mu -> eFiltruara(mu) }, muaji, filtri, mbyll = { excel = null }) { sk -> skedari = sk }
    }
    if (foto) AfatetFotoFlete(te) { foto = false }
    if (pdf) AfatetPdfFlete(te, mbyll = { pdf = false }) { sk -> skedari = sk }
    if (importi) ImportiAfateveFlete(mbyll = { importi = false }) { filtri = "aktive"; muaji = ""; zgjedhja = null }
    skedari?.let { sk -> SkedariFlete(sk) { skedari = null } }
    if (fshiZgjedhjen) {
        val ids = zgjedhja.orEmpty()
        Konfirmo(if (ids.size == 1) "Të fshihet 1 afat?" else "Të fshihen ${ids.size} afate?",
            "Fshihen nga të gjitha pajisjet. Nëse produktet thjesht u hoqën nga rafti, përdor \"U hoq nga rafti\" (mbeten si histori).", "Fshi",
            mbyll = { fshiZgjedhjen = false }) {
            if (Llogaria.leja("afatetFshi")) {
                ids.forEach { Dyqani.fshijAfatin(it) }
                Toast.trego(if (ids.size == 1) "U fshi 1 afat." else "U fshinë ${ids.size} afate.")
                zgjedhja = null
            }
        }
    }
}

private var skanuar = "" // barkodi i skanuar para hapjes së "Afat i ri"

private fun ndryshoZgjedhjen(z: Set<String>?, id: String): Set<String>? =
    (z ?: emptySet()).let { if (id in it) it - id else it + id }.ifEmpty { null }

/** v277 (pronari, ideja 10 "B"; v278: pa kornizën blu, njësoj si "Importo" / "Eksporto"): "Shto" me ikonën e barkodit (19 dp, sa ikonat e "Importo" / "Eksporto"), si #afShto te web-i */
@Composable
private fun ButoniShto(onClick: () -> Unit) {
    val n = N
    Row(Modifier.fillMaxWidth().height(65.dp).clip(RoundedCornerShape(18.dp)).border(1.5.dp, n.line, RoundedCornerShape(18.dp)).clickable(onClick = onClick)
        .semantics(mergeDescendants = true) { contentDescription = "Shto afat"; role = androidx.compose.ui.semantics.Role.Button },
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
        Icon(Ik.ShtoBarkod, null, Modifier.size(19.dp), tint = n.ink)
        Spacer(Modifier.width(8.dp))
        Text("Shto", style = tx(15, 600, n.ink))
    }
}

/** "Importo" / "Eksporto": kornizë e hollë, pa sfond, ikona 19 dp sipër tekstit (si .sb-action-kv te web-i) */
@Composable
private fun ButoniKatror(teksti: String, ikona: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier, onClick: () -> Unit) {
    val n = N
    Column(modifier.height(65.dp).clip(RoundedCornerShape(16.dp)).border(1.5.dp, n.line, RoundedCornerShape(16.dp)).clickable(onClick = onClick)
        .semantics(mergeDescendants = true) { contentDescription = teksti; role = androidx.compose.ui.semantics.Role.Button },
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(ikona, null, Modifier.size(19.dp), tint = n.ink)
        Spacer(Modifier.height(5.dp))
        Text(teksti, style = tx(12, 600, n.ink), maxLines = 1)
    }
}

/** "Eksporto" (si #afExcel te web-i), me menynë Eksporto Excel / Eksporto PDF (Hyrja 36) / Eksporto si foto (Hyrja 35); importi u nda (Hyrja 38) */
@Composable
private fun MenyjaEksportit(lejaEks: Boolean, lejaPdf: Boolean, modifier: Modifier, eksporto: () -> Unit, pdf: () -> Unit, foto: () -> Unit) {
    val n = N
    var hapur by remember { mutableStateOf(false) }
    Box(modifier) {
        ButoniKatror("Eksporto", Ik.Eksporto, Modifier.fillMaxWidth()) { hapur = !hapur }
        androidx.compose.material3.DropdownMenu(hapur, { hapur = false }, offset = androidx.compose.ui.unit.DpOffset(0.dp, 6.dp),
            // v278: në temën e errët menyja dallohet nga faqja (sfond më i çelët + vijë), se hija s'shihet
            shape = RoundedCornerShape(14.dp), containerColor = if (n.erret) n.surface2 else n.surface, shadowElevation = 12.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, if (n.erret) Color(0x29FFFFFF) else n.line),
            modifier = Modifier.padding(horizontal = 6.dp)) { // Hyrja 40: aq e gjerë sa teksti (pa min 210)
            // Hyrja 40: me ikonat si te web-i (.sb-menu__item: ikona 18 me ngjyrën muted, 10 dp larg tekstit)
            listOfNotNull(
                if (lejaEks) Triple("Eksporto Excel", Ik.ExcelFleta, eksporto) else null,
                if (lejaPdf) Triple("Eksporto PDF", Ik.Pdf, pdf) else null,
                if (lejaEks) Triple("Eksporto si foto", Ik.Foto, foto) else null
            ).forEach { (t, ik, f) ->
                Row(Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(10.dp)).clickable { hapur = false; f() }.padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Icon(ik, null, Modifier.size(18.dp), tint = n.muted)
                    Spacer(Modifier.width(10.dp))
                    Text(t, style = tx(14, 600, n.ink))
                }
            }
        }
    }
}

@Composable
fun Cip(teksti: String, numri: String?, aktiv: Boolean, onClick: () -> Unit) {
    val n = N
    Row(Modifier.height(36.dp).clip(RoundedCornerShape(18.dp)).background(if (aktiv) n.invBg else n.surface)
        .border(if (aktiv) 0.dp else 1.dp, if (aktiv) Color.Transparent else n.line, RoundedCornerShape(18.dp)).clickable(onClick = onClick).padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Text(teksti, style = tx(13, 600, if (aktiv) n.invFg else n.ink2))
        if (numri != null) { Spacer(Modifier.width(7.dp)); Text(numri, style = tx(11, 600, (if (aktiv) n.invFg else n.ink2).copy(alpha = 0.7f))) }
    }
}

/** Kutia e ditëve (sb-days): numri i madh + teksti i vogël */
@Composable
internal fun KutiaEDiteve(st: String, d: Int?) {
    val n = N
    val (madh, vogel, lloji) = when {
        st == "hequr" -> Triple("✓", "hequr", "rem")
        d == null -> Triple("–", "pa datë", "exp")
        d < 0 -> Triple((-d).toString(), "ditë më parë", "exp")
        d == 0 -> Triple("Sot", "skadon", "exp")
        d >= 60 -> Triple(Math.round(d / 30.0).toString(), "muaj", "ok")
        else -> Triple(d.toString(), "ditë", if (st == "afer") "near" else "ok")
    }
    val (sf, ng) = when (lloji) { "exp" -> n.expTint to n.exp; "near" -> n.nearTint to n.near; "rem" -> n.remTint to n.rem; else -> n.okTint to n.ok }
    Column(Modifier.size(52.dp).clip(RoundedCornerShape(14.dp)).background(sf), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text(madh, style = tx(19, 700, ng))
        Text(vogel, style = txF(9.5f, 600, ng), textAlign = TextAlign.Center, lineHeight = androidx.compose.ui.unit.TextUnit.Unspecified, maxLines = 2,
            modifier = Modifier.padding(top = 3.dp, start = 2.dp, end = 2.dp))
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun KartaEAfatit(a: Obj, zgjedhja: Set<String>?, paFurnizues: Boolean, hap: () -> Unit, zgjidh: () -> Unit) {
    val n = N
    val st = Afatet.statusi(a)
    val d = Afatet.ditetDeri(a["data"])
    val (sfondi, vija, mesazhi) = when (st) {
        "skaduar", "pa-date" -> Triple(n.cardExp, n.cardExpLine, n.exp)
        "afer" -> Triple(n.cardNear, n.cardNearLine, n.near)
        "ok" -> Triple(n.cardOk, n.cardOkLine, n.ok)
        else -> Triple(n.cardRem, n.cardRemLine, n.rem)
    }
    val zgjedhur = (a["id"] as? String)?.let { zgjedhja?.contains(it) } == true
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp).clip(RoundedCornerShape(18.dp)).background(sfondi)
        .border(if (zgjedhur) 2.dp else 1.dp, if (zgjedhur) n.accent else vija, RoundedCornerShape(18.dp))
        .combinedClickable(onClick = { if (zgjedhja != null) zgjidh() else hap() }, onLongClick = zgjidh).padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        KutiaEDiteve(st, d)
        Column(Modifier.weight(1f)) {
            Text((a["emri"] as? String)?.ifEmpty { null } ?: (a["barkodi"] as? String)?.ifEmpty { null } ?: "(pa emër)", style = tx(15, 600, n.ink))
            // v248: merchandiseri: te çdo afat shihet marketi ku ndodhet
            if (Merchandiseri.kaMarkete()) {
                val mk = a["m"] as? String
                ShenjaEMarketit(if (mk != null && Marketet.sipasId(Merchandiseri.marketet(), mk) != null) Merchandiseri.emri(mk) else "Pa market", Modifier.padding(top = 4.dp))
            }
            val nen = listOf(if (paFurnizues) "" else (a["furnizuesi"] as? String).orEmpty(), Afatet.sasiaTekst(a), if ((a["data"] as? String).orEmpty().isNotEmpty()) Afatet.formato(a["data"]) else "")
                .filter { it.isNotEmpty() }.joinToString(" · ")
            if (nen.isNotEmpty()) Text(nen, style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 3.dp))
            if ((a["emri"] as? String).orEmpty().isNotEmpty() && (a["barkodi"] as? String).orEmpty().isNotEmpty())
                Text(a["barkodi"] as String, style = txNum(11.5f, n.faint), modifier = Modifier.padding(top = 2.dp))
            Text(Afatet.pershkrimi(a), style = tx(12, 600, mesazhi), modifier = Modifier.padding(top = 4.dp))
            if (Llogaria.leja("afatetNdrysho") && (st == "skaduar" || st == "hequr")) {
                val ng = if (st == "skaduar") n.exp else n.rem
                Row(Modifier.padding(top = 8.dp).clip(RoundedCornerShape(10.dp)).border(1.5.dp, ng, RoundedCornerShape(10.dp))
                    .clickable { if (st == "skaduar") shenoHequr(a) else riktheAktiv(a) }.padding(horizontal = 11.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Icon(if (st == "skaduar") Ik.Kontroll else Ik.Rikthe, null, Modifier.size(15.dp), tint = ng)
                    Spacer(Modifier.width(6.dp))
                    Text(if (st == "skaduar") "U hoq nga rafti" else "Rikthe si aktiv", style = tx(13, 700, ng))
                }
            }
        }
    }
}

fun shenoHequr(a: Obj) {
    if (!Llogaria.leja("afatetNdrysho")) return
    Dyqani.perditesoAfatin(a["id"] as String, mapOf("statusi" to "hequr", "hequrSe" to System.currentTimeMillis(), "hequrNga" to (Llogaria.perdoruesi.value?.emri ?: "")))
    Toast.trego("\"" + ((a["emri"] as? String)?.ifEmpty { null } ?: jsString(a["barkodi"])) + "\" u shënua si i hequr nga rafti.")
    Grupi.ngjarjeAfati("hequr", a) // aktiviteti i grupit: kush çfarë hoqi
}

fun riktheAktiv(a: Obj) {
    if (!Llogaria.leja("afatetNdrysho")) return
    Dyqani.perditesoAfatin(a["id"] as String, mapOf("statusi" to "aktiv", "hequrSe" to 0L))
    Grupi.ngjarjeAfati("rikthyer", a)
}

// ---------------- Dritarja: shto / ndrysho një afat ----------------
@Composable
fun AfatiFlete(id: String?, barkodiISkanuar: String, skano: ((String) -> Unit) -> Unit, mbyll: () -> Unit) {
    val n = N
    val a = remember(id) { id?.let { Dyqani.afati(it) } }
    if (a == null && !Llogaria.leja("afatetShto")) { LaunchedEffect(Unit) { mbyll() }; return }
    val vetemLexim = a != null && !Llogaria.leja("afatetNdrysho")
    val paFurnizues = Llogaria.eshteMerchandiser()
    val pda by site.stoku.vendas.Opsionet.pda.collectAsState()
    var barkodi by remember { mutableStateOf((a?.get("barkodi") as? String) ?: barkodiISkanuar) }
    var emri by remember { mutableStateOf((a?.get("emri") as? String) ?: Dyqani.emriNgaBarkodi(barkodiISkanuar)) }
    var data by remember { mutableStateOf(Afatet.formatoPerFushe(a?.get("data"))) }
    var sasia by remember { mutableStateOf(a?.get("sasia")?.takeIf { it != "" }?.let { jsString(it) } ?: "") }
    var furn by remember { mutableStateOf((a?.get("furnizuesi") as? String) ?: if (a == null) Dyqani.furnizuesiNgaBarkodi(barkodiISkanuar) else "") }
    var fshi by remember { mutableStateOf(false) }
    var sugjerimet by remember { mutableStateOf(false) }
    // v241: marketi (vetëm kur ka markete); afati i ri merr marketin ku je
    val kaM = Merchandiseri.kaMarkete()
    var mk by remember { mutableStateOf(if (a != null) (a["m"] as? String)?.takeIf { Marketet.sipasId(Merchandiseri.marketet(), it) != null } else Merchandiseri.idAktiv()) }
    val fEmri = remember { FocusRequester() }
    val fData = remember { FocusRequester() }
    val fBarkodi = remember { FocusRequester() }

    fun plotesoNgaBarkodi() {
        val b = barkodi.trim()
        if (emri.isBlank()) emri = Dyqani.emriNgaBarkodi(b)
        if (furn.isBlank()) furn = Dyqani.furnizuesiNgaBarkodi(b)
    }

    fun ruaj() {
        if (vetemLexim) { mbyll(); return }
        if (!Llogaria.leja(if (a != null) "afatetNdrysho" else "afatetShto")) return
        val b = barkodi.trim().replace(Regex("\\s+"), "")
        val em = emri.trim()
        val iso = Afatet.lexoDatenEFushes(data) ?: ""
        val st = sasia.trim()
        val s = Afatet.lexoSasine(st)
        if (st.isNotEmpty() && s == "") { Toast.trego("Sasia duhet të jetë numër i plotë (p.sh. 12)."); return }
        if (b.isEmpty() && em.isEmpty()) { Toast.trego("Shkruaj barkodin ose emrin e produktit."); fBarkodi.requestFocus(); return }
        if (iso.isEmpty()) { Toast.trego("Shkruaj datën e skadimit, p.sh. 31-12-26."); fData.requestFocus(); return }
        if (kaM && a == null && mk == null) { Toast.trego("Zgjidh marketin ku është ky produkt."); return }
        val afPara = id?.let { Dyqani.afati(it) }
        val furnPara = (afPara?.get("furnizuesi") as? String).orEmpty()
        val f = if (paFurnizues) furnPara else furn.trim()
        // Herën tjetër ky barkod plotëson vetë emrin dhe furnizuesin; furnizuesi i ri pret kontrollin (v212, v214)
        site.stoku.vendas.Regjistri.mesoNgaPerdoruesi(b, em, f)
        if (f.isNotEmpty() && f != furnPara) site.stoku.vendas.Regjistri.regjistroFurnizuesinERi(f)
        val tani = System.currentTimeMillis()
        if (id != null && afPara != null) {
            Dyqani.perditesoAfatin(id, mapOf("barkodi" to b, "emri" to em, "data" to iso, "sasia" to s, "furnizuesi" to f) + (if (kaM) mapOf("m" to (mk ?: "")) else emptyMap()))
            Toast.trego("Afati u ruajt.")
        } else {
            // Hyrja 57 (pronari): afati i njëjtë (barkodi + data, + marketi) ekziston: copat i shtohen atij, s'krijohet rresht i ri
            val ekz = if (id == null) Afatet.afatiINjejte(Dyqani.g.afatet, b, iso, mk, kaM) else null
            if (ekz != null) {
                val sRe = Afatet.sasiaEBashkuar(ekz["sasia"], s)
                val ndr = mutableMapOf<String, Any?>("sasia" to sRe)
                if ((ekz["emri"] as? String).isNullOrEmpty() && em.isNotEmpty()) ndr["emri"] = em
                if ((ekz["furnizuesi"] as? String).isNullOrEmpty() && f.isNotEmpty()) ndr["furnizuesi"] = f
                Dyqani.perditesoAfatin(ekz["id"] as String, ndr)
                Toast.trego(if (s == "") "Ky afat ekziston tashmë (" + Afatet.formato(iso) + "). S'u krijua rresht i ri."
                    else "U shtuan " + jsString(s) + " copë te afati i " + Afatet.formato(iso) + (if (sRe != "") " (gjithsej " + jsString(sRe) + " copë)." else "."), 4500)
                mbyll()
                return
            }
            val idIRi = Afatet.idERe()
            Dyqani.shtoAfatin(obj("id" to idIRi, "barkodi" to b, "emri" to em, "data" to iso, "sasia" to s, "furnizuesi" to f,
                "statusi" to "aktiv", "krijuarSe" to tani, "ndryshuarSe" to tani, "krijuarNga" to (Llogaria.perdoruesi.value?.emri ?: "")).also { o -> if (kaM && mk != null) o["m"] = mk })
            Toast.trego(if (id != null) "Ky afat u fshi nga një pajisje tjetër ndërkohë. U ruajt si afat i ri." else "Afati u ruajt.", if (id != null) 4500 else 2600)
            Grupi.afateTeReja(1, false, listOf(idIRi))
        }
        mbyll()
    }

    Flete(mbyll) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(if (a != null) ((a["emri"] as? String)?.ifEmpty { null } ?: (a["barkodi"] as? String)?.ifEmpty { null } ?: "Afati") else "Afat i ri",
                style = tx(26, 700, n.ink, -0.02), modifier = Modifier.weight(1f), maxLines = 2, overflow = TextOverflow.Ellipsis)
            Text(if (vetemLexim) "Mbyll" else "Anulo", style = tx(15, 500, n.muted), modifier = Modifier.clip(RoundedCornerShape(8.dp)).clickable(onClick = mbyll).padding(6.dp))
        }
        if (a != null) {
            val st = Afatet.statusi(a)
            val (sf, ng) = when (st) { "skaduar", "pa-date" -> n.expTint to n.expInk; "afer" -> n.nearTint to n.nearInk; "ok" -> n.okTint to n.okInk; else -> n.remTint to n.ink3 }
            Text(Afatet.pershkrimi(a) + ((a["krijuarNga"] as? String)?.takeIf { it.isNotEmpty() }?.let { "\nShtuar nga: $it" } ?: ""),
                style = tx(14, 600, ng), modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(sf).padding(12.dp))
            if (!vetemLexim && (st == "skaduar" || st == "hequr")) Buton(if (st == "skaduar") "U hoq nga rafti" else "Rikthe si aktiv",
                { mbyll(); if (st == "skaduar") shenoHequr(a) else riktheAktiv(a) }, Modifier.fillMaxWidth(), lloji = "dyte",
                ikona = if (st == "skaduar") Ik.Kontroll else Ik.Rikthe)
        }
        // Barkodi + emri (karta e errët si te web-i); PDA: pa kamerë, barkodi vjen nga skaneri i PDA-së
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(n.hero).padding(start = 18.dp, end = 12.dp, top = 12.dp, bottom = 14.dp)) {
            if (pda && a == null) Row(Modifier.padding(bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(8.dp).clip(androidx.compose.foundation.shape.CircleShape).background(n.okDot))
                Spacer(Modifier.width(8.dp))
                Text("Skano barkodin me skanerin e PDA-së.", style = tx(12, 400, n.heroMuted))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Fusha(barkodi, { barkodi = it }, Modifier.weight(1f), "Barkodi", tastiera = KeyboardType.Ascii, fokusi = fBarkodi, vetemLexim = vetemLexim,
                    stili = txNum(18f, pesha = 500), sfondi = Color.Transparent, ngjyraTekstit = Color.White, paVije = true,
                    veprimi = ImeAction.Next, kurVeprim = { plotesoNgaBarkodi(); fEmri.requestFocus() })
                if (!vetemLexim && !pda && Llogaria.leja("kamera")) Box(Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(Color(0x1FFFFFFF))
                    .clickable { skano { b -> barkodi = b; plotesoNgaBarkodi() } }, contentAlignment = Alignment.Center) {
                    Icon(Ik.Skano, "Skano barkodin", Modifier.size(24.dp), tint = Color.White)
                }
            }
            Box(Modifier.fillMaxWidth().padding(end = 60.dp).height(2.dp).background(Color(0x55FFFFFF)))
            Fusha(emri, { emri = it }, Modifier.fillMaxWidth(), "Emri i produktit", fokusi = fEmri, vetemLexim = vetemLexim,
                stili = tx(18, 600), sfondi = Color.Transparent, ngjyraTekstit = Color.White, paVije = true, veprimi = ImeAction.Next,
                kurVeprim = { fData.requestFocus() })
        }
        // Hyrja 57 (pronari): "kur e skanon të njëjtin produkt me të njëjtin barkod me dal afatet që i ke të atij produkti"
        // (si #afatEkzistuese te web-i); prekja e vendos datën (dhe marketin), që copat t'i shtohen atij afati
        if (a == null) {
            val ekzistuese = remember(barkodi) { Afatet.afatetEBarkodit(Dyqani.g.afatet, barkodi) }
            if (ekzistuese.isNotEmpty()) AfatetEkzistuese(ekzistuese, kaM) { e ->
                (e["data"] as? String)?.takeIf { it.isNotEmpty() }?.let { data = Afatet.formatoPerFushe(it) }
                if (kaM) (e["m"] as? String)?.takeIf { Marketet.sipasId(Merchandiseri.marketet(), it) != null }?.let { mk = it }
            }
        }
        Text("Data e skadimit", style = tx(13, 600, n.ink3))
        // v254: pa datat e shpejta (1 javë, 2 javë, 1 muaj, 3 muaj), vetëm fusha e datës (si te web-i)
        // Hyrja 34: formatimi brenda Fusha-s, që kursori të kalojë pas vizës së shtuar (shiko kursoriPasFormatimit)
        Fusha(data, { data = it }, Modifier.fillMaxWidth(), "DD-MM-VV",
            tastiera = KeyboardType.Number, fokusi = fData, vetemLexim = vetemLexim, veprimi = ImeAction.Next,
            formato = { v, para -> if (v.length < para.length) v else Afatet.formatoDatenGjateShkrimit(v) })
        Afatet.lexoDatenEFushes(data)?.let { iso ->
            val d = Afatet.ditetDeri(iso)!!
            Text(when { d < -1 -> "Ka skaduar para " + Afatet.ditetParaTekst(-d) + "."; d == -1 -> "Skadoi dje."; d == 0 -> "Skadon sot."; d == 1 -> "Skadon nesër."; else -> "Skadon për " + Afatet.ditetTekst(d) + "." },
                style = tx(13, 500, n.ink3))
        }
        // Sasia
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(18.dp)).padding(start = 18.dp, end = 10.dp, top = 10.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Sasia", style = tx(15, 600, n.ink))
                Text("copë", style = tx(12, 400, n.muted))
            }
            if (!vetemLexim) Box(Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(n.surface2).clickable {
                val v = (Afatet.lexoSasine(sasia) as? Long) ?: 0L; sasia = maxOf(0L, v - 1).toString()
            }, contentAlignment = Alignment.Center) { Text("−", style = tx(22, 600, n.ink)) }
            Fusha(sasia, { sasia = it.take(30) }, Modifier.width(80.dp), "0", tastiera = KeyboardType.Number, vetemLexim = vetemLexim,
                stili = tx(22, 700).copy(textAlign = TextAlign.Center), paVije = true, sfondi = Color.Transparent)
            if (!vetemLexim) Box(Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(n.accent).clickable {
                val v = (Afatet.lexoSasine(sasia) as? Long) ?: 0L; sasia = (v + 1).toString()
            }, contentAlignment = Alignment.Center) { Text("+", style = tx(22, 600, Color.White)) }
        }
        if (kaM) ZgjedhjaEMarketit(mk, a == null, vetemLexim) { mk = it }
        if (!paFurnizues) {
            Fusha(furn, { furn = it; sugjerimet = true }, Modifier.fillMaxWidth(), "Furnizuesi (zgjidh ose shkruaj)", vetemLexim = vetemLexim,
                kurVeprim = { sugjerimet = false; ruaj() })
            if (sugjerimet && !vetemLexim) SugjerimetEFurnizuesit(furn, { furn = it; sugjerimet = false }) { sugjerimet = false }
        }
        if (!vetemLexim) Buton("Ruaj afatin", { ruaj() }, Modifier.fillMaxWidth().shadow(12.dp, RoundedCornerShape(14.dp), spotColor = n.accent), lartesia = 56.dp)
        if (a != null && Llogaria.leja("afatetFshi")) Buton("Fshi afatin", { fshi = true }, Modifier.fillMaxWidth(), lloji = "rrezik")
    }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(250)
        try { if (a == null && barkodiISkanuar.isEmpty()) fBarkodi.requestFocus() else if (a == null && emri.isEmpty()) fEmri.requestFocus() else if (a == null) fData.requestFocus() } catch (e: Exception) { }
    }
    if (fshi && id != null) Konfirmo("Të fshihet afati?", "Afati fshihet nga të gjitha pajisjet. Nëse produkti thjesht u hoq nga rafti, përdor \"U hoq nga rafti\" (mbetet si histori).",
        "Fshi", mbyll = { fshi = false }) { if (Llogaria.leja("afatetFshi")) { Dyqani.fshijAfatin(id); mbyll() } }
}

/** Hyrja 57: afatet që ka tashmë ky barkod (.af-ekzistuese te web-i), deri në 6 */
@Composable
private fun AfatetEkzistuese(lista: List<Obj>, kaM: Boolean, zgjidh: (Obj) -> Unit) {
    val n = N
    val f = RoundedCornerShape(16.dp)
    Column(Modifier.fillMaxWidth().clip(f).border(1.dp, n.line, f)) {
        Text(if (lista.size == 1) "Ky produkt ka 1 afat:" else "Ky produkt ka ${lista.size} afate:", style = tx(13, 700, n.muted),
            modifier = Modifier.padding(start = 14.dp, end = 14.dp, top = 10.dp, bottom = 6.dp))
        lista.take(6).forEach { e ->
            Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
            val st = Afatet.statusi(e)
            val d = Afatet.ditetDeri(e["data"])
            val info = listOf(Afatet.sasiaTekst(e), if (kaM && (e["m"] as? String).orEmpty().isNotEmpty()) Merchandiseri.emri(e["m"]) else "")
                .filter { it.isNotEmpty() }.joinToString(" · ")
            Row(Modifier.fillMaxWidth().clickable { zgjidh(e) }.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(if ((e["data"] as? String).orEmpty().isNotEmpty()) Afatet.formato(e["data"]) else "Pa datë", style = tx(15, 700, n.ink))
                Text(info, style = tx(13, 400, n.muted), modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (d != null) {
                    val (sf, ng) = when (st) { "skaduar" -> n.expTint to n.expInk; "afer" -> n.nearTint to n.nearInk; else -> n.surface2 to n.ink3 }
                    Text(when { d < 0 -> "Skaduar"; d == 0 -> "Sot"; d == 1 -> "Nesër"; else -> Afatet.ditetTekst(d) }, style = tx(12, 700, ng),
                        modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(sf).padding(horizontal = 8.dp, vertical = 3.dp))
                }
            }
        }
        if (lista.size > 6) {
            Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
            Text("+ ${lista.size - 6} të tjera te lista e afateve.", style = tx(12, 400, n.muted), modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp))
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
        Text("Me të njëjtën datë, copat i shtohen atij afati (s'krijohet rresht i ri).", style = tx(12, 400, n.muted),
            modifier = Modifier.padding(start = 14.dp, end = 14.dp, top = 8.dp, bottom = 10.dp))
    }
}

/** Sugjerimet e furnizuesit (v252): lista, "+ Furnizues i ri", "Mbyll" */
@Composable
fun SugjerimetEFurnizuesit(q0: String, zgjidh: (String) -> Unit, mbyll: () -> Unit) {
    val n = N
    val q = q0.replace(Regex("\\s+"), " ").trim(); val ql = q.lowercase()
    val te = Dyqani.furnizuesitPerSugjerim().filter { ql.isEmpty() || it.lowercase().contains(ql) }
    val sakte = te.any { it.lowercase() == ql }
    if (te.isEmpty() && q.isEmpty()) return
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(14.dp)).padding(6.dp)) {
        te.take(8).forEach { f -> Text(f, style = tx(15, 500, n.ink), modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable { zgjidh(f) }.padding(12.dp)) }
        if (q.isNotEmpty() && !sakte) Text("+ Furnizues i ri: \"$q\"", style = tx(15, 600, n.accentText), modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable { zgjidh(q) }.padding(12.dp))
        Text("Mbyll", style = tx(14, 500, n.muted), modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable(onClick = mbyll).padding(12.dp))
    }
}

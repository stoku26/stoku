package site.stoku.vendas.ui

import site.stoku.vendas.Eksportet
import site.stoku.vendas.Skedari
import kotlinx.coroutines.launch
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.draw.shadow
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.withStyle
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.zIndex
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import site.stoku.logjika.Afatet
import site.stoku.logjika.Bashkimi
import site.stoku.logjika.Obj
import site.stoku.logjika.jsString
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Opsionet
import site.stoku.vendas.StokuApp
import site.stoku.vendas.Sinkronizimi
import java.util.Calendar

/** Stoku: kryefaqja me folderat, ose lista e produkteve të një folderi */
@Composable
fun StokuEkrani(folderi: String?, hapFolderin: (String?) -> Unit, skano: ((String) -> Unit, (String) -> Boolean) -> Unit, skanoShpejt: (String) -> Unit) {
    // Produkti i zgjedhur te kërkimi i kryefaqes: hapet folderi dhe dritarja e produktit
    var produktiPerTuHapur by remember { mutableStateOf<String?>(null) }
    if (folderi == null) Kryefaqja(hapFolderin) { fid, b -> produktiPerTuHapur = b; hapFolderin(fid) }
    else FolderiEkrani(folderi, { hapFolderin(null) }, skano, skanoShpejt, produktiPerTuHapur) { produktiPerTuHapur = null }
}

fun numerMeHapesire(n: Long): String = n.toString().reversed().chunked(3).joinToString(" ").reversed()
fun sasiaE(p: Obj): Long = (p["sasia"] as? Number)?.toLong() ?: 0L

// ---------------- Kryefaqja ----------------
@Composable
private fun Kryefaqja(hapFolderin: (String?) -> Unit, hapProduktin: (String, String) -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val p by Llogaria.perdoruesi.collectAsState()
    val lejet by Llogaria.lejet.collectAsState()
    remember(lejet) { 0 } // rivizatohet kur ndryshojnë lejet
    var kerkimi by remember { mutableStateOf("") }
    var folderIRi by remember { mutableStateOf(false) }
    var perFshirje by remember { mutableStateOf<Obj?>(null) }
    var fletaStok by remember { mutableStateOf<android.net.Uri?>(null) } // importi i stokut nga një fletë (foto)
    var kuFletaStok by remember { mutableStateOf<android.net.Uri?>(null) } // "Ku do ta kontrollosh fletën?" (PC ose këtu)
    val (fotoStok, galeriaStok) = rememberFotoEFletes("stokuImporto") { if (mundDergoFletenNePc()) kuFletaStok = it else fletaStok = it }
    // Renditja e folderave me zvarritje (si te web-i: mbaje gishtin, pastaj lëvize; leja "Krijo dhe ndrysho folderat")
    val vendet = remember { mutableMapOf<String, Rect>() } // vendi i secilës kartë në ekran (pa zhvendosjen e zvarritjes)
    var zvarritet by remember { mutableStateOf<String?>(null) }
    var zhvendosja by remember { mutableStateOf(Offset.Zero) }
    var gishti by remember { mutableStateOf<Offset?>(null) }
    var mbaroiNe by remember { mutableStateOf(0L) }
    val dridhja = LocalHapticFeedback.current
    fun objektivi(): String? {
        val z = zvarritet ?: return null; val p = gishti ?: return null
        return vendet.entries.firstOrNull { it.key != z && it.value.contains(p) && g.foldera.any { f -> f["id"] == it.key } }?.key
    }
    fun perfundoZvarritjen(ruaj: Boolean) {
        val z = zvarritet; val t = objektivi()
        if (ruaj && z != null && t != null && Llogaria.leja("stokuFoldera")) {
            val ids = Dyqani.g.foldera.map { it["id"] as String }.toMutableList()
            val iZ = ids.indexOf(z); val iT = ids.indexOf(t)
            if (iZ >= 0 && iT >= 0) {
                ids.removeAt(iZ)
                val iT2 = ids.indexOf(t)
                ids.add(if (iT > iZ) iT2 + 1 else iT2, z) // si te web-i: më poshtë → pas objektivit, më lart → para tij
                Dyqani.renditFolderat(ids)
            }
        }
        zvarritet = null; gishti = null; zhvendosja = Offset.Zero
        mbaroiNe = System.currentTimeMillis()
    }
    fun zvarritja(id: String): Modifier = if (!Llogaria.leja("stokuFoldera")) Modifier else Modifier.pointerInput(id) {
        detectDragGesturesAfterLongPress(
            onDragStart = { o ->
                zvarritet = id; zhvendosja = Offset.Zero
                gishti = (vendet[id]?.topLeft ?: Offset.Zero) + o
                dridhja.performHapticFeedback(HapticFeedbackType.LongPress)
            },
            onDrag = { ndryshimi, d -> ndryshimi.consume(); zhvendosja += d; gishti = gishti?.plus(d) },
            onDragEnd = { perfundoZvarritjen(true) },
            onDragCancel = { perfundoZvarritjen(false) }
        )
    }
    fun kaFolder(): Boolean {
        if (g.foldera.isNotEmpty()) return true
        if (Llogaria.leja("stokuFoldera")) { Toast.trego("Krijo fillimisht një folder."); folderIRi = true } else Toast.trego("S'ka asnjë folder ku të importohet.", 4000)
        return false
    }

    val te = remember(g.produktet) { g.produktet.values.toList() }
    val nrNeFolder = remember(g.produktet) { g.produktet.values.groupingBy { it["kategoriaId"] }.eachCount() }
    val sot = Calendar.getInstance().apply { set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }.timeInMillis
    val zero = te.count { sasiaE(it) <= 0 }
    val sotN = te.count { ((it["prekurSe"] as? Number)?.toLong() ?: 0L) >= sot }
    val aktiviM by site.stoku.vendas.Merchandiseri.aktivi.collectAsState()
    val nAf = remember(g, aktiviM, lejet) { Afatet.numero(site.stoku.vendas.Merchandiseri.afatetEMarketit(g.afatet)) }
    val skaduara = nAf.skaduar + nAf.paDate

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                EtiketaStoku(p?.emri ?: if (Llogaria.eshteVizitor()) "Vizitor · provë" else "", { Sinkronizimi.rifresko(); Toast.trego("Duke sinkronizuar…", 1500) })
                Spacer(Modifier.weight(1f))
                if (Llogaria.leja("stoku") && Llogaria.leja("stokuImporto")) {
                    ButonIkone(Ik.Foto, "Importo stokun nga galeria", { if (kaFolder()) galeriaStok() })
                    Spacer(Modifier.width(10.dp))
                    ButonIkone(Ik.Kamera, "Importo stokun nga një fletë (foto)", { if (kaFolder()) fotoStok() })
                }
            }
            Hapesire(14.dp)
            // Prova si vizitor (si .viz-shirit te web-i)
            if (Llogaria.eshteVizitor()) {
                Row(Modifier.fillMaxWidth().padding(bottom = 12.dp).clip(RoundedCornerShape(14.dp)).background(n.accentTint).padding(start = 14.dp, end = 8.dp, top = 8.dp, bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(androidx.compose.ui.text.buildAnnotatedString {
                        withStyle(androidx.compose.ui.text.SpanStyle(fontWeight = androidx.compose.ui.text.font.FontWeight(700))) { append("Vizitor") }
                        append(" · provë pa llogari, me të dhëna shembull")
                    }, style = txF(13.5f, 400, n.accentText), modifier = Modifier.weight(1f))
                    Buton("Hyr", { Llogaria.hapHyrjenNgaProva() }, lartesia = 36.dp)
                }
            }
            if (Llogaria.leja("stoku")) Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), "Kërko produkt ose barkod", ikona = Ik.Kerko)
            Hapesire(18.dp)
            // "Je te: …" (vetëm merchandiseri me markete, ose pa asnjë: "Shto marketin ku punon")
            CipiIMarketit(Modifier.padding(bottom = 12.dp))
        }
        if (!Llogaria.leja("stoku")) return@LazyColumn
        val k = kerkimi.trim().lowercase()
        if (k.isNotEmpty()) {
            val fil = te.filter {
                (it["emri"] as? String).orEmpty().lowercase().contains(k) || jsString(it["barkodi"]).lowercase().contains(k) ||
                    (it["furnizuesi"] as? String).orEmpty().lowercase().contains(k)
            }.sortedWith(krahasuesi())
            if (fil.isEmpty()) item { Text("Nuk u gjet asnjë produkt në asnjë folder.", style = tx(14, 400, n.muted), modifier = Modifier.padding(vertical = 16.dp)) }
            items(fil.take(300), key = { "k:" + it["kategoriaId"] + "::" + it["barkodi"] }) { pr ->
                RreshtiIKerkimit(pr) { hapProduktin(pr["kategoriaId"] as String, pr["barkodi"] as String) }
            }
            return@LazyColumn
        }
        item {
            // Karta me numrat
            val erret = n.erret
            val sfondi = if (erret) n.hero else n.surface
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(sfondi).border(if (erret) 0.dp else 1.dp, if (erret) Color.Transparent else n.line, RoundedCornerShape(22.dp)).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Row(Modifier.fillMaxWidth()) {
                    Column(Modifier.weight(1f)) {
                        Text("Produkte gjithsej", style = tx(13, 400, if (erret) n.heroMuted else n.muted))
                        Text(numerMeHapesire(te.size.toLong()), style = tx(40, 700, if (erret) Color.White else n.ink, -0.03), modifier = Modifier.padding(top = 6.dp))
                    }
                    if (sotN > 0) Text("$sotN ndryshuar sot", style = tx(12, 400, if (erret) Color(0xFFD7D9DE) else n.ink3),
                        modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(if (erret) Color(0x1AFFFFFF) else n.surface2).padding(horizontal = 10.dp, vertical = 5.dp))
                }
                val numrat = mutableListOf(Triple(g.foldera.size.toLong(), "Folderat", false), Triple(zero.toLong(), "Sasi 0", zero > 0))
                if (Llogaria.leja("afatet")) numrat.add(Triple(skaduara.toLong(), "Të skaduara", skaduara > 0))
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(if (erret) Color(0x1AFFFFFF) else n.line), horizontalArrangement = Arrangement.spacedBy(1.dp)) {
                    numrat.forEach { (v, t, kuq) ->
                        Column(Modifier.weight(1f).background(if (erret) n.hero2 else n.head).padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(numerMeHapesire(v), style = tx(20, 700, if (kuq) n.exp else if (erret) Color.White else n.ink))
                            Text(t, style = tx(12, 400, if (erret) n.heroMuted else n.muted))
                        }
                    }
                }
            }
            Hapesire(22.dp)
            TitulliISeksionit("Folderat") { if (Llogaria.leja("stokuFoldera")) Lidhje("+ Folder i ri", { folderIRi = true }) }
            Hapesire(10.dp)
            if (g.foldera.isEmpty()) Text(if (Llogaria.leja("stokuFoldera")) "S'ka ende foldera. Krijo të parin me \"+ Folder i ri\"." else "S'ka ende foldera.",
                style = tx(14, 400, n.muted))
        }
        // Rrjeta e folderave (3 në rresht)
        val rreshtat = g.foldera.chunked(3)
        val objektiviTani = objektivi()
        items(rreshtat.size) { i ->
            val meZvarritjen = rreshtat[i].any { it["id"] == zvarritet }
            Row(Modifier.fillMaxWidth().zIndex(if (meZvarritjen) 1f else 0f).padding(bottom = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                rreshtat[i].forEach { f ->
                    val fid = f["id"] as String
                    val zv = zvarritet == fid
                    // Karta që del nga ekrani (skrollim) s'është më objektiv i zvarritjes
                    androidx.compose.runtime.DisposableEffect(fid) { onDispose { vendet.remove(fid) } }
                    KartaEFolderit(f, nrNeFolder[fid] ?: 0,
                        Modifier.weight(1f).onGloballyPositioned { vendet[fid] = it.boundsInRoot() }.then(zvarritja(fid))
                            .zIndex(if (zv) 1f else 0f)
                            .graphicsLayer {
                                if (zv) { translationX = zhvendosja.x; translationY = zhvendosja.y; scaleX = 1.04f; scaleY = 1.04f; shadowElevation = 12.dp.toPx(); shape = RoundedCornerShape(16.dp) }
                            },
                        { if (zvarritet == null && System.currentTimeMillis() - mbaroiNe > 350) hapFolderin(fid) },
                        if (Llogaria.leja("stokuFshi")) ({ perFshirje = f }) else null, objektiv = objektiviTani == fid)
                }
                repeat(3 - rreshtat[i].size) { Spacer(Modifier.weight(1f)) }
            }
        }
        val tefundit = te.filter { (it["prekurSe"] as? Number)?.toLong()?.let { t -> t > 0 } == true }
            .sortedByDescending { (it["prekurSe"] as Number).toLong() }.take(5)
        if (tefundit.isNotEmpty()) item {
            Hapesire(14.dp)
            TitulliISeksionit("Ndryshuar së fundi")
            Hapesire(10.dp)
            Karta(Modifier.fillMaxWidth()) {
                tefundit.forEachIndexed { i, pr ->
                    if (i > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
                    Row(Modifier.fillMaxWidth().clickable { hapFolderin(pr["kategoriaId"] as String) }.heightIn(min = 56.dp).padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            val em = (pr["emri"] as? String).orEmpty()
                            Text(em.ifEmpty { "Pa emër" }, style = tx(14, if (em.isEmpty()) 500 else 600, if (em.isEmpty()) n.faint else n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            val fe = Dyqani.emriFolderit(pr["kategoriaId"])
                            Text(jsString(pr["barkodi"]) + (if (fe.isNotEmpty()) "  ·  $fe" else ""), style = txMono(11f, n.faint), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        val s = sasiaE(pr)
                        Text(numerMeHapesire(s), style = tx(15, 700, if (s <= 0) n.exp else n.ink))
                    }
                }
            }
        }
    }

    if (folderIRi) FolderIRiFlete { folderIRi = false }
    kuFletaStok?.let { u -> KuFletaDritarja(u, stok = true, mbyll = { kuFletaStok = null }) { fletaStok = u } }
    fletaStok?.let { u -> FletaEkrani(u, mbyll = { fletaStok = null }, stok = true) }
    perFshirje?.let { f ->
        val brenda = Dyqani.produktetEFolderit(f["id"] as String).size
        val emri = jsString(f["emri"])
        Konfirmo("Të fshihet folderi?",
            if (brenda > 0) "Do të fshihet folderi \"$emri\" bashkë me $brenda ${if (brenda == 1) "produktin" else "produktet"} brenda tij.\n\nKy veprim NUK mund të kthehet."
            else "Do të fshihet folderi \"$emri\". Është bosh.",
            "Fshi", mbyll = { perFshirje = null }) { if (Llogaria.leja("stokuFshi")) Dyqani.fshijFolderin(f["id"] as String) }
    }
}

@Composable
private fun KartaEFolderit(f: Obj, nr: Int, modifier: Modifier, hap: () -> Unit, fshi: (() -> Unit)?, objektiv: Boolean = false) {
    val n = N
    val ik = Afatet.ikonaEFolderit(f)
    val ikonaV = remember(ik.id) { ikona(ik.d, trashesia = 2f) }
    // objektiv: folderi mbi të cilin është gishti gjatë zvarritjes (këtu do të vendoset)
    Box(modifier.heightIn(min = 108.dp).clip(RoundedCornerShape(16.dp)).background(if (objektiv) n.accentTint else n.surface)
        .border(if (objektiv) 2.dp else 1.dp, if (objektiv) n.accent else n.line, RoundedCornerShape(16.dp)).clickable(onClick = hap)) {
        Column(Modifier.padding(12.dp)) {
            IkonaMeNgjyre(ikonaV, ik.ngj)
            Spacer(Modifier.height(12.dp))
            Text(jsString(f["emri"]), style = tx(14, 600, n.ink), maxLines = 2, overflow = TextOverflow.Ellipsis)
            Text("$nr ${if (nr == 1) "produkt" else "produkte"}", style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 2.dp))
        }
        if (fshi != null) Box(Modifier.align(Alignment.TopEnd).padding(4.dp).size(32.dp).clip(CircleShape).clickable(onClick = fshi), contentAlignment = Alignment.Center) {
            Icon(Ik.X, "Fshi " + jsString(f["emri"]), Modifier.size(16.dp), tint = n.faint)
        }
    }
}

@Composable
private fun RreshtiIKerkimit(p: Obj, onClick: () -> Unit) {
    val n = N
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            val em = (p["emri"] as? String).orEmpty()
            Text(em.ifEmpty { "(pa emër)" }, style = tx(15, 600, if (em.isEmpty()) n.faint else n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(jsString(p["barkodi"]) + ((p["furnizuesi"] as? String)?.takeIf { it.isNotEmpty() }?.let { " · $it" } ?: ""),
                style = txMono(11.5f, n.faint), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(Modifier.clip(RoundedCornerShape(8.dp)).background(n.surface2).padding(horizontal = 8.dp, vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Ik.Folder, null, Modifier.size(13.dp), tint = n.ink3)
                Spacer(Modifier.width(4.dp))
                Text(Dyqani.emriFolderit(p["kategoriaId"]), style = tx(12, 500, n.ink3), maxLines = 1)
            }
            Text(jsString(p["sasia"]), style = tx(16, 700, if (sasiaE(p) <= 0) n.exp else n.ink))
        }
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
}

/** Renditja e produkteve (Cilësimet → Stoku): më të rejat, emri A–Z / Z–A, sasia */
fun rendi(): String = StokuApp.prefsOse("rendi", "i_ri")

fun krahasuesi(): Comparator<Obj> {
    val emriK = Comparator<Obj> { a, b ->
        val ea = (a["emri"] as? String).orEmpty(); val eb = (b["emri"] as? String).orEmpty()
        when {
            ea.isEmpty() && eb.isEmpty() -> jsString(a["barkodi"]).compareTo(jsString(b["barkodi"]))
            ea.isEmpty() -> 1
            eb.isEmpty() -> -1
            else -> Afatet.KOLATORI.compare(ea.lowercase(), eb.lowercase()).let { if (it != 0) it else jsString(a["barkodi"]).compareTo(jsString(b["barkodi"])) }
        }
    }
    return when (rendi()) {
        "sasiaUlet" -> Comparator { a, b -> sasiaE(a).compareTo(sasiaE(b)).let { if (it != 0) it else emriK.compare(a, b) } }
        "sasiaLart" -> Comparator { a, b -> sasiaE(b).compareTo(sasiaE(a)).let { if (it != 0) it else emriK.compare(a, b) } }
        "emriZA" -> Comparator { a, b ->
            val ea = (a["emri"] as? String).orEmpty(); val eb = (b["emri"] as? String).orEmpty()
            if (ea.isEmpty() != eb.isEmpty()) (if (ea.isNotEmpty()) -1 else 1) else -emriK.compare(a, b)
        }
        "emri" -> emriK
        else -> Comparator { a, b ->
            val ta = (a["prekurSe"] as? Number)?.toLong() ?: 0L; val tb = (b["prekurSe"] as? Number)?.toLong() ?: 0L
            tb.compareTo(ta).let { if (it != 0) it else emriK.compare(a, b) }
        }
    }
}

// ---------------- Folderi ----------------
@Composable
private fun FolderiEkrani(id: String, mbrapa: () -> Unit, skano: ((String) -> Unit, (String) -> Boolean) -> Unit, skanoShpejt: (String) -> Unit,
                          produktiFillimisht: String?, uHap: () -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    var barkodi by remember { mutableStateOf("") }
    var kerkimi by remember { mutableStateOf("") }
    var kerkoHapur by remember { mutableStateOf(false) } // v269: fusha "Kërko" del kur prek 🔍 (ose kur ka tekst)
    var hapur by remember { mutableStateOf(produktiFillimisht) }
    var burimi by remember { mutableStateOf("fushe") }
    androidx.compose.runtime.LaunchedEffect(Unit) { uHap() }
    var fshiKrejt by remember { mutableStateOf(false) }
    var skedari by remember { mutableStateOf<Skedari?>(null) } // Excel/PDF i gatshëm: "Dërgo në PC", "Ruaje në telefon", "Ndaje"
    var pdfPune by remember { mutableStateOf(false) }
    val scope = rememberFusha()
    val fBarkodi = remember { FocusRequester() }
    val fKerko = remember { FocusRequester() }
    if (g.foldera.none { it["id"] == id }) { androidx.compose.runtime.LaunchedEffect(id) { mbrapa() }; return }

    // Renditja (me Collator) vetëm kur ndryshojnë produktet, jo me çdo shkronjë të shkruar te barkodi
    val te = remember(g.produktet, id) { g.produktet.values.filter { it["kategoriaId"] == id }.sortedWith(krahasuesi()) }
    val k = kerkimi.trim().lowercase()
    val fil = remember(te, k) {
        if (k.isEmpty()) te else te.filter {
            (it["emri"] as? String).orEmpty().lowercase().contains(k) || jsString(it["barkodi"]).lowercase().contains(k) ||
                (it["furnizuesi"] as? String).orEmpty().lowercase().contains(k)
        }
    }
    val lejaShpejt = Llogaria.leja("stokuPlusMinus")
    val pda by Opsionet.pda.collectAsState()
    val paTastiere by Opsionet.paTastiere.collectAsState()
    val kursori by Opsionet.kursori.collectAsState()
    // PDA: kursori te barkodi që në hapje; pas produktit kthehet te barkodi (PDA, ose skaneri i jashtëm kur barkodi erdhi nga fusha)
    var hapurNjeHere by remember { mutableStateOf(false) }
    androidx.compose.runtime.LaunchedEffect(hapur) {
        if (hapur != null) { hapurNjeHere = true; return@LaunchedEffect }
        val kthe = pda || (hapurNjeHere && burimi == "fushe" && kursori)
        if (kthe) { kotlinx.coroutines.delay(200); try { fBarkodi.requestFocus() } catch (e: Exception) { } }
    }

    // Kamera: produkti që ekziston në këtë folder merr +1 sa herë shihet, pa u mbyllur kamera (si te web-i, me lejet
    // "Ndrysho stokun" dhe "Butonat +/-"); barkodi i ri hap dritaren e produktit
    fun shtoNjeCope(b: String): Boolean {
        if (!Llogaria.leja("stokuNdrysho") || !Llogaria.leja("stokuPlusMinus")) return false
        val p = Dyqani.produkti(id, b) ?: return false
        Dyqani.vendosSasine(Bashkimi.celesi(id, b), sasiaE(p) + 1)
        return true
    }

    fun hapBarkodin(b0: String, nga: String) {
        val b = b0.trim()
        if (b.isEmpty()) return
        // v266: nga kamera vjen edhe Data Matrix / PDF417 (tekst i gjatë): kontrolli i tekstit vetëm për fushën; "::" (ndarësi i çelësit) kurrë
        if (if (nga == "kamera") b.contains("::") else duketSiDiçkaTjeter(b)) { Toast.trego("Kjo nuk duket si barkod produkti (ngjan me kod QR ose tekst). Provo përsëri."); return }
        val e = Dyqani.produkti(id, b)
        if (!Llogaria.leja(if (e != null) "stokuNdrysho" else "stokuShto")) {
            if (e != null) kerkimi = b else Toast.trego("Ky barkod s'është në këtë folder.", 3000)
            return
        }
        burimi = nga
        hapur = b
    }

    // v268 (ideja 5 e përdoruesit, si #skanFab te web-i): butoni lundrues poshtë djathtas, gjysmë blu / gjysmë i verdhë, vetëm ikona;
    // eksporti si ikona pranë titullit
    val lejaKamera = Llogaria.leja("kamera") && !pda
    val lejaShpejtSkanim = lejaKamera && Llogaria.leja("skanimShpejt") && (Llogaria.leja("stokuShto") || Llogaria.leja("stokuNdrysho"))
    fun eksportoPdf() {
        if (pdfPune) { Toast.trego("PDF-ja po krijohet…"); return }
        if (Dyqani.produktetEFolderit(id).isEmpty()) { Toast.trego("Nuk ka produkte për eksport në këtë folder."); return }
        pdfPune = true
        scope.launch {
            val sk = try { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) { Eksportet.pdfEtiketa(id) } } catch (e: Exception) { null }
            pdfPune = false
            if (sk == null) Toast.trego("PDF-ja nuk u krijua. Provo përsëri.") else skedari = sk
        }
    }

    Box(Modifier.fillMaxSize()) {
    Column(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = if (lejaKamera) 104.dp else 16.dp)) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ButonIkone(Ik.Mbrapa, "Foldera", mbrapa, madhesia = 42.dp)
                    Spacer(Modifier.width(14.dp))
                    // v269: vetëm emri i folderit (përdoruesi: "mos ta cekin sa produkte jan po veq emrin e folderit")
                    Text(Dyqani.emriFolderit(id), style = tx(22, 700, n.ink, -0.02),
                        maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                    if (Llogaria.leja("eksportExcel")) {
                        Spacer(Modifier.width(8.dp))
                        ButonIkone(Ik.Excel, "Eksporto Excel", {
                            val sk = Eksportet.excelIFolderit(id)
                            if (sk == null) Toast.trego("Nuk ka produkte për eksport në këtë folder.") else skedari = sk
                        }, madhesia = 42.dp, ngjyra = if (n.bg.luminance() < 0.5f) Color(0xFF4CC783) else Color(0xFF1E7F45))
                    }
                    if (Llogaria.leja("eksportPdf")) {
                        Spacer(Modifier.width(8.dp))
                        ButonIkone(Ik.Pdf, if (pdfPune) "Duke krijuar PDF-në" else "Eksporto PDF", { eksportoPdf() }, madhesia = 42.dp,
                            ngjyra = if (pdfPune) n.disabled else if (n.bg.luminance() < 0.5f) Color(0xFFFF7A7A) else Color(0xFFC23030))
                    }
                }
                Hapesire(14.dp)
                // v269 (opsioni 3 i përdoruesit): barkodi + butoni 🔍 50 × 50; "Kërko" del vetëm kur e prek (ose kur ka tekst)
                val kerkoDuket = kerkoHapur || kerkimi.isNotEmpty()
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Fusha(barkodi, { barkodi = it }, Modifier.weight(1f), "Barkodi", ikona = Ik.Barkod, fokusi = fBarkodi,
                        veprimi = ImeAction.Go, kurVeprim = { val b = barkodi; barkodi = ""; hapBarkodin(b, "fushe") })
                    Spacer(Modifier.width(10.dp))
                    Box(Modifier.size(50.dp).clip(RoundedCornerShape(14.dp)).background(if (kerkoDuket) n.accentTint else n.surface)
                        .border(1.dp, if (kerkoDuket) n.accentLine else n.line, RoundedCornerShape(14.dp))
                        .clickable {
                            if (kerkoDuket) { kerkoHapur = false; kerkimi = ""; try { fBarkodi.requestFocus() } catch (e: Exception) { } } else kerkoHapur = true
                        }, contentAlignment = Alignment.Center) {
                        Icon(Ik.Kerko, "Kërko", Modifier.size(21.dp), tint = if (kerkoDuket) n.accentText else n.ink)
                    }
                }
                Hapesire(10.dp)
                // PDA: tastiera në ekran fshihet/shfaqet me një prekje (si #btnTastiera te web-i); kursori mbetet te barkodi
                if (pda) {
                    Buton(if (paTastiere) "Shfaq tastierën" else "Fshih tastierën", {
                        Opsionet.vendosPaTastiere(!paTastiere)
                        Toast.trego(if (!paTastiere) "Tastiera në ekran s'del më. Shkruaj me tastierën e PDA-së." else "Tastiera në ekran del përsëri.")
                        try { fBarkodi.requestFocus() } catch (e: Exception) { }
                    }, Modifier.fillMaxWidth(), lloji = "dyte", ikona = Ik.Tastiera)
                    Hapesire(10.dp)
                }
                if (kerkoDuket) {
                    Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), "Kërko", ikona = Ik.Kerko, fokusi = fKerko)
                    androidx.compose.runtime.LaunchedEffect(kerkoHapur) { if (kerkoHapur) try { fKerko.requestFocus() } catch (e: Exception) { } }
                    Hapesire(10.dp)
                }
                // v268 (opsioni 1 i përdoruesit): "Produktet" + "Fshi të gjitha" e kuqe mbi listë (si "+ Folder i ri"); shiriti poshtë u hoq
                TitulliISeksionit("Produktet") {
                    if (Llogaria.leja("stokuFshi")) {
                        val ng = if (te.isEmpty()) n.disabled else n.exp
                        Row(Modifier.clip(RoundedCornerShape(6.dp)).clickable(enabled = te.isNotEmpty()) { fshiKrejt = true }.padding(vertical = 6.dp, horizontal = 2.dp),
                            verticalAlignment = Alignment.CenterVertically) {
                            Icon(Ik.Kosh, "Fshi të gjitha produktet", Modifier.size(16.dp), tint = ng)
                            Spacer(Modifier.width(6.dp))
                            Text("Fshi të gjitha", style = tx(13, 600, ng))
                        }
                    }
                }
                Hapesire(4.dp)
                if (fil.isEmpty() && k.isNotEmpty()) Text("Nuk u gjet asnjë produkt.", style = tx(14, 400, n.muted), modifier = Modifier.padding(vertical = 12.dp))
            }
            items(fil.take(300), key = { "p:" + it["barkodi"] }) { p ->
                RreshtiIProduktit(p, lejaShpejt, Llogaria.leja("stokuNdrysho")) { burimi = "lista"; hapur = p["barkodi"] as String }
            }
            if (fil.size > 300) item {
                Text("Shfaqen 300 nga ${fil.size} produkte. Përdor kërkimin për të gjetur të tjerët.", style = tx(13, 400, n.muted), modifier = Modifier.padding(vertical = 12.dp))
            }
        }
    }
    if (lejaKamera) ButoniLundrues(Modifier.align(Alignment.BottomEnd).padding(end = 20.dp, bottom = 20.dp),
        skano = { skano({ b -> hapBarkodin(b, "kamera") }) { b -> shtoNjeCope(b) } }, shpejt = if (lejaShpejtSkanim) ({ skanoShpejt(id) }) else null)
    }

    hapur?.let { b -> ProduktiFlete(id, b, burimi) { hapur = null } }
    skedari?.let { sk -> SkedariFlete(sk) { skedari = null } }
    if (fshiKrejt) {
        val emri = Dyqani.emriFolderit(id)
        Konfirmo("Të fshihen të gjitha?",
            if (te.size == 1) "Do të fshihet 1 produkt nga folderi \"$emri\". Ky veprim NUK mund të kthehet."
            else "Do të fshihen të gjitha ${te.size} produktet nga folderi \"$emri\". Ky veprim NUK mund të kthehet.",
            "Fshi të gjitha", vonesa = 5, mbyll = { fshiKrejt = false }) {
            if (Llogaria.leja("stokuFshi")) { Dyqani.fshiTeGjithaNeFolder(id); Toast.trego("U fshinë të gjitha produktet nga folderi.") }
        }
    }
}

/** Barkodet e produkteve janë pothuajse gjithmonë vetëm numra (6-14 shifra) */
fun duketSiDiçkaTjeter(t: String): Boolean {
    if (Regex("^[0-9]{6,14}$").matches(t)) return false
    if (t.length > 30 || t.contains("::")) return true
    if (Regex("^https?://", RegexOption.IGNORE_CASE).containsMatchIn(t)) return true
    if (Regex("\\s").containsMatchIn(t)) return true
    return false
}

@Composable
private fun RreshtiIProduktit(p: Obj, lejaShpejt: Boolean, lejaNdrysho: Boolean, hap: () -> Unit) {
    val n = N
    val celesi = Bashkimi.celesi(p["kategoriaId"], p["barkodi"])
    val s = sasiaE(p)
    Row(Modifier.fillMaxWidth().clickable(enabled = lejaNdrysho, onClick = hap).padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            val em = (p["emri"] as? String).orEmpty()
            Text(em.ifEmpty { "(pa emër)" }, style = tx(15, 600, if (em.isEmpty()) n.faint else n.ink), maxLines = 2, overflow = TextOverflow.Ellipsis)
            Text(jsString(p["barkodi"]) + ((p["furnizuesi"] as? String)?.takeIf { it.isNotEmpty() }?.let { " · $it" } ?: ""),
                style = txMono(11.5f, n.faint), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        if (lejaShpejt) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ButonSasie("−") { Dyqani.vendosSasine(celesi, maxOf(0L, s - 1)) }
                SasiaEDrejtperdrejte(s) { v -> Dyqani.vendosSasine(celesi, v) }
                ButonSasie("+") { Dyqani.vendosSasine(celesi, s + 1) }
            }
        } else Text(s.toString(), style = tx(17, 700, if (s <= 0) n.exp else n.ink))
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
}

@Composable
private fun ButonSasie(t: String, onClick: () -> Unit) {
    val n = N
    Box(Modifier.size(30.dp).clip(CircleShape).background(n.surface).border(1.dp, n.line, CircleShape).clickable(onClick = onClick), contentAlignment = Alignment.Center) {
        Text(t, style = tx(16, 500, n.ink))
    }
}

@Composable
private fun SasiaEDrejtperdrejte(s: Long, vendos: (Long) -> Unit) {
    val n = N
    val fokusi = LocalFocusManager.current
    val scope = rememberFusha()
    var t by remember(s) { mutableStateOf(TextFieldValue(s.toString())) }
    var neFokus by remember { mutableStateOf(false) }
    // v270 (si "change" te web-i): numri ruhet edhe kur prek diku tjetër, jo vetëm me "Done" (më parë humbte pa u ruajtur)
    fun ruajNumrin() {
        val tx = t.text; val v = tx.toLongOrNull()
        if (v != null && !Afatet.sasiaEPranueshme(tx)) { Toast.trego(Afatet.SASIA_E_MADHE, 4500); t = TextFieldValue(s.toString()) }
        else if (v != null && v != s) vendos(v) else t = TextFieldValue(s.toString())
    }
    BasicTextField(
        value = t, onValueChange = { v -> t = v.copy(text = v.text.filter { c -> c.isDigit() }.take(7)) }, singleLine = true,
        textStyle = tx(20, 700, if (s <= 0) n.exp else n.ink).copy(textAlign = TextAlign.Center),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = { fokusi.clearFocus() }),
        cursorBrush = SolidColor(n.accent),
        modifier = Modifier.size(68.dp, 50.dp).clip(RoundedCornerShape(14.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(14.dp))
            .onFocusChanged { f ->
                // Në prekje zgjidhet krejt numri (si te web-i), që shkrimi i ri ta zëvendësojë
                if (f.isFocused && !neFokus) scope.launch { kotlinx.coroutines.delay(40); t = t.copy(selection = TextRange(0, t.text.length)) }
                if (!f.isFocused && neFokus) ruajNumrin()
                neFokus = f.isFocused
            }.padding(top = 12.dp)
    )
}

// ---------------- Dritarja e produktit ----------------
@Composable
fun ProduktiFlete(folderId: String, barkodi: String, burimi: String, mbyll: () -> Unit) {
    val n = N
    val e = remember(folderId, barkodi) { Dyqani.produkti(folderId, barkodi) }
    var emri by remember { mutableStateOf((e?.get("emri") as? String) ?: Dyqani.emriNgaBarkodi(barkodi)) }
    var furn by remember { mutableStateOf((e?.get("furnizuesi") as? String) ?: if (e == null) Dyqani.furnizuesiNgaBarkodi(barkodi) else "") }
    var sasia by remember { mutableStateOf("") }
    var zhvendos by remember { mutableStateOf(false) }
    var fshi by remember { mutableStateOf(false) }
    val paFurnizues = Llogaria.eshteMerchandiser()
    val fSasia = remember { FocusRequester() }
    // "Pa emër": produktet e reja regjistrohen pa emër dhe fusha e emrit fshihet (atyre që kanë emër s'u fshihet)
    val paEmer = Opsionet.paEmer.collectAsState().value && e == null

    fun ruaj() {
        if (Dyqani.g.foldera.none { it["id"] == folderId }) { mbyll(); Toast.trego("Folderi u fshi nga një pajisje tjetër. Produkti s'u ruajt.", 4500); return }
        val ekz = Dyqani.produkti(folderId, barkodi)
        if (!Llogaria.leja(if (ekz != null) "stokuNdrysho" else "stokuShto")) { mbyll(); return }
        val em = if (paEmer) "" else emri.trim()
        if (em.isEmpty() && !paEmer) { Toast.trego("Shkruaj emrin e produktit."); return }
        val ts = sasia.trim()
        if (!Regex("^-?\\d+$").matches(ts)) { Toast.trego("Shkruaj sasinë (numër i plotë)."); fSasia.requestFocus(); return }
        if (!Afatet.sasiaEPranueshme(ts)) { Toast.trego(Afatet.SASIA_E_MADHE, 4500); return }
        val f = if (paFurnizues) null else furn.replace(Regex("\\s+"), " ").trim().take(80)
        Dyqani.ruajProduktin(folderId, barkodi, em, ts.toLong(), f)
        if (!paEmer) site.stoku.vendas.Regjistri.mesoNgaPerdoruesi(barkodi, em, f ?: "") // si te web-i
        mbyll()
    }

    Flete(mbyll) {
        Text(if (e != null) "Produkti ekziston (tani: ${sasiaE(e)})" else "Produkt i ri", style = tx(22, 700, n.ink, -0.02))
        Text("Barkodi: $barkodi", style = tx(15, 400, n.ink2))
        if (!paEmer) Fusha(emri, { emri = it }, Modifier.fillMaxWidth(), "Emri", veprimi = ImeAction.Next)
        if (!paFurnizues) Fusha(furn, { furn = it }, Modifier.fillMaxWidth(), "Furnizuesi (opsional)", veprimi = ImeAction.Next)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            KatrorSasie("−") { val v = sasia.trim().toLongOrNull() ?: 0L; sasia = (v - 1).toString() }
            Fusha(sasia, { sasia = it.filter { c -> c.isDigit() || c == '-' }.take(8) }, Modifier.weight(1f), "Sasia", tastiera = KeyboardType.Number,
                fokusi = fSasia, kurVeprim = { ruaj() }, stili = tx(18, 500).copy(textAlign = TextAlign.Center))
            KatrorSasie("+") { val v = sasia.trim().toLongOrNull() ?: 0L; sasia = (v + 1).toString() }
        }
        if (e != null && Llogaria.leja("stokuNdrysho")) Lidhje("Zhvendos në folder tjetër ›", { zhvendos = true }, madhesia = 15)
        Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
            if (e != null && Llogaria.leja("stokuFshi")) Buton("Fshi", { fshi = true }, lloji = "rrezik")
            Buton("Anulo", mbyll, lloji = "tekst")
            Buton("Ruaj", { ruaj() }, lloji = "tekst")
        }
    }
    androidx.compose.runtime.LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(250)
        try { if (e != null || paEmer || emri.isNotEmpty()) fSasia.requestFocus() } catch (x: Exception) { }
    }
    if (zhvendos) ZhvendosFlete(folderId, barkodi, { zhvendos = false }) { mbyll() }
    if (fshi) Konfirmo("Të fshihet produkti?", "\"" + (emri.ifEmpty { barkodi }) + "\" fshihet nga ky folder.", "Fshi", mbyll = { fshi = false }) {
        if (Llogaria.leja("stokuFshi")) { Dyqani.fshijProduktin(Bashkimi.celesi(folderId, barkodi)); mbyll() }
    }
}

@Composable
private fun KatrorSasie(t: String, onClick: () -> Unit) {
    val n = N
    Box(Modifier.size(44.dp, 50.dp).clip(RoundedCornerShape(12.dp)).background(n.surface2).clickable(onClick = onClick), contentAlignment = Alignment.Center) {
        Text(t, style = tx(22, 600, n.ink))
    }
}

@Composable
private fun ZhvendosFlete(folderId: String, barkodi: String, mbyll: () -> Unit, pasZhvendosjes: () -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    val p = Dyqani.produkti(folderId, barkodi)
    val teTjerat = g.foldera.filter { it["id"] != folderId }
    Flete(mbyll) {
        Text("Zhvendos produktin", style = tx(22, 700, n.ink, -0.02))
        Text("Zgjidh folderin ku do të zhvendoset \"" + ((p?.get("emri") as? String)?.ifEmpty { barkodi } ?: barkodi) + "\".", style = tx(15, 400, n.ink2))
        if (teTjerat.isEmpty()) Text("Nuk ka asnjë folder tjetër ku ta zhvendosësh.", style = tx(14, 400, n.muted))
        Karta(Modifier.fillMaxWidth()) {
            teTjerat.forEachIndexed { i, f ->
                if (i > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
                Row(Modifier.fillMaxWidth().clickable {
                    if (!Llogaria.leja("stokuNdrysho")) return@clickable
                    val r = Dyqani.zhvendosProduktin(folderId, barkodi, f["id"] as String)
                    mbyll(); pasZhvendosjes()
                    if (r != null) Toast.trego(if (r.first) "U zhvendos te \"${jsString(f["emri"])}\". Aty ekzistonte tashmë, ndaj sasitë u bashkuan (tani: ${r.second})."
                        else "U zhvendos te \"${jsString(f["emri"])}\".", 4000)
                }.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(jsString(f["emri"]), style = tx(15, 500, n.ink), modifier = Modifier.weight(1f))
                    Text("›", style = tx(18, 400, n.faint))
                }
            }
        }
        Buton("Anulo", mbyll, Modifier.fillMaxWidth(), lloji = "dyte")
    }
}

// ---------------- Folder i ri ----------------
@Composable
fun FolderIRiFlete(mbyll: () -> Unit) {
    val n = N
    var emri by remember { mutableStateOf("") }
    var ikonaZgjedhur by remember { mutableStateOf<String?>(null) }
    val sugjeruar = Afatet.ikonaEFolderit(mapOf("emri" to emri)).id
    val zgjedhur = ikonaZgjedhur ?: sugjeruar
    fun krijo() {
        if (!Llogaria.leja("stokuFoldera")) { mbyll(); return }
        if (emri.trim().isEmpty()) { Toast.trego("Shkruaj emrin e folderit."); return }
        Dyqani.krijoFolderin(emri, zgjedhur)
        mbyll()
    }
    Flete(mbyll) {
        Text("Folder i ri", style = tx(22, 700, n.ink, -0.02))
        Fusha(emri, { emri = it }, Modifier.fillMaxWidth(), "Emri", kurVeprim = { krijo() })
        Text("Ikona", style = tx(13, 600, n.ink3))
        Afatet.IKONAT_FOLDERAVE.chunked(6).forEach { rr ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rr.forEach { ik ->
                    val (sf, ng) = n.ikonat[ik.ngj] ?: n.ikonat["gri"]!!
                    val v = remember(ik.id) { ikona(ik.d) }
                    val zg = zgjedhur == ik.id
                    Box(Modifier.weight(1f).height(44.dp).clip(RoundedCornerShape(12.dp)).background(sf)
                        .border(if (zg) 2.5.dp else 0.dp, if (zg) n.accent else Color.Transparent, RoundedCornerShape(12.dp))
                        .clickable { ikonaZgjedhur = ik.id }, contentAlignment = Alignment.Center) {
                        Icon(v, ik.emri, Modifier.size(22.dp), tint = ng)
                    }
                }
                repeat(6 - rr.size) { Spacer(Modifier.weight(1f)) }
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Buton("Anulo", mbyll, Modifier.weight(1f), lloji = "dyte")
            Buton("Krijo", { krijo() }, Modifier.weight(1f))
        }
    }
}

/** v268 (ideja 5 e përdoruesit, si #skanFab te web-i): gjysma blu "Skano me kamerë", gjysma e verdhë "Skanim i shpejtë", vetëm ikona */
@Composable
private fun ButoniLundrues(modifier: Modifier, skano: () -> Unit, shpejt: (() -> Unit)?) {
    val n = N
    val forma = RoundedCornerShape(34.dp)
    Row(modifier.height(68.dp).shadow(12.dp, forma).clip(forma)) {
        Box(Modifier.width(if (shpejt != null) 76.dp else 68.dp).fillMaxHeight().background(n.accent).clickable(onClick = skano)
            .padding(start = if (shpejt != null) 6.dp else 0.dp), contentAlignment = Alignment.Center) {
            Icon(Ik.Skano, "Skano me kamerë", Modifier.size(30.dp), tint = Color.White)
        }
        if (shpejt != null) {
            Box(Modifier.width(2.dp).fillMaxHeight().background(n.bg))
            Box(Modifier.width(76.dp).fillMaxHeight().background(Color(0xFFE8A92E)).clickable(onClick = shpejt).padding(end = 6.dp), contentAlignment = Alignment.Center) {
                Icon(Ik.Rrufe, "Skanim i shpejtë", Modifier.size(30.dp), tint = Color(0xFF2B2100))
            }
        }
    }
}

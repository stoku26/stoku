package site.stoku.vendas.ui

import androidx.compose.foundation.background
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
import androidx.compose.ui.focus.FocusRequester
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
import site.stoku.vendas.StokuApp
import site.stoku.vendas.Sinkronizimi
import java.util.Calendar

/** Stoku: kryefaqja me folderat, ose lista e produkteve të një folderi */
@Composable
fun StokuEkrani(folderi: String?, hapFolderin: (String?) -> Unit, skano: ((String) -> Unit) -> Unit) {
    // Produkti i zgjedhur te kërkimi i kryefaqes: hapet folderi dhe dritarja e produktit
    var produktiPerTuHapur by remember { mutableStateOf<String?>(null) }
    if (folderi == null) Kryefaqja(hapFolderin) { fid, b -> produktiPerTuHapur = b; hapFolderin(fid) }
    else FolderiEkrani(folderi, { hapFolderin(null) }, skano, produktiPerTuHapur) { produktiPerTuHapur = null }
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
    val (fotoStok, galeriaStok) = rememberFotoEFletes("stokuImporto") { fletaStok = it }
    fun kaFolder(): Boolean {
        if (g.foldera.isNotEmpty()) return true
        if (Llogaria.leja("stokuFoldera")) { Toast.trego("Krijo fillimisht një folder."); folderIRi = true } else Toast.trego("S'ka asnjë folder ku të importohet.", 4000)
        return false
    }

    val te = g.produktet.values.toList()
    val sot = Calendar.getInstance().apply { set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }.timeInMillis
    val zero = te.count { sasiaE(it) <= 0 }
    val sotN = te.count { ((it["prekurSe"] as? Number)?.toLong() ?: 0L) >= sot }
    val nAf = Afatet.numero(g.afatet)
    val skaduara = nAf.skaduar + nAf.paDate

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                EtiketaStoku(p?.emri ?: "", { Sinkronizimi.rifresko(); Toast.trego("Duke sinkronizuar…", 1500) })
                Spacer(Modifier.weight(1f))
                if (Llogaria.leja("stoku") && Llogaria.leja("stokuImporto")) {
                    ButonIkone(Ik.Foto, "Importo stokun nga galeria", { if (kaFolder()) galeriaStok() })
                    Spacer(Modifier.width(10.dp))
                    ButonIkone(Ik.Kamera, "Importo stokun nga një fletë (foto)", { if (kaFolder()) fotoStok() })
                }
            }
            Hapesire(14.dp)
            if (Llogaria.leja("stoku")) Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), "Kërko produkt ose barkod", ikona = Ik.Kerko)
            Hapesire(18.dp)
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
        items(rreshtat.size) { i ->
            Row(Modifier.fillMaxWidth().padding(bottom = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                rreshtat[i].forEach { f ->
                    KartaEFolderit(f, g.produktet.values.count { it["kategoriaId"] == f["id"] }, Modifier.weight(1f),
                        { hapFolderin(f["id"] as String) }, if (Llogaria.leja("stokuFshi")) ({ perFshirje = f }) else null)
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
private fun KartaEFolderit(f: Obj, nr: Int, modifier: Modifier, hap: () -> Unit, fshi: (() -> Unit)?) {
    val n = N
    val ik = Afatet.ikonaEFolderit(f)
    val ikonaV = remember(ik.id) { ikona(ik.d, trashesia = 2f) }
    Box(modifier.heightIn(min = 108.dp).clip(RoundedCornerShape(16.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(16.dp)).clickable(onClick = hap)) {
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
private fun FolderiEkrani(id: String, mbrapa: () -> Unit, skano: ((String) -> Unit) -> Unit, produktiFillimisht: String?, uHap: () -> Unit) {
    val n = N
    val g by Dyqani.gjendja.collectAsState()
    var barkodi by remember { mutableStateOf("") }
    var kerkimi by remember { mutableStateOf("") }
    var hapur by remember { mutableStateOf(produktiFillimisht) }
    var burimi by remember { mutableStateOf("fushe") }
    androidx.compose.runtime.LaunchedEffect(Unit) { uHap() }
    var fshiKrejt by remember { mutableStateOf(false) }
    val fBarkodi = remember { FocusRequester() }
    if (g.foldera.none { it["id"] == id }) { androidx.compose.runtime.LaunchedEffect(id) { mbrapa() }; return }

    val te = g.produktet.values.filter { it["kategoriaId"] == id }.sortedWith(krahasuesi())
    val k = kerkimi.trim().lowercase()
    val fil = if (k.isEmpty()) te else te.filter {
        (it["emri"] as? String).orEmpty().lowercase().contains(k) || jsString(it["barkodi"]).lowercase().contains(k) ||
            (it["furnizuesi"] as? String).orEmpty().lowercase().contains(k)
    }
    val lejaShpejt = Llogaria.leja("stokuPlusMinus")

    fun hapBarkodin(b0: String, nga: String) {
        val b = b0.trim()
        if (b.isEmpty()) return
        if (duketSiDiçkaTjeter(b)) { Toast.trego("Kjo duket si kod QR ose tekst, jo si barkod produkti."); return }
        val e = Dyqani.produkti(id, b)
        if (!Llogaria.leja(if (e != null) "stokuNdrysho" else "stokuShto")) {
            if (e != null) kerkimi = b else Toast.trego("Ky barkod s'është në këtë folder.", 3000)
            return
        }
        burimi = nga
        hapur = b
    }

    Column(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 16.dp)) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ButonIkone(Ik.Mbrapa, "Foldera", mbrapa, madhesia = 42.dp)
                    Spacer(Modifier.width(14.dp))
                    Text(Dyqani.emriFolderit(id) + " (" + te.size + " " + (if (te.size == 1) "produkt" else "produkte") + ")", style = tx(22, 700, n.ink, -0.02),
                        maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                Hapesire(14.dp)
                Fusha(barkodi, { barkodi = it }, Modifier.fillMaxWidth(), "Barkodi", ikona = Ik.Barkod, fokusi = fBarkodi,
                    veprimi = ImeAction.Go, kurVeprim = { val b = barkodi; barkodi = ""; hapBarkodin(b, "fushe") })
                Hapesire(10.dp)
                if (Llogaria.leja("kamera")) {
                    Buton("Skano me kamerë", { skano { b -> hapBarkodin(b, "kamera") } }, Modifier.fillMaxWidth(), ikona = Ik.Skano)
                    Hapesire(10.dp)
                }
                Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), "Kërko", ikona = Ik.Kerko)
                Hapesire(10.dp)
                if (fil.isEmpty() && k.isNotEmpty()) Text("Nuk u gjet asnjë produkt.", style = tx(14, 400, n.muted), modifier = Modifier.padding(vertical = 12.dp))
            }
            items(fil.take(300), key = { "p:" + it["barkodi"] }) { p ->
                RreshtiIProduktit(p, lejaShpejt, Llogaria.leja("stokuNdrysho")) { burimi = "lista"; hapur = p["barkodi"] as String }
            }
            if (fil.size > 300) item {
                Text("Shfaqen 300 nga ${fil.size} produkte. Përdor kërkimin për të gjetur të tjerët.", style = tx(13, 400, n.muted), modifier = Modifier.padding(vertical = 12.dp))
            }
        }
        if (Llogaria.leja("stokuFshi")) {
            Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
            Box(Modifier.fillMaxWidth().clickable(enabled = te.isNotEmpty()) { fshiKrejt = true }.padding(vertical = 16.dp), contentAlignment = Alignment.Center) {
                Text("Fshi të gjitha produktet", style = tx(15, 600, if (te.isEmpty()) n.disabled else n.exp))
            }
        }
    }

    hapur?.let { b -> ProduktiFlete(id, b, burimi) { hapur = null } }
    if (fshiKrejt) {
        val emri = Dyqani.emriFolderit(id)
        Konfirmo("Të fshihen të gjitha?",
            if (te.size == 1) "Do të fshihet 1 produkt nga folderi \"$emri\". Ky veprim NUK mund të kthehet."
            else "Do të fshihen të gjitha ${te.size} produktet nga folderi \"$emri\". Ky veprim NUK mund të kthehet.",
            "Fshi të gjitha", mbyll = { fshiKrejt = false }) {
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
    var t by remember(s) { mutableStateOf(s.toString()) }
    BasicTextField(
        value = t, onValueChange = { t = it.filter { c -> c.isDigit() }.take(7) }, singleLine = true,
        textStyle = tx(20, 700, if (s <= 0) n.exp else n.ink).copy(textAlign = TextAlign.Center),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = {
            val v = t.toLongOrNull()
            if (v != null && !Afatet.sasiaEPranueshme(t)) { Toast.trego(Afatet.SASIA_E_MADHE, 4500); t = s.toString() }
            else if (v != null && v != s) vendos(v) else t = s.toString()
        }),
        cursorBrush = SolidColor(n.accent),
        modifier = Modifier.size(68.dp, 50.dp).clip(RoundedCornerShape(14.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(14.dp)).padding(top = 12.dp)
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

    fun ruaj() {
        if (Dyqani.g.foldera.none { it["id"] == folderId }) { mbyll(); Toast.trego("Folderi u fshi nga një pajisje tjetër. Produkti s'u ruajt.", 4500); return }
        val ekz = Dyqani.produkti(folderId, barkodi)
        if (!Llogaria.leja(if (ekz != null) "stokuNdrysho" else "stokuShto")) { mbyll(); return }
        val em = emri.trim()
        if (em.isEmpty()) { Toast.trego("Shkruaj emrin e produktit."); return }
        val ts = sasia.trim()
        if (!Regex("^-?\\d+$").matches(ts)) { Toast.trego("Shkruaj sasinë (numër i plotë)."); fSasia.requestFocus(); return }
        if (!Afatet.sasiaEPranueshme(ts)) { Toast.trego(Afatet.SASIA_E_MADHE, 4500); return }
        val f = if (paFurnizues) null else furn.replace(Regex("\\s+"), " ").trim().take(80)
        Dyqani.ruajProduktin(folderId, barkodi, em, ts.toLong(), f)
        mbyll()
    }

    Flete(mbyll) {
        Text(if (e != null) "Produkti ekziston (tani: ${sasiaE(e)})" else "Produkt i ri", style = tx(22, 700, n.ink, -0.02))
        Text("Barkodi: $barkodi", style = tx(15, 400, n.ink2))
        Fusha(emri, { emri = it }, Modifier.fillMaxWidth(), "Emri", veprimi = ImeAction.Next)
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
        try { if (e != null || emri.isNotEmpty()) fSasia.requestFocus() } catch (x: Exception) { }
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

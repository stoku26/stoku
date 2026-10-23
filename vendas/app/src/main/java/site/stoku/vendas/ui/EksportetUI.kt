package site.stoku.vendas.ui

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import site.stoku.logjika.Afatet
import site.stoku.logjika.ImportiAfateve
import site.stoku.logjika.Obj
import site.stoku.logjika.Xlsx
import site.stoku.logjika.jsString
import site.stoku.logjika.jsTrim
import site.stoku.logjika.obj
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Eksportet
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Merchandiseri
import site.stoku.vendas.Skedaret
import site.stoku.vendas.Skedari

/**
 * Skedari është gati (si dlgKuSkedari te web-i): "Dërgo në PC" (te PC-ja e së njëjtës llogari, Përmbledhja → "Shkarko"),
 * "Ruaje në telefon" (Shkarkimet) ose "Ndaje" (WhatsApp, email, Drive…).
 */
@Composable
fun SkedariFlete(sk: Skedari, mbyll: () -> Unit) {
    val n = N
    val ctx = LocalContext.current
    var gjendja by remember { mutableStateOf("zgjedhje") } // zgjedhje | pune | gati | gabim
    var teksti by remember { mutableStateOf("") }
    val shfaqur = remember { booleanArrayOf(true) }
    DisposableEffect(Unit) { onDispose { shfaqur[0] = false } }
    val lejaPc = Skedaret.lejaDergoNePc()
    val kaLlogari = Skedaret.kaLlogari()
    val lloji = Skedaret.llojiISkedarit(sk.emri)
    val emriLlojit = when (lloji) { "pdf" -> "PDF-ja"; "xlsx" -> "Excel-i"; else -> "Skedari" }
    val ruajSi = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument(sk.mime)) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        if (Skedaret.shkruajTe(ctx, uri, sk)) { Toast.trego("U ruajt: " + sk.emri); mbyll() } else Toast.trego("S'u ruajt. Provo sërish.")
    }

    fun dergo() {
        if (!lejaPc || !kaLlogari || gjendja == "pune") return
        gjendja = "pune"; teksti = ""
        Skedaret.fusha.launch {
            val r = if (!Skedaret.kaInternet(ctx)) Skedaret.Rezultati(false, "rrjeti") else Skedaret.dergoNePc(sk)
            if (!shfaqur[0]) { // dritarja u mbyll ndërkohë: rezultati del si njoftim
                Toast.trego(if (r.ok) "U dërgua në PC. E gjen te Stoku në kompjuter, te Përmbledhja." else "S'u dërgua në PC. Provo sërish.", 4500)
                return@launch
            }
            if (r.ok) {
                gjendja = "gati"; teksti = "E gjen te Stoku në kompjuter, te Përmbledhja, me butonin \"Shkarko\"."
                delay(2500)
                if (shfaqur[0] && gjendja == "gati") mbyll()
                return@launch
            }
            gjendja = "gabim"
            teksti = when (r.arsye) {
                "i-madh" -> "Skedari është mbi 15 MB, shumë i madh për PC-në. Mund ta ruash në telefon."
                "leje" -> "Firebase s'e lejon ende: rregullat duhet të përditësohen. Mund ta ruash në telefon."
                else -> "S'u dërgua. Kontrollo internetin dhe provo sërish, ose ruaje në telefon."
            }
        }
    }
    fun ruaj() {
        if (Skedaret.mundTeShkarkimet()) {
            if (Skedaret.ruajTeShkarkimet(ctx, sk)) { Toast.trego("U ruajt te Shkarkimet (Downloads): " + sk.emri, 4000); mbyll() }
            else Toast.trego("S'u ruajt. Provo \"Ndaje\".")
        } else try { ruajSi.launch(sk.emri) } catch (e: Exception) { Toast.trego("S'u hap zgjedhja e vendit. Provo \"Ndaje\".") }
    }

    Flete(mbyll) {
        Text(when (gjendja) { "gati" -> "U dërgua në PC"; "pune" -> "Duke e dërguar në PC…"; else -> "$emriLlojit është gati" }, style = tx(22, 700, n.ink, -0.02))
        val (sfondi, ngjyra) = when (gjendja) { "gati" -> n.okTint to n.okInk; "gabim" -> n.expTint to n.expInk; else -> n.surface2 to n.ink2 }
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(sfondi).padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            if (gjendja == "pune") { Rrotullues(); Spacer(Modifier.width(10.dp)) }
            Text(teksti.ifEmpty { sk.emri + " (" + Skedaret.madhesiaTekst(sk.bajtet.size) + ")" }, style = tx(14, 400, ngjyra))
        }
        if (gjendja == "zgjedhje" || gjendja == "gabim") {
            if (lejaPc) Buton(if (gjendja == "gabim") "Provo sërish në PC" else "Dërgo në PC", { dergo() }, Modifier.fillMaxWidth(), aktiv = kaLlogari, ikona = Ik.Kompjuter)
            Buton("Ruaje në telefon", { ruaj() }, Modifier.fillMaxWidth(), lloji = if (lejaPc) "dyte" else "kryesor", ikona = Ik.Shkarko)
            Buton("Ndaje (WhatsApp, email…)", { try { Skedaret.ndaj(ctx, sk); mbyll() } catch (e: Exception) { Toast.trego("S'u hap menyja e ndarjes.") } },
                Modifier.fillMaxWidth(), lloji = "dyte", ikona = Ik.Ndaj)
            if (gjendja == "zgjedhje" && lejaPc) Text(if (kaLlogari) "Në PC del te Përmbledhja, me butonin \"Shkarko\". Duhet e njëjta llogari në kompjuter."
                else "Për ta dërguar në PC duhet llogari (e njëjta edhe në kompjuter).", style = tx(13, 400, n.muted))
        }
        Buton(if (gjendja == "gati" || gjendja == "pune") "Mbyll" else "Anulo", mbyll, Modifier.fillMaxWidth(), lloji = "tekst")
    }
}

/** Rresht me kuti zgjedhjeje (kolonat e Excel-it) */
@Composable
private fun RreshtiIKutise(teksti: String, zgjedhur: Boolean, onClick: () -> Unit) {
    val n = N
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable(onClick = onClick).padding(vertical = 9.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(22.dp).clip(RoundedCornerShape(6.dp)).background(if (zgjedhur) n.accent else Color.Transparent)
            .border(if (zgjedhur) 0.dp else 1.5.dp, if (zgjedhur) Color.Transparent else n.line2, RoundedCornerShape(6.dp)), contentAlignment = Alignment.Center) {
            if (zgjedhur) Icon(Ik.Kontroll, null, Modifier.size(15.dp), tint = Color.White)
        }
        Spacer(Modifier.width(12.dp))
        Text(teksti, style = tx(15, 400, n.ink))
    }
}

@Composable
private fun Etiketa(t: String) = Text(t, style = tx(13, 600, N.ink3), modifier = Modifier.padding(start = 2.dp))

@Composable
private fun CipatRresht(content: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) { content() }
}

/**
 * "Çka të përfshihet në Excel?" (si dlgAfExcel): kolonat (zgjedhja mbahet mend), dhe te eksporti i krejt listës muaji e
 * furnizuesi. zgjedhura != null: vetëm afatet e zgjedhura; përndryshe eFiltruara(muaji) = lista me filtrat e tanishëm.
 */
@Composable
fun AfatetExcelFlete(zgjedhura: List<Obj>?, eFiltruara: (String) -> List<Obj>, muajiFillim: String, filtri: String, mbyll: () -> Unit, gati: (Skedari) -> Unit) {
    val n = N
    val paFurnizues = Llogaria.eshteMerchandiser()
    val krejt = zgjedhura == null
    var kyçet by remember { mutableStateOf(Eksportet.kolonatERuajtura().toSet()) }
    val muajt = remember { if (krejt) Afatet.muajtELista(eFiltruara("")) else emptyList() }
    var muaji by remember { mutableStateOf(if (krejt && muajt.any { it.celes == muajiFillim }) muajiFillim else "") }
    var furn by remember { mutableStateOf("") }
    val tE = kyçet.filter { !(paFurnizues && it == "furnizuesi") }
    val furnizuesit = if (krejt) Afatet.furnizuesitELista(eFiltruara(muaji)) else emptyList()
    if (furn.isNotEmpty() && furnizuesit.none { it.celes == furn }) furn = ""
    val lista = if (krejt) eFiltruara(muaji).filter { a -> paFurnizues || furn.isEmpty() || Afatet.celesiFurnizuesit(a) == furn } else zgjedhura!!.sortedWith { a, b -> Afatet.krahaso(a, b) }
    val emriFurn = if (!paFurnizues && furn.isNotEmpty()) furnizuesit.firstOrNull { it.celes == furn }?.emri.orEmpty() else ""

    Flete(mbyll) {
        Text("Çka të përfshihet në Excel?", style = tx(22, 700, n.ink, -0.02))
        val nen = if (!krejt) (if (lista.size == 1) "1 afat i zgjedhur" else "${lista.size} afate të zgjedhura") else {
            val st = mapOf("aktive" to "aktive", "skaduar" to "të skaduara", "afer" to "afër skadimit", "ok" to "në rregull", "hequr" to "të hequra")[filtri].orEmpty()
            if (lista.isNotEmpty()) "Do të eksportohen " + (if (lista.size == 1) "1 afat" else "${lista.size} afate") + (if (filtri != "aktive") " ($st)" else "") +
                (if (emriFurn.isNotEmpty()) " të furnizuesit $emriFurn" else "") else "S'ka afate $st për këtë zgjedhje"
        }
        Text(nen, style = tx(14, 400, n.muted))
        if (krejt && muajt.isNotEmpty()) {
            Etiketa("Cili muaj?")
            CipatRresht {
                Cip("Të gjithë muajt", null, muaji.isEmpty()) { muaji = "" }
                muajt.forEach { m -> Cip(m.emri, m.n.toString(), muaji == m.celes) { muaji = m.celes } }
            }
        }
        if (krejt && !paFurnizues && furnizuesit.size >= 2) {
            Etiketa("Cili furnizues?")
            CipatRresht {
                Cip("Të gjithë furnizuesit", null, furn.isEmpty()) { furn = "" }
                furnizuesit.forEach { f -> Cip(f.emri, f.n.toString(), furn == f.celes) { furn = f.celes } }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Lidhje("Të gjitha", { kyçet = Eksportet.KOLONAT_E_AFATEVE.map { it.k }.toSet() })
            Lidhje("Barkodi, emri, sasia", { kyçet = setOf("barkodi", "emri", "sasia") })
        }
        Column {
            Eksportet.KOLONAT_E_AFATEVE.filter { !(paFurnizues && it.k == "furnizuesi") }.forEach { c ->
                RreshtiIKutise(c.emri, kyçet.contains(c.k)) { kyçet = if (kyçet.contains(c.k)) kyçet - c.k else kyçet + c.k }
            }
        }
        if (tE.isEmpty()) Text("Zgjidh të paktën një kolonë.", style = tx(13, 600, n.exp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Buton("Anulo", mbyll, Modifier.weight(1f), lloji = "tekst")
            Buton("Eksporto", {
                if (!Llogaria.leja("eksportExcel") || tE.isEmpty() || lista.isEmpty()) return@Buton
                val renditur = Eksportet.KOLONAT_E_AFATEVE.map { it.k }.filter { tE.contains(it) }
                val sk = Eksportet.excelIAfateve(lista, renditur, if (krejt) muaji else "", if (krejt) emriFurn else "")
                mbyll(); gati(sk)
            }, Modifier.weight(1.4f), aktiv = tE.isNotEmpty() && lista.isNotEmpty())
        }
    }
}

private class FletaImporti(val emri: String, val rreshtat: List<List<Any?>>)

/** "Importo afate nga Excel" (si dlgAfImport): skedari .xlsx/.csv → kolonat → parapamja → importi. pasImportit: filtrat te "Të gjitha". */
@Composable
fun ImportiAfateveFlete(mbyll: () -> Unit, pasImportit: () -> Unit) {
    val n = N
    val ctx = LocalContext.current
    val paFurnizues = Llogaria.eshteMerchandiser()
    var fletet by remember { mutableStateOf<List<FletaImporti>?>(null) }
    var emriSk by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf("") }
    var fleta by remember { mutableStateOf("0") } // "krejt" ose indeksi
    var meKoke by remember { mutableStateOf(true) }
    var kol by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }

    fun teZgjedhurat(): List<FletaImporti> { val f = fletet ?: return emptyList(); return if (fleta == "krejt") f else listOfNotNull(f.getOrNull(fleta.toIntOrNull() ?: 0)) }
    fun pergatit() { teZgjedhurat().firstOrNull()?.let { kol = ImportiAfateve.hamendesoKolonat(it.rreshtat, meKoke) } }

    fun lexo(uri: Uri) {
        gabim = ""
        val emri = try { ctx.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c -> if (c.moveToFirst()) c.getString(0) else null } } catch (e: Exception) { null } ?: "skedar"
        val lexuar: List<FletaImporti>
        try {
            val b = ctx.contentResolver.openInputStream(uri)?.use { s -> s.readBytes() } ?: throw IllegalStateException()
            if (b.size > 40 * 1024 * 1024) { gabim = "Skedari është shumë i madh."; return }
            lexuar = if (b.size > 1 && b[0] == 0x50.toByte() && b[1] == 0x4b.toByte()) {
                Xlsx.read(b).map { sh -> FletaImporti(sh.name, sh.rows.filter { r -> r.any { jsTrim(jsString(it ?: "")).isNotEmpty() } }) }
            } else if (Regex("\\.xls$", RegexOption.IGNORE_CASE).containsMatchIn(emri)) {
                gabim = "Formati i vjetër .xls s'mbështetet. Ruaje si .xlsx ose .csv."; return
            } else listOf(FletaImporti(emri.replace(Regex("\\.[^.]+$"), ""), Xlsx.lexoCsv(Xlsx.tekstiISkedarit(b))))
        } catch (e: Exception) { gabim = "Skedari s'u lexua. Sigurohu që është .xlsx ose .csv."; return }
        val me = lexuar.filter { it.rreshtat.isNotEmpty() }
        if (me.isEmpty()) { gabim = "Skedari është bosh."; return }
        emriSk = emri
        fletet = me
        fleta = if (me.size > 1) "krejt" else "0"
        meKoke = !(me[0].rreshtat.firstOrNull().orEmpty().any { ImportiAfateve.dataNgaQeliza(it, null) != null })
        pergatit()
    }
    val zgjidh = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) lexo(uri) }

    Flete(mbyll) {
        Text("Importo afate nga Excel", style = tx(22, 700, n.ink, -0.02))
        val f = fletet
        if (f == null) {
            Text("Zgjidh një skedar .xlsx ose .csv me barkodin ose emrin dhe datën e skadimit. Fletët me emër muaji (Nëntor, Nëntor2…) lexohen si ai muaj.",
                style = tx(14, 400, n.muted))
            Buton("Zgjidh skedarin", {
                try { zgjidh.launch(arrayOf(Xlsx.MIME, "text/*", "application/csv", "application/vnd.ms-excel", "application/octet-stream")) }
                catch (e: Exception) { gabim = "S'u hap zgjedhja e skedarit." }
            }, Modifier.fillMaxWidth(), ikona = Ik.Excel)
            if (gabim.isNotEmpty()) Text(gabim, style = tx(13, 600, n.exp))
            Buton("Anulo", mbyll, Modifier.fillMaxWidth(), lloji = "tekst")
            return@Flete
        }
        Text(emriSk, style = tx(14, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
        if (f.size > 1) {
            Etiketa("Fleta")
            CipatRresht {
                Cip("Të gjitha fletët (${f.size})", null, fleta == "krejt") { fleta = "krejt"; pergatit() }
                f.forEachIndexed { i, sh ->
                    val m = ImportiAfateve.muajiNgaEmri(sh.emri)
                    Cip(sh.emri + (if (m != null) " → " + Afatet.EMRAT_MUAJVE[m - 1] else ""), sh.rreshtat.size.toString(), fleta == i.toString()) { fleta = i.toString(); pergatit() }
                }
            }
        }
        Etiketa("Rreshti i parë ka titujt")
        CipatRresht {
            Cip("Po", null, meKoke) { meKoke = true; pergatit() }
            Cip("Jo", null, !meKoke) { meKoke = false; pergatit() }
        }
        val sh0 = teZgjedhurat().firstOrNull() ?: f[0]
        val nKol = sh0.rreshtat.maxOfOrNull { it.size } ?: 0
        val titujt = (0 until nKol).map { i -> (if (meKoke) ImportiAfateve.tekstNgaQeliza(sh0.rreshtat.getOrNull(0)?.getOrNull(i)) else "").ifEmpty { "Kolona ${i + 1}" } }
        listOf("barkodi" to "Barkodi", "emri" to "Emri", "data" to "Data e skadimit *", "sasia" to "Sasia", "furnizuesi" to "Furnizuesi").forEach { (fu, et) ->
            if (paFurnizues && fu == "furnizuesi") return@forEach
            Etiketa(et)
            CipatRresht {
                Cip("(asnjë)", null, (kol[fu] ?: -1) < 0) { kol = kol + (fu to -1) }
                titujt.forEachIndexed { j, t -> Cip(t, null, kol[fu] == j) { kol = kol + (fu to j) } }
            }
        }
        val k2 = if (paFurnizues) kol + ("furnizuesi" to -1) else kol
        val plan = ImportiAfateve.plani(teZgjedhurat().map { it.emri to it.rreshtat }, meKoke, k2, Dyqani.g.afatet)
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            listOf("Të reja" to plan.teRinj, "Ekzistojnë" to plan.ekzistojne, "Bashkohen" to plan.bashkuar, "Me gabim" to plan.gabime).forEach { (t, v) ->
                if (v == 0 && t != "Të reja") return@forEach
                Text("$t: $v", style = tx(13, 600, n.ink2))
            }
        }
        val muajtR = Afatet.muajtELista(plan.rreshta.filter { it.veprimi == "i ri" }.map { obj("data" to it.data) })
        if (muajtR.isNotEmpty()) Text(muajtR.joinToString(", ") { it.emri + " (" + it.n + ")" }, style = tx(13, 400, n.muted))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).border(1.dp, n.line, RoundedCornerShape(14.dp))) {
            plan.rreshta.take(80).forEachIndexed { i, r ->
                if (i > 0) Box(Modifier.fillMaxWidth().padding(horizontal = 12.dp).heightIn(min = 1.dp).background(n.line))
                Row(Modifier.fillMaxWidth().background(if (r.gabim.isNotEmpty()) n.expTint else Color.Transparent).padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(r.emri.ifEmpty { r.barkodi }.ifEmpty { "(pa emër)" }, style = tx(14, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        val det = listOf(if (r.data.isNotEmpty()) Afatet.formato(r.data) else r.dataOrigjinale, if (r.sasia != "") jsString(r.sasia) + " copë" else "", r.furnizuesi)
                            .filter { it.isNotEmpty() }.joinToString(" · ")
                        if (det.isNotEmpty()) Text(det, style = tx(12, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(r.gabim.ifEmpty { r.veprimi }, style = tx(12, 600, if (r.gabim.isNotEmpty()) n.expInk else if (r.veprimi == "i ri") n.okInk else n.muted))
                }
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Buton("Skedar tjetër", { fletet = null; gabim = "" }, Modifier.weight(1f), lloji = "tekst")
            Buton("Anulo", mbyll, Modifier.weight(0.8f), lloji = "tekst")
            Buton(if (plan.teRinj > 0) "Importo ${plan.teRinj}" else "Importo", {
                if (!Llogaria.leja("afatetImporto")) return@Buton
                val teReja0 = ImportiAfateve.afatetNgaPlani(plan, Llogaria.perdoruesi.value?.emri)
                if (teReja0.isEmpty()) return@Buton
                Merchandiseri.marketiPerTeReja { mkId ->
                    val teReja = if (mkId != null) teReja0.map { a -> a.also { it["m"] = mkId } } else teReja0
                    Dyqani.shtoAfatet(teReja)
                    val nk = teReja.count { Afatet.statusi(it) == "skaduar" }
                    val nv = teReja.count { Afatet.statusi(it) == "afer" }
                    Toast.trego((if (teReja.size == 1) "U importua 1 afat" else "U importuan ${teReja.size} afate") +
                        (if (nk > 0) " · " + (if (nk == 1) "1 ka skaduar!" else "$nk kanë skaduar!") else "") +
                        (if (nv > 0) " · " + (if (nv == 1) "1 skadon" else "$nv skadojnë") + " brenda 30 ditëve" else "") + ".", 4500)
                    mbyll(); pasImportit()
                }
            }, Modifier.weight(1.3f), aktiv = plan.teRinj > 0)
        }
    }
}

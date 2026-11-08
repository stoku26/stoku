package site.stoku.vendas.ui

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import site.stoku.logjika.Afatet
import site.stoku.logjika.ImportiAfateve
import site.stoku.logjika.Obj
import site.stoku.logjika.Xlsx
import site.stoku.logjika.jsString
import site.stoku.logjika.jsTrim
import site.stoku.logjika.obj
import site.stoku.vendas.Dyqani
import site.stoku.vendas.EksportiFoto
import site.stoku.vendas.EksportiPdf
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
 * "Çfarë të përfshihet në Excel?" (si dlgAfExcel): kolonat (zgjedhja mbahet mend), dhe te eksporti i të gjithë listës muaji e
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
        Text("Çfarë të përfshihet në Excel?", style = tx(22, 700, n.ink, -0.02))
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

/**
 * Hyrja 36 (web v275, #dlgAfPdf): "PDF për printim" (pronari: ideja 1, opsionet "A"). Katër rreshta: Periudha ("Të gjitha" ose një muaj),
 * Gjendja, Furnizuesi, Renditja; secili hap zgjedhjen e vet. PDF-ja (EksportiPdf, A4 e bardhë) del te SkedariFlete (PC / Ruaje / Ndaje).
 */
@Composable
fun AfatetPdfFlete(te: List<Obj>, mbyll: () -> Unit, gati: (Skedari) -> Unit) {
    val n = N
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val paF = Llogaria.eshteMerchandiser()
    var mu by remember { mutableStateOf("") }
    var gj by remember { mutableStateOf("aktive") }
    var f by remember { mutableStateOf("") }
    var r by remember { mutableStateOf("data") }
    var duke by remember { mutableStateOf(false) }
    val gjOps = EksportiPdf.GJENDJET.map { (k, t) -> k to "$t (${EksportiPdf.filtro(te, mu, k, f, paF).size})" }
    val muajt = Afatet.muajtELista(EksportiPdf.filtro(te, "", gj, f, paF))
    val muE = if (mu.isEmpty() || muajt.any { it.celes == mu }) mu else ""
    val furn = if (paF) emptyList() else Afatet.furnizuesitELista(EksportiPdf.filtro(te, muE, gj, "", paF))
    val fE = if (f.isEmpty() || furn.any { it.celes == f }) f else ""
    val lista = EksportiPdf.filtro(te, muE, gj, fE, paF)
    val faqet = EksportiPdf.plani(lista.size).size
    val gjT = EksportiPdf.GJENDJET.firstOrNull { it.first == gj }?.second ?: "Të gjitha"
    val furnT = furn.firstOrNull { it.celes == fE }?.emri ?: "Të gjithë"
    Flete(mbyll) {
        Text("PDF për printim", style = tx(22, 700, n.ink, -0.02))
        Text(if (lista.isEmpty()) "S'ka afate për këtë zgjedhje." else (if (lista.size == 1) "1 afat" else "${lista.size} afate") + " · " +
            (if (faqet == 1) "1 faqe A4" else "$faqet faqe A4"), style = tx(14, 400, n.muted))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).border(1.dp, n.line, RoundedCornerShape(18.dp))) {
            RreshtiIOpsionit(Ik.Kalendari, "blu", "Periudha", if (muE.isEmpty()) "Të gjitha" else muajt.first { it.celes == muE }.emri,
                listOf("" to "Të gjitha") + muajt.map { it.celes to "${it.emri} (${it.n})" }, muE, true) { mu = it }
            RreshtiIOpsionit(Ik.Kohe, "portokalli", "Gjendja", gjT, gjOps, gj, false) { gj = it }
            if (!paF) RreshtiIOpsionit(Ik.Kamion, "gjelber", "Furnizuesi", furnT, listOf("" to "Të gjithë") + furn.map { it.celes to "${it.emri} (${it.n})" }, fE, false) { f = it }
            RreshtiIOpsionit(Ik.Rendi, "vjollce", "Renditja", EksportiPdf.RENDET.first { it.first == r }.second, EksportiPdf.RENDET, r, false) { r = it }
        }
        Text("Prek një rresht për ta ndryshuar", style = tx(12, 400, n.faint), modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Buton(if (duke) "Duke e krijuar…" else "Krijo PDF-në", {
                if (!Llogaria.leja("eksportPdf") || lista.isEmpty() || duke) return@Buton
                duke = true
                val k = java.util.Calendar.getInstance()
                fun dy(x: Int) = (if (x < 10) "0" else "") + x
                val data = dy(k.get(java.util.Calendar.DAY_OF_MONTH)) + "." + dy(k.get(java.util.Calendar.MONTH) + 1) + "." + k.get(java.util.Calendar.YEAR)
                val ora = dy(k.get(java.util.Calendar.HOUR_OF_DAY)) + ":" + dy(k.get(java.util.Calendar.MINUTE))
                val dita = k.get(java.util.Calendar.YEAR).toString() + "-" + dy(k.get(java.util.Calendar.MONTH) + 1) + "-" + dy(k.get(java.util.Calendar.DAY_OF_MONTH))
                val per = if (muE.isEmpty()) "Të gjitha" else Afatet.emriMuajit(muE)
                val idM = Merchandiseri.idAktiv()
                val cope = Afatet.shumaCopeve(lista)
                val info = ArrayList<Pair<String, Boolean>>()
                info.add("Periudha: " to false); info.add(per to true)
                listOf(if (gj == "aktive") "" else gjT, if (fE.isEmpty()) "" else furnT, idM?.let { Merchandiseri.emri(it) } ?: "").filter { it.isNotEmpty() }
                    .forEach { info.add(" · " to false); info.add(it to true) }
                info.add(" · " to false); info.add(lista.size.toString() to true); info.add((if (lista.size == 1) " produkt" else " produkte") to false)
                if (cope > 0) { info.add(" · " to false); info.add(EksportiPdf.numri(cope) to true); info.add(" copë" to false) }
                val emri = "afatet_" + (if (muE.isEmpty()) "" else Eksportet.sluguFolderit(per) + "_") + dita + ".pdf"
                val renditur = EksportiPdf.rendit(lista, r)
                scope.launch {
                    val b = withContext(Dispatchers.Default) { try { EksportiPdf.krijo(ctx, renditur, EksportiPdf.Opsionet(info, data, ora), paF) } catch (e: Throwable) { null } }
                    duke = false
                    if (b == null) { Toast.trego("PDF-ja nuk u krijua. Provo përsëri."); return@launch }
                    mbyll(); gati(Skedari(b, emri, "application/pdf", "Afatet"))
                }
            }, Modifier.weight(1.4f), aktiv = lista.isNotEmpty() && !duke)
        }
    }
}

/** Një rresht i opsioneve të PDF-së (si te Cilësimet): ikona me ngjyrë, emri, vlera, shigjeta; prekja hap listën e zgjedhjeve */
@Composable
private fun RreshtiIOpsionit(ikona: androidx.compose.ui.graphics.vector.ImageVector, ngjyra: String, emri: String, vlera: String,
                             opsionet: List<Pair<String, String>>, zgjedhur: String, iPari: Boolean, zgjidh: (String) -> Unit) {
    val n = N
    var hapur by remember { mutableStateOf(false) }
    val (bg, fg) = n.ikonat[ngjyra] ?: (n.surface2 to n.ink3)
    Column {
        if (!iPari) Box(Modifier.fillMaxWidth().padding(horizontal = 0.dp).heightIn(min = 1.dp, max = 1.dp).background(n.line2))
        Box {
            Row(Modifier.fillMaxWidth().heightIn(min = 60.dp).clickable { hapur = true }.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(36.dp).clip(RoundedCornerShape(11.dp)).background(bg), contentAlignment = Alignment.Center) {
                    Icon(ikona, null, Modifier.size(19.dp), tint = fg)
                }
                Spacer(Modifier.width(12.dp))
                Text(emri, style = tx(15, 600, n.ink), modifier = Modifier.weight(1f))
                Text(vlera, style = tx(14, 500, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(start = 8.dp).widthIn(max = 170.dp))
                Spacer(Modifier.width(6.dp))
                Icon(Ik.Perpara, null, Modifier.size(18.dp), tint = n.faint)
            }
            androidx.compose.material3.DropdownMenu(hapur, { hapur = false }, offset = androidx.compose.ui.unit.DpOffset(0.dp, 4.dp),
                shape = RoundedCornerShape(14.dp), containerColor = n.surface, shadowElevation = 12.dp, modifier = Modifier.widthIn(min = 230.dp)) {
                opsionet.forEach { (k, t) ->
                    Row(Modifier.fillMaxWidth().heightIn(min = 48.dp).clickable { hapur = false; zgjidh(k) }.padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        Text(t, style = tx(14, if (k == zgjedhur) 700 else 500, n.ink), modifier = Modifier.weight(1f))
                        if (k == zgjedhur) Icon(Ik.Kontroll, null, Modifier.size(18.dp), tint = n.accent)
                    }
                }
            }
        }
    }
}

/**
 * Hyrja 35 (web v274, #dlgAfEksFoto): "Eksporto si foto". Zgjedh një ose disa furnizues: për secilin del një foto JPG me të gjitha afatet aktive
 * (EksportiFoto, ideja 5), me temën e aplikacionit; pastaj hapet "Ndaj" (Viber, WhatsApp…). Merchandiseri: të gjitha afatet në një foto.
 */
@Composable
fun AfatetFotoFlete(te: List<Obj>, mbyll: () -> Unit) {
    val n = N
    val ctx = LocalContext.current
    val erret = n.erret
    val scope = rememberCoroutineScope()
    val paF = Llogaria.eshteMerchandiser()
    val aktive = remember(te) { te.filter { Afatet.statusi(it) != "hequr" }.sortedWith { a, b -> Afatet.krahaso(a, b) } }
    val furn = remember(aktive) { if (paF) emptyList() else Afatet.furnizuesitELista(aktive) }
    var zgj by remember { mutableStateOf(if (furn.size == 1) setOf(furn[0].celes) else emptySet()) }
    var duke by remember { mutableStateOf(false) }
    var kerko by remember { mutableStateOf("") }
    val sk = remember(aktive, furn) { furn.associate { f -> f.celes to aktive.count { Afatet.celesiFurnizuesit(it) == f.celes && Afatet.statusi(it) == "skaduar" } } }
    Flete(mbyll) {
        // Hyrja 40 (pronari, ideja 5): "Të gjithë" pranë titullit, kërkimi, lart me afate të skaduara e poshtë të tjerët, butoni poshtë
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Eksporto si foto", style = tx(22, 700, n.ink, -0.02), modifier = Modifier.weight(1f))
            if (furn.size >= 2) {
                val krejt = zgj.size == furn.size
                Lidhje(if (krejt) "Asnjë" else "Të gjithë", { zgj = if (krejt) emptySet() else furn.map { it.celes }.toSet() }, madhesia = 14)
            }
        }
        Text(if (paF) "Të gjitha afatet aktive (${aktive.size}) në një foto." else "Një foto për secilin furnizues.", style = tx(13, 400, n.muted), modifier = Modifier.offset(y = (-8).dp))
        if (furn.size >= 6) Fusha(kerko, { kerko = it }, Modifier.fillMaxWidth(), "Kërko furnizuesin", ikona = Ik.Kerko, lartesia = 46.dp, sfondi = n.surface2, paVije = true, rrezja = 12.dp)
        if (furn.isNotEmpty()) {
            val q = kerko.trim().lowercase()
            val te2 = furn.filter { q.isEmpty() || it.emri.lowercase().contains(q) }
            val me = te2.filter { (sk[it.celes] ?: 0) > 0 }
            val pa = te2.filter { (sk[it.celes] ?: 0) == 0 }
            val lartesia = (androidx.compose.ui.platform.LocalConfiguration.current.screenHeightDp * 0.5f).dp
            Column(Modifier.fillMaxWidth().heightIn(max = lartesia).verticalScroll(rememberScrollState())) {
                listOf(Triple("ME AFATE TË SKADUARA", me, true), Triple(if (me.isEmpty()) "FURNIZUESIT" else "TË TJERËT", pa, false)).forEach { (t, l, kuq) ->
                    if (l.isEmpty()) return@forEach
                    Text(t, style = tx(12, 600, if (kuq) n.exp else n.muted, 0.04), modifier = Modifier.padding(start = 2.dp, top = 6.dp, bottom = 8.dp))
                    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(n.surface2)) {
                        l.forEachIndexed { i, f ->
                            if (i > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
                            RreshtiIFurnizuesit(f.emri, if (f.n == 1) "1 afat" else "${f.n} afate", zgj.contains(f.celes)) {
                                zgj = if (zgj.contains(f.celes)) zgj - f.celes else zgj + f.celes
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
                if (me.isEmpty() && pa.isEmpty()) Text("S'u gjet asnjë furnizues.", style = tx(14, 400, n.muted), modifier = Modifier.fillMaxWidth().padding(vertical = 18.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            }
        }
        val nr = if (paF) 1 else zgj.size
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Buton("Anulo", mbyll, Modifier.weight(1f), lloji = "tekst")
            Buton(if (duke) "Duke e krijuar…" else if (nr > 1) "Krijo $nr foto" else "Krijo foton", {
                if (!Llogaria.leja("eksportExcel") || nr == 0 || duke || aktive.isEmpty()) return@Buton
                duke = true
                val grupet = if (paF) null else furn.filter { zgj.contains(it.celes) }
                val idM = Merchandiseri.idAktiv()
                val kush = Llogaria.perdoruesi.value?.emri.orEmpty()
                val meta = listOf(if (paF || idM == null) "" else Merchandiseri.emri(idM), if (kush.isNotEmpty()) "dërgoi $kush" else "").filter { it.isNotEmpty() }.joinToString(" · ")
                val titulliPa = if (idM != null) Merchandiseri.emri(idM) else "Afatet"
                scope.launch {
                    val r = withContext(Dispatchers.Default) { try { EksportiFoto.krijo(ctx, aktive, grupet, titulliPa, meta, erret) } catch (e: Throwable) { null } }
                    duke = false
                    if (r.isNullOrEmpty()) { Toast.trego("Fotoja s'u krijua. Provo sërish."); return@launch }
                    mbyll()
                    try { EksportiFoto.ndaj(ctx, r, if (grupet?.size == 1) "Afatet: " + grupet[0].emri else "Afatet") }
                    catch (e: Exception) { Toast.trego("S'u hap \"Ndaj\". Provo sërish.") }
                }
            }, Modifier.fillMaxWidth(), aktiv = nr > 0 && !duke, ikona = Ik.Foto, lartesia = 52.dp)
            Buton("Anulo", mbyll, Modifier.fillMaxWidth(), lloji = "tekst")
        }
    }
}

/** Rreshti i furnizuesit te "Eksporto si foto" (Hyrja 40): kutia e qartë edhe në temën e errët, emri, sa afate djathtas */
@Composable
private fun RreshtiIFurnizuesit(emri: String, afate: String, zgjedhur: Boolean, onClick: () -> Unit) {
    val n = N
    Row(Modifier.fillMaxWidth().heightIn(min = 54.dp).clickable(onClick = onClick).padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(24.dp).clip(RoundedCornerShape(7.dp)).background(if (zgjedhur) n.accent else Color.Transparent)
            .border(if (zgjedhur) 0.dp else 2.dp, if (zgjedhur) Color.Transparent else n.faint, RoundedCornerShape(7.dp)), contentAlignment = Alignment.Center) {
            if (zgjedhur) Icon(Ik.Kontroll, null, Modifier.size(16.dp), tint = Color.White)
        }
        Spacer(Modifier.width(12.dp))
        Text(emri, style = tx(15, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
        Spacer(Modifier.width(8.dp))
        Text(afate, style = tx(13, 500, n.muted))
    }
}

private class FletaImporti(val emri: String, val rreshtat: List<List<Any?>>)

private class LeximiImportit(val emri: String, val fletet: List<FletaImporti>?, val gabim: String = "")

private const val IMPORTI_MAKS = 40 * 1024 * 1024

/** Leximi i skedarit të importit (në Dispatchers.IO). Edhe mungesa e memories (OutOfMemoryError) del si gabim, jo si rrëzim. */
private fun lexoSkedarinEImportit(ctx: Context, uri: Uri): LeximiImportit {
    val emri = try { ctx.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c -> if (c.moveToFirst()) c.getString(0) else null } } catch (e: Exception) { null } ?: "skedar"
    return try {
        val b = ctx.contentResolver.openInputStream(uri)?.use { s ->
            val o = java.io.ByteArrayOutputStream()
            val buf = ByteArray(64 * 1024)
            while (true) {
                val k = s.read(buf)
                if (k < 0) break
                o.write(buf, 0, k)
                if (o.size() > IMPORTI_MAKS) return LeximiImportit(emri, null, "Skedari është shumë i madh.")
            }
            o.toByteArray()
        } ?: throw IllegalStateException()
        val lexuar = if (b.size > 1 && b[0] == 0x50.toByte() && b[1] == 0x4b.toByte()) {
            Xlsx.read(b).map { sh -> FletaImporti(sh.name, sh.rows.filter { r -> r.any { jsTrim(jsString(it ?: "")).isNotEmpty() } }) }
        } else if (Regex("\\.xls$", RegexOption.IGNORE_CASE).containsMatchIn(emri)) {
            return LeximiImportit(emri, null, "Formati i vjetër .xls s'mbështetet. Ruaje si .xlsx ose .csv.")
        } else listOf(FletaImporti(emri.replace(Regex("\\.[^.]+$"), ""), Xlsx.lexoCsv(Xlsx.tekstiISkedarit(b))))
        val me = lexuar.filter { it.rreshtat.isNotEmpty() }
        if (me.isEmpty()) LeximiImportit(emri, null, "Skedari është bosh.") else LeximiImportit(emri, me)
    } catch (e: OutOfMemoryError) { LeximiImportit(emri, null, "Skedari është shumë i madh për këtë telefon.") }
    catch (e: Exception) { LeximiImportit(emri, null, "Skedari s'u lexua. Sigurohu që është .xlsx ose .csv.") }
}

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

    val fusha = rememberFusha()
    var dukeLexuar by remember { mutableStateOf(false) }
    fun lexo(uri: Uri) {
        gabim = ""; dukeLexuar = true
        fusha.launch {
            // Leximi dhe zbërthimi i një Excel-i të madh zgjasin: jashtë fijes kryesore (më parë ekrani ngrinte)
            val r = withContext(Dispatchers.IO) { lexoSkedarinEImportit(ctx, uri) }
            dukeLexuar = false
            val me = r.fletet
            if (me == null) { gabim = r.gabim; return@launch }
            emriSk = r.emri
            fletet = me
            fleta = if (me.size > 1) "krejt" else "0"
            meKoke = !(me[0].rreshtat.firstOrNull().orEmpty().any { ImportiAfateve.dataNgaQeliza(it, null) != null })
            pergatit()
        }
    }
    val zgjidh = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) lexo(uri) }

    Flete(mbyll) {
        Text("Importo afate nga Excel", style = tx(22, 700, n.ink, -0.02))
        val f = fletet
        if (f == null) {
            Text("Importo afatet nga një skedar Excel (.xlsx) ose .csv.",
                style = tx(14, 400, n.muted))
            Buton(if (dukeLexuar) "Duke e lexuar…" else "Zgjidh skedarin", {
                if (dukeLexuar) return@Buton
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
        val afatet = Dyqani.g.afatet
        val plan = remember(f, fleta, meKoke, k2, afatet) { ImportiAfateve.plani(teZgjedhurat().map { it.emri to it.rreshtat }, meKoke, k2, afatet) }
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
                    site.stoku.vendas.Regjistri.mesoNgaImporti(teReja) // të kontrolluara nga përdoruesi
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

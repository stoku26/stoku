package site.stoku.vendas.ui

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import site.stoku.logjika.Afatet
import site.stoku.logjika.obj
import site.stoku.vendas.Dyqani
import site.stoku.vendas.LeximiAI
import site.stoku.vendas.Llogaria
import site.stoku.vendas.StokuApp
import java.io.File

/** Butonat që hapin kamerën ose galerinë për fletën: → (kamera, galeria). leja: "afatetAI" ose "stokuImporto" */
@Composable
fun rememberFotoEFletes(leja: String = "afatetAI", kurFoto: (Uri) -> Unit): Pair<() -> Unit, () -> Unit> {
    val ctx = LocalContext.current
    val uri = remember {
        try {
            val f = File(File(ctx.cacheDir, "fleta").apply { mkdirs() }, "fleta.jpg")
            FileProvider.getUriForFile(ctx, ctx.packageName + ".skedaret", f)
        } catch (e: Exception) { null }
    }
    val kamera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok -> if (ok && uri != null) kurFoto(uri) }
    val lejaKamera = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { po ->
        if (po && uri != null) kamera.launch(uri) else if (!po) Toast.trego("Stoku s'ka leje për kamerën. Lejoje te cilësimet e telefonit, ose zgjidh foton nga galeria.", 4500)
    }
    val galeria = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { u -> if (u != null) kurFoto(u) }
    return Pair({
        if (!Llogaria.leja(leja)) return@Pair
        if (uri == null) { Toast.trego("Kamera s'u hap. Zgjidh foton nga galeria."); return@Pair }
        try {
            if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) kamera.launch(uri)
            else lejaKamera.launch(Manifest.permission.CAMERA)
        } catch (e: Exception) { Toast.trego("Kamera s'u hap. Zgjidh foton nga galeria.") }
    }, {
        if (!Llogaria.leja(leja)) return@Pair
        try { galeria.launch("image/*") } catch (e: Exception) { Toast.trego("Galeria s'u hap.") }
    })
}

/** Një rresht i fletës gjatë kontrollit (si lx.rreshtat te web-i) */
private class Rreshti(
    barkodi: String, emri: String, data: String, sasia: String, furnizuesi: String,
    val dataOrigjinale: String, dyshim: Boolean, val iRi: Boolean
) {
    var barkodi by mutableStateOf(barkodi)
    var emri by mutableStateOf(emri)
    var data by mutableStateOf(data) // DD-MM-VV në fushë
    var sasia by mutableStateOf(sasia)
    var furnizuesi by mutableStateOf(furnizuesi)
    var dyshim by mutableStateOf(dyshim)
    val iso: String get() = Afatet.lexoDatenEFushes(data) ?: ""
}

/**
 * "Kontrollo fletën" (si dlgAfatLexim te web-i): fotoja lart (prek për ta zmadhuar), statusi i leximit me AI, rreshtat
 * e lexuar (barkodi, emri, data, sasia, furnizuesi) për t'u krahasuar me foton e korrigjuar, "Ruaj N afate".
 * stok = true: "Kontrollo listën" (si dlgImportStok): barkodi, emri, sasia, furnizuesi → "Importo" në një folder; sasia i
 * shtohet produktit ekzistues me të njëjtin barkod.
 * kurRuhet(filtri): pas ruajtjes së afateve, filtri që duhet hapur te Afatet ("skaduar", "afer" ose "aktive").
 */
@Composable
fun FletaEkrani(uri: Uri, mbyll: () -> Unit, stok: Boolean = false, kurRuhet: (String) -> Unit = {}) {
    val n = N
    val ctx = LocalContext.current
    val paFurnizues = Llogaria.eshteMerchandiser()
    var foto by remember { mutableStateOf<ImageBitmap?>(null) }
    var eMadhe by remember { mutableStateOf(false) }
    var statusi by remember { mutableStateOf("Duke përgatitur foton…") }
    var gabim by remember { mutableStateOf(false) }
    var punon by remember { mutableStateOf(true) }
    val rreshtat = remember { mutableStateListOf<Rreshti>() }
    var anulo by remember { mutableStateOf(false) }
    val gj by Dyqani.gjendja.collectAsState()
    var folderi by remember { mutableStateOf(StokuApp.prefsOse("import_folderi", "")) }
    if (stok && gj.foldera.none { it["id"] == folderi }) folderi = (gj.foldera.firstOrNull()?.get("id") as? String) ?: ""
    var folderIRi by remember { mutableStateOf(false) }

    fun shtoRresht() {
        rreshtat.add(Rreshti("", "", "", "", rreshtat.lastOrNull()?.furnizuesi ?: "", "", false, true))
    }

    LaunchedEffect(uri) {
        val f = try { LeximiAI.pergatitFoton(ctx, uri) } catch (e: Throwable) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            statusi = "Fotoja s'u hap. Provo një foto tjetër."; gabim = true; punon = false; return@LaunchedEffect
        }
        foto = f.pamja.asImageBitmap()
        statusi = "Duke e lexuar fletën me AI… (zakonisht 5–20 sekonda)" + if (stok) "" else " · foto ${f.gjeresia}×${f.lartesia} (" +
            String.format(java.util.Locale.US, "%.1f", f.gjeresia * f.lartesia / 1e6) + " MP)"
        when (val rez = LeximiAI.lexo(f, if (stok) "stok" else null)) {
            is LeximiAI.Rez.Gabim -> { statusi = LeximiAI.mesazhi(rez.kodi); gabim = true; shtoRresht() }
            is LeximiAI.Rez.Ok -> {
                rez.rreshtat.forEach { r ->
                    val b = r["barkodi"] as String
                    val iso = r["data"] as String
                    rreshtat.add(Rreshti(b, (r["emri"] as String).ifEmpty { Dyqani.emriNgaBarkodi(b) }, if (iso.isNotEmpty()) Afatet.formatoPerFushe(iso) else "",
                        r["sasia"].let { if (it == "") "" else it.toString() },
                        if (paFurnizues) "" else (r["furnizuesi"] as String).ifEmpty { Dyqani.furnizuesiNgaBarkodi(b) },
                        if (stok) "" else r["dataOrigjinale"] as String, !stok && r["dyshim"] == true, false))
                }
                val nr = rreshtat.size
                val nDyshim = rreshtat.count { it.dyshim }
                gabim = nr == 0
                statusi = if (nr == 0 && stok) "Në foto s'u gjet asnjë rresht. Provo një foto më të qartë ose shkruaji me dorë."
                else if (nr == 0) "Në foto s'u gjet asnjë rresht me afat. Provo një foto më të qartë ose shkruaji me dorë."
                else (if (nr == 1) "U lexua 1 rresht. Krahasoje" else "U lexuan $nr rreshta. Krahasoji") + " me foton dhe korrigjo ku duhet" +
                    (if (nDyshim == 0) "." else ". " + if (nDyshim == 1) "1 është shënuar me të verdhë si i paqartë." else "$nDyshim janë shënuar me të verdhë si të paqarta.")
                if (nr == 0) shtoRresht()
            }
        }
        punon = false
    }

    fun importo() {
        if (!Llogaria.leja("stokuImporto")) return
        val fid = folderi
        if (fid.isEmpty() || Dyqani.g.foldera.none { it["id"] == fid }) { Toast.trego("Zgjidh folderin ku do të importohen produktet."); return }
        var pa = 0
        val teVlefshem = rreshtat.filter { r ->
            if (r.barkodi.isBlank() && r.emri.isBlank() && r.furnizuesi.isBlank() && r.sasia.isBlank()) return@filter false
            if (r.barkodi.isBlank() || Afatet.lexoSasine(r.sasia) == "") { pa++; return@filter false }
            true
        }
        if (pa > 0) {
            Toast.trego(if (pa == 1) "1 rresht s'ka barkod ose sasi (numër i plotë). Plotësoje ose hiqe me ✕."
            else "$pa rreshta s'kanë barkod ose sasi (numër i plotë). Plotësoji ose hiqi me ✕.", 4000)
            return
        }
        if (teVlefshem.isEmpty()) { mbyll(); return }
        val celesat = HashSet<String>()
        teVlefshem.forEach { r ->
            val b = r.barkodi.trim()
            val e = Dyqani.produkti(fid, b)
            val emri = (e?.get("emri") as? String)?.ifEmpty { null } ?: r.emri.trim()
            // Emri dhe furnizuesi ekzistues mbeten (si te web-i); sasia i shtohet
            val furn = if ((e?.get("furnizuesi") as? String).isNullOrEmpty()) (if (paFurnizues) "" else r.furnizuesi.trim()).ifEmpty { null } else null
            Dyqani.ruajProduktin(fid, b, emri, Afatet.lexoSasine(r.sasia) as Long, furn)
            celesat.add(b)
        }
        StokuApp.vendosPref("import_folderi", fid)
        val nr = celesat.size
        Toast.trego((if (nr == 1) "U importua 1 produkt" else "U importuan $nr produkte") + " në folderin \"" + Dyqani.emriFolderit(fid) + "\"." +
            (if (teVlefshem.size != nr) " (disa rreshta u bashkuan te i njëjti barkod)" else ""), 4000)
        mbyll()
    }

    fun ruaj() {
        if (stok) { importo(); return }
        if (!Llogaria.leja("afatetShto") && !Llogaria.leja("afatetAI")) return
        var pa = 0
        val teVlefshem = rreshtat.filter { r ->
            if (r.barkodi.isBlank() && r.emri.isBlank() && r.data.isBlank()) return@filter false
            if (r.iso.isEmpty() || (r.barkodi.isBlank() && r.emri.isBlank()) || (r.sasia.isNotBlank() && Afatet.lexoSasine(r.sasia) == "")) { pa++; return@filter false }
            true
        }
        if (pa > 0) {
            Toast.trego(if (pa == 1) "1 rresht s'ka datë ose emër/barkod (ose sasia s'është numër). Plotësoje ose hiqe me ✕."
            else "$pa rreshta s'kanë datë ose emër/barkod (ose sasia s'është numër). Plotësoji ose hiqi me ✕.", 4000)
            return
        }
        if (teVlefshem.isEmpty()) { mbyll(); return }
        val tani = System.currentTimeMillis()
        // E njëjta datë e të njëjtit produkt s'shtohet dy herë
        val ekzistuese = HashSet<String>()
        Dyqani.g.afatet.forEach { a -> if (a["statusi"] != "hequr") ekzistuese.add(((a["m"] as? String) ?: "") + "|" + ((a["barkodi"] as? String)?.ifEmpty { null } ?: (a["emri"] as? String).orEmpty()) + "|" + a["data"]) }
        var perseritur = 0
        val teReja = ArrayList<Map<String, Any?>>()
        teVlefshem.forEachIndexed { i, r ->
            val b = r.barkodi.trim().replace(Regex("\\s+"), "")
            val celes = "|" + (b.ifEmpty { r.emri.trim() }) + "|" + r.iso
            if (!ekzistuese.add(celes)) { perseritur++; return@forEachIndexed }
            teReja.add(obj("id" to Afatet.idERe(), "barkodi" to b, "emri" to r.emri.trim(), "data" to r.iso, "sasia" to Afatet.lexoSasine(r.sasia),
                "furnizuesi" to if (paFurnizues) "" else r.furnizuesi.trim(), "statusi" to "aktiv", "krijuarSe" to tani + i, "ndryshuarSe" to tani,
                "krijuarNga" to (Llogaria.perdoruesi.value?.emri ?: ""), "ngaFoto" to true))
        }
        teReja.forEach { Dyqani.shtoAfatin(it) }
        val nk = teReja.count { Afatet.statusi(it) == "skaduar" }
        val nv = teReja.count { Afatet.statusi(it) == "afer" }
        Toast.trego((if (teReja.size == 1) "U ruajt 1 afat" else "U ruajtën ${teReja.size} afate") +
            (if (perseritur > 0) " (" + (if (perseritur == 1) "1 ekzistonte" else "$perseritur ekzistonin") + " tashmë)" else "") +
            (if (nk > 0) " · " + (if (nk == 1) "1 ka skaduar!" else "$nk kanë skaduar!") else "") +
            (if (nv > 0) " · " + (if (nv == 1) "1 skadon" else "$nv skadojnë") + " brenda 30 ditëve" else "") + ".", 5000)
        kurRuhet(if (nk > 0) "skaduar" else if (nv > 0) "afer" else "aktive")
        mbyll()
    }

    fun anuloLeximin() {
        if (rreshtat.any { it.barkodi.isNotBlank() || it.emri.isNotBlank() || (if (stok) it.furnizuesi else it.data).isNotBlank() }) anulo = true else mbyll()
    }

    Dialog(onDismissRequest = { anuloLeximin() }, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        Column(Modifier.fillMaxSize().background(n.bg).statusBarsPadding().navigationBarsPadding().imePadding()) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                ButonIkone(Ik.Mbrapa, "Anulo", { anuloLeximin() }, madhesia = 40.dp)
                Spacer(Modifier.width(12.dp))
                Text(if (stok) "Kontrollo listën" else "Kontrollo fletën", style = tx(26, 700, n.ink, -0.025), modifier = Modifier.weight(1f))
            }
            Column(Modifier.weight(1f).fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
                foto?.let { b ->
                    Image(b, "Fleta e fotografuar", contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxWidth().then(if (eMadhe) Modifier else Modifier.heightIn(max = 180.dp))
                            .clip(RoundedCornerShape(12.dp)).background(Color.Black).clickable { eMadhe = !eMadhe })
                    Spacer(Modifier.size(10.dp))
                }
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(if (gabim) n.expTint else n.surface2).padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    if (punon) { Rrotullues(); Spacer(Modifier.width(10.dp)) }
                    Text(statusi, style = tx(14, 400, if (gabim) n.expInk else n.ink2))
                }
                Spacer(Modifier.size(12.dp))
                if (stok) {
                    Text("Importo në folderin", style = tx(13, 600, n.ink3), modifier = Modifier.padding(start = 2.dp, bottom = 6.dp))
                    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        gj.foldera.forEach { f -> val id = f["id"] as String; Cip(Dyqani.emriFolderit(id), null, folderi == id) { folderi = id } }
                        if (Llogaria.leja("stokuFoldera")) Cip("+ Folder i ri…", null, false) { folderIRi = true }
                    }
                }
                rreshtat.forEachIndexed { i, r -> KartaERreshtit(i, r, paFurnizues, stok) { rreshtat.remove(r) } }
                if (!punon) Buton("+ Shto rresht me dorë", { shtoRresht() }, Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 16.dp), lloji = "dyte")
            }
            Row(Modifier.fillMaxWidth().background(n.surface).padding(horizontal = 20.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Buton("Anulo", { anuloLeximin() }, Modifier.weight(1f), lloji = "tekst")
                val nr = rreshtat.size
                val teksti = if (stok) (if (nr == 0) "Importo" else if (nr == 1) "Importo 1 produkt" else "Importo $nr produkte")
                else (if (nr == 0) "Ruaj" else if (nr == 1) "Ruaj 1 afat" else "Ruaj $nr afate")
                Buton(teksti, { ruaj() }, Modifier.weight(1.4f), aktiv = nr > 0 && !punon)
            }
        }
        ToastPamjaNeDialog()
    }
    if (anulo) Konfirmo("Të anulohet?", if (stok) "Rreshtat e lexuar nuk do të importohen." else "Rreshtat e lexuar nuk do të ruhen.",
        if (stok) "Anulo importin" else "Anulo leximin", mbyll = { anulo = false }) { anulo = false; mbyll() }
    if (folderIRi) {
        val para = remember { gj.foldera.map { it["id"] } }
        FolderIRiFlete {
            folderIRi = false
            Dyqani.g.foldera.firstOrNull { it["id"] !in para }?.let { folderi = it["id"] as String }
        }
    }
}

/** Toast-i duket edhe mbi dritaren e plotë të fletës */
@Composable
private fun ToastPamjaNeDialog() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) { ToastPamja(poshte = 90.dp) }
}

@Composable
private fun Rrotullues() {
    val n = N
    val k by rememberInfiniteTransition(label = "rrotullimi").animateFloat(0f, 360f, infiniteRepeatable(tween(800, easing = LinearEasing), RepeatMode.Restart), label = "k")
    Box(Modifier.size(20.dp).rotate(k).drawBehind {
        drawArc(n.accent, -90f, 270f, false, style = Stroke(2.5.dp.toPx()), topLeft = Offset.Zero, size = size)
    })
}

@Composable
private fun KartaERreshtit(i: Int, r: Rreshti, paFurnizues: Boolean, stok: Boolean, hiq: () -> Unit) {
    val n = N
    val iso = r.iso
    val st = if (iso.isNotEmpty()) Afatet.statusi(mapOf("data" to iso)) else ""
    val ngj = when (st) { "skaduar" -> n.exp; "afer" -> n.near; "ok" -> n.ok; else -> n.line }
    val forma = RoundedCornerShape(14.dp)
    // Shiriti i ngjyrës majtas (6 px) sipas statusit të datës; i verdhë rreth kartës kur AI-ja s'është e sigurt
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp).clip(forma).background(n.surface)
        .drawBehind { drawRect(ngj, size = Size(6.dp.toPx(), size.height)) }
        .border(if (r.dyshim) 2.dp else 1.dp, if (r.dyshim) n.near else n.line, forma).padding(start = 6.dp)) {
        Column(Modifier.weight(1f).padding(start = 10.dp, end = 10.dp, top = 10.dp, bottom = 4.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Rreshti ${i + 1}" + if (r.dyshim) " · ⚠ kontrolloje" else "", style = tx(12, 700, n.muted), modifier = Modifier.weight(1f).padding(start = 2.dp))
                Box(Modifier.size(30.dp).clip(CircleShape).clickable(onClick = hiq), contentAlignment = Alignment.Center) {
                    Icon(Ik.X, "Hiq rreshtin", Modifier.size(16.dp), tint = n.muted)
                }
            }
            Fusha(r.barkodi, { r.barkodi = it.trim() }, Modifier.fillMaxWidth(), "Barkodi", tastiera = KeyboardType.Ascii, lartesia = 44.dp,
                veprimi = ImeAction.Next, kurVeprim = { if (r.emri.isBlank()) r.emri = Dyqani.emriNgaBarkodi(r.barkodi) })
            Fusha(r.emri, { r.emri = it }, Modifier.fillMaxWidth(), "Emri i produktit", lartesia = 44.dp, veprimi = ImeAction.Next)
            if (stok) Fusha(r.sasia, { r.sasia = it.take(30) }, Modifier.fillMaxWidth(), "Sasia", tastiera = KeyboardType.Phone, lartesia = 44.dp,
                veprimi = ImeAction.Next, kurVeprim = { if (Afatet.sasiaSiShume(r.sasia).isNotEmpty()) r.sasia = Afatet.lexoSasine(r.sasia).toString() })
            else Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Fusha(r.data, { v -> r.data = if (v.length < r.data.length) v else Afatet.formatoDatenGjateShkrimit(v); r.dyshim = false },
                    Modifier.weight(1f), "Data (DD-MM-VV)", tastiera = KeyboardType.Number, lartesia = 44.dp, veprimi = ImeAction.Next)
                Fusha(r.sasia, { r.sasia = it.take(30) }, Modifier.weight(1f), "Sasia", tastiera = KeyboardType.Phone, lartesia = 44.dp, veprimi = ImeAction.Next,
                    kurVeprim = { Afatet.lexoSasine(r.sasia).let { s -> if (s != "") r.sasia = s.toString() } })
            }
            if (!paFurnizues) Fusha(r.furnizuesi, { r.furnizuesi = it }, Modifier.fillMaxWidth(), "Furnizuesi", lartesia = 44.dp)
            if (r.dataOrigjinale.isNotEmpty() || (iso.isNotEmpty() && !r.iRi)) {
                Text((if (r.dataOrigjinale.isNotEmpty()) "Në fletë: \"" + r.dataOrigjinale + "\"" else "") +
                    (if (iso.isNotEmpty()) " → " + Afatet.pershkrimi(mapOf("data" to iso)) else ". Data s'u kuptua, zgjidhe me dorë."),
                    style = tx(12, if (iso.isEmpty()) 700 else 400, if (iso.isEmpty()) n.nearInk else n.muted), modifier = Modifier.padding(start = 2.dp, bottom = 6.dp))
            }
        }
    }
}


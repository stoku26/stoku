package site.stoku.vendas.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.StateFlow
import site.stoku.logjika.Furnizuesit
import site.stoku.logjika.Kujtesa
import site.stoku.logjika.Lejet
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Regjistri
import java.util.Locale

/*
 * Cilësimet → Stoku → Furnizuesit, Furnizuesit e rinj, Produktet e reja, Produktet (app-tel.js: rifreskoFurnizuesit,
 * vizatoKujtesen, rifreskoPritjen). I sheh kushdo që ka lejen "stoku"; i ndryshon vetëm administratori.
 */

/** Numrat dhe statuset e Stoku-t te Cilësimet (rifreskoHyrjetEStokut, rifreskoStatusinEStokut te web-i) */
object KujtesaUI {
    val versioni: StateFlow<Int> get() = Regjistri.versioni
    class Hyrjet(val furnizues: Int, val furnPritje: Int, val produkte: Int, val produktePritje: Int)

    fun furnizuesit(): List<Furnizuesit.Rreshti> {
        val g = Dyqani.g; val k = Regjistri.kujtesa
        return Furnizuesit.lista(g.afatet, g.produktet, k.lista(), k.furnizuesit())
    }

    fun hyrjetEStokut(): Hyrjet {
        val l = Regjistri.kujtesa.lista()
        val nP = l.count { it.nePritje }
        val lf = furnizuesit()
        val nFP = lf.count { it.nePritje }
        return Hyrjet(lf.size - nFP, nFP, l.size - nP, nP)
    }

    /** Te menyja: administratori sheh sa produkte presin kontrollin */
    fun numriPerKontroll(): Int = try { if (Llogaria.eshteAdmin()) Regjistri.kujtesa.numriNePritje() else 0 } catch (e: Exception) { 0 }
}

private val SQ = Locale.forLanguageTag("sq")
private const val KUJ_MAKS = 100

fun sasiaETekst(n: Int, nje: String, shume: String): String = "$n " + (if (n == 1) nje else shume)

private fun nenTekstiFurnizuesit(f: Furnizuesit.Rreshti): String =
    listOf(if (f.afate > 0) sasiaETekst(f.afate, "afat", "afate") else "", if (f.produkte > 0) sasiaETekst(f.produkte, "produkt", "produkte") else "",
        if (f.nePritje && f.nga.isNotEmpty()) "nga " + f.nga.joinToString(", ") else "").filter { it.isNotEmpty() }.joinToString(" · ").ifEmpty { "Pa produkte" }

/** .ops-furn > * + *::before: vija ndarëse mbi çdo rresht përveç të parit */
@Composable
private fun Ndaresi(i: Int) { if (i > 0) VijaGrupit() }

/** .ops-furn-edit: kutia blu e çelët me etiketën, fushat, gabimin dhe "Fshije / Anulo / Ruaj" */
@Composable
private fun KutiaENdryshimit(etiketa: String, gabim: String, fshij: () -> Unit, anulo: () -> Unit, ruaj: () -> Unit, fushat: @Composable () -> Unit) {
    val n = N
    Column(Modifier.fillMaxWidth().background(n.accentTint).padding(horizontal = 16.dp, vertical = 14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(etiketa, style = txR(12.5f, 400, n.ink4))
        fushat()
        if (gabim.isNotEmpty()) Text(gabim, style = txR(12.5f, 600, n.exp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ButonOps("Fshije", fshij, Modifier.weight(1f), kuqe = true)
            ButonOps("Anulo", anulo, Modifier.weight(1f))
            Buton("Ruaj", ruaj, Modifier.weight(1f), lartesia = 44.dp)
        }
    }
}

/** .ops-me-shume: "Shfaq edhe 100 produkte (mbeten 240)" */
@Composable
private fun ButoniMeShume(shfaqur: Int, gjithsej: Int, vije: Boolean, onClick: () -> Unit) {
    val n = N
    val mbeten = gjithsej - shfaqur; val nr = minOf(KUJ_MAKS, mbeten)
    if (vije) VijaGrupit()
    Box(Modifier.fillMaxWidth().heightIn(min = 50.dp).clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 14.dp), contentAlignment = Alignment.Center) {
        Text("Shfaq edhe " + sasiaETekst(nr, "produkt", "produkte") + (if (nr < mbeten) " (mbeten $mbeten)" else ""),
            style = txF(15f, 600, n.accentText), textAlign = TextAlign.Center)
    }
}

// ---------------- Furnizuesit / Furnizuesit e rinj ----------------
@Composable
fun FurnizuesitFaqja(pritje: Boolean, mbrapa: () -> Unit) {
    val p by Llogaria.perdoruesi.collectAsState()
    val v by KujtesaUI.versioni.collectAsState()
    val dq by Dyqani.gjendja.collectAsState()
    val admin = Lejet.eshteAdmin(p?.emri)
    var kerkimi by rememberSaveable { mutableStateOf("") }
    var neEditim by remember { mutableStateOf<String?>(null) }
    var bashkimi by remember { mutableStateOf<Triple<Furnizuesit.Rreshti, String, String>?>(null) } // (f, ekzistuesi, emri i ri)
    var fshirja by remember { mutableStateOf<Furnizuesit.Rreshti?>(null) }
    if (!admin) neEditim = null
    LaunchedEffect(admin) { if (admin) Regjistri.ruajFurnizuesitEMiratuar() }
    val teGjithe = remember(v, dq) { KujtesaUI.furnizuesit() }
    // v212: të ruajturit nga administratori në krye, më i riu i pari
    val lista = remember(teGjithe, pritje) { Furnizuesit.renditSipasRuajtjes(teGjithe.filter { it.nePritje == pritje }) { it.koha } }

    fun riemerto(f: Furnizuesit.Rreshti, ekz: String, emriRi: String) {
        var (nA, nPr) = Dyqani.riemertoFurnizuesin(f.emri, emriRi)
        if (ekz.isNotEmpty() && ekz != emriRi) { // bashkimi: edhe tjetri merr saktësisht emrin e shkruar
            val (a2, p2) = Dyqani.riemertoFurnizuesin(ekz, emriRi); nA += a2; nPr += p2
        }
        var nKuj = 0
        try { nKuj = Regjistri.kujtesa.riemertoFurnizuesin(f.emri, emriRi); if (ekz.isNotEmpty() && ekz != emriRi) nKuj += Regjistri.kujtesa.riemertoFurnizuesin(ekz, emriRi) } catch (e: Exception) { }
        neEditim = null
        val nP = maxOf(nPr, nKuj)
        val det = listOf(if (nA > 0) sasiaETekst(nA, "afat", "afate") else "", if (nP > 0) sasiaETekst(nP, "produkt", "produkte") else "").filter { it.isNotEmpty() }.joinToString(", ")
        Toast.trego("\"${f.emri}\" u bë \"$emriRi\"" + (if (det.isNotEmpty()) " ($det)" else "") + ".")
    }

    FaqjaECilesimeve(if (pritje) "Furnizuesit e rinj" else "Furnizuesit", mbrapa) {
        IntroOps(if (pritje) (if (admin) "Furnizuesit e rinj, të kolegëve dhe ata që i shton ti. Prek njërin: ruaje ashtu siç është ose ndrysho emrin (ndryshon te krejt produktet e tij), pastaj kalon te Furnizuesit. Fshirja e produkteve s'e fshin furnizuesin."
            else "Furnizuesit e rinj. I kontrollon administratori, pastaj kalojnë te Furnizuesit.")
        else if (admin) "Furnizuesit e regjistrit të Stoku-t (krejt llogaritë). Ndrysho emrin e një furnizuesi: ndryshon te krejt afatet dhe produktet. Nëse i jep emrin e një furnizuesi tjetër, të dy bashkohen në një."
        else "Furnizuesit e regjistrit të Stoku-t (të njëjtët për krejt llogaritë) dhe të afateve të tua. Emrat i ndryshon vetëm administratori.")
        val q = kerkimi.trim().lowercase(SQ)
        if (!pritje && (lista.size >= 8 || q.isNotEmpty()))
            Fusha(kerkimi, { kerkimi = it; neEditim = null }, Modifier.fillMaxWidth().padding(bottom = 10.dp), "Kërko furnizuesin", ikona = Ik.Kerko)
        val fil = if (pritje || q.isEmpty()) lista else lista.filter { it.emri.lowercase(SQ).contains(q) }
        GrupiOps {
            if (fil.isEmpty()) BoshOps(if (pritje) "Asnjë furnizues i ri për kontroll." else if (lista.isNotEmpty()) "Asnjë furnizues me këtë emër."
                else "Ende s'ka furnizues. Shfaqen këtu kur shton afate me furnizues.")
            fil.forEachIndexed { i, f ->
                if (f.emri == neEditim && admin) {
                    Ndaresi(i)
                    var emri by remember(f.emri) { mutableStateOf(f.emri) }
                    var gabim by remember(f.emri) { mutableStateOf("") }
                    val fokusi = remember { FocusRequester() }
                    fun ruaj() {
                        val emriRi = emri.replace(Regex("\\s+"), " ").trim()
                        if (emriRi.isEmpty()) { gabim = "Shkruaj emrin e furnizuesit."; return }
                        if (emriRi == f.emri) { // pa ndryshim emri: furnizuesi i ri (në pritje) ruhet si i kontrolluar
                            if (f.nePritje) { Regjistri.kujtesa.regjistroFurnizuesit(listOf(f.emri), true); Toast.trego("\"${f.emri}\" kaloi te Furnizuesit.") }
                            neEditim = null; return
                        }
                        val ekz = Furnizuesit.ekzistues(teGjithe, emriRi, f.emri)
                        if (ekz.isNotEmpty()) bashkimi = Triple(f, ekz, emriRi) else riemerto(f, "", emriRi)
                    }
                    KutiaENdryshimit("Emri i ri për \"${f.emri}\" (${nenTekstiFurnizuesit(f)})", gabim, { fshirja = f }, { neEditim = null }, { ruaj() }) {
                        Fusha(emri, { emri = it.take(80); gabim = "" }, Modifier.fillMaxWidth(), lartesia = 46.dp, fokusi = fokusi, kurVeprim = { ruaj() })
                    }
                    LaunchedEffect(f.emri) { kotlinx.coroutines.delay(80); try { fokusi.requestFocus() } catch (e: Exception) { } }
                } else RreshtListe((f.emri.firstOrNull()?.toString() ?: "?").uppercase(SQ), if (f.nePritje) "vjollce" else "portokalli", f.emri,
                    nenTekstiFurnizuesit(f), vije = i > 0, djathtas = if (admin) "laps" else null, onClick = if (admin) ({ neEditim = f.emri }) else null)
            }
        }
    }
    bashkimi?.let { (f, ekz, emriRi) ->
        val tjetri = teGjithe.firstOrNull { it.emri == ekz }
        Konfirmo("Të bashkohen furnizuesit?", "\"${f.emri}\" (${nenTekstiFurnizuesit(f)}) dhe \"$ekz\" (${tjetri?.let { nenTekstiFurnizuesit(it) } ?: "Pa produkte"}) do të bashkohen në një furnizues: \"$emriRi\".",
            "Bashkoji", rrezik = false, mbyll = { bashkimi = null }) { if (Llogaria.eshteAdmin()) riemerto(f, ekz, emriRi) }
    }
    fshirja?.let { f ->
        Konfirmo("Ta fshijmë furnizuesin?", "\"${f.emri}\" hiqet nga lista e furnizuesve. Produktet e tij mbeten te Produktet, pa furnizues. Afatet e tua s'ndryshojnë.",
            "Fshije", mbyll = { fshirja = null }) {
            if (!Llogaria.eshteAdmin()) return@Konfirmo
            val nr = Regjistri.kujtesa.fshijFurnizuesin(f.emri)
            neEditim = null
            Toast.trego("\"${f.emri}\" u fshi" + (if (nr > 0) ". " + sasiaETekst(nr, "produkt mbeti", "produkte mbetën") + " pa furnizues." else "."))
        }
    }
}

// ---------------- Produktet / Produktet e reja ----------------
@Composable
fun ProduktetFaqja(pritje: Boolean, mbrapa: () -> Unit) {
    val p by Llogaria.perdoruesi.collectAsState()
    val v by KujtesaUI.versioni.collectAsState()
    val admin = Lejet.eshteAdmin(p?.emri)
    var kerkimi by rememberSaveable { mutableStateOf("") }
    var neEditim by remember { mutableStateOf<String?>(null) }
    var saShfaqen by remember { mutableIntStateOf(KUJ_MAKS) }
    if (!admin) neEditim = null
    val lista = remember(v, pritje) {
        val te = Regjistri.kujtesa.lista().filter { it.nePritje == pritje }
        if (pritje) te.sortedByDescending { it.koha } // më të rejat lart
        else Furnizuesit.renditSipasRuajtjes(te, Furnizuesit::kohaERuajtjes) // v212: të ruajturat e fundit në krye
    }
    FaqjaECilesimeve(if (pritje) "Produktet e reja" else "Produktet", mbrapa) {
        IntroOps(if (pritje) (if (admin) "Produktet e reja, të kolegëve dhe ato që i shton ti. Kontrolloji emrat dhe ruaji: pastaj kalojnë te Produktet."
            else "Produktet e reja. I kontrollon administratori, pastaj kalojnë te Produktet.")
        else if (admin) "Emri dhe furnizuesi që Stoku i mban mend për çdo barkod; krejt llogaritë e Stoku-t i shohin kur skanojnë. Produktet e reja (të kujtdo, edhe ato që i shton ti) dalin këtu pasi t'i kontrollosh te Produktet e reja. Atë që e ndryshon ti s'e ndryshon askush tjetër. Prek një produkt për ta ndryshuar."
        else "Regjistri i Stoku-t: emri dhe furnizuesi për çdo barkod, i njëjtë për krejt llogaritë; plotësohen vetë kur skanon. Produktet e reja i kontrollon dhe i ndryshon vetëm administratori.")
        val q = kerkimi.trim().lowercase(SQ)
        if (!pritje && (lista.size >= 8 || q.isNotEmpty()))
            Fusha(kerkimi, { kerkimi = it; neEditim = null; saShfaqen = KUJ_MAKS }, Modifier.fillMaxWidth().padding(bottom = 10.dp), "Kërko emrin, barkodin ose furnizuesin", ikona = Ik.Kerko)
        val fil = if (pritje || q.isEmpty()) lista else lista.filter { (it.emri + " " + it.barkodi + " " + it.furnizuesi).lowercase(SQ).contains(q) }
        GrupiOps {
            if (fil.isEmpty()) BoshOps(if (pritje) "Asnjë produkt i ri për kontroll." else if (lista.isNotEmpty()) "Asnjë produkt me këtë kërkim."
                else "Ende s'ka produkte. Shfaqen këtu kur ruan një afat ose produkt me barkod.")
            fil.take(saShfaqen).forEachIndexed { i, x ->
                if (x.barkodi == neEditim && admin) { Ndaresi(i); NdryshoProduktin(x) { neEditim = null } }
                else RreshtListe(((x.emri.ifEmpty { x.barkodi }).firstOrNull()?.toString() ?: "?").uppercase(SQ), if (x.nePritje) "portokalli" else "blu",
                    x.emri.ifEmpty { "Pa emër" }, listOf(x.barkodi, x.furnizuesi, if (!x.ngaAdmini && x.nga.isNotEmpty()) "nga " + x.nga else "").filter { it.isNotEmpty() }.joinToString(" · "),
                    vije = i > 0, djathtas = if (admin) "laps" else null, onClick = if (admin) ({ neEditim = x.barkodi }) else null)
            }
            if (fil.size > saShfaqen) ButoniMeShume(saShfaqen, fil.size, true) { saShfaqen += KUJ_MAKS }
        }
    }
}

@Composable
private fun NdryshoProduktin(x: Kujtesa.Produkti, mbyll: () -> Unit) {
    var emri by remember(x.barkodi) { mutableStateOf(x.emri) }
    var furn by remember(x.barkodi) { mutableStateOf(x.furnizuesi) }
    var sugjerimet by remember { mutableStateOf(false) }
    val fEmri = remember { FocusRequester() }
    val fFurn = remember { FocusRequester() }
    fun ruaj() {
        if (!Llogaria.eshteAdmin()) { mbyll(); return }
        Regjistri.kujtesa.vendos(x.barkodi, emri, furn)
        mbyll()
        Toast.trego((if (x.nePritje) "U ruajt dhe kaloi te Produktet: " else "U ruajt: ") + emri.trim().ifEmpty { x.barkodi })
    }
    KutiaENdryshimit("Barkodi ${x.barkodi}" + (if (x.nePritje && x.nga.isNotEmpty()) " · e shkroi ${x.nga}" else ""), "", {
        if (Llogaria.eshteAdmin()) { Regjistri.kujtesa.fshij(x.barkodi); Toast.trego("\"${x.emri.ifEmpty { x.barkodi }}\" u fshi nga produktet.") }
        mbyll()
    }, mbyll, { ruaj() }) {
        Fusha(emri, { emri = it.take(120) }, Modifier.fillMaxWidth(), "Emri i produktit", lartesia = 46.dp, fokusi = fEmri,
            veprimi = androidx.compose.ui.text.input.ImeAction.Next, kurVeprim = { try { fFurn.requestFocus() } catch (e: Exception) { } })
        Fusha(furn, { furn = it.take(80); sugjerimet = true }, Modifier.fillMaxWidth(), "Furnizuesi", lartesia = 46.dp, fokusi = fFurn,
            kurVeprim = { sugjerimet = false; ruaj() })
        if (sugjerimet) SugjerimetEFurnizuesit(furn, { furn = it; sugjerimet = false }) { sugjerimet = false }
    }
    LaunchedEffect(x.barkodi) { kotlinx.coroutines.delay(80); try { fEmri.requestFocus() } catch (e: Exception) { } }
}

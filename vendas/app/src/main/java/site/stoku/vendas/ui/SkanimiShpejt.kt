package site.stoku.vendas.ui

import androidx.compose.foundation.background
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import site.stoku.logjika.Afatet
import site.stoku.logjika.Bashkimi
import site.stoku.logjika.Obj
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Llogaria

/*
 * v263 (Hyrja 22): "Skanim i shpejtë" brenda një folderi te Stoku (si #btnSkanimShpejt te web-i). Kamera lart (i njëjti skaner:
 * votimi 7 nga 10, vetëm brenda kutisë) s'mbyllet; çdo barkod i pranuar ruhet menjëherë në folder (+1). Produkti i ri krijohet
 * edhe pa emër (me emrin/furnizuesin kur njihen nga barkodi). I njëjti barkod s'del dy herë: i rritet sasia, jo më shpesh se
 * çdo 1.5 s sa kohë shihet (si numërimi i vazhdueshëm). Poshtë: gjithsej, lista e kësaj seance (i riu lart, i fundit i
 * shënuar) dhe te çdo produkt fusha për copë shtesë, pa dritare.
 */
@Composable
fun SkanimiShpejt(folderId: String, mbyll: () -> Unit) {
    val radha = remember { mutableStateListOf<String>() } // barkodet e kësaj seance, i riu lart
    val sasite = remember { mutableStateMapOf<String, Long>() } // sa copë u shtuan në këtë seancë
    var fundit by remember { mutableStateOf<String?>(null) } // i shtuari i fundit (shënohet dhe lista shkon te ai)
    var ngjarja by remember { mutableStateOf(0) }
    val g by Dyqani.gjendja.collectAsState()
    if (g.foldera.none { it["id"] == folderId }) {
        LaunchedEffect(folderId) { Toast.trego("Folderi u fshi nga një pajisje tjetër.", 4000); mbyll() }
        return
    }

    // sasia: +1 nga kamera ose numri i shkruar (edhe negativ, për korrigjim; stoku s'bëhet negativ)
    fun shto(b0: String, sasia: Long): Boolean {
        val b = b0.trim()
        if (b.isEmpty() || sasia == 0L) return false
        if (Dyqani.g.foldera.none { it["id"] == folderId }) return false
        if (duketSiDiçkaTjeter(b)) { Toast.trego("Kjo nuk duket si barkod produkti (ngjan me kod QR ose tekst). Provo përsëri."); return false }
        val e = Dyqani.produkti(folderId, b)
        if (!Llogaria.leja(if (e != null) "stokuNdrysho" else "stokuShto")) {
            Toast.trego(if (e != null) "S'ke leje ta ndryshosh sasinë e këtij produkti." else "Ky barkod s'është në këtë folder.", 3000)
            return false
        }
        if (e != null) Dyqani.vendosSasine(Bashkimi.celesi(folderId, b), sasiaE(e) + sasia)
        else {
            if (sasia < 0) return false
            val f = if (Llogaria.eshteMerchandiser()) null else Dyqani.furnizuesiNgaBarkodi(b).takeIf { it.isNotEmpty() }
            Dyqani.ruajProduktin(folderId, b, Dyqani.emriNgaBarkodi(b), sasia, f)
        }
        sasite[b] = maxOf(0L, (sasite[b] ?: 0L) + sasia)
        if (b !in radha) radha.add(0, b)
        fundit = b; ngjarja++
        return true
    }

    Skaneri(mbyll = mbyll, shpejt = { b -> shto(b, 1) }, paneli = {
        PaneliShpejt(folderId, radha, sasite, g.produktet, fundit, ngjarja, { b, v -> shto(b, v) }, mbyll)
    })
}

@Composable
internal fun PaneliShpejt(folderId: String, radha: List<String>, sasite: Map<String, Long>, produktet: Map<String, Obj>,
                         fundit: String?, ngjarja: Int, shto: (String, Long) -> Boolean, mbyll: () -> Unit) {
    val n = N
    val gjithsej = sasite.values.sum()
    val lista = rememberLazyListState()
    val tastieraHapur = WindowInsets.ime.getBottom(LocalDensity.current) > 0
    // Produkti i shtuar duket në listë (përveç kur po shkruhet te një fushë: lista s'lëviz nën gisht)
    LaunchedEffect(ngjarja) {
        val i = radha.indexOf(fundit ?: return@LaunchedEffect)
        if (i < 0 || tastieraHapur) return@LaunchedEffect
        val info = lista.layoutInfo
        val duket = info.visibleItemsInfo.any { it.index == i && it.offset >= info.viewportStartOffset && it.offset + it.size <= info.viewportEndOffset }
        if (!duket) lista.animateScrollToItem(i)
    }
    Column(Modifier.fillMaxSize().background(n.bg)) {
        Row(Modifier.fillMaxWidth().background(n.surface).padding(start = 16.dp, end = 12.dp, top = 10.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Gjithsej: $gjithsej copë", style = tx(17, 700, n.ink))
                Text(Dyqani.emriFolderit(folderId) + " · " + radha.size + " " + (if (radha.size == 1) "produkt" else "produkte"),
                    style = tx(12, 500, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Buton("Mbaro", mbyll, lloji = "dyte", lartesia = 42.dp)
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(n.line))
        if (radha.isEmpty()) Text("Skano barkodet njërin pas tjetrit: secili shtohet menjëherë në këtë folder. I njëjti barkod s'del dy herë, i rritet sasia.",
            style = tx(14, 400, n.muted), textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(24.dp))
        else LazyColumn(Modifier.fillMaxWidth().weight(1f), state = lista, contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp)) {
            items(radha, key = { it }) { b ->
                RreshtiShpejt(b, sasite[b] ?: 0L, produktet[Bashkimi.celesi(folderId, b)], b == fundit) { v -> shto(b, v) }
            }
        }
    }
}

@Composable
private fun RreshtiShpejt(b: String, nr: Long, p: Obj?, iFundit: Boolean, shto: (Long) -> Boolean) {
    val n = N
    val fokusi = LocalFocusManager.current
    var t by remember { mutableStateOf("") }
    fun shtoTekstin() {
        val ts = t.trim()
        if (ts.isEmpty()) { fokusi.clearFocus(); return }
        if (!Regex("^-?\\d+$").matches(ts)) { Toast.trego("Shkruaj sasinë (numër i plotë)."); return }
        if (!Afatet.sasiaEPranueshme(ts)) { Toast.trego(Afatet.SASIA_E_MADHE, 4500); return }
        if (ts.toLong() == 0L || shto(ts.toLong())) { t = ""; fokusi.clearFocus() }
    }
    Row(Modifier.fillMaxWidth().padding(vertical = 3.dp).clip(RoundedCornerShape(12.dp)).background(if (iFundit) n.accentTint else Color.Transparent)
        .padding(horizontal = 6.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Column(Modifier.weight(1f)) {
            val em = (p?.get("emri") as? String).orEmpty()
            Text(em.ifEmpty { "(pa emër)" }, style = tx(15, 600, if (em.isEmpty()) n.faint else n.ink), maxLines = 2, overflow = TextOverflow.Ellipsis)
            Text(b + (p?.let { " · në stok " + sasiaE(it) } ?: ""), style = txMono(11.5f, n.faint), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(nr.toString(), style = tx(20, 700, n.accentText))
            Text("copë", style = tx(11, 500, n.muted))
        }
        Fusha(t, { t = it.filter { c -> c.isDigit() || c == '-' }.take(7) }, Modifier.width(84.dp), "+ copë", tastiera = KeyboardType.Number,
            veprimi = ImeAction.Done, kurVeprim = { shtoTekstin() }, lartesia = 44.dp, stili = tx(16, 600).copy(textAlign = TextAlign.Center))
        if (t.isNotBlank()) Buton("Shto", { shtoTekstin() }, lartesia = 44.dp)
    }
    Box(Modifier.fillMaxWidth().padding(horizontal = 6.dp).height(1.dp).background(n.line2))
}

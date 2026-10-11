package site.stoku.ora

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.PositionIndicator
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Ngjyra kryesore: ndiqet zgjedhja te Cilësimet → Pamja (e verdha e Stoku-t si parazgjedhje)
val Verdhe: Color get() = Tema.theks
val Kuqe = Color(0xFFFF5A4E)
val Gri = Color(0xFF9AA0A8)
val Kartela = Color(0xFF1D2026)
val Gjelber = Color(0xFF3DDC84)
// Ngjyra e afateve që skadojnë së shpejti (gjithmonë e verdhë, si te telefoni)
val AfatAfer = Color(0xFFF5B70A)

// Rifreskimi automatik: vetëm kur hyn në aplikacion (hapje ose rikthim); përndryshe me butonin poshtë
object Rikthimi {
    var n by mutableStateOf(0)
}

class MainActivity : ComponentActivity() {
    override fun onResume() { super.onResume(); Rikthimi.n++ }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Tema.ngarko(this)
        setContent {
            MaterialTheme(colors = Colors(primary = Verdhe, onPrimary = Color.Black, surface = Kartela)) {
                Aplikacioni()
            }
        }
    }
}

@Composable
fun Aplikacioni() {
    val ctx = LocalContext.current
    var lidhur by remember { mutableStateOf(Api.lidhur(ctx)) }
    val scope = rememberCoroutineScope()
    if (!lidhur) Lidhja(kurLidhet = { lidhur = true })
    else ListaEkrani(kurShkeputet = { scope.launch { Api.shkeput(ctx); lidhur = false } })
}

// Ekrani i parë: kodi që shkruhet te telefoni. Kodi ndërrohet çdo 15 sekonda; lidhja kontrollohet çdo 3 sekonda.
const val KODI_SEKONDA = 15

@Composable
fun Lidhja(kurLidhet: () -> Unit) {
    val ctx = LocalContext.current
    var kodi by remember { mutableStateOf(Api.kodiIRi(ctx)) }
    var mbeten by remember { mutableStateOf(KODI_SEKONDA) }
    var gabim by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        var kohaKodit = System.currentTimeMillis()
        var kontrolli = 0L
        while (true) {
            val tani = System.currentTimeMillis()
            if (tani - kohaKodit >= KODI_SEKONDA * 1000L) {
                kodi = Api.kodiIRi(ctx); kohaKodit = tani; kontrolli = 0L
            }
            mbeten = (KODI_SEKONDA - ((tani - kohaKodit) / 1000L).toInt()).coerceIn(1, KODI_SEKONDA)
            if (tani - kontrolli >= 3000L) {
                kontrolli = tani
                try {
                    if (Api.kontrolloLidhjen(ctx)) { kurLidhet(); break }
                    gabim = false
                } catch (e: Exception) { gabim = true }
                kodi = Api.kodi(ctx) // mund të ndryshojë kur kodi është i zënë
            }
            delay(250)
        }
    }
    Column(
        modifier = Modifier.fillMaxSize().background(Color.Black).padding(horizontal = 26.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Logo()
        Spacer(Modifier.height(6.dp))
        Text("Lidhe me telefonin", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
        Text(kodi.substring(0, 3) + " " + kodi.substring(3), fontSize = 34.sp, fontWeight = FontWeight.ExtraBold, color = Verdhe, letterSpacing = 3.sp)
        Text("Kod i ri pas $mbeten s", fontSize = 11.sp, color = Color.White)
        Text(
            if (gabim) "S'ka internet. Po provoj prapë…" else "Te telefoni: Cilësimet → Ora e dorës → Lidh orën",
            fontSize = 11.sp, color = Gri, textAlign = TextAlign.Center,
        )
    }
}

@Composable
fun Logo() {
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.layout.Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(12.dp).background(Verdhe, androidx.compose.foundation.shape.RoundedCornerShape(3.dp)))
            Spacer(Modifier.size(6.dp))
            Text("STOKU", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp, color = Color.White)
        }
    }
}

// Ekranet brenda listës
sealed class Pamja {
    object Lista : Pamja()
    data class Detaji(val a: Afat, val sot: Boolean, val skaduar: Boolean = false) : Pamja()
    data class HiqKrejt(val l: List<Afat>) : Pamja()
    object Cilesimet : Pamja()
    object Ngjyrat : Pamja()
    data class Kolegu(val a: Afat) : Pamja()
    data class Hequr(val a: Afat) : Pamja()
    data class Derguar(val tekst: String) : Pamja()
}

@Composable
fun ListaEkrani(kurShkeputet: () -> Unit) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    var lista by remember { mutableStateOf(Api.listaERuajtur(ctx)) }
    var duke by remember { mutableStateOf(true) }
    var gabim by remember { mutableStateOf<String?>(null) }
    var pamja by remember { mutableStateOf<Pamja>(Pamja.Lista) }

    suspend fun ngarko() {
        duke = true
        val fillimi = System.currentTimeMillis()
        try {
            lista = Api.merrListen(ctx); gabim = null
            Api.rifreskoTileDheKomplikacionin(ctx)
        } catch (e: PaLidhje) {
            kurShkeputet(); return
        } catch (e: Exception) {
            gabim = "S'ka lidhje me serverin. Lista mund të jetë e vjetër."
        }
        delay((700L - (System.currentTimeMillis() - fillimi)).coerceAtLeast(0L))
        duke = false
    }
    var iRi by remember { mutableStateOf<Pair<Int, String>?>(null) }
    var dukePerditesuar by remember { mutableStateOf(false) }
    LaunchedEffect(Rikthimi.n) { ngarko() }
    LaunchedEffect(Unit) { iRi = Perditesimi.kontrollo(ctx) }
    BackHandler(enabled = pamja !is Pamja.Lista) { pamja = if (pamja is Pamja.Ngjyrat) Pamja.Cilesimet else Pamja.Lista }

    when (val p = pamja) {
        is Pamja.Detaji -> Detaji(
            a = p.a,
            sot = p.sot,
            skaduar = p.skaduar,
            ekipa = lista?.ekipa == true,
            kurHiqet = {
                val a = p.a
                pamja = Pamja.Hequr(a)
                lista = lista?.let { l -> l.copy(sot = l.sot.filter { it.id != a.id }, java = l.java.filter { it.id != a.id }, skaduaraL = l.skaduaraL.filter { it.id != a.id },
                    skaduara = if (l.skaduaraL.any { it.id == a.id }) (l.skaduara - 1).coerceAtLeast(0) else l.skaduara) }
                scope.launch {
                    try { Api.hiq(ctx, a.id) } catch (e: PaLidhje) { kurShkeputet() } catch (e: Exception) { gabim = "Heqja s'u ruajt. Provo prapë." }
                    Api.rifreskoTileDheKomplikacionin(ctx)
                }
            },
            kurKerkon = { pamja = Pamja.Kolegu(p.a) },
            mbrapa = { pamja = Pamja.Lista },
        )
        is Pamja.HiqKrejt -> HiqKrejt(
            n = p.l.size,
            kurPo = {
                val ids = p.l.map { it.id }.toSet()
                lista = lista?.let { l -> l.copy(skaduaraL = l.skaduaraL.filter { it.id !in ids }, skaduara = (l.skaduara - ids.size).coerceAtLeast(0)) }
                pamja = Pamja.Derguar(if (ids.size == 1) "U shënua 1 produkt: hequr nga rafti" else "U shënuan ${ids.size} produkte: hequr nga rafti")
                scope.launch {
                    var deshtoi = 0
                    for (id in ids) {
                        try { Api.hiq(ctx, id) } catch (e: PaLidhje) { kurShkeputet(); return@launch } catch (e: Exception) { deshtoi++ }
                    }
                    if (deshtoi > 0) gabim = "$deshtoi heqje s'u ruajtën. Provo prapë."
                    Api.rifreskoTileDheKomplikacionin(ctx)
                }
            },
            mbrapa = { pamja = Pamja.Lista },
        )
        Pamja.Cilesimet -> Cilesimet(
            emri = lista?.emri ?: "",
            iRiFillim = iRi,
            kurGjendetIRi = { iRi = it },
            kurShkeputet = kurShkeputet,
            kurPamja = { pamja = Pamja.Ngjyrat },
            mbrapa = { pamja = Pamja.Lista },
        )
        Pamja.Ngjyrat -> PamjaEkrani(mbrapa = { pamja = Pamja.Cilesimet })
        is Pamja.Kolegu -> ZgjedhKolegun(
            a = p.a,
            kurDergohet = { tekst -> pamja = Pamja.Derguar(tekst) },
            kurShkeputet = kurShkeputet,
            mbrapa = { pamja = Pamja.Detaji(p.a, false, lista?.skaduaraL?.any { it.id == p.a.id } == true) },
        )
        is Pamja.Hequr -> {
            val a = p.a
            LaunchedEffect(a.id) { delay(5000); if ((pamja as? Pamja.Hequr)?.a?.id == a.id) pamja = Pamja.Lista }
            Konfirmim(
                titulli = a.emri,
                tekst = "U shënua: hequr nga rafti",
                butoni = "Zhbëj",
                kurButoni = {
                    pamja = Pamja.Lista
                    scope.launch {
                        try { Api.hiq(ctx, a.id, zhbej = true) } catch (e: Exception) { }
                        ngarko()
                    }
                },
            )
        }
        is Pamja.Derguar -> {
            LaunchedEffect(p) { delay(3500); if (pamja == p) pamja = Pamja.Lista }
            Konfirmim(titulli = "U dërgua", tekst = p.tekst, butoni = "OK", kurButoni = { pamja = Pamja.Lista })
        }
        Pamja.Lista -> {
            val gjendja = rememberScalingLazyListState()
            Scaffold(timeText = { TimeText() }, positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
                ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
                    val l = lista
                    item {
                        ListHeader {
                            Text(if (l == null) "STOKU" else "PËR T'U HEQUR · ${l.sot.size + l.skaduara}", color = Gri, fontWeight = FontWeight.SemiBold)
                        }
                    }
                    iRi?.let { v ->
                        item {
                            Chip(
                                modifier = Modifier.fillMaxWidth(),
                                onClick = {
                                    if (!dukePerditesuar) {
                                        dukePerditesuar = true
                                        scope.launch { gabim = Perditesimi.instalo(ctx, v.second); dukePerditesuar = false }
                                    }
                                },
                                label = { Text(if (dukePerditesuar) "Duke shkarkuar…" else "Përditëso", fontWeight = FontWeight.Bold) },
                                secondaryLabel = { Text("Version i ri 1.0.${v.first}", color = Color.Black) },
                                colors = ChipDefaults.primaryChipColors(),
                            )
                        }
                    }
                    if (l == null && duke) item { CircularProgressIndicator(indicatorColor = Verdhe) }
                    // Të skaduarat të parat: duhen hequr nga rafti menjëherë
                    if (l != null && l.skaduaraL.isNotEmpty()) {
                        item { ListHeader { Text("KANË SKADUAR · ${l.skaduara}", color = Kuqe, fontWeight = FontWeight.Bold) } }
                        items(l.skaduaraL, key = { "k" + it.id + it.data }) { a ->
                            RreshtiAfatit(a, "Skadoi " + dataShkurt(a.data) + (a.sasia?.let { " · $it copë" } ?: ""), Kuqe) { pamja = Pamja.Detaji(a, false, true) }
                        }
                        if (l.skaduaraL.size > 1) item {
                            Chip(
                                modifier = Modifier.fillMaxWidth(),
                                onClick = { pamja = Pamja.HiqKrejt(l.skaduaraL) },
                                label = { Text("Hiqi krejt nga rafti", fontWeight = FontWeight.Bold) },
                                secondaryLabel = { Text(if (l.skaduaraL.size == 1) "1 e skaduar" else "${l.skaduaraL.size} të skaduara", color = Color.Black) },
                                colors = ChipDefaults.chipColors(backgroundColor = Kuqe, contentColor = Color.Black),
                            )
                        }
                    }
                    item { ListHeader { Text("SKADOJNË SOT · ${l?.sot?.size ?: 0}", color = Verdhe, fontWeight = FontWeight.SemiBold) } }
                    if (l != null && l.sot.isEmpty()) item {
                        Text("Asnjë produkt s'skadon sot ✓", textAlign = TextAlign.Center, color = Color.White, modifier = Modifier.padding(8.dp))
                    }
                    if (l != null) items(l.sot, key = { "s" + it.id }) { a ->
                        RreshtiAfatit(a, pershkrimi(a), AfatAfer) { pamja = Pamja.Detaji(a, true) }
                    }
                    if (l != null && l.java.isNotEmpty()) {
                        item { ListHeader { Text("KËTË JAVË · ${l.javaN}", color = Gri, fontWeight = FontWeight.SemiBold) } }
                        items(l.java, key = { "j" + it.id + it.data }) { a ->
                            RreshtiAfatit(a, dataShkurt(a.data) + (a.sasia?.let { " · $it copë" } ?: ""), AfatAfer) { pamja = Pamja.Detaji(a, false) }
                        }
                    }
                    gabim?.let { g -> item { Text(g, fontSize = 11.sp, color = Kuqe, textAlign = TextAlign.Center, modifier = Modifier.padding(6.dp)) } }
                    // Poshtë: rifresko (majtas) dhe Cilësimet (djathtas)
                    item {
                        Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                            ButoniRifresko(duke = duke) { scope.launch { ngarko() } }
                            Spacer(Modifier.size(12.dp))
                            ButoniCilesimet(kaTeRe = iRi != null) { pamja = Pamja.Cilesimet }
                        }
                    }
                }
            }
        }
    }
}

// Kartela e produktit si te telefoni: e kuqe kur ka skaduar, e verdhë kur skadon së shpejti (ngjyrat s'varen nga Pamja)
@Composable
fun RreshtiAfatit(a: Afat, poshte: String, ngjyra: Color, kurPreket: () -> Unit) {
    val kuq = ngjyra == Kuqe
    Chip(
        modifier = Modifier.fillMaxWidth(),
        onClick = kurPreket,
        label = { Text(a.emri, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold, color = Color.White) },
        secondaryLabel = { Text(poshte, maxLines = 1, color = if (kuq) Color(0xFFFFA39B) else Color(0xFFFFD36B)) },
        icon = { Box(Modifier.size(10.dp).background(ngjyra, CircleShape)) },
        colors = ChipDefaults.chipColors(
            backgroundColor = if (kuq) Color(0xFF3A1513) else Color(0xFF33280A),
            contentColor = Color.White,
            secondaryContentColor = if (kuq) Color(0xFFFFA39B) else Color(0xFFFFD36B),
            iconColor = ngjyra,
        ),
        border = ChipDefaults.chipBorder(borderStroke = BorderStroke(1.dp, ngjyra.copy(alpha = 0.45f))),
    )
}

// Produkti i zgjedhur: "U hoq nga rafti" ose "Kërko heqje nga grupi"
@Composable
fun Detaji(a: Afat, sot: Boolean, skaduar: Boolean = false, ekipa: Boolean, kurHiqet: () -> Unit, kurKerkon: () -> Unit, mbrapa: () -> Unit) {
    val gjendja = rememberScalingLazyListState()
    Scaffold(positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
        ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
            item { Text(a.emri, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis) }
            item {
                Text((if (sot) "Skadon sot" else if (skaduar) "Skadoi më " + dataShkurt(a.data) else "Afati " + dataShkurt(a.data)) + (a.sasia?.let { " · $it copë" } ?: "") + (if (a.barkodi.isNotBlank()) " · " + a.barkodi else ""),
                    fontSize = 12.sp, color = if (skaduar) Kuqe else Gri, textAlign = TextAlign.Center)
            }
            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = kurHiqet,
                    label = { Text("✓ E hoqa nga rafti", fontWeight = FontWeight.Bold) },
                    colors = ChipDefaults.primaryChipColors(),
                )
            }
            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = kurKerkon,
                    enabled = ekipa,
                    label = { Text("Kërko heqje nga grupi", fontWeight = FontWeight.Bold) },
                    secondaryLabel = { Text(if (ekipa) "Dërgoja një kolegu" else "Lidhe sërish orën nga telefoni", maxLines = 2, color = Gri) },
                    colors = ChipDefaults.secondaryChipColors(),
                )
            }
            item { Chip(onClick = mbrapa, label = { Text("Mbrapa") }, colors = ChipDefaults.childChipColors()) }
        }
    }
}

// Kujt t'i dërgohet kërkesa: krejt ekipa ose një koleg
@Composable
fun ZgjedhKolegun(a: Afat, kurDergohet: (String) -> Unit, kurShkeputet: () -> Unit, mbrapa: () -> Unit) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    var koleget by remember { mutableStateOf<List<Koleg>?>(null) }
    var gabim by remember { mutableStateOf<String?>(null) }
    var duke by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        try { koleget = Api.koleget(ctx) }
        catch (e: PaLidhje) { kurShkeputet() }
        catch (e: DuhetRilidhur) { gabim = "Lidhe sërish orën nga telefoni (Cilësimet → Ora e dorës)." }
        catch (e: Exception) { gabim = "S'ka lidhje me serverin." }
    }
    fun dergo(k: Koleg?) {
        if (duke) return
        duke = true; gabim = null
        scope.launch {
            try {
                val n = Api.kerkoHeqjen(ctx, a, k)
                kurDergohet(if (k != null) "Kërkesa iu dërgua: ${k.emri}" else "Kërkesa iu dërgua grupit ($n)")
            } catch (e: PaLidhje) { kurShkeputet() }
            catch (e: DuhetRilidhur) { gabim = "Lidhe sërish orën nga telefoni." }
            catch (e: Exception) { gabim = "S'u dërgua. Provo prapë." }
            duke = false
        }
    }
    val gjendja = rememberScalingLazyListState()
    Scaffold(positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
        ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
            item { ListHeader { Text("KUJT T'IA KËRKOSH?", color = Gri, fontWeight = FontWeight.SemiBold) } }
            item { Text(a.emri, fontSize = 13.sp, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center) }
            val l = koleget
            if (l == null && gabim == null) item { CircularProgressIndicator(indicatorColor = Verdhe) }
            if (l != null) {
                if (l.isEmpty()) item { Text("S'ka kolegë në grup.", color = Gri, textAlign = TextAlign.Center) }
                else item {
                    Chip(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { dergo(null) },
                        label = { Text("Krejt grupi", fontWeight = FontWeight.Bold) },
                        secondaryLabel = { Text(if (l.size == 1) "1 koleg" else "${l.size} kolegë", color = Gri) },
                        colors = ChipDefaults.primaryChipColors(),
                    )
                }
                items(l, key = { it.uid }) { k ->
                    Chip(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { dergo(k) },
                        label = { Text(k.emri, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                        icon = {
                            Box(Modifier.size(24.dp).background(Kartela, CircleShape), contentAlignment = Alignment.Center) {
                                Text(k.emri.take(1).uppercase(), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Verdhe)
                            }
                        },
                        colors = ChipDefaults.secondaryChipColors(),
                    )
                }
            }
            if (duke) item { CircularProgressIndicator(indicatorColor = Verdhe) }
            gabim?.let { g -> item { Text(g, fontSize = 11.sp, color = Kuqe, textAlign = TextAlign.Center, modifier = Modifier.padding(6.dp)) } }
            item { Chip(onClick = mbrapa, label = { Text("Mbrapa") }, colors = ChipDefaults.childChipColors()) }
        }
    }
}

@Composable
fun Konfirmim(titulli: String, tekst: String, butoni: String, kurButoni: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().background(Color.Black).padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(Modifier.size(52.dp).background(Color(0xFF173A24), CircleShape), contentAlignment = Alignment.Center) {
            Text("✓", fontSize = 28.sp, color = Gjelber, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(8.dp))
        Text(titulli, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis)
        Text(tekst, fontSize = 12.sp, color = Gri, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Chip(onClick = kurButoni, label = { Text(butoni, fontWeight = FontWeight.Bold) }, colors = ChipDefaults.secondaryChipColors())
    }
}

fun pershkrimi(a: Afat): String {
    val p = mutableListOf<String>()
    a.sasia?.let { p.add("$it copë") }
    if (a.barkodi.isNotBlank()) p.add(a.barkodi)
    return if (p.isEmpty()) "Skadon sot" else p.joinToString(" · ")
}

fun dataShkurt(iso: String): String {
    val x = iso.split("-")
    return if (x.size == 3) x[2] + "." + x[1] else iso
}

// Konfirmimi: krejt të skaduarat u hoqën nga rafti
@Composable
fun HiqKrejt(n: Int, kurPo: () -> Unit, mbrapa: () -> Unit) {
    val gjendja = rememberScalingLazyListState()
    Scaffold(positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
        ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
            item { Text("Hiqi krejt?", fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center) }
            item { Text(if (n == 1) "1 produkt që ka skaduar shënohet \"hequr nga rafti\"." else "$n produkte që kanë skaduar shënohen \"hequr nga rafti\".", fontSize = 12.sp, color = Gri, textAlign = TextAlign.Center) }
            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = kurPo,
                    label = { Text("✓ Po, i hoqa krejt", fontWeight = FontWeight.Bold) },
                    colors = ChipDefaults.chipColors(backgroundColor = Kuqe, contentColor = Color.Black),
                )
            }
            item { Chip(onClick = mbrapa, label = { Text("Mbrapa") }, colors = ChipDefaults.childChipColors()) }
        }
    }
}

// Cilësimet e orës: versioni, përditësimi direkt nga ora, llogaria e lidhur, shkëputja
@Composable
fun Cilesimet(emri: String, iRiFillim: Pair<Int, String>?, kurGjendetIRi: (Pair<Int, String>?) -> Unit, kurShkeputet: () -> Unit, kurPamja: () -> Unit, mbrapa: () -> Unit) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val versioni = remember { try { ctx.packageManager.getPackageInfo(ctx.packageName, 0).longVersionCode.toInt() } catch (e: Exception) { 0 } }
    var iRi by remember { mutableStateOf(iRiFillim) }
    var duke by remember { mutableStateOf(false) }
    var mesazh by remember { mutableStateOf<String?>(null) }
    var pyetShkeputje by remember { mutableStateOf(false) }
    val gjendja = rememberScalingLazyListState()
    Scaffold(positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
        ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
            item { Koka("Cilësimet") }
            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = kurPamja,
                    label = { Text("Pamja", fontWeight = FontWeight.Bold) },
                    secondaryLabel = { Text("Ngjyra: " + Tema.NGJYRAT[Tema.zgjedhur].emri, color = Gri, maxLines = 1) },
                    icon = { RrethiNgjyres(Verdhe, false) },
                    colors = ChipDefaults.secondaryChipColors(),
                )
            }
            item {
                val v = iRi
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        if (!duke) {
                            duke = true; mesazh = null
                            scope.launch {
                                if (v != null) {
                                    mesazh = Perditesimi.instalo(ctx, v.second)
                                } else {
                                    val r = Perditesimi.kontrollo(ctx, detyro = true)
                                    iRi = r; kurGjendetIRi(r)
                                    mesazh = if (r != null) null else if (Perditesimi.deshtoi) "S'u kontrollua: s'ka internet." else "Ke versionin më të ri ✓"
                                }
                                duke = false
                            }
                        }
                    },
                    label = { Text(if (duke) (if (v != null) "Duke shkarkuar…" else "Duke kontrolluar…") else if (v != null) "Përditëso tani" else "Kontrollo për përditësim", fontWeight = FontWeight.Bold) },
                    secondaryLabel = { Text(if (v != null) "Version i ri: 1.0.${v.first}" else "Version i ri i aplikacionit", color = if (v != null) Color.Black else Gri, maxLines = 1) },
                    colors = if (v != null) ChipDefaults.primaryChipColors() else ChipDefaults.secondaryChipColors(),
                )
            }
            mesazh?.let { m -> item { Text(m, fontSize = 11.sp, color = if (m.endsWith("✓")) Gjelber else Kuqe, textAlign = TextAlign.Center, modifier = Modifier.padding(6.dp)) } }
            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { if (pyetShkeputje) kurShkeputet() else pyetShkeputje = true },
                    label = { Text(if (pyetShkeputje) "Prek sërish për ta shkëputur" else "Shkëput orën", fontSize = 13.sp) },
                    secondaryLabel = { Text("Ora s'e sheh më llogarinë", color = Gri, maxLines = 1) },
                    colors = if (pyetShkeputje) ChipDefaults.chipColors(backgroundColor = Kuqe, contentColor = Color.Black) else ChipDefaults.secondaryChipColors(),
                )
            }
            // Në fund: llogaria dhe versioni (si "Stoku 1.x" te telefoni)
            if (emri.isNotBlank()) item { Text("Llogaria: $emri", fontSize = 11.sp, color = Gri, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp)) }
            item { Text("Stoku për orë · 1.0.$versioni", fontSize = 11.sp, color = Gri, textAlign = TextAlign.Center) }
        }
    }
}

// Koka e ekraneve të Cilësimeve: vetëm titulli (mbrapa me butonin e orës ose me rrëshqitje djathtas)
@Composable
fun Koka(titulli: String) {
    Text(titulli, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color.White, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp))
}

// Cilësimet → Pamja: ngjyra kryesore e aplikacionit në orë
@Composable
fun PamjaEkrani(mbrapa: () -> Unit) {
    val ctx = LocalContext.current
    val gjendja = rememberScalingLazyListState()
    Scaffold(positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
        ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
            item { Koka("Pamja") }
            item { Text("Ngjyra kryesore", fontSize = 12.sp, color = Gri, textAlign = TextAlign.Center) }
            items(Tema.NGJYRAT.size) { i ->
                val n = Tema.NGJYRAT[i]
                val po = Tema.zgjedhur == i
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { Tema.ruaj(ctx, i) },
                    label = { Text(if (po) n.emri + "  ✓" else n.emri, fontWeight = if (po) FontWeight.Bold else FontWeight.Normal) },
                    icon = { RrethiNgjyres(n.c, po) },
                    colors = ChipDefaults.secondaryChipColors(),
                )
            }
        }
    }
}

package site.stoku.ora

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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

val Verdhe = Color(0xFFF5B70A)
val Kuqe = Color(0xFFFF5A4E)
val Gri = Color(0xFF9AA0A8)
val Kartela = Color(0xFF1D2026)
val Gjelber = Color(0xFF3DDC84)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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

// Ekrani i parë: kodi që shkruhet te telefoni. Kontrollohet çdo 3 sekonda derisa telefoni ta lidhë.
@Composable
fun Lidhja(kurLidhet: () -> Unit) {
    val ctx = LocalContext.current
    var kodi by remember { mutableStateOf(Api.kodi(ctx)) }
    var gabim by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        while (true) {
            try {
                if (Api.kontrolloLidhjen(ctx)) { kurLidhet(); break }
                gabim = false
            } catch (e: Exception) { gabim = true }
            kodi = Api.kodi(ctx)
            delay(3000)
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
        Text(
            if (gabim) "S'ka internet. Po provoj prapë…" else "Te telefoni: Cilësimet → Njoftimet → Galaxy Watch → Lidh sahatin",
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
    data class Detaji(val a: Afat, val sot: Boolean) : Pamja()
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
        try {
            lista = Api.merrListen(ctx); gabim = null
            Api.rifreskoTileDheKomplikacionin(ctx)
        } catch (e: PaLidhje) {
            kurShkeputet(); return
        } catch (e: Exception) {
            gabim = "S'ka lidhje me serverin. Lista mund të jetë e vjetër."
        }
        duke = false
    }
    var iRi by remember { mutableStateOf<Pair<Int, String>?>(null) }
    var dukePerditesuar by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { ngarko() }
    LaunchedEffect(Unit) { iRi = Perditesimi.kontrollo(ctx) }
    BackHandler(enabled = pamja !is Pamja.Lista) { pamja = Pamja.Lista }

    when (val p = pamja) {
        is Pamja.Detaji -> Detaji(
            a = p.a,
            sot = p.sot,
            ekipa = lista?.ekipa == true,
            kurHiqet = {
                val a = p.a
                pamja = Pamja.Hequr(a)
                lista = lista?.let { l -> l.copy(sot = l.sot.filter { it.id != a.id }, java = l.java.filter { it.id != a.id }, skaduaraL = l.skaduaraL.filter { it.id != a.id }) }
                scope.launch {
                    try { Api.hiq(ctx, a.id) } catch (e: PaLidhje) { kurShkeputet() } catch (e: Exception) { gabim = "Heqja s'u ruajt. Provo prapë." }
                    Api.rifreskoTileDheKomplikacionin(ctx)
                }
            },
            kurKerkon = { pamja = Pamja.Kolegu(p.a) },
            mbrapa = { pamja = Pamja.Lista },
        )
        is Pamja.Kolegu -> ZgjedhKolegun(
            a = p.a,
            kurDergohet = { tekst -> pamja = Pamja.Derguar(tekst) },
            kurShkeputet = kurShkeputet,
            mbrapa = { pamja = Pamja.Detaji(p.a, false) },
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
                            Text(if (l == null) "STOKU" else "SKADOJNË SOT · ${l.sot.size}", color = Gri, fontWeight = FontWeight.SemiBold)
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
                    if (l != null && l.sot.isEmpty()) item {
                        Text("Asnjë produkt s'skadon sot ✓", textAlign = TextAlign.Center, color = Color.White, modifier = Modifier.padding(8.dp))
                    }
                    if (l != null) items(l.sot, key = { "s" + it.id }) { a ->
                        RreshtiAfatit(a, pershkrimi(a), Kuqe) { pamja = Pamja.Detaji(a, true) }
                    }
                    if (l != null && l.skaduaraL.isNotEmpty()) {
                        item { ListHeader { Text("KANË SKADUAR · ${l.skaduara}", color = Kuqe, fontWeight = FontWeight.SemiBold) } }
                        items(l.skaduaraL, key = { "k" + it.id + it.data }) { a ->
                            RreshtiAfatit(a, "Skadoi " + dataShkurt(a.data) + (a.sasia?.let { " · $it copë" } ?: ""), Kuqe) { pamja = Pamja.Detaji(a, false) }
                        }
                    }
                    if (l != null && l.java.isNotEmpty()) {
                        item { ListHeader { Text("KËTË JAVË · ${l.javaN}", color = Gri, fontWeight = FontWeight.SemiBold) } }
                        items(l.java, key = { "j" + it.id + it.data }) { a ->
                            RreshtiAfatit(a, dataShkurt(a.data) + (a.sasia?.let { " · $it copë" } ?: ""), Verdhe) { pamja = Pamja.Detaji(a, false) }
                        }
                    }
                    gabim?.let { g -> item { Text(g, fontSize = 11.sp, color = Kuqe, textAlign = TextAlign.Center, modifier = Modifier.padding(6.dp)) } }
                    item {
                        Chip(
                            onClick = { scope.launch { ngarko() } },
                            label = { Text(if (duke) "Duke rifreskuar…" else "Rifresko") },
                            colors = ChipDefaults.primaryChipColors(),
                        )
                    }
                    item {
                        Chip(
                            onClick = kurShkeputet,
                            label = { Text("Shkëput sahatin", fontSize = 12.sp) },
                            colors = ChipDefaults.childChipColors(),
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun RreshtiAfatit(a: Afat, poshte: String, ngjyra: Color, kurPreket: () -> Unit) {
    Chip(
        modifier = Modifier.fillMaxWidth(),
        onClick = kurPreket,
        label = { Text(a.emri, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold) },
        secondaryLabel = { Text(poshte, maxLines = 1, color = Gri) },
        icon = { Box(Modifier.size(10.dp).background(ngjyra, CircleShape)) },
        colors = ChipDefaults.secondaryChipColors(),
    )
}

// Produkti i zgjedhur: "U hoq nga rafti" ose "Kërko heqje nga ekipa"
@Composable
fun Detaji(a: Afat, sot: Boolean, ekipa: Boolean, kurHiqet: () -> Unit, kurKerkon: () -> Unit, mbrapa: () -> Unit) {
    val gjendja = rememberScalingLazyListState()
    Scaffold(positionIndicator = { PositionIndicator(scalingLazyListState = gjendja) }) {
        ScalingLazyColumn(state = gjendja, modifier = Modifier.fillMaxSize().background(Color.Black)) {
            item { Text(a.emri, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis) }
            item {
                Text((if (sot) "Skadon sot" else "Afati " + dataShkurt(a.data)) + (a.sasia?.let { " · $it copë" } ?: "") + (if (a.barkodi.isNotBlank()) " · " + a.barkodi else ""),
                    fontSize = 12.sp, color = Gri, textAlign = TextAlign.Center)
            }
            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = kurHiqet,
                    label = { Text("✓ U hoq nga rafti", fontWeight = FontWeight.Bold) },
                    colors = ChipDefaults.primaryChipColors(),
                )
            }
            item {
                Chip(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = kurKerkon,
                    enabled = ekipa,
                    label = { Text("Kërko heqje nga ekipa", fontWeight = FontWeight.Bold) },
                    secondaryLabel = { Text(if (ekipa) "Dërgoja një kolegu" else "Lidhe sërish sahatin nga telefoni", maxLines = 2, color = Gri) },
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
        catch (e: DuhetRilidhur) { gabim = "Lidhe sërish sahatin nga telefoni (Cilësimet → Njoftimet → Galaxy Watch)." }
        catch (e: Exception) { gabim = "S'ka lidhje me serverin." }
    }
    fun dergo(k: Koleg?) {
        if (duke) return
        duke = true; gabim = null
        scope.launch {
            try {
                val n = Api.kerkoHeqjen(ctx, a, k)
                kurDergohet(if (k != null) "Kërkesa iu dërgua: ${k.emri}" else "Kërkesa iu dërgua ekipës ($n)")
            } catch (e: PaLidhje) { kurShkeputet() }
            catch (e: DuhetRilidhur) { gabim = "Lidhe sërish sahatin nga telefoni." }
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
                if (l.isEmpty()) item { Text("S'ka kolegë në ekipë.", color = Gri, textAlign = TextAlign.Center) }
                else item {
                    Chip(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { dergo(null) },
                        label = { Text("Krejt ekipa", fontWeight = FontWeight.Bold) },
                        secondaryLabel = { Text("${l.size} kolegë", color = Gri) },
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

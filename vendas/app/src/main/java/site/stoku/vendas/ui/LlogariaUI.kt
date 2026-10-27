package site.stoku.vendas.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Fotot
import site.stoku.vendas.Llogaria
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Fotoja e profilit të një llogarie (null derisa të ngarkohet, ose kur s'ka foto); rifreskohet kur ndryshon indeksi */
@Composable
internal fun fotoEProfilit(uid: String?): ImageBitmap? {
    val ctx = LocalContext.current
    val ind by Fotot.indeksi.collectAsState()
    val v = uid?.let { ind[it] }
    var foto by remember(uid, v) { mutableStateOf<ImageBitmap?>(null) }
    LaunchedEffect(uid, v) { foto = if (uid != null && v != null) Fotot.foto(ctx, uid)?.asImageBitmap() else null }
    return foto
}

/** Avatari i llogarisë (ops-av): fotoja e profilit ose rrethi blu me shkronjën e parë */
@Composable
internal fun AvatariMadh(emri: String, madhesia: Int = 56, uid: String? = null, onClick: (() -> Unit)? = null) {
    val foto = fotoEProfilit(uid)
    var m = Modifier.size(madhesia.dp).shadow(10.dp, CircleShape, spotColor = Color(0xB31F5FC4)).clip(CircleShape)
        .background(Brush.linearGradient(listOf(Color(0xFF3B7BE0), Color(0xFF1F5FC4))))
    if (onClick != null) m = m.clickable(onClick = onClick)
    Box(m, contentAlignment = Alignment.Center) {
        val f = foto
        if (f != null) Image(f, null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        else Text((emri.trim().firstOrNull() ?: '?').uppercase(), style = tx(if (madhesia >= 56) 23 else 21, 700, Color.White))
    }
}

/** Llogaria: "Shto foto" / "Ndrysho foton" / "Hiq foton" (fotoja e profilit, e sheh krejt grupi) */
@Composable
fun FotoJaProfilit() {
    val n = N
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val p by Llogaria.perdoruesi.collectAsState()
    val ind by Fotot.indeksi.collectAsState()
    val kaFoto = p?.uid?.let { ind[it] } != null
    var duke by remember { mutableStateOf(false) }
    var hint by remember { mutableStateOf("") }
    var pyetHiq by remember { mutableStateOf(false) }
    LaunchedEffect(p?.uid) { Fotot.rifresko(true) }
    val zgjidh = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        duke = true; hint = "Po ngarkohet fotoja…"
        scope.launch {
            val g = Fotot.ngarko(ctx, uri)
            duke = false; hint = g?.let { Fotot.tekstiGabimit(it) } ?: ""
            if (g == null) Toast.trego("Fotoja u ruajt. E sheh krejt grupi.")
        }
    }
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        ButonOps(if (kaFoto) "Ndrysho foton" else "Shto foto", { zgjidh.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
            Modifier.weight(1f), aktiv = !duke)
        if (kaFoto) ButonOps("Hiq foton", { pyetHiq = true }, Modifier.weight(1f), aktiv = !duke, kuqe = true) else Spacer(Modifier.weight(1f))
    }
    if (hint.isNotEmpty()) Text(hint, style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(bottom = 10.dp))
    if (pyetHiq) Konfirmo("Ta heqim foton?", "Në vend të fotos do të dalë shkronja e emrit tënd.", "Hiqe", mbyll = { pyetHiq = false }) {
        duke = true; hint = "Po hiqet fotoja…"
        scope.launch {
            val g = Fotot.hiq()
            duke = false; hint = g?.let { Fotot.tekstiGabimit(it) } ?: ""
            if (g == null) Toast.trego("Fotoja u hoq.")
        }
    }
}

/** v232: "Të fshira nga një pajisje tjetër" (si #llKopjaSeksion): kopja në këtë telefon, me "Rikthe" dhe "Hiq kopjen" */
@Composable
fun KopjaEFshirave() {
    val n = N
    val kopja by Dyqani.kopja.collectAsState()
    val g by Dyqani.gjendja.collectAsState()
    var rikthe by remember { mutableStateOf(false) }
    var hiq by remember { mutableStateOf(false) }
    val k = remember(kopja, g) { Dyqani.lexoKopjen() }
    val m = remember(k, g) { k?.let { Dyqani.teMungueshmetNgaKopja(it) } }
    // Krejt çka ishte në kopje është sërish këtu (p.sh. u rikthye nga një pajisje tjetër): kopja s'duhet më
    LaunchedEffect(k, m) { if (kopja != null && (m == null || (m.first.isEmpty() && m.second.isEmpty()))) Dyqani.hiqKopjen() }
    if (k == null || m == null || (m.first.isEmpty() && m.second.isEmpty())) return
    val nje = m.first.size + m.second.size == 1
    TitulliGrupit("Të fshira nga një pajisje tjetër")
    KartaOps {
        Text(Dyqani.pershkrimiIKopjes(m) + (if (nje) " u fshi" else " u fshinë") + " nga një pajisje tjetër. Kopja u ruajt në këtë telefon më " +
            SimpleDateFormat("dd.MM.yyyy", Locale.ROOT).format(Date(k.koha)) + ", ora " + SimpleDateFormat("HH:mm", Locale.ROOT).format(Date(k.koha)) +
            ". \"Rikthe\" " + (if (nje) "e" else "i") + " kthen në krejt pajisjet.", style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(bottom = 10.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Buton("Rikthe", { rikthe = true }, Modifier.weight(1f), lartesia = 44.dp)
            ButonOps("Hiq kopjen", { hiq = true }, Modifier.weight(1f))
        }
    }
    if (rikthe) Konfirmo("Të rikthehen të fshirat?", (if (nje) "Kthehet " else "Kthehen ") + Dyqani.pershkrimiIKopjes(m) + " në krejt pajisjet e llogarisë.", "Rikthe",
        rrezik = false, mbyll = { rikthe = false }) {
        val r = Dyqani.riktheNgaKopja()
        if (r != null) Toast.trego((if (r.first.size + r.second.size == 1) "U rikthye: " else "U rikthyen: ") + Dyqani.pershkrimiIKopjes(r) + ".", 4000)
    }
    if (hiq) Konfirmo("Të hiqet kopja?", "Të fshirat s'mund të rikthehen më nga ky telefon.", "Hiqe", mbyll = { hiq = false }) { Dyqani.hiqKopjen() }
}

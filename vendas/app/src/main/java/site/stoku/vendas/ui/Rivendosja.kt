package site.stoku.vendas.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import site.stoku.logjika.Json
import site.stoku.logjika.Obj
import site.stoku.logjika.siObj
import site.stoku.vendas.Llogaria
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/*
 * "Ke harruar fjalëkalimin?" (porta.js, Worker 163+): 1) emri → kërkesa te administratori; 2) kodi 6-shifror që ta jep
 * administratori; 3) fjalëkalimi i ri dy herë → hyrja direkt.
 */
private const val SERVERI = "https://stoku-push.mendurb.workers.dev"

private suspend fun thirrServerin(rruga: String, trupi: Map<String, Any?>): Obj = withContext(Dispatchers.IO) {
    try {
        val c = URL("$SERVERI/fjalekalimi/$rruga").openConnection() as HttpURLConnection
        c.requestMethod = "POST"; c.doOutput = true; c.connectTimeout = 15000; c.readTimeout = 20000
        c.setRequestProperty("Content-Type", "application/json")
        c.outputStream.use { it.write(Json.shkruaj(trupi).toByteArray(Charsets.UTF_8)) }
        val kodi = c.responseCode
        val tekst = (if (kodi in 200..299) c.inputStream else c.errorStream)?.bufferedReader()?.readText().orEmpty()
        c.disconnect()
        val j = Json.lexoOse(tekst).siObj() ?: return@withContext mapOf("ok" to false, "arsye" to "serveri")
        if (kodi !in 200..299 && (j["arsye"] == "pa-hyrje" || j["arsye"] == "rruga")) j + ("arsye" to "pa-sherbim") else j
    } catch (e: Exception) { mapOf("ok" to false, "arsye" to "rrjeti") }
}

private fun oraNga(ms: Any?): String = (ms as? Number)?.let { SimpleDateFormat("HH:mm", Locale.ROOT).format(Date(it.toLong())) } ?: ""

private fun tekstiRiv(j: Obj): String = when (j["arsye"]) {
    "s-ekziston" -> "S'ka llogari me këtë emër. Kontrollo emrin e përdoruesit."
    "emri" -> "Emri i përdoruesit: të paktën 3 shkronja ose numra (a–z, 0–9, _ . -), pa hapësira."
    "kodi" -> "Kodi s'është i saktë." + ((j["mbetur"] as? Number)?.toInt()?.takeIf { it > 0 }?.let { if (it == 1) " Të ka mbetur 1 provë." else " Të kanë mbetur $it prova." } ?: "")
    "shume-prova" -> "Kodi u bllokua pas 5 provave të gabuara. Kërko kod të ri " + (if (j["skadon"] != null) "pas orës " + oraNga(j["skadon"]) else "pas 30 minutash") + "."
    "skadoi" -> "Kodi ka skaduar (vlen 30 minuta). Dërgo kërkesë të re te administratori."
    "i-dobet" -> "Fjalëkalimi duhet të ketë të paktën 6 shenja."
    "pa-sherbim" -> "Rikthimi i fjalëkalimit s'është aktivizuar ende te serveri. Lajmëroje administratorin."
    "rrjeti" -> "S'ka lidhje me serverin. Kontrollo internetin dhe provo përsëri."
    else -> "Diçka shkoi keq te serveri. Provo përsëri pas pak."
}

@Composable
fun Rivendosja(emriFillimi: String, mbrapa: (String?) -> Unit) {
    val n = N
    val scope = rememberCoroutineScope()
    var hapi by remember { mutableStateOf("emri") }
    var teksti by remember { mutableStateOf("Shkruaj emrin e përdoruesit. Kërkesa shkon te administratori, që të jep një kod 6-shifror.") }
    var emri by remember { mutableStateOf(emriFillimi) }
    var kodi by remember { mutableStateOf("") }
    var fj1 by remember { mutableStateOf("") }
    var fj2 by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf("") }
    var duke by remember { mutableStateOf(false) }

    fun kerkoKodin() {
        duke = true
        scope.launch {
            val j = thirrServerin("kerko", mapOf("emri" to emri.trim().lowercase()))
            duke = false
            if (j["ok"] != true) { gabim = tekstiRiv(j); return@launch }
            hapi = "kodi"; gabim = ""
            teksti = (if (j["ekziston"] == true) "Kodi është dërguar tashmë te administratori." else "Kërkesa u dërgua te administratori.") +
                " Kur ta marrësh kodin 6-shifror prej tij, shkruaje këtu" + (if (j["skadon"] != null) " (vlen deri në " + oraNga(j["skadon"]) + ")." else ".")
        }
    }

    fun dergo() {
        if (duke) return
        gabim = ""
        when (hapi) {
            "emri" -> {
                val e = emri.trim()
                if (!Regex("^[a-zA-Z0-9_.-]{3,40}$").matches(e)) { gabim = if (e.isEmpty()) "Shkruaj emrin e përdoruesit." else tekstiRiv(mapOf("arsye" to "emri")); return }
                kerkoKodin()
            }
            "kodi" -> {
                if (!Regex("^\\d{6}$").matches(kodi.trim())) { gabim = "Shkruaj kodin 6-shifror që ta dha administratori."; return }
                duke = true
                scope.launch {
                    val j = thirrServerin("verifiko", mapOf("emri" to emri.trim().lowercase(), "kodi" to kodi.trim()))
                    duke = false
                    if (j["ok"] != true) {
                        if (j["arsye"] == "skadoi") { hapi = "emri"; teksti = "Shkruaj emrin e përdoruesit dhe dërgo kërkesë të re." }
                        gabim = tekstiRiv(j); return@launch
                    }
                    hapi = "fjalekalimi"; teksti = "Kodi është i saktë. Shkruaje fjalëkalimin e ri dy herë."
                }
            }
            else -> {
                if (fj1.length < 6) { gabim = tekstiRiv(mapOf("arsye" to "i-dobet")); return }
                if (fj2 != fj1) { gabim = "Fjalëkalimet nuk përputhen."; return }
                duke = true
                scope.launch {
                    val r = thirrServerin("ndrysho", mapOf("emri" to emri.trim().lowercase(), "kodi" to kodi.trim(), "fjalekalimi" to fj1))
                    if (r["ok"] == true || r["arsye"] == "skadoi") {
                        val g = Llogaria.hyr(emri.trim(), fj1)
                        duke = false
                        if (g == null) return@launch // hyrja e njofton vetë aplikacionin
                        if (r["ok"] == true) { mbrapa("Fjalëkalimi u ndryshua. Hyr me fjalëkalimin e ri."); return@launch }
                        hapi = "emri"; teksti = "Shkruaj emrin e përdoruesit dhe dërgo kërkesë të re."; gabim = tekstiRiv(mapOf("arsye" to "skadoi"))
                        return@launch
                    }
                    duke = false
                    if (r["arsye"] == "kodi" || r["arsye"] == "shume-prova") { hapi = "kodi"; teksti = "Shkruaje sërish kodin që ta dha administratori." }
                    gabim = tekstiRiv(r)
                }
            }
        }
    }

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Fjalëkalimi i harruar", style = tx(20, 700, n.ink, -0.02), textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        Text(teksti, style = tx(14, 400, n.ink2), textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        when (hapi) {
            "emri" -> {
                Text("Emri i përdoruesit", style = tx(13, 600, n.ink3))
                Fusha(emri, { emri = it.trim() }, Modifier.fillMaxWidth(), "Emri i përdoruesit", veprimi = ImeAction.Send, kurVeprim = { dergo() })
            }
            "kodi" -> {
                Text("Llogaria: " + emri.trim().lowercase(), style = tx(14, 600, n.ink))
                Text("Kodi 6-shifror", style = tx(13, 600, n.ink3))
                Fusha(kodi, { kodi = it.filter { c -> c.isDigit() }.take(6) }, Modifier.fillMaxWidth(), "••••••", tastiera = KeyboardType.NumberPassword,
                    stili = txMono(22f, pesha = 500), veprimi = ImeAction.Next, kurVeprim = { dergo() })
            }
            else -> {
                Text("Fjalëkalimi i ri", style = tx(13, 600, n.ink3))
                Fusha(fj1, { fj1 = it }, Modifier.fillMaxWidth(), "Të paktën 6 shenja", fjalekalim = true, veprimi = ImeAction.Next)
                Text("Përsërite fjalëkalimin e ri", style = tx(13, 600, n.ink3))
                Fusha(fj2, { fj2 = it }, Modifier.fillMaxWidth(), "Shkruaje edhe një herë", fjalekalim = true, veprimi = ImeAction.Go, kurVeprim = { dergo() })
            }
        }
        if (gabim.isNotEmpty()) Text(gabim, style = tx(13, 500, n.exp))
        Box(Modifier.fillMaxWidth().height(52.dp).clip(RoundedCornerShape(14.dp)).background(n.accent).clickable(enabled = !duke) { dergo() },
            contentAlignment = Alignment.Center) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (duke) { CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.5.dp); Spacer(Modifier.size(10.dp)) }
                Text(if (duke) "Një moment…" else when (hapi) { "emri" -> "Dërgo kërkesën"; "kodi" -> "Vazhdo"; else -> "Ndrysho fjalëkalimin" }, style = tx(16, 600, Color.White))
            }
        }
        if (hapi == "kodi") Lidhje("Dërgo sërish kërkesën", { if (!duke) kerkoKodin() }, Modifier.align(Alignment.CenterHorizontally), madhesia = 14)
        Lidhje("Kthehu te hyrja", { if (!duke) mbrapa(null) }, Modifier.align(Alignment.CenterHorizontally), madhesia = 14)
    }
}

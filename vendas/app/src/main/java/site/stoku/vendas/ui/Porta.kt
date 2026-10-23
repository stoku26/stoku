package site.stoku.vendas.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import site.stoku.vendas.Llogaria

/** Porta e hyrjes (porta.js): Hyr / Krijo llogari */
@Composable
fun Porta() {
    val n = N
    val scope = rememberCoroutineScope()
    var krijo by remember { mutableStateOf(false) }
    var emri by remember { mutableStateOf(Llogaria.emriIFundit()) }
    var fj by remember { mutableStateOf("") }
    var fj2 by remember { mutableStateOf("") }
    var shfaq by remember { mutableStateOf(false) }
    var merch by remember { mutableStateOf(false) }
    var gabim by remember { mutableStateOf("") }
    var duke by remember { mutableStateOf(false) }
    var rivendosja by remember { mutableStateOf(false) }
    var njoftimi by remember { mutableStateOf("") }
    val fFj = remember { FocusRequester() }
    val fFj2 = remember { FocusRequester() }

    fun dergo() {
        if (duke) return
        val e = emri.trim()
        gabim = when {
            e.isEmpty() -> "Shkruaj emrin e përdoruesit."
            !Regex("^[a-zA-Z0-9_.-]{3,40}$").matches(e) -> "Emri i përdoruesit: të paktën 3 shkronja ose numra (a–z, 0–9, _ . -), pa hapësira."
            fj.isEmpty() -> "Shkruaj fjalëkalimin."
            fj.length < 6 -> "Fjalëkalimi duhet të ketë të paktën 6 shenja."
            krijo && fj2 != fj -> "Fjalëkalimet nuk përputhen."
            else -> ""
        }
        if (gabim.isNotEmpty()) return
        duke = true
        scope.launch {
            val r = if (krijo) Llogaria.regjistrohu(e, fj, merch) else Llogaria.hyr(e, fj)
            duke = false
            if (r != null) gabim = r else { fj = ""; fj2 = "" }
        }
    }

    Box(Modifier.fillMaxSize().background(n.bg).systemBarsPadding().imePadding(), contentAlignment = Alignment.Center) {
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(16.dp).widthIn(max = 400.dp).fillMaxWidth()
                .shadow(24.dp, RoundedCornerShape(22.dp), ambientColor = Color(0x2014161B), spotColor = Color(0x2014161B))
                .clip(RoundedCornerShape(22.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(22.dp))
                .padding(start = 24.dp, end = 24.dp, top = 28.dp, bottom = 22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            LogoEPlote(Modifier.padding(top = 4.dp, bottom = 14.dp).height(48.dp))
            Text("Regjistrimi i mallit dhe i afateve të skadimit.", style = tx(14, 400, n.muted), textAlign = TextAlign.Center)
            Spacer(Modifier.height(20.dp))
            if (rivendosja) {
                Rivendosja(emri) { msg -> rivendosja = false; if (msg != null) { njoftimi = msg; gabim = "" } }
                return@Column
            }
            if (njoftimi.isNotEmpty()) { Text(njoftimi, style = tx(13, 600, n.ok), textAlign = TextAlign.Center); Spacer(Modifier.height(12.dp)) }
            // Tabet Hyr / Krijo llogari
            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(n.sunken).padding(4.dp)) {
                listOf(false to "Hyr", true to "Krijo llogari").forEach { (v, t) ->
                    val aktiv = krijo == v
                    Box(Modifier.weight(1f).height(38.dp).clip(RoundedCornerShape(10.dp)).background(if (aktiv) (if (n.erret) Color(0xFF2B3039) else Color.White) else Color.Transparent)
                        .clickable { krijo = v; gabim = "" }, contentAlignment = Alignment.Center) {
                        Text(t, style = tx(14, 600, if (aktiv) n.ink else n.ink3))
                    }
                }
            }
            Spacer(Modifier.height(18.dp))
            Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Etiketa("Emri i përdoruesit")
                Fusha(emri, { emri = it.trim() }, Modifier.fillMaxWidth(), "Emri i përdoruesit", veprimi = ImeAction.Next, kurVeprim = { fFj.requestFocus() })
                Etiketa("Fjalëkalimi")
                Fusha(fj, { fj = it }, Modifier.fillMaxWidth(), "Fjalëkalimi", fjalekalim = !shfaq, fokusi = fFj,
                    veprimi = if (krijo) ImeAction.Next else ImeAction.Go, kurVeprim = { if (krijo) fFj2.requestFocus() else dergo() },
                    djathtas = {
                        Icon(if (shfaq) Ik.SyriMbyllur else Ik.Syri, if (shfaq) "Fshih fjalëkalimin" else "Shfaq fjalëkalimin",
                            Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).clickable { shfaq = !shfaq }.padding(8.dp), tint = n.faint)
                    })
                if (!krijo) Lidhje("Ke harruar fjalëkalimin?", { rivendosja = true; gabim = "" }, Modifier.align(Alignment.End))
                if (krijo) {
                    Etiketa("Përsërit fjalëkalimin")
                    Fusha(fj2, { fj2 = it }, Modifier.fillMaxWidth(), "Shkruaje edhe një herë", fjalekalim = !shfaq, fokusi = fFj2,
                        veprimi = ImeAction.Go, kurVeprim = { dergo() })
                    Kutia(merch, { merch = it }, "Punoj si merchandiser (në disa markete)")
                }
                if (gabim.isNotEmpty()) Text(gabim, style = tx(13, 500, n.exp))
                Box(Modifier.fillMaxWidth().height(52.dp).clip(RoundedCornerShape(14.dp)).background(n.accent).clickable(enabled = !duke) { dergo() },
                    contentAlignment = Alignment.Center) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (duke) { CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.5.dp); Spacer(Modifier.size(10.dp)) }
                        Text(if (duke) (if (krijo) "Duke krijuar llogarinë…" else "Duke hyrë…") else (if (krijo) "Krijo llogarinë" else "Hyr"),
                            style = tx(16, 600, Color.White))
                    }
                }
                Text("Rekomandohet hapja e një llogarie, që të dhënat të ruhen në cloud.", style = tx(12, 400, n.muted),
                    textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
            }
        }
    }
}

@Composable
private fun Etiketa(t: String) = Text(t, style = tx(13, 600, N.ink3), modifier = Modifier.padding(bottom = 0.dp))

/** Kutia e zgjedhjes (pk-mbaj) */
@Composable
fun Kutia(v: Boolean, ndrysho: (Boolean) -> Unit, teksti: String) {
    val n = N
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable { ndrysho(!v) }.padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(22.dp).clip(RoundedCornerShape(7.dp)).background(if (v) n.accent else n.surface).border(if (v) 0.dp else 1.5.dp, n.control, RoundedCornerShape(7.dp)),
            contentAlignment = Alignment.Center) {
            if (v) Icon(Ik.Kontroll, null, Modifier.size(15.dp), tint = Color.White)
        }
        Spacer(Modifier.size(10.dp))
        Text(teksti, style = tx(14, 500, n.ink2))
    }
}

/** Ekrani "Duke u lidhur…" (para se Firebase të dijë a je i kyçur) */
@Composable
fun DukeULidhur() {
    val n = N
    Box(Modifier.fillMaxSize().background(n.bg), contentAlignment = Alignment.Center) {
        Column(Modifier.padding(16.dp).widthIn(max = 400.dp).fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(n.surface)
            .border(1.dp, n.line, RoundedCornerShape(22.dp)).padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            LogoEPlote(Modifier.height(48.dp))
            Spacer(Modifier.height(14.dp))
            Text("Regjistrimi i mallit dhe i afateve të skadimit.", style = tx(14, 400, n.muted), textAlign = TextAlign.Center)
            Spacer(Modifier.height(28.dp))
            CircularProgressIndicator(Modifier.size(28.dp), color = n.accent, strokeWidth = 3.dp)
            Spacer(Modifier.height(14.dp))
            Text("Duke u lidhur…", style = tx(15, 400, n.ink))
        }
    }
}

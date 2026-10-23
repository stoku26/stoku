package site.stoku.vendas.ui

import android.Manifest
import android.app.TimePickerDialog
import android.content.Intent
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Njoftimet
import site.stoku.vendas.Push
import site.stoku.vendas.StokuApp
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/** Teksti i shkurtër i gjendjes së njoftimeve (rreshti te Cilësimet) */
fun statusiINjoftimeve(ctx: android.content.Context): String {
    val g = try { Njoftimet.gjendja(ctx) } catch (e: Exception) { "fikur" }
    val baza = when (g) { "lejuar" -> "Aktive"; "bllokuar" -> "Të bllokuara"; else -> "Të fikura" }
    val o = try { Push.orariIm() } catch (e: Exception) { null }
    return if (g == "lejuar" && o?.get("aktiv") == true) baza + " · ditore " + o["ora"] else baza
}

private fun oraNga(ms: Long): String = Instant.ofEpochMilli(ms).atZone(ZoneId.systemDefault()).toLocalTime().let { String.format(java.util.Locale.ROOT, "%02d:%02d", it.hour, it.minute) }

/** Kontrolli i serverit (si kontrolloServerinEOrarit te web-i): kodi, Cron-i dhe çka ndodhi sot me njoftimin e kësaj pajisjeje */
private fun tekstiIServerit(st: Push.Statusi, ora: String): Pair<String, Boolean> {
    val sv = st.serveri ?: return "S'u lidh me serverin për ta kontrolluar. Kontrollo internetin." to true
    val im = st.im
    val tani = System.currentTimeMillis()
    val versioni = (sv["versioni"] as? Number)?.toInt() ?: 0
    val cron = (sv["cron"] as? Number)?.toLong()
    return when {
        versioni < Push.VERSIONI_WORKER -> "Serveri (Cloudflare) ka kodin e vjetër: ngjite kodin e ri te stoku-push." to true
        sv["fotot"] != true -> "Serverit i mungon KV-ja \"FOTO\" (Cloudflare → stoku-push → Bindings)." to true
        cron == null -> "Ora automatike (Cron) s'është vendosur te Cloudflare: stoku-push → Settings → Trigger Events → Cron Triggers → \"Every minute\". Pa të njoftimi ditor s'vjen." to true
        tani - cron > 60 * 60000L -> "Ora automatike (Cron) s'ka punuar që nga " + oraNga(cron) + ". Te Cloudflare → stoku-push → Settings → Trigger Events duhet të jetë \"Every minute\"." to true
        im == null || im["ok"] != true -> "Serveri s'u përgjigj për këtë pajisje. Provo ta fikësh dhe ta ndezësh njoftimin ditor." to true
        im["ekziston"] != true -> "Serveri s'e ka orarin e kësaj pajisjeje. Fike dhe ndize sërish \"Njoftimi ditor\"." to true
        (im["ora"] as? String)?.let { it != ora } == true -> "Serveri ka ende orën " + im["ora"] + " (jo $ora). Zgjidhe orën sërish." to true
        else -> {
            val sot = im["dita"] == LocalDate.now().toString()
            val rez = im["rez"] as? String
            var t: String; var keq = false
            if (sot && rez == "derguar") t = "✓ Sot njoftimi u dërgua në " + oraNga((im["kohaRez"] as? Number)?.toLong() ?: tani) + "."
            else if (sot && rez == "asgje") t = "✓ Serveri punon. Sot s'skadon asnjë produkt, prandaj s'erdhi njoftim."
            else if (sot && rez != null) { keq = true; t = "Sot njoftimi s'u dorëzua në telefon ($rez). Fike dhe ndize sërish \"Njoftimi ditor\"." }
            else t = "✓ Serveri punon. Njoftimi i radhës: " + (if (sot) "nesër" else "sot ose nesër") + " në " + ora + "."
            if ((im["afatet"] as? Number)?.toInt() == 0) t += " (Serveri s'ka ende listën e afateve: hape Stoku-n një herë.)"
            t to keq
        }
    }
}

private fun tekstiGabimitOrarit(a: String): String = when (a) {
    "mungon-kv", "http-404" -> "Shërbimi i njoftimit ditor s'është gati ende në server."
    "pa-leje", "pa-push", "pa-token" -> "Lejo njoftimet më lart, pastaj provo sërish."
    "pa-hyrje" -> "Hyr në llogari që ta përdorësh."
    else -> "S'u ruajt. Kontrollo internetin dhe provo sërish."
}

/** Cilësimet → Njoftimet (si te web-i): leja, push-i i Grupit, njoftimi ditor në orën e zgjedhur, kontrolli i serverit */
@Composable
fun NjoftimetFlete(mbyll: () -> Unit) {
    val n = N
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val versioni by Push.versioni.collectAsState()
    var rifresko by remember { mutableStateOf(0) }
    val gjendja = remember(versioni, rifresko) { Njoftimet.gjendja(ctx) }
    val pushAktiv = remember(versioni, rifresko) { Push.pushAktiv() }
    var hint by remember { mutableStateOf("") }
    var duke by remember { mutableStateOf(false) }
    var serveri by remember { mutableStateOf<Pair<String, Boolean>?>(null) }
    val orari = remember(versioni, rifresko) { Push.orariIm() }
    val aktiv = orari?.get("aktiv") == true
    val ora = remember(versioni, rifresko) { Push.oraEZgjedhur() }

    fun pasLejes() {
        rifresko++
        if (!Njoftimet.lejuar(ctx)) return
        hint = "Duke u lidhur…"
        scope.launch {
            val r = Push.aktivizo(true)
            rifresko++
            hint = when {
                Push.pushAktiv() || !Llogaria.leja("grupi") -> "Gati. Njoftimet vijnë edhe kur Stoku është i mbyllur."
                r == "pa-token" -> "Telefoni s'është lidhur ende me shërbimin e njoftimeve të Google-it. Provo pas pak."
                else -> "S'u lidh me serverin e njoftimeve. Kontrollo internetin dhe provo sërish."
            }
        }
    }
    val kerkoLejen = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { _ ->
        StokuApp.vendosPrefB("njoftimet_pyetur", true)
        pasLejes()
    }
    fun aktivizo() {
        if (gjendja == "bllokuar") {
            try {
                ctx.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            } catch (e: Exception) { Toast.trego("Hape te: Cilësimet e telefonit → Aplikacionet → Stoku → Njoftimet.") }
            return
        }
        if (Njoftimet.duhetLeja() && gjendja != "lejuar") kerkoLejen.launch(Manifest.permission.POST_NOTIFICATIONS) else pasLejes()
    }
    // Kontrolli i serverit kur njoftimi ditor është i ndezur (serveri s'e ka më orarin: regjistrohet vetë)
    fun kontrollo() {
        serveri = "Duke kontrolluar serverin…" to false
        scope.launch {
            var st = Push.statusi()
            if (Push.rinovoNesesMungon(st)) st = Push.statusi()
            serveri = tekstiIServerit(st, Push.oraEZgjedhur())
        }
    }
    fun ruajOrarin(aktivRi: Boolean, oraRe: String) {
        if (aktivRi && !Njoftimet.lejuar(ctx)) { Toast.trego("Lejo njoftimet më lart, pastaj provo sërish."); return }
        duke = true; serveri = null
        scope.launch {
            val r = Push.vendosOrarin(aktivRi, oraRe)
            duke = false; rifresko++
            if (r == "ok") Toast.trego(if (aktivRi) "Njoftimi ditor: çdo ditë në $oraRe." else "Njoftimi ditor u fik.")
            else Toast.trego(tekstiGabimitOrarit(r), 4500)
        }
    }
    fun zgjidhOren() {
        val (h, m) = ora.split(":").map { it.toIntOrNull() ?: 0 }
        TimePickerDialog(ctx, { _, hh, mm ->
            val e = String.format(java.util.Locale.ROOT, "%02d:%02d", hh, mm)
            StokuApp.vendosPref("orari_ora", e)
            if (aktiv) ruajOrarin(true, e) else rifresko++
        }, h, m, true).show()
    }

    LaunchedEffect(aktiv, versioni) { if (aktiv) kontrollo() }

    Flete(mbyll) {
        Text("Njoftimet", style = tx(22, 700, n.ink, -0.02))
        Text("Njoftimet e Grupit dhe të afateve. Vijnë edhe kur Stoku është i mbyllur.", style = tx(14, 400, n.muted))
        val (titulli, teksti, ngj) = when {
            gjendja == "bllokuar" -> Triple("Të bllokuara", "I ke refuzuar njoftimet. Lejoji te: Cilësimet e telefonit → Aplikacionet → Stoku → Njoftimet → Lejo.", "kuqe")
            gjendja != "lejuar" -> Triple("Të fikura", "Shtyp \"Aktivizo njoftimet\" dhe lejoji kur të pyet telefoni.", "gri")
            !Llogaria.leja("grupi") -> Triple("Aktive", "Njoftimet për afatet vijnë në këtë telefon. Që të vijnë edhe kur Stoku është i mbyllur, ndiz më poshtë \"Njoftimi ditor\".", "gjelber")
            pushAktiv -> Triple("Aktive", "Vijnë edhe kur Stoku është i mbyllur, edhe në orë.", "gjelber")
            else -> Triple("Pa lidhje me serverin", "Njoftimet e Grupit s'janë lidhur ende me serverin e njoftimeve. Shtyp \"Provo sërish lidhjen\".", "portokalli")
        }
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).border(1.dp, n.line, RoundedCornerShape(18.dp)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IkonaMeNgjyre(Ik.Zile, ngj, madhesia = 40.dp)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(titulli, style = tx(16, 700, n.ink))
                    Text(teksti, style = tx(13, 400, n.muted))
                }
            }
            val btn = when {
                gjendja == "bllokuar" -> "Hap cilësimet e njoftimeve"
                gjendja != "lejuar" -> "Aktivizo njoftimet"
                Llogaria.leja("grupi") && !pushAktiv -> "Provo sërish lidhjen"
                else -> null
            }
            if (btn != null) Buton(btn, { aktivizo() }, Modifier.fillMaxWidth())
            if (hint.isNotEmpty()) Text(hint, style = tx(13, 400, n.ink2))
        }
        if (Llogaria.leja("afatet")) {
            Text("NJOFTIMI DITOR PËR AFATET", style = tx(13, 700, n.muted, 0.06), modifier = Modifier.padding(top = 6.dp))
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).border(1.dp, n.line, RoundedCornerShape(16.dp))) {
                Row(Modifier.fillMaxWidth().clickable(enabled = !duke) { ruajOrarin(!aktiv, ora) }.padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Njoftimi ditor", style = tx(15, 600, n.ink))
                        Text("Në orën që zgjedh të vjen një njoftim për produktet që skadojnë atë ditë, edhe kur Stoku është i mbyllur. Nëse s'skadon asnjë, s'vjen njoftim.",
                            style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 3.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    androidx.compose.material3.Switch(aktiv, { if (!duke) ruajOrarin(it, ora) }, enabled = !duke, colors = androidx.compose.material3.SwitchDefaults.colors(
                        checkedTrackColor = n.accent, checkedThumbColor = Color.White, uncheckedTrackColor = n.track, uncheckedThumbColor = Color.White, uncheckedBorderColor = n.track))
                }
                Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
                Row(Modifier.fillMaxWidth().clickable(enabled = !duke) { zgjidhOren() }.padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Ora e njoftimit", style = tx(15, 600, n.ink))
                        Text(when {
                            duke -> "Duke ruajtur…"
                            Llogaria.perdoruesi.value == null -> "Hyr në llogari që ta përdorësh."
                            gjendja == "bllokuar" -> "Njoftimet janë të bllokuara te cilësimet e telefonit."
                            gjendja != "lejuar" -> "Shtyp më lart \"Aktivizo njoftimet\"."
                            aktiv -> "Çdo ditë në $ora."
                            else -> "Zgjidh orën dhe ndiz \"Njoftimi ditor\"."
                        }, style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 3.dp))
                    }
                    Text(ora, style = tx(17, 700, n.accentText))
                }
            }
            serveri?.let { (t, keq) ->
                Text(t, style = tx(13, 500, if (keq) n.expInk else n.okInk), modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                    .background(if (keq) n.expTint else n.okTint).padding(12.dp))
            }
        }
    }
}

/** Cilësimet → Ora e dorës: lidhja me kodin 6-shifror që del në orë (Galaxy Watch) */
@Composable
fun OraFlete(mbyll: () -> Unit) {
    val n = N
    val scope = rememberCoroutineScope()
    var kodi by remember { mutableStateOf("") }
    var hint by remember { mutableStateOf("") }
    var duke by remember { mutableStateOf(false) }
    fun lidh() {
        val k = kodi.filter { it.isDigit() }
        if (Llogaria.perdoruesi.value == null) { hint = "Hyr në llogari që ta lidhësh orën."; return }
        if (k.length != 6) { hint = "Kodi ka 6 shifra: shkruaje ashtu si del në orë."; return }
        duke = true; hint = "Duke lidhur…"
        scope.launch {
            val r = Push.lidhOren(k)
            duke = false
            hint = when (r) {
                "ok" -> { kodi = ""; "✓ Ora u lidh. Pas pak sekondash në orë del lista e produkteve që skadojnë sot." }
                "rruga" -> "Serveri (Cloudflare) ka kodin e vjetër: ngjite kodin e ri te stoku-push (versioni 157 ose më i ri) dhe provo prapë."
                "kodi" -> "Ky kod s'u gjet ose ka skaduar. Shiko kodin e ri në orë."
                "rrjeti" -> "S'ka internet. Provo prapë."
                else -> "S'u lidh ($r). Provo prapë."
            }
        }
    }
    Flete(mbyll) {
        Text("Ora e dorës", style = tx(22, 700, n.ink, -0.02))
        Text("Lidhe orën e dorës (Galaxy Watch) me Stoku-n: produktet që skadojnë, heqja nga rafti dhe njoftimet e telefonit, direkt në dorë.",
            style = tx(14, 400, n.muted))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).border(1.dp, n.line, RoundedCornerShape(18.dp)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Aplikacioni Stoku në orë", style = tx(16, 700, n.ink))
            Text("Hape Stoku në orë: del një kod me 6 shifra (ndërrohet çdo 15 sekonda). Shkruaje këtu që ora të lidhet me llogarinë tënde.", style = tx(13, 400, n.muted))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Fusha(kodi, { kodi = it.filter { c -> c.isDigit() }.take(6) }, Modifier.weight(1f), "Kodi nga ora", tastiera = KeyboardType.NumberPassword,
                    kurVeprim = { lidh() })
                Buton("Lidh orën", { lidh() }, aktiv = !duke)
            }
            if (hint.isNotEmpty()) Text(hint, style = tx(13, 500, n.ink2))
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(
                "Te Cilësimet → Njoftimet shtyp \"Aktivizo njoftimet\" dhe lejoji.",
                "Hap aplikacionin Galaxy Wearable → Cilësimet e orës → Njoftimet → Njoftimet e aplikacioneve → ndize Stoku (nëse s'del, shtyp \"Të gjitha\" dhe kërko \"Stoku\").",
                "Fike ekranin e telefonit: njoftimet e Stoku-t (afatet, kërkesat, Grupi) dalin edhe në orë."
            ).forEachIndexed { i, t ->
                Row { Text("${i + 1}.", style = tx(14, 700, n.accentText), modifier = Modifier.width(22.dp)); Text(t, style = tx(14, 400, n.ink2)) }
            }
        }
        Text("Ora i merr njoftimet kur telefoni është me ekran të fikur ose s'po e përdor. Kur ekrani i telefonit është i ndezur, Samsung i lë vetëm te telefoni (mund ta ndryshosh te Galaxy Wearable → Njoftimet).",
            style = tx(13, 400, n.muted))
    }
}

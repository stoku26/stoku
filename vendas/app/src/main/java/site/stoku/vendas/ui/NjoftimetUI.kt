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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import site.stoku.vendas.Llogaria
import site.stoku.vendas.Njoftimet
import site.stoku.vendas.Push
import site.stoku.vendas.StokuApp
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/** Gjendja e njoftimeve si te web-i (NJ_GJENDJET): "push" | "aktive" | "lokale" | "fikur" | "bllokuar" */
fun gjendjaENjoftimeve(ctx: android.content.Context): String {
    val g = try { Njoftimet.gjendja(ctx) } catch (e: Exception) { "fikur" }
    return when {
        g == "bllokuar" -> "bllokuar"
        g != "lejuar" -> "fikur"
        !Llogaria.leja("grupi") -> "aktive"
        // Pa grup s'ka njoftime të grupit, pra as çka të lidhet: më parë dilte "Aktive kur Stoku është hapur" dhe, pas "Provo sërish
        // lidhjen", "S'u lidh me serverin e njoftimeve" edhe pse serveri punonte
        site.stoku.vendas.Grupi.grupi() == null -> "aktive"
        Push.pushAktiv() -> "push"
        else -> "lokale"
    }
}

/** [ngjyra, titulli, teksti, statusi te menyja] si NJ_GJENDJET te app-tel.js */
private val NJ_GJENDJET = mapOf(
    "push" to listOf("gjelber", "Aktive", "Vijnë edhe kur Stoku është i mbyllur, edhe në orë.", "Aktive"),
    "aktive" to listOf("gjelber", "Aktive", "Njoftimet për afatet vijnë në këtë telefon. Që të vijnë edhe kur Stoku është i mbyllur, ndiz më poshtë \"Njoftimi ditor\".", "Aktive"),
    "lokale" to listOf("portokalli", "Aktive kur Stoku është hapur", "Njoftimet e Grupit vijnë kur Stoku është i hapur ose në sfond. Që të vijnë edhe kur mbyllet, duhet hyrë në llogari dhe shërbimi i njoftimeve duhet të jetë gati.", "Kur Stoku është hapur"),
    "fikur" to listOf("gri", "Të fikura", "Shtyp \"Aktivizo njoftimet\" dhe lejoji kur të pyet telefoni.", "Të fikura"),
    "bllokuar" to listOf("kuqe", "Të bllokuara", "I ke refuzuar njoftimet. Lejoji te: Cilësimet e telefonit → Aplikacionet → Stoku → Njoftimet → Lejo.", "Të bllokuara")
)

/** Teksti i shkurtër i gjendjes së njoftimeve (rreshti te Cilësimet), si rifreskoOrarin te web-i */
fun statusiINjoftimeve(ctx: android.content.Context): String {
    val g = gjendjaENjoftimeve(ctx)
    val baza = NJ_GJENDJET[g]!![3]
    val o = try { Push.orariIm() } catch (e: Exception) { null }
    return if (o?.get("aktiv") == true && g != "fikur" && g != "bllokuar") baza + " · ditore " + o["ora"] else baza
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
fun NjoftimetFaqja(mbrapa: () -> Unit) {
    val n = N
    val ctx = LocalContext.current
    val scope = rememberFusha()
    val versioni by Push.versioni.collectAsState()
    val perdoruesi by Llogaria.perdoruesi.collectAsState() // lint: jo .value në vizatim (s'rifreskohej pas hyrjes/daljes)
    val grupiGj by site.stoku.vendas.Grupi.gjendja.collectAsState() // gjendja ndryshon kur ngarkohet grupi
    var rifresko by remember { mutableStateOf(0) }
    val gjendja = remember(versioni, rifresko) { Njoftimet.gjendja(ctx) }
    val pushAktiv = remember(versioni, rifresko, grupiGj) { Push.pushAktiv() }
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
                r == "pa-grup" -> "Gati. S'je në asnjë grup, prandaj s'ka njoftime të grupit."
                r == "pa-token" -> "Telefoni s'është lidhur ende me shërbimin e njoftimeve të Google-it. Provo pas pak."
                r == "rregullat" -> "Firebase s'e lejoi lidhjen e këtij telefoni me grupin. Hape Grupin një herë dhe provo sërish."
                r == "pa-hyrje" -> "Hyr në llogari që të vijnë njoftimet e Grupit edhe kur Stoku është i mbyllur."
                r == "ok" || r == "rrjeti" -> "S'u lidh me serverin e njoftimeve. Kontrollo internetin dhe provo sërish."
                else -> "S'u lidh me serverin e njoftimeve ($r). Provo sërish."
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
            rifresko++ // serveri sapo u përgjigj: gjendja e push-it llogaritet sërish (më parë mbetej "Aktive kur Stoku është hapur")
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

    val g = remember(versioni, rifresko, grupiGj) { gjendjaENjoftimeve(ctx) }
    val x = NJ_GJENDJET[g]!!
    FaqjaECilesimeve("Njoftimet", mbrapa) {
        IntroOps("Njoftimet e Grupit dhe të afateve. Vijnë edhe kur Stoku është i mbyllur.")
        KartaOps(Modifier.clickable(enabled = g == "bllokuar") { aktivizo() }) {
            KokaEKartes(Ik.Zile, x[0], x[1], x[2])
            if (g == "fikur" || g == "lokale") Buton(if (g == "lokale") "Provo sërish lidhjen" else "Aktivizo njoftimet", { aktivizo() }, Modifier.fillMaxWidth())
            if (hint.isNotEmpty()) Text(hint, style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(top = 12.dp))
        }
        if (Llogaria.leja("afatet")) {
            TitulliGrupit("Njoftimi ditor për afatet")
            GrupiOps {
                RreshtNdezes(Ik.KalendarOk, "portokalli", "Njoftimi ditor",
                    "Në orën që zgjedh të vjen një njoftim për produktet që skadojnë atë ditë, edhe kur Stoku është i mbyllur. Nëse s'skadon asnjë, s'vjen njoftim.",
                    aktiv, aktiv = !duke) { ruajOrarin(it, ora) }
                VijaGrupit()
                Row(Modifier.fillMaxWidth().clickable(enabled = !duke) { zgjidhOren() }.padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.align(Alignment.Top)) { IkonaEKategorise(Ik.Alarm, "blu") }
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Ora e njoftimit", style = txR(15f, 600, n.ink, 1.3f))
                        Text(when {
                            duke -> "Duke ruajtur…"
                            perdoruesi == null -> "Hyr në llogari që ta përdorësh."
                            g == "bllokuar" -> "Njoftimet janë të bllokuara te cilësimet e telefonit."
                            g == "fikur" -> "Shtyp më lart \"Aktivizo njoftimet\"."
                            aktiv -> "Çdo ditë në $ora."
                            else -> "Zgjidh orën dhe ndiz \"Njoftimi ditor\"."
                        }, style = txR(12.5f, 400, n.muted, 1.4f), modifier = Modifier.padding(top = 3.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Box(Modifier.size(96.dp, 44.dp).clip(RoundedCornerShape(12.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center) { Text(ora, style = tx(17, 700, n.ink)) }
                }
            }
            serveri?.let { (t, keq) ->
                val (sf, ng) = n.ikonat[if (keq) "portokalli" else "gjelber"]!!
                Text(t, style = txR(13f, 400, ng), modifier = Modifier.padding(start = 4.dp, end = 4.dp, top = 10.dp).fillMaxWidth().clip(RoundedCornerShape(12.dp))
                    .background(sf).padding(horizontal = 12.dp, vertical = 10.dp))
            }
        }
    }
}

/** Teksti me pjesë të trasha: **kështu** (si <b> te hapat e web-it) */
private fun meTeTrasha(t: String, ngjyra: Color) = buildAnnotatedString {
    t.split("**").forEachIndexed { i, pj -> if (i % 2 == 1) withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = ngjyra)) { append(pj) } else append(pj) }
}

/** .ops-hapat: hapat me numër në rreth blu */
@Composable
private fun Hapat(hapat: List<String>) {
    val n = N
    Column(Modifier.padding(top = 2.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        hapat.forEachIndexed { i, t ->
            Row {
                val (sf, ng) = n.ikonat["blu"]!!
                Box(Modifier.size(24.dp).clip(CircleShape).background(sf), contentAlignment = Alignment.Center) { Text("${i + 1}", style = txF(12.5f, 700, ng)) }
                Spacer(Modifier.width(12.dp))
                Text(meTeTrasha(t, n.ink), style = txR(14f, 400, n.ink2), modifier = Modifier.weight(1f))
            }
        }
    }
}

/** Cilësimet → Ora e dorës: lidhja me kodin 6-shifror (Galaxy Watch) dhe hapat për njoftimet (Galaxy Watch, Apple Watch) */
@Composable
fun OraFaqja(mbrapa: () -> Unit) {
    val n = N
    val scope = rememberFusha()
    var kodi by remember { mutableStateOf("") }
    var hint by remember { mutableStateOf("") }
    var duke by remember { mutableStateOf(false) }
    var ora by remember { mutableStateOf("galaxy") }
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
    FaqjaECilesimeve("Ora e dorës", mbrapa) {
        IntroOps("Lidhe orën e dorës (Galaxy Watch ose Apple Watch) me Stoku-n.")
        TitulliGrupit("Ora e dorës", pare = true)
        KartaOps {
            KokaEKartes(Ik.OraDore, "blu", "Stoku në orë", "Produktet që skadojnë, heqja nga rafti dhe njoftimet e telefonit, direkt në dorë.")
            // .segment: Galaxy Watch / Apple Watch
            Row(Modifier.fillMaxWidth().padding(bottom = 14.dp).clip(RoundedCornerShape(12.dp)).background(n.sunken).padding(4.dp)) {
                listOf("galaxy" to "Galaxy Watch", "apple" to "Apple Watch").forEach { (k, t) ->
                    val a = ora == k
                    Box(Modifier.weight(1f).height(38.dp).then(if (a) Modifier.shadow(2.dp, RoundedCornerShape(9.dp)) else Modifier).clip(RoundedCornerShape(9.dp))
                        .background(if (a) n.surface else Color.Transparent).clickable { ora = k }, contentAlignment = Alignment.Center) {
                        Text(t, style = txF(13.5f, 600, if (a) n.ink else n.ink3))
                    }
                }
            }
            if (ora == "galaxy") {
                Column(Modifier.padding(bottom = 12.dp).fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(n.surface2).border(1.dp, n.line, RoundedCornerShape(14.dp))
                    .padding(horizontal = 14.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Aplikacioni Stoku në orë", style = tx(18, 700, n.ink, -0.01))
                    Text("Hape Stoku në orë: del një kod me 6 shifra (ndërrohet çdo 15 sekonda). Shkruaje këtu që ora të lidhet me llogarinë tënde.", style = txR(12.5f, 400, n.muted))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Fusha(kodi, { kodi = it.filter { c -> c.isDigit() }.take(6) }, Modifier.weight(1f), "Kodi nga ora", tastiera = KeyboardType.NumberPassword,
                            kurVeprim = { lidh() }, lartesia = 44.dp, rrezja = 12.dp, stili = tx(17, 700).copy(letterSpacing = 3.sp, textAlign = TextAlign.Center))
                        Buton("Lidh orën", { lidh() }, Modifier.weight(1f), aktiv = !duke, lartesia = 44.dp)
                    }
                    if (hint.isNotEmpty()) Text(hint, style = txR(12.5f, 500, n.ink2))
                }
                Hapat(listOf(
                    "Ke aplikacionin **Stoku për Android** (këtë që po e përdor): njoftimet e tij dalin në orë.",
                    "Te Cilësimet → **Njoftimet** shtyp **Aktivizo njoftimet** dhe lejoji.",
                    "Hap aplikacionin **Galaxy Wearable** → **Cilësimet e orës** → **Njoftimet** → **Njoftimet e aplikacioneve** → ndize **Stoku** (nëse s'del, shtyp \"Të gjitha\" dhe kërko \"Stoku\").",
                    "Fike ekranin e telefonit: njoftimet e Stoku-t (afatet, kërkesat, Grupi) dalin edhe në orë."
                ))
                Text("Ora i merr njoftimet kur telefoni është me ekran të fikur ose s'po e përdor. Kur ekrani i telefonit është i ndezur, Samsung i lë vetëm te telefoni (mund ta ndryshosh te Galaxy Wearable → Njoftimet, te opsioni për njoftimet gjatë përdorimit të telefonit).",
                    style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(top = 12.dp))
            } else {
                Hapat(listOf(
                    "Në iPhone hap **stoku.site** me **Safari** → butoni **Shpërndaj** (katrori me shigjetë) → **Shto në ekranin bazë** (Add to Home Screen). Duhet iOS 16.4 ose më i ri.",
                    "Hape Stoku **nga ikona** në ekranin bazë (jo nga Safari), hyr në llogari dhe te Cilësimet → **Njoftimet** shtyp **Aktivizo njoftimet** → **Lejo**.",
                    "Në iPhone hap aplikacionin **Watch** → **Njoftimet** (Notifications) → poshtë te **Pasqyro sinjalizimet e iPhone nga** (Mirror iPhone Alerts From) → ndize **Stoku**.",
                    "Kyçe iPhone-in: njoftimet e Stoku-t (afatet, kërkesat, Grupi) dalin edhe në orë."
                ))
                Text("Apple Watch i merr njoftimet vetëm kur iPhone-i është i kyçur (ekrani i fikur) dhe ora është në dorë dhe e shkyçur. Nëse s'e sheh Stoku-n te lista e aplikacionit Watch, hape Stoku një herë nga ikona dhe lejo njoftimet, pastaj kontrollo prapë.",
                    style = txR(12.5f, 400, n.muted), modifier = Modifier.padding(top = 12.dp))
            }
        }
    }
}

/**
 * Pyetja për njoftimet kur hapet Stoku (si dlgNjoftimet te web-i): vetëm Android 13+, kur leja s'është dhënë ende dhe
 * telefoni s'ka pyetur; "Jo tani" e shtyn 3 ditë.
 */
@Composable
fun PyetjaENjoftimeve() {
    val n = N
    val ctx = LocalContext.current
    val scope = rememberFusha()
    val p by Llogaria.perdoruesi.collectAsState()
    var hapur by remember { mutableStateOf(false) }
    LaunchedEffect(p?.uid) {
        hapur = false
        if (p == null || StokuApp.neProve) return@LaunchedEffect
        kotlinx.coroutines.delay(2000)
        if (Njoftimet.gjendja(ctx) != "fikur") return@LaunchedEffect
        val joTani = StokuApp.prefsOse("njoftimet_jo_tani", "0").toLongOrNull() ?: 0L
        if (System.currentTimeMillis() - joTani < 3 * 86400000L) return@LaunchedEffect
        hapur = true
    }
    val kerko = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { po ->
        StokuApp.vendosPrefB("njoftimet_pyetur", true)
        if (po) { Toast.trego("Njoftimet u aktivizuan."); scope.launch { try { Push.aktivizo(false) } catch (e: Exception) { } } }
        else Toast.trego("Njoftimet u refuzuan. Mund t'i lejosh te cilësimet e telefonit → Aplikacionet → Stoku → Njoftimet.", 5000)
    }
    if (!hapur) return
    fun joTani() { StokuApp.vendosPref("njoftimet_jo_tani", System.currentTimeMillis().toString()); hapur = false }
    Flete(::joTani) {
        Box(Modifier.size(56.dp).clip(CircleShape).background(n.accentTint), contentAlignment = Alignment.Center) {
            androidx.compose.material3.Icon(Ik.Zile, null, Modifier.size(30.dp), tint = n.accentText)
        }
        Text("Njoftimet për afatet", style = tx(22, 700, n.ink, -0.02))
        Text("Të lajmërojmë me njoftim në telefon:", style = tx(15, 400, n.ink2))
        listOf(
            Triple(n.near, "kur një produkti i kanë mbetur ", "30 ditë" to " deri në skadim"),
            Triple(n.exp, "kur një produkt ", "skadon" to ", që ta heqësh nga rafti/pozita")
        ).forEach { (ng, para, pas) ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(Modifier.size(10.dp).clip(CircleShape).background(ng))
                Text(buildAnnotatedString {
                    append(para); withStyle(SpanStyle(fontWeight = FontWeight(700))) { append(pas.first) }; append(pas.second)
                }, style = tx(15, 400, n.ink))
            }
        }
        Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Buton("Jo tani", ::joTani, Modifier.weight(1f), lloji = "tekst")
            Buton("Aktivizo njoftimet", {
                hapur = false
                try { kerko.launch(Manifest.permission.POST_NOTIFICATIONS) } catch (e: Exception) { }
            }, Modifier.weight(1.4f))
        }
    }
}

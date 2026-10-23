package site.stoku.vendas.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import site.stoku.logjika.Afatet
import site.stoku.logjika.GrupiLogjika
import site.stoku.logjika.Obj
import site.stoku.logjika.eVertete
import site.stoku.logjika.jsString
import site.stoku.logjika.numerOse0
import site.stoku.logjika.siListe
import site.stoku.logjika.siObj
import site.stoku.vendas.Dyqani
import site.stoku.vendas.Grupi
import site.stoku.vendas.Llogaria
import java.time.LocalDate
import kotlin.math.abs
import kotlin.math.roundToInt

/*
 * Grupi (si tabi "Grupi" te web-i i telefonit, app-tel.js "vizatoEkipen"): Përmbledhja, Afatet e grupit, Aktiviteti,
 * Kalendari, Kolegët; pa grup: ftesat, "Hyr në një grup", "Krijo grupin tënd"; zilja me njoftimet personale.
 * Të dhënat i mban Grupi.kt (të njëjtat dokumente që shkruan web-i).
 */

private val EK_MUAJT = listOf("JAN", "SHK", "MAR", "PRI", "MAJ", "QER", "KOR", "GUS", "SHT", "TET", "NËN", "DHJ")
private val EK_DITET = listOf("E diel", "E hënë", "E martë", "E mërkurë", "E enjte", "E premte", "E shtunë")
private val EK_MUAJT_PLOTE = listOf("janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor")
private val EK_NGJYRAT = listOf(0x1459B8, 0x8E3FB0, 0x0F7C7C, 0xB5542C, 0x5D6B2E, 0xAD1457, 0x37474F, 0x6D4C41)

/** Ngjyra e avatarit sipas emrit (si ekNgjyra te web-i: i njëjti koleg ka të njëjtën ngjyrë kudo) */
fun ngjyraEEmrit(emri: String?): Color {
    var h = 0
    for (c in emri.orEmpty()) h = h * 31 + c.code
    return Color(EK_NGJYRAT[abs(h % EK_NGJYRAT.size)].toLong() or 0xFF000000)
}

private fun shkronja(emri: String?): String = emri.orEmpty().take(1).uppercase().ifEmpty { "?" }
private fun dataSot(): String { val d = LocalDate.now(); return EK_DITET[d.dayOfWeek.value % 7] + ", " + d.dayOfMonth + " " + EK_MUAJT_PLOTE[d.monthValue - 1] }
private fun kurTekst(n: Int?): String = when {
    n == null -> ""
    n < -1 -> "para " + Afatet.ditetParaTekst(-n)
    n == -1 -> "dje"
    n == 0 -> "sot"
    n == 1 -> "nesër"
    else -> "për " + Afatet.ditetTekst(n)
}
private fun emriAfatit(a: Obj): String = (a["emri"] as? String)?.ifEmpty { null } ?: (a["barkodi"] as? String)?.ifEmpty { null } ?: "(pa emër)"
private fun afatetE(a: Obj): List<Obj> = a["afatet"].siListe().mapNotNull { it.siObj() }
private fun kohaE(o: Obj, k: String): Long = numerOse0(o[k]).toLong()
private fun nrKolege(n: Int) = if (n == 1) "1 koleg" else "$n kolegë"

/** Pyetja para një veprimi (Konfirmo) */
private class Pyetja(val titulli: String, val teksti: String, val veprimi: String, val rrezik: Boolean, val po: () -> Unit)

@Composable
fun GrupiEkrani() {
    val n = N
    if (!Llogaria.leja("grupi")) return
    val gj by Grupi.gjendja.collectAsState()
    val doc by Grupi.grupiDoc.collectAsState()
    val anF by Grupi.anetaret.collectAsState()
    val permF by Grupi.permbledhjet.collectAsState()
    val ngjF by Grupi.ngjarjet.collectAsState()
    val ngjGati by Grupi.ngjarjetGati.collectAsState()
    val ftesat by Grupi.ftesatEMia.collectAsState()
    val ftesatG by Grupi.ftesatEGrupit.collectAsState()
    val kerkesatM by Grupi.kerkesatEMia.collectAsState()
    val kerkesatG by Grupi.kerkesatEGrupit.collectAsState()
    val njoftimet by Grupi.njoftimet.collectAsState()
    val dq by Dyqani.gjendja.collectAsState()
    var tani by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) { if (!Grupi.neProve) while (true) { delay(30_000); tani = System.currentTimeMillis() } } // prania "online" skadon me kohë

    var pamja by rememberSaveable { mutableStateOf("permbledhja") }
    var anetariZ by rememberSaveable { mutableStateOf("krejt") }
    var filtri by rememberSaveable { mutableStateOf<String?>(null) }
    var zilja by remember { mutableStateOf(false) }
    var kerkesa by remember { mutableStateOf(false) }
    var pyetja by remember { mutableStateOf<Pyetja?>(null) }

    val anetar = gj.qasja == "anetar"
    if (!anetar && pamja != "permbledhja") pamja = "permbledhja"
    BackHandler(enabled = anetar && pamja != "permbledhja") { pamja = "permbledhja"; anetariZ = "krejt"; filtri = null }
    fun hapAnetarin(uid: String, f: String? = null) { anetariZ = uid; filtri = f; pamja = "afatet" }
    fun zgjidhPamjen(p: String) { anetariZ = "krejt"; filtri = null; pamja = p }

    val an = remember(anF, permF, ngjF, dq.afatet, gj, tani) { Grupi.anetaretMeAfate() }
    val ctx = Konteksti(an, permF != null, tani, ::hapAnetarin, ::zgjidhPamjen) { pyetja = it }

    val titulli = when {
        !anetar -> "Grupi"
        pamja == "afatet" -> if (anetariZ == "krejt") "Afatet" else (an.firstOrNull { it["uid"] == anetariZ }?.get("emri") as? String ?: "Afatet")
        pamja == "aktiviteti" -> "Aktiviteti"
        pamja == "kalendari" -> "Kalendari"
        pamja == "anetaret" -> "Kolegët"
        else -> (doc?.get("emri") as? String)?.ifEmpty { null } ?: "Grupi"
    }
    val nNj = remember(njoftimet, ngjF) { Grupi.numriNjoftimeve() }

    Column(Modifier.fillMaxSize()) {
        // Koka: data (vetëm në faqen e parë), titulli dhe zilja
        Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                if (pamja == "permbledhja") Text(dataSot(), style = tx(14, 500, n.muted))
                Text(titulli, style = tx(28, 800, n.ink, -0.02), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(Modifier.width(12.dp))
            ButonIkone(Ik.Zile, "Njoftimet", { zilja = true }, shenja = if (nNj > 0) (if (nNj > 99) "99+" else nNj.toString()) else null)
        }
        if (anetar) Menyja(pamja, Grupi.eshtePronar() && kerkesatG.isNotEmpty()) { p ->
            if (p == "permbledhja" || p != pamja || anetariZ != "krejt") zgjidhPamjen(p)
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
        Box(Modifier.weight(1f)) {
            when {
                gj.qasja == "pa-grup" -> PaGrup(ftesat, kerkesatM, ctx)
                gj.qasja == "pa-rregulla" -> Bosh("Grupi s'është gati ende", "Administratori duhet t'i vendosë rregullat e reja të Firebase-it (Firestore → Rules) për grupet. Stoku dhe afatet e tua punojnë si zakonisht.")
                gj.qasja == "gabim" -> Bosh("S'u lidh me grupin", "Kontrollo internetin dhe provo përsëri.")
                !anetar -> Info("Duke u lidhur me grupin…")
                pamja == "afatet" -> AfatetEGrupit(anetariZ, filtri, { filtri = it }, ctx)
                pamja == "aktiviteti" -> Aktiviteti(ngjF, ngjGati, ctx)
                pamja == "kalendari" -> Kalendari(ctx)
                pamja == "anetaret" -> Koleget(doc, ftesat, ftesatG, kerkesatG, ctx)
                else -> Permbledhja(ftesat, kerkesatG, ngjF, ngjGati, ctx) { kerkesa = true }
            }
        }
    }
    if (zilja) ZiljaFlete(ctx) { zilja = false }
    if (kerkesa) KerkesaFlete { kerkesa = false }
    pyetja?.let { p -> Konfirmo(p.titulli, p.teksti, p.veprimi, p.rrezik, mbyll = { pyetja = null }, po = p.po) }
}

/** Gjërat që u duhen pamjeve: anëtarët me afatet, koha, kalimet mes pamjeve dhe pyetjet */
private class Konteksti(
    val anetaret: List<Obj>, val ngarkuar: Boolean, val tani: Long,
    val hapAnetarin: (String, String?) -> Unit, val zgjidhPamjen: (String) -> Unit, val pyet: (Pyetja) -> Unit
) {
    val krejtAfatet: List<Obj> by lazy { anetaret.flatMap { afatetE(it) } }
    fun online(a: Obj) = a["uneJam"] == true || GrupiLogjika.eshteOnline(a, tani)
}

// ---------------- Menyja: pesë pllaka ----------------
@Composable
private fun Menyja(pamja: String, pike: Boolean, zgjidh: (String) -> Unit) {
    val n = N
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        listOf(Triple("permbledhja", "Përmbledhja", Ik.Pulti), Triple("afatet", "Afatet", Ik.Kohe), Triple("aktiviteti", "Aktiviteti", Ik.Aktiviteti),
            Triple("kalendari", "Kalendari", Ik.Kalendari), Triple("anetaret", "Kolegët", Ik.Koleget)).forEach { (k, t, ik) ->
            val aktiv = pamja == k
            Column(Modifier.weight(1f).clip(RoundedCornerShape(12.dp)).clickable { zgjidh(k) }.padding(vertical = 2.dp),
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Box {
                    val forma = RoundedCornerShape(15.dp)
                    Box(Modifier.size(46.dp).clip(forma).background(if (aktiv) n.accent else n.surface, forma)
                        .then(if (aktiv) Modifier else Modifier.border(1.dp, n.line, forma)), contentAlignment = Alignment.Center) {
                        Icon(ik, t, Modifier.size(21.dp), tint = if (aktiv) Color.White else n.ink2)
                    }
                    if (k == "anetaret" && pike) Box(Modifier.align(Alignment.TopEnd).offset(x = 3.dp, y = (-2).dp).size(12.dp).clip(CircleShape).background(n.bg).padding(2.dp).clip(CircleShape).background(n.badge))
                }
                Text(t, style = tx(12, if (aktiv) 600 else 500, if (aktiv) n.accentText else n.ink3), maxLines = 1)
            }
        }
    }
}

// ---------------- Pjesët e vogla ----------------
@Composable
private fun Info(t: String) {
    Text(t, style = tx(14, 400, N.muted), modifier = Modifier.fillMaxWidth().padding(20.dp))
}

@Composable
private fun Bosh(titulli: String, teksti: String = "", modifier: Modifier = Modifier) {
    val n = N
    Column(modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 36.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(titulli, style = tx(17, 700, n.ink), textAlign = TextAlign.Center)
        if (teksti.isNotEmpty()) Text(teksti, style = tx(14, 400, n.faint), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 6.dp))
    }
}

/** Titulli i vogël me shkronja të mëdha (af-grup-krye) */
@Composable
private fun Krye(t: String, modifier: Modifier = Modifier) {
    Text(t.uppercase(), style = tx(12, 600, N.muted, 0.06), modifier = modifier.padding(top = 20.dp, bottom = 8.dp))
}

/** Seksioni i Përmbledhjes (ek-seksion): titull + lidhje djathtas */
@Composable
private fun Seksion(t: String, djathtas: String? = null, nen: String? = null, kurKlik: (() -> Unit)? = null) {
    Row(Modifier.fillMaxWidth().padding(top = 22.dp, bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(t, style = tx(17, 700, N.ink), modifier = Modifier.weight(1f))
        if (nen != null) Text(nen, style = tx(14, 600, N.muted))
        if (djathtas != null && kurKlik != null) Lidhje(djathtas, kurKlik, madhesia = 14)
    }
}

@Composable
private fun Avatari(emri: String?, madhesia: Dp, online: Boolean = false) {
    val n = N
    Box(Modifier.size(madhesia)) {
        Box(Modifier.size(madhesia).clip(CircleShape).background(ngjyraEEmrit(emri)), contentAlignment = Alignment.Center) {
            Text(shkronja(emri), style = tx(maxOf(8, (madhesia.value * 0.4f).roundToInt()), 700, Color.White))
        }
        if (online) Box(Modifier.align(Alignment.BottomEnd).offset(1.dp, 1.dp).size(madhesia * 0.3f + 4.dp).clip(CircleShape).background(n.bg).padding(2.dp).clip(CircleShape).background(n.okDot))
    }
}

/** Avatari i lehtë (ek-avatar): te aktiviteti me ngjyrën e ngjarjes, te kolegët me pikën online */
@Composable
private fun AvatariLehte(emri: String?, lloji: String? = null, madhesia: Dp = 34.dp, online: Boolean = false) {
    val n = N
    val (sf, ng) = when (lloji) {
        "hequr" -> n.expTint to n.exp
        "lajmeruar" -> n.nearTint to n.near
        "afate-te-reja", "rikthyer" -> n.okTint to n.ok
        else -> n.surface2 to n.accentText
    }
    Box(Modifier.size(madhesia)) {
        Box(Modifier.size(madhesia).clip(CircleShape).background(sf), contentAlignment = Alignment.Center) {
            Text(shkronja(emri), style = tx(if (madhesia < 34.dp) 13 else 14, 700, ng))
        }
        if (online) Box(Modifier.align(Alignment.BottomEnd).offset(2.dp, 2.dp).size(14.dp).clip(CircleShape).background(n.bg).padding(2.dp).clip(CircleShape).background(n.okDot))
    }
}

/** Pllaka me numër (af-numer): e kuqe/portokalli/e gjelbër/gri sipas llojit */
@Composable
private fun Pllaka(lloji: String, numri: String, teksti: String, modifier: Modifier, aktiv: Boolean = false, onClick: (() -> Unit)? = null) {
    val n = N
    val (sf, ng) = when (lloji) {
        "skaduar" -> n.expTint to n.exp
        "afer" -> n.nearTint to n.near
        "ok" -> n.okTint to n.ok
        "hequr" -> n.remTint to n.rem
        else -> n.surface to n.ink
    }
    val forma = RoundedCornerShape(18.dp)
    var m = modifier.heightIn(min = 82.dp).clip(forma).background(sf, forma)
    if (lloji == "" || aktiv) m = m.border(if (aktiv) 2.dp else 1.dp, if (aktiv) ng else n.line, forma)
    if (onClick != null) m = m.clickable(onClick = onClick)
    Column(m.padding(horizontal = 13.dp, vertical = 12.dp), verticalArrangement = Arrangement.Center) {
        Text(numri, style = tx(26, 700, ng))
        Text(teksti, style = tx(13, 600, ng), modifier = Modifier.padding(top = 2.dp))
    }
}

/** Të dhënat e një pllake */
private class P(val lloji: String, val numri: String, val teksti: String, val aktiv: Boolean = false, val onClick: () -> Unit)

/** Rrjeta me 3 pllaka për rresht */
@Composable
private fun RrjetaEPllakave(pllakat: List<P>) {
    Column(Modifier.fillMaxWidth().padding(top = 14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        pllakat.chunked(3).forEach { r ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                r.forEach { Pllaka(it.lloji, it.numri, it.teksti, Modifier.weight(1f), it.aktiv, it.onClick) }
                repeat(3 - r.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

private fun lejohetHeqja(a: Obj): Boolean = Llogaria.leja(if (a["pronariUid"] == Grupi.uidIm()) "afatetNdrysho" else "grupiHeq")

private fun tekstiNePritje(a: Obj, tani: Long): String {
    val une = a["nePritjeUid"] == Grupi.uidIm()
    val se = kohaE(a, "nePritjeSe")
    return (if (une) "E hoqe nga rafti" else "E hoqi " + jsString(a["nePritjeNga"])) + (if (se > 0) " " + GrupiLogjika.kohaRelative(se, tani) else "") +
        ". Pret miratimin e " + ((a["pronariEmri"] as? String)?.ifEmpty { null } ?: "kolegut") + "."
}

/** "Unë e hoqa": i imi → si te Afatet; i kolegut → kërkesë te pronari, që e heq vetëm kur ai e pranon */
private fun heqNgaRafti(a: Obj, ctx: Konteksti, scope: kotlinx.coroutines.CoroutineScope) {
    if (!lejohetHeqja(a)) return
    if (a["pronariUid"] == Grupi.uidIm()) {
        Dyqani.afati(a["id"] as? String ?: return)?.let { shenoHequr(it) }
        return
    }
    val emri = (a["emri"] as? String)?.ifEmpty { null } ?: (a["barkodi"] as? String)?.ifEmpty { null } ?: "produktin"
    val pronari = (a["pronariEmri"] as? String)?.ifEmpty { null } ?: "kolegut"
    ctx.pyet(Pyetja("E hoqe nga rafti?", "\"$emri\" i përket $pronari. Atij i shkon njoftim, dhe produkti hiqet nga afatet e tij vetëm kur ai e pranon.", "Po, e hoqa", false) {
        scope.launch {
            val r = Grupi.heqAfatinEKolegut(a)
            Toast.trego(when (r) {
                null -> "\"$emri\": $pronari i shkoi për miratim."
                "leje" -> "S'u lejua: vetëm kolegët e pranuar të grupit mund ta bëjnë këtë."
                else -> "S'u dërgua. Kontrollo internetin dhe provo përsëri."
            }, 4000)
        }
    })
}

/** Karta e Përmbledhjes (ek-kart): data, produkti, kush e ka, "Unë e hoqa" */
@Composable
private fun KartaPultit(a: Obj, ctx: Konteksti) {
    val n = N
    val scope = rememberCoroutineScope()
    val st = Afatet.statusi(a)
    val d = Afatet.ditetDeri(a["data"])
    val dt = (a["data"] as? String)?.split("-")?.takeIf { it.size == 3 }
    val kuqe = st == "skaduar" || st == "pa-date"
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp).clip(RoundedCornerShape(18.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(18.dp))
        .padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(Modifier.size(52.dp).clip(RoundedCornerShape(14.dp)).background(if (kuqe) n.expTint else n.nearTint),
            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            val c = if (kuqe) n.exp else n.near
            Text(dt?.get(2)?.toIntOrNull()?.toString() ?: "?", style = tx(19, 700, c))
            if (dt != null) Text(EK_MUAJT.getOrElse((dt[1].toIntOrNull() ?: 1) - 1) { "" }, style = tx(10, 700, c))
        }
        Column(Modifier.weight(1f)) {
            Text(emriAfatit(a), style = tx(16, 600, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Row(Modifier.padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Avatari(a["pronariEmri"] as? String, 18.dp)
                Spacer(Modifier.width(6.dp))
                val nen = listOf(jsString(a["pronariEmri"] ?: ""), if ((a["data"] as? String).orEmpty().isNotEmpty()) kurTekst(d) else "", Afatet.sasiaTekst(a))
                    .filter { it.isNotEmpty() }.joinToString(" · ")
                Text(nen, style = tx(13, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        if (st == "skaduar" && eVertete(a["nePritjeNga"])) {
            Text("Në pritje", style = tx(13, 600, n.ink3), modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(n.surface2).padding(horizontal = 12.dp, vertical = 9.dp))
        } else if (st == "skaduar" && lejohetHeqja(a)) {
            val ng = if (n.erret) Color(0xFF14161B) else Color.White
            Row(Modifier.clip(RoundedCornerShape(12.dp)).background(n.exp).clickable { heqNgaRafti(a, ctx, scope) }.padding(horizontal = 13.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Icon(Ik.Kontroll, null, Modifier.size(16.dp), tint = ng)
                Spacer(Modifier.width(6.dp))
                Text("Unë e hoqa", style = tx(14, 700, ng))
            }
        }
    }
}

/** Karta e afatit te Grupi (af-karta, si te Afatet, me kolegun dhe "Unë e hoqa") */
@Composable
private fun KartaEAfatitTeGrupit(a: Obj, meEmer: Boolean, ctx: Konteksti) {
    val n = N
    val scope = rememberCoroutineScope()
    val st = Afatet.statusi(a)
    val d = Afatet.ditetDeri(a["data"])
    val (sfondi, vija, mesazhi) = when (st) {
        "skaduar", "pa-date" -> Triple(n.cardExp, n.cardExpLine, n.exp)
        "afer" -> Triple(n.cardNear, n.cardNearLine, n.near)
        "ok" -> Triple(n.cardOk, n.cardOkLine, n.ok)
        else -> Triple(n.cardRem, n.cardRemLine, n.rem)
    }
    Row(Modifier.fillMaxWidth().padding(bottom = 10.dp).clip(RoundedCornerShape(18.dp)).background(sfondi).border(1.dp, vija, RoundedCornerShape(18.dp)).padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        KutiaEDiteve(st, d)
        Column(Modifier.weight(1f)) {
            Text(emriAfatit(a), style = tx(15, 600, n.ink))
            val paFurn = Llogaria.eshteMerchandiser()
            val nen = listOf(jsString(a["mk"] ?: ""), if (paFurn) "" else (a["furnizuesi"] as? String).orEmpty(), Afatet.sasiaTekst(a),
                if ((a["data"] as? String).orEmpty().isNotEmpty()) Afatet.formato(a["data"]) else "", if (meEmer) jsString(a["pronariEmri"] ?: "") else "")
                .filter { it.isNotEmpty() }.joinToString(" · ")
            if (nen.isNotEmpty()) Text(nen, style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 3.dp))
            if ((a["emri"] as? String).orEmpty().isNotEmpty() && (a["barkodi"] as? String).orEmpty().isNotEmpty())
                Text(a["barkodi"] as String, style = txMono(11f, n.faint), modifier = Modifier.padding(top = 2.dp))
            val pritje = eVertete(a["nePritjeNga"])
            val msg = when {
                st == "hequr" -> "U hoq nga rafti" + (if (eVertete(a["hequrNga"])) " nga " + jsString(a["hequrNga"]) else "") +
                    (if (kohaE(a, "hequrSe") > 0) " · " + GrupiLogjika.kohaRelative(kohaE(a, "hequrSe"), ctx.tani) else "") + "."
                pritje -> tekstiNePritje(a, ctx.tani)
                else -> Afatet.pershkrimi(a)
            }
            Text(msg, style = tx(12, 600, mesazhi), modifier = Modifier.padding(top = 4.dp))
            if (st == "skaduar" && pritje) {
                Text("Në pritje të miratimit", style = tx(13, 600, n.ink3), modifier = Modifier.padding(top = 8.dp).clip(RoundedCornerShape(10.dp)).background(n.surface2).padding(horizontal = 11.dp, vertical = 6.dp))
            } else if (st == "skaduar" && lejohetHeqja(a)) {
                Row(Modifier.padding(top = 8.dp).clip(RoundedCornerShape(10.dp)).border(1.5.dp, n.exp, RoundedCornerShape(10.dp))
                    .clickable { heqNgaRafti(a, ctx, scope) }.padding(horizontal = 11.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Ik.Kontroll, null, Modifier.size(15.dp), tint = n.exp)
                    Spacer(Modifier.width(6.dp))
                    Text("Unë e hoqa", style = tx(13, 700, n.exp))
                }
            }
        }
    }
}

/** Një ngjarje e aktivitetit (ek-ngjarje) */
@Composable
private fun Ngjarja(x: Obj, koha: String) {
    val n = N
    val t = GrupiLogjika.tekstiNgjarjes(x, Grupi.uidIm())
    Row(Modifier.fillMaxWidth().padding(vertical = 11.dp), horizontalArrangement = Arrangement.spacedBy(11.dp)) {
        AvatariLehte(t.avatar ?: (x["emri"] as? String), t.lloji, 32.dp)
        Column(Modifier.weight(1f)) {
            Text(buildAnnotatedString {
                withStyle(SpanStyle(fontWeight = FontWeight(700))) { append(t.kush) }
                append(" " + t.cfare)
            }, style = txF(14.5f, 400, n.ink))
            if (t.detaje.isNotEmpty()) Text(t.detaje, style = txF(12.5f, 400, n.muted), modifier = Modifier.padding(top = 2.dp))
        }
        Text(koha, style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 2.dp))
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
}

/** Ftesa për një grup (ek-ftesa): Prano / Refuzo */
@Composable
private fun FtesaKarta(f: Obj, ctx: Konteksti) {
    val n = N
    val scope = rememberCoroutineScope()
    var duke by remember { mutableStateOf(false) }
    fun prano() {
        duke = true
        scope.launch {
            val r = Grupi.pranoFtesen(f)
            duke = false
            when (r) {
                null -> { Toast.trego("U bashkove me grupin \"" + jsString(f["grupiEmri"] ?: "") + "\"."); ctx.zgjidhPamjen("anetaret") }
                "duke-ngarkuar" -> Toast.trego("Prit pak, po ngarkohen kolegët e grupit…", 5000)
                "ftesa-skadoi", "leje" -> Toast.trego("Kjo ftesë s'vlen më (u anulua ose grupi u fshi).", 5000)
                else -> Toast.trego("S'u pranua. Kontrollo internetin dhe provo përsëri.", 5000)
            }
        }
    }
    KartaEKaltert {
        Column(Modifier.weight(1f)) {
            Text((f["grupiEmri"] as? String)?.ifEmpty { null } ?: "Grup", style = txF(14.5f, 800, n.ink))
            val kur = kohaE(f, "koha")
            Text(((f["ngaEmri"] as? String)?.ifEmpty { null } ?: "Dikush") + " të fton në këtë grup" + (if (kur > 0) " · " + GrupiLogjika.kohaRelative(kur, ctx.tani) else "") + ".",
                style = txF(13.5f, 400, n.ink2))
        }
        Buton("Prano", {
            if (Grupi.grupi() != null) {
                val m = Grupi.mundTeLargohet()
                if (!m.ok) { Toast.trego("Prit pak, po ngarkohen kolegët e grupit…", 5000); return@Buton }
                val g = jsString(Grupi.grupiDoc.value?.get("emri") ?: "")
                ctx.pyet(Pyetja("Të kalosh te grupi \"" + jsString(f["grupiEmri"] ?: "") + "\"?", "Largohesh nga grupi \"$g\"" +
                    (if (m.iFundit) " (je i fundit në grup: grupi fshihet bashkë me aktivitetin)" else if (m.trashegimtari != null) " (admin bëhet " + (m.trashegimtariEmri ?: "kolegu") + ")" else "") +
                    ". Stoku dhe afatet e tua s'preken.", "Kalo", false) { prano() })
            } else prano()
        }, aktiv = !duke, lartesia = 38.dp)
        Buton("Refuzo", { scope.launch { if (Grupi.refuzoFtesen(f) != null) Toast.trego("S'u refuzua. Kontrollo internetin.", 4000) } }, lloji = "tekst", lartesia = 38.dp)
    }
}

/** Kërkesa e dikujt për t'u futur në grupin tim (vetëm admini i grupit) */
@Composable
private fun KerkesaEGrupitKarta(k: Obj, ctx: Konteksti) {
    val n = N
    val scope = rememberCoroutineScope()
    var duke by remember { mutableStateOf(false) }
    KartaEKaltert {
        Column(Modifier.weight(1f)) {
            Text((k["emri"] as? String)?.ifEmpty { null } ?: "Dikush", style = txF(14.5f, 800, n.ink))
            val kur = kohaE(k, "koha")
            Text("kërkon të hyjë në grup" + (if (kur > 0) " · " + GrupiLogjika.kohaRelative(kur, ctx.tani) else "") + ".", style = txF(13.5f, 400, n.ink2))
        }
        Buton("Prano", {
            duke = true
            scope.launch {
                val r = Grupi.pranoKerkesen(k); duke = false
                Toast.trego(if (r == null) ((k["emri"] as? String) ?: "Kolegu") + " u pranua. Hyn në grup sapo ta hapë Stoku-n." else "S'u pranua. Kontrollo internetin dhe provo përsëri.", 5000)
            }
        }, aktiv = !duke, lartesia = 38.dp)
        Buton("Refuzo", {
            duke = true
            scope.launch { val r = Grupi.refuzoKerkesen(k); duke = false; if (r != null) Toast.trego("S'u refuzua. Kontrollo internetin dhe provo përsëri.", 4000) }
        }, aktiv = !duke, lloji = "tekst", lartesia = 38.dp)
    }
}

/** Kutia e kaltër e ftesave/kërkesave (ek-pult-kerkesat) */
@Composable
private fun KartaEKaltert(content: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit) {
    val n = N
    Row(Modifier.fillMaxWidth().padding(top = 12.dp).clip(RoundedCornerShape(18.dp)).background(n.accentTint).border(1.dp, n.accentLine, RoundedCornerShape(18.dp))
        .padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp), content = content)
}

// ---------------- Përmbledhja ----------------
@Composable
private fun Permbledhja(ftesat: List<Obj>, kerkesatG: List<Obj>, ngjarjet: List<Obj>, ngjGati: Boolean, ctx: Konteksti, kerkoHeqje: () -> Unit) {
    val n = N
    val an = ctx.anetaret
    val st = remember(an, ctx.tani) { GrupiLogjika.statistikat(an, ctx.tani) }
    val te = ctx.krejtAfatet
    val nOn = an.count { ctx.online(it) }
    val ng = ctx.ngarkuar
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp)) {
        item {
            RrjetaEPllakave(listOf(
                P("", if (ng) st.aktive.toString() else "–", "Në raft") { ctx.hapAnetarin("krejt", null) },
                P("skaduar", if (ng) st.skaduara.toString() else "–", "Të skaduara") { ctx.hapAnetarin("krejt", "skaduar") },
                P("afer", if (ng) st.javes.toString() else "–", "Skadojnë ≤ 7 ditë") { ctx.hapAnetarin("krejt", "afer") },
                P("afer", if (ng) st.afer.toString() else "–", "Afër skadimit") { ctx.hapAnetarin("krejt", "afer") },
                P("ok", if (ng) st.hequrMuajit.toString() else "–", "Hequr këtë muaj") { ctx.hapAnetarin("krejt", "hequr") },
                P("", if (ng) "$nOn/${an.size}" else "–", "Online tani") { ctx.zgjidhPamjen("anetaret") }
            ))
        }
        items(ftesat, key = { "f" + it["id"] }) { FtesaKarta(it, ctx) }
        if (Grupi.eshtePronar()) items(kerkesatG, key = { "k" + it["id"] }) { KerkesaEGrupitKarta(it, ctx) }
        if (Llogaria.leja("grupiKerkesat")) item {
            Row(Modifier.fillMaxWidth().padding(top = 14.dp, bottom = 4.dp).clip(RoundedCornerShape(18.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(18.dp))
                .clickable(onClick = kerkoHeqje).padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                IkonaMeNgjyre(Ik.KoshX, "kuqe", ikonaMadhesia = 20.dp)
                Column(Modifier.weight(1f)) {
                    Text("Kërko heqje nga rafti", style = tx(15, 700, n.ink))
                    Text("Dërgoji një kolegu një produkt për ta hequr", style = txF(12.5f, 400, n.muted), modifier = Modifier.padding(top = 2.dp))
                }
                Text("›", style = tx(20, 400, n.faint))
            }
        }
        item {
            Seksion("Online tani", nen = "$nOn nga ${an.size}")
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                an.forEach { a ->
                    Column(Modifier.width(64.dp).clip(RoundedCornerShape(10.dp)).clickable { ctx.hapAnetarin(a["uid"] as String, null) },
                        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Avatari(a["emri"] as? String, 46.dp, ctx.online(a))
                        Text(jsString(a["emri"] ?: ""), style = txF(11.5f, 600, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
        val skaduara = te.filter { Afatet.statusi(it) == "skaduar" }.sortedWith { a, b -> Afatet.krahaso(a, b) }
        item {
            Seksion("Duhet hequr nga rafti", if (skaduara.size > 5) "Shiko krejt (${skaduara.size})" else null) { ctx.hapAnetarin("krejt", "skaduar") }
            when {
                !ng -> Info("Duke ngarkuar…")
                skaduara.isEmpty() -> Text("Asnjë produkt i skaduar në raft. Shumë mirë!", style = tx(14, 700, n.ok),
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(n.okTint).padding(horizontal = 14.dp, vertical = 16.dp))
            }
        }
        items(skaduara.take(5), key = { "s" + it["pronariUid"] + it["id"] }) { KartaPultit(it, ctx) }
        val javes = te.filter { Afatet.statusi(it) == "afer" && (Afatet.ditetDeri(it["data"])?.let { d -> d <= 7 } == true) }.sortedWith { a, b -> Afatet.krahaso(a, b) }
        if (ng && javes.isNotEmpty()) {
            item { Seksion("Skadojnë këtë javë", "Shiko krejt") { ctx.hapAnetarin("krejt", "afer") } }
            items(javes.take(5), key = { "j" + it["pronariUid"] + it["id"] }) { KartaPultit(it, ctx) }
        }
        val ngj = if (ngjGati) ngjarjet.take(3) else emptyList()
        if (ngj.isNotEmpty()) {
            item { Seksion("Aktiviteti i fundit", "Shiko krejt") { ctx.zgjidhPamjen("aktiviteti") } }
            items(ngj, key = { "n" + it["id"] }) { x -> Ngjarja(x, GrupiLogjika.kohaRelative(kohaE(x, "koha"), ctx.tani)) }
        }
        seksionetEStatistikave(st)
    }
}

private fun LazyListScope.seksionetEStatistikave(st: GrupiLogjika.Statistikat) {
    fun seksion(titulli: String, rreshtat: List<Triple<String, String, Int>>, bosh: String) {
        item { Krye(titulli) }
        if (rreshtat.isEmpty()) item { Text(bosh, style = tx(14, 400, N.muted), modifier = Modifier.padding(vertical = 6.dp)) }
        items(rreshtat) { (e, nen, nr) -> RreshtiStatistikes(e, nen, nr) }
    }
    seksion("Sipas kolegëve", st.perAnetar.map { x ->
        Triple(x.emri, (if (x.skaduara == 1) "1 i skaduar" else "${x.skaduara} të skaduara") + " · ${x.afer} afër skadimit · ${x.hequr30} hequr (30 ditë)", x.aktive)
    }, "Asnjë koleg.")
    seksion("Furnizuesit me më shumë produkte që skadojnë", st.furnizuesit.map { Triple(it.first, "të skaduara ose afër skadimit", it.second) },
        "Asnjë produkt afër skadimit me furnizues të shënuar.")
    seksion("Kush hoqi më shumë nga rafti (30 ditët e fundit)", st.heqesit.map { Triple(it.first, "", it.second) }, "Askush s'ka hequr ende gjë nga rafti.")
}

@Composable
private fun RreshtiStatistikes(emri: String, nen: String, nr: Int) {
    val n = N
    Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(emri, style = tx(16, 500, n.ink))
            if (nen.isNotEmpty()) Text(nen, style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 3.dp))
        }
        Text(nr.toString(), style = tx(18, 600, n.ink))
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
}

// ---------------- Afatet e grupit ----------------
@Composable
private fun AfatetEGrupit(uid: String, filtri: String?, ndryshoFiltrin: (String?) -> Unit, ctx: Konteksti) {
    val n = N
    val scope = rememberCoroutineScope()
    var kerkimi by rememberSaveable { mutableStateOf("") }
    val an = ctx.anetaret
    val zgj = if (uid == "krejt") null else an.firstOrNull { it["uid"] == uid }
    val afatet = if (zgj != null) afatetE(zgj) else ctx.krejtAfatet
    val ngarkuar = if (zgj != null) zgj["ngarkuar"] == true else ctx.ngarkuar
    val nr = Afatet.numero(afatet)
    val k = kerkimi.trim().lowercase()
    val te = afatet.filter { a ->
        val st = Afatet.statusi(a)
        val ok = when {
            filtri == "hequr" -> st == "hequr"
            st == "hequr" -> false
            filtri == "skaduar" -> st == "skaduar" || st == "pa-date"
            filtri == "afer" -> st == "afer"
            filtri == "ok" -> st == "ok"
            else -> true
        }
        ok && (k.isEmpty() || ((a["emri"] as? String).orEmpty() + " " + jsString(a["barkodi"] ?: "") + " " + (a["furnizuesi"] as? String).orEmpty() + " " + (a["pronariEmri"] as? String).orEmpty()).lowercase().contains(k))
    }.let { l -> if (filtri == "hequr") l.sortedByDescending { kohaE(it, "hequrSe") } else l.sortedWith { a, b -> Afatet.krahaso(a, b) } }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp)) {
        item {
            RrjetaEPllakave(listOf(
                P("skaduar", (nr.skaduar + nr.paDate).toString(), "Të skaduara", filtri == "skaduar") { ndryshoFiltrin(if (filtri == "skaduar") null else "skaduar") },
                P("afer", nr.afer.toString(), "Afër skadimit", filtri == "afer") { ndryshoFiltrin(if (filtri == "afer") null else "afer") },
                P("ok", nr.ok.toString(), "Në rregull", filtri == "ok") { ndryshoFiltrin(if (filtri == "ok") null else "ok") },
                P("hequr", nr.hequr.toString(), "Të hequra", filtri == "hequr") { ndryshoFiltrin(if (filtri == "hequr") null else "hequr") }
            ))
            Hapesire(14.dp)
            Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), placeholder = "Kërko emër, barkod ose furnizues", ikona = Ik.Kerko)
            Hapesire(14.dp)
        }
        when {
            !ngarkuar -> item { Info("Duke ngarkuar afatet…") }
            te.isEmpty() -> item {
                when {
                    k.isNotEmpty() -> Bosh("Asgjë s'u gjet", "Provo një kërkim tjetër.")
                    filtri == "skaduar" -> Bosh("Asnjë produkt i skaduar", "Shumë mirë!")
                    filtri == "hequr" -> Bosh("Asnjë produkt i hequr ende")
                    else -> Bosh("Asnjë afat", if (zgj?.get("uneJam") == true) "Shtoji te tabi \"Afatet\"." else "")
                }
            }
            else -> {
                items(te.take(300), key = { "" + it["pronariUid"] + "|" + it["id"] }) { KartaEAfatitTeGrupit(it, zgj == null, ctx) }
                if (te.size > 300) item { Info("Shfaqen 300 nga ${te.size}. Kërko për t'i gjetur të tjerat.") }
            }
        }
        if (zgj != null && zgj["uneJam"] != true && Grupi.eshtePronar()) item {
            val emri = jsString(zgj["emri"] ?: "")
            Buton("Hiq $emri nga grupi", {
                ctx.pyet(Pyetja("Të hiqet nga grupi?", "$emri s'do ta shohë më grupin (afatet e kolegëve dhe aktivitetin) derisa ta ftosh sërish. Stoku dhe afatet e tij s'preken.", "Hiqe", true) {
                    scope.launch {
                        val r = Grupi.hiqNgaGrupi(zgj["uid"] as String)
                        if (r == null) { ctx.zgjidhPamjen("permbledhja"); Toast.trego("$emri u hoq nga grupi.") } else Toast.trego("S'u hoq. Kontrollo internetin dhe provo përsëri.", 4000)
                    }
                })
            }, Modifier.fillMaxWidth().padding(top = 14.dp), lloji = "rrezik")
        }
    }
}

// ---------------- Aktiviteti ----------------
@Composable
private fun Aktiviteti(ngjarjet: List<Obj>, gati: Boolean, ctx: Konteksti) {
    val n = N
    val st = remember(ctx.anetaret, ctx.tani) { GrupiLogjika.statistikat(ctx.anetaret, ctx.tani) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp)) {
        item {
            RrjetaEPllakave(listOf(
                P("afer", st.sot.toString(), "Skadojnë sot") { ctx.hapAnetarin("krejt", "afer") },
                P("skaduar", st.skaduara.toString(), "Të skaduara në raft") { ctx.hapAnetarin("krejt", "skaduar") },
                P("ok", st.hequrSot.toString(), "Hequr sot") { ctx.hapAnetarin("krejt", "hequr") }
            ))
        }
        when {
            !gati -> item { Info("Duke ngarkuar…") }
            ngjarjet.isEmpty() -> item { Bosh("S'ka aktivitet ende", "Kur dikush heq nga rafti, ose shton afate, del këtu.") }
            else -> {
                var dita = ""
                ngjarjet.forEach { x ->
                    val t = GrupiLogjika.titulliDites(kohaE(x, "koha"), ctx.tani)
                    if (t != dita) { dita = t; item(key = "d$t") { Krye(t) } }
                    item(key = "n" + x["id"]) { Ngjarja(x, GrupiLogjika.ora(kohaE(x, "koha"))) }
                }
            }
        }
    }
}

// ---------------- Kalendari ----------------
@Composable
private fun Kalendari(ctx: Konteksti) {
    val n = N
    val sot = LocalDate.now()
    var viti by rememberSaveable { mutableStateOf(sot.year) }
    var muaji by rememberSaveable { mutableStateOf(sot.monthValue - 1) }
    var dita by rememberSaveable { mutableStateOf<String?>(Afatet.isoNgaData(sot)) }
    val te = ctx.krejtAfatet
    val k = remember(te, viti, muaji, ctx.tani) { GrupiLogjika.kalendari(te, viti, muaji, ctx.tani) }
    fun ndrysho(d: Int) {
        var m = muaji + d; var v = viti
        if (m < 0) { m = 11; v-- } else if (m > 11) { m = 0; v++ }
        viti = v; muaji = m
        dita = if (v == sot.year && m == sot.monthValue - 1) Afatet.isoNgaData(sot) else null
    }
    val lista = te.filter { it["data"] == dita }.sortedWith { a, b -> Afatet.krahaso(a, b) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp)) {
        item {
            Row(Modifier.fillMaxWidth().padding(top = 14.dp, bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                ButonIkone(Ik.Mbrapa, "Muaji i kaluar", { ndrysho(-1) }, madhesia = 42.dp)
                Text(k.titulli, style = tx(17, 700, n.ink), textAlign = TextAlign.Center, modifier = Modifier.weight(1f))
                ButonIkone(Ik.Perpara, "Muaji tjetër", { ndrysho(1) }, madhesia = 42.dp)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                GrupiLogjika.DITET_SHKURT.forEach { Text(it, style = txF(11.5f, 700, n.muted), textAlign = TextAlign.Center, modifier = Modifier.weight(1f).padding(top = 2.dp, bottom = 4.dp)) }
            }
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                k.qelizat.chunked(7).forEach { rr ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        rr.forEach { q ->
                            if (q == null) Spacer(Modifier.weight(1f).aspectRatio(1f))
                            else QelizaEDites(q, dita == q.iso, Modifier.weight(1f)) { dita = q.iso }
                        }
                    }
                }
            }
            // Legjenda
            Row(Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 4.dp).horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                listOf("skaduar" to "Ka skaduar", "afer" to "Skadon brenda 30 ditëve", "ok" to "Në rregull", "hequr" to "Të hequra").forEach { (s, t) ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        val (sf, vj) = ngjyratEDites(s)
                        Box(Modifier.size(11.dp).clip(RoundedCornerShape(3.dp)).background(sf).vijaEDites(s, vj, 3.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(t, style = txF(12.5f, 400, n.muted))
                    }
                }
            }
            val d = dita
            Krye(if (d == null) "Prek një ditë për t'i parë afatet e saj"
                else Afatet.formato(d) + " · " + (if (lista.isEmpty()) "asnjë afat" else lista.size.toString() + (if (lista.size == 1) " afat" else " afate")))
        }
        items(lista, key = { "" + it["pronariUid"] + "|" + it["id"] }) { KartaEAfatitTeGrupit(it, true, ctx) }
    }
}

@Composable
private fun ngjyratEDites(s: String?): Pair<Color, Color> {
    val n = N
    return when (s) {
        "skaduar", "pa-date" -> n.expTint to n.exp
        "afer" -> n.nearTint to n.near
        "ok" -> n.okTint to n.ok
        "hequr" -> n.surface2 to n.muted
        else -> n.surface to n.line
    }
}

/** Vija e qelizës: me pika për "të hequra" */
private fun Modifier.vijaEDites(s: String?, ngjyra: Color, rrezja: Dp): Modifier =
    if (s == "hequr") drawBehind {
        drawRoundRect(ngjyra, style = Stroke(width = 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 3.dp.toPx()))),
            cornerRadius = CornerRadius(rrezja.toPx()))
    } else border(1.dp, ngjyra, RoundedCornerShape(rrezja))

@Composable
private fun QelizaEDites(q: GrupiLogjika.Qeliza, zgjedhur: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val n = N
    val (sf, vj) = ngjyratEDites(q.statusi)
    val tekst = when (q.statusi) { "skaduar", "pa-date" -> n.exp; "afer" -> n.near; "ok" -> n.ok; "hequr" -> n.muted; else -> n.ink }
    val forma = RoundedCornerShape(10.dp)
    var m = modifier.aspectRatio(1f)
    if (zgjedhur) m = m.border(3.dp, n.accent, RoundedCornerShape(12.dp)).padding(4.dp)
    m = m.clip(forma).background(sf, forma).vijaEDites(q.statusi, if (q.statusi == null) n.line else vj, 10.dp)
    if (q.sot) m = m.border(2.dp, n.accent, forma)
    Column(m.clickable(onClick = onClick), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text(q.dita.toString(), style = tx(14, 600, tekst))
        if (q.afatet.isNotEmpty()) Text((if (q.neRaft > 0) q.neRaft else q.afatet.size).toString(), style = txF(10.5f, 800, tekst))
    }
}

// ---------------- Kolegët ----------------
@Composable
private fun Koleget(doc: Obj?, ftesat: List<Obj>, ftesatG: List<Obj>, kerkesatG: List<Obj>, ctx: Konteksti) {
    val n = N
    val scope = rememberCoroutineScope()
    val an = ctx.anetaret
    val pronar = Grupi.eshtePronar()
    var riemertim by remember { mutableStateOf(false) }
    var emriRi by remember { mutableStateOf("") }
    var fto by rememberSaveable { mutableStateOf("") }
    var njoftimi by rememberSaveable { mutableStateOf("") }
    val emriG = (doc?.get("emri") as? String)?.ifEmpty { null } ?: "Grupi"
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp)) {
        if (ftesat.isNotEmpty()) {
            item { Krye("Ftesë për një grup tjetër") }
            items(ftesat, key = { "f" + it["id"] }) { FtesaKarta(it, ctx) }
        }
        if (pronar && kerkesatG.isNotEmpty()) {
            item { Krye(if (kerkesatG.size == 1) "Një kërkesë për t'u futur" else "${kerkesatG.size} kërkesa për t'u futur") }
            items(kerkesatG, key = { "k" + it["id"] }) { KerkesaEGrupitKarta(it, ctx) }
        }
        item {
            Krye("Grupi yt")
            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(n.surface).border(1.dp, n.line, RoundedCornerShape(18.dp))
                .padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (pronar && riemertim) {
                    fun ruaj() {
                        val em = emriRi.trim()
                        if (em.length < 2) return
                        scope.launch {
                            val r = Grupi.riemertoGrupin(em)
                            if (r == null) riemertim = false else Toast.trego("Emri s'u ndryshua. Kontrollo internetin.", 4000)
                        }
                    }
                    Fusha(emriRi, { emriRi = it.take(60) }, Modifier.weight(1f), kurVeprim = { ruaj() }, lartesia = 46.dp)
                    Buton("Ruaj", { ruaj() }, lartesia = 46.dp)
                } else {
                    Column(Modifier.weight(1f)) {
                        Text(emriG, style = tx(17, 800, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text((if (pronar) "Ti je admin i grupit" else "Koleg i grupit") + " · " + nrKolege(an.size), style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 2.dp))
                    }
                    if (pronar) Pill("Ndrysho emrin") { emriRi = emriG; riemertim = true }
                }
            }
        }
        if (pronar) {
            item {
                Krye("Fto një shok në grup")
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    fun dergo() {
                        val em = fto.trim()
                        if (em.isEmpty()) return
                        scope.launch {
                            val r = Grupi.ftoNeGrup(em)
                            if (r == null) { fto = ""; Toast.trego("Ftesa iu dërgua \"" + em.lowercase() + "\". E sheh te Grupi kur e hap Stoku-n.", 4500) }
                            else Toast.trego(when (r) {
                                "emri" -> "Emri i përdoruesit: 3 deri 40 shkronja/numra (a-z, 0-9, _ . -)."
                                "vetja" -> "Ky është emri yt."
                                "anetar" -> "Ky përdorues është tashmë në grup."
                                "e-ftuar" -> "Ky përdorues është ftuar tashmë."
                                else -> "Ftesa s'u dërgua. Kontrollo internetin dhe provo përsëri."
                            }, 4500)
                        }
                    }
                    Fusha(fto, { fto = it.take(40) }, Modifier.weight(1f), placeholder = "Emri i përdoruesit të tij", kurVeprim = { dergo() }, lartesia = 46.dp)
                    Buton("Fto", { dergo() }, lartesia = 46.dp)
                }
                Text("Shkruaj emrin e përdoruesit me të cilin shoku hyn në Stoku. Ai e sheh ftesën te Grupi dhe e pranon. Pa ftesë askush s'e sheh grupin.",
                    style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 8.dp, start = 2.dp, end = 2.dp))
            }
            if (ftesatG.isNotEmpty()) {
                item { Krye("Ftesa në pritje (${ftesatG.size})") }
                items(ftesatG, key = { "fg" + it["id"] }) { f ->
                    RreshtiMenaxhimit(jsString(f["perdoruesi"] ?: ""), "Ftuar nga " + jsString(f["ngaEmri"] ?: "") +
                        (if (kohaE(f, "koha") > 0) " · " + GrupiLogjika.kohaRelative(kohaE(f, "koha"), ctx.tani) else "")) {
                        Pill("Anulo") { scope.launch { if (Grupi.anuloFtesen(f["id"] as String) != null) Toast.trego("S'u anulua. Kontrollo internetin.", 4000) } }
                    }
                }
            }
        }
        item {
            Krye("Kolegët")
            val nOn = an.count { ctx.online(it) }
            Text("$nOn online nga " + nrKolege(an.size), style = tx(14, 400, n.muted), modifier = Modifier.padding(bottom = 4.dp))
        }
        items(an, key = { "a" + it["uid"] }) { a -> RreshtiKolegut(a, ctx) }
        if (pronar) {
            item {
                Krye("Njoftim për krejt grupin")
                FushaShumeRreshta(njoftimi, { njoftimi = it.take(1000) }, "Shkruaj njoftimin (i del secilit te zilja)")
                Buton("Dërgo te krejt grupi", {
                    val t = njoftimi.trim()
                    if (t.isEmpty()) return@Buton
                    if (Grupi.lajmeroEkipen(t)) { njoftimi = ""; Toast.trego("Njoftimi u dërgua te krejt grupi.") }
                    else Toast.trego("Njoftimi s'u dërgua. Kontrollo internetin dhe provo përsëri.", 4000)
                }, Modifier.fillMaxWidth().padding(top = 8.dp))
            }
            val tjeret = an.filter { it["uneJam"] != true }
            item {
                Krye("Menaxho kolegët")
                if (tjeret.isEmpty()) Text("S'ka kolegë të tjerë ende. Fto shokët më lart.", style = tx(14, 400, n.muted))
            }
            items(tjeret, key = { "m" + it["uid"] }) { a ->
                val em = jsString(a["emri"] ?: "")
                val eshteP = a["pronar"] == true
                RreshtiMenaxhimit(em, if (eshteP) "Admin i grupit" else GrupiLogjika.tekstiPranise(a, ctx.tani)) {
                    Pill(if (eshteP) "Hiqe si admin" else "Bëje admin") {
                        scope.launch {
                            val r = Grupi.ndryshoRolin(a["uid"] as String, if (eshteP) "anetar" else "pronar")
                            if (r != null) Toast.trego(if (r == "pronari-i-vetem") "Grupi duhet të ketë të paktën një admin." else "S'u ndryshua. Kontrollo internetin.", 4000)
                        }
                    }
                    Pill("Hiq") {
                        ctx.pyet(Pyetja("Të hiqet nga grupi?", "$em s'do ta shohë më grupin (afatet e kolegëve dhe aktivitetin) derisa ta ftosh sërish. Stoku dhe afatet e tij s'preken.", "Hiqe", true) {
                            scope.launch { val r = Grupi.hiqNgaGrupi(a["uid"] as String); Toast.trego(if (r == null) "$em u hoq nga grupi." else "S'u hoq. Kontrollo internetin dhe provo përsëri.", 4000) }
                        })
                    }
                }
            }
            item {
                Krye("Pastrimi")
                Buton("Pastro krejt aktivitetin", {
                    ctx.pyet(Pyetja("Të fshihet krejt aktiviteti?", "Krejt historiku i aktivitetit fshihet për krejt grupin. Afatet s'preken.", "Fshi krejt", true) {
                        scope.launch {
                            val r = Grupi.pastroAktivitetin()
                            Toast.trego(if (r == null) "S'u fshi krejt. Kontrollo internetin dhe provo përsëri." else if (r == 1) "U fshi 1 rresht." else "U fshinë $r rreshta.", 4000)
                        }
                    })
                }, Modifier.fillMaxWidth(), lloji = "rrezik")
            }
        }
        item {
            Buton("Largohu nga grupi", {
                val m = Grupi.mundTeLargohet()
                if (!m.ok) { Toast.trego("Prit pak, po ngarkohen kolegët e grupit…", 5000); return@Buton }
                ctx.pyet(Pyetja("Të largohesh nga grupi \"$emriG\"?",
                    if (m.iFundit) "Je i fundit në grup: grupi fshihet komplet, bashkë me aktivitetin. Stoku dhe afatet e tua s'preken."
                    else (if (m.trashegimtari != null) "Je admini i grupit: kur largohesh, admin bëhet " + (m.trashegimtariEmri ?: "kolegu") + ". " else "") +
                        "S'do t'i shohësh më kolegët dhe aktivitetin e këtij grupi. Stoku dhe afatet e tua s'preken.", "Largohu", true) {
                    scope.launch {
                        val r = Grupi.largohuNgaGrupi()
                        Toast.trego(when (r) {
                            null -> "U largove nga grupi \"$emriG\"."
                            "trashegimtari" -> "S'u largove: kolegu s'u bë dot admin. Kontrollo internetin dhe provo përsëri."
                            "duke-ngarkuar" -> "Prit pak, po ngarkohen kolegët e grupit…"
                            else -> "S'u largove. Kontrollo internetin dhe provo përsëri."
                        }, 5000)
                    }
                })
            }, Modifier.fillMaxWidth().padding(top = 18.dp), lloji = "rrezik")
        }
    }
}

/** Butoni i vogël me vijë (af-pill) */
@Composable
private fun Pill(t: String, onClick: () -> Unit) {
    val n = N
    Text(t, style = tx(13, 700, n.ink), maxLines = 1, modifier = Modifier.clip(RoundedCornerShape(12.dp)).border(1.5.dp, n.ink, RoundedCornerShape(12.dp))
        .clickable(onClick = onClick).padding(horizontal = 12.dp, vertical = 7.dp))
}

@Composable
private fun RreshtiMenaxhimit(emri: String, nen: String, veprimet: @Composable () -> Unit) {
    val n = N
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        AvatariLehte(emri)
        Column(Modifier.weight(1f)) {
            Text(emri, style = tx(15, 500, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(nen, style = tx(12, 400, n.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { veprimet() }
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
}

@Composable
private fun RreshtiKolegut(a: Obj, ctx: Konteksti) {
    val n = N
    val nr = Afatet.numero(afatetE(a))
    val une = a["uneJam"] == true
    val online = ctx.online(a)
    Row(Modifier.fillMaxWidth().clickable { ctx.hapAnetarin(a["uid"] as String, null) }.padding(vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        AvatariLehte(a["emri"] as? String, online = online)
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(jsString(a["emri"] ?: ""), style = tx(16, 500, n.ink), maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, fill = false))
                if (a["pronar"] == true) IkonaERolit(Ik.Kurora, n.nearTint, n.near, "Admin i Grupit")
                if (a["admin"] == true) IkonaERolit(Ik.Administratori, n.accentTint, n.accentText, "Administrator")
            }
            Prania(a, une, online, ctx.tani)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(if (a["ngarkuar"] != true) "…" else nr.aktive.toString(), style = tx(20, 600, n.ink))
            Text("në raft", style = tx(12, 400, n.muted))
            val sk = nr.skaduar + nr.paDate
            if (sk > 0) Text(if (sk == 1) "1 i skaduar" else "$sk të skaduara", style = txF(12.5f, 700, n.expInk), modifier = Modifier.padding(top = 2.dp))
        }
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
}

@Composable
private fun IkonaERolit(ik: ImageVector, sf: Color, ng: Color, emri: String) {
    Box(Modifier.padding(start = 6.dp).size(22.dp).clip(CircleShape).background(sf).clickable { Toast.trego(emri, 3500) }, contentAlignment = Alignment.Center) {
        Icon(ik, emri, Modifier.size(13.dp), tint = ng)
    }
}

/** Prania si ikonë (ek-prania): online = pajisja + pika e gjelbër; jashtë linje = pika gri + kur u pa */
@Composable
private fun Prania(a: Obj, une: Boolean, online: Boolean, tani: Long) {
    val n = N
    val pl = if (une) "tel" else (a["platforma"] as? String).orEmpty()
    val aktivSe = kohaE(a, "aktivSe")
    val kur = if (!online && aktivSe > 0) GrupiLogjika.kohaRelative(aktivSe, tani) else ""
    val ng = if (online) n.ok else n.muted
    Row(Modifier.padding(top = 4.dp).height(24.dp).clip(RoundedCornerShape(12.dp)).background(if (online) n.okTint else n.surface2).padding(horizontal = 9.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        if (!online || pl.isNotEmpty()) Icon(if (pl == "pc") Ik.Kompjuter else Ik.Telefon, null, Modifier.size(15.dp), tint = ng)
        Box(Modifier.size(7.dp).clip(CircleShape).background(if (online) n.okDot else n.muted.copy(alpha = 0.55f)))
        if (kur.isNotEmpty()) Text(kur, style = tx(12, 600, ng), maxLines = 1)
    }
}

@Composable
private fun FushaShumeRreshta(vlera: String, ndrysho: (String) -> Unit, placeholder: String) {
    val n = N
    val forma = RoundedCornerShape(12.dp)
    BasicTextField(vlera, ndrysho, Modifier.fillMaxWidth().heightIn(min = 74.dp).clip(forma).background(n.surface, forma).border(1.dp, n.line, forma),
        textStyle = tx(16, 400, n.ink), cursorBrush = SolidColor(n.accent), minLines = 3,
        decorationBox = { brenda ->
            Box(Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
                if (vlera.isEmpty()) Text(placeholder, style = tx(16, 400, n.faint))
                brenda()
            }
        })
}

// ---------------- Pa grup ----------------
@Composable
private fun PaGrup(ftesat: List<Obj>, kerkesatM: List<Obj>, ctx: Konteksti) {
    val n = N
    val scope = rememberCoroutineScope()
    var q by rememberSaveable { mutableStateOf("") }
    var rez by remember { mutableStateOf<List<Obj>?>(null) }
    var gabim by remember { mutableStateOf("") }
    var emriGrupit by rememberSaveable { mutableStateOf("") }
    var duke by remember { mutableStateOf(false) }
    LaunchedEffect(q) {
        rez = null; gabim = ""
        if (q.trim().length < 2) return@LaunchedEffect
        delay(300)
        val r = Grupi.kerkoGrupet(q)
        rez = r ?: emptyList()
        gabim = if (r == null) "S'u kërkua. Kontrollo internetin dhe provo përsëri." else ""
    }
    fun krijo() {
        val em = emriGrupit.trim()
        if (em.length < 2) { Toast.trego("Shkruaj emrin e grupit (të paktën 2 shkronja)."); return }
        duke = true
        scope.launch {
            val r = Grupi.krijoGrupin(em)
            duke = false
            if (r == null) { emriGrupit = ""; Toast.trego("Grupi \"$em\" u krijua. Tash fto shokët te Kolegët.", 4500); ctx.zgjidhPamjen("anetaret") }
            else Toast.trego(if (r == "leje") "S'u krijua: rregullat e Firebase-it për grupet s'janë vendosur ende." else "S'u krijua. Kontrollo internetin dhe provo përsëri.", 5000)
        }
    }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 24.dp)) {
        if (ftesat.isNotEmpty()) {
            item { Krye(if (ftesat.size == 1) "Ke një ftesë" else "Ke ${ftesat.size} ftesa", Modifier.padding(top = 4.dp)) }
            items(ftesat, key = { "f" + it["id"] }) { FtesaKarta(it, ctx) }
        }
        item { Bosh("Hyr në një grup", "Kërko grupin me emrin e tij dhe dërgo kërkesë. Kur ta pranojë admini i grupit, hyn vetë.") }
        items(kerkesatM, key = { "k" + it["id"] }) { k ->
            KartaEKaltert {
                Column(Modifier.weight(1f)) {
                    Text((k["grupiEmri"] as? String)?.ifEmpty { null } ?: "Grup", style = txF(14.5f, 800, n.ink))
                    Text("Kërkesa u dërgua" + (if (kohaE(k, "koha") > 0) " " + GrupiLogjika.kohaRelative(kohaE(k, "koha"), ctx.tani) else "") + ". Pret pranimin nga admini i grupit.",
                        style = txF(13.5f, 400, n.ink2))
                }
                Buton("Anulo", { scope.launch { if (Grupi.anuloKerkesen(k["gid"] as? String ?: "") != null) Toast.trego("S'u anulua. Kontrollo internetin dhe provo përsëri.", 4000) } },
                    lloji = "tekst", lartesia = 38.dp)
            }
        }
        item {
            Hapesire(12.dp)
            Fusha(q, { q = it.take(60) }, Modifier.fillMaxWidth(), placeholder = "Shkruaj emrin e grupit", lartesia = 48.dp)
            val r = rez
            when {
                q.trim().length < 2 -> {}
                gabim.isNotEmpty() -> Info(gabim)
                r == null -> Info("Duke kërkuar…")
                r.isEmpty() -> Info("S'u gjet asnjë grup me këtë emër.")
            }
        }
        items(rez.orEmpty(), key = { "g" + it["id"] }) { gr ->
            val kerkuar = kerkesatM.any { it["gid"] == gr["id"] }
            var uDergua by remember { mutableStateOf(false) }
            KartaEKaltert {
                Column(Modifier.weight(1f)) {
                    Text(jsString(gr["emri"] ?: ""), style = txF(14.5f, 800, n.ink))
                    Text(if (eVertete(gr["pronarEmri"])) "Admini: " + jsString(gr["pronarEmri"]) else "Grup", style = txF(13.5f, 400, n.ink2))
                }
                Buton(if (kerkuar || uDergua) "U dërgua" else "Kërko të hysh", {
                    uDergua = true
                    scope.launch {
                        val res = Grupi.dergoKerkesen(gr)
                        val em = jsString(gr["emri"] ?: "")
                        when (res) {
                            null -> Toast.trego("Kërkesa u dërgua. Kur ta pranojë admini i grupit, hyn vetë në grup.", 5000)
                            "nga-ftesa" -> { Toast.trego("U bashkove me grupin \"$em\" (të kishin ftuar)."); ctx.zgjidhPamjen("anetaret") }
                            "rikthyer" -> { Toast.trego("U ktheve në grupin \"$em\" (ishe ende anëtar)."); ctx.zgjidhPamjen("anetaret") }
                            "leje" -> { uDergua = false; Toast.trego("Kërkesa s'u dërgua: ky grup s'ekziston më, ose rregullat e Firebase-it s'janë vendosur ende.", 5000) }
                            else -> { uDergua = false; Toast.trego("Kërkesa s'u dërgua. Kontrollo internetin dhe provo përsëri.", 5000) }
                        }
                    }
                }, aktiv = !kerkuar && !uDergua, lartesia = 38.dp)
            }
        }
        item {
            Bosh("Ose krijo grupin tënd", "Secili grup sheh vetëm kolegët e vet (afatet dhe aktivitetin). Krijo grupin e dyqanit tënd dhe fto shokët, ose prano një ftesë.")
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Fusha(emriGrupit, { emriGrupit = it.take(60) }, Modifier.weight(1f), placeholder = "Emri i grupit", kurVeprim = { krijo() }, lartesia = 48.dp)
                Buton("Krijo", { krijo() }, aktiv = !duke, lartesia = 48.dp)
            }
            Text(buildAnnotatedString {
                append("Për t'u futur në grupin e dikujt tjetër, jepja adminit të grupit emrin tënd të përdoruesit: ")
                withStyle(SpanStyle(fontFamily = Mono, fontWeight = FontWeight(700), color = n.ink)) { append(Grupi.emriIm()) }
                append(". Ftesa del këtu.")
            }, style = tx(13, 400, n.muted), modifier = Modifier.padding(top = 8.dp, start = 2.dp, end = 2.dp))
        }
    }
}

// ---------------- Zilja: njoftimet personale ----------------
@Composable
private fun ZiljaFlete(ctx: Konteksti, mbyll: () -> Unit) {
    val n = N
    val scope = rememberCoroutineScope()
    var lista by remember { mutableStateOf<List<Obj>?>(null) }
    var gabim by remember { mutableStateOf(false) }
    var rifresko by remember { mutableStateOf(0) }
    var fshiKrejt by remember { mutableStateOf(false) }
    val tePalexuara = remember { Grupi.njoftimet.value.mapNotNull { it["id"] as? String }.toSet() }
    val vendime = remember { mutableStateOf(mapOf<String, String>()) } // id → teksti pas vendimit
    LaunchedEffect(rifresko) {
        if (Grupi.neProve) { lista = Grupi.njoftimet.value; return@LaunchedEffect }
        val l = Grupi.merrNjoftimet()
        gabim = l == null
        lista = l ?: emptyList()
        Grupi.shenoNjoftimetTeLexuara()
    }
    Flete(mbyll) {
        Text("Njoftimet", style = tx(22, 700, n.ink, -0.02))
        val l = lista
        when {
            l == null -> Info("Duke ngarkuar…")
            gabim -> Bosh("S'u lexuan njoftimet", "Kontrollo internetin dhe provo përsëri.")
            l.isEmpty() -> Bosh("S'ka njoftime", "Këtu të del kur një koleg heq nga rafti një nga produktet e tua që ka skaduar.")
            else -> Column {
                l.forEach { nj ->
                    val id = nj["id"] as? String ?: ""
                    val eRe = id in tePalexuara
                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(if (eRe) n.surface2 else Color.Transparent).padding(horizontal = 6.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        AvatariLehte(nj["emri"] as? String)
                        Column(Modifier.weight(1f)) {
                            Text(GrupiLogjika.tekstiNjoftimit(nj), style = txF(14.5f, if (eRe) 600 else 400, n.ink))
                            Text(GrupiLogjika.kohaRelative(kohaE(nj, "koha"), ctx.tani), style = tx(12, 400, n.muted), modifier = Modifier.padding(top = 2.dp))
                            val lloji = nj["lloji"] as? String ?: ""
                            if (lloji.startsWith("kerkese-")) {
                                val lp = GrupiLogjika.listaEKerkeses(nj)
                                if (lp.size > 1 || eVertete(lp.firstOrNull()?.get("data"))) lp.forEach { x -> Text("• " + GrupiLogjika.rreshtiIProduktit(x), style = tx(13, 400, n.ink2), modifier = Modifier.padding(top = 2.dp)) }
                            }
                            val pas = vendime.value[id]
                            if (pas != null) Text(pas, style = tx(13, 700, n.ok), modifier = Modifier.padding(top = 8.dp))
                            else if (lloji == "kerkese-heqje") {
                                val kr = Grupi.kryeresiIKerkeses(nj)
                                if (kr != null) Text(if (kr.first) "✓ E hoqe nga rafti" else "✓ E hoqi " + kr.second, style = tx(13, 700, n.ok), modifier = Modifier.padding(top = 8.dp))
                                else if (Llogaria.leja("grupiKerkesat")) Buton("E hoqa nga rafti", {
                                    scope.launch {
                                        val r = Grupi.kryejKerkesen(nj)
                                        if (r == null) { vendime.value = vendime.value + (id to "✓ E hoqe nga rafti"); Toast.trego(((nj["emri"] as? String) ?: "Kolegu") + " u njoftua që e hoqe.") }
                                        else Toast.trego("S'u ruajt. Kontrollo internetin dhe provo sërish.")
                                    }
                                }, Modifier.padding(top = 8.dp), lartesia = 36.dp)
                            } else if (lloji == "hequr" && eVertete(nj["afatId"])) {
                                val v = nj["vendim"] as? String
                                if (v != null) Text(if (v == "pranuar") "✓ E pranove" else "✕ E refuzove", style = tx(13, 700, n.ok), modifier = Modifier.padding(top = 8.dp))
                                else if (Llogaria.leja("afatetNdrysho")) Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    fun vendos(pranoj: Boolean) {
                                        scope.launch {
                                            val r = Grupi.vendosPerHeqjen(nj, pranoj)
                                            if (r != null) { Toast.trego("S'u ruajt. Kontrollo internetin dhe provo sërish."); return@launch }
                                            vendime.value = vendime.value + (id to if (pranoj) "✓ E pranove" else "✕ E refuzove")
                                            val kush = (nj["emri"] as? String)?.ifEmpty { null } ?: "Kolegu"
                                            Toast.trego(if (pranoj) "\"" + ((nj["produkti"] as? String)?.ifEmpty { null } ?: "Produkti") + "\" u hoq nga rafti. $kush u njoftua." else "$kush u njoftua që produkti mbetet në raft.")
                                        }
                                    }
                                    Buton("Prano", { vendos(true) }, lartesia = 36.dp)
                                    Spacer(Modifier.width(6.dp))
                                    Buton("Refuzo", { vendos(false) }, lloji = "tekst", lartesia = 36.dp)
                                }
                            }
                        }
                        Box(Modifier.size(32.dp).clip(RoundedCornerShape(9.dp)).clickable {
                            scope.launch {
                                if (Grupi.fshijNjoftimet(listOf(id)) == null) lista = lista?.filter { it["id"] != id }
                                else Toast.trego("S'u fshi. Kontrollo internetin dhe provo sërish.")
                            }
                        }, contentAlignment = Alignment.Center) { Icon(Ik.X, "Fshije njoftimin", Modifier.size(16.dp), tint = n.muted) }
                    }
                    Box(Modifier.fillMaxWidth().height(1.dp).background(n.line2))
                }
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
            if (!l.isNullOrEmpty()) Buton("Fshiji të gjitha", { fshiKrejt = true }, lloji = "rrezik")
            Buton("Mbyll", mbyll, lloji = "tekst")
        }
    }
    if (fshiKrejt) {
        val ids = lista.orEmpty().mapNotNull { it["id"] as? String }
        Konfirmo("Të fshihen krejt njoftimet?", (if (ids.size == 1) "Njoftimi fshihet" else "Të ${ids.size} njoftimet fshihen") + " vetëm për ty.", "Fshiji", true, mbyll = { fshiKrejt = false }) {
            scope.launch {
                if (Grupi.fshijNjoftimet(ids) == null) { Toast.trego(if (ids.size == 1) "Njoftimi u fshi." else "U fshinë ${ids.size} njoftime."); rifresko++ }
                else Toast.trego("S'u fshinë. Kontrollo internetin dhe provo sërish.")
            }
        }
    }
}

// ---------------- Kërko heqje nga rafti ----------------
@Composable
private fun KerkesaFlete(mbyll: () -> Unit) {
    val n = N
    val dq by Dyqani.gjendja.collectAsState()
    val kol = remember { Grupi.koleget().sortedWith { a, b -> Afatet.KOLATORI.compare(jsString(a["emri"] ?: ""), jsString(b["emri"] ?: "")) } }
    val skaduara = remember(dq.afatet) {
        dq.afatet.filter { Afatet.statusi(it) == "skaduar" }.sortedWith { a, b -> Afatet.krahaso(a, b) }.map { a ->
            mapOf("produkti" to (a["emri"] as? String).orEmpty().trim(), "barkodi" to jsString(a["barkodi"] ?: ""), "data" to (a["data"] as? String).orEmpty(),
                "nen" to listOf("skadoi më " + Afatet.formato(a["data"]), Afatet.sasiaTekst(a)).filter { it.isNotEmpty() }.joinToString(" · "))
        }
    }
    val produktet = remember(dq.produktet) {
        dq.produktet.values.filter { eVertete(it["emri"]) || eVertete(it["barkodi"]) }
            .sortedWith { a, b -> Afatet.KOLATORI.compare(jsString(a["emri"] ?: a["barkodi"] ?: ""), jsString(b["emri"] ?: b["barkodi"] ?: "")) }.map { p ->
                mapOf("produkti" to (p["emri"] as? String).orEmpty().trim(), "barkodi" to jsString(p["barkodi"] ?: ""), "data" to "",
                    "nen" to listOf(Dyqani.emriFolderit(p["kategoriaId"]), "sasia " + numerOse0(p["sasia"]).toLong()).filter { it.isNotEmpty() }.joinToString(" · "))
            }
    }
    var tabi by remember { mutableStateOf(if (skaduara.isNotEmpty()) "skaduara" else "produktet") }
    var kerkimi by remember { mutableStateOf("") }
    var zgjedhur by remember { mutableStateOf(listOf<Map<String, String>>()) }
    var per by remember { mutableStateOf("") }
    var shenim by remember { mutableStateOf("") }
    var gabim by remember { mutableStateOf(if (kol.isEmpty()) "S'ka ende kolegë në grup." else "") }
    fun celes(x: Map<String, String>) = x["barkodi"] + "|" + x["produkti"] + "|" + x["data"]
    fun dergo() {
        if (zgjedhur.isEmpty()) { gabim = "Shëno të paktën një produkt nga lista."; return }
        val r = Grupi.kerkoHeqjen(zgjedhur.map { mapOf("produkti" to it["produkti"], "barkodi" to it["barkodi"], "data" to it["data"]) }, shenim, per)
        if (r != null) { gabim = if (r == "pa-kolege") "S'ka ende kolegë në grup." else "S'u dërgua. Kontrollo internetin dhe provo sërish."; return }
        mbyll()
        Toast.trego("Kërkesa u dërgua te " + (if (per.isEmpty()) "krejt grupi" else jsString(kol.firstOrNull { it["uid"] == per }?.get("emri") ?: "")) + ".")
    }
    Flete(mbyll) {
        Text("Kërko heqje nga rafti", style = tx(22, 700, n.ink, -0.02))
        Text("Shëno një ose disa produkte nga lista jote. Kolegu e merr njoftimin edhe në telefon.", style = tx(14, 400, n.muted))
        Text("Zgjidh produktet", style = tx(13, 600, n.ink2))
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(n.surface2).padding(3.dp)) {
            listOf("skaduara" to ("Të skaduarat" to skaduara.size), "produktet" to ("Produktet e mia" to produktet.size)).forEach { (k, v) ->
                val aktiv = tabi == k
                Row(Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(if (aktiv) n.surface else Color.Transparent).clickable { tabi = k }.padding(vertical = 9.dp),
                    horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    Text(v.first, style = tx(14, if (aktiv) 700 else 500, if (aktiv) n.ink else n.muted))
                    Spacer(Modifier.width(6.dp))
                    Text(v.second.toString(), style = tx(12, 700, n.muted))
                }
            }
        }
        Fusha(kerkimi, { kerkimi = it }, Modifier.fillMaxWidth(), placeholder = "Kërko në listë…", ikona = Ik.Kerko, lartesia = 46.dp)
        val k = kerkimi.trim().lowercase()
        val te = (if (tabi == "skaduara") skaduara else produktet).filter { k.isEmpty() || ((it["produkti"] ?: "") + " " + (it["barkodi"] ?: "")).lowercase().contains(k) }
        Column(Modifier.fillMaxWidth().heightIn(max = 320.dp).clip(RoundedCornerShape(14.dp)).border(1.dp, n.line, RoundedCornerShape(14.dp))
            .verticalScroll(rememberScrollState())) {
            if (te.isEmpty()) Text(if (k.isNotEmpty()) "Asgjë s'përputhet me kërkimin." else if (tabi == "skaduara") "S'ke produkte të skaduara në raft." else "S'ke ende produkte në Stoku.",
                style = tx(14, 400, n.muted), modifier = Modifier.padding(16.dp))
            te.take(300).forEach { x ->
                val c = celes(x)
                val on = zgjedhur.any { celes(it) == c }
                Row(Modifier.fillMaxWidth().clickable {
                    zgjedhur = if (on) zgjedhur.filter { celes(it) != c } else if (zgjedhur.size >= GrupiLogjika.KERKESA_MAKS) zgjedhur else zgjedhur + x
                    if (zgjedhur.isNotEmpty()) gabim = ""
                }.padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(Modifier.size(22.dp).clip(RoundedCornerShape(6.dp)).background(if (on) n.accent else n.surface).border(1.5.dp, if (on) n.accent else n.control, RoundedCornerShape(6.dp)),
                        contentAlignment = Alignment.Center) { if (on) Icon(Ik.Kontroll, null, Modifier.size(14.dp), tint = Color.White) }
                    Column(Modifier.weight(1f)) {
                        Text((x["produkti"] ?: "").ifEmpty { x["barkodi"] ?: "" }.ifEmpty { "produkt" }, style = tx(15, 600, n.ink))
                        val nen = listOf(if ((x["produkti"] ?: "").isNotEmpty() && (x["barkodi"] ?: "").isNotEmpty()) x["barkodi"]!! else "", x["nen"] ?: "").filter { it.isNotEmpty() }.joinToString(" · ")
                        if (nen.isNotEmpty()) Text(nen, style = tx(12, 400, n.muted))
                    }
                }
            }
        }
        Text("Kujt t'ia kërkosh", style = tx(13, 600, n.ink2))
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Cip("Krejt grupi (${kol.size})", null, per.isEmpty()) { per = "" }
            kol.forEach { a -> Cip(jsString(a["emri"] ?: ""), null, per == a["uid"]) { per = a["uid"] as String } }
        }
        Text("Shënim (s'është i detyrueshëm)", style = tx(13, 600, n.ink2))
        Fusha(shenim, { shenim = it.take(300) }, Modifier.fillMaxWidth(), placeholder = "Shënim për kolegun", kurVeprim = { dergo() })
        if (gabim.isNotEmpty()) Text(gabim, style = tx(13, 600, n.exp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Buton("Anulo", mbyll, Modifier.weight(1f), lloji = "dyte")
            Buton(if (zgjedhur.isEmpty()) "Dërgo" else "Dërgo (${zgjedhur.size})", { dergo() }, Modifier.weight(1f), aktiv = kol.isNotEmpty())
        }
    }
}

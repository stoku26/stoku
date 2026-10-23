package site.stoku.logjika

import java.text.Collator
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.random.Random

/*
 * Afatet (datat e skadimit): përkthim i afatet.js (pjesa pa DOM). Ngjyrat: e kuqe = ka skaduar, e verdhë = brenda 30
 * ditëve, e gjelbër = në rregull, gri = i hequr nga rafti.
 * Afati: { id, barkodi, emri, data: 'VVVV-MM-DD', sasia (copë ose ''), furnizuesi, statusi: 'aktiv'|'hequr',
 *          lajmeruarSe, hequrSe, krijuarSe, ndryshuarSe, krijuarNga, m (marketi) }
 */
object Afatet {
    const val DITET_PARALAJMERIMI = 30

    private fun dy(n: Int) = (if (n < 10) "0" else "") + n
    fun isoNgaData(d: LocalDate): String = d.year.toString() + "-" + dy(d.monthValue) + "-" + dy(d.dayOfMonth)
    fun dataSot(zona: ZoneId = ZoneId.systemDefault()): LocalDate = LocalDate.now(zona)
    fun sot(): String = isoNgaData(dataSot())

    private val ISO_RE = Regex("^(\\d{4})-(\\d{2})-(\\d{2})$")
    fun dataNgaIso(iso: Any?): LocalDate? {
        val m = ISO_RE.matchEntire((iso as? String) ?: return null) ?: return null
        return try { LocalDate.of(m.groupValues[1].toInt(), m.groupValues[2].toInt(), m.groupValues[3].toInt()) } catch (e: Exception) { null }
    }

    private fun dataETani(tani: Long?): LocalDate =
        if (tani == null) dataSot() else Instant.ofEpochMilli(tani).atZone(ZoneId.systemDefault()).toLocalDate()

    /** Sa ditë kanë mbetur deri në afat (0 = sot, negativ = ka skaduar), ose null pa datë */
    fun ditetDeri(iso: Any?, tani: Long? = null): Int? {
        val d = dataNgaIso(iso) ?: return null
        return ChronoUnit.DAYS.between(dataETani(tani), d).toInt()
    }

    /** 'skaduar' | 'pa-date' | 'afer' | 'ok' | 'hequr' */
    fun statusi(a: Obj?, tani: Long? = null): String {
        if (a == null) return "ok"
        if (a["statusi"] == "hequr") return "hequr"
        val n = ditetDeri(a["data"], tani) ?: return "pa-date"
        if (n < 0) return "skaduar"
        if (n <= DITET_PARALAJMERIMI) return "afer"
        return "ok"
    }

    /** 'VVVV-MM-DD' → 'DD.MM.VVVV' */
    fun formato(iso: Any?): String {
        val d = dataNgaIso(iso)
        return if (d != null) dy(d.dayOfMonth) + "." + dy(d.monthValue) + "." + d.year else ((iso as? String) ?: "")
    }

    fun ditetTekst(n: Int) = if (n == 1) "1 ditë" else "$n ditë"
    fun ditetParaTekst(n: Int) = if (n == 1) "1 dite" else "$n ditësh"

    private val PRAPASHTESA = Regex("(cope|copë|cop|pcs|kom|x)$", RegexOption.IGNORE_CASE)
    private val SHUMA = Regex("^\\d{1,6}(\\+\\d{1,6})*$")
    /** Sasia: numër i plotë ≥ 0, ose "" kur s'është shkruar. "60+30" → 90 */
    fun lexoSasine(v: Any?): Any {
        if (v == null) return ""
        val t = jsString(v).trim().replace(Regex("\\s+"), "").replace(PRAPASHTESA, "")
        if (!SHUMA.matches(t)) return ""
        return t.split('+').sumOf { it.toLong() }
    }
    fun sasiaSiShume(v: Any?): String {
        val t = (if (v == null) "" else jsString(v)).replace(Regex("\\s+"), "")
        return if (t.contains('+') && lexoSasine(t) != "") t else ""
    }
    const val SASIA_E_MADHE = "Sasia duket si barkod (shumë shifra). Shkruaj sasinë, jo barkodin."
    fun sasiaEPranueshme(t: Any?): Boolean = Regex("^-?\\d{1,6}$").matches((if (t == null) "" else jsString(t)).trim())
    fun sasiaTekst(a: Obj?): String {
        val s = a?.get("sasia")
        return if (a != null && s != "" && s != null) jsString(s) + " copë" else ""
    }
    fun shumaCopeve(lista: List<Obj>): Double = lista.sumOf { (it["sasia"] as? Number)?.toDouble() ?: 0.0 }

    /** Teksti i veprimit të sugjeruar */
    fun pershkrimi(a: Obj, tani: Long? = null): String {
        val st = statusi(a, tani)
        val n = ditetDeri(a["data"], tani)
        return when (st) {
            "hequr" -> "U hoq nga rafti" + ((a["hequrSe"] as? Number)?.let { " më " + formato(isoNgaData(Instant.ofEpochMilli(it.toLong()).atZone(ZoneId.systemDefault()).toLocalDate())) } ?: "") + "."
            "pa-date" -> "Mungon data e skadimit. Plotësoje."
            "skaduar" -> (if (n == -1) "Skadoi dje" else "Ka skaduar para " + ditetParaTekst(-n!!)) + ". Ky produkt duhet të hiqet nga rafti/pozita."
            "afer" -> (if (n == 0) "Skadon SOT" else if (n == 1) "Skadon nesër" else "Skadon për " + ditetTekst(n!!)) + "."
            else -> "Në rregull, skadon për " + ditetTekst(n!!) + "."
        }
    }

    /** Kolona "Ditët e mbetura": (para, nr, pas) */
    data class Mbetura(val para: String, val nr: String, val pas: String)
    fun ditetEMbetura(a: Obj?, tani: Long? = null): Mbetura {
        val st = statusi(a, tani); val n = ditetDeri(a?.get("data"), tani)
        if (st == "hequr") return Mbetura("U hoq nga rafti", "", "")
        if (n == null) return Mbetura("Pa datë", "", "")
        if (n < -1) return Mbetura("Skadoi para", (-n).toString(), "ditësh")
        if (n == -1) return Mbetura("Skadoi", "", "dje")
        if (n == 0) return Mbetura("", "Sot", "skadon")
        if (n == 1) return Mbetura("", "1", "ditë (nesër)")
        return Mbetura("", n.toString(), "ditë")
    }

    // ---------- Leximi i datave të shkruara me dorë ----------
    private val MUAJT = mapOf("jan" to 1, "shk" to 2, "feb" to 2, "mar" to 3, "pri" to 4, "apr" to 4, "maj" to 5, "may" to 5, "qer" to 6, "jun" to 6,
        "kor" to 7, "jul" to 7, "gus" to 8, "aug" to 8, "sht" to 9, "sep" to 9, "tet" to 10, "oct" to 10, "okt" to 10, "nen" to 11, "nën" to 11,
        "nov" to 11, "dhj" to 12, "dec" to 12, "dhe" to 12)
    private fun vitiPlote(v: String): Int { val n = v.toInt(); return if (n < 100) 2000 + n else n }
    fun ndertoIso(v: Int, m: Int, d: Int): String? = try { isoNgaData(LocalDate.of(v, m, d)) } catch (e: Exception) { null }
    private fun fundiMuajit(v: Int, m: Int): String? = if (m in 1..12) isoNgaData(LocalDate.of(v, m, 1).plusMonths(1).minusDays(1)) else null
    fun ditaNeMuaj(dita: Int, muaji: Int): String? {
        val v = dataSot().year
        var iso = ndertoIso(v, muaji, dita)
        if (iso != null && (ditetDeri(iso) ?: 0) < -180) iso = ndertoIso(v + 1, muaji, dita)
        return iso
    }

    private val R1 = Regex("^(\\d{4})[-./](\\d{1,2})[-./](\\d{1,2})$")
    private val R2 = Regex("^(\\d{1,2})[ ./-](\\d{1,2})[ ./-](\\d{2}|\\d{4})$")
    private val R3 = Regex("^(\\d{1,2})[./-](\\d{4})$")
    private val R4 = Regex("^(\\d{1,2})[./-](\\d{1,2})$")
    private val R5 = Regex("^(\\d{1,2})\\s*([a-zëç]{3,})\\.?\\s*(\\d{2}|\\d{4})$")
    private val R6 = Regex("^([a-zëç]{3,})\\.?\\s*(\\d{2}|\\d{4})$")
    private val R7 = Regex("^(\\d{2})(\\d{2})(\\d{2}|\\d{4})$")

    /** Data në formate të zakonshme → 'VVVV-MM-DD' ose null */
    fun lexoDaten(t: Any?): String? {
        if (t == null) return null
        val s = jsString(t).trim().lowercase().replace(Regex("\\s+"), " ")
        if (s.isEmpty()) return null
        R1.matchEntire(s)?.let { return ndertoIso(it.groupValues[1].toInt(), it.groupValues[2].toInt(), it.groupValues[3].toInt()) }
        R2.matchEntire(s)?.let { return ndertoIso(vitiPlote(it.groupValues[3]), it.groupValues[2].toInt(), it.groupValues[1].toInt()) }
        R3.matchEntire(s)?.let { return fundiMuajit(it.groupValues[2].toInt(), it.groupValues[1].toInt()) }
        R4.matchEntire(s)?.let {
            val a = it.groupValues[1].toInt(); val b = it.groupValues[2].toInt()
            if (b > 12) return fundiMuajit(vitiPlote(it.groupValues[2]), a)
            return ditaNeMuaj(a, b)
        }
        R5.matchEntire(s)?.let { m -> MUAJT[m.groupValues[2].take(3)]?.let { return ndertoIso(vitiPlote(m.groupValues[3]), it, m.groupValues[1].toInt()) } }
        R6.matchEntire(s)?.let { m -> MUAJT[m.groupValues[1].take(3)]?.let { return fundiMuajit(vitiPlote(m.groupValues[2]), it) } }
        R7.matchEntire(s)?.let { return ndertoIso(vitiPlote(it.groupValues[3]), it.groupValues[2].toInt(), it.groupValues[1].toInt()) }
        return null
    }

    /** Fusha e datës (DD-MM-VV): vizat shtohen vetë gjatë shkrimit */
    fun formatoDatenGjateShkrimit(raw: String): String {
        var d = ""
        for (c in raw) {
            if (d.length >= 8) break
            if (c in '0'..'9') d += c
            else if (d.length == 1 || d.length == 3) d = d.dropLast(1) + "0" + d.takeLast(1)
        }
        var v = d.take(2)
        if (d.length >= 2) v += "-" + d.substring(2, minOf(4, d.length))
        if (d.length >= 4) v += "-" + d.substring(4, minOf(8, d.length))
        return v
    }
    /** 'VVVV-MM-DD' → 'DD-MM-VV' */
    fun formatoPerFushe(iso: Any?): String {
        val d = dataNgaIso(iso) ?: return ""
        val v = d.year
        return dy(d.dayOfMonth) + "-" + dy(d.monthValue) + "-" + (if (v in 2000..2099) dy(v - 2000) else v.toString())
    }
    fun lexoDatenEFushes(v: String?): String? {
        val t = (v ?: "").trim()
        return if (Regex("^\\d{1,2}[./-]\\d{1,2}[./-](\\d{2}|\\d{4})$").matches(t)) lexoDaten(t) else null
    }

    fun idERe(tani: Long = System.currentTimeMillis()): String {
        val r = (1..5).map { "0123456789abcdefghijklmnopqrstuvwxyz"[Random.nextInt(36)] }.joinToString("")
        return "a" + tani.toString(36) + r
    }

    // ---------- Renditja ----------
    private val RENDI_STATUSIT = mapOf("skaduar" to 0, "pa-date" to 1, "afer" to 2, "ok" to 3, "hequr" to 4)
    val KOLATORI: Collator = Collator.getInstance(Locale.forLanguageTag("sq")).apply { strength = Collator.TERTIARY }
    fun krahaso(a: Obj, b: Obj, tani: Long? = null): Int {
        val sa = RENDI_STATUSIT[statusi(a, tani)]!!; val sb = RENDI_STATUSIT[statusi(b, tani)]!!
        if (sa != sb) return sa - sb
        if (sa == 4) return jsNumber(b["hequrSe"] ?: 0).let { hb -> jsNumber(a["hequrSe"] ?: 0).let { ha -> java.lang.Double.compare(if (hb.isNaN()) 0.0 else hb, if (ha.isNaN()) 0.0 else ha) } }
        val d = krahasoTekst(ose(a["data"]), ose(b["data"]))
        return if (d != 0) d else KOLATORI.compare(ose(a["emri"]), ose(b["emri"]))
    }
    private fun ose(x: Any?): String = if (x == null || x == "" || x == false) "" else jsString(x)

    data class Numrat(val skaduar: Int, val afer: Int, val ok: Int, val hequr: Int, val paDate: Int, val aktive: Int)
    fun numero(lista: List<Obj>, tani: Long? = null): Numrat {
        var sk = 0; var af = 0; var ok = 0; var hq = 0; var pd = 0; var ak = 0
        lista.forEach { a ->
            when (statusi(a, tani)) { "skaduar" -> sk++; "afer" -> af++; "ok" -> ok++; "hequr" -> hq++; else -> pd++ }
            if (statusi(a, tani) != "hequr") ak++
        }
        return Numrat(sk, af, ok, hq, pd, ak)
    }

    // ---------- Muajt ----------
    val EMRAT_MUAJVE = listOf("Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor")
    val MUAJT_SHKURT = listOf("Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Kor", "Gus", "Sht", "Tet", "Nën", "Dhj")
    fun celesiMuajit(a: Obj?): String { val d = a?.get("data"); val s = if (d == null) "" else jsString(d); return if (Regex("^\\d{4}-\\d{2}").containsMatchIn(s)) s.take(7) else "pa-date" }
    fun emriMuajit(celes: String, meVit: Boolean = true): String {
        if (celes == "pa-date") return "Pa datë"
        val m = Regex("^(\\d{4})-(\\d{2})$").matchEntire(celes) ?: return ""
        val i = m.groupValues[2].toInt()
        if (i !in 1..12) return ""
        return EMRAT_MUAJVE[i - 1] + (if (!meVit) "" else " " + m.groupValues[1])
    }
    data class Muaji(val celes: String, val n: Int, val emri: String)
    fun muajtELista(lista: List<Obj>): List<Muaji> {
        val m = LinkedHashMap<String, Int>()
        lista.forEach { val k = celesiMuajit(it); m[k] = (m[k] ?: 0) + 1 }
        val vitet = m.keys.filter { it != "pa-date" }.map { it.take(4) }.toSet()
        val meVit = vitet.size > 1 || (vitet.size == 1 && vitet.first() != dataSot().year.toString())
        return m.keys.sortedWith { a, b -> if (a == "pa-date") 1 else if (b == "pa-date") -1 else a.compareTo(b) }
            .map { Muaji(it, m[it]!!, emriMuajit(it, meVit)) }
    }

    // ---------- Furnizuesit ----------
    const val PA_FURNIZUES = "__pa__"
    fun celesiFurnizuesit(a: Obj?): String {
        val f = ((a?.get("furnizuesi") as? String) ?: (a?.get("furnizuesi")?.let { jsString(it) } ?: "")).trim().replace(Regex("\\s+"), " ").lowercase()
        return f.ifEmpty { PA_FURNIZUES }
    }
    data class Furnizuesi(val celes: String, val n: Int, val emri: String)
    fun furnizuesitELista(lista: List<Obj>): List<Furnizuesi> {
        val m = LinkedHashMap<String, Furnizuesi>()
        lista.forEach { a ->
            val k = celesiFurnizuesit(a)
            val x = m[k]
            m[k] = if (x == null) Furnizuesi(k, 1, if (k == PA_FURNIZUES) "Pa furnizues" else jsString(a["furnizuesi"]).trim().replace(Regex("\\s+"), " ")) else x.copy(n = x.n + 1)
        }
        return m.values.sortedWith { a, b ->
            if (a.celes == PA_FURNIZUES) 1 else if (b.celes == PA_FURNIZUES) -1 else KOLATORI.compare(a.emri, b.emri)
        }
    }

    // ---------- Ikonat e folderave ----------
    class Ikona(val id: String, val emri: String, val ngj: String, val d: String)
    val IKONAT_FOLDERAVE = listOf(
        Ikona("kutia", "Kuti", "gri", "M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z M3 7l9 4.5L21 7 M12 11.5v10 M7.5 4.8l9 4.5"),
        Ikona("shporta", "Ushqim", "blu", "M3 10h18l-1.7 8.4A2 2 0 0 1 17.3 20H6.7a2 2 0 0 1-2-1.6L3 10Z M7.5 10l3-6 M16.5 10l-3-6 M9 14v2.5 M15 14v2.5 M12 14v2.5"),
        Ikona("shishe", "Pije", "vjollce", "M10 2h4 M10.5 2v3.5L8.6 8.3A3 3 0 0 0 8 10.1V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9.9a3 3 0 0 0-.6-1.8L13.5 5.5V2 M8 13.5h8"),
        Ikona("gjethe", "Fresh", "gjelber", "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z M2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3"),
        Ikona("molla", "Fruta", "kuqe", "M12 7.5c-1-1.8-3-2.6-5-1.8-3.2 1.2-3.8 5.6-1.8 10 1.5 3.4 3.5 4.9 5 4.4.7-.3 1.1-.5 1.8-.5s1.1.2 1.8.5c1.5.5 3.5-1 5-4.4 2-4.4 1.4-8.8-1.8-10-2-.8-4 0-5 1.8Z M12 7.5c0-2 .8-3.6 2.8-4.5"),
        Ikona("qumesht", "Bulmet", "blu", "M8 2h8 M9 2v3L7 8.5V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8.5L15 5V2 M7 8.5h10 M10 14h4"),
        Ikona("buka", "Furra", "portokalli", "M5 10.5a3.5 3.5 0 0 1 3.5-3.5h7a3.5 3.5 0 0 1 3.5 3.5 2 2 0 0 1-1.5 1.9V19a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6.6A2 2 0 0 1 5 10.5Z M10 7v2.5 M14 7v2.5"),
        Ikona("akull", "Të ngrira", "blu", "M12 2v20 M3.3 7l17.4 10 M20.7 7 3.3 17 M9.5 3.5 12 6l2.5-2.5 M9.5 20.5 12 18l2.5 2.5"),
        Ikona("embelsira", "Ëmbëlsira", "roze", "M3 21h18 M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7 M4 16c2 1.4 4 1.4 6 0s4-1.4 6 0 3 1 4 0 M12 12V8 M12 5v.01"),
        Ikona("kafe", "Kafe", "portokalli", "M17 9h1a3.5 3.5 0 0 1 0 7h-1 M3 9h14v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9Z M7 2.5v3 M10.5 2.5v3 M14 2.5v3"),
        Ikona("pika", "Higjiene", "vjollce", "M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0L12 2.7Z M8.5 14.5a3.5 3.5 0 0 0 3.5 3.5"),
        Ikona("shtepia", "Shtëpia", "gjelber", "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z M9.5 21v-6.5h5V21"),
        Ikona("kryq", "Farmaci", "kuqe", "M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"),
        Ikona("etiketa", "Oferta", "roze", "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z M7.5 7.5h.01"),
        Ikona("yll", "Të tjera", "portokalli", "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"),
        Ikona("zemra", "Të preferuara", "kuqe", "M19.5 13.6 12 21l-7.5-7.4A5 5 0 1 1 12 7a5 5 0 1 1 7.5 6.6Z")
    )
    private val IKONAT_SIPAS_EMRIT = listOf(
        Regex("ushq|market|shport") to "shporta", Regex("pije|leng|uj[eë]|birr|ver[eë]") to "shishe", Regex("fresh|perim|sallat") to "gjethe",
        Regex("frut|moll") to "molla", Regex("bulm|qum[eë]sht|djath|kos|jogurt") to "qumesht", Regex("buk|furr|pasticer") to "buka",
        Regex("ngrir|akull|frigo") to "akull", Regex("[eë]mb[eë]l|[cç]okoll|biskot|sheqer") to "embelsira", Regex("kafe|[cç]aj") to "kafe",
        Regex("higjien|pastr|detergj|sapun|kozmet") to "pika", Regex("sht[eë]pi|kuzhin") to "shtepia", Regex("farmac|sh[eë]ndet|barn") to "kryq",
        Regex("ofert|zbritj|akcion") to "etiketa"
    )
    fun ikonaEFolderit(f: Obj?): Ikona {
        val id = f?.get("ikona")
        IKONAT_FOLDERAVE.firstOrNull { it.id == id }?.let { return it }
        val emri = jsString(f?.get("emri") ?: "").lowercase()
        IKONAT_SIPAS_EMRIT.firstOrNull { it.first.containsMatchIn(emri) }?.let { p -> return IKONAT_FOLDERAVE.first { it.id == p.second } }
        return IKONAT_FOLDERAVE[0]
    }
}

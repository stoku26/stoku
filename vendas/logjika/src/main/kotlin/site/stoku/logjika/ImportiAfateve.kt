package site.stoku.logjika

import java.time.Instant
import java.time.ZoneOffset

/*
 * Importi i afateve nga Excel/CSV: përkthim i pjesës "Importi i afateve nga Excel/CSV" të afatet.js (muajiNgaEmri,
 * tekstNgaQeliza, dataNgaQeliza, hamendesoKolonatEAfateve, planiImportitAfateve, afatetNgaPlani).
 * Çdo fletë lexohet; fleta me emër muaji ("Nëntor", "Nëntor2"…) e jep muajin kur data ka vetëm ditën. Afatet që
 * ekzistojnë (i njëjti barkod/emër + data) kalohen; rreshtat e përsëritur bashkohen (sasitë mblidhen).
 * tani (opsional): ora "tani" për testet (datat me vetëm ditën varen nga viti i tanishëm).
 */
object ImportiAfateve {
    private val MUAJT_PLOTE = listOf(
        listOf("janar", "january", "jan"), listOf("shkurt", "february", "feb", "shk"), listOf("mars", "march", "mar"), listOf("prill", "april", "pri", "apr"),
        listOf("maj", "may"), listOf("qershor", "june", "qer", "jun"), listOf("korrik", "july", "kor", "jul"), listOf("gusht", "august", "gus", "aug"),
        listOf("shtator", "september", "sht", "sep", "sept"), listOf("tetor", "october", "tet", "okt", "oct"), listOf("nentor", "november", "nen", "nov"),
        listOf("dhjetor", "december", "dhj", "dec", "dhe")
    )
    private fun pastroShkronjat(t: Any?): String =
        jsString(if (eVertete(t)) t else "").lowercase().replace("ë", "e").replace("ç", "c").replace(Regex("[^a-z]"), "")

    /** "Nëntor", "nentor2", "NENTOR 2", "Nëntor (2)", "nov" → 11. Numrat dhe shenjat harrohen. Jo-muaj → null. */
    fun muajiNgaEmri(t: Any?): Int? {
        val sh = pastroShkronjat(t)
        if (sh.length < 3) return null
        MUAJT_PLOTE.forEachIndexed { i, l -> if (l.any { w -> sh == w || (w.length > 3 && w.startsWith(sh)) }) return i + 1 }
        return null
    }

    fun tekstNgaQeliza(v: Any?): String {
        if (v is Number) {
            val d = v.toDouble()
            if (d.isFinite() && d == Math.floor(d) && Math.abs(d) < 1e21) return if (d == 0.0 && 1 / d < 0) "-0" else java.math.BigDecimal(d).toPlainString()
            return numriSiTekst(d)
        }
        return jsTrim(if (v == null) "" else jsString(v))
    }

    private val DITE_MUAJ = Regex("^(\\d{1,2})\\.(\\d+)$")
    private val VETEM_DITA = Regex("^\\d{1,2}\\.?$")
    /** Data nga një qelizë: numër serial i Excel-it, tekst ("12.10.2026", "12 nëntor 26"…), ose vetëm dita ("15") kur fleta ka muajin */
    fun dataNgaQeliza(v0: Any?, muajiFletes: Int?, tani: Long? = null): String? {
        var v = v0
        if (v is Number && v.toDouble().isFinite()) {
            val d = v.toDouble()
            if (d > 20000 && d < 80000) {
                val dt = Instant.ofEpochMilli(jsRound((d - 25569) * 86400000.0).toLong()).atZone(ZoneOffset.UTC).toLocalDate()
                return Afatet.ndertoIso(dt.year, dt.monthValue, dt.dayOfMonth)
            }
            if (d >= 1 && d <= 31 && d == Math.floor(d) && muajiFletes != null) return Afatet.ditaNeMuaj(d.toInt(), muajiFletes, tani)
            // Excel-i e ruan "12.10" (dita.muaji) si 12.1 dhe "10.2030" (muaji.viti) si 10.203: rikthehet zeroja e fundit
            var s = numriSiTekst(d)
            val p = DITE_MUAJ.matchEntire(s)
            if (p != null && p.groupValues[2] == "1") s += "0"
            else if (p != null && Regex("^20\\d$").matches(p.groupValues[2])) s += "0"
            v = s
        }
        val s = jsTrim(if (v == null) "" else jsString(v))
        if (s.isEmpty()) return null
        Afatet.lexoDaten(s, tani)?.let { return it }
        if (VETEM_DITA.matches(s) && muajiFletes != null) return Afatet.ditaNeMuaj(s.trimEnd('.').toInt(), muajiFletes, tani)
        return null
    }

    fun normTitulli(t: Any?): String =
        jsString(if (eVertete(t)) t else "").lowercase().replace("ë", "e").replace("ç", "c").replace(Regex("[^a-z0-9]"), "")

    val FUSHAT = listOf("barkodi", "emri", "data", "sasia", "furnizuesi")
    private val FJALET = mapOf(
        "barkodi" to listOf("barkod", "barcode", "ean", "kodi", "sku", "code"),
        "data" to listOf("skad", "afat", "data", "expir", "exp", "valid", "deri", "date"),
        "sasia" to listOf("sasi", "cope", "qty", "quantity", "pako", "stok"),
        "furnizuesi" to listOf("furniz", "furnit", "supplier", "kompani", "firma", "distribut", "vendor"),
        "emri" to listOf("emri", "emer", "produkt", "artikull", "pershkrim", "name", "description", "malli")
    )

    /** Kolonat sipas titujve (ose sipas përmbajtjes kur s'ka tituj): { barkodi, emri, data, sasia, furnizuesi } (-1 = s'ka) */
    fun hamendesoKolonat(rows: List<List<Any?>>, meKoke: Boolean, tani: Long? = null): Map<String, Int> {
        val nKol = rows.maxOfOrNull { it.size } ?: 0
        val k = linkedMapOf("barkodi" to -1, "emri" to -1, "data" to -1, "sasia" to -1, "furnizuesi" to -1)
        if (meKoke && rows.isNotEmpty()) {
            val titujt = rows[0].map { normTitulli(it) }
            listOf("barkodi", "data", "sasia", "furnizuesi", "emri").forEach { f ->
                for (i in titujt.indices) {
                    if (k.values.contains(i)) continue
                    if (FJALET[f]!!.any { titujt[i].contains(it) }) { k[f] = i; break }
                }
            }
        }
        val fillimi = if (meKoke) 1 else 0
        val mostra = rows.drop(fillimi).take(30)
        fun piket(fn: (Any?) -> Boolean): Int {
            var m = -1; var iM = -1
            for (i in 0 until nKol) {
                if (k.values.contains(i)) continue
                val n = mostra.count { r -> fn(r.getOrNull(i)) }
                if (n > m && n >= maxOf(1.0, mostra.size * 0.5)) { m = n; iM = i }
            }
            return iM
        }
        if (k["data"]!! < 0) k["data"] = piket { v -> (v is Number && v.toDouble() > 20000 && v.toDouble() < 80000) || (v is String && Afatet.lexoDaten(v, tani) != null) }
        if (k["barkodi"]!! < 0) k["barkodi"] = piket { v -> Regex("^\\d{6,14}$").matches(tekstNgaQeliza(v)) }
        if (k["emri"]!! < 0) k["emri"] = piket { v -> v is String && Regex("[a-zA-Zëç]{3,}").containsMatchIn(v) }
        if (k["sasia"]!! < 0) k["sasia"] = piket { v -> val t = tekstNgaQeliza(v); Regex("^\\d{1,5}$").matches(t) && t.toInt() < 100000 }
        return k
    }

    class Rreshti(
        val fleta: String, val nr: Int, val barkodi: String, val emri: String, val data: String, val dataOrigjinale: String,
        val sasia: Any, val furnizuesi: String, var gabim: String = "", var veprimi: String = "", var bashkoMe: Rreshti? = null
    )
    class Plani(val rreshta: List<Rreshti>, val teRinj: Int, val ekzistojne: Int, val gabime: Int, val bashkuar: Int)

    private val VIZA_HAPESIRA = Regex("[$JS_HAPESIRAT-]")
    private val TOTALI = Regex("^(gjithsej|totali?|shuma|sum)$", RegexOption.IGNORE_CASE)

    /**
     * Plani i importit (pa ndryshuar asgjë). fletet: [(emri, rreshtat)]; kol: kolona për çdo fushë (-1 = s'ka);
     * ekzistuese: afatet e tanishme (ato me të njëjtin barkod/emër + datë kalohen).
     */
    fun plani(fletet: List<Pair<String, List<List<Any?>>>>, meKoke: Boolean, kol0: Map<String, Int>, ekzistuese: List<Obj>, tani: Long? = null): Plani {
        val titujt0 = if (meKoke && fletet.isNotEmpty() && fletet[0].second.isNotEmpty()) fletet[0].second[0].map { normTitulli(it) } else null
        val ekz = HashSet<String>()
        ekzistuese.forEach { a ->
            if (a["statusi"] != "hequr" && eVertete(a["data"])) ekz.add((if (eVertete(a["barkodi"])) jsString(a["barkodi"]) else normTitulli(a["emri"])) + "|" + jsString(a["data"]))
        }
        val rreshta = ArrayList<Rreshti>()
        var teRinj = 0; var ekzistojne = 0; var gabime = 0; var bashkuar = 0
        val neSkedar = HashMap<String, Rreshti>()
        fletet.forEach { (emriF, rows0) ->
            val muaji = muajiNgaEmri(emriF)
            val kol = HashMap<String, Int>()
            FUSHAT.forEach { f ->
                val i = kol0[f] ?: -1
                if (i >= 0 && titujt0 != null && rows0.isNotEmpty()) {
                    val t = rows0[0].map { normTitulli(it) }
                    val j = if (i < titujt0.size) t.indexOf(titujt0[i]) else -1
                    kol[f] = if (j >= 0) j else i
                } else kol[f] = i
            }
            val rows = if (meKoke) rows0.drop(1) else rows0
            rows.forEachIndexed { i, r ->
                fun v(f: String): Any? { val k = kol[f] ?: -1; return if (k >= 0) r.getOrNull(k) else "" }
                val b = tekstNgaQeliza(v("barkodi")).replace(VIZA_HAPESIRA, "")
                val emri = tekstNgaQeliza(v("emri"))
                if (b.isEmpty() && emri.isEmpty() && tekstNgaQeliza(v("data")).isEmpty()) return@forEachIndexed // rresht bosh
                if (TOTALI.matches(b.ifEmpty { emri })) return@forEachIndexed
                val data = dataNgaQeliza(v("data"), muaji, tani)
                val s: Any = if ((kol["sasia"] ?: -1) >= 0) Afatet.lexoSasine(v("sasia")) else ""
                val rr = Rreshti(emriF, i + 1 + (if (meKoke) 1 else 0), b, emri, data ?: "", tekstNgaQeliza(v("data")), s, tekstNgaQeliza(v("furnizuesi")))
                if (rr.barkodi.isEmpty() && rr.emri.isEmpty()) rr.gabim = "pa barkod dhe pa emër"
                else if (data == null) rr.gabim = if (rr.dataOrigjinale.isNotEmpty()) "data s'u kuptua" else "pa datë"
                if (rr.gabim.isNotEmpty()) { gabime++; rreshta.add(rr); return@forEachIndexed }
                val ck = rr.barkodi.ifEmpty { normTitulli(rr.emri) } + "|" + rr.data
                val ne = neSkedar[ck]
                if (ekz.contains(ck)) { rr.veprimi = "ekziston, kalohet"; ekzistojne++ }
                else if (ne != null) {
                    rr.veprimi = "bashkohet me rreshtin " + ne.nr + (if (ne.fleta != rr.fleta) " (" + ne.fleta + ")" else "")
                    rr.bashkoMe = ne; bashkuar++
                } else { rr.veprimi = "i ri"; teRinj++; neSkedar[ck] = rr }
                rreshta.add(rr)
            }
        }
        return Plani(rreshta, teRinj, ekzistojne, gabime, bashkuar)
    }

    /** Afatet që do të shtohen (rreshtat e përsëritur në skedar bashkohen: sasitë mblidhen) */
    fun afatetNgaPlani(plan: Plani, krijuarNga: String?, tani: Long = System.currentTimeMillis()): List<MObj> {
        val teBashkuar = java.util.IdentityHashMap<Rreshti, MutableList<Rreshti>>()
        plan.rreshta.forEach { x -> val m = x.bashkoMe; if (m != null && x.sasia is Number) teBashkuar.getOrPut(m) { ArrayList() }.add(x) }
        val out = ArrayList<MObj>()
        plan.rreshta.forEach { r ->
            if (r.gabim.isNotEmpty() || r.veprimi != "i ri") return@forEach
            var sasia: Any = r.sasia
            teBashkuar[r]?.forEach { x -> sasia = ((sasia as? Number)?.toLong() ?: 0L) + (x.sasia as Number).toLong() }
            val a = obj("id" to Afatet.idERe(tani), "barkodi" to r.barkodi, "emri" to r.emri, "data" to r.data, "sasia" to sasia,
                "furnizuesi" to r.furnizuesi, "statusi" to "aktiv", "krijuarSe" to tani, "ndryshuarSe" to tani, "burimi" to "excel")
            if (!krijuarNga.isNullOrEmpty()) a["krijuarNga"] = krijuarNga
            out.add(a)
        }
        return out
    }
}

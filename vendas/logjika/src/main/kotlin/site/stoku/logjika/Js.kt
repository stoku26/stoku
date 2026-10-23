package site.stoku.logjika

import java.math.BigDecimal
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

/*
 * Të dhënat e Stoku-t si "objekte JavaScript": Map<String, Any?> (renditja e fushave ruhet), List<Any?>, String, Number
 * (Long ose Double), Boolean, null. Kështu aplikacioni native e lexon dhe e shkruan dyqanin (Firestore, kopja në telefon)
 * njësoj si web-i, pa humbur asnjë fushë që s'e njeh (një version më i ri i web-it mund të ketë fusha të reja).
 */

typealias Obj = Map<String, Any?>
typealias MObj = LinkedHashMap<String, Any?>

fun obj(vararg p: Pair<String, Any?>): MObj = linkedMapOf(*p)

@Suppress("UNCHECKED_CAST")
fun Any?.siObj(): Obj? = this as? Map<String, Any?>

@Suppress("UNCHECKED_CAST")
fun Any?.siListe(): List<Any?> = (this as? List<Any?>) ?: emptyList()

/** Kopje e cekët (si Object.assign({}, x)). */
fun Obj.kopje(): MObj = LinkedHashMap(this)

/** Object.assign({}, a, b) */
fun Obj.me(vararg p: Pair<String, Any?>): MObj { val m = LinkedHashMap(this); p.forEach { m[it.first] = it.second }; return m }

/** typeof x === 'number' && isFinite(x) */
fun eNumer(x: Any?): Boolean = x is Number && x.toDouble().isFinite()

/** Number(x) si te JavaScript (NaN kur s'është numër). */
fun jsNumber(x: Any?): Double = when (x) {
    null -> 0.0
    is Number -> x.toDouble()
    is Boolean -> if (x) 1.0 else 0.0
    is String -> {
        val t = x.trim()
        when {
            t.isEmpty() -> 0.0
            t.startsWith("0x") || t.startsWith("0X") -> t.substring(2).toLongOrNull(16)?.toDouble() ?: Double.NaN
            t == "Infinity" || t == "+Infinity" -> Double.POSITIVE_INFINITY
            t == "-Infinity" -> Double.NEGATIVE_INFINITY
            Regex("^[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?$").matches(t) -> t.toDouble()
            else -> Double.NaN
        }
    }
    else -> Double.NaN
}

/** E vërtetë si te JavaScript (`if (x)`): jo null, false, 0, NaN ose "" */
fun eVertete(x: Any?): Boolean = when (x) {
    null, false, "" -> false
    is Number -> { val d = x.toDouble(); d != 0.0 && !d.isNaN() }
    else -> true
}

/** Number(x) || 0 */
fun numerOse0(x: Any?): Double { val n = jsNumber(x); return if (n.isNaN() || n == 0.0) 0.0 else n }

/** Numri për ruajtje: i plotë → Long (si te web-i: Firestore e ruan si numër të plotë), përndryshe Double. */
fun numerPerRuajtje(d: Double): Any = if (d.isFinite() && d == Math.floor(d) && Math.abs(d) < 9.007199254740992E15) d.toLong() else d

/** typeof p.x === 'number' ? p.x : 0 (koha e ndryshimit) */
fun koha(o: Obj?, fusha: String): Double { val v = o?.get(fusha); return if (v is Number) v.toDouble() else 0.0 }

/** String(x) si te JavaScript (për vlera të thjeshta) */
fun jsString(x: Any?): String = when (x) {
    null -> "null"
    is String -> x
    is Number -> numriSiTekst(x.toDouble())
    is Boolean -> x.toString()
    is List<*> -> x.joinToString(",") { if (it == null) "" else jsString(it) }
    is Map<*, *> -> "[object Object]"
    else -> x.toString()
}

/** Numri si e shkruan JavaScript (String(n), JSON.stringify) */
fun numriSiTekst(d: Double): String {
    if (d.isNaN()) return "NaN"
    if (d.isInfinite()) return if (d > 0) "Infinity" else "-Infinity"
    if (d == 0.0) return "0"
    if (d == Math.floor(d) && Math.abs(d) < 1e21) return BigDecimal(d).toPlainString()
    val bd = BigDecimal(d.toString())
    val eksp = bd.precision() - bd.scale() - 1 // eksponenti dhjetor
    if (eksp >= 21 || eksp <= -7) {
        val shifrat = bd.unscaledValue().abs().toString().trimEnd('0').ifEmpty { "0" }
        val mant = if (shifrat.length > 1) shifrat[0] + "." + shifrat.substring(1) else shifrat
        return (if (d < 0) "-" else "") + mant + "e" + (if (eksp > 0) "+" else "") + eksp
    }
    return bd.stripTrailingZeros().toPlainString()
}

private val ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC)
/** new Date(ms).toISOString() */
fun isoNgaMs(ms: Long): String = ISO.format(Instant.ofEpochMilli(ms))

// ---------------- JSON ----------------

object Json {
    fun shkruaj(x: Any?): String { val sb = StringBuilder(); shkruaj(x, sb); return sb.toString() }

    private fun shkruaj(x: Any?, sb: StringBuilder) {
        when (x) {
            null -> sb.append("null")
            is String -> tekst(x, sb)
            is Boolean -> sb.append(x)
            is Number -> { val d = x.toDouble(); sb.append(if (d.isFinite()) numriSiTekst(d) else "null") }
            is Map<*, *> -> {
                sb.append('{'); var i = 0
                for ((k, v) in x) {
                    if (i++ > 0) sb.append(',')
                    tekst(k.toString(), sb); sb.append(':'); shkruaj(v, sb)
                }
                sb.append('}')
            }
            is List<*> -> { sb.append('['); x.forEachIndexed { i, v -> if (i > 0) sb.append(','); shkruaj(v, sb) }; sb.append(']') }
            is Array<*> -> shkruaj(x.toList(), sb)
            else -> tekst(x.toString(), sb)
        }
    }

    fun tekst(s: String, sb: StringBuilder = StringBuilder()): StringBuilder {
        sb.append('"')
        var i = 0
        while (i < s.length) {
            val c = s[i]
            when {
                c == '"' -> sb.append("\\\"")
                c == '\\' -> sb.append("\\\\")
                c == '\b' -> sb.append("\\b")
                c == '\u000C' -> sb.append("\\f")
                c == '\n' -> sb.append("\\n")
                c == '\r' -> sb.append("\\r")
                c == '\t' -> sb.append("\\t")
                c < ' ' -> sb.append(String.format("\\u%04x", c.code))
                Character.isHighSurrogate(c) -> {
                    if (i + 1 < s.length && Character.isLowSurrogate(s[i + 1])) { sb.append(c).append(s[i + 1]); i++ }
                    else sb.append(String.format("\\u%04x", c.code))
                }
                Character.isLowSurrogate(c) -> sb.append(String.format("\\u%04x", c.code))
                else -> sb.append(c)
            }
            i++
        }
        sb.append('"')
        return sb
    }

    /** JSON.parse: objektet → LinkedHashMap, numrat e plotë → Long, të tjerët → Double */
    fun lexo(s: String): Any? { val p = Lexues(s); p.hapesira(); val v = p.vlera(); p.hapesira(); if (p.i != s.length) throw IllegalArgumentException("JSON: tepër në " + p.i); return v }

    fun lexoOse(s: String?): Any? = if (s == null) null else try { lexo(s) } catch (e: Exception) { null }

    private class Lexues(val s: String) {
        var i = 0
        fun hapesira() { while (i < s.length && (s[i] == ' ' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t')) i++ }
        fun vlera(): Any? {
            if (i >= s.length) throw IllegalArgumentException("JSON: fund")
            return when (s[i]) {
                '{' -> objekt()
                '[' -> liste()
                '"' -> tekst()
                't' -> fjala("true", true)
                'f' -> fjala("false", false)
                'n' -> fjala("null", null)
                else -> numer()
            }
        }
        fun fjala(f: String, v: Any?): Any? { if (!s.startsWith(f, i)) throw IllegalArgumentException("JSON: " + i); i += f.length; return v }
        fun objekt(): MObj {
            val m = MObj(); i++; hapesira()
            if (s[i] == '}') { i++; return m }
            while (true) {
                hapesira(); val k = tekst(); hapesira()
                if (s[i] != ':') throw IllegalArgumentException("JSON: pritej ':' " + i)
                i++; hapesira(); m[k] = vlera(); hapesira()
                if (s[i] == ',') { i++; continue }
                if (s[i] == '}') { i++; return m }
                throw IllegalArgumentException("JSON: " + i)
            }
        }
        fun liste(): ArrayList<Any?> {
            val l = ArrayList<Any?>(); i++; hapesira()
            if (s[i] == ']') { i++; return l }
            while (true) {
                hapesira(); l.add(vlera()); hapesira()
                if (s[i] == ',') { i++; continue }
                if (s[i] == ']') { i++; return l }
                throw IllegalArgumentException("JSON: " + i)
            }
        }
        fun tekst(): String {
            if (s[i] != '"') throw IllegalArgumentException("JSON: pritej tekst " + i)
            i++
            val sb = StringBuilder()
            while (true) {
                val c = s[i++]
                when (c) {
                    '"' -> return sb.toString()
                    '\\' -> {
                        when (val e = s[i++]) {
                            '"' -> sb.append('"'); '\\' -> sb.append('\\'); '/' -> sb.append('/')
                            'b' -> sb.append('\b'); 'f' -> sb.append('\u000C'); 'n' -> sb.append('\n')
                            'r' -> sb.append('\r'); 't' -> sb.append('\t')
                            'u' -> { sb.append(s.substring(i, i + 4).toInt(16).toChar()); i += 4 }
                            else -> throw IllegalArgumentException("JSON: \\$e")
                        }
                    }
                    else -> sb.append(c)
                }
            }
        }
        fun numer(): Any {
            val f = i
            if (s[i] == '-') i++
            while (i < s.length && (s[i].isDigit() || s[i] == '.' || s[i] == 'e' || s[i] == 'E' || s[i] == '+' || s[i] == '-')) i++
            val t = s.substring(f, i)
            if (t.isEmpty()) throw IllegalArgumentException("JSON: " + f)
            if (!t.contains('.') && !t.contains('e') && !t.contains('E')) t.toLongOrNull()?.let { if (Math.abs(it) < 9007199254740992L) return it }
            return t.toDouble()
        }
    }
}

/**
 * Paraqitja e qëndrueshme (ruajtja.js kanonik): fushat e renditura, që dy kopje me rend tjetër të fushave të dalin të njëjta.
 * Numrat e plotë dalin njësoj si Long ose Double (Firestore mund ta kthejë 5 si Long, kodi e llogarit si 5.0).
 */
fun kanonik(x: Any?): String {
    val sb = StringBuilder(); kanonik(x, sb); return sb.toString()
}

private fun kanonik(x: Any?, sb: StringBuilder) {
    when (x) {
        is List<*> -> { sb.append('['); x.forEachIndexed { i, v -> if (i > 0) sb.append(','); kanonik(v, sb) }; sb.append(']') }
        is Map<*, *> -> {
            sb.append('{')
            // Object.keys(x).sort(): renditja sipas njësive UTF-16 (si String.compareTo)
            x.keys.map { it.toString() }.sorted().forEachIndexed { i, k ->
                if (i > 0) sb.append(',')
                Json.tekst(k, sb); sb.append(':'); kanonik(x[k], sb)
            }
            sb.append('}')
        }
        null -> sb.append("null")
        else -> sb.append(Json.shkruaj(x))
    }
}

/** Bajtët UTF-8 të JSON.stringify(x) (madhësia e një pjese në Firestore) */
fun bajt(x: Any?): Int = Json.shkruaj(x).toByteArray(Charsets.UTF_8).size

/**
 * Krahasimi i teksteve afërsisht si String.prototype.localeCompare (ICU, pa gjuhë): shenjat < shifrat < shkronjat, pa dallim
 * shkronjash të mëdha/vogla dhe theksesh në radhë të parë (e < ë < f), pastaj theksi, pastaj e vogla para së madhes.
 * Përdoret vetëm për renditjen e listave (si te web-i); s'ndikon në bashkim.
 */
fun krahasoTekst(a: String, b: String): Int {
    if (a == b) return 0
    val pa = celesiRenditjes(a); val pb = celesiRenditjes(b)
    for (i in 0 until minOf(pa.size, pb.size)) if (pa[i] != pb[i]) return if (pa[i] < pb[i]) -1 else 1
    if (pa.size != pb.size) return if (pa.size < pb.size) -1 else 1
    val sa = java.text.Normalizer.normalize(a, java.text.Normalizer.Form.NFD); val sb = java.text.Normalizer.normalize(b, java.text.Normalizer.Form.NFD)
    val ta = sa.filter { Character.getType(it) == Character.NON_SPACING_MARK.toInt() }; val tb = sb.filter { Character.getType(it) == Character.NON_SPACING_MARK.toInt() }
    if (ta != tb) return if (ta < tb) -1 else 1
    for (i in 0 until minOf(a.length, b.length)) {
        val x = a[i]; val y = b[i]
        if (x != y && x.lowercaseChar() == y.lowercaseChar()) return if (x.isLowerCase()) -1 else 1
    }
    return a.compareTo(b).let { if (it < 0) -1 else if (it > 0) 1 else 0 }
}

private fun celesiRenditjes(s: String): IntArray {
    val n = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
    val r = ArrayList<Int>()
    for (c in n) {
        if (Character.getType(c) == Character.NON_SPACING_MARK.toInt()) continue
        val l = c.lowercaseChar()
        r.add(when {
            l.isLetter() -> 300000 + l.code
            l.isDigit() -> 200000 + l.code
            else -> 100000 + l.code
        })
    }
    return r.toIntArray()
}

/** Indeks vargu i JavaScript-it ("0", "7", jo "07"): objektet e JS i rendisin këta çelësa të parët, sipas numrit */
private fun eshteIndeks(k: String): Boolean = k.isNotEmpty() && k.length <= 10 && (k == "0" || (k[0] in '1'..'9' && k.all { it.isDigit() })) && k.toLong() < 4294967295L

/** Object.keys(o): çelësat-indeks sipas numrit, pastaj të tjerët sipas radhës së futjes */
fun <V> renditjaJs(m: Map<String, V>): List<String> {
    val ind = m.keys.filter { eshteIndeks(it) }.sortedBy { it.toLong() }
    return if (ind.isEmpty()) m.keys.toList() else ind + m.keys.filter { !eshteIndeks(it) }
}

/** Math.round i JavaScript-it (gjysma lart; numrat shumë të mëdhenj mbeten) */
fun jsRound(n: Double): Double = if (!n.isFinite() || Math.abs(n) >= 4.503599627370496E15) n else Math.floor(n + 0.5)

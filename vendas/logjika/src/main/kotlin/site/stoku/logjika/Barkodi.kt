package site.stoku.logjika

/*
 * Barkodi si vija (për etiketat në PDF), si JsBarcode te web-i: EAN-13 (13 shifra), UPC-A (12), EAN-8 (8), përndryshe
 * (ose kur shifra e kontrollit s'përputhet) CODE128 me zgjedhjen automatike A/B/C të JsBarcode-it.
 * modulet: "1" = vijë e zezë, "0" = hapësirë, secila me gjerësi të njëjtë. Testet e krahasojnë me JsBarcode (fikstura).
 */
object Barkodi {
    class Kodi(val formati: String, val modulet: String)

    fun formati(b: String): String = when {
        Regex("^[0-9]{13}$").matches(b) -> "EAN13"
        Regex("^[0-9]{12}$").matches(b) -> "UPC"
        Regex("^[0-9]{8}$").matches(b) -> "EAN8"
        else -> "CODE128"
    }

    /** Si vizatoBarkodin() te app-tel.js: formati sipas gjatësisë, pastaj CODE128; null kur s'mund të kodohet (p.sh. "ë") */
    fun koduar(b: String): Kodi? {
        val f = formati(b)
        val formatet = if (f == "CODE128") listOf(f) else listOf(f, "CODE128")
        for (x in formatet) {
            val m = when (x) { "EAN13" -> ean13(b); "UPC" -> upc(b); "EAN8" -> ean8(b); else -> code128(b) }
            if (m != null) return Kodi(x, m)
        }
        return null
    }

    // ---------------- EAN / UPC ----------------
    private val L = listOf("0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011")
    private val G = listOf("0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111")
    private val R = listOf("1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100")
    private val STRUKTURA13 = listOf("LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL")
    private const val ANA = "101"
    private const val MES = "01010"

    private fun kodo(te: String, struktura: String): String =
        te.mapIndexed { i, c -> val d = c - '0'; when (struktura[i]) { 'L' -> L[d]; 'G' -> G[d]; else -> R[d] } }.joinToString("")

    private fun shifrat(b: String) = b.map { it - '0' }

    fun ean13(b: String): String? {
        if (!Regex("^[0-9]{13}$").matches(b)) return null
        val s = shifrat(b).take(12).foldIndexed(0) { i, sum, a -> if (i % 2 == 1) sum + a * 3 else sum + a }
        if (b[12] - '0' != (10 - s % 10) % 10) return null
        return ANA + kodo(b.substring(1, 7), STRUKTURA13[b[0] - '0']) + MES + kodo(b.substring(7, 13), "RRRRRR") + ANA
    }

    fun upc(b: String): String? {
        if (!Regex("^[0-9]{12}$").matches(b)) return null
        val d = shifrat(b)
        var s = 0
        for (i in 1 until 11 step 2) s += d[i]
        for (i in 0 until 11 step 2) s += d[i] * 3
        if (d[11] != (10 - s % 10) % 10) return null
        return ANA + kodo(b.substring(0, 6), "LLLLLL") + MES + kodo(b.substring(6, 12), "RRRRRR") + ANA
    }

    fun ean8(b: String): String? {
        if (!Regex("^[0-9]{8}$").matches(b)) return null
        val s = shifrat(b).take(7).foldIndexed(0) { i, sum, a -> if (i % 2 == 1) sum + a else sum + a * 3 }
        if (b[7] - '0' != (10 - s % 10) % 10) return null
        return ANA + kodo(b.substring(0, 4), "LLLL") + MES + kodo(b.substring(4, 8), "RRRR") + ANA
    }

    // ---------------- CODE128 (si CODE128_AUTO i JsBarcode-it) ----------------
    private val BARS = longArrayOf(11011001100, 11001101100, 11001100110, 10010011000, 10010001100, 10001001100, 10011001000, 10011000100, 10001100100,
        11001001000, 11001000100, 11000100100, 10110011100, 10011011100, 10011001110, 10111001100, 10011101100, 10011100110, 11001110010, 11001011100,
        11001001110, 11011100100, 11001110100, 11101101110, 11101001100, 11100101100, 11100100110, 11101100100, 11100110100, 11100110010, 11011011000,
        11011000110, 11000110110, 10100011000, 10001011000, 10001000110, 10110001000, 10001101000, 10001100010, 11010001000, 11000101000, 11000100010,
        10110111000, 10110001110, 10001101110, 10111011000, 10111000110, 10001110110, 11101110110, 11010001110, 11000101110, 11011101000, 11011100010,
        11011101110, 11101011000, 11101000110, 11100010110, 11101101000, 11101100010, 11100011010, 11101111010, 11001000010, 11110001010, 10100110000,
        10100001100, 10010110000, 10010000110, 10000101100, 10000100110, 10110010000, 10110000100, 10011010000, 10011000010, 10000110100, 10000110010,
        11000010010, 11001010000, 11110111010, 11000010100, 10001111010, 10100111100, 10010111100, 10010011110, 10111100100, 10011110100, 10011110010,
        11110100100, 11110010100, 11110010010, 11011011110, 11011110110, 11110110110, 10101111000, 10100011110, 10001011110, 10111101000, 10111100010,
        11110101000, 11110100010, 10111011110, 10111101110, 11101011110, 11110101110, 11010000100, 11010010000, 11010011100, 1100011101011)
    private const val SET_A = 0
    private const val SET_B = 1
    private const val SET_C = 2
    private const val SHIFT = 98
    private const val MODULO = 103
    private const val STOP = 106
    private val SWAP = mapOf(101 to SET_A, 100 to SET_B, 99 to SET_C)
    private val SET_BY_CODE = mapOf(103 to SET_A, 104 to SET_B, 105 to SET_C)
    private const val A_CHARS = "[\\x00-\\x5F\\xC8-\\xCF]"
    private const val B_CHARS = "[\\x20-\\x7F\\xC8-\\xCF]"
    private const val C_CHARS = "(\\xCF*[0-9]{2}\\xCF*)"

    private fun gjatA(s: String) = Regex("^$A_CHARS*").find(s)!!.value.length
    private fun gjatB(s: String) = Regex("^$B_CHARS*").find(s)!!.value.length
    private fun setC(s: String) = Regex("^$C_CHARS*").find(s)!!.value

    private fun ngaAB(s: String, isA: Boolean): String {
        val r = if (isA) A_CHARS else B_CHARS
        Regex("^($r+?)(([0-9]{2}){2,})([^0-9]|$)").find(s)?.let { m ->
            val para = m.groupValues[1]
            return para + 204.toChar() + ngaC(s.substring(para.length))
        }
        val te = Regex("^$r+").find(s)!!.value
        if (te.length == s.length) return s
        return te + (if (isA) 205 else 206).toChar() + ngaAB(s.substring(te.length), !isA)
    }

    private fun ngaC(s0: String): String {
        val c = setC(s0)
        if (c.length == s0.length) return s0
        val s = s0.substring(c.length)
        val isA = gjatA(s) >= gjatB(s)
        return c + (if (isA) 206 else 205).toChar() + ngaAB(s, isA)
    }

    /** Teksti me shenjat e ndërrimit të grupit (A/B/C) si autoSelectModes te JsBarcode */
    fun zgjidhGrupet(s: String): String {
        val r = if (setC(s).length >= 2) 210.toChar().toString() + ngaC(s)
        else { val isA = gjatA(s) > gjatB(s); (if (isA) 208 else 209).toChar().toString() + ngaAB(s, isA) }
        val m = Regex("[\\xCD\\xCE]([\\s\\S])[\\xCD\\xCE]").find(r) ?: return r
        return r.replaceRange(m.range, 203.toChar().toString() + m.groupValues[1])
    }

    fun code128(b: String): String? {
        if (b.isEmpty() || !Regex("^[\\x00-\\x7F\\xC8-\\xD3]+$").matches(b)) return null
        val bajtet = ArrayDeque(zgjidhGrupet(b).map { it.code })
        val start = bajtet.removeFirst() - 105
        var grupi = SET_BY_CODE[start] ?: return null
        val out = StringBuilder(BARS[start].toString())
        var shuma = start
        var poz = 1
        while (bajtet.isNotEmpty()) {
            val indeksi: Int
            if (bajtet.first() >= 200) {
                indeksi = bajtet.removeFirst() - 105
                val tjetri = SWAP[indeksi]
                if (tjetri != null) grupi = tjetri
                else if ((grupi == SET_A || grupi == SET_B) && indeksi == SHIFT && bajtet.isNotEmpty()) {
                    val x = bajtet.first()
                    bajtet[0] = if (grupi == SET_A) (if (x > 95) x - 96 else x) else (if (x < 32) x + 96 else x)
                }
            } else {
                indeksi = when (grupi) {
                    SET_A -> { val c = bajtet.removeFirst(); if (c < 32) c + 64 else c - 32 }
                    SET_B -> bajtet.removeFirst() - 32
                    else -> { val a = bajtet.removeFirst() - 48; val d = (bajtet.removeFirstOrNull() ?: return null) - 48; a * 10 + d }
                }
            }
            if (indeksi !in BARS.indices) return null
            out.append(BARS[indeksi].toString())
            shuma += indeksi * poz
            poz++
        }
        out.append(BARS[shuma % MODULO].toString()).append(BARS[STOP].toString())
        return out.toString()
    }
}

package site.stoku.logjika

/*
 * v355 (pronari: "A munesh gjuhen anglisht 100% ... edhe android app, edhe android app qe o per playstore"): gjuha e pamjes.
 * Binjaku i `perkthimi.js` të web-it, me të njëjtin fjalor `perkthimi/en.json` (Android-i e merr nga assets). Kodi mbetet shqip;
 * vetëm tekstet që shfaqen përkthehen. Rradha (si te web-i): teksti i plotë → modelet me "^" → pjesët me " · " → rreshtat →
 * copat (tekstet e Stoku-t me ≥ 8 shenja brenda tekstit) + modelet e tjera kudo brenda tekstit. "$1" = grupi siç është,
 * "@1" = grupi i përkthyer. Testi: PerkthimiTest (rastet nga teste/perkthimi-fikstura.js, me kodin e vërtetë të web-it).
 */
class Perkthyesi(private val fjalet: Map<String, String>, modelet: List<Pair<String, String>>) {
    private val mod = ArrayList<Pair<Regex, String>>()
    private val modg = ArrayList<Pair<Regex, String>>()
    private val frag: Regex?
    private val memo = java.util.concurrent.ConcurrentHashMap<String, String>()

    init {
        for ((m, z) in modelet) {
            try { if (m.startsWith("^")) mod.add(Regex(m) to z) else modg.add(Regex(m) to z) } catch (e: Exception) { /* anashkalohet */ }
        }
        val k = fjalet.keys.filter { it.replace(Regex("\\s+"), "").length >= 8 }.sortedByDescending { it.length }
        frag = if (k.isEmpty()) null else Regex(k.joinToString("|") { Regex.escape(it) })
    }

    private fun zevendeso(shabllon: String, g: MatchResult): String =
        Regex("([$@])(\\d)").replace(shabllon) { x ->
            val n = x.groupValues[2].toInt()
            val v = if (n < g.groups.size) g.groups[n]?.value else null
            when { v == null -> ""; x.groupValues[1] == "@" -> t(v); else -> v }
        }

    private fun berthama(t: String): String? {
        if (t.isEmpty()) return t
        fjalet[t]?.let { return it }
        if (t.contains(HAP2) || t.contains('\n')) { val nj = t.replace(HAP, " "); fjalet[nj]?.let { return it } }
        for ((r, z) in mod) { val m = r.find(t); if (m != null) return zevendeso(z, m) }
        return null
    }

    /** Teksti → anglisht (ose i njëjti kur s'njihet); ruhen hapësirat anash. */
    fun t(s: String): String {
        memo[s]?.let { return it }
        val r = perkthe(s)
        if (memo.size < 20000) memo[s] = r
        return r
    }

    private fun perkthe(s: String): String {
        var a = 0; var b = s.length
        while (a < b && eHapesire(s[a])) a++
        while (b > a && eHapesire(s[b - 1])) b--
        val mes = s.substring(a, b)
        if (mes.isEmpty()) return s
        var r = berthama(mes)
        if (r == null && mes.contains(" · ")) {
            var ndr = false
            // çdo pjesë përkthehet krejt (edhe copat dhe modelet me numra), si te perkthimi.js
            val pj = mes.split(" · ").map { p -> val x = t(p); if (x != p) ndr = true; x }
            if (ndr) r = pj.joinToString(" · ")
        }
        if (r == null && mes.contains('\n')) {
            var ndr = false
            val rr = mes.split("\n").map { p -> val x = t(p); if (x != p) ndr = true; x }
            if (ndr) r = rr.joinToString("\n")
        }
        if (r == null && (frag != null || modg.isNotEmpty())) {
            var x = if (frag != null) frag.replace(mes) { fjalet[it.value] ?: it.value } else mes
            for ((re, z) in modg) x = re.replace(x) { zevendeso(z, it) }
            if (x != mes) r = x
        }
        return if (r == null) s else s.substring(0, a) + r + s.substring(b)
    }

    companion object {
        private val HAP = Regex("\\s+")
        private val HAP2 = Regex("\\s\\s")
        // si \s i JavaScript-it
        private fun eHapesire(c: Char) = c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\u000B' || c == '\u000C' ||
            c == ' ' || c == '﻿' || c == ' ' || c in ' '..' ' || c == ' ' || c == ' ' ||
            c == ' ' || c == ' ' || c == '　'

        /** Nga JSON-i i `perkthimi/en.json` ({fjalet:{}, modelet:[[m, z]]}). */
        fun ngaJson(json: String): Perkthyesi {
            val d = Json.lexo(json).siObj() ?: emptyMap()
            val fj = LinkedHashMap<String, String>()
            d["fjalet"].siObj()?.forEach { (k, v) -> if (v is String) fj[k] = v }
            val md = d["modelet"].siListe().mapNotNull { m -> val l = m.siListe(); val a = l.getOrNull(0) as? String; val z = l.getOrNull(1) as? String; if (a != null && z != null) a to z else null }
            return Perkthyesi(fj, md)
        }
    }
}

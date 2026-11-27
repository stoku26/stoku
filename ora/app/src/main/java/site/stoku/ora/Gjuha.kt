package site.stoku.ora

import android.app.Activity
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.wear.compose.material.LocalTextStyle
import org.json.JSONObject

/*
 * Pronari (27.11.2026, kontrolli i versioneve Play: "po boni qato qka tha"): ora edhe anglisht, si telefoni (v355). Kodi mbetet shqip;
 * tekstet që shfaqen përkthehen me të njëjtin fjalor `perkthimi/en.json` (kopja te assets, e shkruar nga teste/perkthimi-gjenero.py)
 * dhe të njëjtin motor si telefoni (vendas/logjika Perkthimi.kt, binjaku i perkthimi.js). Versioni play nis në anglisht (si telefoni
 * nga Play), versioni github në shqip; ndërrohet te Cilësimet e orës → "Gjuha". Testi PerkthimiOraTest e krahason me web-in.
 */
object Gjuha {
    @Volatile private var perkthyesi: Perkthyesi? = null
    @Volatile var en = false
        private set

    fun nis(ctx: Context) {
        val pr = ctx.getSharedPreferences("gjuha", Context.MODE_PRIVATE)
        en = pr.getString("gjuha", if (Perditesimi.NGA_PLAY) "en" else "sq") == "en"
        if (en && perkthyesi == null) {
            perkthyesi = try { Perkthyesi.ngaJson(ctx.assets.open("en.json").bufferedReader(Charsets.UTF_8).use { it.readText() }) } catch (e: Exception) { null }
        }
    }

    /** Teksti në gjuhën e zgjedhur (shqip: i njëjti). */
    fun t(s: String): String = if (!en) s else perkthyesi?.t(s) ?: s

    /** Cilësimet: shqip ↔ anglisht; ekrani rihapet (si te telefoni) */
    fun nderro(a: Activity) {
        a.getSharedPreferences("gjuha", Context.MODE_PRIVATE).edit().putString("gjuha", if (en) "sq" else "en").apply()
        nis(a)
        a.recreate()
    }
}

/** Si androidx.wear.compose.material.Text, por teksti përkthehet kur gjuha është anglisht. */
@Composable
fun Text(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontWeight: FontWeight? = null,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    textAlign: TextAlign? = null,
    lineHeight: TextUnit = TextUnit.Unspecified,
    overflow: TextOverflow = TextOverflow.Clip,
    softWrap: Boolean = true,
    maxLines: Int = Int.MAX_VALUE,
    style: TextStyle = LocalTextStyle.current,
) = androidx.wear.compose.material.Text(text = Gjuha.t(text), modifier = modifier, color = color, fontSize = fontSize, fontWeight = fontWeight,
    letterSpacing = letterSpacing, textAlign = textAlign, lineHeight = lineHeight, overflow = overflow, softWrap = softWrap, maxLines = maxLines, style = style)

/**
 * Motori i përkthimit: KOPJE e saktë e vendas/logjika/.../Perkthimi.kt (vetëm leximi i JSON-it me org.json të Android-it). Kur ndryshon
 * ai, ndryshoje edhe këtë: PerkthimiOraTest i krahason të dy me rastet e web-it.
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
        private fun eHapesire(c: Char) = c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\u000B' || c == '\u000C' ||
            c == ' ' || c == '﻿' || c == ' ' || c in ' '..' ' || c == ' ' || c == ' ' ||
            c == ' ' || c == ' ' || c == '　'

        /** Nga JSON-i i `perkthimi/en.json` ({fjalet:{}, modelet:[[m, z]]}). */
        fun ngaJson(json: String): Perkthyesi {
            val d = JSONObject(json)
            val fj = LinkedHashMap<String, String>()
            d.optJSONObject("fjalet")?.let { o -> o.keys().forEach { k -> (o.opt(k) as? String)?.let { fj[k] = it } } }
            val md = ArrayList<Pair<String, String>>()
            d.optJSONArray("modelet")?.let { a -> for (i in 0 until a.length()) { val l = a.optJSONArray(i) ?: continue; val m = l.opt(0) as? String; val z = l.opt(1) as? String; if (m != null && z != null) md.add(m to z) } }
            return Perkthyesi(fj, md)
        }
    }
}

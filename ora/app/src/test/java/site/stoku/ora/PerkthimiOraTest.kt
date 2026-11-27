package site.stoku.ora

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * 27.11.2026: ora përkthen me një kopje të motorit të telefonit (Gjuha.kt ← vendas/logjika Perkthimi.kt). Duhet të japë SAKTËSISHT
 * përkthimin e web-it (perkthimi.js), me të njëjtat raste si PerkthimiTest i telefonit (teste/perkthimi-fikstura.js).
 * Robolectric: org.json i Android-it (në JVM-në e thjeshtë s'ka implementim).
 */
@RunWith(RobolectricTestRunner::class)
class PerkthimiOraTest {
    private val burimet = File("../../vendas/logjika/src/test/resources")

    @Test fun siWebi() {
        val p = Perkthyesi.ngaJson(File(burimet, "en.json").readText())
        val raste = JSONObject(File(burimet, "perkthimi-raste.json").readText()).getJSONArray("raste")
        var gabime = 0
        for (i in 0 until raste.length()) {
            val r = raste.getJSONArray(i); val sq = r.getString(0); val en = r.getString(1)
            val k = p.t(sq)
            if (k != en) { gabime++; if (gabime <= 10) println("NDRYSHE: " + JSONObject.quote(sq) + " → web " + JSONObject.quote(en) + " / ora " + JSONObject.quote(k)) }
        }
        println("perkthimi i orës: " + raste.length() + " raste")
        assertEquals("përkthime të ndryshme nga web-i", 0, gabime)
    }

    /** Fjalori i orës (assets) është i njëjti me atë të projektit (teste/perkthimi-gjenero.py) */
    @Test fun fjaloriIRi() {
        val ora = JSONObject(File("src/main/assets/en.json").readText())
        val projekti = JSONObject(File("../../perkthimi/en.json").readText())
        assertEquals(projekti.getJSONObject("fjalet").length(), ora.getJSONObject("fjalet").length())
        assertEquals(projekti.getJSONArray("modelet").length(), ora.getJSONArray("modelet").length())
        val p = Perkthyesi.ngaJson(ora.toString())
        assertEquals("EXPIRED · 5", p.t("KANË SKADUAR · 5"))
        assertEquals("Expired on 25.11 · 2 pcs", p.t("Skadoi më 25.11 · 2 copë"))
        assertEquals("No connection · list from 26.11", p.t("Pa lidhje · lista e 26.11"))
    }
}

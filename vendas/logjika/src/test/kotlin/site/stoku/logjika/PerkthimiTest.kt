package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Test

/** Perkthimi.kt duhet të japë SAKTËSISHT përkthimin e perkthimi.js (rastet nga teste/perkthimi-fikstura.js, fjalori perkthimi/en.json). */
class PerkthimiTest {
    @Test fun siWebi() {
        val p = Perkthyesi.ngaJson(javaClass.getResource("/en.json")!!.readText())
        val l = Json.lexo(javaClass.getResource("/perkthimi-raste.json")!!.readText()).siObj()!!["raste"].siListe()
        var gabime = 0
        l.forEach { x -> val r = x.siListe(); val sq = r[0] as String; val en = r[1] as String
            val k = p.t(sq); if (k != en) { gabime++; if (gabime <= 10) println("NDRYSHE: " + Json.shkruaj(sq) + " → web " + Json.shkruaj(en) + " / kotlin " + Json.shkruaj(k)) } }
        println("perkthimi: " + l.size + " raste")
        assertEquals("përkthime të ndryshme nga web-i", 0, gabime)
    }
}

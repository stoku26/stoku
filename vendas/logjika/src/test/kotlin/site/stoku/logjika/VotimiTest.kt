package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Votimi i leximeve të kamerës (v261: 5 vota nga deri në 10 lexime): të njëjtat raste si te teste/v260.js dhe teste/v261.js */
class VotimiTest {
    private val A = "3800001000019"; private val B = "3800001000026"; private val C = "3800001000033"; private val D = "4000000000006"

    /** Shton leximet me 40 ms ndërmjet (nga koha [t0]); kthen përgjigjet e shto() */
    private fun VotimiIBarkodit.lexo(kodet: List<String>, t0: Long = 0, iSigurt: Boolean = true) = kodet.mapIndexed { i, k -> shto(k, iSigurt, t0 + i * 40L) }

    @Test fun peseVotaFitojneMenjehere() {
        val v = VotimiIBarkodit()
        assertEquals(listOf(null, null, null, null, A), v.lexo(List(5) { A }))
        assertFalse(v.aktiv)
    }

    @Test fun katerVotaSMjaftojne() {
        val v = VotimiIBarkodit()
        assertEquals(List(4) { null }, v.lexo(List(4) { A }))
        assertTrue(v.aktiv)
        assertEquals(A, v.skado(1000)) // pa lexim të 5-të: kur mbaron sekonda fiton ai në krye
    }

    @Test fun leximiIGabuarHumbet() {
        val v = VotimiIBarkodit()
        assertEquals(listOf<String?>(null, null, null, null, null, A), v.lexo(listOf(B) + List(5) { A }))
    }

    @Test fun pasDhjeteLeximeveFitonAiNeKrye() {
        val v = VotimiIBarkodit()
        val r = v.lexo(listOf(A, B, A, C, A, B, A, C, B, D)) // A=4, B=3, C=2, D=1
        assertEquals(List<String?>(9) { null } + A, r)
    }

    @Test fun barazimiPretDeriQeDikushArrinPese() {
        val v = VotimiIBarkodit()
        assertEquals(List<String?>(10) { null }, v.lexo(listOf(A, B, A, B, A, B, A, B, C, C))) // A=4, B=4: pritet
        assertEquals(B, v.shto(B, true, 400)) // B arrin 5 vota
    }

    @Test fun barazimiNeMbarimFitonIPari() {
        val v = VotimiIBarkodit()
        v.lexo(listOf(A, B, A, B))
        assertNull(v.skado(999))
        assertEquals(A, v.skado(1000))
    }

    @Test fun njeLeximISigurtPranohetNeMbarim() {
        val v = VotimiIBarkodit()
        assertNull(v.shto(A, true, 0))
        assertTrue(v.aktiv); assertEquals(1000L, v.mbetur(0)); assertEquals(300L, v.mbetur(700))
        assertNull(v.skado(999))
        assertEquals(A, v.skado(1000))
        assertFalse(v.aktiv)
    }

    @Test fun njeLeximPaShiferKontrolliRefuzohet() {
        val v = VotimiIBarkodit()
        assertNull(v.shto("ABC-123", false, 0))
        assertNull(v.skado(1000))
        assertFalse(v.aktiv)
        assertNull(v.shto("ABC-123", false, 1100)); assertNull(v.shto("ABC-123", false, 1150))
        assertEquals("ABC-123", v.skado(2100)) // 2 lexime të njëjta: pranohet
    }

    @Test fun iSigurtiFitonBarazimin() {
        val v = VotimiIBarkodit()
        assertNull(v.shto("ABC-123", false, 0)); assertNull(v.shto(A, true, 40))
        assertEquals(A, v.skado(1000))
    }

    @Test fun votimiQeSkadoiVendoset() {
        val v = VotimiIBarkodit()
        assertNull(v.shto(A, true, 0))
        assertEquals(A, v.shto(B, true, 1200)) // koha e A-së mbaroi: fiton A; B nis votimin e ri
        assertTrue(v.aktiv)
        assertEquals(B, v.skado(2200))
    }

    @Test fun rinisja() {
        val v = VotimiIBarkodit()
        v.lexo(List(4) { A })
        v.rinis()
        assertFalse(v.aktiv)
        assertNull(v.shto(A, true, 200))
    }
}

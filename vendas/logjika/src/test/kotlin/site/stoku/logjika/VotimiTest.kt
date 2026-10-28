package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Votimi i leximeve të kamerës: të njëjtat raste si te teste/v260.js (krijoVotimin te app-tel.js) */
class VotimiTest {
    private val A = "3800001000019"; private val B = "3800001000026"; private val C = "3800001000033"

    @Test fun treVotaFitojneMenjehere() {
        val v = VotimiIBarkodit()
        assertNull(v.shto(A, true, 0)); assertNull(v.shto(A, true, 40))
        assertEquals(A, v.shto(A, true, 80))
        assertFalse(v.aktiv)
    }

    @Test fun leximiIGabuarHumbet() {
        val v = VotimiIBarkodit()
        assertNull(v.shto(B, true, 0)) // kuadër i turbullt: B (edhe me shifër kontrolli të saktë)
        assertNull(v.shto(A, true, 40)); assertNull(v.shto(A, true, 80))
        assertEquals(A, v.shto(A, true, 120))
    }

    @Test fun pasPeseLeximeveFitonIPari() {
        val v = VotimiIBarkodit()
        listOf(A, B, A, C).forEachIndexed { i, k -> assertNull(v.shto(k, true, i * 40L)) }
        assertEquals(A, v.shto("4000000000000", false, 160)) // 5 lexime: A=2 në krye, vetëm
    }

    @Test fun barazimiPretDeriNeMbarim() {
        val v = VotimiIBarkodit()
        listOf(A, B, A, B, C).forEachIndexed { i, k -> assertNull(v.shto(k, true, i * 40L)) } // A=2, B=2: pritet
        assertNull(v.shto(C, true, 200)) // A=2, B=2, C=2: ende barazim
        assertEquals(B, v.shto(B, true, 240)) // B arrin 3 vota → fiton
    }

    @Test fun barazimiNeMbarimFitonIPari() {
        val v = VotimiIBarkodit()
        listOf(A, B, A, B).forEachIndexed { i, k -> assertNull(v.shto(k, true, i * 40L)) }
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
        v.shto(A, true, 0); v.shto(A, true, 40)
        v.rinis()
        assertFalse(v.aktiv)
        assertNull(v.shto(A, true, 80))
    }
}

package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import site.stoku.logjika.VotimiIBarkodit.Vendimi

/** Votimi i leximeve të kamerës (v262: 7 të njëjta nga 10 tentime): të njëjtat raste si te teste/v260.js */
class VotimiTest {
    private val A = "3800001000019"; private val B = "3800001000026"

    private fun VotimiIBarkodit.tento(kodet: List<String?>) = kodet.map { tentim(it) }
    private val P = { k: String -> Vendimi.Pranuar(k) }

    @Test fun shtateTeNjejtaPranohen() {
        val v = VotimiIBarkodit()
        assertEquals(List(6) { null } + P(A), v.tento(List(7) { A }))
        assertFalse(v.aktiv)
    }

    @Test fun paraLeximitTePareSkaVotim() {
        val v = VotimiIBarkodit()
        assertEquals(List(5) { null }, v.tento(List(5) { null }))
        assertFalse(v.aktiv)
    }

    @Test fun gjashteTeNjejtaSMjaftojne() {
        val v = VotimiIBarkodit()
        // 6 herë A, pastaj kuadra pa barkod: pas tentimit të 10-të s'arrin dot 7 → Skano përsëri
        assertEquals(List(9) { null } + Vendimi.Deshtoi, v.tento(List(6) { A } + List(4) { null }))
        assertFalse(v.aktiv)
    }

    @Test fun leximetEGabuaraSPengojne() {
        val v = VotimiIBarkodit()
        assertEquals(List(8) { null } + P(A), v.tento(listOf(B, A, A, B, A, A, A, A, A))) // A arrin 7 te tentimi i 9-të
    }

    @Test fun deshtonHereKurSMundTeArrihet() {
        val v = VotimiIBarkodit()
        // A, pastaj 4 kuadra bosh: maksimumi i mundshëm 1 + 5 = 6 < 7 → dështon te tentimi i 5-të
        assertEquals(List(4) { null } + Vendimi.Deshtoi, v.tento(listOf(A, null, null, null, null)))
        assertTrue(v.tento(listOf(A)).single() == null && v.aktiv) // leximi i radhës nis votim të ri
    }

    @Test fun dyKodeQeNdahenDeshtojne() {
        val v = VotimiIBarkodit()
        val r = v.tento(listOf(A, B, A, B, A, B, A, B))
        assertEquals(Vendimi.Deshtoi, r.last()) // A=4, B=4, 2 tentime të mbetura: s'arrin asnjë 7
        assertTrue(r.dropLast(1).all { it == null })
    }

    @Test fun rinisja() {
        val v = VotimiIBarkodit()
        v.tento(List(6) { A })
        v.rinis()
        assertFalse(v.aktiv)
        assertNull(v.tentim(A))
        assertTrue(v.aktiv)
    }
}

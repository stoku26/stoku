package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Test

/** Lejet e administratorit (statusi, teNdaluara, krejt, meZgjedhjet, pastro, katalogu) = lejet.js (fikstura.json) */
class LejetTest {
    private val f: Obj = Json.lexo(javaClass.getResource("/fikstura.json")!!.readText()).siObj()!!["lejet"].siObj()!!

    @Test fun statusiDheNdalimet() {
        f["statusi"].siListe().forEach { x -> val r = x.siListe(); assertEquals("statusi " + Json.shkruaj(r[0]), r[1], Lejet.statusi(r[0].siObj())) }
        f["teNdaluara"].siListe().forEach { x -> val r = x.siListe(); assertEquals("teNdaluara " + Json.shkruaj(r[0]), (r[1] as Number).toInt(), Lejet.teNdaluara(r[0].siObj())) }
    }

    @Test fun krejtDheZgjedhjet() {
        val k = f["krejt"].siListe()
        assertEquals(kanonik(k[0]), kanonik(Lejet.krejt(true)))
        assertEquals(kanonik(k[1]), kanonik(Lejet.krejt(false)))
        f["meZgjedhjet"].siListe().forEach { x -> val r = x.siListe(); assertEquals(kanonik(r[2]), kanonik(Lejet.meZgjedhjet(r[0].siObj()!!, r[1].siObj()))) }
        f["pastro"].siListe().forEach { x -> val r = x.siListe(); assertEquals("pastro " + Json.shkruaj(r[0]), kanonik(r[1]), kanonik(Lejet.pastro(r[0].siObj()))) }
    }

    @Test fun katalogu() {
        val pritur = f["katalogu"].siListe().map { it.siListe() }
        assertEquals(pritur.map { it[1] }, Lejet.KATALOGU.map { it.k })
        Lejet.KATALOGU.forEachIndexed { i, l ->
            val r = pritur[i]
            assertEquals(r[1] as String, listOf(r[0], r[2], r[3], r[4], r[5]), listOf(l.grupi, l.emri, l.pershkrim, l.prindi ?: "", l.zgjedhje))
        }
    }
}

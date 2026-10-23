package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Logjika në Kotlin duhet të japë SAKTËSISHT rezultatin e web-it (bashkimi.js, ruajtja.js) në krejt rastet e
 * fikstura.json (krijuar nga teste/vendas-fikstura.js me kodin e vërtetë të web-it).
 */
class PerputhjaMeWebTest {
    private val f: Obj = Json.lexo(javaClass.getResource("/fikstura.json")!!.readText()).siObj()!!
    private val tani = (f["TANI"] as Number).toLong()

    @Test fun bashkimi() {
        val l = f["bashkimi"].siListe()
        l.forEachIndexed { i, x ->
            val r = x.siObj()!!
            val rez = Bashkimi.bashko(r["cloud"].siObj(), r["lokal"].siObj(), tani)
            assertEquals("bashko #$i", kanonik(r["rez"]), kanonik(rez))
            assertEquals("sigurojFolderat #$i", kanonik(r["siguruar"]), kanonik(Bashkimi.sigurojFolderat(Bashkimi.bashko(r["cloud"].siObj(), r["lokal"].siObj(), tani), tani)))
            assertEquals("eNjejte #$i", r["njejte"], Bashkimi.eNjejte(rez, r["lokal"].siObj()))
            assertEquals("eNjejte(cloud) #$i", r["njejteCloud"], Bashkimi.eNjejte(Bashkimi.bashko(r["cloud"].siObj(), r["lokal"].siObj(), tani), rez))
        }
        println("bashkimi: " + l.size + " raste")
    }

    @Test fun sigurojFolderat() {
        f["siguro"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            assertEquals("siguro #$i", kanonik(r["rez"]), kanonik(Bashkimi.sigurojFolderat(r["g"].siObj(), tani)))
        }
    }

    @Test fun ndarjaNePjese() {
        f["ndarja"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            val nd = Ruajtja.ndajNePjese(r["g"].siObj(), (r["nPara"] as Number).toInt())
            assertEquals("kryesori #$i", kanonik(r["kryesori"]), kanonik(nd.kryesori))
            assertEquals("pjeset #$i", kanonik(r["pjeset"]), kanonik(nd.pjeset))
            assertEquals("bashkoPjeset #$i", kanonik(r["bashkuar"]), kanonik(Ruajtja.bashkoPjeset(nd.kryesori, nd.pjeset)))
            // pjesa e pandryshuar njihet edhe me rend tjetër të produkteve
            nd.pjeset.forEach { pj ->
                val kthyer = pj.me("produktet" to pj["produktet"].siListe().reversed(), "afatet" to pj["afatet"].siListe().reversed())
                assertEquals(Ruajtja.pjesaKanonike(pj), Ruajtja.pjesaKanonike(kthyer))
            }
        }
    }

    @Test fun dyqaniIMadh() {
        val m = f["madheRez"].siObj()!!
        val produktet = (0 until 6000).map { i ->
            obj("kategoriaId" to "pije", "barkodi" to (380000000 + i).toString(), "emri" to "Produkt shumë i gjatë me emër " + "ë".repeat(i % 40) + i,
                "sasia" to (i % 50).toLong(), "prekurSe" to tani - i)
        }
        val g = obj("foldera" to listOf(obj("id" to "pije", "emri" to "Pije")), "produktet" to produktet, "afatet" to emptyList<Any?>())
        val nd = Ruajtja.ndajNePjese(g, 0)
        assertEquals((m["n"] as Number).toInt(), nd.pjeset.size)
        assertEquals(kanonik(m["barkodet"]), kanonik(nd.pjeset.map { pj -> pj["produktet"].siListe().map { it.siObj()!!["barkodi"] } }))
    }

    @Test fun bashkoPjeset() {
        f["bp"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            assertEquals("bp #$i", kanonik(r["rez"]), kanonik(Ruajtja.bashkoPjeset(r["k"].siObj(), r["pj"].siListe().map { it.siObj() })))
        }
    }

    @Test fun hashi() {
        f["hashet"].siListe().forEach { x ->
            val r = x.siObj()!!
            assertEquals(r["s"] as String, (r["h"] as Number).toLong(), Ruajtja.hash(r["s"] as String))
        }
    }

    @Test fun kanoniku() {
        f["kan"].siListe().forEach { x ->
            val r = x.siObj()!!
            assertEquals(r["k"], Ruajtja.pjesaKanonike(obj("produktet" to listOf(r["x"]), "afatet" to emptyList<Any?>(), "tjeter" to r["x"])))
        }
    }

    @Test fun json() {
        val s = """{"a":[1,2.5,-0.000001,1e+21,"ë\n\"",true,null,{}],"b":{"c":123456789012}}"""
        assertEquals(s, Json.shkruaj(Json.lexo(s)))
        assertEquals("2026-10-22T23:43:13.000Z", isoNgaMs(1792712593000L))
    }
}

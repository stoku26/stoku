package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Test

/** Marketet në Kotlin = marketet.js (v253: kufiri 20 m mes marketeve; fikstura.json, teste/vendas-fikstura.js) */
class MarketetTest {
    private val f: Obj = Json.lexo(javaClass.getResource("/fikstura.json")!!.readText()).siObj()!!["marketet"].siObj()!!
    private val tani = (f["TANI_M"] as Number).toLong()

    private fun lista(x: Any?): List<Obj> = x.siListe().map { it.siObj()!! }
    private fun poz(x: Any?): Marketet.Pozita? = x.siObj()?.let { Marketet.Pozita((it["lat"] as Number).toDouble(), (it["lng"] as Number).toDouble(), (it["sakt"] as? Number)?.toDouble()) }
    private fun gjetur(g: Marketet.Gjetur?): Any? = g?.let { obj("marketi" to it.marketi, "largesia" to it.largesia) }
    private fun kontrolli(k: Marketet.Kontrolli?): Any? = when (k) {
        null -> null
        is Marketet.Kontrolli.Pasakte -> obj("arsye" to "pasakte", "sakt" to k.sakt)
        is Marketet.Kontrolli.Ekziston -> obj("arsye" to "ekziston", "emri" to k.emri).also { o -> k.marketi?.let { o["marketi"] = it }; k.pika?.let { o["pika"] = it } }
        is Marketet.Kontrolli.Afer -> obj("arsye" to "afer", "emri" to k.emri, "largesia" to k.largesia, "sakt" to k.sakt)
    }
    private fun sinkr(s: Marketet.Sinkronizimi) = obj("marketet" to s.marketet, "ndryshuar" to s.ndryshuar, "hequr" to s.hequr)
    private fun eq(msg: String, pritur: Any?, marre: Any?) = assertEquals(msg, kanonik(pritur), kanonik(marre))

    @Test fun pastrimiDheLargesite() {
        f["rastet"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            val l = lista(r["lista"]); val pikat = lista(r["pikat"]); val p = poz(r["poz"])
            eq("pastroPikat $i", r["pikat"], Marketet.pastroPikat(r["pikatRaw"]))
            eq("pastro $i", r["lista"], Marketet.pastro(r["lista"]))
            eq("gjej $i", r["gjej"], gjetur(Marketet.gjej(l, p)))
            eq("largNgaMarketi $i", r["larg"], l.map { Marketet.largNgaMarketi(l, it["id"], p) })
            eq("pikatAfer $i", r["afer"], Marketet.pikatAfer(pikat, p, Marketet.LIDHJA_M, 3).map { obj("pika" to it.pika, "largesia" to it.largesia) })
            eq("neVend $i", r["neVend"], gjetur(Marketet.marketiNeVend(l, p)))
            eq("shumeAfer $i", r["shumeAfer"], Marketet.pikaShumeAfer(pikat, p)?.let { obj("pika" to it.pika, "largesia" to it.largesia) })
            eq("perMarketin $i", r["perMarketin"], l.map { Marketet.pikaPerMarketin(pikat, it)?.get("id") })
        }
    }

    @Test fun shtimi() {
        f["rastet"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            eq("kontrolloShtimin $i", r["kontrolli"], kontrolli(Marketet.kontrolloShtimin(poz(r["poz"]), lista(r["lista"]), lista(r["pikat"]))))
        }
    }

    @Test fun sinkronizimiDheAfatet() {
        f["rastet"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            val l = lista(r["lista"]); val pikat = lista(r["pikat"]); val afatet = lista(r["afatet"])
            eq("sinkr serveri $i", r["sinkrS"], sinkr(Marketet.sinkronizoMePikat(l, pikat, afatet, true, tani)))
            eq("sinkr jo $i", r["sinkrJ"], sinkr(Marketet.sinkronizoMePikat(l, pikat, afatet, false, tani)))
            eq("meEmra $i", r["meEmra"], Marketet.meEmra(afatet, l))
            val (pa, n) = Marketet.vendosPaMarket(afatet, l, "mX", tani)
            eq("paMarket $i", r["paMarket"], obj("afatet" to pa, "n" to n.toLong()))
            eq("grupo $i", r["grupo"], Marketet.grupo(afatet, l).map { g -> listOf(g.id, g.emri, g.afatet.map { it["id"] }) })
        }
    }

    @Test fun aktiviDheKontrolli() {
        f["aktivet"].siListe().forEach { x ->
            val r = x.siObj()!!; val a = r["a"].siObj()!!
            val g = r["g"].siObj()?.let { Marketet.Gjetur(it["marketi"].siObj()!!, (it["largesia"] as Number).toLong()) }
            val rez = Marketet.pasGps(Marketet.Aktivi(a["id"] as String?, a["menyra"] as String, (a["koha"] as Number).toLong(), 0), g, tani, r["larg"] == true)
            eq("pasGps " + Json.shkruaj(r), r["rez"], obj("id" to rez.id, "menyra" to rez.menyra, "koha" to rez.koha, "kontrolluarSe" to rez.kontrolluarSe))
        }
        f["kontrolli"].siListe().forEach { x ->
            val r = x.siObj()!!
            assertEquals(Json.shkruaj(r), r["po"], Marketet.duhetKontrolli(lista(r["l"]), Marketet.Aktivi(null, kontrolluarSe = (r["k"] as Number).toLong()), tani))
        }
        val l = listOf(obj("id" to "a", "emri" to "Viva Fly"), obj("id" to "b", "emri" to "Ëmbël"), obj("id" to "c", "emri" to 7L))
        f["emrat"].siListe().forEach { x ->
            val p = x.siListe(); val e = p[0] as String
            assertEquals("ekzistonEmri $e", p[1], Marketet.ekzistonEmri(l, e))
            assertEquals("ekzistonEmri pa a $e", p[2], Marketet.ekzistonEmri(l.take(1), e, "a"))
        }
    }
}

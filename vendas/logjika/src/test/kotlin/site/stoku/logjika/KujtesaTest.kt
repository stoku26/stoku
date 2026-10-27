package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Test

/** Kujtesa e produkteve dhe furnizuesit = afatet.js (krijoKujtesen, listaEFurnizuesve, …), hap pas hapi (fikstura.json) */
class KujtesaTest {
    private val f: Obj = Json.lexo(javaClass.getResource("/fikstura.json")!!.readText()).siObj()!!["kujtesa"].siObj()!!

    private class Ruajtja : RuajtjaEKujteses {
        var t: String? = null
        override fun lexo(): String? = t
        override fun shkruaj(teksti: () -> String) { t = teksti() }
    }

    private fun produkti(p: Kujtesa.Produkti?, plote: Boolean): Any? = if (p == null) null else if (!plote)
        obj("barkodi" to p.barkodi, "emri" to p.emri, "furnizuesi" to p.furnizuesi, "koha" to p.koha, "meDore" to p.meDore)
    else obj("barkodi" to p.barkodi, "emri" to p.emri, "furnizuesi" to p.furnizuesi, "koha" to p.koha, "meDore" to p.meDore,
        "ngaAdmini" to p.ngaAdmini, "nga" to p.nga, "automatik" to p.automatik, "nePritje" to p.nePritje)

    private fun furnizuesit(k: Kujtesa) = k.furnizuesit().map { obj("emri" to it.emri, "fshire" to it.fshire, "koha" to it.koha, "nePritje" to it.nePritje, "nga" to it.nga) }

    @Test fun hapPasHapi() {
        var ora = (f["T0"] as Number).toLong()
        val rj = Ruajtja()
        val k = Kujtesa(rj) { ora }
        f["rasti"].siListe().forEachIndexed { i, x0 ->
            val x = x0.siObj()!!
            val h = x["hapi"].siListe()
            val op = h[0] as String
            fun s(j: Int): String? = h.getOrNull(j) as? String
            val rez: Any? = when (op) {
                "ora" -> { ora = (h[1] as Number).toLong(); null }
                "autori" -> { k.vendosAutorin(s(1), h[2] == true); null }
                "meso" -> k.meso(h[1], h[2], h[3], s(4))
                "mesoShume" -> k.mesoShume(h[1].siListe().map { r -> val l = r.siListe(); Kujtesa.Rreshti(l[0], l[1], l[2]) }, s(2)).toLong()
                "vendos" -> k.vendos(h[1], h[2], h[3])
                "fshij" -> k.fshij(h[1])
                "riemerto" -> k.riemertoFurnizuesin(h[1], h[2]).toLong()
                "regjistroFurnizuesitNePritje" -> k.regjistroFurnizuesitNePritje(h[1].siListe().map { it as String }).toLong()
                "regjistroFurnizuesit" -> k.regjistroFurnizuesit(h[1].siListe().map { it as String }, h[2] == true).toLong()
                "regjistroFurnizuesinERi" -> k.regjistroFurnizuesinERi(h[1]).toLong()
                "fshijFurnizuesin" -> k.fshijFurnizuesin(h[1]).toLong()
                "bashko" -> k.bashko(h[1].siObj()).toLong()
                "perDergim" -> k.perDergim(h[1].siObj())
                "hyrjePerGrup" -> k.hyrjePerGrup(h[1].siListe().map { it as String })
                "merr" -> produkti(k.merr(h[1]), false)
                else -> error("hap i panjohur $op")
            }
            val m = "hapi $i ${Json.shkruaj(h).take(120)}"
            assertEquals("$m: rezultati", kanonik(x["rez"]), kanonik(rez))
            val ruajtur = Json.lexo(k.tekstiPerRuajtje()).siObj()!!
            assertEquals("$m: hyrjet", kanonik(x["harta"]), kanonik(ruajtur))
            assertEquals("$m: radha e çelësave", x["celesat"], ruajtur.keys.toList())
            val lista = MObj(); k.lista().forEach { lista[it.barkodi] = produkti(it, true) }
            assertEquals("$m: lista", kanonik(x["lista"]), kanonik(lista))
            assertEquals("$m: furnizuesit", kanonik(x["furnizuesit"]), kanonik(furnizuesit(k)))
            assertEquals("$m: numri", (x["numri"] as Number).toInt(), k.numri())
            assertEquals("$m: numriNePritje", (x["numriNePritje"] as Number).toInt(), k.numriNePritje())
        }
        // Kujtesa e ruajtur lexohet sërish njësoj
        val k2 = Kujtesa(Ruajtja().also { it.t = f["kujtesaFundit"] as String })
        assertEquals(kanonik(Json.lexo(f["kujtesaFundit"] as String)), kanonik(Json.lexo(k2.tekstiPerRuajtje())))

        // ---- Furnizuesit ----
        val fu = f["furnizuesit"].siObj()!!
        val afatet = f["afatetF"].siListe().mapNotNull { it.siObj() }
        val produktet = LinkedHashMap<String, Obj>().also { m -> f["produktetF"].siObj()!!.forEach { (kk, v) -> m[kk] = v.siObj()!! } }
        val lf = Furnizuesit.lista(afatet, produktet, k.lista(), k.furnizuesit())
        assertEquals("lista e furnizuesve", kanonik(fu["lista"]), kanonik(lf.map {
            obj("emri" to it.emri, "afate" to it.afate.toLong(), "produkte" to it.produkte.toLong(), "nePritje" to it.nePritje, "nga" to it.nga, "regjistruar" to it.regjistruar, "koha" to it.koha)
        }))
        assertEquals("renditja e furnizuesve", fu["renditurF"], Furnizuesit.renditSipasRuajtjes(lf) { it.koha }.map { it.emri })
        assertEquals("renditja e produkteve", fu["renditurP"], Furnizuesit.renditSipasRuajtjes(k.lista(), Furnizuesit::kohaERuajtjes).map { it.barkodi })
        fu["ekzistues"].siListe().forEach { r -> val l = r.siListe(); assertEquals("ekzistues $l", l[2], Furnizuesit.ekzistues(lf, l[0] as String, l[1] as String)) }
        fu["riemerto"].siListe().forEach { r0 ->
            val r = r0.siObj()!!
            val x = Furnizuesit.riemerto(afatet, produktet, r["vjeter"] as String, r["iRi"] as String, (f["T0"] as Number).toLong() + 777)
            assertEquals("riemerto ${r["vjeter"]}", kanonik(listOf(r["afatet"], r["produktet"], r["nAfate"], r["nProdukte"])),
                kanonik(listOf(x.afatet, x.produktet, x.nAfate.toLong(), x.nProdukte.toLong())))
        }
    }
}

package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.ZoneId
import java.util.TimeZone

/** Grupi në Kotlin = ekipa.js (funksionet e pastra; fikstura.json, teste/vendas-fikstura.js, ora UTC) */
class GrupiTest {
    init { TimeZone.setDefault(TimeZone.getTimeZone("UTC")) }
    private val f: Obj = Json.lexo(javaClass.getResource("/fikstura.json")!!.readText()).siObj()!!["grupi"].siObj()!!
    private val tani = (f["TANI_G"] as Number).toLong()
    private val utc = ZoneId.of("UTC")
    private fun l(x: Any?) = x.siListe().map { it.siObj()!! }
    private fun eq(msg: String, pritur: Any?, marre: Any?) = assertEquals(msg, kanonik(pritur), kanonik(marre))

    @Test fun praniaDheKoha() {
        f["prania"].siListe().forEach { x ->
            val r = x.siObj()!!; val a = r["a"].siObj()
            assertEquals("online " + Json.shkruaj(a), r["on"], GrupiLogjika.eshteOnline(a, tani))
            assertEquals("prania " + Json.shkruaj(a), r["tx"], GrupiLogjika.tekstiPranise(a, tani, utc))
        }
        f["kohet"].siListe().forEach { x ->
            val r = x.siObj()!!; val ts = (r["ts"] as Number).toLong()
            assertEquals("koha $ts", r["rel"], GrupiLogjika.kohaRelative(ts, tani, utc))
            if (ts != 0L) assertEquals("dita $ts", r["dita"], GrupiLogjika.titulliDites(ts, tani, utc))
        }
    }

    @Test fun permbledhjaDheStatistikat() {
        eq("permbledhja", f["permb"], GrupiLogjika.permbledhjaEAfateve(l(f["afatetG"]), tani))
        val st = GrupiLogjika.statistikat(l(f["anetaret"]), tani, utc)
        val s = f["st"].siObj()!!
        eq("numrat", listOf(s["aktive"], s["skaduara"], s["afer"], s["ok"], s["javes"], s["sot"], s["hequrMuajit"], s["hequrSot"]),
            listOf(st.aktive, st.skaduara, st.afer, st.ok, st.javes, st.sot, st.hequrMuajit, st.hequrSot).map { it.toLong() })
        eq("perAnetar", s["perAnetar"], st.perAnetar.map { obj("uid" to it.uid, "emri" to it.emri, "aktive" to it.aktive.toLong(), "skaduara" to it.skaduara.toLong(), "afer" to it.afer.toLong(), "hequr30" to it.hequr30.toLong()) })
        eq("furnizuesit", s["furnizuesit"], st.furnizuesit.map { obj("emri" to it.first, "n" to it.second.toLong()) })
        eq("heqesit", s["heqesit"], st.heqesit.map { obj("emri" to it.first, "n" to it.second.toLong()) })
    }

    @Test fun tekstet() {
        f["tekstet"].siListe().forEach { x ->
            val r = x.siObj()!!; val t = GrupiLogjika.tekstiNgjarjes(r["ng"].siObj()!!, r["u"] as String?)
            val p = r["t"].siObj()!!
            val m = obj("lloji" to t.lloji, "kush" to t.kush, "cfare" to t.cfare, "detaje" to t.detaje)
            if (p.containsKey("avatar")) m["avatar"] = t.avatar
            eq("ngjarja " + Json.shkruaj(r["ng"]) + " / " + r["u"], p, m)
        }
        f["njoftimet"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals(Json.shkruaj(r["nj"]), r["t"], GrupiLogjika.tekstiNjoftimit(r["nj"].siObj()!!)) }
        f["kerkesat"].siListe().forEach { x -> val r = x.siObj()!!; eq("kerkesa " + Json.shkruaj(r["k"]), r["l"], GrupiLogjika.listaEKerkeses(r["k"].siObj())) }
        f["rreshtat"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals(r["t"], GrupiLogjika.rreshtiIProduktit(r["x"].siObj()!!)) }
    }

    @Test fun heqjetDheKalendari() {
        val ngjarjet = f["tekstet"].siListe().map { it.siObj()!!["ng"].siObj()!! }.distinctBy { Json.shkruaj(it) }
        val h = GrupiLogjika.hartaEHeqjeve(ngjarjet)
        eq("harta", f["hartaTx"], h.keys.sorted().map { k -> listOf(k, h[k]!!.heqja?.get("koha"), h[k]!!.vendimi?.get("koha")) })
        f["mbiv"].siListe().forEach { x -> val r = x.siObj()!!; eq("mbivendosja " + r["a"].siObj()!!["id"], r["r"], GrupiLogjika.mbivendosHeqjen(r["a"].siObj()!!, "u1", h)) }
        f["zbatimi"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals(Json.shkruaj(r), r["po"], GrupiLogjika.duhetZbatuarHeqja(r["a"].siObj(), r["nj"].siObj(), tani)) }
        val af = l(f["afatetG"])
        f["kal"].siListe().forEach { x ->
            val r = x.siObj()!!
            val k = GrupiLogjika.kalendari(af, (r["v"] as Number).toInt(), (r["m"] as Number).toInt(), tani, utc)
            assertEquals(r["titulli"], k.titulli)
            eq("ditet " + k.titulli, r["ditetMeStatus"], k.ditetMeStatus.mapValues { it.value.toLong() })
            eq("qelizat " + k.titulli, r["q"], k.qelizat.map { q -> q?.let { listOf(it.iso, it.dita.toLong(), it.sot, it.afatet.size.toLong(), it.neRaft.toLong(), it.statusi) } })
        }
    }
}

package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Test

/** Afatet dhe lejet në Kotlin = afatet.js dhe lejet.js (fikstura.json, teste/vendas-fikstura.js) */
class AfatetTest {
    private val f: Obj = Json.lexo(javaClass.getResource("/fikstura.json")!!.readText()).siObj()!!["afatet"].siObj()!!
    private val tani = (f["TANI_A"] as Number).toLong()

    @Test fun statusetDheTekstet() {
        f["rastet"].siListe().forEach { x ->
            val r = x.siObj()!!; val a = r["a"].siObj()!!; val id = a["id"] as String
            assertEquals("statusi $id", r["statusi"], Afatet.statusi(a, tani))
            assertEquals("ditet $id", (r["ditet"] as? Number)?.toInt(), Afatet.ditetDeri(a["data"], tani))
            assertEquals("pershkrimi $id", r["pershkrimi"], Afatet.pershkrimi(a, tani))
            val m = r["mbetura"].siObj()!!; val mk = Afatet.ditetEMbetura(a, tani)
            assertEquals("mbetura $id", listOf(m["para"], m["nr"], m["pas"]), listOf(mk.para, mk.nr, mk.pas))
            assertEquals("formato $id", r["formato"], Afatet.formato(a["data"]))
            assertEquals("muaji $id", r["muaji"], Afatet.celesiMuajit(a))
            assertEquals("sasiaTekst $id", r["sasiaTekst"], Afatet.sasiaTekst(a))
            assertEquals("fusha $id", r["fusha"], Afatet.formatoPerFushe(a["data"]))
        }
    }

    @Test fun renditja() {
        val afatet = f["rastet"].siListe().map { it.siObj()!!["a"].siObj()!! }
        assertEquals(f["renditur"], afatet.sortedWith { a, b -> Afatet.krahaso(a, b, tani) }.map { it["id"] }) // web-i: ora e ndalur te TANI_A
        val n = f["numero"].siObj()!!; val nk = Afatet.numero(afatet, tani)
        assertEquals(listOf(n["skaduar"], n["afer"], n["ok"], n["hequr"], n["pa-date"], n["aktive"]).map { (it as Number).toInt() },
            listOf(nk.skaduar, nk.afer, nk.ok, nk.hequr, nk.paDate, nk.aktive))
        assertEquals(kanonik(f["furn"]), kanonik(Afatet.furnizuesitELista(afatet).map { listOf(it.celes, it.n, it.emri) }))
    }

    @Test fun datatDheSasite() {
        f["datat"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals("data " + r["t"], r["iso"], Afatet.lexoDaten(r["t"])) }
        f["shkrimi"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals("shkrimi " + r["t"], r["v"], Afatet.formatoDatenGjateShkrimit(r["t"] as String)) }
        f["sasite"].siListe().forEach { x ->
            val r = x.siObj()!!
            assertEquals("sasia " + r["v"], kanonik(r["s"]), kanonik(Afatet.lexoSasine(r["v"])))
            assertEquals("shuma " + r["v"], r["shume"], Afatet.sasiaSiShume(r["v"]))
            assertEquals("pranueshme " + r["v"], r["pranueshme"], Afatet.sasiaEPranueshme(r["v"]))
        }
    }

    @Test fun rreshtatEAI() {
        f["ai"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals("ai " + Json.shkruaj(r["r"]), kanonik(r["n"]), kanonik(Afatet.normalizoRreshtin(r["r"]))) }
    }

    @Test fun ikonatDheLejet() {
        f["ikonat"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals(r["id"], Afatet.ikonaEFolderit(r["f"].siObj()).id) }
        f["lejet"].siListe().forEach { x -> val r = x.siObj()!!; assertEquals("leja " + r["k"] + " " + Json.shkruaj(r["l"]), r["po"], Lejet.lejohet(r["l"].siObj(), r["k"] as String)) }
    }
}

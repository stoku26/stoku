package site.stoku.logjika

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.ZoneId
import java.util.Base64
import java.util.zip.ZipInputStream

/**
 * Excel (xlsx.js), barkodet e etiketave (JsBarcode), CSV (lexoCsvTel) dhe importi i afateve (afatet.js) në Kotlin = web-i
 * (fikstura.json, `node teste/vendas-fikstura.js`; leximi i .xlsx me xlsx.js në Chromium).
 */
class ExcelTest {
    private val f: Obj = Json.lexo(javaClass.getResource("/fikstura.json")!!.readText()).siObj()!!["excel"].siObj()!!
    private val utc = ZoneId.of("UTC")
    private val tani = (f["TANI_I"] as Number).toLong()

    private fun hyrjet(h: List<Xlsx.Hyrje>) = h.map { listOf(it.emri, String(it.te, Charsets.UTF_8)) }
    private fun produktet(x: Any?) = x.siListe().map { it.siObj()!! }
    private fun fletet(x: Any?) = x.siListe().map { s0 ->
        val s = s0.siObj()!!
        Xlsx.Fleta(s["name"], s["columns"].siListe().map { c0 -> val c = c0.siObj()!!; Xlsx.Kolona(c["title"] as String, c["width"], c["type"] as String?) },
            s["rows"].siListe().map { it.siListe() }, s["totalLabel"] as String?, s["totalColumns"].siListe().map { (it as Number).toInt() },
            (s["redZeroColumn"] as Number?)?.toInt())
    }

    @Test fun excelIFolderit() {
        f["build"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            assertEquals("build #$i", r["h"], hyrjet(Xlsx.hyrjetEBuild(produktet(r["p"]))))
        }
    }

    @Test fun libriMeFlete() {
        f["workbook"].siListe().forEachIndexed { i, x ->
            val r = x.siObj()!!
            assertEquals("workbook #$i", r["h"], hyrjet(Xlsx.hyrjetEWorkbook(fletet(r["s"]), utc)))
        }
    }

    @Test fun zipIVlefshem() {
        // ZIP-i i Kotlinit hapet nga java.util.zip dhe nga lexuesi ynë, me të njëjtat skedarë
        val h = Xlsx.hyrjetEWorkbook(fletet(f["workbook"].siListe()[1].siObj()!!["s"]), utc)
        val b = Xlsx.zip(h)
        val emrat = ArrayList<String>()
        ZipInputStream(b.inputStream()).use { z -> while (true) { val e = z.nextEntry ?: break; emrat.add(e.name); assertEquals(h.first { it.emri == e.name }.te.toList(), z.readBytes().toList()) } }
        assertEquals(h.map { it.emri }, emrat)
        val zz = Xlsx.Zip(b)
        h.forEach { assertEquals(String(it.te, Charsets.UTF_8), zz.lexo(it.emri)) }
    }

    private fun normalizo(x: Any?): Any? = when (x) {
        is Double -> if (x.isNaN()) "NaN" else x
        is List<*> -> x.map { normalizo(it) }
        else -> x
    }

    @Test fun leximiIExcelit() {
        f["leximi"].siListe().forEach { x ->
            val r = x.siObj()!!
            val rez = Xlsx.read(Base64.getDecoder().decode(r["b64"] as String)).map { obj("name" to it.name, "rows" to normalizo(it.rows)) }
            assertEquals("leximi " + r["emri"], kanonik(r["rez"]), kanonik(rez))
        }
        // Rrumbullakimi: ajo që shkruan Kotlini lexohet njësoj
        val p = produktet(f["build"].siListe()[1].siObj()!!["p"])
        val rows = Xlsx.read(Xlsx.build(p))[0].rows
        assertEquals(listOf("Barkodi", "Emri i produktit", "Sasia", "Furnizuesi"), rows[0])
        assertEquals(listOf("0038900", "Ujë & \"Kos\" <1>", 3.0, "Vita"), rows[1])
    }

    @Test fun barkodet() {
        f["barkodet"].siListe().forEach { x ->
            val r = x.siObj()!!
            val b = r["b"] as String
            val k = Barkodi.koduar(b)
            if (r["formati"] == null) { assertNull("barkodi $b", k); return@forEach }
            assertEquals("formati $b", r["formati"], k!!.formati)
            // JsBarcode shton zero në skaje (hapësira për shifrën e parë/të fundit të EAN/UPC)
            assertEquals("modulet $b", (r["modulet"] as String).trim('0'), k.modulet)
        }
    }

    @Test fun csv() {
        f["csv"].siListe().forEach { x ->
            val r = x.siObj()!!
            assertEquals("csv " + Json.shkruaj(r["t"]), r["r"], Xlsx.lexoCsv(r["t"] as String))
        }
        f["dekodimi"].siListe().forEach { x ->
            val r = x.siObj()!!
            val b = r["b"].siListe().map { (it as Number).toByte() }.toByteArray()
            assertEquals("dekodimi " + r["b"], r["t"], Xlsx.tekstiISkedarit(b))
        }
    }

    @Test fun muajtDheQelizat() {
        f["muajt"].siListe().forEach { x -> val r = x.siListe(); assertEquals("muaji " + r[0], (r[1] as Number?)?.toInt(), ImportiAfateve.muajiNgaEmri(r[0])) }
        f["qelizat"].siListe().forEach { x ->
            val r = x.siObj()!!
            val m = (r["m"] as Number?)?.toInt()
            assertEquals("tekst " + r["v"], r["tekst"], ImportiAfateve.tekstNgaQeliza(r["v"]))
            assertEquals("data " + r["v"] + " / " + m, r["data"], ImportiAfateve.dataNgaQeliza(r["v"], m, tani))
        }
    }

    private fun fletetI(x: Any?) = x.siListe().map { s0 -> val s = s0.siObj()!!; (s["name"] as String) to s["rows"].siListe().map { it.siListe() } }
    private fun kol(x: Any?) = x.siObj()!!.mapValues { (it.value as Number).toInt() }
    private fun kolKotlin(m: Map<String, Int>) = obj(*m.entries.map { it.key to it.value as Any? }.toTypedArray())

    @Test fun hamendesimiIKolonave() {
        val rows = f["planet"].siListe()[0].siObj()!!["fletet"].siListe().map { it.siObj()!!["rows"].siListe().map { r -> r.siListe() } } +
            listOf(f["planet"].siListe()[2].siObj()!!["fletet"].siListe()[0].siObj()!!["rows"].siListe().map { r -> r.siListe() })
        f["hamendesimi"].siListe().forEachIndexed { i, x ->
            val pritur = x.siListe()
            val (meK, paK) = if (i < rows.size - 1) true to false else false to true // e fundit: [paKoke pa kokë, me kokë]
            assertEquals("hamendesimi #$i/$meK", kanonik(pritur[0]), kanonik(kolKotlin(ImportiAfateve.hamendesoKolonat(rows[i], meK, tani))))
            assertEquals("hamendesimi #$i/$paK", kanonik(pritur[1]), kanonik(kolKotlin(ImportiAfateve.hamendesoKolonat(rows[i], paK, tani))))
        }
    }

    @Test fun planiIImportit() {
        val ekz = listOf(
            obj("id" to "e1", "barkodi" to "3890010002", "emri" to "Djathë", "data" to "2026-10-05", "statusi" to "aktiv"),
            obj("id" to "e2", "barkodi" to "", "emri" to "Ujë!", "data" to "2026-10-12"),
            obj("id" to "e3", "barkodi" to "555555", "data" to "2026-12-01", "statusi" to "hequr"),
            obj("id" to "e4", "barkodi" to 7L, "data" to ""))
        f["planet"].siListe().forEachIndexed { i, x ->
            val p = x.siObj()!!
            val plan = ImportiAfateve.plani(fletetI(p["fletet"]), p["meKoke"] == true, kol(p["kol"]), ekz, tani)
            val rr = plan.rreshta.map { listOf(it.fleta, it.nr, it.barkodi, it.emri, it.data, it.dataOrigjinale, it.sasia, it.furnizuesi, it.gabim, it.veprimi) }
            assertEquals("rreshtat #$i", kanonik(p["rreshta"]), kanonik(rr))
            assertEquals("numrat #$i", kanonik(p["numrat"]), kanonik(listOf(plan.teRinj, plan.ekzistojne, plan.gabime, plan.bashkuar)))
            val teReja = ImportiAfateve.afatetNgaPlani(plan, "besa", tani).map { a -> a.kopje().also { it.remove("id") } }
            assertEquals("teReja #$i", kanonik(p["teReja"]), kanonik(teReja))
        }
    }
}

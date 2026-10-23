package site.stoku.vendas

import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import site.stoku.logjika.Afatet
import site.stoku.logjika.Barkodi
import site.stoku.logjika.Json
import site.stoku.logjika.Obj
import site.stoku.logjika.Xlsx
import site.stoku.logjika.eVertete
import site.stoku.logjika.jsString
import site.stoku.logjika.siListe
import java.io.ByteArrayOutputStream
import java.time.LocalDateTime

/*
 * Eksportet si te app-tel.js: Excel-i i folderit (krijoSkedarin), etiketat në PDF (eksportoPdf: A4, 3×8 etiketa me barkod,
 * emër dhe sasi) dhe Excel-i i afateve me kolonat e zgjedhura (AX_KOLONAT, eksportoTeZgjedhurat). Skedari pastaj shkon te
 * SkedariFlete ("Dërgo në PC", "Ruaje në telefon", "Ndaje").
 */
object Eksportet {
    const val MIME_PDF = "application/pdf"

    private fun dy(n: Int) = (if (n < 10) "0" else "") + n
    private fun dataEmri(d: LocalDateTime, meOre: Boolean) =
        d.year.toString() + "-" + dy(d.monthValue) + "-" + dy(d.dayOfMonth) + (if (meOre) "_" + dy(d.hour) + dy(d.minute) else "")

    fun sluguFolderit(emri: String): String =
        emri.lowercase().replace("ë", "e").replace("ç", "c").replace(Regex("[^a-z0-9]+"), "_").replace(Regex("^_+|_+$"), "").ifEmpty { "folder" }

    /** Renditja e eksportit (emriKrahaso te web-i): sipas emrit, pa emër në fund, pastaj barkodi */
    val emriKrahaso = Comparator<Obj> { a, b ->
        val ea = (a["emri"] as? String).orEmpty(); val eb = (b["emri"] as? String).orEmpty()
        val ba = jsString(a["barkodi"]); val bb = jsString(b["barkodi"])
        when {
            ea.isEmpty() && eb.isEmpty() -> ba.compareTo(bb)
            ea.isEmpty() -> 1
            eb.isEmpty() -> -1
            else -> BAZE.compare(ea, eb).let { if (it != 0) it else ba.compareTo(bb) }
        }
    }
    private val BAZE = java.text.Collator.getInstance(java.util.Locale.forLanguageTag("sq")).apply { strength = java.text.Collator.PRIMARY }

    /** Excel-i i folderit: Barkodi, Emri i produktit, Sasia, Furnizuesi (null kur folderi s'ka produkte) */
    fun excelIFolderit(folderId: String): Skedari? {
        val te = Dyqani.produktetEFolderit(folderId).sortedWith(emriKrahaso)
        if (te.isEmpty()) return null
        val emri = "malli_" + sluguFolderit(Dyqani.emriFolderit(folderId)) + "_" + dataEmri(LocalDateTime.now(), true) + ".xlsx"
        return Skedari(Xlsx.build(te), emri, Xlsx.MIME, "Malli")
    }

    private fun shkurto(t: String, maks: Int) = if (t.length > maks) t.take(maks - 1) + "…" else t

    /** Etiketat në PDF (A4, 3 kolona × 8 rreshta), gati për printim dhe riskenim */
    fun pdfEtiketa(folderId: String): Skedari? {
        val te = Dyqani.produktetEFolderit(folderId).sortedWith(emriKrahaso)
        if (te.isEmpty()) return null
        val dok = PdfDocument()
        try {
            val k = 72f / 25.4f // mm → pikë
            val mV = 8f; val kolona = 3; val rreshta = 8; val bosh = 3f
            val qG = (210f - 2 * mV - (kolona - 1) * bosh) / kolona
            val qL = (297f - 2 * mV - (rreshta - 1) * bosh) / rreshta
            val perFaqe = kolona * rreshta
            val pt = 25.4f / 72f // 1 pikë në mm (madhësia e shkronjave)
            val vija = Paint().apply { style = Paint.Style.STROKE; strokeWidth = 0.2f; color = Color.rgb(210, 210, 210) }
            val zeza = Paint().apply { style = Paint.Style.FILL; color = Color.BLACK; isAntiAlias = false }
            val numri = Paint().apply { color = Color.BLACK; textAlign = Paint.Align.CENTER; isAntiAlias = true; typeface = Typeface.MONOSPACE }
            val normal = Paint().apply { color = Color.rgb(20, 20, 20); textAlign = Paint.Align.CENTER; isAntiAlias = true; typeface = Typeface.SANS_SERIF; textSize = 8 * pt }
            val trash = Paint(normal).apply { typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD); textSize = 9 * pt }
            var faqja: PdfDocument.Page? = null
            te.forEachIndexed { idx, p ->
                val poz = idx % perFaqe
                if (poz == 0) {
                    faqja?.let { dok.finishPage(it) }
                    faqja = dok.startPage(PdfDocument.PageInfo.Builder(595, 842, idx / perFaqe + 1).create()).also { it.canvas.scale(k, k) }
                }
                val c = faqja!!.canvas
                val x = mV + (poz % kolona) * (qG + bosh)
                val y = mV + (poz / kolona) * (qL + bosh)
                c.drawRect(x, y, x + qG, y + qL, vija)
                val qendraX = x + qG / 2
                val barkodi = jsString(p["barkodi"])
                val kodi = Barkodi.koduar(barkodi)
                if (kodi != null) {
                    // Si imazhi i JsBarcode-it: 2 px për modul, buzë 6 px, vijat 46 px, numri 16 px poshtë tyre
                    val m = kodi.modulet
                    val wPx = m.length * 2f + 12f
                    val hPx = 6f + 46f + 2f + 16f + 6f
                    val bGj = qG - 4
                    var bL = bGj * hPx / wPx
                    if (bL > qL * 0.6f) bL = qL * 0.6f
                    val imgX = x + (qG - bGj) / 2
                    val imgY = y + 2
                    val sx = bGj / wPx; val sy = bL / hPx
                    var i = 0
                    while (i < m.length) {
                        if (m[i] == '1') {
                            var j = i
                            while (j + 1 < m.length && m[j + 1] == '1') j++
                            c.drawRect(imgX + (6 + i * 2) * sx, imgY + 6 * sy, imgX + (6 + (j + 1) * 2) * sx, imgY + 52 * sy, zeza)
                            i = j + 1
                        } else i++
                    }
                    numri.textSize = 16 * sy
                    numri.textScaleX = sx / sy
                    c.drawText(barkodi, imgX + bGj / 2, imgY + 70 * sy, numri)
                    val yT = y + 2 + bL + 4
                    c.drawText(shkurto((p["emri"] as? String)?.ifEmpty { null } ?: "(pa emër)", 28), qendraX, yT, normal)
                    c.drawText("Sasia: " + jsString(p["sasia"]), qendraX, yT + 5, trash)
                } else {
                    val t = Paint(normal).apply { textSize = 9 * pt }
                    c.drawText(barkodi, qendraX, y + qL / 2, t)
                }
            }
            faqja?.let { dok.finishPage(it) }
            val out = ByteArrayOutputStream()
            dok.writeTo(out)
            val emri = "etiketa_" + sluguFolderit(Dyqani.emriFolderit(folderId)) + "_" + dataEmri(LocalDateTime.now(), false) + ".pdf"
            return Skedari(out.toByteArray(), emri, MIME_PDF, "Etiketa")
        } finally { dok.close() }
    }

    // ---------------- Excel-i i afateve ----------------
    class KolonaE(val k: String, val emri: String, val col: Xlsx.Kolona, val v: (Obj) -> Any?)
    private val ST_EMRI = mapOf("skaduar" to "Ka skaduar", "pa-date" to "Pa datë", "afer" to "Afër skadimit", "ok" to "Në rregull", "hequr" to "I hequr")
    private fun ose(a: Obj, k: String): Any? = if (eVertete(a[k])) a[k] else ""
    val KOLONAT_E_AFATEVE = listOf(
        KolonaE("barkodi", "Barkodi", Xlsx.Kolona("Barkodi", 18)) { ose(it, "barkodi") },
        KolonaE("emri", "Emri i produktit", Xlsx.Kolona("Emri i produktit", 36)) { ose(it, "emri") },
        KolonaE("sasia", "Sasia (copë)", Xlsx.Kolona("Sasia (copë)", 12, "number")) { a -> if (a["sasia"] is Number) a["sasia"] else "" },
        KolonaE("data", "Data e skadimit", Xlsx.Kolona("Skadon më", 13, "day")) { ose(it, "data") },
        KolonaE("ditet", "Ditë të mbetura", Xlsx.Kolona("Ditë të mbetura", 14, "number")) { a ->
            val n = Afatet.ditetDeri(a["data"]); if (Afatet.statusi(a) == "hequr" || n == null) "" else n
        },
        KolonaE("furnizuesi", "Furnizuesi", Xlsx.Kolona("Furnizuesi", 22)) { ose(it, "furnizuesi") },
        KolonaE("statusi", "Statusi", Xlsx.Kolona("Statusi", 15)) { ST_EMRI[Afatet.statusi(it)] ?: "" },
        KolonaE("pershkrimi", "Çfarë duhet bërë", Xlsx.Kolona("Çfarë duhet bërë", 60)) { Afatet.pershkrimi(it) },
        KolonaE("krijuarNga", "Shtuar nga", Xlsx.Kolona("Shtuar nga", 14)) { ose(it, "krijuarNga") }
    )

    /** Kolonat e zgjedhura herën e fundit (si "stoku:afatet:excel-kolonat" te web-i) */
    fun kolonatERuajtura(): List<String> = try {
        Json.lexo(StokuApp.prefsOse("afatet_excel_kolonat", "")).siListe().filterIsInstance<String>().ifEmpty { null }
    } catch (e: Exception) { null } ?: KOLONAT_E_AFATEVE.map { it.k }

    private fun pjeseEmri(t: String) =
        t.lowercase().replace("ë", "e").replace("ç", "c").replace(Regex("[^a-z0-9]+"), "_").replace(Regex("^_+|_+$"), "").take(40)

    /** lista: afatet (të renditura); muaji/furnizuesi: vetëm te eksporti i krejt listës, për emrin e fletës dhe të skedarit */
    fun excelIAfateve(lista: List<Obj>, kyçet: List<String>, muaji: String, furnizuesi: String): Skedari {
        StokuApp.vendosPref("afatet_excel_kolonat", Json.shkruaj(kyçet))
        val kolonat = KOLONAT_E_AFATEVE.filter { kyçet.contains(it.k) }
        val rreshtat = lista.map { a -> kolonat.map { it.v(a) } }
        val iSasise = if (kyçet.contains("sasia")) kolonat.indexOfFirst { it.k == "sasia" } else -1
        val fleta = Xlsx.Fleta(furnizuesi.ifEmpty { if (muaji.isNotEmpty()) Afatet.emriMuajit(muaji) else "Afatet" }, kolonat.map { it.col }, rreshtat,
            totalLabel = if (iSasise > 0) "Gjithsej" else null, totalColumns = if (iSasise >= 0) listOf(iSasise) else emptyList())
        val emri = "afatet_" + (pjeseEmri(furnizuesi).let { if (furnizuesi.isNotEmpty() && it.isNotEmpty()) it + "_" else "" }) +
            (if (muaji.isNotEmpty()) pjeseEmri(Afatet.emriMuajit(muaji)) + "_" else "") + dataEmri(LocalDateTime.now(), true) + ".xlsx"
        return Skedari(Xlsx.buildWorkbook(listOf(fleta)), emri, Xlsx.MIME, "Afatet")
    }
}

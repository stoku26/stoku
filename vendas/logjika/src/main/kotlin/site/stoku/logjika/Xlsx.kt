package site.stoku.logjika

import org.w3c.dom.Element
import org.w3c.dom.Node
import java.io.ByteArrayOutputStream
import java.io.StringReader
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.Charset
import java.nio.charset.CodingErrorAction
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.zip.CRC32
import java.util.zip.Inflater
import javax.xml.parsers.DocumentBuilderFactory
import org.xml.sax.InputSource

/*
 * Excel (.xlsx) pa librari: përkthim i xlsx.js (një .xlsx është një ZIP me disa skedarë XML).
 * build = Excel-i i folderit (Barkodi, Emri i produktit, Sasia, Furnizuesi); buildWorkbook = libër me fletë, stil, rreshtin
 * "Gjithsej" (Excel-i i afateve, stoku i kolegut); read = leximi për importin. Barkodi ruhet si tekst (zerot s'humbin).
 * Testet e krahasojnë me xlsx.js (fikstura.json, `node teste/vendas-fikstura.js`).
 */
object Xlsx {
    const val MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    class Hyrje(val emri: String, val te: ByteArray)

    private fun u16(o: ByteArrayOutputStream, v: Int) { o.write(v and 0xFF); o.write((v ushr 8) and 0xFF) }
    private fun u32(o: ByteArrayOutputStream, v: Long) { for (i in 0 until 4) o.write(((v ushr (8 * i)) and 0xFF).toInt()) }

    /** ZIP pa kompresim (stored), si zip() te xlsx.js; koha = ora lokale e skedarëve */
    fun zip(skedaret: List<Hyrje>, koha: LocalDateTime = LocalDateTime.now()): ByteArray {
        val ora = ((koha.hour shl 11) or (koha.minute shl 5) or (koha.second shr 1)) and 0xFFFF
        val data = (((koha.year - 1980) shl 9) or (koha.monthValue shl 5) or koha.dayOfMonth) and 0xFFFF
        val out = ByteArrayOutputStream()
        val qendra = ByteArrayOutputStream()
        var offset = 0L
        skedaret.forEach { f ->
            val emri = f.emri.toByteArray(Charsets.UTF_8)
            val crc = CRC32().apply { update(f.te) }.value
            val n = f.te.size.toLong()
            u32(out, 0x04034b50); u16(out, 20); u16(out, 0x0800); u16(out, 0); u16(out, ora); u16(out, data)
            u32(out, crc); u32(out, n); u32(out, n); u16(out, emri.size); u16(out, 0)
            out.write(emri); out.write(f.te)
            u32(qendra, 0x02014b50); u16(qendra, 20); u16(qendra, 20); u16(qendra, 0x0800); u16(qendra, 0); u16(qendra, ora); u16(qendra, data)
            u32(qendra, crc); u32(qendra, n); u32(qendra, n); u16(qendra, emri.size); u16(qendra, 0); u16(qendra, 0); u16(qendra, 0); u16(qendra, 0)
            u32(qendra, 0); u32(qendra, offset); qendra.write(emri)
            offset += 30 + emri.size + n
        }
        val q = qendra.toByteArray()
        out.write(q)
        u32(out, 0x06054b50); u16(out, 0); u16(out, 0); u16(out, skedaret.size); u16(out, skedaret.size)
        u32(out, q.size.toLong()); u32(out, offset); u16(out, 0)
        return out.toByteArray()
    }

    fun escapeXml(t: Any?): String {
        val s = jsString(t)
        val r = StringBuilder(s.length + 16)
        for (ch in s) {
            when {
                ch == '&' -> r.append("&amp;")
                ch == '<' -> r.append("&lt;")
                ch == '>' -> r.append("&gt;")
                ch == '"' -> r.append("&quot;")
                ch.code < 0x20 && ch != '\n' && ch != '\t' && ch != '\r' -> {}
                else -> r.append(ch)
            }
        }
        return r.toString()
    }

    private const val KOKA = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
    private const val NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    private const val NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    private const val NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
    private const val RELS_KRYESORE = KOKA +
        "<Relationships xmlns=\"$NS_PKG_REL\">" +
        "<Relationship Id=\"rId1\" Type=\"$NS_REL/officeDocument\" Target=\"xl/workbook.xml\"/>" +
        "</Relationships>"

    private fun tekst(t: Any?) = "<c t=\"inlineStr\"><is><t xml:space=\"preserve\">" + escapeXml(t) + "</t></is></c>"
    /** p.x si te JavaScript: fusha që mungon = "undefined" */
    private fun fusha(p: Obj, k: String): Any? = if (p.containsKey(k)) p[k] else "undefined"

    /** (x | 0) i JavaScript-it */
    fun jsInt32(x: Any?): Int {
        val d = jsNumber(x)
        if (!d.isFinite()) return 0
        val t = if (d < 0) Math.ceil(d) else Math.floor(d)
        return java.math.BigDecimal(t).toBigInteger().toInt()
    }

    /** Excel-i i folderit: produktet = [{ barkodi, emri, sasia, furnizuesi }] (të renditura nga thirrësi) */
    fun hyrjetEBuild(produktet: List<Obj>): List<Hyrje> {
        val ct = KOKA +
            "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
            "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
            "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
            "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
            "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
            "</Types>"
        val workbook = KOKA +
            "<workbook xmlns=\"$NS_MAIN\" xmlns:r=\"$NS_REL\">" +
            "<sheets><sheet name=\"Malli\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>"
        val wbRels = KOKA +
            "<Relationships xmlns=\"$NS_PKG_REL\">" +
            "<Relationship Id=\"rId1\" Type=\"$NS_REL/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
            "</Relationships>"
        val rows = StringBuilder()
        rows.append("<row>" + tekst("Barkodi") + tekst("Emri i produktit") + tekst("Sasia") + tekst("Furnizuesi") + "</row>")
        produktet.forEach { p ->
            rows.append("<row>" + tekst(fusha(p, "barkodi")) + tekst(fusha(p, "emri")) + "<c><v>" + jsInt32(p["sasia"]) + "</v></c>" +
                tekst(if (eVertete(p["furnizuesi"])) p["furnizuesi"] else "") + "</row>")
        }
        val sheet = KOKA +
            "<worksheet xmlns=\"$NS_MAIN\">" +
            "<cols>" +
            "<col min=\"1\" max=\"1\" width=\"22\" customWidth=\"1\"/>" +
            "<col min=\"2\" max=\"2\" width=\"40\" customWidth=\"1\"/>" +
            "<col min=\"3\" max=\"3\" width=\"10\" customWidth=\"1\"/>" +
            "<col min=\"4\" max=\"4\" width=\"22\" customWidth=\"1\"/>" +
            "</cols><sheetData>" + rows + "</sheetData></worksheet>"
        return listOf(
            Hyrje("[Content_Types].xml", ct.toByteArray()), Hyrje("_rels/.rels", RELS_KRYESORE.toByteArray()),
            Hyrje("xl/workbook.xml", workbook.toByteArray()), Hyrje("xl/_rels/workbook.xml.rels", wbRels.toByteArray()),
            Hyrje("xl/worksheets/sheet1.xml", sheet.toByteArray())
        )
    }
    fun build(produktet: List<Obj>): ByteArray = zip(hyrjetEBuild(produktet))

    // ================= Libër pune me disa fletë + stil =================
    /** type: "text" (parazgjedhur), "number", "date" (ms, me orë), "day" ('VVVV-MM-DD') */
    class Kolona(val title: String, val width: Any? = null, val type: String? = null)
    class Fleta(
        val name: Any?, val columns: List<Kolona>, val rows: List<List<Any?>>,
        val totalLabel: String? = null, val totalColumns: List<Int> = emptyList(), val redZeroColumn: Int? = null
    )

    fun kolonaShkronje(i0: Int): String {
        var s = ""
        var i = i0 + 1
        while (i > 0) { val m = (i - 1) % 26; s = ('A' + m) + s; i = (i - 1) / 26 }
        return s
    }

    private val SKAJET = Regex("^[$JS_HAPESIRAT']+|[$JS_HAPESIRAT']+$")
    private val NDALUARA = Regex("[\\[\\]:*?/\\\\]")
    private val HAPESIRA = Regex("[$JS_HAPESIRAT]+")
    private fun pastroSkajet(t: String) = t.replace(SKAJET, "")
    /** Emri i fletës si e pranon Excel-i (31 shkronja, pa []:*?/\, pa apostrof në skaje), i veçantë në libër */
    fun emriFletes(emri: Any?, zene: MutableSet<String>): String {
        val baza0 = pastroSkajet(jsString(if (eVertete(emri)) emri else "Fleta").replace(NDALUARA, " ").replace(HAPESIRA, " ")).ifEmpty { "Fleta" }
        val baza = pastroSkajet(baza0.take(31)).ifEmpty { "Fleta" }
        var e = baza
        var n = 2
        while (zene.contains(e.lowercase())) {
            val prapa = " ($n)"
            e = pastroSkajet(baza.take(31 - prapa.length)).ifEmpty { "Fleta" } + prapa
            n++
        }
        zene.add(e.lowercase())
        return e
    }

    fun dataExcel(ms: Double, zona: ZoneId): Double {
        val offsetS = zona.rules.getOffset(Instant.ofEpochMilli(ms.toLong())).totalSeconds
        return (ms + offsetS * 1000.0) / 86400000.0 + 25569
    }

    private fun stilet() = KOKA +
        "<styleSheet xmlns=\"$NS_MAIN\">" +
        "<numFmts count=\"2\"><numFmt numFmtId=\"164\" formatCode=\"dd.mm.yyyy hh:mm\"/><numFmt numFmtId=\"165\" formatCode=\"dd.mm.yyyy\"/></numFmts>" +
        "<fonts count=\"4\">" +
        "<font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>" +
        "<font><b/><sz val=\"11\"/><color rgb=\"FFFFFFFF\"/><name val=\"Calibri\"/><family val=\"2\"/></font>" +
        "<font><b/><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>" +
        "<font><b/><sz val=\"11\"/><color rgb=\"FFC62828\"/><name val=\"Calibri\"/><family val=\"2\"/></font>" +
        "</fonts>" +
        "<fills count=\"4\">" +
        "<fill><patternFill patternType=\"none\"/></fill>" +
        "<fill><patternFill patternType=\"gray125\"/></fill>" +
        "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF1565C0\"/><bgColor indexed=\"64\"/></patternFill></fill>" +
        "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFE8EEF7\"/><bgColor indexed=\"64\"/></patternFill></fill>" +
        "</fills>" +
        "<borders count=\"2\">" +
        "<border><left/><right/><top/><bottom/><diagonal/></border>" +
        "<border><left/><right/><top style=\"thin\"><color rgb=\"FF1565C0\"/></top><bottom/><diagonal/></border>" +
        "</borders>" +
        "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
        "<cellXfs count=\"9\">" +
        "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>" +
        "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"2\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\"/>" +
        "<xf numFmtId=\"49\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/>" +
        "<xf numFmtId=\"1\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/>" +
        "<xf numFmtId=\"164\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/>" +
        "<xf numFmtId=\"0\" fontId=\"2\" fillId=\"3\" borderId=\"1\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/>" +
        "<xf numFmtId=\"1\" fontId=\"2\" fillId=\"3\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\"/>" +
        "<xf numFmtId=\"1\" fontId=\"3\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\"/>" +
        "<xf numFmtId=\"165\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\"/>" +
        "</cellXfs>" +
        "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>" +
        "</styleSheet>"

    private val DITA = Regex("^(\\d{4})-(\\d{2})-(\\d{2})$")
    private fun qelize(ref: String, vlera: Any?, lloji: String, stil: Int, zona: ZoneId): String {
        if (vlera == null || vlera == "") return ""
        when (lloji) {
            "number" -> {
                val n = jsNumber(vlera)
                if (!n.isFinite()) return ""
                return "<c r=\"$ref\" s=\"$stil\"><v>" + numriSiTekst(n) + "</v></c>"
            }
            "date" -> {
                val ms = jsNumber(vlera)
                if (!ms.isFinite() || ms <= 0) return ""
                return "<c r=\"$ref\" s=\"4\"><v>" + numriSiTekst(dataExcel(ms, zona)) + "</v></c>"
            }
            "day" -> {
                val m = DITA.matchEntire(jsString(vlera)) ?: return ""
                var v = m.groupValues[1].toInt()
                if (v in 0..99) v += 1900 // si Date.UTC
                val dita = LocalDate.of(v, 1, 1).plusMonths(m.groupValues[2].toLong() - 1).plusDays(m.groupValues[3].toLong() - 1).toEpochDay() + 25569
                return "<c r=\"$ref\" s=\"8\"><v>$dita</v></c>"
            }
        }
        return "<c r=\"$ref\" s=\"$stil\" t=\"inlineStr\"><is><t xml:space=\"preserve\">" + escapeXml(vlera) + "</t></is></c>"
    }

    fun hyrjetEWorkbook(sheets: List<Fleta>, zona: ZoneId = ZoneId.systemDefault()): List<Hyrje> {
        val zene = HashSet<String>()
        val fletet = (sheets.ifEmpty { listOf(Fleta("Fleta", emptyList(), emptyList())) }).map { it to emriFletes(it.name, zene) }
        val ct = StringBuilder(KOKA +
            "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
            "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
            "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
            "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
            "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>")
        fletet.forEachIndexed { i, _ ->
            ct.append("<Override PartName=\"/xl/worksheets/sheet${i + 1}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>")
        }
        ct.append("</Types>")

        val emrat = StringBuilder()
        val wbSheets = StringBuilder()
        val wbRels = StringBuilder(KOKA + "<Relationships xmlns=\"$NS_PKG_REL\">")
        val skedaret = ArrayList<Hyrje>()
        fletet.forEachIndexed { i, (sh, emriF) ->
            val cols = sh.columns
            val rows = sh.rows
            val nK = maxOf(cols.size, 1)
            val fundiKol = kolonaShkronje(nK - 1)
            val x = StringBuilder()
            x.append("<row r=\"1\">")
            cols.forEachIndexed { ci, c -> x.append(qelize(kolonaShkronje(ci) + "1", c.title, "text", 1, zona)) }
            x.append("</row>")
            rows.forEachIndexed { ri, r ->
                val nr = ri + 2
                x.append("<row r=\"$nr\">")
                cols.forEachIndexed { ci, c ->
                    val v = r.getOrNull(ci)
                    val stil = if (c.type == "number") (if (sh.redZeroColumn == ci && jsNumber(v) == 0.0) 7 else 3)
                        else if (c.type == "date") 4 else if (c.type == "day") 8 else 2
                    x.append(qelize(kolonaShkronje(ci) + nr, v, c.type ?: "text", stil, zona))
                }
                x.append("</row>")
            }
            val fundiTe = rows.size + 1
            if (!sh.totalLabel.isNullOrEmpty() && rows.isNotEmpty()) {
                val nrT = rows.size + 2
                x.append("<row r=\"$nrT\">")
                cols.forEachIndexed { ci, _ ->
                    val ref = kolonaShkronje(ci) + nrT
                    if (ci == 0) {
                        x.append("<c r=\"$ref\" s=\"5\" t=\"inlineStr\"><is><t xml:space=\"preserve\">" + escapeXml(sh.totalLabel) + "</t></is></c>")
                    } else if (sh.totalColumns.contains(ci)) {
                        var shuma = 0.0
                        rows.forEach { r -> shuma += numerOse0(r.getOrNull(ci)) }
                        val l = kolonaShkronje(ci)
                        x.append("<c r=\"$ref\" s=\"6\"><f>SUM($l" + "2:" + l + fundiTe + ")</f><v>" + numriSiTekst(shuma) + "</v></c>")
                    } else x.append("<c r=\"$ref\" s=\"5\"/>")
                }
                x.append("</row>")
            }
            val zonaFiltrit = "A1:" + fundiKol + maxOf(fundiTe, 1)
            val colsXml = if (cols.isEmpty()) "" else "<cols>" + cols.mapIndexed { ci, c ->
                "<col min=\"${ci + 1}\" max=\"${ci + 1}\" width=\"" + (if (eVertete(c.width)) jsString(c.width) else "14") + "\" customWidth=\"1\"/>"
            }.joinToString("") + "</cols>"
            val sheetXml = KOKA +
                "<worksheet xmlns=\"$NS_MAIN\" xmlns:r=\"$NS_REL\">" +
                "<sheetViews><sheetView workbookViewId=\"0\"" + (if (i == 0) " tabSelected=\"1\"" else "") + ">" +
                "<pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\"/>" +
                "<selection pane=\"bottomLeft\" activeCell=\"A2\" sqref=\"A2\"/></sheetView></sheetViews>" +
                "<sheetFormatPr defaultRowHeight=\"15\"/>" +
                colsXml +
                "<sheetData>" + x + "</sheetData>" +
                (if (cols.isNotEmpty() && rows.isNotEmpty()) "<autoFilter ref=\"$zonaFiltrit\"/>" else "") +
                "</worksheet>"
            skedaret.add(Hyrje("xl/worksheets/sheet${i + 1}.xml", sheetXml.toByteArray()))
            wbSheets.append("<sheet name=\"" + escapeXml(emriF) + "\" sheetId=\"${i + 1}\" r:id=\"rId${i + 1}\"/>")
            wbRels.append("<Relationship Id=\"rId${i + 1}\" Type=\"$NS_REL/worksheet\" Target=\"worksheets/sheet${i + 1}.xml\"/>")
            if (cols.isNotEmpty() && rows.isNotEmpty()) {
                emrat.append("<definedName name=\"_xlnm._FilterDatabase\" localSheetId=\"$i\" hidden=\"1\">'" +
                    escapeXml(emriF.replace("'", "''")) + "'!\$A\$1:\$" + fundiKol + "\$" + fundiTe + "</definedName>")
            }
        }
        wbRels.append("<Relationship Id=\"rId${fletet.size + 1}\" Type=\"$NS_REL/styles\" Target=\"styles.xml\"/>")
        wbRels.append("</Relationships>")
        val workbook = KOKA +
            "<workbook xmlns=\"$NS_MAIN\" xmlns:r=\"$NS_REL\">" +
            "<bookViews><workbookView activeTab=\"0\"/></bookViews>" +
            "<sheets>" + wbSheets + "</sheets>" +
            (if (emrat.isNotEmpty()) "<definedNames>$emrat</definedNames>" else "") +
            "</workbook>"
        return listOf(
            Hyrje("[Content_Types].xml", ct.toString().toByteArray()), Hyrje("_rels/.rels", RELS_KRYESORE.toByteArray()),
            Hyrje("xl/workbook.xml", workbook.toByteArray()), Hyrje("xl/_rels/workbook.xml.rels", wbRels.toString().toByteArray()),
            Hyrje("xl/styles.xml", stilet().toByteArray())
        ) + skedaret
    }
    fun buildWorkbook(sheets: List<Fleta>, zona: ZoneId = ZoneId.systemDefault()): ByteArray = zip(hyrjetEWorkbook(sheets, zona))

    // ================= Leximi i një .xlsx (importi) =================
    class FletaELexuar(val name: String, val rows: List<List<Any?>>)
    class GabimXlsx(val kodi: String) : Exception(kodi)

    private fun lexoU16(b: ByteArray, o: Int) = (b[o].toInt() and 0xFF) or ((b[o + 1].toInt() and 0xFF) shl 8)
    private fun lexoU32(b: ByteArray, o: Int): Long = (lexoU16(b, o).toLong()) or (lexoU16(b, o + 2).toLong() shl 16)

    private class HyrjaZip(val metoda: Int, val madhKomp: Long, val offsetLokal: Long)
    /** Hyrjet e ZIP-it (direktoria qendrore) → leximi i njërës sipas emrit (stored ose deflate) */
    class Zip(private val b: ByteArray) {
        private val hyrjet = LinkedHashMap<String, HyrjaZip>()
        init {
            var eocd = -1
            var i = b.size - 22
            val kufiri = maxOf(0, b.size - 65557)
            while (i >= kufiri) { if (lexoU32(b, i) == 0x06054b50L) { eocd = i; break }; i-- }
            if (eocd < 0) throw GabimXlsx("jo-zip")
            val n = lexoU16(b, eocd + 10)
            var poz = lexoU32(b, eocd + 16).toInt()
            for (k in 0 until n) {
                if (poz < 0 || poz + 46 > b.size || lexoU32(b, poz) != 0x02014b50L) break
                val metoda = lexoU16(b, poz + 10)
                val madhKomp = lexoU32(b, poz + 20)
                val gjEmrit = lexoU16(b, poz + 28); val gjExtra = lexoU16(b, poz + 30); val gjKoment = lexoU16(b, poz + 32)
                val offsetLokal = lexoU32(b, poz + 42)
                val emri = String(b, poz + 46, minOf(gjEmrit, b.size - poz - 46), Charsets.UTF_8)
                hyrjet[emri] = HyrjaZip(metoda, madhKomp, offsetLokal)
                poz += 46 + gjEmrit + gjExtra + gjKoment
            }
        }
        val emrat: List<String> get() = hyrjet.keys.toList()
        fun lexo(emri: String): String? {
            val h = hyrjet[emri] ?: return null
            val o = h.offsetLokal.toInt()
            if (o < 0 || o + 30 > b.size) throw GabimXlsx("jo-zip")
            val fillimi = o + 30 + lexoU16(b, o + 26) + lexoU16(b, o + 28)
            val fundi = minOf(b.size.toLong(), fillimi + h.madhKomp).toInt()
            if (fillimi > fundi) throw GabimXlsx("jo-zip")
            val te = b.copyOfRange(fillimi, fundi)
            val bajtet = when (h.metoda) {
                0 -> te
                8 -> {
                    val inf = Inflater(true)
                    try {
                        inf.setInput(te)
                        val out = ByteArrayOutputStream(maxOf(te.size * 4, 1024))
                        val buf = ByteArray(64 * 1024)
                        while (!inf.finished()) {
                            val n = inf.inflate(buf)
                            if (n == 0 && (inf.needsInput() || inf.needsDictionary())) break
                            out.write(buf, 0, n)
                            if (out.size() > 200 * 1024 * 1024) throw GabimXlsx("shume-i-madh")
                        }
                        out.toByteArray()
                    } finally { inf.end() }
                }
                else -> throw GabimXlsx("kompresim-i-panjohur")
            }
            return String(bajtet, Charsets.UTF_8).removePrefix("﻿") // TextDecoder e heq BOM-in
        }
    }

    private fun xml(t: String): org.w3c.dom.Document {
        val f = DocumentBuilderFactory.newInstance()
        f.isNamespaceAware = true
        try { f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) } catch (e: Exception) { }
        try { f.isExpandEntityReferences = false } catch (e: Exception) { }
        return f.newDocumentBuilder().parse(InputSource(StringReader(t)))
    }
    private fun Node.emriLokal(): String = localName ?: nodeName.substringAfter(':')
    /** Pasardhësit me këtë emër lokal (çdo namespace), sipas renditjes në dokument (si getElementsByTagNameNS('*', x)) */
    private fun Node.pasardhesit(emri: String): List<Element> {
        val out = ArrayList<Element>()
        fun ec(n: Node) {
            var c = n.firstChild
            while (c != null) {
                if (c.nodeType == Node.ELEMENT_NODE) { if (c.emriLokal() == emri) out.add(c as Element); ec(c) }
                c = c.nextSibling
            }
        }
        ec(this)
        return out
    }
    private fun Element.atr(emri: String): String? = if (hasAttribute(emri)) getAttribute(emri) else null

    private fun kolonaNgaRef(ref: String?): Int {
        val m = Regex("^([A-Z]+)").find(ref ?: "") ?: return -1
        var n = 0
        for (c in m.groupValues[1]) n = n * 26 + (c.code - 64)
        return n - 1
    }
    /** <si>/<is>: <t> i drejtpërdrejtë ose disa <r><t>; teksti fonetik (<rPh>) injorohet */
    private fun tekstiNyjes(el: Element): String {
        val s = StringBuilder()
        el.pasardhesit("t").forEach { t -> if (t.parentNode?.emriLokal() != "rPh") s.append(t.textContent) }
        return s.toString()
    }
    /** parseInt(x, 10) i JavaScript-it (null = NaN) */
    private fun parseIntJs(x: String?): Int? {
        val m = Regex("^[$JS_HAPESIRAT]*([+-]?\\d+)").find(x ?: "") ?: return null
        return m.groupValues[1].toBigInteger().let { if (it.bitLength() > 31) null else it.toInt() }
    }

    fun read(bajtet: ByteArray): List<FletaELexuar> {
        val z = Zip(bajtet)
        val wbTxt = z.lexo("xl/workbook.xml") ?: throw GabimXlsx("jo-xlsx")
        val relsTxt = z.lexo("xl/_rels/workbook.xml.rels")
        val ssTxt = z.lexo("xl/sharedStrings.xml")
        val shared = ArrayList<String>()
        if (ssTxt != null) xml(ssTxt).pasardhesit("si").forEach { shared.add(tekstiNyjes(it)) }
        val objektivat = HashMap<String, String>()
        if (relsTxt != null) xml(relsTxt).pasardhesit("Relationship").forEach { r -> objektivat[r.getAttribute("Id")] = r.getAttribute("Target") }
        val fletet = xml(wbTxt).pasardhesit("sheet")
        val rez = ArrayList<FletaELexuar>()
        fletet.forEachIndexed { f, fl ->
            val rid = fl.atr("r:id")?.ifEmpty { null } ?: fl.getAttributeNS(NS_REL, "id")
            val target = objektivat[rid]?.ifEmpty { null } ?: "worksheets/sheet${f + 1}.xml"
            val shteg = if (target.startsWith("/")) target.substring(1) else "xl/" + target.removePrefix("./")
            val shTxt = z.lexo(shteg) ?: return@forEachIndexed
            val rreshtat = java.util.TreeMap<Int, List<Any?>>()
            var gjatesia = 0
            xml(shTxt).pasardhesit("row").forEach { row ->
                val nr = parseIntJs(row.atr("r"))
                val idx = if (nr != null) nr - 1 else gjatesia
                val rresht = ArrayList<Any?>()
                row.pasardhesit("c").forEach { cel ->
                    var kol = kolonaNgaRef(cel.atr("r"))
                    if (kol < 0) kol = rresht.size
                    val t = cel.atr("t")
                    val v = cel.pasardhesit("v").firstOrNull()?.textContent ?: ""
                    val vlera: Any = when (t) {
                        "s" -> parseIntJs(v)?.let { shared.getOrNull(it) } ?: ""
                        "inlineStr" -> tekstiNyjes(cel)
                        "str", "e" -> v
                        "b" -> v == "1"
                        else -> if (v == "") "" else jsNumber(v)
                    }
                    if (kol > 20000) return@forEach // qelizë e çuditshme (XFD...): s'ka kuptim për importin
                    while (rresht.size <= kol) rresht.add(null)
                    rresht[kol] = vlera
                }
                for (q in rresht.indices) if (rresht[q] == null) rresht[q] = ""
                if (rresht.none { it != "" && it != null }) return@forEach
                if (idx < 0) return@forEach // si rreshtat[-1] te JavaScript-i: s'hyn në listë
                rreshtat[idx] = rresht
                if (idx + 1 > gjatesia) gjatesia = idx + 1
            }
            val lista = ArrayList<List<Any?>>(gjatesia)
            for (w in 0 until gjatesia) lista.add(rreshtat[w] ?: emptyList())
            rez.add(FletaELexuar(fl.atr("name")?.ifEmpty { null } ?: "Fleta ${f + 1}", lista))
        }
        return rez
    }

    // ================= CSV (si lexoCsvTel te app-tel.js) =================
    /** Teksti i skedarit: UTF-8, përndryshe Windows-1252 (Excel-i i vjetër) */
    fun tekstiISkedarit(b: ByteArray): String = try {
        Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).onUnmappableCharacter(CodingErrorAction.REPORT)
            .decode(ByteBuffer.wrap(b)).toString().removePrefix("﻿")
    } catch (e: CharacterCodingException) {
        String(b, Charset.forName("windows-1252"))
    }

    fun lexoCsv(tekst0: String): List<List<String>> {
        val tekst = tekst0.removePrefix("﻿")
        val r0 = tekst.split(Regex("\r?\n"))[0]
        val nd = listOf(";", ",", "\t").fold(",") { m, d -> if (r0.split(d).size > r0.split(m).size) d else m }[0]
        val rr = ArrayList<List<String>>()
        var r = ArrayList<String>()
        val f = StringBuilder()
        var q = false
        var i = 0
        while (i < tekst.length) {
            val c = tekst[i]
            if (q) {
                if (c == '"') { if (i + 1 < tekst.length && tekst[i + 1] == '"') { f.append('"'); i++ } else q = false } else f.append(c)
            } else if (c == '"') q = true
            else if (c == nd) { r.add(f.toString()); f.setLength(0) }
            else if (c == '\n' || c == '\r') {
                if (c == '\r' && i + 1 < tekst.length && tekst[i + 1] == '\n') i++
                r.add(f.toString()); rr.add(r); r = ArrayList(); f.setLength(0)
            } else f.append(c)
            i++
        }
        if (f.isNotEmpty() || r.isNotEmpty()) { r.add(f.toString()); rr.add(r) }
        return rr.filter { x -> x.any { jsTrim(it).isNotEmpty() } }
    }
}

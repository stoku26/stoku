package site.stoku.vendas

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.pdf.PdfDocument
import site.stoku.logjika.Afatet
import site.stoku.logjika.Obj
import site.stoku.logjika.jsString
import java.io.ByteArrayOutputStream
import kotlin.math.floor
import kotlin.math.roundToInt

/**
 * Hyrja 36 (web v275, pronari "ideja 1" + opsionet "A"): afatet në PDF për printim, A4 e bardhë (vetëm e çelët, se printohet).
 * E njëjta faqe si `apPdf` te eksportet.js (mm: anët 12.7, rreshti 7.4, trupi deri te 290, pa asgjë poshtë (Hyrja 79)).
 * Faqja 1 (pronari, "koka 1"): logoja e vogël majtas, data djathtas, "Lista e afateve" në mes, poshtë "Periudha: … · N produkte · M copë"
 * (trupi nga 37.2, 33 rreshta). Hyrja 61 (pronari, foto): faqet e tjera pa logo/titull/të dhëna, vetëm koka e tabelës (trupi nga 15.3,
 * 36 rreshta); "COPË" me sasinë më majtas, larg "SKADON" (kolona 18 mm, numri 6 mm para skajit).
 * Barkodi me Onest dhe shifra me gjerësi të njëjtë (pronari: zeroja e JetBrains Mono me pikë ngjante me 8).
 * Pa kolonën "Gjendja" (pronari: ditët e mbetura s'vlejnë më të nesërmen e printimit).
 * Web-i shkruan me helvetica (jsPDF), Android-i me Onest. Ndryshoji bashkë.
 */
object EksportiPdf {
    val RENDET = listOf("data" to "Sipas datës", "furnizuesi" to "Sipas furnizuesit", "emri" to "Sipas emrit")

    private const val W = 210f
    private const val MX = 12.7f
    private const val KOKA1 = 37.2f
    private const val KOKA = 15.3f
    private const val P_SASIA = 6f // hapësira djathtas e kolonës COPË (Hyrja 61)
    private const val RR = 7.4f
    private const val FUND = 290f // Hyrja 79: pa fund, faqja 1 deri poshtë (34 rreshta)
    private const val FUND2 = 290f // Hyrja 62: faqet 2+ pa fund ("Krijuar me Stoku", "Faqja X nga Y"), tabela deri poshtë (37 rreshta)
    private const val MESI = 18.5f // Hyrja 71: vija e mesit e kokës (logoja, titulli me rreshtin poshtë, data), si web-i
    private const val PT = 25.4f / 72f // 1 pikë (pt) në mm

    private fun c(h: Long) = (h or 0xFF000000L).toInt()
    private val INK = c(0x14161b); private val INK2 = c(0x3a3d44); private val MUTED = c(0x6b6e76); private val FAINT = c(0x8a8d94)
    private val LINE2 = c(0xe8e6e1); private val ZEBRA = c(0xfaf9f7)

    /** Sa rreshta në secilën faqe */
    fun plani(n: Int): List<Int> {
        val faqet = ArrayList<Int>()
        var mbetur = n
        var y0 = KOKA1
        do { val nxe = floor(((if (faqet.isEmpty()) FUND else FUND2) - y0) / RR).toInt(); faqet.add(minOf(nxe, mbetur)); mbetur -= nxe; y0 = KOKA } while (mbetur > 0)
        return faqet
    }

    /** Dita kur u shtua afati (null kur s'dihet: afatet shumë të vjetra pa krijuarSe) */
    fun ditaEShtimit(a: Obj): java.time.LocalDate? {
        val k = (a["krijuarSe"] as? Number)?.toLong() ?: 0L
        return if (k > 0) java.time.Instant.ofEpochMilli(k).atZone(java.time.ZoneId.systemDefault()).toLocalDate() else null
    }
    /** Hyrja 81 (web v319): vlera e rreshtit "Ditët e skanimit": "Të gjitha", "16.11.2026", "12.11, 14.11, 16.11" ose "5 ditë" (si EX.tekstiDiteve) */
    fun tekstiDiteve(ditet: Collection<java.time.LocalDate>): String {
        val l = ditet.sorted()
        fun f(x: java.time.LocalDate) = "%02d.%02d".format(x.dayOfMonth, x.monthValue)
        return when {
            l.isEmpty() -> "Të gjitha"
            l.size == 1 -> f(l[0]) + "." + l[0].year
            l.size <= 3 -> l.joinToString(", ") { f(it) }
            else -> "${l.size} ditë"
        }
    }
    /** Sa afate u shtuan secilën ditë */
    fun numratEDiteve(l: List<Obj>): Map<java.time.LocalDate, Int> = l.mapNotNull { ditaEShtimit(it) }.groupingBy { it }.eachCount()
    /** Afatet sipas zgjedhjeve (bosh = pa e kufizuar); ditet: ditët e zgjedhura te kalendari; të hequrat s'hyjnë kurrë */
    fun filtro(te: List<Obj>, mu: String, ditet: Set<java.time.LocalDate>, f: String, paF: Boolean): List<Obj> = te.filter { a ->
        Afatet.statusi(a) != "hequr" && (ditet.isEmpty() || ditaEShtimit(a)?.let { it in ditet } == true) &&
            (mu.isEmpty() || Afatet.celesiMuajit(a) == mu) && (f.isEmpty() || paF || Afatet.celesiFurnizuesit(a) == f)
    }
    fun rendit(l: List<Obj>, r: String): List<Obj> {
        val k = Comparator<Obj> { a, b -> Afatet.krahaso(a, b) }
        return when (r) {
            "emri" -> l.sortedWith { a, b -> Afatet.KOLATORI.compare((a["emri"] as? String).orEmpty(), (b["emri"] as? String).orEmpty()).takeIf { it != 0 } ?: k.compare(a, b) }
            "furnizuesi" -> l.sortedWith { a, b ->
                val fa = Afatet.celesiFurnizuesit(a); val fb = Afatet.celesiFurnizuesit(b)
                when {
                    fa == fb -> k.compare(a, b)
                    fa == Afatet.PA_FURNIZUES -> 1
                    fb == Afatet.PA_FURNIZUES -> -1
                    else -> Afatet.KOLATORI.compare(jsString(a["furnizuesi"]).trim(), jsString(b["furnizuesi"]).trim())
                }
            }
            else -> l.sortedWith(k)
        }
    }

    /** info: pjesët e "Periudha: Të gjitha · 11 produkte · 80 copë" (true = e trashë); data lart djathtas dhe poshtë me orën */
    class Opsionet(val info: List<Pair<String, Boolean>>, val data: String, val ora: String)
    private class Kolona(val k: String, val t: String, val w: Float, val djathtas: Boolean = false)

    private class Vizatuesi(ctx: Context, val c: Canvas) {
        val f = EksportiFoto.fontet(ctx)
        // LINEAR_TEXT: shkronjat janë të vogla në njësi mm (~3); pa të Android-i i rrumbullakos gjerësitë dhe hapësirat dalin të çrregullta
        val p = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG or Paint.LINEAR_TEXT_FLAG)
        fun font(pt: Float, trashe: Boolean, hapesira: Float = 0f, numra: Boolean = false) {
            p.typeface = f.merr(false, if (trashe) 700 else 400)
            p.textSize = pt * PT
            p.letterSpacing = if (hapesira == 0f) 0f else hapesira / p.textSize
            p.fontFeatureSettings = if (numra) "tnum" else null
            p.style = Paint.Style.FILL
        }
        fun gjeresia(t: String) = p.measureText(t)
        fun nxe(t0: String, w: Float): String {
            var t = t0
            if (gjeresia(t) <= w) return t
            while (t.length > 1 && gjeresia("$t…") > w) t = t.dropLast(1)
            return t.trimEnd() + "…"
        }
        fun tekst(t: String, x: Float, y: Float, ngjyra: Int, djathtas: Boolean = false, qendra: Boolean = false) {
            p.color = ngjyra; p.textAlign = if (qendra) Paint.Align.CENTER else if (djathtas) Paint.Align.RIGHT else Paint.Align.LEFT
            c.drawText(t, x, y, p)
        }
        fun vije(x1: Float, y1: Float, x2: Float, y2: Float, w: Float, ngjyra: Int) {
            p.color = ngjyra; p.style = Paint.Style.STROKE; p.strokeWidth = w; p.strokeCap = Paint.Cap.ROUND
            c.drawLine(x1, y1, x2, y2, p); p.style = Paint.Style.FILL
        }
        fun drejtkendesh(x: Float, y: Float, w: Float, h: Float, ngjyra: Int, r: Float = 0f) {
            p.color = ngjyra; p.style = Paint.Style.FILL
            if (r > 0f) c.drawRoundRect(RectF(x, y, x + w, y + h), r, r, p) else c.drawRect(x, y, x + w, y + h, p)
        }
    }

    fun numri(v: Double) = if (v == floor(v)) v.toLong().toString() else v.toString()

    /** Vizaton faqen `faqja` (0 = e para) në Canvas-in me njësi mm (thirrësi e shkallëzon) */
    fun vizatoFaqen(ctx: Context, cv: Canvas, l: List<Obj>, o: Opsionet, paF: Boolean, faqja: Int) {
        val plani = plani(l.size)
        val ngaIdx = plani.take(faqja).sum()
        val k = plani[faqja]
        val v = Vizatuesi(ctx, cv)
        val X = MX; val WI = W - 2 * MX
        val kol = listOf(Kolona("nr", "#", 8f), Kolona("emri", "PRODUKTI", if (paF) 104f else 70f), Kolona("b", "BARKODI", 34f)) +
            (if (paF) emptyList() else listOf(Kolona("f", "FURNIZUESI", 34f))) +
            listOf(Kolona("s", "COPË", 18f, djathtas = true), Kolona("d", "SKADON", 20.6f))
        fun kokaETabeles(yb: Float) {
            var x = X
            v.font(7f, true, hapesira = 0.2f)
            kol.forEach { c -> v.tekst(c.t, if (c.djathtas) x + c.w - P_SASIA else x + 1.6f, yb, MUTED, c.djathtas); x += c.w }
            v.vije(X, yb + 2f, X + WI, yb + 2f, 0.26f, INK)
        }
        var y: Float
        if (faqja == 0) {
            with(EksportiFoto) { cv.logo(v.p, X, MESI - 2.1f, 4.2f, EksportiFoto.CELET) }
            v.font(8.6f, false); v.tekst(o.data, X + WI, MESI + 1.09f, MUTED, true)
            v.font(18f, true); v.tekst("Lista e afateve", W / 2, MESI - 1.56f, INK, qendra = true)
            var gj = 0f
            o.info.forEach { (t, tr) -> v.font(9f, tr); gj += v.gjeresia(t) }
            var xi = W / 2 - gj / 2
            o.info.forEach { (t, tr) -> v.font(9f, tr); v.tekst(t, xi, MESI + 5.72f, if (tr) INK else MUTED); xi += v.gjeresia(t) }
            kokaETabeles(34.6f); y = KOKA1
        } else {
            kokaETabeles(12.7f); y = KOKA // Hyrja 61: logoja, titulli dhe të dhënat vetëm te faqja 1
        }
        for (j in 0 until k) {
            val i = ngaIdx + j
            val a = l[i]
            if (i % 2 == 1) v.drejtkendesh(X, y + 0.15f, WI, RR - 0.15f, ZEBRA)
            val yb = y + 4.85f
            var x = X
            kol.forEach { c ->
                val px = x + 1.6f; val w = c.w - 3.2f
                when (c.k) {
                    "nr" -> { v.font(8.2f, false); v.tekst((i + 1).toString(), px, yb, FAINT) }
                    "emri" -> { v.font(8.6f, true); v.tekst(v.nxe((a["emri"] as? String)?.takeIf { it.isNotBlank() } ?: jsString(a["barkodi"] ?: "").ifEmpty { "Pa emër" }, w), px, yb, INK) }
                    "b" -> { v.font(8.6f, false, numra = true); v.tekst(v.nxe(jsString(a["barkodi"] ?: ""), w), px, yb, INK2) }
                    "f" -> { v.font(8.6f, false); v.tekst(v.nxe(jsString(a["furnizuesi"] ?: ""), w), px, yb, INK) }
                    "s" -> { v.font(8.6f, true); v.tekst(jsString(a["sasia"] ?: ""), x + c.w - P_SASIA, yb, INK, true) }
                    else -> { v.font(8.6f, true); v.tekst(if (jsString(a["data"] ?: "").isNotEmpty()) Afatet.formato(a["data"]) else "–", px, yb, INK) }
                }
                x += c.w
            }
            v.vije(X, y + RR, X + WI, y + RR, 0.2f, LINE2)
            y += RR
        }
        // Hyrja 79 (web v317, pronari: "hiqja krejt qeto mos le kurgjo ne fund te fletave"): asnjë tekst poshtë në asnjë faqe
    }

    /** PDF-ja (A4, 595 × 842 pt): bajtet */
    fun krijo(ctx: Context, l: List<Obj>, o: Opsionet, paF: Boolean): ByteArray {
        val dok = PdfDocument()
        try {
            plani(l.size).indices.forEach { f ->
                val faqja = dok.startPage(PdfDocument.PageInfo.Builder(595, 842, f + 1).create())
                faqja.canvas.scale(72f / 25.4f, 72f / 25.4f)
                vizatoFaqen(ctx, faqja.canvas, l, o, paF, f)
                dok.finishPage(faqja)
            }
            val out = ByteArrayOutputStream()
            dok.writeTo(out)
            return out.toByteArray()
        } finally { dok.close() }
    }

    /** Një faqe si foto (për testet dhe pamjet): gjerësia px, sfond i bardhë */
    fun faqjaSiFoto(ctx: Context, l: List<Obj>, o: Opsionet, paF: Boolean, faqja: Int, px: Int = 1240): Bitmap {
        val k = px / W
        val bmp = Bitmap.createBitmap(px, (297f * k).roundToInt(), Bitmap.Config.ARGB_8888)
        val cv = Canvas(bmp)
        cv.drawColor(Color.WHITE)
        cv.scale(k, k)
        vizatoFaqen(ctx, cv, l, o, paF, faqja)
        return bmp
    }
}

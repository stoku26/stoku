package site.stoku.vendas

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import androidx.core.content.FileProvider
import androidx.core.graphics.PathParser
import site.stoku.logjika.Afatet
import site.stoku.logjika.Obj
import site.stoku.logjika.jsString
import java.io.File
import java.util.Calendar
import kotlin.math.ceil
import kotlin.math.roundToInt

/**
 * Hyrja 35 (web v274, pronari "ideja 5"): afatet si foto JPG për furnizuesin, e errët ose e çelët sipas aplikacionit.
 * E njëjta pamje si `aefVizato` te app-tel.js: 540 njësi e gjerë × 2 = 1080 px, sa më shumë afate aq më e gjatë (krejt në një foto).
 * Ndryshoji bashkë.
 */
object EksportiFoto {
    /** Mbi kaq afate fotoja ndahet në pjesë (kujtesa e telefonit) */
    const val MAKS = 100
    private const val W = 540f
    private const val P = 20f
    private const val S = 2f

    class Ngjyrat(val bg: Int, val surface: Int, val line: Int, val line2: Int, val ink: Int, val ink2: Int, val muted: Int, val faint: Int,
                  val exp: Int, val near: Int, val ok: Int, val pillBg: Int, val pillTx: Int, val logo: Int, val markBg: Int, val markBar: Int) {
        fun sipas(k: String) = when (k) { "exp" -> exp; "near" -> near; else -> ok }
    }
    private fun c(h: Long) = (h or 0xFF000000L).toInt()
    val ERRET = Ngjyrat(c(0x0f1115), c(0x171a20), c(0x2a2e36), c(0x22262d), c(0xeceef2), c(0xc9ccd3), c(0x8f949e), c(0x6f747e),
        c(0xf07a6f), c(0xf0b95a), c(0x5cc98b), c(0x2a2414), c(0xf5b942), c(0xffffff), c(0xffffff), c(0x0f1115))
    val CELET = Ngjyrat(c(0xf6f5f2), c(0xffffff), c(0xe6e4df), c(0xe6e4df), c(0x14161b), c(0x3a3d44), c(0x7a7d85), c(0x8a8d94),
        c(0xc23a33), c(0xa45f10), c(0x2e7d4f), c(0xfcefd9), c(0xa45f10), c(0x14161b), c(0x14161b), c(0xffffff))
    private val VERDHE = c(0xf5b942)
    private val ZI = c(0x14161b)

    // Logoja (logo/stoku-logo.svg): shiritat e barkodit (x, gjerësia; i pesti i verdhë) dhe shkronjat "stoku"
    private val SHIRITAT = listOf(14f to 3f, 19f to 2f, 23f to 4f, 29f to 2f, 33f to 3f, 38f to 2f, 42f to 4f, 48f to 2f)
    private val SHKRONJAT = listOf("M76 20H65a5 5 0 0 0 0 10h6a5 5 0 0 1 0 10H60", "M91 12v23a5 5 0 0 0 5 5h3M86 20h11",
        "M140.5 12v28M152.5 20l-12 11M145 26.9l8.5 13.1", "M164.5 20v10a10 10 0 0 0 20 0M184.5 20v20")

    /** Ditët djathtas te çdo rresht: "−2 / ditë më parë", "Sot / skadon", "12 / ditë", "2 / muaj" */
    class Ditet(val m: String, val v: String, val k: String)
    fun ditet(a: Obj, tani: Long? = null): Ditet {
        val n = Afatet.ditetDeri(a["data"], tani) ?: return Ditet("–", "pa datë", "exp")
        return when {
            n < 0 -> Ditet("−" + (-n), "ditë më parë", "exp")
            n == 0 -> Ditet("Sot", "skadon", "exp")
            n >= 60 -> Ditet((n / 30.0).roundToInt().toString(), "muaj", "ok")
            else -> Ditet(n.toString(), "ditë", if (n <= 30) "near" else "ok")
        }
    }

    /**
     * Onest dhe JetBrains Mono janë fonte "variable": pesha (400–700) vendoset me boshtin 'wght' te Typeface.Builder (si Compose).
     * Skedari i fontit kopjohet një herë te cache/fontet (Builder-i do skedar); pa sukses: fonti i sistemit.
     */
    internal class Fontet(val ctx: Context) {
        fun merr(mono: Boolean, pesha: Int): Typeface = synchronized(KESH) {
            KESH.getOrPut((if (mono) "m" else "o") + pesha) {
                try {
                    val f = File(ctx.cacheDir, "fontet/" + (if (mono) "jetbrains_mono" else "onest") + ".ttf")
                    if (!f.exists() || f.length() == 0L) {
                        f.parentFile?.mkdirs()
                        ctx.resources.openRawResource(if (mono) R.font.jetbrains_mono else R.font.onest).use { i -> f.outputStream().use { i.copyTo(it) } }
                    }
                    Typeface.Builder(f).setFontVariationSettings("'wght' $pesha").build()
                } catch (e: Exception) { null } ?: if (mono) Typeface.MONOSPACE else Typeface.create(Typeface.SANS_SERIF, if (pesha >= 600) Typeface.BOLD else Typeface.NORMAL)
            }
        }
    }
    private val KESH = HashMap<String, Typeface>()
    internal fun fontet(ctx: Context) = Fontet(ctx.applicationContext ?: ctx)

    private fun Paint.font(f: Fontet, px: Float, pesha: Int, mono: Boolean = false, hapesira: Float = 0f) {
        typeface = f.merr(mono, pesha)
        textSize = px
        letterSpacing = hapesira / px // në em
    }

    /** Teksti në rreshta (deri në maks); i fundit me "…" kur s'nxë */
    private fun rreshtat(p: Paint, t: String, gjeresia: Float, maks: Int): List<String> {
        val rr = ArrayList<String>()
        var r = ""
        t.replace(Regex("\\s+"), " ").trim().split(" ").forEach { f ->
            val pr = if (r.isEmpty()) f else "$r $f"
            if (p.measureText(pr) <= gjeresia || r.isEmpty()) r = pr else { rr.add(r); r = f }
        }
        if (r.isNotEmpty()) rr.add(r)
        val l = if (rr.size > maks) rr.take(maks).toMutableList().also { it[maks - 1] = it[maks - 1] + "…" } else rr
        return l.map { x ->
            if (p.measureText(x) <= gjeresia) x else {
                var y = x.removeSuffix("…")
                while (y.length > 1 && p.measureText("$y…") > gjeresia) y = y.dropLast(1)
                y.trimEnd() + "…"
            }
        }
    }

    private fun Canvas.tekst(p: Paint, t: String, x: Float, qendra: Float, ngjyra: Int, djathtas: Boolean = false) {
        p.color = ngjyra
        p.textAlign = if (djathtas) Paint.Align.RIGHT else Paint.Align.LEFT
        val fm = p.fontMetrics
        drawText(t, x, qendra - (fm.ascent + fm.descent) / 2f, p)
    }
    private fun Canvas.kendi(p: Paint, x: Float, y: Float, w: Float, h: Float, r: Float, ngjyra: Int, vije: Boolean = false) {
        p.color = ngjyra
        p.style = if (vije) Paint.Style.STROKE else Paint.Style.FILL
        drawRoundRect(RectF(x, y, x + w, y + h), r, r, p)
        p.style = Paint.Style.FILL
    }

    /** Logoja "stoku" (shenja + shkronjat), e lartë h, me ngjyrën e shkronjave C.logo (edhe për PDF-në e afateve) */
    internal fun Canvas.logo(p: Paint, x: Float, y: Float, h: Float, C: Ngjyrat) {
        val k = h / 52f
        save(); translate(x, y); scale(k, k)
        save(); translate(0f, 4f); scale(0.6875f, 0.6875f)
        kendi(p, 0f, 0f, 64f, 64f, 15f, ZI)
        p.strokeWidth = 1.5f; kendi(p, 0.75f, 0.75f, 62.5f, 62.5f, 14.25f, 0x29FFFFFF, vije = true)
        SHIRITAT.forEachIndexed { i, (bx, bw) -> kendi(p, bx, 16f, bw, 32f, 1f, if (i == 4) VERDHE else -1) }
        restore()
        p.color = C.logo; p.style = Paint.Style.STROKE; p.strokeWidth = 5f
        p.strokeCap = Paint.Cap.ROUND; p.strokeJoin = Paint.Join.ROUND
        SHKRONJAT.forEach { d -> try { drawPath(PathParser.createPathFromPathData(d), p) } catch (e: Exception) { } }
        drawCircle(119.5f, 30f, 10f, p)
        p.style = Paint.Style.FILL
        restore()
    }
    private fun Canvas.shenja(p: Paint, x: Float, y: Float, s: Float, C: Ngjyrat) {
        val k = s / 64f
        save(); translate(x, y); scale(k, k)
        kendi(p, 0f, 0f, 64f, 64f, 15f, C.markBg)
        SHIRITAT.forEachIndexed { i, (bx, bw) -> kendi(p, bx, 16f, bw, 32f, 1f, if (i == 4) VERDHE else C.markBar) }
        restore()
    }

    private class Rreshti(val em: List<String>, val b: String, val info: String, val d: Ditet, val h: Float)

    /** Fotoja e një furnizuesi (afatet tashmë të renditura): 1080 px e gjerë */
    fun vizato(ctx: Context, titulli: String, meta: String, afatet: List<Obj>, erret: Boolean, data: String, ora: String, pjesa: String = "", tani: Long? = null): Bitmap {
        val C = if (erret) ERRET else CELET
        val f = fontet(ctx)
        val p = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG)
        val gjEmrit = W - 2 * P - 18 - 14 - 74 - 14
        p.font(f, 34f, 700, hapesira = -1f); val tit = rreshtat(p, titulli, W - 2 * P, 2)
        p.font(f, 14f, 400); val m = if (meta.isNotEmpty()) rreshtat(p, meta, W - 2 * P, 1)[0] else ""
        val rr = afatet.map { a ->
            p.font(f, 15.5f, 600)
            val em = rreshtat(p, (a["emri"] as? String)?.takeIf { it.isNotBlank() } ?: jsString(a["barkodi"] ?: "").ifEmpty { "Pa emër" }, gjEmrit, 2)
            val b = jsString(a["barkodi"] ?: "")
            p.font(f, 13f, 500)
            val info = rreshtat(p, listOf(Afatet.sasiaTekst(a), if (jsString(a["data"] ?: "").isNotEmpty()) Afatet.formato(a["data"]) else "Pa datë")
                .filter { it.isNotEmpty() }.joinToString(" · "), gjEmrit, 1)[0]
            Rreshti(em, b, info, ditet(a, tani), 13f + 20f * em.size + 3f + 17f + (if (b.isNotEmpty()) 19f else 0f) + 13f)
        }
        val nr = Afatet.numero(afatet, tani)
        var H = 28f + 30f + 26f + 14f + 8f + 36f * tit.size + (if (m.isNotEmpty()) 24f else 0f) + 22f + 82f + 14f
        rr.forEach { H += 8f + it.h }
        H += 24f + 1f + 16f + 18f + 24f
        val bmp = try { Bitmap.createBitmap((W * S).toInt(), ceil(H * S).toInt(), Bitmap.Config.ARGB_8888) }
            catch (e: OutOfMemoryError) { Bitmap.createBitmap((W * S).toInt(), ceil(H * S).toInt(), Bitmap.Config.RGB_565) }
        val cv = Canvas(bmp)
        cv.scale(S, S)
        cv.drawColor(C.bg)
        var y = 28f
        cv.logo(p, P, y, 30f, C)
        p.font(f, 12f, 600); val dw = p.measureText(data) + 22f
        cv.kendi(p, W - P - dw, y + 2f, dw, 26f, 13f, C.pillBg)
        cv.tekst(p, data, W - P - 11f, y + 15f, C.pillTx, djathtas = true)
        y += 30f + 26f
        p.font(f, 11f, 700, hapesira = 1.32f); cv.tekst(p, "AFATET E PRODUKTEVE", P, y + 7f, C.muted)
        y += 14f + 8f
        p.font(f, 34f, 700, hapesira = -1f); tit.forEach { cv.tekst(p, it, P, y + 18f, C.ink); y += 36f }
        if (m.isNotEmpty()) { y += 6f; p.font(f, 14f, 400); cv.tekst(p, m, P, y + 9f, C.muted); y += 18f }
        y += 22f
        cv.kendi(p, P + 0.5f, y + 0.5f, W - 2 * P - 1f, 81f, 20f, C.surface)
        p.strokeWidth = 1f; cv.kendi(p, P + 0.5f, y + 0.5f, W - 2 * P - 1f, 81f, 20f, C.line, vije = true)
        val kw = (W - 2 * P) / 3f
        listOf(Triple(nr.skaduar + nr.paDate, "Të skaduara", C.exp), Triple(nr.afer, "Afër skadimit", C.near), Triple(nr.ok, "Në rregull", C.ok)).forEachIndexed { i, (v, t, ng) ->
            val x = P + kw * i
            if (i > 0) { p.color = C.line; cv.drawRect(x, y + 1f, x + 1f, y + 81f, p) }
            p.font(f, 30f, 700, hapesira = -0.9f); cv.tekst(p, v.toString(), x + 16f, y + 16f + 15f, ng)
            p.font(f, 12.5f, 500); cv.tekst(p, t, x + 16f, y + 16f + 30f + 6f + 8f, C.muted)
        }
        y += 82f + 14f
        rr.forEach { r ->
            y += 8f
            val x = P; val w = W - 2 * P
            cv.save()
            cv.clipPath(Path().apply { addRoundRect(RectF(x, y, x + w, y + r.h), 16f, 16f, Path.Direction.CW) })
            cv.kendi(p, x, y, w, r.h, 16f, C.surface)
            cv.kendi(p, x - 4f, y, 8f, r.h, 4f, C.sipas(r.d.k))
            cv.restore()
            p.strokeWidth = 1f; cv.kendi(p, x + 0.5f, y + 0.5f, w - 1f, r.h - 1f, 15.5f, C.line2, vije = true)
            var ty = y + 13f
            p.font(f, 15.5f, 600); r.em.forEach { cv.tekst(p, it, x + 18f, ty + 10f, C.ink); ty += 20f }
            ty += 3f; p.font(f, 13f, 500); cv.tekst(p, r.info, x + 18f, ty + 8.5f, C.ink2); ty += 17f
            if (r.b.isNotEmpty()) { ty += 3f; p.font(f, 12.5f, 500); p.fontFeatureSettings = "tnum"; cv.tekst(p, r.b, x + 18f, ty + 8f, C.faint); p.fontFeatureSettings = null } // Onest: zeroja pa pikë
            val q = y + r.h / 2f
            p.font(f, 18f, 700, hapesira = -0.36f); cv.tekst(p, r.d.m, x + w - 14f, q - 9f, C.sipas(r.d.k), djathtas = true)
            p.font(f, 11.5f, 500); cv.tekst(p, r.d.v, x + w - 14f, q + 11f, C.muted, djathtas = true)
            y += r.h
        }
        y += 24f
        p.color = C.line; cv.drawRect(P, y, W - P, y + 1f, p)
        y += 1f + 16f
        cv.shenja(p, P, y, 18f, C)
        p.font(f, 12f, 500); cv.tekst(p, "Krijuar me Stoku · stoku.site", P + 26f, y + 9f, C.faint)
        cv.tekst(p, (if (pjesa.isNotEmpty()) "$pjesa · " else "") + "ora $ora", W - P, y + 9f, C.faint, djathtas = true)
        return bmp
    }

    private fun dy(n: Int) = (if (n < 10) "0" else "") + n

    /**
     * Fotot JPG (në cache/eksportet): një për secilin furnizues te `grupet` (null = merchandiseri: të gjitha afatet në një foto me titullin `titulliPa`).
     * `te` = afatet aktive të renditura. Mbi MAKS afate: "Pjesa 1 nga 2"…
     */
    fun krijo(ctx: Context, te: List<Obj>, grupet: List<Afatet.Furnizuesi>?, titulliPa: String, meta: String, erret: Boolean): List<File> {
        val k = Calendar.getInstance()
        val data = dy(k.get(Calendar.DAY_OF_MONTH)) + "." + dy(k.get(Calendar.MONTH) + 1) + "." + k.get(Calendar.YEAR)
        val ora = dy(k.get(Calendar.HOUR_OF_DAY)) + ":" + dy(k.get(Calendar.MINUTE))
        val dita = k.get(Calendar.YEAR).toString() + "-" + dy(k.get(Calendar.MONTH) + 1) + "-" + dy(k.get(Calendar.DAY_OF_MONTH))
        val dir = File(ctx.cacheDir, "eksportet").apply { mkdirs() }
        dir.listFiles()?.forEach { if (System.currentTimeMillis() - it.lastModified() > 86400000L) it.delete() }
        val dalja = ArrayList<File>()
        val lista: List<Pair<String, List<Obj>>> = grupet?.map { g -> g.emri to te.filter { Afatet.celesiFurnizuesit(it) == g.celes } } ?: listOf(titulliPa to te)
        lista.forEach { (emri, l) ->
            val np = (l.size + MAKS - 1) / MAKS
            for (i in 0 until np) {
                val bmp = vizato(ctx, emri, meta, l.subList(i * MAKS, minOf(l.size, (i + 1) * MAKS)), erret, data, ora, if (np > 1) "Pjesa ${i + 1} nga $np" else "")
                val file = File(dir, Skedaret.pastroEmrin("afatet_" + Eksportet.sluguFolderit(emri) + "_" + dita + (if (np > 1) "_${i + 1}" else "") + ".jpg"))
                file.outputStream().use { bmp.compress(Bitmap.CompressFormat.JPEG, 90, it) }
                bmp.recycle()
                dalja.add(file)
            }
        }
        return dalja
    }

    /** Menyja "Ndaj" e Android-it (Viber, WhatsApp…) me një ose disa foto */
    fun ndaj(ctx: Context, skedaret: List<File>, titulli: String) {
        if (skedaret.isEmpty()) return
        val uris = ArrayList(skedaret.map { FileProvider.getUriForFile(ctx, ctx.packageName + ".skedaret", it) })
        val i = if (uris.size == 1) Intent(Intent.ACTION_SEND).apply { putExtra(Intent.EXTRA_STREAM, uris[0]) }
            else Intent(Intent.ACTION_SEND_MULTIPLE).apply { putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris) }
        i.type = "image/jpeg"
        i.putExtra(Intent.EXTRA_SUBJECT, titulli)
        i.clipData = ClipData.newRawUri(null, uris[0]).apply { uris.drop(1).forEach { addItem(ClipData.Item(it)) } }
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        ctx.startActivity(Intent.createChooser(i, titulli).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}

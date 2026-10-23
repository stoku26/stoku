package site.stoku.vendas

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import site.stoku.logjika.Afatet
import site.stoku.logjika.Json
import site.stoku.logjika.MObj
import site.stoku.logjika.siListe
import site.stoku.logjika.siObj
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * "Fotografo fletën" (si pergatitFoton + lexoMeAI te afatet.js): fotoja e fletës me afate → JPEG sa më i madh (kufijtë e
 * web-it) → Worker-i stoku-afatet (AI) → rreshtat (barkodi, emri, data, sasia, furnizuesi), të pastruar si te web-i.
 */
object LeximiAI {
    private const val AI_URL = "https://stoku-afatet.mendurb.workers.dev"
    private const val PIKSELA_MAKS = 16777216.0      // 4096×4096, si te web-i
    private const val ANA_MAKS = 8192.0
    private const val BASE64_MAKS = 14 * 1024 * 1024 // ≈ 10 MB JPEG (Worker-i pranon deri 16 MB)

    class Foto(val base64: String, val gjeresia: Int, val lartesia: Int, val pamja: Bitmap)
    sealed class Rez {
        class Ok(val rreshtat: List<MObj>) : Rez()
        class Gabim(val kodi: String) : Rez()
    }

    val MESAZHET = mapOf(
        "pa-konfigurim" to "Leximi automatik me AI s'është aktivizuar ende. Shkruaji rreshtat me dorë duke parë foton (prek foton për ta zmadhuar).",
        "pa-hyrje" to "Për leximin me AI duhet të jesh i kyçur në llogari (Cilësimet → Llogaria). Deri atëherë, shkruaji rreshtat me dorë.",
        "rrjeti" to "S'ka lidhje me internetin. Shkruaji rreshtat me dorë ose provo përsëri më vonë.",
        "foto-shume-e-madhe" to "Fotoja është shumë e madhe. Provo përsëri.",
        "pa-celes" to "Leximi me AI s'është konfiguruar plotësisht (mungon çelësi API në Worker). Shkruaji rreshtat me dorë.",
        "ai" to "Shërbimi i AI-së s'u përgjigj për momentin. Provo përsëri pas pak, ose shkruaji rreshtat me dorë.",
        "origjina" to "Kjo adresë nuk lejohet nga shërbimi i leximit. Shkruaji rreshtat me dorë."
    )

    fun mesazhi(kodi: String) = MESAZHET[kodi] ?: "Fleta s'u lexua ($kodi). Provo një foto më të qartë, ose shkruaji rreshtat me dorë."

    /** Fotoja (nga kamera ose galeria) → JPEG në rezolucionin më të madh që lejohet, e kthyer drejt (EXIF) */
    suspend fun pergatitFoton(ctx: Context, uri: Uri): Foto = withContext(Dispatchers.IO) {
        val cr = ctx.contentResolver
        val kufijte = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        cr.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, kufijte) } ?: throw IOException("foto-e-palexueshme")
        val w = kufijte.outWidth; val h = kufijte.outHeight
        if (w <= 0 || h <= 0) throw IOException("foto-e-palexueshme")
        val k = min(1.0, min(ANA_MAKS / max(w, h), sqrt(PIKSELA_MAKS / (w.toDouble() * h))))
        var hapi = 1
        while (w / (hapi * 2) >= w * k && h / (hapi * 2) >= h * k) hapi *= 2
        val rrotullimi = try { cr.openInputStream(uri)?.use { ExifInterface(it).rotationDegrees } ?: 0 } catch (e: Exception) { 0 }
        var bm = dekodo(ctx, uri, hapi)
        val tw = max(1, floor(w * k).toInt()); val th = max(1, floor(h * k).toInt())
        if (bm.width > tw || bm.height > th) bm = Bitmap.createScaledBitmap(bm, tw, th, true)
        if (rrotullimi != 0) bm = Bitmap.createBitmap(bm, 0, 0, bm.width, bm.height, Matrix().apply { postRotate(rrotullimi.toFloat()) }, true)
        // Cilësia e lartë; ulet (pastaj zvogëlohet) vetëm kur kalon kufirin e madhësisë, si te web-i
        val provat = listOf(1.0 to 95, 1.0 to 90, 1.0 to 85, 0.85 to 88, 0.7 to 88, 0.55 to 88)
        var foto: Foto? = null
        for ((i, p) in provat.withIndex()) {
            val b = if (p.first < 1.0) Bitmap.createScaledBitmap(bm, max(1, (bm.width * p.first).toInt()), max(1, (bm.height * p.first).toInt()), true) else bm
            val dalja = ByteArrayOutputStream()
            b.compress(Bitmap.CompressFormat.JPEG, p.second, dalja)
            val base64 = Base64.encodeToString(dalja.toByteArray(), Base64.NO_WRAP)
            if (base64.length <= BASE64_MAKS || i == provat.size - 1) { foto = Foto(base64, b.width, b.height, pamja(b)); break }
        }
        foto!!
    }

    private fun dekodo(ctx: Context, uri: Uri, hapi: Int): Bitmap {
        fun prova(h: Int, cfg: Bitmap.Config) = ctx.contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = h; inPreferredConfig = cfg })
        }
        // Telefonat me pak memorie: provo sërish me gjysmën e madhësisë
        return try { prova(hapi, Bitmap.Config.ARGB_8888) } catch (e: OutOfMemoryError) { prova(hapi * 2, Bitmap.Config.RGB_565) }
            ?: throw IOException("foto-e-palexueshme")
    }

    /** Kopje e vogël për ta parë në ekran (jo për AI) */
    private fun pamja(b: Bitmap): Bitmap {
        val s = min(1.0, 1600.0 / max(b.width, b.height))
        return if (s < 1.0) Bitmap.createScaledBitmap(b, max(1, (b.width * s).toInt()), max(1, (b.height * s).toInt()), true) else b
    }

    /** Vetëm për testet e pamjeve: përgjigjja e AI-së pa rrjet */
    var lexoPerProve: (suspend (Foto) -> Rez)? = null

    /** POST te Worker-i: { image, mime, sot } me tokenin e llogarisë → rreshtat (normalizoRreshtin) */
    suspend fun lexo(foto: Foto): Rez = withContext(Dispatchers.IO) {
        lexoPerProve?.let { return@withContext it(foto) }
        val u = (try { FirebaseAuth.getInstance().currentUser } catch (e: Exception) { null }) ?: return@withContext Rez.Gabim("pa-hyrje")
        val tokeni = try { u.getIdToken(false).await().token } catch (e: Exception) { null }
        try {
            val c = URL(AI_URL).openConnection() as HttpURLConnection
            c.requestMethod = "POST"
            c.doOutput = true
            c.connectTimeout = 20000
            c.readTimeout = 120000
            c.setRequestProperty("Content-Type", "application/json")
            c.setRequestProperty("Authorization", if (tokeni != null) "Bearer $tokeni" else "")
            // Worker-i pranon kërkesat e Stoku-t (si aplikacioni web dhe aplikacioni tel/ me WebView)
            c.setRequestProperty("Origin", "https://stoku.site")
            val koka = "{\"image\":\"".toByteArray()
            val bishti = ("\",\"mime\":\"image/jpeg\",\"sot\":\"" + Afatet.sot() + "\"}").toByteArray()
            val trupi = foto.base64.toByteArray(Charsets.US_ASCII)
            c.setFixedLengthStreamingMode(koka.size + trupi.size + bishti.size)
            c.outputStream.use { it.write(koka); it.write(trupi); it.write(bishti) }
            val kodi = c.responseCode
            val tekst = try { (if (kodi in 200..299) c.inputStream else c.errorStream)?.bufferedReader()?.use { it.readText() } } catch (e: Exception) { null }
            c.disconnect()
            val j = Json.lexoOse(tekst).siObj()
            if (kodi !in 200..299) return@withContext Rez.Gabim((j?.get("gabim") as? String)?.ifEmpty { null } ?: "http-$kodi")
            Rez.Ok(j?.get("rreshtat").siListe().map { Afatet.normalizoRreshtin(it) }.filter {
                (it["barkodi"] as String).isNotEmpty() || (it["emri"] as String).isNotEmpty() || (it["data"] as String).isNotEmpty()
            })
        } catch (e: Exception) {
            Rez.Gabim("rrjeti")
        }
    }
}

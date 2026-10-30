package site.stoku.vendas

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ImageDecoder
import android.graphics.Paint
import android.graphics.Rect
import android.net.Uri
import android.os.Build
import android.util.LruCache
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import site.stoku.logjika.Json
import site.stoku.logjika.siObj
import java.io.ByteArrayOutputStream
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Fotot e profilit (si Fotot te ekipa.js): ruhen te Worker-i (Cloudflare KV), jo te Firebase. Indeksi { uid: koha } mbahet
 * edhe në telefon, që fotot të dalin menjëherë; vetë fotot ruhen në cache (cacheDir/fotot). Katror 256×256, JPEG.
 */
object Fotot {
    private const val MASA = 256
    private const val CILESIA = 82
    private val _indeksi = MutableStateFlow(lexoIndeksin())
    val indeksi: StateFlow<Map<String, Long>> get() = _indeksi
    private val kujtesa = LruCache<String, Bitmap>(48)
    private var marreSe = 0L
    /** null kur Firebase s'është gati (p.sh. testet e pamjeve) */
    private fun auth(): FirebaseAuth? = try { FirebaseAuth.getInstance() } catch (e: Exception) { null }

    private fun lexoIndeksin(): Map<String, Long> = try {
        Json.lexo(StokuApp.prefsOse("fotot_indeksi", "{}")).siObj()?.mapNotNull { (k, v) -> (v as? Number)?.toLong()?.let { k to it } }?.toMap() ?: emptyMap()
    } catch (e: Exception) { emptyMap() }

    private fun vendosIndeksin(ind: Map<String, Long>) {
        if (ind == _indeksi.value) return
        _indeksi.value = ind
        StokuApp.vendosPref("fotot_indeksi", Json.shkruaj(ind))
    }

    fun kaFoto(uid: String?): Boolean = uid != null && _indeksi.value[uid] != null

    /** Llogaria sipas emrit (si `Fotot.apliko(el, emri)` te ekipa.js): anëtarët e grupit, unë, llogaritë e administratorit */
    fun uidPerEmrin(emri: String?): String? {
        val e = emri?.trim()?.lowercase() ?: return null
        if (e.isEmpty()) return null
        Grupi.anetaret.value.firstOrNull { (it["emri"] as? String)?.trim()?.lowercase() == e }?.let { a -> (a["uid"] as? String)?.ifEmpty { null }?.let { return it } }
        Llogaria.perdoruesi.value?.let { if (it.emri.trim().lowercase() == e) return it.uid }
        return Admini.llogarite.value?.firstOrNull { it.emri.trim().lowercase() == e }?.uid
    }

    private fun url(uid: String, v: Long) = Push.URL_PUSH + "/foto/" + URLEncoder.encode(uid, "UTF-8") + "?v=" + v

    /** Fotoja e një llogarie (nga kujtesa, cache-i ose serveri); null kur s'ka foto */
    suspend fun foto(ctx: Context, uid: String): Bitmap? {
        val v = _indeksi.value[uid] ?: return null
        val k = "$uid@$v"
        kujtesa.get(k)?.let { return it }
        return withContext(Dispatchers.IO) {
            val dosja = File(ctx.cacheDir, "fotot").apply { mkdirs() }
            val baza = uid.replace(Regex("[^A-Za-z0-9_-]"), "_")
            val sk = File(dosja, baza + "_" + v + ".jpg")
            var b = if (sk.exists()) BitmapFactory.decodeFile(sk.path) else null
            if (b == null) try {
                val c = URL(url(uid, v)).openConnection() as HttpURLConnection
                c.connectTimeout = 15000; c.readTimeout = 20000
                if (c.responseCode in 200..299) {
                    val bajtet = c.inputStream.use { it.readBytes() }
                    b = BitmapFactory.decodeByteArray(bajtet, 0, bajtet.size)
                    if (b != null) {
                        dosja.listFiles()?.filter { it.name.startsWith(baza + "_") }?.forEach { it.delete() } // versionet e vjetra
                        sk.writeBytes(bajtet)
                    }
                }
            } catch (e: Exception) { /* pa internet */ }
            b?.also { kujtesa.put(k, it) }
        }
    }

    private suspend fun thirr(metoda: String, rruga: String, trup: ByteArray?): Map<String, Any?> = withContext(Dispatchers.IO) {
        try {
            val token = withTimeoutOrNull(15000) { auth()?.currentUser?.getIdToken(false)?.await()?.token }
                ?: return@withContext mapOf("ok" to false, "arsye" to "pa-hyrje")
            val c = URL(Push.URL_PUSH + rruga).openConnection() as HttpURLConnection
            c.connectTimeout = 15000; c.readTimeout = 25000
            c.requestMethod = metoda
            c.setRequestProperty("Authorization", "Bearer $token")
            if (trup != null) { c.doOutput = true; c.setRequestProperty("Content-Type", "image/jpeg"); c.outputStream.use { it.write(trup) } }
            val kodi = c.responseCode
            val tekst = (if (kodi in 200..299) c.inputStream else c.errorStream)?.use { it.readBytes().toString(Charsets.UTF_8) } ?: ""
            val j = try { Json.lexo(tekst).siObj() ?: emptyMap() } catch (e: Exception) { emptyMap() }
            if (kodi !in 200..299 && j["arsye"] == null) j + ("arsye" to "http-$kodi") else j
        } catch (e: Exception) { mapOf("ok" to false, "arsye" to "rrjeti") }
    }

    /** Indeksi i fotove (GET /fotot), jo më shpesh se një herë në 10 minuta (përveç kur detyrohet) */
    suspend fun rifresko(detyro: Boolean = false) {
        if (auth()?.currentUser == null) return
        if (!detyro && System.currentTimeMillis() - marreSe < 10 * 60000) return
        marreSe = System.currentTimeMillis()
        val j = thirr("GET", "/fotot", null)
        if (j["ok"] == true) vendosIndeksin(j["fotot"].siObj()?.mapNotNull { (k, v) -> (v as? Number)?.toLong()?.let { k to it } }?.toMap() ?: emptyMap())
        else marreSe = 0
    }

    private fun ndryshoNjeren(uid: String, koha: Long) {
        val ind = LinkedHashMap(_indeksi.value)
        if (koha > 0) ind[uid] = koha else ind.remove(uid)
        vendosIndeksin(ind)
    }

    /** Fotoja e zgjedhur → katror 256×256 (prerë në mes, sfond i bardhë), JPEG */
    fun pergatit(ctx: Context, uri: Uri): ByteArray? = try {
        val burimi: Bitmap? = if (Build.VERSION.SDK_INT >= 28) {
            ImageDecoder.decodeBitmap(ImageDecoder.createSource(ctx.contentResolver, uri)) { d, info, _ ->
                val m = minOf(info.size.width, info.size.height)
                if (m > 1024) d.setTargetSampleSize(m / 1024)
                d.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            }
        } else {
            // v270: Android 8 (pa ImageDecoder): leximi me hapa (inSampleSize), që fotoja e madhe e kamerës të mos e mbushë
            // memorien (OutOfMemoryError e rrëzonte aplikacionin)
            val kufijte = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            ctx.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, kufijte) }
            var hapi = 1
            while (minOf(kufijte.outWidth, kufijte.outHeight) / (hapi * 2) >= 1024) hapi *= 2
            ctx.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = hapi }) }
        }
        burimi?.let { b ->
            val m = minOf(b.width, b.height)
            val dalja = Bitmap.createBitmap(MASA, MASA, Bitmap.Config.ARGB_8888)
            val c = Canvas(dalja)
            c.drawColor(Color.WHITE)
            c.drawBitmap(b, Rect((b.width - m) / 2, (b.height - m) / 2, (b.width - m) / 2 + m, (b.height - m) / 2 + m), Rect(0, 0, MASA, MASA), Paint(Paint.FILTER_BITMAP_FLAG))
            ByteArrayOutputStream().use { o -> dalja.compress(Bitmap.CompressFormat.JPEG, CILESIA, o); o.toByteArray() }
        }
    } catch (e: Exception) { null } catch (e: OutOfMemoryError) { null }

    /** → null (u ruajt) ose arsyeja: "jo-foto" | "madhesia" | "pa-hyrje" | "mungon-kv" | "rrjeti" | … */
    suspend fun ngarko(ctx: Context, uri: Uri): String? {
        val uid = auth()?.currentUser?.uid ?: return "pa-hyrje"
        val b = withContext(Dispatchers.Default) { pergatit(ctx, uri) } ?: return "jo-foto"
        val j = thirr("PUT", "/foto", b)
        if (j["ok"] != true) return (j["arsye"] as? String) ?: "gabim"
        ndryshoNjeren(uid, (j["koha"] as? Number)?.toLong() ?: System.currentTimeMillis())
        return null
    }

    suspend fun hiq(): String? {
        val uid = auth()?.currentUser?.uid ?: return "pa-hyrje"
        val j = thirr("DELETE", "/foto", null)
        if (j["ok"] != true) return (j["arsye"] as? String) ?: "gabim"
        ndryshoNjeren(uid, 0)
        return null
    }

    fun tekstiGabimit(a: String): String = when (a) {
        "jo-foto" -> "Ky skedar nuk është foto."
        "madhesia" -> "Fotoja është shumë e madhe."
        "pa-hyrje" -> "Hyr në llogari për të vendosur foto."
        "mungon-kv" -> "Fotot ende s'janë aktivizuar në server."
        else -> "Fotoja nuk u ruajt. Kontrollo internetin dhe provo sërish."
    }
}

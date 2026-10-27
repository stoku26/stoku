package site.stoku.vendas

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.Blob
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeout
import java.io.File

/** Një skedar i gatshëm për t'u dërguar/ruajtur (Excel, PDF) */
class Skedari(val bajtet: ByteArray, val emri: String, val mime: String, val titulli: String)

/*
 * Skedarët që telefoni ia dërgon PC-së së së njëjtës llogari ("Dërgo në PC"), si skedaret.js:
 *   dyqane/{uid}/skedaret/{id}          → { emri, lloji, titulli, pajisja, madhesia, pjeset, krijuarSe, skadon }
 *   dyqane/{uid}/skedaret/{id}/pjeset/  → 000, 001, … = { i, b } (b: Bytes, deri në 900 KB)
 * Copat shkruhen të parat dhe dokumenti me të dhënat i fundit (PC-ja e sheh skedarin vetëm kur është i plotë).
 * Edhe "Ruaje në telefon" (Shkarkimet) dhe "Ndaje" (WhatsApp, email, Drive…) janë këtu.
 */
object Skedaret {
    private const val COPA = 900 * 1024
    private const val MAKS = 15 * 1024 * 1024
    private const val DITE_MBAJTJE = 7
    private const val AFATI_SHKRIMIT = 45000L

    fun llojiISkedarit(emri: String): String = Regex("\\.([a-z0-9]{1,6})$", RegexOption.IGNORE_CASE).find(emri)?.groupValues?.get(1)?.lowercase() ?: ""

    /** Pa shenja që s'lejohen në Windows/Android, maksimumi 150 shenja */
    fun pastroEmrin(emri: String): String {
        var s = emri.replace(Regex("[/\\\\:*?\"<>|\\u0000-\\u001f]+"), "_").replace(Regex("^[\\s.]+|[\\s.]+$"), "")
        if (s.length > 150) {
            val l = llojiISkedarit(s)
            s = s.take(150 - (if (l.isNotEmpty()) l.length + 1 else 0)).replace(Regex("[\\s.]+$"), "") + (if (l.isNotEmpty()) ".$l" else "")
        }
        return s.ifEmpty { "skedar" }
    }

    fun madhesiaTekst(n: Int): String = when {
        n < 1024 -> "$n B"
        n < 1024 * 1024 -> "${maxOf(1, Math.round(n / 1024.0).toInt())} KB"
        else -> String.format(java.util.Locale.ROOT, "%.1f", n / (1024.0 * 1024.0)).replace('.', ',') + " MB"
    }

    /** "Dërgo në PC" ka kuptim vetëm me lejet "Dërgo skedarët në PC" dhe "Stoku në kompjuter" */
    fun lejaDergoNePc(): Boolean = Llogaria.leja("dergoNePc") && Llogaria.leja("pc")
    fun kaLlogari(): Boolean = try { FirebaseAuth.getInstance().currentUser != null } catch (e: Exception) { false }

    class Rezultati(val ok: Boolean, val arsye: String = "")

    /** Dërgimi vazhdon edhe kur mbyllet dritarja (rezultati del si njoftim) */
    val fusha = kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.SupervisorJob() + kotlinx.coroutines.Dispatchers.Main + StokuApp.trajtuesi(true))

    fun kaInternet(ctx: Context): Boolean = try {
        val cm = ctx.getSystemService(android.net.ConnectivityManager::class.java)
        cm?.getNetworkCapabilities(cm.activeNetwork)?.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
    } catch (e: Exception) { true }

    suspend fun dergoNePc(sk: Skedari): Rezultati {
        val uid = try { FirebaseAuth.getInstance().currentUser?.uid } catch (e: Exception) { null } ?: return Rezultati(false, "pa-hyrje")
        val b = sk.bajtet
        if (b.isEmpty()) return Rezultati(false, "bosh")
        if (b.size > MAKS) return Rezultati(false, "i-madh")
        val db = FirebaseFirestore.getInstance()
        val kol = db.collection("dyqane").document(uid).collection("skedaret")
        val ref = kol.document() // id i ri
        val n = (b.size + COPA - 1) / COPA
        val tani = System.currentTimeMillis()
        val emri = pastroEmrin(sk.emri)
        fun copa(i: Int) = ref.collection("pjeset").document(("00$i").takeLast(3))
        return try {
            for (i in 0 until n) {
                val te = b.copyOfRange(i * COPA, minOf(b.size, (i + 1) * COPA))
                withTimeout(AFATI_SHKRIMIT) { copa(i).set(mapOf("i" to i.toLong(), "b" to Blob.fromBytes(te))).await() }
            }
            withTimeout(AFATI_SHKRIMIT) {
                ref.set(mapOf(
                    "emri" to emri, "lloji" to llojiISkedarit(emri), "titulli" to sk.titulli.take(80),
                    "pajisja" to (if (Opsionet.pda.value) "PDA" else "Telefoni"), "madhesia" to b.size.toLong(), "pjeset" to n.toLong(),
                    "krijuarSe" to tani, "skadon" to tani + DITE_MBAJTJE * 86400000L
                )).await()
            }
            Rezultati(true)
        } catch (e: Exception) {
            // Copat e shkruara fshihen (fshirjet radhiten pas shkrimeve që ende presin)
            try { ref.delete() } catch (e2: Exception) { }
            for (j in 0 until n) try { copa(j).delete() } catch (e3: Exception) { }
            val leje = e is FirebaseFirestoreException && e.code == FirebaseFirestoreException.Code.PERMISSION_DENIED
            Rezultati(false, if (leje) "leje" else if (e is TimeoutCancellationException) "afati" else "rrjeti")
        }
    }

    private fun neCache(ctx: Context, sk: Skedari): File {
        val dir = File(ctx.cacheDir, "eksportet").apply { mkdirs() }
        dir.listFiles()?.forEach { if (System.currentTimeMillis() - it.lastModified() > 86400000L) it.delete() } // të vjetrat (> 1 ditë)
        return File(dir, pastroEmrin(sk.emri)).apply { writeBytes(sk.bajtet) }
    }

    /** Menyja "Ndaj" e Android-it (WhatsApp, Gmail, Drive, Viber…) */
    fun ndaj(ctx: Context, sk: Skedari) {
        val f = neCache(ctx, sk)
        val uri = FileProvider.getUriForFile(ctx, ctx.packageName + ".skedaret", f)
        val i = Intent(Intent.ACTION_SEND).apply {
            type = sk.mime
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, sk.titulli.ifEmpty { sk.emri })
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        ctx.startActivity(Intent.createChooser(i, sk.titulli.ifEmpty { sk.emri }).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    /** Android 10+: direkt te "Shkarkimet" (Downloads), pa leje. Më i vjetër: s'ka (thirrësi pyet ku ta ruajë). */
    fun mundTeShkarkimet(): Boolean = Build.VERSION.SDK_INT >= 29

    fun ruajTeShkarkimet(ctx: Context, sk: Skedari): Boolean {
        if (Build.VERSION.SDK_INT < 29) return false
        return try {
            val cv = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, pastroEmrin(sk.emri))
                put(MediaStore.MediaColumns.MIME_TYPE, sk.mime)
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val r = ctx.contentResolver
            val uri = r.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv) ?: return false
            r.openOutputStream(uri)?.use { it.write(sk.bajtet) } ?: return false
            cv.clear(); cv.put(MediaStore.MediaColumns.IS_PENDING, 0)
            r.update(uri, cv, null, null)
            true
        } catch (e: Exception) { false }
    }

    /** Shkruan skedarin te vendi që zgjodhi përdoruesi ("Ruaj si…", Android 8 dhe 9) */
    fun shkruajTe(ctx: Context, uri: android.net.Uri, sk: Skedari): Boolean = try {
        ctx.contentResolver.openOutputStream(uri)?.use { it.write(sk.bajtet) } != null
    } catch (e: Exception) { false }
}

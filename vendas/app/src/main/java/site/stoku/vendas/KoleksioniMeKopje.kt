package site.stoku.vendas

import android.os.Handler
import android.os.Looper
import com.google.firebase.firestore.AggregateSource
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.MetadataChanges
import com.google.firebase.firestore.Query
import site.stoku.logjika.Json
import site.stoku.logjika.Obj
import site.stoku.logjika.me
import site.stoku.logjika.numerOse0
import site.stoku.logjika.siObj
import java.io.File
import java.util.concurrent.Executors

/**
 * Koleksion i përbashkët me kopje në telefon (si degjoMeKopje te ekipa.js, v252): Firebase numëron çdo dokument të lexuar,
 * prandaj sa hapet Stoku lexohen vetëm dokumentet e ndryshuara pas sinkronizimit të fundit (`ndryshuarSe`, me 1 orë
 * rezervë për orët e pasakta të telefonave), jo krejt koleksioni. Lista del menjëherë nga kopja (edhe pa internet).
 * Fshirjet: numri i dokumenteve te serveri (count) ndryshe nga kopja → lexim i plotë; krejt koleksioni lexohet edhe një
 * herë në 24 orë. cb(lista, serveri): serveri = lista e plotë nga serveri.
 */
class KoleksioniMeKopje(private val skedari: File, private val pronari: String? = null) {
    private class Kopja(val docs: LinkedHashMap<String, Obj>, val plotaSe: Long, var sinkSe: Long)

    private var kopja: Kopja? = lexo()
    private val shkruesi = Executors.newSingleThreadExecutor()

    private fun lexo(): Kopja? = try {
        val x = if (skedari.exists()) Json.lexo(skedari.readText()).siObj() else null
        val docs = x?.get("docs").siObj()
        if (x == null || x["v"] != 1L || docs == null || (pronari != null && x["pronari"] != pronari)) null
        else Kopja(LinkedHashMap<String, Obj>().also { m -> docs.forEach { (k, v) -> v.siObj()?.let { m[k] = it } } },
            numerOse0(x["plotaSe"]).toLong(), numerOse0(x["sinkSe"]).toLong())
    } catch (e: Exception) { null }

    private fun ruaj() {
        val k = kopja ?: return
        val dok = Json.shkruaj(mapOf("v" to 1L, "docs" to LinkedHashMap(k.docs), "plotaSe" to k.plotaSe, "sinkSe" to k.sinkSe, "pronari" to pronari))
        shkruesi.execute { try { skedari.writeText(dok) } catch (e: Exception) { try { skedari.delete() } catch (e2: Exception) { } } }
    }

    private fun lista(): List<Obj> = kopja!!.docs.map { (id, d) -> d.me("id" to id) }

    fun degjo(ref: CollectionReference, plota: Query, cb: (List<Obj>, Boolean) -> Unit, cbGabim: (Exception) -> Unit): () -> Unit {
        var ndal: ListenerRegistration? = null
        var mbyllur = false
        fun ndalTani() { ndal?.remove(); ndal = null }
        fun plote() {
            ndal = plota.addSnapshotListener(MetadataChanges.INCLUDE) { s, e ->
                if (mbyllur) return@addSnapshotListener
                if (e != null) { cbGabim(e); return@addSnapshotListener }
                if (s == null) return@addSnapshotListener
                val serveri = !s.metadata.isFromCache
                if (!serveri && kopja != null) return@addSnapshotListener // memoria e Firebase-it: mbetet kopja e telefonit
                val docs = LinkedHashMap<String, Obj>()
                s.documents.forEach { d -> docs[d.id] = d.data ?: emptyMap() }
                if (serveri) { val tani = System.currentTimeMillis(); kopja = Kopja(docs, tani, tani); ruaj() }
                cb(docs.map { (id, d) -> d.me("id" to id) }, serveri)
            }
        }
        fun sipasNdryshimeve() {
            val k = kopja!!
            val nga = k.sinkSe - MARGJINA_MS
            var numri: Long? = null
            var pare: Set<String>? = null
            var krahasuar = false
            fun vazhdo() {
                if (mbyllur || pare == null || numri == null) return
                if (!krahasuar) {
                    krahasuar = true
                    if (numri!! >= 0 && numri!! != kopja!!.docs.size.toLong()) { ndalTani(); plote(); return } // u fshi diçka
                }
                cb(lista(), numri!! >= 0)
            }
            ref.count().get(AggregateSource.SERVER)
                .addOnSuccessListener { numri = it.count; vazhdo() }
                .addOnFailureListener { numri = -1; vazhdo() }
            ndal = ref.whereGreaterThan("ndryshuarSe", nga).addSnapshotListener(MetadataChanges.INCLUDE) { s, e ->
                if (mbyllur) return@addSnapshotListener
                if (e != null) { cbGabim(e); return@addSnapshotListener }
                if (s == null || s.metadata.isFromCache) return@addSnapshotListener
                val tani = HashSet<String>()
                s.documents.forEach { d -> tani.add(d.id); kopja!!.docs[d.id] = d.data ?: emptyMap() }
                pare?.forEach { id -> if (id !in tani) kopja!!.docs.remove(id) } // u fshi gjatë punës
                pare = tani
                kopja!!.sinkSe = System.currentTimeMillis()
                ruaj()
                vazhdo()
            }
        }
        val k = kopja
        if (k != null) Handler(Looper.getMainLooper()).post { if (!mbyllur && kopja != null) cb(lista(), false) } // menjëherë, edhe pa internet
        if (k != null && System.currentTimeMillis() - k.plotaSe < KOPJA_PLOTE_MS) sipasNdryshimeve() else plote()
        return { mbyllur = true; ndalTani() }
    }

    private companion object {
        const val KOPJA_PLOTE_MS = 24 * 3600 * 1000L
        const val MARGJINA_MS = 3600 * 1000L
    }
}

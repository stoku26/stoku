package site.stoku.vendas

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import site.stoku.logjika.siObj

/**
 * Regjistri i përbashkët i Stoku-t (kujtesa/{p0..p9, px}, v242): produktet (barkodi → emri, furnizuesi) dhe furnizuesit
 * e kontrolluar nga administratori. E lexon kushdo i kyçur. Hyrja: { e: emri, f: furnizuesi, x: 1 = harruar }.
 * Furnizuesit ruhen me çelësin "furnizuesi <emri>".
 */
object Regjistri {
    private const val FURN = "furnizuesi "
    @Volatile private var produktet: Map<String, Pair<String, String>> = emptyMap()
    @Volatile private var furn: List<String> = emptyList()
    private var degjuesi: ListenerRegistration? = null

    fun merr(barkodi: String): Pair<String, String>? = produktet[barkodi]
    fun furnizuesit(): List<String> = furn

    fun nis() {
        if (degjuesi != null) return
        degjuesi = FirebaseFirestore.getInstance().collection("kujtesa").addSnapshotListener { s, e ->
            if (e != null || s == null) return@addSnapshotListener
            val p = HashMap<String, Pair<String, String>>(); val f = ArrayList<String>()
            s.documents.forEach { d ->
                d.get("p").siObj()?.forEach { (k, v) ->
                    val h = v.siObj() ?: return@forEach
                    if (h["x"] == 1L || h["x"] == true) return@forEach
                    if (k.startsWith(FURN)) f.add(k.removePrefix(FURN))
                    else p[k] = ((h["e"] as? String).orEmpty()) to ((h["f"] as? String).orEmpty())
                }
            }
            produktet = p; furn = f
        }
    }

    fun ndal() { degjuesi?.remove(); degjuesi = null }
}

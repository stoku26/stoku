package site.stoku.vendas

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import site.stoku.vendas.ui.Toast

/**
 * Hyrja 81 (web v319, pajisjet.js; pronari: "Te cilesimet > llogaria e shton ni opsion me i pa pajisjet ku osht i kyqt qaj perdorues
 * edhe me pas mundesi me e shkyq llogarin prej ku don"). Firestore: perdoruesit/{uid}/pajisjet/{id} = { emri, lloji, krijuarSe, paraSe, v }.
 * Kjo pajisje e shkruan dokumentin e vet kur hyn; "Shkëput" nga një pajisje tjetër e fshin dhe kjo del vetë (si "Dil").
 */
object Pajisjet {
    data class Pajisja(val id: String, val emri: String, val lloji: String, val paraSe: Long, val kjo: Boolean)

    private val db: FirebaseFirestore get() = FirebaseFirestore.getInstance()
    private const val RIFRESKO_MS = 30 * 60 * 1000L
    private var uid: String? = null
    private var dVeten: ListenerRegistration? = null
    private var dLista: ListenerRegistration? = null
    private var ekziston = false
    private var shkruar = 0L
    private val _lista = MutableStateFlow<List<Pajisja>>(emptyList())
    val lista: StateFlow<List<Pajisja>> = _lista

    /** Id-ja e kësaj pajisjeje (ruhet një herë) */
    val id: String by lazy {
        val pr = StokuApp.prefs(StokuApp.app)
        pr.getString("pajisja_id", null)?.takeIf { Regex("^[a-z0-9]{12,40}$").matches(it) } ?: (1..20).map { "abcdefghijklmnopqrstuvwxyz0123456789".random() }
            .joinToString("").also { pr.edit().putString("pajisja_id", it).apply() }
    }

    /** Emri që e ka dhënë përdoruesi telefonit (Cilësimet → Rreth telefonit), ose prodhuesi + modeli */
    private fun emri(): String {
        val n = try { android.provider.Settings.Global.getString(StokuApp.app.contentResolver, "device_name") } catch (e: Exception) { null }
        return (n?.trim()?.ifEmpty { null } ?: (android.os.Build.MANUFACTURER.replaceFirstChar { it.uppercase() } + " " + android.os.Build.MODEL)).take(80)
    }

    private fun ref(u: String, pid: String = id) = db.collection("perdoruesit").document(u).collection("pajisjet").document(pid)

    private fun shkruaj(u: String, iRi: Boolean) {
        val t = System.currentTimeMillis()
        val d = hashMapOf<String, Any>("emri" to emri(), "lloji" to "android", "paraSe" to t, "v" to BuildConfig.VERSION_NAME)
        if (iRi) d["krijuarSe"] = t
        shkruar = t
        ref(u).set(d, SetOptions.merge()).addOnFailureListener { shkruar = 0L }
    }

    /** Thirret kur ndryshon llogaria (Llogaria.nis); kurShkeputet: kjo pajisje u shkëput nga një tjetër */
    fun nis(u: String?, kurShkeputet: () -> Unit) {
        if (u == uid) return
        ndal()
        if (u == null) return
        uid = u
        shkruaj(u, true)
        dVeten = ref(u).addSnapshotListener { s, e ->
            if (e != null || s == null || uid != u) return@addSnapshotListener
            if (s.exists()) { ekziston = true; return@addSnapshotListener }
            if (ekziston && !s.metadata.isFromCache) { ekziston = false; kurShkeputet() }
        }
        dLista = db.collection("perdoruesit").document(u).collection("pajisjet").addSnapshotListener { q, e ->
            if (e != null || q == null || uid != u) return@addSnapshotListener
            _lista.value = q.documents.map { d ->
                Pajisja(d.id, (d.getString("emri") ?: "Pajisje"), d.getString("lloji") ?: "", (d.get("paraSe") as? Number)?.toLong() ?: 0L, d.id == id)
            }.sortedWith(compareByDescending<Pajisja> { it.kjo }.thenByDescending { it.paraSe })
        }
    }

    fun ndal() {
        dVeten?.remove(); dVeten = null; dLista?.remove(); dLista = null
        uid = null; ekziston = false; _lista.value = emptyList()
    }

    /** Kur aplikacioni hapet sërish: paraSe rifreskohet (jo më shpesh se 30 min) */
    fun rifresko() { val u = uid ?: return; if (System.currentTimeMillis() - shkruar > RIFRESKO_MS) shkruaj(u, false) }

    /** Shkëput një pajisje tjetër: null = u krye, përndryshe gabimi */
    suspend fun shkeput(pid: String): String? {
        val u = uid ?: return "pa-hyrje"
        if (pid == id) return "kjo"
        return try { ref(u, pid).delete().await(); null } catch (e: Exception) { e.message ?: "gabim" }
    }

    /** "Dil": kjo pajisje hiqet nga lista (para se të dalë) */
    suspend fun fshiVeten() {
        val u = uid ?: return
        ekziston = false
        try { ref(u).delete().await() } catch (e: Exception) { }
    }

    /** Për thirrjet pa korutinë (dalja nga distanca) */
    fun dilNgaDistanca() { MainScope().launch { Llogaria.dil(); Toast.trego("U shkëpute nga llogaria nga një pajisje tjetër.", 6000) } }
}

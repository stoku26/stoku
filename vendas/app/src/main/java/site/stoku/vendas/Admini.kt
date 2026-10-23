package site.stoku.vendas

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withTimeoutOrNull
import site.stoku.logjika.Json
import site.stoku.logjika.Lejet
import site.stoku.logjika.MObj
import site.stoku.logjika.Obj
import site.stoku.logjika.siListe
import site.stoku.logjika.siObj

/*
 * Cilësimet → Përdoruesit (vetëm administratori mendurberisha), si te app-tel.js (pd*): krejt llogaritë (perdoruesit/{uid})
 * dhe lejet e secilës (lejet/{uid}). Llogaria pa dokument lejesh = "Pa u kontrolluar" (i ka krejt lejet). Çdo ndryshim
 * ruhet menjëherë dhe e shënon llogarinë si të kontrolluar. Administratori s'del në listë dhe s'mund të preket.
 */
object Admini {
    class Llogaria(val uid: String, val emri: String, val kycurSe: Long, val krijuarSe: Long, val grupi: String?, val admin: Boolean, val merchandiser: Boolean)
    class Rreshti(val a: Llogaria, val dok: Obj?, val statusi: String) {
        val lejet: Obj? get() = dok?.get("lejet").siObj()
    }

    val llogarite = MutableStateFlow<List<Llogaria>?>(null)
    val lejet = MutableStateFlow<Map<String, Obj>?>(null)
    val gabimLlogari = MutableStateFlow(false)
    val gabimLejet = MutableStateFlow(false)
    private val db: FirebaseFirestore get() = FirebaseFirestore.getInstance()
    private var dL: ListenerRegistration? = null
    private var dLe: ListenerRegistration? = null
    private val scope = MainScope()
    private var nisur = false

    fun eshteAdmin(): Boolean = Lejet.eshteAdmin(site.stoku.vendas.Llogaria.perdoruesi.value?.emri)

    /** Dëgjuesit nisen vetëm për administratorin (pas hyrjes) dhe ndalen në dalje */
    fun nis() {
        if (nisur) return
        nisur = true
        scope.launch {
            site.stoku.vendas.Llogaria.perdoruesi.collect { p ->
                if (p != null && Lejet.eshteAdmin(p.emri)) degjo() else ndal()
            }
        }
    }

    private fun degjo() {
        if (dL != null) return
        dL = db.collection("perdoruesit").addSnapshotListener { s, e ->
            if (e != null || s == null) { gabimLlogari.value = true; return@addSnapshotListener }
            gabimLlogari.value = false
            llogarite.value = s.documents.map { d ->
                val x = d.data ?: emptyMap()
                val emri = ((x["perdoruesi"] as? String)?.ifEmpty { null } ?: (x["emri"] as? String)?.ifEmpty { null } ?: d.id)
                Llogaria(d.id, emri, (x["kycurSe"] as? Number)?.toLong() ?: 0L, (x["krijuarSe"] as? Number)?.toLong() ?: 0L,
                    x["grupi"] as? String, x["emri"] == Lejet.ADMINI || x["perdoruesi"] == Lejet.ADMINI, x["merchandiser"] == true)
            }
            njoftoTeRejat()
        }
        dLe = db.collection("lejet").addSnapshotListener { s, e ->
            if (e != null || s == null) { gabimLejet.value = true; if (lejet.value == null) lejet.value = emptyMap(); return@addSnapshotListener }
            gabimLejet.value = false
            lejet.value = s.documents.associate { it.id to (it.data ?: emptyMap<String, Any?>()) }
            njoftoTeRejat()
        }
    }

    private fun ndal() {
        dL?.remove(); dLe?.remove(); dL = null; dLe = null
        llogarite.value = null; lejet.value = null
    }

    /** Krejt llogaritë përveç administratorit, me lejet dhe statusin ("ri" | "krejt" | "kufizuar") */
    fun lista(): List<Rreshti> {
        val m = lejet.value ?: emptyMap()
        return (llogarite.value ?: emptyList()).filter { !it.admin && !Lejet.eshteAdmin(it.emri) }.map { a -> val d = m[a.uid]; Rreshti(a, d, Lejet.statusi(d)) }
    }
    fun gati(): Boolean = llogarite.value != null && lejet.value != null

    /** A punon si merchandiser (zgjedhja e administratorit fiton mbi atë të regjistrimit) */
    fun merchandiser(r: Rreshti): Boolean = Lejet.zgjedhja(r.lejet, "marketet") ?: r.a.merchandiser
    /** "Lejo krejt" / "Ndalo krejt" s'e ndërrojnë "Merchandiser" */
    fun krejtPer(r: Rreshti, vlera: Boolean): MObj = Lejet.meZgjedhjet(Lejet.krejt(vlera), lejet.value?.get(r.a.uid)?.get("lejet").siObj())

    /** Ruan lejet (dhe e shënon llogarinë si të kontrolluar) → null ose "leje" / "rrjeti" */
    suspend fun ruaj(uid: String, l: Obj, emri: String): String? {
        if (!eshteAdmin()) return "leje"
        val a = llogarite.value?.firstOrNull { it.uid == uid }
        if (a == null || a.admin || Lejet.eshteAdmin(a.emri)) return "leje" // administratori s'preket kurrë
        return try {
            withTimeoutOrNull(15000) {
                db.collection("lejet").document(uid).set(mapOf(
                    "lejet" to Lejet.pastro(l), "kontrolluarSe" to System.currentTimeMillis(),
                    "kontrolluarNga" to site.stoku.vendas.Llogaria.perdoruesi.value?.emri.orEmpty().take(60), "emri" to emri.take(60)
                )).await()
            } ?: return "rrjeti"
            null
        } catch (e: Exception) {
            if (e is FirebaseFirestoreException && e.code == FirebaseFirestoreException.Code.PERMISSION_DENIED) "leje" else "rrjeti"
        }
    }

    // ---- Llogaritë e reja: të parat në këtë pajisje (si KEY_PD_PARE) ----
    val teReja = MutableStateFlow(0)
    private val njoftuar = HashSet<String>()
    private fun lexoPare(): MutableList<String>? = try {
        StokuApp.prefsOse("perdoruesit_pare", "").takeIf { it.isNotEmpty() }?.let { Json.lexo(it).siListe().filterIsInstance<String>().toMutableList() }
    } catch (e: Exception) { null }
    private fun ruajPare(l: List<String>) = StokuApp.vendosPref("perdoruesit_pare", Json.shkruaj(l.takeLast(1000)))

    private fun njoftoTeRejat() {
        if (!gati()) return
        val rinj = lista().filter { it.statusi == "ri" }
        var pare = lexoPare()
        if (pare == null) { // hera e parë në këtë pajisje: llogaritë e vjetra (pa krijuarSe) s'njoftohen si të reja
            pare = rinj.filter { it.a.krijuarSe == 0L }.map { it.a.uid }.toMutableList()
            ruajPare(pare)
        }
        val te = rinj.filter { !pare.contains(it.a.uid) }
        teReja.value = te.size
        val paNjoftuar = te.filter { njoftuar.add(it.a.uid) }
        if (paNjoftuar.isNotEmpty() && !faqjaHapur) site.stoku.vendas.ui.Toast.trego(
            (if (paNjoftuar.size == 1) "Llogari e re: " + paNjoftuar[0].a.emri + ". Kontrolloja lejet" else "${paNjoftuar.size} llogari të reja. Kontrolloji lejet") +
                " te Cilësimet → Përdoruesit.", 5000)
    }
    var faqjaHapur = false
    /** Administratori e hapi listën: llogaritë e pakontrolluara s'janë më "të reja" (mbeten te "Pa u kontrolluar") */
    fun shenoTeParet() {
        if (!gati()) return
        val pare = lexoPare() ?: mutableListOf()
        lista().forEach { if (it.statusi == "ri" && !pare.contains(it.a.uid)) pare.add(it.a.uid) }
        ruajPare(pare)
        teReja.value = 0
    }

    /** Afatet e një llogarie (vetëm për t'u parë): dyqani lexohet nga Firebase (rregullat e lejojnë për administratorin) */
    suspend fun afatetE(uid: String): Pair<List<Obj>, List<Obj>>? = try {
        withTimeoutOrNull(20000) { Sinkronizimi.merrDyqanin(uid) }?.let { g ->
            g["afatet"].siListe().mapNotNull { it.siObj() } to g["marketet"].siListe().mapNotNull { it.siObj() }
        }
    } catch (e: Exception) { null }
}

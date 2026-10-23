package site.stoku.vendas

import android.content.Context
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.FirebaseTooManyRequestsException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.MetadataChanges
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await
import site.stoku.logjika.Json
import site.stoku.logjika.Lejet
import site.stoku.logjika.MObj
import site.stoku.logjika.Obj
import site.stoku.logjika.siObj

/**
 * Llogaria (si firebase-tel.js + porta.js): hyrja me emrin e përdoruesit (emri@stoku-app.local), krijimi i llogarisë
 * (me "Punoj si merchandiser"), dalja, regjistrimi te perdoruesit/{uid}, lejet e llogarisë (lejet/{uid}) dhe flamuri
 * "merchandiser".
 */
data class Perdoruesi(val uid: String, val emri: String)

object Llogaria {
    private val auth: FirebaseAuth get() = FirebaseAuth.getInstance()
    private val db: FirebaseFirestore get() = FirebaseFirestore.getInstance()

    private val _perdoruesi = MutableStateFlow<Perdoruesi?>(null)
    val perdoruesi: StateFlow<Perdoruesi?> get() = _perdoruesi
    /** Firebase e ka thënë a je i kyçur (para kësaj porta tregon "Duke u lidhur…") */
    private val _gati = MutableStateFlow(false)
    val gati: StateFlow<Boolean> get() = _gati

    /** Lejet e kësaj llogarie: null = krejt të lejuara (pa dokument, ose administratori) */
    private val _lejet = MutableStateFlow<Obj?>(null)
    val lejet: StateFlow<Obj?> get() = _lejet
    private val _merchandiser = MutableStateFlow(false)
    val merchandiserIRegjistrimit: StateFlow<Boolean> get() = _merchandiser

    private lateinit var ctx: Context
    private var dLejet: ListenerRegistration? = null
    private var dMerch: ListenerRegistration? = null

    /** Vetëm për testet e pamjeve */
    fun vendosPerProve(p: Perdoruesi?, merchandiser: Boolean = false) { _perdoruesi.value = p; _gati.value = true; _merchandiser.value = merchandiser }

    fun emailIBrendshem(emri: String) = emri.trim().lowercase() + "@stoku-app.local"

    fun nis(c: Context) {
        ctx = c.applicationContext
        // Lejet e fundit të kësaj pajisjeje: vlejnë që në hapje, edhe pa internet
        val pr = StokuApp.prefs(ctx)
        Json.lexoOse(pr.getString("lejet", null)).siObj()?.let { x -> _lejet.value = x["lejet"].siObj() }
        _merchandiser.value = pr.getBoolean("merchandiser", false)
        auth.addAuthStateListener { a ->
            val u = a.currentUser
            val p = u?.let { Perdoruesi(it.uid, (it.email ?: "").removeSuffix("@stoku-app.local")) }
            if (p?.uid != _perdoruesi.value?.uid) {
                _perdoruesi.value = p
                ndalDegjuesit()
                if (p != null) {
                    if (pr.getString("lejet_uid", null) != p.uid) { _lejet.value = null; _merchandiser.value = false; pr.edit().remove("lejet").putBoolean("merchandiser", false).apply() }
                    pr.edit().putString("lejet_uid", p.uid).apply()
                    regjistroPerdoruesin(p)
                    degjoLejet(p)
                    degjoMerchandiserin(p)
                } else { _lejet.value = null; _merchandiser.value = false }
            }
            _gati.value = true
        }
    }

    private fun ndalDegjuesit() { dLejet?.remove(); dLejet = null; dMerch?.remove(); dMerch = null }

    /** Administratori (mendurberisha) i ka krejt lejet */
    fun eshteAdmin(): Boolean = Lejet.eshteAdmin(_perdoruesi.value?.emri)

    fun leja(k: String): Boolean {
        if (k == "marketet") return eshteMerchandiser()
        if (eshteAdmin()) return true
        return Lejet.lejohet(_lejet.value, k)
    }

    /** Fiton zgjedhja e administratorit (lejet/{uid}.marketet); pa të, "Punoj si merchandiser" i regjistrimit */
    fun eshteMerchandiser(): Boolean {
        if (_perdoruesi.value == null) return false
        if (!eshteAdmin() && !Lejet.lejohet(_lejet.value, "afatet")) return false
        val z = if (eshteAdmin()) null else Lejet.zgjedhja(_lejet.value, "marketet")
        return z ?: _merchandiser.value
    }

    private fun regjistroPerdoruesin(p: Perdoruesi) {
        if (p.emri.isEmpty()) return
        db.collection("perdoruesit").document(p.uid)
            .set(mapOf("perdoruesi" to p.emri.lowercase(), "kycurSe" to System.currentTimeMillis()), SetOptions.merge())
    }

    private fun degjoLejet(p: Perdoruesi) {
        if (Lejet.eshteAdmin(p.emri)) { _lejet.value = null; return }
        dLejet = db.collection("lejet").document(p.uid).addSnapshotListener { s, e ->
            if (e != null || s == null || _perdoruesi.value?.uid != p.uid) return@addSnapshotListener
            val l = if (s.exists()) s.get("lejet").siObj()?.let { Lejet.pastro(it) } else null
            _lejet.value = l
            StokuApp.prefs(ctx).edit().putString("lejet", if (l == null) null else Json.shkruaj(mapOf("lejet" to l))).apply()
        }
    }

    // v251: vetëm dokumenti nga serveri vendos; "po" e kësaj pajisjeje s'kthehet në "jo" nga dokumenti
    private fun degjoMerchandiserin(p: Perdoruesi) {
        val ref = db.collection("perdoruesit").document(p.uid)
        dMerch = ref.addSnapshotListener(MetadataChanges.INCLUDE) { d, e ->
            if (e != null || d == null || d.metadata.isFromCache || _perdoruesi.value?.uid != p.uid) return@addSnapshotListener
            val neDok = d.exists() && d.getBoolean("merchandiser") == true
            if (!neDok && _merchandiser.value) {
                if (d.exists()) ref.set(mapOf("merchandiser" to true), SetOptions.merge())
                return@addSnapshotListener
            }
            _merchandiser.value = neDok
            StokuApp.prefs(ctx).edit().putBoolean("merchandiser", neDok).apply()
        }
    }

    /** → null (u hy) ose teksti i gabimit */
    suspend fun hyr(emri: String, fjalekalimi: String): String? = try {
        auth.signInWithEmailAndPassword(emailIBrendshem(emri), fjalekalimi).await()
        StokuApp.prefs(ctx).edit().putString("emri_i_fundit", emri.trim().lowercase()).apply()
        null
    } catch (e: Exception) { tekstiGabimit(e) }

    suspend fun regjistrohu(emri: String, fjalekalimi: String, merchandiser: Boolean): String? = try {
        val kred = auth.createUserWithEmailAndPassword(emailIBrendshem(emri), fjalekalimi).await()
        val uid = kred.user?.uid
        if (uid != null) {
            _merchandiser.value = merchandiser
            StokuApp.prefs(ctx).edit().putBoolean("merchandiser", merchandiser).putString("lejet_uid", uid).apply()
            val fillimi = MObj(); fillimi["krijuarSe"] = System.currentTimeMillis()
            if (merchandiser) fillimi["merchandiser"] = true
            db.collection("perdoruesit").document(uid).set(fillimi, SetOptions.merge())
        }
        StokuApp.prefs(ctx).edit().putString("emri_i_fundit", emri.trim().lowercase()).apply()
        null
    } catch (e: Exception) { tekstiGabimit(e) }

    fun dil() { ndalDegjuesit(); auth.signOut() }

    fun emriIFundit(): String = StokuApp.prefs(StokuApp.app).getString("emri_i_fundit", "") ?: ""

    private fun tekstiGabimit(e: Exception): String = when (e) {
        is FirebaseAuthUserCollisionException -> "Ky emër përdoruesi është i zënë. Zgjidh një tjetër, ose hyr nëse është llogaria jote."
        is FirebaseAuthWeakPasswordException -> "Fjalëkalimi duhet të ketë të paktën 6 shenja."
        is FirebaseAuthInvalidUserException ->
            if (e.errorCode == "ERROR_USER_DISABLED") "Kjo llogari është çaktivizuar. Kontakto administratorin."
            else "Emri i përdoruesit ose fjalëkalimi është gabim."
        is FirebaseAuthInvalidCredentialsException ->
            if (e.errorCode == "ERROR_INVALID_EMAIL") "Emri i përdoruesit ka shenja të palejuara. Përdor vetëm a–z, 0–9, _ . -"
            else "Emri i përdoruesit ose fjalëkalimi është gabim."
        is FirebaseTooManyRequestsException -> "Shumë prova të gabuara. Prit pak minuta dhe provo përsëri."
        is FirebaseNetworkException -> "S'ka lidhje me internetin. Kontrollo internetin dhe provo përsëri." + detaji(e)
        is FirebaseAuthException -> "S'u hy (" + e.errorCode + "). Provo përsëri pas pak." + detaji(e)
        else -> "S'u lidh me serverin. Kontrollo internetin dhe provo përsëri." + detaji(e)
    }

    /** Arsyeja teknike (e shkurtër) poshtë mesazhit, që gabimi i rrallë të gjendet pa telefon në dorë */
    private fun detaji(e: Exception): String {
        val m = (e.message ?: "").replace(Regex("\\s+"), " ").trim().take(160)
        return "\n(" + e.javaClass.simpleName + (if (m.isNotEmpty()) ": $m" else "") + ")"
    }
}

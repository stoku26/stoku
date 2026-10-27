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
import kotlinx.coroutines.launch
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
    private var dFshirja: ListenerRegistration? = null
    private var poFshihet = false

    /** Mesazhi një-herësh për hyrjen (si "stoku:porta:mesazh" te web-i), p.sh. kur administratori e fshiu llogarinë */
    val mesazhiIHyrjes = MutableStateFlow("")

    /**
     * Prova si vizitor (si "Hyr si vizitor" te porta.js): pa llogari, me të dhëna shembull vetëm në këtë telefon (s'sinkronizohen,
     * pa Grup, AI, njoftime apo orë). Kur hyn një llogari, të dhënat e provës hiqen (si te çdo ndërrim llogarie).
     */
    private val _vizitor = MutableStateFlow(false)
    val vizitor: StateFlow<Boolean> get() = _vizitor
    fun eshteVizitor(): Boolean = _vizitor.value && _perdoruesi.value == null
    /** Prova është ende në këtë telefon ("Vazhdo provën si vizitor") */
    fun provaEkziston(): Boolean = Dyqani.g.pronari == Dyqani.VIZITOR && Dyqani.kaTeDhena()
    /** Në telefon janë të dhënat e një llogarie (p.sh. pas "Dil"): pyetet para se të hiqen për provën */
    fun kaTeDhenaTeLlogarise(): Boolean = Dyqani.g.pronari.let { it != null && it != Dyqani.VIZITOR } && Dyqani.kaTeDhena()

    fun hyrSiVizitor() {
        val mbush = !Dyqani.kaTeDhena() || Dyqani.g.pronari != Dyqani.VIZITOR
        if (mbush) Dyqani.mbushProven()
        StokuApp.prefs(ctx).edit().putBoolean("vizitor", true).apply()
        _vizitor.value = true
    }
    /** "Hyr" nga prova: hapet hyrja; prova mbetet derisa të hyjë një llogari */
    fun hapHyrjenNgaProva() {
        StokuApp.prefs(ctx).edit().putBoolean("vizitor", false).apply()
        _vizitor.value = false
    }
    /** "Fillo nga e para": të dhënat shembull rikthehen */
    fun rinisProven() { if (Dyqani.g.pronari == Dyqani.VIZITOR) Dyqani.mbushProven() }

    /** Vetëm për testet e pamjeve */
    fun vendosPerProve(p: Perdoruesi?, merchandiser: Boolean = false, vizitor: Boolean = false) {
        _perdoruesi.value = p; _gati.value = true; _merchandiser.value = merchandiser; _vizitor.value = vizitor
    }

    fun emailIBrendshem(emri: String) = emri.trim().lowercase() + "@stoku-app.local"

    fun nis(c: Context) {
        ctx = c.applicationContext
        // Lejet e fundit të kësaj pajisjeje: vlejnë që në hapje, edhe pa internet
        val pr = StokuApp.prefs(ctx)
        Json.lexoOse(pr.getString("lejet", null)).siObj()?.let { x -> _lejet.value = x["lejet"].siObj() }
        _merchandiser.value = pr.getBoolean("merchandiser", false)
        _vizitor.value = pr.getBoolean("vizitor", false)
        auth.addAuthStateListener { a ->
            val u = a.currentUser
            val p = u?.let { Perdoruesi(it.uid, (it.email ?: "").removeSuffix("@stoku-app.local")) }
            if (p?.uid != _perdoruesi.value?.uid) {
                _perdoruesi.value = p
                ndalDegjuesit()
                if (p != null) {
                    if (_vizitor.value) { _vizitor.value = false; pr.edit().putBoolean("vizitor", false).apply() } // me llogari s'ka më provë
                    if (pr.getString("lejet_uid", null) != p.uid) { _lejet.value = null; _merchandiser.value = false; pr.edit().remove("lejet").putBoolean("merchandiser", false).apply() }
                    pr.edit().putString("lejet_uid", p.uid).apply()
                    regjistroPerdoruesin(p)
                    degjoLejet(p)
                    degjoMerchandiserin(p)
                    degjoFshirjen(p)
                } else { _lejet.value = null; _merchandiser.value = false }
            }
            _gati.value = true
        }
    }

    private fun ndalDegjuesit() { dLejet?.remove(); dLejet = null; dMerch?.remove(); dMerch = null; dFshirja?.remove(); dFshirja = null }

    // Administratori e fshiu këtë llogari (ekipa_fshire/{uid}, si degjoFshirjen te ekipa.js): njoftimi ditor hiqet nga serveri,
    // llogaria e hyrjes fshihet (ose të paktën dilet), të dhënat e saj hiqen nga telefoni dhe hyrja e tregon arsyen
    private fun degjoFshirjen(p: Perdoruesi) {
        dFshirja = db.collection("ekipa_fshire").document(p.uid).addSnapshotListener { s, e ->
            if (e != null || s == null || !s.exists() || _perdoruesi.value?.uid != p.uid) return@addSnapshotListener
            llogariaUFshi()
        }
    }

    private fun llogariaUFshi() {
        if (poFshihet) return
        poFshihet = true
        kotlinx.coroutines.MainScope().launch(StokuApp.trajtuesi(false)) {
            try { kotlinx.coroutines.withTimeoutOrNull(9000) { Push.caktivizo() } } catch (e: Exception) { }
            ndalDegjuesit()
            StokuApp.prefs(ctx).edit().remove("ora_rt").apply()
            mesazhiIHyrjes.value = "Kjo llogari u fshi nga administratori."
            try { kotlinx.coroutines.withTimeoutOrNull(9000) { auth.currentUser?.delete()?.await() } } catch (e: Exception) { }
            try { if (auth.currentUser != null) auth.signOut() } catch (e: Exception) { }
            Dyqani.vendosPronarin("llogari-e-fshire") // të dhënat e llogarisë së fshirë s'mbeten në telefon
            poFshihet = false
        }
    }

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
        mesazhiIHyrjes.value = ""
        ruajEmrinEFundit(emri.trim().lowercase())
        tokeniPerOren(emailIBrendshem(emri), fjalekalimi)
        null
    } catch (e: Exception) { tekstiGabimit(e) }

    /**
     * Ora e dorës vepron në emrin e llogarisë (kërkesat te Grupi) me një "refresh token", si web-i (`rt` te /ora/lidh).
     * Firebase-i i Android-it s'e jep tokenin e vet, prandaj merret një i veçantë me API-në e Firebase Auth në hyrje
     * (dhe pas ndryshimit të fjalëkalimit). Ruhet vetëm në këtë telefon; hiqet në dalje.
     */
    private fun tokeniPerOren(email: String, fjalekalimi: String) {
        kotlinx.coroutines.MainScope().launch(kotlinx.coroutines.Dispatchers.IO + StokuApp.trajtuesi(false)) {
            try {
                val c = java.net.URL("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + StokuApp.CELESI_PUBLIK).openConnection() as java.net.HttpURLConnection
                c.requestMethod = "POST"; c.doOutput = true; c.connectTimeout = 15000; c.readTimeout = 15000
                c.setRequestProperty("Content-Type", "application/json")
                c.outputStream.use { it.write(Json.shkruaj(mapOf("email" to email, "password" to fjalekalimi, "returnSecureToken" to true)).toByteArray()) }
                if (c.responseCode !in 200..299) return@launch
                val j = Json.lexo(c.inputStream.use { it.readBytes().toString(Charsets.UTF_8) }).siObj()
                (j?.get("refreshToken") as? String)?.let { StokuApp.prefs(ctx).edit().putString("ora_rt", it).apply() }
            } catch (e: Exception) { }
        }
    }

    suspend fun regjistrohu(emri: String, fjalekalimi: String, merchandiser: Boolean): String? = try {
        val kred = auth.createUserWithEmailAndPassword(emailIBrendshem(emri), fjalekalimi).await()
        mesazhiIHyrjes.value = ""
        val uid = kred.user?.uid
        if (uid != null) {
            _merchandiser.value = merchandiser
            StokuApp.prefs(ctx).edit().putBoolean("merchandiser", merchandiser).putString("lejet_uid", uid).apply()
            val fillimi = MObj(); fillimi["krijuarSe"] = System.currentTimeMillis()
            if (merchandiser) fillimi["merchandiser"] = true
            db.collection("perdoruesit").document(uid).set(fillimi, SetOptions.merge())
        }
        ruajEmrinEFundit(emri.trim().lowercase())
        null
    } catch (e: Exception) { tekstiGabimit(e) }

    fun dil() { ndalDegjuesit(); StokuApp.prefs(ctx).edit().remove("ora_rt").apply(); auth.signOut() }

    // ---------------- Ndryshimi i emrit dhe i fjalëkalimit (si firebase-tel.js) ----------------
    /**
     * Emri i ri i përdoruesit (emri@stoku-app.local). Firebase-i i Android-it s'e ka më `updateEmail`, prandaj bëhet me
     * API-në e Firebase Auth (si `updateEmail` i web-it). → null (u ndryshua) ose arsyeja: "emri", "zene", "rihyrje",
     * "konfigurim" (Email enumeration protection), "rrjeti".
     */
    suspend fun ndryshoEmrin(emriRi0: String): String? {
        val emriRi = emriRi0.trim().lowercase()
        if (!Regex("^[a-z0-9_.-]{3,40}$").matches(emriRi)) return "emri"
        val u = auth.currentUser ?: return "pa-hyrje"
        return try {
            val token = u.getIdToken(true).await().token ?: return "rrjeti"
            val gabim = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                val c = java.net.URL("https://identitytoolkit.googleapis.com/v1/accounts:update?key=" + StokuApp.CELESI_PUBLIK).openConnection() as java.net.HttpURLConnection
                c.requestMethod = "POST"; c.doOutput = true; c.connectTimeout = 15000; c.readTimeout = 20000
                c.setRequestProperty("Content-Type", "application/json")
                c.outputStream.use { it.write(Json.shkruaj(mapOf("idToken" to token, "email" to emailIBrendshem(emriRi), "returnSecureToken" to false)).toByteArray()) }
                if (c.responseCode in 200..299) null
                else (c.errorStream?.bufferedReader()?.readText() ?: "").let { t ->
                    when {
                        t.contains("EMAIL_EXISTS") -> "zene"
                        t.contains("CREDENTIAL_TOO_OLD") || t.contains("TOKEN_EXPIRED") -> "rihyrje"
                        t.contains("OPERATION_NOT_ALLOWED") -> "konfigurim"
                        t.contains("INVALID_EMAIL") -> "emri"
                        else -> "rrjeti"
                    }
                }
            }
            if (gabim != null) return gabim
            try { u.reload().await() } catch (e: Exception) { }
            _perdoruesi.value = Perdoruesi(u.uid, emriRi)
            regjistroPerdoruesin(Perdoruesi(u.uid, emriRi)) // lista e kolegëve e merr emrin e ri menjëherë
            ruajEmrinEFundit(emriRi)
            null
        } catch (e: Exception) { "rrjeti" }
    }

    /** → null, "rihyrje" (duhet fjalëkalimi aktual), "i-dobet" ose "rrjeti" */
    suspend fun ndryshoFjalekalimin(fjalekalimiRi: String): String? {
        val u = auth.currentUser ?: return "pa-hyrje"
        return try { u.updatePassword(fjalekalimiRi).await(); u.email?.let { tokeniPerOren(it, fjalekalimiRi) }; null } catch (e: Exception) {
            when (e) {
                is com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException -> "rihyrje"
                is FirebaseAuthWeakPasswordException -> "i-dobet"
                else -> "rrjeti"
            }
        }
    }

    /** Konfirmimi me fjalëkalimin aktual (Firebase e kërkon për ndryshimet e llogarisë pas një kohe) → true kur u pranua */
    suspend fun riautentifikohu(fjalekalimiAktual: String): Boolean {
        val u = auth.currentUser ?: return false
        val email = u.email ?: return false
        return try { u.reauthenticate(com.google.firebase.auth.EmailAuthProvider.getCredential(email, fjalekalimiAktual)).await(); true } catch (e: Exception) { false }
    }

    fun emriIFundit(): String = StokuApp.prefs(StokuApp.app).getString("emri_i_fundit", "") ?: ""
    /** "Më mbaj mend emrin e përdoruesit" (si porta.js): parazgjedhja po; fjalëkalimi s'ruhet kurrë */
    fun mbajEmrin(): Boolean = StokuApp.prefsOseB("mbaj_emrin", true)
    fun vendosMbajEmrin(po: Boolean) {
        val e = StokuApp.prefs(StokuApp.app).edit().putBoolean("mbaj_emrin", po)
        if (!po) e.remove("emri_i_fundit") // hiqet menjëherë emri i ruajtur
        e.apply()
    }
    private fun ruajEmrinEFundit(emri: String) { if (mbajEmrin() && emri.isNotEmpty()) StokuApp.vendosPref("emri_i_fundit", emri) }

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
